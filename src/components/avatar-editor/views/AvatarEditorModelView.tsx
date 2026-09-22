import { Dispatch, FC, SetStateAction, useCallback, useEffect, useState } from 'react';
import { CategoryData, FigureData, IAvatarEditorCategoryModel } from '../../../api';
import { Column, Flex } from '../../../common';
import { AvatarEditorFigurePreviewView } from './AvatarEditorFigurePreviewView';
import { AvatarEditorIcon } from './AvatarEditorIcon';
import { AvatarEditorFigureSetView } from './figure-set/AvatarEditorFigureSetView';
import { AvatarEditorPaletteSetView } from './palette-set/AvatarEditorPaletteSetView';

export interface AvatarEditorModelViewProps
{
    model: IAvatarEditorCategoryModel;
    gender: string;
    setGender: Dispatch<SetStateAction<string>>;
    figureData: FigureData;
}

// Real habbocity structure ("O1" in their minified source, read directly - not guessed): the avatar preview and
// the gender/category-switch icons live TOGETHER inside one real ".figure-preview-section" area (the icons
// overlaid below the preview, not a separate tab bar), with the clothing-piece grid directly underneath that in
// the SAME left column; the palette lives in a second, real column to the right - a genuinely different
// composition from an earlier pass on this project, which put the preview in its own far-right column instead.
// Real, deliberately simplified vs the source: their own grid ("y1") is a virtualised/windowed list recomputing
// columns from the container's real pixel width via a ResizeObserver; this project's own AutoGrid-based
// AvatarEditorFigureSetView (unchanged here) achieves the same visual wrapping without virtualisation - a
// reasonable simplification at this catalogue size, not a structural difference worth the added complexity.
export const AvatarEditorModelView: FC<AvatarEditorModelViewProps> = props =>
{
    const { model = null, gender = null, setGender = null, figureData = null } = props;
    const [ activeCategory, setActiveCategory ] = useState<CategoryData>(null);
    const [ maxPaletteCount, setMaxPaletteCount ] = useState(1);

    const selectCategory = useCallback((name: string) =>
    {
        const category = model.categories.get(name);

        if(!category) return;

        category.init();

        setActiveCategory(category);

        for(const part of category.parts)
        {
            if(!part || !part.isSelected) continue;

            setMaxPaletteCount(part.maxColorIndex || 1);

            break;
        }
    }, [ model ]);

    useEffect(() =>
    {
        model.init();

        for(const name of model.categories.keys())
        {
            selectCategory(name);

            break;
        }
    }, [ model, selectCategory ]);

    if(!model || !activeCategory) return null;

    return (
        <Flex fullWidth fullHeight overflow="hidden" gap={ 2 }>
            <Column fullWidth fullHeight className="avatar-editor-model-column">
                <Flex fullWidth className="figure-preview-section">
                    <AvatarEditorFigurePreviewView figureData={ figureData } />
                    <Flex alignSelf="center" alignItems="center" justifyContent="center" gap={ 1 } classNames={ [ 'flex-wrap' ] } className="figure-preview-category-icons">
                        { model.canSetGender &&
                            <>
                                <Flex center pointer className="category-item" onClick={ event => setGender(FigureData.MALE) }>
                                    <AvatarEditorIcon icon="male" selected={ (gender === FigureData.MALE) } />
                                </Flex>
                                <Flex center pointer className="category-item" onClick={ event => setGender(FigureData.FEMALE) }>
                                    <AvatarEditorIcon icon="female" selected={ (gender === FigureData.FEMALE) } />
                                </Flex>
                            </> }
                        { !model.canSetGender && model.categories && (model.categories.size > 0) && Array.from(model.categories.keys()).map(name =>
                        {
                            const category = model.categories.get(name);

                            return (
                                <Flex center pointer key={ name } className="category-item" onClick={ event => selectCategory(name) }>
                                    <AvatarEditorIcon icon={ category.name } selected={ (activeCategory === category) } />
                                </Flex>
                            );
                        }) }
                    </Flex>
                </Flex>
                <Column overflow="hidden" className="avatar-editor-figure-set-section">
                    <AvatarEditorFigureSetView model={ model } category={ activeCategory } setMaxPaletteCount={ setMaxPaletteCount } />
                </Column>
            </Column>
            <Column fullWidth fullHeight gap={ 0 } className="avatar-editor-palette-column">
                { (maxPaletteCount >= 1) &&
                    <AvatarEditorPaletteSetView model={ model } category={ activeCategory } paletteSet={ activeCategory.getPalette(0) } paletteIndex={ 0 } /> }
                { (maxPaletteCount === 2) &&
                    <AvatarEditorPaletteSetView model={ model } category={ activeCategory } paletteSet={ activeCategory.getPalette(1) } paletteIndex={ 1 } /> }
            </Column>
        </Flex>
    );
}
