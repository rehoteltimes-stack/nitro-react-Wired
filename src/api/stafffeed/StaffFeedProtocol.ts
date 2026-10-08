import { IMessageComposer, IMessageDataWrapper, IMessageParser, MessageEvent } from '@nitrots/nitro-renderer';
import { GetConnection } from '../nitro';

// Staff Tools window: the staff feed without typing :stafffeed. Server: hcms-emulator-plugin
// stafffeed/StaffFeedProtocol.java (IN 9620 state, IN 9621 action + argument, OUT 9622 state). The Staff feed card:
// OUT 9638 = every feed line live (tag, label, text, time, link), IN 9639 / OUT 9640 = the last lines of the log.

const IncomingHeaders = { STAFF_FEED_STATE: 9622, STAFF_FEED_LINE: 9638, STAFF_FEED_HISTORY: 9640, STAFF_FEED_HISTORY_SEARCH: 9642 };
const OutgoingHeaders = { STAFF_FEED_STATE_REQUEST: 9620, STAFF_FEED_ACTION: 9621, STAFF_FEED_HISTORY_REQUEST: 9639, STAFF_FEED_HISTORY_SEARCH_REQUEST: 9641 };
// History tab: IN 9641 (tag, search, beforeId) / OUT 9642 (the tags you may see, rows with their log id, more, beforeId).

let registered = false;

export const RegisterStaffFeedMessages = () =>
{
    if(registered) return;

    const connection = GetConnection();

    if(!connection) return;

    connection.registerMessages({
        events: new Map<number, Function>([
            [ IncomingHeaders.STAFF_FEED_STATE, StaffFeedStateEvent ],
            [ IncomingHeaders.STAFF_FEED_LINE, StaffFeedLineEvent ],
            [ IncomingHeaders.STAFF_FEED_HISTORY, StaffFeedHistoryEvent ],
            [ IncomingHeaders.STAFF_FEED_HISTORY_SEARCH, StaffFeedHistorySearchEvent ]
        ]),
        composers: new Map<number, Function>([
            [ OutgoingHeaders.STAFF_FEED_STATE_REQUEST, StaffFeedStateRequestComposer ],
            [ OutgoingHeaders.STAFF_FEED_ACTION, StaffFeedActionComposer ],
            [ OutgoingHeaders.STAFF_FEED_HISTORY_REQUEST, StaffFeedHistoryRequestComposer ],
            [ OutgoingHeaders.STAFF_FEED_HISTORY_SEARCH_REQUEST, StaffFeedHistorySearchComposer ]
        ])
    });

    registered = true;
}

export class StaffFeedStateRequestComposer implements IMessageComposer<[]>
{
    public getMessageArray(): [] { return []; }

    public dispose(): void { return; }
}

export class StaffFeedActionComposer implements IMessageComposer<[ string, string ]>
{
    private _data: [ string, string ];

    /** action: feed (on/off), tag (argument = tag), all, quiet, watch (argument = a Habbo name), duty (on/off) */
    constructor(action: string, argument: string = '')
    {
        this._data = [ action, argument ];
    }

    public getMessageArray() { return this._data; }

    public dispose(): void { return; }
}

export interface IStaffFeedTag { tag: string, label: string, description: string, shows: boolean }
export interface IStaffFeedWatch { username: string, addedBy: string, since: number, reason?: string, expires?: number }
export interface IStaffDuty { username: string, since: number }
export interface IStaffSetting { key: string, label: string, description: string, on: boolean, group: string }

export class StaffFeedStateParser implements IMessageParser
{
    public on = false;
    public tags: IStaffFeedTag[] = [];
    public watched: IStaffFeedWatch[] = [];
    public message = '';
    public onDuty = false;
    public duty: IStaffDuty[] = [];
    public settings: IStaffSetting[] = [];

    public flush(): boolean
    {
        this.on = false;
        this.tags = [];
        this.watched = [];
        this.message = '';
        this.onDuty = false;
        this.duty = [];
        this.settings = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this.on = wrapper.readBoolean();

        let count = wrapper.readInt();

        while(count-- > 0) this.tags.push({ tag: wrapper.readString(), label: wrapper.readString(), description: wrapper.readString(), shows: wrapper.readBoolean() });

        count = wrapper.readInt();

        while(count-- > 0) this.watched.push({ username: wrapper.readString(), addedBy: wrapper.readString(), since: wrapper.readInt() });

        this.message = wrapper.readString();

        // each flag's reason + expiry (0 = never), same order as the flags
        if(wrapper.bytesAvailable) for(const row of this.watched) { row.reason = wrapper.readString(); row.expires = wrapper.readInt(); }

        // duty (StaffDuty), only sent by newer plugin builds
        if(wrapper.bytesAvailable)
        {
            this.onDuty = wrapper.readBoolean();

            count = wrapper.readInt();

            while(count-- > 0) this.duty.push({ username: wrapper.readString(), since: wrapper.readInt() });

            // personal settings (StaffDuty.SETTINGS)
            if(wrapper.bytesAvailable)
            {
                count = wrapper.readInt();

                while(count-- > 0) this.settings.push({ key: wrapper.readString(), label: wrapper.readString(), description: wrapper.readString(), on: wrapper.readBoolean(), group: wrapper.readString() });
            }
        }

        return true;
    }
}

export class StaffFeedStateEvent extends MessageEvent
{
    constructor(callBack: Function) { super(callBack, StaffFeedStateParser); }

    public getParser(): StaffFeedStateParser { return this.parser as StaffFeedStateParser; }
}

export class StaffFeedHistoryRequestComposer implements IMessageComposer<[]>
{
    public getMessageArray(): [] { return []; }

    public dispose(): void { return; }
}

export interface IStaffFeedLine { tag: string, label: string, text: string, time: number, link: string }

export class StaffFeedLineParser implements IMessageParser
{
    public line: IStaffFeedLine = null;

    public flush(): boolean { this.line = null; return true; }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this.line = { tag: wrapper.readString(), label: wrapper.readString(), text: wrapper.readString(), time: wrapper.readInt(), link: wrapper.readString() };

        return true;
    }
}

export class StaffFeedLineEvent extends MessageEvent
{
    constructor(callBack: Function) { super(callBack, StaffFeedLineParser); }

    public getParser(): StaffFeedLineParser { return this.parser as StaffFeedLineParser; }
}

export class StaffFeedHistoryParser implements IMessageParser
{
    public lines: IStaffFeedLine[] = [];

    public flush(): boolean { this.lines = []; return true; }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        let count = wrapper.readInt();

        while(count-- > 0) this.lines.push({ tag: wrapper.readString(), label: wrapper.readString(), text: wrapper.readString(), time: wrapper.readInt(), link: '' });

        return true;
    }
}

export class StaffFeedHistoryEvent extends MessageEvent
{
    constructor(callBack: Function) { super(callBack, StaffFeedHistoryParser); }

    public getParser(): StaffFeedHistoryParser { return this.parser as StaffFeedHistoryParser; }
}

export class StaffFeedHistorySearchComposer implements IMessageComposer<[ string, string, number ]>
{
    private _data: [ string, string, number ];

    /** tag = '' for every tag you may see; beforeId = 0 for the newest lines, else the oldest id already shown */
    constructor(tag: string, search: string, beforeId: number) { this._data = [ tag, search, beforeId ]; }

    public getMessageArray() { return this._data; }

    public dispose(): void { return; }
}

export interface IStaffFeedHistoryRow extends IStaffFeedLine { logId: number }

export class StaffFeedHistorySearchParser implements IMessageParser
{
    public tags: { tag: string, label: string }[] = [];
    public rows: IStaffFeedHistoryRow[] = [];
    public more = false;
    public beforeId = 0;

    public flush(): boolean
    {
        this.tags = [];
        this.rows = [];
        this.more = false;
        this.beforeId = 0;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        let count = wrapper.readInt();

        while(count-- > 0) this.tags.push({ tag: wrapper.readString(), label: wrapper.readString() });

        count = wrapper.readInt();

        while(count-- > 0) this.rows.push({ logId: wrapper.readInt(), tag: wrapper.readString(), label: wrapper.readString(), text: wrapper.readString(), time: wrapper.readInt(), link: '' });

        this.more = wrapper.readBoolean();
        this.beforeId = wrapper.readInt();

        return true;
    }
}

export class StaffFeedHistorySearchEvent extends MessageEvent
{
    constructor(callBack: Function) { super(callBack, StaffFeedHistorySearchParser); }

    public getParser(): StaffFeedHistorySearchParser { return this.parser as StaffFeedHistorySearchParser; }
}
