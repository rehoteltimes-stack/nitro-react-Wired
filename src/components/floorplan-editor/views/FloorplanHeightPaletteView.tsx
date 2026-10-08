import { FC } from 'react';
import { Column, Text } from '../../../common';
import { COLORMAP, FloorAction, HEIGHT_SCHEME, MAX_HEIGHT_VALUE, X_HEIGHT_INDEX } from '../common/Constants';
import { FloorplanEditor } from '../common/FloorplanEditor';
import { useFloorplanEditorContext } from '../FloorplanEditorContext';

// The height palette (sodaho's `pae`): one colour strip per height, highest on top, the chosen one outlined. Picking a
// height also switches to the "set tile" tool and leaves pan mode.
export const FloorplanHeightPaletteView: FC<{}> = props =>
{
    const { floorHeight = 0, setFloorHeight = null, setFloorAction = null, setIsPanMode = null } = useFloorplanEditorContext();

    const pick = (height: number) =>
    {
        setFloorHeight(height);
        setFloorAction(FloorAction.SET);

        if(setIsPanMode) setIsPanMode(false);

        FloorplanEditor.instance.actionSettings.currentAction = FloorAction.SET;
        FloorplanEditor.instance.actionSettings.currentHeight = HEIGHT_SCHEME[height + 1];
    }

    const heights: number[] = [];

    for(let height = MAX_HEIGHT_VALUE; height >= 0; height--) if((height + 1) !== X_HEIGHT_INDEX) heights.push(height);

    return (
        <Column gap={ 1 } className="floorplan-height-palette">
            <Text bold small center>{ floorHeight }</Text>
            <div className="floorplan-height-palette-strips">
                { heights.map(height =>
                {
                    const char = HEIGHT_SCHEME[height + 1];
                    const active = (floorHeight === height);

                    return <div key={ height } className={ 'floorplan-height-strip' + (active ? ' active' : '') } style={ { backgroundColor: `#${ COLORMAP[char] || '101010' }` } } title={ `${ height }` } onClick={ () => pick(height) } />;
                }) }
            </div>
        </Column>
    );
}
