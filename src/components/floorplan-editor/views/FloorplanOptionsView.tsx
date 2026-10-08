import { FC } from 'react';
import { FaBorderAll, FaCircle, FaTimesCircle, FaVectorSquare } from 'react-icons/fa';
import { LocalizeText } from '../../../api';
import { Flex, LayoutGridItem, Text } from '../../../common';
import { FloorAction } from '../common/Constants';
import { FloorplanEditor } from '../common/FloorplanEditor';
import { localizeOr } from '../common/Utils';
import { useFloorplanEditorContext } from '../FloorplanEditorContext';

// The options row of the maximised floor editor panel (sodaho's `Mlt`): draw tools, select all / deselect all, square
// select, door direction, wall and floor thickness.
export const FloorplanOptionsView: FC<{}> = props =>
{
    const { visualizationSettings = null, setVisualizationSettings = null, floorAction, setFloorAction, isSquareSelect, setIsSquareSelect, setIsPanMode } = useFloorplanEditorContext();

    const selectAction = (action: number) =>
    {
        setFloorAction(action);
        setIsPanMode(false);
        FloorplanEditor.instance.actionSettings.currentAction = action;
    }

    const changeDoorDirection = () => setVisualizationSettings(value => ({ ...value, entryPointDir: (value.entryPointDir < 7) ? (value.entryPointDir + 1) : 0 }));

    const removing = (floorAction === FloorAction.UNSET);

    return (
        <Flex gap={ 2 } alignItems="center">
            <Flex gap={ 1 } alignItems="center">
                <Text bold small>{ LocalizeText('floor.plan.editor.draw.mode') }</Text>
                <Flex gap={ 1 }>
                    <LayoutGridItem itemActive={ (floorAction === FloorAction.SET) } onClick={ () => selectAction(FloorAction.SET) }><i className="icon icon-set-tile" /></LayoutGridItem>
                    <LayoutGridItem itemActive={ (floorAction === FloorAction.UNSET) } onClick={ () => selectAction(FloorAction.UNSET) }><i className="icon icon-unset-tile" /></LayoutGridItem>
                    <LayoutGridItem itemActive={ (floorAction === FloorAction.UP) } onClick={ () => selectAction(FloorAction.UP) }><i className="icon icon-increase-height" /></LayoutGridItem>
                    <LayoutGridItem itemActive={ (floorAction === FloorAction.DOWN) } onClick={ () => selectAction(FloorAction.DOWN) }><i className="icon icon-decrease-height" /></LayoutGridItem>
                    <LayoutGridItem itemActive={ (floorAction === FloorAction.DOOR) } onClick={ () => selectAction(FloorAction.DOOR) }><i className="icon icon-set-door" /></LayoutGridItem>
                    <LayoutGridItem onClick={ () => FloorplanEditor.instance.toggleSelectAll() } title={ removing ? localizeOr('floor.plan.editor.deselect.all', 'Deselect all') : localizeOr('floor.plan.editor.select.all', 'Select all') }>
                        { removing ? <FaTimesCircle size={ 22 } /> : <FaBorderAll size={ 22 } /> }
                    </LayoutGridItem>
                    <LayoutGridItem itemActive={ isSquareSelect } onClick={ () => { setIsPanMode(false); setIsSquareSelect(value => !value); } } title="Square select">
                        { isSquareSelect ? <FaCircle size={ 18 } className="text-info" /> : <FaVectorSquare size={ 22 } /> }
                    </LayoutGridItem>
                </Flex>
            </Flex>
            <Flex gap={ 1 } alignItems="center">
                <Text bold small>{ LocalizeText('floor.plan.editor.enter.direction') }</Text>
                <i className={ `icon icon-door-direction-${ visualizationSettings.entryPointDir } cursor-pointer` } onClick={ changeDoorDirection } />
            </Flex>
            <Flex gap={ 1 } alignItems="center" className="ms-auto">
                <select className="form-control form-control-sm" value={ visualizationSettings.thicknessWall } onChange={ event => setVisualizationSettings(value => ({ ...value, thicknessWall: parseInt(event.target.value) })) }>
                    <option value={ 0 }>{ LocalizeText('navigator.roomsettings.wall_thickness.thinnest') }</option>
                    <option value={ 1 }>{ LocalizeText('navigator.roomsettings.wall_thickness.thin') }</option>
                    <option value={ 2 }>{ LocalizeText('navigator.roomsettings.wall_thickness.normal') }</option>
                    <option value={ 3 }>{ LocalizeText('navigator.roomsettings.wall_thickness.thick') }</option>
                </select>
                <select className="form-control form-control-sm" value={ visualizationSettings.thicknessFloor } onChange={ event => setVisualizationSettings(value => ({ ...value, thicknessFloor: parseInt(event.target.value) })) }>
                    <option value={ 0 }>{ LocalizeText('navigator.roomsettings.floor_thickness.thinnest') }</option>
                    <option value={ 1 }>{ LocalizeText('navigator.roomsettings.floor_thickness.thin') }</option>
                    <option value={ 2 }>{ LocalizeText('navigator.roomsettings.floor_thickness.normal') }</option>
                    <option value={ 3 }>{ LocalizeText('navigator.roomsettings.floor_thickness.thick') }</option>
                </select>
            </Flex>
        </Flex>
    );
}
