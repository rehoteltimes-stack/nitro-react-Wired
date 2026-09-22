import { ChangeEvent, FC, KeyboardEvent } from 'react';
import { FaSearch } from 'react-icons/fa';
import { LocalizeText } from '../api';
import { Base } from './Base';
import { CustomSelect } from './CustomSelect';
import { Flex } from './Flex';

export interface SearchBarProps
{
    selectOptions?: [ string, any ][];
    iconClass?: string;
    color?: string;
    placeholder?: string;
    value?: string;
    selectValue?: any;
    onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
    onSelectChange?: (value: any) => void;
    onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
    onClick?: () => void;
}

// The window search bar of the reference client (navigator, catalog, inventory): search glyph, text input, optional
// filter select and a trailing icon, all tinted by the window's theme colour.
export const SearchBar: FC<SearchBarProps> = props =>
{
    const { selectOptions = undefined, iconClass = '', color = null, placeholder = LocalizeText('generic.search'), value = '', selectValue = undefined, onChange = undefined, onSelectChange = undefined, onKeyDown = undefined, onClick = undefined } = props;

    return (
        <Flex shrink grow className="holo-main-search-bar-input-element" style={ { backgroundColor: color } } alignItems="center" justifyContent="between" gap={ 2 }>
            <FaSearch className="fa-icon" size={ 18 } onClick={ onClick } />
            <Flex grow className="holo-main-search-bar-input-container" fullHeight justifyContent="between" alignItems="center">
                <input className="holo-main-search-bar-input-text" type="text" placeholder={ placeholder } onChange={ onChange } onKeyDown={ onKeyDown } value={ value } />
                <Flex>
                    { selectOptions &&
                        <CustomSelect value={ selectValue } onChange={ onSelectChange } items={ selectOptions.map(option => ({ type: 'value' as const, text: option[0], value: option[1] })) } className="holo-main-search-bar-input-select" style={ { '--holo-border-color-primary': color, '--holo-text-primary': color } as any } /> }
                </Flex>
            </Flex>
            <Base className={ `icon ${ iconClass }` } />
        </Flex>
    );
}
