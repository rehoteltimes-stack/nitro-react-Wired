import { IMessageDataWrapper, IMessageParser, MessageEvent } from '@nitrots/nitro-renderer';
import { GetConnection } from '../nitro';

const IncomingHeaders = { HOTEL_ALERT_CARD: 9678 };

let registered = false;

export const RegisterHotelAlertCardMessages = () =>
{
    if(registered) return;

    const connection = GetConnection();

    if(!connection) return;

    connection.registerMessages({
        events: new Map<number, Function>([ [ IncomingHeaders.HOTEL_ALERT_CARD, HotelAlertCardEvent ] ]),
        composers: new Map<number, Function>()
    });

    registered = true;
}

export interface IHotelAlertCard
{
    id: number;
    sender: string;
    figure: string;
    message: string;
    roomId: number;
    roomName: string;
}

let nextCardId = 1;

export class HotelAlertCardParser implements IMessageParser
{
    public card: IHotelAlertCard = null;

    public flush(): boolean
    {
        this.card = null;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this.card = {
            id: nextCardId++,
            sender: wrapper.readString(),
            figure: wrapper.readString(),
            message: wrapper.readString(),
            roomId: wrapper.readInt(),
            roomName: wrapper.readString()
        };

        return true;
    }
}

export class HotelAlertCardEvent extends MessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, HotelAlertCardParser);
    }

    public getParser(): HotelAlertCardParser
    {
        return this.parser as HotelAlertCardParser;
    }
}
