import { GetTicker, RoomObjectCategory, RoomObjectVariable } from '@nitrots/nitro-renderer';
import { FC, ReactNode, useEffect, useRef } from 'react';
import { GetRoomEngine, GetRoomSession } from '../../api';
import { IRanchPlayer } from '../../api/games/RanchProtocol';
import { SetRanchStackTop } from '../../api/games/RanchStackTops';
import { RANCH_COLORS, RANCH_ICONS, RanchCounterFx, RanchLevelFx } from './RanchFx';

export interface IRanchFlash
{
    roomIndex: number;
    key: string;
    until: number;
}

const STACK_DEFAULT = [ 'level', 'gold', 'honor', 'corn', 'tomato', 'grapes', 'pumpkin', 'duckbergine' ];

const anchorOffset = (roomId: number, roomIndex: number) =>
{
    const scale = GetRoomEngine().getRoomInstanceGeometry(roomId, 1)?.scale ?? 64;
    const small = (scale < 48);
    const height = small ? 32 : 64;
    const posture = GetRoomEngine().getRoomObject(roomId, roomIndex, RoomObjectCategory.UNIT)?.model?.getValue<string>(RoomObjectVariable.FIGURE_POSTURE);

    return (small ? -45 : -86) + ((posture === 'sit') ? (height / 2) : (posture === 'lay') ? height : 0);
}

export const RanchAnchorView: FC<{ roomIndex: number, children: ReactNode }> = props =>
{
    const { roomIndex, children } = props;
    const elementRef = useRef<HTMLDivElement>(null);

    useEffect(() =>
    {
        const update = () =>
        {
            const session = GetRoomSession();
            const element = elementRef.current;

            if(!session || !element) return;

            const point = GetRoomEngine().getRoomObjectScreenLocation(session.roomId, roomIndex, RoomObjectCategory.UNIT, 1);

            if(!point)
            {
                element.style.visibility = 'hidden';
                SetRanchStackTop(roomIndex, null);

                return;
            }

            const top = Math.round(point.y + anchorOffset(session.roomId, roomIndex) - element.offsetHeight);

            element.style.visibility = 'visible';
            element.style.left = `${ Math.round(point.x - (element.offsetWidth / 2)) }px`;
            element.style.top = `${ top }px`;
            SetRanchStackTop(roomIndex, top);
        }

        GetTicker().add(update);

        return () =>
        {
            GetTicker().remove(update);
            SetRanchStackTop(roomIndex, null);
        };
    }, [ roomIndex ]);

    return <div ref={ elementRef } className="nitro-ranch ranch-badge-anchor">{ children }</div>;
}

export const RanchPlayersView: FC<{ players: IRanchPlayer[], flashes: IRanchFlash[], hovered: number[], ownIndex: number, onHover: (roomIndex: number, hovered: boolean) => void, onOwnBadge: () => void }> = props =>
{
    const { players, flashes, hovered, ownIndex, onHover, onOwnBadge } = props;

    const counter = (player: IRanchPlayer, crop: string, show: boolean) => show && RANCH_ICONS[crop] && <RanchCounterFx key={ crop } icon={ RANCH_ICONS[crop] } value={ player.crops[crop] ?? 0 } color={ RANCH_COLORS.white } />;

    return (
        <>
            { players.map(player =>
            {
                const open = hovered.includes(player.roomIndex);
                const progress = (player.level >= player.maxLevel) ? 1 : Math.min(1, player.xpIntoLevel / Math.max(1, player.perLevel));
                const own = (player.roomIndex === ownIndex);
                const flashed = flashes.filter(flash => (flash.roomIndex === player.roomIndex));
                const shows = (key: string) => open || flashed.some(flash => (flash.key === key));

                return (
                    <RanchAnchorView key={ player.roomIndex } roomIndex={ player.roomIndex }>
                        <div className="ranch-badge-stack" onMouseEnter={ () => onHover(player.roomIndex, true) } onMouseLeave={ () => onHover(player.roomIndex, false) }>
                            { [ ...player.stackOrder.filter(key => STACK_DEFAULT.includes(key)), ...STACK_DEFAULT.filter(key => !player.stackOrder.includes(key)) ].map(key =>
                            {
                                if(key === 'level') return (
                                    <div key={ key } className={ 'ranch-level' + (own ? ' is-own' : '') } onClick={ () => own && onOwnBadge() }>
                                        <RanchLevelFx level={ player.level } maxLevel={ player.maxLevel } progress={ progress } />
                                    </div>);

                                if(key === 'gold') return shows(key) && <RanchCounterFx key={ key } icon={ RANCH_ICONS.gold } value={ player.balance } color={ RANCH_COLORS.gold } />;

                                if(key === 'honor') return shows(key) && <RanchCounterFx key={ key } icon={ RANCH_ICONS.honor } value={ player.tokens } color={ RANCH_COLORS.limeGreen } />;

                                return counter(player, key, shows(key));
                            }) }
                        </div>
                    </RanchAnchorView>
                );
            }) }
        </>
    );
}
