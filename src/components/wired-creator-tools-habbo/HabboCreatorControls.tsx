import { ChangeEvent, FC, KeyboardEvent, MouseEvent as ReactMouseEvent, ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { SkinRegistryView } from '../../common/habbo';
import { HabboSkinView, TruffleTextView } from '../../truffle';

export interface HabboTableColumn
{
    key: string;
    label: string;
    width: number;
    align?: 'left' | 'center' | 'right';
}

export interface HabboTableRow
{
    key: string;
    cells: Record<string, ReactNode>;
    selected?: boolean;
    pulseToken?: number;
    onClick?: () => void;
}

export const HabboTableText: FC<{ value: string | number; format: 'u_bold' | 'u_regular'; }> = ({ value, format }) =>
{
    const containerRef = useRef<HTMLSpanElement>();
    const [ width, setWidth ] = useState(1);

    useLayoutEffect(() =>
    {
        const container = containerRef.current;

        if(!container) return;

        const update = () => setWidth(Math.max(1, Math.floor(container.clientWidth)));
        const observer = new ResizeObserver(update);

        observer.observe(container);
        update();

        return () => observer.disconnect();
    }, []);

    return (
        <span ref={ containerRef } className="habbo-wired-table-text">
            <TruffleTextView
                text={ value }
                format={ format }
                width={ width }
                ellipsis
                tooltipOnEllipsis />
        </span>
    );
};

export const HabboTableView: FC<{
    columns: HabboTableColumn[];
    rows: HabboTableRow[];
    emptyText?: string;
    hideHeader?: boolean;
    className?: string;
}> = ({ columns, rows, emptyText = 'Nothing to display', hideHeader = false, className = '' }) =>
{
    const totalWidth = columns.reduce((total, column) => total + column.width, 0) || 1;

    return (
        <div className={ `habbo-wired-table ${ hideHeader ? 'habbo-wired-table-no-header' : '' } ${ className }`.trim() }>
            <SkinRegistryView registryId="habbo_skin_border_white" layout="border_white" className="habbo-wired-table-border" />
            <div className="habbo-wired-table-inner">
                { !hideHeader &&
                    <div className="habbo-wired-table-header">
                        { columns.map(column => (
                            <div
                                key={ column.key }
                                className={ `habbo-wired-table-cell is-${ column.align || 'left' }` }
                                style={ { width: `${ (column.width / totalWidth) * 100 }%` } }>
                                <HabboTableText value={ column.label } format="u_bold" />
                            </div>
                        )) }
                    </div> }
                { !hideHeader && <div className="habbo-wired-table-splitter" /> }
                <HabboScrollView className="habbo-wired-table-body" contentKey={ rows.length } step={ 40 }>
                    { rows.map((row, index) => (
                        <div
                            key={ row.key }
                            className={ `habbo-wired-table-row ${ row.selected ? 'is-selected' : '' } ${ row.onClick ? 'is-clickable' : '' } ${ row.pulseToken ? `is-live-updated wired-tools-pulse-${ row.pulseToken % 2 ? 'a' : 'b' }` : '' }`.trim() }
                            onClick={ row.onClick }
                            role={ row.onClick ? 'button' : undefined }
                            tabIndex={ row.onClick ? 0 : undefined }
                            onKeyDown={ event =>
                            {
                                if(row.onClick && (event.key === 'Enter' || event.key === ' '))
                                {
                                    event.preventDefault();
                                    row.onClick();
                                }
                            } }>
                            { columns.map(column => (
                                <div
                                    key={ column.key }
                                    className={ `habbo-wired-table-cell is-${ column.align || 'left' }` }
                                    style={ { width: `${ (column.width / totalWidth) * 100 }%` } }>
                                    { typeof row.cells[column.key] === 'string' || typeof row.cells[column.key] === 'number'
                                        ? <HabboTableText value={ row.cells[column.key] as string | number } format="u_regular" />
                                        : row.cells[column.key] }
                                </div>
                            )) }
                        </div>
                    )) }
                    { !rows.length &&
                        <div className="habbo-wired-table-empty">
                            <TruffleTextView text={ emptyText } format="u_regular" />
                        </div> }
                </HabboScrollView>
            </div>
        </div>
    );
};

type HabboScrollState = 'default' | 'hovering' | 'pressed' | 'disabled';

const HabboScrollbarButton: FC<{
    className: string;
    skin: 'scroll-up' | 'scroll-down';
    onClick: () => void;
}> = ({ className, skin, onClick }) =>
{
    const [ state, setState ] = useState<HabboScrollState>('default');

    return (
        <button
            className={ className }
            type="button"
            onMouseEnter={ () => setState('hovering') }
            onMouseLeave={ () => setState('default') }
            onMouseDown={ () => setState('pressed') }
            onMouseUp={ () => setState('hovering') }
            onClick={ event =>
            {
                event.stopPropagation();
                onClick();
            } }>
            <HabboSkinView skin={ skin } state={ state } />
        </button>
    );
};

export const HabboScrollView: FC<{
    children: ReactNode;
    className?: string;
    contentKey?: string | number;
    step?: number;
}> = ({ children, className = '', contentKey = 0, step = 40 }) =>
{
    const targetRef = useRef<HTMLDivElement>();
    const innerRef = useRef<HTMLDivElement>();
    const [ metrics, setMetrics ] = useState({ clientHeight: 0, scrollHeight: 0, scrollTop: 0 });
    const [ thumbState, setThumbState ] = useState<HabboScrollState>('default');

    const update = useCallback(() =>
    {
        const target = targetRef.current;

        if(!target) return;

        setMetrics({
            clientHeight: target.clientHeight,
            scrollHeight: target.scrollHeight,
            scrollTop: target.scrollTop
        });
    }, []);

    useLayoutEffect(() =>
    {
        const target = targetRef.current;

        if(!target) return;

        const observer = new ResizeObserver(update);

        observer.observe(target);
        if(innerRef.current) observer.observe(innerRef.current);
        target.addEventListener('scroll', update, { passive: true });
        update();

        return () =>
        {
            observer.disconnect();
            target.removeEventListener('scroll', update);
        };
    }, [ contentKey, update ]);

    const hasOverflow = metrics.scrollHeight > metrics.clientHeight;
    const trackHeight = Math.max(0, metrics.clientHeight - 32);
    const thumbHeight = Math.max(12, Math.floor(trackHeight * metrics.clientHeight / Math.max(1, metrics.scrollHeight)));
    const travel = Math.max(0, trackHeight - thumbHeight);
    const maxScroll = Math.max(0, metrics.scrollHeight - metrics.clientHeight);
    const thumbTop = maxScroll ? Math.round(travel * metrics.scrollTop / maxScroll) : 0;
    const onThumbMouseDown = (event: ReactMouseEvent<HTMLButtonElement>) =>
    {
        event.preventDefault();
        event.stopPropagation();
        setThumbState('pressed');
        const startY = event.clientY;
        const startScrollTop = targetRef.current.scrollTop;
        const onMouseMove = (moveEvent: MouseEvent) =>
        {
            if(!travel) return;

            targetRef.current.scrollTop = startScrollTop + ((moveEvent.clientY - startY) * maxScroll / travel);
        };
        const onMouseUp = () =>
        {
            setThumbState('hovering');
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    return (
        <div className={ `habbo-wired-scroll-region ${ hasOverflow ? 'has-overflow' : '' } ${ className }`.trim() }>
            <div ref={ targetRef } className="habbo-wired-scroll-content">
                <div ref={ innerRef } className="habbo-wired-scroll-content-inner">{ children }</div>
            </div>
            { hasOverflow &&
                <div className="habbo-wired-scrollbar">
                    <HabboScrollbarButton className="habbo-wired-scroll-up" skin="scroll-up" onClick={ () => targetRef.current.scrollTop -= step } />
                    <button
                        className="habbo-wired-scroll-track"
                        type="button"
                        onClick={ event =>
                        {
                            event.stopPropagation();
                            const bounds = event.currentTarget.getBoundingClientRect();
                            const clicked = event.clientY - bounds.top;

                            targetRef.current.scrollTop += clicked < thumbTop ? -metrics.clientHeight : metrics.clientHeight;
                        } }>
                        <HabboSkinView skin="scroll-track" />
                    </button>
                    <button
                        className="habbo-wired-scroll-thumb"
                        type="button"
                        style={ { top: 16 + thumbTop, height: thumbHeight } }
                        onMouseEnter={ () => setThumbState('hovering') }
                        onMouseLeave={ () => setThumbState('default') }
                        onMouseDown={ onThumbMouseDown }>
                        <HabboSkinView skin="scroll-thumb" state={ thumbState } />
                    </button>
                    <HabboScrollbarButton className="habbo-wired-scroll-down" skin="scroll-down" onClick={ () => targetRef.current.scrollTop += step } />
                </div> }
        </div>
    );
};

const stopRoomInput = (event: ReactMouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>) =>
{
    event.stopPropagation();
};

export const HabboInputOverlay: FC<{
    value: string | number;
    onChange: (value: string) => void;
    onEnter?: (value: string) => void;
    ariaLabel: string;
    inputMode?: 'text' | 'numeric' | 'search';
}> = ({ value, onChange, onEnter, ariaLabel, inputMode = 'text' }) => (
    <input
        className="habbo-wired-native-overlay"
        type="text"
        inputMode={ inputMode }
        aria-label={ ariaLabel }
        value={ value }
        onChange={ (event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value) }
        onClick={ stopRoomInput }
        onKeyDown={ event =>
        {
            stopRoomInput(event);
            if(event.key === 'Enter') onEnter?.(event.currentTarget.value);
        } }
        onKeyUp={ stopRoomInput } />
);

export interface HabboDropMenuOption
{
    value: string;
    label: string;
    disabled?: boolean;
}

export const HabboDropMenuOverlay: FC<{
    value: string;
    options: HabboDropMenuOption[];
    onChange: (value: string) => void;
    ariaLabel: string;
}> = ({ value, options, onChange, ariaLabel }) =>
{
    const [ open, setOpen ] = useState(false);
    const [ hoveredValue, setHoveredValue ] = useState('');
    const [ position, setPosition ] = useState({ left: 0, top: 0, width: 0, height: 0 });
    const anchorRef = useRef<HTMLButtonElement>();

    useEffect(() =>
    {
        if(!open) return;

        const close = () => setOpen(false);

        window.addEventListener('resize', close);
        window.addEventListener('scroll', close, true);
        document.addEventListener('pointerdown', close);

        return () =>
        {
            window.removeEventListener('resize', close);
            window.removeEventListener('scroll', close, true);
            document.removeEventListener('pointerdown', close);
        };
    }, [ open ]);

    const toggle = (event: ReactMouseEvent<HTMLButtonElement>) =>
    {
        event.stopPropagation();
        const rect = event.currentTarget.getBoundingClientRect();
        const longest = Math.max(rect.width, ...options.map(option => Math.min(200, option.label.length) * 7 + 20));
        const width = Math.min(Math.max(rect.width, longest), Math.max(80, window.innerWidth - 60));
        const estimatedHeight = Math.min(220, options.length * 21 + 6);
        const showAbove = rect.bottom + estimatedHeight > window.innerHeight - 30 && rect.top > estimatedHeight;
        const left = Math.max(30, Math.min(rect.left, window.innerWidth - width - 30));
        const top = showAbove ? Math.max(30, rect.top - estimatedHeight) : Math.min(window.innerHeight - estimatedHeight - 30, rect.bottom);

        setPosition({ left, top, width, height: estimatedHeight });
        setOpen(previous => !previous);
    };

    return (
        <>
            <button
                ref={ anchorRef }
                className="habbo-wired-native-overlay"
                type="button"
                aria-label={ ariaLabel }
                aria-haspopup="listbox"
                aria-expanded={ open }
                onPointerDown={ event => event.stopPropagation() }
                onClick={ toggle } />
            { open && createPortal(
                <div
                    className="habbo-wired-dropmenu-popup"
                    style={ { left: position.left, top: position.top, width: position.width, height: position.height } }
                    role="listbox"
                    onPointerDown={ event => event.stopPropagation() }>
                    <HabboScrollView className="habbo-wired-dropmenu-scroll" contentKey={ options.length } step={ 42 }>
                        { options.map(option => (
                            <button
                                key={ option.value }
                                className="habbo-wired-dropmenu-option"
                                type="button"
                                role="option"
                                aria-selected={ option.value === value }
                                disabled={ option.disabled }
                                onClick={ event =>
                                {
                                    event.stopPropagation();
                                    onChange(option.value);
                                    setOpen(false);
                                } }
                                onMouseEnter={ () => setHoveredValue(option.value) }
                                onMouseLeave={ () => setHoveredValue('') }>
                                <SkinRegistryView
                                    registryId="habbo_skin_dropmenu_3"
                                    layout="dropmenu_item_3"
                                    state={ option.value === value ? 'selected' : hoveredValue === option.value ? 'hovering' : 'default' }
                                    className="habbo-wired-dropmenu-skin" />
                                <span className="habbo-wired-dropmenu-label">
                                    <TruffleTextView text={ option.label.slice(0, 200) } format="u_regular" />
                                </span>
                            </button>
                        )) }
                    </HabboScrollView>
                </div>,
                document.body) }
        </>
    );
};

export const HabboLinkText: FC<{ children: string | number; onClick: () => void; }> = ({ children, onClick }) => (
    <button
        className="habbo-wired-text-link"
        type="button"
        onClick={ event =>
        {
            event.stopPropagation();
            onClick();
        } }>
        <TruffleTextView text={ children } format="u_regular" color={ 0x0000EE } />
    </button>
);
