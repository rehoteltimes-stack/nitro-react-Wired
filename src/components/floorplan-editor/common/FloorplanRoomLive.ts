import { IRoomCreator, IRoomObject, LegacyWallGeometry, ObjectRoomMapUpdateMessage, RoomEngine, RoomObjectCategory, RoomPlaneParser, Vector3d } from '@nitrots/nitro-renderer';
import { Graphics } from '@pixi/graphics';
import { GetNitroInstance, GetRoomEngine } from '../../../api';
import { MAX_NUM_TILE_PER_AXIS, heightOfCharacter } from './Constants';
import { FloorplanEditor } from './FloorplanEditor';

// The in-room side of sodaho.tel's floor editor (read from their minified client 2026-09-29):
//  - ApplyTilemapToRoom = their `aQ`: every edit is shown in the real room at once (same steps as the renderer's own
//    RoomMessageHandler.onRoomModelEvent: RoomPlaneParser -> LegacyWallGeometry -> ObjectRoomMapUpdateMessage), and the
//    received map is put back when the editor closes without saving.
//  - ShowRoomGrid / ShowAreaPreview / HideAreaPreview / HideRoomGrid = their `gae` / `cf` / `Of` / `PL`: a 64x64 tile
//    grid and the drag-area box drawn on the room canvas, following pan and zoom.
//  - FloorplanRoomPainter = their renderer fork's `floorTileEditManager`, done from the client: window capture listeners
//    on the room canvas turn mouse positions into tiles through the room's own geometry (floor tiles at their height,
//    empty space at height 0), so painting straight on the room needs no renderer patch.

const planeParser = new RoomPlaneParser();

const tileHeight = (rows: string[], width: number, height: number, x: number, y: number): number =>
{
    if((x < 0) || (y < 0) || (x >= width) || (y >= height)) return RoomPlaneParser.TILE_BLOCKED;

    const value = heightOfCharacter(rows[y][x]);

    return (value < 0) ? RoomPlaneParser.TILE_BLOCKED : value;
}

export const ApplyTilemapToRoom = (map: string, doorX: number, doorY: number, wallHeight: number): boolean =>
{
    if(!map || !map.length) return false;

    const engine = GetRoomEngine();
    const roomId = engine.activeRoomId;
    const roomObject = engine.getRoomObject(roomId, RoomEngine.ROOM_OBJECT_ID, RoomObjectCategory.ROOM);

    if(!roomObject) return false;

    const rows = map.split('\r').filter(row => (row.length > 0));
    const height = rows.length;

    if(!height) return false;

    let width = 0;

    for(const row of rows) if(row.length > width) width = row.length;

    if(!width) return false;

    planeParser.reset();
    planeParser.initializeTileMap(width, height);

    let entryX = -1;
    let entryY = -1;
    let entryZ = 0;
    let entryDirection = 0;

    for(let y = 0; y < height; y++)
    {
        for(let x = 0; x < width; x++)
        {
            const value = tileHeight(rows, width, height, x, y);

            if((((y > 0) && (y < (height - 1))) || ((x > 0) && (x < (width - 1)))) && (value !== RoomPlaneParser.TILE_BLOCKED) && (x === doorX) && (y === doorY))
            {
                if((tileHeight(rows, width, height, x, y - 1) === RoomPlaneParser.TILE_BLOCKED) && (tileHeight(rows, width, height, x - 1, y) === RoomPlaneParser.TILE_BLOCKED) && (tileHeight(rows, width, height, x, y + 1) === RoomPlaneParser.TILE_BLOCKED))
                {
                    entryX = (x + 0.5);
                    entryY = y;
                    entryZ = value;
                    entryDirection = 90;
                }

                if((tileHeight(rows, width, height, x, y - 1) === RoomPlaneParser.TILE_BLOCKED) && (tileHeight(rows, width, height, x - 1, y) === RoomPlaneParser.TILE_BLOCKED) && (tileHeight(rows, width, height, x + 1, y) === RoomPlaneParser.TILE_BLOCKED))
                {
                    entryX = x;
                    entryY = (y + 0.5);
                    entryZ = value;
                    entryDirection = 180;
                }
            }

            planeParser.setTileHeight(x, y, value);
        }
    }

    if(entryX >= 0)
    {
        planeParser.setTileHeight(Math.floor(entryX), Math.floor(entryY), entryZ);
        planeParser.initializeFromTileData(wallHeight);
        planeParser.setTileHeight(Math.floor(entryX), Math.floor(entryY), (entryZ + planeParser.wallHeight));
    }
    else
    {
        planeParser.initializeFromTileData(wallHeight);
    }

    const wallGeometry = (engine as unknown as IRoomCreator).getLegacyWallGeometry(roomId);

    if(wallGeometry)
    {
        wallGeometry.scale = LegacyWallGeometry.DEFAULT_SCALE;
        wallGeometry.initialize(width, height, planeParser.floorHeight);

        for(let y = (height - 1); y >= 0; y--)
        {
            for(let x = (width - 1); x >= 0; x--) wallGeometry.setHeight(x, y, planeParser.getTileHeight(x, y));
        }
    }

    const mapData = planeParser.getMapData();

    if(entryX >= 0) mapData.doors.push({ x: entryX, y: entryY, z: entryZ, dir: entryDirection });

    roomObject.processUpdateMessage(new ObjectRoomMapUpdateMessage(mapData));

    return true;
}

// ---- grid + area overlay on the room canvas ----

let overlay: Graphics = null;
let areaGraphics: Graphics = null;
let overlayFrame = 0;

const getRoomCanvas = () =>
{
    const engine = GetRoomEngine();

    return engine.getRoomInstanceRenderingCanvas(engine.activeRoomId, 1);
}

const toScreen = (x: number, y: number) =>
{
    const engine = GetRoomEngine();
    const geometry = engine.getRoomInstanceGeometry(engine.activeRoomId, 1);

    return geometry ? geometry.getScreenPoint(new Vector3d(x, y, 0)) : null;
}

const followCanvas = () =>
{
    overlayFrame = 0;

    if(!overlay) return;

    const canvas = getRoomCanvas();

    if(canvas && !overlay.destroyed)
    {
        const master = canvas.master as any;

        if(overlay.parent !== master) master.addChild(overlay);

        overlay.position.set(canvas.screenOffsetX + (canvas.width / 2), canvas.screenOffsetY + (canvas.height / 2));
        overlay.scale.set(canvas.scale);
    }

    overlayFrame = requestAnimationFrame(followCanvas);
}

export const ShowRoomGrid = () =>
{
    HideRoomGrid();

    const canvas = getRoomCanvas();

    if(!canvas) return;

    const grid = new Graphics();
    const size = MAX_NUM_TILE_PER_AXIS;

    grid.lineStyle(1, 0xFFFFFF, 0.18);

    for(let i = 0; i <= size; i++)
    {
        const start = toScreen(i - 0.5, -0.5);
        const end = toScreen(i - 0.5, size - 0.5);

        if(!start || !end) continue;

        grid.moveTo(start.x, start.y);
        grid.lineTo(end.x, end.y);
    }

    for(let i = 0; i <= size; i++)
    {
        const start = toScreen(-0.5, i - 0.5);
        const end = toScreen(size - 0.5, i - 0.5);

        if(!start || !end) continue;

        grid.moveTo(start.x, start.y);
        grid.lineTo(end.x, end.y);
    }

    grid.interactive = false;
    grid.interactiveChildren = false;
    areaGraphics = new Graphics();
    grid.addChild(areaGraphics);
    overlay = grid;
    (canvas.master as any).addChild(overlay);
    (window as any).__floorplanGrid = grid;   // debug: lets a test check it sits on the current room canvas

    followCanvas();
}

export const ShowAreaPreview = (startX: number, startY: number, endX: number, endY: number, color: number = 0xFFFFFF) =>
{
    if(!areaGraphics || areaGraphics.destroyed) return;

    areaGraphics.clear();

    const a = toScreen(startX - 0.5, startY - 0.5);
    const b = toScreen(endX + 0.5, startY - 0.5);
    const c = toScreen(endX + 0.5, endY + 0.5);
    const d = toScreen(startX - 0.5, endY + 0.5);

    if(!a || !b || !c || !d) return;

    areaGraphics.lineStyle(1, color, 0.7);
    areaGraphics.beginFill(color, 0.25);
    areaGraphics.drawPolygon([ a.x, a.y, b.x, b.y, c.x, c.y, d.x, d.y ]);
    areaGraphics.endFill();
}

export const HideAreaPreview = () =>
{
    if(!areaGraphics || areaGraphics.destroyed) return;

    areaGraphics.clear();
}

export const HideRoomGrid = () =>
{
    if(overlayFrame)
    {
        cancelAnimationFrame(overlayFrame);
        overlayFrame = 0;
    }

    if(overlay)
    {
        if(!overlay.destroyed)
        {
            if(overlay.parent) overlay.parent.removeChild(overlay);

            overlay.destroy({ children: true });
        }

        overlay = null;
        areaGraphics = null;
    }
}

// ---- painting straight on the room ----

type TileCallback = (x: number, y: number, isFirst: boolean) => void;
type AreaCallback = (startX: number, startY: number, endX: number, endY: number) => void;

export class FloorplanRoomPainter
{
    private static _active = false;
    private static _panMode = false;
    private static _squareSelectMode = false;
    private static _voidPaintEnabled = true;
    private static _isPainting = false;
    private static _lastX = -1;
    private static _lastY = -1;
    private static _areaStart: { x: number, y: number } = null;
    private static _areaEnd: { x: number, y: number } = null;
    private static _callback: TileCallback = null;
    private static _lookThroughTimer: ReturnType<typeof setInterval> = null;

    public static onAreaPreview: AreaCallback = null;
    public static onAreaCommit: AreaCallback = null;

    private static get canvasElement(): HTMLCanvasElement
    {
        return GetNitroInstance().application.renderer.view as HTMLCanvasElement;
    }

    private static getFurniture(): IRoomObject[]
    {
        const engine = GetRoomEngine();

        return [ ...engine.getRoomObjects(engine.activeRoomId, RoomObjectCategory.FLOOR), ...engine.getRoomObjects(engine.activeRoomId, RoomObjectCategory.WALL) ];
    }

    private static setLookThrough(value: boolean): void
    {
        for(const roomObject of FloorplanRoomPainter.getFurniture())
        {
            const visualization = roomObject.visualization as any;

            if(visualization && ('lookThrough' in visualization) && (visualization.lookThrough !== value)) visualization.lookThrough = value;
        }
    }

    public static activate(callback: TileCallback): boolean
    {
        if(FloorplanRoomPainter._active) return false;

        FloorplanRoomPainter._callback = callback;
        FloorplanRoomPainter._active = true;
        FloorplanRoomPainter._panMode = false;
        FloorplanRoomPainter._squareSelectMode = false;
        FloorplanRoomPainter._voidPaintEnabled = true;
        GetRoomEngine().moveBlocked = true;
        FloorplanRoomPainter.setLookThrough(true);

        // furni added while editing (someone places one) turn see-through too
        FloorplanRoomPainter._lookThroughTimer = setInterval(() => FloorplanRoomPainter.setLookThrough(true), 1000);

        for(const type of [ 'mousedown', 'mousemove', 'mouseup', 'click', 'dblclick' ]) window.addEventListener(type, FloorplanRoomPainter.onMouse, true);

        return true;
    }

    public static deactivate(): void
    {
        if(!FloorplanRoomPainter._active) return;

        for(const type of [ 'mousedown', 'mousemove', 'mouseup', 'click', 'dblclick' ]) window.removeEventListener(type, FloorplanRoomPainter.onMouse, true);

        if(FloorplanRoomPainter._lookThroughTimer) clearInterval(FloorplanRoomPainter._lookThroughTimer);

        FloorplanRoomPainter._lookThroughTimer = null;
        FloorplanRoomPainter._callback = null;
        FloorplanRoomPainter.onAreaPreview = null;
        FloorplanRoomPainter.onAreaCommit = null;
        FloorplanRoomPainter.setLookThrough(false);
        GetRoomEngine().moveBlocked = false;
        FloorplanRoomPainter._active = false;
        FloorplanRoomPainter._panMode = false;
        FloorplanRoomPainter._squareSelectMode = false;
        FloorplanRoomPainter.endStroke();
    }

    private static onMouse = (event: MouseEvent): void =>
    {
        const onCanvas = (event.target === FloorplanRoomPainter.canvasElement);

        if(event.type === 'mouseup')
        {
            if(FloorplanRoomPainter._isPainting)
            {
                FloorplanRoomPainter.finishStroke();

                if(onCanvas) event.stopPropagation();
            }

            return;
        }

        if(!onCanvas) return;

        // furni / avatars never get clicked while editing the floor (their renderer ignores non-room objects too); this
        // also keeps the avatar from walking in pan mode, where moveBlocked is off so the room can be dragged
        if((event.type === 'click') || (event.type === 'dblclick'))
        {
            event.stopPropagation();

            return;
        }

        if(FloorplanRoomPainter._panMode) return;

        if((event.type === 'mousedown') && (event.button !== 0)) return;
        if((event.type === 'mousemove') && !FloorplanRoomPainter._isPainting) return;

        const tile = FloorplanRoomPainter.tileAt(event.clientX, event.clientY);

        if(event.type === 'mousedown')
        {
            if(!tile) return;

            event.stopPropagation();
            FloorplanRoomPainter.startStroke(tile.x, tile.y);

            return;
        }

        event.stopPropagation();

        if(!(event.buttons & 1))
        {
            FloorplanRoomPainter.finishStroke();

            return;
        }

        if(tile) FloorplanRoomPainter.continueStroke(tile.x, tile.y);
    }

    // screen position -> tile. Existing floor tiles are tested at their own height (top diamond), front-most first;
    // empty space (only when setting tiles or dragging an area) is read at height 0 like their handleCanvasMouseEvent.
    private static tileAt(clientX: number, clientY: number): { x: number, y: number }
    {
        const engine = GetRoomEngine();
        const roomId = engine.activeRoomId;
        const canvas = engine.getRoomInstanceRenderingCanvas(roomId, 1);
        const geometry = engine.getRoomInstanceGeometry(roomId, 1);

        if(!canvas || !geometry || !canvas.scale) return null;

        const px = ((clientX - canvas.screenOffsetX) / canvas.scale) - ((canvas.width / canvas.scale) / 2);
        const py = ((clientY - canvas.screenOffsetY) / canvas.scale) - ((canvas.height / canvas.scale) / 2);
        const tilemap = FloorplanEditor.instance.tilemap;
        let best: { x: number, y: number, order: number } = null;

        for(let y = 0; y < tilemap.length; y++)
        {
            const row = tilemap[y];

            if(!row) continue;

            for(let x = 0; x < row.length; x++)
            {
                const z = heightOfCharacter(row[x] && row[x].height);

                if(z < 0) continue;

                const order = (((x + y) * 100) + z);

                if(best && (best.order > order)) continue;

                const a = geometry.getScreenPoint(new Vector3d(x - 0.5, y - 0.5, z));
                const b = geometry.getScreenPoint(new Vector3d(x + 0.5, y - 0.5, z));
                const c = geometry.getScreenPoint(new Vector3d(x + 0.5, y + 0.5, z));
                const d = geometry.getScreenPoint(new Vector3d(x - 0.5, y + 0.5, z));

                if(a && b && c && d && FloorplanRoomPainter.insideQuad(px, py, [ a, b, c, d ])) best = { x, y, order };
            }
        }

        if(best) return { x: best.x, y: best.y };

        if(!FloorplanRoomPainter._voidPaintEnabled && !FloorplanRoomPainter._squareSelectMode) return null;

        const origin = geometry.getScreenPoint(new Vector3d(0, 0, 0));
        const alongX = geometry.getScreenPoint(new Vector3d(1, 0, 0));
        const alongY = geometry.getScreenPoint(new Vector3d(0, 1, 0));

        if(!origin || !alongX || !alongY) return null;

        const ax = (alongX.x - origin.x), ay = (alongX.y - origin.y);
        const bx = (alongY.x - origin.x), by = (alongY.y - origin.y);
        const det = ((ax * by) - (bx * ay));

        if(!det) return null;

        const dx = (px - origin.x), dy = (py - origin.y);
        const tileX = (((dx * by) - (bx * dy)) / det);
        const tileY = (((ax * dy) - (dx * ay)) / det);

        if((tileX < -0.5) || (tileY < -0.5)) return null;

        const x = Math.trunc(tileX + 0.499);
        const y = Math.trunc(tileY + 0.499);

        if((x < 0) || (y < 0) || (x >= MAX_NUM_TILE_PER_AXIS) || (y >= MAX_NUM_TILE_PER_AXIS)) return null;

        return { x, y };
    }

    private static insideQuad(px: number, py: number, points: { x: number, y: number }[]): boolean
    {
        let inside = false;

        for(let i = 0, j = (points.length - 1); i < points.length; j = i++)
        {
            const pi = points[i], pj = points[j];

            if(((pi.y > py) !== (pj.y > py)) && (px < (((pj.x - pi.x) * (py - pi.y)) / (pj.y - pi.y)) + pi.x)) inside = !inside;
        }

        return inside;
    }

    private static startStroke(x: number, y: number): void
    {
        FloorplanRoomPainter._isPainting = true;
        FloorplanRoomPainter._lastX = x;
        FloorplanRoomPainter._lastY = y;

        if(FloorplanRoomPainter._squareSelectMode)
        {
            FloorplanRoomPainter._areaStart = { x, y };
            FloorplanRoomPainter._areaEnd = { x, y };
            FloorplanRoomPainter.dispatchAreaPreview();

            return;
        }

        if(FloorplanRoomPainter._callback) FloorplanRoomPainter._callback(x, y, true);
    }

    private static continueStroke(x: number, y: number): void
    {
        if(!FloorplanRoomPainter._isPainting) return;
        if((x === FloorplanRoomPainter._lastX) && (y === FloorplanRoomPainter._lastY)) return;

        FloorplanRoomPainter._lastX = x;
        FloorplanRoomPainter._lastY = y;

        if(FloorplanRoomPainter._squareSelectMode)
        {
            FloorplanRoomPainter._areaEnd = { x, y };
            FloorplanRoomPainter.dispatchAreaPreview();

            return;
        }

        if(FloorplanRoomPainter._callback) FloorplanRoomPainter._callback(x, y, false);
    }

    private static areaBounds(): [ number, number, number, number ]
    {
        const start = FloorplanRoomPainter._areaStart, end = FloorplanRoomPainter._areaEnd;

        return [ Math.min(start.x, end.x), Math.min(start.y, end.y), Math.max(start.x, end.x), Math.max(start.y, end.y) ];
    }

    private static dispatchAreaPreview(): void
    {
        if(!FloorplanRoomPainter.onAreaPreview || !FloorplanRoomPainter._areaStart) return;

        FloorplanRoomPainter.onAreaPreview(...FloorplanRoomPainter.areaBounds());
    }

    private static finishStroke(): void
    {
        if(FloorplanRoomPainter._squareSelectMode && FloorplanRoomPainter._isPainting && FloorplanRoomPainter._areaStart && FloorplanRoomPainter.onAreaCommit)
        {
            FloorplanRoomPainter.onAreaCommit(...FloorplanRoomPainter.areaBounds());
        }

        FloorplanRoomPainter.endStroke();
    }

    private static endStroke(): void
    {
        FloorplanRoomPainter._isPainting = false;
        FloorplanRoomPainter._lastX = -1;
        FloorplanRoomPainter._lastY = -1;
        FloorplanRoomPainter._areaStart = null;
        FloorplanRoomPainter._areaEnd = null;
    }

    public static get isActive(): boolean
    {
        return FloorplanRoomPainter._active;
    }

    public static set panMode(value: boolean)
    {
        FloorplanRoomPainter._panMode = value;

        // our renderer's moveBlocked also stops room dragging (RoomEngine: drag only when !_moveBlocked), so pan mode lifts it
        if(FloorplanRoomPainter._active) GetRoomEngine().moveBlocked = !value;

        if(value) FloorplanRoomPainter.endStroke();
    }

    public static set voidPaintEnabled(value: boolean)
    {
        FloorplanRoomPainter._voidPaintEnabled = value;
    }

    public static set squareSelectMode(value: boolean)
    {
        FloorplanRoomPainter._squareSelectMode = value;
        FloorplanRoomPainter.endStroke();
    }
}
