import { CSSProperties, FC, ReactNode } from 'react';
import { IShopNameDecor } from '../../api/shop/ShopProtocol';
import { useShopUserDecor } from './ShopInfostandBorder';

// A player's name as they styled it in Presence > Name: habbo.cc's name tag (a tag or emoji in front, tag and name
// colours, and for VIP a shadow and a glow) plus the name decorations of HabboJe's catalog (a gradient colour drawn letter
// by letter, an outline, an icon before the name, an image behind it). A rank's colour and background (permissions table)
// are name items too, worn by default, so once a player's decor has loaded it decides the look; baseStyle (the old rank
// style) is only used until then.

const shadow = (color: string, x: number, y: number, blur: number) => (color ? `${ x || 0 }px ${ y || 0 }px ${ blur || 0 }px ${ color }` : '');

const glow = (color: string, size: number) => ((color && size) ? `0 0 ${ size }px ${ color }, 0 0 ${ Math.round(size / 2) }px ${ color }` : '');

/** An outline around the letters, drawn as eight 1px text shadows (HabboJe does the same). */
const outline = (color: string) => (color ? [ '1px 1px', '-1px 1px', '1px -1px', '-1px -1px', '0 1px', '0 -1px', '1px 0', '-1px 0' ].map(offset => `${ offset } 0 ${ color }`).join(', ') : '');

const join = (...parts: string[]) => parts.filter(part => part).join(', ');

/** The colour of letter `index` of `length` along a gradient of hex stops. */
const gradientColor = (stops: string[], index: number, length: number) =>
{
    if(stops.length === 1 || length <= 1) return stops[0];

    const position = (index / (length - 1)) * (stops.length - 1);
    const from = Math.floor(position);
    const to = Math.min(stops.length - 1, from + 1);
    const t = position - from;
    const a = parseInt(stops[from].slice(1), 16);
    const b = parseInt(stops[to].slice(1), 16);
    const mix = (shift: number) => Math.round((((a >> shift) & 255) * (1 - t)) + (((b >> shift) & 255) * t));

    return `rgb(${ mix(16) }, ${ mix(8) }, ${ mix(0) })`;
};

export interface StyledNameViewProps
{
    name: string;
    decor: IShopNameDecor | null;
    namesUrl?: string;
    /** the name style used until the player's decor has loaded (rank colour / VIP gold, see GetUsernameStyle) */
    baseStyle?: CSSProperties;
    /** the style of a name without any colour of its own (e.g. the chat bubble's text colour) */
    plainStyle?: CSSProperties;
    className?: string;
    suffix?: ReactNode;
}

/** Draws a name with a given style (the Presence preview uses it with the unsaved values). */
export const StyledNameView: FC<StyledNameViewProps> = props =>
{
    const { name = '', decor = null, namesUrl = '', baseStyle = undefined, plainStyle = undefined, className = '', suffix = null } = props;

    if(!decor) return <span className={ className } style={ baseStyle }>{ name }{ suffix }</span>;

    // "~#a,#b,..." = an animated colour: the gradient flows through the name (HabboPie's "Animasyonlu")
    const animated = !!decor.color && decor.color.startsWith('~');
    const stops = decor.color ? decor.color.replace(/^~/, '').split(',').map(stop => stop.trim()).filter(stop => /^#[0-9a-fA-F]{6}$/.test(stop)) : [];
    const nameShadow = join(outline(decor.border), shadow(decor.nameShadowColor, decor.nameShadowX, decor.nameShadowY, decor.nameShadowBlur), glow(decor.nameGlowColor, decor.nameGlowSize));

    // own colour first (Name tab), else the worn colour item (one colour or a gradient), else the plain colour
    const nameStyle: CSSProperties = { ...(plainStyle || {}) };

    if(decor.nameColor) nameStyle.color = decor.nameColor;
    else if(stops.length === 1) nameStyle.color = stops[0];

    const gradient = (!decor.nameColor && !animated && (stops.length > 1)) ? stops : [];

    if(animated && !decor.nameColor && (stops.length > 1))
    {
        // the text shows a moving gradient; shadows / outlines become drop-shadow filters (a text shadow would cover it)
        nameStyle.backgroundImage = `linear-gradient(90deg, ${ stops.join(', ') })`;
        nameStyle.backgroundSize = '200% auto';
        nameStyle.WebkitBackgroundClip = 'text';
        nameStyle.backgroundClip = 'text';
        nameStyle.color = 'transparent';
        nameStyle.animation = 'shop-name-flow 3s linear infinite';

        const filters = [
            ...(decor.border ? [ '1px 0', '-1px 0', '0 1px', '0 -1px' ].map(offset => `drop-shadow(${ offset } 0 ${ decor.border })`) : []),
            ...(decor.nameShadowColor ? [ `drop-shadow(${ decor.nameShadowX || 0 }px ${ decor.nameShadowY || 0 }px ${ decor.nameShadowBlur || 0 }px ${ decor.nameShadowColor })` ] : []),
            ...((decor.nameGlowColor && decor.nameGlowSize) ? [ `drop-shadow(0 0 ${ decor.nameGlowSize }px ${ decor.nameGlowColor })` ] : [])
        ];

        if(filters.length) nameStyle.filter = filters.join(' ');
    }
    else if(nameShadow) nameStyle.textShadow = nameShadow;

    const tagStyle: CSSProperties = {};

    if(decor.tagColor) tagStyle.color = decor.tagColor;

    const tagShadow = join(shadow(decor.tagShadowColor, decor.tagShadowX, decor.tagShadowY, decor.tagShadowBlur), glow(decor.tagGlowColor, decor.tagGlowSize));

    if(tagShadow) tagStyle.textShadow = tagShadow;

    const fileUrl = (file: string) => (/^(https?:)?\/\//.test(file) ? file : (namesUrl + file));
    const wrapperStyle: CSSProperties = decor.background ? { backgroundImage: `url(${ fileUrl(decor.background) })` } : undefined;
    const letters = Array.from(name);

    return (
        <span className={ `shop-styled-name${ decor.background ? ' has-background' : '' } ${ className }` } style={ wrapperStyle }>
            { decor.icon && <img className="shop-styled-name-icon" src={ fileUrl(decor.icon) } alt="" draggable={ false } /> }
            { decor.tag && <span className="shop-styled-name-tag" style={ tagStyle }>{ decor.tag }</span> }
            <span className="shop-styled-name-text" style={ nameStyle }>
                { gradient.length
                    ? letters.map((letter, index) => <span key={ index } style={ { color: gradientColor(gradient, index, letters.length) } }>{ letter }</span>)
                    : name }
            </span>
            { suffix }
        </span>
    );
}

/** A player's styled name, fetched once per player (shared cache with their border and ornament). */
export const ShopStyledName: FC<Omit<StyledNameViewProps, 'decor' | 'namesUrl'> & { userId: number }> = props =>
{
    const { userId = 0, ...rest } = props;
    const decor = useShopUserDecor(userId);

    return <StyledNameView { ...rest } decor={ decor?.name || null } namesUrl={ decor?.namesUrl || '' } />;
}
