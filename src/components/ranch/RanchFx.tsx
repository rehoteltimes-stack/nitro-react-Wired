import { FC, useEffect, useRef, useState } from 'react';
import arrowBackground from '../../assets/images/ranch/arrow_bar_background.png';
import arrowChunk from '../../assets/images/ranch/arrow_bar_chunk.png';
import arrowDarkening from '../../assets/images/ranch/arrow_bar_darkening.png';
import arrowLighting from '../../assets/images/ranch/arrow_bar_lighting.png';
import arrowSplitter from '../../assets/images/ranch/arrow_bar_splitter.png';
import arrowSplitterLeft from '../../assets/images/ranch/arrow_bar_splitter_left.png';
import blockBackground from '../../assets/images/ranch/block_bar_background.png';
import blockDarkening from '../../assets/images/ranch/block_bar_darkening.png';
import blockFill from '../../assets/images/ranch/block_bar_fill.png';
import blockLighting from '../../assets/images/ranch/block_bar_lighting.png';
import blockSplitters from '../../assets/images/ranch/block_bar_splitters.png';
import iconUpgrading from '../../assets/images/ranch/icon_upgrading.png';
import blockyDarkening from '../../assets/images/ranch/number_blocky_darkening.png';
import blockyLighting from '../../assets/images/ranch/number_blocky_lighting.png';
import blockyNumbers from '../../assets/images/ranch/number_blocky_numbers.png';
import iconAubergine from '../../assets/images/ranch/icon_ranch_aubergine.png';
import iconCorn from '../../assets/images/ranch/icon_ranch_corn.png';
import iconGold from '../../assets/images/ranch/icon_gold.png';
import iconGrape from '../../assets/images/ranch/icon_ranch_grape.png';
import iconHonor from '../../assets/images/ranch/icon_honor.png';
import iconPumpkin from '../../assets/images/ranch/icon_ranch_pumpkin.png';
import iconTomato from '../../assets/images/ranch/icon_ranch_tomato.png';
import levelBackground from '../../assets/images/ranch/level_with_progress_background.png';
import levelDarkening from '../../assets/images/ranch/level_with_progress_darkening.png';
import levelFrame from '../../assets/images/ranch/level_with_progress_frame.png';
import levelLighting from '../../assets/images/ranch/level_with_progress_lighting.png';
import numbersLarge from '../../assets/images/ranch/numbers_large.png';
import iconDroplet from '../../assets/images/ranch/icon_droplet.png';
import iconFood from '../../assets/images/ranch/icon_food.png';
import iconSapling from '../../assets/images/ranch/icon_ranch_sapling.png';
import iconTimeleft from '../../assets/images/ranch/icon_timeleft.png';
import stripedBackground from '../../assets/images/ranch/striped_bar_background.png';
import stripedDarkening from '../../assets/images/ranch/striped_bar_darkening.png';
import stripedDarkeningMetallic from '../../assets/images/ranch/striped_bar_darkening_metallic.png';
import stripedFill from '../../assets/images/ranch/striped_bar_fill.png';
import stripedLighting from '../../assets/images/ranch/striped_bar_lighting.png';
import stripedLightingMetallic from '../../assets/images/ranch/striped_bar_lighting_metallic.png';
import stripedMetallic from '../../assets/images/ranch/striped_bar_metallic.png';
import stripedStripe from '../../assets/images/ranch/striped_bar_stripe.png';

export const RANCH_ICONS: Record<string, string> = {
    tomato: iconTomato,
    corn: iconCorn,
    grapes: iconGrape,
    pumpkin: iconPumpkin,
    duckbergine: iconAubergine,
    gold: iconGold,
    honor: iconHonor
};

export const RANCH_COLORS = {
    white: 0xD8D8D8,
    gold: 0xFFC63D,
    limeGreen: 0x8DDD35,
    yellow: 0xFFD83D,
    purple: 0x8752D1,
    darkGreen: 0x1F6F3A,
    fireOrange: 0xFF5A1F,
    emerald: 0x27C46B,
    timeleft: 0x74B9E8,
    food: 0xFF9F24,
    green: 0x36B24A,
    orange: 0xFFA024,
    cyan: 0x42D4E8,
    growth: 0x6BDC34
};

export const RANCH_ICON_FOOD = iconFood;

export const RANCH_CHALLENGE_ICONS: Record<string, [ string, number ]> = {
    plant: [ iconSapling, 0x8DDD35 ],
    feed: [ iconFood, 0xFFA024 ],
    water: [ iconDroplet, 0x42D4E8 ]
};

export const RANCH_ORDER_COLORS: Record<string, number> = {
    tomato: RANCH_COLORS.darkGreen,
    grapes: RANCH_COLORS.purple,
    pumpkin: RANCH_COLORS.fireOrange,
    duckbergine: RANCH_COLORS.emerald,
    corn: RANCH_COLORS.yellow
};

type Drawable = HTMLImageElement | HTMLCanvasElement;
type IconAlignment = 'left' | 'right' | 'double';

const IMAGES = new Map<string, Promise<HTMLImageElement>>();

const load = (url: string) =>
{
    if(!IMAGES.has(url)) IMAGES.set(url, new Promise(resolve =>
    {
        const image = new Image();

        image.onload = () => resolve(image);
        image.onerror = () => resolve(null);
        image.src = url;
    }));

    return IMAGES.get(url);
}

const createCanvas = (width: number, height: number) =>
{
    const canvas = document.createElement('canvas');

    canvas.width = Math.max(1, width);
    canvas.height = Math.max(1, height);

    const context = canvas.getContext('2d');

    context.imageSmoothingEnabled = false;

    return { canvas, context };
}

const cssColor = (rgb: number) => `#${ (rgb & 0xFFFFFF).toString(16).padStart(6, '0') }`;

const tinted = (source: Drawable, rgb: number) =>
{
    const { canvas, context } = createCanvas(source.width, source.height);

    context.drawImage(source, 0, 0);
    context.globalCompositeOperation = 'multiply';
    context.fillStyle = cssColor(rgb);
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.globalCompositeOperation = 'destination-in';
    context.drawImage(source, 0, 0);

    return canvas;
}

const blended = (base: Drawable, overlays: [ Drawable, GlobalCompositeOperation ][]) =>
{
    const { canvas, context } = createCanvas(base.width, base.height);

    context.drawImage(base, 0, 0);

    for(const [ layer, mode ] of overlays)
    {
        context.globalCompositeOperation = mode;
        context.drawImage(layer, 0, 0);
    }

    context.globalCompositeOperation = 'destination-in';
    context.drawImage(base, 0, 0);

    return canvas;
}

const threeSlice = (context: CanvasRenderingContext2D, source: Drawable, left: number, right: number, width: number, x: number, y: number) =>
{
    const middle = Math.max(0, width - left - right);
    const sourceMiddle = Math.max(1, source.width - left - right);

    context.drawImage(source, 0, 0, left, source.height, x, y, left, source.height);
    if(middle > 0) context.drawImage(source, left, 0, sourceMiddle, source.height, x + left, y, middle, source.height);
    context.drawImage(source, source.width - right, 0, right, source.height, x + left + middle, y, right, source.height);
}

const hsvToRgb = (hue: number, saturation: number, value: number) =>
{
    const h = ((hue % 360) + 360) % 360;
    const chroma = value * saturation;
    const sector = h / 60;
    const second = chroma * (1 - Math.abs((sector % 2) - 1));
    const base = value - chroma;
    const [ r, g, b ] = (sector < 1) ? [ chroma, second, 0 ] : (sector < 2) ? [ second, chroma, 0 ] : (sector < 3) ? [ 0, chroma, second ] : (sector < 4) ? [ 0, second, chroma ] : (sector < 5) ? [ second, 0, chroma ] : [ chroma, 0, second ];

    return (Math.floor((r + base) * 255) << 16) | (Math.floor((g + base) * 255) << 8) | Math.floor((b + base) * 255);
}

export const RanchLevelColor = (level: number, maxLevel: number) =>
{
    const progress = (maxLevel <= 1) ? 0 : Math.max(0, Math.min(1, (level - 1) / (maxLevel - 1)));

    return hsvToRgb(115 + ((360 - 115) * progress), 0.85, 0.8);
}

const useCanvas = (urls: string[], paint: (images: HTMLImageElement[]) => HTMLCanvasElement, key: string) =>
{
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [ images, setImages ] = useState<HTMLImageElement[]>(null);

    useEffect(() =>
    {
        let alive = true;

        Promise.all(urls.map(load)).then(result => alive && setImages(result));

        return () => { alive = false; };
    }, [ urls.join('|') ]);

    useEffect(() =>
    {
        const canvas = canvasRef.current;

        if(!canvas || !images || images.some(image => !image)) return;

        const frame = paint(images);
        const context = canvas.getContext('2d');

        canvas.width = frame.width;
        canvas.height = frame.height;
        context.imageSmoothingEnabled = false;
        context.drawImage(frame, 0, 0);
    }, [ images, key ]);

    return canvasRef;
}

const BADGE_SIZE = 21;
const BADGE_SLICE = 10;
const BADGE_DIGIT = 8;
const BADGE_DIGIT_Y = 5;
const BAR_OVERLAP = 3;
const ARROW_PADDING = 3;
const ARROW_STEP = 9;
const ARROW_HEIGHT = 13;
const ARROW_FILL_Y = 3;
const ARROW_FILL_HEIGHT = 7;
const ARROW_FIRST_SPLITTER = 7;

const badgeWidth = (digits: number) => (digits <= 1) ? BADGE_SIZE : 6 + (digits * BADGE_DIGIT) + 5;

export const RanchLevelFx: FC<{ level: number, maxLevel: number, progress: number, segments?: number }> = props =>
{
    const { level, maxLevel, progress, segments = 3 } = props;
    const color = RanchLevelColor(level, maxLevel);

    const ref = useCanvas([ levelBackground, levelFrame, levelDarkening, levelLighting, numbersLarge, arrowBackground, arrowChunk, arrowDarkening, arrowLighting, arrowSplitter, arrowSplitterLeft ],
        ([ background, frame, darkening, lighting, numbers, barBackground, chunk, barDarkening, barLighting, splitter, splitterLeft ]) =>
        {
            const text = String(Math.max(0, level));
            const width = badgeWidth(text.length);
            const fillWidth = segments * ARROW_STEP;
            const barWidth = fillWidth + (ARROW_PADDING * 2);
            const barX = Math.max(0, width - BAR_OVERLAP);
            const barY = Math.floor((BADGE_SIZE - ARROW_HEIGHT) / 2);
            const { canvas, context } = createCanvas(barX + barWidth, Math.max(BADGE_SIZE, ARROW_HEIGHT));
            const fillX = barX + ARROW_PADDING;
            const fillY = barY + ARROW_FILL_Y;
            const filled = Math.max(0, Math.min(fillWidth, Math.floor(progress * fillWidth)));

            threeSlice(context, barBackground, ARROW_PADDING * 2, ARROW_PADDING * 2, barWidth, barX, barY);

            if(filled > 0)
            {
                const piece = blended(tinted(chunk, color), [ [ barDarkening, 'multiply' ], [ barLighting, 'lighter' ] ]);

                context.save();
                context.beginPath();
                context.rect(fillX, fillY, filled, ARROW_FILL_HEIGHT);
                context.clip();
                for(let offset = 0; offset < fillWidth; offset += ARROW_STEP) context.drawImage(piece, fillX + offset, fillY);
                context.restore();
            }

            context.save();
            context.beginPath();
            context.rect(fillX, fillY, fillWidth, ARROW_FILL_HEIGHT);
            context.clip();
            context.drawImage(splitterLeft, fillX, fillY);
            for(let offset = ARROW_FIRST_SPLITTER; offset < fillWidth; offset += ARROW_STEP) context.drawImage(splitter, fillX + offset, fillY);
            context.restore();

            const badge = createCanvas(width, BADGE_SIZE);

            threeSlice(badge.context, background, BADGE_SLICE, BADGE_SLICE, width, 0, 0);
            threeSlice(badge.context, tinted(frame, color), BADGE_SLICE, BADGE_SLICE, width, 0, 0);

            const digitX = (text.length === 1) ? 7 : 6;

            for(let index = 0; index < text.length; index++)
            {
                const digit = Number(text.charAt(index));

                badge.context.drawImage(numbers, digit * BADGE_DIGIT, 0, BADGE_DIGIT, numbers.height, digitX + (index * BADGE_DIGIT), BADGE_DIGIT_Y, BADGE_DIGIT, numbers.height);
            }

            const shade = createCanvas(width, BADGE_SIZE);

            threeSlice(shade.context, darkening, BADGE_SLICE, BADGE_SLICE, width, 0, 0);
            badge.context.globalCompositeOperation = 'multiply';
            badge.context.drawImage(shade.canvas, 0, 0);

            const light = createCanvas(width, BADGE_SIZE);

            threeSlice(light.context, lighting, BADGE_SLICE, BADGE_SLICE, width, 0, 0);
            badge.context.globalCompositeOperation = 'lighter';
            badge.context.drawImage(light.canvas, 0, 0);

            const shape = createCanvas(width, BADGE_SIZE);

            threeSlice(shape.context, background, BADGE_SLICE, BADGE_SLICE, width, 0, 0);
            threeSlice(shape.context, frame, BADGE_SLICE, BADGE_SLICE, width, 0, 0);
            badge.context.globalCompositeOperation = 'destination-in';
            badge.context.drawImage(shape.canvas, 0, 0);

            context.drawImage(badge.canvas, 0, 0);

            return canvas;
        }, `${ level }:${ maxLevel }:${ progress }:${ segments }`);

    return <canvas ref={ ref } className="ranch-fx" />;
}

const BLOCKY_DIGITS: Record<string, [ number, number ]> = { '0': [ 0, 13 ], '1': [ 14, 9 ], '2': [ 24, 13 ], '3': [ 38, 13 ], '4': [ 52, 13 ], '5': [ 66, 13 ], '6': [ 80, 13 ], '7': [ 94, 13 ], '8': [ 108, 13 ], '9': [ 122, 13 ], '-': [ 136, 13 ] };
const BLOCKY_HEIGHT = 22;
const BLOCKY_SPACING = 3;
const BLOCKY_ICON_GAP = 6;

export const RanchCounterFx: FC<{ icon: string, value: number, color: number, alignment?: IconAlignment }> = props =>
{
    const { icon, value, color, alignment = 'left' } = props;
    const text = String(Math.max(0, Math.floor(value)));

    const ref = useCanvas([ icon, blockyNumbers, blockyDarkening, blockyLighting ], ([ iconImage, numbers, darkening, lighting ]) =>
    {
        const digits = text.split('').map(char => BLOCKY_DIGITS[char]);
        const contentWidth = digits.reduce((total, [ , width ], index) => total + width + ((index > 0) ? BLOCKY_SPACING : 0), 0);
        const rowHeight = Math.max(BLOCKY_HEIGHT, iconImage.height);
        const contentX = (alignment === 'right') ? 0 : iconImage.width + BLOCKY_ICON_GAP;
        const contentY = Math.floor((rowHeight - BLOCKY_HEIGHT) / 2);
        const iconY = Math.floor((rowHeight - iconImage.height) / 2);
        const placements = (alignment === 'right') ? [ contentX + contentWidth + BLOCKY_ICON_GAP ] : (alignment === 'double') ? [ 0, contentX + contentWidth + BLOCKY_ICON_GAP ] : [ 0 ];
        const width = Math.max(contentX + contentWidth, ...placements.map(x => x + iconImage.width));
        const { canvas, context } = createCanvas(width, rowHeight);
        const glyphs = blended(tinted(numbers, color), [ [ darkening, 'multiply' ], [ lighting, 'lighter' ] ]);
        let x = contentX;

        for(const [ sourceX, sourceWidth ] of digits)
        {
            context.drawImage(glyphs, sourceX, 0, sourceWidth, BLOCKY_HEIGHT, x, contentY, sourceWidth, BLOCKY_HEIGHT);
            x += sourceWidth + BLOCKY_SPACING;
        }

        for(const placement of placements) context.drawImage(iconImage, placement, iconY);

        return canvas;
    }, `${ icon }:${ text }:${ color }:${ alignment }`);

    return <canvas ref={ ref } className="ranch-fx" />;
}

const STRIPED_HEIGHT = 13;
const STRIPED_PADDING = 3;
const STRIPED_FILL_HEIGHT = 7;
const STRIPED_STEP = 10;
const STRIPED_PHASE_MS = 70;
const STRIPED_END = 2;
const STRIPED_ICON_OVERLAP = 5;
const STRIPED_ICON_CONTENT_Y = 2;
const STRIPED_WIDTHS = [ 29, 37, 53, 69, 85 ];

const repeatedThreeSlice = (context: CanvasRenderingContext2D, source: Drawable, left: number, right: number, width: number, x: number, y: number) =>
{
    const middle = Math.max(0, width - left - right);
    const sourceMiddle = Math.max(1, source.width - left - right);

    context.drawImage(source, 0, 0, left, source.height, x, y, left, source.height);

    for(let offset = 0; offset < middle; offset += sourceMiddle)
    {
        const part = Math.min(sourceMiddle, middle - offset);

        context.drawImage(source, left, 0, part, source.height, x + left + offset, y, part, source.height);
    }

    context.drawImage(source, source.width - right, 0, right, source.height, x + left + middle, y, right, source.height);
}

const darker = (rgb: number, factor: number) =>
{
    const r = ((rgb >> 16) & 255) / 255;
    const g = ((rgb >> 8) & 255) / 255;
    const b = (rgb & 255) / 255;
    const max = Math.max(r, g, b);
    const delta = max - Math.min(r, g, b);
    const hue = (delta === 0) ? 0 : (max === r) ? (60 * (((g - b) / delta) % 6)) : (max === g) ? (60 * (((b - r) / delta) + 2)) : (60 * (((r - g) / delta) + 4));

    return hsvToRgb(hue, (max === 0) ? 0 : (delta / max), Math.max(0, Math.min(1, max * factor)));
}

export const RanchStripedBarFx: FC<{ progress: number, color: number, metallic?: boolean, widthId?: number, icon?: string, iconOffsetX?: number, iconOffsetY?: number }> = props =>
{
    const { progress, color, metallic = false, widthId = 2, icon = iconTimeleft, iconOffsetX = 0, iconOffsetY = 1 } = props;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [ images, setImages ] = useState<HTMLImageElement[]>(null);
    const urls = [ stripedBackground, stripedFill, metallic ? stripedDarkeningMetallic : stripedDarkening, metallic ? stripedLightingMetallic : stripedLighting, stripedMetallic, stripedStripe, icon ?? stripedStripe ];

    useEffect(() =>
    {
        let alive = true;

        Promise.all(urls.map(load)).then(result => alive && setImages(result));

        return () =>
        {
            alive = false;
        };
    }, [ urls.join('|') ]);

    useEffect(() =>
    {
        const canvas = canvasRef.current;

        if(!canvas || !images || images.some(image => !image)) return;

        const [ background, fill, darkening, lighting, metal, stripe, loadedIcon ] = images;
        const iconImage = icon ? loadedIcon : null;
        const iconWidth = iconImage ? iconImage.width : 0;
        const iconHeight = iconImage ? iconImage.height : 0;
        const width = STRIPED_WIDTHS[Math.max(0, Math.min(4, widthId))];
        const fillWidth = Math.max(0, width - (STRIPED_PADDING * 2));
        const rowHeight = Math.max(STRIPED_HEIGHT, iconHeight);
        const contentX = iconImage ? Math.max(0, iconWidth - STRIPED_ICON_OVERLAP) : 0;
        const contentY = iconImage ? Math.max(0, Math.floor((rowHeight - STRIPED_HEIGHT) / 2) + STRIPED_ICON_CONTENT_Y) : 0;
        const iconY = Math.floor((rowHeight - iconHeight) / 2) + iconOffsetY;
        const frameWidth = Math.max(contentX + width, iconOffsetX + iconWidth);
        const frameHeight = Math.max(contentY + STRIPED_HEIGHT, iconImage ? (iconY + iconHeight) : 0);
        const fillX = contentX + STRIPED_PADDING;
        const fillY = contentY + STRIPED_PADDING;
        const bar = createCanvas(frameWidth, frameHeight);

        threeSlice(bar.context, tinted(fill, color), STRIPED_PADDING, STRIPED_PADDING, fillWidth, fillX, fillY);

        if(metallic)
        {
            const shine = createCanvas(frameWidth, frameHeight);

            repeatedThreeSlice(shine.context, metal, 9, STRIPED_PADDING, fillWidth, fillX, fillY);
            bar.context.globalCompositeOperation = 'lighter';
            bar.context.drawImage(shine.canvas, 0, 0);
        }

        const shade = createCanvas(frameWidth, frameHeight);

        repeatedThreeSlice(shade.context, darkening, STRIPED_PADDING, STRIPED_PADDING, fillWidth, fillX, fillY);
        bar.context.globalCompositeOperation = 'multiply';
        bar.context.drawImage(shade.canvas, 0, 0);

        const light = createCanvas(frameWidth, frameHeight);

        repeatedThreeSlice(light.context, lighting, 9, STRIPED_PADDING, fillWidth, fillX, fillY);
        bar.context.globalCompositeOperation = 'lighter';
        bar.context.drawImage(light.canvas, 0, 0);

        const shape = createCanvas(frameWidth, frameHeight);

        threeSlice(shape.context, fill, STRIPED_PADDING, STRIPED_PADDING, fillWidth, fillX, fillY);
        bar.context.globalCompositeOperation = 'destination-in';
        bar.context.drawImage(shape.canvas, 0, 0);

        const stripes = createCanvas(frameWidth + STRIPED_STEP + stripe.width, frameHeight);

        for(let offset = 0; offset <= fillWidth + STRIPED_STEP; offset += STRIPED_STEP) stripes.context.drawImage(stripe, fillX + offset, fillY);

        const stripeLayer = tinted(stripes.canvas, darker(color, 0.5));
        const context = canvas.getContext('2d');

        canvas.width = frameWidth;
        canvas.height = frameHeight;
        context.imageSmoothingEnabled = false;

        let frame = 0;

        const paint = () =>
        {
            const filled = Math.max(0, Math.min(fillWidth, Math.floor(progress * fillWidth)));
            const phase = Math.floor(performance.now() / STRIPED_PHASE_MS) % STRIPED_STEP;

            context.globalCompositeOperation = 'source-over';
            context.clearRect(0, 0, frameWidth, frameHeight);
            threeSlice(context, background, STRIPED_PADDING * 2, STRIPED_PADDING * 2, width, contentX, contentY);

            if(filled > 0)
            {
                context.save();
                context.beginPath();
                context.rect(fillX, fillY, filled, STRIPED_FILL_HEIGHT);
                context.clip();
                context.drawImage(bar.canvas, 0, 0);
                context.globalCompositeOperation = 'multiply';
                context.drawImage(stripeLayer, phase - STRIPED_STEP, 0);
                context.restore();

                if(filled >= 4) context.drawImage(bar.canvas, fillX + fillWidth - STRIPED_END, fillY, STRIPED_END, STRIPED_FILL_HEIGHT, fillX + filled - STRIPED_END, fillY, STRIPED_END, STRIPED_FILL_HEIGHT);
            }

            context.globalCompositeOperation = 'source-over';
            if(iconImage) context.drawImage(iconImage, iconOffsetX, iconY);
            frame = requestAnimationFrame(paint);
        }

        paint();

        return () => cancelAnimationFrame(frame);
    }, [ images, icon, progress, color, widthId, iconOffsetX, iconOffsetY ]);

    return <canvas ref={ canvasRef } className="ranch-fx" />;
}

const BLOCK_WIDTH = 7;
const BLOCK_SPLITTER = 1;
const BLOCK_CHUNK = 8;
const BLOCK_HEIGHT = 13;
const BLOCK_PADDING = 3;
const BLOCK_FILL_HEIGHT = 7;
const BLOCK_COUNTS = [ 3, 4, 6, 8, 10 ];

const tiledChunk = (context: CanvasRenderingContext2D, source: Drawable, x: number, y: number, width: number, height: number) =>
{
    for(let offset = 0; offset < width; offset += BLOCK_CHUNK)
    {
        const part = Math.min(BLOCK_CHUNK, width - offset);

        context.drawImage(source, 0, 0, part, height, x + offset, y, part, height);
    }
}

export const RanchBlockBarFx: FC<{ progress: number, color: number, widthId?: number, icon?: string }> = props =>
{
    const { progress, color, widthId = 1, icon = iconUpgrading } = props;

    const ref = useCanvas([ blockBackground, blockFill, blockDarkening, blockLighting, blockSplitters, icon ], ([ background, fill, darkening, lighting, splitters, iconImage ]) =>
    {
        const blocks = BLOCK_COUNTS[Math.max(0, Math.min(4, widthId))];
        const fillWidth = (blocks * BLOCK_WIDTH) + ((blocks - 1) * BLOCK_SPLITTER);
        const width = fillWidth + (BLOCK_PADDING * 2);
        const rowHeight = Math.max(BLOCK_HEIGHT, iconImage.height);
        const contentX = Math.max(0, iconImage.width - STRIPED_ICON_OVERLAP);
        const contentY = Math.max(0, Math.floor((rowHeight - BLOCK_HEIGHT) / 2) + STRIPED_ICON_CONTENT_Y);
        const iconY = Math.floor((rowHeight - iconImage.height) / 2);
        const { canvas, context } = createCanvas(Math.max(contentX + width, iconImage.width), Math.max(contentY + BLOCK_HEIGHT, iconY + iconImage.height));
        const fillX = contentX + BLOCK_PADDING;
        const fillY = contentY + BLOCK_PADDING;
        const filled = Math.max(0, Math.min(fillWidth, Math.floor(progress * fillWidth)));

        threeSlice(context, background, BLOCK_PADDING * 2, BLOCK_PADDING * 2, width, contentX, contentY);

        if(filled > 0)
        {
            const bar = createCanvas(fillWidth, BLOCK_FILL_HEIGHT);

            bar.context.fillStyle = cssColor(color);
            bar.context.fillRect(0, 0, fillWidth, BLOCK_FILL_HEIGHT);

            for(const [ layer, mode ] of [ [ fill, 'multiply' ], [ darkening, 'multiply' ], [ lighting, 'lighter' ] ] as [ Drawable, GlobalCompositeOperation ][])
            {
                const pass = createCanvas(fillWidth, BLOCK_FILL_HEIGHT);

                tiledChunk(pass.context, layer, 0, 0, fillWidth, BLOCK_FILL_HEIGHT);
                bar.context.globalCompositeOperation = mode;
                bar.context.drawImage(pass.canvas, 0, 0);
            }

            context.drawImage(bar.canvas, 0, 0, filled, BLOCK_FILL_HEIGHT, fillX, fillY, filled, BLOCK_FILL_HEIGHT);
        }

        for(let block = 1; block <= blocks; block++) context.drawImage(splitters, 0, BLOCK_PADDING, BLOCK_SPLITTER, BLOCK_FILL_HEIGHT, fillX + (block * BLOCK_CHUNK) - BLOCK_SPLITTER, fillY, BLOCK_SPLITTER, BLOCK_FILL_HEIGHT);

        context.drawImage(iconImage, 0, iconY);

        return canvas;
    }, `${ progress }:${ color }:${ widthId }:${ icon }`);

    return <canvas ref={ ref } className="ranch-fx" />;
}
