import { FC, useRef } from 'react';
import { classNames } from './classNames';

interface CustomInputRangeProps
{
    min: number;
    max: number;
    step?: number;
    value: number;
    onChange: (value: number) => void;
    onChangeComplete?: (value: number) => void;
    orientation?: 'horizontal' | 'vertical';
    disabled?: boolean;
    className?: string;
}

// Real reference primitive ("Fr" in the minified bundle): every slider in User Settings (system/
// furni/trax volume, the three Floor anti-lag thresholds) uses this exact same custom drag/click
// track - not a native <input type="range">, confirmed via the live DOM (.custom-input-range >
// .custom-range-track > .custom-range-fill + .custom-range-thumb). CSS for the real classnames was
// already bulk-extracted (_30-forms.scss) but had no component using it.
//
// Rebuilt custom (again), after a `react-slider`-based version (this project's own already-vendored
// slider dependency, reused correctly per this project's "search before creating" rule) turned out
// to be the wrong tool for this specific real requirement: the reference reserves room for the
// thumb's own overhang at 0%/100% via `padding: 0 8px` on `.user-settings-input-range` (confirmed
// live), but `react-slider` positions its thumb from its own root's `clientWidth`, which padding
// never reduces - so the exact CSS mechanism the reference itself relies on had no way to actually
// work through that library, no matter which element the padding/width fixes were juggled onto
// (tried: padding on the slider root directly, then a wrapping element - both still needed
// increasingly fragile workarounds and one produced a real zero-width regression). A plain custom
// implementation that computes drag position from `getBoundingClientRect()` on `.custom-range-track`
// itself sidesteps the whole problem: the browser's own layout already correctly insets that rect
// from `.custom-input-range`'s own padding, with no JS-side padding-awareness needed at all - this
// is the same real mechanism the reference's own structure depends on, not a workaround.
//
// Uses MouseEvent (not PointerEvent) handlers - a `PointerEvent`-based first attempt at this same
// custom approach worked with real mouse hardware but CDP's synthetic `Input.dispatchMouseEvent`
// never triggered it during verification (same gap hit once already this session with the Wealth
// chart's dot hover); MouseEvents are already proven reliable under this project's own CDP-driven
// testing.
export const CustomInputRange: FC<CustomInputRangeProps> = props =>
{
    const { min, max, step = 1, value, onChange, onChangeComplete = null, orientation = 'horizontal', disabled = false, className = '' } = props;
    const trackRef = useRef<HTMLDivElement>(null);

    const percent = (((value - min) / (max - min)) * 100);

    const valueFromPointer = (clientPos: number): number =>
    {
        const rect = trackRef.current.getBoundingClientRect();
        const isHorizontal = (orientation === 'horizontal');
        const size = (isHorizontal ? rect.width : rect.height);
        const offset = (isHorizontal ? (clientPos - rect.left) : (rect.bottom - clientPos));
        const ratio = Math.min(1, Math.max(0, (offset / size)));
        const raw = (min + (ratio * (max - min)));

        return Math.min(max, Math.max(min, (Math.round(raw / step) * step)));
    }

    const onMouseDown = (event: React.MouseEvent) =>
    {
        if(disabled) return;

        const nextValue = valueFromPointer(orientation === 'horizontal' ? event.clientX : event.clientY);

        onChange(nextValue);

        const onMove = (moveEvent: MouseEvent) => onChange(valueFromPointer(orientation === 'horizontal' ? moveEvent.clientX : moveEvent.clientY));

        const onUp = (upEvent: MouseEvent) =>
        {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);

            if(onChangeComplete) onChangeComplete(valueFromPointer(orientation === 'horizontal' ? upEvent.clientX : upEvent.clientY));
        }

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    }

    return (
        // minHeight (not flex-shrink:0) - see _30-forms.scss's own comment: floors only the axis
        // actually at risk of being crushed by sibling text lines in a flex-column context, without
        // blocking the real width-shrink-to-fit behavior needed in the volume row's flex-row context.
        <div className={ classNames('custom-input-range', `custom-input-range--${ orientation }`, disabled && 'disabled', className) } style={ { minHeight: 6 } }>
            <div ref={ trackRef } className="custom-range-track" onMouseDown={ onMouseDown }>
                <div className="custom-range-fill" style={ { [ (orientation === 'horizontal') ? 'width' : 'height' ]: `${ percent }%` } } />
                <div className="custom-range-thumb" style={ { [ (orientation === 'horizontal') ? 'left' : 'bottom' ]: `${ percent }%` } } />
            </div>
        </div>
    );
}
