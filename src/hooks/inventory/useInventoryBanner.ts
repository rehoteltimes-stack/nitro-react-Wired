import { useState } from 'react';
import { useBetween } from 'use-between';

// The reference's real "Banners" tab is backed by two SessionDataManager fields
// (inventoryBannerList / activeBannerCode) plus a dedicated composer/event pair, all added by
// HabboCity's own server fork - none of it exists in this project's vendored @nitrots/nitro-renderer
// (confirmed: no matches for inventoryBannerList/activeBannerCode/BannerChangedEvent/any Banner
// composer anywhere in node_modules). Real UI structure is built (see InventoryBannerView /
// InventoryBannerItemView), but with no server-side protocol to back it, `banners` stays an empty
// list - the tab honestly renders the reference's own real "no banners" empty state, same as the
// Floor tab / FaRecycle button precedent elsewhere in this project: don't fabricate a mechanism
// that isn't there.
const useInventoryBannerState = () =>
{
    const [ banners ] = useState<string[]>([]);
    const [ activeBannerCode, setActiveBannerCodeState ] = useState<string>('');
    const [ selectedBannerCode, setSelectedBannerCode ] = useState<string>('');

    const setActiveBanner = (code: string) =>
    {
        setActiveBannerCodeState(code);

        // no real composer exists to persist this server-side yet - see the module comment above.
    }

    return { banners, activeBannerCode, selectedBannerCode, setSelectedBannerCode, setActiveBanner };
}

export const useInventoryBanner = () => useBetween(useInventoryBannerState);
