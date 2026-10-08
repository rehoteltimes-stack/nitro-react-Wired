import { RoomObjectCategory, RoomUnitWalkComposer } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { GetRoomEngine, GetRoomSession, SendMessageComposer } from '../../../../api';
import { IsArrowWalkEnabled, OnArrowWalkChange } from '../../../../api/room/ArrowWalkSettings';

const STEPS: Record<string, [ number, number ]> = {
    ArrowUp: [ -1, -1 ],
    ArrowDown: [ 1, 1 ],
    ArrowLeft: [ -1, 1 ],
    ArrowRight: [ 1, -1 ]
};

const MIN_GAP_MS = 120;

const isTyping = (target: EventTarget) =>
{
    const element = target as HTMLElement;

    if(!element) return false;

    if(element.isContentEditable) return true;

    if((element.tagName === 'INPUT') || (element.tagName === 'TEXTAREA')) return !!(element as HTMLInputElement).value;

    return (element.tagName === 'SELECT');
}

export const ArrowWalkView: FC<{}> = props =>
{
    const [ enabled, setEnabled ] = useState(IsArrowWalkEnabled());

    useEffect(() => OnArrowWalkChange(setEnabled), []);

    useEffect(() =>
    {
        if(!enabled) return;

        let last = 0;

        const onKeyDown = (event: KeyboardEvent) =>
        {
            const step = STEPS[event.key];

            if(!step || event.altKey || event.ctrlKey || event.metaKey || isTyping(event.target)) return;

            const roomSession = GetRoomSession();

            if(!roomSession || (roomSession.ownRoomIndex < 0)) return;

            const avatar = GetRoomEngine().getRoomObject(roomSession.roomId, roomSession.ownRoomIndex, RoomObjectCategory.UNIT);

            if(!avatar) return;

            event.preventDefault();

            const now = Date.now();

            if((now - last) < MIN_GAP_MS) return;

            last = now;

            const location = avatar.getLocation();

            SendMessageComposer(new RoomUnitWalkComposer(Math.round(location.x) + step[0], Math.round(location.y) + step[1]));
        }

        window.addEventListener('keydown', onKeyDown);

        return () => window.removeEventListener('keydown', onKeyDown);
    }, [ enabled ]);

    return null;
}
