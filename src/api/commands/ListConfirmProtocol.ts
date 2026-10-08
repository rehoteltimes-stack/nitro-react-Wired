import { IMessageComposer, IMessageDataWrapper, IMessageParser, MessageEvent } from '@nitrots/nitro-renderer';
import { GetConnection } from '../nitro';

// A deletion with more than one real thing in it (friends, furniture on a tile, ...) opens a window listing every
// item with a search box and a checkbox per item; see hcms-emulator-plugin's commands/ListConfirm.java (9563 / 9564).

const IncomingHeaders = {
    LIST_CONFIRM_ASK: 9563
};

const OutgoingHeaders = {
    LIST_CONFIRM_ANSWER: 9564
};

let registered = false;

export const RegisterListConfirmMessages = () =>
{
    if(registered) return;

    const connection = GetConnection();

    if(!connection) return;

    connection.registerMessages({
        events: new Map<number, Function>([
            [ IncomingHeaders.LIST_CONFIRM_ASK, ListConfirmAskEvent ]
        ]),
        composers: new Map<number, Function>([
            [ OutgoingHeaders.LIST_CONFIRM_ANSWER, ListConfirmAnswerComposer ]
        ])
    });

    registered = true;
}

export class ListConfirmAnswerComposer implements IMessageComposer<any[]>
{
    private _data: any[];

    constructor(token: string, accepted: boolean, selectedIds: number[])
    {
        this._data = [ token, accepted, selectedIds.length, ...selectedIds ];
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

export interface IListConfirmItem
{
    id: number;
    label: string;
}

export class ListConfirmAskParser implements IMessageParser
{
    public token = '';
    public title = '';
    public text = '';
    public items: IListConfirmItem[] = [];

    public flush(): boolean
    {
        this.token = '';
        this.title = '';
        this.text = '';
        this.items = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this.token = wrapper.readString();
        this.title = wrapper.readString();
        this.text = wrapper.readString();

        const count = wrapper.readInt();

        for(let i = 0; i < count; i++) this.items.push({ id: wrapper.readInt(), label: wrapper.readString() });

        return true;
    }
}

export class ListConfirmAskEvent extends MessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, ListConfirmAskParser);
    }

    public getParser(): ListConfirmAskParser
    {
        return this.parser as ListConfirmAskParser;
    }
}
