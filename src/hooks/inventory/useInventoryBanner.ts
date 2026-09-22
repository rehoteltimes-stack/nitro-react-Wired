import { useState } from 'react';
import { useBetween } from 'use-between';
import { BannerActiveChangedEvent, BannerDataEvent, BannerItemData, BannerRequestComposer, BannerSetActiveComposer, RegisterBannerMessages, SendMessageComposer } from '../../api';
import { useMessageEvent } from '../events';

// Real protocol, bridging hCMS's already-live website banner purchase flow (App\Domain\Banners) to the client -
// see api/inventory/BannerProtocol.ts and hcms-emulator-plugin's own BannerProtocol.java for the wire format.
//
// Real bug fixed here, found via CDP + server-side debug logging (not guessed): BannerRequestEvent on the
// server ran correctly and sent back a real BannerDataComposer (opcode 9531) with the account's real owned
// banners, but the client's own Inventory > Banners tab still showed "No banners". Root cause traced to hook
// ordering, confirmed by comparing against the confirmed-working ClothesShop equivalent (ClothesShopView.tsx,
// which calls RegisterClothesShopMessages() in its OWN first useEffect, before any useMessageEvent hook is
// declared). InventoryBannerView.tsx called useInventoryBanner() - which internally calls
// useMessageEvent<BannerDataEvent>/<BannerActiveChangedEvent> - BEFORE its own effect that calls
// RegisterBannerMessages(). React commits effects in hook-declaration order, so the useMessageEvent hooks'
// own registration effects (SocketConnection.addMessageEvent -> MessageClassManager.registerMessageEvent,
// which looks up the header via getEventId()) ran first, while BannerDataEvent/BannerActiveChangedEvent were
// still unknown to MessageClassManager's header map - getEventId() returned -1 and the registration silently
// no-opped (confirmed by reading MessageClassManager.ts/SocketConnection.ts directly, not assumed). The real
// 9531/9532 responses then arrived with zero live listeners and were dropped as "UNREGISTERED". Fixed by
// registering here, synchronously, before the useMessageEvent calls below - this hook is the one real place
// guaranteed to run first regardless of which component/order calls useInventoryBanner(), unlike relying on
// the calling view's own effect ordering. RegisterBannerMessages() is idempotent (its own `registered` guard).
const useInventoryBannerState = () =>
{
    RegisterBannerMessages();

    const [ banners, setBanners ] = useState<BannerItemData[]>([]);
    const [ activeBannerId, setActiveBannerId ] = useState<number>(-1);
    const [ selectedBannerId, setSelectedBannerId ] = useState<number>(-1);

    useMessageEvent<BannerDataEvent>(BannerDataEvent, event =>
    {
        const parser = event.getParser();

        setBanners(parser.items);
        setActiveBannerId(parser.activeBannerId);
        // When nothing is worn (activeBannerId === -1), default the selection to the first owned banner rather
        // than leaving it at -1 - same "select the first item when nothing else applies" convention this
        // project's own useInventoryBadges.ts already uses for its own selectedBadgeCode.
        setSelectedBannerId((parser.activeBannerId !== -1) ? parser.activeBannerId : (parser.items[0]?.bannerId ?? -1));
    });

    useMessageEvent<BannerActiveChangedEvent>(BannerActiveChangedEvent, event =>
    {
        const newActiveBannerId = event.getParser().activeBannerId;

        setActiveBannerId(newActiveBannerId);

        // Same "default to the first owned banner when nothing is worn" rule as the BannerDataEvent handler above,
        // applied here too so it also covers Remove (not just the initial load). Deliberately done here, against
        // this hook's own `banners` closure, rather than in InventoryBannerView's click handler - use-between
        // re-invokes this whole hook body on every state change, and a value read from a component's own render
        // closure at click time was observed live to be stale (banners[0] resolved to undefined even though the
        // list clearly still had all 4 items) - the exact class of race already documented at the top of this
        // file. This callback is itself recreated fresh on every one of those re-invocations, so `banners` here
        // is always the one from the render that produced this specific callback instance.
        if(newActiveBannerId === -1) setSelectedBannerId(banners.length ? banners[0].bannerId : -1);
    });

    const requestBanners = () => SendMessageComposer(new BannerRequestComposer());

    const setActiveBanner = (bannerId: number) => SendMessageComposer(new BannerSetActiveComposer(bannerId));

    return { banners, activeBannerId, selectedBannerId, setSelectedBannerId, setActiveBanner, requestBanners };
}

export const useInventoryBanner = () => useBetween(useInventoryBannerState);
