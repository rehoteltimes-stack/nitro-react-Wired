import { AvatarEditorFigureCategory, FigureSetIdsMessageEvent, GetWardrobeMessageComposer, IAvatarFigureContainer, ILinkEventTracker, UserFigureComposer, UserWardrobePageEvent } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { FaDice, FaRecycle, FaTrash, FaUndo } from 'react-icons/fa';
import { AddEventLinkTracker, AvatarEditorAction, AvatarEditorUtilities, BodyModel, CreateLinkEvent, FigureData, generateRandomFigure, GetAvatarRenderManager, GetClubMemberLevel, GetConfiguration, GetSessionDataManager, HeadModel, IAvatarEditorCategoryModel, LegModel, LocalizeText, RemoveLinkEventTracker, SendMessageComposer, TorsoModel } from '../../api';
import { Button, ButtonGroup, Flex, NitroCardHeaderView, NitroCardTabsItemView, NitroCardTabsView, NitroCardView } from '../../common';
import { useMessageEvent } from '../../hooks';
import { AvatarEditorModelView } from './views/AvatarEditorModelView';
import { AvatarEditorWardrobeView } from './views/AvatarEditorWardrobeView';

const DEFAULT_MALE_FIGURE: string = 'hr-100.hd-180-7.ch-215-66.lg-270-79.sh-305-62.ha-1002-70.wa-2007';
const DEFAULT_FEMALE_FIGURE: string = 'hr-515-33.hd-600-1.ch-635-70.lg-716-66-62.sh-735-68';

export const AvatarEditorView: FC<{}> = props =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const [ figures, setFigures ] = useState<Map<string, FigureData>>(null);
    const [ figureData, setFigureData ] = useState<FigureData>(null);
    const [ categories, setCategories ] = useState<Map<string, IAvatarEditorCategoryModel>>(null);
    const [ activeCategory, setActiveCategory ] = useState<IAvatarEditorCategoryModel>(null);
    const [ figureSetIds, setFigureSetIds ] = useState<number[]>([]);
    const [ boundFurnitureNames, setBoundFurnitureNames ] = useState<string[]>([]);
    const [ savedFigures, setSavedFigures ] = useState<[ IAvatarFigureContainer, string ][]>([]);
    const [ lastFigure, setLastFigure ] = useState<string>(null);
    const [ lastGender, setLastGender ] = useState<string>(null);
    const [ needsReset, setNeedsReset ] = useState(true);
    const [ isInitalized, setIsInitalized ] = useState(false);

    const maxWardrobeSlots = useMemo(() => GetConfiguration<number>('avatar.wardrobe.max.slots', 10), []);

    useMessageEvent<FigureSetIdsMessageEvent>(FigureSetIdsMessageEvent, event =>
    {
        const parser = event.getParser();

        setFigureSetIds(parser.figureSetIds);
        setBoundFurnitureNames(parser.boundsFurnitureNames);
    });

    useMessageEvent<UserWardrobePageEvent>(UserWardrobePageEvent, event =>
    {
        const parser = event.getParser();
        const savedFigures: [ IAvatarFigureContainer, string ][] = [];

        let i = 0;

        while(i < maxWardrobeSlots)
        {
            savedFigures.push([ null, null ]);

            i++;
        }

        for(let [ index, [ look, gender ] ] of parser.looks.entries())
        {
            const container = GetAvatarRenderManager().createFigureContainer(look);

            savedFigures[(index - 1)] = [ container, gender ];
        }

        setSavedFigures(savedFigures);
    });

    const selectCategory = useCallback((name: string) =>
    {
        if(!categories) return;
        
        setActiveCategory(categories.get(name));
    }, [ categories ]);

    const resetCategories = useCallback(() =>
    {
        const categories = new Map();

        categories.set(AvatarEditorFigureCategory.GENERIC, new BodyModel());
        categories.set(AvatarEditorFigureCategory.HEAD, new HeadModel());
        categories.set(AvatarEditorFigureCategory.TORSO, new TorsoModel());
        categories.set(AvatarEditorFigureCategory.LEGS, new LegModel());

        setCategories(categories);
    }, []);

    const setupFigures = useCallback(() =>
    {
        const figures: Map<string, FigureData> = new Map();

        const maleFigure = new FigureData();
        const femaleFigure = new FigureData();

        maleFigure.loadAvatarData(DEFAULT_MALE_FIGURE, FigureData.MALE);
        femaleFigure.loadAvatarData(DEFAULT_FEMALE_FIGURE, FigureData.FEMALE);

        figures.set(FigureData.MALE, maleFigure);
        figures.set(FigureData.FEMALE, femaleFigure);

        setFigures(figures);
        setFigureData(figures.get(FigureData.MALE));
    }, []);

    const loadAvatarInEditor = useCallback((figure: string, gender: string, reset: boolean = true) =>
    {
        gender = AvatarEditorUtilities.getGender(gender);

        let newFigureData = figureData;

        if(gender !== newFigureData.gender) newFigureData = figures.get(gender);

        if(figure !== newFigureData.getFigureString()) newFigureData.loadAvatarData(figure, gender);

        if(newFigureData !== figureData) setFigureData(newFigureData);

        if(reset)
        {
            setLastFigure(figureData.getFigureString());
            setLastGender(figureData.gender);
        }
    }, [ figures, figureData ]);

    const processAction = useCallback((action: string) =>
    {
        switch(action)
        {
            case AvatarEditorAction.ACTION_CLEAR:
                loadAvatarInEditor(figureData.getFigureStringWithFace(0, false), figureData.gender, false);
                resetCategories();
                return;
            case AvatarEditorAction.ACTION_RESET:
                loadAvatarInEditor(lastFigure, lastGender);
                resetCategories();
                return;
            case AvatarEditorAction.ACTION_RANDOMIZE:
                const figure = generateRandomFigure(figureData, figureData.gender, GetClubMemberLevel(), figureSetIds, [ FigureData.FACE ]);

                loadAvatarInEditor(figure, figureData.gender, false);
                resetCategories();
                return;
            case AvatarEditorAction.ACTION_SAVE:
                SendMessageComposer(new UserFigureComposer(figureData.gender, figureData.getFigureString()));
                setIsVisible(false);
                return;
        }
    }, [ figureData, lastFigure, lastGender, figureSetIds, loadAvatarInEditor, resetCategories ])

    const setGender = useCallback((gender: string) =>
    {
        gender = AvatarEditorUtilities.getGender(gender);

        setFigureData(figures.get(gender));
    }, [ figures ]);

    useEffect(() =>
    {
        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) =>
            {
                const parts = url.split('/');
        
                if(parts.length < 2) return;
        
                switch(parts[1])
                {
                    case 'show':
                        setIsVisible(true);
                        return;
                    case 'hide':
                        setIsVisible(false);
                        return;
                    case 'toggle':
                        setIsVisible(prevValue => !prevValue);
                        return;
                }
            },
            eventUrlPrefix: 'avatar-editor/'
        };

        AddEventLinkTracker(linkTracker);

        return () => RemoveLinkEventTracker(linkTracker);
    }, []);

    useEffect(() =>
    {
        setSavedFigures(new Array(maxWardrobeSlots));
    }, [ maxWardrobeSlots ]);

    // Real reference behaviour (verified via CDP + JS source): the wardrobe is an always-visible sidebar, not
    // a tab that replaces the model view - so its data is fetched once when the editor opens, not on a
    // visibility toggle.
    useEffect(() =>
    {
        if(!isVisible) return;

        SendMessageComposer(new GetWardrobeMessageComposer());
    }, [ isVisible ]);

    useEffect(() =>
    {
        if(!categories) return;

        selectCategory(AvatarEditorFigureCategory.GENERIC);
    }, [ categories, selectCategory ]);

    useEffect(() =>
    {
        if(!figureData) return;

        AvatarEditorUtilities.CURRENT_FIGURE = figureData;

        resetCategories();

        return () => AvatarEditorUtilities.CURRENT_FIGURE = null;
    }, [ figureData, resetCategories ]);

    useEffect(() =>
    {
        AvatarEditorUtilities.FIGURE_SET_IDS = figureSetIds;
        AvatarEditorUtilities.BOUND_FURNITURE_NAMES = boundFurnitureNames;

        resetCategories();

        return () =>
        {
            AvatarEditorUtilities.FIGURE_SET_IDS = null;
            AvatarEditorUtilities.BOUND_FURNITURE_NAMES = null;
        }
    }, [ figureSetIds, boundFurnitureNames, resetCategories ]);

    useEffect(() =>
    {
        if(!isVisible) return;

        if(!figures)
        {
            setupFigures();

            setIsInitalized(true);

            return;
        }
    }, [ isVisible, figures, setupFigures ]);

    useEffect(() =>
    {
        if(!isVisible || !isInitalized || !needsReset) return;

        loadAvatarInEditor(GetSessionDataManager().figure, GetSessionDataManager().gender);
        setNeedsReset(false);
    }, [ isVisible, isInitalized, needsReset, loadAvatarInEditor ]);

    useEffect(() =>
    {
        if(isVisible) return;

        return () =>
        {
            setNeedsReset(true);
        }
    }, [ isVisible ]);

    if(!isVisible || !figureData) return null;

    // Real reference structure (verified via CDP outerHTML on the live avatar editor): header, then
    // .nitro-avatar-editor-content directly (no .content-area wrapper - this window doesn't use the generic
    // NitroCardContentView pattern) holding two permanent siblings: the wardrobe sidebar and a main column
    // (tabs -> model/colour view -> bottom action row). The old version put the wardrobe behind a 5th tab
    // (replacing the whole model view) and split figure-preview/action-buttons into a separate right-hand
    // Grid column next to the model - neither matches the reference, which keeps the wardrobe always visible
    // and puts the figure preview inside the model view's own left column (see AvatarEditorModelView).
    // overflow="visible" matches the real reference's own root class (confirmed via computed style:
    // overflow:visible there vs NitroCardView's shared default of overflow:auto) - this window has no
    // internal scroll area of its own, everything scrolls via the nested ScrollContainer grids instead.
    // gap={3} matches the reference's own real `gap-3` (16px) root class - NitroCardView defaults its inner
    // Column's gap to 0 when no gap prop is passed, which left zero space between the header and the content
    // (both measured at the exact same y-coordinate on our dev client before this fix).
    return (
        <NitroCardView uniqueKey="avatar-editor" className="nitro-avatar-editor" overflow="visible" gap={ 3 }>
            <NitroCardHeaderView headerText={ LocalizeText('avatareditor.title') } onCloseClick={ event => setIsVisible(false) } />
            <Flex gap={ 3 } classNames={ [ 'nitro-avatar-editor-content' ] }>
                <AvatarEditorWardrobeView figureData={ figureData } savedFigures={ savedFigures } setSavedFigures={ setSavedFigures } loadAvatarInEditor={ loadAvatarInEditor } />
                <Flex column fullWidth gap={ 2 }>
                    <NitroCardTabsView>
                        { categories && (categories.size > 0) && Array.from(categories.keys()).map(category =>
                        {
                            const isActive = (activeCategory && (activeCategory.name === category));

                            return (
                                <NitroCardTabsItemView key={ category } isActive={ isActive } onClick={ event => selectCategory(category) }>
                                    { LocalizeText(`avatareditor.category.${ category }`) }
                                </NitroCardTabsItemView>
                            );
                        }) }
                    </NitroCardTabsView>
                    { activeCategory &&
                        <AvatarEditorModelView model={ activeCategory } figureData={ figureData } gender={ figureData.gender } setGender={ setGender } /> }
                    { /* Real, cold-load-only bug: this row had `grow`, and AvatarEditorModelView (the middle,
                         space-filling section) is conditionally rendered and briefly absent from the DOM while
                         `activeCategory` is still resolving (model.init() + selectCategory haven't run yet on
                         first mount). With the model view temporarily missing, this row became the ONLY
                         flex-grow child in the column and expanded to fill the whole remaining height - the
                         "buttons show big first, then the boxes appear" report. AvatarEditorModelView doesn't
                         actually need this row to have `grow` at all: its own root already sets `fullHeight`
                         (h-100), which - per the flex-basis:auto spec, an explicit height property is used as
                         the item's flex-basis - already claims the real remaining space once it mounts,
                         regardless of whether this sibling has flex-grow. Removing `grow` here fixes the race
                         without needing to force activeCategory to resolve synchronously. */ }
                    <Flex gap={ 2 }>
                        <ButtonGroup>
                            <Button variant="primary" onClick={ event => processAction(AvatarEditorAction.ACTION_RESET) }>
                                <FaUndo className="fa-icon" />
                            </Button>
                            <Button variant="primary" onClick={ event => processAction(AvatarEditorAction.ACTION_CLEAR) }>
                                <FaTrash className="fa-icon" />
                            </Button>
                            <Button variant="primary" onClick={ event => processAction(AvatarEditorAction.ACTION_RANDOMIZE) }>
                                <FaDice className="fa-icon" />
                            </Button>
                            { /* Real, confirmed-present 4th action button (verified via icon path match against
                                 the live reference) - always disabled there too, so its real function is
                                 genuinely unknown. Added visually, unwired, per this project's own precedent for
                                 confirmed-real-but-unverified controls rather than guessing at behaviour. */ }
                            <Button variant="primary" disabled>
                                <FaRecycle className="fa-icon" />
                            </Button>
                        </ButtonGroup>
                        <Button fullWidth variant="success" onClick={ event => processAction(AvatarEditorAction.ACTION_SAVE) }>
                            { LocalizeText('avatareditor.save') }
                        </Button>
                    </Flex>
                </Flex>
            </Flex>
        </NitroCardView>
    );
}
