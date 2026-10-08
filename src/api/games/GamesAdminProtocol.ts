import { IMessageComposer, IMessageDataWrapper, IMessageParser, MessageEvent } from '@nitrots/nitro-renderer';
import { GetConnection } from '../nitro';

const IncomingHeaders = { GAMES_ADMIN_STATE: 9654 };
const OutgoingHeaders = { GAMES_ADMIN_ACTION: 9653 };

let registered = false;

export const RegisterGamesAdminMessages = () =>
{
    if(registered) return;

    const connection = GetConnection();

    if(!connection) return;

    connection.registerMessages({
        events: new Map<number, Function>([ [ IncomingHeaders.GAMES_ADMIN_STATE, GamesAdminStateEvent ] ]),
        composers: new Map<number, Function>([ [ OutgoingHeaders.GAMES_ADMIN_ACTION, GamesAdminActionComposer ] ])
    });

    registered = true;
}

export class GamesAdminActionComposer implements IMessageComposer<[ string, string ]>
{
    private _data: [ string, string ];

    constructor(action: string, payload: Record<string, unknown> = {}) { this._data = [ action, JSON.stringify(payload) ]; }

    public getMessageArray() { return this._data; }

    public dispose(): void { return; }
}

export interface IGamesPrize { id: number, pool: string, type: string, currency: number, amount: number, itemId: number, weight: number, enabled: boolean }

export interface IGamesAdminState
{
    lottery: {
        settings: Record<string, string>;
        drawId: number;
        drawAt: number;
        pot: number;
        prize: string;
        tickets: number;
        players: number;
        prizes: IGamesPrize[];
        winners: { draw: number, username: string, prize: string, at: number }[];
    };
    word: {
        settings: Record<string, string>;
        running: boolean;
        scrambled: string;
        word: string;
        endsAt: number;
        nextStartAt: number;
        words: number;
        prizeType: number;
        prizeAmount: number;
        prizes: { id: number, currency: number, amount: number, weight: number }[];
    };
    spawns: {
        settings: Record<string, string>;
        active: number;
        nextAt: number;
        items: { id: number, season: string, itemId: number, weight: number, enabled: boolean, name: string, classname: string, collected: number }[];
    };
    automat: {
        settings: Record<string, string>;
        offers: { id: number, season: string, itemId: number, need: number, currency: number, amount: number, enabled: boolean, name: string }[];
    };
    message: string;
}

export class GamesAdminStateParser implements IMessageParser
{
    public state: IGamesAdminState = null;

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

export class GamesAdminStateEvent extends MessageEvent
{
    constructor(callBack: Function) { super(callBack, GamesAdminStateParser); }

    public getParser(): GamesAdminStateParser { return this.parser as GamesAdminStateParser; }
}
