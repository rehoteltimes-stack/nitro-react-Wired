import { FC, useEffect, useState } from 'react';
import { GetConfiguration } from '../../../../api';
import { Column, LayoutAvatarImageView } from '../../../../common';
import { useInventoryBanner, useSessionInfo } from '../../../../hooks';

export interface InventoryBannerItemViewProps
{
    item: string;
    isPreview?: boolean;
}

export const InventoryBannerItemView: FC<InventoryBannerItemViewProps> = props =>
{
    const { item = '', isPreview = false } = props;
    const { selectedBannerCode = '', setSelectedBannerCode = null } = useInventoryBanner();
    const { userFigure = null } = useSessionInfo();
    const [ imageUrl, setImageUrl ] = useState<string>(null);

    useEffect(() =>
    {
        setImageUrl((item === '') ? '' : `${ GetConfiguration<string>('banner.url') }/player_profile_${ item }.png`);
    }, [ item ]);

    return (
        <Column fullWidth className={ `body-image inventory-banner-item ${ ((item === selectedBannerCode) && !isPreview) ? 'active' : '' }` } style={ (imageUrl === '') ? {} : { backgroundImage: `url(${ imageUrl })` } } onClick={ event => !isPreview && setSelectedBannerCode(item) }>
            { isPreview && <LayoutAvatarImageView figure={ userFigure } direction={ 4 } /> }
        </Column>
    );
}
