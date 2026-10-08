import { FC } from 'react';
import { CreateLinkEvent } from '../../../../api';
import { IStaffFeedLine } from '../../../../api/stafffeed/StaffFeedProtocol';
import { Flex, Text } from '../../../../common';
import { EscapeChatHtml, staffFeedHtml } from '../../../room/widgets/chat/ChatWidgetMessageView';
import { StaffFeedSubject } from '../../../../api/stafffeed/StaffFeedSubject';
import { StaffFeedActionsView } from '../../../room/widgets/chat/StaffFeedActionsView';

// One staff feed line in the Staff feed card (Live and History tabs): time, the line styled exactly like the chat line
// (coloured tag, bold name, :command, room), and on hover the chat line's Info / Go to / Flag / Commands buttons.


const clock = (at: number) =>
{
    const date = new Date(at * 1000);

    return `${ String(date.getHours()).padStart(2, '0') }:${ String(date.getMinutes()).padStart(2, '0') }`;
}

/** "Today", "Yesterday" or "Tue 29 Sep" for the day headers. */
export const StaffFeedDay = (at: number) =>
{
    const date = new Date(at * 1000);
    const today = new Date();
    const yesterday = new Date(today.getTime() - 86400000);

    if(date.toDateString() === today.toDateString()) return 'Today';
    if(date.toDateString() === yesterday.toDateString()) return 'Yesterday';

    return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: (date.getFullYear() !== today.getFullYear()) ? 'numeric' : undefined });
}

export const StaffFeedLineView: FC<{ line: IStaffFeedLine }> = props =>
{
    const { line } = props;
    const text = `[${ line.label }] ${ line.text }`;
    const subject = StaffFeedSubject(text);

    return (
        <Flex gap={ 2 } className={ 'staff-feed-card-line' + (line.link ? ' has-link' : '') } onClick={ () => line.link && CreateLinkEvent(line.link) }>
            <Text small className="admin-muted staff-feed-card-time">{ clock(line.time) }</Text>
            <span className="staff-feed-card-text" dangerouslySetInnerHTML={ { __html: staffFeedHtml(text, EscapeChatHtml(text)) } } />
            { subject && <StaffFeedActionsView name={ subject } /> }
        </Flex>
    );
}
