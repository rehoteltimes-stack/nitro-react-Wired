import { FC, useEffect } from 'react';
import { Button, Column, Flex, Grid, LayoutAvatarImageView, ScrollContainer, Text } from '../../../../common';
import { useInventoryBanner, useSessionInfo } from '../../../../hooks';
import { InventoryCategoryEmptyView } from '../InventoryCategoryEmptyView';
import { InventoryBannerItemView } from './InventoryBannerItemView';

export const InventoryBannerView: FC<{}> = props =>
{
    // Message-class registration (RegisterBannerMessages) happens inside useInventoryBanner() itself now, before
    // its own useMessageEvent subscriptions - see that hook's own comment for the real ordering bug this fixes.
    const { banners = [], activeBannerId = -1, selectedBannerId = -1, setActiveBanner = null, requestBanners = null } = useInventoryBanner();
    const { userFigure = null } = useSessionInfo();

    useEffect(() =>
    {
        requestBanners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if(!banners.length) return <InventoryCategoryEmptyView title="No banners" desc="You don't have any profile banners yet. Buy one from the website's Center > Banners page." />;

    const activeBanner = banners.find(banner => (banner.bannerId === activeBannerId));

    // Real reference structure, CDP-captured against the live habbocity.fr Bannières tab (an account with a real
    // owned+worn banner) - this view previously rendered from inference only, never against a real DOM capture:
    // .g-col-9.inventory-item-list > .scroll-container (real custom-scrollbar primitive, this project's own
    //   ScrollContainer) > .scroll-content.vertical > .d-flex (row) > one .inventory-banner-item per owned banner,
    //   the currently-WORN one (activeBannerId, not merely selectedBannerId) carrying the real .active class.
    // .g-col-3 (preview column) > .inventory-banner-item (worn banner's own image, isPreview so unclickable) AND,
    //   as a genuinely SEPARATE sibling element (not nested inside the banner-item div), .avatar-image (the
    //   account's own avatar rendered wearing it) AND .inventory-banner-name-container containing the real
    //   .text-element.fw-bold.text-center banner name - confirmed via live capture this container is never left
    //   empty in the reference, it holds the banner's own title text.
    return (
        <>
            <Column fullHeight overflow="hidden">
                <Grid fullHeight overflow="hidden">
                    <Column size={ 9 } overflow="hidden" classNames={ [ 'inventory-item-list' ] }>
                        <ScrollContainer className="flex-grow-1">
                            <Flex>
                                { banners.map(banner => <InventoryBannerItemView key={ banner.bannerId } bannerId={ banner.bannerId } imageFilename={ banner.imageFilename } activeBannerId={ activeBannerId } />) }
                            </Flex>
                        </ScrollContainer>
                    </Column>
                    <Column fullWidth fullHeight alignItems="center" justifyContent="center" size={ 3 }>
                        <InventoryBannerItemView bannerId={ activeBannerId } imageFilename={ activeBanner?.imageFilename } activeBannerId={ activeBannerId } isPreview={ true } />
                        { (activeBannerId !== -1) && <LayoutAvatarImageView figure={ userFigure } direction={ 4 } /> }
                        <div className="inventory-banner-name-container">
                            <Text bold center>{ activeBanner?.title ?? '' }</Text>
                        </div>
                    </Column>
                </Grid>
            </Column>
            <Button shrink variant={ (selectedBannerId === activeBannerId) ? 'danger' : 'success' } onClick={ event => setActiveBanner((selectedBannerId === activeBannerId) ? -1 : selectedBannerId) }>
                { (selectedBannerId === activeBannerId) ? 'Remove' : 'Wear' }
            </Button>
        </>
    );
}
