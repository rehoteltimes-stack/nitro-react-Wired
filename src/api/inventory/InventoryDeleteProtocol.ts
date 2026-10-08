import { IMessageComposer } from '@nitrots/nitro-renderer';
import { GetConnection } from '../nitro';

const OutgoingHeaders = { DELETE_ITEMS: 10018, DELETE_BADGE: 10031 };

let registered = false;

export const RegisterInventoryDeleteMessages = () =>
{
    if(registered) return;

    const connection = GetConnection();

    if(!connection) return;

    connection.registerMessages({
        events: new Map<number, Function>(),
        composers: new Map<number, Function>([ [ OutgoingHeaders.DELETE_ITEMS, DeleteItemsComposer ], [ OutgoingHeaders.DELETE_BADGE, DeleteBadgeComposer ] ])
    });

    registered = true;
}

export class DeleteItemsComposer implements IMessageComposer<[ number, number ]>
{
    private _data: [ number, number ];

    constructor(itemId: number, amount: number) { this._data = [ itemId, amount ]; }

    public getMessageArray() { return this._data; }

    public dispose(): void { return; }
}

export class DeleteBadgeComposer implements IMessageComposer<[ string ]>
{
    private _data: [ string ];

    constructor(badgeCode: string) { this._data = [ badgeCode ]; }

    public getMessageArray() { return this._data; }

    public dispose(): void { return; }
}
