import { GetOccupiedTilesMessageComposer, GetRoomEntryTileMessageComposer, RoomEntryTileMessageEvent, RoomOccupiedTilesMessageEvent } from '@nitrots/nitro-renderer';
import { FC, useEffect, useRef, useState } from 'react';
import { FaArrowsAlt, FaMinus, FaPencilAlt, FaPlus } from 'react-icons/fa';
import { SendMessageComposer } from '../../../api';
import { Base, Column, ColumnProps } from '../../../common';
import { useMessageEvent } from '../../../hooks';
import { TILE_SIZE } from '../common/Constants';
import { FloorplanEditor } from '../common/FloorplanEditor';
import { getScreenPositionForTile } from '../common/Utils';
import { useFloorplanEditorContext } from '../FloorplanEditorContext';

const FIT_PADDING = 10;

interface FloorplanCanvasViewProps extends ColumnProps
{
    variant?: 'full' | 'mini';
}

// The 2D floor plan (sodaho's `Olt`). "full" (panel maximised): the editor canvas in a scroll box with zoom buttons
// (and a draw / pan switch on touch screens). "mini" (small panel): the used tiles fitted into the box, no input.
export const FloorplanCanvasView: FC<FloorplanCanvasViewProps> = props =>
{
    const { gap = 1, children = null, variant = 'full', ...rest } = props;
    const [ occupiedTilesReceived, setOccupiedTilesReceived ] = useState(false);
    const [ entryTileReceived, setEntryTileReceived ] = useState(false);
    const [ zoom, setZoom ] = useState(1);
    const [ touchMode, setTouchMode ] = useState<'draw' | 'pan'>('draw');
    const [ miniTransform, setMiniTransform ] = useState('scale(0.15)');
    const { originalFloorplanSettings = null, setOriginalFloorplanSettings = null, setVisualizationSettings = null, tilemapVersion = 0 } = useFloorplanEditorContext();
    const scrollRef = useRef<HTMLDivElement>(null);
    const canvasHostRef = useRef<HTMLDivElement>(null);
    const touchModeRef = useRef<'draw' | 'pan'>('draw');
    const variantRef = useRef(variant);
    const isTouch = (typeof window !== 'undefined') && ('ontouchstart' in window);

    const changeTouchMode = (mode: 'draw' | 'pan') =>
    {
        touchModeRef.current = mode;
        setTouchMode(mode);
    }

    useMessageEvent<RoomOccupiedTilesMessageEvent>(RoomOccupiedTilesMessageEvent, event =>
    {
        const parser = event.getParser();

        setOriginalFloorplanSettings(prevValue =>
        {
            const newValue = { ...prevValue };

            newValue.reservedTiles = parser.blockedTilesMap;
            FloorplanEditor.instance.setTilemap(newValue.tilemap, newValue.reservedTiles);

            return newValue;
        });

        setOccupiedTilesReceived(true);

        if((variantRef.current !== 'mini') && scrollRef.current) scrollRef.current.scrollTo((FloorplanEditor.instance.renderer.canvas.width / 3), 0);
    });

    useMessageEvent<RoomEntryTileMessageEvent>(RoomEntryTileMessageEvent, event =>
    {
        const parser = event.getParser();

        setOriginalFloorplanSettings(prevValue => ({ ...prevValue, entryPoint: [ parser.x, parser.y ], entryPointDir: parser.direction }));
        setVisualizationSettings(prevValue => ({ ...prevValue, entryPointDir: parser.direction }));

        FloorplanEditor.instance.doorLocation = { x: parser.x, y: parser.y };

        setEntryTileReceived(true);
    });

    const onPointer = (event: PointerEvent) =>
    {
        if(variantRef.current === 'mini') return;
        if((event.pointerType === 'touch') && (touchModeRef.current === 'pan')) return;

        event.preventDefault();

        switch(event.type)
        {
            case 'pointerout':
            case 'pointerup':
                FloorplanEditor.instance.onPointerRelease(event);
                break;
            case 'pointerdown':
                FloorplanEditor.instance.onPointerDown(event);
                break;
            case 'pointermove':
                FloorplanEditor.instance.onPointerMove(event);
                break;
        }
    }

    useEffect(() =>
    {
        variantRef.current = variant;

        if((variant === 'full') && scrollRef.current) scrollRef.current.scrollTo((FloorplanEditor.instance.renderer.canvas.width / 3), 0);
    }, [ variant ]);

    // mini: fit the used tiles (plus a small margin) into the box
    useEffect(() =>
    {
        if(variant !== 'mini') return;

        const element = scrollRef.current;

        if(!element) return;

        const tilemap = FloorplanEditor.instance.tilemap;
        let minX = -1, minY = -1, maxX = -1, maxY = -1;

        for(let y = 0; y < tilemap.length; y++)
        {
            if(!tilemap[y]) continue;

            for(let x = 0; x < tilemap[y].length; x++)
            {
                if(!tilemap[y][x] || (tilemap[y][x].height === 'x')) continue;

                if((minX === -1) || (x < minX)) minX = x;
                if((minY === -1) || (y < minY)) minY = y;
                if(x > maxX) maxX = x;
                if(y > maxY) maxY = y;
            }
        }

        if(minX === -1) return;

        const left = getScreenPositionForTile(minX, maxY)[0];
        const right = (getScreenPositionForTile(maxX, minY)[0] + TILE_SIZE);
        const top = getScreenPositionForTile(minX, minY)[1];
        const bottom = (getScreenPositionForTile(maxX, maxY)[1] + TILE_SIZE);
        const width = ((right - left) + (FIT_PADDING * 2));
        const height = ((bottom - top) + (FIT_PADDING * 2));
        const boxWidth = element.clientWidth, boxHeight = element.clientHeight;

        if(!boxWidth || !boxHeight) return;

        const scale = Math.min(Math.max(Math.min(boxWidth / width, boxHeight / height), 0.05), 1);
        const offsetX = ((boxWidth - (width * scale)) / 2);
        const offsetY = ((boxHeight - (height * scale)) / 2);

        element.scrollTo(0, 0);
        setMiniTransform(`translate(${ offsetX }px, ${ offsetY }px) scale(${ scale }) translate(${ -(left - FIT_PADDING) }px, ${ -(top - FIT_PADDING) }px)`);
    }, [ variant, tilemapVersion, occupiedTilesReceived ]);

    useEffect(() =>
    {
        return () =>
        {
            FloorplanEditor.instance.clear();

            setVisualizationSettings(prevValue => ({
                wallHeight: originalFloorplanSettings.wallHeight,
                thicknessWall: originalFloorplanSettings.thicknessWall,
                thicknessFloor: originalFloorplanSettings.thicknessFloor,
                entryPointDir: prevValue.entryPointDir
            }));
        }
    }, [ originalFloorplanSettings.thicknessFloor, originalFloorplanSettings.thicknessWall, originalFloorplanSettings.wallHeight, setVisualizationSettings ]);

    useEffect(() =>
    {
        if(!entryTileReceived || !occupiedTilesReceived) return;

        FloorplanEditor.instance.renderTiles();
    }, [ entryTileReceived, occupiedTilesReceived ]);

    useEffect(() =>
    {
        SendMessageComposer(new GetRoomEntryTileMessageComposer());
        SendMessageComposer(new GetOccupiedTilesMessageComposer());

        const element = scrollRef.current;

        if(!element) return;

        const host = canvasHostRef.current;

        if(host) host.appendChild(FloorplanEditor.instance.renderer.canvas);

        for(const type of [ 'pointerup', 'pointerout', 'pointerdown', 'pointermove' ]) element.addEventListener(type, onPointer);

        return () =>
        {
            for(const type of [ 'pointerup', 'pointerout', 'pointerdown', 'pointermove' ]) element.removeEventListener(type, onPointer);
        }
    }, []);

    const isMini = (variant === 'mini');

    return (
        <Column gap={ gap } { ...rest } style={ { flex: 1, position: 'relative', minWidth: 0, minHeight: 0 } }>
            <Base overflow={ isMini ? 'hidden' : 'auto' } innerRef={ scrollRef } style={ { flex: 1, minHeight: 0, touchAction: ((touchMode === 'draw') || isMini) ? 'none' : 'auto' } }>
                <div ref={ canvasHostRef } style={ { transform: isMini ? miniTransform : `scale(${ zoom })`, transformOrigin: '0 0' } } />
            </Base>
            { !isMini &&
                <div className="floorplan-canvas-zoom">
                    <button title="Zoom in" onClick={ () => setZoom(value => Math.min(value + 0.25, 2)) }><FaPlus size={ 10 } /></button>
                    <button title="Zoom out" onClick={ () => setZoom(value => Math.max(value - 0.25, 0.5)) }><FaMinus size={ 10 } /></button>
                    { isTouch &&
                        <button className={ (touchMode === 'pan') ? 'active' : '' } title={ (touchMode === 'draw') ? 'Switch to pan mode' : 'Switch to draw mode' } onClick={ () => changeTouchMode((touchMode === 'draw') ? 'pan' : 'draw') }>
                            { (touchMode === 'draw') ? <FaPencilAlt size={ 10 } /> : <FaArrowsAlt size={ 10 } /> }
                        </button> }
                </div> }
            { children }
        </Column>
    );
}

