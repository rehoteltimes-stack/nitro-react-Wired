import { FC, Fragment } from 'react';
import { GetRoomSession, GetUsernameStyle, GetUserProfile } from '../../../../api';
import { useUserIdentity, useUserIdentityByName } from '../../../../hooks';

interface ChatMessageTextViewProps
{
    text: string;
    color: string;
}

const MENTION_PATTERN = /(^|\s)@([A-Za-z0-9_.-]{1,25})/g;

// One "@name" token inside a chat message, coloured in that player's own rank colour (or gold for VIP) the same
// way the sender's own name already is. Tries the current room's own user list first (fast, no round trip); if
// the mentioned player isn't a co-occupant (a different room, offline, the landing view), falls back to the same
// hotel-wide identity lookup the profile card uses, keyed by name instead of id - so the colour and click-to-
// profile work for any real username, not just someone standing in the same room right now.
const MentionSpan: FC<{ name: string }> = props =>
{
    const { name } = props;
    const roomWebId = GetRoomSession()?.userDataManager.getUserDataByName(name)?.webID ?? 0;
    const roomIdentity = useUserIdentity(roomWebId);
    const byName = useUserIdentityByName(roomWebId ? '' : name);
    const webId = roomWebId || byName.webId;
    const identity = roomWebId ? roomIdentity : byName.identity;
    const style = webId ? GetUsernameStyle(identity) : undefined;

    // .chat-mention is HabboCity's own real class for this (verbatim in the ported stylesheet: a dark pill badge,
    // blue on hover) - confirmed real CSS, even though no live trigger for it was ever caught in their bundle.
    // The colour on top of it is this project's own addition, not something confirmed in their source.
    // Click-to-profile is on the mentioned name, not the sender's own name - the sender's own bubble click already
    // opens their menu/infostand via the bubble's own selectRoomObject handler.
    return (
        <span
            className="chat-mention"
            style={ webId ? { ...style, cursor: 'pointer' } : style }
            onClick={ webId ? (event => { event.stopPropagation(); GetUserProfile(webId); }) : undefined }>
            @{ name }
        </span>
    );
}

// Splits the message on "@name" tokens so each one can be coloured on its own; matches this project's own username
// pattern (letters/digits/._-), not a guess - the same pattern the mentions feature already validates a name against.
export const ChatMessageTextView: FC<ChatMessageTextViewProps> = props =>
{
    const { text, color } = props;
    const parts: (string | { name: string })[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray;

    MENTION_PATTERN.lastIndex = 0;

    while((match = MENTION_PATTERN.exec(text)))
    {
        parts.push(text.slice(lastIndex, match.index + match[1].length));
        parts.push({ name: match[2] });
        lastIndex = match.index + match[0].length;
    }

    parts.push(text.slice(lastIndex));

    return (
        <span className="message" style={ { color } }>
            { parts.map((part, index) => <Fragment key={ index }>{ (typeof part === 'string') ? part : <MentionSpan name={ part.name } /> }</Fragment>) }
        </span>
    );
}
