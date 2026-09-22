import { IMessageComposer, IMessageDataWrapper, IMessageParser, MessageEvent } from '@nitrots/nitro-renderer';
import { GetConnection } from '../nitro';

// Real, hCMS-owned protocol extension for the Builder Mode bulk/region editor (fill an area, bulk
// pickup, bulk height, copy/paste a region, bulk move, undo). Re-derived for this fork's own real
// Arcturus-Community-Wired handlers - NOT a port of any third party's wire format, since no such
// format was ever available to this project (see BuilderModeToolbarView.tsx's own docblock for the
// full context). Structured identically to ../wired-chests/ChestProtocol.ts, this codebase's own
// already-proven pattern for a self-registering custom message extension.

export enum BuilderActionType
{
    FILL = 0,
    ERASE = 1,
    HEIGHT = 2,
    COPY = 3,
    PASTE = 4,
    MOVE = 5,
    UNDO = 6
}

// Real header numbers - verified against a full grep of Arcturus-Community-Wired's own
// Incoming.java/Outgoing.java before being chosen: nothing in either file used 4195-4230 at the
// time this was written. If a future stock update ever claims one of these, bump this whole block
// (and the matching Java constants) together - the exact numbers are arbitrary, only agreement
// between the two sides matters.
const OutgoingHeaders = {
    BUILDER_MODE_ENTER: 4200,
    BUILDER_MODE_EXIT: 4201,
    BUILDER_FILL_AREA: 4202,
    BUILDER_ERASE_AREA: 4203,
    BUILDER_SET_HEIGHT_AREA: 4204,
    BUILDER_COPY_AREA: 4205,
    BUILDER_PASTE_AT_TILE: 4206,
    BUILDER_BULK_MOVE: 4207,
    BUILDER_UNDO: 4208
};

const IncomingHeaders = {
    BUILDER_MODE_SETTINGS: 4220,
    BUILDER_ACTION_RESULT: 4221,
    BUILDER_CLIPBOARD: 4222
};

let registered = false;

export const RegisterBuilderModeMessages = () =>
{
    if(registered) return;

    const connection = GetConnection();

    if(!connection) return;

    connection.registerMessages({
        events: new Map<number, Function>([
            [ IncomingHeaders.BUILDER_MODE_SETTINGS, BuilderModeSettingsEvent ],
            [ IncomingHeaders.BUILDER_ACTION_RESULT, BuilderActionResultEvent ],
            [ IncomingHeaders.BUILDER_CLIPBOARD, BuilderClipboardEvent ]
        ]),
        composers: new Map<number, Function>([
            [ OutgoingHeaders.BUILDER_MODE_ENTER, BuilderModeEnterComposer ],
            [ OutgoingHeaders.BUILDER_MODE_EXIT, BuilderModeExitComposer ],
            [ OutgoingHeaders.BUILDER_FILL_AREA, BuilderFillAreaComposer ],
            [ OutgoingHeaders.BUILDER_ERASE_AREA, BuilderEraseAreaComposer ],
            [ OutgoingHeaders.BUILDER_SET_HEIGHT_AREA, BuilderSetHeightAreaComposer ],
            [ OutgoingHeaders.BUILDER_COPY_AREA, BuilderCopyAreaComposer ],
            [ OutgoingHeaders.BUILDER_PASTE_AT_TILE, BuilderPasteAtTileComposer ],
            [ OutgoingHeaders.BUILDER_BULK_MOVE, BuilderBulkMoveComposer ],
            [ OutgoingHeaders.BUILDER_UNDO, BuilderUndoComposer ]
        ])
    });

    registered = true;
}

abstract class Composer<T extends unknown[]> implements IMessageComposer<T>
{
    protected _data: T;

    public getMessageArray(): T
    {
        return this._data;
    }

    public dispose(): void
    {
        return;
    }
}

export class BuilderModeEnterComposer extends Composer<unknown[]>
{
    constructor()
    {
        super();
        this._data = [];
    }
}

export class BuilderModeExitComposer extends Composer<unknown[]>
{
    constructor()
    {
        super();
        this._data = [];
    }
}

// baseId is the real items_base id (what the room object's own FURNITURE_TYPE_ID resolves to) -
// the server selects which of the caller's own matching owned items to consume, tile by tile; the
// client never claims a specific item instance id for a fill.
export class BuilderFillAreaComposer extends Composer<[number, number, number, number, number, number]>
{
    constructor(startX: number, startY: number, endX: number, endY: number, baseId: number, rotation: number)
    {
        super();
        this._data = [ startX, startY, endX, endY, baseId, rotation ];
    }
}

export class BuilderEraseAreaComposer extends Composer<[number, number, number, number]>
{
    constructor(startX: number, startY: number, endX: number, endY: number)
    {
        super();
        this._data = [ startX, startY, endX, endY ];
    }
}

// deltaCenti is a signed height delta multiplied by 100 (matches this project's own existing
// height-step convention - see BuilderModeToolbarView.tsx's own [1, 0.1, 0.01] steppers) so the
// wire never needs a float.
export class BuilderSetHeightAreaComposer extends Composer<[number, number, number, number, number]>
{
    constructor(startX: number, startY: number, endX: number, endY: number, deltaCenti: number)
    {
        super();
        this._data = [ startX, startY, endX, endY, deltaCenti ];
    }
}

export class BuilderCopyAreaComposer extends Composer<[number, number, number, number]>
{
    constructor(startX: number, startY: number, endX: number, endY: number)
    {
        super();
        this._data = [ startX, startY, endX, endY ];
    }
}

export class BuilderPasteAtTileComposer extends Composer<[number, number]>
{
    constructor(x: number, y: number)
    {
        super();
        this._data = [ x, y ];
    }
}

export class BuilderBulkMoveComposer extends Composer<unknown[]>
{
    constructor(objectIds: number[], deltaX: number, deltaY: number)
    {
        super();
        this._data = [ objectIds.length, ...objectIds, deltaX, deltaY ];
    }
}

export class BuilderUndoComposer extends Composer<unknown[]>
{
    constructor()
    {
        super();
        this._data = [];
    }
}

export class BuilderModeSettingsParser implements IMessageParser
{
    public enabled = false;
    public canUse = false;
    public maxRegionTiles = 0;
    public maxItemsPerOp = 0;
    public undoAvailable = false;

    public flush(): boolean
    {
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this.enabled = wrapper.readBoolean();
        this.canUse = wrapper.readBoolean();
        this.maxRegionTiles = wrapper.readInt();
        this.maxItemsPerOp = wrapper.readInt();
        this.undoAvailable = wrapper.readBoolean();

        return true;
    }
}

export interface BuilderActionShortfall
{
    baseId: number;
    required: number;
    available: number;
}

export class BuilderActionResultParser implements IMessageParser
{
    public actionType = BuilderActionType.FILL;
    public code = 0;
    public processed = 0;
    public failed = 0;
    public shortfall: BuilderActionShortfall[] = [];
    public undoAvailable = false;

    public flush(): boolean
    {
        this.shortfall = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this.actionType = wrapper.readInt();
        this.code = wrapper.readInt();
        this.processed = wrapper.readInt();
        this.failed = wrapper.readInt();

        let count = wrapper.readInt();

        while(count > 0)
        {
            this.shortfall.push({ baseId: wrapper.readInt(), required: wrapper.readInt(), available: wrapper.readInt() });
            count--;
        }

        this.undoAvailable = wrapper.readBoolean();

        return true;
    }
}

export class BuilderModeSettingsEvent extends MessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, BuilderModeSettingsParser);
    }

    public getParser(): BuilderModeSettingsParser
    {
        return this.parser as BuilderModeSettingsParser;
    }
}

export class BuilderActionResultEvent extends MessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, BuilderActionResultParser);
    }

    public getParser(): BuilderActionResultParser
    {
        return this.parser as BuilderActionResultParser;
    }
}

export interface BuilderClipboardLine
{
    spriteId: number;
    name: string;
    count: number;
}

export class BuilderClipboardParser implements IMessageParser
{
    public width = 0;
    public length = 0;
    public total = 0;
    public lines: BuilderClipboardLine[] = [];

    public flush(): boolean
    {
        this.lines = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this.width = wrapper.readInt();
        this.length = wrapper.readInt();
        this.total = wrapper.readInt();

        let count = wrapper.readInt();

        while(count > 0)
        {
            this.lines.push({ spriteId: wrapper.readInt(), name: wrapper.readString(), count: wrapper.readInt() });
            count--;
        }

        return true;
    }
}

export class BuilderClipboardEvent extends MessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, BuilderClipboardParser);
    }

    public getParser(): BuilderClipboardParser
    {
        return this.parser as BuilderClipboardParser;
    }
}
