import { FC, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FaTrash } from 'react-icons/fa';
import { LocalizeBadgeDescription, LocalizeBadgeName, LocalizeText, UnseenItemCategory } from '../../../../api';
import { AutoGrid, Button, Column, Flex, Grid, LayoutBadgeImageView, LayoutBadgeRackView, Text } from '../../../../common';
import { useInventoryBadges, useInventoryUnseenTracker } from '../../../../hooks';
import { InventoryBadgeItemView } from './InventoryBadgeItemView';
import { InventoryBadgeSearchView } from './InventoryBadgeSearchView';

export interface InventoryBadgeViewProps
{
    // Real reference: the search bar is a full-width sibling ABOVE the tabs - see InventoryView.tsx's own
    // comment for the real DOM position and why a portal is used.
    searchSlot?: HTMLDivElement;
}

export const InventoryBadgeView: FC<InventoryBadgeViewProps> = props =>
{
    const { searchSlot = null } = props;
    const [ isVisible, setIsVisible ] = useState(false);
    const [ filteredBadgeCodes, setFilteredBadgeCodes ] = useState<string[]>([]);
    const { badgeCodes = [], activeBadgeSlots = [], selectedBadgeCode = null, isWearingBadge = null, canWearBadges = null, toggleBadgeAtSlot = null, getBadgeId = null, activate = null, deactivate = null } = useInventoryBadges();
    const { isUnseen = null, removeUnseen = null } = useInventoryUnseenTracker();

    // Real, previously-missing feature: this project had no search bar at all for Badges - confirmed live on the
    // reference's own Badges tab (21 real owned badges) that typing genuinely filters the grid, not decorative.
    useEffect(() =>
    {
        setFilteredBadgeCodes(badgeCodes);
    }, [ badgeCodes ]);

    useEffect(() =>
    {
        if(!selectedBadgeCode || !isUnseen(UnseenItemCategory.BADGE, getBadgeId(selectedBadgeCode))) return;

        removeUnseen(UnseenItemCategory.BADGE, getBadgeId(selectedBadgeCode));
    }, [ selectedBadgeCode, isUnseen, removeUnseen, getBadgeId ]);

    useEffect(() =>
    {
        if(!isVisible) return;

        const id = activate();

        return () => deactivate(id);
    }, [ isVisible, activate, deactivate ]);

    useEffect(() =>
    {
        setIsVisible(true);

        return () => setIsVisible(false);
    }, []);

    // Real reference: the Wear/Remove button (and a real, icon-only trash-can .btn-danger.btn-sm beside it) is
    // NOT nested inside the right preview column - it's a separate, full-width footer row below the whole Grid,
    // confirmed live via bounding-rect capture (button width 455px, near the card's own full 528px width, not
    // the ~200px the right column alone would give it) - same real structural pattern already fixed for
    // Furniture's own footer, and already correct from the start in Banners'. Trash icon's real function IS now
    // understood (found in the minified jy hook: removeBadge() splices the badge out of badgeCodes entirely and
    // sends a discard composer) but still left unwired - no equivalent composer exists anywhere in this
    // project's own vendored @nitrots/nitro-renderer package (checked every outgoing inventory/badges composer),
    // so wiring a fake local-only "delete" would just desync from the server on next reload.

    // Real reference mechanism (confirmed via the minified jy/ED sources, not guessed): badges live in FIXED,
    // individually-addressable slots (activeBadgeSlots), not a compacting append/remove list - dragging a badge
    // from the main grid onto a slot (or off the rack entirely) is the real wear/remove interaction, and the
    // main grid does NOT filter worn badges out at all (confirmed live: a worn badge stays visible there too,
    // just also shown "active" in the rack). The Wear/Remove button computes the badge's own current slot
    // itself rather than calling the simple toggleBadge used by double-click.
    const onSlotDrop = (slotIndex: number, droppedBadgeCode: string) => toggleBadgeAtSlot(slotIndex, droppedBadgeCode);

    // Dragging a worn badge off the rack entirely (dropped somewhere that isn't a valid drop target) unequips
    // it - confirmed live against the reference by dragging a rack badge out and releasing it over empty space.
    const onBadgeDragEnd = (slotIndex: number, badgeCode: string, dropEffect: string) =>
    {
        if(dropEffect === 'none') toggleBadgeAtSlot(slotIndex, badgeCode);
    }

    const onWearRemoveClick = () =>
    {
        if(!selectedBadgeCode) return;

        if(isWearingBadge(selectedBadgeCode))
        {
            const currentSlot = activeBadgeSlots.indexOf(selectedBadgeCode);

            if(currentSlot !== -1) toggleBadgeAtSlot(currentSlot, selectedBadgeCode);
        }
        else
        {
            const emptySlot = activeBadgeSlots.indexOf('');

            if(emptySlot !== -1) toggleBadgeAtSlot(emptySlot, selectedBadgeCode);
        }
    }

    return (
        <>
            { searchSlot && createPortal(<InventoryBadgeSearchView badgeCodes={ badgeCodes } setBadgeCodes={ setFilteredBadgeCodes } />, searchSlot) }
            { /* grow, not fullHeight: flex child of content-area-inner alongside the search bar, tabs, and the
                 footer button row below - h-100 ignores those siblings' own real space and overflows/pushes the
                 footer out, flex-grow-1 correctly fills only what's left after them. */ }
            <Column grow overflow="hidden">
                <Grid fullHeight overflow="hidden">
                    <Column size={ 7 } overflow="hidden">
                        <AutoGrid columnCount={ 4 }>
                            { /* Real reference: worn badges stay in the main grid too (confirmed live - a worn
                                 badge is still listed there, just also shown as "active" in the rack via the
                                 same shared selectedBadgeCode) - it is never filtered out. */ }
                            { filteredBadgeCodes && (filteredBadgeCodes.length > 0) && filteredBadgeCodes.map((badgeCode, index) => <InventoryBadgeItemView key={ index } badgeCode={ badgeCode } />) }
                        </AutoGrid>
                    </Column>
                    { /* Real reference structure, re-verified live against the actual reference (not the earlier,
                         wrong assumption of a separate "Active badges" heading + grid section, which doesn't
                         exist there at all - confirmed: no such heading text anywhere in the reference's own
                         Badges tab). The right column is instead a single centered row: a compact worn-badges
                         slot rack (.badge-layout, real classname) beside the SELECTED badge's own icon + name +
                         DESCRIPTION (LocalizeBadgeDescription - a real, already-existing function in this
                         project's own api/utils that was never actually rendered anywhere before this).
                         The rack's own real row arrangement, re-verified via a deep DOM dump (not a plain
                         uniform grid, per the user's own catch that the first version looked like "a different
                         grid"): slot 1 gets its OWN row together with a group-badge companion icon (0x0/collapsed
                         when that badge has no group counterpart - LayoutBadgeImageView's own isGroup variant
                         naturally renders nothing when getGroupBadgeImage() has nothing to return), then slots
                         2-7 render as 3 rows of 2 - matching 1+6=7, the real maxBadgeCount confirmed via the
                         live ui-config.json comparison (was wrongly 5 in this project before that fix). */ }
                    <Column justifyContent="center" size={ 5 } overflow="auto">
                        { !!selectedBadgeCode &&
                            <Flex gap={ 2 } alignItems="center">
                                { /* Real reference structure (confirmed via the minified ql/jy sources): the rack
                                     reuses the SAME draggable grid-item component as the main grid for every
                                     slot (not a bare image) - real drag-and-drop wear/swap/remove, not just a
                                     click target. Each slot is individually addressable (activeBadgeSlots[i]),
                                     so removing badge #3 leaves a real gap instead of shifting #4-7 down. Now
                                     shared with the User Profile's own read-only rack via LayoutBadgeRackView. */ }
                                <LayoutBadgeRackView badgeCodes={ activeBadgeSlots } canDragAndDrop onSlotDrop={ onSlotDrop } onBadgeDragEnd={ onBadgeDragEnd }
                                    renderBadge={ (badgeCode, slotIndex) => <InventoryBadgeItemView badgeCode={ badgeCode } style={ { width: 42, height: 42 } } onDragEnd={ event => onBadgeDragEnd(slotIndex, badgeCode, event.dataTransfer.dropEffect) } /> } />

                                <Column gap={ 2 } alignItems="center">
                                    <LayoutBadgeImageView shrink badgeCode={ selectedBadgeCode } />
                                    <Text bold center>{ LocalizeBadgeName(selectedBadgeCode) }</Text>
                                    <Text center small>{ LocalizeBadgeDescription(selectedBadgeCode) }</Text>
                                </Column>
                            </Flex> }
                    </Column>
                </Grid>
            </Column>

            { !!selectedBadgeCode &&
                <Flex fullWidth gap={ 1 }>
                    <Button fullWidth grow variant={ (isWearingBadge(selectedBadgeCode) ? 'danger' : 'success') } disabled={ !isWearingBadge(selectedBadgeCode) && !canWearBadges() } onClick={ onWearRemoveClick }>
                        { LocalizeText(isWearingBadge(selectedBadgeCode) ? 'inventory.badges.clearbadge' : 'inventory.badges.wearbadge') }
                    </Button>
                    <Button variant="danger">
                        <FaTrash className="fa-icon" />
                    </Button>
                </Flex> }
        </>
    );
}
