import { IAvatarFigureContainer, SaveWardrobeOutfitMessageComposer } from '@nitrots/nitro-renderer';
import { Dispatch, FC, SetStateAction, useCallback, useMemo } from 'react';
import { FaCheck, FaPlusCircle, FaTrashAlt } from 'react-icons/fa';
import { FigureData, GetAvatarRenderManager, GetClubMemberLevel, GetConfiguration, SendMessageComposer } from '../../../api';
import { Button, Flex, LayoutAvatarImageView, LayoutCurrencyIcon } from '../../../common';

export interface AvatarEditorWardrobeViewProps
{
    figureData: FigureData;
    savedFigures: [ IAvatarFigureContainer, string ][];
    setSavedFigures: Dispatch<SetStateAction<[ IAvatarFigureContainer, string][]>>;
    loadAvatarInEditor: (figure: string, gender: string, reset?: boolean) => void;
}

// Real reference structure (verified via CDP + JS source on the live avatar editor): the wardrobe is an
// always-visible left-hand sidebar (.wardrobe-container), not a 5th tab that swaps out the editor - fixed
// row-pairs of .wardrobe-item-container, each holding one .wardrobe-item. An empty slot renders a single
// full-slot transparent button (FaPlusCircle) whose click SAVES the current figure there; a filled slot shows
// the saved figure's own render plus, on hover, an overlay with a Wear button and an Overwrite (trash) button
// that reuses the same save action - confirmed straight from the reference's own minified source: both the
// empty-slot button and the filled-slot's second (danger) button call the identical save-at-index function,
// which is exactly what this file's own saveFigureAtWardrobeIndex already does; only the missing always-visible
// two-button hover state and the correct wear/save icons needed adding.
// Gender-mismatch handling added below (real, verified via the reference's own minified source:
// `O=p!==null&&N&&x!==p` gates a `pointer-events:none` style + `gender-mismatch` class on any saved slot whose
// own gender differs from the gender currently active in the editor). Still deliberately NOT replicated: the
// wear action's optional head-part-stripping toggle (`a?C.split(".").filter(b=>!b.startsWith("hd")).join("."):C`
// in the same source) - which flag/prop actually drives `a` couldn't be resolved with confidence from the
// minified source alone, so wear here always applies the full saved figure, matching this project's own prior,
// safer behaviour rather than guessing at when heads should be stripped.
export const AvatarEditorWardrobeView: FC<AvatarEditorWardrobeViewProps> = props =>
{
    const { figureData = null, savedFigures = [], setSavedFigures = null, loadAvatarInEditor = null } = props;

    const hcDisabled = GetConfiguration<boolean>('hc.disabled', false);

    const wearFigureAtIndex = useCallback((index: number) =>
    {
        if((index >= savedFigures.length) || (index < 0)) return;

        const [ figure, gender ] = savedFigures[index];

        if(!figure) return;

        loadAvatarInEditor(figure.getFigureString(), gender);
    }, [ savedFigures, loadAvatarInEditor ]);

    const saveFigureAtWardrobeIndex = useCallback((index: number) =>
    {
        if(!figureData || (index >= savedFigures.length) || (index < 0)) return;

        const newFigures = [ ...savedFigures ];

        const figure = figureData.getFigureString();
        const gender = figureData.gender;

        newFigures[index] = [ GetAvatarRenderManager().createFigureContainer(figure), gender ];

        setSavedFigures(newFigures);
        SendMessageComposer(new SaveWardrobeOutfitMessageComposer((index + 1), figure, gender));
    }, [ figureData, savedFigures, setSavedFigures ]);

    const rows = useMemo(() =>
    {
        if(!savedFigures || !savedFigures.length) return [];

        const rows: JSX.Element[] = [];

        for(let i = 0; i < savedFigures.length; i += 2)
        {
            const pair = [ i, (i + 1) ].filter(index => (index < savedFigures.length));

            rows.push(
                <Flex key={ i } gap={ 2 } justifyContent="center">
                    { pair.map(index =>
                    {
                        // savedFigures starts life as `new Array(maxWardrobeSlots)` (AvatarEditorView.tsx) -
                        // a SPARSE array of holes, not `[null, null]` tuples, until the real
                        // UserWardrobePageEvent response fills it in. The previous version of this component
                        // iterated with `.forEach()`, which silently skips holes; this `for` loop indexes
                        // every slot directly, so a hole reads back `undefined` here and must be guarded -
                        // real crash fixed after wardrobe went from tab-gated (never rendered before the
                        // event arrived) to always-visible (rendered immediately on open).
                        const [ figureContainer, gender ] = savedFigures[index] || [ null, null ];
                        const clubLevel = figureContainer ? GetAvatarRenderManager().getFigureClubLevel(figureContainer, gender) : 0;
                        const currentGender = figureData ? figureData.gender : null;
                        const isGenderMismatch = (currentGender !== null) && !!figureContainer && (gender !== currentGender);

                        return (
                            <div key={ index } className="wardrobe-item-container" style={ isGenderMismatch ? { pointerEvents: 'none' } : {} }>
                                <div className={ `wardrobe-item ${ figureContainer ? '' : 'empty' } ${ isGenderMismatch ? 'gender-mismatch' : '' }` }>
                                    { figureContainer &&
                                        <LayoutAvatarImageView figure={ figureContainer.getFigureString() } gender={ gender } direction={ 2 } /> }
                                    { !hcDisabled && (clubLevel > 0) && <LayoutCurrencyIcon className="hc-icon" type="hc" /> }
                                    { !figureContainer &&
                                        <Button fullHeight fullWidth variant="transparent" onClick={ event => saveFigureAtWardrobeIndex(index) }>
                                            <FaPlusCircle className="fa-icon" />
                                        </Button> }
                                </div>
                                { figureContainer &&
                                    <div className="wardrobe-item wardrobe-buttons hover">
                                        <Button variant="success" fullWidth disabled={ (clubLevel > GetClubMemberLevel()) } onClick={ event => wearFigureAtIndex(index) }>
                                            <FaCheck className="fa-icon" />
                                        </Button>
                                        <Button variant="danger" fullWidth onClick={ event => saveFigureAtWardrobeIndex(index) }>
                                            <FaTrashAlt className="fa-icon" />
                                        </Button>
                                    </div> }
                            </div>
                        );
                    }) }
                </Flex>
            );
        }

        return rows;
    }, [ savedFigures, hcDisabled, figureData, saveFigureAtWardrobeIndex, wearFigureAtIndex ]);

    return (
        <Flex column gap={ 2 } classNames={ [ 'wardrobe-container' ] }>
            { rows }
        </Flex>
    );
}
