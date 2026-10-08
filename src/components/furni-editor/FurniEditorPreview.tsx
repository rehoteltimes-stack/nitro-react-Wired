import { IRoomObjectSpriteVisualization, LegacyDataType, NitroPoint, RoomId, RoomObjectCategory, RoomObjectUserType, RoomPreviewer, TextureUtils, Vector3d } from '@nitrots/nitro-renderer';
import { FC, MouseEvent, useEffect, useRef, useState } from 'react';
import { GetRoomEngine, GetSessionDataManager } from '../../api';
import { IFurniEditorReference } from '../../api/furni-editor/FurniEditorProtocol';
import { LayoutRoomPreviewerView } from '../../common';
import { SuggestFlags } from './FurniEditorMeasure';

// Preview for the Furni Editor with measuring aids on top of the shared LayoutRoomPreviewerView
// (click = cycle state, Shift+click = rotate, unchanged), all projected through the preview room's own geometry:
// - the footprint on the floor (W / L from the form, following the furni's current rotation: at rotation 0/4 the width
//   runs along x and the length along y, at 2/6 they swap, exactly like core's RoomLayout.getTilesAt);
// - the top surface at the stack height;
// - a height ruler with a mark per multiheight state (the furni's current state highlighted); dragging it sets the
//   stack height;
// - a test avatar (the viewer's own figure) on the furni at the stack height, walking / sitting / lying.

const TILE_X = RoomPreviewer.PREVIEW_OBJECT_LOCATION_X;
const TILE_Y = RoomPreviewer.PREVIEW_OBJECT_LOCATION_Y;
const AVATAR_ID = 2;
const MAX_Z = 4;

// Fixed framing: the previewer normally re-centres on the furni and zooms out to 0.5 when it gets big
// (RoomPreviewer.validatePreviewSize). Here it stays at scale 1 with the furni's tile at a fixed spot, so every furni is
// shown at the same size and the rulers never jump.
const FRAME_X = 0.42;   // tile centre at 42% of the width (room for the ruler on the right)
const FRAME_Y = 0.72;   // and at 72% of the height (room for tall furni above)

export const ZOOM_LEVELS = [ 0.5, 0.625, 0.75, 0.875, 1, 1.25, 1.5, 1.75, 2 ];

const holdFrame = (previewer: RoomPreviewer, roomId: number, zoom: number, pan: Point) =>
{
    const engine = GetRoomEngine();
    const canvas = engine.getRoomInstanceRenderingCanvas(roomId, RoomPreviewer.PREVIEW_CANVAS_ID);
    const geometry = engine.getRoomInstanceGeometry(roomId, RoomPreviewer.PREVIEW_CANVAS_ID);

    if(!canvas || !geometry) return;

    previewer.disableUpdate = true;

    if(engine.getRoomInstanceRenderingCanvasScale(roomId, RoomPreviewer.PREVIEW_CANVAS_ID) !== zoom) engine.setRoomInstanceRenderingCanvasScale(roomId, RoomPreviewer.PREVIEW_CANVAS_ID, zoom, null, null);

    const p = geometry.getScreenPoint(new Vector3d(TILE_X, TILE_Y, 0));

    if(!p) return;

    const x = Math.round(canvas.width * FRAME_X - canvas.width / 2 - p.x * zoom + pan.x);
    const y = Math.round(canvas.height * FRAME_Y - canvas.height / 2 - p.y * zoom + pan.y);

    if((canvas.screenOffsetX !== x) || (canvas.screenOffsetY !== y)) engine.setRoomInstanceRenderingCanvasOffset(roomId, RoomPreviewer.PREVIEW_CANVAS_ID, new NitroPoint(x, y));
}

export type TestPose = 'none' | 'std' | 'sit' | 'lay' | 'stack';

// the stack test puts a real furni on top at the test height. Default: the Freeze ice block (es_box), light blue and
// filling the whole tile, so every edge shows whether it sits exactly on the surface, floats or sinks in.
const STACK_TEST_ID = 3;

// sprite 6660229 = tile_stackmagic (1x1 Stack Magic Tile): one is placed on EVERY tile of the furni's footprint, so the
// test surface always has the furni's own size (1x1, 2x1, 2x2, 3x2...) and follows its rotation
export const STACK_TILE_SPRITE = 6660229;
export const STACK_TEST_ITEMS = [ { sprite: STACK_TILE_SPRITE, name: 'Stack tiles (furni size)' }, { sprite: 3758, name: 'Ice block' }, { sprite: 5209, name: 'Crate' }, { sprite: 187, name: 'Gift' } ];
const MAX_TEST_TILES = 64;

interface Props
{
    previewer: RoomPreviewer;
    previewerId: number;
    height: number;
    stackHeight: number;
    width: number;
    length: number;
    multiheight: string;
    wall?: boolean;        // a wall item: no footprint / ruler (their W/L mean nothing)
    itemName: string;
    pose: TestPose;
    stackItem?: number;    // sprite id of the stack test furni (STACK_TEST_ITEMS)
    avatarHeight: number;  // where the test avatar stands / sits / lies
    onHeight: (height: number) => void;
    onScan: (scan: { surface: number, max: number, seat: number, bed: number }) => void;
}

interface Point { x: number, y: number }

interface Projection
{
    floor: Point[];        // footprint corners at z = 0 (back, right, front, left)
    top: Point[];          // the same corners at the stack height
    rulerBase: Point;      // floor point the ruler stands on (the footprint's right-most corner)
    unit: number;          // pixels per 1.0 of height
    rotation: number;
    state: number;
    bounds: { x: number, y: number, width: number, height: number };   // the furni's own on-screen bounds
    scanned: number;       // height scan: the top surface most of the furni's width is at (see scanSurface)
    scannedMax: number;    // the furni's overall highest point, for reference
    scannedSeat: number;   // seat top for sit furni (see scanSurface)
    scannedBed: number;    // mattress top for lay furni
}

let scanCache: { key: string, surface: number, max: number, seat: number, bed: number } = null;

/** Every candidate of the last surface / seat scan (for checking the scan against known heights). */
// eslint-disable-next-line import/no-mutable-exports
export let LastScanDetail: Record<string, unknown> = null;

// Height scan on the furni's own pixels (the renderer draws only this object's sprites, no floor, no avatar).
// For every pixel column across the footprint: the first solid pixel from the top, measured against the footprint's
// back floor edge in that column, is how high the furni's top is there. A flat top gives the same height in every
// column; a back rest, lamp post or statue only covers a few columns. So the height most columns share (0.05 steps,
// ties -> the lower one) is the surface things stack on / the avatar stands on.
const scanSurface = (visualization: IRoomObjectSpriteVisualization, bounds: { x: number, y: number, width: number, height: number }, scale: number, floor: Point[], unit: number) =>
{
    const texture = visualization.getImage(0, -1);

    if(!texture) return null;

    try
    {
        const pixels = TextureUtils.getPixels(texture);
        const w = texture.width, h = texture.height;

        if(!pixels || (pixels.length < w * h * 4)) return null;

        const [ back, right, , left ] = floor;
        const backEdgeY = (x: number) =>
        {
            if(x <= back.x) return left.y + (back.y - left.y) * ((x - left.x) / Math.max(1, back.x - left.x));

            return back.y + (right.y - back.y) * ((x - back.x) / Math.max(1, right.x - back.x));
        }

        const margin = (right.x - left.x) * 0.1;
        const counts = new Map<number, number>();
        let max = 0;

        for(let i = 0; i < w; i++)
        {
            const x = bounds.x + i * scale;

            if((x < left.x + margin) || (x > right.x - margin)) continue;

            let top = -1;

            for(let j = 0; j < h; j++) if(pixels[(j * w + i) * 4 + 3] > 64) { top = j; break; }

            if(top < 0) continue;

            const value = Math.max(0, Math.round(((backEdgeY(x) - (bounds.y + top * scale) - 1) / unit) * 20) / 20);

            counts.set(value, (counts.get(value) || 0) + 1);
            max = Math.max(max, value);
        }

        if(!counts.size) return null;

        const surface = [ ...counts.entries() ].sort((a, b) => (b[1] - a[1]) || (a[0] - b[0]))[0][0];

        // Seat / mattress height for sit and lay furni: a backrest or headboard runs along one back edge, so it covers
        // part of the columns and the seat or mattress shows in the rest. The column heights are grouped (values within
        // 0.15 of each other) and the LOWEST group covering at least 15% of the columns wins - never the highest
        // point. Groups at 0.2 or below (shadow, feet, a flat base) do not count as a seat.
        const total = [ ...counts.values() ].reduce((a, b) => a + b, 0);
        const groups: { low: number, high: number, columns: number, weighted: number }[] = [];

        for(const [ value, columns ] of [ ...counts.entries() ].sort((a, b) => a[0] - b[0]))
        {
            const last = groups[groups.length - 1];

            if(last && (value - last.high) <= 0.15) { last.high = value; last.columns += columns; last.weighted += value * columns; }
            else groups.push({ low: value, high: value, columns, weighted: value * columns });
        }

        const seatGroup = groups.find(g => (g.columns >= total * 0.15) && (g.weighted / g.columns > 0.2));
        // the group's most common value, so a slightly sloped seat gives its main height
        const seat = seatGroup
            ? [ ...counts.entries() ].filter(([ v ]) => (v >= seatGroup.low) && (v <= seatGroup.high)).sort((a, b) => (b[1] - a[1]) || (a[0] - b[0]))[0][0]
            : surface;

        // Seat edge (preferred for sit / lay): at the column where the avatar sits - the centre of the furni's first
        // tile, straight below the footprint's back corner on screen - walk each pixel column UP from the floor. Every
        // sharp brightness edge is a candidate seat FRONT edge, kept only when the face just above it is lighter than
        // the face below (Habbo art lights top faces: the seat top is a lit face above a darker front). A candidate at
        // screen y is at height (front edge of the footprint in that column - y) / unit. The lowest one above 0.15
        // is the seat: a backrest or armrests sit above or beside it, so they can no longer hide it (armchairs, thrones).
        const [ , , front ] = floor;
        const frontEdgeY = (x: number) =>
        {
            if(x <= front.x) return left.y + (front.y - left.y) * ((x - left.x) / Math.max(1, front.x - left.x));

            return front.y + (right.y - front.y) * ((x - front.x) / Math.max(1, right.x - front.x));
        }

        const lum = (i: number, j: number) => { const k = (j * w + i) * 4; return (pixels[k] * 299 + pixels[k + 1] * 587 + pixels[k + 2] * 114) / 1000; };
        const solid = (i: number, j: number) => pixels[(j * w + i) * 4 + 3] > 128;
        const band = unit * 0.2;   // columns within 20% of a tile of the sitting spot
        const edgeHeights: number[] = [];

        for(let i = 0; i < w; i++)
        {
            const x = bounds.x + i * scale;

            if(Math.abs(x - back.x) > band) continue;

            let bottom = -1;

            for(let j = h - 1; j >= 0; j--) if(solid(i, j)) { bottom = j; break; }

            if(bottom < 0) continue;

            const run = Math.max(2, Math.round(3 / scale));   // compare 3 screen px above / below

            for(let j = bottom - 1; j > run; j--)
            {
                if(!solid(i, j) || !solid(i, j + 1)) continue;
                if(Math.abs(lum(i, j) - lum(i, j + 1)) < 35) continue;

                let above = 0, below = 0, na = 0, nb = 0;

                for(let d = 1; d <= run; d++)
                {
                    if(solid(i, j - d)) { above += lum(i, j - d); na++; }
                    if((j + d < h) && solid(i, j + d)) { below += lum(i, j + d); nb++; }
                }

                if(!na || !nb || (above / na) < (below / nb) + 15) continue;

                const y = bounds.y + (j + 0.5) * scale;
                const value = (frontEdgeY(x) - y) / unit;

                if(value >= 0.15) { edgeHeights.push(value); break; }
            }
        }

        const seatEdge = edgeHeights.length ? Math.round(edgeHeights.sort((a, b) => a - b)[Math.floor(edgeHeights.length / 2)] * 20) / 20 : null;

        // Height sweep (preferred): try every height from 0.1 upwards in 0.05 steps. At each height the footprint's two
        // FRONT edges are where a stack tile of the furni's size would lie on screen; along those lines check, pixel by
        // pixel, whether the furni has an edge there - solid above (a top face) and darker or empty below (a front face
        // or nothing). The seat / mattress front edge runs along the whole width, so it scores highest; a backrest or
        // headboard runs along the BACK edges and armrests only cover part of it, so they score lower. The lowest height
        // within 85% of the best score wins (a flat top can also show a weaker echo higher up).
        const sampleColumns: number[] = [];

        for(let i = 0; i < w; i++)
        {
            const x = bounds.x + i * scale;

            if((x >= left.x + margin) && (x <= right.x - margin)) sampleColumns.push(i);
        }

        const edgeAt = (i: number, j: number) =>
        {
            if((j < 2) || (j >= h - 2) || !solid(i, j - 1)) return false;
            if(!solid(i, j + 1)) return true;   // a slab: solid above, nothing below

            const above = (lum(i, j - 1) + lum(i, j - 2)) / 2;
            const below = (lum(i, j + 1) + (solid(i, j + 2) ? lum(i, j + 2) : lum(i, j + 1))) / 2;

            return above > below + 12;          // lit top face above a darker front face
        }

        const sweep: { z: number, score: number }[] = [];

        if(sampleColumns.length >= 4)
        {
            for(let z = 0.1; z <= Math.min(4, max + 0.25); z += 0.05)
            {
                let hits = 0;

                for(const i of sampleColumns)
                {
                    const x = bounds.x + i * scale;
                    const j = Math.round((frontEdgeY(x) - z * unit - bounds.y) / scale);

                    if(edgeAt(i, j) || edgeAt(i, j - 1) || edgeAt(i, j + 1)) hits++;
                }

                sweep.push({ z: Math.round(z * 20) / 20, score: hits / sampleColumns.length });
            }
        }

        const best = sweep.reduce((a, b) => (b.score > a ? b.score : a), 0);

        // The scores form bands: e.g. chair_norja 0.45-0.65 (seat front edge, peak 0.55); bed_silo_one 0.4-0.55 (frame)
        // and 0.8-1.0 (mattress, peak 0.9). Bands = runs of heights scoring >= 60% of the best; the HIGHEST band is the
        // seat / mattress (a frame or base sits below it; a backrest runs along the back and scores low), and its peak
        // is the height.
        const bands: { z: number, score: number }[][] = [];

        for(const t of sweep)
        {
            if(t.score < best * 0.6) continue;

            const last = bands[bands.length - 1];

            if(last && (Math.abs(last[last.length - 1].z - t.z + 0.05) < 0.001)) last.push(t);
            else bands.push([ t ]);
        }

        const top = bands.length ? bands[bands.length - 1] : null;
        const swept = (best >= 0.3 && top) ? top.reduce((a, b) => (b.score > a.score ? b : a)).z : null;

        // Chosen from a benchmark (2026-09-28): 183 sit / lay furni whose height three other hotels agree on (not the
        // generic 1.0), scanned here. The HIGHEST band often is an armrest or backrest edge; the STRONGEST band above 0.2
        // (the edge that runs along most of the width) is the seat far more often, and when the column-group seat is
        // lower still, that one wins. Seat = min(group seat, strongest band) (+0.70 for the sit height: within 0.2 of
        // the agreed height for 65%, the old rule 51%). Mattress = the column-group value (+0.80: 77%, old 29%).
        const realBands = bands.filter(b => b.some(x => x.z > 0.2));
        const strongestBand = (best >= 0.3 && realBands.length) ? realBands.reduce((a, b) => (Math.max(...b.map(x => x.score)) > Math.max(...a.map(x => x.score)) ? b : a)) : null;
        const strongest = strongestBand ? strongestBand.reduce((a, b) => (b.score > a.score ? b : a)).z : null;
        const sitSeat = (strongest !== null) ? Math.min(seat, strongest) : seat;

        // ---- pose features (2026-09-28): what the furni's picture looks like, in tile units, for the walk / sit / lay /
        // none check (PoseFromFeatures). Measured across the footprint from its left to its right corner in 16 slices.
        const SLICES = 16;
        const inFloor = (px: number, py: number) =>
        {
            // inside the footprint diamond (back, right, front, left) on screen
            const pts = [ back, right, front, left ];
            let sign = 0;

            for(let k = 0; k < 4; k++)
            {
                const a = pts[k], b = pts[(k + 1) % 4];
                const cross = (b.x - a.x) * (py - a.y) - (b.y - a.y) * (px - a.x);

                if(cross === 0) continue;
                if(sign === 0) sign = Math.sign(cross);
                else if(Math.sign(cross) !== sign) return false;
            }

            return true;
        }
        const sliceTop = new Array(SLICES).fill(0), sliceFill = new Array(SLICES).fill(0), sliceCount = new Array(SLICES).fill(0);
        let floorInside = 0, floorSolid = 0, legsInside = 0, legsSolid = 0;

        for(let i = 0; i < w; i++)
        {
            const x = bounds.x + i * scale;

            if((x < left.x) || (x > right.x)) continue;

            const slice = Math.min(SLICES - 1, Math.floor(((x - left.x) / Math.max(1, right.x - left.x)) * SLICES));
            const floorY = frontEdgeY(x);   // the front floor edge in this column (screen y, larger = lower)
            let top = -1, solidRun = 0;

            for(let j = 0; j < h; j++)
            {
                const y = bounds.y + j * scale;
                const isSolid = pixels[(j * w + i) * 4 + 3] > 64;

                if(isSolid && (top < 0)) top = j;
                if((top >= 0) && (y <= floorY) && isSolid) solidRun++;

                // the floor diamond: how much of it the furni covers
                if(inFloor(x, y)) { floorInside++; if(isSolid) floorSolid++; }

                // just above the floor (0 - 0.35 of a tile's height) inside the footprint's screen band: legs vs. solid
                if((y <= floorY) && (y >= floorY - unit * 0.35) && (y >= backEdgeY(x))) { legsInside++; if(isSolid) legsSolid++; }
            }

            if(top < 0) { sliceCount[slice]++; continue; }

            const topY = bounds.y + top * scale;
            const height = Math.max(0, (backEdgeY(x) - topY - 1) / unit);
            const span = Math.max(1, (floorY - topY) / scale);

            sliceTop[slice] += Math.min(height, 8);
            sliceFill[slice] += Math.min(1, solidRun / span);
            sliceCount[slice]++;
        }

        const r2 = (v: number) => Math.round(v * 100) / 100;
        const heights = sliceTop.map((v, k) => (sliceCount[k] ? v / sliceCount[k] : 0));
        const fills = sliceFill.map((v, k) => (sliceCount[k] ? v / sliceCount[k] : 0));
        const columnValues = [ ...counts.entries() ].flatMap(([ value, n ]) => new Array(n).fill(value));
        const share = (test: (v: number) => boolean) => (columnValues.length ? columnValues.filter(test).length / columnValues.length : 0);

        const features = {
            top: heights.map(r2),                                   // 16 slices: height of the top (tiles)
            fill: fills.map(r2),                                    // 16 slices: how solid from floor to top (0-1)
            floorCover: r2(floorInside ? floorSolid / floorInside : 0),   // share of the floor diamond covered
            legsGap: r2(legsInside ? 1 - legsSolid / legsInside : 1),     // share of the zone just above the floor that is empty
            flatTop: r2(share(v => Math.abs(v - surface) <= 0.15)),  // share of the width at the main surface height
            low: r2(share(v => v < 0.25)),                          // share of the width almost flat on the floor
            backRest: r2(Math.max(0, max - seat)),                  // highest point above the seat / mattress
            surface, max, seat, sitSeat,
            footprintW: r2((right.x - left.x) / unit), imageH: r2((h * scale) / unit)
        };

        LastScanDetail = { surface, max, groupSeat: seat, sitSeat, strongest, seatEdge, swept, sweepBest: Math.round(best * 100), sweep, groups, unit, scale, features };
        (window as unknown as { __furniEditorScan: unknown }).__furniEditorScan = LastScanDetail;

        return { surface, max, seat: sitSeat, bed: seat, seatEdge, swept, sweepBest: Math.round(best * 100), features };
    }
    finally
    {
        texture.destroy(true);
    }
}

const project = (roomId: number, width: number, length: number, stackHeight: number, itemName: string): Projection =>
{
    const engine = GetRoomEngine();
    const geometry = engine.getRoomInstanceGeometry(roomId, RoomPreviewer.PREVIEW_CANVAS_ID);
    const canvas = engine.getRoomInstanceRenderingCanvas(roomId, RoomPreviewer.PREVIEW_CANVAS_ID);

    if(!geometry || !canvas) return null;

    const s = canvas.scale;
    const toScreen = (x: number, y: number, z: number): Point =>
    {
        const p = geometry.getScreenPoint(new Vector3d(x, y, z));

        return p ? { x: Math.round(p.x * s + canvas.width / 2 + canvas.screenOffsetX), y: Math.round(p.y * s + canvas.height / 2 + canvas.screenOffsetY) } : null;
    }

    const object = engine.getRoomObject(roomId, RoomPreviewer.PREVIEW_OBJECT_ID, RoomObjectCategory.FLOOR);
    const rotation = object ? (Math.round(object.getDirection().x / 45) % 8) : 2;
    const state = object ? object.getState(0) : 0;
    const spanX = ((rotation % 4) === 2) ? length : width;
    const spanY = ((rotation % 4) === 2) ? width : length;
    const x0 = TILE_X - 0.5, y0 = TILE_Y - 0.5;
    const x1 = x0 + Math.max(1, spanX), y1 = y0 + Math.max(1, spanY);
    const corners = (z: number) => [ toScreen(x0, y0, z), toScreen(x1, y0, z), toScreen(x1, y1, z), toScreen(x0, y1, z) ];
    const floor = corners(0);
    const top = corners(stackHeight);
    const z1 = toScreen(x0, y0, 1);

    if(floor.includes(null) || top.includes(null) || !z1) return null;

    const rulerBase = floor.reduce((a, b) => (b.x > a.x ? b : a));
    const unit = Math.max(0, floor[0].y - z1.y);

    // Height scan. A flat-topped furni's highest on-screen point is its back corner at the stack height, so
    // (back floor corner - top of the furni's own bounds) / pixels per unit = its height. For furni with a back rest,
    // a lamp shade etc. this is the overall height, higher than where things stack: a suggestion, never applied alone.
    const rect = engine.getRoomObjectBoundingRectangle(roomId, RoomPreviewer.PREVIEW_OBJECT_ID, RoomObjectCategory.FLOOR, RoomPreviewer.PREVIEW_CANVAS_ID);
    const bounds = (rect && rect.width > 0) ? { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) } : null;
    let scanned: number = null, scannedMax: number = null, scannedSeat: number = null, scannedBed: number = null;

    // right after switching furni the previous one is still in the preview: never report its scan for the new one
    const isOpenedFurni = object && (object.type === (itemName || '').split('*')[0]);

    if(bounds && unit && isOpenedFurni)
    {
        const key = `${ object.type }|${ state }|${ rotation }|${ bounds.x },${ bounds.y },${ bounds.width },${ bounds.height }|${ floor.map(p => p.x + ',' + p.y).join(';') }`;

        if(!scanCache || scanCache.key !== key)
        {
            const result = scanSurface(object.visualization as IRoomObjectSpriteVisualization, bounds, canvas.scale, floor, unit);

            scanCache = result ? { key, surface: result.surface, max: result.max, seat: result.seat, bed: result.bed } : null;
        }

        if(scanCache) { scanned = scanCache.surface; scannedMax = scanCache.max; scannedSeat = scanCache.seat; scannedBed = scanCache.bed; }
    }

    return { floor, top, rulerBase, unit, rotation, state, bounds, scanned, scannedMax, scannedSeat, scannedBed };
}

// Size scan, from where the furni touches the floor. In every state (a few frames each, animations move) the furni's
// own pixels are read (only its sprites, no floor / avatar) and in each pixel column the lowest solid pixel is taken as
// a floor contact (legs, bases, shadows). Converted from screen back to tile units - one tile along x is +32px right /
// +16px down, along y 32px left / 16px down (at 100%) - the furthest contact along x and along y gives how many tiles
// the furni covers. Overhanging art (a window's top) and art smaller than its tiles (a table with legs in the corners)
// no longer fool it. Width/length follow the rotation like core's RoomLayout.getTilesAt (rotation 2/6: x = length).
export const ScanFurniSize = async (roomId: number, states: number, itemName: string): Promise<{ width: number, length: number }> =>
{
    const engine = GetRoomEngine();
    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    const object = engine.getRoomObject(roomId, RoomPreviewer.PREVIEW_OBJECT_ID, RoomObjectCategory.FLOOR);

    if(!object || (object.type !== (itemName || '').split('*')[0])) return null;

    const geometry = engine.getRoomInstanceGeometry(roomId, RoomPreviewer.PREVIEW_CANVAS_ID);
    const canvas = engine.getRoomInstanceRenderingCanvas(roomId, RoomPreviewer.PREVIEW_CANVAS_ID);

    if(!geometry || !canvas) return null;

    const toCanvas = (x: number, y: number) =>
    {
        const p = geometry.getScreenPoint(new Vector3d(x, y, 0));

        return { x: p.x * canvas.scale + canvas.width / 2 + canvas.screenOffsetX, y: p.y * canvas.scale + canvas.height / 2 + canvas.screenOffsetY };
    }

    const back = toCanvas(TILE_X - 0.5, TILE_Y - 0.5);
    const alongX = toCanvas(TILE_X + 0.5, TILE_Y - 0.5);
    const dx = alongX.x - back.x, dy = alongX.y - back.y;   // screen step for one tile along x (along y: -dx, +dy)

    if(!dx || !dy) return null;

    const location = object.getLocation(), direction = object.getDirection();
    const original = object.getState(0);
    let maxX = 0, maxY = 0, seen = false;

    for(let state = 0; state < Math.max(1, Math.min(states || 1, 20)); state++)
    {
        engine.updateRoomObjectFloor(roomId, RoomPreviewer.PREVIEW_OBJECT_ID, location, direction, state, new LegacyDataType());

        for(let frame = 0; frame < 3; frame++)
        {
            await wait(150);

            const current = engine.getRoomObject(roomId, RoomPreviewer.PREVIEW_OBJECT_ID, RoomObjectCategory.FLOOR);
            const rect = engine.getRoomObjectBoundingRectangle(roomId, RoomPreviewer.PREVIEW_OBJECT_ID, RoomObjectCategory.FLOOR, RoomPreviewer.PREVIEW_CANVAS_ID);
            const texture = current && (current.visualization as IRoomObjectSpriteVisualization).getImage(0, -1);

            if(!texture || !rect || !rect.width) continue;

            try
            {
                const pixels = TextureUtils.getPixels(texture);
                const w = texture.width, h = texture.height;
                const scale = rect.width / w;

                for(let i = 0; i < w; i++)
                {
                    let bottom = -1;

                    for(let j = h - 1; j >= 0; j--) if(pixels[(j * w + i) * 4 + 3] > 64) { bottom = j; break; }

                    if(bottom < 0) continue;

                    // screen offset from the back corner -> tile units: sx = (X - Y) * dx, sy = (X + Y) * dy
                    const sx = (rect.x + (i + 0.5) * scale) - back.x;
                    const sy = (rect.y + (bottom + 0.5) * scale) - back.y;
                    const a = sx / dx, b = sy / dy;

                    maxX = Math.max(maxX, (a + b) / 2);
                    maxY = Math.max(maxY, (b - a) / 2);
                    seen = true;
                }
            }
            finally
            {
                texture.destroy(true);
            }
        }
    }

    engine.updateRoomObjectFloor(roomId, RoomPreviewer.PREVIEW_OBJECT_ID, location, direction, original, new LegacyDataType());

    if(!seen) return null;

    // a contact point a quarter tile into the next tile is still edge / shadow blur, not another tile
    const spanX = Math.max(1, Math.ceil(maxX - 0.25));
    const spanY = Math.max(1, Math.ceil(maxY - 0.25));
    const rotation = Math.round(direction.x / 45) % 8;

    (window as any).__furniEditorSizeScan = { itemName, maxX, maxY, spanX, spanY, rotation };

    return ((rotation % 4) === 2) ? { width: spanY, length: spanX } : { width: spanX, length: spanY };
}

// Multiheight scan: the surface height (see scanSurface) in every state. A furni whose states have different heights
// (a door wall that lowers, a platform, a lift) is a multiheight furni: the result is the per-state list for the
// multiheight field. Two frames per state, the lower surface wins (an animation frame can reach higher).
export const ScanStateHeights = async (roomId: number, states: number, itemName: string, width: number, length: number): Promise<number[]> =>
{
    const engine = GetRoomEngine();
    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    const object = engine.getRoomObject(roomId, RoomPreviewer.PREVIEW_OBJECT_ID, RoomObjectCategory.FLOOR);

    if(!object || (object.type !== (itemName || '').split('*')[0]) || (states < 2)) return null;

    const location = object.getLocation(), direction = object.getDirection();
    const original = object.getState(0);
    const heights: number[] = [];

    for(let state = 0; state < Math.min(states, 20); state++)
    {
        engine.updateRoomObjectFloor(roomId, RoomPreviewer.PREVIEW_OBJECT_ID, location, direction, state, new LegacyDataType());

        let height: number = null;

        for(let frame = 0; frame < 2; frame++)
        {
            await wait(200);

            const view = project(roomId, width || 1, length || 1, 0, itemName);

            if(view && (view.scanned !== null)) height = (height === null) ? view.scanned : Math.min(height, view.scanned);
        }

        heights.push((height === null) ? 0 : height);
    }

    engine.updateRoomObjectFloor(roomId, RoomPreviewer.PREVIEW_OBJECT_ID, location, direction, original, new LegacyDataType());

    return heights;
}

/** True when the per-state heights look like a real multiheight furni (2026-09-28, checked against the 169 furni all
 *  three reference hotels agree are multiheight: platforms, podiums, stages, eleblocks). Their states climb step by step
 *  (0;0.5;1;1.5;2), so: at least 3 different levels, every step up at least 0.25, never down except one final drop back
 *  to the start. Pairs (0;1), alternating (1;0;1;0) or wobbly scans (1;1.05;0.95) are lamps, gates or noise. */
export const IsMultiheight = (heights: number[]) =>
{
    if(!heights || (heights.length < 3)) return false;

    const levels = new Set(heights.map(h => Math.round(h * 20) / 20));

    if(levels.size < 3) return false;

    let last = heights.length - 1;

    if(heights[last] < heights[last - 1]) last--;   // one final drop back down is allowed

    for(let i = 1; i <= last; i++) if((heights[i] - heights[i - 1]) < 0.25) return false;

    return true;
}

// Seat fit: finds the stack height at which the test avatar really sits (or lies) on the seat, by trying it.
// 1. The seat / mattress top comes from the pixel scan (lowest real surface, never the backrest / headboard); its screen
//    height at the furni tile's centre is where the avatar's hips must end up.
// 2. The avatar is placed sitting / lying at a first guess, facing the furni's direction.
// 3. The avatar's own pixels are read: for sitting, the hips are the lowest body pixels on the side away from its
//    legs (legs point where it faces); for lying, the middle of its body. That is compared with the seat top.
// 4. The height is corrected by the difference (32px = 1.0 at 100%) and the avatar re-placed, until the hips sit on the
//    seat within 2px (at most 6 steps). onStep reports every try, so the adjusting is visible.
export const FitSeatHeight = async (roomId: number, pose: 'sit' | 'lay', seatTop: number, start: number, onStep: (height: number, gapPx: number, debug?: unknown) => void, cancelled: () => boolean = () => false): Promise<number> =>
{
    const engine = GetRoomEngine();
    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    const geometry = engine.getRoomInstanceGeometry(roomId, RoomPreviewer.PREVIEW_CANVAS_ID);
    const canvas = engine.getRoomInstanceRenderingCanvas(roomId, RoomPreviewer.PREVIEW_CANVAS_ID);
    const furni = engine.getRoomObject(roomId, RoomPreviewer.PREVIEW_OBJECT_ID, RoomObjectCategory.FLOOR);

    if(!geometry || !canvas || !furni) { onStep(start, NaN, { reason: 'no preview / furni' }); return null; }

    const toCanvasY = (z: number) => geometry.getScreenPoint(new Vector3d(TILE_X, TILE_Y, z)).y * canvas.scale + canvas.height / 2 + canvas.screenOffsetY;
    const unit = toCanvasY(0) - toCanvasY(1);
    const target = toCanvasY(seatTop);
    const facing = furni.getDirection().x;
    const legsRight = (Math.round(facing / 45) % 8) < 4;   // directions 0-3 face screen-right, 4-7 screen-left
    let height = start;

    if(!unit) { onStep(start, NaN, { reason: 'no unit' }); return null; }

    for(let step = 0; step < 6; step++)
    {
        if(cancelled()) return null;

        engine.removeRoomObjectUser(roomId, AVATAR_ID);

        const figure = GetSessionDataManager().figure;

        engine.addRoomObjectUser(roomId, AVATAR_ID, new Vector3d(TILE_X, TILE_Y, height), new Vector3d(facing, 0, 0), facing, RoomObjectUserType.getTypeNumber(RoomObjectUserType.USER), figure);
        engine.updateRoomObjectUserFigure(roomId, AVATAR_ID, figure, GetSessionDataManager().gender);
        engine.updateRoomObjectUserPosture(roomId, AVATAR_ID, pose, String(height));

        // the figure may still be loading: wait until the avatar is drawn (up to 3s)
        let rect = null;

        for(let tries = 0; tries < 15; tries++)
        {
            await wait(200);

            rect = engine.getRoomObjectBoundingRectangle(roomId, AVATAR_ID, RoomObjectCategory.UNIT, RoomPreviewer.PREVIEW_CANVAS_ID);

            if(rect && (rect.width > 20) && (tries >= 2)) break;
        }

        if(cancelled()) return null;

        const avatar = engine.getRoomObject(roomId, AVATAR_ID, RoomObjectCategory.UNIT);
        const texture = avatar && (avatar.visualization as IRoomObjectSpriteVisualization).getImage(0, -1);

        if(!texture || !rect || !rect.width) { onStep(height, NaN, { reason: 'avatar not drawn', rect: !!rect, texture: !!texture, avatar: !!avatar }); return null; }

        let hips: number = null;

        try
        {
            const pixels = TextureUtils.getPixels(texture);
            const w = texture.width, h = texture.height;
            const scale = rect.height / h;
            const bottoms: number[] = [];

            // sit: the 35% of the body away from the legs; lay: the middle 60%
            const from = (pose === 'sit') ? (legsRight ? 0 : Math.floor(w * 0.65)) : Math.floor(w * 0.2);
            const to = (pose === 'sit') ? (legsRight ? Math.ceil(w * 0.35) : w) : Math.ceil(w * 0.8);

            for(let i = from; i < to; i++)
            {
                for(let j = h - 1; j >= 0; j--) if(pixels[(j * w + i) * 4 + 3] > 128) { bottoms.push(rect.y + (j + 1) * scale); break; }
            }

            if(bottoms.length) hips = bottoms.sort((a, b) => a - b)[Math.floor(bottoms.length / 2)];
        }
        finally
        {
            texture.destroy(true);
        }

        if(hips === null) { onStep(height, NaN, { reason: 'no body pixels' }); return null; }

        const gap = hips - target;   // > 0: hips below the seat top -> raise

        onStep(height, Math.round(gap), { rect: { x: rect.x, y: rect.y, w: rect.width, h: rect.height }, tex: [ texture.width, texture.height ], hips, target, legsRight });

        if(Math.abs(gap) <= 2) return height;

        height = Math.max(0, Math.round((height + gap / unit) * 20) / 20);
    }

    return height;
}

const polygon = (points: Point[]) => points.map(p => `${ p.x },${ p.y }`).join(' ');

export const FurniEditorPreview: FC<Props> = props =>
{
    const { previewer, previewerId, height, stackHeight, width, length, multiheight, wall = false, itemName, pose, stackItem = STACK_TEST_ITEMS[0].sprite, avatarHeight, onHeight, onScan } = props;
    const [ view, setView ] = useState<Projection>(null);
    const [ zoom, setZoom ] = useState(1);
    const [ pan, setPan ] = useState<Point>({ x: 0, y: 0 });
    const panDrag = useRef<{ x: number, y: number, pan: Point, moved: boolean }>(null);
    const zoomBy = (delta: number) => setZoom(current => ZOOM_LEVELS[Math.max(0, Math.min(ZOOM_LEVELS.length - 1, ZOOM_LEVELS.indexOf(current) + delta))]);
    const [ dragging, setDragging ] = useState(false);
    const wrapRef = useRef<HTMLDivElement>(null);
    const roomId = RoomId.makeRoomPreviewerId(previewerId);
    const z = Number(stackHeight) || 0;

    // the preview re-centres when the furni changes size / state / rotation, so keep the projection fresh
    useEffect(() =>
    {
        const tick = () => setView(prev =>
        {
            holdFrame(previewer, roomId, zoom, pan);

            const next = project(roomId, Number(width) || 1, Number(length) || 1, z, itemName);

            if(!next) return prev;
            if(prev && JSON.stringify(prev) === JSON.stringify(next)) return prev;

            return next;
        });

        tick();

        const interval = setInterval(tick, 150);

        return () => clearInterval(interval);
    }, [ previewer, roomId, width, length, z, itemName, zoom, pan ]);

    // a new furni starts centred again
    useEffect(() => setPan({ x: 0, y: 0 }), [ itemName ]);

    // drag anywhere on the preview to pan it; a click without moving still reaches the preview (state / rotate)
    useEffect(() =>
    {
        const move = (event: globalThis.MouseEvent) =>
        {
            const drag = panDrag.current;

            if(!drag) return;

            const dx = event.clientX - drag.x, dy = event.clientY - drag.y;

            if(!drag.moved && (Math.abs(dx) + Math.abs(dy) < 4)) return;

            drag.moved = true;
            setPan({ x: drag.pan.x + dx, y: drag.pan.y + dy });
        }
        const up = () => { setTimeout(() => (panDrag.current = null), 0); };

        window.addEventListener('mousemove', move);
        window.addEventListener('mouseup', up);

        return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
    }, []);

    useEffect(() => () => { previewer.disableUpdate = false; }, [ previewer ]);

    // test avatar on the furni at avatarHeight; "walk" uses the real walking posture
    const avatarZ = Number(avatarHeight) || 0;

    useEffect(() =>
    {
        const engine = GetRoomEngine();

        const removeTestFurni = () => { for(let k = 0; k < MAX_TEST_TILES; k++) engine.removeRoomObjectFloor(roomId, STACK_TEST_ID + k); };

        engine.removeRoomObjectUser(roomId, AVATAR_ID);
        removeTestFurni();

        if(pose === 'none') return;

        if(pose === 'stack')
        {
            if(stackItem === STACK_TILE_SPRITE)
            {
                // one stack tile per footprint tile; rotation 2/6 swaps width and length (core RoomLayout.getTilesAt)
                const furni = engine.getRoomObject(roomId, RoomPreviewer.PREVIEW_OBJECT_ID, RoomObjectCategory.FLOOR);
                const rotation = furni ? (Math.round(furni.getDirection().x / 45) % 8) : 2;
                const spanX = Math.max(1, ((rotation % 4) === 2) ? Number(length) : Number(width)) || 1;
                const spanY = Math.max(1, ((rotation % 4) === 2) ? Number(width) : Number(length)) || 1;
                let k = 0;

                for(let dx = 0; dx < spanX; dx++) for(let dy = 0; dy < spanY; dy++)
                {
                    if(k >= MAX_TEST_TILES) break;

                    engine.addFurnitureFloor(roomId, STACK_TEST_ID + k++, STACK_TILE_SPRITE, new Vector3d(TILE_X + dx, TILE_Y + dy, avatarZ), new Vector3d(0), 0, new LegacyDataType());
                }
            }
            else engine.addFurnitureFloor(roomId, STACK_TEST_ID, stackItem, new Vector3d(TILE_X, TILE_Y, avatarZ), new Vector3d(90), 0, new LegacyDataType());

            return removeTestFurni;
        }

        const figure = GetSessionDataManager().figure;
        const furni = engine.getRoomObject(roomId, RoomPreviewer.PREVIEW_OBJECT_ID, RoomObjectCategory.FLOOR);
        const facing = furni ? furni.getDirection().x : 90;

        if(!engine.addRoomObjectUser(roomId, AVATAR_ID, new Vector3d(TILE_X, TILE_Y, avatarZ), new Vector3d(facing, 0, 0), facing, RoomObjectUserType.getTypeNumber(RoomObjectUserType.USER), figure)) return;

        engine.updateRoomObjectUserFigure(roomId, AVATAR_ID, figure, GetSessionDataManager().gender);
        engine.updateRoomObjectUserPosture(roomId, AVATAR_ID, (pose === 'std') ? 'mv' : pose, (pose === 'std') ? '' : String(avatarZ));

        return () => engine.removeRoomObjectUser(roomId, AVATAR_ID);
    }, [ roomId, pose, avatarZ, stackItem, width, length ]);

    useEffect(() => onScan((view && (view.scanned !== null)) ? { surface: view.scanned, max: view.scannedMax, seat: view.scannedSeat, bed: view.scannedBed } : null), [ view?.scanned, view?.scannedMax, view?.scannedSeat, view?.scannedBed ]);

    const rulerX = view ? view.rulerBase.x + 14 : 0;
    const zToY = (value: number) => view.rulerBase.y - value * view.unit;

    const heightFromMouse = (event: MouseEvent) =>
    {
        if(!view || !view.unit || !wrapRef.current) return;

        const rect = wrapRef.current.getBoundingClientRect();
        const value = Math.max(0, Math.min(MAX_Z, (view.rulerBase.y - (event.clientY - rect.top)) / view.unit));

        onHeight(Math.round(value * 20) / 20);
    }

    const ticks: number[] = [];

    for(let t = 0; t <= MAX_Z + 0.001; t += 0.5) ticks.push(Math.round(t * 10) / 10);

    const states = (multiheight || '').split(';').map(v => v.trim()).filter(v => v.length && !isNaN(Number(v))).map(Number);
    const rotated = view && ((view.rotation % 4) === 2);
    const xLabel = rotated ? `L ${ length }` : `W ${ width }`;   // edge along x
    const yLabel = rotated ? `W ${ width }` : `L ${ length }`;   // edge along y

    return (
        <div className="furni-editor-preview" ref={ wrapRef }
            onMouseDown={ e => { if(e.button === 0) panDrag.current = { x: e.clientX, y: e.clientY, pan, moved: false }; } }
            onClickCapture={ e => { if(panDrag.current?.moved) e.stopPropagation(); } }
            onWheel={ e => zoomBy(e.deltaY < 0 ? 1 : -1) }>
            <LayoutRoomPreviewerView roomPreviewer={ previewer } height={ height } />
            <div className="furni-editor-zoom">
                <button type="button" title="Zoom out" disabled={ zoom <= ZOOM_LEVELS[0] } onMouseDown={ e => e.stopPropagation() } onClick={ e => { e.stopPropagation(); zoomBy(-1); } }>-</button>
                <button type="button" title="Reset view" onMouseDown={ e => e.stopPropagation() } onClick={ e => { e.stopPropagation(); setZoom(1); setPan({ x: 0, y: 0 }); } }>{ Math.round(zoom * 100) }%</button>
                <button type="button" title="Zoom in" disabled={ zoom >= ZOOM_LEVELS[ZOOM_LEVELS.length - 1] } onMouseDown={ e => e.stopPropagation() } onClick={ e => { e.stopPropagation(); zoomBy(1); } }>+</button>
            </div>
            { !wall && view && (view.unit > 0) &&
                <svg className="furni-editor-ruler" width="100%" height={ height }>
                    <polygon points={ polygon(view.floor) } className="ruler-footprint" />
                    <text x={ (view.floor[1].x + view.floor[2].x) / 2 + 4 } y={ (view.floor[1].y + view.floor[2].y) / 2 + 12 } className="ruler-size-label">{ yLabel }</text>
                    <text x={ (view.floor[2].x + view.floor[3].x) / 2 - 30 } y={ (view.floor[2].y + view.floor[3].y) / 2 + 12 } className="ruler-size-label">{ xLabel }</text>
                    { (z > 0) && <polygon points={ polygon(view.top) } className="ruler-top" /> }
                    <line x1={ rulerX } y1={ view.rulerBase.y } x2={ rulerX } y2={ zToY(MAX_Z) } className="ruler-axis" />
                    { ticks.map(t =>
                        <g key={ t }>
                            <line x1={ rulerX - (Number.isInteger(t) ? 6 : 3) } y1={ zToY(t) } x2={ rulerX } y2={ zToY(t) } className="ruler-axis" />
                            { Number.isInteger(t) && <text x={ rulerX - 14 } y={ zToY(t) + 3 } className="ruler-label">{ t }</text> }
                        </g>) }
                    { states.map((value, index) =>
                        <g key={ index } className={ (index === view.state) ? 'ruler-state active' : 'ruler-state' }>
                            <line x1={ rulerX } y1={ zToY(value) } x2={ rulerX + 8 } y2={ zToY(value) } />
                            <text x={ rulerX + 10 } y={ zToY(value) + 3 }>{ index }: { value }</text>
                        </g>) }
                    <line x1={ view.rulerBase.x } y1={ zToY(z) } x2={ rulerX } y2={ zToY(z) } className="ruler-height" />
                    <text x={ rulerX + 3 } y={ zToY(z) - 3 } className="ruler-height-label">{ z.toFixed(2) }</text>
                    <rect x={ rulerX - 10 } y={ 0 } width={ 24 } height={ height } className="ruler-grip"
                        onMouseDown={ e => { e.stopPropagation(); setDragging(true); heightFromMouse(e); } }
                        onMouseMove={ e => dragging && heightFromMouse(e) }
                        onMouseUp={ () => setDragging(false) }
                        onMouseLeave={ () => setDragging(false) } />
                </svg> }
        </div>
    );
}

export interface IPoseDecision
{
    pose: TestPose;        // 'std' = walk, 'none' = nothing (no sit / lay / walk)
    found: boolean;        // true when at least two sources agree and none of the others outvote them
    why: string;
    height: string;        // stack height the agreeing references use ('' if they disagree)
}

const POSE_LABEL: Record<TestPose, string> = { std: 'walk', sit: 'sit', lay: 'lay', stack: 'stack', none: 'nothing' };

export const PoseLabel = (pose: TestPose) => POSE_LABEL[pose];

// Decides sit / lay / walk / nothing from evidence: each reference hotel copy of this classname votes with its own
// flags, the name gives one more vote. "Found" needs two agreeing votes and a clear lead; otherwise the admin decides.
export const DecidePose = (references: IFurniEditorReference[], itemName: string, publicName: string, hotelNames: { name: string, hotels: number }[] = [], picture: { pose: TestPose, confidence: number } = null): IPoseDecision =>
{
    const votes = new Map<TestPose, string[]>();
    const vote = (pose: TestPose, source: string) => votes.set(pose, [ ...(votes.get(pose) || []), source ]);

    // the furni's own picture (FurniPoseModel, trained on furni four hotels agree on): one vote, only when it is sure
    if(picture && (picture.confidence >= 0.8)) vote(picture.pose, `picture ${ Math.round(picture.confidence * 100) }%`);

    for(const ref of (references || [])) vote(ref.lay ? 'lay' : ref.sit ? 'sit' : ref.walk ? 'std' : 'none', ref.source);

    const hint = SuggestFlags(itemName, publicName);

    if(hint.lay) vote('lay', 'name');
    else if(hint.sit) vote('sit', 'name');
    else if(hint.walk) vote('std', 'name');

    // every other hotel's name for this classname, in any language, weighted by how many hotels use it: one more vote
    // when at least 60% of the hotels whose name says anything agree ("Cama doble", "Lit 2 places", "Doppelbett" -> lay)
    if(hotelNames && hotelNames.length)
    {
        const weight = new Map<TestPose, number>();
        let total = 0;

        for(const entry of hotelNames)
        {
            const flags = SuggestFlags('', entry.name);
            const pose: TestPose = flags.lay ? 'lay' : flags.sit ? 'sit' : flags.walk ? 'std' : null;

            if(!pose) continue;

            weight.set(pose, (weight.get(pose) || 0) + entry.hotels);
            total += entry.hotels;
        }

        const best = [ ...weight.entries() ].sort((a, b) => b[1] - a[1])[0];

        if(best && (best[1] >= total * 0.6)) vote(best[0], `${ best[1] } hotels`);
    }

    const ranked = [ ...votes.entries() ].sort((a, b) => b[1].length - a[1].length);

    if(!ranked.length) return { pose: 'none', found: false, why: 'no reference data, name gives no hint', height: '' };

    const [ pose, sources ] = ranked[0];
    const noReferences = !(references && references.length);
    const nameOnly = sources.every(source => (source === 'name') || source.endsWith(' hotels') || source.startsWith('picture '));
    // two agreeing votes with a clear lead, or the names alone when no reference hotel database has this furni
    const found = ((sources.length >= 2) && (!ranked[1] || (ranked[1][1].length < sources.length))) || (noReferences && nameOnly && (ranked.length === 1));
    const heights = (references || []).filter(r => sources.includes(r.source)).map(r => Number(r.stackHeight));
    const height = (heights.length && heights.every(h => h === heights[0])) ? String(heights[0]) : '';
    const why = ranked.map(([ p, s ]) => `${ POSE_LABEL[p] }: ${ s.join(', ') }`).join(' / ');

    return { pose, found, why, height };
}
