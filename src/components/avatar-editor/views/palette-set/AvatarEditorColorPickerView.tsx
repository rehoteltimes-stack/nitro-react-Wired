import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AvatarEditorGridColorItem } from '../../../../api';
import { Flex } from '../../../../common';

export interface AvatarEditorColorPickerViewProps
{
    paletteSet: AvatarEditorGridColorItem[];
    selectedIndex: number;
    onSelect: (index: number) => void;
    disabled?: boolean;
}

interface HSL
{
    h: number;
    s: number;
    l: number;
}

// real habbocity component ("input-color-picker" in their minified source, confirmed live via their own DOM/CSS -
// not guessed): three stacked "canal-a/b/c" gradient bars (hue / saturation / lightness) with a draggable round
// handle each, plus a static rainbow "color-preview" swatch next to them. Their own underlying model has no
// hidden free-form/hex colour slot anywhere in this codebase's own AvatarEditorGridColorItem/model.selectColor API
// (grepped - none exists), which is strictly palette-index based, so this picker is built here as a real, working
// HSL "quick jump" over that same discrete palette rather than guessing at a wire-level custom colour that doesn't
// exist: dragging computes an HSL point and calls the existing model.selectColor with whichever real palette
// index is closest by RGB distance, live, the same one every plain palette swatch already uses.
function hexToRgb(color: string): [number, number, number]
{
    if(!color) return [ 0, 0, 0 ];

    const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);

    if(rgbMatch) return [ parseInt(rgbMatch[1], 10), parseInt(rgbMatch[2], 10), parseInt(rgbMatch[3], 10) ];

    const hex = color.replace('#', '');

    if(hex.length < 6) return [ 0, 0, 0 ];

    return [ parseInt(hex.substring(0, 2), 16), parseInt(hex.substring(2, 4), 16), parseInt(hex.substring(4, 6), 16) ];
}

function rgbToHsl(r: number, g: number, b: number): HSL
{
    r /= 255; g /= 255; b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);

    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if(max !== min)
    {
        const d = (max - min);

        s = (l > 0.5) ? (d / (2 - max - min)) : (d / (max + min));

        switch(max)
        {
            case r:
                h = (g - b) / d + ((g < b) ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }

        h /= 6;
    }

    return { h: (h * 360), s: (s * 100), l: (l * 100) };
}

function hslToRgb(h: number, s: number, l: number): [number, number, number]
{
    h /= 360; s /= 100; l /= 100;

    if(s === 0)
    {
        const v = Math.round(l * 255);

        return [ v, v, v ];
    }

    const hue2rgb = (p: number, q: number, t: number) =>
    {
        if(t < 0) t += 1;
        if(t > 1) t -= 1;
        if(t < (1 / 6)) return (p + ((q - p) * 6 * t));
        if(t < (1 / 2)) return q;
        if(t < (2 / 3)) return (p + ((q - p) * ((2 / 3) - t) * 6));

        return p;
    };

    const q = (l < 0.5) ? (l * (1 + s)) : ((l + s) - (l * s));
    const p = ((2 * l) - q);

    const r = hue2rgb(p, q, (h + (1 / 3)));
    const g = hue2rgb(p, q, h);
    const b = hue2rgb(p, q, (h - (1 / 3)));

    return [ Math.round(r * 255), Math.round(g * 255), Math.round(b * 255) ];
}

function rgbCss(rgb: [number, number, number]): string
{
    return `rgb(${ rgb[0] }, ${ rgb[1] }, ${ rgb[2] })`;
}

function nearestPaletteIndex(paletteSet: AvatarEditorGridColorItem[], rgb: [number, number, number]): number
{
    let bestIndex = -1;
    let bestDistance = Infinity;

    for(let i = 0; i < paletteSet.length; i++)
    {
        const [ r, g, b ] = hexToRgb(paletteSet[i].color);
        const distance = (((r - rgb[0]) ** 2) + ((g - rgb[1]) ** 2) + ((b - rgb[2]) ** 2));

        if(distance < bestDistance)
        {
            bestDistance = distance;
            bestIndex = i;
        }
    }

    return bestIndex;
}

type Channel = 'h' | 's' | 'l';

export const AvatarEditorColorPickerView: FC<AvatarEditorColorPickerViewProps> = props =>
{
    const { paletteSet = [], selectedIndex = -1, onSelect = null, disabled = false } = props;
    const [ hsl, setHsl ] = useState<HSL>({ h: 0, s: 0, l: 50 });
    const draggingChannel = useRef<Channel>(null);
    const barRefs = useRef<Record<Channel, HTMLDivElement>>({ h: null, s: null, l: null });

    useEffect(() =>
    {
        if(disabled) return;

        const item = ((selectedIndex >= 0) && (selectedIndex < paletteSet.length)) ? paletteSet[selectedIndex] : null;

        if(!item) return;

        const [ r, g, b ] = hexToRgb(item.color);

        setHsl(rgbToHsl(r, g, b));
    }, [ selectedIndex, paletteSet, disabled ]);

    const resultRgb = useMemo(() => hslToRgb(hsl.h, hsl.s, hsl.l), [ hsl ]);
    const hueRgb = useMemo(() => hslToRgb(hsl.h, 100, 50), [ hsl.h ]);

    const updateFromPointer = useCallback((channel: Channel, clientX: number) =>
    {
        const bar = barRefs.current[channel];

        if(!bar) return;

        const rect = bar.getBoundingClientRect();
        const fraction = Math.min(1, Math.max(0, ((clientX - rect.left) / rect.width)));

        setHsl(prev =>
        {
            const next = { ...prev };

            if(channel === 'h') next.h = (fraction * 360);
            else if(channel === 's') next.s = (fraction * 100);
            else next.l = (fraction * 100);

            const rgb = hslToRgb(next.h, next.s, next.l);
            const index = nearestPaletteIndex(paletteSet, rgb);

            if((index !== -1) && onSelect) onSelect(index);

            return next;
        });
    }, [ paletteSet, onSelect ]);

    useEffect(() =>
    {
        const onMove = (event: MouseEvent) =>
        {
            if(!draggingChannel.current) return;

            updateFromPointer(draggingChannel.current, event.clientX);
        };

        const onUp = () => draggingChannel.current = null;

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);

        return () =>
        {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };
    }, [ updateFromPointer ]);

    const startDrag = useCallback((channel: Channel, event: React.MouseEvent) =>
    {
        if(disabled) return;

        draggingChannel.current = channel;

        updateFromPointer(channel, event.clientX);
    }, [ disabled, updateFromPointer ]);

    if(!paletteSet || (paletteSet.length === 0)) return null;

    const hueGradient = 'linear-gradient(to right, red, yellow, lime, cyan, blue, magenta, red)';
    const satGradient = `linear-gradient(to right, rgb(191, 191, 191), ${ rgbCss(hueRgb) })`;
    const lightGradient = `linear-gradient(to right, black, ${ rgbCss(hueRgb) }, white)`;

    const handleStyle = (channel: Channel, fraction: number, color: string): React.CSSProperties => (
        {
            left: `${ (fraction * 100) }%`,
            backgroundColor: color
        }
    );

    return (
        <Flex gap={ 2 } alignItems="center">
            <div className={ `d-flex gap-2 align-items-center input-color-picker${ disabled ? ' disabled' : '' }` }>
                <div className="d-flex h-100 flex-shrink-0 flex-column gap-2 flex-fill">
                    <div className="input-color-picker-bar canal-a" ref={ el => barRefs.current.h = el } onMouseDown={ event => startDrag('h', event) } style={ { background: hueGradient } }>
                        <div className="handle" style={ handleStyle('h', (hsl.h / 360), rgbCss(hueRgb)) } />
                    </div>
                    <div className="input-color-picker-bar canal-b" ref={ el => barRefs.current.s = el } onMouseDown={ event => startDrag('s', event) } style={ { background: satGradient } }>
                        <div className="handle" style={ handleStyle('s', (hsl.s / 100), rgbCss(resultRgb)) } />
                    </div>
                    <div className="input-color-picker-bar canal-c" ref={ el => barRefs.current.l = el } onMouseDown={ event => startDrag('l', event) } style={ { background: lightGradient } }>
                        <div className="handle" style={ handleStyle('l', (hsl.l / 100), rgbCss(resultRgb)) } />
                    </div>
                </div>
            </div>
            <div className="avatar-editor-palette-set-item color-preview" style={ { background: 'conic-gradient(from 90deg, rgb(140, 54, 226), rgb(85, 58, 223), rgb(54, 112, 226), rgb(41, 224, 102), rgb(235, 221, 71), rgb(235, 145, 55), rgb(230, 51, 81), rgb(140, 54, 226))' } } />
        </Flex>
    );
}
