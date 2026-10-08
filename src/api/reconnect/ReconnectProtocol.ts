import { IMessageComposer, IMessageDataWrapper, IMessageParser, MessageEvent } from '@nitrots/nitro-renderer';
import { GetConnection } from '../nitro';

// Seamless reconnect: once logged in the client asks for a reconnect ticket, which it then uses as its "sso.ticket"
// when the socket re-opens after a drop; see hcms-emulator-plugin's reconnect/ReconnectTicket.java (9614 / 9613).

const IncomingHeaders = {
    RECONNECT_TICKET: 9613
};

const OutgoingHeaders = {
    RECONNECT_TICKET_REQUEST: 9614
};

let registered = false;

export const RegisterReconnectMessages = () =>
{
    if(registered) return;

    const connection = GetConnection();

    if(!connection) return;

    connection.registerMessages({
        events: new Map<number, Function>([
            [ IncomingHeaders.RECONNECT_TICKET, ReconnectTicketEvent ]
        ]),
        composers: new Map<number, Function>([
            [ OutgoingHeaders.RECONNECT_TICKET_REQUEST, ReconnectTicketRequestComposer ]
        ])
    });

    registered = true;
}

export class ReconnectTicketRequestComposer implements IMessageComposer<[]>
{
    public getMessageArray(): []
    {
        return [];
    }

    public dispose(): void
    {
        return;
    }
}

export class ReconnectTicketParser implements IMessageParser
{
    public ticket = '';

    public flush(): boolean
    {
        this.ticket = '';

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this.ticket = wrapper.readString();

        return true;
    }
}

export class ReconnectTicketEvent extends MessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, ReconnectTicketParser);
    }

    public getParser(): ReconnectTicketParser
    {
        return this.parser as ReconnectTicketParser;
    }
}
