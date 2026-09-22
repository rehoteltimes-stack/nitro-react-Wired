import { ChangeEvent, FC, KeyboardEvent, useEffect, useState } from 'react';
import { INavigatorSearchFilter, LocalizeText, SearchFilterOptions } from '../../../../api';
import { SearchBar } from '../../../../common';
import { useNavigator } from '../../../../hooks';

export interface NavigatorSearchViewProps
{
    sendSearch: (searchValue: string, contextCode: string) => void;
}

export const NavigatorSearchView: FC<NavigatorSearchViewProps> = props =>
{
    const { sendSearch = null } = props;
    const [ searchFilterIndex, setSearchFilterIndex ] = useState(0);
    const [ searchValue, setSearchValue ] = useState('');
    const { topLevelContext = null, searchResult = null } = useNavigator();

    const processSearch = () =>
    {
        if(!topLevelContext) return;

        let searchFilter = SearchFilterOptions[searchFilterIndex];

        if(!searchFilter) searchFilter = SearchFilterOptions[0];

        const searchQuery = ((searchFilter.query ? (searchFilter.query + ':') : '') + searchValue);

        sendSearch((searchQuery || ''), topLevelContext.code);
    }

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) =>
    {
        if(event.key !== 'Enter') return;

        processSearch();
    };

    useEffect(() =>
    {
        if(!searchResult) return;

        const split = searchResult.data.split(':');

        let filter: INavigatorSearchFilter = null;
        let value: string = '';

        if(split.length >= 2)
        {
            const [ query, ...rest ] = split;

            filter = SearchFilterOptions.find(option => (option.query === query));
            value = rest.join(':');
        }
        else
        {
            value = searchResult.data;
        }

        if(!filter) filter = SearchFilterOptions[0];

        setSearchFilterIndex(SearchFilterOptions.findIndex(option => (option === filter)));
        setSearchValue(value);
    }, [ searchResult ]);

    return (
        <SearchBar
            iconClass="icon-rooms"
            color="var(--holo-navigator-color-theme-primary)"
            placeholder={ LocalizeText('navigator.filter.input.placeholder') }
            selectOptions={ SearchFilterOptions.map((filter, index) => [ LocalizeText('navigator.filter.' + filter.name), index ]) }
            selectValue={ searchFilterIndex }
            onSelectChange={ index => setSearchFilterIndex(index) }
            value={ searchValue }
            onChange={ (event: ChangeEvent<HTMLInputElement>) => setSearchValue(event.target.value) }
            onKeyDown={ handleKeyDown }
            onClick={ processSearch }
        />
    );
}
