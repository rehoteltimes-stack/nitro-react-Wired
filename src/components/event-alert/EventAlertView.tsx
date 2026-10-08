import { FC, useEffect, useRef, useState } from 'react';
import { FaExclamationCircle, FaTimes } from 'react-icons/fa';
import { CreateLinkEvent, EventAlertEvent, EventAlertParser, GetConfiguration, MentionEvent, RegisterEventAlertMessages, RegisterMentionMessages } from '../../api';
import { Button, Column, Flex, LayoutAvatarImageView, Text } from '../../common';
import { HtmlDsl } from '../../common/HtmlDsl';
import { useMessageEvent } from '../../hooks';
import { IMention, MentionsListView } from './MentionsListView';

// "Il y a 14 minutes" in the reference (its "bd" time-ago component, refreshed every 10 seconds).
const timeAgo = (since: number): string =>
{
    const seconds = Math.max(0, Math.floor((Date.now() - since) / 1000));

    if(seconds < 60) return 'Just now';

    const minutes = Math.floor(seconds / 60);

    if(minutes < 60) return `${ minutes } minute${ (minutes === 1) ? '' : 's' } ago`;

    const hours = Math.floor(minutes / 60);

    return `${ hours } hour${ (hours === 1) ? '' : 's' } ago`;
}

const EventAlertCardView: FC<{ alert: EventAlertParser, receivedAt: number, onClose: () => void }> = props =>
{
    const { alert = null, receivedAt = 0, onClose = null } = props;
    const [ , setTick ] = useState(0);

    useEffect(() =>
    {
        const interval = setInterval(() => setTick(value => value + 1), 10000);

        return () => clearInterval(interval);
    }, []);

    const image = (GetConfiguration<string>('image.library.notifications.url') || '').replace('%image%', alert.type);

    return (
        <Column className="alert-item" alignSelf="start">
            <Flex justifyContent="between" alignItems="center">
                <Flex gap={ 1 } alignItems="center">
                    <FaExclamationCircle className="fa-icon exclamation" />
                    <Flex alignItems="center" gap={ 2 }>
                        <Text bold>{ alert.title }</Text>
                        <Text small className="alert-time-ago">{ timeAgo(receivedAt) }</Text>
                    </Flex>
                </Flex>
                <Flex center className="nitro-card-header-button" onClick={ onClose }>
                    <FaTimes className="fa-icon w-12 h-12" />
                </Flex>
            </Flex>
            <div className="horizontal-separator" />
            <Flex justifyContent="start" alignItems="center">
                <div className="alert-image" style={ { backgroundImage: `url(${ image })` } } />
                <Column fullWidth className="alert-content" justifyContent="between">
                    <div style={ { wordBreak: 'break-word', position: 'relative' } }>
                        <HtmlDsl text={ alert.description } />
                    </div>
                    <Flex alignItems="center" className="alert-sender-section" gap={ 0 }>
                        <LayoutAvatarImageView figure={ alert.senderFigure } direction={ 2 } headOnly={ true } />
                        <Text className="alert-sender-name">By { alert.senderName }</Text>
                    </Flex>
                </Column>
            </Flex>
            <Button className="alert-button" onClick={ () => CreateLinkEvent('navigator/goto/' + alert.roomId) }>{ alert.buttonText }</Button>
        </Column>
    );
}

// The card stays until it is closed (or replaced by the next event), like the reference's left-side alert.
export const EventAlertView: FC<{}> = props =>
{
    // Registered synchronously, before useMessageEvent subscribes: the subscription resolves the header at subscribe time.
    RegisterEventAlertMessages();
    RegisterMentionMessages();

    const [ alert, setAlert ] = useState<EventAlertParser>(null);
    const [ receivedAt, setReceivedAt ] = useState(0);

    useMessageEvent<EventAlertEvent>(EventAlertEvent, event =>
    {
        const parser = event.getParser();
        const copy = new EventAlertParser();

        Object.assign(copy, parser);

        setAlert(copy);
        setReceivedAt(Date.now());
    });

    const [ mentions, setMentions ] = useState<IMention[]>([]);
    const nextMentionId = useRef(1);

    useMessageEvent<MentionEvent>(MentionEvent, event =>
    {
        const parser = event.getParser();
        const mention: IMention = { id: nextMentionId.current++, senderId: parser.senderId, senderName: parser.senderName, message: parser.message, staffColor: parser.staffColor, staffBackground: parser.staffBackground, isVip: parser.isVip, timestamp: Date.now() };

        setMentions(list => [ ...list, mention ]);
    });

    // The left side holds the mention cards above the event alert card, like the reference's left-side container.
    if(!alert && !mentions.length) return null;

    return (
        <div className="nitro-left-side">
            <Flex fullHeight position="relative" gap={ 1 } className="nitro-left-side-container">
                <MentionsListView mentions={ mentions } setMentions={ setMentions } />
                { alert && <EventAlertCardView alert={ alert } receivedAt={ receivedAt } onClose={ () => setAlert(null) } /> }
            </Flex>
        </div>
    );
}
