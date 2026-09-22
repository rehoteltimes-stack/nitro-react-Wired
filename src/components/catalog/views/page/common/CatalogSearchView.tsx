import { IFurnitureData } from '@nitrots/nitro-renderer';
import { ChangeEvent, Dispatch, FC, SetStateAction, useEffect } from 'react';
import { CatalogPage, CatalogType, FilterCatalogNode, FurnitureOffer, GetOfferNodes, GetSessionDataManager, ICatalogNode, ICatalogPage, IPurchasableOffer, PageLocalization, SearchResult } from '../../../../../api';
import { SearchBar } from '../../../../../common';
import { useCatalog } from '../../../../../hooks';

interface CatalogSearchViewProps
{
    searchValue: string;
    setSearchValue: Dispatch<SetStateAction<string>>;
}

export const CatalogSearchView: FC<CatalogSearchViewProps> = props =>
{
    const { searchValue = '', setSearchValue = null } = props;
    const { currentType = null, rootNode = null, offersToNodes = null, setSearchResult = null, setCurrentPage = null } = useCatalog();

    useEffect(() =>
    {
        let search = searchValue?.toLocaleLowerCase().replace(' ', '');

        if(!search || !search.length)
        {
            setSearchResult(null);

            return;
        }

        const timeout = setTimeout(() =>
        {
            const furnitureDatas = GetSessionDataManager().getAllFurnitureData({
                loadFurnitureData: null
            });

            if(!furnitureDatas || !furnitureDatas.length) return;

            const foundFurniture: IFurnitureData[] = [];
            const foundFurniLines: string[] = [];

            for(const furniture of furnitureDatas)
            {
                if((currentType === CatalogType.BUILDER) && !furniture.availableForBuildersClub) continue;

                if((currentType === CatalogType.NORMAL) && furniture.excludeDynamic) continue;

                const searchValues = [ furniture.className, furniture.name, furniture.description ].join(' ').replace(/ /gi, '').toLowerCase();

                if((currentType === CatalogType.BUILDER) && (furniture.purchaseOfferId === -1) && (furniture.rentOfferId === -1))
                {
                    if((furniture.furniLine !== '') && (foundFurniLines.indexOf(furniture.furniLine) < 0))
                    {
                        if(searchValues.indexOf(search) >= 0) foundFurniLines.push(furniture.furniLine);
                    }
                }
                else
                {
                    const foundNodes = [
                        ...GetOfferNodes(offersToNodes, furniture.purchaseOfferId),
                        ...GetOfferNodes(offersToNodes, furniture.rentOfferId)
                    ];

                    if(foundNodes.length)
                    {
                        if(searchValues.indexOf(search) >= 0) foundFurniture.push(furniture);

                        if(foundFurniture.length === 250) break;
                    }
                }
            }

            const offers: IPurchasableOffer[] = [];

            for(const furniture of foundFurniture) offers.push(new FurnitureOffer(furniture));

            let nodes: ICatalogNode[] = [];

            FilterCatalogNode(search, foundFurniLines, rootNode, nodes);

            setSearchResult(new SearchResult(search, offers, nodes.filter(node => (node.isVisible))));
            setCurrentPage((new CatalogPage(-1, 'default_3x3', new PageLocalization([], []), offers, false, 1) as ICatalogPage));
        }, 300);

        return () => clearTimeout(timeout);
    }, [ offersToNodes, currentType, rootNode, searchValue, setCurrentPage, setSearchResult ]);

    return (
        <SearchBar
            iconClass="icon-catalog"
            color="var(--holo-catalog-color-theme-primary)"
            value={ searchValue }
            onChange={ (event: ChangeEvent<HTMLInputElement>) => setSearchValue(event.target.value) }
        />
    );
}
