import { GetGuestRoomResultEvent, GetGuestRoomResultMessageParser, RateFlatMessageComposer, RoomControllerLevel, RoomDataParser } from '@nitrots/nitro-renderer';
import { FC, useEffect, useRef, useState } from 'react';
import { Overlay, Popover } from 'react-bootstrap';
import { CreateLinkEvent, GetRoomEngine, GetUserProfile, LocalizeText, SendMessageComposer } from '../../../../api';
import { Base, classNames, Column, Flex, Grid, Marquee, NitroCardContentView, ScrollContainer, Text } from '../../../../common';
import { useMessageEvent, useNavigator, useRoom } from '../../../../hooks';

const DOOR_MODE_ICONS: { [ doorMode: number ]: string } = {
    [ RoomDataParser.OPEN_STATE ]: 'open',
    [ RoomDataParser.DOORBELL_STATE ]: 'locked',
    [ RoomDataParser.PASSWORD_STATE ]: 'password',
    [ RoomDataParser.INVISIBLE_STATE ]: 'invisible',
    [ RoomDataParser.NOOB_STATE ]: 'rank'
};

const formatTime = (date: Date) => [ date.getHours(), date.getMinutes(), date.getSeconds() ].map(value => value.toString().padStart(2, '0')).join(':');

export const RoomToolsWidgetView: FC<{}> = props =>
{
    const { roomSession = null } = useRoom();
    const { navigatorData = null, navigatorHistory = null, goToHistory = null } = useNavigator();
    const [ zoomScale, setZoomScale ] = useState(() => GetRoomEngine().getRoomInstanceRenderingCanvasScale(roomSession.roomId, 1));
    const [ historyOpen, setHistoryOpen ] = useState(false);
    const [ roomInfo, setRoomInfo ] = useState<GetGuestRoomResultMessageParser>(null);
    const [ infoVisible, setInfoVisible ] = useState(false);
    const historyButtonRef = useRef<HTMLDivElement>(null);
    const historyContentRef = useRef<HTMLDivElement>(null);

    useEffect(() =>
    {
        if(!historyOpen) return;

        const onMouseDown = (event: MouseEvent) =>
        {
            if(historyButtonRef.current && historyButtonRef.current.contains(event.target as Node)) return;

            if(historyContentRef.current && !historyContentRef.current.contains(event.target as Node)) setHistoryOpen(false);
        }

        document.addEventListener('mousedown', onMouseDown);

        return () => document.removeEventListener('mousedown', onMouseDown);
    }, [ historyOpen ]);

    useMessageEvent<GetGuestRoomResultEvent>(GetGuestRoomResultEvent, event =>
    {
        const parser = event.getParser();

        if(!parser.roomEnter || (parser.data.roomId !== roomSession.roomId)) return;

        setRoomInfo(parser);
        setHistoryOpen(false);
    });

    useEffect(() =>
    {
        setInfoVisible(true);

        const timeout = setTimeout(() => setInfoVisible(false), 10000);

        return () => clearTimeout(timeout);
    }, [ roomInfo ]);

    const toggleZoom = () =>
    {
        const current = GetRoomEngine().getRoomInstanceRenderingCanvasScale(roomSession.roomId, 1);
        const scale = ((current !== 1) ? 1 : 0.5);

        GetRoomEngine().setRoomInstanceRenderingCanvasScale(roomSession.roomId, 1, scale);

        setZoomScale(scale);
    }

    const { history = [], index: historyIndex = 0 } = navigatorHistory;
    const canGoBack = (history.length > 0) && (historyIndex !== 0);
    const canGoForward = (history.length > 0) && (historyIndex !== (history.length - 1));
    const canBuild = (roomSession.controllerLevel >= RoomControllerLevel.GUEST) && (roomSession.controllerLevel !== RoomControllerLevel.GUILD_MEMBER);

    return (
        <Flex gap={ 3 } className="nitro-room-additional-widgets">
            <Flex gap={ 3 } className="nitro-room-tools container">
                <Flex gap={ 2 } alignItems="center">
                    <Base pointer title={ LocalizeText('room.settings.button.text') } className="icon room-tools-icon icon-cog" onClick={ event => CreateLinkEvent('navigator/toggle-room-info') } />
                    { canBuild &&
                        <Base pointer title="Build mode" className="icon room-tools-icon icon-small-room" onClick={ event => CreateLinkEvent('builder-toolbar/toggle') } /> }
                    <Base pointer title={ LocalizeText('room.zoom.button.text') } className={ classNames('icon', 'room-tools-icon', (zoomScale >= 1) ? 'icon-zoom-less' : 'icon-zoom-more') } onClick={ toggleZoom } />
                    <Base pointer title={ LocalizeText('room.chathistory.button.text') } className="icon room-tools-icon icon-chat-history" onClick={ event => CreateLinkEvent('chat-history/toggle') } />
                    { navigatorData.canRate && (navigatorData.enteredGuestRoom?.roomId >= 0) &&
                        <Base pointer title={ LocalizeText('room.like.button.text') } className="icon room-tools-icon icon-like-room" onClick={ event => SendMessageComposer(new RateFlatMessageComposer(1)) } /> }
                </Flex>
                <div className="vertical-separator" />
                <Flex gap={ 2 } alignItems="center">
                    <Base pointer={ (history.length > 1) && (history[0]?.roomId !== navigatorData.currentRoomId) } title={ LocalizeText('room.history.button.back.tooltip') } className={ `icon room-history ${ canGoBack ? 'icon-room-history-back-enabled' : 'icon-room-history-back-disabled disabled' }` } onClick={ event => canGoBack && goToHistory(historyIndex - 1) } />
                    <Base innerRef={ historyButtonRef } pointer={ history.length > 0 } title={ LocalizeText('room.history.button.tooltip') } className={ `icon room-history ${ (history.length === 0) ? 'icon-room-history-disabled disabled' : 'icon-room-history-enabled' }` } onClick={ event => (history.length > 0) && setHistoryOpen(value => !value) } />
                    <Base pointer={ (history.length > 1) && (history[history.length - 1]?.roomId !== navigatorData.currentRoomId) } title={ LocalizeText('room.history.button.forward.tooltip') } className={ `icon room-history ${ canGoForward ? 'icon-room-history-next-enabled' : 'icon-room-history-next-disabled disabled' }` } onClick={ event => canGoForward && goToHistory(historyIndex + 1) } />
                </Flex>
                <Overlay show={ historyOpen } target={ historyButtonRef } placement="top">
                    <Popover className="room-history-popover">
                        <NitroCardContentView overflow="hidden" className="bg-transparent" innerRef={ historyContentRef }>
                            <Column overflow="hidden" fullHeight fullWidth>
                                <ScrollContainer>
                                    <Grid columnCount={ 1 }>
                                        { history.map(entry => (
                                            <Text key={ entry.index } className={ (historyIndex === entry.index) ? 'room-history-name selected' : 'room-history-name' } fontSize={ 6 } truncate textBreak grow pointer title={ `${ formatTime(entry.date) } → ${ entry.roomName }` } onClick={ event => goToHistory(entry.index) }>{ entry.roomName } </Text>
                                        )) }
                                    </Grid>
                                </ScrollContainer>
                            </Column>
                        </NitroCardContentView>
                    </Popover>
                </Overlay>
            </Flex>
            { roomInfo && roomInfo.data && infoVisible &&
                <Flex gap={ 2 } alignItems="center" className="nitro-room-tools-info container">
                    <i className={ `icon icon-navigator-room-${ DOOR_MODE_ICONS[roomInfo.data.doorMode] }` } />
                    <div className="vertical-separator" />
                    <Marquee style={ { maxWidth: '250px' } } timeout={ 3000 } waitBetween={ 2000 } step={ 150 }>
                        <Text fontSize={ 6 } select="text">{ roomInfo.data.roomName }</Text>
                    </Marquee>
                    <div className="vertical-separator" />
                    <Flex gap={ 1 } alignItems="center">
                        <Base pointer className="nitro-friends-spritesheet icon-profile-sm" onClick={ event => GetUserProfile(roomInfo.data.ownerId) } />
                        <Text italics small>{ roomInfo.data.ownerName }</Text>
                    </Flex>
                </Flex> }
        </Flex>
    );
}
