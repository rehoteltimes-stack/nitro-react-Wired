import { IMessageComposer, IMessageDataWrapper, IMessageParser, MessageEvent } from '@nitrots/nitro-renderer';
import { GetConnection } from '../nitro';

const IncomingHeaders = { PASS_STATE: 9649 };
const OutgoingHeaders = { PASS_REQUEST: 9648 };

let registered = false;

export const RegisterPassMessages = () =>
{
    if(registered) return;

    const connection = GetConnection();

    if(!connection) return;

    connection.registerMessages({
        events: new Map<number, Function>([ [ IncomingHeaders.PASS_STATE, PassStateEvent ] ]),
        composers: new Map<number, Function>([ [ OutgoingHeaders.PASS_REQUEST, PassRequestComposer ] ])
    });

    registered = true;
}

export class PassRequestComposer implements IMessageComposer<[ string ]>
{
    private _data: [ string ];

    constructor(action: 'state' | 'claim') { this._data = [ action ]; }

    public getMessageArray() { return this._data; }

    public dispose(): void { return; }
}

export interface IPassReward { name: string, image: string }

export interface IPassLevel { level: number, free: IPassReward, vip: IPassReward }

export interface IPassState
{
    loaded: boolean;
    active: boolean;
    collected: number;
    season: string;
    endsAt: number;
    level: number;
    maxLevel: number;
    into: number;
    perLevel: number;
    freeClaimed: number;
    vipClaimed: number;
    isVip: boolean;
    winwins: number;
    avatar: string;
    levels: IPassLevel[];
}

export class PassStateParser implements IMessageParser
{
    public state: IPassState = null;

    public flush(): boolean
    {
        this.state = null;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        const state: IPassState = { loaded: wrapper.readBoolean(), active: false, collected: 0, season: '', endsAt: 0, level: 0, maxLevel: 0, into: 0, perLevel: 1, freeClaimed: 0, vipClaimed: 0, isVip: false, winwins: 0, avatar: '', levels: [] };

        if(state.loaded)
        {
            state.active = wrapper.readBoolean();
            state.collected = wrapper.readInt();

            if(state.active)
            {
                state.season = wrapper.readString();
                state.endsAt = wrapper.readInt();
                state.level = wrapper.readInt();
                state.maxLevel = wrapper.readInt();
                state.into = wrapper.readInt();
                state.perLevel = wrapper.readInt();
                state.freeClaimed = wrapper.readInt();
                state.vipClaimed = wrapper.readInt();
                state.isVip = wrapper.readBoolean();
                state.winwins = wrapper.readInt();
                state.avatar = wrapper.readString();

                let count = wrapper.readInt();

                while(count-- > 0)
                {
                    state.levels.push({
                        level: wrapper.readInt(),
                        free: { name: wrapper.readString(), image: wrapper.readString() },
                        vip: { name: wrapper.readString(), image: wrapper.readString() }
                    });
                }
            }
        }

        this.state = state;

        return true;
    }
}

export class PassStateEvent extends MessageEvent
{
    constructor(callBack: Function) { super(callBack, PassStateParser); }

    public getParser(): PassStateParser { return this.parser as PassStateParser; }
}
