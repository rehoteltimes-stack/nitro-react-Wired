import { FurnitureSingleClickComposer, ILinkEventTracker, IRoomObject, LegacyDataType, ObjectDataFactory, RoomAreaSelectionManager, RoomObjectCategory, RoomObjectOperationType, RoomObjectVariable, Vector3d } from '@nitrots/nitro-renderer';
import { Graphics } from '@pixi/graphics';
import { ComponentType, FC, useEffect, useMemo, useRef, useState } from 'react';
import { FaArrowsAlt, FaArrowsAltV, FaChevronDown, FaChevronUp, FaCopy, FaCube, FaEraser, FaEyeDropper, FaFillDrip, FaHandPointer, FaMousePointer, FaPaste, FaRedo, FaSearchMinus, FaSearchPlus, FaTimes, FaUndo } from 'react-icons/fa';
import { GrFormNextLink } from 'react-icons/gr';
import { AddEventLinkTracker, GetNitroInstance, BuilderActionResultEvent, BuilderActionType, BuilderBulkMoveComposer, BuilderClipboardEvent, BuilderClipboardLine, BuilderCopyAreaComposer, BuilderEraseAreaComposer, BuilderFillAreaComposer, BuilderModeEnterComposer, BuilderModeExitComposer, BuilderModeSettingsEvent, BuilderPasteAtTileComposer, BuilderSetHeightAreaComposer, BuilderUndoComposer, cancelRoomObjectPlacement, FeedbackKind, GetFurnitureDataForRoomObject, GetRoomEngine, GetSessionDataManager, GroupItem, NotificationBubbleType, ProcessRoomObjectOperation, RegisterBuilderModeMessages, RemoveLinkEventTracker, SendMessageComposer } from '../../api';
import { AutoGrid, Base, Flex, LayoutGridItem, Text } from '../../common';
import { useInventoryFurni, useMessageEvent, useNotification, useRoom } from '../../hooks';

type ToolId = 'fill' | 'eyedropper' | 'select' | 'copy' | 'paste' | 'erase' | 'move' | 'height';

// Bulk pickup highlights RED. Registered at runtime under its own type name by cloning the
// renderer's own filter class (the stock manager only has BRIGHTEN and BLACK).
const HIGHLIGHT_RED = 'highlight_red';

const ensureRedHighlight = (): string =>
{
    try
    {
        const filters = (RoomAreaSelectionManager as unknown as { HIGHLIGHT_FILTERS: { [key: string]: any } }).HIGHLIGHT_FILTERS;

        if(!filters[HIGHLIGHT_RED])
        {
            const filter = new (filters[RoomAreaSelectionManager.HIGHLIGHT_BRIGHTEN].constructor)();

            // same structure as the stock BRIGHTEN matrix (every channel driven by the red input)
            filter.matrix = [ 2.6, 0, 0, 0, 0, 0.3, 0, 0, 0, 0, 0.3, 0, 0, 0, 0, 1, 0, 0, 0, 0 ];
            filters[HIGHLIGHT_RED] = filter;
        }

        return HIGHLIGHT_RED;
    }
    catch(error)
    {
        return RoomAreaSelectionManager.HIGHLIGHT_BLACK;
    }
};

// Blue area highlight (sodaho: copy, select, move and height areas are highlighted blue, pickup red).
const HIGHLIGHT_BLUE = 'highlight_blue';

const ensureBlueHighlight = (): string =>
{
    try
    {
        const filters = (RoomAreaSelectionManager as unknown as { HIGHLIGHT_FILTERS: { [key: string]: any } }).HIGHLIGHT_FILTERS;

        if(!filters[HIGHLIGHT_BLUE])
        {
            const filter = new (filters[RoomAreaSelectionManager.HIGHLIGHT_BRIGHTEN].constructor)();

            filter.matrix = [ 0.55, 0, 0, 0, 0, 0.95, 0, 0, 0, 0, 1.9, 0, 0, 0, 0, 1, 0, 0, 0, 0 ];
            filters[HIGHLIGHT_BLUE] = filter;
        }

        return HIGHLIGHT_BLUE;
    }
    catch(error)
    {
        return RoomAreaSelectionManager.HIGHLIGHT_BRIGHTEN;
    }
};

// Chosen (selected) furni are tinted BLUE like sodaho's (their selectionHighlightColor 0x66AAFF), not the drag area: a sprite filter is put on each chosen
// furni's own sprites. The filter is built by cloning the renderer's own ColorMatrixFilter class
// (via the area-selection manager's stock BRIGHTEN filter), so no extra import or renderer patch is
// needed. Returns null if the renderer internals ever change (then nothing is tinted).
let goldFurniFilter: any = null;

const getGoldFurniFilter = (): any =>
{
    try
    {
        if(!goldFurniFilter)
        {
            const filters = (RoomAreaSelectionManager as unknown as { HIGHLIGHT_FILTERS: { [key: string]: any } }).HIGHLIGHT_FILTERS;
            const filter = new (filters[RoomAreaSelectionManager.HIGHLIGHT_BRIGHTEN].constructor)();

            // rows are R, G, B, A of [r, g, b, a, offset]: a blue wash (0x66AAFF) - the furni stays clearly
            // visible underneath instead of being covered by a solid colour
            filter.matrix = [ 0.6, 0, 0, 0, 0.08, 0, 0.85, 0, 0, 0.15, 0, 0, 1.1, 0, 0.3, 0, 0, 0, 1, 0 ];
            goldFurniFilter = filter;
        }

        return goldFurniFilter;
    }
    catch(error)
    {
        return null;
    }
};

// The big tile grid the reference shows while Builder Mode is on: thin white lines (18% opacity) over a
// 64x64 tile range, extending past the room into the empty space around it. It is one Pixi Graphics added
// to the room canvas' master container and re-positioned/re-scaled every frame so it follows panning
// and zoom exactly like the room itself.
const GRID_TILES = 64;
let gridGraphics: Graphics = null;
let gridFrame = 0;

const gridCanvas = () =>
{
    const engine = GetRoomEngine();

    return engine.getRoomInstanceRenderingCanvas(engine.activeRoomId, 1);
};

const gridPoint = (x: number, y: number) =>
{
    const engine = GetRoomEngine();
    const geometry = engine.getRoomInstanceGeometry(engine.activeRoomId, 1);

    return geometry ? geometry.getScreenPoint(new Vector3d(x, y, 0)) : null;
};

const removeBuilderGrid = () =>
{
    if(gridFrame)
    {
        cancelAnimationFrame(gridFrame);
        gridFrame = 0;
    }

    if(gridGraphics)
    {
        if(gridGraphics.parent) gridGraphics.parent.removeChild(gridGraphics);

        gridGraphics.destroy();
        gridGraphics = null;
    }
};

const followGridCanvas = () =>
{
    gridFrame = 0;

    if(!gridGraphics || gridGraphics.destroyed) return;

    const canvas = gridCanvas();

    if(canvas)
    {
        const master = canvas.master as any;

        if(gridGraphics.parent !== master) master.addChild(gridGraphics);

        gridGraphics.position.set(canvas.screenOffsetX + (canvas.width / 2), canvas.screenOffsetY + (canvas.height / 2));
        gridGraphics.scale.set(canvas.scale);
    }

    gridFrame = requestAnimationFrame(followGridCanvas);
};

const showBuilderGrid = () =>
{
    removeBuilderGrid();

    const canvas = gridCanvas();

    if(!canvas) return;

    const graphics = new Graphics();

    graphics.lineStyle(1, 0xFFFFFF, 0.18);

    for(let i = 0; i <= GRID_TILES; i++)
    {
        const a = gridPoint(i - 0.5, -0.5);
        const b = gridPoint(i - 0.5, GRID_TILES - 0.5);
        const c = gridPoint(-0.5, i - 0.5);
        const d = gridPoint(GRID_TILES - 0.5, i - 0.5);

        if(a && b)
        {
            graphics.moveTo(a.x, a.y);
            graphics.lineTo(b.x, b.y);
        }

        if(c && d)
        {
            graphics.moveTo(c.x, c.y);
            graphics.lineTo(d.x, d.y);
        }
    }

    graphics.interactive = false;
    gridGraphics = graphics;
    (canvas.master as any).addChild(graphics);
    followGridCanvas();
};

// While an area tool is active the renderer's area selection makes EVERY furni see-through (look-through,
// alpha capped low), and does the same to furni that are added later. Only the gold-tinted ones should stand
// out, so everything else is put back to normal.
const clearFurniGhosting = () =>
{
    try
    {
        const engine = GetRoomEngine();

        for(const category of [ RoomObjectCategory.FLOOR, RoomObjectCategory.WALL ])
        {
            for(const roomObject of (engine.getRoomObjects(engine.activeRoomId, category) || []))
            {
                const visualization = roomObject.visualization as any;

                if(visualization && visualization.lookThrough) visualization.lookThrough = false;
            }
        }
    }
    catch(error)
    {
    }
};

const HEIGHT_STEPS = [ 1, 0.1, 0.01 ];
// Real rotation cycle a single "Rotate the brush" button steps through, one value per click -
// matches the real reference exactly (confirmed live: its brush flyout has one FaRedo button next
// to a plain "WxH · rot N" line, not a row of 4 discrete rotation buttons).
const NEXT_ROTATION: Record<number, number> = { 0: 2, 2: 4, 4: 6, 6: 0 };

interface ToolDefinition
{
    tool: ToolId;
    Icon: ComponentType<{ size?: number }>;
    size: number;
    title: string;
}

// Icons + tooltips confirmed live against the real reference (sodaho.tel), read directly from its
// own rendered DOM (react-icons/fa, the exact same package this codebase already depends on) -
// not guessed from the minified bundle's own obfuscated component names.
const TOOLS: ToolDefinition[] = [
    { tool: 'fill', Icon: FaFillDrip, size: 15, title: 'Autofill (drag an area to fill with the brush furni)' },
    { tool: 'eyedropper', Icon: FaEyeDropper, size: 14, title: 'Eyedropper (click a furni to make it the brush)' },
    { tool: 'select', Icon: FaMousePointer, size: 14, title: 'Select furni (click or drag a box around furni, then rotate or change state)' },
    { tool: 'copy', Icon: FaCopy, size: 14, title: 'Copy (click a tile/furni or drag an area)' },
    { tool: 'paste', Icon: FaPaste, size: 14, title: 'Paste (click a tile to rebuild the copied furni)' },
    { tool: 'erase', Icon: FaEraser, size: 15, title: 'Bulk pickup (drag an area to pick up furni)' },
    { tool: 'move', Icon: FaArrowsAlt, size: 15, title: 'Move (click or drag a box around furni, then nudge with the arrows)' },
    { tool: 'height', Icon: FaArrowsAltV, size: 15, title: 'Adjust height (drag an area or click a furni, then use the steppers)' }
];

interface HeightRegion
{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
}

/**
 * Real, hCMS-owned Builder Mode toolbar - a from-scratch region/bulk editor re-derived to match the
 * REAL Habz-reference tool set found in public/BuilderTool/index.js (Brush/Autofill/Eyedropper/
 * Select/Copy/Paste/Bulk pickup/Move/Adjust height/Undo/Zoom), not a guess and not a port - no
 * third-party server source for that reference was ever available to this project, so every
 * operation here talks to this fork's own real Java plugin (hcms-emulator-plugin's
 * BuilderModeManager, registered against the running PacketManager - the CORE emulator source is
 * never modified for this feature) via BuilderModeProtocol.ts.
 *
 * Real, load-bearing findings this is built on:
 * 1. The drag-box/tile-highlight mechanic needs NO engine patch at all - stock nitro-renderer
 *    already ships a complete, real `GetRoomEngine().areaSelectionManager`
 *    (RoomAreaSelectionManager.ts): activate(callback, highlightType) arms it, startSelecting()
 *    begins one gesture, and RoomObjectEventHandler's own existing, unmodified code already routes
 *    tile mouse events into it and suppresses normal walk/select behaviour while it's active. A
 *    plain click (no drag) still fires the callback with a real 1x1 area - the same callback
 *    handles both "click a tile" and "drag a region" tools.
 * 2. Every server-side operation is a re-derivation of this fork's own real, already-existing
 *    single-item methods (canPlaceFurnitureAt/placeFloorFurniAt/moveFurniTo/pickUpItem/
 *    getFloorItems/hasRights), just looped over a region/list - see BuilderModeManager's own
 *    docblock in the plugin repo for the exact methods each operation reuses.
 * 3. Region tools only ever act on FLOOR items (matching the real Habz reference's own scope, and
 *    this project's own server-side implementation) - wall items are out of scope for all 8 tools.
 * 4. Select/Move identify a furni via the SAME "fully inside the dragged rectangle" rule the server
 *    uses (footprintFullyInside) - a small drag over a large item's corner will not pick it up;
 *    the drag has to cover the item's whole real footprint. This is the real region mechanic, not a
 *    bug - a lone click still works for any 1x1 item.
 * 5. Select's own Rotate reuses the exact native `ProcessRoomObjectOperation(...,
 *    OBJECT_ROTATE_POSITIVE)` the stock context menu's own Rotate button already dispatches,
 *    applied once per selected id - a real, deliberate scope choice over building a new bulk-rotate
 *    protocol message, which was not asked for.
 *
 * Wired for real, all of it: Brush (arm + place + auto-continue via the stock inventory placement
 * loop), Autofill, Eyedropper (picks the clicked furni's real matching owned group and switches to
 * Autofill, matching the real reference exactly), Select (+ Rotate, + Pick up), Copy/Paste, Bulk
 * pickup, Move (bulk nudge), Adjust height (bulk +/-1, +/-0.1, +/-0.01), Undo (single real
 * server-tracked action), Zoom.
 *
 * Not wired (real, visible, disabled buttons are not used here since none of the remaining Habz
 * tools apply beyond this set - Copy/Paste's own real clipboard is entirely server-side, per-player,
 * in-memory, one region deep - matching this project's own real, documented single-level undo).
 */
export const BuilderToolbarView: FC<{}> = props =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const [ activeTool, setActiveTool ] = useState<ToolId>(null);
    const [ armedKey, setArmedKey ] = useState<string>(null);
    // sodaho's brush is the furni TYPE (spriteId + name), not an inventory item: it stays armed when the last one is
    // placed ("Remaining: 0" in red) and a fill still goes to the server, which says what was missing. Like sodaho, the
    // eyedropper only arms furni you own.
    const [ brush, setBrush ] = useState<{ spriteId: number, name: string }>(null);
    const [ fillRotation, setFillRotation ] = useState(0);
    const [ brushPickerOpen, setBrushPickerOpen ] = useState(false);
    // sodaho's fill preview: half-transparent ghost furni while dragging, up to how many you own ("Will place ~N")
    const [ willPlace, setWillPlace ] = useState<number>(null);
    const ghostObjects = useRef(new Map<string, number>());
    const nextGhostId = useRef(-1000000);
    const [ selectedFurniIds, setSelectedFurniIds ] = useState<number[]>([]);
    const [ pendingHeightRegion, setPendingHeightRegion ] = useState<HeightRegion>(null);
    const [ clipboard, setClipboard ] = useState<{ width: number, length: number, total: number, lines: BuilderClipboardLine[] }>(null);
    const [ settings, setSettings ] = useState({ enabled: false, canUse: false, maxRegionTiles: 0, maxItemsPerOp: 0, undoAvailable: false });
    // Real, hCMS-established notification bubble system (NotificationCenterView, already mounted
    // globally in RightSideView.tsx) - real, correct positioning/stacking/fade-out inherited for
    // free, rather than a bespoke toast box of our own that (confirmed live) visually overlapped the
    // brush flyout instead of sitting cleanly top-right like every other real bubble in this client.
    const { showFeedback } = useNotification();
    const pushToast = (text: string, kind: FeedbackKind = null) => showFeedback(text, kind);
    // Real bug found and fixed here: useInventoryFurni's own FurnitureListComposer() fetch only
    // fires while ITS shared isVisible flag is true (useSharedVisibility - a reference-counted
    // "someone needs this open" flag, normally only raised by the Inventory panel itself). Without
    // calling activate() ourselves, the Brush grid stayed empty until a player happened to have
    // opened Inventory at least once first - not because they owned nothing, but because the real
    // inventory list had simply never been requested yet. Builder Mode now raises its own real
    // reference-count entry for as long as it's open, independent of the Inventory panel.
    const { groupItems = [], activate: activateInventory, deactivate: deactivateInventory } = useInventoryFurni();
    const inventoryVisibilityId = useRef<number>(null);
    const buttonRefs = useRef<{ [key: string]: HTMLButtonElement }>({});
    const fillSnapshot = useRef<Set<number>>(null);

    const floorObjectIds = (): Set<number> =>
    {
        const engine = GetRoomEngine();
        const ids = new Set<number>();

        for(const roomObject of (engine.getRoomObjects(engine.activeRoomId, RoomObjectCategory.FLOOR) || []))
        {
            if(roomObject.id >= 0) ids.add(roomObject.id);
        }

        return ids;
    };
    const { roomSession = null } = useRoom();

    useEffect(() => RegisterBuilderModeMessages(), []);

    useMessageEvent<BuilderModeSettingsEvent>(BuilderModeSettingsEvent, event =>
    {
        const parser = event.getParser();

        setSettings({ enabled: parser.enabled, canUse: parser.canUse, maxRegionTiles: parser.maxRegionTiles, maxItemsPerOp: parser.maxItemsPerOp, undoAvailable: parser.undoAvailable });

        if(!parser.enabled || !parser.canUse)
        {
            pushToast(parser.enabled ? 'You need rights in this room to use Builder Mode.' : 'Builder Mode is switched off right now.', parser.enabled ? 'no_permission' : 'info');
            setIsVisible(false);
        }
    });

    useMessageEvent<BuilderClipboardEvent>(BuilderClipboardEvent, event =>
    {
        const parser = event.getParser();

        setClipboard({ width: parser.width, length: parser.length, total: parser.total, lines: [ ...parser.lines ] });

        if(!parser.total) return;

        pushToast(`Copied ${ parser.total } furni - click a tile to paste.`, 'build_copy');
        selectToolRef.current('paste');
    });

    useMessageEvent<BuilderActionResultEvent>(BuilderActionResultEvent, event =>
    {
        const parser = event.getParser();

        setSettings(value => ({ ...value, undoAvailable: parser.undoAvailable }));

        if((parser.actionType === BuilderActionType.FILL) && (parser.code === 0) && fillSnapshot.current)
        {
            const before = fillSnapshot.current;

            fillSnapshot.current = null;

            // the room objects arrive as separate messages right after the result
            setTimeout(() =>
            {
                let last = -1;

                for(const id of floorObjectIds()) if(!before.has(id) && (id > last)) last = id;

                setSelectedFurniIds((last >= 0) ? [ last ] : []);
            }, 500);
        }

        const kind = ({
            [ BuilderActionType.FILL ]: 'build_place',
            [ BuilderActionType.ERASE ]: 'build_pickup',
            [ BuilderActionType.HEIGHT ]: 'build_height',
            [ BuilderActionType.COPY ]: 'build_copy',
            [ BuilderActionType.PASTE ]: 'build_paste',
            [ BuilderActionType.MOVE ]: 'build_move',
            [ BuilderActionType.UNDO ]: 'build_undo'
        } as { [ key: number ]: FeedbackKind })[ parser.actionType ] || 'success';

        const label = ({
            [ BuilderActionType.FILL ]: 'Placed',
            [ BuilderActionType.ERASE ]: 'Picked up',
            [ BuilderActionType.HEIGHT ]: 'Adjusted',
            [ BuilderActionType.COPY ]: 'Copied',
            [ BuilderActionType.PASTE ]: 'Pasted',
            [ BuilderActionType.MOVE ]: 'Moved',
            [ BuilderActionType.UNDO ]: 'Undid'
        })[ parser.actionType ] || 'Processed';

        if(parser.code !== 0)
        {
            pushToast(({
                1: 'You need rights in this room.',
                2: 'That area is too big.',
                3: 'Nothing to do there.',
                4: 'Nothing to undo.',
                5: 'You don\'t have any of that furni.',
                6: 'You\'re not in a room.',
                7: 'That\'s too many furni at once.'
            })[ parser.code ] || 'That didn\'t work.', ({ 1: 'no_permission', 3: 'info', 4: 'info', 5: 'not_found' } as { [ key: number ]: FeedbackKind })[ parser.code ] || 'error');

            return;
        }

        // copying is announced by the clipboard message (with "click a tile to paste")
        if(parser.actionType === BuilderActionType.COPY) return;

        let message = `${ label } ${ parser.processed } furni`;

        if(parser.failed > 0) message += `, ${ parser.failed } skipped`;

        let shortage = 0;

        if(parser.shortfall.length) shortage = parser.shortfall.reduce((total, entry) => (total + Math.max(0, entry.required - entry.available)), 0);

        if(shortage > 0) message += ` - you ran out of that furni (${ shortage } more needed)`;

        pushToast(`${ message }.`, (shortage > 0) ? 'warning' : kind);
    });

    // Real bug fixed here: type+category is NOT a unique GroupItem key - recolors/rare variants of
    // the same base furni type share both, and GroupItem's own real identity also includes
    // stuffData/extra (confirmed against GroupItem.ts's own constructor). Using only type-category
    // caused armedGroup to silently resolve to the WRONG real owned item whenever groupItems
    // reordered (caught live: the armed display flickered between two different real furni on
    // every click, even though armedKey itself never changed). getLegacyString() is the exact same
    // real serialization attemptItemPlacement() itself already sends to the server for this data.
    const groupKey = (group: GroupItem) => `${ group.type }-${ group.category }-${ group.extra }-${ group.stuffData?.getLegacyString?.() ?? '' }`;

    const floorGroups = useMemo(() =>
        (groupItems || []).filter(group => !group.isWallItem && (group.getUnlockedCount() > 0)),
    [ groupItems ]);

    const armedGroup = useMemo(() =>
    {
        if(!brush) return null;

        return floorGroups.find(group => (groupKey(group) === armedKey)) || floorGroups.find(group => (group.type === brush.spriteId)) || null;
    }, [ floorGroups, armedKey, brush ]);

    // The armed key is deliberately NOT cleared when its group disappears: after a Fill the server
    // removes the placed items and the client re-fetches the inventory, so the list is briefly empty
    // or rebuilt. Clearing here made the brush vanish after every placement. armedGroup simply
    // resolves to null while the type is missing and picks the brush up again when it returns.

    useEffect(() =>
    {
        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) =>
            {
                const parts = url.split('/');

                if(parts.length < 2) return;

                switch(parts[1])
                {
                    case 'toggle':
                        setIsVisible(value => !value);
                        return;
                    case 'hide':
                        setIsVisible(false);
                        return;
                }
            },
            eventUrlPrefix: 'builder-toolbar/'
        };

        AddEventLinkTracker(linkTracker);

        return () => RemoveLinkEventTracker(linkTracker);
    }, []);

    useEffect(() =>
    {
        if(isVisible)
        {
            SendMessageComposer(new BuilderModeEnterComposer());
            inventoryVisibilityId.current = activateInventory();
            return;
        }

        SendMessageComposer(new BuilderModeExitComposer());
        cancelRoomObjectPlacement();
        GetRoomEngine().areaSelectionManager.deactivate();
        setArmedKey(null);
        setBrush(null);
        setActiveTool(null);
        setSelectedFurniIds([]);
        setPendingHeightRegion(null);
        setBrushPickerOpen(false);

        if(inventoryVisibilityId.current !== null)
        {
            deactivateInventory(inventoryVisibilityId.current);
            inventoryVisibilityId.current = null;
        }
    }, [ isVisible ]);

    // Real design correction made after comparing live against the real reference: arming the
    // brush does NOT go through attemptItemPlacement() (stock nitro-react's native single-item,
    // ghost-follows-cursor placement mode) at all - that was a leftover from an earlier, simpler
    // single-item version of this toolbar, before Autofill existed. Autofill places through its own
    // real area-drag mechanism (BuilderFillAreaComposer), so arming the brush is just local state -
    // confirmed live, the real reference's own Brush button shows `active` purely from whether a
    // group is armed, completely independent of which tool is currently selected (its own Select
    // tool showed `active` at the very same time Brush did).
    const arm = (group: GroupItem) =>
    {
        setArmedKey(groupKey(group));
        setBrush({ spriteId: group.type, name: group.name });
    };

    /** Every floor room object whose own real footprint sits ENTIRELY inside the given rectangle -
     * the same rule the server's own BuilderModeManager applies, so a client-side preview/selection
     * never disagrees with what the server will actually act on. */
    const floorObjectsFullyInside = (startX: number, startY: number, endX: number, endY: number): IRoomObject[] =>
    {
        if(!roomSession) return [];

        const engine = GetRoomEngine();
        const result: IRoomObject[] = [];

        for(const roomObject of (engine.getRoomObjects(roomSession.roomId, RoomObjectCategory.FLOOR) || []))
        {
            if(roomObject.id < 0) continue;

            const location = roomObject.getLocation();
            const direction = roomObject.getDirection();
            const furnitureData = GetFurnitureDataForRoomObject(roomSession.roomId, roomObject.id, RoomObjectCategory.FLOOR);

            if(!furnitureData) continue;

            const rotated = ((Math.round(direction.x / 45) % 8) === 2) || ((Math.round(direction.x / 45) % 8) === 6);
            const width = rotated ? furnitureData.tileSizeY : furnitureData.tileSizeX;
            const height = rotated ? furnitureData.tileSizeX : furnitureData.tileSizeY;
            const objectEndX = location.x + width - 1;
            const objectEndY = location.y + height - 1;

            if((location.x >= startX) && (location.y >= startY) && (objectEndX <= endX) && (objectEndY <= endY)) result.push(roomObject);
        }

        return result;
    };

    const pickEyedropper = (startX: number, startY: number, endX: number, endY: number) =>
    {
        const candidates = floorObjectsFullyInside(startX, startY, endX, endY);

        if(!candidates.length) return;

        const roomObject = candidates[ 0 ];
        const model = roomObject.model;
        const typeId = model.getValue<number>(RoomObjectVariable.FURNITURE_TYPE_ID);
        const owned = floorGroups.filter(group => (group.type === typeId));

        if(!owned.length)
        {
            // sodaho: the eyedropper only arms furni you own; a brush that runs out later stays armed
            pushToast('You have none of that furni in your inventory.', 'not_found');
            return;
        }

        const dataFormat = model.getValue<number>(RoomObjectVariable.FURNITURE_DATA_FORMAT);
        const objectData = ObjectDataFactory.getData(dataFormat);
        let group = owned[ 0 ];

        if(objectData)
        {
            objectData.initializeFromRoomObjectModel(model);

            const legacyString = objectData.getLegacyString();
            const exactMatch = owned.find(candidate => (candidate.stuffData?.getLegacyString?.() === legacyString));

            if(exactMatch) group = exactMatch;
        }

        arm(group);
        pushToast(`Brush set to ${ group.name }.`, 'build_brush');
        // Really switch to Fill (re-registers the area callback as 'fill'); only flipping the UI state
        // left the next drag still acting as an eyedropper.
        selectTool('fill');
        setBrushPickerOpen(false);
    };

    // The big tile grid is shown for as long as Builder Mode is open in a room.
    useEffect(() =>
    {
        if(!isVisible || !roomSession) return;

        showBuilderGrid();

        return () => removeBuilderGrid();
    }, [ isVisible, roomSession ]);

    // Keeps furni that are added while an area tool is active from turning see-through.
    useEffect(() =>
    {
        if(!isVisible) return;

        const interval = setInterval(clearFurniGhosting, 300);

        return () => clearInterval(interval);
    }, [ isVisible ]);

    // Tint the chosen furni gold (and clear it again when they are un-chosen or the toolbar closes).
    const tintedIds = useRef<Set<number>>(new Set());

    useEffect(() =>
    {
        if(!roomSession) return;

        const filter = getGoldFurniFilter();

        if(!filter) return;

        const engine = GetRoomEngine();
        const wanted = new Set<number>(selectedFurniIds);

        const setTint = (id: number, on: boolean) =>
        {
            const sprites = (engine.getRoomObject(roomSession.roomId, id, RoomObjectCategory.FLOOR)?.visualization as any)?.sprites;

            if(!sprites) return;

            for(const sprite of sprites)
            {
                if(!sprite) continue;

                const has = !!sprite.filters?.includes(filter);

                if(on && !has) sprite.filters = [ ...(sprite.filters || []), filter ];
                else if(!on && has) sprite.filters = sprite.filters.filter((item: any) => (item !== filter));
            }
        };

        for(const id of tintedIds.current) if(!wanted.has(id)) setTint(id, false);
        for(const id of wanted) setTint(id, true);

        tintedIds.current = wanted;
    }, [ selectedFurniIds, roomSession ]);

    const toggleSelection = (ids: number[]) =>
    {
        setSelectedFurniIds(current =>
        {
            const next = [ ...current ];

            for(const id of ids)
            {
                const index = next.indexOf(id);

                if(index === -1) next.push(id); else next.splice(index, 1);
            }

            return next;
        });
    };

    const handleAreaCommit = (tool: ToolId, rootX: number, rootY: number, width: number, height: number) =>
    {
        if(!width || !height) return;

        const startX = rootX;
        const startY = rootY;
        const endX = (rootX + width - 1);
        const endY = (rootY + height - 1);

        switch(tool)
        {
            case 'fill':
                if(!brush) { pushToast('Pick a furni brush first.', 'build_brush'); break; }
                // Only the furni this fill adds may end up highlighted: drop every earlier gold tint now and
                // remember which floor objects exist, so the result handler can tell the new ones apart.
                setSelectedFurniIds([]);
                fillSnapshot.current = floorObjectIds();
                SendMessageComposer(new BuilderFillAreaComposer(startX, startY, endX, endY, brush.spriteId, fillRotation));
                break;
            case 'eyedropper':
                pickEyedropper(startX, startY, endX, endY);
                break;
            case 'select':
            case 'move':
                toggleSelection(floorObjectsFullyInside(startX, startY, endX, endY).map(object => object.id));
                break;
            case 'copy':
                SendMessageComposer(new BuilderCopyAreaComposer(startX, startY, endX, endY));
                break;
            case 'paste':
                SendMessageComposer(new BuilderPasteAtTileComposer(startX, startY));
                break;
            case 'erase':
                SendMessageComposer(new BuilderEraseAreaComposer(startX, startY, endX, endY));
                break;
            case 'height':
                setPendingHeightRegion({ startX, startY, endX, endY });
                break;
        }

        // Real Habz behaviour: a region tool stays armed for repeated drags rather than exiting
        // after one operation - re-arm the SAME gesture immediately, unless the tool itself changed
        // (e.g. Eyedropper just switched us to Fill) while this commit was being processed.
        if(GetRoomEngine().areaSelectionManager.areaSelectionState !== 0) GetRoomEngine().areaSelectionManager.startSelecting();
    };

    // Real bug found and fixed here (confirmed live against the real reference): this used to also
    // call setArmedKey(null) unconditionally on every single call - including the brush grid's own
    // onClick, which calls arm(group) immediately before selectTool('fill') - silently un-arming
    // the very brush just picked, in the SAME synchronous handler, before a single Fill could ever
    // fire. The real reference's own Brush button is `active` purely from whether a group is armed,
    // completely independent of which tool is selected (confirmed live: its Select tool showed
    // `active` at the same time Brush did) - so switching tools must never touch armedKey at all.
    // The area callback is registered once per tool selection; without this ref it kept the
    // armedGroup/fillRotation from THAT render, so a brush picked right before dragging was ignored.
    const commitRef = useRef(handleAreaCommit);
    commitRef.current = handleAreaCommit;

    const selectTool = (tool: ToolId) =>
    {
        const engine = GetRoomEngine();

        cancelRoomObjectPlacement();
        engine.areaSelectionManager.deactivate();
        setBrushPickerOpen((tool === 'fill') && (activeTool !== 'fill') && !brush);

        if(activeTool === tool)
        {
            if(tool === 'fill') { setArmedKey(null); setBrush(null); }

            setActiveTool(null);
            setSelectedFurniIds([]);
            setPendingHeightRegion(null);
            return;
        }

        // Selection is preserved when switching directly between Select and Move (matches the real
        // reference exactly) - cleared for every other tool transition.
        const preserveSelection = ([ 'select', 'move' ] as ToolId[]).includes(tool) && ([ 'select', 'move' ] as ToolId[]).includes(activeTool);

        if(!preserveSelection) setSelectedFurniIds([]);

        setPendingHeightRegion(null);
        setActiveTool(tool);

        // Fill only starts its area selection once a brush is armed and the picker is closed (the effect
        // below does that): an active area selection makes every furni in the room see-through/highlighted.
        if(!((tool === 'fill') && !brush)) activateArea(tool);
    };

    const selectToolRef = useRef(selectTool);
    selectToolRef.current = selectTool;

    // (Re)starts the drag-a-box gesture for a tool; the callback always reads the latest state via commitRef.
    const activateArea = (tool: ToolId) =>
    {
        const engine = GetRoomEngine();
        const highlightType = (tool === 'erase') ? ensureRedHighlight() : (([ 'copy', 'select', 'move', 'height' ] as ToolId[]).includes(tool) ? ensureBlueHighlight() : RoomAreaSelectionManager.HIGHLIGHT_BRIGHTEN);

        engine.areaSelectionManager.deactivate();
        engine.areaSelectionManager.activate((rootX, rootY, width, height) => commitRef.current(tool, rootX, rootY, width, height), highlightType);
        engine.areaSelectionManager.startSelecting();
        clearFurniGhosting();
    };

    // Fill: the drag area is active as soon as a furni is armed - the picker stays open (like the reference),
    // so you can keep switching furni and dragging. Without a brush there is nothing to drag yet.
    useEffect(() =>
    {
        if(!isVisible || (activeTool !== 'fill')) return;

        if(brush) activateArea('fill');
        else GetRoomEngine().areaSelectionManager.deactivate();
    }, [ activeTool, isVisible, brush ]);

    const toggleBrushPicker = () =>
    {
        if(!activeTool)
        {
            selectTool('fill');
            setBrushPickerOpen(true);

            return;
        }

        setBrushPickerOpen(value => !value);
    };

    const undo = () =>
    {
        SendMessageComposer(new BuilderUndoComposer());
    };

    const zoom = (direction: number) =>
    {
        if(!roomSession) return;

        const engine = GetRoomEngine();
        const currentScale = engine.getRoomInstanceRenderingCanvasScale(roomSession.roomId, 1);
        const nextScale = (direction > 0) ? Math.min(currentScale * 2, 2) : Math.max(currentScale / 2, 0.5);

        engine.setRoomInstanceRenderingCanvasScale(roomSession.roomId, 1, nextScale);
    };

    // Real, deliberate scope choice: one real native rotate request per selected id
    // (ProcessRoomObjectOperation, the exact same operation the stock context menu's own Rotate
    // item dispatches) rather than a new bulk-rotate protocol message, which was not asked for.
    // Confirmed live against the real reference: Select's own flyout has separate CCW/CW buttons,
    // not a single "Rotate" - OBJECT_ROTATE_NEGATIVE is the real native counter-clockwise op.
    const rotateSelected = (clockwise: boolean) =>
    {
        const operation = clockwise ? RoomObjectOperationType.OBJECT_ROTATE_POSITIVE : RoomObjectOperationType.OBJECT_ROTATE_NEGATIVE;

        for(const objectId of selectedFurniIds) ProcessRoomObjectOperation(objectId, RoomObjectCategory.FLOOR, operation);
    };

    // Real "Use / next state" button (confirmed live) - replays the same real single-click
    // interaction FurnitureSingleClickComposer already sends when a player clicks a furni directly
    // (e.g. toggling a lamp), once per selected id - no new state-tracking of our own.
    const useSelected = () =>
    {
        for(const objectId of selectedFurniIds) SendMessageComposer(new FurnitureSingleClickComposer(objectId));
    };

    const moveSelected = (deltaX: number, deltaY: number) =>
    {
        if(!selectedFurniIds.length) return;

        SendMessageComposer(new BuilderBulkMoveComposer(selectedFurniIds, deltaX, deltaY));
    };

    const adjustPendingHeight = (step: number) =>
    {
        if(!pendingHeightRegion) return;

        SendMessageComposer(new BuilderSetHeightAreaComposer(pendingHeightRegion.startX, pendingHeightRegion.startY, pendingHeightRegion.endX, pendingHeightRegion.endY, Math.round(step * 100)));
    };

    // like the reference, building is an edit mode: body.builder-edit-mode leaves only the chat input in the toolbar
    // (styles in floorplan-editor/FloorplanEditorView.scss, shared with the floor editor's edit mode)
    useEffect(() =>
    {
        if(!isVisible) return;

        document.body.classList.add('builder-edit-mode');

        return () => document.body.classList.remove('builder-edit-mode');
    }, [ isVisible ]);

    useEffect(() =>
    {
        if(!isVisible) return;

        const canvas = GetNitroInstance().application.renderer.view as HTMLCanvasElement;
        const swallow = (event: MouseEvent) =>
        {
            if(event.target === canvas) event.stopPropagation();
        };

        window.addEventListener('click', swallow, true);
        window.addEventListener('dblclick', swallow, true);

        return () =>
        {
            window.removeEventListener('click', swallow, true);
            window.removeEventListener('dblclick', swallow, true);
        };
    }, [ isVisible ]);

    const clearFillGhosts = () =>
    {
        const engine = GetRoomEngine();

        for(const objectId of ghostObjects.current.values()) engine.removeRoomObjectFloor(engine.activeRoomId, objectId);

        ghostObjects.current.clear();
        setWillPlace(null);
    };

    // sodaho's fill preview (their builder `de`): tiles are stepped by the brush size (swapped at rotation 2 / 6),
    // capped by min(maxItemsPerOp, owned count); each gets a ghost furni at its stacking height with alpha 0.5.
    // Our stock area selection has no preview callback, so the dragged box is read from it every frame.
    const previewFill = (startX: number, startY: number, endX: number, endY: number) =>
    {
        const engine = GetRoomEngine();
        const roomId = engine.activeRoomId;
        const furniData = GetSessionDataManager().getFloorItemData(brush.spriteId);
        const turned = ((fillRotation === 2) || (fillRotation === 6));
        const stepX = Math.max(1, (turned ? furniData?.tileSizeY : furniData?.tileSizeX) || 1);
        const stepY = Math.max(1, (turned ? furniData?.tileSizeX : furniData?.tileSizeY) || 1);
        const owned = floorGroups.find(group => (group.type === brush.spriteId));
        const limit = Math.min(settings.maxItemsPerOp || 200, owned ? owned.getUnlockedCount() : 0);
        const tiles: { x: number, y: number }[] = [];

        for(let y = startY; ((y + stepY - 1) <= endY) && (tiles.length < limit); y += stepY)
        {
            for(let x = startX; ((x + stepX - 1) <= endX) && (tiles.length < limit); x += stepX) tiles.push({ x, y });
        }

        const wanted = new Set(tiles.map(tile => `${ tile.x }:${ tile.y }`));

        for(const [ key, objectId ] of Array.from(ghostObjects.current.entries()))
        {
            if(wanted.has(key)) continue;

            engine.removeRoomObjectFloor(roomId, objectId);
            ghostObjects.current.delete(key);
        }

        const heightMap = (engine as unknown as { getFurnitureStackingHeightMap: (id: number) => { getTileHeight: (x: number, y: number) => number } }).getFurnitureStackingHeightMap(roomId);

        for(const tile of tiles)
        {
            const key = `${ tile.x }:${ tile.y }`;

            if(ghostObjects.current.has(key)) continue;

            const objectId = nextGhostId.current--;
            const z = Math.max(0, heightMap ? heightMap.getTileHeight(tile.x, tile.y) : 0);

            if(!engine.addFurnitureFloor(roomId, objectId, brush.spriteId, new Vector3d(tile.x, tile.y, z), new Vector3d(fillRotation * 45), 0, new LegacyDataType())) continue;

            engine.getRoomObject(roomId, objectId, RoomObjectCategory.FLOOR)?.model.setValue(RoomObjectVariable.FURNITURE_ALPHA_MULTIPLIER, 0.5);
            ghostObjects.current.set(key, objectId);
        }

        setWillPlace(tiles.length);
    };

    const previewFillRef = useRef(previewFill);
    previewFillRef.current = previewFill;

    useEffect(() =>
    {
        if(!isVisible || (activeTool !== 'fill') || !brush) return;

        const manager = GetRoomEngine().areaSelectionManager as unknown as { areaSelectionState: number, _highlightRootX: number, _highlightRootY: number, _highlightWidth: number, _highlightHeight: number };
        let lastKey = '';
        let frame = 0;

        const tick = () =>
        {
            if(manager.areaSelectionState === RoomAreaSelectionManager.SELECTING)
            {
                const key = `${ manager._highlightRootX }:${ manager._highlightRootY }:${ manager._highlightWidth }:${ manager._highlightHeight }`;

                if((key !== lastKey) && (manager._highlightWidth > 0) && (manager._highlightHeight > 0))
                {
                    lastKey = key;
                    previewFillRef.current(manager._highlightRootX, manager._highlightRootY, (manager._highlightRootX + manager._highlightWidth - 1), (manager._highlightRootY + manager._highlightHeight - 1));
                }

                // a ghost's model is reset while its asset loads, so keep it half transparent every frame
                const engine = GetRoomEngine();

                for(const objectId of ghostObjects.current.values()) engine.getRoomObject(engine.activeRoomId, objectId, RoomObjectCategory.FLOOR)?.model.setValue(RoomObjectVariable.FURNITURE_ALPHA_MULTIPLIER, 0.5);
            }
            else if(lastKey)
            {
                lastKey = '';
                clearFillGhosts();
            }

            frame = requestAnimationFrame(tick);
        };

        frame = requestAnimationFrame(tick);

        return () =>
        {
            cancelAnimationFrame(frame);
            clearFillGhosts();
        };
    }, [ isVisible, activeTool, brush, fillRotation ]);

    const exit = () =>
    {
        setIsVisible(false);
    };

    if(!isVisible) return null;

    const remaining = armedGroup ? armedGroup.getUnlockedCount() : 0;
    // Real "{W}×{H} · rot {N}" line, read the same way the codebase's own GetFurnitureDataForRoomObject
    // reads floor-item dimensions elsewhere in this file - confirmed live against the real
    // reference's own identical brush flyout line.
    const armedFurnitureData = brush ? GetSessionDataManager().getFloorItemData(brush.spriteId) : null;
    // the brush footprint follows its rotation (2 / 6 swap width and length), like sodaho's
    const brushTurned = ((fillRotation === 2) || (fillRotation === 6));
    const brushSize = armedFurnitureData ? `${ (brushTurned ? armedFurnitureData.tileSizeY : armedFurnitureData.tileSizeX) || 1 }×${ (brushTurned ? armedFurnitureData.tileSizeX : armedFurnitureData.tileSizeY) || 1 }` : '';
    const brushIcon = brush ? (armedGroup?.iconUrl || GetRoomEngine().getFurnitureFloorIconUrl(brush.spriteId)) : null;
    // one selected furni: its name in the Select header (sodaho)
    const singleSelectedName = (() =>
    {
        if((selectedFurniIds.length !== 1) || !roomSession) return null;

        const roomObject = GetRoomEngine().getRoomObject(roomSession.roomId, selectedFurniIds[0], RoomObjectCategory.FLOOR);

        if(!roomObject) return null;

        return GetSessionDataManager().getFloorItemDataByName(roomObject.type)?.name || roomObject.type;
    })();

    // Markup and class names follow the reference Builder Mode toolbar exactly (its own index.css is
    // used as-is): three .bm-btn-group blocks, and every flyout is a direct child of the toolbar,
    // positioned beside the button it belongs to via that button's offsetTop.
    const anchorTop = (key: string) => (buttonRefs.current[key]?.offsetTop ?? 0);
    const flyoutsVisible = !brushPickerOpen;

    return (
        <div className="builder-mode-toolbar">
            <div className="bm-btn-group">
                <button ref={ element => { buttonRefs.current.brush = element; } } className={ 'bm-btn' + (brushPickerOpen ? ' active' : '') } title={ brush ? `Brush: ${ brush.name }` : 'Pick a furni brush' } onClick={ toggleBrushPicker }>
                    { brush ? <img className="bm-brush-icon" alt={ brush.name } src={ brushIcon } /> : <FaCube size={ 15 } /> }
                </button>
                { TOOLS.map(definition =>
                    <button key={ definition.tool } ref={ element => { buttonRefs.current[definition.tool] = element; } } className={ 'bm-btn' + ((activeTool === definition.tool) ? ' active' : '') } title={ definition.title } onClick={ () => selectTool(definition.tool) }>
                        <definition.Icon size={ definition.size } />
                    </button>) }
            </div>
            <div className="bm-btn-group">
                <button className={ 'bm-btn' + (settings.undoAvailable ? '' : ' disabled') } title="Undo the last builder action" disabled={ !settings.undoAvailable } onClick={ undo }><FaUndo size={ 14 } /></button>
                <button className="bm-btn" title="Zoom in" onClick={ () => zoom(1) }><FaSearchPlus size={ 14 } /></button>
                <button className="bm-btn" title="Zoom out" onClick={ () => zoom(-1) }><FaSearchMinus size={ 14 } /></button>
            </div>
            <div className="bm-btn-group">
                <button className="bm-btn bm-btn-exit" title="Exit Builder Mode" onClick={ exit }><FaTimes size={ 16 } /></button>
            </div>
            { brushPickerOpen &&
                <div className="bm-flyout bm-flyout-brush" style={ { top: anchorTop('brush') } }>
                    <div className="bm-flyout-header">
                        <Text bold small>Furni brush</Text>
                        <Text pointer underline small onClick={ () => setBrushPickerOpen(false) }>close</Text>
                    </div>
                    { brush &&
                        <div className="bm-brush-status">
                            <Text bold truncate small>{ brush.name }</Text>
                            <div className="bm-brush-meta">
                                <Text small>{ brushSize } · rot { fillRotation }</Text>
                                <button className="bm-btn bm-btn-small" title="Rotate the brush" onClick={ () => setFillRotation(value => NEXT_ROTATION[ value ]) }><FaRedo size={ 11 } /></button>
                            </div>
                            <Text small variant={ (remaining === 0) ? 'danger' : null }>Remaining: { remaining }</Text>
                            { (willPlace !== null) && <Text small>Will place ~{ willPlace }</Text> }
                        </div> }
                    { /* columnMinHeight feeds --nitro-grid-column-min-height (LayoutGridItem's height);
                        the 4-column template itself comes from the reference's .bm-brush-grid rule. */ }
                    <AutoGrid columnMinHeight={ 45 } classNames={ [ 'bm-brush-grid' ] }>
                        { floorGroups.map(group =>
                            <LayoutGridItem
                                key={ groupKey(group) }
                                className="layout-inner"
                                title={ group.name }
                                itemImage={ group.iconUrl }
                                itemCount={ group.getUnlockedCount() }
                                itemActive={ !!brush && ((groupKey(group) === armedKey) || (!armedKey && (group.type === brush.spriteId))) }
                                onClick={ () => { arm(group); if(activeTool !== 'fill') selectTool('fill'); setBrushPickerOpen(true); } } />) }
                        { !floorGroups.length &&
                            <Text small>No floor furni in your inventory.</Text> }
                    </AutoGrid>
                </div> }
            { flyoutsVisible && (activeTool === 'paste') && clipboard &&
                <div className="bm-flyout bm-flyout-clipboard" style={ { top: anchorTop(activeTool) } }>
                    <div className="bm-flyout-header">
                        <Text bold small>{ `Clipboard · ${ clipboard.width }×${ clipboard.length } · ${ clipboard.total } items` }</Text>
                    </div>
                    { clipboard &&
                        <div className="bm-clipboard-rows">
                            { clipboard.lines.map((line, index) =>
                            {
                                const owned = groupItems.find(group => (!group.isWallItem && (group.type === line.spriteId)));
                                const available = owned ? owned.getUnlockedCount() : 0;

                                return (
                                    <div key={ index } className={ 'bm-clipboard-row' + ((available < line.count) ? ' short' : '') }>
                                        <Text small truncate>{ line.name }</Text>
                                        <Text small shrink={ false }>{ `×${ line.count } - have ${ available }` }</Text>
                                    </div>
                                );
                            }) }
                        </div> }
                    <Text small>Click a tile to paste (bottom-left corner).</Text>
                </div> }
            { flyoutsVisible && (activeTool === 'select') &&
                <div className="bm-flyout bm-flyout-furni" style={ { top: anchorTop('select') } }>
                    <div className="bm-flyout-header">
                        <Text bold truncate small>{ selectedFurniIds.length ? (singleSelectedName || `${ selectedFurniIds.length } selected`) : 'Furni tools' }</Text>
                    </div>
                    { selectedFurniIds.length === 0 &&
                        <Text small>Click furni or drag a box around them to select.</Text> }
                    { selectedFurniIds.length > 0 &&
                        <>
                            <div className="bm-furni-row">
                                <button className="bm-height-btn" title="Rotate counter-clockwise" onClick={ () => rotateSelected(false) }><FaUndo size={ 11 } /></button>
                                <button className="bm-height-btn" title="Rotate clockwise" onClick={ () => rotateSelected(true) }><FaRedo size={ 11 } /></button>
                                <button className="bm-height-btn" title="Use / next state" onClick={ useSelected }><FaHandPointer size={ 11 } /></button>
                                <button className="bm-height-btn" title="Clear selection" onClick={ () => setSelectedFurniIds([]) }><FaTimes size={ 11 } /></button>
                            </div>
                            <Text small>Click furni to add or remove them from the selection.</Text>
                        </> }
                </div> }
            { flyoutsVisible && (activeTool === 'move') &&
                <div className="bm-flyout bm-flyout-move" style={ { top: anchorTop('move') } }>
                    <div className="bm-flyout-header">
                        <Text bold small>{ selectedFurniIds.length ? `Move ${ selectedFurniIds.length } selected` : 'Move furni' }</Text>
                        { selectedFurniIds.length > 0 &&
                            <button className="bm-btn bm-btn-small" title="Clear selection" onClick={ () => setSelectedFurniIds([]) }><FaTimes size={ 11 } /></button> }
                    </div>
                    { !selectedFurniIds.length &&
                        <Text small>Click furni or drag a box around them to select.</Text> }
                    { (selectedFurniIds.length > 0) &&
                        <>
                            <div className="bm-move-pad">
                                <button className="bm-move-btn" title="Move up-left" onClick={ () => moveSelected(-1, 0) }><GrFormNextLink size="1.4em" style={ { transform: 'rotate(225deg)' } } /></button>
                                <button className="bm-move-btn" title="Move up-right" onClick={ () => moveSelected(0, -1) }><GrFormNextLink size="1.4em" style={ { transform: 'rotate(315deg)' } } /></button>
                                <button className="bm-move-btn" title="Move down-left" onClick={ () => moveSelected(0, 1) }><GrFormNextLink size="1.4em" style={ { transform: 'rotate(135deg)' } } /></button>
                                <button className="bm-move-btn" title="Move down-right" onClick={ () => moveSelected(1, 0) }><GrFormNextLink size="1.4em" style={ { transform: 'rotate(45deg)' } } /></button>
                            </div>
                            <Text small>Click furni to add or remove them from the selection.</Text>
                        </> }
                </div> }
            { flyoutsVisible && (activeTool === 'height') && pendingHeightRegion &&
                <div className="bm-flyout bm-flyout-height" style={ { top: anchorTop('height') } }>
                    <div className="bm-flyout-header">
                        <Text bold small>{ `Adjust height · ${ (pendingHeightRegion.endX - pendingHeightRegion.startX + 1) }×${ (pendingHeightRegion.endY - pendingHeightRegion.startY + 1) }` }</Text>
                    </div>
                    { pendingHeightRegion &&
                        <>
                            <div className="bm-height-row">
                                { HEIGHT_STEPS.map(step => <button key={ `up-${ step }` } className="bm-height-btn" title={ `Raise by ${ step }` } onClick={ () => adjustPendingHeight(step) }><FaChevronUp size={ 9 } /> { step }</button>) }
                            </div>
                            <div className="bm-height-row">
                                { HEIGHT_STEPS.map(step => <button key={ `down-${ step }` } className="bm-height-btn" title={ `Lower by ${ step }` } onClick={ () => adjustPendingHeight(-step) }><FaChevronDown size={ 9 } /> { step }</button>) }
                            </div>
                            <Text small>Only furni fully inside the area (highlighted blue) are affected. Drag a new area to change the selection.</Text>
                        </> }
                </div> }
        </div>
    );
}
