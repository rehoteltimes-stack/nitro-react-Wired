import { forwardRef, MouseEvent as ReactMouseEvent, MutableRefObject, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Grid, GridProps } from './Grid';

export interface ScrollbarState
{
    start: number;
    end: number;
    position: number;
}

export interface ScrollContainerProps extends GridProps
{
    innerRef?: MutableRefObject<HTMLDivElement>;
    direction?: 'vertical' | 'horizontal' | 'both';
    forceShow?: boolean;
    onScrollbarShowingChange?: (showing: { vertical: boolean, horizontal: boolean }) => void;
    onScrollbarChange?: (state: { vertical: ScrollbarState, horizontal: ScrollbarState }) => void;
    verticalScrollPosition?: number;
    horizontalScrollPosition?: number;
}

export interface ScrollContainerHandle
{
    isScrollbarVisible: () => { vertical: boolean, horizontal: boolean };
}

const MIN_THUMB_SIZE = 20;

// Custom-scrollbar container of the reference client: the native scrollbar of .scroll-content is hidden inline and a
// 6px track (.scroll-bar > .scroll-thumb) takes its own grid cell, sized and positioned from the scroll ratio.
export const ScrollContainer = forwardRef<ScrollContainerHandle, ScrollContainerProps>((props, ref) =>
{
    const { children, innerRef = null, direction = 'vertical', forceShow = false, onScrollbarShowingChange = null, onScrollbarChange = null, verticalScrollPosition = 0, horizontalScrollPosition = 0, className = '', classNames = [], ...rest } = props;
    const contentRef = useRef<HTMLDivElement>(null);
    const [ verticalThumbSize, setVerticalThumbSize ] = useState(0);
    const [ horizontalThumbSize, setHorizontalThumbSize ] = useState(0);
    const [ verticalThumbPosition, setVerticalThumbPosition ] = useState(0);
    const [ horizontalThumbPosition, setHorizontalThumbPosition ] = useState(0);
    const [ verticalVisible, setVerticalVisible ] = useState(forceShow);
    const [ horizontalVisible, setHorizontalVisible ] = useState(forceShow);

    const isVertical = ((direction === 'vertical') || (direction === 'both'));
    const isHorizontal = ((direction === 'horizontal') || (direction === 'both'));
    const containerClassName = [ 'scroll-container', ...classNames, className ].filter(Boolean).join(' ');

    const update = () =>
    {
        const element = contentRef.current;

        if(!element) return;

        const { scrollTop, scrollHeight, clientHeight, scrollLeft, scrollWidth, clientWidth } = element;
        const verticalRatio = (scrollTop / ((scrollHeight - clientHeight) || 1));
        const horizontalRatio = (scrollLeft / ((scrollWidth - clientWidth) || 1));

        if(isVertical)
        {
            let size = 0;
            let position = 0;

            if(scrollHeight <= clientHeight)
            {
                setVerticalVisible(forceShow);

                size = (forceShow ? clientHeight : 0);
            }
            else
            {
                setVerticalVisible(true);

                size = Math.max(clientHeight * (clientHeight / scrollHeight), MIN_THUMB_SIZE);
                position = (verticalRatio * (clientHeight - size));
            }

            setVerticalThumbSize(size);
            setVerticalThumbPosition(position);
        }

        if(isHorizontal)
        {
            let size = 0;
            let position = 0;

            if(scrollWidth <= clientWidth)
            {
                setHorizontalVisible(forceShow);

                size = (forceShow ? clientWidth : 0);
            }
            else
            {
                setHorizontalVisible(true);

                size = Math.max(clientWidth * (clientWidth / scrollWidth), MIN_THUMB_SIZE);
                position = (horizontalRatio * (clientWidth - size));
            }

            setHorizontalThumbSize(size);
            setHorizontalThumbPosition(position);
        }

        if(onScrollbarChange)
        {
            onScrollbarChange({
                vertical: { start: (scrollTop / scrollHeight), end: Math.min(((scrollTop + clientHeight) / scrollHeight), 1), position: verticalRatio },
                horizontal: { start: (scrollLeft / scrollWidth), end: Math.min(((scrollLeft + clientWidth) / scrollWidth), 1), position: horizontalRatio }
            });
        }
    }

    useEffect(() =>
    {
        const element = contentRef.current;

        if(!element) return;

        const onChange = () => update();

        element.addEventListener('scroll', onChange);
        window.addEventListener('resize', onChange);

        const resizeObserver = new ResizeObserver(onChange);

        resizeObserver.observe(element);
        Array.from(element.children).forEach(child => resizeObserver.observe(child));

        const mutationObserver = new MutationObserver(() =>
        {
            Array.from(element.children).forEach(child => resizeObserver.observe(child));

            requestAnimationFrame(onChange);
        });

        mutationObserver.observe(element, { childList: true, subtree: true, characterData: true });

        return () =>
        {
            element.removeEventListener('scroll', onChange);
            window.removeEventListener('resize', onChange);
            resizeObserver.disconnect();
            mutationObserver.disconnect();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() =>
    {
        if(onScrollbarShowingChange) onScrollbarShowingChange({ vertical: (isVertical && verticalVisible), horizontal: (isHorizontal && horizontalVisible) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ verticalVisible, horizontalVisible, onScrollbarShowingChange ]);

    useImperativeHandle(ref, () => ({
        isScrollbarVisible: () => ({ vertical: (isVertical && verticalVisible), horizontal: (isHorizontal && horizontalVisible) })
    }));

    useEffect(() =>
    {
        update();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ forceShow, children ]);

    useEffect(() =>
    {
        if(!contentRef.current) return;

        requestAnimationFrame(() =>
        {
            const element = contentRef.current;

            if(!element) return;

            if(isVertical && (verticalScrollPosition !== -1))
            {
                const range = (element.scrollHeight - element.clientHeight);

                element.scrollTop = Math.max(0, Math.min((verticalScrollPosition * range), range));
            }

            if(isHorizontal && (horizontalScrollPosition !== -1))
            {
                const range = (element.scrollWidth - element.clientWidth);

                element.scrollLeft = Math.max(0, Math.min((horizontalScrollPosition * range), range));
            }

            update();
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ verticalScrollPosition, horizontalScrollPosition, isVertical, isHorizontal ]);

    const onVerticalThumbDown = (event: ReactMouseEvent) =>
    {
        event.preventDefault();

        const element = contentRef.current;

        if(!element || !verticalVisible) return;

        const startY = event.clientY;
        const startThumb = ((element.scrollTop / element.scrollHeight) * element.clientHeight);

        const onMove = (moveEvent: MouseEvent) =>
        {
            const ratio = (element.scrollHeight / element.clientHeight);

            element.scrollTop = ((startThumb + (moveEvent.clientY - startY)) * ratio);

            update();
        }

        const onUp = () =>
        {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        }

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    }

    const onHorizontalThumbDown = (event: ReactMouseEvent) =>
    {
        event.preventDefault();

        const element = contentRef.current;

        if(!element || !horizontalVisible) return;

        const startX = event.clientX;
        const startThumb = ((element.scrollLeft / element.scrollWidth) * element.clientWidth);

        const onMove = (moveEvent: MouseEvent) =>
        {
            const ratio = (element.scrollWidth / element.clientWidth);

            element.scrollLeft = ((startThumb + (moveEvent.clientX - startX)) * ratio);

            update();
        }

        const onUp = () =>
        {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        }

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    }

    const onVerticalTrackDown = (event: ReactMouseEvent<HTMLDivElement>) =>
    {
        event.preventDefault();

        const element = contentRef.current;

        if(!element || !verticalVisible) return;

        const bounds = event.currentTarget.getBoundingClientRect();
        const offset = (event.clientY - bounds.top);
        const target = (((offset - (verticalThumbSize / 2)) / element.clientHeight) * element.scrollHeight);

        element.scrollTop = Math.max(0, Math.min(target, (element.scrollHeight - element.clientHeight)));

        update();
        onVerticalThumbDown(event);
    }

    const onHorizontalTrackDown = (event: ReactMouseEvent<HTMLDivElement>) =>
    {
        event.preventDefault();

        const element = contentRef.current;

        if(!element || !horizontalVisible) return;

        const bounds = event.currentTarget.getBoundingClientRect();
        const offset = (event.clientX - bounds.left);
        const target = (((offset - (horizontalThumbSize / 2)) / element.clientWidth) * element.scrollWidth);

        element.scrollLeft = Math.max(0, Math.min(target, (element.scrollWidth - element.clientWidth)));

        update();
        onHorizontalThumbDown(event);
    }

    return (
        <Grid className={ containerClassName } overflow="hidden" gap={ 2 } style={ {
            '--scrollbar-width': (isVertical && verticalVisible) ? '6px' : '0px',
            '--scrollbar-height': (isHorizontal && horizontalVisible) ? '6px' : '0px',
            gridTemplateColumns: (isVertical && verticalVisible) ? '1fr 6px' : '1fr',
            gridTemplateRows: (isHorizontal && horizontalVisible) ? '1fr 6px' : '1fr'
        } as any } { ...rest }>
            <div ref={ element => { contentRef.current = element; if(innerRef) innerRef.current = element; } } className={ `scroll-content ${ direction }` } style={ { scrollbarWidth: 'none', msOverflowStyle: 'none' } as any }>
                { children }
            </div>
            { (isVertical && verticalVisible) &&
                <div className="scroll-bar vertical" onMouseDown={ onVerticalTrackDown }>
                    <div className="scroll-thumb vertical" style={ { height: verticalThumbSize, top: verticalThumbPosition } } onMouseDown={ onVerticalThumbDown } />
                </div> }
            { (isHorizontal && horizontalVisible) &&
                <div className="scroll-bar horizontal" onMouseDown={ onHorizontalTrackDown }>
                    <div className="scroll-thumb horizontal" style={ { width: horizontalThumbSize, left: horizontalThumbPosition } } onMouseDown={ onHorizontalThumbDown } />
                </div> }
        </Grid>
    );
});

ScrollContainer.displayName = 'ScrollContainer';
