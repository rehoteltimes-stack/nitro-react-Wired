import { IMessageComposer, IMessageDataWrapper, IMessageParser, MessageEvent } from '@nitrots/nitro-renderer';
import { GetConfiguration } from '../nitro';
import { GetConnection } from '../nitro';

// hCMS Shop (own plugin: hcms-shop, com.hcms.shop). Every reply is one JSON string, so new item types or fields never
// need a protocol change. Headers come from ui-config.json "shop.headers" (defaults below) and must match the server's
// emulator_settings shop.header.*.

const DEFAULT_HEADERS = { inOpen: 9590, inBuy: 9591, inEquip: 9592, inRoom: 9593, inSpawn: 9594, outData: 9595, outResult: 9596, outAura: 9597, outRoom: 9598, outSpawn: 9599, inUser: 9600, outUser: 9601, inSetting: 9602, inName: 9615 };

const headers = (): typeof DEFAULT_HEADERS => ({ ...DEFAULT_HEADERS, ...(GetConfiguration<Partial<typeof DEFAULT_HEADERS>>('shop.headers', {}) || {}) });

let registered = false;

export const RegisterShopMessages = () =>
{
    if(registered) return;

    const connection = GetConnection();

    if(!connection) return;

    const h = headers();

    connection.registerMessages({
        events: new Map<number, Function>([
            [ h.outData, ShopDataEvent ],
            [ h.outResult, ShopResultEvent ],
            [ h.outAura, ShopUnitAuraEvent ],
            [ h.outRoom, ShopRoomAurasEvent ],
            [ h.outSpawn, ShopSpawnPlayEvent ],
            [ h.outUser, ShopUserEvent ]
        ]),
        composers: new Map<number, Function>([
            [ h.inOpen, ShopOpenComposer ],
            [ h.inBuy, ShopBuyComposer ],
            [ h.inEquip, ShopEquipComposer ],
            [ h.inRoom, ShopRoomAurasComposer ],
            [ h.inSpawn, ShopSpawnComposer ],
            [ h.inUser, ShopUserComposer ],
            [ h.inSetting, ShopSettingComposer ],
            [ h.inName, ShopNameSaveComposer ]
        ])
    });

    registered = true;
}

class SimpleComposer<T extends unknown[]> implements IMessageComposer<T>
{
    protected _data: T;

    public getMessageArray() { return this._data; }

    public dispose(): void { return; }
}

/** Open the shop / ask for fresh data, in a language ("" = the hotel's default). */
export class ShopOpenComposer extends SimpleComposer<[ string ]>
{
    constructor(language: string) { super(); this._data = [ language || '' ]; }
}

export class ShopBuyComposer extends SimpleComposer<[ string, number ]>
{
    constructor(itemType: string, itemId: number) { super(); this._data = [ itemType, itemId ]; }
}

/** itemId 0 = take it off. */
export class ShopEquipComposer extends SimpleComposer<[ string, number ]>
{
    constructor(itemType: string, itemId: number) { super(); this._data = [ itemType, itemId ]; }
}

export class ShopRoomAurasComposer extends SimpleComposer<[]>
{
    constructor() { super(); this._data = []; }
}

/** Play my equipped spawn for the room: entry = I just entered, false = :spawn. */
export class ShopSpawnComposer extends SimpleComposer<[ boolean ]>
{
    constructor(entry: boolean) { super(); this._data = [ entry ]; }
}

/** One of my own settings: hide_spawns (:nospawn), no_entry_spawn (:noentryspawn), hide_auras (:noaura). mode -1 = flip, 0 = off, 1 = on. */
export class ShopSettingComposer extends SimpleComposer<[ string, number ]>
{
    constructor(key: string, mode: number = -1) { super(); this._data = [ key, mode ]; }
}

/** Staff (shop.admin.rank): give (take = false) or take an item from a player. Answered with a result. */
/** Name tab: save my name tag (the style as one JSON string, checked again on the server). */
export class ShopNameSaveComposer extends SimpleComposer<[ string ]>
{
    constructor(style: IShopNameStyle) { super(); this._data = [ JSON.stringify(style || {}) ]; }
}

/** Chat commands that flip one of my settings (the same command turns it back). */
export const SHOP_SETTING_COMMANDS: { [command: string]: string } = { nospawn: 'hide_spawns', noentryspawn: 'no_entry_spawn', noaura: 'hide_auras', noornaments: 'hide_ornaments', noornament: 'hide_ornaments' };

/** A player's visible decorations (border), e.g. when their infostand opens. */
export class ShopUserComposer extends SimpleComposer<[ number ]>
{
    constructor(userId: number) { super(); this._data = [ userId ]; }
}

/**
 * Parser for replies whose body is one JSON document. A protocol string holds at most 65535 bytes, so the server sends
 * int count + that many parts, joined here before parsing.
 */
class JsonParser<T> implements IMessageParser
{
    public data: T = null;

    public flush(): boolean { this.data = null; return true; }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        try
        {
            let count = wrapper.readInt();
            let json = '';

            while(count-- > 0) json += wrapper.readString();

            this.data = JSON.parse(json) as T;
        }
        catch (error) { this.data = null; }

        return true;
    }
}

export interface IShopAuraVisual { id: number, effect: number, colorA: string, colorB: string, speed: number, intensity: number }

export interface IShopAura extends IShopAuraVisual
{
    code: string;
    tier: string;
    price: number;
    currencyType: number;
    vipOnly: boolean;
    name: string;
    description: string;
    owned: boolean;
}

export interface IShopSpawnVisual
{
    id: number;
    folder: string;
    frameCount: number;
    frameMs: number;
    frameWidth: number;
    frameHeight: number;
    scale: number;
    offsetX: number;
    offsetY: number;
    thumbFrame: number;
}

export interface IShopSpawn extends IShopSpawnVisual
{
    code: string;
    price: number;
    currencyType: number;
    vipOnly: boolean;
    name: string;
    owned: boolean;
}

export interface IShopSpawnPlay { roomId: number, unitId: number, framesUrl: string, spawn: IShopSpawnVisual }

/** URL of one frame: the hotel's pattern with %folder% and %frame% (4 digits). */
export const SpawnFrameUrl = (pattern: string, spawn: IShopSpawnVisual, frame: number) =>
    (pattern || '').replace('%folder%', spawn.folder).replace('%frame%', String(frame).padStart(4, '0'));

export interface IShopBorderVisual
{
    id: number;
    frame: string;
    overlay: string;
    mode: 'slice' | 'stretch';
    slice: string;
    boxLeft: number;
    boxTop: number;
    boxRight: number;
    boxBottom: number;
}

export interface IShopBorder extends IShopBorderVisual
{
    code: string;
    preview: string;
    price: number;
    currencyType: number;
    vipOnly: boolean;
    name: string;
    owned: boolean;
}

/** A small image behind a player's name when their avatar is clicked, with an optional overlay on top. */
export interface IShopOrnamentVisual
{
    id: number;
    image: string;
    overlay: string;
    width: number;
    height: number;
}

export interface IShopOrnament extends IShopOrnamentVisual
{
    code: string;
    price: number;
    currencyType: number;
    vipOnly: boolean;
    name: string;
    owned: boolean;
}

/** A player's own name tag (Name tab, like habbo.cc's "Nametag & Farben"). An empty colour = the normal colour. */
export interface IShopNameStyle
{
    tag: string;
    tagColor: string;
    nameColor: string;
    tagShadowColor: string;
    tagShadowBlur: number;
    tagShadowX: number;
    tagShadowY: number;
    nameShadowColor: string;
    nameShadowBlur: number;
    nameShadowX: number;
    nameShadowY: number;
    tagGlowColor: string;
    tagGlowSize: number;
    nameGlowColor: string;
    nameGlowSize: number;
}

/** The name tag plus the worn name decorations: color = "#a" or a gradient "#a,#b", border = outline colour, icon /
 *  background = file under namesUrl ("" = none). */
export interface IShopNameDecor extends IShopNameStyle
{
    color: string;
    border: string;
    icon: string;
    background: string;
}

/** A name decoration to collect (kind color / border / icon / background). */
export interface IShopNameItem
{
    id: number;
    code: string;
    kind: 'color' | 'border' | 'icon' | 'background';
    data: string;
    price: number;
    currencyType: number;
    vipOnly: boolean;
    name: string;
    owned: boolean;
    rankItem?: boolean;   // a rank's own colour / background (permissions table): free, only for that rank
}

export interface IShopUserDecor
{
    namesUrl?: string;
    name?: IShopNameDecor;
    userId: number;
    bordersUrl: string;
    border: IShopBorderVisual | null;
    ornamentsUrl: string;
    ornament: IShopOrnamentVisual | null;
    settings?: Record<string, boolean>;   // only in the reply about yourself: your Presence on/off settings
    premiumBubbles?: number[];   // only in the reply about yourself: chat styles that are sold
    ownedBubbles?: number[];     // ... and the ones of them you may use
}

/** A premium chat bubble (a chat.styles id) that is sold. */
export interface IShopBubble
{
    id: number;
    code: string;
    bubbleId: number;
    price: number;
    currencyType: number;
    vipOnly: boolean;
    name: string;
    owned: boolean;
}

export interface IShopData
{
    enabled: boolean;
    language: string;
    currencyType: number;
    balance: number;
    balanceTypes?: number[];   // currencies shown in the header (shop.balance.types), e.g. Diamonds, Emeralds, Snowflakes
    isVip: boolean;
    isAdmin: boolean;
    tabs: string[];
    tabIcons?: Record<string, string>;   // tab code -> icon URL for the tab's info box (shop_tabs.icon)
    texts: Record<string, string>;
    auras: IShopAura[];
    spawns: IShopSpawn[];
    spawnFramesUrl: string;
    borders: IShopBorder[];
    bordersUrl: string;
    ornaments: IShopOrnament[];
    ornamentsUrl: string;
    bubbles?: IShopBubble[];
    nameItems?: IShopNameItem[];
    nameStyle?: IShopNameStyle;
    namesUrl?: string;
    active: Record<string, number>;
}

export interface IShopResult { ok: boolean, key: string, message: string }

export interface IShopUnitAura { unitId: number, aura: IShopAuraVisual | null }

export interface IShopRoomAuras { roomId: number, units: IShopUnitAura[] }

class ShopDataParser extends JsonParser<IShopData> {}
class ShopResultParser extends JsonParser<IShopResult> {}
class ShopUnitAuraParser extends JsonParser<IShopUnitAura> {}
class ShopRoomAurasParser extends JsonParser<IShopRoomAuras> {}
class ShopSpawnPlayParser extends JsonParser<IShopSpawnPlay> {}
class ShopUserParser extends JsonParser<IShopUserDecor> {}

export class ShopDataEvent extends MessageEvent
{
    constructor(callBack: Function) { super(callBack, ShopDataParser); }
    public getParser(): ShopDataParser { return this.parser as ShopDataParser; }
}

export class ShopResultEvent extends MessageEvent
{
    constructor(callBack: Function) { super(callBack, ShopResultParser); }
    public getParser(): ShopResultParser { return this.parser as ShopResultParser; }
}

export class ShopUnitAuraEvent extends MessageEvent
{
    constructor(callBack: Function) { super(callBack, ShopUnitAuraParser); }
    public getParser(): ShopUnitAuraParser { return this.parser as ShopUnitAuraParser; }
}

export class ShopRoomAurasEvent extends MessageEvent
{
    constructor(callBack: Function) { super(callBack, ShopRoomAurasParser); }
    public getParser(): ShopRoomAurasParser { return this.parser as ShopRoomAurasParser; }
}

export class ShopSpawnPlayEvent extends MessageEvent
{
    constructor(callBack: Function) { super(callBack, ShopSpawnPlayParser); }
    public getParser(): ShopSpawnPlayParser { return this.parser as ShopSpawnPlayParser; }
}

export class ShopUserEvent extends MessageEvent
{
    constructor(callBack: Function) { super(callBack, ShopUserParser); }
    public getParser(): ShopUserParser { return this.parser as ShopUserParser; }
}
