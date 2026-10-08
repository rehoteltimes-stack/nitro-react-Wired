import { FC } from 'react';
import { IShopAuraVisual } from '../../api/shop/ShopProtocol';
import { ShopRoomPreview } from './ShopRoomPreview';

/** The player's own avatar wearing an aura, standing in a small room (floor and walls like the catalog preview). */
export const ShopAuraPreview: FC<{ aura: IShopAuraVisual, height: number, direction?: number }> = ({ aura = null, height = 120, direction = 4 }) =>
    <ShopRoomPreview aura={ aura } height={ height } direction={ direction } />;
