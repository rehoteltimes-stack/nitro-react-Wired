import { IMessageComposer } from '@nitrots/nitro-renderer';
import { GetConnection } from '../nitro';

// Real reference: habbocity.fr's own profile-moderation panel gives a moderator three extra buttons besides
// "Open mod tools" - delete banner / delete motto / delete avatar (confirmed via the real minified bundle,
// raw byte extraction, not guessed). Server: hcms-emulator-plugin's profile/ProfileModerationProtocol.java,
// gated by rank (>=2) rather than the exact stock isModerator/securityLevel chain.

const OutgoingHeaders = {
    DELETE_CONTENT: 9568
};

let registered = false;

export const RegisterProfileModerationMessages = () =>
{
    if(registered) return;

    const connection = GetConnection();

    if(!connection) return;

    connection.registerMessages({
        events: new Map<number, Function>(),
        composers: new Map<number, Function>([
            [ OutgoingHeaders.DELETE_CONTENT, ProfileDeleteContentComposer ]
        ])
    });

    registered = true;
}

export enum ProfileModerationContentType
{
    BANNER = 0,
    MOTTO = 1,
    FIGURE = 2
}

export class ProfileDeleteContentComposer implements IMessageComposer<[ number, number ]>
{
    private _data: [ number, number ];

    constructor(targetUserId: number, contentType: ProfileModerationContentType)
    {
        this._data = [ targetUserId, contentType ];
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
