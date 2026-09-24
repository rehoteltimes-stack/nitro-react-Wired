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

// Same structural fix as CatalogLayoutDefaultView.tsx (2026-09-22/23 pass): <Grid> (CSS grid, g-col-7/g-col-5)
// replaced with the real d-flex col-7/col-5 row, and CatalogPurchaseWidgetView pulled out of the narrow col-5
// column into the real full-width catalog-purchase-widget footer sibling below it. Not individually
// CDP-verified against a live single_bundle catalog page this pass (effort-scoped to the confirmed-shared
// mechanism - same CatalogPurchaseWidgetView component, same real .catalog-purchase-widget CSS class used
// everywhere) rather than hunting down a real reference page for all 9 affected layout types one at a time;
// flag for a real per-type verification pass if a single_bundle page turns out to look wrong.
export const CatalogLayoutSingleBundleView: FC<CatalogLayoutProps> = props =>
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
