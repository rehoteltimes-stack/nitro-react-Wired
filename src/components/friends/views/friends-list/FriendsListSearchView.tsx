import { HabboSearchComposer, HabboSearchResultData, HabboSearchResultEvent } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { LocalizeText, OpenMessengerChat, SendMessageComposer } from '../../../../api';
import { Base, Column, Flex, ScrollContainer, Text, UserProfileIconView } from '../../../../common';
import { useFriends, useMessageEvent } from '../../../../hooks';

interface FriendsSearchViewProps
{
    searchValue: string;
}

// Real reference tab ("Rechercher"): uses the SAME top search bar value as the Online/Offline tabs
// (confirmed live in the minified bundle - this tab's own component takes `searchValue` as a prop,
// not its own independent input state) to search for NEW people to add, not to filter the existing
// friends list - this file previously had its own separate, duplicate search input instead of
// reusing the shared one, and wrapped everything in the accordion shell removed from the rest of
// this feature in the same pass.
export const FriendsSearchView: FC<FriendsSearchViewProps> = props =>
{
    const { searchValue } = props;
    const [ friendResults, setFriendResults ] = useState<HabboSearchResultData[]>(null);
    const [ otherResults, setOtherResults ] = useState<HabboSearchResultData[]>(null);
    const { canRequestFriend = null, requestFriend = null } = useFriends();

    useMessageEvent<HabboSearchResultEvent>(HabboSearchResultEvent, event =>
    {
        const parser = event.getParser();

        setFriendResults(parser.friends);
        setOtherResults(parser.others);
    });

    useEffect(() =>
    {
        if(!searchValue || !searchValue.length) return;

        const timeout = setTimeout(() =>
        {
            if(!searchValue || !searchValue.length) return;

            SendMessageComposer(new HabboSearchComposer(searchValue));
        }, 500);

        return () => clearTimeout(timeout);
    }, [ searchValue ]);

    return (
        <ScrollContainer>
            <Column gap={ 0 }>
                { friendResults &&
                    <>
                        { (friendResults.length === 0) &&
                            <Text bold small className="px-2 py-1">{ LocalizeText('friendlist.search.nofriendsfound') }</Text> }
                        { (friendResults.length > 0) &&
                            <Column gap={ 0 }>
                                <Text bold small className="px-2 py-1">{ LocalizeText('friendlist.search.friendscaption', [ 'cnt' ], [ friendResults.length.toString() ]) }</Text>
                                <hr className="mx-2 mt-0 mb-1 text-black" />
                                <Column gap={ 0 }>
                                    { friendResults.map(result =>
                                    {
                                        return (
                                            <Flex key={ result.avatarId } justifyContent="between" className="nitro-friend-list-entry px-2 py-1">
                                                <Flex alignItems="center" gap={ 1 }>
                                                    <UserProfileIconView userId={ result.avatarId } />
                                                    <div>{ result.avatarName }</div>
                                                </Flex>
                                                <Flex alignItems="center" gap={ 1 }>
                                                    { result.isAvatarOnline &&
                                                    <Base className="nitro-friends-spritesheet icon-chat cursor-pointer" onClick={ event => OpenMessengerChat(result.avatarId) } title={ LocalizeText('friendlist.tip.im') } /> }
                                                </Flex>
                                            </Flex>
                                        )
                                    }) }
                                </Column>
                            </Column> }
                    </> }
                { otherResults &&
                    <>
                        { (otherResults.length === 0) &&
                            <Text bold small className="px-2 py-1">{ LocalizeText('friendlist.search.noothersfound') }</Text> }
                        { (otherResults.length > 0) &&
                            <Column gap={ 0 }>
                                <Text bold small className="px-2 py-1">{ LocalizeText('friendlist.search.otherscaption', [ 'cnt' ], [ otherResults.length.toString() ]) }</Text>
                                <hr className="mx-2 mt-0 mb-1 text-black" />
                                <Column gap={ 0 }>
                                    { otherResults.map(result =>
                                    {
                                        return (
                                            <Flex key={ result.avatarId } justifyContent="between" className="nitro-friend-list-entry px-2 py-1">
                                                <Flex alignItems="center" gap={ 1 }>
                                                    <UserProfileIconView userId={ result.avatarId } />
                                                    <div>{ result.avatarName }</div>
                                                </Flex>
                                                <Flex alignItems="center" gap={ 1 }>
                                                    { canRequestFriend(result.avatarId) &&
                                                    <Base className="nitro-friends-spritesheet icon-add cursor-pointer" onClick={ event => requestFriend(result.avatarId, result.avatarName) } title={ LocalizeText('friendlist.tip.addfriend') } /> }
                                                </Flex>
                                            </Flex>
                                        )
                                    }) }
                                </Column>
                            </Column> }
                    </> }
            </Column>
        </ScrollContainer>
    );
}
