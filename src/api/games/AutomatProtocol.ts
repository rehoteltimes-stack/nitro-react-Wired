import { IMessageComposer, IMessageDataWrapper, IMessageParser, MessageEvent } from '@nitrots/nitro-renderer';
import { GetConnection } from '../nitro';

const IncomingHeaders = { AUTOMAT_STATE: 9655 };
const OutgoingHeaders = { AUTOMAT_ACTION: 9656 };

let registered = false;

export const RegisterAutomatMessages = () =>
{
    if(registered) return;

    const connection = GetConnection();

    if(!connection) return;

    connection.registerMessages({
        events: new Map<number, Function>([ [ IncomingHeaders.AUTOMAT_STATE, AutomatStateEvent ] ]),
        composers: new Map<number, Function>([ [ OutgoingHeaders.AUTOMAT_ACTION, AutomatActionComposer ] ])
    });

    registered = true;
}

export class AutomatActionComposer implements IMessageComposer<[ string, number ]>
{
    private _data: [ string, number ];

    constructor(action: string, offerId: number = 0) { this._data = [ action, offerId ]; }

    public getMessageArray() { return this._data; }

    public dispose(): void { return; }
}

export interface IAutomatOffer { id: number, itemId: number, spriteId: number, name: string, need: number, have: number, currency: number, amount: number }

export interface IAutomatState
{
    enabled: boolean;
    season: string;
    machineHere: boolean;
    message: string;
    offers: IAutomatOffer[];
}

export class AutomatStateParser implements IMessageParser
{
    public state: IAutomatState = null;

    public flush(): boolean
    {
        this.state = null;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        try
        {
            this.state = JSON.parse(wrapper.readString());
        }
        catch(error)
        {
            this.state = null;
        }

        return true;
    }
}

export class AutomatStateEvent extends MessageEvent
{
    constructor(callBack: Function) { super(callBack, AutomatStateParser); }

    public getParser(): AutomatStateParser { return this.parser as AutomatStateParser; }
}
