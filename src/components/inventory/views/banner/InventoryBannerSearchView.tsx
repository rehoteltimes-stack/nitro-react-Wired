import { ChangeEvent, Dispatch, FC, SetStateAction, useEffect, useState } from 'react';
import { BannerItemData } from '../../../../api';
import { SearchBar } from '../../../../common';

export interface InventoryBannerSearchViewProps
{
    banners: BannerItemData[];
    setBanners: Dispatch<SetStateAction<BannerItemData[]>>;
}

// Same real primitive/filter shape as the other Inventory*SearchView components. Not click-tested against the
// reference for this specific tab (the reference account only owns 1 banner, too few to distinguish "search
// filters" from "search always clears the list"), but every other tab's structurally-identical search bar is
// confirmed functional (Badges: 21 real owned badges, typing genuinely filtered 21->2 and back), and the
// reference's own Banners tab does render this same search bar structurally - implemented consistently with the
// confirmed pattern rather than left non-functional on an unverified assumption either way.
export const InventoryBannerSearchView: FC<InventoryBannerSearchViewProps> = props =>
{
    const { banners = [], setBanners = null } = props;
    const [ searchValue, setSearchValue ] = useState('');

    useEffect(() =>
    {
        let filteredBanners = [ ...banners ];

        if(searchValue && searchValue.length)
        {
            const comparison = searchValue.toLocaleLowerCase();

            filteredBanners = banners.filter(banner => banner.title?.toLocaleLowerCase().includes(comparison));
        }

        setBanners(filteredBanners);
    }, [ banners, setBanners, searchValue ]);

    return (
        <SearchBar
            iconClass="icon-inventory"
            color="var(--holo-inventory-color-theme-primary)"
            value={ searchValue }
            onChange={ (event: ChangeEvent<HTMLInputElement>) => setSearchValue(event.target.value) }
        />
    );
}
