import { FC } from 'react';
import { GetConfiguration, ProductTypeEnum } from '../../../../../api';
import { Button, Column, Flex, LayoutImage, Text } from '../../../../../common';
import { HtmlDsl } from '../../../../../common/HtmlDsl';
import { useCatalog } from '../../../../../hooks';
import { CatalogHeaderView } from '../../catalog-header/CatalogHeaderView';
import { CatalogAddOnBadgeWidgetView } from '../widgets/CatalogAddOnBadgeWidgetView';
import { CatalogFurniDescriptionWidgetView } from '../widgets/CatalogFurniDescriptionWidgetView';
import { CatalogItemGridWidgetView } from '../widgets/CatalogItemGridWidgetView';
import { CatalogPurchaseWidgetView } from '../widgets/CatalogPurchaseWidgetView';
import { CatalogSpinnerWidgetView } from '../widgets/CatalogSpinnerWidgetView';
import { CatalogViewProductWidgetView } from '../widgets/CatalogViewProductWidgetView';
import { CatalogLayoutProps } from './CatalogLayout.types';

export const CatalogLayoutDefaultView: FC<CatalogLayoutProps> = props =>
{
    const { page = null } = props;
    const { currentOffer = null, currentPage = null } = useCatalog();

    // Real reference structure (verified via CDP against a live catalog page, e.g. "Placard de consoles"):
    // .nitro-catalog-layout's direct children are the col-7/col-5 row AND a full-width
    // catalog-purchase-widget footer BELOW it - not nested inside the col-5 preview column. Using <Grid>
    // here (CSS grid, g-col-7/g-col-5) instead of a plain <Flex> (real d-flex, col-7/col-5) and nesting the
    // purchase/gift buttons + quantity spinner inside col-5 was the exact same class of bug already found and
    // fixed in Inventory's Furniture/Badges tabs this session (buttons wrongly nested in a ~200px-wide preview
    // column instead of a full-width footer sibling).
    return (
        <>
            <Flex fullHeight overflow="hidden">
                <Column size={ 7 } className="catalog-layout-furniture-view">
                    { GetConfiguration('catalog.headers') &&
                        <CatalogHeaderView imageUrl={ currentPage.localization.getImage(0) }/> }
                    <Column overflow="hidden">
                        <CatalogItemGridWidgetView />
                    </Column>
                </Column>
                <Column center={ !currentOffer } size={ 5 } overflow="hidden">
                    { !currentOffer &&
                        <>
                            { !!page.localization.getImage(1) &&
                                <LayoutImage imageUrl={ page.localization.getImage(1) } /> }
                            { /* reference renders page text through its HTMLDSL (bt(text, Dt)), never raw innerHTML */ }
                            <Text center><HtmlDsl text={ page.localization.getText(0) } /></Text>
                        </> }
                    { currentOffer &&
                        <>
                            <Flex center overflow="hidden" style={ { height: 140 } }>
                                { (currentOffer.product.productType !== ProductTypeEnum.BADGE) &&
                                    <>
                                        <CatalogViewProductWidgetView />
                                        <CatalogAddOnBadgeWidgetView className="catalog-layout-background rounded bottom-1 end-1" />
                                    </> }
                                { (currentOffer.product.productType === ProductTypeEnum.BADGE) && <CatalogAddOnBadgeWidgetView className="scale-2" /> }
                            </Flex>
                            <CatalogFurniDescriptionWidgetView title={ currentOffer.localizationName } description={ currentOffer.localizationDescription } />
                        </> }
                </Column>
            </Flex>
            { /* Real reference (found via JS source, since this exact string isn't localized there either -
                 hardcoded literally in the reference's own minified bundle, not an ExternalTexts.json key):
                 the footer row is ALWAYS rendered, not just once an offer is picked - with nothing selected it
                 shows one full-width disabled danger button reading "Aucun mobi sélectionné" instead of the
                 gift/spinner/buy row. Verified live by opening a fresh category before clicking any grid item. */ }
            <Flex gap={ 2 } classNames={ [ 'flex-fill', 'catalog-purchase-widget' ] }>
                { !currentOffer &&
                    <Button grow variant="danger" disabled>No furni selected</Button> }
                { currentOffer &&
                    <CatalogPurchaseWidgetView>
                        <CatalogSpinnerWidgetView />
                    </CatalogPurchaseWidgetView> }
            </Flex>
        </>
    );
}
