import { IMessageComposer, IMessageDataWrapper, IMessageParser, MessageEvent } from '@nitrots/nitro-renderer';
import { GetConnection } from '../nitro';

// Rarity of a furni for the in-game info panel (hcms-emulator-plugin's RarityProtocol, 9540-9543).
// HabboCity's client shows a "rare plate" on a rare furni's info panel, taking the level from a field its
// server adds to every floor item (a patched renderer). The stock renderer used here cannot parse an extra
// field, so the levels arrive on their own: one map (sprite id -> tier code) at start, plus a per-furni
// "an open room that has this rare" lookup when a rare's panel opens.

const IncomingHeaders = {
    RARE_LEVELS_DATA: 9541,
    RARE_ROOM_DATA: 9543,
    BADGE_RARITY_DATA: 9677
};

const OutgoingHeaders = {
    RARE_LEVELS_REQUEST: 9540,
    RARE_ROOM_REQUEST: 9542,
    BADGE_RARITY_REQUEST: 9676
};

let registered = false;

export const RegisterRarityMessages = () =>
{
    if(registered) return;

    const connection = GetConnection();

    if(!connection) return;

    connection.registerMessages({
        events: new Map<number, Function>([
            [ IncomingHeaders.RARE_LEVELS_DATA, RareLevelsDataEvent ],
            [ IncomingHeaders.RARE_ROOM_DATA, RareRoomDataEvent ],
            [ IncomingHeaders.BADGE_RARITY_DATA, BadgeRarityDataEvent ]
        ]),
        composers: new Map<number, Function>([
            [ OutgoingHeaders.RARE_LEVELS_REQUEST, RareLevelsRequestComposer ],
            [ OutgoingHeaders.RARE_ROOM_REQUEST, RareRoomRequestComposer ],
            [ OutgoingHeaders.BADGE_RARITY_REQUEST, BadgeRarityRequestComposer ]
        ])
    });

    registered = true;
}

export class RareLevelsRequestComposer implements IMessageComposer<unknown[]>
{
    public getMessageArray()
    {
        return [];
    }

    public dispose(): void
    {
        return;
    }
}

export class RareRoomRequestComposer implements IMessageComposer<[ number ]>
{
    private _data: [ number ];

    constructor(spriteId: number)
    {
        this._data = [ spriteId ];
    }

    public getMessageArray()
    {
        return this._data;
    }

    public dispose(): void
    {
        this._data = null;
    }
}

export class RareLevelsDataParser implements IMessageParser
{
    public levels: Map<number, string> = new Map();

    public flush(): boolean
    {
        this.levels = new Map();

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        let count = wrapper.readInt();

        while(count > 0)
        {
            const spriteId = wrapper.readInt();

            this.levels.set(spriteId, wrapper.readString());
            count--;
        }

        return true;
    }
}

export class RareLevelsDataEvent extends MessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, RareLevelsDataParser);
    }

    public getParser(): RareLevelsDataParser
    {
        return this.parser as RareLevelsDataParser;
    }
}

export class RareRoomDataParser implements IMessageParser
{
    public spriteId = 0;
    public roomId = 0;
    public roomName = '';

    public flush(): boolean
    {
        this.spriteId = 0;
        this.roomId = 0;
        this.roomName = '';

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this.spriteId = wrapper.readInt();
        this.roomId = wrapper.readInt();
        this.roomName = wrapper.readString();

        return true;
    }
}

export class RareRoomDataEvent extends MessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, RareRoomDataParser);
    }

    public getParser(): RareRoomDataParser
    {
        return this.parser as RareRoomDataParser;
    }
}

export class BadgeRarityRequestComposer implements IMessageComposer<[ string ]>
{
    private _data: [ string ];

    constructor(badgeCode: string) { this._data = [ badgeCode ]; }

    public getMessageArray() { return this._data; }

    public dispose(): void { return; }
}

export class BadgeRarityDataParser implements IMessageParser
{
    public badgeCode: string = '';
    public count: number = 0;
    public level: number = 0;

    public flush(): boolean
    {
        this.badgeCode = '';
        this.count = 0;
        this.level = 0;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this.badgeCode = wrapper.readString();
        this.count = wrapper.readInt();
        this.level = wrapper.readInt();

        return true;
    }
}

export class BadgeRarityDataEvent extends MessageEvent
{
    constructor(callBack: Function) { super(callBack, BadgeRarityDataParser); }

    public getParser(): BadgeRarityDataParser { return this.parser as BadgeRarityDataParser; }
}
