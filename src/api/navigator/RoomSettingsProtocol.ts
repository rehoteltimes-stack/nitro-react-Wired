import { IMessageComposer, IMessageDataWrapper, IMessageParser, MessageEvent } from '@nitrots/nitro-renderer';
import { GetConnection } from '../nitro';

// Per-room command/action switches ("Settings" tab) and paint ("Appearance" tab) of the room settings window.
// Served by hcms-emulator-plugin's roomsettings package (opcodes 9555-9558); the stock room settings packets are untouched.

const IncomingHeaders = {
    ROOM_SETTINGS_DATA: 9558
};

const OutgoingHeaders = {
    ROOM_SETTINGS_REQUEST: 9555,
    ROOM_SETTINGS_SAVE: 9556,
    ROOM_SKIN_SAVE: 9557
};

export const ROOM_PERMISSION_FLAGS = [
    'canEnable', 'canHanditem', 'canFastwalk', 'canMoonwalk', 'pushmode', 'canTransform', 'canSit', 'canLay', 'canGiveitem', 'canDanse',
    'canSign', 'canGreet', 'canLaugh', 'canKiss', 'canAfk', 'canJump', 'canThumbUp', 'canChangeLook', 'showBubble'
] as const;

export type RoomPermissionFlag = typeof ROOM_PERMISSION_FLAGS[number];

export interface IRoomPermissions
{
    canEnable: boolean;
    canHanditem: boolean;
    canFastwalk: boolean;
    canMoonwalk: boolean;
    pushmode: boolean;
    canTransform: boolean;
    canSit: boolean;
    canLay: boolean;
    canGiveitem: boolean;
    canDanse: boolean;
    canSign: boolean;
    canGreet: boolean;
    canLaugh: boolean;
    canKiss: boolean;
    canAfk: boolean;
    canJump: boolean;
    canThumbUp: boolean;
    canChangeLook: boolean;
    showBubble: boolean;
    diagonalMode: number;
    setSpeed: number;
}

export const DEFAULT_ROOM_PERMISSIONS: IRoomPermissions = {
    canEnable: true, canHanditem: true, canFastwalk: true, canMoonwalk: true, pushmode: true, canTransform: true, canSit: true, canLay: true,
    canGiveitem: true, canDanse: true, canSign: true, canGreet: true, canLaugh: true, canKiss: true, canAfk: true, canJump: true, canThumbUp: true,
    canChangeLook: true, showBubble: true, diagonalMode: 0, setSpeed: 4
};

let registered = false;

export const RegisterRoomSettingsMessages = () =>
{
    if(registered) return;

    const connection = GetConnection();

    if(!connection) return;

    connection.registerMessages({
        events: new Map<number, Function>([
            [ IncomingHeaders.ROOM_SETTINGS_DATA, RoomSettingsPermissionsEvent ]
        ]),
        composers: new Map<number, Function>([
            [ OutgoingHeaders.ROOM_SETTINGS_REQUEST, RoomSettingsPermissionsRequestComposer ],
            [ OutgoingHeaders.ROOM_SETTINGS_SAVE, RoomSettingsPermissionsSaveComposer ],
            [ OutgoingHeaders.ROOM_SKIN_SAVE, RoomSkinSaveComposer ]
        ])
    });

    registered = true;
}

class SimpleComposer<T extends any[]> implements IMessageComposer<T>
{
    private _data: T;

    constructor(...data: T)
    {
        this._data = data;
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

export class RoomSettingsPermissionsRequestComposer extends SimpleComposer<[ number ]> {}

export class RoomSkinSaveComposer extends SimpleComposer<[ number, string, string, string ]> {}

export class RoomSettingsPermissionsSaveComposer implements IMessageComposer<any[]>
{
    private _data: any[];

    constructor(roomId: number, permissions: IRoomPermissions)
    {
        this._data = [ roomId, ...ROOM_PERMISSION_FLAGS.map(flag => !!permissions[flag]), permissions.diagonalMode, permissions.setSpeed ];
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

export class RoomSettingsPermissionsParser implements IMessageParser
{
    public roomId: number = 0;
    public permissions: IRoomPermissions = { ...DEFAULT_ROOM_PERMISSIONS };

    public flush(): boolean
    {
        this.roomId = 0;
        this.permissions = { ...DEFAULT_ROOM_PERMISSIONS };

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this.roomId = wrapper.readInt();

        const permissions = { ...DEFAULT_ROOM_PERMISSIONS };

        for(const flag of ROOM_PERMISSION_FLAGS) permissions[flag] = wrapper.readBoolean();

        permissions.diagonalMode = wrapper.readInt();
        permissions.setSpeed = wrapper.readInt();
        this.permissions = permissions;

        return true;
    }
}

export class RoomSettingsPermissionsEvent extends MessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, RoomSettingsPermissionsParser);
    }

    public getParser(): RoomSettingsPermissionsParser
    {
        return this.parser as RoomSettingsPermissionsParser;
    }
}
