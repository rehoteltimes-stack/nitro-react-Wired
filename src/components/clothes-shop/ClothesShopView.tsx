import { ILinkEventTracker } from '@nitrots/nitro-renderer';
import { FC, useEffect, useMemo, useRef, useState } from 'react';
import { AddEventLinkTracker, ClothesShopBuyComposer, ClothesShopDataEvent, ClothesShopItemData, ClothesShopOwnedEvent, ClothesShopRequestComposer, ClothesShopResultCode, ClothesShopResultEvent, FigureData, GetAvatarRenderManager, GetRoomEngine, GetSessionDataManager, LocalizeText, RegisterClothesShopMessages, RemoveLinkEventTracker, SendMessageComposer } from '../../api';
import { Base, Button, Flex, LayoutCurrencyIcon, LayoutGridItem, NitroCardHeaderView, NitroCardTabsItemView, NitroCardTabsView, NitroCardView, ScrollContainer, Text } from '../../common';
import { useMessageEvent, useNotification } from '../../hooks';
import { useAvatarEditorGridColumns } from '../avatar-editor/useAvatarEditorGridColumns';
import { AvatarEditorFigurePreviewView } from '../avatar-editor/views/AvatarEditorFigurePreviewView';

// Real, deliberate deviation from stock Arcturus (and from habbocity.fr's own real client, which matches stock
// exactly here): buying grants the clothing straight into the wardrobe, no furni/room step - see
// hcms-emulator-plugin's ClothesShopProtocol.java for the full write-up of why, and ClothesShopService.java for
// the server-side grant logic this view's Buy button ultimately triggers.
//
// Structural shape (2026-09-22 rebuild): matched byte-for-byte to the outfit editor's now-corrected real
// structure (AvatarEditorView.tsx/AvatarEditorModelView.tsx) - .nitro-avatar-editor's own real CSS
// (_32-nitro-avatar.scss), figure-preview-section, the 40x40px flex-wrap item grid with the same
// useAvatarEditorGridColumns row-chunking, and the same bottom full-width action-button row - rather than the
// old col-9/col-3 Grid + 70px AutoGrid tiles this file used before that rebuild (which predated it and was
// never revisited). No wardrobe sidebar here (nothing analogous to save/load a look exists for a shop), and no
// colour-picker/palette column (ClothesShopItemData carries no colour/palette concept at all, confirmed in
// ClothesShopProtocol.ts) - the right column instead shows the currently-focused item's own name/price/action,
// which is this feature's real equivalent of that space.
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
    const gridRef = useRef<HTMLDivElement>(null);
    const columnCount = useAvatarEditorGridColumns(gridRef, [ isVisible ]);

    RegisterClothesShopMessages();

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

    const rows = useMemo(() =>
    {
        const rows: ClothesShopItemData[][] = [];

        for(let i = 0; i < visibleItems.length; i += columnCount) rows.push(visibleItems.slice(i, (i + columnCount)));

        return rows;
    }, [ visibleItems, columnCount ]);

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
        <NitroCardView uniqueKey="clothes-shop" className="nitro-avatar-editor clothes-shop" overflow="visible" gap={ 3 }>
            <NitroCardHeaderView headerText={ LocalizeText('clothesshop.title') } onCloseClick={ () => setIsVisible(false) } />
            <Flex gap={ 3 } classNames={ [ 'nitro-avatar-editor-content' ] }>
                <Flex column fullWidth gap={ 2 }>
                    <NitroCardTabsView>
                        { Object.keys(CATEGORY_TYPES).map(category =>
                            <NitroCardTabsItemView key={ category } isActive={ activeCategory === category } onClick={ () => setActiveCategory(category) }>
                                { LocalizeText(`avatareditor.category.${ (category === 'face') ? 'hd' : category }`) }
                            </NitroCardTabsItemView>) }
                    </NitroCardTabsView>
                    <Flex fullWidth fullHeight gap={ 2 } overflow="hidden">
                        <Flex column fullWidth fullHeight gap={ 2 } grow>
                            <Flex fullWidth grow style={ { flexBasis: 0 } } classNames={ [ 'figure-preview-section' ] }>
                                <AvatarEditorFigurePreviewView figureData={ previewFigureData } />
                            </Flex>
                            <Flex column fullWidth overflow="hidden" gap={ 2 } grow style={ { flexBasis: 0 } }>
                                <ScrollContainer>
                                    <Flex innerRef={ gridRef } column fullWidth>
                                        { rows.map((row, rowIndex) =>
                                            <Flex key={ rowIndex } fullWidth justifyContent="center">
                                                { row.map(item =>
                                                {
                                                    const isOwned = ownedIds.has(item.clothingId);
                                                    const inBasket = basket.has(item.clothingId);

                                                    return (
                                                        <LayoutGridItem key={ item.clothingId } classNames={ [ 'avatar-editor-figure-set-item' ] } itemImage={ GetRoomEngine().getFurnitureFloorIconUrl(item.spriteId) } itemActive={ inBasket } disabled={ isOwned } pointer={ !isOwned } onClick={ () => toggleBasket(item) }>
                                                            { isOwned &&
                                                                <Text center small className="clothes-shop-owned-badge">{ LocalizeText('clothesshop.owned') }</Text> }
                                                            { !isOwned && inBasket &&
                                                                <Text center small className="clothes-shop-basket-badge">{ LocalizeText('clothesshop.in_basket') }</Text> }
                                                        </LayoutGridItem>
                                                    );
                                                }) }
                                            </Flex>) }
                                    </Flex>
                                </ScrollContainer>
                            </Flex>
                        </Flex>
                        <Flex column fullWidth fullHeight center gap={ 2 } className="clothes-shop-details">
                            { !focusedItem &&
                                <Text center small>{ LocalizeText('clothesshop.hint') }</Text> }
                            { focusedItem &&
                                <>
                                    <Text center bold truncate>{ focusedItem.publicName || focusedItem.name }</Text>
                                    { !ownedIds.has(focusedItem.clothingId) &&
                                        <Flex center gap={ 1 }>
                                            <Text bold>{ (focusedItem.costCredits > 0) ? focusedItem.costCredits : focusedItem.costPoints }</Text>
                                            <LayoutCurrencyIcon type={ (focusedItem.costCredits > 0) ? -1 : focusedItem.pointsType } />
                                        </Flex> }
                                    { ownedIds.has(focusedItem.clothingId) &&
                                        <Text center>{ LocalizeText('clothesshop.owned') }</Text> }
                                    { !ownedIds.has(focusedItem.clothingId) &&
                                        <Button variant={ basket.has(focusedItem.clothingId) ? 'danger' : 'success' } disabled={ isPending } onClick={ () => toggleBasket(focusedItem) }>
                                            { LocalizeText(basket.has(focusedItem.clothingId) ? 'clothesshop.remove' : 'clothesshop.select') }
                                        </Button> }
                                </> }
                        </Flex>
                    </Flex>
                    { /* Real, own-feature adaptation per explicit user direction: "1:1 like the outfit editor,
                         only where [it] save[s] outfits it should be the list[ing of] which clothes [are]
                         chosen in [the] basket, all other same like choosing clothes and stuff". The outfit
                         editor's bottom row ends in one full-width action button (Save); a shop's real
                         equivalent of "what you're about to commit" isn't a single action, it's the actual
                         basket contents - so that same full-width slot now lists every basketed item (icon +
                         name, click to remove) instead of just a plain "Buy (n)" label, while everything else
                         (grid, tabs, figure preview, per-item selection panel) stays identical to the editor. */ }
                    <Flex grow gap={ 2 }>
                        <Flex alignItems="center" gap={ 2 }>
                            { (totalCredits > 0) &&
                                <Flex alignItems="center" gap={ 1 }>
                                    <Text bold variant="muted">{ totalCredits }</Text>
                                    <LayoutCurrencyIcon type={ -1 } />
                                </Flex> }
                            { Array.from(totalPoints.entries()).map(([ type, amount ]) =>
                                <Flex alignItems="center" gap={ 1 } key={ type }>
                                    <Text bold variant="muted">{ amount }</Text>
                                    <LayoutCurrencyIcon type={ type } />
                                </Flex>) }
                        </Flex>
                        <Flex fullWidth grow overflow="auto" alignItems="center" gap={ 1 } classNames={ [ 'flex-nowrap' ] }>
                            { Array.from(basket).map(clothingId =>
                            {
                                const item = items.find(i => (i.clothingId === clothingId));

                                if(!item) return null;

                                return (
                                    <Flex key={ clothingId } shrink pointer alignItems="center" gap={ 1 } className="btn btn-primary btn-xsm" onClick={ () => toggleBasket(item) }>
                                        <Base style={ { width: 24, height: 24, backgroundImage: `url(${ GetRoomEngine().getFurnitureFloorIconUrl(item.spriteId) })`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat' } } />
                                        <Text small truncate>{ item.publicName || item.name }</Text>
                                    </Flex>
                                );
                            }) }
                            { /* No real locale key exists for this (own-feature basket, not in ExternalTexts.json's
                                 real clothesshop.* set) - plain literal string, same honest-gap precedent as
                                 User Settings' Moderate tab. */ }
                            { !basket.size &&
                                <Text small variant="muted">{ LocalizeText('clothesshop.basket.empty') }</Text> }
                        </Flex>
                        <Button variant="success" className="clothes-shop-buy" disabled={ isPending || !basket.size } onClick={ buyAll }>
                            { isPending ? LocalizeText('clothesshop.buying') : LocalizeText('clothesshop.buy', [ 'count' ], [ basket.size.toString() ]) }
                        </Button>
                    </Flex>
                </Flex>
            </Flex>
        </NitroCardView>
    );
}
