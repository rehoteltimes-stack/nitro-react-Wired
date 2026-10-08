import { IMessageComposer, IMessageDataWrapper, IMessageParser, MessageEvent } from '@nitrots/nitro-renderer';
import { GetConnection } from '../nitro';
import { IUsernameIdentity } from './UsernameStyle';

// The name style (rank colour, gif, VIP) of players, asked in batches; see hcms-emulator-plugin's identity package
// (9559 / 9560 by user id, 9566 / 9567 by username - the by-name pair resolves a mentioned player's real rank/VIP
// style even when they aren't a co-occupant of the sender's own room, the same data source as the profile card).

const IncomingHeaders = {
    IDENTITY_DATA: 9560,
    IDENTITY_NAME_DATA: 9567
};

const OutgoingHeaders = {
    IDENTITY_REQUEST: 9559,
    IDENTITY_NAME_REQUEST: 9566
};

let registered = false;

export const RegisterUserIdentityMessages = () =>
{
    if(registered) return;

    const connection = GetConnection();

    if(!connection) return;

    connection.registerMessages({
        events: new Map<number, Function>([
            [ IncomingHeaders.IDENTITY_DATA, UserIdentityDataEvent ],
            [ IncomingHeaders.IDENTITY_NAME_DATA, UserIdentityByNameDataEvent ]
        ]),
        composers: new Map<number, Function>([
            [ OutgoingHeaders.IDENTITY_REQUEST, UserIdentityRequestComposer ],
            [ OutgoingHeaders.IDENTITY_NAME_REQUEST, UserIdentityByNameRequestComposer ]
        ])
    });

    registered = true;
}

export class UserIdentityRequestComposer implements IMessageComposer<any[]>
{
    private _data: any[];

    constructor(userIds: number[])
    {
        this._data = [ userIds.length, ...userIds ];
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

export class UserIdentityDataParser implements IMessageParser
{
    public identities: Map<number, IUsernameIdentity> = new Map();

    public flush(): boolean
    {
        this.identities = new Map();

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        const count = wrapper.readInt();

        for(let i = 0; i < count; i++)
        {
            const userId = wrapper.readInt();

            this.identities.set(userId, { staffColor: wrapper.readString(), staffBackground: wrapper.readString(), isVip: wrapper.readBoolean() });
        }

        return true;
    }
}

export class UserIdentityDataEvent extends MessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, UserIdentityDataParser);
    }

    public getParser(): UserIdentityDataParser
    {
        return this.parser as UserIdentityDataParser;
    }
}

export class UserIdentityByNameRequestComposer implements IMessageComposer<any[]>
{
    private _data: any[];

    constructor(names: string[])
    {
        this._data = [ names.length, ...names ];
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

export interface INamedIdentity
{
    webId: number;
    identity: IUsernameIdentity;
}

export class UserIdentityByNameDataParser implements IMessageParser
{
    public identities: Map<string, INamedIdentity> = new Map();

    public flush(): boolean
    {
        this.identities = new Map();

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        const count = wrapper.readInt();

        for(let i = 0; i < count; i++)
        {
            const name = wrapper.readString();
            const webId = wrapper.readInt();
            const identity: IUsernameIdentity = { staffColor: wrapper.readString(), staffBackground: wrapper.readString(), isVip: wrapper.readBoolean() };

            this.identities.set(name.toLowerCase(), { webId, identity });
        }

        return true;
    }
}

export class UserIdentityByNameDataEvent extends MessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, UserIdentityByNameDataParser);
    }

    public getParser(): UserIdentityByNameDataParser
    {
        return this.parser as UserIdentityByNameDataParser;
    }
}
