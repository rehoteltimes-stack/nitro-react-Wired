import { FC } from 'react';
import { GetConfiguration } from '../../../../api';
import { Column } from '../../../../common';
import { useInventoryBanner } from '../../../../hooks';

export interface InventoryBannerItemViewProps
{
    bannerId: number;
    imageFilename?: string;
    // The currently WORN banner, not merely the one last clicked (selectedBannerId) - the reference's own real
    // .active class in the owned-banners list marks whichever banner is actually equipped, confirmed via live CDP
    // capture of an account with a real worn banner (the .active item was the equipped one, independent of any
    // selection). Passed down rather than read again here so the list and the preview column share one source.
    activeBannerId?: number;
    isPreview?: boolean;
}

export const InventoryBannerItemView: FC<InventoryBannerItemViewProps> = props =>
{
    const { bannerId = -1, imageFilename = '', activeBannerId = -1, isPreview = false } = props;
    const { selectedBannerId = -1, setSelectedBannerId = null } = useInventoryBanner();

    const imageUrl = (bannerId === -1) ? '' : `${ GetConfiguration<string>('banner.url') }/${ imageFilename }`;

    return (
        <Column fullWidth className={ `body-image inventory-banner-item ${ ((bannerId === activeBannerId) && !isPreview) ? 'active' : '' }` } style={ !imageUrl ? {} : { backgroundImage: `url(${ imageUrl })` } } onClick={ event => !isPreview && setSelectedBannerId(bannerId) } />
    );
}
