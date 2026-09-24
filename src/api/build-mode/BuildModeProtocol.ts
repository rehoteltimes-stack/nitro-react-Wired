import { IMessageComposer } from '@nitrots/nitro-renderer';
import { GetConnection } from '../nitro';

// Wire protocol of the hCMS Build Mode plugin (hcms-buildermode-plugin, package
// com.hcms.emulatorplugin.buildermode). One outgoing packet: the builder's forced values.
// The header must match BuildModeHeaders.SETTINGS on the Java side (4225, free in the core
// Incoming.java/Outgoing.java; the Builder Toolbar uses 4200-4222).
const OUTGOING_BUILD_MODE_SETTINGS = 4225;

// Height modes, same values as the plugin's BuildModeSettings.Z_* and the reference's select items.
export enum BuildModeHeightMode
{
    NONE = 0,
    ABSOLUTE = 1,
    FROM_HIGHEST = 2,
    FROM_LOWEST = 3,
    FROM_FURNI = 4
}

let registered = false;

export const RegisterBuildModeMessages = () =>
{
    if(registered) return;

    const connection = GetConnection();

    if(!connection) return;

    connection.registerMessages({
        events: new Map<number, Function>(),
        composers: new Map<number, Function>([
            [ OUTGOING_BUILD_MODE_SETTINGS, BuildModeSettingsComposer ]
        ])
    });

    registered = true;
}

// Payload: int heightMode, string height ("" = none), string states (csv), boolean applyOnMove, boolean applyOnClick.
export class BuildModeSettingsComposer implements IMessageComposer<[ number, string, string, boolean, boolean ]>
{
    private _data: [ number, string, string, boolean, boolean ];

    constructor(heightMode: number, height: number | null, states: number[], applyOnMove: boolean, applyOnClick: boolean)
    {
        this._data = [ heightMode, ((height === null) ? '' : height.toString()), states.join(','), applyOnMove, applyOnClick ];
    }

    public getMessageArray(): [ number, string, string, boolean, boolean ]
    {
        return this._data;
    }

    public dispose(): void
    {
        this._data = null;
    }
}
