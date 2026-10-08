import { FloorHeightMapEvent, GetOccupiedTilesMessageComposer, GetRoomEntryTileMessageComposer, ILinkEventTracker, RoomEngineEvent, RoomVisualizationSettingsEvent, UpdateFloorPropertiesMessageComposer } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { AddEventLinkTracker, GetRoomSession, RemoveLinkEventTracker, SendMessageComposer } from '../../api';
import { useMessageEvent, useNotification, useRoomEngineEvent } from '../../hooks';
import { FloorAction, HEIGHT_SCHEME, MAX_WALL_HEIGHT, MIN_WALL_HEIGHT } from './common/Constants';
import { FloorplanEditor } from './common/FloorplanEditor';
import { ApplyTilemapToRoom, FloorplanRoomPainter, HideAreaPreview, HideRoomGrid, ShowAreaPreview, ShowRoomGrid } from './common/FloorplanRoomLive';
import { IFloorplanSettings } from './common/IFloorplanSettings';
import { IVisualizationSettings } from './common/IVisualizationSettings';
import { convertNumbersForSaving, convertSettingToNumber } from './common/Utils';
import { FloorplanEditorContextProvider } from './FloorplanEditorContext';
import { FloorplanEditToolbarView } from './views/FloorplanEditToolbarView';
import { FloorplanImportExportView } from './views/FloorplanImportExportView';
import { FloorplanLivePanelView } from './views/FloorplanLivePanelView';

const SAVE_FEEDBACK_WINDOW = 8000;

// 1:1 port of sodaho.tel's floor editor (their `Dlt` and helpers, read from their minified client 2026-09-29): not a
// window but an edit mode of the room. body.floorplan-edit-mode hides the toolbar (except the chat input), purse and
// room tools; a tool strip sits on the left; the floor plan panel floats bottom right (click to maximise). Every edit
// shows in the room at once (ApplyTilemapToRoom), tiles can be painted straight on the room (FloorplanRoomPainter),
// and closing without saving puts the received floor plan back. Colours follow the theme tokens (own-feature rule),
// structure / sizes / behaviour follow theirs.
export const FloorplanEditorView: FC<{}> = props =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const [ isMaximized, setIsMaximized ] = useState(false);
    const [ importExportVisible, setImportExportVisible ] = useState(false);
    const [ originalFloorplanSettings, setOriginalFloorplanSettings ] = useState<IFloorplanSettings>({ tilemap: '', reservedTiles: [], entryPoint: [ 0, 0 ], entryPointDir: 2, wallHeight: -1, thicknessWall: 1, thicknessFloor: 1 });
    const [ visualizationSettings, setVisualizationSettings ] = useState<IVisualizationSettings>({ entryPointDir: 2, wallHeight: -1, thicknessWall: 1, thicknessFloor: 1 });
    const [ floorHeight, setFloorHeight ] = useState(0);
    const [ floorAction, setFloorAction ] = useState(FloorAction.NONE);
    const [ isPanMode, setIsPanMode ] = useState(false);
    const [ isSquareSelect, setIsSquareSelect ] = useState(false);
    const [ tilemapVersion, setTilemapVersion ] = useState(0);
    const [ areaInfo, setAreaInfo ] = useState({ total: 0, walkable: 0 });
    const { showFeedback = null } = useNotification();
    const wallHeightRef = useRef(visualizationSettings.wallHeight);
    const originalRef = useRef(originalFloorplanSettings);
    const saveTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
    const visibleRef = useRef(false);

    wallHeightRef.current = visualizationSettings.wallHeight;
    visibleRef.current = isVisible;
    originalRef.current = originalFloorplanSettings;

    // show the edited map in the room
    const applyToRoom = useCallback(() =>
    {
        if(!GetRoomSession()) return;

        const tilemap = FloorplanEditor.instance.tilemap;

        if(!tilemap || !tilemap.length) return;

        ApplyTilemapToRoom(FloorplanEditor.instance.getCurrentTilemapString(), FloorplanEditor.instance.doorLocation.x, FloorplanEditor.instance.doorLocation.y, (wallHeightRef.current - 1));
    }, []);

    const countArea = useCallback(() =>
    {
        const tilemap = FloorplanEditor.instance.tilemap;
        let total = 0, walkable = 0;

        for(const row of (tilemap || []))
        {
            if(!row) continue;

            for(const tile of row)
            {
                if(!tile || (tile.height === 'x')) continue;

                total++;

                if(!tile.isBlocked) walkable++;
            }
        }

        setAreaInfo({ total, walkable });
    }, []);

    useEffect(() =>
    {
        FloorplanEditor.instance.actionSettings.currentAction = floorAction;
        FloorplanEditor.instance.actionSettings.currentHeight = HEIGHT_SCHEME[floorHeight + 1];
    }, [ floorHeight, floorAction ]);

    // every tilemap change: count tiles, bump the version, and show it in the room (once per animation frame)
    useEffect(() =>
    {
        if(!isVisible) return;

        let frame = 0;

        FloorplanEditor.instance.onTilemapChange = () =>
        {
            setTilemapVersion(value => (value + 1));
            countArea();

            if(!frame) frame = requestAnimationFrame(() => { frame = 0; applyToRoom(); });
        };

        return () =>
        {
            if(frame) cancelAnimationFrame(frame);

            FloorplanEditor.instance.onTilemapChange = null;
        };
    }, [ isVisible, countArea, applyToRoom ]);

    useEffect(() =>
    {
        if(isVisible) applyToRoom();
    }, [ isVisible, visualizationSettings.wallHeight, applyToRoom ]);

    // edit mode on: paint on the room, grid overlay, body class; off: put the received map back
    useEffect(() =>
    {
        if(!isVisible) return;

        setIsMaximized(false);
        setIsPanMode(false);
        setIsSquareSelect(false);
        setFloorAction(FloorAction.NONE);
        FloorplanEditor.instance.actionSettings.currentAction = FloorAction.NONE;

        FloorplanRoomPainter.activate((x, y, isFirst) =>
        {
            if(isFirst) FloorplanEditor.instance.beginStroke();

            FloorplanEditor.instance.applyToTile(x, y);
        });
        FloorplanRoomPainter.onAreaPreview = (startX, startY, endX, endY) => ShowAreaPreview(startX, startY, endX, endY);
        FloorplanRoomPainter.onAreaCommit = (startX, startY, endX, endY) =>
        {
            HideAreaPreview();
            FloorplanEditor.instance.applyToArea(startX, startY, endX, endY);
        };

        ShowRoomGrid();
        document.body.classList.add('floorplan-edit-mode');

        return () =>
        {
            document.body.classList.remove('floorplan-edit-mode');
            HideRoomGrid();
            FloorplanRoomPainter.deactivate();

            const original = originalRef.current;

            if(GetRoomSession() && original.tilemap) ApplyTilemapToRoom(original.tilemap, original.entryPoint[0], original.entryPoint[1], (original.wallHeight - 1));
        };
    }, [ isVisible ]);

    useEffect(() =>
    {
        if(isVisible) FloorplanRoomPainter.panMode = isPanMode;
    }, [ isVisible, isPanMode ]);

    // painting on empty space (outside the room) only adds tiles, so it is only on with the "set tile" tool
    useEffect(() =>
    {
        if(isVisible) FloorplanRoomPainter.voidPaintEnabled = (floorAction === FloorAction.SET);
    }, [ isVisible, floorAction ]);

    // one area-select switch for both the room and the 2D plan
    useEffect(() =>
    {
        if(!isVisible) return;

        FloorplanRoomPainter.squareSelectMode = isSquareSelect;

        if(FloorplanEditor.instance.isSquareSelectMode !== isSquareSelect) FloorplanEditor.instance.toggleSquareSelectMode();
        if(!isSquareSelect) HideAreaPreview();
    }, [ isVisible, isSquareSelect ]);

    const saveFloorChanges = () =>
    {
        if(saveTimerRef.current) clearTimeout(saveTimerRef.current);

        saveTimerRef.current = setTimeout(() => (saveTimerRef.current = null), SAVE_FEEDBACK_WINDOW);

        SendMessageComposer(new UpdateFloorPropertiesMessageComposer(
            FloorplanEditor.instance.getCurrentTilemapString(),
            FloorplanEditor.instance.doorLocation.x,
            FloorplanEditor.instance.doorLocation.y,
            visualizationSettings.entryPointDir,
            convertNumbersForSaving(visualizationSettings.thicknessWall),
            convertNumbersForSaving(visualizationSettings.thicknessFloor),
            (visualizationSettings.wallHeight - 1)
        ));
    }

    const revertChanges = () =>
    {
        setVisualizationSettings({ wallHeight: originalFloorplanSettings.wallHeight, thicknessWall: originalFloorplanSettings.thicknessWall, thicknessFloor: originalFloorplanSettings.thicknessFloor, entryPointDir: originalFloorplanSettings.entryPointDir });

        FloorplanEditor.instance.doorLocation = { x: originalFloorplanSettings.entryPoint[0], y: originalFloorplanSettings.entryPoint[1] };
        FloorplanEditor.instance.setTilemap(originalFloorplanSettings.tilemap, originalFloorplanSettings.reservedTiles);
        FloorplanEditor.instance.renderTiles();
    }

    const setWallHeight = (value: number) =>
    {
        if(isNaN(value) || (value <= 0)) value = MIN_WALL_HEIGHT;
        if(value > MAX_WALL_HEIGHT) value = MAX_WALL_HEIGHT;

        setVisualizationSettings(prevValue => ({ ...prevValue, wallHeight: value }));
    }

    const increaseWallHeight = () => setWallHeight(Math.min(visualizationSettings.wallHeight + 1, MAX_WALL_HEIGHT));

    const decreaseWallHeight = () =>
    {
        const value = (visualizationSettings.wallHeight - 1);

        setWallHeight((value <= 0) ? MIN_WALL_HEIGHT : value);
    }

    useRoomEngineEvent<RoomEngineEvent>(RoomEngineEvent.DISPOSED, event => setIsVisible(false));

    // saving reloads the room (the server forwards everyone back in), which builds a new room canvas and geometry: the grid
    // is rebuilt on it, furni go see-through again, and the door + occupied tiles are asked again so the plan matches the
    // saved map (the new heightmap itself arrives through FloorHeightMapEvent)
    useRoomEngineEvent<RoomEngineEvent>(RoomEngineEvent.INITIALIZED, event =>
    {
        if(!visibleRef.current) return;

        setTimeout(() =>
        {
            if(!visibleRef.current) return;

            ShowRoomGrid();
            SendMessageComposer(new GetRoomEntryTileMessageComposer());
            SendMessageComposer(new GetOccupiedTilesMessageComposer());
        }, 300);
    });

    useMessageEvent<FloorHeightMapEvent>(FloorHeightMapEvent, event =>
    {
        const parser = event.getParser();

        if(saveTimerRef.current)
        {
            clearTimeout(saveTimerRef.current);
            saveTimerRef.current = null;

            if(showFeedback) showFeedback('Floorplan saved!', 'success');
        }

        setOriginalFloorplanSettings(prevValue => ({ ...prevValue, tilemap: parser.model, wallHeight: (parser.wallHeight + 1) }));
        setVisualizationSettings(prevValue => ({ ...prevValue, wallHeight: (parser.wallHeight + 1) }));
    });

    useMessageEvent<RoomVisualizationSettingsEvent>(RoomVisualizationSettingsEvent, event =>
    {
        const parser = event.getParser();

        setOriginalFloorplanSettings(prevValue => ({ ...prevValue, thicknessFloor: convertSettingToNumber(parser.thicknessFloor), thicknessWall: convertSettingToNumber(parser.thicknessWall) }));
        setVisualizationSettings(prevValue => ({ ...prevValue, thicknessFloor: convertSettingToNumber(parser.thicknessFloor), thicknessWall: convertSettingToNumber(parser.thicknessWall) }));
    });

    useEffect(() =>
    {
        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) =>
            {
                const parts = url.split('/');

                if(parts.length < 2) return;

                switch(parts[1])
                {
                    case 'show':
                        if(!GetRoomSession()) return;
                        setIsVisible(true);
                        return;
                    case 'hide':
                        setIsVisible(false);
                        return;
                    case 'toggle':
                        if(!GetRoomSession())
                        {
                            setIsVisible(false);
                            return;
                        }
                        setIsVisible(prevValue => !prevValue);
                        return;
                }
            },
            eventUrlPrefix: 'floor-editor/'
        };

        AddEventLinkTracker(linkTracker);

        return () => RemoveLinkEventTracker(linkTracker);
    }, []);

    return (
        <FloorplanEditorContextProvider value={ { originalFloorplanSettings, setOriginalFloorplanSettings, visualizationSettings, setVisualizationSettings, floorHeight, setFloorHeight, floorAction, setFloorAction, isPanMode, setIsPanMode, isSquareSelect, setIsSquareSelect, tilemapVersion, areaInfo } }>
            { isVisible &&
                <>
                    <FloorplanEditToolbarView onSave={ saveFloorChanges } onRevert={ revertChanges } onExit={ () => setIsVisible(false) } onWallHeightChange={ setWallHeight } increaseWallHeight={ increaseWallHeight } decreaseWallHeight={ decreaseWallHeight } />
                    <FloorplanLivePanelView isMaximized={ isMaximized } onToggleMaximize={ () => setIsMaximized(value => !value) } onSave={ saveFloorChanges } onRevert={ revertChanges } onOpenImportExport={ () => setImportExportVisible(true) } onWallHeightChange={ setWallHeight } increaseWallHeight={ increaseWallHeight } decreaseWallHeight={ decreaseWallHeight } />
                </> }
            { importExportVisible &&
                <FloorplanImportExportView onCloseClick={ () => setImportExportVisible(false) } /> }
        </FloorplanEditorContextProvider>
    );
}
