import { FC, useEffect, useState } from 'react';
import { CreateLinkEvent, GetRoomSession, GetSessionDataManager, SendMessageComposer } from '../../../../api';
import { SecurityIncidentActionComposer } from '../../../../api/security/SecurityProtocol';
import { IPrisoner, IPrisonRoom, PrisonStateEvent, PrisonStateRequestComposer, RegisterPrisonMessages } from '../../../../api/prison/PrisonProtocol';
import { StaffFeedCard } from '../../../../api/stafffeed/StaffFeedCardStore';
import { IStaffDuty, IStaffFeedTag, IStaffFeedWatch, IStaffSetting, RegisterStaffFeedMessages, StaffFeedActionComposer, StaffFeedStateEvent, StaffFeedStateRequestComposer } from '../../../../api/stafffeed/StaffFeedProtocol';
import { Button, Column, DraggableWindowPosition, Flex, NitroCardContentView, NitroCardHeaderView, NitroCardTabsItemView, NitroCardTabsView, NitroCardView, Text } from '../../../../common';
import { useMessageEvent, useNotification } from '../../../../hooks';
import { StaffToolsIconUrl } from '../../../room/widgets/chat/ChatWidgetMessageView';
import { ModToolsIncidentsView } from './ModToolsIncidentsView';
import { ModToolsPlayerView } from './ModToolsPlayerView';

// Mod Tools > Staff Tools (own feature, the Administration window's layout and classes). Four tabs:
//  Home      - your duty, what needs you (incidents, prisoners), who is on duty, and shortcuts with a line each;
//  Incidents - odd behaviour the server caught, with one-click actions and "I'm on it";
//  Players   - any Habbo's card with the same actions plus prison, who is in prison, your flags, prison rooms;
//  Settings  - duty and staff feed settings (where lines show, which tags).
// Staff work with the buttons here; the old chat commands (:stafffeed, :duty, :staffsettings, :pin) are gone.

const TABS = [ 'Home', 'Incidents', 'Players', 'Settings' ];
const TAB_HOME = 0, TAB_INCIDENTS = 1, TAB_PLAYERS = 2, TAB_SETTINGS = 3;

const TAG_COLORS: Record<string, string> = {
    'new': '#1e9e4a', 'moderation': '#d62828', 'wordfilter': '#d97706', 'report': '#c2185b',
    'staff': '#2f5fd0', 'command': '#0e7490', 'security': '#7c1fd6', 'watch': '#e11d48', 'economy': '#a16207', 'alert': '#b91c1c'
};

// where feed lines show: any mix of the three (none ticked = the card)
const DISPLAY = [
    { key: 'feed_room', label: 'Room chat', help: 'a chat line over your avatar, only you see it' },
    { key: 'feed_bubble', label: 'Bubble', help: 'a notification bubble, also outside rooms' },
    { key: 'feed_card', label: 'Staff feed card', help: 'the list window with Live and History' }
];

const DISPLAY_KEYS = DISPLAY.map(entry => entry.key);

// the hotel's security modes (server security/SecurityGuard); what each rule does per mode is set on the website
const MODES = [
    { key: 'normal', label: 'Normal', color: '#1e9e4a', help: 'The rules as set. Incidents wait for staff.' },
    { key: 'strict', label: 'Strict', color: '#d97706', help: 'Rules trigger sooner; floods and repeats are muted, scam words warned then banned.' },
    { key: 'safest', label: 'Safest', color: '#d62828', help: 'Rules trigger at half the count: scam and advert words are banned for 24 h, ban evasion is banned, spam is kicked and muted.' }
];

const ago = (since: number) =>
{
    const seconds = Math.max(0, Math.floor(Date.now() / 1000) - since);

    if(seconds < 3600) return `${ Math.max(1, Math.floor(seconds / 60)) } min`;
    if(seconds < 86400) return `${ Math.floor(seconds / 3600) } h`;

    return `${ Math.floor(seconds / 86400) } d`;
}

export const ModToolsStaffSettingsView: FC<{ onCloseClick: () => void, incidentsRequest?: number }> = props =>
{
    const { onCloseClick = null } = props;

    RegisterStaffFeedMessages();
    RegisterPrisonMessages();

    const [ tab, setTab ] = useState(TAB_HOME);
    const [ incidentCount, setIncidentCount ] = useState(0);
    const [ on, setOn ] = useState(false);
    const [ tags, setTags ] = useState<IStaffFeedTag[]>([]);
    const [ watched, setWatched ] = useState<IStaffFeedWatch[]>([]);
    const [ onDuty, setOnDuty ] = useState(false);
    const [ duty, setDuty ] = useState<IStaffDuty[]>([]);
    const [ settings, setSettings ] = useState<IStaffSetting[]>([]);
    const [ prisons, setPrisons ] = useState<IPrisonRoom[]>([]);
    const [ prisoners, setPrisoners ] = useState<IPrisoner[]>([]);
    const [ canManagePrisons, setCanManagePrisons ] = useState(false);
    const [ lookupRequest, setLookupRequest ] = useState<{ name: string, at: number }>(null);
    const [ securityMode, setSecurityMode ] = useState('normal');
    const isAdmin = (GetSessionDataManager().securityLevel >= 7);
    const { showFeedback = null } = useNotification();

    // the ALERT bubble's link (mod-tools/incidents) brings the Incidents tab to the front
    useEffect(() => { if(props.incidentsRequest) setTab(TAB_INCIDENTS); }, [ props.incidentsRequest ]);

    useMessageEvent<StaffFeedStateEvent>(StaffFeedStateEvent, event =>
    {
        const parser = event.getParser();

        setOn(parser.on);
        setTags(parser.tags);
        setWatched(parser.watched);
        setOnDuty(parser.onDuty);
        setDuty(parser.duty);
        setSettings(parser.settings);

        // the result of an action, as a feedback bubble (the window stays clean)
        if(parser.message) showFeedback(parser.message);
    });

    useMessageEvent<PrisonStateEvent>(PrisonStateEvent, event =>
    {
        const parser = event.getParser();

        setPrisons(parser.prisons);
        setPrisoners(parser.prisoners);
        setCanManagePrisons(parser.canManage);
    });

    // braces: SendMessageComposer returns a boolean, and anything an effect returns is called as its clean-up
    useEffect(() =>
    {
        SendMessageComposer(new StaffFeedStateRequestComposer());
        SendMessageComposer(new PrisonStateRequestComposer());
    }, []);

    const act = (action: string, argument: string = '') => SendMessageComposer(new StaffFeedActionComposer(action, argument));

    const lookup = (name: string) =>
    {
        setLookupRequest({ name, at: Date.now() });
        setTab(TAB_PLAYERS);
    }

    const setting = (key: string) => settings.find(entry => entry.key === key);

    const roomId = GetRoomSession()?.roomId || 0;

    // the switches of one group (StaffDuty.SETTINGS: duty / feed / flags), without the display ones
    const settingRows = (group: string) => settings.filter(entry => ((entry.group || 'duty') === group) && !DISPLAY_KEYS.includes(entry.key)).map(entry =>
        <Flex key={ entry.key } gap={ 2 } alignItems="center" className="admin-box staff-settings-tag">
            <input type="checkbox" className="form-check-input flex-shrink-0 m-0" checked={ entry.on } onChange={ () => act('setting', entry.key) } />
            <Column gap={ 0 }>
                <Text bold>{ entry.label }</Text>
                <Text small className="admin-muted">{ entry.description }</Text>
            </Column>
        </Flex>);

    const shortcut = (label: string, help: string, onClick: () => void, disabled = false, icon: string = null) =>
        <Flex key={ label } gap={ 2 } alignItems="center" justifyContent="between" className="admin-box">
            { icon && <img className="staff-tools-icon" src={ StaffToolsIconUrl(icon) } alt="" /> }
            <Column gap={ 0 } grow>
                <Text bold>{ label }</Text>
                <Text small className="admin-muted">{ help }</Text>
            </Column>
            <Button variant="dark" disabled={ disabled } onClick={ () => !disabled && onClick() }>Open</Button>
        </Flex>;

    return (
        <NitroCardView uniqueKey="mod-tools-staff-settings" className="nitro-mod-tools-administration nitro-mod-tools-staff-settings" windowPosition={ DraggableWindowPosition.TOP_LEFT } theme="primary-slim" style={ { width: 420, height: 560 } }>
            <NitroCardHeaderView headerText="Staff Tools" onCloseClick={ onCloseClick } />
            <NitroCardContentView gap={ 2 }>
                <NitroCardTabsView>
                    { TABS.map((label, index) =>
                        <NitroCardTabsItemView key={ index } isActive={ tab === index } onClick={ () => setTab(index) }>
                            { label }{ (index === TAB_INCIDENTS && incidentCount) ? ` (${ incidentCount })` : '' }
                        </NitroCardTabsItemView>) }
                </NitroCardTabsView>

                { (tab === TAB_HOME) &&
                    <Column gap={ 2 } overflow="auto">
                        <Flex gap={ 2 } alignItems="center" justifyContent="between" className={ 'admin-box staff-home-duty' + (onDuty ? ' is-on' : '') }>
                            <img className="staff-tools-icon" src={ StaffToolsIconUrl('short_duty') } alt="" />
                            <Column gap={ 0 } grow>
                                <Text bold>{ onDuty ? 'You are on duty' : 'You are off duty' }</Text>
                                <Text small className="admin-muted">{ onDuty
                                    ? 'Players see you can help (:onduty), new reports and incidents come to you, your staff feed is on.'
                                    : 'Go on duty when you are around to help: players are told, reports and incidents come to you and your feed turns on.' }</Text>
                            </Column>
                            <Button variant={ onDuty ? 'danger' : 'success' } onClick={ () => act('duty') }>{ onDuty ? 'Go off duty' : 'Go on duty' }</Button>
                        </Flex>

                        <Column gap={ 1 } className="admin-box staff-home-security" style={ { borderColor: (MODES.find(entry => entry.key === securityMode) || MODES[0]).color } }>
                            <Text bold>Hotel security: { (MODES.find(entry => entry.key === securityMode) || MODES[0]).label }</Text>
                            <Text small className="admin-muted">{ (MODES.find(entry => entry.key === securityMode) || MODES[0]).help }</Text>
                            { isAdmin &&
                                <Flex gap={ 1 }>
                                    { MODES.map(entry =>
                                        <Button key={ entry.key } fullWidth variant={ (securityMode === entry.key) ? 'primary' : 'dark' }
                                            onClick={ () => (securityMode !== entry.key) && SendMessageComposer(new SecurityIncidentActionComposer(0, 'mode:' + entry.key)) }>{ entry.label }</Button>) }
                                </Flex> }
                            { !isAdmin && <Text small className="admin-muted">Admins switch the mode here or on the website.</Text> }
                        </Column>

                        <div className="staff-home-grid">
                            <div className={ 'admin-box staff-home-stat' + (incidentCount ? ' is-alert' : '') } onClick={ () => setTab(TAB_INCIDENTS) }>
                                <img className="staff-tools-icon" src={ StaffToolsIconUrl('tag_alert') } alt="" />
                                <Text bold className="staff-home-number">{ incidentCount }</Text>
                                <Text small>incident{ (incidentCount === 1) ? '' : 's' } need action</Text>
                            </div>
                            <div className="admin-box staff-home-stat" onClick={ () => setTab(TAB_PLAYERS) }>
                                <img className="staff-tools-icon" src={ StaffToolsIconUrl('short_prison') } alt="" />
                                <Text bold className="staff-home-number">{ prisoners.length }</Text>
                                <Text small>in prison</Text>
                            </div>
                            <div className="admin-box staff-home-stat" onClick={ () => StaffFeedCard.setOpen(true) }>
                                <img className="staff-tools-icon" src={ StaffToolsIconUrl('short_feed') } alt="" />
                                <Text bold className="staff-home-number">{ on ? 'ON' : 'OFF' }</Text>
                                <Text small>staff feed</Text>
                            </div>
                        </div>

                        <Column gap={ 1 } className="admin-box">
                            <Text bold>On duty now ({ duty.length })</Text>
                            { !duty.length && <Text small className="admin-muted">Nobody. Go on duty so players know someone can help.</Text> }
                            { duty.map(row =>
                                <Flex key={ row.username } justifyContent="between">
                                    <Text small bold pointer onClick={ () => lookup(row.username) }>{ row.username }</Text>
                                    <Text small className="admin-muted">for { ago(row.since) }</Text>
                                </Flex>) }
                        </Column>

                        <Text bold>Shortcuts</Text>
                        { shortcut('Incidents', 'Odd behaviour the hotel caught (flood, scams, alt accounts...). Say "I\'m on it", then act.', () => setTab(TAB_INCIDENTS), false, 'tag_alert') }
                        { shortcut('Find a Habbo', 'Warn, mute, kick, ban, trade ban, flag or send someone to prison.', () => setTab(TAB_PLAYERS), false, 'short_find') }
                        { shortcut('Staff feed card', 'Everything that happens, live, with the full history to search.', () => StaffFeedCard.setOpen(true), false, 'short_feed') }
                        { shortcut('Reports', 'Calls for help from players (the Report Tool).', () => CreateLinkEvent('mod-tools/tickets'), false, 'tag_report') }
                        { shortcut('This room', roomId ? 'The Room Tool for the room you are in: kick everyone, lock it, change settings.' : 'Go into a room to use the Room Tool.', () => CreateLinkEvent(`mod-tools/open-room-info/${ roomId }`), !roomId, 'short_room') }
                        { shortcut('Room chatlog', roomId ? 'What was said in the room you are in.' : 'Go into a room to read its chatlog.', () => CreateLinkEvent(`mod-tools/open-room-chatlog/${ roomId }`), !roomId, 'short_chatlog') }
                    </Column> }

                { /* kept mounted (hidden) so the open count and live pushes arrive while another tab is shown */ }
                <ModToolsIncidentsView hidden={ tab !== TAB_INCIDENTS } onCount={ setIncidentCount } onLookup={ lookup } onMode={ setSecurityMode } />
                <ModToolsPlayerView hidden={ tab !== TAB_PLAYERS } lookupRequest={ lookupRequest } watched={ watched } prisons={ prisons } prisoners={ prisoners } canManagePrisons={ canManagePrisons } />

                { (tab === TAB_SETTINGS) &&
                    <Column gap={ 2 } overflow="auto">
                        <Text bold>Duty</Text>
                        { settingRows('duty') }

                        <Flex gap={ 2 } alignItems="center" justifyContent="between" className="admin-box">
                            <Column gap={ 0 }>
                                <Text bold>Staff feed { on ? 'is on' : 'is off' }</Text>
                                <Text small className="admin-muted">Lines about what happens in the hotel. Going on duty turns it on. Incidents (ALERT) always reach you, even with the feed off.</Text>
                            </Column>
                            <Button variant={ on ? 'danger' : 'success' } onClick={ () => act('feed') }>{ on ? 'Turn off' : 'Turn on' }</Button>
                        </Flex>

                        <Column gap={ 1 } className="admin-box">
                            <Text bold>Show feed lines in</Text>
                            { DISPLAY.map(entry =>
                            {
                                const current = setting(entry.key);

                                if(!current) return null;

                                return (
                                    <label key={ entry.key } className="d-flex gap-2 align-items-center">
                                        <input type="checkbox" className="form-check-input flex-shrink-0 m-0" checked={ current.on } onChange={ () => act('setting', entry.key) } />
                                        <Text small><b>{ entry.label }</b> - { entry.help }</Text>
                                    </label>
                                );
                            }) }
                            <Text small className="admin-muted">Tick any mix. Nothing ticked = the card. Incidents always pop up as a bubble and go into the card.</Text>
                            <Button variant="dark" onClick={ () => StaffFeedCard.setOpen(true) }>Open the Staff feed card</Button>
                        </Column>

                        <Text bold>How my feed works</Text>
                        { settingRows('feed') }
                        { settingRows('flags') }

                        <Flex gap={ 1 }>
                            <Button variant="dark" fullWidth disabled={ !on } onClick={ () => on && act('quiet') }>Important tags only</Button>
                            <Button variant="dark" fullWidth disabled={ !on } onClick={ () => on && act('all') }>Every tag</Button>
                        </Flex>
                        { tags.map(tag =>
                            <Flex key={ tag.tag } gap={ 2 } alignItems="center" className="admin-box staff-settings-tag">
                                <input type="checkbox" className="form-check-input flex-shrink-0 m-0" disabled={ !on || tag.tag === 'alert' } checked={ (on && tag.shows) || tag.tag === 'alert' } onChange={ () => act('tag', tag.tag) } />
                                <img className="staff-tools-icon" src={ StaffToolsIconUrl('tag_' + tag.tag) } alt="" />
                                <Column gap={ 0 }>
                                    <span className="staff-settings-label" style={ { background: TAG_COLORS[tag.tag] || '#475569' } }>{ tag.label }</span>
                                    <Text small className="admin-muted">{ tag.description }{ (tag.tag === 'alert') ? ' Always on.' : '' }</Text>
                                </Column>
                            </Flex>) }
                        <Text small className="admin-muted">Which tags exist, the security rules and the watch words are set on the website: Moderation.</Text>
                    </Column> }
            </NitroCardContentView>
        </NitroCardView>
    );
}
