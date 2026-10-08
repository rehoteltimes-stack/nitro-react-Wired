import { RoomEngineObjectEvent, RoomObjectCategory } from '@nitrots/nitro-renderer';
import { FC, useEffect, useRef } from 'react';
import { GetRoomSession, SendMessageComposer } from '../../api';
import { ApplyUnitAura, InstallShopAuras } from '../../api/shop/ShopAuras';
import { RegisterShopMessages, ShopRoomAurasComposer, ShopRoomAurasEvent, ShopUnitAuraEvent } from '../../api/shop/ShopProtocol';
import { useMessageEvent, useRoomEngineEvent } from '../../hooks';

// Always mounted (renders nothing): keeps the auras of the avatars in the current room in sync. Whenever avatars are
// added to the room it asks the server for the room's auras (once, after a short pause, however many were added), and
// applies changes the server pushes when someone puts an aura on or takes it off.

export const ShopAuraSync: FC<{}> = props =>
{
    RegisterShopMessages();

    const timer = useRef<ReturnType<typeof setTimeout>>(null);

    useEffect(() =>
    {
        InstallShopAuras();

        return () => { if(timer.current) clearTimeout(timer.current); };
    }, []);

    useRoomEngineEvent<RoomEngineObjectEvent>(RoomEngineObjectEvent.ADDED, event =>
    {
        if(event.category !== RoomObjectCategory.UNIT) return;

        if(timer.current) clearTimeout(timer.current);

        timer.current = setTimeout(() =>
        {
            timer.current = null;

            if(GetRoomSession()) SendMessageComposer(new ShopRoomAurasComposer());
        }, 400);
    });

    useMessageEvent<ShopRoomAurasEvent>(ShopRoomAurasEvent, event =>
    {
        const data = event.getParser().data;
        const session = GetRoomSession();

        if(!data || !session || (data.roomId !== session.roomId)) return;

        for(const unit of (data.units || [])) ApplyUnitAura(session.roomId, unit.unitId, unit.aura);
    });

    useMessageEvent<ShopUnitAuraEvent>(ShopUnitAuraEvent, event =>
    {
        const data = event.getParser().data;
        const session = GetRoomSession();

        if(!data || !session) return;

        ApplyUnitAura(session.roomId, data.unitId, data.aura);
    });

    return null;
}
