import { FC } from 'react';
import { GetConfiguration } from '../../../../api';
import { Column, LayoutAvatarImageView } from '../../../../common';
import { useInventoryBanner, useSessionInfo } from '../../../../hooks';

export interface InventoryBannerItemViewProps
{
    bannerId: number;
    imageFilename?: string;
    isPreview?: boolean;
}

export const InventoryBannerItemView: FC<InventoryBannerItemViewProps> = props =>
{
    const { bannerId = -1, imageFilename = '', isPreview = false } = props;
    const { selectedBannerId = -1, setSelectedBannerId = null } = useInventoryBanner();
    const { userFigure = null } = useSessionInfo();

    const imageUrl = (bannerId === -1) ? '' : `${ GetConfiguration<string>('banner.url') }/${ imageFilename }`;

    return (
        <Column fullWidth className={ `body-image inventory-banner-item ${ ((bannerId === selectedBannerId) && !isPreview) ? 'active' : '' }` } style={ !imageUrl ? {} : { backgroundImage: `url(${ imageUrl })` } } onClick={ event => !isPreview && setSelectedBannerId(bannerId) }>
            { isPreview && <LayoutAvatarImageView figure={ userFigure } direction={ 4 } /> }
        </Column>
    );
}
