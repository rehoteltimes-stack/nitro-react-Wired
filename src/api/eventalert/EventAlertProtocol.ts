import { IMessageDataWrapper, IMessageParser, MessageEvent } from '@nitrots/nitro-renderer';
import { GetConnection } from '../nitro';

// The event alert card (HabboCity reference: the "alert-item" on the left side). The server sends one when someone hosts an event
// with :eha - see hcms-emulator-plugin's eventalert/EventAlertPacketComposer.java for the wire format.

const IncomingHeaders = {
    EVENT_ALERT: 9551
};

let registered = false;

export const RegisterEventAlertMessages = () =>
{
    if(registered) return;

    const connection = GetConnection();

    if(!connection) return;

    connection.registerMessages({
        events: new Map<number, Function>([
            [ IncomingHeaders.EVENT_ALERT, EventAlertEvent ]
        ]),
        composers: new Map<number, Function>()
    });

    registered = true;
}

export class EventAlertParser implements IMessageParser
{
    public type = '';
    public title = '';
    public description = '';
    public buttonText = '';
    public senderName = '';
    public senderFigure = '';
    public roomId = 0;

    public flush(): boolean
    {
        this.type = '';
        this.title = '';
        this.description = '';
        this.buttonText = '';
        this.senderName = '';
        this.senderFigure = '';
        this.roomId = 0;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this.type = wrapper.readString();
        this.title = wrapper.readString();
        this.description = wrapper.readString();
        this.buttonText = wrapper.readString();
        this.senderName = wrapper.readString();
        this.senderFigure = wrapper.readString();
        this.roomId = wrapper.readInt();

        return true;
    }
}

export class EventAlertEvent extends MessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, EventAlertParser);
    }

    public getParser(): EventAlertParser
    {
        return this.parser as EventAlertParser;
    }
}
