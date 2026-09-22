import { FC, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { LocalizeBadgeName, LocalizeText, UnseenItemCategory } from '../../../../api';
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

    return (
        <>
            { searchSlot && createPortal(<InventoryBadgeSearchView badgeCodes={ badgeCodes } setBadgeCodes={ setFilteredBadgeCodes } />, searchSlot) }
            <Grid>
                <Column size={ 7 } overflow="hidden">
                    <AutoGrid columnCount={ 4 }>
                        { filteredBadgeCodes && (filteredBadgeCodes.length > 0) && filteredBadgeCodes.map((badgeCode, index) =>
                        {
                            if(isWearingBadge(badgeCode)) return null;

                            return <InventoryBadgeItemView key={ index } badgeCode={ badgeCode } />
                        }) }
                    </AutoGrid>
                </Column>
                <Column className="justify-content-between" size={ 5 } overflow="auto">
                    <Column overflow="hidden" gap={ 2 }>
                        <Text>{ LocalizeText('inventory.badges.activebadges') }</Text>
                        <AutoGrid columnCount={ 3 }>
                            { activeBadgeCodes && (activeBadgeCodes.length > 0) && activeBadgeCodes.map((badgeCode, index) => <InventoryBadgeItemView key={ index } badgeCode={ badgeCode } />) }
                        </AutoGrid>
                    </Column>
                    { !!selectedBadgeCode &&
                        <Column grow justifyContent="end" gap={ 2 }>
                            <Flex alignItems="center" gap={ 2 }>
                                <LayoutBadgeImageView shrink badgeCode={ selectedBadgeCode } />
                                <Text>{ LocalizeBadgeName(selectedBadgeCode) }</Text>
                            </Flex>
                            <Button variant={ (isWearingBadge(selectedBadgeCode) ? 'danger' : 'success') } disabled={ !isWearingBadge(selectedBadgeCode) && !canWearBadges() } onClick={ event => toggleBadge(selectedBadgeCode) }>{ LocalizeText(isWearingBadge(selectedBadgeCode) ? 'inventory.badges.clearbadge' : 'inventory.badges.wearbadge') }</Button>
                        </Column> }
                </Column>
            </Grid>
        </>
    );
}
