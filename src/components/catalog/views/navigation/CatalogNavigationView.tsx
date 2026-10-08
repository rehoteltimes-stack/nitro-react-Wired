import { FC } from 'react';
import { ICatalogNode } from '../../../../api';
import { AutoGrid, Column, ScrollContainer } from '../../../../common';
import { useCatalog } from '../../../../hooks';
import { CatalogNavigationItemView } from './CatalogNavigationItemView';
import { CatalogNavigationSetView } from './CatalogNavigationSetView';

export interface CatalogNavigationViewProps
{
    node: ICatalogNode;
    showIds?: boolean;
}

export const CatalogNavigationView: FC<CatalogNavigationViewProps> = props =>
{
    const { node = null, showIds = false } = props;
    const { searchResult = null } = useCatalog();

    return (
        <Column className="nitro-catalog-navigation-grid-container rounded p-1" overflow="hidden" fullHeight>
            <ScrollContainer>
                <AutoGrid id="nitro-catalog-main-navigation" gap={ 1 } columnCount={ 1 }>
                    { searchResult && (searchResult.filteredNodes.length > 0) && searchResult.filteredNodes.map((n, index) =>
                    {
                        return <CatalogNavigationItemView key={ index } node={ n } showIds={ showIds } flat={ true } />;
                    }) }
                    { !searchResult &&
                        <CatalogNavigationSetView node={ node } showIds={ showIds } /> }
                </AutoGrid>
            </ScrollContainer>
        </Column>
    );
}
