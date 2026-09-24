import { ILinkEventTracker, RemoveFriendComposer, SendRoomInviteComposer } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { AddEventLinkTracker, LocalizeText, MessengerFriend, RemoveLinkEventTracker, SendMessageComposer } from '../../../../api';
import { Button, Flex, NitroCardContentView, NitroCardHeaderView, NitroCardTabsItemView, NitroCardTabsView, NitroCardView, ScrollContainer, SearchBar } from '../../../../common';
import { useFriends } from '../../../../hooks';
import { FriendsListGroupView } from './friends-list-group/FriendsListGroupView';
import { FriendsListRequestView } from './friends-list-request/FriendsListRequestView';
import { FriendsSearchView } from './FriendsListSearchView';
import { FriendsRemoveConfirmationView } from './FriendsListRemoveConfirmationView';
import { FriendsRoomInviteView } from './FriendsListRoomInviteView';

// Real reference structure ("Amis" window), corrected after finding this file used a fundamentally
// different mechanism than the reference - an accordion of expandable sections - while the real
// window is a top search bar (the same shared holo-main-search-bar-input-element primitive already
// used elsewhere, this project's own SearchBar) plus 4 real tabs (En ligne/Hors ligne/Requêtes/
// Rechercher, `nitro-card-tabs small`) sharing one content area below. Confirmed live and via the
// minified source (its own tab index switch: 0=online, 1=offline, 2=requests, 3=search) - the
// Online/Offline tabs share the SAME search bar value to filter the existing list by name, while the
// Search tab uses that same value to look up NEW people to add (two different real behaviors for the
// one shared input, not independent searches). Real root theme is `theme-primary-slim`
// (this file previously had a non-existent `theme="friends"`) with `resize="both"` (confirmed via
// the live `.resize-handler` present on the reference's own window).
export const FriendsListView: FC<{}> = props =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const [ activeTab, setActiveTab ] = useState(0);
    const [ searchValue, setSearchValue ] = useState('');
    const [ selectedFriendsIds, setSelectedFriendsIds ] = useState<number[]>([]);
    const [ showRoomInvite, setShowRoomInvite ] = useState<boolean>(false);
    const [ showRemoveFriendsConfirmation, setShowRemoveFriendsConfirmation ] = useState<boolean>(false);
    const { onlineFriends = [], offlineFriends = [], requests = [], requestFriend = null } = useFriends();

    const filteredOnlineFriends = useMemo(() => ((!searchValue || !searchValue.length) ? onlineFriends : onlineFriends.filter(friend => friend.name.toLowerCase().includes(searchValue.toLowerCase()))), [ onlineFriends, searchValue ]);
    const filteredOfflineFriends = useMemo(() => ((!searchValue || !searchValue.length) ? offlineFriends : offlineFriends.filter(friend => friend.name.toLowerCase().includes(searchValue.toLowerCase()))), [ offlineFriends, searchValue ]);

    const removeFriendsText = useMemo(() =>
    {
        if(!selectedFriendsIds || !selectedFriendsIds.length) return '';

        const userNames: string[] = [];

        for(const userId of selectedFriendsIds)
        {
            let existingFriend: MessengerFriend = onlineFriends.find(f => f.id === userId);

            if(!existingFriend) existingFriend = offlineFriends.find(f => f.id === userId);

            if(!existingFriend) continue;

            userNames.push(existingFriend.name);
        }

        return LocalizeText('friendlist.removefriendconfirm.userlist', [ 'user_names' ], [ userNames.join(', ') ]);
    }, [ offlineFriends, onlineFriends, selectedFriendsIds ]);

    const selectFriend = useCallback((userId: number) =>
    {
        if(userId < 0) return;

        setSelectedFriendsIds(prevValue =>
        {
            const newValue = [ ...prevValue ];

            const existingUserIdIndex: number = newValue.indexOf(userId);

            if(existingUserIdIndex > -1)
            {
                newValue.splice(existingUserIdIndex, 1)
            }
            else
            {
                newValue.push(userId);
            }

            return newValue;
        });
    }, [ setSelectedFriendsIds ]);

    const sendRoomInvite = (message: string) =>
    {
        if(!selectedFriendsIds.length || !message || !message.length || (message.length > 255)) return;

        SendMessageComposer(new SendRoomInviteComposer(message, selectedFriendsIds));

        setShowRoomInvite(false);
    }

    const removeSelectedFriends = () =>
    {
        if(selectedFriendsIds.length === 0) return;

        setSelectedFriendsIds(prevValue =>
        {
            SendMessageComposer(new RemoveFriendComposer(...prevValue));

            return [];
        });

        setShowRemoveFriendsConfirmation(false);
    }

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
                    case 'request':
                        if(parts.length < 4) return;

                        requestFriend(parseInt(parts[2]), parts[3]);
                }
            },
            eventUrlPrefix: 'friends/'
        };

        AddEventLinkTracker(linkTracker);

        return () => RemoveLinkEventTracker(linkTracker);
    }, [ requestFriend ]);

    if(!isVisible) return null;

    return (
        <>
            <NitroCardView className="nitro-friends" uniqueKey="nitro-friends" theme="primary-slim" resize="both">
                <NitroCardHeaderView headerText={ LocalizeText('friendlist.friends') } onCloseClick={ event => setIsVisible(false) } />
                <NitroCardContentView overflow="hidden" gap={ 2 }>
                    <SearchBar iconClass="icon-friendall" color="var(--holo-friends-color-theme-primary)" value={ searchValue } onChange={ event => setSearchValue(event.target.value) } />
                    <NitroCardTabsView small>
                        <NitroCardTabsItemView isActive={ (activeTab === 0) } onClick={ () => setActiveTab(0) }>{ LocalizeText('friendlist.friends') }</NitroCardTabsItemView>
                        <NitroCardTabsItemView isActive={ (activeTab === 1) } onClick={ () => setActiveTab(1) }>{ LocalizeText('friendlist.friends.offlinecaption') }</NitroCardTabsItemView>
                        <NitroCardTabsItemView isActive={ (activeTab === 2) } onClick={ () => setActiveTab(2) }>{ LocalizeText('friendlist.tab.friendrequests') }</NitroCardTabsItemView>
                        <NitroCardTabsItemView isActive={ (activeTab === 3) } onClick={ () => setActiveTab(3) }>{ LocalizeText('people.search.title') }</NitroCardTabsItemView>
                    </NitroCardTabsView>
                    { (activeTab === 0) &&
                        <ScrollContainer>
                            <FriendsListGroupView list={ filteredOnlineFriends } selectedFriendsIds={ selectedFriendsIds } selectFriend={ selectFriend } />
                        </ScrollContainer> }
                    { (activeTab === 1) &&
                        <ScrollContainer>
                            <FriendsListGroupView list={ filteredOfflineFriends } selectedFriendsIds={ selectedFriendsIds } selectFriend={ selectFriend } />
                        </ScrollContainer> }
                    { (activeTab === 2) &&
                        <FriendsListRequestView requests={ requests } /> }
                    { (activeTab === 3) &&
                        <FriendsSearchView searchValue={ searchValue } /> }
                    { selectedFriendsIds && (selectedFriendsIds.length > 0) && (activeTab < 2) &&
                        <Flex shrink gap={ 1 } className="p-1">
                            <Button fullWidth onClick={ () => setShowRoomInvite(true) }>{ LocalizeText('friendlist.tip.invite') }</Button>
                            <Button fullWidth variant="danger" onClick={ event => setShowRemoveFriendsConfirmation(true) }>{ LocalizeText('generic.delete') }</Button>
                        </Flex> }
                </NitroCardContentView>
            </NitroCardView>
            { showRoomInvite &&
                <FriendsRoomInviteView selectedFriendsIds={ selectedFriendsIds } onCloseClick={ () => setShowRoomInvite(false) } sendRoomInvite={ sendRoomInvite } /> }
            { showRemoveFriendsConfirmation &&
                <FriendsRemoveConfirmationView selectedFriendsIds={ selectedFriendsIds } removeFriendsText={ removeFriendsText } onCloseClick={ () => setShowRemoveFriendsConfirmation(false) } removeSelectedFriends={ removeSelectedFriends } /> }
        </>
    );
};
