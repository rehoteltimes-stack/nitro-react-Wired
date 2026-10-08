import { FC, PointerEvent as ReactPointerEvent, useRef, useState } from 'react';
import { FaCaretLeft, FaCaretRight, FaCompress, FaExpand } from 'react-icons/fa';
import { LocalizeText } from '../../../api';
import { Button, ButtonGroup, Flex, Text } from '../../../common';
import { useFloorplanEditorContext } from '../FloorplanEditorContext';
import { FloorplanCanvasView } from './FloorplanCanvasView';
import { FloorplanHeightPaletteView } from './FloorplanHeightPaletteView';
import { FloorplanOptionsView } from './FloorplanOptionsView';

const DRAG_THRESHOLD = 5;

interface FloorplanLivePanelViewProps
{
    isMaximized: boolean;
    onToggleMaximize: () => void;
    onSave: () => void;
    onRevert: () => void;
    onOpenImportExport: () => void;
    onWallHeightChange: (value: number) => void;
    increaseWallHeight: () => void;
    decreaseWallHeight: () => void;
}

// The floor plan panel (sodaho's `_lt`). Small (bottom right, 240x170): the whole plan fitted in; drag it to move it,
// click it to maximise. Maximised (centred): options row, height palette + the editable plan, and a footer with
// reload / wall height / import-export / save. The header shows the tile count "total (walkable)".
export const FloorplanLivePanelView: FC<FloorplanLivePanelViewProps> = props =>
{
    const { isMaximized = false, onToggleMaximize = null, onSave = null, onRevert = null, onOpenImportExport = null, onWallHeightChange = null, increaseWallHeight = null, decreaseWallHeight = null } = props;
    const { visualizationSettings = null, areaInfo } = useFloorplanEditorContext();
    const [ position, setPosition ] = useState<{ x: number, y: number }>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const dragRef = useRef<{ startX: number, startY: number, originX: number, originY: number, moved: boolean }>(null);

    const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) =>
    {
        const panel = panelRef.current;

        if(!panel) return;

        const rect = panel.getBoundingClientRect();

        dragRef.current = { startX: event.clientX, startY: event.clientY, originX: rect.left, originY: rect.top, moved: false };
        event.currentTarget.setPointerCapture(event.pointerId);
    }

    const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) =>
    {
        const drag = dragRef.current, panel = panelRef.current;

        if(!drag || !panel) return;

        const dx = (event.clientX - drag.startX), dy = (event.clientY - drag.startY);

        if(!drag.moved && (((dx * dx) + (dy * dy)) < (DRAG_THRESHOLD * DRAG_THRESHOLD))) return;

        drag.moved = true;

        const maxX = (window.innerWidth - panel.offsetWidth), maxY = (window.innerHeight - panel.offsetHeight);

        setPosition({ x: Math.min(Math.max(drag.originX + dx, 0), Math.max(maxX, 0)), y: Math.min(Math.max(drag.originY + dy, 0), Math.max(maxY, 0)) });
    }

    const onPointerUp = () =>
    {
        const drag = dragRef.current;

        dragRef.current = null;

        if(drag && !drag.moved) onToggleMaximize();
    }

    const style = (!isMaximized && position) ? { left: position.x, top: position.y, right: 'auto', bottom: 'auto' } : undefined;

    return (
        <div ref={ panelRef } style={ style } className={ `floorplan-live-panel ${ isMaximized ? 'floorplan-live-panel--max' : 'floorplan-live-panel--mini' }` }>
            <div className="floorplan-live-panel__header">
                <Text bold small truncate>{ LocalizeText('floor.plan.editor.title') }</Text>
                <Text small className="floorplan-live-panel__area">{ areaInfo.total } ({ areaInfo.walkable })</Text>
                <button className="floorplan-live-panel__header-btn" title={ isMaximized ? 'Minimize' : 'Maximize' } onClick={ onToggleMaximize }>
                    { isMaximized ? <FaCompress size={ 12 } /> : <FaExpand size={ 12 } /> }
                </button>
            </div>
            { isMaximized &&
                <div className="floorplan-live-panel__options">
                    <FloorplanOptionsView />
                </div> }
            <div className="floorplan-live-panel__main">
                { isMaximized && <FloorplanHeightPaletteView /> }
                <FloorplanCanvasView variant={ isMaximized ? 'full' : 'mini' } overflow="hidden" />
            </div>
            { isMaximized &&
                <Flex justifyContent="between" alignItems="center" className="floorplan-live-panel__footer">
                    <Button variant="danger" onClick={ onRevert }>{ LocalizeText('floor.plan.editor.reload') }</Button>
                    <Flex gap={ 1 } alignItems="center">
                        <Text bold small>{ LocalizeText('floor.editor.wall.height') }</Text>
                        <FaCaretLeft className="cursor-pointer fa-icon" onClick={ decreaseWallHeight } />
                        <input type="number" className="form-control form-control-sm" style={ { width: 60 } } value={ visualizationSettings.wallHeight } onChange={ event => onWallHeightChange(event.target.valueAsNumber) } onKeyDown={ event => event.stopPropagation() } />
                        <FaCaretRight className="cursor-pointer fa-icon" onClick={ increaseWallHeight } />
                    </Flex>
                    <ButtonGroup>
                        <Button onClick={ onOpenImportExport }>{ LocalizeText('floor.plan.editor.import.export') }</Button>
                        <Button onClick={ onSave }>{ LocalizeText('floor.plan.editor.save') }</Button>
                    </ButtonGroup>
                </Flex> }
            { !isMaximized &&
                <div className="floorplan-live-panel__overlay" title="Drag to move, click to maximize" onPointerDown={ onPointerDown } onPointerMove={ onPointerMove } onPointerUp={ onPointerUp } onPointerCancel={ () => (dragRef.current = null) } /> }
        </div>
    );
}
