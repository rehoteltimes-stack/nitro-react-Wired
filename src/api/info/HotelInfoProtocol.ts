import { IMessageDataWrapper, IMessageParser, MessageEvent } from '@nitrots/nitro-renderer';
import { GetConnection } from '../nitro';

const IncomingHeaders = { HOTEL_INFO: 9652, HOTEL_PLUGINS: 9657 };

let registered = false;

export const RegisterHotelInfoMessages = () =>
{
    if(registered) return;

    const connection = GetConnection();

    if(!connection) return;

    connection.registerMessages({
        events: new Map<number, Function>([ [ IncomingHeaders.HOTEL_INFO, HotelInfoEvent ], [ IncomingHeaders.HOTEL_PLUGINS, HotelPluginsEvent ] ]),
        composers: new Map<number, Function>()
    });

    registered = true;
}

export interface IHotelInfo
{
    name: string;
    version: string;
    engine: string;
    licensee: string;
    copyright: string;
    uptime: number;
    online: number;
    rooms: number;
    total: number;
    today: number;
}

export class HotelInfoParser implements IMessageParser
{
    public info: IHotelInfo = null;

    public flush(): boolean
    {
        this.info = null;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this.info = {
            name: wrapper.readString(),
            version: wrapper.readString(),
            engine: wrapper.readString(),
            licensee: wrapper.readString(),
            copyright: wrapper.readString(),
            uptime: wrapper.readInt(),
            online: wrapper.readInt(),
            rooms: wrapper.readInt(),
            total: wrapper.readInt(),
            today: wrapper.readInt()
        };

        return true;
    }
}

export class HotelInfoEvent extends MessageEvent
{
    constructor(callBack: Function) { super(callBack, HotelInfoParser); }

    public getParser(): HotelInfoParser { return this.parser as HotelInfoParser; }
}

export interface IHotelPlugins
{
    name: string;
    plugins: { name: string, author: string }[];
}

export class HotelPluginsParser implements IMessageParser
{
    public list: IHotelPlugins = null;

    public flush(): boolean
    {
        this.list = null;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        const name = wrapper.readString();
        const plugins: { name: string, author: string }[] = [];
        let count = wrapper.readInt();

        while(count-- > 0) plugins.push({ name: wrapper.readString(), author: wrapper.readString() });

        this.list = { name, plugins };

        return true;
    }
}

export class HotelPluginsEvent extends MessageEvent
{
    constructor(callBack: Function) { super(callBack, HotelPluginsParser); }

    public getParser(): HotelPluginsParser { return this.parser as HotelPluginsParser; }
}
