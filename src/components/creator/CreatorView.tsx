import { AvatarScaleType, AvatarSetType } from '@nitrots/nitro-renderer';
import { FC, PointerEvent as ReactPointerEvent, useCallback, useEffect, useRef, useState } from 'react';
import { FaEraser, FaFillDrip, FaPaintBrush, FaRedo, FaRegCircle, FaRegSquare, FaSlash, FaTrashAlt, FaUndo, FaUpload } from 'react-icons/fa';
import { AddEventLinkTracker, GetAvatarRenderManager, GetConfiguration, GetSessionDataManager, RemoveLinkEventTracker, SendMessageComposer } from '../../api';
import { CreatorConfigComposer, CreatorConfigEvent, CreatorCreateComposer, CreatorListComposer, CreatorListEvent, CreatorResultEvent, CreatorSendCopyComposer, CreatorType, ICreation, ICreatorConfig, RegisterCreatorMessages } from '../../api/creator/CreatorProtocol';
import { Button, Column, Flex, LayoutAvatarImageView, LayoutCurrencyIcon, NitroCardContentView, NitroCardHeaderView, NitroCardTabsItemView, NitroCardTabsView, NitroCardView, Text } from '../../common';
import { useMessageEvent, useNotification, useSessionInfo } from '../../hooks';

type Tool = 'pencil' | 'eraser' | 'fill' | 'line' | 'rect' | 'ellipse';
type BannerStamp = 'gradient' | 'sky' | 'stripes' | 'dots' | 'checker' | 'frame' | 'arch' | 'stand' | 'tile' | 'steps' | 'cloud';

interface IAvatarLayer { on: boolean, head: boolean, x: number, y: number, zoom: number }
interface IBackground { key: string, color: string }
interface IDraft { id: number, type: CreatorType, savedAt: number, drawing: string, preview: string, background: IBackground, avatar: IAvatarLayer, auto?: boolean }

const SIZES: Record<CreatorType, { width: number, height: number, scale: number }> = {
    badge: { width: 40, height: 40, scale: 6 },
    banner: { width: 67, height: 170, scale: 2 }
};

const PALETTE = [ '#000000', '#3d3d3d', '#7a7a7a', '#bdbdbd', '#ffffff', '#5c2e12', '#a0522d', '#e8b07a', '#ffd9b3', '#b71c1c', '#ef5350', '#ff9800', '#ffd54f', '#fff59d', '#1b5e20', '#43a047', '#9ccc65', '#006064', '#26c6da', '#0d47a1', '#1e88e5', '#90caf9', '#4a148c', '#8e24aa', '#ce93d8', '#ad1457', '#f06292' ];
const BACKGROUNDS: [ string, boolean ][] = [ [ 'basic_1', false ], [ 'basic_2', false ], [ 'basic_3', false ], [ 'basic_4', false ], [ 'basic_5', false ], [ 'advanced_1', false ], [ 'advanced_2', false ], [ 'advanced_3', false ], [ 'advanced_4', false ], [ 'beams', true ], [ 'book', false ], [ 'circles_1', false ], [ 'circles_2', false ], [ 'egg', false ], [ 'gold_1', true ], [ 'gold_2', true ], [ 'gradient_1', false ], [ 'gradient_2', false ], [ 'misc_1', true ], [ 'misc_2', false ], [ 'ornament', false ], [ 'ornament_1', true ], [ 'ornament_2', true ], [ 'pin', true ], [ 'ring', false ], [ 'shield', true ], [ 'simplestar', true ], [ 'spiral', false ] ];
const BANNER_STAMPS: { key: BannerStamp, label: string, group: 'background' | 'frame' | 'stand' }[] = [ { key: 'gradient', label: 'Gradient', group: 'background' }, { key: 'sky', label: 'Sky', group: 'background' }, { key: 'stripes', label: 'Stripes', group: 'background' }, { key: 'dots', label: 'Dots', group: 'background' }, { key: 'checker', label: 'Checker', group: 'background' }, { key: 'arch', label: 'Arch', group: 'frame' }, { key: 'frame', label: 'Square', group: 'frame' }, { key: 'stand', label: 'Round', group: 'stand' }, { key: 'tile', label: 'Tile', group: 'stand' }, { key: 'steps', label: 'Steps', group: 'stand' }, { key: 'cloud', label: 'Cloud', group: 'stand' } ];
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
const MAX_BASE64 = 62000;
const MAX_HISTORY = 30;
const MAX_DRAFTS = 10;
const DRAFTS_KEY = 'hcms.creator.drafts';
const AUTOSAVE_IDS: Record<CreatorType, number> = { badge: 1, banner: 2 };
const NO_AVATAR: IAvatarLayer = { on: false, head: true, x: 20, y: 20, zoom: 100 };

const hexToRgba = (hex: string): [ number, number, number, number ] => [ parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16), 255 ];

const shade = (hex: string, factor: number) =>
{
    const [ red, green, blue ] = hexToRgba(hex);
    const channel = (value: number) => Math.max(0, Math.min(255, Math.round((factor >= 1) ? (value + ((255 - value) * (factor - 1))) : (value * factor))));

    return `rgb(${ channel(red) }, ${ channel(green) }, ${ channel(blue) })`;
}

const mix = (hex: string, target: number, amount: number) =>
{
    const [ red, green, blue ] = hexToRgba(hex);
    const channel = (value: number) => Math.round(value + ((target - value) * amount));

    return `rgb(${ channel(red) }, ${ channel(green) }, ${ channel(blue) })`;
}

const paintBannerStamp = (stamp: BannerStamp, color: string, width: number, height: number) =>
{
    const canvas = document.createElement('canvas');

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    const pixel = (x: number, y: number, fill: string) => { context.fillStyle = fill; context.fillRect(x, y, 1, 1); };

    const centerX = Math.floor(width / 2);
    const grid: string[][] = Array.from({ length: height }, () => new Array<string>(width).fill(null));

    const block = (inside: (x: number, y: number) => boolean, thickness: number, base: string) =>
    {
        for(let depth = thickness; depth >= 1; depth--)
        {
            for(let y = 0; y < height; y++)
            {
                for(let x = 0; x < width; x++)
                {
                    if(inside(x, y - depth)) grid[y][x] = (x < centerX) ? shade(base, 0.78) : shade(base, 0.58);
                }
            }
        }

        for(let y = 0; y < height; y++)
        {
            for(let x = 0; x < width; x++)
            {
                if(!inside(x, y)) continue;

                grid[y][x] = (!inside(x, y - 1) || !inside(x - 1, y)) ? shade(base, 1.25) : base;
            }
        }
    }

    const diamond = (cx: number, cy: number, halfWidth: number) => (x: number, y: number) => ((Math.abs(x - cx) / halfWidth) + (Math.abs(y - cy) / (halfWidth / 2))) <= 1;
    const oval = (cx: number, cy: number, radiusX: number, radiusY: number) => (x: number, y: number) => ((((x - cx) / radiusX) ** 2) + (((y - cy) / radiusY) ** 2)) <= 1;

    if((stamp === 'stand') || (stamp === 'tile') || (stamp === 'steps') || (stamp === 'cloud'))
    {
        if(stamp === 'stand') block(oval(centerX, height - 26, (width / 2) - 6, 9), 6, color);

        if(stamp === 'tile') block(diamond(centerX, height - 26, 28), 6, color);

        if(stamp === 'steps')
        {
            block(diamond(centerX, height - 20, 30), 5, color);
            block(diamond(centerX, height - 30, 18), 5, color);
        }

        if(stamp === 'cloud')
        {
            const puffs = [ oval(centerX - 16, height - 24, 12, 8), oval(centerX, height - 28, 15, 10), oval(centerX + 16, height - 24, 12, 8), oval(centerX - 6, height - 19, 18, 7), oval(centerX + 8, height - 19, 16, 7) ];

            block((x, y) => puffs.some(puff => puff(x, y)), 2, color);
        }

        for(let y = 0; y < height; y++)
        {
            for(let x = 0; x < width; x++)
            {
                if(!grid[y][x]) continue;

                const edge = [ [ 1, 0 ], [ -1, 0 ], [ 0, 1 ], [ 0, -1 ] ].some(([ dx, dy ]) => !grid[y + dy]?.[x + dx]);

                pixel(x, y, edge ? shade(color, 0.35) : grid[y][x]);
            }
        }

        return canvas;
    }

    if(stamp === 'arch')
    {
        const radius = (width - 1) / 2;
        const inside = (x: number, y: number) => (x >= 0) && (x < width) && (y < height) && ((y >= radius) ? (y >= 0) : (((x - radius) ** 2) + ((y - radius) ** 2) <= (radius ** 2)));
        const distanceOut = (x: number, y: number) =>
        {
            for(let distance = 1; distance <= 4; distance++)
            {
                if([ [ distance, 0 ], [ -distance, 0 ], [ 0, distance ], [ 0, -distance ] ].some(([ dx, dy ]) => !inside(x + dx, y + dy))) return distance;
            }

            return 99;
        }

        for(let y = 0; y < height; y++)
        {
            for(let x = 0; x < width; x++)
            {
                if(!inside(x, y))
                {
                    if(y < radius) pixel(x, y, color);

                    continue;
                }

                const distance = distanceOut(x, y);

                if(distance === 1) pixel(x, y, shade(color, 0.35));
                else if(distance <= 3) pixel(x, y, (distance === 2) ? shade(color, 1.4) : color);
                else if(distance === 4) pixel(x, y, shade(color, 0.6));
            }
        }

        return canvas;
    }

    for(let y = 0; y < height; y++)
    {
        for(let x = 0; x < width; x++)
        {
            switch(stamp)
            {
                case 'gradient': pixel(x, y, mix(color, 0, (y / height) * 0.6)); break;
                case 'sky': pixel(x, y, mix(color, 255, (y / height) * 0.85)); break;
                case 'stripes': pixel(x, y, ((Math.floor((x + y) / 4) % 2) === 0) ? color : shade(color, 0.75)); break;
                case 'dots': pixel(x, y, (((x % 6) < 2) && ((y % 6) < 2)) ? shade(color, 0.7) : color); break;
                case 'checker': pixel(x, y, (((Math.floor(x / 6) + Math.floor(y / 6)) % 2) === 0) ? color : shade(color, 0.8)); break;
                case 'frame':
                    if((x < 2) || (y < 2) || (x >= width - 2) || (y >= height - 2)) pixel(x, y, color);
                    else if((x === 2) || (y === 2) || (x === width - 3) || (y === height - 3)) pixel(x, y, shade(color, 0.6));
                    break;
            }
        }
    }

    return canvas;
}

const badgePartUrl = (name: string) => `${ GetConfiguration<string>('image.library.url', '') }Badgeparts/badgepart_base_${ name }.png`;

const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) =>
{
    const image = new Image();

    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
});

const readDrafts = (): IDraft[] =>
{
    try { return JSON.parse(window.localStorage.getItem(DRAFTS_KEY) || '[]'); }
    catch { return []; }
}

const writeDrafts = (drafts: IDraft[]) =>
{
    try
    {
        window.localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));

        return true;
    }
    catch
    {
        return false;
    }
}

const creationImage = (creation: ICreation) =>
{
    if(creation.status !== 'approved') return `data:image/png;base64,${ creation.image }`;

    if(creation.type === 'badge') return GetConfiguration<string>('badge.asset.url', '').replace('%badgename%', creation.result);

    return `${ GetConfiguration<string>('banner.url', '') }/custom_${ creation.id }.png`;
}

const newPixels = (type: CreatorType) =>
{
    const canvas = document.createElement('canvas');

    canvas.width = SIZES[type].width;
    canvas.height = SIZES[type].height;

    return canvas;
}

export const CreatorView: FC<{}> = props =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const [ view, setView ] = useState<'editor' | 'mine'>('editor');
    const [ type, setType ] = useState<CreatorType>('badge');
    const [ tool, setTool ] = useState<Tool>('pencil');
    const [ filled, setFilled ] = useState(false);
    const [ color, setColor ] = useState('#1e88e5');
    const [ friend, setFriend ] = useState('');
    const [ title, setTitle ] = useState('');
    const [ description, setDescription ] = useState('');
    const [ config, setConfig ] = useState<ICreatorConfig>(null);
    const [ creations, setCreations ] = useState<ICreation[]>([]);
    const [ drafts, setDrafts ] = useState<IDraft[]>(readDrafts);
    const [ copyTargets, setCopyTargets ] = useState<Record<number, string>>({});
    const [ filter, setFilter ] = useState<'all' | CreatorType>('all');
    const [ busy, setBusy ] = useState(false);
    const [ message, setMessage ] = useState<{ ok: boolean, text: string }>(null);
    const [ historyState, setHistoryState ] = useState({ undo: 0, redo: 0 });
    const [ background, setBackground ] = useState<IBackground>(null);
    const [ avatar, setAvatar ] = useState<IAvatarLayer>(NO_AVATAR);
    const [ avatarImage, setAvatarImage ] = useState<HTMLImageElement>(null);
    const [ backgroundImage, setBackgroundImage ] = useState<HTMLCanvasElement>(null);
    const [ previewHabbo, setPreviewHabbo ] = useState(false);
    const [ revision, setRevision ] = useState(0);
    const pixelsRef = useRef<HTMLCanvasElement>(newPixels('badge'));
    const viewRef = useRef<HTMLCanvasElement>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const undoStack = useRef<ImageData[]>([]);
    const redoStack = useRef<ImageData[]>([]);
    const drawing = useRef(false);
    const shapeStart = useRef<{ x: number, y: number, base: ImageData }>(null);
    const autosaveRef = useRef<() => void>(null);
    const { showConfirm = null } = useNotification();
    const { userFigure = null } = useSessionInfo();

    const size = SIZES[type];

    const pixels = () => pixelsRef.current.getContext('2d', { willReadFrequently: true });

    const bump = () => setRevision(value => (value + 1));

    const composite = useCallback((target: CanvasRenderingContext2D, width: number, height: number) =>
    {
        const factor = width / size.width;

        target.imageSmoothingEnabled = false;
        target.clearRect(0, 0, width, height);

        if((type === 'badge') && backgroundImage) target.drawImage(backgroundImage, 0, 0, width, height);

        if((type === 'badge') && avatar.on && avatarImage)
        {
            const fit = Math.min(size.width / avatarImage.naturalWidth, size.height / avatarImage.naturalHeight) * (avatar.zoom / 100) * (avatar.head ? 1 : 1.4);
            const drawWidth = avatarImage.naturalWidth * fit;
            const drawHeight = avatarImage.naturalHeight * fit;

            target.drawImage(avatarImage, Math.round((avatar.x - (drawWidth / 2)) * factor), Math.round((avatar.y - (drawHeight / 2)) * factor), Math.round(drawWidth * factor), Math.round(drawHeight * factor));
        }

        target.drawImage(pixelsRef.current, 0, 0, width, height);
    }, [ type, size, backgroundImage, avatar, avatarImage ]);

    const exportImage = useCallback(() =>
    {
        const canvas = document.createElement('canvas');

        canvas.width = size.width;
        canvas.height = size.height;
        composite(canvas.getContext('2d'), size.width, size.height);

        return canvas.toDataURL('image/png');
    }, [ size, composite ]);

    const render = useCallback(() =>
    {
        const target = viewRef.current;

        if(!target) return;

        const context = target.getContext('2d');

        composite(context, target.width, target.height);


        context.beginPath();
        context.strokeStyle = 'rgba(72, 84, 96, 0.18)';
        context.lineWidth = 1;

        for(let x = 0; x <= size.width; x++) { context.moveTo((x * size.scale) + 0.5, 0); context.lineTo((x * size.scale) + 0.5, target.height); }

        for(let y = 0; y <= size.height; y++) { context.moveTo(0, (y * size.scale) + 0.5); context.lineTo(target.width, (y * size.scale) + 0.5); }

        context.stroke();
    }, [ size, composite ]);

    useEffect(() => render(), [ render, revision, isVisible, view ]);

    const syncHistory = () => setHistoryState({ undo: undoStack.current.length, redo: redoStack.current.length });

    const snapshot = () =>
    {
        undoStack.current = [ ...undoStack.current, pixels().getImageData(0, 0, size.width, size.height) ].slice(-MAX_HISTORY);
        redoStack.current = [];
        syncHistory();
    }

    const startFresh = (nextType: CreatorType) =>
    {
        pixelsRef.current = newPixels(nextType);
        undoStack.current = [];
        redoStack.current = [];
        setHistoryState({ undo: 0, redo: 0 });
        setBackground(null);
        setAvatar(NO_AVATAR);
        setType(nextType);
        bump();
    }

    const loadDraft = (draft: IDraft) =>
    {
        startFresh(draft.type);

        loadImage(draft.drawing).then(image =>
        {
            pixelsRef.current.getContext('2d').drawImage(image, 0, 0);
            setBackground(draft.background);
            setAvatar(draft.avatar || NO_AVATAR);
            bump();
        }).catch(() => setMessage({ ok: false, text: 'That draft could not be opened.' }));
    }

    const hasContent = () =>
    {
        if(background || avatar.on) return true;

        const data = pixels().getImageData(0, 0, size.width, size.height).data;

        for(let i = 3; i < data.length; i += 4) if(data[i]) return true;

        return false;
    }

    const autosave = () =>
    {
        if(view !== 'editor') return;

        const others = readDrafts().filter(entry => !(entry.auto && (entry.type === type)));
        const next = hasContent() ? [ { id: AUTOSAVE_IDS[type], type, savedAt: Date.now(), drawing: pixelsRef.current.toDataURL('image/png'), preview: exportImage(), background, avatar, auto: true }, ...others ] : others;

        if(writeDrafts(next)) setDrafts(next);
    }

    autosaveRef.current = autosave;

    useEffect(() =>
    {
        const linkTracker = {
            linkReceived: (url: string) =>
            {
                const parts = url.split('/');

                if(parts[1] === 'hide') { autosaveRef.current?.(); setIsVisible(false); return; }

                if(parts[1] === 'toggle')
                {
                    setIsVisible(value =>
                    {
                        if(value) autosaveRef.current?.();

                        return !value;
                    });

                    return;
                }

                setIsVisible(true);
            },
            eventUrlPrefix: 'creator/'
        };

        AddEventLinkTracker(linkTracker);

        return () => RemoveLinkEventTracker(linkTracker);
    }, []);

    useEffect(() =>
    {
        if(!isVisible) return;

        RegisterCreatorMessages();
        SendMessageComposer(new CreatorConfigComposer());
        SendMessageComposer(new CreatorListComposer());
    }, [ isVisible ]);

    useEffect(() =>
    {
        if(!background)
        {
            setBackgroundImage(null);

            return;
        }

        const entry = BACKGROUNDS.find(item => (item[0] === background.key));

        if(!entry) return;

        const sources = entry[1] ? [ `${ background.key }_part1`, `${ background.key }_part2` ] : [ background.key ];

        Promise.all(sources.map(name => loadImage(badgePartUrl(name)))).then(images =>
        {
            const canvas = document.createElement('canvas');
            const tint = document.createElement('canvas');

            canvas.width = tint.width = SIZES.badge.width;
            canvas.height = tint.height = SIZES.badge.height;

            const tintContext = tint.getContext('2d');
            const [ base, overlay ] = images;
            const offsetX = Math.floor((SIZES.badge.width - base.naturalWidth) / 2);
            const offsetY = Math.floor((SIZES.badge.height - base.naturalHeight) / 2);

            tintContext.drawImage(base, offsetX, offsetY);
            tintContext.globalCompositeOperation = 'multiply';
            tintContext.fillStyle = background.color;
            tintContext.fillRect(0, 0, tint.width, tint.height);
            tintContext.globalCompositeOperation = 'destination-in';
            tintContext.drawImage(base, offsetX, offsetY);

            const context = canvas.getContext('2d');

            context.drawImage(tint, 0, 0);

            if(overlay) context.drawImage(overlay, offsetX, offsetY);

            setBackgroundImage(canvas);
        }).catch(() => setMessage({ ok: false, text: 'That background could not be loaded.' }));
    }, [ background ]);

    useEffect(() =>
    {
        if(!avatar.on || !userFigure)
        {
            setAvatarImage(null);

            return;
        }

        const setType = avatar.head ? AvatarSetType.HEAD : AvatarSetType.FULL;
        const avatarRender = GetAvatarRenderManager().createAvatarImage(userFigure, AvatarScaleType.LARGE, null, { resetFigure: () => setAvatar(value => ({ ...value })), dispose: () => {}, disposed: false }, null);

        if(!avatarRender) return;

        avatarRender.setDirection(setType, 2);

        const image = avatarRender.getCroppedImage(setType);

        avatarRender.dispose();

        if(!image) return;

        image.onload = () => setAvatarImage(image);

        if(image.complete) setAvatarImage(image);
    }, [ avatar.on, avatar.head, userFigure ]);

    useMessageEvent<CreatorConfigEvent>(CreatorConfigEvent, event => setConfig(event.getParser().config));

    useMessageEvent<CreatorListEvent>(CreatorListEvent, event => setCreations(event.getParser().creations));

    useMessageEvent<CreatorResultEvent>(CreatorResultEvent, event =>
    {
        const parser = event.getParser();

        setBusy(false);
        setMessage({ ok: parser.ok, text: parser.message });

        if(!parser.ok) return;

        setCopyTargets({});

        if(view !== 'editor') return;

        const next = readDrafts().filter(entry => !(entry.auto && (entry.type === type)));

        writeDrafts(next);
        setDrafts(next);
        setFriend('');
        setTitle('');
        setDescription('');
        startFresh(type);
        setView('mine');
    });

    const pointAt = (event: ReactPointerEvent<HTMLCanvasElement>) =>
    {
        const bounds = event.currentTarget.getBoundingClientRect();
        const x = Math.floor(((event.clientX - bounds.left) / bounds.width) * size.width);
        const y = Math.floor(((event.clientY - bounds.top) / bounds.height) * size.height);

        return { x: Math.max(0, Math.min(size.width - 1, x)), y: Math.max(0, Math.min(size.height - 1, y)), inside: (x >= 0) && (y >= 0) && (x < size.width) && (y < size.height) };
    }

    const plot = (context: CanvasRenderingContext2D, x: number, y: number) =>
    {
        if(tool === 'eraser') context.clearRect(x, y, 1, 1);
        else
        {
            context.fillStyle = color;
            context.fillRect(x, y, 1, 1);
        }
    }

    const drawShape = (context: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number) =>
    {
        context.fillStyle = color;

        if(tool === 'line')
        {
            const dx = Math.abs(x1 - x0);
            const dy = -Math.abs(y1 - y0);
            const sx = (x0 < x1) ? 1 : -1;
            const sy = (y0 < y1) ? 1 : -1;
            let error = dx + dy;

            while(true)
            {
                context.fillRect(x0, y0, 1, 1);

                if((x0 === x1) && (y0 === y1)) return;

                const doubled = 2 * error;

                if(doubled >= dy) { error += dy; x0 += sx; }

                if(doubled <= dx) { error += dx; y0 += sy; }
            }
        }

        const left = Math.min(x0, x1);
        const right = Math.max(x0, x1);
        const top = Math.min(y0, y1);
        const bottom = Math.max(y0, y1);

        if(tool === 'rect')
        {
            for(let x = left; x <= right; x++)
            {
                for(let y = top; y <= bottom; y++)
                {
                    if(filled || (x === left) || (x === right) || (y === top) || (y === bottom)) context.fillRect(x, y, 1, 1);
                }
            }

            return;
        }

        const centerX = (left + right) / 2;
        const centerY = (top + bottom) / 2;
        const radiusX = Math.max(0.5, (right - left) / 2 + 0.5);
        const radiusY = Math.max(0.5, (bottom - top) / 2 + 0.5);
        const inside = (x: number, y: number) => ((((x - centerX) / radiusX) ** 2) + (((y - centerY) / radiusY) ** 2)) <= 1;

        for(let x = left; x <= right; x++)
        {
            for(let y = top; y <= bottom; y++)
            {
                if(!inside(x, y)) continue;

                if(filled || !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1)) context.fillRect(x, y, 1, 1);
            }
        }
    }

    const fill = (startX: number, startY: number) =>
    {
        const context = pixels();
        const image = context.getImageData(0, 0, size.width, size.height);
        const data = image.data;
        const index = (x: number, y: number) => ((y * size.width) + x) * 4;
        const start = index(startX, startY);
        const target = [ data[start], data[start + 1], data[start + 2], data[start + 3] ];
        const replacement = hexToRgba(color);

        if(target.every((value, i) => (value === replacement[i]))) return;

        const stack = [ [ startX, startY ] ];

        while(stack.length)
        {
            const [ x, y ] = stack.pop();

            if((x < 0) || (y < 0) || (x >= size.width) || (y >= size.height)) continue;

            const i = index(x, y);

            if((data[i] !== target[0]) || (data[i + 1] !== target[1]) || (data[i + 2] !== target[2]) || (data[i + 3] !== target[3])) continue;

            data[i] = replacement[0];
            data[i + 1] = replacement[1];
            data[i + 2] = replacement[2];
            data[i + 3] = replacement[3];
            stack.push([ x + 1, y ], [ x - 1, y ], [ x, y + 1 ], [ x, y - 1 ]);
        }

        context.putImageData(image, 0, 0);
        render();
    }

    const onPointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) =>
    {
        const point = pointAt(event);
        const context = pixels();

        if(!point.inside) return;

        snapshot();

        if(tool === 'fill') return fill(point.x, point.y);

        drawing.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);

        if((tool === 'line') || (tool === 'rect') || (tool === 'ellipse'))
        {
            shapeStart.current = { x: point.x, y: point.y, base: context.getImageData(0, 0, size.width, size.height) };
            drawShape(context, point.x, point.y, point.x, point.y);
        }
        else plot(context, point.x, point.y);

        render();
    }

    const onPointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) =>
    {
        if(!drawing.current) return;

        const context = pixels();
        const point = pointAt(event);

        if(shapeStart.current)
        {
            context.putImageData(shapeStart.current.base, 0, 0);
            drawShape(context, shapeStart.current.x, shapeStart.current.y, point.x, point.y);
        }
        else if(point.inside) plot(context, point.x, point.y);

        render();
    }

    const stopDrawing = () =>
    {
        drawing.current = false;
        shapeStart.current = null;
    }

    const restore = (from: { current: ImageData[] }, to: { current: ImageData[] }) =>
    {
        const context = pixels();
        const previous = from.current[from.current.length - 1];

        if(!previous) return;

        to.current = [ ...to.current, context.getImageData(0, 0, size.width, size.height) ];
        from.current = from.current.slice(0, -1);
        context.putImageData(previous, 0, 0);
        syncHistory();
        render();
    }

    const flip = () =>
    {
        const context = pixels();

        snapshot();

        const copy = document.createElement('canvas');

        copy.width = size.width;
        copy.height = size.height;
        copy.getContext('2d').drawImage(pixelsRef.current, 0, 0);
        context.clearRect(0, 0, size.width, size.height);
        context.save();
        context.scale(-1, 1);
        context.drawImage(copy, -size.width, 0);
        context.restore();
        render();
    }

    const clear = () =>
    {
        snapshot();
        pixels().clearRect(0, 0, size.width, size.height);
        setBackground(null);
        setAvatar(NO_AVATAR);
        render();
    }

    const applyStamp = (stamp: BannerStamp) =>
    {
        const context = pixels();

        snapshot();
        context.save();
        context.globalCompositeOperation = (BANNER_STAMPS.find(entry => (entry.key === stamp))?.group === 'background') ? 'destination-over' : 'source-over';
        context.drawImage(paintBannerStamp(stamp, color, size.width, size.height), 0, 0);
        context.restore();
        render();
    }

    const importImage = useCallback((file: Blob) =>
    {
        if(!file || !file.type.startsWith('image/')) return setMessage({ ok: false, text: 'That is not a picture.' });

        if(file.size > MAX_UPLOAD_BYTES) return setMessage({ ok: false, text: 'The picture must be smaller than 2 MB.' });

        const url = URL.createObjectURL(file);
        const image = new Image();

        image.onload = () =>
        {
            const context = pixels();

            URL.revokeObjectURL(url);
            snapshot();

            const ratio = Math.min(size.width / image.naturalWidth, size.height / image.naturalHeight);
            const width = Math.max(1, Math.round(image.naturalWidth * ratio));
            const height = Math.max(1, Math.round(image.naturalHeight * ratio));

            context.clearRect(0, 0, size.width, size.height);
            context.imageSmoothingEnabled = (ratio < 1);
            context.drawImage(image, Math.floor((size.width - width) / 2), Math.floor((size.height - height) / 2), width, height);
            setMessage(null);
            render();
        };
        image.onerror = () =>
        {
            URL.revokeObjectURL(url);
            setMessage({ ok: false, text: 'That picture could not be read.' });
        };
        image.src = url;
    }, [ size, render ]);

    useEffect(() =>
    {
        if(!isVisible || (view !== 'editor')) return;

        const onPaste = (event: ClipboardEvent) =>
        {
            const item = Array.from(event.clipboardData?.items || []).find(entry => entry.type.startsWith('image/'));

            if(!item) return;

            event.preventDefault();
            importImage(item.getAsFile());
        };

        window.addEventListener('paste', onPaste);

        return () => window.removeEventListener('paste', onPaste);
    }, [ isVisible, view, importImage ]);

    const switchTab = (next: CreatorType | 'mine') =>
    {
        setMessage(null);

        if(next === 'mine') return openMine();

        if((view === 'editor') && (next === type)) return;

        if(view === 'editor') autosave();

        setView('editor');

        if(next === type) return;

        const auto = readDrafts().find(entry => (entry.auto && (entry.type === next)));

        if(auto) loadDraft(auto);
        else startFresh(next);
    }

    const saveDraft = () =>
    {
        const draft: IDraft = { id: Date.now(), type, savedAt: Date.now(), drawing: pixelsRef.current.toDataURL('image/png'), preview: exportImage(), background, avatar };
        const saved = drafts.filter(entry => !entry.auto);
        const next = [ draft, ...saved ].slice(0, MAX_DRAFTS).concat(drafts.filter(entry => entry.auto));

        if(!writeDrafts(next)) return setMessage({ ok: false, text: 'Your browser could not save the draft.' });

        setDrafts(next);
        setMessage({ ok: true, text: `Draft saved. Find it under My creations (${ Math.min(saved.length + 1, MAX_DRAFTS) } / ${ MAX_DRAFTS }).` });
    }

    const openDraft = (draft: IDraft) =>
    {
        setMessage(null);
        loadDraft(draft);
        setView('editor');
    }

    const deleteDraft = (draft: IDraft) =>
    {
        const next = drafts.filter(entry => (entry.id !== draft.id));

        writeDrafts(next);
        setDrafts(next);
    }

    const openMine = () =>
    {
        autosave();
        setMessage(null);
        setView('mine');
        SendMessageComposer(new CreatorListComposer());
    }

    const sendCopy = (creation: ICreation) =>
    {
        const target = (copyTargets[creation.id] || '').trim();

        if(!target || !config) return;

        const own = (target.toLowerCase() === (GetSessionDataManager().userName || '').toLowerCase());

        showConfirm(own ? `Get your ${ creation.type } back for free?` : `Send a copy of this ${ creation.type } to ${ target } for ${ config.friendPrice } Diamonds?`, () =>
        {
            setMessage(null);
            SendMessageComposer(new CreatorSendCopyComposer(creation.id, target));
        }, null, 'Send', null, 'Send a copy');
    }

    const close = () =>
    {
        autosave();
        setIsVisible(false);
    }

    if(!isVisible) return null;

    const basePrice = config ? ((type === 'badge') ? config.badgePrice : config.bannerPrice) : 0;
    const total = basePrice + ((friend.trim() && config) ? config.friendPrice : 0);
    const canCreate = !!config && config.enabled && (config.leftToday > 0) && !busy && !!title.trim();

    const create = () =>
    {
        if(!canCreate) return;

        const image = exportImage().split(',')[1] || '';

        if(image.length > MAX_BASE64) return setMessage({ ok: false, text: 'Your picture is too detailed. Make it simpler and try again.' });

        const target = friend.trim();

        showConfirm(target ? `Create "${ title.trim() }" for ${ total } Diamonds? ${ target } gets a copy too.` : `Create "${ title.trim() }" for ${ total } Diamonds?`, () =>
        {
            setBusy(true);
            setMessage(null);
            SendMessageComposer(new CreatorCreateComposer(type, target, image, title.trim(), description.trim()));
        }, null, 'Create', null, (type === 'badge') ? 'Badge creator' : 'Banner creator');
    }

    const tools: { key: Tool, title: string, icon: JSX.Element }[] = [
        { key: 'pencil', title: 'Pencil', icon: <FaPaintBrush /> },
        { key: 'eraser', title: 'Eraser', icon: <FaEraser /> },
        { key: 'fill', title: 'Fill', icon: <FaFillDrip /> },
        { key: 'line', title: 'Line', icon: <FaSlash /> },
        { key: 'rect', title: 'Rectangle', icon: <FaRegSquare /> },
        { key: 'ellipse', title: 'Circle', icon: <FaRegCircle /> }
    ];

    const statusText: Record<ICreation['status'], string> = { pending: 'Waiting for staff', approved: 'Approved', rejected: 'Not approved' };

    const palette = (
        <div className="creator-palette">
            { PALETTE.map(entry =>
                <button key={ entry } type="button" title={ entry } className={ `creator-color${ (color === entry) ? ' active' : '' }` } style={ { background: entry } } onClick={ () => { setColor(entry); if(tool === 'eraser') setTool('pencil'); } } />) }
            <input type="color" title="Own colour" className="creator-color-input" value={ color } onChange={ event => setColor(event.target.value) } />
        </div>
    );

    const canvas = (
        <Column gap={ 1 } alignItems="center" className="creator-surface">
            <div className="creator-canvas-wrap">
                <canvas ref={ viewRef } width={ size.width * size.scale } height={ size.height * size.scale } className={ `creator-canvas is-${ type }` } onPointerDown={ onPointerDown } onPointerMove={ onPointerMove } onPointerUp={ stopDrawing } onPointerLeave={ stopDrawing } />
                { (type === 'banner') && previewHabbo && userFigure && <div className="creator-habbo-preview"><LayoutAvatarImageView figure={ userFigure } direction={ 4 } /></div> }
            </div>
            <Text small variant="muted">{ size.width } × { size.height } pixels</Text>
        </Column>
    );

    const pendingCount = creations.filter(entry => (entry.status === 'pending')).length;

    return (
        <NitroCardView uniqueKey="creator" className="nitro-creator" theme="primary-slim">
            <NitroCardHeaderView headerText="Creator" onCloseClick={ close } />
            <NitroCardContentView gap={ 2 }>
                <NitroCardTabsView>
                    <NitroCardTabsItemView isActive={ (view === 'editor') && (type === 'badge') } onClick={ () => switchTab('badge') }>Badge</NitroCardTabsItemView>
                    <NitroCardTabsItemView isActive={ (view === 'editor') && (type === 'banner') } onClick={ () => switchTab('banner') }>Banner</NitroCardTabsItemView>
                    <NitroCardTabsItemView isActive={ (view === 'mine') } count={ pendingCount } onClick={ () => switchTab('mine') }>My creations</NitroCardTabsItemView>
                </NitroCardTabsView>
                { message && <div className={ `creator-message${ message.ok ? ' is-ok' : '' }` }>{ message.text }</div> }
                { (view === 'mine') &&
                    <Column gap={ 2 } className="creator-mine">
                        <Flex gap={ 2 } className="creator-summary">
                            { ([ 'approved', 'pending', 'rejected' ] as ICreation['status'][]).map(status =>
                                <Column key={ status } center gap={ 0 } className={ `creator-summary-item is-${ status }` }>
                                    <Text bold fontSize={ 4 }>{ creations.filter(entry => (entry.status === status)).length }</Text>
                                    <Text small>{ statusText[status] }</Text>
                                </Column>) }
                        </Flex>
                        <Flex gap={ 1 }>
                            { ([ [ 'all', 'All' ], [ 'badge', 'Badges' ], [ 'banner', 'Banners' ] ] as [ 'all' | CreatorType, string ][]).map(([ key, label ]) =>
                                <button key={ key } type="button" className={ `creator-filter${ (filter === key) ? ' active' : '' }` } onClick={ () => setFilter(key) }>{ label }</button>) }
                        </Flex>
                        { !creations.length && <Text small variant="muted">Nothing yet. Make your first badge or banner!</Text> }
                        <div className="creator-cards">
                            { creations.filter(entry => ((filter === 'all') || (entry.type === filter))).map(creation =>
                                <Column key={ creation.id } gap={ 1 } className={ `creator-card is-${ creation.status }` }>
                                    <Flex center className={ `creator-card-preview is-${ creation.type }` }>
                                        <img src={ creationImage(creation) } alt="" />
                                    </Flex>
                                    <Flex gap={ 1 } alignItems="center" justifyContent="between">
                                        <Text small bold truncate>{ creation.title || `${ (creation.type === 'badge') ? 'Badge' : 'Banner' } #${ creation.id }` }</Text>
                                        <span className={ `creator-status is-${ creation.status }` }>{ statusText[creation.status] }</span>
                                    </Flex>
                                    { creation.description && <Text small variant="muted" className="creator-card-description">{ creation.description }</Text> }
                                    <Text small variant="muted">{ (creation.type === 'badge') ? 'Badge' : 'Banner' } · { new Date(creation.createdAt * 1000).toLocaleDateString() }</Text>
                                    { (creation.status === 'rejected') && creation.reason && <Text small className="creator-card-reason">Reason: { creation.reason }</Text> }
                                    { (creation.status === 'approved') && config &&
                                        <Flex gap={ 1 } alignItems="center">
                                            <input type="text" className="creator-input" maxLength={ 32 } placeholder="Send a copy to..." value={ copyTargets[creation.id] || '' } onChange={ event => setCopyTargets(value => ({ ...value, [creation.id]: event.target.value })) } />
                                            <Button size="sm" disabled={ !(copyTargets[creation.id] || '').trim() } onClick={ () => sendCopy(creation) }>
                                                <Flex alignItems="center" gap={ 1 }>{ config.friendPrice } <LayoutCurrencyIcon type={ 5 } /></Flex>
                                            </Button>
                                        </Flex> }
                                </Column>) }
                        </div>
                        <Text small bold>Drafts (saved in this browser)</Text>
                        { !drafts.length && <Text small variant="muted">No drafts yet. Use "Save draft" while drawing; switching tabs or closing saves one by itself.</Text> }
                        <div className="creator-drafts">
                            { drafts.map(draft =>
                                <Column key={ draft.id } gap={ 1 } alignItems="center" className="creator-draft">
                                    <img src={ draft.preview } alt="" className={ `creator-thumb is-${ draft.type }` } />
                                    { draft.auto && <Text small variant="muted">Auto-saved</Text> }
                                    <Flex gap={ 1 }>
                                        <Button size="sm" onClick={ () => openDraft(draft) }>Open</Button>
                                        <Button size="sm" variant="danger" onClick={ () => deleteDraft(draft) }><FaTrashAlt /></Button>
                                    </Flex>
                                </Column>) }
                        </div>
                    </Column> }
                { (view === 'editor') &&
                    <Flex gap={ 2 }>
                        <Column gap={ 2 } alignItems="center" className="creator-left">
                            { canvas }
                            { (type === 'badge') &&
                                <Column gap={ 1 } fullWidth className="creator-avatar">
                                    <label className="creator-check">
                                        <input type="checkbox" checked={ avatar.on } onChange={ event => setAvatar(value => ({ ...value, on: event.target.checked })) } />
                                        <Text small>Put my Habbo on the badge</Text>
                                    </label>
                                    { avatar.on &&
                                        <>
                                            <Flex gap={ 1 }>
                                                <Button size="sm" variant={ avatar.head ? 'primary' : 'secondary' } onClick={ () => setAvatar(value => ({ ...value, head: true })) }>Head</Button>
                                                <Button size="sm" variant={ !avatar.head ? 'primary' : 'secondary' } onClick={ () => setAvatar(value => ({ ...value, head: false })) }>Full</Button>
                                            </Flex>
                                            <Flex alignItems="center" gap={ 1 }><Text small className="creator-slider-label">Left/right</Text><input type="range" min={ 0 } max={ 40 } value={ avatar.x } onChange={ event => setAvatar(value => ({ ...value, x: Number(event.target.value) })) } /></Flex>
                                            <Flex alignItems="center" gap={ 1 }><Text small className="creator-slider-label">Up/down</Text><input type="range" min={ 0 } max={ 40 } value={ avatar.y } onChange={ event => setAvatar(value => ({ ...value, y: Number(event.target.value) })) } /></Flex>
                                            <Flex alignItems="center" gap={ 1 }><Text small className="creator-slider-label">Size</Text><input type="range" min={ 50 } max={ 200 } value={ avatar.zoom } onChange={ event => setAvatar(value => ({ ...value, zoom: Number(event.target.value) })) } /></Flex>
                                        </> }
                                </Column> }
                            { (type === 'banner') &&
                                <label className="creator-check">
                                    <input type="checkbox" checked={ previewHabbo } onChange={ event => setPreviewHabbo(event.target.checked) } />
                                    <Text small>Preview with my Habbo</Text>
                                </label> }
                            <Column gap={ 1 } fullWidth>
                                <Text small bold>Title</Text>
                                <input type="text" className="creator-input" maxLength={ 40 } placeholder={ (type === 'badge') ? 'The name players see on your badge' : 'The name of your banner' } value={ title } onChange={ event => setTitle(event.target.value) } />
                                <Text small bold>Description (optional)</Text>
                                <input type="text" className="creator-input" maxLength={ 120 } placeholder="A short line about it" value={ description } onChange={ event => setDescription(event.target.value) } />
                            </Column>
                        </Column>
                        <Column gap={ 2 } grow className="creator-side">
                            <Flex gap={ 1 } className="flex-wrap">
                                { tools.map(item =>
                                    <button key={ item.key } type="button" title={ item.title } className={ `creator-tool${ (tool === item.key) ? ' active' : '' }` } onClick={ () => setTool(item.key) }>{ item.icon }</button>) }
                                <button type="button" title="Undo" className="creator-tool" disabled={ !historyState.undo } onClick={ () => restore(undoStack, redoStack) }><FaUndo /></button>
                                <button type="button" title="Redo" className="creator-tool" disabled={ !historyState.redo } onClick={ () => restore(redoStack, undoStack) }><FaRedo /></button>
                            </Flex>
                            { ((tool === 'rect') || (tool === 'ellipse')) &&
                                <label className="creator-check">
                                    <input type="checkbox" checked={ filled } onChange={ event => setFilled(event.target.checked) } />
                                    <Text small>Filled shape</Text>
                                </label> }
                            { palette }
                            { (type === 'badge') &&
                                <Column gap={ 1 }>
                                    <Text small bold>Background (takes the selected colour)</Text>
                                    <div className="creator-backgrounds">
                                        <button type="button" title="No background" className={ `creator-background${ !background ? ' active' : '' }` } onClick={ () => setBackground(null) }><FaTrashAlt /></button>
                                        { BACKGROUNDS.map(([ key, twoParts ]) =>
                                            <button key={ key } type="button" title={ key } className={ `creator-background${ (background?.key === key) ? ' active' : '' }` } onClick={ () => setBackground({ key, color }) }>
                                                <img src={ badgePartUrl(twoParts ? `${ key }_part1` : key) } alt="" />
                                            </button>) }
                                    </div>
                                </Column> }
                            { (type === 'banner') &&
                                <Column gap={ 1 }>
                                    { ([ [ 'background', 'Background (goes behind)' ], [ 'frame', 'Frame' ], [ 'stand', 'Stand' ] ] as [ string, string ][]).map(([ group, label ]) =>
                                        <Flex key={ group } gap={ 1 } alignItems="center" className="flex-wrap">
                                            <Text small bold className="creator-stamp-label">{ label }</Text>
                                            { BANNER_STAMPS.filter(stamp => (stamp.group === group)).map(stamp =>
                                                <button key={ stamp.key } type="button" className="creator-filter" onClick={ () => applyStamp(stamp.key) }>{ stamp.label }</button>) }
                                        </Flex>) }
                                    <Text small variant="muted">Uses the selected colour. Undo removes it again.</Text>
                                </Column> }
                            <Flex gap={ 1 } className="flex-wrap">
                                <Button size="sm" onClick={ () => fileRef.current?.click() }><FaUpload className="me-1" />Upload</Button>
                                <Button size="sm" variant="secondary" onClick={ flip }>Flip</Button>
                                <Button size="sm" variant="secondary" onClick={ saveDraft }>Save draft</Button>
                                <Button size="sm" variant="danger" onClick={ clear }><FaTrashAlt /></Button>
                                <input ref={ fileRef } type="file" accept="image/*" className="d-none" onChange={ event => { importImage(event.target.files?.[0]); event.target.value = ''; } } />
                            </Flex>
                            <Column gap={ 1 }>
                                <Text small bold>Give a copy to a friend (optional)</Text>
                                <input type="text" className="creator-input" maxLength={ 32 } placeholder="Habbo name" value={ friend } onChange={ event => setFriend(event.target.value) } />
                            </Column>
                            <Text small variant="muted">Staff check it first; not approved = Diamonds back. Tip: paste a picture with Ctrl+V.</Text>
                            { config && !config.enabled && <div className="creator-message">The creator is closed right now.</div> }
                            <Button variant="success" disabled={ !canCreate } onClick={ create }>
                                <Flex alignItems="center" justifyContent="center" gap={ 1 }>{ busy ? 'Sending...' : <>Create for { total } <LayoutCurrencyIcon type={ 5 } /></> }</Flex>
                            </Button>
                            { config && <Text small variant="muted" center>{ config.leftToday } left today{ config.pending ? ` · ${ config.pending } waiting for staff` : '' }</Text> }
                        </Column>
                    </Flex> }
            </NitroCardContentView>
        </NitroCardView>
    );
}
