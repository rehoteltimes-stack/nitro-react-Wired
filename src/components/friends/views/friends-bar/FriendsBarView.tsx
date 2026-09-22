import { FC, useEffect, useRef, useState } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { MessengerFriend } from '../../../../api';
import { Button, Flex } from '../../../../common';
import { FriendBarItemView } from './FriendBarItemView';

// the bar shows as many friend slots as fit next to the rest of the toolbar (240px each, 1000px reserved)
const getSlotCount = () => Math.floor((window.innerWidth - 1000) / 240);

export const FriendBarView: FC<{ onlineFriends: MessengerFriend[] }> = props =>
{
    const { onlineFriends = null } = props;
    const [ indexOffset, setIndexOffset ] = useState(0);
    const [ slotCount, setSlotCount ] = useState(getSlotCount);
    const elementRef = useRef<HTMLDivElement>();

    useEffect(() =>
    {
        const onResize = () => setSlotCount(getSlotCount());

        window.addEventListener('resize', onResize);

        return () => window.removeEventListener('resize', onResize);
    }, []);

    const maxOffset = (onlineFriends.length - slotCount + 1);

    useEffect(() =>
    {
        if(indexOffset < 0) setIndexOffset(0);
        else if((indexOffset > maxOffset) && (maxOffset > 0)) setIndexOffset(maxOffset);
        else if((maxOffset <= 0) && (indexOffset !== 0)) setIndexOffset(0);
    }, [ indexOffset, maxOffset ]);

    if(slotCount <= 0) return null;

    return (
        <Flex innerRef={ elementRef } alignItems="center" className="friend-bar" gap={ 1 }>
            <Button color="var(--holo-friends-item-color-theme-primary)" className="navigation-item-2" disabled={ (indexOffset <= 0) } onClick={ event => setIndexOffset(indexOffset - slotCount) }>
                <FaChevronLeft />
            </Button>
            { Array.from(Array(slotCount), (e, i) => <FriendBarItemView key={ i } friend={ (onlineFriends[indexOffset + i] || null) } />) }
            <Button color="var(--holo-friends-item-color-theme-primary)" className="navigation-item-2" disabled={ !(((onlineFriends.length + 1) > slotCount) && ((indexOffset + slotCount) <= onlineFriends.length)) } onClick={ event => setIndexOffset(indexOffset + slotCount) }>
                <FaChevronRight />
            </Button>
        </Flex>
    );
}
