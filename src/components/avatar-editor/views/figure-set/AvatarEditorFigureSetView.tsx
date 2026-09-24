import { Dispatch, FC, SetStateAction, useCallback, useEffect, useMemo, useRef } from 'react';
import { AvatarEditorGridPartItem, CategoryData, IAvatarEditorCategoryModel } from '../../../../api';
import { Flex } from '../../../../common';
import { useAvatarEditorGridColumns } from '../../useAvatarEditorGridColumns';
import { AvatarEditorFigureSetItemView } from './AvatarEditorFigureSetItemView';

export interface AvatarEditorFigureSetViewProps
{
    model: IAvatarEditorCategoryModel;
    category: CategoryData;
    setMaxPaletteCount: Dispatch<SetStateAction<number>>;
}

export const AvatarEditorFigureSetView: FC<AvatarEditorFigureSetViewProps> = props =>
{
    const { model = null, category = null, setMaxPaletteCount = null } = props;
    const elementRef = useRef<HTMLDivElement>(null);
    const columnCount = useAvatarEditorGridColumns(elementRef);

    const selectPart = useCallback((item: AvatarEditorGridPartItem) =>
    {
        const index = category.parts.indexOf(item);

        if(index === -1) return;

        model.selectPart(category.name, index);

        const partItem = category.getCurrentPart();

        setMaxPaletteCount(partItem.maxColorIndex || 1);
    }, [ model, category, setMaxPaletteCount ]);

    useEffect(() =>
    {
        if(!model || !category || !elementRef || !elementRef.current) return;

        elementRef.current.scrollTop = 0;
    }, [ model, category ]);

    // Same real fixed-size/margin/row-chunking layout as AvatarEditorPaletteSetView - see useAvatarEditorGridColumns.
    const rows = useMemo(() =>
    {
        const rows: AvatarEditorGridPartItem[][] = [];

        for(let i = 0; i < category.parts.length; i += columnCount) rows.push(category.parts.slice(i, (i + columnCount)));

        return rows;
    }, [ category, columnCount ]);

    // fullWidth required, not cosmetic - see AvatarEditorPaletteSetView's own comment on the exact same pattern
    // (a sparse category with few parts would otherwise shrink this whole grid down to its own content width).
    return (
        <Flex innerRef={ elementRef } column fullWidth>
            { rows.map((row, rowIndex) =>
                <Flex key={ rowIndex } fullWidth justifyContent="center">
                    { row.map((item, index) =>
                        <AvatarEditorFigureSetItemView key={ ((rowIndex * columnCount) + index) } partItem={ item } onClick={ event => selectPart(item) } />) }
                </Flex>) }
        </Flex>
    );
}
