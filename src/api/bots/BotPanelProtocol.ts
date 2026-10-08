import { IMessageComposer, IMessageDataWrapper, IMessageParser, MessageEvent } from '@nitrots/nitro-renderer';
import { GetConnection } from '../nitro';

// Staff bot panel (Mod Tools > Bots). Wire format: see hcms-emulator-plugin's bots/BotPanelProtocol.java,
// BotPanelActionEvent.java and BotPanelStateComposer.java. The server checks the support-tool permission on every request.

const IncomingHeaders = {
    BOT_PANEL_STATE: 9547,
    BOT_TEMPLATE_DETAIL: 9549
};

const OutgoingHeaders = {
    BOT_PANEL_REQUEST: 9546,
    BOT_PANEL_ACTION: 9548,
    BOT_TEMPLATE_DETAIL_REQUEST: 9550
};

let registered = false;

export const RegisterBotPanelMessages = () =>
{
    if(registered) return;

    const connection = GetConnection();

    if(!connection) return;

    connection.registerMessages({
        events: new Map<number, Function>([
            [ IncomingHeaders.BOT_PANEL_STATE, BotPanelStateEvent ],
            [ IncomingHeaders.BOT_TEMPLATE_DETAIL, BotTemplateDetailEvent ]
        ]),
        composers: new Map<number, Function>([
            [ OutgoingHeaders.BOT_PANEL_REQUEST, BotPanelRequestComposer ],
            [ OutgoingHeaders.BOT_PANEL_ACTION, BotPanelActionComposer ],
            [ OutgoingHeaders.BOT_TEMPLATE_DETAIL_REQUEST, BotTemplateDetailRequestComposer ]
        ])
    });

    registered = true;
}

export class BotPanelRequestComposer implements IMessageComposer<[ number ]>
{
    private _data: [ number ] = [ 0 ];

    public getMessageArray()
    {
        return this._data;
    }

    public dispose(): void
    {
        return;
    }
}

export type BotPanelAction =
    'create' | 'enable' | 'disable' | 'delete' | 'builder' | 'enter' | 'leave' | 'say' |
    'bulk_create' | 'mass_enable' | 'mass_disable' | 'mass_builder_on' | 'mass_builder_off' | 'mass_delete' |
    'mass_enter' | 'mass_leave' | 'mass_scatter' | 'mass_say' | 'mass_dance' |
    'mass_summon' | 'mass_befriend' | 'mass_unfriend' | 'forget_relations' | 'seed_learned' | 'import_logs' |
    'template_build' | 'template_heights' | 'template_delete' | 'template_delete_many' | 'template_scan' |
    'setting' | 'clear_learned';

export class BotPanelActionComposer implements IMessageComposer<[ string, number, number, string, string, string ]>
{
    private _data: [ string, number, number, string, string, string ];

    constructor(action: BotPanelAction, userId: number = 0, number: number = 0, text: string = '', text2: string = '', ids: number[] = [])
    {
        this._data = [ action, userId, number, text, text2, ids.join(',') ];
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

export interface BotPanelTemplate
{
    file: string;
    hotel: string;
    label: string;
    tiles: number;
    floorItems: number;
    wallItems: number;
}

export interface BotPanelBot
{
    userId: number;
    name: string;
    look: string;
    gender: string;
    switchedOn: boolean;
    online: boolean;
    roomId: number;
    roomName: string;
    inGame: boolean;
    builder: boolean;
    ownedRooms: number;
    friends: number;
}

export class BotPanelStateParser implements IMessageParser
{
    public error: string = '';
    public enabled: boolean = false;
    public chat: boolean = true;
    public games: boolean = true;
    public dance: boolean = true;
    public stayMin: number = 4;
    public stayMax: number = 15;
    public learn: boolean = true;
    public learnMax: number = 500;
    public learnedPhrases: number = 0;
    public learnedReplies: number = 0;
    public chatty: number = 50;
    public greet: number = 40;
    public reply: number = 60;
    public typos: boolean = true;
    public build: boolean = true;
    public buildRooms: number = 1;
    public buildFurni: number = 30;
    public buildInterval: number = 20;
    public maxBots: number = 100;
    public botChat: number = 35;
    public buildRugs: boolean = true;
    public buildDecor: boolean = true;
    public buildChairs: number = 4;
    public buildHome: number = 75;
    public buildSessionMin: number = 6;
    public buildSessionMax: number = 12;
    public buildPaint: boolean = true;
    public friends: boolean = true;
    public friendAfter: number = 12;
    public accept: number = 90;
    public follow: number = 40;
    public relationships: boolean = true;
    public buildTemplates: number = 50;
    public bots: BotPanelBot[] = [];
    public lastBuild: string = '';
    public templates: BotPanelTemplate[] = [];

    public flush(): boolean
    {
        this.error = '';
        this.bots = [];
        this.templates = [];
        this.lastBuild = '';

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this.error = wrapper.readString();
        this.enabled = wrapper.readBoolean();
        this.chat = wrapper.readBoolean();
        this.games = wrapper.readBoolean();
        this.dance = wrapper.readBoolean();
        this.stayMin = wrapper.readInt();
        this.stayMax = wrapper.readInt();
        this.learn = wrapper.readBoolean();
        this.learnMax = wrapper.readInt();
        this.learnedPhrases = wrapper.readInt();
        this.learnedReplies = wrapper.readInt();
        this.chatty = wrapper.readInt();
        this.greet = wrapper.readInt();
        this.reply = wrapper.readInt();
        this.typos = wrapper.readBoolean();
        this.build = wrapper.readBoolean();
        this.buildRooms = wrapper.readInt();
        this.buildFurni = wrapper.readInt();
        this.buildInterval = wrapper.readInt();
        this.maxBots = wrapper.readInt();
        this.botChat = wrapper.readInt();
        this.buildRugs = wrapper.readBoolean();
        this.buildDecor = wrapper.readBoolean();
        this.buildChairs = wrapper.readInt();
        this.buildHome = wrapper.readInt();
        this.buildSessionMin = wrapper.readInt();
        this.buildSessionMax = wrapper.readInt();
        this.buildPaint = wrapper.readBoolean();
        this.friends = wrapper.readBoolean();
        this.friendAfter = wrapper.readInt();
        this.accept = wrapper.readInt();
        this.follow = wrapper.readInt();
        this.relationships = wrapper.readBoolean();
        this.buildTemplates = wrapper.readInt();

        let count = wrapper.readInt();

        while(count > 0)
        {
            const userId = wrapper.readInt();
            const name = wrapper.readString();
            const look = wrapper.readString();
            const gender = wrapper.readString();
            const switchedOn = wrapper.readBoolean();
            const online = wrapper.readBoolean();
            const roomId = wrapper.readInt();
            const roomName = wrapper.readString();
            const inGame = wrapper.readBoolean();
            const builder = wrapper.readBoolean();
            const ownedRooms = wrapper.readInt();
            const friends = wrapper.readInt();

            this.bots.push({ userId, name, look, gender, switchedOn, online, roomId, roomName, inGame, builder, ownedRooms, friends });
            count--;
        }

        this.lastBuild = wrapper.readString();

        let templateCount = wrapper.readInt();

        while(templateCount > 0)
        {
            const file = wrapper.readString();
            const hotel = wrapper.readString();
            const label = wrapper.readString();
            const tiles = wrapper.readInt();
            const floorItems = wrapper.readInt();
            const wallItems = wrapper.readInt();

            this.templates.push({ file, hotel, label, tiles, floorItems, wallItems });
            templateCount--;
        }

        return true;
    }
}

export class BotPanelStateEvent extends MessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, BotPanelStateParser);
    }

    public getParser(): BotPanelStateParser
    {
        return this.parser as BotPanelStateParser;
    }
}

export class BotTemplateDetailRequestComposer implements IMessageComposer<[ string ]>
{
    private _data: [ string ];

    constructor(file: string)
    {
        this._data = [ file ];
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

// status: 0 = will be placed, 1 = this hotel does not have it, 2 = never placed from a template (teleports, wired, gifts ...)
export interface BotTemplateKind
{
    className: string;
    name: string;
    count: number;
    wall: boolean;
    status: number;
}

export class BotTemplateDetailParser implements IMessageParser
{
    public file: string = '';
    public label: string = '';
    public doorX: number = 0;
    public doorY: number = 0;
    public doorDirection: number = 0;
    public rows: string[] = [];
    public kinds: BotTemplateKind[] = [];

    public flush(): boolean
    {
        this.rows = [];
        this.kinds = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this.file = wrapper.readString();
        this.label = wrapper.readString();
        this.doorX = wrapper.readInt();
        this.doorY = wrapper.readInt();
        this.doorDirection = wrapper.readInt();

        let rowCount = wrapper.readInt();

        while(rowCount > 0)
        {
            this.rows.push(wrapper.readString());
            rowCount--;
        }

        let kindCount = wrapper.readInt();

        while(kindCount > 0)
        {
            const className = wrapper.readString();
            const name = wrapper.readString();
            const count = wrapper.readInt();
            const wall = wrapper.readBoolean();
            const status = wrapper.readInt();

            this.kinds.push({ className, name, count, wall, status });
            kindCount--;
        }

        return true;
    }
}

export class BotTemplateDetailEvent extends MessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, BotTemplateDetailParser);
    }

    public getParser(): BotTemplateDetailParser
    {
        return this.parser as BotTemplateDetailParser;
    }
}
