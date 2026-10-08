import { FC, useState } from 'react';
import { FaArrowsAlt, FaCaretLeft, FaCaretRight, FaCog, FaHistory, FaRedo, FaSave, FaSearchMinus, FaSearchPlus, FaTimes, FaUndo, FaVectorSquare } from 'react-icons/fa';
import { GetRoomEngine, LocalizeText } from '../../../api';
import { Text } from '../../../common';
import { COLORMAP, FloorAction, HEIGHT_SCHEME } from '../common/Constants';
import { FloorplanEditor } from '../common/FloorplanEditor';
import { localizeOr } from '../common/Utils';
import { useFloorplanEditorContext } from '../FloorplanEditorContext';
import { FloorplanHeightPaletteView } from './FloorplanHeightPaletteView';

interface FloorplanEditToolbarViewProps
{
    onSave: () => void;
    onRevert: () => void;
    onExit: () => void;
    onWallHeightChange: (value: number) => void;
    increaseWallHeight: () => void;
    decreaseWallHeight: () => void;
}

const TOOLS = [
    { action: FloorAction.SET, icon: 'icon-set-tile', title: 'Set tile' },
    { action: FloorAction.UNSET, icon: 'icon-unset-tile', title: 'Remove tile' },
    { action: FloorAction.UP, icon: 'icon-increase-height', title: 'Raise height' },
    { action: FloorAction.DOWN, icon: 'icon-decrease-height', title: 'Lower height' },
    { action: FloorAction.DOOR, icon: 'icon-set-door', title: 'Set door' }
];

// The vertical tool strip on the left of the room while editing the floor (sodaho's `Nlt`, same buttons, order,
// titles and icons): tools + area select + height chip | pan, zoom, settings, undo, redo, reload | save, exit.
// The height chip and the settings button open a flyout beside the strip.
export const FloorplanEditToolbarView: FC<FloorplanEditToolbarViewProps> = props =>
{
    const { onSave = null, onRevert = null, onExit = null, onWallHeightChange = null, increaseWallHeight = null, decreaseWallHeight = null } = props;
    const { visualizationSettings = null, setVisualizationSettings = null, floorHeight, floorAction, setFloorAction, isPanMode, setIsPanMode, isSquareSelect, setIsSquareSelect } = useFloorplanEditorContext();
    const [ flyout, setFlyout ] = useState<'height' | 'settings'>(null);

    const selectAction = (action: number) =>
    {
        setIsPanMode(false);
        setFloorAction(action);
        FloorplanEditor.instance.actionSettings.currentAction = action;
    }

    const toggleSquareSelect = () =>
    {
        setIsPanMode(false);
        setIsSquareSelect(value => !value);
    }

    // zoom doubles / halves between 0.5 and 2, like theirs
    const zoom = (direction: number) =>
    {
        const engine = GetRoomEngine();
        const roomId = engine.activeRoomId;
        const scale = engine.getRoomInstanceRenderingCanvasScale(roomId, 1);

        engine.setRoomInstanceRenderingCanvasScale(roomId, 1, (direction > 0) ? Math.min(scale * 2, 2) : Math.max(scale / 2, 0.5));
    }

    const toggleFlyout = (name: 'height' | 'settings') => setFlyout(value => ((value === name) ? null : name));

    const changeDoorDirection = () => setVisualizationSettings(value => ({ ...value, entryPointDir: (value.entryPointDir < 7) ? (value.entryPointDir + 1) : 0 }));

    const heightColor = COLORMAP[HEIGHT_SCHEME[floorHeight + 1]] || '101010';

    return (
        <div className="floorplan-edit-toolbar">
            <div className="fpe-btn-group">
                { TOOLS.map(tool =>
                    <button key={ tool.action } className={ `fpe-btn ${ ((floorAction === tool.action) && !isPanMode) ? 'active' : '' }` } title={ tool.title } onClick={ () => selectAction(tool.action) }>
                        <i className={ `icon ${ tool.icon }` } />
                    </button>) }
                <button className={ `fpe-btn ${ isSquareSelect ? 'active' : '' }` } title="Select area (drag a rectangle of tiles)" onClick={ toggleSquareSelect }>
                    <FaVectorSquare size={ 15 } />
                </button>
                <button className={ `fpe-btn ${ (flyout === 'height') ? 'active' : '' }` } title="Tile height" onClick={ () => toggleFlyout('height') }>
                    <div className="fpe-height-chip" style={ { backgroundColor: `#${ heightColor }` } }>{ floorHeight }</div>
                </button>
            </div>
            <div className="fpe-btn-group">
                <button className={ `fpe-btn ${ isPanMode ? 'active' : '' }` } title="Pan the room (drag without painting)" onClick={ () => setIsPanMode(value => !value) }>
                    <FaArrowsAlt size={ 15 } />
                </button>
                <button className="fpe-btn" title="Zoom in" onClick={ () => zoom(1) }><FaSearchPlus size={ 14 } /></button>
                <button className="fpe-btn" title="Zoom out" onClick={ () => zoom(-1) }><FaSearchMinus size={ 14 } /></button>
                <button className={ `fpe-btn ${ (flyout === 'settings') ? 'active' : '' }` } title="Settings" onClick={ () => toggleFlyout('settings') }><FaCog size={ 16 } /></button>
                <button className="fpe-btn" title="Undo" onClick={ () => FloorplanEditor.instance.undo() }><FaUndo size={ 14 } /></button>
                <button className="fpe-btn" title="Redo" onClick={ () => FloorplanEditor.instance.redo() }><FaRedo size={ 14 } /></button>
                <button className="fpe-btn" title={ LocalizeText('floor.plan.editor.reload') } onClick={ onRevert }><FaHistory size={ 14 } /></button>
            </div>
            <div className="fpe-btn-group">
                <button className="fpe-btn fpe-btn-save" title={ LocalizeText('floor.plan.editor.save') } onClick={ onSave }><FaSave size={ 15 } /></button>
                <button className="fpe-btn fpe-btn-exit" title="Exit floor editor" onClick={ onExit }><FaTimes size={ 16 } /></button>
            </div>
            { (flyout === 'height') &&
                <div className="fpe-flyout fpe-flyout-height">
                    <FloorplanHeightPaletteView />
                </div> }
            { (flyout === 'settings') &&
                <div className="fpe-flyout fpe-flyout-settings">
                    <div className="fpe-flyout-row">
                        <Text bold small>{ LocalizeText('floor.plan.editor.enter.direction') }</Text>
                        <i className={ `icon icon-door-direction-${ visualizationSettings.entryPointDir } cursor-pointer` } onClick={ changeDoorDirection } />
                    </div>
                    <div className="fpe-flyout-row">
                        <Text bold small>{ localizeOr('navigator.roomsettings.wall_thickness', 'Walls') }</Text>
                        <select className="form-control form-control-sm" value={ visualizationSettings.thicknessWall } onChange={ event => setVisualizationSettings(value => ({ ...value, thicknessWall: parseInt(event.target.value) })) }>
                            <option value={ 0 }>{ LocalizeText('navigator.roomsettings.wall_thickness.thinnest') }</option>
                            <option value={ 1 }>{ LocalizeText('navigator.roomsettings.wall_thickness.thin') }</option>
                            <option value={ 2 }>{ LocalizeText('navigator.roomsettings.wall_thickness.normal') }</option>
                            <option value={ 3 }>{ LocalizeText('navigator.roomsettings.wall_thickness.thick') }</option>
                        </select>
                    </div>
                    <div className="fpe-flyout-row">
                        <Text bold small>{ localizeOr('navigator.roomsettings.floor_thickness', 'Floor') }</Text>
                        <select className="form-control form-control-sm" value={ visualizationSettings.thicknessFloor } onChange={ event => setVisualizationSettings(value => ({ ...value, thicknessFloor: parseInt(event.target.value) })) }>
                            <option value={ 0 }>{ LocalizeText('navigator.roomsettings.floor_thickness.thinnest') }</option>
                            <option value={ 1 }>{ LocalizeText('navigator.roomsettings.floor_thickness.thin') }</option>
                            <option value={ 2 }>{ LocalizeText('navigator.roomsettings.floor_thickness.normal') }</option>
                            <option value={ 3 }>{ LocalizeText('navigator.roomsettings.floor_thickness.thick') }</option>
                        </select>
                    </div>
                    <div className="fpe-flyout-row">
                        <Text bold small>{ LocalizeText('floor.editor.wall.height') }</Text>
                        <div className="fpe-wall-height">
                            <FaCaretLeft className="cursor-pointer fa-icon" onClick={ decreaseWallHeight } />
                            <input type="number" className="form-control form-control-sm" value={ visualizationSettings.wallHeight } onChange={ event => onWallHeightChange(event.target.valueAsNumber) } onKeyDown={ event => event.stopPropagation() } />
                            <FaCaretRight className="cursor-pointer fa-icon" onClick={ increaseWallHeight } />
                        </div>
                    </div>
                </div> }
        </div>
    );
}
