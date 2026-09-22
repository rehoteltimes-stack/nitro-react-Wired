import { FC, useEffect, useRef } from 'react';
import { DispatchMouseEvent, DispatchTouchEvent, GetNitroInstance } from '../../api';
import { Base } from '../../common';
import { useRoom } from '../../hooks';
import { RoomSpectatorView } from './spectator/RoomSpectatorView';
import { RoomWidgetsView } from './widgets/RoomWidgetsView';

export interface RoomViewProps
{
    // Real, minimal safety net - not a replacement for roomSession. useRoom() is a use-between-shared hook: every
    // unrelated state change inside it (room background/filter updates, which fire constantly while a room is
    // actively rendering) re-runs its whole hook body and re-subscribes every one of its own effects, including
    // its RoomSessionEvent.ENDED listener - a real, confirmed gap where that specific listener can miss the real
    // "you left the room" event while MainView's own (plain React, not use-between) listener for the exact same
    // event does not. When that happens, roomSession here never clears, so room-tools/chat-input/the canvas stay
    // visible under the landing view. isInRoom comes from MainView's own landingViewVisible, which is not
    // affected by that race, so it hides this view correctly even on the rare tick roomSession gets stuck.
    isInRoom?: boolean;
}

export const RoomView: FC<RoomViewProps> = props =>
{
    const { isInRoom = false } = props;
    const { roomSession = null } = useRoom();
    const elementRef = useRef<HTMLDivElement>();

    useEffect(() =>
    {
        const canvas = GetNitroInstance().application.renderer.view;

        if(!canvas) return;

        canvas.onclick = event => DispatchMouseEvent(event);
        canvas.onmousemove = event => DispatchMouseEvent(event);
        canvas.onmousedown = event => DispatchMouseEvent(event);
        canvas.onmouseup = event => DispatchMouseEvent(event);

        canvas.ontouchstart = event => DispatchTouchEvent(event);
        canvas.ontouchmove = event => DispatchTouchEvent(event);
        canvas.ontouchend = event => DispatchTouchEvent(event);
        canvas.ontouchcancel = event => DispatchTouchEvent(event);

        const element = elementRef.current;

        if(!element) return;

        element.appendChild(canvas);
    }, []);

    const isVisible = (!!roomSession && isInRoom);

    return (
        <Base fit innerRef={ elementRef } className={ (!isVisible && 'd-none') }>
            { isVisible &&
                <>
                    <RoomWidgetsView />
                    { roomSession.isSpectator && <RoomSpectatorView /> }
                </> }
        </Base>
    );
}
