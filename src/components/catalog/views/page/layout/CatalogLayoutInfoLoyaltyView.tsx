import { FC } from 'react';
import { HtmlDsl } from '../../../../../common/HtmlDsl';
import { CatalogLayoutProps } from './CatalogLayout.types';

export const CatalogLayoutInfoLoyaltyView: FC<CatalogLayoutProps> = props =>
{
    const { page = null } = props;

    return (
        <div className="h-100 nitro-catalog-layout-info-loyalty d-flex flex-row">
            <div className="overflow-auto h-100 d-flex flex-column info-loyalty-content">
                <HtmlDsl text={ page.localization.getText(0) } />
            </div>
        </div>
    );
}
