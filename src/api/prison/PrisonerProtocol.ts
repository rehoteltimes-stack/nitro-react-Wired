import { IMessageComposer, IMessageDataWrapper, IMessageParser, MessageEvent } from '@nitrots/nitro-renderer';
import { GetConnection } from '../nitro';

const IncomingHeaders = { PRISONER_STATUS: 9658 };
const OutgoingHeaders = { PRISONER_BAIL: 9659 };

let registered = false;

export const RegisterPrisonerMessages = () =>
{
    if(registered) return;

    const connection = GetConnection();

    if(!connection) return;

    connection.registerMessages({
        events: new Map<number, Function>([ [ IncomingHeaders.PRISONER_STATUS, PrisonerStatusEvent ] ]),
        composers: new Map<number, Function>([ [ OutgoingHeaders.PRISONER_BAIL, PrisonerBailComposer ] ])
    });

    registered = true;
}

export class PrisonerBailComposer implements IMessageComposer<[]>
{
    public getMessageArray(): [] { return []; }

    public dispose(): void { return; }
}

export interface IPrisonerStatus
{
    prison: string;
    reason: string;
    secondsLeft: number;
    secondsTotal: number;
    bail: boolean;
    bailPrice: number;
    bailCurrency: number;
}

export class PrisonerStatusParser implements IMessageParser
{
    public status: IPrisonerStatus = null;

    public flush(): boolean
    {
        this.status = null;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper.readBoolean())
        {
            this.status = null;

            return true;
        }

        this.status = {
            prison: wrapper.readString(),
            reason: wrapper.readString(),
            secondsLeft: wrapper.readInt(),
            secondsTotal: wrapper.readInt(),
            bail: wrapper.readBoolean(),
            bailPrice: wrapper.readInt(),
            bailCurrency: wrapper.readInt()
        };

        return true;
    }
}

export class PrisonerStatusEvent extends MessageEvent
{
    constructor(callBack: Function) { super(callBack, PrisonerStatusParser); }

    public getParser(): PrisonerStatusParser { return this.parser as PrisonerStatusParser; }
}
