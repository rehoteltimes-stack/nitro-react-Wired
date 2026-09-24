import { PurchaseFromCatalogComposer } from '@nitrots/nitro-renderer';
import { FC, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { CatalogPurchaseState, CreateLinkEvent, DispatchUiEvent, GetClubMemberLevel, LocalizeText, LocalStorageKeys, Offer, SendMessageComposer } from '../../../../../api';
import { Button, LayoutLoadingSpinnerView } from '../../../../../common';
import { CatalogEvent, CatalogInitGiftEvent, CatalogPurchasedEvent, CatalogPurchaseFailureEvent, CatalogPurchaseNotAllowedEvent, CatalogPurchaseSoldOutEvent } from '../../../../../events';
import { useCatalog, useLocalStorage, usePurse, useUiEvent } from '../../../../../hooks';

interface CatalogPurchaseWidgetViewProps
{
    noGiftOption?: boolean;
    purchaseCallback?: () => void;
    // Real reference order is Gift -> quantity control -> Buy, all as one flex row (verified via CDP: gift/buy
    // buttons are 150px each, flex-grow-1, sandwiched around a 166px content-sized quantity box). Gift/Buy stay
    // owned by this single component (shared purchase/gift/confirm/club-level/sold-out state machine), so the
    // quantity control is accepted as a slot rendered between them rather than duplicated or reordered by the
    // 9 different call sites that each know whether they have one to pass.
    children?: ReactNode;
}

export const CatalogPurchaseWidgetView: FC<CatalogPurchaseWidgetViewProps> = props =>
{
    const { noGiftOption = false, purchaseCallback = null, children = null } = props;
    const [ purchaseWillBeGift, setPurchaseWillBeGift ] = useState(false);
    const [ purchaseState, setPurchaseState ] = useState(CatalogPurchaseState.NONE);
    const [ catalogSkipPurchaseConfirmation, setCatalogSkipPurchaseConfirmation ] = useLocalStorage(LocalStorageKeys.CATALOG_SKIP_PURCHASE_CONFIRMATION, false);
    const { currentOffer = null, currentPage = null, purchaseOptions = null, setPurchaseOptions = null } = useCatalog();
    const { getCurrencyAmount = null } = usePurse();

    const onCatalogEvent = useCallback((event: CatalogEvent) =>
    {
        switch(event.type)
        {
            case CatalogPurchasedEvent.PURCHASE_SUCCESS:
                setPurchaseState(CatalogPurchaseState.NONE);
                return;
            case CatalogPurchaseFailureEvent.PURCHASE_FAILED:
                setPurchaseState(CatalogPurchaseState.FAILED);
                return;
            case CatalogPurchaseNotAllowedEvent.NOT_ALLOWED:
                setPurchaseState(CatalogPurchaseState.FAILED);
                return;
            case CatalogPurchaseSoldOutEvent.SOLD_OUT:
                setPurchaseState(CatalogPurchaseState.SOLD_OUT);
                return;
        }
    }, []);

    useUiEvent(CatalogPurchasedEvent.PURCHASE_SUCCESS, onCatalogEvent);
    useUiEvent(CatalogPurchaseFailureEvent.PURCHASE_FAILED, onCatalogEvent);
    useUiEvent(CatalogPurchaseNotAllowedEvent.NOT_ALLOWED, onCatalogEvent);
    useUiEvent(CatalogPurchaseSoldOutEvent.SOLD_OUT, onCatalogEvent);

    const isLimitedSoldOut = useMemo(() =>
    {
        if(!currentOffer) return false;
        
        if(purchaseOptions.extraParamRequired && (!purchaseOptions.extraData || !purchaseOptions.extraData.length)) return false;

        if(currentOffer.pricingModel === Offer.PRICING_MODEL_SINGLE)
        {
            const product = currentOffer.product;

            if(product && product.isUniqueLimitedItem) return !product.uniqueLimitedItemsLeft;
        }

        return false;
    }, [ currentOffer, purchaseOptions ]);

    const purchase = (isGift: boolean = false) =>
    {
        if(!currentOffer) return;

        if(GetClubMemberLevel() < currentOffer.clubLevel)
        {
            CreateLinkEvent('habboUI/open/hccenter');

            return;
        }

        if(isGift)
        {
            DispatchUiEvent(new CatalogInitGiftEvent(currentOffer.page.pageId, currentOffer.offerId, purchaseOptions.extraData));

            return;
        }

        setPurchaseState(CatalogPurchaseState.PURCHASE);

        if(purchaseCallback)
        {
            purchaseCallback();

            return;
        }

        let pageId = currentOffer.page.pageId;

        // if(pageId === -1)
        // {
        //     const nodes = getNodesByOfferId(currentOffer.offerId);

        //     if(nodes) pageId = nodes[0].pageId;
        // }

        SendMessageComposer(new PurchaseFromCatalogComposer(pageId, currentOffer.offerId, purchaseOptions.extraData, purchaseOptions.quantity));
    }

    useEffect(() =>
    {
        if(!currentOffer) return;

        setPurchaseState(CatalogPurchaseState.NONE);
    }, [ currentOffer, setPurchaseOptions ]);

    useEffect(() =>
    {
        let timeout: ReturnType<typeof setTimeout> = null;

        if((purchaseState === CatalogPurchaseState.CONFIRM) || (purchaseState === CatalogPurchaseState.FAILED))
        {
            timeout = setTimeout(() => setPurchaseState(CatalogPurchaseState.NONE), 3000);
        }

        return () =>
        {
            if(timeout) clearTimeout(timeout);
        }
    }, [ purchaseState ]);

    if(!currentOffer) return null;

    const PurchaseButton = () =>
    {
        const priceCredits = (currentOffer.priceInCredits * purchaseOptions.quantity);
        const pricePoints = (currentOffer.priceInActivityPoints * purchaseOptions.quantity);

        if(GetClubMemberLevel() < currentOffer.clubLevel) return <Button grow variant="danger" disabled>{ LocalizeText('catalog.alert.hc.required') }</Button>;

        if(isLimitedSoldOut) return <Button grow variant="danger" disabled>{ LocalizeText('catalog.alert.limited_edition_sold_out.title') }</Button>;

        if(priceCredits > getCurrencyAmount(-1)) return <Button grow variant="danger" disabled>{ LocalizeText('catalog.alert.notenough.title') }</Button>;

        if(pricePoints > getCurrencyAmount(currentOffer.activityPointType)) return <Button grow variant="danger" disabled>{ LocalizeText('catalog.alert.notenough.activitypoints.title.' + currentOffer.activityPointType) }</Button>;

        switch(purchaseState)
        {
            case CatalogPurchaseState.CONFIRM:
                return <Button grow variant="warning" onClick={ event => purchase() }>{ LocalizeText('catalog.marketplace.confirm_title') }</Button>;
            case CatalogPurchaseState.PURCHASE:
                return <Button grow disabled><LayoutLoadingSpinnerView /></Button>;
            case CatalogPurchaseState.FAILED:
                return <Button grow variant="danger">{ LocalizeText('generic.failed') }</Button>;
            case CatalogPurchaseState.SOLD_OUT:
                return <Button grow variant="danger">{ LocalizeText('generic.failed') + ' - ' + LocalizeText('catalog.alert.limited_edition_sold_out.title') }</Button>;
            case CatalogPurchaseState.NONE:
            default:
                return <Button grow variant="success" disabled={ (purchaseOptions.extraParamRequired && (!purchaseOptions.extraData || !purchaseOptions.extraData.length)) } onClick={ event => setPurchaseState(CatalogPurchaseState.CONFIRM) }>{ LocalizeText('catalog.purchase_confirmation.' + (currentOffer.isRentOffer ? 'rent' : 'buy')) }</Button>;
        }
    }

    // Real reference order (verified via CDP): gift button first (btn-warning "Offrir"), buy/confirm button
    // last (btn-success "Acheter") - ours previously rendered Buy before Gift. Both buttons carry `grow`
    // (flex-grow-1) because the reference's own gift/buy buttons equally split whatever width the fixed-content
    // quantity control (see CatalogSpinnerWidgetView) doesn't use - confirmed via computed-style diffing
    // (reference: 150px/150px either side of a 166px content-sized spinner box, summing exactly to the row's
    // real 482px width).
    return (
        <>
            { (!noGiftOption && !currentOffer.isRentOffer) &&
                <Button grow variant="warning" disabled={ ((purchaseOptions.quantity > 1) || !currentOffer.giftable || isLimitedSoldOut || (purchaseOptions.extraParamRequired && (!purchaseOptions.extraData || !purchaseOptions.extraData.length))) } onClick={ event => purchase(true) }>
                    { LocalizeText('catalog.purchase_confirmation.gift') }
                </Button> }
            { children }
            <PurchaseButton />
        </>
    );
}
