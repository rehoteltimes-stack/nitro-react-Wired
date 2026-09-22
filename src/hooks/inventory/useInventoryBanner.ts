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
        setSelectedBannerId(parser.activeBannerId);
    });

    useMessageEvent<BannerActiveChangedEvent>(BannerActiveChangedEvent, event =>
    {
        setActiveBannerId(event.getParser().activeBannerId);
    });

    const requestBanners = () => SendMessageComposer(new BannerRequestComposer());

    const setActiveBanner = (bannerId: number) => SendMessageComposer(new BannerSetActiveComposer(bannerId));

    return { banners, activeBannerId, selectedBannerId, setSelectedBannerId, setActiveBanner, requestBanners };
}

export const useInventoryBanner = () => useBetween(useInventoryBannerState);
