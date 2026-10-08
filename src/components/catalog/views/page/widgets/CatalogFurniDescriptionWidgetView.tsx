import { FC } from 'react';
import { Column, Flex, Text } from '../../../../../common';
import { CatalogLimitedItemWidgetView } from './CatalogLimitedItemWidgetView';
import { CatalogTotalPriceWidget } from './CatalogTotalPriceWidget';

interface CatalogFurniDescriptionWidgetViewProps
{
    title?: string;
    description?: string;
}

// Real reference ("Ms" in the minified bundle): the selected offer's limited plate, bold name + total price and
// description. The reference's staff-only pageId/offerId/className block is left out: those ids live in the Furni
// Editor (user, 2026-10-02).
export const CatalogFurniDescriptionWidgetView: FC<CatalogFurniDescriptionWidgetViewProps> = props =>
{
    const { title = '', description = '' } = props;

    return (
        <Column grow className="catalog-furni-description" justifyContent="between">
            <Column>
                <CatalogLimitedItemWidgetView fullWidth />
                <Flex justifyContent="between" gap={ 3 }>
                    <Text bold truncate wrap>{ title }</Text>
                    <CatalogTotalPriceWidget alignItems="end" />
                </Flex>
                { description && <Text small grow>{ description }</Text> }
            </Column>
        </Column>
    );
}
