import { FC, useEffect, useRef, useState } from 'react';
import { CreateLinkEvent, RequestLogout } from '../../api';

interface IMenuPosition
{
    x: number;
    y: number;
}

interface IMenuItem
{
    label: string;
    icon: string;
    action: () => void;
}

const skipPageMenu = (event: MouseEvent) =>
{
    const target = event.target as HTMLElement;

    const selection = window.getSelection();

    return event.defaultPrevented || event.shiftKey
        || !!target?.closest?.('input, textarea, select, [contenteditable=""], [contenteditable="true"]')
        || (!!selection && !selection.isCollapsed && (String(selection).trim() !== '') && selection.containsNode(target, true));
}

export const PageMenuView: FC<{}> = props =>
{
    const [ position, setPosition ] = useState<IMenuPosition>(null);
    const elementRef = useRef<HTMLDivElement>(null);

    useEffect(() =>
    {
        const onContextMenu = (event: MouseEvent) =>
        {
            const skip = skipPageMenu(event);

            event.preventDefault();

            if(skip) return;

            setPosition({ x: event.clientX, y: event.clientY });
        }

        const close = (event?: Event) =>
        {
            if(event && elementRef.current && elementRef.current.contains(event.target as Node)) return;

            setPosition(null);
        }

        const hide = () => setPosition(null);
        const onKey = (event: KeyboardEvent) => (event.key === 'Escape') && hide();

        window.addEventListener('contextmenu', onContextMenu);
        window.addEventListener('pointerdown', close);
        window.addEventListener('keydown', onKey);
        window.addEventListener('blur', hide);
        window.addEventListener('resize', hide);

        return () =>
        {
            window.removeEventListener('contextmenu', onContextMenu);
            window.removeEventListener('pointerdown', close);
            window.removeEventListener('keydown', onKey);
            window.removeEventListener('blur', hide);
            window.removeEventListener('resize', hide);
        };
    }, []);

    useEffect(() =>
    {
        const element = elementRef.current;

        if(!position || !element) return;

        const left = Math.max(4, Math.min(position.x, window.innerWidth - element.offsetWidth - 4));
        const top = Math.max(4, Math.min(position.y, window.innerHeight - element.offsetHeight - 4));

        element.style.left = `${ left }px`;
        element.style.top = `${ top }px`;
    }, [ position ]);

    if(!position) return null;

    const run = (action: () => void) =>
    {
        setPosition(null);
        action();
    }

    const sections: { title: string, items: IMenuItem[] }[] = [
        {
            title: 'Hotel',
            items: [
                { label: 'Presence shop', icon: 'icon-pf-rare', action: () => CreateLinkEvent('shop/show') },
                { label: 'Catalog', icon: 'icon-catalog', action: () => CreateLinkEvent('catalog/show') },
                { label: 'Inventory', icon: 'icon-inventory', action: () => CreateLinkEvent('inventory/show') },
                { label: 'Commands', icon: 'icon-me-helper-tool', action: () => CreateLinkEvent('cmdhelp/command') },
                { label: 'Beta info', icon: 'icon-help', action: () => CreateLinkEvent('beta-info/toggle') }
            ]
        },
        {
            title: 'Account',
            items: [
                { label: 'Logout', icon: 'icon-set-door', action: RequestLogout }
            ]
        }
    ];

    return (
        <div ref={ elementRef } className="nitro-page-menu" role="menu" style={ { left: position.x, top: position.y } }>
            { sections.map(section =>
                <div key={ section.title } className="nitro-page-menu-section">
                    <div className="nitro-page-menu-title">{ section.title }</div>
                    { section.items.map(item =>
                        <button key={ item.label } type="button" role="menuitem" className="nitro-page-menu-item" onClick={ () => run(item.action) }>
                            <span className={ `icon ${ item.icon } nitro-page-menu-icon` } />
                            <span className="nitro-page-menu-label">{ item.label }</span>
                        </button>) }
                </div>) }
            <div className="nitro-page-menu-separator" />
            <button type="button" role="menuitem" className="nitro-page-menu-item" onClick={ () => run(() => window.location.reload()) }>
                <span className="icon icon-arrows nitro-page-menu-icon" />
                <span className="nitro-page-menu-label">Reload hotel</span>
            </button>
        </div>
    );
}
