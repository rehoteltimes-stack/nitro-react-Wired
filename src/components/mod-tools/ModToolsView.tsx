import { ILinkEventTracker, RoomEngineEvent, RoomId, RoomObjectCategory, RoomObjectType } from '@nitrots/nitro-renderer';
import { FC, Suspense, useEffect, useRef, useState } from 'react';
import { AddEventLinkTracker, CreateLinkEvent, GetRoomSession, GetSessionDataManager, ISelectedUser, RemoveLinkEventTracker } from '../../api';
import { Base, Button, DraggableWindowPosition, LayoutItemCountView, NitroCardContentView, NitroCardHeaderView, NitroCardView } from '../../common';
import { useModTools, useObjectSelectedEvent, useRoomEngineEvent } from '../../hooks';
import { StaffFeedCard, useStaffFeedCard } from '../../api/stafffeed/StaffFeedCardStore';
import { useChunkLevel } from '../protected/LoadProtected';
import { ADMINISTRATION_LEVEL, GAMES_LEVEL, MOD_TOOLS_LEVEL, ModToolsAdministrationView, ModToolsGamesView, ModToolsChatlogView, ModToolsRoomView, ModToolsStaffSettingsView, ModToolsTicketsView, ModToolsUserChatlogView, ModToolsUserView, StaffFeedCardView } from './ModToolsStaffViews';

export const ModToolsView: FC<{}> = props =>
{
    const chunkLevel = useChunkLevel();
    const [ isVisible, setIsVisible ] = useState(false);
    const [ currentRoomId, setCurrentRoomId ] = useState<number>(-1);
    const [ selectedUser, setSelectedUser ] = useState<ISelectedUser>(null);
    const [ isTicketsVisible, setIsTicketsVisible ] = useState(false);
    const [ isAdministrationVisible, setIsAdministrationVisible ] = useState(false);
    const [ isGamesVisible, setIsGamesVisible ] = useState(false);
    const [ isStaffSettingsVisible, setIsStaffSettingsVisible ] = useState(false);
    const [ incidentsRequest, setIncidentsRequest ] = useState(0);
    const { openRooms = [], openRoomChatlogs = [], openUserChatlogs = [], openUserInfos = [], openRoomInfo = null, closeRoomInfo = null, toggleRoomInfo = null, openRoomChatlog = null, closeRoomChatlog = null, toggleRoomChatlog = null, openUserInfo = null, closeUserInfo = null, toggleUserInfo = null, openUserChatlog = null, closeUserChatlog = null, toggleUserChatlog = null } = useModTools();
    const { unread: feedUnread } = useStaffFeedCard();
    const elementRef = useRef<HTMLDivElement>(null);

    useRoomEngineEvent<RoomEngineEvent>([
        RoomEngineEvent.INITIALIZED,
        RoomEngineEvent.DISPOSED
    ], event =>
    {
        if(RoomId.isRoomPreviewerId(event.roomId)) return;

        switch(event.type)
        {
            case RoomEngineEvent.INITIALIZED:
                setCurrentRoomId(event.roomId);
                return;
            case RoomEngineEvent.DISPOSED:
                setCurrentRoomId(-1);
                return;
        }
    });

    useObjectSelectedEvent(event =>
    {
        if(event.category !== RoomObjectCategory.UNIT) return;

        const roomSession = GetRoomSession();

        if(!roomSession) return;

        const userData = roomSession.userDataManager.getUserDataByIndex(event.id);

        if(!userData || userData.type !== RoomObjectType.USER) return;

        setSelectedUser({ userId: userData.webID, username: userData.name });
    });

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
                    case 'open-room-info':
                        openRoomInfo(Number(parts[2]));
                        return;
                    case 'close-room-info':
                        closeRoomInfo(Number(parts[2]));           
                        return;
                    case 'toggle-room-info':
                        toggleRoomInfo(Number(parts[2]));
                        return;
                    case 'open-room-chatlog':
                        openRoomChatlog(Number(parts[2]));
                        return;
                    case 'close-room-chatlog':
                        closeRoomChatlog(Number(parts[2]));             
                        return;
                    case 'toggle-room-chatlog':
                        toggleRoomChatlog(Number(parts[2]));
                        return;
                    case 'staff-settings':
                        // staff only (rank level 4+, same as the Mod Tools button); the server refuses the packets too
                        if(GetSessionDataManager().securityLevel < 4) return;

                        setIsStaffSettingsVisible(value => !value);
                        return;
                    case 'feed-card':
                        // the Staff feed card (every feed line in one list), also :feed
                        if(GetSessionDataManager().securityLevel < 4) return;

                        StaffFeedCard.toggle();
                        return;
                    case 'incidents':
                        // the [ALERT] bubble: open Staff Tools on the Incidents tab
                        if(GetSessionDataManager().securityLevel < 4) return;

                        setIsStaffSettingsVisible(true);
                        setIncidentsRequest(value => value + 1);
                        return;
                    case 'open-user-info':
                        openUserInfo(Number(parts[2]));
                        return;
                    case 'close-user-info':
                        closeUserInfo(Number(parts[2]));             
                        return;
                    case 'toggle-user-info':
                        toggleUserInfo(Number(parts[2]));
                        return;
                    case 'open-user-chatlog':
                        openUserChatlog(Number(parts[2]));   
                        return;
                    case 'close-user-chatlog':
                        closeUserChatlog(Number(parts[2]));              
                        return;
                    case 'toggle-user-chatlog':
                        toggleUserChatlog(Number(parts[2]));
                        return;
                    case 'tickets':
                        setIsTicketsVisible(true);
                        return;
                }
            },
            eventUrlPrefix: 'mod-tools/'
        };

        AddEventLinkTracker(linkTracker);

        return () => RemoveLinkEventTracker(linkTracker);
    }, [ openRoomInfo, closeRoomInfo, toggleRoomInfo, openRoomChatlog, closeRoomChatlog, toggleRoomChatlog, openUserInfo, closeUserInfo, toggleUserInfo, openUserChatlog, closeUserChatlog, toggleUserChatlog ]);

    return (
        <>
            { isVisible &&
                <NitroCardView uniqueKey="mod-tools" className="nitro-mod-tools" windowPosition={ DraggableWindowPosition.TOP_LEFT } theme="primary-slim">
                    <NitroCardHeaderView headerText={ 'Mod Tools' } onCloseClick={ event => setIsVisible(false) } />
                    <NitroCardContentView gap={ 1 }>
                        <Button gap={ 1 } onClick={ event => CreateLinkEvent(`mod-tools/toggle-room-info/${ currentRoomId }`) } disabled={ (currentRoomId <= 0) } className="position-relative">
                            <Base className="icon icon-small-room position-absolute start-1"/> Room Tool
                        </Button>
                        <Button innerRef={ elementRef } gap={ 1 } onClick={ event => CreateLinkEvent(`mod-tools/toggle-room-chatlog/${ currentRoomId }`) } disabled={ (currentRoomId <= 0) } className="position-relative">
                            <Base className="icon icon-chat-history position-absolute start-1"/> Chatlog Tool
                        </Button>
                        <Button gap={ 1 } onClick={ () => CreateLinkEvent(`mod-tools/toggle-user-info/${ selectedUser.userId }`) } disabled={ !selectedUser } className="position-relative">
                            <Base className="icon icon-user position-absolute start-1"/> User: { selectedUser ? selectedUser.username : '' }
                        </Button>
                        <Button gap={ 1 } onClick={ () => setIsTicketsVisible(prevValue => !prevValue) } className="position-relative">
                            <Base className="icon icon-tickets position-absolute start-1"/> Report Tool
                        </Button>
                        { (GetSessionDataManager().securityLevel >= 4) &&
                            <Button gap={ 1 } onClick={ () => setIsStaffSettingsVisible(prevValue => !prevValue) } className="position-relative">
                                <Base className="icon icon-cog position-absolute start-1"/> Staff Tools
                                { (feedUnread > 0) && <LayoutItemCountView count={ feedUnread } /> }
                            </Button> }
                        { (GetSessionDataManager().securityLevel >= GAMES_LEVEL) &&
                            <Button gap={ 1 } onClick={ () => setIsGamesVisible(prevValue => !prevValue) } className="position-relative">
                                <Base className="icon icon-cog position-absolute start-1"/> Games
                            </Button> }
                        { (GetSessionDataManager().securityLevel >= 7) &&
                            <Button gap={ 1 } onClick={ () => setIsAdministrationVisible(prevValue => !prevValue) } className="position-relative">
                                <Base className="icon icon-cog position-absolute start-1"/> Administration
                            </Button> }
                    </NitroCardContentView>
                </NitroCardView> }
            { (chunkLevel >= MOD_TOOLS_LEVEL) &&
                <Suspense fallback={ null }>
                    { (openRooms.length > 0) && openRooms.map(roomId => <ModToolsRoomView key={ roomId } roomId={ roomId } onCloseClick={ () => CreateLinkEvent(`mod-tools/close-room-info/${ roomId }`) } />) }
                    { (openRoomChatlogs.length > 0) && openRoomChatlogs.map(roomId => <ModToolsChatlogView key={ roomId } roomId={ roomId } onCloseClick={ () => CreateLinkEvent(`mod-tools/close-room-chatlog/${ roomId }`) } />) }
                    { (openUserInfos.length > 0) && openUserInfos.map(userId => <ModToolsUserView key={ userId } userId={ userId } onCloseClick={ () => CreateLinkEvent(`mod-tools/close-user-info/${ userId }`) }/>) }
                    { (openUserChatlogs.length > 0) && openUserChatlogs.map(userId => <ModToolsUserChatlogView key={ userId } userId={ userId } onCloseClick={ () => CreateLinkEvent(`mod-tools/close-user-chatlog/${ userId }`) }/>) }
                    { isTicketsVisible && <ModToolsTicketsView onCloseClick={ () => setIsTicketsVisible(false) } /> }
                    { isAdministrationVisible && (chunkLevel >= ADMINISTRATION_LEVEL) && <ModToolsAdministrationView onCloseClick={ () => setIsAdministrationVisible(false) } /> }
                    { isGamesVisible && (chunkLevel >= GAMES_LEVEL) && <ModToolsGamesView onCloseClick={ () => setIsGamesVisible(false) } /> }
                    { isStaffSettingsVisible && (GetSessionDataManager().securityLevel >= 4) && <ModToolsStaffSettingsView incidentsRequest={ incidentsRequest } onCloseClick={ () => setIsStaffSettingsVisible(false) } /> }
                    <StaffFeedCardView />
                </Suspense> }
        </>
    );
}
