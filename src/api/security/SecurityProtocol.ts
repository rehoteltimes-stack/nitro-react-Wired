import { IMessageComposer, IMessageDataWrapper, IMessageParser, MessageEvent } from '@nitrots/nitro-renderer';
import { GetConnection } from '../nitro';

// Staff Settings > Incidents: odd behaviour the server detected (flood, watch words, trying staff commands, room
// hopping, trade bursts, trades to new accounts, banned / shared IPs) and the one-click actions for it. Server:
// hcms-emulator-plugin security/SecurityProtocol.java (IN 9626 list, IN 9627 action, OUT 9628 list, also pushed live).

const IncomingHeaders = { SECURITY_INCIDENTS: 9628 };
const OutgoingHeaders = { SECURITY_INCIDENTS_REQUEST: 9626, SECURITY_INCIDENT_ACTION: 9627 };

let registered = false;

export const RegisterSecurityMessages = () =>
{
    if(registered) return;

    const connection = GetConnection();

    if(!connection) return;

    connection.registerMessages({
        events: new Map<number, Function>([ [ IncomingHeaders.SECURITY_INCIDENTS, SecurityIncidentsEvent ] ]),
        composers: new Map<number, Function>([
            [ OutgoingHeaders.SECURITY_INCIDENTS_REQUEST, SecurityIncidentsRequestComposer ],
            [ OutgoingHeaders.SECURITY_INCIDENT_ACTION, SecurityIncidentActionComposer ]
        ])
    });

    registered = true;
}

export class SecurityIncidentsRequestComposer implements IMessageComposer<[ boolean ]>
{
    private _data: [ boolean ];

    /** openOnly = false: every incident of the last 7 days */
    constructor(openOnly: boolean) { this._data = [ openOnly ]; }

    public getMessageArray() { return this._data; }

    public dispose(): void { return; }
}

export class SecurityIncidentActionComposer implements IMessageComposer<[ number, string, string ]>
{
    private _data: [ number, string, string ];

    /** action: warn | mute | lastwarn | kick | ban | flag | messages | claim (I'm on it / let go) | dismiss | done */
    constructor(incidentId: number, action: string, note: string = '') { this._data = [ incidentId, action, note ]; }

    public getMessageArray() { return this._data; }

    public dispose(): void { return; }
}

export interface ISecurityIncident
{
    id: number;
    userId: number;
    username: string;
    rule: string;
    label: string;
    detail: string;
    roomId: number;
    roomName: string;
    severity: number;
    status: string;
    hits: number;
    createdAt: number;
    lastAt: number;
    suggested: string;
    action: string;
    claimedBy: string;
}

export class SecurityIncidentsParser implements IMessageParser
{
    public openCount = 0;
    public openOnly = true;
    public incidents: ISecurityIncident[] = [];
    public message = '';
    public mode = '';

    public flush(): boolean
    {
        this.openCount = 0;
        this.openOnly = true;
        this.incidents = [];
        this.message = '';
        this.mode = '';

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this.openCount = wrapper.readInt();
        this.openOnly = wrapper.readBoolean();

        let count = wrapper.readInt();

        while(count-- > 0)
        {
            this.incidents.push({
                id: wrapper.readInt(), userId: wrapper.readInt(), username: wrapper.readString(), rule: wrapper.readString(), label: wrapper.readString(),
                detail: wrapper.readString(), roomId: wrapper.readInt(), roomName: wrapper.readString(), severity: wrapper.readInt(), status: wrapper.readString(),
                hits: wrapper.readInt(), createdAt: wrapper.readInt(), lastAt: wrapper.readInt(), suggested: wrapper.readString(), action: wrapper.readString(),
                claimedBy: wrapper.readString()
            });
        }

        this.message = wrapper.bytesAvailable ? wrapper.readString() : '';
        // the hotel's security mode: normal | strict | safest
        this.mode = wrapper.bytesAvailable ? wrapper.readString() : '';

        return true;
    }
}

export class SecurityIncidentsEvent extends MessageEvent
{
    constructor(callBack: Function) { super(callBack, SecurityIncidentsParser); }

    public getParser(): SecurityIncidentsParser { return this.parser as SecurityIncidentsParser; }
}
