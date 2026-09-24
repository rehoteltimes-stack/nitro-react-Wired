import { IMessageComposer, IMessageDataWrapper, IMessageParser, MessageEvent } from '@nitrots/nitro-renderer';
import { GetConnection } from '../nitro';

// Real reference gap: the User Profile card shows a "player banner" background for WHICHEVER profile is
// open, not just your own - HabboCity's own server fork exposes this via a dedicated request/response pair,
// separate from BannerProtocol's own INCOMING_REQUEST (which only ever answers "my own owned banners", see
// that file's own doc comment). This is that missing pair, same real hcms-emulator-plugin convention
// (opcodes 9523 out/9533 in - see ProfileBannerProtocol.java there, the single source of truth for these
// numbers), reusing the same already-live hcms_users_banners data BannerProtocol already bridges.

const IncomingHeaders = {
    PROFILE_BANNER_DATA: 9533
};

const OutgoingHeaders = {
    PROFILE_BANNER_REQUEST: 9523
};

let registered = false;

export const RegisterProfileBannerMessages = () =>
{
    if(registered) return;

    const connection = GetConnection();

    if(!connection) return;

    connection.registerMessages({
        events: new Map<number, Function>([
            [ IncomingHeaders.PROFILE_BANNER_DATA, ProfileBannerDataEvent ]
        ]),
        composers: new Map<number, Function>([
            [ OutgoingHeaders.PROFILE_BANNER_REQUEST, ProfileBannerRequestComposer ]
        ])
    });

    registered = true;
}

export class ProfileBannerRequestComposer implements IMessageComposer<[ number ]>
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

export class ProfileBannerDataParser implements IMessageParser
{
    public userId: number = 0;
    public imageFilename: string = '';

    public flush(): boolean
    {
        this.userId = 0;
        this.imageFilename = '';
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this.userId = wrapper.readInt();
        this.imageFilename = wrapper.readString();
        return true;
    }
}

export class ProfileBannerDataEvent extends MessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, ProfileBannerDataParser);
    }

    public getParser(): ProfileBannerDataParser
    {
        return this.parser as ProfileBannerDataParser;
    }
}
