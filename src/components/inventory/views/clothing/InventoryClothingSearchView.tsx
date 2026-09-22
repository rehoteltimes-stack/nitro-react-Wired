import { ChangeEvent, Dispatch, FC, SetStateAction, useEffect, useState } from 'react';
import { GroupItem } from '../../../../api';
import { SearchBar } from '../../../../common';

export interface InventoryClothingSearchViewProps
{
    groupItems: GroupItem[];
    setGroupItems: Dispatch<SetStateAction<GroupItem[]>>;
}

export const InventoryClothingSearchView: FC<InventoryClothingSearchViewProps> = props =>
{
    const { groupItems = [], setGroupItems = null } = props;
    const [ searchValue, setSearchValue ] = useState('');

    useEffect(() =>
    {
        let filteredGroupItems = [ ...groupItems ];

        if(searchValue && searchValue.length)
        {
            const comparison = searchValue.toLocaleLowerCase();

            filteredGroupItems = groupItems.filter(item =>
            {
                if(comparison && comparison.length)
                {
                    if(item.name.toLocaleLowerCase().includes(comparison)) return item;
                }

                return null;
            });
        }

        setGroupItems(filteredGroupItems);
    }, [ groupItems, setGroupItems, searchValue ]);

    return (
        <SearchBar
            iconClass="icon-inventory"
            color="var(--holo-inventory-color-theme-primary)"
            value={ searchValue }
            onChange={ (event: ChangeEvent<HTMLInputElement>) => setSearchValue(event.target.value) }
        />
    );
}
