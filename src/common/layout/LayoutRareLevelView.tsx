import { FC, useMemo } from 'react';
import { Base, BaseProps } from '..';
import { GetConfiguration } from '../../api';

interface LayoutRareLevelViewProps extends BaseProps<HTMLDivElement>
{
    level: string;
}

// Port of the reference's rare plate (`W0`): a .nitro-rare-level box whose inline background is the plate image of the
// furni's rarity level. The reference builds the URL from base.assets.url/c_images/rare_plates/v2/rare_<level>.png;
// here the plates are the hCMS tier icons published as c_images/rare_plates/<tier code>.png.
export const LayoutRareLevelView: FC<LayoutRareLevelViewProps> = props =>
{
    const { level = '', classNames = [], style = {}, children = null, ...rest } = props;

    const getClassNames = useMemo(() =>
    {
        const newClassNames: string[] = [ 'nitro-rare-level' ];

        if(classNames.length) newClassNames.push(...classNames);

        return newClassNames;
    }, [ classNames ]);

    return <Base classNames={ getClassNames } style={ { ...style, background: `url(${ GetConfiguration<string>('asset.url') }/c_images/rare_plates/${ level }.png)` } } { ...rest }>{ children }</Base>;
}
