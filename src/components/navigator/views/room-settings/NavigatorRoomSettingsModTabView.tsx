import { BannedUserData, BannedUsersFromRoomEvent, RoomBannedUsersComposer, RoomModerationSettings, RoomUnbanUserComposer } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { IRoomData, LocalizeText, SendMessageComposer } from '../../../../api';
import { Button, Column, CustomSelect, Flex, ScrollContainer, Text, UserProfileIconView } from '../../../../common';
import { useMessageEvent } from '../../../../hooks';

interface NavigatorRoomSettingsTabViewProps
{
    roomData: IRoomData;
    handleChange: (field: string, value: string | number | boolean) => void;
}

export const NavigatorRoomSettingsModTabView: FC<NavigatorRoomSettingsTabViewProps> = props =>
{
    const { roomData = null, handleChange = null } = props;
    const [ selectedUserId, setSelectedUserId ] = useState<number>(-1);
    const [ bannedUsers, setBannedUsers ] = useState<BannedUserData[]>([]);
    const [ search, setSearch ] = useState('');

    const unBanUser = (userId: number) =>
    {
        setBannedUsers(prevValue => prevValue.filter(value => (value.userId !== userId)));
        SendMessageComposer(new RoomUnbanUserComposer(userId, roomData.roomId));
        setSelectedUserId(-1);
    }

    useMessageEvent<BannedUsersFromRoomEvent>(BannedUsersFromRoomEvent, event =>
    {
        const parser = event.getParser();

        if(!roomData || (roomData.roomId !== parser.roomId)) return;

        setBannedUsers(parser.bannedUsers);
    });

    useEffect(() =>
    {
        SendMessageComposer(new RoomBannedUsersComposer(roomData.roomId));
    }, [ roomData.roomId ]);

    const shown = search ? bannedUsers.filter(user => user.userName.toLowerCase().includes(search.toLowerCase())) : bannedUsers;
    const none = { value: RoomModerationSettings.MODERATION_LEVEL_NONE, text: LocalizeText('navigator.roomsettings.moderation.none') };
    const rights = { value: RoomModerationSettings.MODERATION_LEVEL_USER_WITH_RIGHTS, text: LocalizeText('navigator.roomsettings.moderation.rights') };
    const all = { value: RoomModerationSettings.MODERATION_LEVEL_ALL, text: LocalizeText('navigator.roomsettings.moderation.all') };

    return (
        <Flex gap={ 2 } fullWidth>
            <Column fullWidth>
                <Text bold textTransform="uppercase" variant="muted">{ LocalizeText('navigator.roomsettings.moderation.banned.users') } ({ bannedUsers.length })</Text>
                <input type="text" className="form-control form-control-sm" placeholder={ LocalizeText('generic.search') } value={ search } onChange={ event => setSearch(event.target.value) } />
                <Flex className="rounded list-container p-2">
                    <ScrollContainer fullWidth fullHeight gap={ 1 }>
                        { shown.map((user, index) => (
                            <Flex key={ index } shrink alignItems="center" gap={ 1 } overflow="hidden">
                                <UserProfileIconView userName={ user.userName } />
                                <Text pointer grow onClick={ () => setSelectedUserId(user.userId) }> { user.userName }</Text>
                            </Flex>
                        )) }
                    </ScrollContainer>
                </Flex>
                <Button disabled={ (selectedUserId <= 0) } onClick={ () => unBanUser(selectedUserId) }>
                    { LocalizeText('navigator.roomsettings.moderation.unban') } { selectedUserId > 0 && bannedUsers.find(user => (user.userId === selectedUserId))?.userName }
                </Button>
            </Column>
            <Column fullWidth justifyContent="between">
                <Text bold textTransform="uppercase" variant="muted">Moderation options:</Text>
                <Column gap={ 1 }>
                    <Text>{ LocalizeText('navigator.roomsettings.moderation.mute.header') }</Text>
                    <CustomSelect fullWidth value={ roomData.moderationSettings.allowMute } onChange={ value => handleChange('moderation_mute', value) } items={ [ none, rights ] } noInvalid />
                </Column>
                <Column gap={ 1 }>
                    <Text>{ LocalizeText('navigator.roomsettings.moderation.kick.header') }</Text>
                    <CustomSelect fullWidth value={ roomData.moderationSettings.allowKick } onChange={ value => handleChange('moderation_kick', value) } items={ [ none, rights, all ] } noInvalid />
                </Column>
                <Column gap={ 1 }>
                    <Text>{ LocalizeText('navigator.roomsettings.moderation.ban.header') }</Text>
                    <CustomSelect fullWidth value={ roomData.moderationSettings.allowBan } onChange={ value => handleChange('moderation_ban', value) } items={ [ none, rights ] } noInvalid />
                </Column>
            </Column>
        </Flex>
    );
}
