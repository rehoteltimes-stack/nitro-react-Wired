import { IMessageComposer, IMessageDataWrapper, IMessageParser, MessageEvent } from '@nitrots/nitro-renderer';
import { GetConnection } from '../nitro';

// Staff Tools > Player: the incident card for any Habbo a staff member picks, with the same actions. Server:
// hcms-emulator-plugin security/PlayerToolsProtocol.java (IN 9635 look up, IN 9636 action, OUT 9637 the card).

const IncomingHeaders = { PLAYER_TOOLS_CARD: 9637 };
const OutgoingHeaders = { PLAYER_TOOLS_LOOKUP: 9635, PLAYER_TOOLS_ACTION: 9636 };

let registered = false;

export const RegisterPlayerToolsMessages = () =>
{
    if(registered) return;

    const connection = GetConnection();

    if(!connection) return;

    connection.registerMessages({
        events: new Map<number, Function>([ [ IncomingHeaders.PLAYER_TOOLS_CARD, PlayerToolsCardEvent ] ]),
        composers: new Map<number, Function>([
            [ OutgoingHeaders.PLAYER_TOOLS_LOOKUP, PlayerToolsLookupComposer ],
            [ OutgoingHeaders.PLAYER_TOOLS_ACTION, PlayerToolsActionComposer ]
        ])
    });

    registered = true;
}

export class PlayerToolsLookupComposer implements IMessageComposer<[ string ]>
{
    private _data: [ string ];

    constructor(username: string) { this._data = [ username ]; }

    public getMessageArray() { return this._data; }

    public dispose(): void { return; }
}

export class PlayerToolsActionComposer implements IMessageComposer<[ string, string, string, string ]>
{
    private _data: [ string, string, string, string ];

    /**
     * action: warn | mute | lastwarn | kick | ban | flag | messages | release | reset_sanctions | tradeban:<hours> | tradeban_lift | note (the note = a shared staff note) | prison:<minutes>:<prison id>
     * (note = reason); evidence = the chatlog line ids attached as evidence (the server checks they are the Habbo's own)
     */
    constructor(username: string, action: string, note: string = '', evidence: number[] = []) { this._data = [ username, action, note, evidence.join(',') ]; }

    public getMessageArray() { return this._data; }

    public dispose(): void { return; }
}

export interface IPlayerToolsIncident { label: string, status: string, action: string, lastAt: number }

export interface IPlayerToolsCard
{
    userId: number;
    username: string;
    look: string;
    online: boolean;
    rankName: string;
    roomId: number;
    roomName: string;
    flagged: boolean;
    openIncidents: number;
    incidents: IPlayerToolsIncident[];
    prisonName: string;       // '' = not in prison
    prisonSecondsLeft: number;
    sanctionLevel: number;    // the highest stock sanction level (My sanction status)
    sanctionCount: number;
    chat: IPlayerToolsChatLine[]; // their last 20 room chat lines, newest first
    tradeBanUntil: number;        // unix time, 0 = can trade
    trades: IPlayerToolsTrade[];  // their last 5 trades, newest first
    notes: IPlayerToolsNote[];    // shared staff notes, newest first
}

export interface IPlayerToolsNote { staff: string, time: number, note: string }

export interface IPlayerToolsTrade { partner: string, time: number, gave: string, got: string }

export interface IPlayerToolsChatLine { id: number, message: string, time: number, room: string }

export class PlayerToolsCardParser implements IMessageParser
{
    public card: IPlayerToolsCard = null;
    public message = '';
    public prisons: { id: number, name: string }[] = [];

    public flush(): boolean
    {
        this.card = null;
        this.message = '';
        this.prisons = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(wrapper.readBoolean())
        {
            const card: IPlayerToolsCard = {
                userId: wrapper.readInt(), username: wrapper.readString(), look: wrapper.readString(), online: wrapper.readBoolean(), rankName: wrapper.readString(),
                roomId: wrapper.readInt(), roomName: wrapper.readString(), flagged: wrapper.readBoolean(), openIncidents: wrapper.readInt(), incidents: [],
                prisonName: '', prisonSecondsLeft: 0, sanctionLevel: 0, sanctionCount: 0, chat: [], tradeBanUntil: 0, trades: [], notes: []
            };

            let count = wrapper.readInt();

            while(count-- > 0) card.incidents.push({ label: wrapper.readString(), status: wrapper.readString(), action: wrapper.readString(), lastAt: wrapper.readInt() });

            this.card = card;
        }

        this.message = wrapper.readString();

        // added later: the prison sentence, then the prison rooms to choose from
        if(wrapper.bytesAvailable)
        {
            const prisoned = wrapper.readBoolean();
            const name = wrapper.readString();
            const left = wrapper.readInt();

            if(this.card && prisoned)
            {
                this.card.prisonName = name;
                this.card.prisonSecondsLeft = left;
            }

            let count = wrapper.readInt();

            while(count-- > 0) this.prisons.push({ id: wrapper.readInt(), name: wrapper.readString() });

            // added later: the stock sanctions (highest level, how many)
            if(wrapper.bytesAvailable)
            {
                const level = wrapper.readInt();
                const total = wrapper.readInt();

                if(this.card)
                {
                    this.card.sanctionLevel = level;
                    this.card.sanctionCount = total;
                }

                // added later: the trade ban and the last trades
                if(wrapper.bytesAvailable)
                {
                    const until = wrapper.readInt();
                    let trades = wrapper.readInt();

                    if(this.card) this.card.tradeBanUntil = until;

                    while(trades-- > 0)
                    {
                        const trade = { partner: wrapper.readString(), time: wrapper.readInt(), gave: wrapper.readString(), got: wrapper.readString() };

                        this.card?.trades.push(trade);
                    }
                }

                // added later: shared staff notes
                if(wrapper.bytesAvailable)
                {
                    let notes = wrapper.readInt();

                    while(notes-- > 0)
                    {
                        const row = { staff: wrapper.readString(), time: wrapper.readInt(), note: wrapper.readString() };

                        this.card?.notes.push(row);
                    }
                }

                // added later: their last chat lines, for the evidence ticks
                if(wrapper.bytesAvailable)
                {
                    let lines = wrapper.readInt();

                    while(lines-- > 0)
                    {
                        const line = { id: wrapper.readInt(), message: wrapper.readString(), time: wrapper.readInt(), room: wrapper.readString() };

                        this.card?.chat.push(line);
                    }
                }
            }
        }

        return true;
    }
}

export class PlayerToolsCardEvent extends MessageEvent
{
    constructor(callBack: Function) { super(callBack, PlayerToolsCardParser); }

    public getParser(): PlayerToolsCardParser { return this.parser as PlayerToolsCardParser; }
}
