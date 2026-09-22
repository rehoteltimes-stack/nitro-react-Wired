import { IMessageComposer, IMessageDataWrapper, IMessageParser, MessageEvent } from '@nitrots/nitro-renderer';
import { GetConnection } from '../nitro';

// hCMS's own real deviation from stock Arcturus's "buy a clothing-rack furni, place it, click it" flow - confirmed
// identical to stock on both habbocity.fr's and Habz's (sodaho.tel) own real client bundles. Habz's own real
// "Clothing shop" modal grants instantly on purchase instead; this is our own port of that real, decoded protocol
// (opcodes 9501/9502 outgoing, 9511/9512/9513 incoming on the server side - see hcms-emulator-plugin's
// ClothesShopProtocol.java, the single source of truth for these numbers). Registered lazily, same convention as
// RegisterChestMessages/RegisterBuilderModeMessages - called once from ClothesShopView's own mount effect, not at
// global app bootstrap.

export enum ClothesShopResultCode
{
    OK = 0,
    INSUFFICIENT_FUNDS = 1,
    ITEM_UNAVAILABLE = 2,
    ALREADY_OWNED = 3
}

const IncomingHeaders = {
    CLOTHES_SHOP_DATA: 9511,
    CLOTHES_SHOP_OWNED: 9512,
    CLOTHES_SHOP_RESULT: 9513
};

const OutgoingHeaders = {
    CLOTHES_SHOP_REQUEST: 9501,
    CLOTHES_SHOP_BUY: 9502
};

let registered = false;

export const RegisterClothesShopMessages = () =>
{
    if(registered) return;

    const connection = GetConnection();

    if(!connection) return;

    connection.registerMessages({
        events: new Map<number, Function>([
            [ IncomingHeaders.CLOTHES_SHOP_DATA, ClothesShopDataEvent ],
            [ IncomingHeaders.CLOTHES_SHOP_OWNED, ClothesShopOwnedEvent ],
            [ IncomingHeaders.CLOTHES_SHOP_RESULT, ClothesShopResultEvent ]
        ]),
        composers: new Map<number, Function>([
            [ OutgoingHeaders.CLOTHES_SHOP_REQUEST, ClothesShopRequestComposer ],
            [ OutgoingHeaders.CLOTHES_SHOP_BUY, ClothesShopBuyComposer ]
        ])
    });

    registered = true;
}

abstract class Composer<T extends unknown[]> implements IMessageComposer<T>
{
    protected _data: T;

    public getMessageArray(): T
    {
        return this._data;
    }

    public dispose(): void
    {
        return;
    }
}

export class ClothesShopRequestComposer extends Composer<unknown[]>
{
    constructor()
    {
        super();
        this._data = [];
    }
}

export class ClothesShopBuyComposer extends Composer<unknown[]>
{
    constructor(clothingIds: number[])
    {
        super();
        this._data = [ clothingIds.length, ...clothingIds ];
    }
}

export interface ClothesShopItemData
{
    clothingId: number;
    name: string;
    publicName: string;
    spriteId: number;
    costCredits: number;
    costPoints: number;
    pointsType: number;
    setIds: number[];
}

export class ClothesShopDataParser implements IMessageParser
{
    public items: ClothesShopItemData[] = [];

    public flush(): boolean
    {
        this.items = [];
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        let count = wrapper.readInt();

        while(count > 0)
        {
            const clothingId = wrapper.readInt();
            const name = wrapper.readString();
            const publicName = wrapper.readString();
            const spriteId = wrapper.readInt();
            const costCredits = wrapper.readInt();
            const costPoints = wrapper.readInt();
            const pointsType = wrapper.readInt();

            let setCount = wrapper.readInt();
            const setIds: number[] = [];

            while(setCount > 0)
            {
                setIds.push(wrapper.readInt());
                setCount--;
            }

            this.items.push({ clothingId, name, publicName, spriteId, costCredits, costPoints, pointsType, setIds });
            count--;
        }

        return true;
    }
}

export class ClothesShopOwnedParser implements IMessageParser
{
    public clothingIds: number[] = [];

    public flush(): boolean
    {
        this.clothingIds = [];
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        let count = wrapper.readInt();

        while(count > 0)
        {
            this.clothingIds.push(wrapper.readInt());
            count--;
        }

        return true;
    }
}

export class ClothesShopResultParser implements IMessageParser
{
    public resultCode: ClothesShopResultCode = ClothesShopResultCode.ITEM_UNAVAILABLE;

    public flush(): boolean
    {
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this.resultCode = wrapper.readInt();
        return true;
    }
}

export class ClothesShopDataEvent extends MessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, ClothesShopDataParser);
    }

    public getParser(): ClothesShopDataParser
    {
        return this.parser as ClothesShopDataParser;
    }
}

export class ClothesShopOwnedEvent extends MessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, ClothesShopOwnedParser);
    }

    public getParser(): ClothesShopOwnedParser
    {
        return this.parser as ClothesShopOwnedParser;
    }
}

export class ClothesShopResultEvent extends MessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, ClothesShopResultParser);
    }

    public getParser(): ClothesShopResultParser
    {
        return this.parser as ClothesShopResultParser;
    }
}
