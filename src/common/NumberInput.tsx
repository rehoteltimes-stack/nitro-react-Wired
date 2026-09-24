import { FC, HTMLAttributes, useEffect, useRef, useState } from 'react';
import { FaMinus, FaPlus } from 'react-icons/fa';
import { Button } from './Button';
import { classNames as cn } from './classNames';

export interface NumberInputProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'>
{
    min?: number;
    max?: number;
    step?: number;
    value?: number;
    loop?: boolean;
    ignorePrecision?: boolean;
    defaultValueIfNull?: number;
    allowNull?: boolean;
    placeholder?: string;
    disabled?: boolean;
    customColor?: boolean;
    maxSize?: number;
    onEvent?: (value: number) => void;
}

// Port of the reference's shared number input (`sn` + its `AE` hook in the minified bundle): a
// .controls-input-number box with a minus button, a text input and a plus button, min/max clamped, step
// precision derived from the step's decimals, optional wrap-around (loop), and hold-to-repeat that
// accelerates the longer a button is held (same 50 ms tick and 10^(n/20 - 1) ramp as the reference).
// The markup is the one already verified against the live reference in the catalog spinner.
export const NumberInput: FC<NumberInputProps> = props =>
{
    const { min = 0, max = 99, value = null, step = 1, loop = false, ignorePrecision = false, defaultValueIfNull = null, allowNull = false, placeholder = '...', disabled = false, customColor = false, maxSize = 100, onEvent = null, className = '', ...rest } = props;
    const [ text, setText ] = useState<string>((value === null) ? '' : value.toString());
    const intervalRef = useRef<ReturnType<typeof setInterval>>(null);
    const latest = useRef({ value, onEvent });

    latest.current = { value, onEvent };

    useEffect(() => setText((value === null) ? '' : value.toString()), [ value ]);

    const precision = (() =>
    {
        if(Number.isInteger(step)) return 0;

        const asText = step.toString();
        const dot = asText.indexOf('.');

        return ((dot === -1) ? 0 : (asText.length - dot - 1));
    })();

    // Reads the latest value/callback so an interval started on mouse down keeps stepping from the real current value.
    const increment = (multiplier = 1) =>
    {
        const { value: current, onEvent: emit } = latest.current;
        const next = ((current === null) ? (((defaultValueIfNull === null) ? min : defaultValueIfNull) - (step * multiplier)) : current) + (step * multiplier);
        const clamped = Number(Math.min(next, max).toFixed(precision));

        if(loop) emit?.((next <= max) ? clamped : min);
        else emit?.(clamped);
    }

    const decrement = (multiplier = 1) =>
    {
        const { value: current, onEvent: emit } = latest.current;
        const next = ((current === null) ? (((defaultValueIfNull === null) ? max : defaultValueIfNull) + (step * multiplier)) : current) - (step * multiplier);
        const clamped = Number(Math.max(next, min).toFixed(precision));

        if(loop) emit?.((next >= min) ? clamped : max);
        else emit?.(clamped);
    }

    const handleChange = (raw: number | null) =>
    {
        if((raw === null) && allowNull)
        {
            onEvent?.(null);

            return;
        }

        const parsed = isNaN(Number(raw)) ? ((defaultValueIfNull !== null) ? defaultValueIfNull : min) : Number(raw);
        const clamped = Math.min(Math.max(parsed, min), max);

        onEvent?.(ignorePrecision ? clamped : Number(clamped.toFixed(precision)));
    }

    const stopRepeat = () =>
    {
        if(intervalRef.current === null) return;

        clearInterval(intervalRef.current);

        intervalRef.current = null;
    }

    const startRepeat = (action: (multiplier?: number) => void) =>
    {
        stopRepeat();

        action(1);

        let ticks = 0;

        intervalRef.current = setInterval(() =>
        {
            ticks++;

            const multiplier = Math.floor(Math.pow(10, ((ticks / 20) - 1)));

            if(multiplier !== 0) action(multiplier);
        }, 50);
    }

    useEffect(() =>
    {
        window.addEventListener('mouseup', stopRepeat);

        return () =>
        {
            window.removeEventListener('mouseup', stopRepeat);

            stopRepeat();
        }
    }, []);

    const current = (value === null) ? min : value;
    const canDecrement = (loop || !(current <= min));
    const canIncrement = (loop || !(current >= max));

    const onTextChange = (nextText: string) =>
    {
        setText(nextText);

        if(nextText === '') return handleChange(null);

        const parsed = Number(nextText);

        if(!isNaN(parsed) && /^-?\d*\.?\d+$/.test(nextText)) handleChange(parsed);
    }

    return (
        <div { ...rest } className={ cn('d-flex', 'align-items-center', 'justify-content-between', 'controls-input-number', 'form-control', className) }>
            <Button variant={ customColor ? null : 'danger' } size="xsm" customColor={ customColor } classNames={ [ 'button-right', (canDecrement ? 'enabled' : 'disabled') ] } disabled={ disabled } onMouseDown={ () => startRepeat(decrement) }>
                <FaMinus className="fa-icon" />
            </Button>
            <input type="text" className="custom-input-number custom-color" maxLength={ maxSize } placeholder={ placeholder } value={ text } disabled={ disabled } onChange={ event => onTextChange(event.target.value) } />
            <Button variant={ customColor ? null : 'success' } size="xsm" customColor={ customColor } classNames={ [ 'button-left', (canIncrement ? 'enabled' : 'disabled') ] } disabled={ disabled } onMouseDown={ () => startRepeat(increment) }>
                <FaPlus className="fa-icon" />
            </Button>
        </div>
    );
}
