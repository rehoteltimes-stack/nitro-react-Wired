import { ILinkEventTracker } from '@nitrots/nitro-renderer';
import { FC, useEffect, useMemo, useRef, useState } from 'react';
import { AddEventLinkTracker, ChatEntryType, LocalizeText, RemoveLinkEventTracker } from '../../api';
import { Column, CustomSelect, Flex, InfiniteScroll, NitroCardContentView, NitroCardHeaderView, NitroCardView, Text } from '../../common';
import { useChatHistory } from '../../hooks';
import { EscapeChatHtml, IsWiredBubble, SystemLineHtml } from '../room/widgets/chat/ChatWidgetMessageView';

// Real reference structure ("nitro-chat-history" in the minified index-b7d2b6d3.js, confirmed via
// exact string match): a plain NitroCardView/NitroCardHeaderView/NitroCardContentView window - not
// the bespoke, header-less <div> + separate "chat-collapse-button" this file had before - with a
// real filter-type CustomSelect (All/Username/Message/Room) next to the search input, which this
// file previously had no equivalent for at all (search only ever matched name+message together).
const FILTER_TYPES = [
    { value: 'all', text: 'All' },
    { value: 'username', text: 'Username' },
    { value: 'message', text: 'Message' },
    { value: 'room', text: 'Room' }
];

export const ChatHistoryView: FC<{}> = props =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const [ searchText, setSearchText ] = useState<string>('');
    const [ filterType, setFilterType ] = useState<string>('all');
    const { chatHistory = [] } = useChatHistory();
    const elementRef = useRef<HTMLDivElement>(null);

    const filteredChatHistory = useMemo(() =>
    {
        if(searchText.length === 0) return chatHistory;

        const text = searchText.toLowerCase();

        return chatHistory.filter(entry =>
        {
            switch(filterType)
            {
                case 'username':
                    return (entry.type === ChatEntryType.TYPE_CHAT) && entry.name && entry.name.toLowerCase().includes(text);
                case 'message':
                    return (entry.type === ChatEntryType.TYPE_CHAT) && entry.message && entry.message.toLowerCase().includes(text);
                case 'room':
                    return (entry.type === ChatEntryType.TYPE_ROOM_INFO) && entry.name && entry.name.toLowerCase().includes(text);
                default:
                    return ((entry.message && entry.message.toLowerCase().includes(text)) || (entry.name && entry.name.toLowerCase().includes(text)));
            }
        });
    }, [ chatHistory, searchText, filterType ]);

    useEffect(() =>
    {
        if(elementRef.current && isVisible) elementRef.current.scrollTop = elementRef.current.scrollHeight;
    }, [ isVisible ]);

    useEffect(() =>
    {
        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) =>
            {
                const parts = url.split('/');

                if(parts.length < 2) return;

                switch(parts[1])
                {
                    case 'show':
                        setIsVisible(true);
                        return;
                    case 'hide':
                        setIsVisible(false);
                        return;
                    case 'toggle':
                        setIsVisible(prevValue => !prevValue);
                        return;
                }
            },
            eventUrlPrefix: 'chat-history/'
        };

        AddEventLinkTracker(linkTracker);

        return () => RemoveLinkEventTracker(linkTracker);
    }, []);

    if(!isVisible) return null;

    return (
        <NitroCardView className="nitro-chat-history" theme="primary-slim">
            <NitroCardHeaderView headerText={ LocalizeText('room.chathistory.button.text') } onCloseClick={ () => setIsVisible(false) } />
            <NitroCardContentView innerRef={ elementRef } overflow="hidden">
                <Column gap={ 3 } fullHeight>
                    <Flex shrink gap={ 2 } className="flex-fill">
                        <input type="text" className="form-control form-control-sm" placeholder={ LocalizeText('generic.search') } value={ searchText } onChange={ event => setSearchText(event.target.value) } />
                        <CustomSelect value={ filterType } onChange={ setFilterType } items={ FILTER_TYPES } />
                    </Flex>
                    <InfiniteScroll overscan={ 10 } rows={ filteredChatHistory } scrollToBottom={ isVisible } rowRender={ row =>
                    {
                        return (
                            <Flex shrink alignItems="center" className="p-1" gap={ 2 }>
                                <Text variant="muted">{ row.timestamp }</Text>
                                { (row.type === ChatEntryType.TYPE_CHAT) &&
                                    <div className="bubble-container" style={ { position: 'relative' } }>
                                        { (row.style === 0) &&
                                            <div className="user-container-bg" style={ { backgroundColor: row.color } } /> }
                                        <div className={ `chat-bubble bubble-${ row.style } type-${ row.chatType }` } style={ { maxWidth: '100%' } }>
                                            <div className="user-container">
                                                { row.imageUrl && (row.imageUrl.length > 0) &&
                                                    <div className="user-image" style={ { backgroundImage: `url(${ row.imageUrl })` } } /> }
                                            </div>
                                            <div className="chat-content">
                                                { row.name &&
                                                    <b className="username mr-1">{ row.name }: </b> }
                                                { IsWiredBubble(row.style)
                                                    ? <span className="message" dangerouslySetInnerHTML={ { __html: SystemLineHtml(row.style, row.message, EscapeChatHtml(row.message)) } } />
                                                    : <span className="message">{ row.message }</span> }
                                            </div>
                                        </div>
                                    </div> }
                                { (row.type === ChatEntryType.TYPE_ROOM_INFO) &&
                                    <>
                                        <i className="icon icon-small-room" />
                                        <Text textBreak wrap grow>{ row.name }</Text>
                                    </> }
                            </Flex>
                        );
                    } } />
                </Column>
            </NitroCardContentView>
        </NitroCardView>
    );
}
