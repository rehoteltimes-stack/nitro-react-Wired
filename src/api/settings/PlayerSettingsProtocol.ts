import { IMessageComposer, IMessageDataWrapper, IMessageParser, MessageEvent } from '@nitrots/nitro-renderer';
import { GetConnection } from '../nitro';

// Settings > Options: the personal on/off commands (:nomention, :noreactions, :nobubble, :blockalerts, :mutebots,
// :mutepets, :eventsoff, :noface) as switches. Server: hcms-emulator-plugin settings/PlayerSettingsProtocol.java
// (IN 9623 list, IN 9624 switch one, OUT 9625 list). The shop's own ones go over ShopSettingComposer.

const IncomingHeaders = { PLAYER_SETTINGS: 9625 };
const OutgoingHeaders = { PLAYER_SETTINGS_REQUEST: 9623, PLAYER_SETTINGS_TOGGLE: 9624 };

let registered = false;

export const RegisterPlayerSettingsMessages = () =>
{
    if(registered) return;

    const connection = GetConnection();

    if(!connection) return;

    connection.registerMessages({
        events: new Map<number, Function>([ [ IncomingHeaders.PLAYER_SETTINGS, PlayerSettingsEvent ] ]),
        composers: new Map<number, Function>([
            [ OutgoingHeaders.PLAYER_SETTINGS_REQUEST, PlayerSettingsRequestComposer ],
            [ OutgoingHeaders.PLAYER_SETTINGS_TOGGLE, PlayerSettingToggleComposer ]
        ])
    });

    registered = true;
}

export class PlayerSettingsRequestComposer implements IMessageComposer<[]>
{
    public getMessageArray(): [] { return []; }

    public dispose(): void { return; }
}

export class PlayerSettingToggleComposer implements IMessageComposer<[ string ]>
{
    private _data: [ string ];

    constructor(key: string) { this._data = [ key ]; }

    public getMessageArray() { return this._data; }

    public dispose(): void { return; }
}

/** One switch; "on" means the thing is happening / visible. */
export interface IPlayerSetting { key: string, label: string, description: string, command: string, group: string, on: boolean }

export class PlayerSettingsParser implements IMessageParser
{
    public settings: IPlayerSetting[] = [];

    public flush(): boolean
    {
        this.settings = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        let count = wrapper.readInt();

        while(count-- > 0) this.settings.push({ key: wrapper.readString(), label: wrapper.readString(), description: wrapper.readString(), command: wrapper.readString(), group: wrapper.readString(), on: wrapper.readBoolean() });

        return true;
    }
}

export class PlayerSettingsEvent extends MessageEvent
{
    constructor(callBack: Function) { super(callBack, PlayerSettingsParser); }

    public getParser(): PlayerSettingsParser { return this.parser as PlayerSettingsParser; }
}
