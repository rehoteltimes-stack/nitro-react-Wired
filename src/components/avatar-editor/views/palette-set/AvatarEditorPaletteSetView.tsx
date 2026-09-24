import { ColorConverter } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useMemo, useRef } from 'react';
import { AvatarEditorGridColorItem, CategoryData, IAvatarEditorCategoryModel } from '../../../../api';
import { Flex } from '../../../../common';
import { useAvatarEditorGridColumns } from '../../useAvatarEditorGridColumns';
import { AvatarEditorPaletteSetItem } from './AvatarEditorPaletteSetItemView';

export interface AvatarEditorPaletteSetViewProps
{
    model: IAvatarEditorCategoryModel;
    category: CategoryData;
    paletteSet: AvatarEditorGridColorItem[];
    paletteIndex: number;
    // Restored per explicit user direction after removing it - reverting to the state where dragging the
    // colour picker filters this palette down by CIE-Lab colour distance to the dragged target colour.
    targetColor?: number;
    targetTolerance?: number;
    canReplaceParts?: boolean;
}

export const AvatarEditorPaletteSetView: FC<AvatarEditorPaletteSetViewProps> = props =>
{
    const { model = null, category = null, paletteSet = [], paletteIndex = -1, targetColor = null, targetTolerance = 0.3, canReplaceParts = false } = props;
    const elementRef = useRef<HTMLDivElement>(null);
    const columnCount = useAvatarEditorGridColumns(elementRef);

    const selectColor = useCallback((item: AvatarEditorGridColorItem) =>
    {
        const index = paletteSet.indexOf(item);

        if(index === -1) return;

        model.selectColor(category.name, index, paletteIndex);
    }, [ model, category, paletteSet, paletteIndex ]);

    const visiblePalette = useMemo(() =>
    {
        let items = paletteSet;

        if(!canReplaceParts) items = items.filter(item => (item.partColor.id !== 0));

        if(targetColor === null) return items;

        const targetLab = ColorConverter.rgb2CieLab(targetColor);
        const maxDistance = (100 * targetTolerance);

        return items.filter(item =>
        {
            const itemLab = ColorConverter.rgb2CieLab(item.partColor.rgb);
            const distance = Math.sqrt(
                Math.pow((targetLab.x - itemLab.x), 2) +
                Math.pow((targetLab.y - itemLab.y), 2) +
                Math.pow((targetLab.z - itemLab.z), 2));

            return (distance <= maxDistance);
        });
    }, [ paletteSet, canReplaceParts, targetColor, targetTolerance ]);

    useEffect(() =>
    {
        if(!model || !category || !elementRef || !elementRef.current) return;

        elementRef.current.scrollTop = 0;
    }, [ model, category ]);

    const rows = useMemo(() =>
    {
        const rows: AvatarEditorGridColorItem[][] = [];

        for(let i = 0; i < visiblePalette.length; i += columnCount) rows.push(visiblePalette.slice(i, (i + columnCount)));

        return rows;
    }, [ visiblePalette, columnCount ]);

    // fullWidth is required, not cosmetic: without it this column shrinks-to-fit its own content, so any time
    // filtering leaves every row with fewer than columnCount items, the whole grid visibly shrinks down to that
    // smaller content width instead of staying full width - this is what made the grid look "cut in half"
    // whenever the target-colour filter had narrowed the palette down.
    return (
        <Flex innerRef={ elementRef } column fullWidth>
            { rows.map((row, rowIndex) =>
                <Flex key={ rowIndex } fullWidth justifyContent="center">
                    { row.map((item, index) =>
                        <AvatarEditorPaletteSetItem key={ ((rowIndex * columnCount) + index) } colorItem={ item } onClick={ event => selectColor(item) } />) }
                </Flex>) }
        </Flex>
    );
}
