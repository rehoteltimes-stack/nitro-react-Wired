import { FC, useEffect, useRef, useState } from 'react';
import { Overlay, Popover } from 'react-bootstrap';
import { Base, Column, Flex, Grid, NitroCardContentView, ScrollContainer } from '../../../../common';

interface ChatInputStyleSelectorViewProps
{
    chatStyleId: number;
    chatStyleIds: number[];
    selectChatStyleId: (styleId: number) => void;
}

export const ChatInputStyleSelectorView: FC<ChatInputStyleSelectorViewProps> = props =>
{
    const { chatStyleId = 0, chatStyleIds = null, selectChatStyleId = null } = props;
    const [ selectorVisible, setSelectorVisible ] = useState(false);
    const iconRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() =>
    {
        if(!selectorVisible) return;

        const onMouseDown = (event: MouseEvent) =>
        {
            if(iconRef.current && iconRef.current.contains(event.target as Node)) return;

            if(contentRef.current && !contentRef.current.contains(event.target as Node)) setSelectorVisible(false);
        }

        document.addEventListener('mousedown', onMouseDown);

        return () => document.removeEventListener('mousedown', onMouseDown);
    }, [ selectorVisible ]);

    return (
        <Flex className="chatstyles-icon-container" alignItems="center">
            <Base pointer className="icon chatstyles-icon" innerRef={ iconRef } onClick={ event => setSelectorVisible(value => !value) } />
            <Overlay show={ selectorVisible } target={ iconRef } placement="top">
                <Popover className="nitro-chat-style-selector-container image-rendering-pixelated">
                    <NitroCardContentView overflow="hidden" className="bg-transparent" innerRef={ contentRef }>
                        <Column overflow="hidden" fullWidth fullHeight>
                            <ScrollContainer>
                                <Grid columnCount={ 4 }>
                                    { chatStyleIds && (chatStyleIds.length > 0) && chatStyleIds.map(styleId =>
                                    {
                                        return (
                                            <Flex center pointer key={ styleId } className={ `bubble-parent-container ${ (chatStyleId === styleId) ? 'selected' : '' }` } onClick={ event => { selectChatStyleId(styleId); setSelectorVisible(false); } }>
                                                <Base className="bubble-container">
                                                    <Base className={ `chat-bubble bubble-${ styleId }` }>&nbsp;</Base>
                                                </Base>
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
