import { IMessageComposer, IMessageDataWrapper, IMessageParser, MessageEvent } from '@nitrots/nitro-renderer';
import { GetConnection } from '../nitro';

// Mod Tools > Administration > Currency (rank 7+). Server: hcms-emulator-plugin admin/AdminCurrencyProtocol.java - the
// same balance change, ledger row, website notice and audit row as the website's admin grant, plus the new balance in
// the running game at once.

const OutgoingHeaders = { LOOKUP: 9603, CHANGE: 9604, GIVE: 9607, BANNERS: 9609 };
const IncomingHeaders = { RESULT: 9605, GIVE_RESULT: 9608, BANNERS: 9610 };

let registered = false;

export const RegisterAdminCurrencyMessages = () =>
{
    if(registered) return;

    const connection = GetConnection();

    if(!connection) return;

    connection.registerMessages({
        events: new Map<number, Function>([
            [ IncomingHeaders.RESULT, AdminCurrencyResultEvent ],
            [ IncomingHeaders.GIVE_RESULT, AdminGiveResultEvent ],
            [ IncomingHeaders.BANNERS, AdminBannerListEvent ]
        ]),
        composers: new Map<number, Function>([
            [ OutgoingHeaders.LOOKUP, AdminCurrencyLookupComposer ],
            [ OutgoingHeaders.CHANGE, AdminCurrencyChangeComposer ],
            [ OutgoingHeaders.GIVE, AdminGiveComposer ],
            [ OutgoingHeaders.BANNERS, AdminBannerListComposer ]
        ])
    });

    registered = true;
}

class SimpleComposer<T extends unknown[]> implements IMessageComposer<T>
{
    protected _data: T;

    public getMessageArray() { return this._data; }

    public dispose(): void { return; }
}

export class AdminCurrencyLookupComposer extends SimpleComposer<[ string ]>
{
    constructor(username: string) { super(); this._data = [ username ]; }
}

/** amount > 0 grants, < 0 removes. */
export class AdminCurrencyChangeComposer extends SimpleComposer<[ string, number, number, string ]>
{
    constructor(username: string, currencyType: number, amount: number, note: string) { super(); this._data = [ username, currencyType, amount, note ]; }
}

export interface IAdminCurrencyBalance
{
    type: number;
    label: string;
    amount: number;
}

export class AdminCurrencyResultParser implements IMessageParser
{
    public ok = false;
    public message = '';
    public userId = 0;
    public username = '';
    public look = '';
    public online = false;
    public balances: IAdminCurrencyBalance[] = [];

    public flush(): boolean { this.ok = false; this.message = ''; this.userId = 0; this.username = ''; this.look = ''; this.online = false; this.balances = []; return true; }

    public parse(w: IMessageDataWrapper): boolean
    {
        this.ok = w.readBoolean();
        this.message = w.readString();
        this.userId = w.readInt();
        this.username = w.readString();
        this.look = w.readString();
        this.online = w.readBoolean();

        let count = w.readInt();

        while(count-- > 0) this.balances.push({ type: w.readInt(), label: w.readString(), amount: w.readInt() });

        return true;
    }
}

export class AdminCurrencyResultEvent extends MessageEvent
{
    constructor(callBack: Function) { super(callBack, AdminCurrencyResultParser); }
    public getParser(): AdminCurrencyResultParser { return this.parser as AdminCurrencyResultParser; }
}

// Give tab (plugin admin/AdminGiveProtocol.java): badges, furni, banners, effects. Shop items go through ShopGiveComposer.

export type AdminGiveKind = 'badge' | 'furni' | 'banner' | 'effect';

export class AdminGiveComposer extends SimpleComposer<[ string, string, string, number, boolean, string ]>
{
    constructor(username: string, kind: AdminGiveKind, key: string, amount: number, take: boolean, note: string) { super(); this._data = [ username, kind, key, amount, take, note ]; }
}

export class AdminBannerListComposer extends SimpleComposer<[]>
{
    constructor() { super(); this._data = []; }
}

export class AdminGiveResultParser implements IMessageParser
{
    public ok = false;
    public message = '';

    public flush(): boolean { this.ok = false; this.message = ''; return true; }

    public parse(w: IMessageDataWrapper): boolean
    {
        this.ok = w.readBoolean();
        this.message = w.readString();

        return true;
    }
}

export class AdminGiveResultEvent extends MessageEvent
{
    constructor(callBack: Function) { super(callBack, AdminGiveResultParser); }
    public getParser(): AdminGiveResultParser { return this.parser as AdminGiveResultParser; }
}

export class AdminBannerListParser implements IMessageParser
{
    public banners: { id: number, title: string }[] = [];

    public flush(): boolean { this.banners = []; return true; }

    public parse(w: IMessageDataWrapper): boolean
    {
        let count = w.readInt();

        while(count-- > 0) this.banners.push({ id: w.readInt(), title: w.readString() });

        return true;
    }
}

export class AdminBannerListEvent extends MessageEvent
{
    constructor(callBack: Function) { super(callBack, AdminBannerListParser); }
    public getParser(): AdminBannerListParser { return this.parser as AdminBannerListParser; }
}
