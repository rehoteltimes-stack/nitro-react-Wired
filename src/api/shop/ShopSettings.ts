import { useEffect, useState } from 'react';
import { SendMessageComposer } from '../nitro';
import { ShopSettingComposer } from './ShopProtocol';

/**
 * The player's own Presence on/off settings (hide_auras, hide_ornaments, hide_spawns, no_entry_spawn), filled from the
 * server's reply about the player themself (ShopBubbleSync). The chat commands (:noaura, :noornaments, ...) and the
 * Settings window both change them through the same server setting, so they always agree.
 */
let settings: Record<string, boolean> = {};
const listeners = new Set<() => void>();

export const SetShopSettings = (value: Record<string, boolean>) =>
{
    settings = { ...(value || {}) };
    listeners.forEach(listener => listener());
}

export const useShopSettings = () =>
{
    const [ , setVersion ] = useState(0);

    useEffect(() =>
    {
        const listener = () => setVersion(value => value + 1);

        listeners.add(listener);

        return () => { listeners.delete(listener); };
    }, []);

    const set = (key: string, on: boolean) =>
    {
        settings = { ...settings, [key]: on };
        listeners.forEach(listener => listener());
        SendMessageComposer(new ShopSettingComposer(key, on ? 1 : 0));
    }

    return { settings, set };
}
