import { FC, useEffect } from 'react';
import { RegisterBannerMessages } from '../../../../api';
import { Button, Column, Grid } from '../../../../common';
import { useInventoryBanner } from '../../../../hooks';
import { InventoryCategoryEmptyView } from '../InventoryCategoryEmptyView';
import { InventoryBannerItemView } from './InventoryBannerItemView';

export const InventoryBannerView: FC<{}> = props =>
{
    const { banners = [], activeBannerId = -1, selectedBannerId = -1, setActiveBanner = null, requestBanners = null } = useInventoryBanner();

    useEffect(() =>
    {
        RegisterBannerMessages();
        requestBanners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if(!banners.length) return <InventoryCategoryEmptyView title="No banners" desc="You don't have any profile banners yet. Buy one from the website's Center > Banners page." />;

    const activeBanner = banners.find(banner => (banner.bannerId === activeBannerId));

    return (
        <>
            <Column fullHeight overflow="hidden">
                <Grid fullHeight overflow="hidden">
                    <Column size={ 9 } overflow="hidden">
                        { banners.map(banner => <InventoryBannerItemView key={ banner.bannerId } bannerId={ banner.bannerId } imageFilename={ banner.imageFilename } />) }
                    </Column>
                    <Column fullWidth fullHeight alignItems="center" justifyContent="center" size={ 3 }>
                        <InventoryBannerItemView bannerId={ activeBannerId } imageFilename={ activeBanner?.imageFilename } isPreview={ true } />
                        <div className="inventory-banner-name-container" />
                    </Column>
                </Grid>
            </Column>
            <Button shrink variant={ (selectedBannerId === activeBannerId) ? 'danger' : 'success' } onClick={ event => setActiveBanner((selectedBannerId === activeBannerId) ? -1 : selectedBannerId) }>
                { (selectedBannerId === activeBannerId) ? 'Remove' : 'Wear' }
            </Button>
        </>
    );
}
