import { IMessageComposer, IMessageDataWrapper, IMessageParser, MessageEvent } from '@nitrots/nitro-renderer';
import { GetConnection } from '../nitro';

const IncomingHeaders = {
    CHUNK_TOKEN: 9647
};

const OutgoingHeaders = {
    CHUNK_TOKEN_REQUEST: 9646
};

let registered = false;

export const RegisterChunkAccessMessages = () =>
{
    if(registered) return;

    const connection = GetConnection();

    if(!connection) return;

    connection.registerMessages({
        events: new Map<number, Function>([
            [ IncomingHeaders.CHUNK_TOKEN, ChunkTokenEvent ]
        ]),
        composers: new Map<number, Function>([
            [ OutgoingHeaders.CHUNK_TOKEN_REQUEST, ChunkTokenRequestComposer ]
        ])
    });

    registered = true;
}

export class ChunkTokenRequestComposer implements IMessageComposer<[]>
{
    public getMessageArray(): []
    {
        return [];
    }

    public dispose(): void
    {
        return;
    }
}

export class ChunkTokenParser implements IMessageParser
{
    public token = '';
    public lifetime = 0;
    public level = 0;

    public flush(): boolean
    {
        this.token = '';
        this.lifetime = 0;
        this.level = 0;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this.token = wrapper.readString();
        this.lifetime = wrapper.readInt();
        this.level = wrapper.readInt();

        return true;
    }
}

export class ChunkTokenEvent extends MessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, ChunkTokenParser);
    }

    public getParser(): ChunkTokenParser
    {
        return this.parser as ChunkTokenParser;
    }
}
