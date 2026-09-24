import { IMessageComposer, IMessageDataWrapper, IMessageParser, MessageEvent } from '@nitrots/nitro-renderer';
import { GetConnection } from '../nitro';

// Real reference feature: the User Profile card's "Photos" tab (PU in the minified HabboCity client
// source) - a grid of the user's published-to-web camera photos. Genuinely already-working Octane data:
// Arcturus core's own CameraPublishToWebEvent already writes every published photo into the stock
// `camera_web` table (confirmed real, in the base schema) whenever a player uses the real "Publish to
// web" camera action - this protocol only ever reads it, no server-side writing added by this project.
// Same real hcms-emulator-plugin convention as the other Profile protocols (opcodes 9527 out/9536 in -
// see ProfilePicturesProtocol.java, the single source of truth for these numbers).

const IncomingHeaders = {
    PROFILE_PICTURES_DATA: 9536
};

const OutgoingHeaders = {
    PROFILE_PICTURES_REQUEST: 9527
};

let registered = false;

export const RegisterProfilePicturesMessages = () =>
{
    if(registered) return;

    const connection = GetConnection();

    if(!connection) return;

    connection.registerMessages({
        events: new Map<number, Function>([
            [ IncomingHeaders.PROFILE_PICTURES_DATA, ProfilePicturesDataEvent ]
        ]),
        composers: new Map<number, Function>([
            [ OutgoingHeaders.PROFILE_PICTURES_REQUEST, ProfilePicturesRequestComposer ]
        ])
    });

    registered = true;
}

export class ProfilePicturesRequestComposer implements IMessageComposer<[ number ]>
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

export interface ProfilePictureData
{
    url: string;
    timestamp: number;
}

export class ProfilePicturesDataParser implements IMessageParser
{
    public userId: number = 0;
    public pictures: ProfilePictureData[] = [];

    public flush(): boolean
    {
        this.userId = 0;
        this.pictures = [];
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this.userId = wrapper.readInt();

        let count = wrapper.readInt();

        while(count > 0)
        {
            const url = wrapper.readString();
            const timestamp = wrapper.readInt();

            this.pictures.push({ url, timestamp });
            count--;
        }

        return true;
    }
}

export class ProfilePicturesDataEvent extends MessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, ProfilePicturesDataParser);
    }

    public getParser(): ProfilePicturesDataParser
    {
        return this.parser as ProfilePicturesDataParser;
    }
}
