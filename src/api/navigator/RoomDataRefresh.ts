const REFRESH_WINDOW_MS = 5000;

let refreshRoomId = 0;
let refreshAt = 0;

export const ExpectRoomDataRefresh = (roomId: number) =>
{
    refreshRoomId = roomId;
    refreshAt = Date.now();
}

export const IsRoomDataRefresh = (roomId: number) => ((refreshRoomId > 0) && (refreshRoomId === roomId) && ((Date.now() - refreshAt) < REFRESH_WINDOW_MS));

export const EndRoomDataRefresh = () =>
{
    refreshRoomId = 0;
}
