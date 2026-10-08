import { IMessageComposer, IMessageDataWrapper, IMessageParser, MessageEvent } from '@nitrots/nitro-renderer';
import { GetConnection } from '../nitro';

const IncomingHeaders = { RANCH_STATE: 9663, RANCH_PLAYERS: 9664, RANCH_ORDERS: 9665, RANCH_ANIMALS: 9666, RANCH_CHALLENGE: 9667, RANCH_SHOP_ITEMS: 9668, RANCH_CROPS: 9669, RANCH_QUEST: 9670 };
const OutgoingHeaders = { RANCH_ACTION: 9662 };

let registered = false;

export const RegisterRanchMessages = () =>
{
    if(registered) return;

    const connection = GetConnection();

    if(!connection) return;

    connection.registerMessages({
        events: new Map<number, Function>([ [ IncomingHeaders.RANCH_STATE, RanchStateEvent ], [ IncomingHeaders.RANCH_PLAYERS, RanchPlayersEvent ], [ IncomingHeaders.RANCH_ORDERS, RanchOrdersEvent ], [ IncomingHeaders.RANCH_ANIMALS, RanchAnimalsEvent ], [ IncomingHeaders.RANCH_CHALLENGE, RanchChallengeEvent ], [ IncomingHeaders.RANCH_SHOP_ITEMS, RanchShopItemsEvent ], [ IncomingHeaders.RANCH_CROPS, RanchCropsEvent ], [ IncomingHeaders.RANCH_QUEST, RanchQuestEvent ] ]),
        composers: new Map<number, Function>([ [ OutgoingHeaders.RANCH_ACTION, RanchActionComposer ] ])
    });

    registered = true;
}

export class RanchActionComposer implements IMessageComposer<[ string, string, number ]>
{
    private _data: [ string, string, number ];

    constructor(action: string, arg: string = '', amount: number = 0) { this._data = [ action, arg, amount ]; }

    public getMessageArray() { return this._data; }

    public dispose(): void { return; }
}

export interface IRanchCrop
{
    crop: string;
    seedPrice: number;
    seedCurrency: string;
    growMinutes: number;
    yield: number;
    bigItem: string;
    unlockLevel: number;
    seeds: number;
    crops: number;
}

export interface IRanchFertilizer
{
    kind: string;
    amount: number;
    price: number;
    currency: string;
}

export interface IRanchState
{
    inRanch: boolean;
    open: string;
    level: number;
    maxLevel: number;
    xp: number;
    xpIntoLevel: number;
    perLevel: number;
    plots: number;
    slots: number;
    tokens: number;
    balance: number;
    pending: string;
    fertilizers: IRanchFertilizer[];
    crops: IRanchCrop[];
}

export class RanchStateParser implements IMessageParser
{
    public state: IRanchState = null;

    public flush(): boolean
    {
        this.state = null;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        const state: IRanchState = {
            inRanch: wrapper.readBoolean(),
            open: wrapper.readString(),
            level: wrapper.readInt(),
            maxLevel: wrapper.readInt(),
            xp: wrapper.readInt(),
            xpIntoLevel: wrapper.readInt(),
            perLevel: wrapper.readInt(),
            plots: wrapper.readInt(),
            slots: wrapper.readInt(),
            tokens: wrapper.readInt(),
            balance: wrapper.readInt(),
            pending: wrapper.readString(),
            fertilizers: [],
            crops: []
        };

        let fertilizers = wrapper.readInt();

        while(fertilizers-- > 0) state.fertilizers.push({
            kind: wrapper.readString(),
            amount: wrapper.readInt(),
            price: wrapper.readInt(),
            currency: wrapper.readString()
        });

        let count = wrapper.readInt();

        while(count-- > 0) state.crops.push({
            crop: wrapper.readString(),
            seedPrice: wrapper.readInt(),
            seedCurrency: wrapper.readString(),
            growMinutes: wrapper.readInt(),
            yield: wrapper.readInt(),
            bigItem: wrapper.readString(),
            unlockLevel: wrapper.readInt(),
            seeds: wrapper.readInt(),
            crops: wrapper.readInt()
        });

        this.state = state;

        return true;
    }
}

export class RanchStateEvent extends MessageEvent
{
    constructor(callBack: Function) { super(callBack, RanchStateParser); }

    public getParser(): RanchStateParser { return this.parser as RanchStateParser; }
}

export interface IRanchPlayer
{
    roomIndex: number;
    level: number;
    maxLevel: number;
    xpIntoLevel: number;
    perLevel: number;
    tokens: number;
    balance: number;
    crops: Record<string, number>;
    stackOrder: string[];
}

export class RanchPlayersParser implements IMessageParser
{
    public players: IRanchPlayer[] = [];

    public flush(): boolean
    {
        this.players = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        let count = wrapper.readInt();

        while(count-- > 0)
        {
            const player: IRanchPlayer = {
                roomIndex: wrapper.readInt(),
                level: wrapper.readInt(),
                maxLevel: wrapper.readInt(),
                xpIntoLevel: wrapper.readInt(),
                perLevel: wrapper.readInt(),
                tokens: wrapper.readInt(),
                balance: wrapper.readInt(),
                crops: {},
                stackOrder: []
            };

            let crops = wrapper.readInt();

            while(crops-- > 0) player.crops[wrapper.readString()] = wrapper.readInt();

            this.players.push(player);
        }

        for(const player of this.players)
        {
            if(!wrapper.bytesAvailable) break;

            player.stackOrder = wrapper.readString().split(',').filter(key => key.length);
        }

        return true;
    }
}

export class RanchPlayersEvent extends MessageEvent
{
    constructor(callBack: Function) { super(callBack, RanchPlayersParser); }

    public getParser(): RanchPlayersParser { return this.parser as RanchPlayersParser; }
}

export interface IRanchOrder
{
    roomIndex: number;
    endsAt: number;
    duration: number;
    reward: number;
    crops: Record<string, number>;
}

export class RanchOrdersParser implements IMessageParser
{
    public orders: IRanchOrder[] = [];

    public flush(): boolean
    {
        this.orders = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        let count = wrapper.readInt();

        while(count-- > 0)
        {
            const roomIndex = wrapper.readInt();
            const secondsLeft = wrapper.readInt();
            const order: IRanchOrder = { roomIndex, endsAt: Date.now() + (secondsLeft * 1000), duration: wrapper.readInt(), reward: wrapper.readInt(), crops: {} };

            let crops = wrapper.readInt();

            while(crops-- > 0) order.crops[wrapper.readString()] = wrapper.readInt();

            this.orders.push(order);
        }

        return true;
    }
}

export class RanchOrdersEvent extends MessageEvent
{
    constructor(callBack: Function) { super(callBack, RanchOrdersParser); }

    public getParser(): RanchOrdersParser { return this.parser as RanchOrdersParser; }
}

export interface IRanchAnimal
{
    objectId: number;
    name: string;
    phase: number;
    crop: string;
    required: number;
    remaining: number;
    endsAt: number;
    duration: number;
}

export class RanchAnimalsParser implements IMessageParser
{
    public animals: IRanchAnimal[] = [];

    public flush(): boolean
    {
        this.animals = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        let count = wrapper.readInt();

        while(count-- > 0)
        {
            const objectId = wrapper.readInt();
            const name = wrapper.readString();
            const phase = wrapper.readInt();
            const crop = wrapper.readString();
            const required = wrapper.readInt();
            const remaining = wrapper.readInt();
            const secondsLeft = wrapper.readInt();

            this.animals.push({ objectId, name, phase, crop, required, remaining, endsAt: Date.now() + (secondsLeft * 1000), duration: wrapper.readInt() });
        }

        return true;
    }
}

export class RanchAnimalsEvent extends MessageEvent
{
    constructor(callBack: Function) { super(callBack, RanchAnimalsParser); }

    public getParser(): RanchAnimalsParser { return this.parser as RanchAnimalsParser; }
}

export interface IRanchChallenge
{
    objectId: number;
    type: string;
    target: number;
    remaining: number;
}

export class RanchChallengeParser implements IMessageParser
{
    public challenge: IRanchChallenge = null;

    public flush(): boolean
    {
        this.challenge = null;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this.challenge = { objectId: wrapper.readInt(), type: wrapper.readString(), target: wrapper.readInt(), remaining: wrapper.readInt() };

        return true;
    }
}

export class RanchChallengeEvent extends MessageEvent
{
    constructor(callBack: Function) { super(callBack, RanchChallengeParser); }

    public getParser(): RanchChallengeParser { return this.parser as RanchChallengeParser; }
}

export interface IRanchShopItem
{
    objectId: number;
    price: number;
    currency: string;
}

export class RanchShopItemsParser implements IMessageParser
{
    public items: IRanchShopItem[] = [];

    public flush(): boolean
    {
        this.items = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        let count = wrapper.readInt();

        while(count-- > 0) this.items.push({ objectId: wrapper.readInt(), price: wrapper.readInt(), currency: wrapper.readString() });

        return true;
    }
}

export class RanchShopItemsEvent extends MessageEvent
{
    constructor(callBack: Function) { super(callBack, RanchShopItemsParser); }

    public getParser(): RanchShopItemsParser { return this.parser as RanchShopItemsParser; }
}

export interface IRanchCropInfo
{
    objectId: number;
    crop: string;
    plantedAt: number;
    total: number;
    ready: boolean;
    yield: number;
}

export class RanchCropsParser implements IMessageParser
{
    public crops: IRanchCropInfo[] = [];

    public flush(): boolean
    {
        this.crops = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        let count = wrapper.readInt();

        while(count-- > 0)
        {
            const objectId = wrapper.readInt();
            const crop = wrapper.readString();
            const elapsed = wrapper.readInt();
            const total = wrapper.readInt();

            this.crops.push({ objectId, crop, plantedAt: Date.now() - (elapsed * 1000), total, ready: wrapper.readBoolean(), yield: wrapper.readInt() });
        }

        return true;
    }
}

export class RanchCropsEvent extends MessageEvent
{
    constructor(callBack: Function) { super(callBack, RanchCropsParser); }

    public getParser(): RanchCropsParser { return this.parser as RanchCropsParser; }
}

export interface IRanchQuestStep
{
    description: string;
    target: number;
    reward: number;
}

export interface IRanchQuest
{
    day: number;
    dayCount: number;
    title: string;
    finished: boolean;
    unlockSeconds: number;
    step: number;
    progress: number;
    currencyType: number;
    steps: IRanchQuestStep[];
}

export class RanchQuestParser implements IMessageParser
{
    public quest: IRanchQuest = null;

    public flush(): boolean
    {
        this.quest = null;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        const quest: IRanchQuest = { day: wrapper.readInt(), dayCount: wrapper.readInt(), title: wrapper.readString(), finished: wrapper.readBoolean(), unlockSeconds: wrapper.readInt(), step: wrapper.readInt(), progress: wrapper.readInt(), currencyType: wrapper.readInt(), steps: [] };
        let count = wrapper.readInt();

        while(count-- > 0) quest.steps.push({ description: wrapper.readString(), target: wrapper.readInt(), reward: wrapper.readInt() });

        this.quest = quest;

        return true;
    }
}

export class RanchQuestEvent extends MessageEvent
{
    constructor(callBack: Function) { super(callBack, RanchQuestParser); }

    public getParser(): RanchQuestParser { return this.parser as RanchQuestParser; }
}

