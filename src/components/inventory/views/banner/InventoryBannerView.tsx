import { FC, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { BannerItemData } from '../../../../api';
import { Button, Column, Flex, Grid, ScrollContainer, Text } from '../../../../common';
import { useInventoryBanner } from '../../../../hooks';
import { InventoryCategoryEmptyView } from '../InventoryCategoryEmptyView';
import { InventoryBannerItemView } from './InventoryBannerItemView';
import { InventoryBannerSearchView } from './InventoryBannerSearchView';

export interface InventoryBannerViewProps
{
    // Real reference: the search bar is a full-width sibling ABOVE the tabs - see InventoryView.tsx's own
    // comment for the real DOM position and why a portal is used.
    searchSlot?: HTMLDivElement;
}

export const InventoryBannerView: FC<InventoryBannerViewProps> = props =>
{
    const { searchSlot = null } = props;
    // Message-class registration (RegisterBannerMessages) happens inside useInventoryBanner() itself now, before
    // its own useMessageEvent subscriptions - see that hook's own comment for the real ordering bug this fixes.
    const { banners = [], activeBannerId = -1, selectedBannerId = -1, setSelectedBannerId = null, setActiveBanner = null, requestBanners = null } = useInventoryBanner();
    const [ filteredBanners, setFilteredBanners ] = useState<BannerItemData[]>([]);

    useEffect(() =>
    {
        requestBanners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Real, previously-missing feature: the reference's Banners tab also has this same search bar - see
    // InventoryBannerSearchView's own comment for what's confirmed vs. implemented-for-consistency here.
    useEffect(() =>
    {
        setFilteredBanners(banners);
    }, [ banners ]);

    const searchPortal = searchSlot && createPortal(<InventoryBannerSearchView banners={ banners } setBanners={ setFilteredBanners } />, searchSlot);

    if(!banners.length)
    {
        return (
            <>
                { searchPortal }
                <InventoryCategoryEmptyView title="No banners" desc="You don't have any profile banners yet. Buy one from the website's Center > Banners page." />
            </>
        );
    }

    // Real reference structure, CDP-captured against the live habbocity.fr Bannières tab:
    // .g-col-9.inventory-item-list > .scroll-container (this project's own ScrollContainer) > .scroll-content.vertical
    //   > .d-flex (row) > one .inventory-banner-item per owned banner. The red .active border tracks whichever
    //   item was last CLICKED (selectedBannerId) - confirmed against the running app, not the merely-worn one
    //   (activeBannerId); an earlier pass here mixed the two up from a single-item reference capture that
    //   couldn't actually distinguish them, which left the highlight stuck on the worn item.
    // .g-col-3 (preview column) > .inventory-banner-item with the avatar NESTED INSIDE the same div (re-verified
    //   via direct parentElement lookup after an earlier pass here wrongly read them as siblings from a
    //   miscounted indent level), then .inventory-banner-name-container with the real
    //   .text-element.fw-bold.text-center title.
    // The preview column shows whichever banner is currently SELECTED (selectedBannerId), not just the worn one -
    // clicking any owned banner in the list must update the preview/avatar/name immediately, before Wear is even
    // pressed (selectedBannerId defaults to activeBannerId on load, so nothing changes until a different item is
    // clicked). Reading activeBanner here instead was the real cause of "can't choose another banner". The
    // preview reads from the FULL (unfiltered) banners list, not filteredBanners - a search filtering the list
    // shouldn't blank out an already-selected preview, same as Furniture's own selectedItem staying independent
    // of its own search filter.
    const selectedBanner = banners.find(banner => (banner.bannerId === selectedBannerId));

    // Real bug fixed here, root-caused against real DB ground truth (not assumed): when no banner is worn at all,
    // both activeBannerId and selectedBannerId default to -1, so a naive `selectedBannerId === activeBannerId`
    // check evaluates true (-1 === -1) and wrongly shows "Remove" for a state where nothing exists to remove.
    // Checked the real reference in this exact state (an account with genuinely nothing worn) and it shows
    // "Porter" (Wear), never "Retirer" (Remove) - confirmed live via CDP against habbocity.fr. -1 must never
    // count as "worn", regardless of what selectedBannerId happens to also be.
    const isWorn = ((selectedBannerId !== -1) && (selectedBannerId === activeBannerId));

    return (
        <>
            { searchPortal }
            { /* grow, not fullHeight: this became a real bug once the search bar was added above as a sibling
                 (this file didn't have one when this Column was first written) - h-100 ignores the search
                 bar/tabs/footer button's own real space in the same flex column and overflows/pushes the footer
                 out; flex-grow-1 correctly fills only what's left after them. Same fix applied to Furniture's and
                 Badges' own equivalent wrapping Column. */ }
            <Column grow overflow="hidden">
                <Grid fullHeight overflow="hidden">
                    <Column size={ 9 } overflow="hidden" classNames={ [ 'inventory-item-list' ] }>
                        <ScrollContainer className="flex-grow-1">
                            <Flex>
                                { filteredBanners.map(banner => <InventoryBannerItemView key={ banner.bannerId } bannerId={ banner.bannerId } imageFilename={ banner.imageFilename } selectedBannerId={ selectedBannerId } setSelectedBannerId={ setSelectedBannerId } />) }
                            </Flex>
                        </ScrollContainer>
                    </Column>
                    <Column fullWidth fullHeight alignItems="center" justifyContent="center" size={ 3 }>
                        <InventoryBannerItemView bannerId={ selectedBannerId } imageFilename={ selectedBanner?.imageFilename } selectedBannerId={ selectedBannerId } setSelectedBannerId={ setSelectedBannerId } isPreview={ true } />
                        <div className="inventory-banner-name-container">
                            <Text bold center>{ selectedBanner?.title ?? '' }</Text>
                        </div>
                    </Column>
                </Grid>
            </Column>
            { /* Removing clears the server's active banner; useInventoryBanner.ts's own BannerActiveChangedEvent
                 handler defaults selectedBannerId back to the first owned banner once the server confirms it (per
                 the user's own explicit direction to always default to the first item when nothing is worn, same
                 convention as useInventoryBadges.ts's selectedBadgeCode) - deliberately NOT done here with this
                 render's own `banners`/`selectedBannerId` closure, which was observed live to go stale
                 (banners[0] resolved to undefined right after Remove, even though the list still had all 4 items)
                 - see that handler's own comment for the exact use-between race this avoids. */ }
            <Button shrink variant={ isWorn ? 'danger' : 'success' } onClick={ event => setActiveBanner(isWorn ? -1 : selectedBannerId) }>
                { isWorn ? 'Remove' : 'Wear' }
            </Button>
        </>
    );
}
