import { ChatReplyComposer, GetChatReplyTarget, SetChatReplyTarget } from '../../../api/chat/ChatReactions';
import { AvatarExpressionEnum, GetTicker, HabboClubLevelEnum, RoomControllerLevel, RoomEngineObjectEvent, RoomObjectCategory, RoomRotatingEffect, RoomSessionChatEvent, RoomSettingsComposer, RoomShakingEffect, RoomZoomEvent, TextureUtils } from '@nitrots/nitro-renderer';
import { RegisterShopMessages, SHOP_SETTING_COMMANDS, ShopSettingComposer, ShopSpawnComposer } from '../../../api/shop/ShopProtocol';
import { useEffect, useState } from 'react';
import { ChatMessageTypeEnum, CreateLinkEvent, NotificationBubbleType, GetClubMemberLevel, GetConfiguration, GetRoomEngine, GetRoomSession, GetSessionDataManager, LocalizeText, RegisterMentionMessages, SendMentionByNameComposer, SendMessageComposer } from '../../../api';
import { useRoomEngineEvent, useRoomSessionManagerEvent } from '../../events';
import { useNotification } from '../../notification';
import { useObjectSelectedEvent } from '../engine';
import { useRoom } from '../useRoom';

const useChatInputWidgetState = () =>
{
    const [ selectedUsername, setSelectedUsername ] = useState('');
    const [ isTyping, setIsTyping ] = useState<boolean>(false);
    const [ typingStartedSent, setTypingStartedSent ] = useState(false);
    const [ isIdle, setIsIdle ] = useState(false);
    const [ floodBlocked, setFloodBlocked ] = useState(false);
    const [ floodBlockedSeconds, setFloodBlockedSeconds ] = useState(0);
    const { showConfirm = null, showFeedback = null } = useNotification();
    const { roomSession = null } = useRoom();

    const sendChat = (text: string, chatType: number, recipientName: string = '', styleId: number = 0) =>
    {
        if(text === '') return null;

        // hCMS Shop: play the equipped spawn animation for the room (the server checks the cooldown)
        if(text.trim().toLowerCase() === ':spawn')
        {
            RegisterShopMessages();
            SendMessageComposer(new ShopSpawnComposer(false));

            return null;
        }

        // hCMS Shop: :nospawn / :noentryspawn / :noaura flip a setting (the same command turns it back)
        const shopSetting = /^:([a-z]+)$/.exec(text.trim().toLowerCase());

        if(shopSetting && SHOP_SETTING_COMMANDS[shopSetting[1]])
        {
            RegisterShopMessages();
            SendMessageComposer(new ShopSettingComposer(SHOP_SETTING_COMMANDS[shopSetting[1]]));

            return null;
        }

        // "@name" or "@name message" is a mention: a short (optionally text-less) ping to a player anywhere in the hotel, shown as a card on their screen.
        if(text.charAt(0) === '@')
        {
            RegisterMentionMessages();

            const space = text.indexOf(' ');
            const name = ((space > 1) ? text.slice(1, space) : text.slice(1)).trim();
            const message = (space > 1) ? text.slice(space + 1).trim() : '';

            if(name.length) SendMessageComposer(new SendMentionByNameComposer(name, message));
            else showFeedback('Usage: @username message', 'error');

            return null;
        }

        // An embedded, non-leading "@name" (e.g. "hey @Phi") is a real mention/ping too, not just cosmetic
        // in-message coloring - fires regardless of whether normal room chat below also succeeds.
        const embeddedMention = /(^|\s)@([A-Za-z0-9_.-]{1,25})/.exec(text);

        // Room chat/commands need a real room - outside one (the landing view also mounts this input, for
        // mentions), this throws and is handled below instead of the roomSession calls silently failing with no
        // visible result. A plain `!roomSession` check isn't enough on its own: useRoom() is a use-between shared
        // hook that can hold a stale, already-left roomSession reference for a tick (see RoomView.tsx's own doc
        // comment on this exact race) - wrapping the whole block catches that stale-session throw too.
        let sentAsRoomChat = false;

        try
        {
            if(!roomSession) throw new Error('not in a room');

            sendRoomChat(text, chatType, recipientName, styleId);
            sentAsRoomChat = true;
        }
        catch(e)
        {
            sentAsRoomChat = false;
        }

        if(embeddedMention)
        {
            const name = embeddedMention[2];
            const message = (text.slice(0, embeddedMention.index) + text.slice(embeddedMention.index + embeddedMention[0].length)).trim();

            RegisterMentionMessages();
            SendMessageComposer(new SendMentionByNameComposer(name, message, sentAsRoomChat));
        }
        else if(!sentAsRoomChat)
        {
            showFeedback('You need to be in a room to chat - use @username message to send a mention instead.', 'not_found');
        }

        return null;
    }

    const sendRoomChat = (text: string, chatType: number, recipientName: string, styleId: number) =>
    {
        const parts = text.split(' ');

        if(parts.length > 0)
        {
            const firstPart = parts[0];
            let secondPart = '';

            if(parts.length > 1) secondPart = parts[1];

            if((firstPart.charAt(0) === ':') && (secondPart === 'x'))
            {
                const selectedAvatarId = GetRoomEngine().selectedAvatarId;

                if(selectedAvatarId > -1)
                {
                    const userData = roomSession.userDataManager.getUserDataByIndex(selectedAvatarId);

                    if(userData)
                    {
                        secondPart = userData.name;
                        text = text.replace(' x', (' ' + userData.name));
                    }
                }
            }

            switch(firstPart.toLowerCase())
            {
                case ':shake':
                    RoomShakingEffect.init(2500, 5000);
                    RoomShakingEffect.turnVisualizationOn();
                    
                    return null;

                case ':rotate':
                    RoomRotatingEffect.init(2500, 5000);
                    RoomRotatingEffect.turnVisualizationOn();
                    
                    return null;
                case ':d':
                case ';d':
                    if(GetClubMemberLevel() === HabboClubLevelEnum.VIP)
                    {
                        roomSession.sendExpressionMessage(AvatarExpressionEnum.LAUGH.ordinal);
                    }

                    break;
                case 'o/':
                case '_o/':
                    roomSession.sendExpressionMessage(AvatarExpressionEnum.WAVE.ordinal);

                    return null;
                case ':kiss':
                    if(GetClubMemberLevel() === HabboClubLevelEnum.VIP)
                    {
                        roomSession.sendExpressionMessage(AvatarExpressionEnum.BLOW.ordinal);

                        return null;
                    }

                    break;
                case ':jump':
                    if(GetClubMemberLevel() === HabboClubLevelEnum.VIP)
                    {
                        roomSession.sendExpressionMessage(AvatarExpressionEnum.JUMP.ordinal);

                        return null;
                    }

                    break;
                case ':idle':
                    roomSession.sendExpressionMessage(AvatarExpressionEnum.IDLE.ordinal);

                    return null;
                case '_b':
                    roomSession.sendExpressionMessage(AvatarExpressionEnum.RESPECT.ordinal);

                    return null;
                case ':commands':
                    CreateLinkEvent('cmdhelp/command');

                    return null;
                case ':help':
                    // The reference opens the list named by the second word, and the help center for anything else.
                    if([ 'command', 'commands', 'cmd', 'cmds' ].includes(secondPart.toLowerCase())) CreateLinkEvent('cmdhelp/command');
                    else if([ 'enable', 'enables', 'effect', 'effects' ].includes(secondPart.toLowerCase())) CreateLinkEvent('cmdhelp/enable');
                    else if([ 'hand', 'hands', 'handitem', 'handitems', 'item', 'items' ].includes(secondPart.toLowerCase())) CreateLinkEvent('cmdhelp/handitem');
                    else CreateLinkEvent('cmdhelp/help');

                    return null;
                case ':sign':
                    roomSession.sendSignMessage(parseInt(secondPart));

                    return null;
                case ':iddqd':
                case ':flip':
                    GetRoomEngine().events.dispatchEvent(new RoomZoomEvent(roomSession.roomId, -1, true));

                    return null;
                case ':zoom':
                    GetRoomEngine().events.dispatchEvent(new RoomZoomEvent(roomSession.roomId, parseFloat(secondPart), false));

                    return null;
                case ':screenshot':
                    const texture = GetRoomEngine().createTextureFromRoom(roomSession.roomId, 1);

                    const image = new Image();
                    
                    image.src = TextureUtils.generateImageUrl(texture);
                    
                    const newWindow = window.open('');
                    newWindow.document.write(image.outerHTML);
                    return null;
                case ':pickall':
                    if(roomSession.isRoomOwner || GetSessionDataManager().isModerator)
                    {
                        showConfirm(LocalizeText('room.confirm.pick_all'), () =>
                        {
                            GetSessionDataManager().sendSpecialCommandMessage(':pickall');
                        },
                        null, null, null, LocalizeText('generic.alert.title'));
                    }

                    return null;
                case ':ejectall':
                    if (roomSession.isRoomOwner || GetSessionDataManager().isModerator || roomSession.controllerLevel >= RoomControllerLevel.GUEST)
                    {
                        showConfirm(LocalizeText('room.confirm.eject_all'), () => 
                        {
                            GetSessionDataManager().sendSpecialCommandMessage(':ejectall');
                        },
                        null, null, null, LocalizeText('generic.alert.title'));
                    }
                    return null;
                case ':build':
                case ':buildmode':
                    if(roomSession.controllerLevel >= RoomControllerLevel.GUEST) CreateLinkEvent('build-mode/toggle/' + ((secondPart.toLowerCase() === 'reset') ? 'reset' : ''));

                    return null;
                case ':buildertool':
                case ':buildtool':
                    // Builder Toolbar (brush/fill/copy/paste), the one Room Info's "Furni brush" button opens
                    if(roomSession.controllerLevel >= RoomControllerLevel.GUEST) CreateLinkEvent('builder-toolbar/toggle');

                    return null;
                // :setz :forceact :forcerot (and their short names) are handled by the server (hcms-emulator-plugin BuildTools), so they
                // work without any client panel.
                case ':shop':
                case ':stylelab':
                case ':presence':
                    // Presence (hCMS Shop, own plugin)
                    CreateLinkEvent('shop/toggle');
                    return null;
                case ':furnieditor':
                case ':fe':
                    // hCMS Furni Editor (own plugin, admins only - the view and the server both check rank 7+)
                    CreateLinkEvent('furni-editor/toggle');
                    return null;
                case ':furni':
                    CreateLinkEvent('furni-chooser/');
                    return null;
                case ':chooser':
                    CreateLinkEvent('user-chooser/');
                    return null;
                case ':wired':
                    if(roomSession.isRoomOwner || GetSessionDataManager().isModerator || roomSession.controllerLevel >= RoomControllerLevel.GUEST)
                    {
                        CreateLinkEvent('wired-tools/toggle');
                    }

                    return null;
                case ':floor':
                case ':bcfloor':
                    if(roomSession.controllerLevel >= RoomControllerLevel.ROOM_OWNER) CreateLinkEvent('floor-editor/show');
                    
                    return null;
                case ':togglefps': {
                    if(GetTicker().maxFPS > 0) GetTicker().maxFPS = 0;
                    else GetTicker().maxFPS = GetConfiguration('system.animation.fps');

                    return null;
                }
                case ':client':
                case ':nitro':
                case ':billsonnn':
                    roomSession.sendChatMessage(':info', styleId);
                    return null;
                case ':settings':
                    if(roomSession.isRoomOwner || GetSessionDataManager().isModerator)
                    {
                        SendMessageComposer(new RoomSettingsComposer(roomSession.roomId));
                    }

                    return null;
            }
        }

        // replying to a chat line: the server gets which one right before the line itself (api/chat/ChatReactions)
        const replyTarget = GetChatReplyTarget();

        if(replyTarget && (chatType !== ChatMessageTypeEnum.CHAT_WHISPER))
        {
            SendMessageComposer(new ChatReplyComposer(replyTarget.id));
            SetChatReplyTarget(null);
            showFeedback(`Reply sent to ${ replyTarget.username }.`, 'reply');
        }

        switch(chatType)
        {
            case ChatMessageTypeEnum.CHAT_DEFAULT:
                roomSession.sendChatMessage(text, styleId);
                break;
            case ChatMessageTypeEnum.CHAT_SHOUT:
                roomSession.sendShoutMessage(text, styleId);
                break;
            case ChatMessageTypeEnum.CHAT_WHISPER:
                roomSession.sendWhisperMessage(recipientName, text, styleId);
                break;
        }
    }

    useRoomSessionManagerEvent<RoomSessionChatEvent>(RoomSessionChatEvent.FLOOD_EVENT, event =>
    {
        setFloodBlocked(true);
        setFloodBlockedSeconds(parseFloat(event.message));
    });

    useObjectSelectedEvent(event =>
    {
        if(event.category !== RoomObjectCategory.UNIT) return;

        const userData = roomSession.userDataManager.getUserDataByIndex(event.id);

        if(!userData) return;

        setSelectedUsername(userData.name);
    });

    useRoomEngineEvent<RoomEngineObjectEvent>(RoomEngineObjectEvent.DESELECTED, event => setSelectedUsername(''));

    useEffect(() =>
    {
        if(!floodBlocked) return;

        let seconds = 0;

        const interval = setInterval(() =>
        {
            setFloodBlockedSeconds(prevValue =>
            {
                seconds = ((prevValue || 0) - 1);

                return seconds;
            });

            if(seconds < 0)
            {
                clearInterval(interval);

                setFloodBlocked(false);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [ floodBlocked ]);

    useEffect(() =>
    {
        if(!isIdle) return;

        let timeout: ReturnType<typeof setTimeout> = null;

        if(isIdle)
        {
            timeout = setTimeout(() =>
            {
                setIsIdle(false);
                setIsTyping(false)
            }, 10000);
        }

        return () => clearTimeout(timeout);
    }, [ isIdle ]);

    useEffect(() =>
    {
        if(!roomSession) return;

        if(isTyping)
        {
            if(!typingStartedSent)
            {
                setTypingStartedSent(true);

                roomSession.sendChatTypingMessage(isTyping);
            }
        }
        else
        {
            if(typingStartedSent)
            {
                setTypingStartedSent(false);

                roomSession.sendChatTypingMessage(isTyping);
            }
        }
    }, [ roomSession, isTyping, typingStartedSent ]);

    return { selectedUsername, floodBlocked, floodBlockedSeconds, setIsTyping, setIsIdle, sendChat };
}

export const useChatInputWidget = useChatInputWidgetState;
