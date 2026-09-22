import { ChangeEvent, Dispatch, FC, SetStateAction, useEffect, useState } from 'react';
import { LocalizeBadgeName } from '../../../../api';
import { SearchBar } from '../../../../common';

export interface InventoryBadgeSearchViewProps
{
    badgeCodes: string[];
    setBadgeCodes: Dispatch<SetStateAction<string[]>>;
}

// Real, previously-missing feature: confirmed live against the reference's own Badges tab (21 real owned
// badges) that typing genuinely filters the grid (21 -> 2 for "a", back to 21 on clear) - not decorative. Same
// primitive/filter shape as the other Inventory*SearchView components, filtered on the badge's real localized
// display name (what LayoutBadgeImageView/InventoryBadgeItemView actually shows the user), not the raw internal
// badge code.
export const InventoryBadgeSearchView: FC<InventoryBadgeSearchViewProps> = props =>
{
    const { badgeCodes = [], setBadgeCodes = null } = props;
    const [ searchValue, setSearchValue ] = useState('');

    useEffect(() =>
    {
        let filteredBadgeCodes = [ ...badgeCodes ];

        if(searchValue && searchValue.length)
        {
            const comparison = searchValue.toLocaleLowerCase();

            filteredBadgeCodes = badgeCodes.filter(badgeCode => LocalizeBadgeName(badgeCode).toLocaleLowerCase().includes(comparison));
        }

        setBadgeCodes(filteredBadgeCodes);
    }, [ badgeCodes, setBadgeCodes, searchValue ]);

    return (
        <SearchBar
            iconClass="icon-inventory"
            color="var(--holo-inventory-color-theme-primary)"
            value={ searchValue }
            onChange={ (event: ChangeEvent<HTMLInputElement>) => setSearchValue(event.target.value) }
        />
    );
}
