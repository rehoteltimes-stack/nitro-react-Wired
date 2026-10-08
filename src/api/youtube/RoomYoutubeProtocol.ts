import { IMessageComposer, IMessageDataWrapper, IMessageParser, MessageEvent } from '@nitrots/nitro-renderer';
import { GetConnection } from '../nitro';

const IncomingHeaders = { ROOM_YOUTUBE_STATE: 9651 };
const OutgoingHeaders = { ROOM_YOUTUBE_CONTROL: 9650 };

let registered = false;

export const RegisterRoomYoutubeMessages = () =>
{
    if(registered) return;

    const connection = GetConnection();

    if(!connection) return;

    connection.registerMessages({
        events: new Map<number, Function>([ [ IncomingHeaders.ROOM_YOUTUBE_STATE, RoomYoutubeStateEvent ] ]),
        composers: new Map<number, Function>([ [ OutgoingHeaders.ROOM_YOUTUBE_CONTROL, RoomYoutubeControlComposer ] ])
    });

    registered = true;
}

export class RoomYoutubeControlComposer implements IMessageComposer<[ string, number ]>
{
    private _data: [ string, number ];

    constructor(action: 'pause' | 'resume' | 'seek' | 'stop', seconds: number) { this._data = [ action, Math.max(0, Math.floor(seconds)) ]; }

    public getMessageArray() { return this._data; }

    public dispose(): void { return; }
}

export interface IRoomYoutubeState
{
    videoId: string;
    position: number;
    paused: boolean;
    by: string;
    roomWide: boolean;
    canControl: boolean;
    receivedAt: number;
}

export class RoomYoutubeStateParser implements IMessageParser
{
    public state: IRoomYoutubeState = null;

    public flush(): boolean
    {
        this.state = null;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this.state = {
            videoId: wrapper.readString(),
            position: wrapper.readInt(),
            paused: wrapper.readBoolean(),
            by: wrapper.readString(),
            roomWide: wrapper.readBoolean(),
            canControl: wrapper.readBoolean(),
            receivedAt: Date.now()
        };

        return true;
    }
}

export class RoomYoutubeStateEvent extends MessageEvent
{
    constructor(callBack: Function) { super(callBack, RoomYoutubeStateParser); }

    public getParser(): RoomYoutubeStateParser { return this.parser as RoomYoutubeStateParser; }
}
