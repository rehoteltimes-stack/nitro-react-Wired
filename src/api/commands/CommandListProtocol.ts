import { IMessageComposer, IMessageDataWrapper, IMessageParser, MessageEvent } from '@nitrots/nitro-renderer';
import { GetConnection } from '../nitro';

// The "Your commands" window (habbo.st reference). The server answers a request with the commands the player's rank
// can really run - see hcms-emulator-plugin's commandlist/CommandListDataComposer.java for the wire format.

const IncomingHeaders = {
    COMMAND_LIST_DATA: 9545
};

const OutgoingHeaders = {
    COMMAND_LIST_REQUEST: 9544
};

let registered = false;

export const RegisterCommandListMessages = () =>
{
    if(registered) return;

    const connection = GetConnection();

    if(!connection) return;

    connection.registerMessages({
        events: new Map<number, Function>([
            [ IncomingHeaders.COMMAND_LIST_DATA, CommandListDataEvent ]
        ]),
        composers: new Map<number, Function>([
            [ OutgoingHeaders.COMMAND_LIST_REQUEST, CommandListRequestComposer ]
        ])
    });

    registered = true;
}

export class CommandListRequestComposer implements IMessageComposer<[ number ]>
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

export interface CommandListEntry
{
    command: string;
    description: string;
}

export interface CommandListCategory
{
    name: string;
    commands: CommandListEntry[];
}

export class CommandListDataParser implements IMessageParser
{
    public categories: CommandListCategory[] = [];

    public flush(): boolean
    {
        this.categories = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        let categoryCount = wrapper.readInt();

        while(categoryCount > 0)
        {
            const name = wrapper.readString();
            const commands: CommandListEntry[] = [];

            let entryCount = wrapper.readInt();

            while(entryCount > 0)
            {
                const command = wrapper.readString();
                const description = wrapper.readString();

                commands.push({ command, description });
                entryCount--;
            }

            this.categories.push({ name, commands });
            categoryCount--;
        }

        return true;
    }
}

export class CommandListDataEvent extends MessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, CommandListDataParser);
    }

    public getParser(): CommandListDataParser
    {
        return this.parser as CommandListDataParser;
    }
}
