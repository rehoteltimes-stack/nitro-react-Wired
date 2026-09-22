import { FC } from 'react';
import { GetConfiguration } from '../../../../api';
import { Column, LayoutAvatarImageView } from '../../../../common';
import { useSessionInfo } from '../../../../hooks';

export interface InventoryBannerItemViewProps
{
    bannerId: number;
    imageFilename?: string;
    isPreview?: boolean;
    // Passed down from InventoryBannerView's own single useInventoryBanner() call rather than read again here via
    // the hook directly - see that component's own comment for the real use-between subscription race this
    // avoids (a freshly-mounted list item can otherwise miss the selectedBannerId value entirely).
    selectedBannerId?: number;
    setSelectedBannerId?: (bannerId: number) => void;
}

export const InventoryBannerItemView: FC<InventoryBannerItemViewProps> = props =>
{
    const { bannerId = -1, imageFilename = '', isPreview = false, selectedBannerId = -1, setSelectedBannerId = null } = props;
    const { userFigure = null } = useSessionInfo();

    const imageUrl = (bannerId === -1) ? '' : `${ GetConfiguration<string>('banner.url') }/${ imageFilename }`;

    // Real reference structure, re-verified via direct parentElement lookup (an earlier pass here misread a
    // miscounted indent level and split this into two sibling elements, which visibly broke the preview - the
    // avatar renders NESTED inside the same .inventory-banner-item div as the banner's own background-image, not
    // beside it). The red .active border tracks whichever item was last clicked (selectedBannerId), confirmed by
    // the user against the live app - an earlier pass here wrongly tied it to activeBannerId (the worn one) from
    // a single-item reference capture that couldn't actually distinguish the two, which left the highlight stuck
    // on the worn item regardless of what was clicked.
    return (
        <Column fullWidth className={ `body-image inventory-banner-item ${ ((bannerId === selectedBannerId) && !isPreview) ? 'active' : '' }` } style={ !imageUrl ? {} : { backgroundImage: `url(${ imageUrl })` } } onClick={ event => !isPreview && setSelectedBannerId && setSelectedBannerId(bannerId) }>
            { isPreview && <LayoutAvatarImageView figure={ userFigure } direction={ 4 } /> }
        </Column>
    );
}
