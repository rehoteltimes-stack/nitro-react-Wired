import { FC, useCallback, useEffect, useMemo, useRef } from 'react';
import { AvatarEditorGridColorItem, CategoryData, GetConfiguration, IAvatarEditorCategoryModel } from '../../../../api';
import { AutoGrid } from '../../../../common';
import { AvatarEditorColorPickerView } from './AvatarEditorColorPickerView';
import { AvatarEditorPaletteSetItem } from './AvatarEditorPaletteSetItemView';

export interface AvatarEditorPaletteSetViewProps
{
    model: IAvatarEditorCategoryModel;
    category: CategoryData;
    paletteSet: AvatarEditorGridColorItem[];
    paletteIndex: number;
}

export const AvatarEditorPaletteSetView: FC<AvatarEditorPaletteSetViewProps> = props =>
{
    const { model = null, category = null, paletteSet = [], paletteIndex = -1 } = props;
    const elementRef = useRef<HTMLDivElement>(null);
    const hcDisabled = GetConfiguration<boolean>('hc.disabled', false);

    const selectColorIndex = useCallback((index: number) =>
    {
        if((index < 0) || !model || !category) return;

        model.selectColor(category.name, index, paletteIndex);
    }, [ model, category, paletteIndex ]);

    const selectColor = useCallback((item: AvatarEditorGridColorItem) => selectColorIndex(paletteSet.indexOf(item)), [ paletteSet, selectColorIndex ]);

    const selectedIndex = useMemo(() => paletteSet.findIndex(item => item.isSelected), [ paletteSet ]);

    useEffect(() =>
    {
        if(!model || !category || !elementRef || !elementRef.current) return;

        elementRef.current.scrollTop = 0;
    }, [ model, category ]);

    return (
        <>
            <AvatarEditorColorPickerView paletteSet={ paletteSet } selectedIndex={ selectedIndex } onSelect={ selectColorIndex } disabled={ hcDisabled } />
            <AutoGrid innerRef={ elementRef } gap={ 1 } columnCount={ 5 } columnMinWidth={ 30 }>
                { (paletteSet.length > 0) && paletteSet.map((item, index) =>
                    <AvatarEditorPaletteSetItem key={ index } colorItem={ item } onClick={ event => selectColor(item) } />) }
            </AutoGrid>
        </>
    );
}
