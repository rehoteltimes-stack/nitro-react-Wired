import { FC, useEffect, useRef, useState } from 'react';
import { AvatarEditorGridPartItem, GetConfiguration } from '../../../../api';
import { LayoutCurrencyIcon, LayoutGridItem, LayoutGridItemProps } from '../../../../common';
import { AvatarEditorIcon } from '../AvatarEditorIcon';

export interface AvatarEditorFigureSetItemViewProps extends LayoutGridItemProps
{
    partItem: AvatarEditorGridPartItem;
}

export const AvatarEditorFigureSetItemView: FC<AvatarEditorFigureSetItemViewProps> = props =>
{
    const { partItem = null, children = null, ...rest } = props;
    const [ updateId, setUpdateId ] = useState(-1);
    const elementRef = useRef<HTMLDivElement>(null);

    const hcDisabled = GetConfiguration<boolean>('hc.disabled', false);

    useEffect(() =>
    {
        const rerender = () => setUpdateId(prevValue => (prevValue + 1));

        partItem.notify = rerender;

        return () => partItem.notify = null;
    }, [ partItem ]);

    useEffect(() =>
    {
        const element = elementRef.current;

        if(!element || !partItem) return;

        const observer = new IntersectionObserver(entries =>
        {
            if(!entries.some(entry => entry.isIntersecting)) return;

            observer.disconnect();
            partItem.init();
        }, { rootMargin: '200px' });

        observer.observe(element);

        return () => observer.disconnect();
    }, [ partItem ]);

    // Real reference CSS (_32-nitro-avatar.scss) fixes this at 40x40px with margin-based spacing
    // (`.avatar-editor-figure-set-item{width:40px;height:40px;margin:...}`) - without this exact classname
    // these items fell back to AutoGrid's own CSS-grid auto-fill sizing instead (7 columns at 32px each vs
    // the reference's real 5 columns at 40px each).
    return (
        <LayoutGridItem { ...rest } innerRef={ elementRef } itemImage={ (partItem.isClear ? undefined : partItem.imageUrl) } itemActive={ partItem.isSelected } classNames={ [ 'avatar-editor-figure-set-item' ] }>
            { !hcDisabled && partItem.isHC && <LayoutCurrencyIcon className="position-absolute end-1 bottom-1" type="hc" /> }
            { partItem.isClear && <AvatarEditorIcon icon="clear" /> }
            { partItem.isSellable && <AvatarEditorIcon icon="sellable" position="absolute" className="end-1 bottom-1" /> }
            { children }
        </LayoutGridItem>
    );
}
