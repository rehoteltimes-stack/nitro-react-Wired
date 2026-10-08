import { IMessageComposer, IMessageDataWrapper, IMessageParser, MessageEvent } from '@nitrots/nitro-renderer';
import { GetConnection } from '../nitro';

// Chat reactions, replies and chat ids (like MetroHotel's chat bubbles); server side: hcms-emulator-plugin
// chatreact/ChatReactions.java. Before a talk / shout line the room gets its id (9618) and the next bubble of that unit
// takes it; reactions go out as 9616 and come back to the whole room as 9619; a reply is announced with 9617 right
// before the chat line.

const IncomingHeaders = { CHAT_META: 9618, CHAT_REACTION: 9619 };
const OutgoingHeaders = { CHAT_REACT: 9616, CHAT_REPLY: 9617 };

export const CHAT_REACTIONS = [ 'smile', 'like', 'heart', 'angry' ];

let registered = false;

export const RegisterChatReactionMessages = () =>
{
    if(registered) return;

    const connection = GetConnection();

    if(!connection) return;

    connection.registerMessages({
        events: new Map<number, Function>([
            [ IncomingHeaders.CHAT_META, ChatMetaEvent ],
            [ IncomingHeaders.CHAT_REACTION, ChatReactionEvent ]
        ]),
        composers: new Map<number, Function>([
            [ OutgoingHeaders.CHAT_REACT, ChatReactComposer ],
            [ OutgoingHeaders.CHAT_REPLY, ChatReplyComposer ]
        ])
    });

    registered = true;
}

export class ChatReactComposer implements IMessageComposer<[ number, string ]>
{
    private _data: [ number, string ];

    constructor(chatId: number, reaction: string)
    {
        this._data = [ chatId, reaction ];
    }

    public getMessageArray() { return this._data; }

    public dispose(): void { return; }
}

export class ChatReplyComposer implements IMessageComposer<[ number ]>
{
    private _data: [ number ];

    constructor(chatId: number)
    {
        this._data = [ chatId ];
    }

    public getMessageArray() { return this._data; }

    public dispose(): void { return; }
}

export interface IChatReply { id: number, username: string, text: string }

export class ChatMetaParser implements IMessageParser
{
    public unitIndex = -1;
    public chatId = 0;
    public reply: IChatReply = null;

    public flush(): boolean
    {
        this.unitIndex = -1;
        this.chatId = 0;
        this.reply = null;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this.unitIndex = wrapper.readInt();
        this.chatId = wrapper.readInt();

        const replyId = wrapper.readInt();
        const username = wrapper.readString();
        const text = wrapper.readString();

        this.reply = (replyId > 0) ? { id: replyId, username, text } : null;

        return true;
    }
}

export class ChatMetaEvent extends MessageEvent
{
    constructor(callBack: Function) { super(callBack, ChatMetaParser); }

    public getParser(): ChatMetaParser { return this.parser as ChatMetaParser; }
}

export class ChatReactionParser implements IMessageParser
{
    public chatId = 0;
    public userId = 0;
    public reaction = '';
    public on = false;

    public flush(): boolean
    {
        this.chatId = 0;
        this.userId = 0;
        this.reaction = '';
        this.on = false;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this.chatId = wrapper.readInt();
        this.userId = wrapper.readInt();
        this.reaction = wrapper.readString();
        this.on = wrapper.readBoolean();

        return true;
    }
}

export class ChatReactionEvent extends MessageEvent
{
    constructor(callBack: Function) { super(callBack, ChatReactionParser); }

    public getParser(): ChatReactionParser { return this.parser as ChatReactionParser; }
}

// ---- shared state ----

type Listener = () => void;

const listeners = new Set<Listener>();
const notify = () => listeners.forEach(listener => listener());

export const SubscribeChatReactions = (listener: Listener) =>
{
    listeners.add(listener);

    return () => { listeners.delete(listener); };
}

/** unit index -> the id the server gave that unit's next line (only kept for 3 seconds) */
const pendingMeta = new Map<number, { chatId: number, reply: IChatReply, time: number }>();

export const SetPendingChatMeta = (unitIndex: number, chatId: number, reply: IChatReply) => pendingMeta.set(unitIndex, { chatId, reply, time: Date.now() });

export const TakePendingChatMeta = (unitIndex: number) =>
{
    const meta = pendingMeta.get(unitIndex);

    pendingMeta.delete(unitIndex);

    return (meta && ((Date.now() - meta.time) < 3000)) ? meta : null;
}

/** chat id -> reaction -> user ids */
const reactions = new Map<number, Map<string, Set<number>>>();

export const ApplyChatReaction = (chatId: number, userId: number, reaction: string, on: boolean) =>
{
    let byReaction = reactions.get(chatId);

    if(!byReaction) reactions.set(chatId, (byReaction = new Map()));

    let users = byReaction.get(reaction);

    if(!users) byReaction.set(reaction, (users = new Set()));

    if(on) users.add(userId);
    else users.delete(userId);

    // keep the last 500 chat lines only
    if(reactions.size > 500) reactions.delete(reactions.keys().next().value);

    notify();
}

export const GetChatReactionCount = (chatId: number, reaction: string) => reactions.get(chatId)?.get(reaction)?.size || 0;

export const HasOwnChatReaction = (chatId: number, reaction: string, userId: number) => !!reactions.get(chatId)?.get(reaction)?.has(userId);

/** the line the player is replying to (shown above the chat input, sent before the next chat line) */
let replyTarget: IChatReply = null;

export const GetChatReplyTarget = () => replyTarget;

export const SetChatReplyTarget = (target: IChatReply) =>
{
    replyTarget = target;
    notify();
}
