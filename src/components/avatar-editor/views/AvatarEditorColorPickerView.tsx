import { ColorConverter } from '@nitrots/nitro-renderer';
import { FC, MouseEvent as ReactMouseEvent, useMemo, useRef } from 'react';
import { Base, Flex } from '../../../common';

export interface AvatarEditorColorPickerViewProps
{
    value: number;
    onChange: (value: number) => void;
    disabled?: boolean;
}

// Real reference mechanism (traced through the live minified source, not guessed): this is a plain, generic
// HSL colour picker (three sliders - hue/saturation/lightness, each an .input-color-picker-bar.canal-a/b/c
// with a .gradient track and a draggable .handle) with a controlled numeric RGB `value`/`onChange`. It does
// NOT apply the colour to the avatar directly - its output feeds into AvatarEditorPaletteSetView as a
// `targetColor` that FILTERS the real, existing palette swatches down to whichever ones are close to the
// picked colour (CIE-Lab colour-distance, see that file). This project's own vendored
// @nitrots/nitro-renderer already ships the exact HSL<->RGB<->Lab math the reference uses
// (ColorConverter.hslToRGB/rgbToHSL/rgb2CieLab) - reused here rather than reimplemented, per this project's own
// "our own existing code is the logic reference" rule.
export const AvatarEditorColorPickerView: FC<AvatarEditorColorPickerViewProps> = props =>
{
    const { value = 0xFFFFFF, onChange = null, disabled = false } = props;
    const hueTrackRef = useRef<HTMLDivElement>(null);
    const saturationTrackRef = useRef<HTMLDivElement>(null);
    const lightnessTrackRef = useRef<HTMLDivElement>(null);
    const trackRefs = { h: hueTrackRef, s: saturationTrackRef, l: lightnessTrackRef };

    // ColorConverter's HSL packing is 3 bytes (0-255 each) for hue/saturation/lightness fractions - not the
    // conventional 0-360/0-100/0-100 ranges - matching its own rgbToHSL/hslToRGB pair exactly.
    const hsl = useMemo(() =>
    {
        const packed = ColorConverter.rgbToHSL(value);

        return {
            h: ((packed >> 16) & 0xFF),
            s: ((packed >> 8) & 0xFF),
            l: (packed & 0xFF)
        };
    }, [ value ]);

    const setChannel = (channel: 'h' | 's' | 'l', byteValue: number) =>
    {
        if(!onChange) return;

        const next = { ...hsl, [channel]: Math.max(0, Math.min(255, Math.round(byteValue))) };
        const packedHsl = ((next.h << 16) + (next.s << 8) + next.l);

        onChange(ColorConverter.hslToRGB(packedHsl));
    }

    const beginDrag = (channel: 'h' | 's' | 'l') => (event: ReactMouseEvent) =>
    {
        if(disabled) return;

        event.preventDefault();

        const track = trackRefs[channel].current;

        if(!track) return;

        const updateFromClientX = (clientX: number) =>
        {
            const bounds = track.getBoundingClientRect();
            const ratio = ((clientX - bounds.left) / bounds.width);

            setChannel(channel, (ratio * 255));
        }

        updateFromClientX(event.clientX);

        const onMove = (moveEvent: MouseEvent) => updateFromClientX(moveEvent.clientX);
        const onUp = () =>
        {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        }

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    }

    const hueDegrees = Math.round((hsl.h / 255) * 360);
    const currentColor = `#${ value.toString(16).padStart(6, '0') }`;
    const fullSaturationAtHue = `hsl(${ hueDegrees }, 100%, 50%)`;

    return (
        <Flex gap={ 2 } alignItems="center" classNames={ [ 'input-color-picker', ...(disabled ? [ 'disabled' ] : []) ] }>
            { /* .input-color-picker-bar's own real CSS (_30-forms.scss) sets no height at all - both its
                 .gradient and .handle children are position:absolute, so (like .figure-preview-section
                 elsewhere in this file) each bar needs an explicit flex-grow share of the picker's fixed 30px
                 height to be visible at all; without it every bar collapsed to 0px height. */ }
            <Flex fullHeight shrink column gap={ 2 } grow>
                <Base innerRef={ hueTrackRef } grow style={ { flexBasis: 0 } } pointer classNames={ [ 'input-color-picker-bar', 'canal-a' ] } onMouseDown={ beginDrag('h') }>
                    <Base classNames={ [ 'gradient' ] } style={ { background: 'linear-gradient(to right, red, yellow, lime, cyan, blue, magenta, red)' } } />
                    <Base classNames={ [ 'handle' ] } style={ { left: `${ (hsl.h / 255) * 100 }%`, backgroundColor: fullSaturationAtHue } } />
                </Base>
                <Base innerRef={ saturationTrackRef } grow style={ { flexBasis: 0 } } pointer classNames={ [ 'input-color-picker-bar', 'canal-b' ] } onMouseDown={ beginDrag('s') }>
                    <Base classNames={ [ 'gradient' ] } style={ { background: `linear-gradient(to right, hsl(${ hueDegrees }, 0%, 50%), ${ fullSaturationAtHue })` } } />
                    <Base classNames={ [ 'handle' ] } style={ { left: `${ (hsl.s / 255) * 100 }%`, backgroundColor: currentColor } } />
                </Base>
                <Base innerRef={ lightnessTrackRef } grow style={ { flexBasis: 0 } } pointer classNames={ [ 'input-color-picker-bar', 'canal-c' ] } onMouseDown={ beginDrag('l') }>
                    <Base classNames={ [ 'gradient' ] } style={ { background: `linear-gradient(to right, black, ${ fullSaturationAtHue }, white)` } } />
                    <Base classNames={ [ 'handle' ] } style={ { left: `${ (hsl.l / 255) * 100 }%`, backgroundColor: currentColor } } />
                </Base>
            </Flex>
        </Flex>
    );
}
