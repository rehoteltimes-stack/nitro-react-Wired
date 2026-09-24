import { FC, useEffect, useState } from 'react';
import { AvatarEditorGridColorItem, GetConfiguration } from '../../../../api';
import { LayoutCurrencyIcon, LayoutGridItem, LayoutGridItemProps } from '../../../../common';

export interface AvatarEditorPaletteSetItemProps extends LayoutGridItemProps
{
    colorItem: AvatarEditorGridColorItem;
}

export const AvatarEditorPaletteSetItem: FC<AvatarEditorPaletteSetItemProps> = props =>
{
    const { colorItem = null, children = null, ...rest } = props;
    const [ updateId, setUpdateId ] = useState(-1);

    const hcDisabled = GetConfiguration<boolean>('hc.disabled', false);

    useEffect(() =>
    {
        const rerender = () => setUpdateId(prevValue => (prevValue + 1));

        colorItem.notify = rerender;

        return () => colorItem.notify = null;
    }, [ colorItem ]);

    // Real reference CSS (_32-nitro-avatar.scss) fixes this at 40x40px with margin-based spacing
    // (`.avatar-editor-palette-set-item{width:40px;height:40px;margin:...}`) - without this exact classname
    // these items fell back to AutoGrid's own CSS-grid auto-fill sizing instead (7 columns at 32px each vs
    // the reference's real 5 columns at 40px each, confirmed via CDP row/column counts on both sides).
    return (
        <LayoutGridItem { ...rest } itemHighlight itemColor={ colorItem.color } itemActive={ colorItem.isSelected } className="clear-bg" classNames={ [ 'avatar-editor-palette-set-item' ] }>
            { !hcDisabled && colorItem.isHC && <LayoutCurrencyIcon className="position-absolute end-1 bottom-1" type="hc" /> }
            { children }
        </LayoutGridItem>
    );
}
