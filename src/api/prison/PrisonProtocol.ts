import { IMessageComposer, IMessageDataWrapper, IMessageParser, MessageEvent } from '@nitrots/nitro-renderer';
import { GetConnection } from '../nitro';

// Staff Tools > Players > Prison: who is in prison and the prison rooms. Server: hcms-emulator-plugin
// prison/PrisonProtocol.java (IN 9643 state, IN 9644 action + argument, OUT 9645 state, pushed to every staff member
// after a change). Sending someone to prison goes through the Player card (PlayerToolsActionComposer 'prison:<min>:<id>').

const IncomingHeaders = { PRISON_STATE: 9645 };
const OutgoingHeaders = { PRISON_STATE_REQUEST: 9643, PRISON_ACTION: 9644 };

let registered = false;

export const RegisterPrisonMessages = () =>
{
    if(registered) return;

    const connection = GetConnection();

    if(!connection) return;

    connection.registerMessages({
        events: new Map<number, Function>([ [ IncomingHeaders.PRISON_STATE, PrisonStateEvent ] ]),
        composers: new Map<number, Function>([
            [ OutgoingHeaders.PRISON_STATE_REQUEST, PrisonStateRequestComposer ],
            [ OutgoingHeaders.PRISON_ACTION, PrisonActionComposer ]
        ])
    });

    registered = true;
}

export class PrisonStateRequestComposer implements IMessageComposer<[]>
{
    public getMessageArray(): [] { return []; }

    public dispose(): void { return; }
}

export class PrisonActionComposer implements IMessageComposer<[ string, string ]>
{
    private _data: [ string, string ];

    /** action: release (user id) | add_here (a name) | remove / chat / commands (prison id) */
    constructor(action: string, argument: string | number = '') { this._data = [ action, String(argument) ]; }

    public getMessageArray() { return this._data; }

    public dispose(): void { return; }
}

export interface IPrisonRoom { id: number, name: string, roomId: number, roomName: string, canChat: boolean, canCommands: boolean }
export interface IPrisoner { userId: number, username: string, prison: string, secondsLeft: number, reason: string, sentBy: string, online: boolean }

export class PrisonStateParser implements IMessageParser
{
    public canManage = false;
    public prisons: IPrisonRoom[] = [];
    public prisoners: IPrisoner[] = [];

    public flush(): boolean
    {
        this.canManage = false;
        this.prisons = [];
        this.prisoners = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this.canManage = wrapper.readBoolean();

        let count = wrapper.readInt();

        while(count-- > 0) this.prisons.push({ id: wrapper.readInt(), name: wrapper.readString(), roomId: wrapper.readInt(), roomName: wrapper.readString(), canChat: wrapper.readBoolean(), canCommands: wrapper.readBoolean() });

        count = wrapper.readInt();

        while(count-- > 0) this.prisoners.push({ userId: wrapper.readInt(), username: wrapper.readString(), prison: wrapper.readString(), secondsLeft: wrapper.readInt(), reason: wrapper.readString(), sentBy: wrapper.readString(), online: wrapper.readBoolean() });

        return true;
    }
}

export class PrisonStateEvent extends MessageEvent
{
    constructor(callBack: Function) { super(callBack, PrisonStateParser); }

    public getParser(): PrisonStateParser { return this.parser as PrisonStateParser; }
}

/** "4 min", "1 h 20 min" (the same wording as the server's bubbles). */
export const PrisonTime = (seconds: number) =>
{
    seconds = Math.max(0, seconds);

    if(seconds < 60) return `${ seconds } sec`;
    if(seconds < 3600) return `${ Math.floor(seconds / 60) } min`;

    const minutes = Math.floor((seconds % 3600) / 60);

    return `${ Math.floor(seconds / 3600) } h${ minutes ? ` ${ minutes } min` : '' }`;
}
