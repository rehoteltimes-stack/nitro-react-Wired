import { FollowFriendMessageComposer } from '@nitrots/nitro-renderer';
import { FC, useEffect, useRef, useState } from 'react';
import { FaExclamationCircle, FaSignInAlt, FaTimes } from 'react-icons/fa';
import { GetUsernameStyle, GetUserProfile, SendMessageComposer, SendMentionComposer } from '../../api';
import { Button, Column, Flex, ScrollContainer, Text } from '../../common';
import { ShopStyledName } from '../shop/ShopStyledName';

// HabboCity's mention cards (their "cM" card and "uM" list, on the left side above the event alert): each card shows who sent it, how long
// ago, the text, a follow button and a reply box (Enter sends). The list is kept in the client; "Close all" keeps only what just arrived.
export interface IMention
{
    id: number;
    senderId: number;
    senderName: string;
    message: string;
    staffColor: string;
    staffBackground: string;
    isVip: boolean;
    timestamp: number;
}

const KEEP_ON_CLOSE_ALL_MS = 1000;

const timeAgo = (since: number): string =>
{
    const seconds = Math.max(0, Math.floor((Date.now() - since) / 1000));

    if(seconds < 60) return 'Just now';

    const minutes = Math.floor(seconds / 60);

    if(minutes < 60) return `${ minutes } minute${ (minutes === 1) ? '' : 's' } ago`;

    const hours = Math.floor(minutes / 60);

    return `${ hours } hour${ (hours === 1) ? '' : 's' } ago`;
}

const MentionCardView: FC<{ mention: IMention, onClose: () => void }> = props =>
{
    const { mention = null, onClose = null } = props;
    const [ reply, setReply ] = useState('');
    const [ , setTick ] = useState(0);
    const area = useRef<HTMLTextAreaElement>(null);

    useEffect(() =>
    {
        const interval = setInterval(() => setTick(value => value + 1), 10000);

        return () => clearInterval(interval);
    }, []);

    // The box grows with its text, like the reference's.
    useEffect(() =>
    {
        const element = area.current;

        if(!element) return;

        element.style.height = 'auto';
        element.style.height = element.scrollHeight + 'px';
    }, [ reply ]);

    // The same message the friend list's "follow" sends.
    const follow = () => SendMessageComposer(new FollowFriendMessageComposer(mention.senderId));

    return (
        <Column className="mention-item">
            <Flex justifyContent="between" alignItems="center">
                <Flex gap={ 1 } alignItems="center">
                    <FaExclamationCircle className="fa-icon exclamation" />
                    <Column gap={ 0 }>
                        <Flex justifyContent="start" alignItems="center" gap={ 1 }>
                            <Text bold>From</Text>
                            <Text bold underline select="text" onClick={ () => GetUserProfile(mention.senderId) }><ShopStyledName userId={ mention.senderId } name={ mention.senderName } baseStyle={ GetUsernameStyle(mention) } /></Text>
                        </Flex>
                        <Text small className="mention-time-ago">{ timeAgo(mention.timestamp) }</Text>
                    </Column>
                </Flex>
                <Flex center className="nitro-card-header-button" onClick={ onClose }>
                    <FaTimes className="fa-icon w-12 h-12" />
                </Flex>
            </Flex>
            <div className="horizontal-separator" />
            <Text wrap textBreak select="text">{ mention.message }</Text>
            { (mention.senderId !== 0) &&
                <Flex gap={ 2 } alignItems="start">
                    <Button onClick={ follow }><FaSignInAlt className="fa-icon follow" /></Button>
                    <textarea
                        ref={ area }
                        className="mention-input"
                        placeholder="reply..."
                        rows={ 1 }
                        value={ reply }
                        onChange={ event => setReply(event.target.value.replace(/[\r\n]/g, ' ').slice(0, 100)) }
                        onKeyDown={ event =>
                        {
                            if(event.code !== 'Enter') return;

                            event.preventDefault();

                            if(reply.trim().length) SendMessageComposer(new SendMentionComposer(mention.senderId, reply));

                            setReply('');
                        } } />
                </Flex> }
        </Column>
    );
}

export const MentionsListView: FC<{ mentions: IMention[], setMentions: (update: (list: IMention[]) => IMention[]) => void }> = props =>
{
    const { mentions = [], setMentions = null } = props;

    if(!mentions.length) return null;

    return (
        <Column className="mentions-container">
            <Text shrink fontSize={ 5 } className="mentions-close-all-button" center onClick={ () => setMentions(list => list.filter(entry => (Date.now() - entry.timestamp) <= KEEP_ON_CLOSE_ALL_MS)) }>
                Close all ({ mentions.length })
            </Text>
            <Column className="mentions-list">
                <ScrollContainer>
                    { mentions.slice().reverse().map(mention =>
                        <MentionCardView key={ mention.id } mention={ mention } onClose={ () => setMentions(list => list.filter(entry => entry.id !== mention.id)) } />) }
                </ScrollContainer>
            </Column>
        </Column>
    );
}
