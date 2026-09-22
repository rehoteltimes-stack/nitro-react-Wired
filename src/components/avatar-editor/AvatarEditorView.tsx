import { AvatarEditorFigureCategory, FigureSetIdsMessageEvent, GetWardrobeMessageComposer, IAvatarFigureContainer, ILinkEventTracker, UserFigureComposer, UserWardrobePageEvent } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { FaDice, FaRecycle, FaTrashAlt, FaUndo } from 'react-icons/fa';
import { AddEventLinkTracker, AvatarEditorAction, AvatarEditorUtilities, BodyModel, FigureData, generateRandomFigure, GetAvatarRenderManager, GetClubMemberLevel, GetConfiguration, GetSessionDataManager, HeadModel, IAvatarEditorCategoryModel, LegModel, LocalizeText, RemoveLinkEventTracker, SendMessageComposer, TorsoModel } from '../../api';
import { Button, ButtonGroup, Column, Flex, NitroCardHeaderView, NitroCardTabsItemView, NitroCardTabsView, NitroCardView } from '../../common';
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

    // real habbocity structure: the wardrobe is a permanent sidebar, not a tab you switch to - its own
    // real request fires once the editor opens, not on a visibility toggle that no longer exists.
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

    // Real habbocity top-level structure ("!m||!I?null:u(Le,{...gap:3,children:[header, Flex.nitro-avatar-editor-
    // content]})" in their minified source, read directly): the header and the content Flex are DIRECT children
    // of the card itself (gap=3, overflow="visible") with no NitroCardContentView wrapper between them at all,
    // and the wardrobe is a real, permanent sidebar inside that same content Flex, not a tab - there is no
    // "Wardrobe" tab entry in their own tab list, confirmed by reading their real category-tabs array
    // (Array.from(C.keys())) separately from the wardrobe component, which is always rendered as the content
    // Flex's first child.
    return (
        <NitroCardView uniqueKey="avatar-editor" overflow="visible" className="nitro-avatar-editor" gap={ 3 }>
            <NitroCardHeaderView headerText={ LocalizeText('avatareditor.title') } onCloseClick={ event => setIsVisible(false) } />
            <Flex className="nitro-avatar-editor-content" gap={ 3 }>
                <AvatarEditorWardrobeView figureData={ figureData } savedFigures={ savedFigures } setSavedFigures={ setSavedFigures } loadAvatarInEditor={ loadAvatarInEditor } />
                <Column fullWidth className="avatar-editor-main-column">
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
                        <AvatarEditorModelView model={ activeCategory } gender={ figureData.gender } setGender={ setGender } figureData={ figureData } /> }
                    <Flex grow gap={ 2 }>
                        <ButtonGroup>
                            <Button variant="secondary" onClick={ event => processAction(AvatarEditorAction.ACTION_RESET) }>
                                <FaUndo className="fa-icon" />
                            </Button>
                            <Button variant="secondary" onClick={ event => processAction(AvatarEditorAction.ACTION_CLEAR) }>
                                <FaTrashAlt className="fa-icon" />
                            </Button>
                            <Button variant="secondary" onClick={ event => processAction(AvatarEditorAction.ACTION_RANDOMIZE) }>
                                <FaDice className="fa-icon" />
                            </Button>
                            { /* Real, verified live on the reference: a 4th button (FaRecycle icon) sits here,
                                always disabled for every account/tab tested - its real function couldn't be
                                confirmed (never enabled in any state reachable this pass), so it's reproduced
                                visually only, wired to nothing, per the "don't guess" rule. */ }
                            <Button variant="secondary" disabled>
                                <FaRecycle className="fa-icon" />
                            </Button>
                        </ButtonGroup>
                        <Button className="w-100" variant="success" onClick={ event => processAction(AvatarEditorAction.ACTION_SAVE) }>
                            { LocalizeText('avatareditor.save') }
                        </Button>
                    </Flex>
                </Column>
            </Flex>
        </NitroCardView>
    );
}
