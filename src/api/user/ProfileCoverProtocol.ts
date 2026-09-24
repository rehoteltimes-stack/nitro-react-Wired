import { IMessageComposer, IMessageDataWrapper, IMessageParser, MessageEvent } from '@nitrots/nitro-renderer';
import { GetConnection } from '../nitro';

// Real reference feature ("Changer la couverture de profil" in User Settings): the client crops/positions
// an uploaded image onto a canvas, then sends the raw PNG bytes of that canvas directly over the socket -
// confirmed live from the minified HabboCity client source (its own `he()`/`xc` composer): the whole
// packet body IS the image, an empty body means "delete my cover".
//
// Real bug fixed here (found live: every single upload was rejected server-side with
// "validPng=false", confirmed via the boot log): this originally also pushed `imageBytes.byteLength`
// as a leading int before the buffer, copying a pattern seen elsewhere in this project that turned
// out not to apply here - checked the actual serializer (`EvaWireFormat.ts`'s `encode()`): an
// ArrayBuffer element in a composer's data array is written via `writer.writeBytes(value)` with NO
// per-field length prefix of its own (only the whole encoded PACKET gets one length-prefix, at the
// transport layer, not per value) - so that leading int became 4 real extra bytes on the wire ahead
// of the actual PNG data. The server's own handler reads "all remaining bytes in the packet" as the
// image (`ProfileCoverUploadEvent.java`), so those 4 stray bytes shifted the real `\x89PNG` magic
// bytes out of position, failing the format check every time. Fixed by sending only the raw buffer.

const IncomingHeaders = {
    PROFILE_COVER_DATA: 9535
};

const OutgoingHeaders = {
    PROFILE_COVER_UPLOAD: 9525,
    PROFILE_COVER_REQUEST: 9526
};

let registered = false;

export const RegisterProfileCoverMessages = () =>
{
    if(registered) return;

    const connection = GetConnection();

    if(!connection) return;

    connection.registerMessages({
        events: new Map<number, Function>([
            [ IncomingHeaders.PROFILE_COVER_DATA, ProfileCoverDataEvent ]
        ]),
        composers: new Map<number, Function>([
            [ OutgoingHeaders.PROFILE_COVER_UPLOAD, ProfileCoverUploadComposer ],
            [ OutgoingHeaders.PROFILE_COVER_REQUEST, ProfileCoverRequestComposer ]
        ])
    });

    registered = true;
}

// Payload: [] (empty array) sends a zero-length body, matching the real reference's own "delete" semantics.
export class ProfileCoverUploadComposer implements IMessageComposer<unknown[]>
{
    private _data: unknown[];

    constructor(imageBytes: Uint8Array | null)
    {
        this._data = imageBytes ? [ imageBytes.buffer ] : [];
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

export class ProfileCoverRequestComposer implements IMessageComposer<[ number ]>
{
    private _data: [ number ];

    constructor(userId: number)
    {
        this._data = [ userId ];
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

export class ProfileCoverDataParser implements IMessageParser
{
    public userId: number = 0;
    public filename: string = '';

    public flush(): boolean
    {
        this.userId = 0;
        this.filename = '';
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this.userId = wrapper.readInt();
        this.filename = wrapper.readString();
        return true;
    }
}

export class ProfileCoverDataEvent extends MessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, ProfileCoverDataParser);
    }

    public getParser(): ProfileCoverDataParser
    {
        return this.parser as ProfileCoverDataParser;
    }
}
