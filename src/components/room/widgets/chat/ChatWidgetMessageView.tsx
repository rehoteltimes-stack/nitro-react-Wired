import { RoomChatSettings, RoomObjectCategory, RoomUnitClickAvatarComposer } from '@nitrots/nitro-renderer';
import { FC, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { ChatBubbleMessage, CreateLinkEvent, GetConfiguration, GetCurrencyIconUrl, GetRoomEngine, GetRoomSession, GetSeasonCurrencyColor, GetSeasonCurrencyName, GetSessionDataManager, SEASON_CURRENCY_TYPE, SendMessageComposer } from '../../../../api';
import { CHAT_REACTIONS, ChatReactComposer, GetChatReactionCount, HasOwnChatReaction, SetChatReplyTarget, SubscribeChatReactions } from '../../../../api/chat/ChatReactions';
import { useNotification, useUserIdentity } from '../../../../hooks';
import { ChatMessageTextView } from './ChatMessageTextView';
import { StaffFeedCard } from '../../../../api/stafffeed/StaffFeedCardStore';
import { StaffFeedSubject, StaffFeedTagKey } from '../../../../api/stafffeed/StaffFeedSubject';
import { MOD_TOOLS_LEVEL, StaffFeedActionsView } from '../../../mod-tools/ModToolsStaffViews';
import { useChunkLevel } from '../../../protected/LoadProtected';
import { ShopStyledName } from '../../../shop/ShopStyledName';

const toCssColor = (color: number) => `#${ color.toString(16).padStart(6, '0') }`;

const WHITE_TEXT_BUBBLES = new Set([ 2, 8, 10, 14, 15, 24, 25, 27, 31 ]);
const SHOW_MESSAGE_BUBBLES = new Set([ 34, 200, 201, 202, 210, 211, 212, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 250, 251, 252 ]);
const HIDDEN_USERNAME_BUBBLES = new Set([ 1, ...SHOW_MESSAGE_BUBBLES ]);

const WIRED_MARKUP_COLORS = new Map([ [ 'green', '#008000' ], [ 'cyan', '#008b8b' ], [ 'red', '#d60000' ], [ 'blue', '#005dff' ], [ 'purple', '#7d31b8' ] ]);
const WIRED_MARKUP = /\[(\/?)(b|i|u|green|cyan|red|blue|purple)\]/g;

const wiredMarkupClose = (tag: string) => (WIRED_MARKUP_COLORS.has(tag) ? '</span>' : `</${ tag }>`);

export const EscapeChatHtml = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const IsWiredBubble = (styleId: number) => ((styleId >= 200) && (styleId < 260));

export const WiredMarkupHtml = (html: string) =>
{
    const open: string[] = [];

    let result = html.replace(WIRED_MARKUP, (all: string, slash: string, tag: string) =>
    {
        if(!slash)
        {
            open.push(tag);

            return WIRED_MARKUP_COLORS.has(tag) ? `<span style="color:${ WIRED_MARKUP_COLORS.get(tag) }">` : `<${ tag }>`;
        }

        const index = open.lastIndexOf(tag);

        if(index === -1) return all;

        let closing = '';

        while(open.length > index) closing += wiredMarkupClose(open.pop());

        return closing;
    });

    while(open.length) result += wiredMarkupClose(open.pop());

    return result;
};

export const SystemLineHtml = (styleId: number, text: string, html: string) =>
{
    if(styleId === STAFF_FEED_BUBBLE) return staffFeedHtml(text, html);

    if(IsWiredBubble(styleId)) return WiredMarkupHtml(staffFeedHtml(text, html));

    return html;
};

// Staff feed lines (hcms-emulator-plugin stafffeed.StaffFeed): bubble 34 over the staff member's own avatar, starting
// with a [TAG]. Players can't chat in bubble 34 (commands.cmd_chatcolor.banned_numbers), so only the feed uses it.
const STAFF_FEED_BUBBLE = 34;
export const STAFF_FEED_TAG_COLORS: Record<string, string> = {
    'NEW USER': '#1e9e4a',
    'MODERATION': '#d62828',
    'WORDFILTER': '#d97706',
    'REPORT': '#c2185b',
    'STAFF': '#2f5fd0',
    'COMMAND': '#0e7490',
    'SECURITY': '#7c1fd6',
    'WATCH': '#e11d48',
    'ECONOMY': '#a16207',
    'ALERT': '#b91c1c',
    'COMMANDS': '#475569'
};

export const StaffToolsIconUrl = (name: string) => (GetConfiguration<string>('staff-tools.icon.url', '') || '').replace('%name%', name);

const STAFF_FEED_ALERTS = /(without permission|a new IP for this account!|logged in from the IP of banned|is online on the same IP as|message hidden|muted \d+s)/g;

const GAME_TAGS: Record<string, string> = {
    'LOTTO': '#c27c0e',
    'RW': '#0284c7',
    'SPAWN': '#ea580c',
    'SWAP': '#0f766e',
    'RANCH': '#65a30d',
    'CASINO': '#be123c',
    'BETA': '#f5c25c'
};

const GAME_TAG_TEXT: Record<string, string> = {
    'BETA': '#2a2a2a'
};

const GAME_CURRENCIES: Record<string, number> = { 'Duckets': 0, 'Diamonds': 5, 'Emeralds': 101 };
const GAME_CURRENCY_COLORS: Record<string, string> = { 'Duckets': '#a855f7', 'Diamonds': '#1d9bd7', 'Emeralds': '#1e9e4a' };

const gameLineHtml = (tag: string, rest: string) =>
{
    const color = GAME_TAGS[tag];
    const seasonName = GetSeasonCurrencyName();
    const currencies: Record<string, number> = { ...GAME_CURRENCIES, [ seasonName ]: SEASON_CURRENCY_TYPE };
    const colors: Record<string, string> = { ...GAME_CURRENCY_COLORS, [ seasonName ]: GetSeasonCurrencyColor() };
    const names = Object.keys(currencies).map(name => name.replace(/[^A-Za-z0-9 ]/g, '')).join('|');

    rest = rest
        .replace(/(^|\s)(:[a-z0-9_]+)/gi, '$1<b style="color:#b45309">$2</b>')
        .replace(/\b([A-Z]{3,24})\b/g, `<b style="color:${ color };letter-spacing:1px">$1</b>`)
        .replace(new RegExp(`([+]?\\d+) (${ names })\\b`, 'g'), (all, amount: string, name: string) =>
        {
            const iconUrl = GetCurrencyIconUrl(currencies[name]);

            if(!iconUrl) return `<b style="color:${ colors[name] }">${ amount } ${ name }</b>`;

            return `<b style="color:${ colors[name] }">${ amount }</b><img src="${ iconUrl }" alt="${ name }" title="${ name }" style="height:15px;width:auto;vertical-align:-3px;margin-left:2px;image-rendering:pixelated">`;
        })
        .replace(/^ ([^\s:]+) (solved it)/, ' <b>$1</b> $2')
        .replace(/(Winners?: )([^.<]+)/, '$1<b>$2</b>')
        .replace(/(You won the lotto|is not it|Nobody got it)/g, '<b>$1</b>');

    return `<span style="background:${ color };color:${ GAME_TAG_TEXT[tag] ?? '#fff' };border-radius:3px;padding:0 4px;font-weight:700;font-size:inherit;line-height:inherit">${ tag }</span><span style="word-break:normal;overflow-wrap:anywhere">${ rest }</span>`;
}

/** The line's HTML (already escaped by RoomChatFormatter) with the tag as a coloured label and the parts styled. */
export const staffFeedHtml = (text: string, html: string) =>
{
    const gameMatch = /^\[([A-Z ]+)\]/.exec(text || '');

    if(gameMatch && GAME_TAGS[gameMatch[1]] && html.startsWith(gameMatch[0])) return gameLineHtml(gameMatch[1], html.slice(gameMatch[0].length));

    const match = /^\[([A-Z ]+)\]/.exec(text || '');
    const color = match ? STAFF_FEED_TAG_COLORS[match[1]] : null;

    if(!color || !html.startsWith(match[0])) return html;

    let rest = html.slice(match[0].length);

    rest = rest
        // the player the line is about: the first name after the tag (not for "Staff login:" lines)
        .replace(/^ (?!Staff login:)([^\s:]+)(?=[\s:])/, ' <b>$1</b>')
        .replace(/^ Staff login: ([^\s(]+)/, ' Staff login: <b>$1</b>')
        // "room name"
        .replace(/"([^"]{1,60})"/g, '<b><i>"$1"</i></b>')
        // :command (after the quotes rule: it adds a style="...")
        .replace(/(^|\s)(:[a-z0-9_]+)/gi, '$1<b style="color:#b45309">$2</b>')
        // (#123) / #123
        .replace(/\(#(\d+)\)/g, '<span style="opacity:.6">(#$1)</span>')
        // IP addresses
        .replace(/\b(\d{1,3}(?:\.\d{1,3}){3})\b/g, '<span style="font-family:monospace;font-weight:700">$1</span>')
        // the parts staff should notice
        .replace(STAFF_FEED_ALERTS, '<b style="color:#d62828">$1</b>');

    return `<span style="background:${ color };color:#fff;border-radius:3px;padding:0 3px;font-weight:700;font-size:inherit;line-height:inherit">${ match[1] }</span>${ rest }`;
}

interface ChatWidgetMessageViewProps
{
    chat: ChatBubbleMessage;
    makeRoom: (chat: ChatBubbleMessage) => void;
    bubbleWidth?: number;
}

export const ChatWidgetMessageView: FC<ChatWidgetMessageViewProps> = props =>
{
    const chunkLevel = useChunkLevel();
    const { chat = null, makeRoom = null, bubbleWidth = RoomChatSettings.CHAT_BUBBLE_WIDTH_NORMAL } = props;
    const [ isVisible, setIsVisible ] = useState(false);
    const [ isReady, setIsReady ] = useState<boolean>(false);
    const [ , setReactionsVersion ] = useState(0);
    const [ showTime, setShowTime ] = useState(false);
    const [ now, setNow ] = useState(Date.now());
    const { showFeedback = null } = useNotification();
    const elementRef = useRef<HTMLDivElement>();

    const getBubbleWidth = useMemo(() =>
    {
        switch(bubbleWidth)
        {
            case RoomChatSettings.CHAT_BUBBLE_WIDTH_NORMAL:
                return 350;
            case RoomChatSettings.CHAT_BUBBLE_WIDTH_THIN:
                return 230;
            case RoomChatSettings.CHAT_BUBBLE_WIDTH_WIDE:
                return 900;
        }
    }, [ bubbleWidth ]);
    const bubbleStyle = chat.bubbleWidth
        ? { width: chat.bubbleWidth, maxWidth: chat.bubbleWidth }
        : { maxWidth: getBubbleWidth };
    const bubbleTextColor = (chat.styleId === 26) ? 0xC59432 : (WHITE_TEXT_BUBBLES.has(chat.styleId) ? 0xFFFFFF : 0x000000);
    const messageColor = ((chat.type === 1) && (bubbleTextColor === 0x000000)) ? 0x595959 : bubbleTextColor;
    const username = HIDDEN_USERNAME_BUBBLES.has(chat.styleId) ? '' : chat.username;
    const senderWebId = GetRoomSession()?.userDataManager.getUserDataByIndex(chat.senderId)?.webID ?? 0;
    const identity = useUserIdentity(senderWebId);
    // The name takes the colour of the player's rank (or gold for a VIP); the gif of the profile style cannot be drawn inside plain bubble text.
    const nameColor = identity.staffColor ? parseInt(identity.staffColor.slice(1), 16) : (identity.isVip ? 0xF1C40F : bubbleTextColor);
    const isShowMessage = SHOW_MESSAGE_BUBBLES.has(chat.styleId);

    useEffect(() =>
    {
        setIsVisible(false);
        
        const element = elementRef.current;

        if(!element) return;

        const width = element.offsetWidth;
        const height = element.offsetHeight;

        chat.width = width;
        chat.height = height;
        chat.elementRef = element;
        
        let left = chat.left;
        let top = chat.top;

        if(!left && !top)
        {
            left = (chat.location.x - (width / 2));
            top = (element.parentElement.offsetHeight - height);
            
            chat.left = left;
            chat.top = top;
        }

        setIsReady(true);

        return () =>
        {
            chat.elementRef = null;

            setIsReady(false);
        }
    }, [ chat ]);

    // reactions of this line (redraw when any reaction arrives)
    useEffect(() =>
    {
        if(!chat.stableId) return;

        return SubscribeChatReactions(() => setReactionsVersion(value => value + 1));
    }, [ chat ]);

    // "Sent N seconds ago" while the message is hovered
    useEffect(() =>
    {
        if(!showTime) return;

        setNow(Date.now());

        const interval = setInterval(() => setNow(Date.now()), 1000);

        return () => clearInterval(interval);
    }, [ showTime ]);

    const ownUserId = GetSessionDataManager().userId;
    // a staff feed line: hovering it shows the actions for the player it is about (StaffFeedActionsView)
    const feedSubject = (chat.styleId === STAFF_FEED_BUBBLE) ? StaffFeedSubject(chat.text) : null;
    const secondsAgo = Math.max(0, Math.floor((now - chat.receivedAt) / 1000));

    const react = (event: React.MouseEvent, reaction: string) =>
    {
        event.stopPropagation();
        SendMessageComposer(new ChatReactComposer(chat.stableId, reaction));
    }

    const reply = (event: React.MouseEvent) =>
    {
        event.stopPropagation();
        SetChatReplyTarget({ id: chat.stableId, username: chat.username, text: chat.text });

        const quote = (chat.text.length > 40) ? (chat.text.slice(0, 39) + '…') : chat.text;

        showFeedback?.(`Replying to ${ chat.username }: "${ quote }". Type your message, or press Esc / × to cancel.`, 'reply');
    }

    useEffect(() =>
    {
        if(!isReady || !chat || isVisible) return;
        
        if(makeRoom) makeRoom(chat);

        setIsVisible(true);
    }, [ chat, isReady, isVisible, makeRoom ]);

    return (
        <div
            ref={ elementRef }
            className={ `bubble-container ${ isVisible ? 'visible' : 'invisible' }` }
            onClick={ event =>
            {
                // a staff feed line is over your own avatar: clicking it doesn't select yourself
                if(chat.styleId === STAFF_FEED_BUBBLE)
                {
                    if(chunkLevel < MOD_TOOLS_LEVEL) return;

                    const tagKey = StaffFeedTagKey(chat.text);

                    if(tagKey === 'alert') CreateLinkEvent('mod-tools/incidents');
                    else StaffFeedCard.focusOn(tagKey, feedSubject ?? '');

                    return;
                }

                GetRoomEngine().selectRoomObject(chat.roomId, chat.senderId, RoomObjectCategory.UNIT);

                // selectRoomObject() alone only selects the object - a real in-room click on an avatar also sends
                // this (RoomObjectEventHandler's own mouse-click handling), which is what the server's packet 108
                // reply (WiredClickUserReceivedEvent) needs before useAvatarInfoWidget flushes the pending info
                // into view. See ToolbarMeView.tsx for the same pattern on its own programmatic selection.
                SendMessageComposer(new RoomUnitClickAvatarComposer(chat.senderId));
            } }>
            { (chat.styleId === 0) &&
                <div className="user-container-bg" style={ { backgroundColor: chat.color } } /> }
            <div className={ `chat-bubble bubble-${ chat.styleId } type-${ chat.type }` } style={ bubbleStyle }>
                <div className="user-container">
                    { chat.imageUrl && (chat.imageUrl.length > 0) &&
                        <div className="user-image" style={ { backgroundImage: `url(${ chat.imageUrl })` } } /> }
                </div>
                <div className="chat-content" style={ { textAlign: chat.textAlign ?? undefined } } onMouseEnter={ () => setShowTime(true) } onMouseLeave={ () => setShowTime(false) }>
                    { chat.reply &&
                        <div className="chat-reply-reference">
                            <span className="chat-reply-reference__icon">↩</span>
                            <span><b>{ chat.reply.username }</b> { chat.reply.text }</span>
                        </div> }
                    { isShowMessage
                        ? <span className="message" dangerouslySetInnerHTML={ { __html: SystemLineHtml(chat.styleId, chat.text, chat.formattedText) } } />
                        : <>
                            { username &&
                                <b className="username mr-1">
                                    { (senderWebId > 0)
                                        ? <ShopStyledName userId={ senderWebId } name={ username } baseStyle={ { color: toCssColor(nameColor) } } plainStyle={ { color: toCssColor(bubbleTextColor) } } />
                                        : <span style={ { color: toCssColor(nameColor) } }>{ username }</span> }:{ ' ' }
                                </b> }
                            <ChatMessageTextView text={ chat.text } color={ toCssColor(messageColor) } />
                        </> }
                    { showTime && (chat.stableId > 0) &&
                        <span className="message-time">Sent { secondsAgo } second{ (secondsAgo === 1) ? '' : 's' } ago</span> }
                </div>
                <div className="pointer" />
                { /* the same line sent again straight after: a count badge like the reaction counts (MetroHotel repeats) */ }
                { (chat.repeatCount > 1) && <span className="chat-repeat-count" title={ `Sent ${ chat.repeatCount } times` }>x{ chat.repeatCount }</span> }
                { feedSubject && (chunkLevel >= MOD_TOOLS_LEVEL) && <Suspense fallback={ null }><StaffFeedActionsView name={ feedSubject } /></Suspense> }
                { (chat.stableId > 0) &&
                    <div className="reactions-box">
                        <button type="button" className="reaction-button chat-reply-button" title="Reply" onClick={ reply }>↩</button>
                        { CHAT_REACTIONS.map(reaction =>
                        {
                            const count = GetChatReactionCount(chat.stableId, reaction);

                            return (
                                <button key={ reaction } type="button" className={ `reaction-button ${ (count > 0) ? 'active' : '' } ${ HasOwnChatReaction(chat.stableId, reaction, ownUserId) ? 'is-mine' : '' }` } onClick={ event => react(event, reaction) }>
                                    <div className={ `reactbtn ${ reaction }` } />
                                    { (count > 0) && <span className="reaction-count">{ count }</span> }
                                </button>
                            );
                        }) }
                    </div> }
            </div>
        </div>
    );
}
