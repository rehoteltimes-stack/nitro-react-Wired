import { useState } from 'react';
import { useBetween } from 'use-between';
import { BannerActiveChangedEvent, BannerDataEvent, BannerItemData, BannerRequestComposer, BannerSetActiveComposer, SendMessageComposer } from '../../api';
import { useMessageEvent } from '../events';

// Real protocol, bridging hCMS's already-live website banner purchase flow (App\Domain\Banners) to the client -
// see api/inventory/BannerProtocol.ts and hcms-emulator-plugin's own BannerProtocol.java for the wire format.
const useInventoryBannerState = () =>
{
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
