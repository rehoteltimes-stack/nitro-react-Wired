import { IMessageComposer, IMessageDataWrapper, IMessageParser, MessageEvent } from '@nitrots/nitro-renderer';
import { GetConnection } from '../nitro';

// Real reference gap: the User Profile card shows a "Respects" stat this project's own vendored
// UserProfileParser has no field for. Per explicit direction, sourced via a new small plugin packet
// (same real convention as ProfileBannerProtocol) rather than patching the vendored nitro-renderer parser
// or touching Arcturus core - see hcms-emulator-plugin's ProfileStatsProtocol.java, opcodes 9524 out/9534
// in, the single source of truth for these numbers.

const IncomingHeaders = {
    PROFILE_STATS_DATA: 9534
};

const OutgoingHeaders = {
    PROFILE_STATS_REQUEST: 9524
};

let registered = false;

export const RegisterProfileStatsMessages = () =>
{
    if(registered) return;

    const connection = GetConnection();

    if(!connection) return;

    connection.registerMessages({
        events: new Map<number, Function>([
            [ IncomingHeaders.PROFILE_STATS_DATA, ProfileStatsDataEvent ]
        ]),
        composers: new Map<number, Function>([
            [ OutgoingHeaders.PROFILE_STATS_REQUEST, ProfileStatsRequestComposer ]
        ])
    });

    registered = true;
}

export class ProfileStatsRequestComposer implements IMessageComposer<[ number ]>
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

export class ProfileStatsDataParser implements IMessageParser
{
    public userId: number = 0;
    public respectsReceived: number = 0;
    public staffColor: string = '';
    public staffBackground: string = '';
    public isVip: boolean = false;

    public flush(): boolean
    {
        this.userId = 0;
        this.respectsReceived = 0;
        this.staffColor = '';
        this.staffBackground = '';
        this.isVip = false;
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this.userId = wrapper.readInt();
        this.respectsReceived = wrapper.readInt();
        this.staffColor = wrapper.readString();
        this.staffBackground = wrapper.readString();
        this.isVip = wrapper.readBoolean();
        return true;
    }
}

export class ProfileStatsDataEvent extends MessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, ProfileStatsDataParser);
    }

    public getParser(): ProfileStatsDataParser
    {
        return this.parser as ProfileStatsDataParser;
    }
}
