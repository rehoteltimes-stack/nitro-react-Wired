import { FC } from 'react';
import { Button, Column, Grid } from '../../../../common';
import { useInventoryBanner } from '../../../../hooks';
import { InventoryCategoryEmptyView } from '../InventoryCategoryEmptyView';
import { InventoryBannerItemView } from './InventoryBannerItemView';

export const InventoryBannerView: FC<{}> = props =>
{
    const { banners = [], activeBannerCode = '', selectedBannerCode = '', setActiveBanner = null } = useInventoryBanner();

    if(!banners.length) return <InventoryCategoryEmptyView title="No banners" desc="You don't have any profile banners yet." />;

    return (
        <>
            <Column fullHeight overflow="hidden">
                <Grid fullHeight overflow="hidden">
                    <Column size={ 9 } overflow="hidden">
                        { banners.map(code => <InventoryBannerItemView key={ code } item={ code } />) }
                    </Column>
                    <Column fullWidth fullHeight alignItems="center" justifyContent="center" size={ 3 }>
                        <InventoryBannerItemView item={ activeBannerCode } isPreview={ true } />
                        <div className="inventory-banner-name-container" />
                    </Column>
                </Grid>
            </Column>
            <Button shrink variant={ (selectedBannerCode === activeBannerCode) ? 'danger' : 'success' } onClick={ event => setActiveBanner((selectedBannerCode === activeBannerCode) ? '' : selectedBannerCode) }>
                { (selectedBannerCode === activeBannerCode) ? 'Remove' : 'Wear' }
            </Button>
        </>
    );
}
