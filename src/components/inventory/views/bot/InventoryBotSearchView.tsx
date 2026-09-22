import { ChangeEvent, Dispatch, FC, SetStateAction, useEffect, useState } from 'react';
import { IBotItem } from '../../../../api';
import { SearchBar } from '../../../../common';

export interface InventoryBotSearchViewProps
{
    botItems: IBotItem[];
    setBotItems: Dispatch<SetStateAction<IBotItem[]>>;
}

// Same real primitive/filter shape as InventoryFurnitureSearchView - confirmed live on the reference's own Bots
// tab that its search bar renders even with zero owned bots (still checked, not assumed shared just because
// Furniture's own search bar behaves this way).
export const InventoryBotSearchView: FC<InventoryBotSearchViewProps> = props =>
{
    const { botItems = [], setBotItems = null } = props;
    const [ searchValue, setSearchValue ] = useState('');

    useEffect(() =>
    {
        let filteredBotItems = [ ...botItems ];

        if(searchValue && searchValue.length)
        {
            const comparison = searchValue.toLocaleLowerCase();

            filteredBotItems = botItems.filter(item => item.botData.name.toLocaleLowerCase().includes(comparison));
        }

        setBotItems(filteredBotItems);
    }, [ botItems, setBotItems, searchValue ]);

    return (
        <SearchBar
            iconClass="icon-inventory"
            color="var(--holo-inventory-color-theme-primary)"
            value={ searchValue }
            onChange={ (event: ChangeEvent<HTMLInputElement>) => setSearchValue(event.target.value) }
        />
    );
}
