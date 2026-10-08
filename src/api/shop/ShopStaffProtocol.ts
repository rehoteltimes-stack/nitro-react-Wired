import { IMessageComposer } from '@nitrots/nitro-renderer';
import { GetConfiguration, GetConnection } from '../nitro';

let registered = false;

export const RegisterShopStaffMessages = () =>
{
    if(registered) return;

    const connection = GetConnection();

    if(!connection) return;

    const header = (GetConfiguration<{ inGive?: number }>('shop.headers', {}) || {}).inGive || 9606;

    connection.registerMessages({
        events: new Map<number, Function>(),
        composers: new Map<number, Function>([ [ header, ShopGiveComposer ] ])
    });

    registered = true;
}

export class ShopGiveComposer implements IMessageComposer<[ string, string, number, boolean ]>
{
    private _data: [ string, string, number, boolean ];

    constructor(username: string, type: string, itemId: number, take: boolean)
    {
        this._data = [ username, type, itemId, take ];
    }

    public getMessageArray(): [ string, string, number, boolean ]
    {
        return this._data;
    }

    public dispose(): void
    {
        return;
    }
}
