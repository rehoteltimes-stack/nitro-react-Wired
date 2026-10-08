import { IMessageComposer } from '@nitrots/nitro-renderer';
import { GetConnection } from '../nitro';

const OutgoingHeaders = { BOT_WALK: 9694 };

let registered = false;

export const RegisterBotWalkMessages = () =>
{
    if(registered) return;

    const connection = GetConnection();

    if(!connection) return;

    connection.registerMessages({
        events: new Map<number, Function>(),
        composers: new Map<number, Function>([ [ OutgoingHeaders.BOT_WALK, BotWalkComposer ] ])
    });

    registered = true;
}

export class BotWalkComposer implements IMessageComposer<[ number, number, number ]>
{
    private _data: [ number, number, number ];

    constructor(roomIndex: number, deltaX: number, deltaY: number) { this._data = [ roomIndex, deltaX, deltaY ]; }

    public getMessageArray() { return this._data; }

    public dispose(): void { return; }
}
