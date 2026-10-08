import { IMessageComposer, IMessageDataWrapper, IMessageParser, MessageEvent } from '@nitrots/nitro-renderer';
import { GetConnection } from '../nitro';

const IncomingHeaders = { VIDEO_TV_STATE: 9674, VIDEO_TV_TYPES: 9675 };
const OutgoingHeaders = { VIDEO_TV_SET_URLS: 9671, VIDEO_TV_CONTROL: 9672, VIDEO_TV_REQUEST: 9673 };

let registered = false;

export const RegisterVideoTvMessages = () =>
{
    if(registered) return;

    const connection = GetConnection();

    if(!connection) return;

    connection.registerMessages({
        events: new Map<number, Function>([ [ IncomingHeaders.VIDEO_TV_STATE, VideoTvStateEvent ], [ IncomingHeaders.VIDEO_TV_TYPES, VideoTvTypesEvent ] ]),
        composers: new Map<number, Function>([ [ OutgoingHeaders.VIDEO_TV_SET_URLS, VideoTvSetUrlsComposer ], [ OutgoingHeaders.VIDEO_TV_CONTROL, VideoTvControlComposer ], [ OutgoingHeaders.VIDEO_TV_REQUEST, VideoTvRequestComposer ] ])
    });

    registered = true;
}

export class VideoTvSetUrlsComposer implements IMessageComposer<[ number, string ]>
{
    private _data: [ number, string ];

    constructor(itemId: number, urls: string) { this._data = [ itemId, urls ]; }

    public getMessageArray() { return this._data; }

    public dispose(): void { return; }
}

export type VideoTvAction = 'play' | 'pause' | 'stop' | 'next' | 'prev' | 'select' | 'ended';

export class VideoTvControlComposer implements IMessageComposer<[ number, string, number ]>
{
    private _data: [ number, string, number ];

    constructor(itemId: number, action: VideoTvAction, index: number = 0) { this._data = [ itemId, action, index ]; }

    public getMessageArray() { return this._data; }

    public dispose(): void { return; }
}

export class VideoTvRequestComposer implements IMessageComposer<[ number ]>
{
    private _data: [ number ];

    constructor(itemId: number) { this._data = [ itemId ]; }

    public getMessageArray() { return this._data; }

    public dispose(): void { return; }
}

export const VIDEO_TV_STOPPED = 0;
export const VIDEO_TV_PLAYING = 1;
export const VIDEO_TV_PAUSED = 2;

export interface IVideoTvState
{
    itemId: number;
    urls: string[];
    track: number;
    state: number;
    positionMs: number;
    canControl: boolean;
    receivedAt: number;
}

export class VideoTvStateParser implements IMessageParser
{
    public tv: IVideoTvState = null;

    public flush(): boolean
    {
        this.tv = null;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        const itemId = wrapper.readInt();
        const urls = wrapper.readString().split('\n').filter(url => url.length);

        this.tv = { itemId, urls, track: wrapper.readInt(), state: wrapper.readInt(), positionMs: wrapper.readInt(), canControl: wrapper.readBoolean(), receivedAt: Date.now() };

        return true;
    }
}

export class VideoTvStateEvent extends MessageEvent
{
    constructor(callBack: Function) { super(callBack, VideoTvStateParser); }

    public getParser(): VideoTvStateParser { return this.parser as VideoTvStateParser; }
}

export interface IVideoTvScreen
{
    x: number;
    y: number;
    width: number;
    height: number;
    slant: number;
}

export class VideoTvTypesParser implements IMessageParser
{
    public types: Map<string, Map<number, IVideoTvScreen>> = new Map();

    public flush(): boolean
    {
        this.types = new Map();

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        let count = wrapper.readInt();

        while(count-- > 0)
        {
            const name = wrapper.readString();
            const screens = new Map<number, IVideoTvScreen>();

            for(const part of wrapper.readString().split(';'))
            {
                const [ direction, values ] = part.split(':');
                const [ x, y, width, height, slant ] = (values || '').split(',').map(value => parseInt(value));

                if(!isNaN(height)) screens.set(parseInt(direction), { x, y, width, height, slant: slant || 0 });
            }

            this.types.set(name, screens);
        }

        return true;
    }
}

export class VideoTvTypesEvent extends MessageEvent
{
    constructor(callBack: Function) { super(callBack, VideoTvTypesParser); }

    public getParser(): VideoTvTypesParser { return this.parser as VideoTvTypesParser; }
}

let VIDEO_TV_TYPES: Map<string, Map<number, IVideoTvScreen>> = new Map();

export const SetVideoTvTypes = (types: Map<string, Map<number, IVideoTvScreen>>) => (VIDEO_TV_TYPES = types);

export const VideoTvTypeName = (type: string) => (type || '').split('*')[0];

export const IsVideoTvType = (type: string) => VIDEO_TV_TYPES.has(VideoTvTypeName(type));

export const GetVideoTvScreen = (type: string, direction: number) =>
{
    const screens = VIDEO_TV_TYPES.get(VideoTvTypeName(type));

    if(!screens || !screens.size) return null;

    return screens.get(direction) ?? screens.values().next().value;
}

const YOUTUBE_ID = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|shorts\/|live\/|v\/|watch\?.*?v=))([A-Za-z0-9_-]{11})/i;

export const VideoTvYoutubeId = (url: string) =>
{
    const match = (url || '').match(YOUTUBE_ID);

    if(match) return match[1];

    return /^[A-Za-z0-9_-]{11}$/.test((url || '').trim()) ? url.trim() : null;
}
