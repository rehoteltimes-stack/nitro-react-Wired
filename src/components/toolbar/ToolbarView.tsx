import { Dispose, DropBounce, EaseOut, JumpBy, Motions, NitroToolbarAnimateIconEvent, PerkAllowancesMessageEvent, PerkEnum, Queue, RoomControllerLevel, Wait } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { CreateLinkEvent, GetConfiguration, GetSessionDataManager, GetWiredCreatorToolsSettings, MessengerIconState, OpenMessengerChat, VisitDesktop, WIRED_CREATOR_TOOLS_SETTINGS_EVENT } from '../../api';
import { Base, Flex, LayoutAvatarImageView, LayoutItemCountView } from '../../common';
import { useAchievements, useFriends, useInventoryUnseenTracker, useMessageEvent, useMessenger, useRoom, useRoomEngineEvent, useSessionInfo } from '../../hooks';
import { ToolbarMeView } from './ToolbarMeView';

export const ToolbarView: FC<{ isInRoom: boolean }> = props =>
{
    const { isInRoom } = props;
    // Reference's own toolbar keeps a second, independent CREATED/ENDED listener purely local to itself
    // (mirrored here originally) - real, reproducible bug found live: on a fresh page load where the account is
    // already placed into a room on login, this second listener can miss the CREATED event that already fired by
    // the time ToolbarView finishes mounting, leaving it permanently out of sync with MainView's own (correct)
    // landingViewVisible state passed down as `isInRoom` - confirmed via CDP (camera/modtools icons, gated on the
    // `isInRoom` prop, showed correctly for a real non-spectator room session; icon-house/icon-habbo, gated on the
    // old local isLandingView copy, did not). Single source of truth now: derive it from the same prop instead of
    // a second listener that can race the first.
    const isLandingView = !isInRoom;
    const [ isMeExpanded, setMeExpanded ] = useState(false);
    const [ useGuideTool, setUseGuideTool ] = useState(false);
    const [ showWiredToolbar, setShowWiredToolbar ] = useState(() => GetWiredCreatorToolsSettings().showToolbar);
    const { userFigure = null } = useSessionInfo();
    const { getFullCount = 0 } = useInventoryUnseenTracker();
    const { getTotalUnseen = 0 } = useAchievements();
    const { requests = [] } = useFriends();
    const { iconState = MessengerIconState.HIDDEN } = useMessenger();
    const isMod = GetSessionDataManager().isModerator;
    const { roomSession = null } = useRoom();
    const canOpenWiredTools = isInRoom && !!roomSession && (roomSession.isRoomOwner || roomSession.controllerLevel >= RoomControllerLevel.GUEST || isMod);

    useEffect(() =>
    {
        const updateSettings = () => setShowWiredToolbar(GetWiredCreatorToolsSettings().showToolbar);

        window.addEventListener(WIRED_CREATOR_TOOLS_SETTINGS_EVENT, updateSettings);

        return () => window.removeEventListener(WIRED_CREATOR_TOOLS_SETTINGS_EVENT, updateSettings);
    }, []);

    useMessageEvent<PerkAllowancesMessageEvent>(PerkAllowancesMessageEvent, event =>
    {
        const parser = event.getParser();

        setUseGuideTool(parser.isAllowed(PerkEnum.USE_GUIDE_TOOL));
    });

    useRoomEngineEvent<NitroToolbarAnimateIconEvent>(NitroToolbarAnimateIconEvent.ANIMATE_ICON, event =>
    {
        const animationIconToToolbar = (iconName: string, image: HTMLImageElement, x: number, y: number) =>
        {
            const target = (document.body.getElementsByClassName(iconName)[0] as HTMLElement);

            if(!target) return;
            
            image.className = 'toolbar-icon-animation';
            image.style.visibility = 'visible';
            image.style.left = (x + 'px');
            image.style.top = (y + 'px');

            document.body.append(image);

            const targetBounds = target.getBoundingClientRect();
            const imageBounds = image.getBoundingClientRect();

            const left = (imageBounds.x - targetBounds.x);
            const top = (imageBounds.y - targetBounds.y);
            const squared = Math.sqrt(((left * left) + (top * top)));
            const wait = (500 - Math.abs(((((1 / squared) * 100) * 500) * 0.5)));
            const height = 20;

            const motionName = (`ToolbarBouncing[${ iconName }]`);

            if(!Motions.getMotionByTag(motionName))
            {
                Motions.runMotion(new Queue(new Wait((wait + 8)), new DropBounce(target, 400, 12))).tag = motionName;
            }

            const motion = new Queue(new EaseOut(new JumpBy(image, wait, ((targetBounds.x - imageBounds.x) + height), (targetBounds.y - imageBounds.y), 100, 1), 1), new Dispose(image));

            Motions.runMotion(motion);
        }

        animationIconToToolbar('icon-inventory', event.image, event.x, event.y);
    });

    return (
        <Flex alignItems="center" justifyContent="between" gap={ 2 } className="nitro-toolbar">
            <Flex className="nitro-toolbar-container left" gap={ 2 } alignItems="center">
                { isLandingView &&
                    <Base pointer className="navigation-item icon icon-house" onClick={ event => CreateLinkEvent('navigator/goto/home') } /> }
                { !isLandingView &&
                    <Base pointer className="navigation-item icon icon-habbo" onClick={ event => VisitDesktop() } /> }
                <Flex center pointer className={ 'navigation-item item-avatar ' + (isMeExpanded ? 'active ' : '') } onClick={ event => setMeExpanded(value => !value) }>
                    <LayoutAvatarImageView figure={ userFigure } direction={ 2 } position="absolute" />
                    { (getTotalUnseen > 0) &&
                        <LayoutItemCountView count={ getTotalUnseen } /> }
                </Flex>
                { isMeExpanded &&
                    <ToolbarMeView useGuideTool={ useGuideTool } /> }
                { !isMeExpanded &&
                    <>
                        <Base pointer className="navigation-item icon icon-rooms" onClick={ event => CreateLinkEvent('navigator/toggle') } />
                        { GetConfiguration('game.center.enabled') &&
                            <Base pointer className="navigation-item icon icon-game" onClick={ event => CreateLinkEvent('games/toggle') } /> }
                        <Base pointer className="navigation-item icon icon-catalog" onClick={ event => CreateLinkEvent('catalog/toggle') } />
                        { canOpenWiredTools && showWiredToolbar &&
                            <Base pointer className="navigation-item icon icon-wired-tools" onClick={ event => CreateLinkEvent('wired-tools/toggle') } /> }
                        <Base pointer className="navigation-item icon icon-inventory" onClick={ event => CreateLinkEvent('inventory/toggle') }>
                            { (getFullCount > 0) &&
                                <LayoutItemCountView count={ getFullCount } /> }
                        </Base>
                        { isInRoom &&
                            <Base pointer className="navigation-item icon icon-camera" onClick={ event => CreateLinkEvent('camera/toggle') } /> }
                    </> }
                { isMod &&
                    <Base pointer className="navigation-item icon icon-modtools" onClick={ event => CreateLinkEvent('mod-tools/toggle') } /> }
            </Flex>
            <Flex className={ `nitro-toolbar-container center ${ (!roomSession || roomSession.isSpectator) ? 'inactive' : '' }` } gap={ 2 }>
                <Flex alignItems="center" id="toolbar-chat-input-container" />
            </Flex>
            <Flex className="nitro-toolbar-container right" alignItems="center" gap={ 2 }>
                <Base id="toolbar-friend-bar-container" />
                <Flex gap={ 2 }>
                    <Base pointer className="navigation-item icon icon-friendall" onClick={ event => CreateLinkEvent('friends/toggle') }>
                        { (requests.length > 0) &&
                            <LayoutItemCountView count={ requests.length } /> }
                    </Base>
                    { /* the reference interpolates `false` into the class list on purpose: `.icon-message.false` is its dimmed "nothing unread" state */ }
                    <Base pointer className={ `navigation-item icon icon-message ${ (iconState === MessengerIconState.UNREAD) && 'is-unseen' }` } onClick={ event => OpenMessengerChat() } />
                </Flex>
            </Flex>
        </Flex>
    );
}
