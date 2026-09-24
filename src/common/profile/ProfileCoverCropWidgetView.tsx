import { CSSProperties, FC, MouseEvent as ReactMouseEvent, ReactNode, useEffect, useMemo, useRef, useState } from 'react';

export interface ProfileCoverCropWidgetViewProps
{
    sourceImage: HTMLImageElement;
    wantedSize: [ number, number ];
    onUpdate: (canvas: HTMLCanvasElement) => void;
    backgroundFillColor?: string;
    overlayContent?: ReactNode;
    overlayOutsideColor?: string;
    overlayOverflowIgnoreColor?: boolean;
    updateFrequency?: number;
}

type ResizeHandleKey = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';
type DragMode = 'move' | ResizeHandleKey;
interface CropRect { x: number; y: number; width: number; height: number; }

const HANDLE_KEYS: ResizeHandleKey[] = [ 'nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w' ];
const MIN_SIZE = 20;

// Real reference component (`sO` in HabboCity's own minified client source, confirmed real - its own
// CSS is already ported in this project's _30-forms.scss (.canvas-cropper-view/.crop-container/
// .crop-overlay/.resize-handle etc.), just never wired to any markup before this pass). NOT a
// pan-inside-a-fixed-frame widget (an earlier version of this file guessed that, wrongly, without
// finding the real source first) - the REAL mechanism: the whole source image is letterboxed (never
// cropped) into a display canvas matching wantedSize's aspect ratio, and a resizable/movable rectangle
// (aspect-ratio-locked to wantedSize, 8 handles) selects which part becomes the final output. Dimming
// outside the selection uses a real SVG mask (a white full-rect with a black rounded-rect cutout at the
// selection, then a semi-transparent rect painted through that mask) rather than four separate divs.
export const ProfileCoverCropWidgetView: FC<ProfileCoverCropWidgetViewProps> = props =>
{
    const { sourceImage, wantedSize, onUpdate, backgroundFillColor = '#888888', overlayContent = null, overlayOutsideColor = 'rgba(0, 0, 0, 0.5)', overlayOverflowIgnoreColor = false, updateFrequency = 50 } = props;
    const [ wantedWidth, wantedHeight ] = wantedSize;
    const aspectRatio = wantedWidth / wantedHeight;

    const [ dragMode, setDragMode ] = useState<DragMode>(null);
    const [ rect, setRect ] = useState<CropRect>({ x: 20, y: 20, width: 200, height: 100 });
    const [ displaySize, setDisplaySize ] = useState({ width: sourceImage.width, height: sourceImage.height });

    const containerRef = useRef<HTMLDivElement>(null);
    const dragStartRef = useRef<{ x: number; y: number } | null>(null);
    // Letterboxed full-source canvas (never cropped) and the display canvas actually shown (always
    // exactly wantedSize pixels, so the visible crop tool is a fixed size regardless of source size).
    const letterboxCanvasRef = useRef(document.createElement('canvas'));
    const displayCanvasRef = useRef(document.createElement('canvas'));
    // Scale factor from display-canvas space to letterboxed-canvas space.
    const scaleRef = useRef({ x: 1, y: 1 });
    const throttleRef = useRef<{ timeout: number; pending: (() => void) | null }>({ timeout: null, pending: null });

    const throttledRun = (fn: () => void) =>
    {
        const state = throttleRef.current;

        if(state.timeout !== null)
        {
            state.pending = fn;
            return;
        }

        fn();
        state.timeout = window.setTimeout(() =>
        {
            state.timeout = null;

            if(state.pending)
            {
                const pending = state.pending;

                state.pending = null;
                throttledRun(pending);
            }
        }, updateFrequency);
    }

    // Letterbox the full source image into a canvas matching wantedSize's aspect ratio, then draw
    // THAT into the fixed-size display canvas - real reference math, not guessed.
    useEffect(() =>
    {
        const sourceWidth = sourceImage.width;
        const sourceHeight = sourceImage.height;
        const sourceRatio = sourceWidth / sourceHeight;

        let letterboxWidth: number, letterboxHeight: number, offsetX = 0, offsetY = 0;

        if(sourceRatio > aspectRatio)
        {
            letterboxWidth = sourceWidth;
            letterboxHeight = Math.round(sourceWidth / aspectRatio);
            offsetY = Math.round((letterboxHeight - sourceHeight) / 2);
        }
        else
        {
            letterboxHeight = sourceHeight;
            letterboxWidth = Math.round(sourceHeight * aspectRatio);
            offsetX = Math.round((letterboxWidth - sourceWidth) / 2);
        }

        const letterboxCanvas = letterboxCanvasRef.current;

        letterboxCanvas.width = letterboxWidth;
        letterboxCanvas.height = letterboxHeight;

        const letterboxCtx = letterboxCanvas.getContext('2d');

        letterboxCtx.clearRect(0, 0, letterboxWidth, letterboxHeight);
        letterboxCtx.drawImage(sourceImage, offsetX, offsetY);

        const displayCanvas = displayCanvasRef.current;

        displayCanvas.width = wantedWidth;
        displayCanvas.height = wantedHeight;

        const displayCtx = displayCanvas.getContext('2d');

        displayCtx.clearRect(0, 0, wantedWidth, wantedHeight);
        displayCtx.drawImage(letterboxCanvas, 0, 0, letterboxWidth, letterboxHeight, 0, 0, wantedWidth, wantedHeight);

        scaleRef.current = { x: wantedWidth / letterboxWidth, y: wantedHeight / letterboxHeight };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ sourceImage, wantedWidth, wantedHeight ]);

    const recomputeOutput = (nextRect: CropRect) =>
    {
        const scale = scaleRef.current;
        const sourceX = nextRect.x / scale.x;
        const sourceY = nextRect.y / scale.y;
        const sourceWidth = nextRect.width / scale.x;
        const sourceHeight = nextRect.height / scale.y;
        const downsample = (sourceWidth > wantedWidth) || (sourceHeight > wantedHeight);

        const canvas = document.createElement('canvas');
        const outWidth = downsample ? wantedWidth : Math.round(sourceWidth);
        const outHeight = downsample ? wantedHeight : Math.round(sourceHeight);

        canvas.width = outWidth;
        canvas.height = outHeight;

        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, outWidth, outHeight);
        ctx.drawImage(letterboxCanvasRef.current, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, outWidth, outHeight);

        onUpdate(canvas);
    }

    // Mount the display canvas into the DOM (real reference technique: an imperative ref.appendChild,
    // not a React-owned <canvas>, since the canvas is reused/redrawn outside React's own render cycle)
    // and (re)center the initial 80%-sized, aspect-locked crop rectangle whenever the display canvas
    // itself changes (new source image or new wantedSize).
    useEffect(() =>
    {
        if(containerRef.current)
        {
            containerRef.current.innerHTML = '';
            containerRef.current.appendChild(displayCanvasRef.current);
        }

        setDisplaySize({ width: displayCanvasRef.current.width, height: displayCanvasRef.current.height });

        const boxWidth = displayCanvasRef.current.width * 0.8;
        const boxHeight = displayCanvasRef.current.height * 0.8;

        let width = boxWidth;
        let height = width / aspectRatio;

        if(height > boxHeight)
        {
            height = boxHeight;
            width = height * aspectRatio;
        }

        const initialRect: CropRect = { x: (displayCanvasRef.current.width - width) / 2, y: (displayCanvasRef.current.height - height) / 2, width, height };

        setRect(initialRect);
        throttledRun(() => recomputeOutput(initialRect));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ sourceImage, wantedWidth, wantedHeight ]);

    const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

    const onHandleMouseDown = (event: ReactMouseEvent, mode: DragMode) =>
    {
        event.preventDefault();
        event.stopPropagation();

        setDragMode(mode);
        dragStartRef.current = { x: event.clientX, y: event.clientY };
    }

    useEffect(() =>
    {
        const onMouseMove = (event: globalThis.MouseEvent) =>
        {
            if(!dragMode || !dragStartRef.current) return;

            event.preventDefault();

            const deltaX = event.clientX - dragStartRef.current.x;
            const deltaY = event.clientY - dragStartRef.current.y;

            setRect(prev =>
            {
                const { x, y, width, height } = prev;
                const toSourceScale = (v: number) => v / aspectRatio;
                const toDisplayScale = (v: number) => v * aspectRatio;
                let next = prev;

                switch(dragMode)
                {
                    case 'move':
                    {
                        next = { x: clamp(x + deltaX, 0, displaySize.width - width), y: clamp(y + deltaY, 0, displaySize.height - height), width, height };
                        break;
                    }
                    case 'nw':
                    case 'sw':
                    {
                        const isNw = (dragMode === 'nw');
                        const bottomOrOrigin = isNw ? (y + height) : displaySize.height - y;
                        const newHeightPx = clamp(width - deltaX, MIN_SIZE, x + width);
                        const newHeight = clamp(toSourceScale(newHeightPx), MIN_SIZE, bottomOrOrigin);

                        if(toSourceScale(newHeightPx) !== newHeight) break;

                        const newWidth = newHeightPx;
                        const newX = x + width - newWidth;
                        const newY = isNw ? (y + height - newHeight) : y;

                        next = { x: newX, y: newY, width: newWidth, height: newHeight };
                        break;
                    }
                    case 'ne':
                    case 'se':
                    {
                        const isNe = (dragMode === 'ne');
                        const bottomOrOrigin = isNe ? (y + height) : (displaySize.height - y);
                        let newWidth = clamp(width + deltaX, MIN_SIZE, displaySize.width - x);
                        let newHeight = clamp(toSourceScale(newWidth), MIN_SIZE, bottomOrOrigin);

                        newWidth = toDisplayScale(newHeight);

                        const newY = isNe ? clamp((y + height) - newHeight, 0, (y + height) - MIN_SIZE) : y;

                        next = { x, y: newY, width: newWidth, height: newHeight };
                        break;
                    }
                    case 'n':
                    case 's':
                    {
                        const isN = (dragMode === 'n');
                        const newYIfN = clamp(y + deltaY, 0, (y + height) - MIN_SIZE);
                        const newHeight = isN ? ((y + height) - newYIfN) : clamp(height + deltaY, MIN_SIZE, displaySize.height - y);
                        let newWidth = toDisplayScale(newHeight);
                        let newX = x + (width - newWidth) / 2;

                        newX = clamp(newX, 0, displaySize.width - newWidth);
                        newWidth = Math.min(newWidth, displaySize.width - newX);

                        next = { x: newX, y: isN ? newYIfN : y, width: newWidth, height: newHeight };
                        break;
                    }
                    case 'e':
                    {
                        const newWidth = clamp(width + deltaX, Math.max(MIN_SIZE, MIN_SIZE * aspectRatio), displaySize.width - x);
                        const newHeight = toSourceScale(newWidth);
                        let newY = y + (height - newHeight) / 2;

                        newY = clamp(newY, 0, displaySize.height - newHeight);

                        next = { x, y: newY, width: newWidth, height: newHeight };
                        break;
                    }
                    case 'w':
                    {
                        const minWidth = Math.max(MIN_SIZE, MIN_SIZE * aspectRatio);
                        let newWidth = clamp(width - deltaX, minWidth, x + width);
                        let newX = x + (width - newWidth);

                        newX = clamp(newX, 0, x + width - minWidth);

                        const newHeight = toSourceScale(newWidth);
                        let newY = y + (height - newHeight) / 2;

                        newY = clamp(newY, 0, displaySize.height - newHeight);

                        next = { x: newX, y: newY, width: newWidth, height: newHeight };
                        break;
                    }
                }

                throttledRun(() => recomputeOutput(next));

                return next;
            });

            dragStartRef.current = { x: event.clientX, y: event.clientY };
        };

        const onMouseUp = () =>
        {
            setDragMode(null);
            dragStartRef.current = null;
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);

        return () =>
        {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ dragMode, displaySize, aspectRatio ]);

    const handlePositions = useMemo<Record<ResizeHandleKey, { left: number; top: number; cursor: string }>>(() => ({
        nw: { left: rect.x, top: rect.y, cursor: 'nw-resize' },
        n: { left: rect.x + (rect.width / 2), top: rect.y, cursor: 'n-resize' },
        ne: { left: rect.x + rect.width, top: rect.y, cursor: 'ne-resize' },
        e: { left: rect.x + rect.width, top: rect.y + (rect.height / 2), cursor: 'e-resize' },
        se: { left: rect.x + rect.width, top: rect.y + rect.height, cursor: 'se-resize' },
        s: { left: rect.x + (rect.width / 2), top: rect.y + rect.height, cursor: 's-resize' },
        sw: { left: rect.x, top: rect.y + rect.height, cursor: 'sw-resize' },
        w: { left: rect.x, top: rect.y + (rect.height / 2), cursor: 'w-resize' }
    }), [ rect ]);

    const containerStyle: CSSProperties = { width: wantedWidth, height: wantedHeight, position: 'relative' };

    return (
        <div className="canvas-cropper-view">
            <div className="crop-container crop-user-select" style={ containerStyle }>
                <div className="crop-user-select crop-position" ref={ containerRef } style={ { backgroundColor: backgroundFillColor } } />
                <svg className="crop-position mask-svg" width={ wantedWidth } height={ wantedHeight }>
                    <defs>
                        <mask id="profile-cover-crop-mask">
                            <rect width="100%" height="100%" fill="white" />
                            <rect x={ rect.x } y={ rect.y } width={ rect.width } height={ rect.height } fill="black" rx={ 4 } ry={ 4 } />
                        </mask>
                    </defs>
                    <rect width="100%" height="100%" fill={ overlayOutsideColor } mask="url(#profile-cover-crop-mask)" />
                </svg>
                <div className="crop-overlay" style={ { left: rect.x, top: rect.y, width: rect.width, height: rect.height, cursor: (dragMode === 'move') ? 'grabbing' : 'grab', zIndex: overlayOverflowIgnoreColor ? 2 : 0 } } onMouseDown={ event => onHandleMouseDown(event, 'move') }>
                    { overlayContent &&
                        <div className="crop-position crop-overlay-content">
                            <div style={ { transform: `scale(${ rect.width / wantedWidth }, ${ rect.height / wantedHeight })` } }>
                                { overlayContent }
                            </div>
                        </div> }
                </div>
                { HANDLE_KEYS.map(key =>
                    <div key={ key } className={ `resize-handle ${ key }` } style={ { left: handlePositions[key].left - 5, top: handlePositions[key].top - 5, cursor: handlePositions[key].cursor } } onMouseDown={ event => onHandleMouseDown(event, key) } />) }
            </div>
        </div>
    );
}
