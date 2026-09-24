import { IMessageComposer, IMessageDataWrapper, IMessageParser, MessageEvent } from '@nitrots/nitro-renderer';
import { GetConnection } from '../nitro';

// Real reference feature, confirmed live against habbocity.fr: every currency shown in the purse
// carries its own real color (a `--holo-text-primary` CSS variable on its amount text) plus a real
// singular/plural display name, used both for that color and for the "you gained/lost X CurrencyName"
// bubble notification. Confirmed via a direct search of the reference's own live client JS and CSS
// bundles that none of this is hardcoded client-side - it genuinely comes from their server per
// currency type. The stock Arcturus currency-sync packet this project's vendored
// @nitrots/nitro-renderer parses has no such fields (just type+amount), so this is a new, additive
// protocol (hcms-emulator-plugin's PurseCurrencyColorProtocol, 9538/9539) sending a static
// type->{color,name,pluralName} map the client merges in on top of the amounts it already gets
// normally - not an override of the stock protocol.

const IncomingHeaders = {
    PURSE_CURRENCY_COLOR_DATA: 9539
};

const OutgoingHeaders = {
    PURSE_CURRENCY_COLOR_REQUEST: 9538
};

let registered = false;

export const RegisterPurseCurrencyColorMessages = () =>
{
    if(registered) return;

    const connection = GetConnection();

    if(!connection) return;

    connection.registerMessages({
        events: new Map<number, Function>([
            [ IncomingHeaders.PURSE_CURRENCY_COLOR_DATA, PurseCurrencyColorDataEvent ]
        ]),
        composers: new Map<number, Function>([
            [ OutgoingHeaders.PURSE_CURRENCY_COLOR_REQUEST, PurseCurrencyColorRequestComposer ]
        ])
    });

    registered = true;
}

export class PurseCurrencyColorRequestComposer implements IMessageComposer<unknown[]>
{
    public getMessageArray()
    {
        return [];
    }

    public dispose(): void
    {
        return;
    }
}

export interface PurseCurrencyMeta
{
    color: string;
    name: string;
    pluralName: string;
}

export class PurseCurrencyColorDataParser implements IMessageParser
{
    public meta: Map<number, PurseCurrencyMeta> = new Map();

    public flush(): boolean
    {
        this.meta = new Map();
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        let count = wrapper.readInt();

        while(count > 0)
        {
            const type = wrapper.readInt();
            const color = wrapper.readString();
            const name = wrapper.readString();
            const pluralName = wrapper.readString();

            this.meta.set(type, { color, name, pluralName });
            count--;
        }

        return true;
    }
}

export class PurseCurrencyColorDataEvent extends MessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, PurseCurrencyColorDataParser);
    }

    public getParser(): PurseCurrencyColorDataParser
    {
        return this.parser as PurseCurrencyColorDataParser;
    }
}
