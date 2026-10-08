import { FC, Fragment, useEffect, useRef, useState } from 'react';
import { SendMessageComposer } from '../../../../api';
import { IStaffFeedHistoryRow, StaffFeedHistorySearchComposer, StaffFeedHistorySearchEvent } from '../../../../api/stafffeed/StaffFeedProtocol';
import { Button, Column, Flex, Text } from '../../../../common';
import { useMessageEvent } from '../../../../hooks';
import { StaffFeedDay, StaffFeedLineView } from './StaffFeedLineView';

// Staff feed card > History: the whole staff feed log (hcms_staff_feed_log) on the server, newest first, 60 lines a
// page, filtered by tag and text (a name, a room, a command) on the server so the search covers everything, not only
// what the card has kept. Grouped by day; "Load older" pages back. Other staff members' [WATCH] lines never show.

export const StaffFeedHistoryView: FC<{ initialTag?: string, initialSearch?: string }> = props =>
{
    const [ tags, setTags ] = useState<{ tag: string, label: string }[]>([]);
    const [ tag, setTag ] = useState(props.initialTag ?? '');
    const [ search, setSearch ] = useState(props.initialSearch ?? '');
    const [ rows, setRows ] = useState<IStaffFeedHistoryRow[]>([]);
    const [ more, setMore ] = useState(false);
    const [ loading, setLoading ] = useState(true);
    const query = useRef({ tag: '', search: '' });

    useMessageEvent<StaffFeedHistorySearchEvent>(StaffFeedHistorySearchEvent, event =>
    {
        const parser = event.getParser();

        setTags(parser.tags);
        setRows(prev => (parser.beforeId > 0) ? [ ...prev, ...parser.rows ] : parser.rows);
        setMore(parser.more);
        setLoading(false);
    });

    // a new tag or search asks again from the newest line (typing waits a moment)
    useEffect(() =>
    {
        const timer = setTimeout(() =>
        {
            query.current = { tag, search: search.trim() };
            setLoading(true);
            SendMessageComposer(new StaffFeedHistorySearchComposer(tag, search.trim(), 0));
        }, search ? 350 : 0);

        return () => clearTimeout(timer);
    }, [ tag, search ]);

    const loadOlder = () =>
    {
        if(!rows.length || loading) return;

        setLoading(true);
        SendMessageComposer(new StaffFeedHistorySearchComposer(query.current.tag, query.current.search, rows[rows.length - 1].logId));
    }

    return (
        <>
            <Flex gap={ 1 } shrink>
                <select className="form-select form-select-sm staff-feed-card-tag" value={ tag } onChange={ event => setTag(event.target.value) }>
                    <option value="">All tags</option>
                    { tags.map(entry => <option key={ entry.tag } value={ entry.tag }>{ entry.label }</option>) }
                </select>
                <input className="form-control form-control-sm" placeholder="Search the whole log: name, room, command..." maxLength={ 60 } value={ search } onChange={ event => setSearch(event.target.value) } />
            </Flex>
            <Column gap={ 1 } overflow="auto" className="staff-feed-card-lines">
                { !rows.length && <Text small className="admin-muted">{ loading ? 'Loading...' : 'Nothing found in the staff feed log.' }</Text> }
                { rows.map((row, index) =>
                {
                    const day = StaffFeedDay(row.time);
                    const newDay = (index === 0) || (StaffFeedDay(rows[index - 1].time) !== day);

                    return (
                        <Fragment key={ row.logId }>
                            { newDay && <Text small bold className="staff-feed-card-day">{ day }</Text> }
                            <StaffFeedLineView line={ row } />
                        </Fragment>
                    );
                }) }
                { more && <Button variant="dark" onClick={ loadOlder }>{ loading ? 'Loading...' : 'Load older' }</Button> }
                { !more && !!rows.length && <Text small className="admin-muted">That's the start of the log.</Text> }
            </Column>
        </>
    );
}
