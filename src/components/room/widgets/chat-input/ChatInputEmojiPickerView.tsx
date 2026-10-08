import { FC, useEffect, useRef, useState } from 'react';
import { Overlay, Popover } from 'react-bootstrap';
import { CHAT_EMOJIS } from '../../../../api/chat/ChatEmojis';
import { Base, Column, Flex, Grid, NitroCardContentView, ScrollContainer } from '../../../../common';

interface ChatInputEmojiPickerViewProps
{
    pickEmoji: (emoji: string) => void;
}

export const ChatInputEmojiPickerView: FC<ChatInputEmojiPickerViewProps> = props =>
{
    const { pickEmoji = null } = props;
    const [ pickerVisible, setPickerVisible ] = useState(false);
    const iconRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() =>
    {
        if(!pickerVisible) return;

        const onMouseDown = (event: MouseEvent) =>
        {
            if(iconRef.current && iconRef.current.contains(event.target as Node)) return;

            if(contentRef.current && !contentRef.current.contains(event.target as Node)) setPickerVisible(false);
        }

        document.addEventListener('mousedown', onMouseDown);

        return () => document.removeEventListener('mousedown', onMouseDown);
    }, [ pickerVisible ]);

    return (
        <Flex className="chat-emoji-icon-container" alignItems="center">
            <Base pointer className="chat-emoji-icon" innerRef={ iconRef } title="Emoji" onClick={ event => setPickerVisible(value => !value) } />
            <Overlay show={ pickerVisible } target={ iconRef } placement="top">
                <Popover className="nitro-chat-emoji-picker-container">
                    <NitroCardContentView overflow="hidden" className="bg-transparent" innerRef={ contentRef }>
                        <Column overflow="hidden" fullWidth fullHeight>
                            <ScrollContainer>
                                <Grid columnCount={ 8 } gap={ 1 }>
                                    { CHAT_EMOJIS.map(([ code, emoji ]) =>
                                    {
                                        return (
                                            <Flex center pointer key={ code } className="chat-emoji-item" title={ `:${ code }:` } onMouseDown={ event => event.preventDefault() } onClick={ event => pickEmoji(emoji) }>
                                                { emoji }
                                            </Flex>
                                        );
                                    }) }
                                </Grid>
                            </ScrollContainer>
                        </Column>
                    </NitroCardContentView>
                </Popover>
            </Overlay>
        </Flex>
    );
}
