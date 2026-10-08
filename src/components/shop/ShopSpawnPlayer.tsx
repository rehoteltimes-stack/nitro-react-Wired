import { RoomEngineObjectEvent, RoomObjectCategory, RoomSessionEvent } from '@nitrots/nitro-renderer';
import { FC, useEffect, useRef, useState } from 'react';
import { GetRoomObjectScreenLocation, GetRoomSession, SendMessageComposer } from '../../api';
import { IShopSpawnPlay, RegisterShopMessages, ShopSpawnComposer, ShopSpawnPlayEvent } from '../../api/shop/ShopProtocol';
import { useMessageEvent, useRoomEngineEvent, useRoomSessionManagerEvent } from '../../hooks';
import { ShopSpawnAnimation } from './ShopSpawnAnimation';

// Always mounted: plays spawn animations in the room. When the player's own avatar arrives in a room it asks the server
// to play their spawn (the server checks what is equipped and broadcasts it to everyone in the room); every broadcast
// is drawn over that avatar, following it on screen until the last frame.

interface Playing extends IShopSpawnPlay { key: number }

let counter = 0;

const SpawnOverlay: FC<{ play: Playing, onDone: (key: number) => void }> = ({ play, onDone }) =>
{
    const [ position, setPosition ] = useState<{ x: number, y: number }>(null);

    useEffect(() =>
    {
        let frame = 0;

        const follow = () =>
        {
            const point = GetRoomObjectScreenLocation(play.roomId, play.unitId, RoomObjectCategory.UNIT);

            if(point) setPosition(previous => (previous && previous.x === point.x && previous.y === point.y) ? previous : { x: point.x, y: point.y });

            frame = requestAnimationFrame(follow);
        }

        follow();

        return () => cancelAnimationFrame(frame);
    }, [ play.roomId, play.unitId ]);

    if(!position) return null;

    const width = play.spawn.frameWidth * play.spawn.scale;
    const height = play.spawn.frameHeight * play.spawn.scale;

    return <ShopSpawnAnimation className="shop-room-spawn" pattern={ play.framesUrl } spawn={ play.spawn } onDone={ () => onDone(play.key) }
        style={ { left: position.x - (width / 2) + play.spawn.offsetX, top: position.y - (height / 2) + play.spawn.offsetY } } />;
}

export const ShopSpawnPlayer: FC<{}> = props =>
{
    RegisterShopMessages();

    const [ playing, setPlaying ] = useState<Playing[]>([]);
    const askedFor = useRef<string>(null);

    // own avatar added to a room -> ask for the entry animation (once per room visit)
    // The renderer fires ADDED inside addRoomObjectUser, before setRoomSessionOwnUser has stored which unit is ours
    // (RoomMessageHandler), so ownRoomIndex is still -1 / the previous room's index at that moment: check a bit later.
    useRoomEngineEvent<RoomEngineObjectEvent>(RoomEngineObjectEvent.ADDED, event =>
    {
        if(event.category !== RoomObjectCategory.UNIT) return;

        const roomId = event.roomId;
        const objectId = event.objectId;

        setTimeout(() =>
        {
            const session = GetRoomSession();

            if(!session || (session.roomId !== roomId) || (objectId !== session.ownRoomIndex)) return;

            const visit = roomId + ':' + objectId;

            if(askedFor.current === visit) return;

            askedFor.current = visit;
            SendMessageComposer(new ShopSpawnComposer(true));
        }, 300);
    });

    // a new visit (even to the same room) may play the entry animation again
    useRoomSessionManagerEvent<RoomSessionEvent>(RoomSessionEvent.ENDED, event => (askedFor.current = null));

    useMessageEvent<ShopSpawnPlayEvent>(ShopSpawnPlayEvent, event =>
    {
        const data = event.getParser().data;
        const session = GetRoomSession();

        if(!data || !data.spawn || !session || (data.roomId !== session.roomId)) return;

        setPlaying(list => [ ...list.filter(item => item.unitId !== data.unitId), { ...data, key: ++counter } ]);
    });

    // leaving the room ends whatever was playing
    useEffect(() =>
    {
        const timer = setInterval(() =>
        {
            const session = GetRoomSession();

            setPlaying(list => (list.length && (!session || list.some(item => item.roomId !== session.roomId))) ? list.filter(item => session && item.roomId === session.roomId) : list);
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    if(!playing.length) return null;

    return (
        <div className="shop-room-spawns">
            { playing.map(play => <SpawnOverlay key={ play.key } play={ play } onDone={ key => setPlaying(list => list.filter(item => item.key !== key)) } />) }
        </div>
    );
}
