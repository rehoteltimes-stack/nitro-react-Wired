import { RoomEngineObjectEvent, RoomObjectCategory, RoomSessionEvent } from '@nitrots/nitro-renderer';
import { useState } from 'react';
import { useBetween } from 'use-between';
import { GetRoomEngine, GetRoomSession, SendMessageComposer } from '../../api';
import { IsVideoTvType, IVideoTvState, RegisterVideoTvMessages, SetVideoTvTypes, VideoTvControlComposer, VideoTvRequestComposer, VideoTvSetUrlsComposer, VideoTvStateEvent, VideoTvTypesEvent } from '../../api/videotv/VideoTvProtocol';
import { useMessageEvent, useRoomEngineEvent, useRoomSessionManagerEvent } from '../events';

export interface IVideoTvAudio
{
    muted: boolean;
    volume: number;
}

const VOLUME_KEY = 'hcms.videotv.volume';
const VOLUME_STEP = 10;

const storedVolume = () =>
{
    try
    {
        const value = parseInt(window.localStorage.getItem(VOLUME_KEY));

        return isNaN(value) ? 60 : Math.max(0, Math.min(100, value));
    }
    catch
    {
        return 60;
    }
}

const storeVolume = (volume: number) =>
{
    try
    {
        window.localStorage.setItem(VOLUME_KEY, String(volume));
    }
    catch
    {
        return;
    }
}

const requestRoomTvs = () =>
{
    const session = GetRoomSession();

    if(!session) return;

    for(const category of [ RoomObjectCategory.FLOOR, RoomObjectCategory.WALL ])
    {
        for(const roomObject of GetRoomEngine().getRoomObjects(session.roomId, category))
        {
            if(roomObject && IsVideoTvType(roomObject.type)) SendMessageComposer(new VideoTvRequestComposer(roomObject.id));
        }
    }
}

const useVideoTvState = () =>
{
    RegisterVideoTvMessages();

    const [ tvs, setTvs ] = useState<Map<number, IVideoTvState>>(new Map());
    const [ audio, setAudio ] = useState<Map<number, IVideoTvAudio>>(new Map());
    const [ fullscreenId, setFullscreenId ] = useState(-1);
    const [ typesVersion, setTypesVersion ] = useState(0);

    useMessageEvent<VideoTvTypesEvent>(VideoTvTypesEvent, event =>
    {
        SetVideoTvTypes(event.getParser().types);
        setTypesVersion(value => value + 1);
        requestRoomTvs();
    });

    useMessageEvent<VideoTvStateEvent>(VideoTvStateEvent, event =>
    {
        const tv = event.getParser().tv;

        if(!tv) return;

        setTvs(previous => new Map(previous).set(tv.itemId, tv));
    });

    useRoomEngineEvent<RoomEngineObjectEvent>([ RoomEngineObjectEvent.ADDED, RoomEngineObjectEvent.REMOVED ], event =>
    {
        if((event.category !== RoomObjectCategory.FLOOR) && (event.category !== RoomObjectCategory.WALL)) return;

        if(event.type === RoomEngineObjectEvent.REMOVED)
        {
            setTvs(previous =>
            {
                if(!previous.has(event.objectId)) return previous;

                const next = new Map(previous);

                next.delete(event.objectId);

                return next;
            });
            setFullscreenId(previous => (previous === event.objectId) ? -1 : previous);

            return;
        }

        const roomObject = GetRoomEngine().getRoomObject(event.roomId, event.objectId, event.category);

        if(roomObject && IsVideoTvType(roomObject.type)) SendMessageComposer(new VideoTvRequestComposer(event.objectId));
    });

    useRoomSessionManagerEvent<RoomSessionEvent>(RoomSessionEvent.ENDED, () =>
    {
        setTvs(new Map());
        setFullscreenId(-1);
    });

    const audioOf = (itemId: number): IVideoTvAudio => audio.get(itemId) ?? { muted: true, volume: storedVolume() };

    const changeAudio = (itemId: number, change: (current: IVideoTvAudio) => IVideoTvAudio) =>
    {
        setAudio(previous =>
        {
            const next = change(previous.get(itemId) ?? { muted: true, volume: storedVolume() });

            storeVolume(next.volume);

            return new Map(previous).set(itemId, next);
        });
    }

    const toggleMute = (itemId: number) => changeAudio(itemId, current => ({ ...current, muted: !current.muted }));

    const volumeUp = (itemId: number) => changeAudio(itemId, current => ({ muted: false, volume: Math.min(100, current.volume + VOLUME_STEP) }));

    const volumeDown = (itemId: number) => changeAudio(itemId, current => ({ ...current, volume: Math.max(0, current.volume - VOLUME_STEP) }));

    const saveUrls = (itemId: number, urls: string) => SendMessageComposer(new VideoTvSetUrlsComposer(itemId, urls));

    const control = (itemId: number, action: 'play' | 'pause' | 'stop' | 'next' | 'prev' | 'select' | 'ended', index: number = 0) => SendMessageComposer(new VideoTvControlComposer(itemId, action, index));

    return { tvs, typesVersion, fullscreenId, setFullscreenId, audioOf, toggleMute, volumeUp, volumeDown, saveUrls, control };
}

export const useVideoTv = () => useBetween(useVideoTvState);
