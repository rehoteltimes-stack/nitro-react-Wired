import { RoomDataParser } from '@nitrots/nitro-renderer';
import { Dispatch, SetStateAction } from 'react';
import { CreateRoomSession, GetSessionDataManager } from '../nitro';
import { DoorStateType } from './DoorStateType';
import { TryVisitRoom } from './TryVisitRoom';

// The door/ownership branching every room-visit entry point (search results, "somewhere new", room links) shares:
// own room or a group room enters directly, a doorbell/password room opens the matching NavigatorDoorStateView state.
export function VisitNavigatorRoom(roomData: RoomDataParser, setDoorData: Dispatch<SetStateAction<{ roomInfo: RoomDataParser, state: number }>>): void
{
    if(roomData.ownerId !== GetSessionDataManager().userId)
    {
        if(roomData.habboGroupId !== 0)
        {
            TryVisitRoom(roomData.roomId);

            return;
        }

        const doorState = { [ RoomDataParser.DOORBELL_STATE ]: DoorStateType.START_DOORBELL, [ RoomDataParser.PASSWORD_STATE ]: DoorStateType.START_PASSWORD }[ roomData.doorMode ];

        if(doorState)
        {
            setDoorData(prevValue => ({ ...prevValue, roomInfo: roomData, state: doorState }));

            return;
        }
    }

    CreateRoomSession(roomData.roomId);
}
