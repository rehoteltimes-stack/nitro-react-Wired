import { CSSProperties, FC } from 'react';
import { IShopBorderVisual } from '../../api/shop/ShopProtocol';

/**
 * Draws a border around its positioned parent (an infostand, or the shop's preview box): a 9-slice border-image
 * (mode slice) or one stretched image (mode stretch), on a box grown by the border's box_* offsets.
 */
// scale: draws the frame smaller around a smaller box (the profile's avatar stand is 198px tall, the room infostand the
// frames are made for is taller): the edge widths and the box offsets shrink, the image slices stay the same.
// outset: the parent's own border width (the profile stand has a 4px border; absolute children are placed against its
// padding box, so without this the stand's border shows past the frame's right edge).
// centered: split the horizontal overhang evenly (the box offsets are made for the room infostand, which has a column on
// the left the profile stand doesn't have, so there the frame would sit off to the left).
export const ShopBorderFrame: FC<{ border: IShopBorderVisual, baseUrl: string, scale?: number, outset?: number, centered?: boolean }> = ({ border, baseUrl, scale = 1, outset = 0, centered = false }) =>
{
    if(!border || !border.frame) return null;

    const url = (baseUrl || '') + border.frame;
    const side = (border.boxLeft + border.boxRight) / 2;
    const left = (centered ? side : border.boxLeft) * scale - outset, top = border.boxTop * scale - outset, right = (centered ? side : border.boxRight) * scale - outset, bottom = border.boxBottom * scale - outset;
    const box: CSSProperties = { position: 'absolute', left, top, right, bottom, pointerEvents: 'none', zIndex: 14 };

    if(border.mode === 'stretch')
    {
        return <img className="shop-border-frame" src={ url } alt="" aria-hidden="true" draggable={ false } style={ { ...box, width: `calc(100% - ${ left + right }px)`, height: `calc(100% - ${ top + bottom }px)`, objectFit: 'fill' } } />;
    }

    const widths = (border.slice || '0 0 0 0').split(/\s+/).map(value => `${ (Number(value) || 0) * scale }px`).join(' ');

    return <div className="shop-border-frame" aria-hidden="true" style={ { ...box, boxSizing: 'border-box', borderStyle: 'solid', borderWidth: widths, borderImageSource: `url(${ url })`, borderImageSlice: border.slice, borderImageWidth: widths, borderImageRepeat: 'repeat' } } />;
}
