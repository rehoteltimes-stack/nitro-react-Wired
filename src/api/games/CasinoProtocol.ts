import { IMessageComposer, IMessageDataWrapper, IMessageParser, MessageEvent } from '@nitrots/nitro-renderer';
import { GetConnection } from '../nitro';

const IncomingHeaders = { CASINO_STATE: 9690, CASINO_DEALERS: 9692, CASINO_DEALER_CONFIG: 9693 };
const OutgoingHeaders = { CASINO_ACTION: 9691 };

let registered = false;

export const RegisterCasinoMessages = () =>
{
    if(registered) return;

    const connection = GetConnection();

    if(!connection) return;

    connection.registerMessages({
        events: new Map<number, Function>([ [ IncomingHeaders.CASINO_STATE, CasinoStateEvent ], [ IncomingHeaders.CASINO_DEALERS, CasinoDealersEvent ], [ IncomingHeaders.CASINO_DEALER_CONFIG, CasinoDealerConfigEvent ] ]),
        composers: new Map<number, Function>([ [ OutgoingHeaders.CASINO_ACTION, CasinoActionComposer ] ])
    });

    registered = true;
}

export type CasinoTalkMode = 'chat' | 'whisper' | 'window';

export interface ICasinoPreferences { mode: CasinoTalkMode, shareResults: boolean }

const CASINO_PREFERENCES_KEY = 'hcms.casino.preferences';

export const GetCasinoPreferences = (): ICasinoPreferences =>
{
    try
    {
        const [ mode, share ] = (window.localStorage.getItem(CASINO_PREFERENCES_KEY) ?? '').split(':');

        return { mode: ([ 'chat', 'whisper', 'window' ].includes(mode) ? mode : 'chat') as CasinoTalkMode, shareResults: (share !== 'private') };
    }
    catch
    {
        return { mode: 'chat', shareResults: true };
    }
};

export const SetCasinoPreferences = (preferences: ICasinoPreferences) =>
{
    try
    {
        window.localStorage.setItem(CASINO_PREFERENCES_KEY, EncodeCasinoPreferences(preferences));
    }
    catch
    {
        return;
    }
};

const EncodeCasinoPreferences = (preferences: ICasinoPreferences) => `${ preferences.mode }:${ preferences.shareResults ? 'shared' : 'private' }`;

export class CasinoActionComposer implements IMessageComposer<[ string, string, number, number, string, string ]>
{
    private _data: [ string, string, number, number, string, string ];

    constructor(action: string, game: string = '', amount: number = 0, currency: number = 0, side: string = '') { this._data = [ action, game, amount, currency, side, EncodeCasinoPreferences(GetCasinoPreferences()) ]; }

    public getMessageArray() { return this._data; }

    public dispose(): void { return; }
}

export interface ICasinoCurrency { type: number, name: string, balance: number, min: number, max: number }

export interface ICasinoRun { game: string, target: number, total: number, stake: number, currency: number, dealerFirst: boolean, house: number }

export interface ICasinoState
{
    enabled: boolean;
    dealer: string;
    near: boolean;
    message: string;
    mode: CasinoTalkMode;
    shareResults: boolean;
    currencies: ICasinoCurrency[];
    payouts: { [game: string]: string };
    games?: string[];
    round?: number;
    settled?: boolean;
    run?: ICasinoRun;
}

export class CasinoStateParser implements IMessageParser
{
    public state: ICasinoState = null;

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

export class CasinoStateEvent extends MessageEvent
{
    constructor(callBack: Function) { super(callBack, CasinoStateParser); }

    public getParser(): CasinoStateParser { return this.parser as CasinoStateParser; }
}

export interface ICasinoDealerActive { player: string, game: string, stake: number, currency: number }

export interface ICasinoDealer { roomIndex: number, name: string, diamonds: number, emeralds: number, active?: ICasinoDealerActive }

export class CasinoDealersParser implements IMessageParser
{
    public dealers: ICasinoDealer[] = [];

    public flush(): boolean
    {
        this.dealers = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        try
        {
            this.dealers = JSON.parse(wrapper.readString()) ?? [];
        }
        catch(error)
        {
            this.dealers = [];
        }

        return true;
    }
}

export class CasinoDealersEvent extends MessageEvent
{
    constructor(callBack: Function) { super(callBack, CasinoDealersParser); }

    public getParser(): CasinoDealersParser { return this.parser as CasinoDealersParser; }
}

export interface ICasinoDealerCurrency { type: number, name: string, bank: number, inPlay: number, wallet: number, min: number, max: number, daily: number, defaultMin: number, defaultMax: number, defaultDaily: number }

export interface ICasinoRankLimit { id: number, name: string, max_5: number, daily_5: number, max_101: number, daily_101: number }

export interface ICasinoDealerConfig
{
    roomIndex: number;
    name: string;
    dealer: boolean;
    message: string;
    games: string[];
    currencies: ICasinoDealerCurrency[];
    ranks: ICasinoRankLimit[];
    canEditRanks: boolean;
}

export class CasinoDealerConfigParser implements IMessageParser
{
    public config: ICasinoDealerConfig = null;

    public flush(): boolean
    {
        this.config = null;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        try
        {
            this.config = JSON.parse(wrapper.readString());
        }
        catch(error)
        {
            this.config = null;
        }

        return true;
    }
}

export class CasinoDealerConfigEvent extends MessageEvent
{
    constructor(callBack: Function) { super(callBack, CasinoDealerConfigParser); }

    public getParser(): CasinoDealerConfigParser { return this.parser as CasinoDealerConfigParser; }
}
