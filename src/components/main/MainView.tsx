import { DesktopViewEvent, HabboWebTools, ILinkEventTracker, RoomSessionEvent } from '@nitrots/nitro-renderer';
import { FC, useEffect, useRef, useState } from 'react';
import { AddEventLinkTracker, CreateLinkEvent, GetCommunication, GetRoomSession, GetRoomSessionManager, RemoveLinkEventTracker } from '../../api';
import { Base, TransitionAnimation, TransitionAnimationTypes } from '../../common';
import { useMessageEvent, useRoomSessionManagerEvent } from '../../hooks';
import { AchievementsView } from '../achievements/AchievementsView';
import { AvatarEditorView } from '../avatar-editor/AvatarEditorView';
import { BuilderToolbarView } from '../builder-toolbar/BuilderToolbarView';
import { CameraWidgetView } from '../camera/CameraWidgetView';
import { CampaignView } from '../campaign/CampaignView';
import { CatalogView } from '../catalog/CatalogView';
import { ChatHistoryView } from '../chat-history/ChatHistoryView';
import { ClothesShopView } from '../clothes-shop/ClothesShopView';
import { FloorplanEditorView } from '../floorplan-editor/FloorplanEditorView';
import { FriendsView } from '../friends/FriendsView';
import { GameCenterView } from '../game-center/GameCenterView';
import { GroupsView } from '../groups/GroupsView';
import { GuideToolView } from '../guide-tool/GuideToolView';
import { HcCenterView } from '../hc-center/HcCenterView';
import { HelpView } from '../help/HelpView';
import { HotelView } from '../hotel-view/HotelView';
import { InventoryView } from '../inventory/InventoryView';
import { ModToolsView } from '../mod-tools/ModToolsView';
import { NavigatorView } from '../navigator/NavigatorView';
import { NitropediaView } from '../nitropedia/NitropediaView';
import { RightSideView } from '../right-side/RightSideView';
import { RoomView } from '../room/RoomView';
import { AreaHideView } from '../room-tools/AreaHideView';
import { ToolbarView } from '../toolbar/ToolbarView';
import { WiredCreatorToolsView } from '../wired-creator-tools-habbo/WiredCreatorToolsView';
import { ChestView } from '../wired-chests/ChestView';
import { ContractView } from '../wired-chests/ContractView';
import { RewardPopupView } from '../wired-chests/RewardPopupView';
import { UserProfileModerationView } from '../user-profile/UserProfileModerationView';
import { UserProfileView } from '../user-profile/UserProfileView';
import { UserSettingsView } from '../user-settings/UserSettingsView';
import { WiredView } from '../wired/WiredView';

export const MainView: FC<{}> = props =>
{
    const [ isReady, setIsReady ] = useState(false);
    const [ landingViewVisible, setLandingViewVisible ] = useState(true);

    useRoomSessionManagerEvent<RoomSessionEvent>(RoomSessionEvent.CREATED, event => setLandingViewVisible(false));
    useRoomSessionManagerEvent<RoomSessionEvent>(RoomSessionEvent.ENDED, event => setLandingViewVisible(event.openLandingView));
    const pendingRoomId = useRef<string>(new URLSearchParams(window.location.search).get('room'));

    const openPendingRoom = () =>
    {
        const roomId = pendingRoomId.current;

        pendingRoomId.current = null;

        if(roomId && /^\d+$/.test(roomId)) CreateLinkEvent(`navigator/goto/${ roomId }`);
    }

    useMessageEvent<DesktopViewEvent>(DesktopViewEvent, () =>
    {
        openPendingRoom();

        const session = GetRoomSession();

        if(session) GetRoomSessionManager().removeSession(session.roomId);

        setLandingViewVisible(true);
    });

    useEffect(() =>
    {
        setIsReady(true);

        GetCommunication().connection.onReady();

        // the website's ?room=<id> deep link: the landing view's own DesktopViewEvent normally fires first, this is the fallback
        const timer = window.setTimeout(openPendingRoom, 4000);

        return () => window.clearTimeout(timer);
    }, []);

    useEffect(() =>
    {
        const linkTracker: ILinkEventTracker = { 
            linkReceived: (url: string) =>
            {
                const parts = url.split('/');
        
                if(parts.length < 2) return;
        
                switch(parts[1])
                {
                    case 'open':
                        if(parts.length > 2)
                        {
                            switch(parts[2])
                            {
                                case 'credits':
                                    //HabboWebTools.openWebPageAndMinimizeClient(this._windowManager.getProperty(ExternalVariables.WEB_SHOP_RELATIVE_URL));
                                    break;
                                default: {
                                    const name = parts[2];
                                    HabboWebTools.openHabblet(name);
                                }
                            }
                        }
                        return;
                }
            },
            eventUrlPrefix: 'habblet/'
        };

        AddEventLinkTracker(linkTracker);

        return () => RemoveLinkEventTracker(linkTracker);
    }, []);

    return (
        <Base fit>
            <TransitionAnimation type={ TransitionAnimationTypes.FADE_IN } inProp={ landingViewVisible } timeout={ 300 }>
                <HotelView />
            </TransitionAnimation>
            <ToolbarView isInRoom={ !landingViewVisible } />
            <ModToolsView />
            <RoomView isInRoom={ !landingViewVisible } />
            <AreaHideView />
            <ChatHistoryView />
            <WiredView />
            <ChestView />
            <ContractView />
            <RewardPopupView />
            <WiredCreatorToolsView />
            <AvatarEditorView />
            <AchievementsView />
            <NavigatorView />
            <InventoryView />
            <CatalogView />
            <FriendsView />
            <RightSideView />
            <UserSettingsView />
            <UserProfileView />
            <UserProfileModerationView />
            <GroupsView />
            <CameraWidgetView />
            <HelpView />
            <NitropediaView />
            <GuideToolView />
            <HcCenterView />
            <CampaignView />
            <GameCenterView />
            <FloorplanEditorView />
            <BuilderToolbarView />
            <ClothesShopView />
        </Base>
    );
}
