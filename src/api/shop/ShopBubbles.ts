import { useEffect, useState } from 'react';

/**
 * Which chat bubbles are premium (sold in Presence) and which of them the player may use. Filled from the server's
 * reply about the player themself (ShopBubbleSync); the chat style picker hides premium bubbles the player doesn't own.
 * The server checks it too (ShopBubbleGuard): an unowned premium bubble is sent as the normal one.
 */
let premium = new Set<number>();
let owned = new Set<number>();
const listeners = new Set<() => void>();

export const SetShopBubbleAccess = (premiumIds: number[], ownedIds: number[]) =>
{
    premium = new Set(premiumIds || []);
    owned = new Set(ownedIds || []);
    listeners.forEach(listener => listener());
}

/** false only for a premium bubble the player doesn't own. */
export const CanUseChatBubble = (styleId: number) => (!premium.has(styleId) || owned.has(styleId));

export const useShopBubbleAccess = () =>
{
    const [ , setVersion ] = useState(0);

    useEffect(() =>
    {
        const listener = () => setVersion(value => value + 1);

        listeners.add(listener);

        return () => { listeners.delete(listener); };
    }, []);

    return { canUse: CanUseChatBubble, isPremium: (styleId: number) => premium.has(styleId) };
}
