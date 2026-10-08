import { IMessageComposer, IMessageDataWrapper, IMessageParser, MessageEvent } from '@nitrots/nitro-renderer';
import { GetConnection } from '../nitro';

// Mentions ("@name message"): see hcms-emulator-plugin's mentions/MentionProtocol.java for the wire format. The structure follows
// HabboCity's own (a mention carries the sender id, the sender name and the text); the numbers are this hotel's own.

const IncomingHeaders = {
    MENTION: 9552
};

const OutgoingHeaders = {
    SEND_MENTION: 9553,
    SEND_MENTION_BY_NAME: 9554
};

let registered = false;

export const RegisterMentionMessages = () =>
{
    if(registered) return;

    const connection = GetConnection();

    if(!connection) return;

    connection.registerMessages({
        events: new Map<number, Function>([
            [ IncomingHeaders.MENTION, MentionEvent ]
        ]),
        composers: new Map<number, Function>([
            [ OutgoingHeaders.SEND_MENTION, SendMentionComposer ],
            [ OutgoingHeaders.SEND_MENTION_BY_NAME, SendMentionByNameComposer ]
        ])
    });

    registered = true;
}

/** A reply to a mention card: the target's user id and the text. */
export class SendMentionComposer implements IMessageComposer<[ number, string ]>
{
    private _data: [ number, string ];

    constructor(userId: number, message: string)
    {
        this._data = [ userId, message ];
    }

    public getMessageArray()
    {
        return this._data;
    }

    public dispose(): void
    {
        return;
    }
}

/** A typed "@name message": the target's name, the text, and whether the sender's own real room chat already
 * shows this (an embedded "@name" inside a normal message) - true skips the server's own room-chat echo, so an
 * embedded mention doesn't resend the message a second time in the room. */
export class SendMentionByNameComposer implements IMessageComposer<[ string, string, boolean ]>
{
    private _data: [ string, string, boolean ];

    constructor(name: string, message: string, silent: boolean = false)
    {
        this._data = [ name, message, silent ];
    }

    public getMessageArray()
    {
        return this._data;
    }

    public dispose(): void
    {
        return;
    }
}

export class MentionParser implements IMessageParser
{
    public senderId = 0;
    public senderName = '';
    public message = '';
    public staffColor = '';
    public staffBackground = '';
    public isVip = false;

    public flush(): boolean
    {
        this.senderId = 0;
        this.senderName = '';
        this.message = '';
        this.staffColor = '';
        this.staffBackground = '';
        this.isVip = false;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this.senderId = wrapper.readInt();
        this.senderName = wrapper.readString();
        this.message = wrapper.readString();
        this.staffColor = wrapper.readString();
        this.staffBackground = wrapper.readString();
        this.isVip = wrapper.readBoolean();

        return true;
    }
}

export class MentionEvent extends MessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, MentionParser);
    }

    public getParser(): MentionParser
    {
        return this.parser as MentionParser;
    }
}
