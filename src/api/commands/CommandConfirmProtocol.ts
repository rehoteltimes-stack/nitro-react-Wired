import { IMessageComposer, IMessageDataWrapper, IMessageParser, MessageEvent } from '@nitrots/nitro-renderer';
import { GetConnection } from '../nitro';

// A command that cannot be undone asks for confirmation in a window; see hcms-emulator-plugin's commands/CommandConfirm.java (9561 / 9562).

const IncomingHeaders = {
    COMMAND_CONFIRM_ASK: 9561
};

const OutgoingHeaders = {
    COMMAND_CONFIRM_ANSWER: 9562
};

let registered = false;

export const RegisterCommandConfirmMessages = () =>
{
    if(registered) return;

    const connection = GetConnection();

    if(!connection) return;

    connection.registerMessages({
        events: new Map<number, Function>([
            [ IncomingHeaders.COMMAND_CONFIRM_ASK, CommandConfirmAskEvent ]
        ]),
        composers: new Map<number, Function>([
            [ OutgoingHeaders.COMMAND_CONFIRM_ANSWER, CommandConfirmAnswerComposer ]
        ])
    });

    registered = true;
}

export class CommandConfirmAnswerComposer implements IMessageComposer<[ string, boolean ]>
{
    private _data: [ string, boolean ];

    constructor(token: string, accepted: boolean)
    {
        this._data = [ token, accepted ];
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

export class CommandConfirmAskParser implements IMessageParser
{
    public token = '';
    public title = '';
    public text = '';

    public flush(): boolean
    {
        this.token = '';
        this.title = '';
        this.text = '';

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this.token = wrapper.readString();
        this.title = wrapper.readString();
        this.text = wrapper.readString();

        return true;
    }
}

export class CommandConfirmAskEvent extends MessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, CommandConfirmAskParser);
    }

    public getParser(): CommandConfirmAskParser
    {
        return this.parser as CommandConfirmAskParser;
    }
}
