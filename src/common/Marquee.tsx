import { FC, useEffect, useRef, useState } from 'react';
import { Base, BaseProps } from './Base';

export interface MarqueeProps extends BaseProps<HTMLDivElement>
{
    timeout?: number;
    waitBetween?: number;
    step?: number;
    startImmediately?: boolean;
}

// Scrolls overflowing content back and forth: waits, slides to the far end in `timeout` ms (or `step` px per
// `timeout`), waits again, slides back. Content that fits stays still.
export const Marquee: FC<MarqueeProps> = props =>
{
    const { timeout = 3000, waitBetween = 1000, step, startImmediately = false, children = null, ...rest } = props;
    const [ offset, setOffset ] = useState(0);
    const [ duration, setDuration ] = useState(timeout);
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() =>
    {
        setDuration(0);
        setOffset(0);
    }, [ children ]);

    useEffect(() =>
    {
        let timer: ReturnType<typeof setTimeout>;
        let direction = -1;

        const run = () =>
        {
            if(!containerRef.current || !contentRef.current) return;

            const containerWidth = containerRef.current.offsetWidth;
            const contentWidth = contentRef.current.scrollWidth;

            if(contentWidth <= containerWidth)
            {
                setOffset(0);

                return;
            }

            const overflow = (contentWidth - containerWidth);
            const stepSize = (step ?? overflow);
            const speed = (stepSize / timeout);

            setOffset(prevValue =>
            {
                const distance = Math.abs((direction === -1) ? (-overflow - prevValue) : (0 - prevValue));
                const moved = Math.min(stepSize, distance);
                const time = (moved / speed);

                setDuration(time);

                if(moved === distance)
                {
                    direction *= -1;

                    timer = setTimeout(run, (time + waitBetween));
                }
                else
                {
                    timer = setTimeout(run, time);
                }

                return (prevValue + (direction * moved));
            });
        }

        timer = setTimeout(run, (startImmediately ? 0 : waitBetween));

        return () => clearTimeout(timer);
    }, [ timeout, waitBetween, step, startImmediately, children ]);

    return (
        <Base innerRef={ containerRef } overflow="hidden" { ...rest }>
            <div ref={ contentRef } style={ { transform: `translateX(${ offset }px)`, transition: `transform ${ duration }ms linear`, display: 'inline-block', whiteSpace: 'nowrap' } }>
                { children }
            </div>
        </Base>
    );
}
