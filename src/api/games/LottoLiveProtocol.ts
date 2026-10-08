import { IMessageComposer, IMessageDataWrapper, IMessageParser, MessageEvent } from '@nitrots/nitro-renderer';
import { GetConnection } from '../nitro';

const IncomingHeaders = { LOTTO_LIVE: 9660 };
const OutgoingHeaders = { LOTTO_LIVE_BUY: 9661 };

let registered = false;

export const RegisterLottoLiveMessages = () =>
{
    if(registered) return;

    const connection = GetConnection();

    if(!connection) return;

    connection.registerMessages({
        events: new Map<number, Function>([ [ IncomingHeaders.LOTTO_LIVE, LottoLiveEvent ] ]),
        composers: new Map<number, Function>([ [ OutgoingHeaders.LOTTO_LIVE_BUY, LottoLiveBuyComposer ] ])
    });

    registered = true;
}

export class LottoLiveBuyComposer implements IMessageComposer<[ number ]>
{
    private _data: [ number ];

    constructor(amount: number) { this._data = [ amount ]; }

    public getMessageArray() { return this._data; }

    public dispose(): void { return; }
}

export interface ILottoLive
{
    prizeLabel: string;
    prizeAmount: number;
    prizeCurrency: number;
    bonusDiamonds: number;
    players: number;
    tickets: number;
    yours: number;
    secondsLeft: number;
    windowSeconds: number;
    price: number;
    priceCurrency: number;
}

export class LottoLiveParser implements IMessageParser
{
    public live: ILottoLive = null;

    public flush(): boolean
    {
        this.live = null;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper.readBoolean())
        {
            this.live = null;

            return true;
        }

        this.live = {
            prizeLabel: wrapper.readString(),
            prizeAmount: wrapper.readInt(),
            prizeCurrency: wrapper.readInt(),
            bonusDiamonds: wrapper.readInt(),
            players: wrapper.readInt(),
            tickets: wrapper.readInt(),
            yours: wrapper.readInt(),
            secondsLeft: wrapper.readInt(),
            windowSeconds: wrapper.readInt(),
            price: wrapper.readInt(),
            priceCurrency: wrapper.readInt()
        };

        return true;
    }
}

export class LottoLiveEvent extends MessageEvent
{
    constructor(callBack: Function) { super(callBack, LottoLiveParser); }

    public getParser(): LottoLiveParser { return this.parser as LottoLiveParser; }
}
