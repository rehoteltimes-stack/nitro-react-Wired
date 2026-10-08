import { FC, useEffect, useMemo, useState } from 'react';
import { GetSessionDataManager, SendMessageComposer } from '../../../../api';
import { StaffFeedCard, useStaffFeedCard } from '../../../../api/stafffeed/StaffFeedCardStore';
import { RegisterStaffFeedMessages, StaffFeedHistoryEvent, StaffFeedHistoryRequestComposer, StaffFeedLineEvent } from '../../../../api/stafffeed/StaffFeedProtocol';
import { Button, Column, DraggableWindowPosition, Flex, NitroCardContentView, NitroCardHeaderView, NitroCardTabsItemView, NitroCardTabsView, NitroCardView, Text } from '../../../../common';
import { useMessageEvent } from '../../../../hooks';
import { StaffFeedHistoryView } from './StaffFeedHistoryView';
import { StaffFeedLineView } from './StaffFeedLineView';

// The Staff feed card (own feature, the Staff Tools window's look). Live: every staff feed line as it happens, newest
// first (the server sends each line, OUT 9638; the card is always mounted to collect them, and the first open adds the
// log's last 100 lines, 9639 / 9640). History: the whole saved log, searched and paged on the server
// (StaffFeedHistoryView). With "Card only" in Staff Tools > Staff feed, lines show only here, never as room chat or
// bubbles. Hover a line for Info / Go to / Flag / Commands.

const TABS = [ 'Live', 'History' ];

export const StaffFeedCardView: FC<{}> = () =>
{
    RegisterStaffFeedMessages();

    const { lines, open, focus } = useStaffFeedCard();
    const [ tab, setTab ] = useState(0);
    const [ tag, setTag ] = useState('');
    const [ search, setSearch ] = useState('');
    const [ paused, setPaused ] = useState<number>(0);

    useEffect(() =>
    {
        if(!focus.seq) return;

        setTab(focus.history ? 1 : 0);

        if(focus.history) return;

        setTag(focus.tag);
        setSearch(focus.search);
        setPaused(0);
    }, [ focus.seq ]);

    useMessageEvent<StaffFeedLineEvent>(StaffFeedLineEvent, event =>
    {
        const line = event.getParser().line;

        if(line) StaffFeedCard.add(line);
    });

    useMessageEvent<StaffFeedHistoryEvent>(StaffFeedHistoryEvent, event => StaffFeedCard.history(event.getParser().lines));

    // braces: SendMessageComposer returns a boolean, and anything an effect returns is called as its clean-up
    useEffect(() =>
    {
        if(open && !StaffFeedCard.historyLoaded) SendMessageComposer(new StaffFeedHistoryRequestComposer());
    }, [ open ]);

    const tags = useMemo(() =>
    {
        const found = new Map<string, string>();

        lines.forEach(line => found.set(line.tag, line.label));

        return [ ...found.entries() ];
    }, [ lines ]);

    // "Pause": the list stays as it was when paused (by line id); new lines wait above it
    const shown = useMemo(() =>
    {
        const needle = search.trim().toLowerCase();

        return lines.filter(line => (!paused || line.id <= paused) && (!tag || line.tag === tag) && (!needle || line.text.toLowerCase().includes(needle)));
    }, [ lines, tag, search, paused ]);

    const waiting = paused ? lines.filter(line => line.id > paused).length : 0;

    if(!open || (GetSessionDataManager().securityLevel < 4)) return null;

    return (
        <NitroCardView uniqueKey="staff-feed-card" className="nitro-mod-tools-administration nitro-mod-tools-staff-settings staff-feed-card" windowPosition={ DraggableWindowPosition.TOP_LEFT } theme="primary-slim" style={ { width: 480, height: 500 } }>
            <NitroCardHeaderView headerText="Staff feed" onCloseClick={ () => StaffFeedCard.setOpen(false) } />
            <NitroCardContentView gap={ 2 }>
                <NitroCardTabsView>
                    { TABS.map((label, index) =>
                        <NitroCardTabsItemView key={ index } isActive={ tab === index } onClick={ () => setTab(index) }>{ label }</NitroCardTabsItemView>) }
                </NitroCardTabsView>
                { (tab === 0) &&
                    <>
                        <Flex gap={ 1 } shrink>
                            <select className="form-select form-select-sm staff-feed-card-tag" value={ tag } onChange={ event => setTag(event.target.value) }>
                                <option value="">All tags</option>
                                { tags.map(([ key, label ]) => <option key={ key } value={ key }>{ label }</option>) }
                            </select>
                            <input className="form-control form-control-sm" placeholder="Filter: name, room, command..." value={ search } onChange={ event => setSearch(event.target.value) } />
                            <Button variant={ paused ? 'warning' : 'dark' } onClick={ () => setPaused(paused ? 0 : (lines[0]?.id || 1)) }>{ paused ? (waiting ? `Resume (${ waiting })` : 'Resume') : 'Pause' }</Button>
                            <Button variant="dark" onClick={ () => StaffFeedCard.clear() }>Clear</Button>
                        </Flex>
                        <Column gap={ 1 } overflow="auto" className="staff-feed-card-lines">
                            { !shown.length && <Text small className="admin-muted">{ lines.length ? 'No line matches.' : 'No feed lines yet. Switch the feed on in Staff Tools > Staff feed.' }</Text> }
                            { shown.map(line => <StaffFeedLineView key={ line.id } line={ line } />) }
                        </Column>
                        <Text small className="admin-muted">Live lines as they happen (the last 300 are kept). Older lines: History tab. How lines show (room chat, bubble, card only): Staff Tools &gt; Staff feed.</Text>
                    </> }
                { (tab === 1) && <StaffFeedHistoryView key={ focus.seq } initialTag={ focus.history ? focus.tag : '' } initialSearch={ focus.history ? focus.search : '' } /> }
            </NitroCardContentView>
        </NitroCardView>
    );
}
