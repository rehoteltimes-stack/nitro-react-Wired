import { IMessageComposer, IMessageDataWrapper, IMessageParser, MessageEvent } from '@nitrots/nitro-renderer';
import { GetConnection } from '../nitro';

// The daily loop (online payouts, 7-day login calendar + streak, online chest). Server: hcms-emulator-plugin
// engagement/EngagementProtocol.java (IN 9629 state, IN 9630 action, OUT 9631 state, pushed on changes).

const IncomingHeaders = { ENGAGEMENT_STATE: 9631 };
const OutgoingHeaders = { ENGAGEMENT_STATE_REQUEST: 9629, ENGAGEMENT_ACTION: 9630 };

let registered = false;

export const RegisterEngagementMessages = () =>
{
    if(registered) return;

    const connection = GetConnection();

    if(!connection) return;

    connection.registerMessages({
        events: new Map<number, Function>([ [ IncomingHeaders.ENGAGEMENT_STATE, EngagementStateEvent ] ]),
        composers: new Map<number, Function>([
            [ OutgoingHeaders.ENGAGEMENT_STATE_REQUEST, EngagementStateRequestComposer ],
            [ OutgoingHeaders.ENGAGEMENT_ACTION, EngagementActionComposer ]
        ])
    });

    registered = true;
}

export class EngagementStateRequestComposer implements IMessageComposer<[]>
{
    public getMessageArray(): [] { return []; }

    public dispose(): void { return; }
}

export class EngagementActionComposer implements IMessageComposer<[ string ]>
{
    private _data: [ string ];

    /** claim | chest | chest_skip | freeze | swap:<slot> */
    constructor(action: string) { this._data = [ action ]; }

    public getMessageArray() { return this._data; }

    public dispose(): void { return; }
}

export interface IEngagementState
{
    streak: number;
    best: number;
    freezes: number;
    freezeMax: number;
    freezePrice: number;
    claimedToday: boolean;
    dayIndex: number;
    calendar: { currency: number, amount: number }[];
    chestReady: boolean;
    chestMinutesLeft: number;
    chestsToday: number;
    chestMax: number;
    skipPrice: number;
    todayDiamonds: number;
    capDiamonds: number;
    todayEmeralds: number;
    capEmeralds: number;
    vip: boolean;
    nextPayoutMinutes: number;
    quests: IDailyQuest[];
    seasonQuest?: ISeasonQuest;
    swapsLeft: number;
    swapPrice: number;
    freeSwap: boolean;
    questBonus: number;
    questBonusPaid: boolean;
    /** the result of the player's own click, shown in the window / chest card ("" = none) */
    message: string;
    // added 2026-10-01 (sent after the message): the daily quest bonus rule, quests done today, how many pay in full,
    // and the HabboPass (null = no season running)
    questBonusAfter: number;
    questBonusXp: number;
    questsDoneToday: number;
    questFullCount: number;
    pass: IHabboPass;
    missions: IMission[];
    paused: boolean;
}

export interface IDailyQuest { slot: number, title: string, target: number, progress: number, rewardType: number, rewardAmount: number, done: boolean, xp?: number, badge?: string }

export interface ISeasonQuest { title: string, step: number, steps: number, stepTitle: string, progress: number, target: number, reward: number, rewardType: number }

export interface IMission { title: string, progress: number, quantity: number, xp: number, completed: boolean }

export interface IHabboPass { season: string, level: number, maxLevel: number, into: number, perLevel: number, xp: number }

export class EngagementStateParser implements IMessageParser
{
    public state: IEngagementState = null;

    public flush(): boolean
    {
        this.state = null;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        const state: Partial<IEngagementState> = {};

        state.streak = wrapper.readInt();
        state.best = wrapper.readInt();
        state.freezes = wrapper.readInt();
        state.freezeMax = wrapper.readInt();
        state.freezePrice = wrapper.readInt();
        state.claimedToday = wrapper.readBoolean();
        state.dayIndex = wrapper.readInt();
        state.calendar = [];

        let count = wrapper.readInt();

        while(count-- > 0) state.calendar.push({ currency: wrapper.readInt(), amount: wrapper.readInt() });

        state.chestReady = wrapper.readBoolean();
        state.chestMinutesLeft = wrapper.readInt();
        state.chestsToday = wrapper.readInt();
        state.chestMax = wrapper.readInt();
        state.skipPrice = wrapper.readInt();
        state.todayDiamonds = wrapper.readInt();
        state.capDiamonds = wrapper.readInt();
        state.todayEmeralds = wrapper.readInt();
        state.capEmeralds = wrapper.readInt();
        state.vip = wrapper.readBoolean();
        state.nextPayoutMinutes = wrapper.readInt();

        state.quests = [];

        if(wrapper.bytesAvailable)
        {
            count = wrapper.readInt();

            while(count-- > 0) state.quests.push({ slot: wrapper.readInt(), title: wrapper.readString(), target: wrapper.readInt(), progress: wrapper.readInt(), rewardType: wrapper.readInt(), rewardAmount: wrapper.readInt(), done: wrapper.readBoolean() });

            state.swapsLeft = wrapper.readInt();
            state.swapPrice = wrapper.readInt();
            state.freeSwap = wrapper.readBoolean();
            state.questBonus = wrapper.readInt();
            state.questBonusPaid = wrapper.readBoolean();
        }

        state.message = wrapper.bytesAvailable ? wrapper.readString() : '';

        state.questBonusAfter = 3;
        state.questBonusXp = 0;
        state.questsDoneToday = state.quests.filter(quest => quest.done).length;
        state.questFullCount = 0;
        state.pass = null;
        state.missions = [];

        if(wrapper.bytesAvailable)
        {
            count = wrapper.readInt();

            for(let i = 0; i < count; i++)
            {
                const xp = wrapper.readInt();

                if(state.quests[i]) state.quests[i].xp = xp;
            }

            state.questBonusAfter = wrapper.readInt();
            state.questBonusXp = wrapper.readInt();
            state.questsDoneToday = wrapper.readInt();
            state.questFullCount = wrapper.readInt();

            if(wrapper.readBoolean()) state.pass = { season: wrapper.readString(), level: wrapper.readInt(), maxLevel: wrapper.readInt(), into: wrapper.readInt(), perLevel: wrapper.readInt(), xp: wrapper.readInt() };

            if(wrapper.bytesAvailable)
            {
                let missions = wrapper.readInt();

                while(missions-- > 0) state.missions.push({ title: wrapper.readString(), progress: wrapper.readInt(), quantity: wrapper.readInt(), xp: wrapper.readInt(), completed: wrapper.readBoolean() });
            }

            if(wrapper.bytesAvailable)
            {
                const badges = wrapper.readInt();

                for(let i = 0; i < badges; i++)
                {
                    const badge = wrapper.readString();

                    if(state.quests[i]) state.quests[i].badge = badge;
                }
            }

            if(wrapper.bytesAvailable && wrapper.readBoolean())
            {
                state.seasonQuest = { title: wrapper.readString(), step: wrapper.readInt(), steps: wrapper.readInt(), stepTitle: wrapper.readString(), progress: wrapper.readInt(), target: wrapper.readInt(), reward: wrapper.readInt(), rewardType: wrapper.readInt() };
            }

            state.paused = (wrapper.bytesAvailable ? wrapper.readBoolean() : true);
        }

        this.state = state as IEngagementState;

        return true;
    }
}

export class EngagementStateEvent extends MessageEvent
{
    constructor(callBack: Function) { super(callBack, EngagementStateParser); }

    public getParser(): EngagementStateParser { return this.parser as EngagementStateParser; }
}
