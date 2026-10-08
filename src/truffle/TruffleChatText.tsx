import type { TruffleBuffer } from 'truffle-text';
import type { PackedTruffleText } from 'truffle-text/packed';
import { getTruffle } from 'truffle-text/react';
import { FC, useLayoutEffect, useMemo, useRef } from 'react';
import type { TruffleTextFormat } from './TruffleTextView';

interface TruffleChatTextProps
{
    username?: string;
    text?: string;
    nameStyle: TruffleTextFormat;
    messageStyle: TruffleTextFormat;
    maxWidth: number;
    nameColor?: number;
    messageColor?: number;
    showCaret?: boolean;
    caretColor?: number;
    underlineUsername?: boolean;
    onUsernameClick?: () => void;
}

interface RenderedSegment
{
    buffer: TruffleBuffer;
    x: number;
}

interface RenderedLine
{
    segments: RenderedSegment[];
    height: number;
    y: number;
}

const measureWidth = (truffle: PackedTruffleText, text: string, style: TruffleTextFormat) =>
    truffle.measure(text, style).textWidth;

const splitLongToken = (truffle: PackedTruffleText, token: string, style: TruffleTextFormat, width: number) =>
{
    const characters = Array.from(token);
    let splitAt = 1;

    for(let i = 1; i <= characters.length; i++)
    {
        if(measureWidth(truffle, characters.slice(0, i).join(''), style) > width) break;

        splitAt = i;
    }

    return [ characters.slice(0, splitAt).join(''), characters.slice(splitAt).join('') ];
}

const wrapMessage = (truffle: PackedTruffleText, text: string, style: TruffleTextFormat, maxWidth: number, firstLineOffset: number) =>
{
    const lines: string[] = [];
    const tokens = text.replace(/\r\n?/g, '\n').match(/\n|[^\S\n]+|[^\s]+/g) ?? [ '' ];
    let current = '';
    let isFirstLine = true;

    const availableWidth = () => Math.max(1, maxWidth - (isFirstLine ? firstLineOffset : 0));
    const pushLine = () =>
    {
        lines.push(current.replace(/[^\S\n]+$/g, ''));
        current = '';
        isFirstLine = false;
    };

    for(const originalToken of tokens)
    {
        if(originalToken === '\n')
        {
            pushLine();
            continue;
        }

        if(/^\s+$/.test(originalToken))
        {
            if(current) current += originalToken;
            continue;
        }

        let token = originalToken;
        const candidate = current + token;

        if(isFirstLine && !current && firstLineOffset && (measureWidth(truffle, candidate, style) > availableWidth()))
        {
            pushLine();
        }
        else if(current && (measureWidth(truffle, candidate, style) > availableWidth()))
        {
            pushLine();
            token = token.replace(/^\s+/, '');
        }

        while(token && (measureWidth(truffle, token, style) > availableWidth()))
        {
            const [ fitting, remainder ] = splitLongToken(truffle, token, style, availableWidth());

            current = fitting;
            pushLine();
            token = remainder;
        }

        current += token;
    }

    if(current || !lines.length) pushLine();

    return lines;
}

const drawBuffer = (context: CanvasRenderingContext2D, buffer: TruffleBuffer, x: number, y: number) =>
{
    const source = document.createElement('canvas');
    source.width = buffer.width;
    source.height = buffer.height;
    source.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(buffer.data), buffer.width, buffer.height), 0, 0);
    context.drawImage(source, x, y);
}

const getVisibleVerticalBounds = (buffer: TruffleBuffer) =>
{
    let top = buffer.height;
    let bottom = -1;

    for(let y = 0; y < buffer.height; y++)
    {
        for(let x = 0; x < buffer.width; x++)
        {
            if(!buffer.data[((y * buffer.width) + x) * 4 + 3]) continue;

            top = Math.min(top, y);
            bottom = Math.max(bottom, y);
        }
    }

    return (bottom >= top) ? { top, bottom } : { top: 0, bottom: Math.max(0, buffer.height - 1) };
}

export const TruffleChatText: FC<TruffleChatTextProps> = props =>
{
    const { username = '', text = '', nameStyle, messageStyle, maxWidth, nameColor, messageColor, showCaret = false, caretColor = 0xAAAAAA, underlineUsername = false, onUsernameClick = null } = props;
    const canvasRef = useRef<HTMLCanvasElement>();
    const rendered = useMemo(() =>
    {
        const truffle = getTruffle();

        if(!truffle) return null;

        const resolvedNameStyle = nameStyle;
        const resolvedMessageStyle = messageStyle;

        const nameText = username ? `${ username }: ` : '';
        const nameWidth = nameText ? measureWidth(truffle, nameText, resolvedNameStyle) : 0;
        const messageLines = wrapMessage(truffle, text, resolvedMessageStyle, maxWidth, nameWidth);
        const lines: RenderedLine[] = [];
        let canvasWidth = 1;
        let canvasHeight = 1;
        let lineY = 0;

        messageLines.forEach((messageLine, index) =>
        {
            const segments: RenderedSegment[] = [];
            let lineHeight = Math.max(1, truffle.measure(messageLine || ' ', resolvedMessageStyle).textHeight);
            let bufferHeight = 1;

            if((index === 0) && nameText)
            {
                const buffer = truffle.renderToBuffer(nameText, resolvedNameStyle, nameColor === undefined ? {} : { color: nameColor });
                segments.push({ buffer, x: 0 });
                lineHeight = Math.max(lineHeight, truffle.measure(nameText, resolvedNameStyle).textHeight);
                bufferHeight = Math.max(bufferHeight, buffer.height);
                canvasWidth = Math.max(canvasWidth, buffer.width);
            }

            if(messageLine)
            {
                const x = ((index === 0) && nameText) ? Math.round(nameWidth) : 0;
                const buffer = truffle.renderToBuffer(messageLine, resolvedMessageStyle, messageColor === undefined ? {} : { color: messageColor });
                segments.push({ buffer, x });
                bufferHeight = Math.max(bufferHeight, buffer.height);
                canvasWidth = Math.max(canvasWidth, x + buffer.width);
            }

            lines.push({ segments, height: lineHeight, y: lineY });
            canvasHeight = Math.max(canvasHeight, lineY + bufferHeight);
            lineY += lineHeight;
        });

        const lastLine = lines[lines.length - 1];
        const lastLineWidth = lastLine.segments.reduce((width, segment) => Math.max(width, segment.x + segment.buffer.width), 0);
        const caretProbe = truffle.renderToBuffer('|', resolvedMessageStyle, messageColor === undefined ? {} : { color: messageColor });
        const caretBounds = getVisibleVerticalBounds(caretProbe);
        const caretX = Math.max(0, lastLineWidth - (lastLineWidth ? 4 : 0));
        const caretY = lastLine.y + caretBounds.top + 1;
        const caretHeight = Math.max(1, caretBounds.bottom - caretBounds.top + 1);

        return {
            lines,
            width: Math.max(1, Math.ceil(canvasWidth), showCaret ? (caretX + 1) : 1),
            height: Math.max(1, Math.ceil(canvasHeight), showCaret ? (caretY + caretHeight) : 1),
            caretX,
            caretY,
            caretHeight,
            nameWidth,
            nameHeight: nameText ? lines[0].height : 0
        };
    }, [ maxWidth, messageColor, messageStyle, nameColor, nameStyle, showCaret, text, username ]);

    useLayoutEffect(() =>
    {
        if(!rendered || !canvasRef.current) return;

        const context = canvasRef.current.getContext('2d');
        let caretVisible = true;

        const draw = () =>
        {
            context.clearRect(0, 0, rendered.width, rendered.height);
            rendered.lines.forEach(line => line.segments.forEach(segment => drawBuffer(context, segment.buffer, segment.x, line.y)));

            if(underlineUsername && rendered.nameWidth)
            {
                context.fillStyle = `#${ (nameColor ?? 0x000000).toString(16).padStart(6, '0') }`;
                context.fillRect(0, rendered.nameHeight - 1, rendered.nameWidth, 1);
            }

            if(showCaret && caretVisible)
            {
                context.fillStyle = `#${ caretColor.toString(16).padStart(6, '0') }`;
                context.fillRect(rendered.caretX, rendered.caretY, 1, rendered.caretHeight);
            }
        }

        draw();

        if(!showCaret) return;

        const interval = window.setInterval(() =>
        {
            caretVisible = !caretVisible;
            draw();
        }, 500);

        return () => window.clearInterval(interval);
    }, [ caretColor, rendered, showCaret, underlineUsername, nameColor ]);

    if(!rendered) return null;

    return (
        <div className="truffle-chat-text-container" style={ { position: 'relative', width: rendered.width, height: rendered.height } }>
            <canvas ref={ canvasRef } width={ rendered.width } height={ rendered.height } className="truffle-chat-text" role="img" aria-label={ `${ username ? `${ username }: ` : '' }${ text }` } />
            { onUsernameClick && !!rendered.nameWidth &&
                <div
                    onClick={ event => { event.stopPropagation(); onUsernameClick(); } }
                    style={ { position: 'absolute', left: 0, top: 0, width: rendered.nameWidth, height: rendered.nameHeight, cursor: 'pointer' } } /> }
        </div>
    );
}
