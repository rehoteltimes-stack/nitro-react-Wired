import { DragEvent, FC, PropsWithChildren } from 'react';
import { UnseenItemCategory } from '../../../../api';
import { LayoutBadgeImageView, LayoutGridItem, LayoutGridItemProps } from '../../../../common';
import { useInventoryBadges, useInventoryUnseenTracker } from '../../../../hooks';

export interface InventoryBadgeItemViewProps extends Omit<LayoutGridItemProps, 'onDoubleClick'>
{
    badgeCode: string;
}

export const InventoryBadgeItemView: FC<PropsWithChildren<InventoryBadgeItemViewProps>> = props =>
{
    const { badgeCode = null, children = null, ...rest } = props;
    const { selectedBadgeCode = null, setSelectedBadgeCode = null, toggleBadge = null, getBadgeId = null } = useInventoryBadges();
    const { isUnseen = null } = useInventoryUnseenTracker();
    const unseen = isUnseen(UnseenItemCategory.BADGE, getBadgeId(badgeCode));

    // Real reference: this exact component (not a bare LayoutBadgeImageView) is reused for BOTH the main grid
    // AND the worn-badge rack slots (confirmed live: rack items carry the same draggable .layout-grid-item
    // markup/behavior as the main grid, just at a smaller size) - draggable + onDragStart belong here so both
    // callers get real drag-and-drop for free, matching the reference's own single shared component.
    const onDragStart = (event: DragEvent) =>
    {
        if(!badgeCode) return;

        event.dataTransfer.setData('application/badge-code', badgeCode);
        event.dataTransfer.effectAllowed = 'copy';
    }

    return (
        <LayoutGridItem draggable itemActive={ (selectedBadgeCode === badgeCode) } itemUnseen={ unseen } onMouseDown={ event => setSelectedBadgeCode(badgeCode) } onDoubleClick={ event => toggleBadge(selectedBadgeCode) } onDragStart={ onDragStart } { ...rest }>
            <LayoutBadgeImageView badgeCode={ badgeCode } />
            { children }
        </LayoutGridItem>
    );
}