import { RoomObjectCategory, RoomUnitClickAvatarComposer } from '@nitrots/nitro-renderer';
import { FC, useEffect } from 'react';
import { CreateLinkEvent, DispatchUiEvent, GetConfiguration, GetRoomEngine, GetRoomSession, GetSessionDataManager, GetUserProfile, SendMessageComposer } from '../../api';
import { Base } from '../../common';
import { GuideToolEvent } from '../../events';

interface ToolbarMeViewProps
{
    useGuideTool: boolean;
}

export const ToolbarMeView: FC<ToolbarMeViewProps> = props =>
{
    const { useGuideTool = false } = props;

    useEffect(() =>
    {
        const roomSession = GetRoomSession();

        if(!roomSession) return;

        GetRoomEngine().selectRoomObject(roomSession.roomId, roomSession.ownRoomIndex, RoomObjectCategory.UNIT);

        // A real in-room click on an avatar also sends this (RoomObjectEventHandler's own mouse-click
        // handling) - the server's packet 108 reply (WiredClickUserReceivedEvent) is what actually
        // flushes the pending avatar-info into view (useAvatarInfoWidget's pendingUnitInfoRef).
        // selectRoomObject() alone only selects the object, it never triggers that server round trip.
        SendMessageComposer(new RoomUnitClickAvatarComposer(roomSession.ownRoomIndex));
    }, []);

    return (
        <>
            { (GetConfiguration('guides.enabled') && useGuideTool) &&
                <Base pointer className="navigation-item icon icon-me-helper-tool" onClick={ event => DispatchUiEvent(new GuideToolEvent(GuideToolEvent.TOGGLE_GUIDE_TOOL)) } /> }
            <Base pointer className="navigation-item icon icon-me-profile" onClick={ event => GetUserProfile(GetSessionDataManager().userId) } />
            <Base pointer className="navigation-item icon icon-me-rooms" onClick={ event => CreateLinkEvent('navigator/search/myworld_view') } />
            <Base pointer className="navigation-item icon icon-me-clothing" onClick={ event => CreateLinkEvent('avatar-editor/toggle') } />
            <Base pointer className="navigation-item icon icon-me-settings" onClick={ event => CreateLinkEvent('user-settings/toggle') } />
        </>
    );
}
