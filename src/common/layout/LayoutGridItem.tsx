import { FC, useMemo } from 'react';
import { Base } from '../Base';
import { Column, ColumnProps } from '../Column';
import { LayoutItemCountView } from './LayoutItemCountView';
import { LayoutLimitedEditionStyledNumberView } from './limited-edition';

export interface LayoutGridItemProps extends ColumnProps
{
    itemImage?: string;
    itemColor?: string;
    itemActive?: boolean;
    itemCount?: number;
    itemCountMinimum?: number;
    itemUniqueSoldout?: boolean;
    itemUniqueNumber?: number;
    itemUnseen?: boolean;
    itemHighlight?: boolean;
    disabled?: boolean;
}

export const LayoutGridItem: FC<LayoutGridItemProps> = props =>
{
    const { itemImage = undefined, itemColor = undefined, itemActive = false, itemCount = 1, itemCountMinimum = 1, itemUniqueSoldout = false, itemUniqueNumber = -2, itemUnseen = false, itemHighlight = false, disabled = false, center = true, column = true, style = {}, classNames = [], position = 'relative', overflow = 'hidden', children = null, ...rest } = props;

    const getClassNames = useMemo(() =>
    {
        // Real reference classlist, confirmed live on Inventory's own Badges tab: "layout-grid-item border-2
        // rounded" (base) / "...active" (selected) - NO "border" or "border-muted" utility classes exist there
        // at all. Those two were stock leftovers fighting the already-correctly-ported real rule
        // (.nitro-inventory .layout-grid-item{border-color:var(--holo-primary)} / .active{border-color:
        // var(--holo-inventory-color-theme-primary)}, in _43-nitro-inventory.scss, byte-identical to the
        // reference's own compiled CSS) - Bootstrap's own .border-muted utility color was winning instead,
        // showing a plain gray border always, active or not. Root-caused via computed-style diff (ours read
        // rgb(182,190,197) where the reference read var(--holo-primary)/var(--holo-inventory-color-theme-primary)
        // depending on .active), not assumed. This component is shared with Catalog's own furni grid too -
        // checked first that no .nitro-catalog-scoped override rule exists for .layout-grid-item, so removing
        // these two only lets the correct (transparent-by-default) base rule through there, no regression.
        const newClassNames: string[] = [ 'layout-grid-item', 'border-2', 'rounded' ];

        if(itemActive) newClassNames.push('active');

        if(itemUniqueSoldout || (itemUniqueNumber > 0)) newClassNames.push('unique-item');

        if(itemUniqueSoldout) newClassNames.push('sold-out');

        if(itemUnseen) newClassNames.push('unseen');

        if(itemHighlight) newClassNames.push('has-highlight');

        if(disabled) newClassNames.push('disabled')

        if(itemImage === null) newClassNames.push('icon', 'loading-icon');

        if(classNames.length) newClassNames.push(...classNames);

        return newClassNames;
    }, [ itemActive, itemUniqueSoldout, itemUniqueNumber, itemUnseen, itemHighlight, disabled, itemImage, classNames ]);

    const getStyle = useMemo(() =>
    {
        let newStyle = { ...style };

        if(itemImage && !(itemUniqueSoldout || (itemUniqueNumber > 0))) newStyle.backgroundImage = `url(${ itemImage })`;

        if(itemColor) newStyle.backgroundColor = itemColor;

        if(Object.keys(style).length) newStyle = { ...newStyle, ...style };

        return newStyle;
    }, [ style, itemImage, itemColor, itemUniqueSoldout, itemUniqueNumber ]);

    return (
        <Column center={ center } pointer position={ position } overflow={ overflow } column={ column } classNames={ getClassNames } style={ getStyle } { ...rest }>
            { (itemCount > itemCountMinimum) &&
                <LayoutItemCountView count={ itemCount } /> }
            { (itemUniqueNumber > 0) && 
                <>
                    <Base fit className="unique-bg-override" style={ { backgroundImage: `url(${ itemImage })` } } />
                    <div className="position-absolute bottom-0 unique-item-counter">
                        <LayoutLimitedEditionStyledNumberView value={ itemUniqueNumber } />
                    </div>
                </> }
            { children }
        </Column>
    );
}
