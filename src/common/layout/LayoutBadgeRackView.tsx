import { CSSProperties, DragEvent, FC, ReactNode } from 'react';
import { Column, Flex } from '..';
import { LayoutBadgeImageView } from './LayoutBadgeImageView';

export interface LayoutBadgeRackViewProps
{
    // Index = visual slot (0..maxBadgeCount-1), '' marks an empty slot. Real reference model (ql/jy in the
    // minified source): badges live in fixed, individually-addressable slots, not a compacting list - the
    // caller is responsible for padding/positioning this array, this component only ever renders it.
    badgeCodes: string[];
    maxBadgeCount?: number;
    showInfo?: boolean;
    childStyle?: CSSProperties;
    // Drag-and-drop is opt-in (Inventory's own rack is interactive; the read-only profile/infostand racks
    // never pass these) - matches the reference's own canDragAndDrop prop on ql exactly.
    canDragAndDrop?: boolean;
    onSlotDrop?: (slotIndex: number, droppedBadgeCode: string) => void;
    onBadgeDragEnd?: (slotIndex: number, badgeCode: string, dropEffect: string) => void;
    // Real reference: the rack reuses the SAME grid-item component the main inventory grid uses for each
    // occupied slot (draggable, selectable), not a bare image - callers that need that (Inventory) override
    // this; callers that only need a plain read-only icon (Profile, infostand) leave it default.
    renderBadge?: (badgeCode: string, slotIndex: number) => ReactNode;
}

const DEFAULT_CHILD_STYLE: CSSProperties = { width: 42, height: 42 };

export const LayoutBadgeRackView: FC<LayoutBadgeRackViewProps> = props =>
{
    const { badgeCodes = [], maxBadgeCount = 7, showInfo = false, childStyle = DEFAULT_CHILD_STYLE, canDragAndDrop = false, onSlotDrop = null, onBadgeDragEnd = null, renderBadge = null } = props;

    const onSlotDragOver = (event: DragEvent) =>
    {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
    }

    const onDrop = (slotIndex: number) => (event: DragEvent) =>
    {
        event.preventDefault();
        event.stopPropagation();

        const droppedBadgeCode = event.dataTransfer.getData('application/badge-code');

        if(!droppedBadgeCode || (badgeCodes[slotIndex] === droppedBadgeCode) || !onSlotDrop) return;

        onSlotDrop(slotIndex, droppedBadgeCode);
    }

    const onDragEnd = (slotIndex: number, badgeCode: string) => (event: DragEvent) =>
    {
        if(onBadgeDragEnd) onBadgeDragEnd(slotIndex, badgeCode, event.dataTransfer.dropEffect);
    }

    const renderSlot = (slotIndex: number) =>
    {
        const badgeCode = (badgeCodes[slotIndex] || null);

        return (
            <div key={ slotIndex } className="badge-image" style={ childStyle } onDragOver={ canDragAndDrop ? onSlotDragOver : null } onDrop={ canDragAndDrop ? onDrop(slotIndex) : null }>
                { badgeCode && (renderBadge
                    ? renderBadge(badgeCode, slotIndex)
                    // Real reference passes a static `direction` prop to gate tooltip side - our own
                    // LayoutBadgeImageView already computes that dynamically from the element's own
                    // bounding rect (more robust, no prop needed for it).
                    : <LayoutBadgeImageView badgeCode={ badgeCode } showInfo={ showInfo } style={ childStyle } onDragEnd={ canDragAndDrop ? onDragEnd(slotIndex, badgeCode) : null } />) }
            </div>
        );
    }

    return (
        <Column gap={ 1 } alignItems="start" classNames={ [ 'badge-layout' ] } onDragOver={ canDragAndDrop ? onSlotDragOver : null } onDrop={ canDragAndDrop ? (event => { event.preventDefault(); event.stopPropagation(); }) : null }>
            { /* Real reference: this specific rack (both Inventory's own and the profile's) hardcodes an empty
                 group companion slot - neither our own useInventoryBadges hook nor UserCurrentBadgesParser
                 carries real group-badge data for this rack (confirmed: only the infostand's own separate
                 favorite-group field does, via a different real packet) - flagged, not guessed at. */ }
            <Flex gap={ 1 } alignItems="end">
                { renderSlot(0) }
                <div className="badge-image group-badge-image" />
            </Flex>
            { Array.from({ length: Math.max(0, Math.floor((maxBadgeCount - 1) / 2)) }, (_, i) => (1 + (i * 2))).map(rowStart =>
                <Flex key={ rowStart } gap={ 1 } alignItems="center" justifyContent="center">
                    { renderSlot(rowStart) }
                    { renderSlot(rowStart + 1) }
                </Flex>
            ) }
        </Column>
    );
}
