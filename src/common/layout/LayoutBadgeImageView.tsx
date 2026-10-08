import { BadgeImageReadyEvent, NitroSprite, TextureUtils } from '@nitrots/nitro-renderer';
import { CSSProperties, FC, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { GetBadgeRarity, GetConfiguration, GetSessionDataManager, LocalizeBadgeDescription, LocalizeBadgeName, LocalizeText, OnBadgeRarity, RequestBadgeRarity } from '../../api';
import { Base, BaseProps } from '../Base';
import { Column } from '../Column';

const RARITY_TIERS = [ 'Common', 'Uncommon', 'Rare', 'Epic', 'Mythical' ];

export interface LayoutBadgeImageViewProps extends BaseProps<HTMLDivElement>
{
    badgeCode: string;
    isGroup?: boolean;
    showInfo?: boolean;
    customTitle?: string;
    isGrayscale?: boolean;
    scale?: number;
}

export const LayoutBadgeImageView: FC<LayoutBadgeImageViewProps> = props =>
{
    const { badgeCode = null, isGroup = false, showInfo = false, customTitle = null, isGrayscale = false, scale = 1, classNames = [], style = {}, children = null, ...rest } = props;
    const [ imageElement, setImageElement ] = useState<HTMLImageElement>(null);
    const [ , setRarityVersion ] = useState(0);
    // Real reference behaviour, confirmed live via CDP hover on a fresh habbocity.fr tab (a static screenshot
    // could never have caught this - the tooltip is entirely absent from the DOM until hovered): the name/
    // description popup is NOT a static child of the badge div like this component used to render it - it's a
    // real, already-ported, previously-unused primitive (.tooltip-c, _26-limited.scss) mounted only while
    // hovering, portalled to document.body (position:fixed there already accounts for that), with a real
    // directional arrow (.left/.right modifier + the CSS's own :after clip-path).
    const [ isHovering, setIsHovering ] = useState(false);
    const [ tooltipStyle, setTooltipStyle ] = useState<CSSProperties>({});
    const [ tooltipSide, setTooltipSide ] = useState<'left' | 'right'>('right');
    const elementRef = useRef<HTMLDivElement>(null);

    const getClassNames = useMemo(() =>
    {
        const newClassNames: string[] = [ 'badge-image' ];

        if(isGroup) newClassNames.push('group-badge');

        if(isGrayscale) newClassNames.push('grayscale');

        if(classNames.length) newClassNames.push(...classNames);

        return newClassNames;
    }, [ classNames, isGroup, isGrayscale ]);

    const getStyle = useMemo(() =>
    {
        let newStyle: CSSProperties = {};

        if(imageElement)
        {
            newStyle.backgroundImage = `url(${ (isGroup) ? imageElement.src : GetConfiguration<string>('badge.asset.url').replace('%badgename%', badgeCode.toString())})`;
            newStyle.width = imageElement.width;
            newStyle.height = imageElement.height;

            if(scale !== 1)
            {
                newStyle.transform = `scale(${ scale })`;

                if(!(scale % 1)) newStyle.imageRendering = 'pixelated';

                newStyle.width = (imageElement.width * scale);
                newStyle.height = (imageElement.height * scale);
            }
        }

        if(Object.keys(style).length) newStyle = { ...newStyle, ...style };

        return newStyle;
    }, [ imageElement, scale, style ]);

    useEffect(() =>
    {
        if(!badgeCode || !badgeCode.length) return;

        if(!isGroup)
        {
            const element = new Image();

            element.onload = () => setImageElement(element);
            element.src = GetConfiguration<string>('badge.asset.url').replace('%badgename%', badgeCode.toString());

            return () =>
            {
                element.onload = null;
            };
        }

        let didSetBadge = false;

        const onBadgeImageReadyEvent = (event: BadgeImageReadyEvent) =>
        {
            if(event.badgeId !== badgeCode) return;

            const element = TextureUtils.generateImage(new NitroSprite(event.image));

            element.onload = () => setImageElement(element);

            didSetBadge = true;

            GetSessionDataManager().events.removeEventListener(BadgeImageReadyEvent.IMAGE_READY, onBadgeImageReadyEvent);
        }

        GetSessionDataManager().events.addEventListener(BadgeImageReadyEvent.IMAGE_READY, onBadgeImageReadyEvent);

        const texture = GetSessionDataManager().getGroupBadgeImage(badgeCode);

        if(texture && !didSetBadge)
        {
            const element = TextureUtils.generateImage(new NitroSprite(texture));

            element.onload = () => setImageElement(element);
        }

        return () => GetSessionDataManager().events.removeEventListener(BadgeImageReadyEvent.IMAGE_READY, onBadgeImageReadyEvent);
    }, [ badgeCode, isGroup ]);

    // Position/side recomputed every time hover starts, same one-shot-on-open approach CustomSelect.tsx already
    // uses for its own portalled panel (that one keeps re-placing every frame since its trigger can scroll under
    // an open panel; a badge tooltip only exists while the pointer stays over a static infostand row, so a single
    // measurement on hover-start is enough here - no scroll/resize case to track).
    useEffect(() =>
    {
        if(!isHovering || !elementRef.current) return;

        const rect = elementRef.current.getBoundingClientRect();
        const tooltipWidth = 210;
        const gap = 8;
        const side: 'left' | 'right' = ((rect.right + gap + tooltipWidth) > window.innerWidth) ? 'left' : 'right';

        setTooltipSide(side);
        setTooltipStyle({
            top: (rect.top + (rect.height / 2) - 16),
            left: (side === 'right') ? (rect.right + gap) : (rect.left - gap)
        });
    }, [ isHovering ]);

    useEffect(() =>
    {
        if(!isHovering || !showInfo || isGroup || !badgeCode) return;

        const unsubscribe = OnBadgeRarity(() => setRarityVersion(value => value + 1));

        RequestBadgeRarity(badgeCode);

        return () =>
        {
            unsubscribe();
        };
    }, [ isHovering, showInfo, isGroup, badgeCode ]);

    const rarity = (!isGroup && badgeCode) ? GetBadgeRarity(badgeCode) : null;

    return (
        <Base innerRef={ elementRef } classNames={ getClassNames } style={ getStyle } onMouseEnter={ event => setIsHovering(true) } onMouseLeave={ event => setIsHovering(false) } { ...rest }>
            { (isHovering && showInfo && GetConfiguration<boolean>('badge.descriptions.enabled', true)) && createPortal(
                <Column gap={ 2 } className={ `tooltip-c badge-information ${ tooltipSide }` } style={ tooltipStyle }>
                    <Column gap={ 2 } className="content-area">
                        <Column gap={ 2 } className="content-area-inner">
                            <div className="d-inline text-element text-break fw-bold mb-1">{ isGroup ? customTitle : LocalizeBadgeName(badgeCode) }</div>
                            <div className="d-inline text-element text-break">{ isGroup ? LocalizeText('group.badgepopup.body') : LocalizeBadgeDescription(badgeCode) }</div>
                            { !isGroup && rarity && (rarity.count > 0) &&
                                <div className="badge-rarity">
                                    <span className={ `badge-rarity-tier is-${ RARITY_TIERS[Math.min(Math.max(rarity.level, 1), RARITY_TIERS.length) - 1].toLowerCase() }` }>{ RARITY_TIERS[Math.min(Math.max(rarity.level, 1), RARITY_TIERS.length) - 1] } badge</span>
                                    <span className="badge-rarity-owned">Owned by { rarity.count.toLocaleString() } { (rarity.count === 1) ? 'user' : 'users' }</span>
                                </div> }
                        </Column>
                    </Column>
                </Column>, document.body) }
            { children }
        </Base>
    );
}
