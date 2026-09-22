import { CSSProperties, FC, ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FaChevronDown } from 'react-icons/fa';
import { Base } from './Base';
import { Column, ColumnProps } from './Column';
import { Flex } from './Flex';
import { ScrollContainer } from './ScrollContainer';
import { Text } from './Text';

export interface CustomSelectItem
{
    type?: 'value' | 'separator';
    text: string;
    value?: any;
    title?: string;
}

export interface CustomSelectProps extends Omit<ColumnProps, 'onChange'>
{
    value?: any;
    onChange?: (value: any) => void;
    items?: CustomSelectItem[];
    placeholder?: string;
    icon?: ReactNode;
    noInvalid?: boolean;
    disabled?: boolean;
}

interface SelectGroup
{
    label: string;
    title?: string;
    visible: boolean;
    items: CustomSelectItem[];
}

// Dropdown of the reference client: the option panel is portalled into <body>, kept under the trigger every frame while
// it is open, and receives the trigger's CSS custom properties so themed selects (--holo-*) keep their colours there.
export const CustomSelect: FC<CustomSelectProps> = props =>
{
    const { value = null, onChange = null, items = [], placeholder = '...', className = '', icon = <FaChevronDown />, noInvalid = false, disabled = false, ...rest } = props;
    const [ isOpen, setIsOpen ] = useState(false);
    const [ hiddenGroups, setHiddenGroups ] = useState<{ [ label: string ]: boolean }>({});
    const [ selectedItem, setSelectedItem ] = useState<CustomSelectItem>(null);
    const [ panelVars, setPanelVars ] = useState<CSSProperties>({});
    const panelRef = useRef<HTMLDivElement>(null);
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() =>
    {
        if(!isOpen || !rootRef.current) return;

        const computed = getComputedStyle(rootRef.current);
        const vars: { [ name: string ]: string } = {};

        for(let i = 0; i < computed.length; i++)
        {
            const name = computed[i];

            if(name.startsWith('--')) vars[name] = computed.getPropertyValue(name);
        }

        for(const [ name, entry ] of Object.entries(rest.style ?? {}))
        {
            if(name.startsWith('--') && (entry !== null) && (entry !== undefined)) vars[name] = String(entry);
        }

        setPanelVars(vars as CSSProperties);
    }, [ isOpen, rest.style ]);

    useEffect(() =>
    {
        if(!isOpen) return;

        const place = () =>
        {
            if(!rootRef.current || !panelRef.current) return;

            const bounds = rootRef.current.getBoundingClientRect();

            panelRef.current.style.top = `${ bounds.bottom + 9 }px`;
            panelRef.current.style.left = `${ bounds.left }px`;
            panelRef.current.style.width = `${ bounds.width }px`;
        }

        let frame = requestAnimationFrame(function loop() { place(); frame = requestAnimationFrame(loop); });

        window.addEventListener('resize', place);
        window.addEventListener('scroll', place, true);

        return () =>
        {
            cancelAnimationFrame(frame);
            window.removeEventListener('resize', place);
            window.removeEventListener('scroll', place, true);
        }
    }, [ isOpen ]);

    useEffect(() =>
    {
        const onMouseDown = (event: MouseEvent) =>
        {
            const target = event.target as Node;

            if(!rootRef.current?.contains(target) && !panelRef.current?.contains(target)) setIsOpen(false);
        }

        document.addEventListener('mousedown', onMouseDown);

        return () => document.removeEventListener('mousedown', onMouseDown);
    }, []);

    const groups = useMemo(() =>
    {
        const result: SelectGroup[] = [];
        let current: SelectGroup = null;

        for(const item of items)
        {
            if(item?.type === 'separator')
            {
                current = { label: item.text, title: item.title, visible: (hiddenGroups[item.text] ?? true), items: [] };

                result.push(current);
            }
            else
            {
                if(!current)
                {
                    current = { label: '_generic', visible: true, items: [] };

                    result.unshift(current);
                }

                current.items.push(item);
            }
        }

        return result;
    }, [ items, hiddenGroups ]);

    useEffect(() =>
    {
        const item = items.find(entry => (entry.type !== 'separator') && (entry.value === value)) ?? (noInvalid ? items.find(entry => (entry.type !== 'separator')) : null);

        setSelectedItem(item);

        if(item && (item.value !== value) && onChange) onChange(item.value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ items, value ]);

    return (
        <Column className={ `custom-select-root ${ className } ${ ((items.length <= 0) || disabled) ? 'disabled' : '' }` } innerRef={ rootRef } { ...rest }>
            <Flex title={ selectedItem?.title } className="custom-select-display" onClick={ () => !disabled && setIsOpen(open => (!open && (items.length <= 0)) ? open : !open) }>
                <Text small truncate>{ selectedItem ? selectedItem.text : placeholder }</Text>
                { icon && <Base style={ isOpen ? { transform: 'rotate(180deg)' } : {} }>{ icon }</Base> }
            </Flex>
            { !disabled && isOpen && createPortal(
                <Column innerRef={ panelRef } className="custom-select-panel" style={ panelVars }>
                    <ScrollContainer gap={ 0 }>
                        { groups.map((group, groupIndex) => (
                            <Column key={ groupIndex } gap={ 0 } className="custom-select-group">
                                { (group.label !== '_generic') &&
                                    <Flex justifyContent="between" className="custom-select-separator" title={ group.title } onClick={ () => setHiddenGroups(previous => ({ ...previous, [group.label]: !(previous[group.label] ?? true) })) }>
                                        <Text small bold truncate textTransform="uppercase">{ group.label }</Text>
                                        { icon && <Base style={ group.visible ? { transform: 'rotate(180deg)' } : {} }>{ icon }</Base> }
                                    </Flex> }
                                { group.visible && group.items.map((item, itemIndex) => (
                                    <Text key={ itemIndex } small truncate className={ 'custom-select-item' + ((value === item.value) ? ' custom-select-selected' : '') } title={ item?.title } onClick={ () => { onChange(item.value); setIsOpen(false); } }>{ item.text }</Text>
                                )) }
                            </Column>
                        )) }
                    </ScrollContainer>
                </Column>, document.body) }
        </Column>
    );
}
