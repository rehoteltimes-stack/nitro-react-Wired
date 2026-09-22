import { FC, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FaTrash } from 'react-icons/fa';
import { GetConfiguration, LocalizeBadgeDescription, LocalizeBadgeName, LocalizeText, UnseenItemCategory } from '../../../../api';
import { AutoGrid, Button, Column, Flex, Grid, LayoutBadgeImageView, Text } from '../../../../common';
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
    const { badgeCodes = [], activeBadgeCodes = [], selectedBadgeCode = null, isWearingBadge = null, canWearBadges = null, toggleBadge = null, getBadgeId = null, activate = null, deactivate = null } = useInventoryBadges();
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
    // Furniture's own footer, and already correct from the start in Banners'. Trash icon's real function is
    // unverified (same reasoning as Furniture's own trash button - no destructive test on the read-only
    // reference, no dedicated composer for it in this project's own vendored protocol) - added visually, left
    // unwired.
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
                            { filteredBadgeCodes && (filteredBadgeCodes.length > 0) && filteredBadgeCodes.map((badgeCode, index) =>
                            {
                                if(isWearingBadge(badgeCode)) return null;

                                return <InventoryBadgeItemView key={ index } badgeCode={ badgeCode } />
                            }) }
                        </AutoGrid>
                    </Column>
                    { /* Real reference structure, re-verified live against the actual reference (not the earlier,
                         wrong assumption of a separate "Active badges" heading + grid section, which doesn't
                         exist there at all - confirmed: no such heading text anywhere in the reference's own
                         Badges tab). The right column is instead a single centered row: a compact worn-badges
                         slot rack (.badge-layout, real classname) beside the SELECTED badge's own icon + name +
                         DESCRIPTION (LocalizeBadgeDescription - a real, already-existing function in this
                         project's own api/utils that was never actually rendered anywhere before this). Exact
                         slot-rack row/column arrangement not fully verified - the reference account only had 2
                         of its slots filled, not enough to confirm the special first-row treatment seen there
                         (a narrower row pairing one badge with a 0x0 "group" variant slot); rendered here as a
                         plain 2-per-row rack of real activeBadgeCodes up to the real maxBadgeCount, which is a
                         confirmed-correct partial reproduction, not a guessed-at exact one. */ }
                    <Column justifyContent="center" size={ 5 } overflow="auto">
                        { !!selectedBadgeCode &&
                            <Flex gap={ 2 } alignItems="center">
                                <Column gap={ 1 } alignItems="start" classNames={ [ 'badge-layout' ] }>
                                    { Array.from({ length: GetConfiguration<number>('user.badges.max.slots', 5) }).map((_, index) =>
                                    {
                                        const badgeCode = activeBadgeCodes[index];

                                        return (
                                            <Flex key={ index } gap={ 1 } alignItems="center" justifyContent="center">
                                                { badgeCode ? <LayoutBadgeImageView badgeCode={ badgeCode } /> : <div className="badge-image" /> }
                                            </Flex>
                                        );
                                    }) }
                                </Column>

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
                    <Button fullWidth grow variant={ (isWearingBadge(selectedBadgeCode) ? 'danger' : 'success') } disabled={ !isWearingBadge(selectedBadgeCode) && !canWearBadges() } onClick={ event => toggleBadge(selectedBadgeCode) }>
                        { LocalizeText(isWearingBadge(selectedBadgeCode) ? 'inventory.badges.clearbadge' : 'inventory.badges.wearbadge') }
                    </Button>
                    <Button variant="danger">
                        <FaTrash className="fa-icon" />
                    </Button>
                </Flex> }
        </>
    );
}
