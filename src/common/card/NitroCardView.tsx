import { FC, MouseEvent as ReactMouseEvent, useCallback, useEffect, useMemo, useRef } from 'react';
import { Column, ColumnProps } from '..';
import { DraggableWindow, DraggableWindowPosition, DraggableWindowProps } from '../draggable-window';
import { NitroCardContextProvider } from './NitroCardContext';

export interface NitroCardViewProps extends DraggableWindowProps, ColumnProps
{
    theme?: string;
    invisible?: boolean;
    resize?: 'none' | 'horizontal' | 'vertical' | 'both';
    preventContextMenu?: boolean;
}

const RESIZE_CURSORS = { horizontal: 'e-resize', vertical: 's-resize', both: 'nwse-resize', none: 'default' };

export const NitroCardView: FC<NitroCardViewProps> = props =>
{
    const { invisible = false, theme = 'primary', uniqueKey = null, handleSelector = '.drag-handler', windowPosition = DraggableWindowPosition.CENTER, disableDrag = false, overflow = 'auto', position = 'relative', gap = null, classNames = [], resize = 'none', preventContextMenu = false, dragStyle, children = null, ...rest } = props;
    const elementRef = useRef<HTMLDivElement>(null);
    const dragRef = useRef<{ startX: number, startY: number, startWidth: number, startHeight: number }>(null);
    const originalSize = useRef({ width: '', height: '' });
    const resized = useRef({ width: false, height: false });

    const getClassNames = useMemo(() =>
    {
        const newClassNames: string[] = [ 'nitro-card' ];

        newClassNames.push(`theme-${ theme || 'primary' }`);

        if(invisible) newClassNames.push('invisible-card');

        if(classNames.length) newClassNames.push(...classNames);

        return newClassNames;
    }, [ theme, invisible, classNames ]);

    // switching the resize mode off again restores the size the window had before it was dragged
    useEffect(() =>
    {
        if(!elementRef.current) return;

        if((resize !== 'horizontal') && (resize !== 'both') && resized.current.width)
        {
            elementRef.current.style.width = originalSize.current.width;
            resized.current.width = false;
        }

        if((resize !== 'vertical') && (resize !== 'both') && resized.current.height)
        {
            elementRef.current.style.height = originalSize.current.height;
            resized.current.height = false;
        }
    }, [ resize ]);

    const onMouseMove = useCallback((event: MouseEvent) =>
    {
        if(!elementRef.current || !dragRef.current) return;

        const deltaX = (event.clientX - dragRef.current.startX);
        const deltaY = (event.clientY - dragRef.current.startY);

        if((resize === 'both') || (resize === 'horizontal'))
        {
            elementRef.current.style.width = `${ dragRef.current.startWidth + deltaX }px`;
            resized.current.width = true;
        }

        if((resize === 'both') || (resize === 'vertical'))
        {
            elementRef.current.style.height = `${ dragRef.current.startHeight + deltaY }px`;
            resized.current.height = true;
        }
    }, [ resize ]);

    const onMouseUp = useCallback(() =>
    {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    }, [ onMouseMove ]);

    const onResizeStart = useCallback((event: ReactMouseEvent) =>
    {
        event.preventDefault();
        event.stopPropagation();

        const element = elementRef.current;

        if(!element) return;

        if(!resized.current.width) originalSize.current.width = element.style.width;
        if(!resized.current.height) originalSize.current.height = element.style.height;

        dragRef.current = { startX: event.clientX, startY: event.clientY, startWidth: element.offsetWidth, startHeight: element.offsetHeight };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }, [ onMouseMove, onMouseUp ]);

    return (
        <NitroCardContextProvider value={ { theme } }>
            <DraggableWindow uniqueKey={ uniqueKey } handleSelector={ handleSelector } windowPosition={ windowPosition } disableDrag={ disableDrag } dragStyle={ dragStyle }>
                <Column innerRef={ elementRef } overflow={ overflow } position={ position } gap={ gap ?? 0 } classNames={ getClassNames } { ...rest } onContextMenu={ event => { if(preventContextMenu) event.preventDefault(); } }>
                    { children }
                    { (resize !== 'none') &&
                        <div className="resize-handler" style={ { cursor: RESIZE_CURSORS[resize] } } onMouseDown={ onResizeStart } /> }
                </Column>
            </DraggableWindow>
        </NitroCardContextProvider>
    );
}
