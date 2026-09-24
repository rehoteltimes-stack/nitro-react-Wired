import { Dispatch, FC, SetStateAction, useCallback, useEffect, useState } from 'react';
import { CategoryData, FigureData, IAvatarEditorCategoryModel } from '../../../api';
import { Flex, LayoutGridItem, ScrollContainer } from '../../../common';
import { AvatarEditorColorPickerView } from './AvatarEditorColorPickerView';
import { AvatarEditorFigurePreviewView } from './AvatarEditorFigurePreviewView';
import { AvatarEditorIcon } from './AvatarEditorIcon';
import { AvatarEditorFigureSetView } from './figure-set/AvatarEditorFigureSetView';
import { AvatarEditorPaletteSetView } from './palette-set/AvatarEditorPaletteSetView';

export interface AvatarEditorModelViewProps
{
    model: IAvatarEditorCategoryModel;
    figureData: FigureData;
    gender: string;
    setGender: Dispatch<SetStateAction<string>>;
}

// Real reference structure (verified via CDP outerHTML on the live avatar editor): a LEFT column
// (figure-preview + rotate arrows + gender/category icon row, then the item grid) beside a RIGHT column
// (the colour-picker row, then the palette grid) - not the old col-2/col-5/col-5 three-way split this
// component used before (that split put the figure preview in a completely separate place, owned by
// AvatarEditorView itself, alongside the action buttons - neither matches the reference).
export const AvatarEditorModelView: FC<AvatarEditorModelViewProps> = props =>
{
    const { model = null, figureData = null, gender = null, setGender = null } = props;
    const [ activeCategory, setActiveCategory ] = useState<CategoryData>(null);
    const [ maxPaletteCount, setMaxPaletteCount ] = useState(1);
    // Default colour matches the reference's own real `useState(16696703)` - 16696703 decimal is exactly
    // 0xFEC57F, confirmed by converting it back.
    const [ pickerColor, setPickerColor ] = useState(0xFEC57F);
    const [ isCustomColorActive, setIsCustomColorActive ] = useState(false);
    // Restored per explicit user direction: dragging the colour picker filters the palette grid by CIE-Lab
    // colour distance to the dragged target colour. Kept separate from isCustomColorActive so enabling the
    // picker (fading it in, making it draggable) doesn't immediately filter using the still-untouched default
    // colour - filtering starts only once the user actually adjusts a slider, and resets when the picker is
    // turned back off so re-enabling it starts fresh (unfiltered) again.
    const [ hasAdjustedColor, setHasAdjustedColor ] = useState(false);
    const targetColor = (isCustomColorActive && hasAdjustedColor) ? pickerColor : null;

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
        <Flex fullWidth fullHeight gap={ 2 } overflow="hidden">
            <Flex column fullWidth fullHeight gap={ 2 } grow>
                { /* Real reference measurement (verified via CDP on the live avatar editor): this row and the
                     item-grid row below it split the column's height exactly 50/50 (146.5px/146.5px each on a
                     309px-tall column). .figure-preview-section's own real CSS (_32-nitro-avatar.scss) sets
                     `height: 0` as its flex-basis and relies on flex-grow to fill the rest - but that only
                     produces an even split when the OTHER row also starts from a 0 basis; without a matching
                     explicit flexBasis on the item-grid row below, it was claiming its own full natural content
                     height first (as many rows as the current category's parts need), leaving this row 0px. */ }
                <Flex fullWidth grow style={ { flexBasis: 0 } } classNames={ [ 'figure-preview-section' ] }>
                    <AvatarEditorFigurePreviewView figureData={ figureData } />
                    { /* Real reference measurement (verified on the live editor's HEAD tab, which has 5
                         category icons instead of 2 gender icons): this row and .figure-preview-container
                         split the section's width exactly 50/50 (123.375px each) NO MATTER how many icons are
                         in it - more icons wrap onto more internal rows rather than stealing width from the
                         avatar preview. Without a matching flex-basis/grow here, this row's own natural
                         content width (which grows with icon count) was squeezing the preview container down
                         to as little as 30px wide for the 5-icon HEAD tab, overflowing the 90px-wide avatar
                         image out of its box. */ }
                    <Flex grow style={ { flexBasis: 0 } } gap={ 1 } alignSelf="center" alignItems="center" justifyContent="center" classNames={ [ 'flex-wrap' ] }>
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
                <Flex column overflow="hidden" gap={ 2 } grow style={ { flexBasis: 0 } }>
                    <ScrollContainer>
                        <AvatarEditorFigureSetView model={ model } category={ activeCategory } setMaxPaletteCount={ setMaxPaletteCount } />
                    </ScrollContainer>
                </Flex>
            </Flex>
            <Flex column fullWidth fullHeight>
                <Flex gap={ 2 } alignItems="center">
                    <AvatarEditorColorPickerView value={ pickerColor } onChange={ value => { setPickerColor(value); setHasAdjustedColor(true); } } disabled={ !isCustomColorActive } />
                    { /* Real reference behaviour (traced through the live minified source): clicking this
                         swatch is what toggles custom-colour mode on/off - while active it shows the actual
                         picked colour instead of the rainbow ring, and the picker sliders become interactive. */ }
                    <LayoutGridItem itemHighlight classNames={ [ 'avatar-editor-palette-set-item', 'color-preview' ] } pointer onClick={ event => setIsCustomColorActive(value => { if(value) setHasAdjustedColor(false); return !value; }) } style={ { background: isCustomColorActive ? `#${ pickerColor.toString(16).padStart(6, '0') }` : 'conic-gradient(from 90deg, rgb(140, 54, 226), rgb(85, 58, 223), rgb(54, 112, 226), rgb(41, 224, 102), rgb(235, 221, 71), rgb(235, 145, 55), rgb(230, 51, 81), rgb(140, 54, 226))' } } />
                </Flex>
                { /* Real reference structure (verified via CDP on a live 2-colour torso item): a two-colour
                     part gets TWO SEPARATE .scroll-container elements, each independently scrollable and each
                     exactly half the available height (122.8px/122.8px on a 253.6px-tall area) - not one
                     shared scroll area with both palettes concatenated into a single, much taller list. The
                     previous version wrapped both AvatarEditorPaletteSetView instances in one ScrollContainer,
                     which visually merged colour 1 and colour 2 into one long, undifferentiated scroll (up to
                     19 rows deep for some parts) instead of two clearly separate, equally-sized palettes. */ }
                <Flex column fullWidth fullHeight overflow="hidden" gap={ 2 } grow style={ { flexBasis: 0 } }>
                    { (maxPaletteCount >= 1) &&
                        <Flex column overflow="hidden" gap={ 2 } grow style={ { flexBasis: 0 } }>
                            <ScrollContainer>
                                <AvatarEditorPaletteSetView model={ model } category={ activeCategory } paletteSet={ activeCategory.getPalette(0) } paletteIndex={ 0 } targetColor={ targetColor } />
                            </ScrollContainer>
                        </Flex> }
                    { (maxPaletteCount === 2) &&
                        <Flex column overflow="hidden" gap={ 2 } grow style={ { flexBasis: 0 } }>
                            <ScrollContainer>
                                <AvatarEditorPaletteSetView model={ model } category={ activeCategory } paletteSet={ activeCategory.getPalette(1) } paletteIndex={ 1 } targetColor={ targetColor } />
                            </ScrollContainer>
                        </Flex> }
                </Flex>
            </Flex>
        </Flex>
    );
}
