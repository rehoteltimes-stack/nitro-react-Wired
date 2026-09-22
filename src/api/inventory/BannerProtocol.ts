import { IMessageComposer, IMessageDataWrapper, IMessageParser, MessageEvent } from '@nitrots/nitro-renderer';
import { GetConnection } from '../nitro';

// The Inventory's "Bannières" tab in the real reference is backed by fields (SessionDataManager.
// inventoryBannerList/activeBannerCode) and a composer/event pair added by HabboCity's own server fork - none of
// it exists in this project's vendored @nitrots/nitro-renderer. This is our own real protocol bridging hCMS's
// already-live website purchase flow (App\Domain\Banners, hcms_banners/hcms_users_banners) to the client, opcodes
// 9521/9522 outgoing, 9531/9532 incoming on the server side - see hcms-emulator-plugin's own BannerProtocol.java,
// the single source of truth for these numbers. Registered lazily, same convention as RegisterClothesShopMessages -
// called once from InventoryBannerView's own mount effect, not at global app bootstrap.

const IncomingHeaders = {
    BANNER_DATA: 9531,
    BANNER_ACTIVE_CHANGED: 9532
};

const OutgoingHeaders = {
    BANNER_REQUEST: 9521,
    BANNER_SET_ACTIVE: 9522
};

let registered = false;

export const RegisterBannerMessages = () =>
{
    if(registered) return;

    const connection = GetConnection();

    if(!connection) return;

    connection.registerMessages({
        events: new Map<number, Function>([
            [ IncomingHeaders.BANNER_DATA, BannerDataEvent ],
            [ IncomingHeaders.BANNER_ACTIVE_CHANGED, BannerActiveChangedEvent ]
        ]),
        composers: new Map<number, Function>([
            [ OutgoingHeaders.BANNER_REQUEST, BannerRequestComposer ],
            [ OutgoingHeaders.BANNER_SET_ACTIVE, BannerSetActiveComposer ]
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

export class BannerRequestComposer extends Composer<unknown[]>
{
    constructor()
    {
        super();
        this._data = [];
    }
}

export class BannerSetActiveComposer extends Composer<unknown[]>
{
    constructor(bannerId: number)
    {
        super();
        this._data = [ bannerId ];
    }
}

export interface BannerItemData
{
    bannerId: number;
    title: string;
    imageFilename: string;
}

export class BannerDataParser implements IMessageParser
{
    public items: BannerItemData[] = [];
    public activeBannerId: number = -1;

    public flush(): boolean
    {
        this.items = [];
        this.activeBannerId = -1;
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        let count = wrapper.readInt();

        while(count > 0)
        {
            const bannerId = wrapper.readInt();
            const title = wrapper.readString();
            const imageFilename = wrapper.readString();

            this.items.push({ bannerId, title, imageFilename });
            count--;
        }

        this.activeBannerId = wrapper.readInt();

        return true;
    }
}

export class BannerActiveChangedParser implements IMessageParser
{
    public activeBannerId: number = -1;

    public flush(): boolean
    {
        this.activeBannerId = -1;
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this.activeBannerId = wrapper.readInt();
        return true;
    }
}

export class BannerDataEvent extends MessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, BannerDataParser);
    }

    public getParser(): BannerDataParser
    {
        return this.parser as BannerDataParser;
    }
}

export class BannerActiveChangedEvent extends MessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, BannerActiveChangedParser);
    }

    public getParser(): BannerActiveChangedParser
    {
        return this.parser as BannerActiveChangedParser;
    }
}
