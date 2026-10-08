import { FC, useEffect, useState } from 'react';
import { CreateLinkEvent, SendMessageComposer } from '../../../../api';
import { IPrisoner, IPrisonRoom, PrisonActionComposer, PrisonTime } from '../../../../api/prison/PrisonProtocol';
import { IPlayerToolsCard, PlayerToolsActionComposer, PlayerToolsCardEvent, PlayerToolsLookupComposer, RegisterPlayerToolsMessages } from '../../../../api/security/PlayerToolsProtocol';
import { IStaffFeedWatch, StaffFeedActionComposer } from '../../../../api/stafffeed/StaffFeedProtocol';
import { Button, Column, Flex, LayoutAvatarImageView, Text } from '../../../../common';
import { useMessageEvent, useNotification } from '../../../../hooks';

// Staff Tools > Players (own feature): look up any Habbo and act on them with the Incidents buttons (warn, mute, kick,
// ban, flag) plus Prison; below, who is in prison, who you flagged, and (admins) the prison rooms. Actions run on the
// server through the same code as incidents, so texts, ban rules and the website's audit log are the same. Prison
// works like habbo.st's Adminprison: they can't leave the room, a reminder every 30 seconds, time only runs online.

const ACTIONS: { key: string, label: string, variant: string }[] = [
    { key: 'warn', label: 'Warn', variant: 'warning' },
    { key: 'mute', label: 'Warn + mute 5m', variant: 'warning' },
    { key: 'lastwarn', label: 'Last warning', variant: 'danger' },
    { key: 'kick', label: 'Kick', variant: 'danger' },
    { key: 'ban', label: 'Ban 24h', variant: 'danger' }
];

const PRISON_TIMES = [ 5, 15, 30, 60, 180, 720, 1440 ];

const TRADEBAN_HOURS = [ 1, 6, 24, 72, 168, 720 ];

const hoursText = (hours: number) => (hours < 24) ? `${ hours } h` : `${ hours / 24 } day${ (hours > 24) ? 's' : '' }`;

const untilText = (until: number) =>
{
    const seconds = Math.max(0, until - Math.floor(Date.now() / 1000));

    if(seconds < 3600) return `${ Math.max(1, Math.floor(seconds / 60)) } min`;
    if(seconds < 86400) return `${ Math.floor(seconds / 3600) } h`;

    return `${ Math.floor(seconds / 86400) } days`;
}

const STATUS_COLORS: Record<string, string> = { open: '#d62828', handled: '#1e9e4a', dismissed: '#475569' };

const ago = (at: number) =>
{
    const seconds = Math.max(0, Math.floor(Date.now() / 1000) - at);

    if(seconds < 60) return `${ seconds }s ago`;
    if(seconds < 3600) return `${ Math.floor(seconds / 60) } min ago`;
    if(seconds < 86400) return `${ Math.floor(seconds / 3600) } h ago`;

    return `${ Math.floor(seconds / 86400) } d ago`;
}

const minutesText = (minutes: number) => (minutes < 60) ? `${ minutes } min` : (minutes < 1440) ? `${ minutes / 60 } h` : `${ minutes / 1440 } day`;

interface Props
{
    hidden?: boolean;
    lookupRequest?: { name: string, at: number };
    watched: IStaffFeedWatch[];
    prisons: IPrisonRoom[];
    prisoners: IPrisoner[];
    canManagePrisons: boolean;
}

export const ModToolsPlayerView: FC<Props> = props =>
{
    const { hidden = false, lookupRequest = null, watched = [], prisons = [], prisoners = [], canManagePrisons = false } = props;

    RegisterPlayerToolsMessages();

    const [ username, setUsername ] = useState('');
    const [ card, setCard ] = useState<IPlayerToolsCard>(null);
    const [ notFound, setNotFound ] = useState('');
    const [ note, setNote ] = useState('');
    const [ minutes, setMinutes ] = useState(30);
    const [ tradeHours, setTradeHours ] = useState(24);
    const [ staffNote, setStaffNote ] = useState('');
    const [ prisonId, setPrisonId ] = useState(0);
    const [ noBail, setNoBail ] = useState(false);
    const [ newPrisonName, setNewPrisonName ] = useState('');
    // chatlog lines ticked as evidence for the next action
    const [ evidence, setEvidence ] = useState<number[]>([]);
    const { showConfirm = null, showFeedback = null } = useNotification();

    useMessageEvent<PlayerToolsCardEvent>(PlayerToolsCardEvent, event =>
    {
        const parser = event.getParser();

        // another Habbo = start without ticked lines
        setCard(prev =>
        {
            if(!prev || !parser.card || prev.userId !== parser.card.userId) setEvidence([]);

            return parser.card;
        });
        setNotFound(parser.card ? '' : 'No Habbo with that name.');

        // results as a feedback bubble, like the rest of Staff Tools
        if(parser.message) showFeedback(parser.message);
    });

    // the first prison is picked until another one is chosen
    useEffect(() =>
    {
        if(prisons.length && !prisons.some(prison => prison.id === prisonId)) setPrisonId(prisons[0].id);
    }, [ prisons, prisonId ]);

    // a name clicked elsewhere in Staff Tools (a prisoner, a flagged Habbo, an incident) opens its card here
    useEffect(() =>
    {
        if(!lookupRequest?.name) return;

        setUsername(lookupRequest.name);
        SendMessageComposer(new PlayerToolsLookupComposer(lookupRequest.name));
    }, [ lookupRequest ]);

    const find = (name: string = username) =>
    {
        if(!name.trim().length) return;

        setUsername(name.trim());
        SendMessageComposer(new PlayerToolsLookupComposer(name.trim()));
    }

    const act = (action: string, confirmText: string = null) =>
    {
        if(!card) return;

        const sanction = action.startsWith('prison:') || action.startsWith('tradeban:') || [ 'warn', 'mute', 'lastwarn', 'kick', 'ban', 'flag' ].includes(action);
        const send = () =>
        {
            SendMessageComposer(new PlayerToolsActionComposer(card.username, action, note, sanction ? evidence : []));

            if(sanction) setEvidence([]);
        }

        if(confirmText) showConfirm(confirmText, send, null, 'Yes', 'Cancel', 'Staff Tools');
        else send();
    }

    const prison = () =>
    {
        if(!card || !prisonId) return;

        act(`prison:${ minutes }:${ prisonId }${ noBail ? ':nobail' : '' }`, card.prisonName ? `Add ${ minutesText(minutes) } to ${ card.username }'s prison time${ noBail ? ' (no bail)' : '' }?` : `Send ${ card.username } to prison for ${ minutesText(minutes) }${ noBail ? ' (no bail)' : '' }?`);
    }

    return (
        <Column gap={ 2 } overflow="auto" className={ hidden ? 'd-none' : '' }>
            <Flex gap={ 1 }>
                <input type="text" className="form-control form-control-sm" placeholder="Habbo name" value={ username } maxLength={ 32 }
                    onChange={ event => setUsername(event.target.value) } onKeyDown={ event => (event.key === 'Enter') && find() } />
                <Button disabled={ !username.trim() } onClick={ () => find() }>Find</Button>
            </Flex>
            { !!notFound && <Text small className="admin-error">{ notFound }</Text> }
            { !card && !notFound && <Text small className="admin-muted">Find any Habbo to warn, mute, kick, ban, flag or send them to prison. Everything is logged on the website.</Text> }
            { card &&
                <Column gap={ 1 } className="admin-box staff-incident" style={ { borderLeft: `4px solid ${ (card.openIncidents || card.prisonName) ? '#d62828' : '#475569' }` } }>
                    <Flex gap={ 2 } alignItems="center">
                        <div className="admin-avatar"><LayoutAvatarImageView figure={ card.look } direction={ 2 } headOnly /></div>
                        <Column gap={ 0 } grow>
                            <Flex gap={ 1 } alignItems="center">
                                <Text bold>{ card.username }</Text>
                                { card.flagged && <span className="staff-settings-label" style={ { background: '#e11d48' } }>FLAGGED</span> }
                                { !!card.prisonName && <span className="staff-settings-label" style={ { background: '#7c1fd6' } }>IN PRISON</span> }
                            </Flex>
                            <Text small className="admin-muted">{ card.rankName || 'Habbo' } · { card.online ? (card.roomId ? `in "${ card.roomName }" (#${ card.roomId })` : 'online, not in a room') : 'offline' }</Text>
                            { (card.openIncidents > 0) && <Text small bold className="admin-error">{ card.openIncidents } open incident{ (card.openIncidents > 1) ? 's' : '' }</Text> }
                            <Text small className={ card.sanctionCount ? 'admin-error' : 'admin-muted' }>{ card.sanctionCount ? `Sanction level ${ card.sanctionLevel } (${ card.sanctionCount } sanction${ (card.sanctionCount > 1) ? 's' : '' })` : 'No sanctions' }</Text>
                        </Column>
                    </Flex>
                    <Flex gap={ 1 }>
                        <Button variant="dark" onClick={ () => CreateLinkEvent(`mod-tools/open-user-info/${ card.userId }`) }>Info</Button>
                        <Button variant="dark" disabled={ !card.roomId } onClick={ () => card.roomId && SendMessageComposer(new StaffFeedActionComposer('goto', card.username)) }>Go to</Button>
                        <Button variant="dark" onClick={ () => CreateLinkEvent(`mod-tools/open-user-chatlog/${ card.userId }`) }>Last messages</Button>
                        <Button variant="dark" onClick={ () => find(card.username) }>Refresh</Button>
                    </Flex>
                    <input className="form-control form-control-sm" placeholder="Reason / note for the Habbo and the log (optional)" maxLength={ 200 }
                        value={ note } onChange={ event => setNote(event.target.value) } />
                    <Column gap={ 0 } className="staff-evidence">
                        <Text small bold>Chatlog{ evidence.length ? ` - ${ evidence.length } line${ (evidence.length > 1) ? 's' : '' } attached as evidence` : ' - tick lines to attach them as evidence' }</Text>
                        { !card.chat.length && <Text small className="admin-muted">No chat in the log yet.</Text> }
                        <div className="staff-evidence-lines">
                            { card.chat.map(line =>
                            {
                                const ticked = evidence.includes(line.id);

                                return (
                                    <label key={ line.id } className={ 'staff-evidence-line' + (ticked ? ' is-ticked' : '') }>
                                        <input type="checkbox" className="form-check-input flex-shrink-0 m-0" checked={ ticked } disabled={ !ticked && evidence.length >= 10 }
                                            onChange={ () => setEvidence(prev => ticked ? prev.filter(id => id !== line.id) : [ ...prev, line.id ]) } />
                                        <span className="staff-evidence-time">{ new Date(line.time * 1000).toTimeString().slice(0, 5) }</span>
                                        <span className="staff-evidence-text" title={ line.room }>{ line.message }</span>
                                    </label>
                                );
                            }) }
                        </div>
                        { !!evidence.length && <Text small className="admin-muted">Warnings, mutes and kicks show these lines to the Habbo; every action keeps them in the website's audit log.</Text> }
                    </Column>
                    <Flex gap={ 1 } className="staff-incident-actions">
                        { ACTIONS.map(action =>
                            <Button key={ action.key } variant={ action.variant as any } disabled={ !card.online && (action.key !== 'ban') }
                                onClick={ () => (card.online || action.key === 'ban') && act(action.key, (action.key === 'ban') ? `Ban ${ card.username } for 24 hours?` : null) }>{ action.label }</Button>) }
                        <Button variant="dark" onClick={ () => act('flag') }>{ card.flagged ? 'Unflag' : 'Flag' }</Button>
                        <Button variant="success" onClick={ () => act('reset_sanctions', `Reset all sanctions of ${ card.username }? Their sanction level, probation, mute and trade lock go back to a clean slate (bans and prison stay).`) }>Reset sanctions</Button>
                    </Flex>
                    <Column gap={ 1 } className="staff-prison-box">
                        <Text small bold>Prison{ card.prisonName ? `: in "${ card.prisonName }", ${ PrisonTime(card.prisonSecondsLeft) } left` : '' }</Text>
                        { !prisons.length && <Text small className="admin-muted">No prison room yet{ canManagePrisons ? ': set one up under Prison rooms below.' : ' (an admin sets one up).' }</Text> }
                        { !!prisons.length &&
                            <Flex gap={ 1 }>
                                <select className="form-select form-select-sm" value={ minutes } onChange={ event => setMinutes(parseInt(event.target.value)) }>
                                    { PRISON_TIMES.map(value => <option key={ value } value={ value }>{ minutesText(value) }</option>) }
                                </select>
                                { (prisons.length > 1) &&
                                    <select className="form-select form-select-sm" value={ prisonId } onChange={ event => setPrisonId(parseInt(event.target.value)) }>
                                        { prisons.map(entry => <option key={ entry.id } value={ entry.id }>{ entry.name }</option>) }
                                    </select> }
                                <Button variant="danger" onClick={ prison }>{ card.prisonName ? 'Add time' : 'Send to prison' }</Button>
                                { !!card.prisonName && <Button variant="success" onClick={ () => act('release', `Let ${ card.username } out of prison?`) }>Let out</Button> }
                            </Flex> }
                        { !!prisons.length &&
                            <Flex alignItems="center" gap={ 1 }>
                                <input type="checkbox" className="form-check-input flex-shrink-0 m-0" checked={ noBail } onChange={ event => setNoBail(event.target.checked) } />
                                <Text small>No bail (they can't pay to get out early)</Text>
                            </Flex> }
                    </Column>
                    <Column gap={ 1 } className="staff-prison-box">
                        <Text small bold>Trading{ card.tradeBanUntil ? `: banned for ${ untilText(card.tradeBanUntil) } more` : '' }</Text>
                        <Flex gap={ 1 }>
                            <select className="form-select form-select-sm" value={ tradeHours } onChange={ event => setTradeHours(parseInt(event.target.value)) }>
                                { TRADEBAN_HOURS.map(value => <option key={ value } value={ value }>{ hoursText(value) }</option>) }
                            </select>
                            <Button variant="danger" onClick={ () => act(`tradeban:${ tradeHours }`, `Ban ${ card.username } from trading for ${ hoursText(tradeHours) }?`) }>{ card.tradeBanUntil ? 'Change trade ban' : 'Trade ban' }</Button>
                            { !!card.tradeBanUntil && <Button variant="success" onClick={ () => act('tradeban_lift', `Let ${ card.username } trade again?`) }>Lift</Button> }
                        </Flex>
                        <Text small bold>Last trades</Text>
                        { !card.trades.length && <Text small className="admin-muted">No trades yet.</Text> }
                        { card.trades.map((trade, index) =>
                            <Text key={ index } small>
                                <b>{ trade.partner }</b> · { ago(trade.time) } · gave { trade.gave } · got { trade.got }
                            </Text>) }
                    </Column>
                    <Column gap={ 1 } className="staff-prison-box">
                        <Text small bold>Staff notes</Text>
                        { card.notes.map((row, index) =>
                            <Text key={ index } small><b>{ row.staff }</b> · { ago(row.time) }: { row.note }</Text>) }
                        { !card.notes.length && <Text small className="admin-muted">No notes yet. Leave one so other staff know what happened.</Text> }
                        <Flex gap={ 1 }>
                            <input className="form-control form-control-sm" placeholder="A note for every staff member (e.g. warned twice, watch trades)" maxLength={ 500 }
                                value={ staffNote } onChange={ event => setStaffNote(event.target.value) } />
                            <Button variant="dark" disabled={ !staffNote.trim() } onClick={ () =>
                            {
                                if(!staffNote.trim()) return;

                                SendMessageComposer(new PlayerToolsActionComposer(card.username, 'note', staffNote.trim()));
                                setStaffNote('');
                            } }>Save note</Button>
                        </Flex>
                    </Column>
                    { !card.online && <Text small className="admin-muted">Offline: warnings, mutes and kicks need them online. Ban, trade ban, flag and prison still work (prison starts when they log in).</Text> }
                    { !!card.incidents.length &&
                        <>
                            <Text small bold>Recent incidents</Text>
                            { card.incidents.map((incident, index) =>
                                <Flex key={ index } gap={ 1 } alignItems="center" justifyContent="between">
                                    <Flex gap={ 1 } alignItems="center">
                                        <span className="staff-settings-label" style={ { background: STATUS_COLORS[incident.status] || '#475569' } }>{ incident.status.toUpperCase() }</span>
                                        <Text small>{ incident.label }{ incident.action ? ` - ${ incident.action }` : '' }</Text>
                                    </Flex>
                                    <Text small className="admin-muted">{ ago(incident.lastAt) }</Text>
                                </Flex>) }
                        </> }
                </Column> }

            <Text bold>In prison ({ prisoners.length })</Text>
            { !prisoners.length && <Text small className="admin-muted">Nobody is in prison.</Text> }
            { prisoners.map(prisoner =>
                <Flex key={ prisoner.userId } gap={ 2 } alignItems="center" justifyContent="between" className="admin-box">
                    <Column gap={ 0 } pointer onClick={ () => find(prisoner.username) }>
                        <Text bold>{ prisoner.username }{ prisoner.online ? '' : ' (offline)' }</Text>
                        <Text small className="admin-muted">"{ prisoner.prison }" · { PrisonTime(prisoner.secondsLeft) } left · by { prisoner.sentBy }{ prisoner.reason ? ` · ${ prisoner.reason }` : '' }</Text>
                    </Column>
                    <Button variant="success" onClick={ () => showConfirm(`Let ${ prisoner.username } out of prison?`, () => SendMessageComposer(new PrisonActionComposer('release', prisoner.userId)), null, 'Yes', 'Cancel', 'Staff Tools') }>Let out</Button>
                </Flex>) }

            <Text bold>Flagged by you ({ watched.length })</Text>
            <Text small className="admin-muted">Only you see your flags: everything a flagged Habbo does shows in your staff feed under WATCH. Flag someone from their card above.</Text>
            { watched.map(row =>
                <Flex key={ row.username } gap={ 2 } alignItems="center" justifyContent="between" className="admin-box">
                    <Column gap={ 0 } pointer onClick={ () => find(row.username) }>
                        <Text bold>{ row.username }</Text>
                        { !!row.reason && <Text small>{ row.reason }</Text> }
                        <Text small className="admin-muted">Flagged { ago(row.since) }</Text>
                    </Column>
                    <Button variant="dark" onClick={ () => SendMessageComposer(new StaffFeedActionComposer('watch', row.username)) }>Unflag</Button>
                </Flex>) }

            { canManagePrisons &&
                <>
                    <Text bold>Prison rooms</Text>
                    <Text small className="admin-muted">Go to the room you want as a prison and add it here. Only staff and prisoners can enter a prison room.</Text>
                    { prisons.map(entry =>
                        <Flex key={ entry.id } gap={ 2 } alignItems="center" justifyContent="between" className="admin-box">
                            <Column gap={ 0 }>
                                <Text bold>{ entry.name }</Text>
                                <Text small className="admin-muted">Room "{ entry.roomName }" (#{ entry.roomId })</Text>
                            </Column>
                            <Flex gap={ 1 } alignItems="center">
                                <label className="d-flex gap-1 align-items-center"><input type="checkbox" className="form-check-input m-0" checked={ entry.canChat } onChange={ () => SendMessageComposer(new PrisonActionComposer('chat', entry.id)) } /><Text small>Chat</Text></label>
                                <label className="d-flex gap-1 align-items-center"><input type="checkbox" className="form-check-input m-0" checked={ entry.canCommands } onChange={ () => SendMessageComposer(new PrisonActionComposer('commands', entry.id)) } /><Text small>Commands</Text></label>
                                <Button variant="dark" onClick={ () => showConfirm(`Stop using "${ entry.name }" as a prison?`, () => SendMessageComposer(new PrisonActionComposer('remove', entry.id)), null, 'Yes', 'Cancel', 'Staff Tools') }>Remove</Button>
                            </Flex>
                        </Flex>) }
                    <Flex gap={ 1 }>
                        <input className="form-control form-control-sm" placeholder="Prison name (optional)" maxLength={ 40 } value={ newPrisonName } onChange={ event => setNewPrisonName(event.target.value) } />
                        <Button variant="dark" onClick={ () => { SendMessageComposer(new PrisonActionComposer('add_here', newPrisonName.trim())); setNewPrisonName(''); } }>Use the room I'm in</Button>
                    </Flex>
                </> }
        </Column>
    );
}
