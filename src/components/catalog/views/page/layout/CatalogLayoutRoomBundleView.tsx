import { FC } from 'react';
import { Column } from '../../../../../common/Column';
import { Flex } from '../../../../../common/Flex';
import { Text } from '../../../../../common/Text';
import { CatalogAddOnBadgeWidgetView } from '../widgets/CatalogAddOnBadgeWidgetView';
import { CatalogBundleGridWidgetView } from '../widgets/CatalogBundleGridWidgetView';
import { CatalogFirstProductSelectorWidgetView } from '../widgets/CatalogFirstProductSelectorWidgetView';
import { CatalogPurchaseWidgetView } from '../widgets/CatalogPurchaseWidgetView';
import { CatalogSimplePriceWidgetView } from '../widgets/CatalogSimplePriceWidgetView';
import { CatalogLayoutProps } from './CatalogLayout.types';

// Same structural fix as CatalogLayoutDefaultView.tsx / CatalogLayoutSingleBundleView.tsx (identical layout
// shape) - see CatalogLayoutSingleBundleView.tsx's own comment for the full rationale and verification caveat.
export const CatalogLayoutRoomBundleView: FC<CatalogLayoutProps> = props =>
{
    const { page = null } = props;

    return (
        <>
            <CatalogFirstProductSelectorWidgetView />
            <Flex fullHeight overflow="hidden">
                <Column size={ 7 } overflow="hidden">
                    { !!page.localization.getText(2) &&
                        <Text dangerouslySetInnerHTML={ { __html: page.localization.getText(2) } } /> }
                    <Column grow overflow="hidden" className="bg-muted p-2 rounded">
                        <CatalogBundleGridWidgetView fullWidth className="nitro-catalog-layout-bundle-grid" />
                    </Column>
                </Column>
                <Column size={ 5 } overflow="hidden" gap={ 1 }>
                    { !!page.localization.getText(1) &&
                        <Text center small overflow="auto">{ page.localization.getText(1) }</Text> }
                    <Column grow position="relative" overflow="hidden" gap={ 0 }>
                        { !!page.localization.getImage(1) &&
                            <img alt="" className="flex-grow-1" src={ page.localization.getImage(1) } /> }
                        <CatalogAddOnBadgeWidgetView position="absolute" className="bg-muted rounded bottom-0 start-0" />
                        <CatalogSimplePriceWidgetView position="absolute" className="bottom-0 end-0" />
                    </Column>
                </Column>
            </Flex>
            <Flex gap={ 2 } classNames={ [ 'flex-fill', 'catalog-purchase-widget' ] }>
                <CatalogPurchaseWidgetView />
            </Flex>
        </>
    );
}
