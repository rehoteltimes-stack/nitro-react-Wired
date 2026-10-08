import { FlatControllerAddedEvent, FlatControllerRemovedEvent, FlatControllersEvent, RemoveAllRightsMessageComposer, RoomGiveRightsComposer, RoomTakeRightsComposer, RoomUsersWithRightsComposer } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { GetRoomSession, IRoomData, LocalizeText, SendMessageComposer } from '../../../../api';
import { Button, Column, Flex, ScrollContainer, Text, UserProfileIconView } from '../../../../common';
import { useFriends, useMessageEvent } from '../../../../hooks';

interface NavigatorRoomSettingsTabViewProps
{
    roomData: IRoomData;
    handleChange: (field: string, value: string | number | boolean) => void;
}

export const NavigatorRoomSettingsRightsTabView: FC<NavigatorRoomSettingsTabViewProps> = props =>
{
    const { roomData = null } = props;
    const [ usersWithRights, setUsersWithRights ] = useState<Map<number, string>>(new Map());
    const [ rightsSearch, setRightsSearch ] = useState('');
    const [ friendSearch, setFriendSearch ] = useState('');
    const { friends = [] } = useFriends();

    useMessageEvent<FlatControllersEvent>(FlatControllersEvent, event =>
    {
        const parser = event.getParser();

        if(!roomData || (roomData.roomId !== parser.roomId)) return;

        setUsersWithRights(parser.users);
    });

    useMessageEvent<FlatControllerAddedEvent>(FlatControllerAddedEvent, event =>
    {
        const parser = event.getParser();

        if(!roomData || (roomData.roomId !== parser.roomId)) return;

        setUsersWithRights(prevValue =>
        {
            const newValue = new Map(prevValue);

            newValue.set(parser.data.userId, parser.data.userName);

            return newValue;
        });
    });

    useMessageEvent<FlatControllerRemovedEvent>(FlatControllerRemovedEvent, event =>
    {
        const parser = event.getParser();

        if(!roomData || (roomData.roomId !== parser.roomId)) return;

        setUsersWithRights(prevValue =>
        {
            const newValue = new Map(prevValue);

            newValue.delete(parser.userId);

            return newValue;
        });
    });

    useEffect(() =>
    {
        SendMessageComposer(new RoomUsersWithRightsComposer(roomData.roomId));
    }, [ roomData.roomId ]);

    const candidates = friends.filter(friend => (friend.id !== -1) && !usersWithRights.has(friend.id));
    const shownFriends = friendSearch ? candidates.filter(friend => friend.name.toLowerCase().includes(friendSearch.toLowerCase())) : candidates;
    const shownRights = Array.from(usersWithRights.entries()).filter(([ , name ]) => !rightsSearch || name.toLowerCase().includes(rightsSearch.toLowerCase()));

    const addByName = () =>
    {
        const name = friendSearch.trim().toLowerCase();

        if(!name) return;

        const friend = candidates.find(entry => (entry.name.toLowerCase() === name));
        const roomUser = GetRoomSession()?.userDataManager.getUserDataByName(friendSearch.trim());
        const id = friend?.id ?? roomUser?.webID;

        if(id) SendMessageComposer(new RoomGiveRightsComposer(id));

        setFriendSearch('');
    }

    return (
        <Column>
            <Flex gap={ 2 }>
                <Column fullWidth>
                    <Text bold truncate variant="muted" textTransform="uppercase">
                        { LocalizeText('navigator.flatctrls.userswithrights', [ 'displayed', 'total' ], [ shownRights.length.toString(), usersWithRights.size.toString() ]) }
                    </Text>
                    <input type="text" className="form-control form-control-sm" placeholder={ LocalizeText('generic.search') } value={ rightsSearch } onChange={ event => setRightsSearch(event.target.value) } />
                    <Flex overflow="hidden" className="rounded list-container p-2">
                        <ScrollContainer fullWidth fullHeight gap={ 1 }>
                            { shownRights.map(([ id, name ]) => (
                                <Flex key={ id } shrink alignItems="center" gap={ 1 } overflow="hidden">
                                    <UserProfileIconView userId={ id } />
                                    <Text pointer grow onClick={ () => SendMessageComposer(new RoomTakeRightsComposer(id)) }> { name }</Text>
                                </Flex>
                            )) }
                        </ScrollContainer>
                    </Flex>
                </Column>
                <Column fullWidth>
                    <Text bold truncate variant="muted" textTransform="uppercase">
                        { LocalizeText('navigator.flatctrls.friends', [ 'displayed', 'total' ], [ shownFriends.length.toString(), candidates.length.toString() ]) }
                    </Text>
                    <Flex gap={ 1 }>
                        <input type="text" className="form-control form-control-sm" placeholder={ LocalizeText('generic.search') } value={ friendSearch } onChange={ event => setFriendSearch(event.target.value) } />
                        <Button title="Add user" onClick={ addByName }>Add</Button>
                    </Flex>
                    <Flex overflow="hidden" className="rounded list-container p-2">
                        <ScrollContainer fullWidth fullHeight gap={ 1 }>
                            { shownFriends.map(friend => (
                                <Flex key={ friend.id } shrink alignItems="center" gap={ 1 } overflow="hidden">
                                    <UserProfileIconView userId={ friend.id } />
                                    <Text pointer grow onClick={ () => SendMessageComposer(new RoomGiveRightsComposer(friend.id)) }> { friend.name }</Text>
                                </Flex>
                            )) }
                        </ScrollContainer>
                    </Flex>
                </Column>
            </Flex>
            <Button variant="danger" disabled={ !usersWithRights.size } onClick={ () => SendMessageComposer(new RemoveAllRightsMessageComposer(roomData.roomId)) }>
                { LocalizeText('navigator.flatctrls.clear') }
            </Button>
        </Column>
    );
}
