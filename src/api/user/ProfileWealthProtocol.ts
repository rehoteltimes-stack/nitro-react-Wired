import { IMessageComposer, IMessageDataWrapper, IMessageParser, MessageEvent } from '@nitrots/nitro-renderer';
import { GetConnection } from '../nitro';

// Real reference feature: the User Profile card's "Richesse" (Wealth) tab - a multi-series
// day-by-day chart (diamonds/badges/rares-value/total) plus real unique rare/badge counts. Backing
// data lives entirely on hCMS's own side (hcms_wealth_snapshots, hcms_values_rares/badges - a
// separate repo, same shared MySQL database), already powering hCMS's own Center > Inventory >
// Richesse chart - see hcms-emulator-plugin's own ProfileWealthProtocol.java, the single source of
// truth for these numbers, for the real SQL this mirrors (WealthSnapshotService.php/
// WealthCalculator.php on the hCMS side). Same opcode convention as the other Profile protocols.

const IncomingHeaders = {
    PROFILE_WEALTH_DATA: 9537
};

const OutgoingHeaders = {
    PROFILE_WEALTH_REQUEST: 9528
};

let registered = false;

export const RegisterProfileWealthMessages = () =>
{
    if(registered) return;

    const connection = GetConnection();

    if(!connection) return;

    connection.registerMessages({
        events: new Map<number, Function>([
            [ IncomingHeaders.PROFILE_WEALTH_DATA, ProfileWealthDataEvent ]
        ]),
        composers: new Map<number, Function>([
            [ OutgoingHeaders.PROFILE_WEALTH_REQUEST, ProfileWealthRequestComposer ]
        ])
    });

    registered = true;
}

export class ProfileWealthRequestComposer implements IMessageComposer<[ number ]>
{
    private _data: [ number ];

    constructor(userId: number)
    {
        this._data = [ userId ];
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

export interface ProfileWealthSnapshot
{
    date: string;
    diamonds: number;
    rares: number;
    badges: number;
    total: number;
    raresCount: number;
}

export class ProfileWealthDataParser implements IMessageParser
{
    public userId: number = 0;
    public history: ProfileWealthSnapshot[] = [];
    public uniqueRareCount: number = 0;
    public uniqueBadgeCount: number = 0;

    public flush(): boolean
    {
        this.userId = 0;
        this.history = [];
        this.uniqueRareCount = 0;
        this.uniqueBadgeCount = 0;
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this.userId = wrapper.readInt();

        let count = wrapper.readInt();

        while(count > 0)
        {
            const date = wrapper.readString();
            const diamonds = wrapper.readInt();
            const rares = wrapper.readInt();
            const badges = wrapper.readInt();
            const total = wrapper.readInt();
            const raresCount = wrapper.readInt();

            this.history.push({ date, diamonds, rares, badges, total, raresCount });
            count--;
        }

        this.uniqueRareCount = wrapper.readInt();
        this.uniqueBadgeCount = wrapper.readInt();

        return true;
    }
}

export class ProfileWealthDataEvent extends MessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, ProfileWealthDataParser);
    }

    public getParser(): ProfileWealthDataParser
    {
        return this.parser as ProfileWealthDataParser;
    }
}
