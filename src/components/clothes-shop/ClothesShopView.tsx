import { ILinkEventTracker } from '@nitrots/nitro-renderer';
import { FC, useEffect, useMemo, useState } from 'react';
import { AddEventLinkTracker, ClothesShopBuyComposer, ClothesShopDataEvent, ClothesShopItemData, ClothesShopOwnedEvent, ClothesShopRequestComposer, ClothesShopResultCode, ClothesShopResultEvent, FigureData, GetAvatarRenderManager, GetRoomEngine, GetSessionDataManager, LocalizeText, RegisterClothesShopMessages, RemoveLinkEventTracker, SendMessageComposer } from '../../api';
import { AutoGrid, Button, Column, Flex, Grid, LayoutCurrencyIcon, LayoutGridItem, NitroCardContentView, NitroCardHeaderView, NitroCardTabsItemView, NitroCardTabsView, NitroCardView, Text } from '../../common';
import { useMessageEvent, useNotification } from '../../hooks';
import { AvatarEditorFigurePreviewView } from '../avatar-editor/views/AvatarEditorFigurePreviewView';

// Real, deliberate deviation from stock Arcturus (and from habbocity.fr's own real client, which matches stock
// exactly here): buying grants the clothing straight into the wardrobe, no furni/room step - see
// hcms-emulator-plugin's ClothesShopProtocol.java for the full write-up of why, and ClothesShopService.java for
// the server-side grant logic this view's Buy button ultimately triggers.
//
// Visual/structural shape matched to the real Outfit Changer (AvatarEditorView.tsx) on request - "1:1 like soda
// in the outfit changer" - rather than to Habz's own bespoke `nitro-clothes-shop` markup: the outfit changer is
// this same codebase's own real, already-habbocity-styled feature (NitroCardTabsView category tabs, a 9/3 Grid
// split with AvatarEditorFigurePreviewView as the real rotatable preview panel on the right, the exact same
// component habbocity's own client already uses), so reusing it here gives genuine 1:1 consistency for free
// instead of porting a second, parallel set of shop-specific classes. Categories (Face/Head/Torso/Legs) reuse
// FigureData's own real type constants and this project's own already-correct Head/Torso/LegModel grouping,
// rather than reversing habbocity/Habz's own type codes from scratch.
//
// Known, deliberate scope cut, not an oversight: Habz's own real shop has a SEPARATE checkout confirmation card
// (a basket review + explicit "Confirm purchase" step) before charging - this view charges directly off the one
// Buy button instead (total cost already shown, same information, one fewer click). Revisit if a two-step
// confirm is specifically wanted.
const CATEGORY_TYPES: { [category: string]: string[] } = {
    face: [ FigureData.FACE ],
    head: [ FigureData.HAIR, FigureData.HAT, FigureData.HEAD_ACCESSORIES, FigureData.EYE_ACCESSORIES, FigureData.FACE_ACCESSORIES ],
    torso: [ FigureData.SHIRT, FigureData.JACKET, FigureData.CHEST_ACCESSORIES, FigureData.CHEST_PRINTS ],
    legs: [ FigureData.TROUSERS, FigureData.SHOES ]
};

const ALL_TYPES = Object.values(CATEGORY_TYPES).flat();

// No direct "which type does this set id belong to" lookup exists on IAvatarRenderManager - resolved the same
// way the renderer itself does internally, by asking each real figure type in turn whether it owns that id
// (structureData.getSetType(type).getPartSet(id) returns null when it doesn't).
const resolveCategoryForSetIds = (setIds: number[]): string =>
{
    const structureData = GetAvatarRenderManager().structureData;

    for(const setId of setIds)
    {
        for(const type of ALL_TYPES)
        {
            const setType = structureData.getSetType(type);

            if(!setType || !setType.getPartSet(setId)) continue;

            for(const category of Object.keys(CATEGORY_TYPES))
            {
                if(CATEGORY_TYPES[category].indexOf(type) >= 0) return category;
            }
        }
    }

    return 'torso';
}

export const ClothesShopView: FC<{}> = props =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const [ items, setItems ] = useState<ClothesShopItemData[]>([]);
    const [ ownedIds, setOwnedIds ] = useState<Set<number>>(new Set());
    const [ basket, setBasket ] = useState<Set<number>>(new Set());
    const [ isPending, setIsPending ] = useState(false);
    const [ activeCategory, setActiveCategory ] = useState('face');
    const [ focusedItem, setFocusedItem ] = useState<ClothesShopItemData>(null);
    const [ previewFigureData ] = useState(() => new FigureData());
    const { simpleAlert = null } = useNotification();

    useEffect(() => RegisterClothesShopMessages(), []);

    useEffect(() =>
    {
        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) =>
            {
                const parts = url.split('/');

                if(parts.length < 2) return;

                switch(parts[1])
                {
                    case 'toggle':
                        setIsVisible(value => !value);
                        return;
                    case 'hide':
                        setIsVisible(false);
                        return;
                }
            },
            eventUrlPrefix: 'clothes-shop/'
        };

        AddEventLinkTracker(linkTracker);

        return () => RemoveLinkEventTracker(linkTracker);
    }, []);

    useEffect(() =>
    {
        if(!isVisible) return;

        setBasket(new Set());
        setFocusedItem(null);
        setActiveCategory('face');
        previewFigureData.loadAvatarData(GetSessionDataManager().figure, GetSessionDataManager().gender);
        SendMessageComposer(new ClothesShopRequestComposer());
    }, [ isVisible ]);

    useMessageEvent<ClothesShopDataEvent>(ClothesShopDataEvent, event =>
    {
        setItems(event.getParser().items);
    });

    useMessageEvent<ClothesShopOwnedEvent>(ClothesShopOwnedEvent, event =>
    {
        setOwnedIds(new Set(event.getParser().clothingIds));
    });

    useMessageEvent<ClothesShopResultEvent>(ClothesShopResultEvent, event =>
    {
        setIsPending(false);

        const resultCode = event.getParser().resultCode;

        switch(resultCode)
        {
            case ClothesShopResultCode.OK:
                simpleAlert(LocalizeText('clothesshop.purchase.success'), null, null, null, LocalizeText('clothesshop.title'));
                setOwnedIds(prevValue => new Set([ ...prevValue, ...basket ]));
                setBasket(new Set());
                return;
            case ClothesShopResultCode.INSUFFICIENT_FUNDS:
                simpleAlert(LocalizeText('clothesshop.purchase.insufficient_funds'), null, null, null, LocalizeText('clothesshop.title'));
                return;
            case ClothesShopResultCode.ALREADY_OWNED:
                simpleAlert(LocalizeText('clothesshop.purchase.already_owned'), null, null, null, LocalizeText('clothesshop.title'));
                SendMessageComposer(new ClothesShopRequestComposer());
                return;
            default:
                simpleAlert(LocalizeText('clothesshop.purchase.unavailable'), null, null, null, LocalizeText('clothesshop.title'));
                SendMessageComposer(new ClothesShopRequestComposer());
                return;
        }
    });

    // one category per shop item, derived once per item list (never re-derived per render - the underlying
    // structure data never changes at runtime).
    const itemCategories = useMemo(() =>
    {
        const map = new Map<number, string>();

        for(const item of items) map.set(item.clothingId, resolveCategoryForSetIds(item.setIds));

        return map;
    }, [ items ]);

    const visibleItems = useMemo(() => items.filter(item => (itemCategories.get(item.clothingId) === activeCategory)), [ items, itemCategories, activeCategory ]);

    // live preview: the player's own current look with every basket item's figure parts layered on top - the
    // exact same real merge PurchasableClothingConfirmView/CatalogViewProductWidgetView already use for their own
    // previews, not a separate invented mechanism.
    useEffect(() =>
    {
        const setIds = items.filter(item => basket.has(item.clothingId)).flatMap(item => item.setIds);
        const gender = GetSessionDataManager().gender;
        const figure = GetAvatarRenderManager().getFigureStringWithFigureIds(GetSessionDataManager().figure, gender, setIds);

        previewFigureData.loadAvatarData(figure, gender);
    }, [ items, basket, previewFigureData ]);

    const toggleBasket = (item: ClothesShopItemData) =>
    {
        setFocusedItem(item);

        if(ownedIds.has(item.clothingId) || isPending) return;

        setBasket(prevValue =>
        {
            const newValue = new Set(prevValue);

            if(newValue.has(item.clothingId)) newValue.delete(item.clothingId);
            else newValue.add(item.clothingId);

            return newValue;
        });
    }

    const buyAll = () =>
    {
        if(isPending || !basket.size) return;

        setIsPending(true);
        SendMessageComposer(new ClothesShopBuyComposer(Array.from(basket)));
    }

    const totalCredits = useMemo(() => items.filter(item => basket.has(item.clothingId)).reduce((total, item) => (total + item.costCredits), 0), [ items, basket ]);
    const totalPoints = useMemo(() =>
    {
        const totals = new Map<number, number>();

        for(const item of items)
        {
            if(!basket.has(item.clothingId) || (item.costPoints <= 0)) continue;

            totals.set(item.pointsType, (totals.get(item.pointsType) ?? 0) + item.costPoints);
        }

        return totals;
    }, [ items, basket ]);

    if(!isVisible) return null;

    return (
        <NitroCardView uniqueKey="clothes-shop" className="clothes-shop" theme="primary-slim">
            <NitroCardHeaderView headerText={ LocalizeText('clothesshop.title') } onCloseClick={ () => setIsVisible(false) } />
            <NitroCardTabsView>
                { Object.keys(CATEGORY_TYPES).map(category =>
                    <NitroCardTabsItemView key={ category } isActive={ activeCategory === category } onClick={ () => setActiveCategory(category) }>
                        { LocalizeText(`avatareditor.category.${ (category === 'face') ? 'hd' : category }`) }
                    </NitroCardTabsItemView>) }
            </NitroCardTabsView>
            <NitroCardContentView overflow="hidden">
                <Grid overflow="hidden" fullHeight>
                    <Column size={ 9 } overflow="hidden" gap={ 2 }>
                        <AutoGrid columnCount={ 5 } columnMinWidth={ 70 } columnMinHeight={ 70 } overflow="auto" fullHeight>
                            { visibleItems.map(item =>
                            {
                                const isOwned = ownedIds.has(item.clothingId);
                                const inBasket = basket.has(item.clothingId);

                                return (
                                    <LayoutGridItem key={ item.clothingId } itemImage={ GetRoomEngine().getFurnitureFloorIconUrl(item.spriteId) } itemActive={ inBasket } disabled={ isOwned } pointer={ !isOwned } onClick={ () => toggleBasket(item) }>
                                        { isOwned &&
                                            <Text center small className="clothes-shop-owned-badge">{ LocalizeText('clothesshop.owned') }</Text> }
                                        { !isOwned && inBasket &&
                                            <Text center small className="clothes-shop-basket-badge">{ LocalizeText('clothesshop.in_basket') }</Text> }
                                    </LayoutGridItem>
                                );
                            }) }
                        </AutoGrid>
                        { // real habbocity.tel/Habz pattern (confirmed live, not guessed): the grid tiles themselves
                          // carry no price - a single info bar below shows whichever item was last clicked (name +
                          // price + a context add/remove button), rather than a price label on every tile.
                        }
                        <Flex alignItems="center" justifyContent="between" gap={ 2 } className="clothes-shop-footer">
                            { focusedItem &&
                                <>
                                    <Flex alignItems="center" gap={ 2 } overflow="hidden">
                                        <Text truncate>{ focusedItem.publicName || focusedItem.name }</Text>
                                        { !ownedIds.has(focusedItem.clothingId) &&
                                            <Flex alignItems="center" gap={ 1 }>
                                                <Text bold>{ (focusedItem.costCredits > 0) ? focusedItem.costCredits : focusedItem.costPoints }</Text>
                                                <LayoutCurrencyIcon type={ (focusedItem.costCredits > 0) ? -1 : focusedItem.pointsType } />
                                            </Flex> }
                                    </Flex>
                                    { !ownedIds.has(focusedItem.clothingId) &&
                                        <Button variant={ basket.has(focusedItem.clothingId) ? 'danger' : 'success' } disabled={ isPending } onClick={ () => toggleBasket(focusedItem) }>
                                            { LocalizeText(basket.has(focusedItem.clothingId) ? 'clothesshop.remove' : 'clothesshop.select') }
                                        </Button> }
                                </> }
                        </Flex>
                        <Flex alignItems="center" justifyContent="between" gap={ 2 } className="clothes-shop-buy-bar">
                            <Flex alignItems="center" gap={ 2 }>
                                { (totalCredits > 0) &&
                                    <Flex alignItems="center" gap={ 1 }>
                                        <Text bold>{ totalCredits }</Text>
                                        <LayoutCurrencyIcon type={ -1 } />
                                    </Flex> }
                                { Array.from(totalPoints.entries()).map(([ type, amount ]) =>
                                    <Flex alignItems="center" gap={ 1 } key={ type }>
                                        <Text bold>{ amount }</Text>
                                        <LayoutCurrencyIcon type={ type } />
                                    </Flex>) }
                            </Flex>
                            <Button variant="success" disabled={ isPending || !basket.size } onClick={ buyAll }>
                                { isPending ? LocalizeText('clothesshop.buying') : LocalizeText('clothesshop.buy', [ 'count' ], [ basket.size.toString() ]) }
                            </Button>
                        </Flex>
                    </Column>
                    <Column size={ 3 } overflow="hidden">
                        <AvatarEditorFigurePreviewView figureData={ previewFigureData } />
                    </Column>
                </Grid>
            </NitroCardContentView>
        </NitroCardView>
    );
}
