import { RoomId, RoomObjectCategory, RoomObjectVariable, RoomPreviewer } from '@nitrots/nitro-renderer';
import { FC, ReactNode, useEffect, useRef, useState } from 'react';
import { GetRoomEngine, GetSessionDataManager } from '../../api';
import { RememberAuraVisual } from '../../api/shop/ShopAuras';
import { IShopAuraVisual } from '../../api/shop/ShopProtocol';
import { LayoutRoomPreviewerView } from '../../common';

/** Where the avatar is inside the preview, in the preview's own pixels: its feet (anchor) and its head (top of its image). */
// The preview room is always plain white (floor + wall), never the room the player is in.
const PREVIEW_FLOOR = '307';
const PREVIEW_WALL = '307';
const PREVIEW_LANDSCAPE = '1.1';

export interface IShopAvatarSpot { x: number, y: number, top: number }

interface Props
{
    height: number;
    aura?: IShopAuraVisual;          // an aura to wear in the preview (null = none)
    direction?: number;
    children?: (spot: IShopAvatarSpot) => ReactNode;   // things drawn over the avatar (spawn animation, name tag)
}

// The player's own avatar standing in a small white room (like the catalog / inventory previews).
export const ShopRoomPreview: FC<Props> = props =>
{
    const { height = 150, aura = null, direction = 4, children = null } = props;
    const [ previewId ] = useState(() => ++RoomPreviewer.PREVIEW_COUNTER);
    const [ previewer ] = useState(() => new RoomPreviewer(GetRoomEngine(), previewId));
    const [ spot, setSpot ] = useState<IShopAvatarSpot>(null);
    const holder = useRef<HTMLDivElement>(null);

    useEffect(() =>
    {
        previewer.reset(false);
        previewer.updateRoomWallsAndFloorVisibility(true, true);
        previewer.updateObjectRoom(PREVIEW_FLOOR, PREVIEW_WALL, PREVIEW_LANDSCAPE);
        previewer.addAvatarIntoRoom(GetSessionDataManager().figure, 0);

        // the avatar exists in the preview room only after this tick
        const timer = setTimeout(() =>
        {
            previewer.updateAvatarDirection(direction, direction);

            if(aura) RememberAuraVisual(aura);

            previewer.updateObjectUserAction(RoomObjectVariable.FIGURE_AURA, (aura ? aura.id : 0));
        }, 0);

        return () => clearTimeout(timer);
    }, [ previewer, aura, direction ]);

    // follow the avatar on the preview canvas (feet + head), only while something is drawn over it
    useEffect(() =>
    {
        if(!children) return;

        let frame = 0;

        const follow = () =>
        {
            const engine = GetRoomEngine();
            const roomId = RoomId.makeRoomPreviewerId(previewId);
            const point = engine.getRoomObjectScreenLocation(roomId, RoomPreviewer.PREVIEW_OBJECT_ID, RoomObjectCategory.UNIT, RoomPreviewer.PREVIEW_CANVAS_ID);
            const rect = engine.getRoomObjectBoundingRectangle(roomId, RoomPreviewer.PREVIEW_OBJECT_ID, RoomObjectCategory.UNIT, RoomPreviewer.PREVIEW_CANVAS_ID);

            if(point && rect)
            {
                const next = { x: Math.round(point.x), y: Math.round(point.y), top: Math.round(rect.y) };

                setSpot(prev => ((prev && (prev.x === next.x) && (prev.y === next.y) && (prev.top === next.top)) ? prev : next));
            }

            frame = requestAnimationFrame(follow);
        }

        follow();

        return () => cancelAnimationFrame(frame);
    }, [ previewId, children ]);

    useEffect(() => () => previewer.dispose(), [ previewer ]);

    return (
        <div ref={ holder } className="shop-room-preview">
            <LayoutRoomPreviewerView roomPreviewer={ previewer } height={ height } />
            { children && spot && <div className="shop-room-preview-overlay">{ children(spot) }</div> }
        </div>
    );
}
