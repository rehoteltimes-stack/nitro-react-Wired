import { useEffect, useState } from 'react';
import { useBetween } from 'use-between';
import { RareLevelsDataEvent, RareLevelsRequestComposer, RareRoomDataEvent, RareRoomRequestComposer, RegisterRarityMessages, SendMessageComposer } from '../../../api';
import { useMessageEvent } from '../../events';

export interface RareRoom
{
    roomId: number;
    roomName: string;
}

// sprite id -> rarity tier code (hCMS rare economy), and the "an open room that has this rare" answers.
const useRareLevelsState = () =>
{
    // Registration must run before the useMessageEvent subscriptions below (same ordering rule as every other
    // custom protocol here): synchronously in the hook body.
    RegisterRarityMessages();

    const [ levels, setLevels ] = useState<Map<number, string>>(new Map());
    const [ rooms, setRooms ] = useState<Map<number, RareRoom>>(new Map());


    useMessageEvent<RareLevelsDataEvent>(RareLevelsDataEvent, event => setLevels(event.getParser().levels));

    useMessageEvent<RareRoomDataEvent>(RareRoomDataEvent, event =>
    {
        const parser = event.getParser();

        setRooms(prevValue =>
        {
            const newValue = new Map(prevValue);

            newValue.set(parser.spriteId, ((parser.roomId > 0) ? { roomId: parser.roomId, roomName: parser.roomName } : null));

            return newValue;
        });
    });

    useEffect(() =>
    {
        SendMessageComposer(new RareLevelsRequestComposer());
    }, []);

    const requestRoom = (spriteId: number) => SendMessageComposer(new RareRoomRequestComposer(spriteId));

    return { levels, rooms, requestRoom };
}

export const useRareLevels = () => useBetween(useRareLevelsState);
