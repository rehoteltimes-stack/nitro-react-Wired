import { IMessageComposer, IMessageDataWrapper, IMessageParser, MessageEvent } from '@nitrots/nitro-renderer';
import { GetConnection } from '../nitro';

const IncomingHeaders = { CREATOR_CONFIG: 9696, CREATOR_RESULT: 9698, CREATOR_LIST: 9700 };
const OutgoingHeaders = { CREATOR_CONFIG: 9695, CREATOR_CREATE: 9697, CREATOR_LIST: 9699, CREATOR_SEND_COPY: 9701 };

let registered = false;

export const RegisterCreatorMessages = () =>
{
    if(registered) return;

    const connection = GetConnection();

    if(!connection) return;

    connection.registerMessages({
        events: new Map<number, Function>([ [ IncomingHeaders.CREATOR_CONFIG, CreatorConfigEvent ], [ IncomingHeaders.CREATOR_RESULT, CreatorResultEvent ], [ IncomingHeaders.CREATOR_LIST, CreatorListEvent ] ]),
        composers: new Map<number, Function>([ [ OutgoingHeaders.CREATOR_CONFIG, CreatorConfigComposer ], [ OutgoingHeaders.CREATOR_CREATE, CreatorCreateComposer ], [ OutgoingHeaders.CREATOR_LIST, CreatorListComposer ], [ OutgoingHeaders.CREATOR_SEND_COPY, CreatorSendCopyComposer ] ])
    });

    registered = true;
}

export type CreatorType = 'badge' | 'banner';

export class CreatorConfigComposer implements IMessageComposer<[]>
{
    public getMessageArray(): [] { return []; }

    public dispose(): void { return; }
}

export class CreatorCreateComposer implements IMessageComposer<[ string, string, string, string, string ]>
{
    private _data: [ string, string, string, string, string ];

    constructor(type: CreatorType, friend: string, image: string, title: string, description: string) { this._data = [ type, friend, image, title, description ]; }

    public getMessageArray() { return this._data; }

    public dispose(): void { return; }
}

export class CreatorListComposer implements IMessageComposer<[]>
{
    public getMessageArray(): [] { return []; }

    public dispose(): void { return; }
}

export class CreatorSendCopyComposer implements IMessageComposer<[ number, string ]>
{
    private _data: [ number, string ];

    constructor(creationId: number, friend: string) { this._data = [ creationId, friend ]; }

    public getMessageArray() { return this._data; }

    public dispose(): void { return; }
}

export interface ICreation
{
    id: number;
    type: CreatorType;
    status: 'pending' | 'approved' | 'rejected';
    result: string;
    reason: string;
    createdAt: number;
    image: string;
    title: string;
    description: string;
}

export class CreatorListParser implements IMessageParser
{
    public creations: ICreation[] = [];

    public flush(): boolean
    {
        this.creations = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        let count = wrapper.readInt();

        while(count-- > 0)
        {
            this.creations.push({
                id: wrapper.readInt(),
                type: wrapper.readString() as CreatorType,
                status: wrapper.readString() as ICreation['status'],
                result: wrapper.readString(),
                reason: wrapper.readString(),
                createdAt: wrapper.readInt(),
                image: wrapper.readString(),
                title: wrapper.readString(),
                description: wrapper.readString()
            });
        }

        return true;
    }
}

export class CreatorListEvent extends MessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, CreatorListParser);
    }

    public getParser(): CreatorListParser
    {
        return this.parser as CreatorListParser;
    }
}

export interface ICreatorConfig
{
    enabled: boolean;
    badgePrice: number;
    bannerPrice: number;
    friendPrice: number;
    leftToday: number;
    pending: number;
}

export class CreatorConfigParser implements IMessageParser
{
    public config: ICreatorConfig = null;

    public flush(): boolean
    {
        this.config = null;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this.config = {
            enabled: wrapper.readBoolean(),
            badgePrice: wrapper.readInt(),
            bannerPrice: wrapper.readInt(),
            friendPrice: wrapper.readInt(),
            leftToday: wrapper.readInt(),
            pending: wrapper.readInt()
        };

        return true;
    }
}

export class CreatorResultParser implements IMessageParser
{
    public ok: boolean = false;
    public message: string = '';

    public flush(): boolean
    {
        this.ok = false;
        this.message = '';

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this.ok = wrapper.readBoolean();
        this.message = wrapper.readString();

        return true;
    }
}

export class CreatorConfigEvent extends MessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, CreatorConfigParser);
    }

    public getParser(): CreatorConfigParser
    {
        return this.parser as CreatorConfigParser;
    }
}

export class CreatorResultEvent extends MessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, CreatorResultParser);
    }

    public getParser(): CreatorResultParser
    {
        return this.parser as CreatorResultParser;
    }
}
