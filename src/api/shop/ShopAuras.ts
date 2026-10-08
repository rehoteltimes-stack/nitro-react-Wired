import { AvatarAuraRegistry, IAvatarAuraProvider, RoomObjectVariable } from '@nitrots/nitro-renderer';
import { GetRoomEngine } from '../nitro';
import { AuraFilter } from './AuraFilter';
import { IShopAuraVisual } from './ShopProtocol';

// Aura drawing for the hCMS Shop: remembers every aura's visual settings (from the shop data or the room packets) and
// hands the renderer's aura hook (AvatarAuraRegistry) a filter for it. One filter per aura and zoom, so a small avatar
// in the room and a big one in a shop preview never share (and fight over) the same uniforms.

const visuals = new Map<number, IShopAuraVisual>();
const filters = new Map<string, AuraFilter>();

const sameVisual = (a: IShopAuraVisual, b: IShopAuraVisual) => a && b && (a.effect === b.effect) && (a.colorA === b.colorA) && (a.colorB === b.colorB) && (a.speed === b.speed) && (a.intensity === b.intensity);

export const RememberAuraVisual = (visual: IShopAuraVisual) =>
{
    if(!visual || !visual.id) return;

    const known = visuals.get(visual.id);

    if(known && sameVisual(known, visual)) return;

    visuals.set(visual.id, visual);

    // an edited aura (colours, effect...) gets new filters
    for(const key of [ ...filters.keys() ]) if(key.startsWith(visual.id + ':')) filters.delete(key);
}

const provider: IAvatarAuraProvider = {
    getFilters: (auraId: number, time: number, scale: number) =>
    {
        const visual = visuals.get(auraId);

        if(!visual) return null;

        const key = auraId + ':' + ((scale < 48) ? 'small' : 'big');
        let filter = filters.get(key);

        if(!filter)
        {
            filter = new AuraFilter(visual);
            filters.set(key, filter);
        }

        filter.tick(time, scale);

        return [ filter ];
    },
    isAnimated: (auraId: number) => visuals.has(auraId)
};

export const InstallShopAuras = () =>
{
    if(AvatarAuraRegistry.provider !== provider) AvatarAuraRegistry.provider = provider;
}

/** Puts an aura on (or takes it off) a room unit. */
export const ApplyUnitAura = (roomId: number, unitId: number, visual: IShopAuraVisual | null) =>
{
    if(visual) RememberAuraVisual(visual);

    GetRoomEngine().updateRoomObjectUserAction(roomId, unitId, RoomObjectVariable.FIGURE_AURA, (visual ? visual.id : 0));
}
