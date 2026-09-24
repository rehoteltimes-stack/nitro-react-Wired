import { CatalogGroupsComposer } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { SendMessageComposer } from '../../../../../api';
import { Base, Column, Flex, Text } from '../../../../../common';
import { useCatalog } from '../../../../../hooks';
import { CatalogFirstProductSelectorWidgetView } from '../widgets/CatalogFirstProductSelectorWidgetView';
import { CatalogGuildSelectorWidgetView } from '../widgets/CatalogGuildSelectorWidgetView';
import { CatalogPurchaseWidgetView } from '../widgets/CatalogPurchaseWidgetView';
import { CatalogTotalPriceWidget } from '../widgets/CatalogTotalPriceWidget';
import { CatalogLayoutProps } from './CatalogLayout.types';

export const CatalogLayouGuildForumView: FC<CatalogLayoutProps> = props =>
{
    const { page = null } = props;
    const [ selectedGroupIndex, setSelectedGroupIndex ] = useState<number>(0);
    const { currentOffer = null, setCurrentOffer = null, catalogOptions = null } = useCatalog();
    const { groups = null } = catalogOptions;

    useEffect(() =>
    {
        SendMessageComposer(new CatalogGroupsComposer());
    }, [ page ]);
    
    // Same structural fix as CatalogLayoutDefaultView.tsx (2026-09-22/23 pass) - see that file's own comment.
    return (
        <>
            <CatalogFirstProductSelectorWidgetView />
            <Flex fullHeight overflow="hidden">
                <Column className="bg-muted rounded p-2 text-black" size={ 7 } overflow="hidden">
                    <Base className="overflow-auto" dangerouslySetInnerHTML={ { __html: page.localization.getText(1) } } />
                </Column>
                <Column size={ 5 } overflow="hidden" gap={ 1 }>
                    { !!currentOffer &&
                        <Column grow gap={ 1 }>
                            <Text truncate>{ currentOffer.localizationName }</Text>
                            <Base grow>
                                <CatalogGuildSelectorWidgetView />
                            </Base>
                            <Flex justifyContent="end">
                                <CatalogTotalPriceWidget alignItems="end" />
                            </Flex>
                        </Column> }
                </Column>
            </Flex>
            { !!currentOffer &&
                <Flex gap={ 2 } classNames={ [ 'flex-fill', 'catalog-purchase-widget' ] }>
                    <CatalogPurchaseWidgetView noGiftOption={ true } />
                </Flex> }
        </>
    );
}
