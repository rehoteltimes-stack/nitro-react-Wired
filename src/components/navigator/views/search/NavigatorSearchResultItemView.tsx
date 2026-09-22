import { RoomDataParser } from '@nitrots/nitro-renderer';
import { FC } from 'react';
import { VisitNavigatorRoom } from '../../../../api';
import { Column, Flex, LayoutBadgeImageView, LayoutGridItemProps, LayoutRoomThumbnailView, Text } from '../../../../common';
import { useNavigator } from '../../../../hooks';
import { NavigatorSearchResultItemInfoView } from './NavigatorSearchResultItemInfoView';

export interface NavigatorSearchResultItemViewProps extends LayoutGridItemProps
{
    roomData: RoomDataParser;
    thumbnail?: boolean;
}

const DOOR_ICON: { [ doorMode: number ]: string } = {
    [ RoomDataParser.DOORBELL_STATE ]: 'locked',
    [ RoomDataParser.PASSWORD_STATE ]: 'password',
    [ RoomDataParser.INVISIBLE_STATE ]: 'invisible',
    [ RoomDataParser.NOOB_STATE ]: 'rank'
};

export const NavigatorSearchResultItemView: FC<NavigatorSearchResultItemViewProps> = props =>
{
    const { roomData = null, children = null, thumbnail = false, ...rest } = props;
    const { setDoorData = null } = useNavigator();

    const getUserCounterColor = () =>
    {
        const percent = (100 * (roomData.userCount / roomData.maxUserCount));

        if(percent >= 92) return 'bg-danger';
        if(percent >= 50) return 'bg-warning';
        if(percent > 0) return 'bg-success';

        return 'bg-primary';
    }

    const visitRoom = () => VisitNavigatorRoom(roomData, setDoorData);

    if(thumbnail) return (
        <Column pointer overflow="hidden" alignItems="center" onClick={ visitRoom } gap={ 0 } className="navigator-item small flex-column" { ...rest }>
            <LayoutRoomThumbnailView roomId={ roomData.roomId } customUrl={ roomData.officialRoomPicRef } className="d-flex flex-column align-items-center justify-content-end mb-1">
                { (roomData.habboGroupId > 0) && <LayoutBadgeImageView badgeCode={ roomData.groupBadgeCode } isGroup={ true } className="position-absolute top-0 start-0 m-1" /> }
                <Flex center className={ `badge p-1 position-absolute m-1 ${ getUserCounterColor() }` }>{ roomData.userCount }</Flex>
                { (roomData.doorMode !== RoomDataParser.OPEN_STATE) &&
                    <i className={ `position-absolute end-0 mb-1 me-1 icon icon-navigator-room-${ DOOR_ICON[roomData.doorMode] ?? '' }` } /> }
            </LayoutRoomThumbnailView>
            <Flex fullHeight fullWidth alignItems="center">
                <Text center textBreak className="flex-grow-1 navigator-item-text">{ roomData.roomName }</Text>
            </Flex>
            { children }
        </Column>
    );

    return (
        <Flex pointer overflow="hidden" alignItems="center" onClick={ visitRoom } gap={ 2 } className="navigator-item px-2 py-1 small" { ...rest }>
            <Flex center className={ `badge p-1 ${ getUserCounterColor() }` } gap={ 1 }>{ roomData.userCount }</Flex>
            <Text truncate grow className="navigator-item-text">{ roomData.roomName }</Text>
            <Flex reverse alignItems="center" gap={ 1 }>
                <NavigatorSearchResultItemInfoView roomData={ roomData } />
                { (roomData.habboGroupId > 0) && <i className="icon icon-navigator-room-group" /> }
                { (roomData.doorMode !== RoomDataParser.OPEN_STATE) &&
                    <i className={ `icon icon-navigator-room-${ DOOR_ICON[roomData.doorMode] ?? '' }` } /> }
            </Flex>
            { children }
        </Flex>
    );
}
