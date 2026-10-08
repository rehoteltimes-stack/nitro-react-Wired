import { FC, useEffect, useState } from 'react';
import { SendMessageComposer } from '../../api';
import { IShopOrnamentVisual, IShopUserDecor, RegisterShopMessages, ShopUserComposer, ShopUserEvent } from '../../api/shop/ShopProtocol';
import { useMessageEvent } from '../../hooks';
import { ShopBorderFrame } from './ShopBorderFrame';

// A player's hCMS Shop decorations (their equipped border), asked from the server the first time something shows that
// player and cached per player, so the infostand (border) and the name bubble (ornament) share one answer and reopening is instant.

const cache = new Map<number, IShopUserDecor>();
const asked = new Map<number, number>();
const ASK_AGAIN_MS = 30000;

export const useShopUserDecor = (userId: number): IShopUserDecor =>
{
    RegisterShopMessages();

    const [ decor, setDecor ] = useState<IShopUserDecor>(() => cache.get(userId) || null);

    useEffect(() =>
    {
        if(!userId) return;

        setDecor(cache.get(userId) || null);

        // one request per player per half minute is plenty (a border rarely changes)
        const last = asked.get(userId) || 0;

        if(!cache.has(userId) || (Date.now() - last) > ASK_AGAIN_MS)
        {
            asked.set(userId, Date.now());
            SendMessageComposer(new ShopUserComposer(userId));
        }
    }, [ userId ]);

    useMessageEvent<ShopUserEvent>(ShopUserEvent, event =>
    {
        const data = event.getParser().data;

        if(!data) return;

        cache.set(data.userId, data);

        if(data.userId === userId) setDecor(data);
    });

    return decor;
}

/** The player's border drawn around their infostand. */
export const ShopInfostandBorder: FC<{ userId: number, scale?: number, outset?: number, centered?: boolean }> = ({ userId, scale = 1, outset = 0, centered = false }) =>
{
    const decor = useShopUserDecor(userId);

    if(!decor || !decor.border) return null;

    return <ShopBorderFrame border={ decor.border } baseUrl={ decor.bordersUrl } scale={ scale } outset={ outset } centered={ centered } />;
}

/** The player's ornament, drawn behind their name when their avatar is clicked. */
export const ShopNameOrnament: FC<{ userId: number }> = ({ userId }) =>
{
    const decor = useShopUserDecor(userId);

    return <ShopOrnamentLayers ornament={ decor?.ornament } baseUrl={ decor?.ornamentsUrl } />;
}

/** The ornament's two layers (image behind, overlay on top); used on the name bubble and in the shop preview. */
export const ShopOrnamentLayers: FC<{ ornament: IShopOrnamentVisual, baseUrl: string }> = ({ ornament, baseUrl }) =>
{
    if(!ornament || (!ornament.image && !ornament.overlay)) return null;

    const size = { width: ornament.width || 97, height: ornament.height || 80 };

    return (
        <>
            { ornament.image && <img className="shop-name-ornament" src={ (baseUrl || '') + ornament.image } alt="" aria-hidden="true" draggable={ false } style={ size } /> }
            { ornament.overlay && <div className="shop-name-ornament-overlay" aria-hidden="true" style={ { ...size, backgroundImage: `url(${ (baseUrl || '') + ornament.overlay })` } } /> }
        </>
    );
}
