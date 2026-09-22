import { MouseEventType } from '@nitrots/nitro-renderer';
import { FC, useEffect, useRef, useState } from 'react';
import { GetUserProfile, LocalizeText, MessengerFriend, OpenMessengerChat } from '../../../../api';
import { Base, Flex, LayoutAvatarImageView, LayoutBadgeImageView, Text } from '../../../../common';
import { useFriends } from '../../../../hooks';

export const FriendBarItemView: FC<{ friend: MessengerFriend }> = props =>
{
    const { friend = null } = props;
    const [ isVisible, setVisible ] = useState(false);
    const { followFriend = null } = useFriends();
    const elementRef = useRef<HTMLDivElement>();

    useEffect(() =>
    {
        const onClick = (event: MouseEvent) =>
        {
            const element = elementRef.current;

            if(element && (event.target !== element) && !element.contains((event.target as Node))) setVisible(false);
        }

        document.addEventListener(MouseEventType.MOUSE_CLICK, onClick);

        return () => document.removeEventListener(MouseEventType.MOUSE_CLICK, onClick);
    }, []);

    if(!friend)
    {
        return (
            <div ref={ elementRef } className="btn custom-color friend-bar-item navigation-item-2 friend-bar-search">
                <div className="friend-bar-item-head position-absolute" />
                <Text truncate textTransform="none">{ LocalizeText('friend.bar.find.title') }</Text>
            </div>
        );
    }

    return (
        <div ref={ elementRef } className={ 'btn custom-color friend-bar-item navigation-item-2 ' + (isVisible ? 'friend-bar-item-active' : '') } onClick={ event => setVisible(prevValue => !prevValue) }>
            <div className={ `friend-bar-item-head position-absolute ${ (friend.id > 0) ? 'avatar' : 'group' }` }>
                { (friend.id > 0) && <LayoutAvatarImageView headOnly={ !isVisible } figure={ friend.figure } direction={ 2 } /> }
                { (friend.id <= 0) && <LayoutBadgeImageView isGroup={ true } badgeCode={ friend.figure } /> }
            </div>
            <Flex className="friend-item-name" alignItems="center">
                <Text truncate textTransform="none">{ friend.name }</Text>
            </Flex>
            { isVisible &&
                <div className="d-flex justify-content-between icon-friendbar-container">
                    <Base className="nitro-friends-spritesheet icon-friendbar-element icon-friendbar-chat cursor-pointer" onClick={ event => OpenMessengerChat(friend.id) } />
                    { friend.followingAllowed &&
                        <Base className="nitro-friends-spritesheet icon-friendbar-element icon-friendbar-visit cursor-pointer" onClick={ event => followFriend(friend) } /> }
                    <Base className="nitro-friends-spritesheet icon-friendbar-element icon-profile cursor-pointer" onClick={ event => GetUserProfile(friend.id) } />
                </div> }
        </div>
    );
}
