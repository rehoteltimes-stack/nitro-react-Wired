import { FC } from 'react';
import { LocalizeText } from '../../../../../api';
import { Base, Column, Flex, Text } from '../../../../../common';
import { useCatalog } from '../../../../../hooks';
import { CatalogBadgeSelectorWidgetView } from '../widgets/CatalogBadgeSelectorWidgetView';
import { CatalogFirstProductSelectorWidgetView } from '../widgets/CatalogFirstProductSelectorWidgetView';
import { CatalogItemGridWidgetView } from '../widgets/CatalogItemGridWidgetView';
import { CatalogLimitedItemWidgetView } from '../widgets/CatalogLimitedItemWidgetView';
import { CatalogPurchaseWidgetView } from '../widgets/CatalogPurchaseWidgetView';
import { CatalogTotalPriceWidget } from '../widgets/CatalogTotalPriceWidget';
import { CatalogViewProductWidgetView } from '../widgets/CatalogViewProductWidgetView';
import { CatalogLayoutProps } from './CatalogLayout.types';

export const CatalogLayoutBadgeDisplayView: FC<CatalogLayoutProps> = props =>
{
    const { page = null } = props;
    const { currentOffer = null } = useCatalog();

    // Same structural fix as CatalogLayoutDefaultView.tsx (2026-09-22/23 pass) - see that file's own comment.
    return (
        <>
            <CatalogFirstProductSelectorWidgetView />
            <Flex fullHeight overflow="hidden">
                <Column size={ 7 } overflow="hidden">
                    <CatalogItemGridWidgetView shrink />
                    <Column gap={ 1 } overflow="hidden">
                        <Text truncate shrink fontWeight="bold">{ LocalizeText('catalog_selectbadge') }</Text>
                        <CatalogBadgeSelectorWidgetView />
                    </Column>
                </Column>
                <Column center={ !currentOffer } size={ 5 } overflow="hidden">
                    { !currentOffer &&
                        <>
                            { !!page.localization.getImage(1) && <img alt="" src={ page.localization.getImage(1) } /> }
                            <Text center dangerouslySetInnerHTML={ { __html: page.localization.getText(0) } } />
                        </> }
                    { currentOffer &&
                        <>
                            <Base position="relative" overflow="hidden">
                                <CatalogViewProductWidgetView />
                            </Base>
                            <Column grow gap={ 1 }>
                                <CatalogLimitedItemWidgetView fullWidth />
                                <Text grow truncate>{ currentOffer.localizationName }</Text>
                                <Flex justifyContent="end">
                                    <CatalogTotalPriceWidget alignItems="end" />
                                </Flex>
                            </Column>
                        </> }
                </Column>
            </Flex>
            { currentOffer &&
                <Flex gap={ 2 } classNames={ [ 'flex-fill', 'catalog-purchase-widget' ] }>
                    <CatalogPurchaseWidgetView />
                </Flex> }
        </>
    );
}
