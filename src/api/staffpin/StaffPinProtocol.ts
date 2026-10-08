import { IMessageComposer, IMessageDataWrapper, IMessageParser, MessageEvent } from '@nitrots/nitro-renderer';
import { GetConnection } from '../nitro';

// Staff login PIN: a staff account (Moderator and up) starts locked until it enters the PIN set on the website; see
// hcms-emulator-plugin's staffpin/StaffPin.java. IN 9632 = verify (string pin, "" = only ask for the state),
// OUT 9633 = state (boolean locked, boolean hasPin, int attemptsLeft, string message), IN 9634 = set the first PIN
// (string pin, string confirm) from the client.

const IncomingHeaders = {
    STAFF_PIN_STATE: 9633
};

const OutgoingHeaders = {
    STAFF_PIN_VERIFY: 9632,
    STAFF_PIN_SET: 9634
};

let registered = false;

export const RegisterStaffPinMessages = () =>
{
    if(registered) return;

    const connection = GetConnection();

    if(!connection) return;

    connection.registerMessages({
        events: new Map<number, Function>([
            [ IncomingHeaders.STAFF_PIN_STATE, StaffPinStateEvent ]
        ]),
        composers: new Map<number, Function>([
            [ OutgoingHeaders.STAFF_PIN_VERIFY, StaffPinVerifyComposer ],
            [ OutgoingHeaders.STAFF_PIN_SET, StaffPinSetComposer ]
        ])
    });

    registered = true;
}

export class StaffPinVerifyComposer implements IMessageComposer<[ string ]>
{
    private _data: [ string ];

    constructor(pin: string)
    {
        this._data = [ pin ];
    }

    public getMessageArray(): [ string ]
    {
        return this._data;
    }

    public dispose(): void
    {
        return;
    }
}

export class StaffPinSetComposer implements IMessageComposer<[ string, string ]>
{
    private _data: [ string, string ];

    constructor(pin: string, confirm: string)
    {
        this._data = [ pin, confirm ];
    }

    public getMessageArray(): [ string, string ]
    {
        return this._data;
    }

    public dispose(): void
    {
        return;
    }
}

export class StaffPinStateParser implements IMessageParser
{
    public locked = false;
    public hasPin = false;
    public attemptsLeft = 0;
    public message = '';

    public flush(): boolean
    {
        this.locked = false;
        this.hasPin = false;
        this.attemptsLeft = 0;
        this.message = '';

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this.locked = wrapper.readBoolean();
        this.hasPin = wrapper.readBoolean();
        this.attemptsLeft = wrapper.readInt();
        this.message = wrapper.readString();

        return true;
    }
}

export class StaffPinStateEvent extends MessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, StaffPinStateParser);
    }

    public getParser(): StaffPinStateParser
    {
        return this.parser as StaffPinStateParser;
    }
}
