import { BadgePointLimitsEvent, ILinkEventTracker, IRoomSession, RoomEngineObjectEvent, RoomEngineObjectPlacedEvent, RoomPreviewer, RoomSessionEvent } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AddEventLinkTracker, GetLocalization, GetRoomEngine, isObjectMoverRequested, LocalizeText, RemoveLinkEventTracker, setObjectMoverRequested, UnseenItemCategory } from '../../api';
import { NitroCardContentView, NitroCardHeaderView, NitroCardTabsItemView, NitroCardTabsView, NitroCardView } from '../../common';
import { useInventoryTrade, useInventoryUnseenTracker, useMessageEvent, useRoomEngineEvent, useRoomSessionManagerEvent } from '../../hooks';
import { InventoryBadgeView } from './views/badge/InventoryBadgeView';
import { InventoryBannerView } from './views/banner/InventoryBannerView';
import { InventoryBotView } from './views/bot/InventoryBotView';
import { InventoryFurnitureView } from './views/furniture/InventoryFurnitureView';
import { InventoryTradeView } from './views/furniture/InventoryTradeView';
import { InventoryPetView } from './views/pet/InventoryPetView';

// Tab set + order verified live against the real reference (habbocity.fr): Mobiliers/Bots/Animaux/Badges/Bannières -
// no separate Rares or Clothing tab exists there at all (also confirmed in the reference's own minified source,
// the real xD/eu category arrays: [FURNI, BOT, PET, BADGE, BANNERS]).
const TAB_FURNITURE: string = 'inventory.furni';
const TAB_BOTS: string = 'inventory.bots';
const TAB_PETS: string = 'inventory.furni.tab.pets';
const TAB_BADGES: string = 'inventory.badges';
const TAB_BANNERS: string = 'inventory.banners';
const TABS = [ TAB_FURNITURE, TAB_BOTS, TAB_PETS, TAB_BADGES, TAB_BANNERS ];
const UNSEEN_CATEGORIES = [ UnseenItemCategory.FURNI, UnseenItemCategory.BOT, UnseenItemCategory.PET, UnseenItemCategory.BADGE, undefined ];

export const InventoryView: FC<{}> = props =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const [ currentTab, setCurrentTab ] = useState<string>(TABS[0]);
    const [ roomSession, setRoomSession ] = useState<IRoomSession>(null);
    const [ roomPreviewer, setRoomPreviewer ] = useState<RoomPreviewer>(null);
    // Real reference: every tab's own search bar (.holo-main-search-bar-input-element) is a direct child of
    // .content-area-inner, a full-width sibling BEFORE .nitro-card-tabs - confirmed live on Furniture (with real
    // owned items) AND Badges (21 real owned badges, typing genuinely filtered 21->2 and back to 21 on clear, not
    // decorative). Previously each tab's own search markup (where one existed at all) was rendered from INSIDE
    // that tab's own content view, nested in its left grid column - only 7/12 width, positioned below the tabs
    // instead of above them. Rather than lifting every tab's own filter state up into this shared component
    // (mixing this component's own concerns with each tab's very different filtering logic), each active tab
    // portals its own search bar into this one slot, which sits in the real DOM position - keeps the working
    // logic where it already lives, fixes only the real DOM-position/width bug.
    const [ searchSlot, setSearchSlot ] = useState<HTMLDivElement>(null);
    const { isTrading = false, stopTrading = null } = useInventoryTrade();
    const { getCount = null, resetCategory = null } = useInventoryUnseenTracker();

    const onClose = () =>
    {
        if(isTrading) stopTrading();

        setIsVisible(false);
    }

    useRoomEngineEvent<RoomEngineObjectPlacedEvent>(RoomEngineObjectEvent.PLACED, event =>
    {
        if(!isObjectMoverRequested()) return;

        setObjectMoverRequested(false);

        if(!event.placedInRoom) setIsVisible(true);
    });

    useRoomSessionManagerEvent<RoomSessionEvent>([
        RoomSessionEvent.CREATED,
        RoomSessionEvent.ENDED
    ], event =>
    {
        switch(event.type)
        {
            case RoomSessionEvent.CREATED:
                setRoomSession(event.session);
                return;
            case RoomSessionEvent.ENDED:
                setRoomSession(null);
                setIsVisible(false);
                return;
        }
    });

    useMessageEvent<BadgePointLimitsEvent>(BadgePointLimitsEvent, event =>
    {
        const parser = event.getParser();

        for(const data of parser.data) GetLocalization().setBadgePointLimit(data.badgeId, data.limit);
    });

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
            eventUrlPrefix: 'inventory/'
        };

        AddEventLinkTracker(linkTracker);

        return () => RemoveLinkEventTracker(linkTracker);
    }, []);

    useEffect(() =>
    {
        setRoomPreviewer(new RoomPreviewer(GetRoomEngine(), ++RoomPreviewer.PREVIEW_COUNTER));

        return () =>
        {
            setRoomPreviewer(prevValue =>
            {
                prevValue.dispose();

                return null;
            });
        }
    }, []);

    useEffect(() =>
    {
        if(!isVisible && isTrading) setIsVisible(true);
    }, [ isVisible, isTrading ]);

    if(!isVisible) return null;

    // Real reference: .nitro-inventory's own resize-handler carries `cursor: nwse-resize` (RESIZE_CURSORS
    // confirms this is exactly the 'both' direction, same as Catalog's own already-correct resize="both"), and
    // its own computed overflow is `visible` (matching Catalog/Navigator's own overflow="visible") - confirmed
    // live via CDP, not assumed from Catalog's pattern alone. Previously neither prop was passed at all, so no
    // resize-handler ever rendered - this window was silently non-resizable this whole time.
    return (
        <NitroCardView uniqueKey={ 'inventory' } className="nitro-inventory" theme={ isTrading ? 'primary' : '' } resize="both" overflow="visible" >
            <NitroCardHeaderView headerText={ LocalizeText('inventory.title') } onCloseClick={ onClose } />
            { /* Real reference structure, CDP-confirmed against the live habbocity.fr Inventory (every tab
                 checked, not assumed shared): the card root's own children are exactly
                 [nitro-card-header, content-area, resize-handler] - NitroCardTabsView is NOT a sibling of
                 content-area, it lives INSIDE content-area-inner, alongside a per-tab search bar, ABOVE the
                 tab's own content grid. This differs from Catalog's own proven-correct pattern (search+tabs
                 inside NitroCardContentView, but the actual page content in a SEPARATE sibling
                 .nitro-catalog-content) - Inventory nests everything, tabs AND content, inside the one
                 content-area-inner. Previously this rendered NitroCardTabsView as a sibling BEFORE
                 NitroCardContentView entirely, outside .content-area - confirmed wrong via direct root
                 .children comparison, not assumed. */ }
            { !isTrading &&
                <NitroCardContentView>
                    <div ref={ element => setSearchSlot(element) } style={ { display: 'contents' } } />
                    <NitroCardTabsView>
                        { TABS.map((name, index) =>
                        {
                            return (
                                <NitroCardTabsItemView key={ index } isActive={ (currentTab === name) } onClick={ event => setCurrentTab(name) } count={ getCount(UNSEEN_CATEGORIES[index]) }>
                                    { LocalizeText(name) }
                                </NitroCardTabsItemView>
                            );
                        }) }
                    </NitroCardTabsView>
                    { (currentTab === TAB_FURNITURE ) &&
                        <InventoryFurnitureView roomSession={ roomSession } roomPreviewer={ roomPreviewer } searchSlot={ searchSlot } /> }
                    { (currentTab === TAB_BOTS ) &&
                        <InventoryBotView roomSession={ roomSession } roomPreviewer={ roomPreviewer } searchSlot={ searchSlot } /> }
                    { (currentTab === TAB_PETS ) &&
                        <InventoryPetView roomSession={ roomSession } roomPreviewer={ roomPreviewer } searchSlot={ searchSlot } /> }
                    { (currentTab === TAB_BADGES ) &&
                        <InventoryBadgeView searchSlot={ searchSlot } /> }
                    { (currentTab === TAB_BANNERS ) &&
                        <InventoryBannerView searchSlot={ searchSlot } /> }
                </NitroCardContentView> }
            { isTrading &&
                <NitroCardContentView>
                    <InventoryTradeView cancelTrade={ onClose } />
                </NitroCardContentView> }
        </NitroCardView>
    );
}
