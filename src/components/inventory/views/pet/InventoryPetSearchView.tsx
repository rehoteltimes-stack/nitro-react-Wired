import { ChangeEvent, Dispatch, FC, SetStateAction, useEffect, useState } from 'react';
import { IPetItem } from '../../../../api';
import { SearchBar } from '../../../../common';

export interface InventoryPetSearchViewProps
{
    petItems: IPetItem[];
    setPetItems: Dispatch<SetStateAction<IPetItem[]>>;
}

// Same real primitive/filter shape as InventoryFurnitureSearchView/InventoryBotSearchView.
export const InventoryPetSearchView: FC<InventoryPetSearchViewProps> = props =>
{
    const { petItems = [], setPetItems = null } = props;
    const [ searchValue, setSearchValue ] = useState('');

    useEffect(() =>
    {
        let filteredPetItems = [ ...petItems ];

        if(searchValue && searchValue.length)
        {
            const comparison = searchValue.toLocaleLowerCase();

            filteredPetItems = petItems.filter(item => item.petData?.name?.toLocaleLowerCase().includes(comparison));
        }

        setPetItems(filteredPetItems);
    }, [ petItems, setPetItems, searchValue ]);

    return (
        <SearchBar
            iconClass="icon-inventory"
            color="var(--holo-inventory-color-theme-primary)"
            value={ searchValue }
            onChange={ (event: ChangeEvent<HTMLInputElement>) => setSearchValue(event.target.value) }
        />
    );
}
