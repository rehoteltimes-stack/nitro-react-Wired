import { FC, Fragment, ReactNode, useMemo } from 'react';
import { useNotification } from '../hooks';

// Page text of the reference's "HTMLDSL": only its whitelisted tags are rendered, every other tag is dropped but its
// children are kept, and no raw HTML ever reaches the DOM. Tag output follows the reference build functions
// (b -> span.HTMLDSL-B, i -> em, u -> u.HTMLDSL-U, font/color -> span with inline colour/size, a -> span.HTMLDSL-A).
const CARRIAGE_RETURN = /\r\n|\r|\n/;

const httpsUrl = (value: string): string =>
{
    try
    {
        const url = new URL(value);

        if((url.protocol !== 'https:') || url.username || url.password || (url.port !== '')) return null;

        return url.href;
    }
    catch
    {
        return null;
    }
}

const EFFECT_NAMES = [ 'glow', 'pulse', 'shine', 'flicker', 'shake', 'float', 'fade' ];
const EFFECT_DURATIONS: { [name: string]: number } = { glow: 2.8, pulse: 2, shine: 3.5, flicker: 5.5, shake: 4.5, float: 7, fade: 3 };

const COLOR_VALUE = /^#[0-9a-fA-F]{3,4}$|^#[0-9a-fA-F]{6}$|^#[0-9a-fA-F]{8}$|^[a-zA-Z]+$/;

const parseGradient = (value: string): { angle: number, colors: string[] } =>
{
    if(!value) return { angle: 90, colors: [] };

    const dash = value.indexOf('-');
    const hasAngle = (dash >= 0) && Number.isFinite(Number(value.slice(0, dash)));
    const angle = hasAngle ? (((Number(value.slice(0, dash)) % 360) + 360) % 360) : 90;
    const colors = (hasAngle ? value.slice(dash + 1) : value).split(',').map(color => color.trim()).filter(color => COLOR_VALUE.test(color));

    return { angle, colors };
}

const sizeOf = (value: string): string => ((value && /^\d+(\.\d+)?$/.test(value.trim())) ? `${ value.trim() }px` : null);

export const HtmlDsl: FC<{ text: string }> = ({ text = '' }) =>
{
    const { showConfirm = null } = useNotification();

    const nodes = useMemo(() => new DOMParser().parseFromString(`<body>${ text ?? '' }</body>`, 'text/html').body.childNodes, [ text ]);

    const renderNodes = (list: NodeListOf<ChildNode>, keyPrefix: string): ReactNode[] =>
    {
        const result: ReactNode[] = [];
        let previousWasBreak = false;

        list.forEach((node, index) =>
        {
            const key = `${ keyPrefix }.${ index }`;

            if(node.nodeType === Node.TEXT_NODE)
            {
                const parts = node.textContent.split(CARRIAGE_RETURN);

                parts.forEach((part, partIndex) =>
                {
                    if(partIndex > 0)
                    {
                        if(!previousWasBreak) result.push(<br key={ `${ key }.br${ partIndex }` } />);

                        previousWasBreak = true;
                    }

                    if(part.length)
                    {
                        result.push(<Fragment key={ `${ key }.t${ partIndex }` }>{ part }</Fragment>);

                        previousWasBreak = false;
                    }
                });

                return;
            }

            if(node.nodeType !== Node.ELEMENT_NODE) return;

            const element = node as HTMLElement;
            const children = () => renderNodes(element.childNodes, key);

            previousWasBreak = false;

            switch(element.tagName.toLowerCase())
            {
                case 'br':
                    result.push(<br key={ key } />);
                    previousWasBreak = true;
                    return;
                case 'b':
                    result.push(<span key={ key } className="HTMLDSL-B">{ children() }</span>);
                    return;
                case 'i':
                    result.push(<em key={ key }>{ children() }</em>);
                    return;
                case 'u':
                    result.push(<u key={ key } className="HTMLDSL-U">{ children() }</u>);
                    return;
                case 'font':
                {
                    const style: { [key: string]: string } = {};
                    const color = element.getAttribute('color');
                    const size = sizeOf(element.getAttribute('size'));

                    if(color) style.color = color;
                    if(size) style.fontSize = size;
                    if(element.hasAttribute('bold')) style.fontWeight = 'bold';
                    if(element.hasAttribute('underline')) style.textDecoration = 'underline';
                    if(element.hasAttribute('italic')) style.fontStyle = 'italic';

                    result.push(<span key={ key } className="HTMLDSL-Font" style={ style }>{ children() }</span>);
                    return;
                }
                case 'color':
                {
                    // The reference's "color" tag: value is "<angle>-<color>,<color>,..." (angle optional, default 90). One colour is a plain
                    // text colour, two or more make a gradient painted through the text (its "na" parser and "ec" build function).
                    const { angle, colors } = parseGradient(element.getAttribute('value'));

                    if(colors.length === 0) result.push(<span key={ key } className="HTMLDSL-Color">{ children() }</span>);
                    else if(colors.length === 1) result.push(<span key={ key } className="HTMLDSL-Color" style={ { color: colors[0] } }>{ children() }</span>);
                    else result.push(<span key={ key } className="HTMLDSL-Color HTMLDSL-Color--gradient" style={ { backgroundImage: `linear-gradient(${ angle }deg, ${ colors.join(', ') })` } }>{ children() }</span>);
                    return;
                }
                case 'effect':
                {
                    // The reference's "effect" tag (its "jA" build function): a looping CSS animation on the text - glow, pulse, shine,
                    // flicker, shake, float or fade. The keyframes are already in the reference stylesheet; only the variables are set here.
                    const requested = element.getAttribute('name');
                    const name = EFFECT_NAMES.includes(requested) ? requested : EFFECT_NAMES[0];
                    const number = (attribute: string): number => { const raw = element.getAttribute(attribute); const value = (raw === null) ? NaN : Number(raw); return Number.isFinite(value) ? value : null; };
                    const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
                    const duration = clamp(number('duration') ?? EFFECT_DURATIONS[name], 0.2, 60);
                    const delay = clamp(number('delay') ?? 0, 0, 60);
                    const intensity = Math.round(clamp(number('intensity') ?? 2, 1, 5));
                    const repeat = number('repeat');
                    const { angle, colors } = parseGradient(element.getAttribute('color'));
                    const style: { [key: string]: string | number } = {
                        '--HTMLDSL-effect-duration': `${ duration }s`,
                        '--HTMLDSL-effect-delay': `${ delay }s`,
                        '--HTMLDSL-effect-intensity': intensity,
                        '--HTMLDSL-effect-repeat': (repeat === null) ? 'infinite' : Math.round(clamp(repeat, 1, 100))
                    };

                    if(colors.length)
                    {
                        style['--HTMLDSL-effect-colors'] = `linear-gradient(${ angle }deg,${ colors.join(',') })`;
                        style['--HTMLDSL-effect-colors-raw'] = colors.join(',');
                    }

                    const box = element.hasAttribute('box') && [ 'true', '1', 'yes', 'on' ].includes((element.getAttribute('box') ?? '').trim().toLowerCase());

                    result.push(<span key={ key } className={ `HTMLDSL-Effect HTMLDSL-Effect--${ name }${ box ? ' HTMLDSL-Effect--box' : '' }` } style={ style as any }>{ children() }</span>);
                    return;
                }
                case 'span':
                    result.push(<span key={ key }>{ children() }</span>);
                    return;
                case 'align':
                    result.push(<span key={ key } className={ `HTMLDSL-Align ${ element.getAttribute('direction') ?? 'left' }` }>{ children() }</span>);
                    return;
                case 'list':
                {
                    const ListTag = element.hasAttribute('ordered') ? 'ol' : 'ul';
                    const items: ReactNode[][] = [ [] ];

                    renderNodes(element.childNodes, key).forEach(child =>
                    {
                        if((child as any)?.type === 'br') items.push([]);
                        else items[items.length - 1].push(child);
                    });

                    result.push(<ListTag key={ key }>{ items.filter(item => item.length).map((item, itemIndex) => <li key={ itemIndex }>{ item }</li>) }</ListTag>);
                    return;
                }
                case 'a':
                {
                    const url = httpsUrl(element.getAttribute('href'));

                    if(!url)
                    {
                        result.push(<span key={ key }><span className="HTMLDSL-A invalid">{ children() }</span></span>);
                        return;
                    }

                    result.push(
                        <span key={ key }>
                            <span className="HTMLDSL-A" onClick={ () => showConfirm(`You are about to leave for an external page.\n${ url }`, () => window.open(url, '_blank', 'noopener,noreferrer'), null, 'Open', 'Cancel', 'Attention!') }>{ children() }</span>
                        </span>
                    );
                    return;
                }
                default:
                    result.push(<Fragment key={ key }>{ children() }</Fragment>);
            }
        });

        return result;
    };

    return <div style={ { wordBreak: 'break-word', position: 'relative' } }>{ renderNodes(nodes, 'dsl') }</div>;
}
