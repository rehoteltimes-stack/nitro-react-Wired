import { RoomEngineObjectEvent, RoomObjectCategory, RoomSessionEvent } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { GetRoomSession, SendMessageComposer } from '../../api';
import { CasinoActionComposer, CasinoDealersEvent, ICasinoDealer, RegisterCasinoMessages } from '../../api/games/CasinoProtocol';
import { GetCurrencyIconUrl } from '../../api/purse/SeasonCurrency';
import { useMessageEvent, useRoomEngineEvent, useRoomSessionManagerEvent } from '../../hooks';
import { RANCH_COLORS, RanchCounterFx } from '../ranch/RanchFx';
import { RanchAnchorView } from '../ranch/RanchPlayersView';

const DIAMONDS = 5;
const EMERALDS = 101;

const GAME_NAMES: Record<string, string> = { hl: 'High/Low', highlow: 'High/Low', tri: 'Tri', poker: 'Poker', '21': '21', '13': '13' };

export const CasinoDealersView: FC<{}> = props =>
{
    RegisterCasinoMessages();

    const [ dealers, setDealers ] = useState<ICasinoDealer[]>([]);
    const [ hoveredAvatars, setHoveredAvatars ] = useState<number[]>([]);
    const [ hoveredStacks, setHoveredStacks ] = useState<number[]>([]);

    useMessageEvent<CasinoDealersEvent>(CasinoDealersEvent, event => setDealers(event.getParser().dealers));

    useRoomSessionManagerEvent<RoomSessionEvent>([ RoomSessionEvent.CREATED, RoomSessionEvent.ENDED ], () =>
    {
        setDealers([]);
        setHoveredAvatars([]);
        setHoveredStacks([]);
    });

    useEffect(() =>
    {
        if(GetRoomSession()) SendMessageComposer(new CasinoActionComposer('dealers'));
    }, []);

    useRoomSessionManagerEvent<RoomSessionEvent>(RoomSessionEvent.STARTED, () =>
    {
        setTimeout(() => SendMessageComposer(new CasinoActionComposer('dealers')), 1500);
    });

    useRoomEngineEvent<RoomEngineObjectEvent>([ RoomEngineObjectEvent.MOUSE_ENTER, RoomEngineObjectEvent.MOUSE_LEAVE, RoomEngineObjectEvent.REMOVED ], event =>
    {
        if(event.category !== RoomObjectCategory.UNIT) return;

        if(event.type === RoomEngineObjectEvent.REMOVED)
        {
            setDealers(previous => previous.filter(dealer => dealer.roomIndex !== event.objectId));
            setHoveredAvatars(previous => previous.filter(index => index !== event.objectId));
            setHoveredStacks(previous => previous.filter(index => index !== event.objectId));

            return;
        }

        setHoveredAvatars(previous => (event.type === RoomEngineObjectEvent.MOUSE_ENTER) ? [ event.objectId ] : previous.filter(index => index !== event.objectId));
    });

    useEffect(() =>
    {
        if(!hoveredAvatars.length) return;

        const onMove = (event: MouseEvent) =>
        {
            const target = event.target as HTMLElement;

            if((target?.tagName === 'CANVAS') || target?.closest?.('.casino-dealer-stack')) return;

            setHoveredAvatars([]);
        };

        document.addEventListener('mousemove', onMove);

        return () => document.removeEventListener('mousemove', onMove);
    }, [ hoveredAvatars ]);

    const hoverStack = (roomIndex: number, isHovered: boolean) => setHoveredStacks(previous => isHovered ? (previous.includes(roomIndex) ? previous : [ ...previous, roomIndex ]) : previous.filter(index => index !== roomIndex));

    if(!dealers.length || !GetRoomSession()) return null;

    return (
        <>
            { dealers.map(dealer =>
            {
                const open = hoveredAvatars.includes(dealer.roomIndex) || hoveredStacks.includes(dealer.roomIndex);
                const active = dealer.active;

                return (
                    <RanchAnchorView key={ dealer.roomIndex } roomIndex={ dealer.roomIndex }>
                        <div className="ranch-badge-stack casino-dealer-stack" onMouseEnter={ () => hoverStack(dealer.roomIndex, true) } onMouseLeave={ () => hoverStack(dealer.roomIndex, false) }>
                            <div className="casino-dealer-label">{ active ? `${ GAME_NAMES[active.game] ?? active.game } · ${ active.player }` : 'Casino' }</div>
                            { active && <RanchCounterFx icon={ GetCurrencyIconUrl(active.currency) } value={ active.stake } color={ (active.currency === DIAMONDS) ? RANCH_COLORS.timeleft : RANCH_COLORS.emerald } /> }
                            { open && <RanchCounterFx icon={ GetCurrencyIconUrl(DIAMONDS) } value={ dealer.diamonds } color={ RANCH_COLORS.timeleft } /> }
                            { open && <RanchCounterFx icon={ GetCurrencyIconUrl(EMERALDS) } value={ dealer.emeralds } color={ RANCH_COLORS.emerald } /> }
                        </div>
                    </RanchAnchorView>
                );
            }) }
        </>
    );
}
