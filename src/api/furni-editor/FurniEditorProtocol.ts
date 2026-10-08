import { IMessageComposer, IMessageDataWrapper, IMessageParser, MessageEvent } from '@nitrots/nitro-renderer';
import { GetConnection } from '../nitro';

// hCMS Furni Editor (own plugin: hcms-furnieditor-plugin, com.hcms.furnieditor). Admin only (rank 7+).
// Field order must match the Java side exactly (FurniEditorHeaders / ItemRow / FurniEditorUpdateEvent).

const OutgoingHeaders = { SEARCH: 9569, DETAIL: 9570, UPDATE: 9571, INTERACTIONS: 9572, PAGE_ITEMS: 9573, RENAME: 9579, TEST_FURNI: 9581, WORDS: 9584, WORD_SAVE: 9585, DOWNLOAD: 9587, ACTIVITY: 9611 };
const IncomingHeaders = { SEARCH: 9574, DETAIL: 9575, UPDATE: 9576, INTERACTIONS: 9577, PAGE_ITEMS: 9578, RENAME: 9580, TEST_FURNI: 9583, WORDS: 9586, DOWNLOAD: 9588, ACTIVITY: 9612 };

let registered = false;

export const RegisterFurniEditorMessages = () =>
{
    if(registered) return;

    const connection = GetConnection();

    if(!connection) return;

    connection.registerMessages({
        events: new Map<number, Function>([
            [ IncomingHeaders.SEARCH, FurniEditorSearchResultEvent ],
            [ IncomingHeaders.DETAIL, FurniEditorDetailEvent ],
            [ IncomingHeaders.UPDATE, FurniEditorUpdateResultEvent ],
            [ IncomingHeaders.INTERACTIONS, FurniEditorInteractionsEvent ],
            [ IncomingHeaders.PAGE_ITEMS, FurniEditorPageItemsEvent ],
            [ IncomingHeaders.RENAME, FurniEditorRenameResultEvent ],
            [ IncomingHeaders.TEST_FURNI, FurniEditorTestFurniResultEvent ],
            [ IncomingHeaders.WORDS, FurniEditorWordsEvent ],
            [ IncomingHeaders.DOWNLOAD, FurniEditorDownloadResultEvent ],
            [ IncomingHeaders.ACTIVITY, FurniEditorActivityEvent ]
        ]),
        composers: new Map<number, Function>([
            [ OutgoingHeaders.SEARCH, FurniEditorSearchComposer ],
            [ OutgoingHeaders.DETAIL, FurniEditorDetailComposer ],
            [ OutgoingHeaders.UPDATE, FurniEditorUpdateComposer ],
            [ OutgoingHeaders.INTERACTIONS, FurniEditorInteractionsComposer ],
            [ OutgoingHeaders.PAGE_ITEMS, FurniEditorPageItemsComposer ],
            [ OutgoingHeaders.RENAME, FurniEditorRenameComposer ],
            [ OutgoingHeaders.TEST_FURNI, FurniEditorTestFurniComposer ],
            [ OutgoingHeaders.WORDS, FurniEditorWordsComposer ],
            [ OutgoingHeaders.WORD_SAVE, FurniEditorWordSaveComposer ],
            [ OutgoingHeaders.DOWNLOAD, FurniEditorDownloadComposer ],
            [ OutgoingHeaders.ACTIVITY, FurniEditorActivityComposer ]
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

export class FurniEditorSearchComposer extends SimpleComposer<[ string, string, number ]>
{
    constructor(query: string, type: string, page: number) { super(); this._data = [ query, type, page ]; }
}

export class FurniEditorRenameComposer extends SimpleComposer<[ number, string ]>
{
    constructor(id: number, name: string) { super(); this._data = [ id, name.trim() ]; }
}

// staff-added word translations (hcms_furni_words): ask for the list / add, change or delete ("" english) one word
export class FurniEditorWordsComposer extends SimpleComposer<[]>
{
    constructor() { super(); this._data = []; }
}

export class FurniEditorWordSaveComposer extends SimpleComposer<[ string, string, string ]>
{
    constructor(word: string, english: string, kind: 'adj' | 'noun') { super(); this._data = [ word, english.trim(), kind ]; }
}

// download the furni's .nitro / icon from other hotels (hcms_furni_sources); replace = also replace files we already have
export class FurniEditorDownloadComposer extends SimpleComposer<[ number, boolean ]>
{
    constructor(id: number, replace: boolean) { super(); this._data = [ id, replace ]; }
}

// items_base id to place a real test furni in front of you in the current room; 0 removes it
export class FurniEditorTestFurniComposer extends SimpleComposer<[ number ]>
{
    constructor(id: number) { super(); this._data = [ id ]; }
}

export class FurniEditorDetailComposer extends SimpleComposer<[ number ]>
{
    constructor(id: number) { super(); this._data = [ id ]; }
}

export class FurniEditorInteractionsComposer extends SimpleComposer<[]>
{
    constructor() { super(); this._data = []; }
}

export class FurniEditorPageItemsComposer extends SimpleComposer<[ number ]>
{
    constructor(pageId: number) { super(); this._data = [ pageId ]; }
}

export interface IFurniEditorItem
{
    id: number;
    spriteId: number;
    itemName: string;
    publicName: string;
    type: string;
    interactionType: string;
    width?: number;
    length?: number;
    stackHeight?: string;
    allowStack?: boolean;
    allowSit?: boolean;
    allowLay?: boolean;
    allowWalk?: boolean;
    allowGift?: boolean;
    allowTrade?: boolean;
    allowRecycle?: boolean;
    allowMarketplaceSell?: boolean;
    allowInventoryStack?: boolean;
    modes?: number;
    customparams?: string;
    vendingIds?: string;
    effectMale?: number;
    effectFemale?: number;
    clothingOnWalk?: string;
    multiheight?: string;
    usageCount?: number;
}

export interface IFurniEditorOffer
{
    catalogItemId: number;
    pageId: number;
    pageName: string;
    costCredits: number;
    costPoints: number;
    pointsType: number;
}

// A name this classname has in other hotels (Hab-Track stock_retro, 85 hotels): how many use it, their languages
export interface IFurniEditorHotelName
{
    name: string;
    hotels: number;
    languages: string;
    hotelList?: string;   // the hotels using this name, comma separated (page-items reply only)
}

// The same classname in a local reference hotel database (hubblycata / habboworld / ltdhabbo), used as evidence
export interface IFurniEditorReference
{
    source: string;
    sit: boolean;
    lay: boolean;
    walk: boolean;
    stackHeight: string;
    publicName: string;
    width?: number;     // newer plugin builds only
    length?: number;
    interactionType?: string;   // plugin 2026-09-28b+
    multiheight?: string;
}

export class FurniEditorUpdateComposer extends SimpleComposer<unknown[]>
{
    constructor(i: IFurniEditorItem)
    {
        super();
        this._data = [ i.id, i.width, i.length, String(i.stackHeight), !!i.allowStack, !!i.allowSit, !!i.allowLay, !!i.allowWalk,
            !!i.allowGift, !!i.allowTrade, !!i.allowRecycle, !!i.allowMarketplaceSell, !!i.allowInventoryStack,
            i.interactionType, i.modes, i.customparams ?? '', i.vendingIds ?? '', i.effectMale ?? 0, i.effectFemale ?? 0,
            i.clothingOnWalk ?? '', i.multiheight ?? '', (i.publicName ?? '').trim() ];
    }
}

const readBrief = (w: IMessageDataWrapper): IFurniEditorItem => ({
    id: w.readInt(), spriteId: w.readInt(), itemName: w.readString(), publicName: w.readString(), type: w.readString(), interactionType: w.readString()
});

const readFull = (w: IMessageDataWrapper): IFurniEditorItem =>
{
    const item = readBrief(w);

    item.width = w.readInt();
    item.length = w.readInt();
    item.stackHeight = w.readString();
    item.allowStack = w.readBoolean();
    item.allowSit = w.readBoolean();
    item.allowLay = w.readBoolean();
    item.allowWalk = w.readBoolean();
    item.allowGift = w.readBoolean();
    item.allowTrade = w.readBoolean();
    item.allowRecycle = w.readBoolean();
    item.allowMarketplaceSell = w.readBoolean();
    item.allowInventoryStack = w.readBoolean();
    item.modes = w.readInt();
    item.customparams = w.readString();
    item.vendingIds = w.readString();
    item.effectMale = w.readInt();
    item.effectFemale = w.readInt();
    item.clothingOnWalk = w.readString();
    item.multiheight = w.readString();
    item.usageCount = w.readInt();

    return item;
}

export class FurniEditorSearchResultParser implements IMessageParser
{
    public total = 0;
    public page = 1;
    public items: IFurniEditorItem[] = [];

    public flush(): boolean { this.total = 0; this.page = 1; this.items = []; return true; }

    public parse(w: IMessageDataWrapper): boolean
    {
        this.total = w.readInt();
        this.page = w.readInt();

        let count = w.readInt();

        while(count-- > 0) this.items.push(readBrief(w));

        return true;
    }
}

export class FurniEditorDetailParser implements IMessageParser
{
    public item: IFurniEditorItem = null;
    public offers: IFurniEditorOffer[] = [];
    public references: IFurniEditorReference[] = [];
    public furnidataName: string = '';
    public catalogNames: string[] = [];
    public hotelNames: IFurniEditorHotelName[] = [];

    public flush(): boolean { this.item = null; this.offers = []; this.references = []; this.furnidataName = ''; this.catalogNames = []; this.hotelNames = []; return true; }

    public parse(w: IMessageDataWrapper): boolean
    {
        if(!w.readBoolean()) return true;

        this.item = readFull(w);

        let count = w.readInt();

        while(count-- > 0) this.offers.push({ catalogItemId: w.readInt(), pageId: w.readInt(), pageName: w.readString(), costCredits: w.readInt(), costPoints: w.readInt(), pointsType: w.readInt() });

        // reference rows were added later; an older plugin build does not send them
        count = w.bytesAvailable ? w.readInt() : 0;

        while(count-- > 0) this.references.push({ source: w.readString(), sit: w.readBoolean(), lay: w.readBoolean(), walk: w.readBoolean(), stackHeight: w.readString(), publicName: w.readString() });

        if(!w.bytesAvailable) return true;

        this.furnidataName = w.readString();

        count = w.readInt();

        while(count-- > 0) this.catalogNames.push(w.readString());

        if(!w.bytesAvailable) return true;

        count = w.readInt();

        while(count-- > 0) this.hotelNames.push({ name: w.readString(), hotels: w.readInt(), languages: w.readString() });

        // each reference's width / length (plugin 2026-09-28+)
        if(!w.bytesAvailable) return true;

        count = w.readInt();

        for(let i = 0; i < count; i++)
        {
            const width = w.readInt(), length = w.readInt();

            if(this.references[i]) { this.references[i].width = width; this.references[i].length = length; }
        }

        // each reference's interaction type / multiheight (plugin 2026-09-28b+)
        if(!w.bytesAvailable) return true;

        count = w.readInt();

        for(let i = 0; i < count; i++)
        {
            const interactionType = w.readString(), multiheight = w.readString();

            if(this.references[i]) { this.references[i].interactionType = interactionType; this.references[i].multiheight = multiheight; }
        }

        return true;
    }
}

export class FurniEditorUpdateResultParser implements IMessageParser
{
    public success = false;
    public id = 0;
    public message = '';

    public flush(): boolean { this.success = false; this.id = 0; this.message = ''; return true; }

    public parse(w: IMessageDataWrapper): boolean
    {
        this.success = w.readBoolean();
        this.id = w.readInt();
        this.message = w.readString();

        return true;
    }
}

export class FurniEditorInteractionsParser implements IMessageParser
{
    public interactions: string[] = [];

    public flush(): boolean { this.interactions = []; return true; }

    public parse(w: IMessageDataWrapper): boolean
    {
        let count = w.readInt();

        while(count-- > 0) this.interactions.push(w.readString());

        return true;
    }
}

export class FurniEditorPageItemsParser implements IMessageParser
{
    public pageId = 0;
    public caption = '';
    public items: IFurniEditorItem[] = [];
    public names = new Map<number, IFurniEditorHotelName[]>();   // items_base id -> its top names in other hotels
    public edited = new Set<number>();                           // items_base ids already edited (audit log; plugin 2026-09-28+)
    public editors = new Map<number, { name: string, ago: number }>();   // who edited each furni last, seconds ago (team work)
    public othersHere: { name: string, ago: number }[] = [];          // other staff with this page open (last 15 min)

    public flush(): boolean { this.pageId = 0; this.caption = ''; this.items = []; this.names = new Map(); this.edited = new Set(); this.editors = new Map(); this.othersHere = []; return true; }

    public parse(w: IMessageDataWrapper): boolean
    {
        this.pageId = w.readInt();
        this.caption = w.readString();

        let count = w.readInt();

        while(count-- > 0) this.items.push(readBrief(w));

        if(!w.bytesAvailable) return true;

        // newer plugin builds put -2 first: then every name also carries its hotel list
        count = w.readInt();

        const withHotels = (count === -2);

        if(withHotels) count = w.readInt();

        while(count-- > 0)
        {
            const id = w.readInt();
            let n = w.readInt();
            const list: IFurniEditorHotelName[] = [];

            while(n-- > 0) list.push({ name: w.readString(), hotels: w.readInt(), languages: w.readString(), hotelList: withHotels ? w.readString() : '' });

            this.names.set(id, list);
        }

        if(!w.bytesAvailable) return true;

        count = w.readInt();

        while(count-- > 0) this.edited.add(w.readInt());

        // team work (plugin 2026-09-28+): who edited each furni last, and who else is on this page
        if(!w.bytesAvailable) return true;

        count = w.readInt();

        while(count-- > 0) { const id = w.readInt(); this.editors.set(id, { name: w.readString(), ago: w.readInt() }); }

        if(!w.bytesAvailable) return true;

        count = w.readInt();

        while(count-- > 0) this.othersHere.push({ name: w.readString(), ago: w.readInt() });

        return true;
    }
}

export class FurniEditorSearchResultEvent extends MessageEvent
{
    constructor(callBack: Function) { super(callBack, FurniEditorSearchResultParser); }
    public getParser(): FurniEditorSearchResultParser { return this.parser as FurniEditorSearchResultParser; }
}

export class FurniEditorDetailEvent extends MessageEvent
{
    constructor(callBack: Function) { super(callBack, FurniEditorDetailParser); }
    public getParser(): FurniEditorDetailParser { return this.parser as FurniEditorDetailParser; }
}

export class FurniEditorUpdateResultEvent extends MessageEvent
{
    constructor(callBack: Function) { super(callBack, FurniEditorUpdateResultParser); }
    public getParser(): FurniEditorUpdateResultParser { return this.parser as FurniEditorUpdateResultParser; }
}

export class FurniEditorInteractionsEvent extends MessageEvent
{
    constructor(callBack: Function) { super(callBack, FurniEditorInteractionsParser); }
    public getParser(): FurniEditorInteractionsParser { return this.parser as FurniEditorInteractionsParser; }
}

export class FurniEditorPageItemsEvent extends MessageEvent
{
    constructor(callBack: Function) { super(callBack, FurniEditorPageItemsParser); }
    public getParser(): FurniEditorPageItemsParser { return this.parser as FurniEditorPageItemsParser; }
}

export class FurniEditorRenameResultParser implements IMessageParser
{
    public success = false;
    public id = 0;
    public name = '';
    public message = '';

    public flush(): boolean { this.success = false; this.id = 0; this.name = ''; this.message = ''; return true; }

    public parse(w: IMessageDataWrapper): boolean
    {
        this.success = w.readBoolean();
        this.id = w.readInt();
        this.name = w.readString();
        this.message = w.readString();

        return true;
    }
}

export class FurniEditorRenameResultEvent extends MessageEvent
{
    constructor(callBack: Function) { super(callBack, FurniEditorRenameResultParser); }
    public getParser(): FurniEditorRenameResultParser { return this.parser as FurniEditorRenameResultParser; }
}

export class FurniEditorTestFurniResultParser implements IMessageParser
{
    public placed = false;
    public message = '';

    public flush(): boolean { this.placed = false; this.message = ''; return true; }

    public parse(w: IMessageDataWrapper): boolean
    {
        this.placed = w.readBoolean();
        this.message = w.readString();

        return true;
    }
}

export class FurniEditorTestFurniResultEvent extends MessageEvent
{
    constructor(callBack: Function) { super(callBack, FurniEditorTestFurniResultParser); }
    public getParser(): FurniEditorTestFurniResultParser { return this.parser as FurniEditorTestFurniResultParser; }
}

export interface IFurniEditorWord { word: string, english: string, kind: 'adj' | 'noun', addedBy: string }

export class FurniEditorWordsParser implements IMessageParser
{
    public words: IFurniEditorWord[] = [];

    public flush(): boolean { this.words = []; return true; }

    public parse(w: IMessageDataWrapper): boolean
    {
        let count = w.readInt();

        while(count-- > 0) this.words.push({ word: w.readString(), english: w.readString(), kind: (w.readString() === 'adj') ? 'adj' : 'noun', addedBy: w.readString() });

        return true;
    }
}

export class FurniEditorWordsEvent extends MessageEvent
{
    constructor(callBack: Function) { super(callBack, FurniEditorWordsParser); }
    public getParser(): FurniEditorWordsParser { return this.parser as FurniEditorWordsParser; }
}

export class FurniEditorDownloadResultParser implements IMessageParser
{
    public ok = false;
    public message = '';

    public flush(): boolean { this.ok = false; this.message = ''; return true; }

    public parse(w: IMessageDataWrapper): boolean
    {
        this.ok = w.readBoolean();
        this.message = w.readString();

        return true;
    }
}

export class FurniEditorDownloadResultEvent extends MessageEvent
{
    constructor(callBack: Function) { super(callBack, FurniEditorDownloadResultParser); }
    public getParser(): FurniEditorDownloadResultParser { return this.parser as FurniEditorDownloadResultParser; }
}

// ---- team work: my last work, recent edits, pages worked on, staff in the editor now (plugin FurniEditorWork, 9611/9612)

export class FurniEditorActivityComposer extends SimpleComposer<[]>
{
    constructor() { super(); this._data = []; }
}

export interface IFurniEditorActivityEdit { who: string, ago: number, itemId: number, itemName: string, fields: string }
export interface IFurniEditorActivityPage { pageId: number, caption: string, edited: number, total: number, lastBy: string, ago: number }
export interface IFurniEditorActivityStaff { who: string, pageCaption: string, itemName: string, ago: number }

export class FurniEditorActivityParser implements IMessageParser
{
    public mine: { pageId: number, pageCaption: string, itemId: number, itemName: string, ago: number } = null;
    public edits: IFurniEditorActivityEdit[] = [];
    public pages: IFurniEditorActivityPage[] = [];
    public staff: IFurniEditorActivityStaff[] = [];

    public flush(): boolean { this.mine = null; this.edits = []; this.pages = []; this.staff = []; return true; }

    public parse(w: IMessageDataWrapper): boolean
    {
        const mine = { pageId: w.readInt(), pageCaption: w.readString(), itemId: w.readInt(), itemName: w.readString(), ago: w.readInt() };

        this.mine = (mine.ago >= 0) ? mine : null;

        let count = w.readInt();

        while(count-- > 0) this.edits.push({ who: w.readString(), ago: w.readInt(), itemId: w.readInt(), itemName: w.readString(), fields: w.readString() });

        count = w.readInt();

        while(count-- > 0) this.pages.push({ pageId: w.readInt(), caption: w.readString(), edited: w.readInt(), total: w.readInt(), lastBy: w.readString(), ago: w.readInt() });

        count = w.readInt();

        while(count-- > 0) this.staff.push({ who: w.readString(), pageCaption: w.readString(), itemName: w.readString(), ago: w.readInt() });

        return true;
    }
}

export class FurniEditorActivityEvent extends MessageEvent
{
    constructor(callBack: Function) { super(callBack, FurniEditorActivityParser); }
    public getParser(): FurniEditorActivityParser { return this.parser as FurniEditorActivityParser; }
}
