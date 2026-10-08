import { RoomBannedUsersComposer, RoomDataParser, RoomSettingsDataEvent, SaveRoomSettingsComposer } from '@nitrots/nitro-renderer';
import { FC, useState } from 'react';
import { DEFAULT_ROOM_PERMISSIONS, IRoomData, IRoomPermissions, LocalizeText, RegisterRoomSettingsMessages, RoomSettingsPermissionsEvent, RoomSettingsPermissionsRequestComposer, RoomSettingsPermissionsSaveComposer, SendMessageComposer } from '../../../../api';
import { NitroCardContentView, NitroCardHeaderView, NitroCardTabsItemView, NitroCardTabsView, NitroCardView } from '../../../../common';
import { useMessageEvent } from '../../../../hooks';
import { NavigatorRoomSettingsAccessTabView } from './NavigatorRoomSettingsAccessTabView';
import { NavigatorRoomSettingsBasicTabView } from './NavigatorRoomSettingsBasicTabView';
import { NavigatorRoomSettingsModTabView } from './NavigatorRoomSettingsModTabView';
import { NavigatorRoomSettingsPermissionsTabView } from './NavigatorRoomSettingsPermissionsTabView';
import { NavigatorRoomSettingsRightsTabView } from './NavigatorRoomSettingsRightsTabView';
import { NavigatorRoomSettingsSkinTabView } from './NavigatorRoomSettingsSkinTabView';
import { NavigatorRoomSettingsVipChatTabView } from './NavigatorRoomSettingsVipChatTabView';

const TABS: string[] = [
    'navigator.roomsettings.tab.1',
    'navigator.roomsettings.tab.2',
    'navigator.roomsettings.tab.3',
    'navigator.roomsettings.tab.4',
    'navigator.roomsettings.tab.5',
    'Settings',
    'Appearance'
];

const PERMISSION_FIELDS: Record<string, keyof IRoomPermissions> = {
    can_enable: 'canEnable', can_handitem: 'canHanditem', can_fastwalk: 'canFastwalk', can_moonwalk: 'canMoonwalk', pushmode: 'pushmode', can_transform: 'canTransform',
    can_sit: 'canSit', can_lay: 'canLay', can_giveitem: 'canGiveitem', can_danse: 'canDanse', can_sign: 'canSign', can_greet: 'canGreet', can_laugh: 'canLaugh',
    can_kiss: 'canKiss', can_afk: 'canAfk', can_jump: 'canJump', can_thumb_up: 'canThumbUp', can_change_look: 'canChangeLook', show_bubble: 'showBubble',
    diagonal_mode: 'diagonalMode', set_speed: 'setSpeed'
};

export const NavigatorRoomSettingsView: FC<{}> = props =>
{
    const [ roomData, setRoomData ] = useState<IRoomData>(null);
    const [ currentTab, setCurrentTab ] = useState(TABS[0]);

    // Registered in the body, before useMessageEvent subscribes, so the reply's header is already known.
    RegisterRoomSettingsMessages();

    useMessageEvent<RoomSettingsPermissionsEvent>(RoomSettingsPermissionsEvent, event =>
    {
        const parser = event.getParser();

        if(!parser) return;

        setRoomData(prevValue => (prevValue && (prevValue.roomId === parser.roomId)) ? { ...prevValue, permissions: parser.permissions } : prevValue);
    });

    useMessageEvent<RoomSettingsDataEvent>(RoomSettingsDataEvent, event =>
    {
        const parser = event.getParser();

        if(!parser) return;

        const data = parser.data;

        setRoomData({
            roomId: data.roomId,
            roomName: data.name,
            roomDescription: data.description,
            categoryId: data.categoryId,
            userCount: data.maximumVisitorsLimit,
            tags: data.tags,
            tradeState: data.tradeMode,
            allowWalkthrough: data.allowWalkThrough,
            lockState: data.doorMode,
            password: null,
            allowPets: data.allowPets,
            allowPetsEat: data.allowFoodConsume,
            hideWalls: data.hideWalls,
            wallThickness: data.wallThickness,
            floorThickness: data.floorThickness,
            chatSettings: {
                mode: data.chatSettings.mode,
                weight: data.chatSettings.weight,
                speed: data.chatSettings.speed,
                distance: data.chatSettings.distance,
                protection: data.chatSettings.protection
            },
            moderationSettings: {
                allowMute: data.roomModerationSettings.allowMute,
                allowKick: data.roomModerationSettings.allowKick,
                allowBan: data.roomModerationSettings.allowBan
            },
            permissions: { ...DEFAULT_ROOM_PERMISSIONS }
        });

        SendMessageComposer(new RoomBannedUsersComposer(data.roomId));
        SendMessageComposer(new RoomSettingsPermissionsRequestComposer(data.roomId));
    });

    const onClose = () =>
    {
        setRoomData(null);
        setCurrentTab(TABS[0]);
    }

    const handleChange = (field: string, value: string | number | boolean | string[]) =>
    {
        const permissionKey = PERMISSION_FIELDS[field];

        if(permissionKey)
        {
            setRoomData(prevValue =>
            {
                const permissions = { ...prevValue.permissions, [permissionKey]: (typeof value === 'boolean') ? value : Number(value) } as IRoomPermissions;

                SendMessageComposer(new RoomSettingsPermissionsSaveComposer(prevValue.roomId, permissions));

                return { ...prevValue, permissions };
            });

            return;
        }

        setRoomData(prevValue =>
        {
            const newValue = { ...prevValue };

            switch(field)
            {
                case 'name':
                    newValue.roomName = String(value);
                    break;
                case 'description':
                    newValue.roomDescription = String(value);
                    break;
                case 'category':
                    newValue.categoryId = Number(value);
                    break;
                case 'max_visitors':
                    newValue.userCount = Number(value);
                    break;
                case 'trade_state':
                    newValue.tradeState = Number(value);
                    break;
                case 'tags':
                    newValue.tags = value as Array<string>;
                    break;
                case 'allow_walkthrough':
                    newValue.allowWalkthrough = Boolean(value);
                    break;
                case 'allow_pets':
                    newValue.allowPets = Boolean(value);
                    break;
                case 'allow_pets_eat':
                    newValue.allowPetsEat = Boolean(value);
                    break;
                case 'hide_walls':
                    newValue.hideWalls = Boolean(value);
                    break;
                case 'wall_thickness':
                    newValue.wallThickness = Number(value);
                    break;
                case 'floor_thickness':
                    newValue.floorThickness = Number(value);
                    break;
                case 'lock_state':
                    newValue.lockState = Number(value);
                    break;
                case 'password':
                    newValue.lockState = RoomDataParser.PASSWORD_STATE;
                    newValue.password = String(value);
                    break;
                case 'moderation_mute':
                    newValue.moderationSettings.allowMute = Number(value);
                    break;
                case 'moderation_kick':
                    newValue.moderationSettings.allowKick = Number(value);
                    break;
                case 'moderation_ban':
                    newValue.moderationSettings.allowBan = Number(value);
                    break;
                case 'bubble_mode':
                    newValue.chatSettings.mode = Number(value);
                    break;
                case 'chat_weight':
                    newValue.chatSettings.weight = Number(value);
                    break;
                case 'bubble_speed':
                    newValue.chatSettings.speed = Number(value);
                    break;
                case 'flood_protection':
                    newValue.chatSettings.protection = Number(value);
                    break;
                case 'chat_distance':
                    newValue.chatSettings.distance = Number(value);
                    break;
            }

            SendMessageComposer(
                new SaveRoomSettingsComposer(
                    newValue.roomId,
                    newValue.roomName,
                    newValue.roomDescription,
                    newValue.lockState,
                    newValue.password,
                    newValue.userCount,
                    newValue.categoryId,
                    newValue.tags.length,
                    newValue.tags,
                    newValue.tradeState,
                    newValue.allowPets,
                    newValue.allowPetsEat,
                    newValue.allowWalkthrough,
                    newValue.hideWalls,
                    newValue.wallThickness,
                    newValue.floorThickness,
                    newValue.moderationSettings.allowMute,
                    newValue.moderationSettings.allowKick,
                    newValue.moderationSettings.allowBan,
                    newValue.chatSettings.mode,
                    newValue.chatSettings.weight,
                    newValue.chatSettings.speed,
                    newValue.chatSettings.distance,
                    newValue.chatSettings.protection
                ));

            return newValue;
        });
    }

    if(!roomData) return null;

    return (
        <NitroCardView uniqueKey="nitro-room-settings" className="nitro-room-settings" overflow="hidden">
            <NitroCardHeaderView headerText={ LocalizeText('navigator.roomsettings') } onCloseClick={ onClose } />
            <NitroCardContentView>
                { /* HabboCity: the tab row is the first child INSIDE .content-area-inner, not a sibling of the content area. */ }
                <NitroCardTabsView>
                    { TABS.map(tab =>
                    {
                        return <NitroCardTabsItemView key={ tab } isActive={ (currentTab === tab) } onClick={ event => setCurrentTab(tab) }>{ LocalizeText(tab) }</NitroCardTabsItemView>
                    }) }
                </NitroCardTabsView>
                { (currentTab === TABS[0]) &&
                    <NavigatorRoomSettingsBasicTabView roomData={ roomData } handleChange={ handleChange } onClose={ onClose } /> }
                { (currentTab === TABS[1]) &&
                    <NavigatorRoomSettingsAccessTabView roomData={ roomData } handleChange={ handleChange } /> }
                { (currentTab === TABS[2]) &&
                    <NavigatorRoomSettingsRightsTabView roomData={ roomData } handleChange={ handleChange } /> }
                { (currentTab === TABS[3]) &&
                    <NavigatorRoomSettingsVipChatTabView roomData={ roomData } handleChange={ handleChange } /> }
                { (currentTab === TABS[4]) &&
                    <NavigatorRoomSettingsModTabView roomData={ roomData } handleChange={ handleChange } /> }
                { (currentTab === TABS[5]) &&
                    <NavigatorRoomSettingsPermissionsTabView roomData={ roomData } handleChange={ handleChange } /> }
                { (currentTab === TABS[6]) &&
                    <NavigatorRoomSettingsSkinTabView roomData={ roomData } handleChange={ handleChange } /> }
            </NitroCardContentView>
        </NitroCardView>
    );
};
