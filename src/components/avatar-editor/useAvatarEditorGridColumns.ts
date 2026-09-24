import { RefObject, useEffect, useState } from 'react';

// Real reference constant (traced through the live minified source): both the figure-set and palette-set grids
// use fixed 40x40px items (.avatar-editor-figure-set-item / .avatar-editor-palette-set-item, confirmed in
// _32-nitro-avatar.scss) with a real 3.75px margin on each side - 47.5px total footprint per item - and compute
// how many fit per row via `Math.floor(container.offsetWidth / 47.5)` on every resize, rather than a CSS-grid
// auto-fill (which was rounding differently - 7 columns at 32px instead of the real 5 at 40px) or a plain
// flex-wrap (which wraps one item early here, since 5 real items' summed footprint is a few px wider than the
// container - the reference's own JS division doesn't care about that slight overflow, a flex-wrap layout does).
const ITEM_FOOTPRINT = 47.5;

// This grid always renders inside a ScrollContainer (see AvatarEditorPaletteSetView/AvatarEditorFigureSetView),
// whose own CSS grid carves a 6px scrollbar column + 8px gap out of the width this hook actually measures
// (the .scroll-content cell, not the ScrollContainer's own full width). The reference's real column count came
// out one higher than a plain `offsetWidth / 47.5` here reproduces (4 instead of 5 in a since-confirmed
// 232.75px content cell) - because its own equivalent ref measures the wider, not-yet-split container. Adding
// the same 14px back (6 + 8, both fixed, real ScrollContainer constants - not a guessed fudge factor) matches
// the reference's real 5-column result exactly.
const SCROLLBAR_GUTTER_COMPENSATION = 14;

export function useAvatarEditorGridColumns(elementRef: RefObject<HTMLElement>): number
{
    const [ columnCount, setColumnCount ] = useState(1);

    useEffect(() =>
    {
        const element = elementRef.current;

        if(!element) return;

        const update = () => setColumnCount(Math.max(1, Math.floor((element.offsetWidth + SCROLLBAR_GUTTER_COMPENSATION) / ITEM_FOOTPRINT)));

        update();

        const resizeObserver = new ResizeObserver(update);

        resizeObserver.observe(element);

        return () => resizeObserver.disconnect();
    }, [ elementRef ]);

    return columnCount;
}
