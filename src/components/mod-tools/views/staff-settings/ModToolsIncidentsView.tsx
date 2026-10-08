import { FC, useEffect, useState } from 'react';
import { CreateLinkEvent, SendMessageComposer } from '../../../../api';
import { ISecurityIncident, RegisterSecurityMessages, SecurityIncidentActionComposer, SecurityIncidentsEvent, SecurityIncidentsRequestComposer } from '../../../../api/security/SecurityProtocol';
import { StaffFeedActionComposer } from '../../../../api/stafffeed/StaffFeedProtocol';
import { Button, Column, Flex, Text } from '../../../../common';
import { GetSessionDataManager } from '../../../../api';
import { useMessageEvent, useNotification } from '../../../../hooks';

// Staff Tools > Incidents (own feature, the window's admin-box layout): odd behaviour the server detected
// (security/SecurityGuard), newest and most severe first, with one-click actions. The warning ladder follows the Plus
// emulator (rule warning, warning + 5 min mute, last warning); every action is logged on the website's audit log.
// "I'm on it" shows every staff member who is handling an incident, so two people don't act on the same thing.

const SEVERITY: Record<number, { label: string, color: string }> = {
    1: { label: 'LOW', color: '#475569' },
    2: { label: 'MEDIUM', color: '#d97706' },
    3: { label: 'HIGH', color: '#d62828' }
};

const ACTIONS: { key: string, label: string, variant: string }[] = [
    { key: 'warn', label: 'Warn', variant: 'warning' },
    { key: 'mute', label: 'Warn + mute 5m', variant: 'warning' },
    { key: 'lastwarn', label: 'Last warning', variant: 'danger' },
    { key: 'kick', label: 'Kick', variant: 'danger' },
    { key: 'ban', label: 'Ban 24h', variant: 'danger' },
    { key: 'flag', label: 'Flag', variant: 'dark' }
];

const ago = (at: number) =>
{
    const seconds = Math.max(0, Math.floor(Date.now() / 1000) - at);

    if(seconds < 60) return `${ seconds }s ago`;
    if(seconds < 3600) return `${ Math.floor(seconds / 60) } min ago`;
    if(seconds < 86400) return `${ Math.floor(seconds / 3600) } h ago`;

    return `${ Math.floor(seconds / 86400) } d ago`;
}

export const ModToolsIncidentsView: FC<{ onCount?: (count: number) => void, hidden?: boolean, onLookup?: (name: string) => void, onMode?: (mode: string) => void }> = props =>
{
    const { onCount = null, hidden = false, onLookup = null, onMode = null } = props;

    RegisterSecurityMessages();

    const [ incidents, setIncidents ] = useState<ISecurityIncident[]>([]);
    const [ openOnly, setOpenOnly ] = useState(true);
    const [ notes, setNotes ] = useState<Record<number, string>>({});
    const { showConfirm = null, showFeedback = null } = useNotification();
    const me = GetSessionDataManager().userName;

    useMessageEvent<SecurityIncidentsEvent>(SecurityIncidentsEvent, event =>
    {
        const parser = event.getParser();

        onCount?.(parser.openCount);

        if(parser.mode) onMode?.(parser.mode);

        // the result of this staff member's own click, as a feedback bubble; live pushes carry none
        if(parser.message) showFeedback(parser.message);

        // a live push only holds open incidents: keep the "all" view as it is until it is asked for again
        if(parser.openOnly !== openOnly) return;

        setIncidents(parser.incidents);
    });

    useEffect(() => { SendMessageComposer(new SecurityIncidentsRequestComposer(openOnly)); }, [ openOnly ]);

    const act = (incident: ISecurityIncident, action: string) =>
    {
        const note = notes[incident.id] || '';
        const send = () =>
        {
            SendMessageComposer(new SecurityIncidentActionComposer(incident.id, action, note));

            if(!openOnly) setTimeout(() => SendMessageComposer(new SecurityIncidentsRequestComposer(false)), 400);
        }

        if(action === 'ban') showConfirm(`Ban ${ incident.username } for 24 hours?`, send, null, 'Ban', 'Cancel', 'Ban');
        else send();
    }

    return (
        <Column gap={ 2 } overflow="auto" className={ hidden ? 'd-none' : '' }>
            <Flex gap={ 1 }>
                <Button fullWidth variant={ openOnly ? 'primary' : 'dark' } onClick={ () => setOpenOnly(true) }>Open</Button>
                <Button fullWidth variant={ !openOnly ? 'primary' : 'dark' } onClick={ () => setOpenOnly(false) }>Last 7 days</Button>
            </Flex>
            { !incidents.length && <Text small className="admin-muted">{ openOnly ? 'Nothing needs action right now.' : 'No incidents in the last 7 days.' }</Text> }
            { incidents.map(incident =>
            {
                const severity = SEVERITY[incident.severity] || SEVERITY[2];
                const open = (incident.status === 'open');

                return (
                    <Column key={ incident.id } gap={ 1 } className="admin-box staff-incident" style={ { borderLeft: `4px solid ${ severity.color }` } }>
                        <Flex gap={ 1 } alignItems="center" justifyContent="between">
                            <Flex gap={ 1 } alignItems="center">
                                <span className="staff-settings-label" style={ { background: severity.color } }>{ severity.label }</span>
                                <Text bold pointer onClick={ () => onLookup?.(incident.username) } title="Open in Players">{ incident.username }</Text>
                            </Flex>
                            <Text small className="admin-muted">{ ago(incident.lastAt) }{ (incident.hits > 1) ? ` · x${ incident.hits }` : '' }</Text>
                        </Flex>
                        <Text small bold>{ incident.label }</Text>
                        <Text small textBreak>{ incident.detail }{ incident.roomName ? ` - in "${ incident.roomName }" (#${ incident.roomId })` : '' }</Text>
                        { !!incident.action && <Text small className="admin-muted">{ open ? '' : `${ incident.status }: ` }{ incident.action }</Text> }
                        { open && !!incident.claimedBy && <Text small bold className={ (incident.claimedBy === me) ? 'admin-ok' : 'admin-muted' }>{ (incident.claimedBy === me) ? 'You are on it' : `${ incident.claimedBy } is on it` }</Text> }
                        { open &&
                            <>
                                <Flex gap={ 1 }>
                                    { (!incident.claimedBy || incident.claimedBy === me) &&
                                        <Button variant={ incident.claimedBy ? 'dark' : 'primary' } onClick={ () => act(incident, 'claim') }>{ incident.claimedBy ? 'Let go' : 'I\'m on it' }</Button> }
                                    <Button variant="dark" onClick={ () => CreateLinkEvent(`mod-tools/open-user-info/${ incident.userId }`) }>Info</Button>
                                    <Button variant="dark" onClick={ () => SendMessageComposer(new StaffFeedActionComposer('goto', incident.username)) }>Go to</Button>
                                    <Button variant="dark" onClick={ () => CreateLinkEvent(`mod-tools/open-user-chatlog/${ incident.userId }`) }>Last messages</Button>
                                </Flex>
                                <input className="form-control form-control-sm" placeholder="Note for the Habbo / the log (optional)" maxLength={ 200 }
                                    value={ notes[incident.id] || '' } onChange={ event => setNotes(prev => ({ ...prev, [incident.id]: event.target.value })) } />
                                <Flex gap={ 1 } className="staff-incident-actions">
                                    { ACTIONS.map(action =>
                                        <Button key={ action.key } variant={ action.variant as any } className={ (incident.suggested === action.key) ? 'staff-incident-suggested' : '' }
                                            title={ (incident.suggested === action.key) ? 'Suggested' : '' } onClick={ () => act(incident, action.key) }>{ action.label }</Button>) }
                                </Flex>
                                <Flex gap={ 1 }>
                                    <Button fullWidth variant="success" onClick={ () => act(incident, 'done') }>Handled</Button>
                                    <Button fullWidth variant="dark" onClick={ () => act(incident, 'dismiss') }>Dismiss (false alarm)</Button>
                                </Flex>
                            </> }
                    </Column>
                );
            }) }
            <Text small className="admin-muted">Rules (what counts as odd, how often, auto actions) and the watch words are set on the website: Moderation &gt; Security rules / Watch words.</Text>
        </Column>
    );
}
