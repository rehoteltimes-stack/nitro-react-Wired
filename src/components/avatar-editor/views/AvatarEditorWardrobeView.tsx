import { IAvatarFigureContainer, SaveWardrobeOutfitMessageComposer } from '@nitrots/nitro-renderer';
import { Dispatch, FC, SetStateAction, useCallback, useMemo } from 'react';
import { FaCheck, FaPlus, FaTrash } from 'react-icons/fa';
import { FigureData, GetAvatarRenderManager, GetClubMemberLevel, GetConfiguration, SendMessageComposer } from '../../../api';
import { Button, Column, Flex, LayoutAvatarImageView, LayoutCurrencyIcon } from '../../../common';

export interface AvatarEditorWardrobeViewProps
{
    figureData: FigureData;
    savedFigures: [ IAvatarFigureContainer, string ][];
    setSavedFigures: Dispatch<SetStateAction<[ IAvatarFigureContainer, string][]>>;
    loadAvatarInEditor: (figure: string, gender: string, reset?: boolean) => void;
    gender?: string;
}

// real habbocity markup ("A1" in their minified source, same prop shape as our own pre-existing version -
// figureData/savedFigures/setSavedFigures/loadAvatarInEditor, the same SaveWardrobeOutfitMessageComposer - this
// is a real 1:1 counterpart, not a different feature, just structured very differently to what an earlier pass
// on this project had guessed): paired rows of two real `wardrobe-item-container`s (a Flex row per pair, not a
// CSS auto-grid), each holding one `wardrobe-item` (the saved look, or an empty "+" slot to save the current
// look into) plus, only when a look IS actually saved there, a second sibling `wardrobe-item wardrobe-buttons
// hover` panel - a real, STATIC "hover" class habbocity's own CSS keys visibility off via
// `.wardrobe-item-container:hover .wardrobe-item.hover` (confirmed against their real CSS), not a conditionally
// -rendered React hover state - ported the same way rather than reinventing it in JS. `gender-mismatch` disables
// the slot (`pointer-events:none`) when a saved look's own gender doesn't match whichever gender is currently
// being edited.
export const AvatarEditorWardrobeView: FC<AvatarEditorWardrobeViewProps> = props =>
{
    const { figureData = null, savedFigures = [], setSavedFigures = null, loadAvatarInEditor = null, gender = null } = props;

    const hcDisabled = GetConfiguration<boolean>('hc.disabled', false);

    const wearFigureAtIndex = useCallback((index: number) =>
    {
        if((index >= savedFigures.length) || (index < 0)) return;

        const [ figure, savedGender ] = savedFigures[index];

        loadAvatarInEditor(figure.getFigureString(), savedGender);
    }, [ savedFigures, loadAvatarInEditor ]);

    const saveFigureAtWardrobeIndex = useCallback((index: number) =>
    {
        if(!figureData || (index >= savedFigures.length) || (index < 0)) return;

        const newFigures = [ ...savedFigures ];

        const figure = figureData.getFigureString();
        const figureGender = figureData.gender;

        newFigures[index] = [ GetAvatarRenderManager().createFigureContainer(figure), figureGender ];

        setSavedFigures(newFigures);
        SendMessageComposer(new SaveWardrobeOutfitMessageComposer((index + 1), figure, figureGender));
    }, [ figureData, savedFigures, setSavedFigures ]);

    const rows = useMemo(() =>
    {
        if(!savedFigures || !savedFigures.length) return [];

        const items: JSX.Element[] = [];

        for(let i = 0; i < savedFigures.length; i += 2)
        {
            const pair: ([ IAvatarFigureContainer, string ] | null)[] = [ savedFigures[i], (savedFigures[i + 1] ?? null) ];

            items.push(
                <Flex key={ i } gap={ 2 } justifyContent="center">
                    { pair.map((data, column) =>
                    {
                        const index = (i + column);

                        if((index >= savedFigures.length) || !data) return <div className="wardrobe-item-container" key={ column } />;

                        const [ figureContainer, savedGender ] = data;
                        const clubLevel = figureContainer ? GetAvatarRenderManager().getFigureClubLevel(figureContainer, savedGender) : 0;
                        const genderMismatch = ((gender !== null) && !!figureContainer && (savedGender !== gender));

                        return (
                            <div className="wardrobe-item-container" style={ genderMismatch ? { pointerEvents: 'none' } : {} } key={ column }>
                                <div className={ `wardrobe-item ${ figureContainer ? '' : 'empty' } ${ genderMismatch ? 'gender-mismatch' : '' }` }>
                                    { figureContainer &&
                                        <LayoutAvatarImageView figure={ figureContainer.getFigureString() } gender={ savedGender } direction={ 2 } /> }
                                    { !hcDisabled && (clubLevel > 0) &&
                                        <LayoutCurrencyIcon className="hc-icon" type="hc" /> }
                                    { !figureContainer &&
                                        <Button fullHeight variant="transparent" fullWidth onClick={ () => saveFigureAtWardrobeIndex(index) }>
                                            <FaPlus />
                                        </Button> }
                                </div>
                                { figureContainer &&
                                    <div className="wardrobe-item wardrobe-buttons hover">
                                        <Button variant="success" fullWidth onClick={ () => wearFigureAtIndex(index) } disabled={ (clubLevel > GetClubMemberLevel()) }>
                                            <FaCheck />
                                        </Button>
                                        <Button variant="danger" fullWidth onClick={ () => saveFigureAtWardrobeIndex(index) }>
                                            <FaTrash />
                                        </Button>
                                    </div> }
                            </div>
                        );
                    }) }
                </Flex>
            );
        }

        return items;
    }, [ savedFigures, hcDisabled, saveFigureAtWardrobeIndex, wearFigureAtIndex, gender ]);

    return (
        <Column fullWidth fullHeight gap={ 0 } className="wardrobe-container">
            { rows }
        </Column>
    );
}
