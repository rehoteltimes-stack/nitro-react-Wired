import { IRoomSession, RoomObjectVariable, RoomPreviewer } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { attemptPetPlacement, GetRoomEngine, IPetItem, LocalizeText, UnseenItemCategory } from '../../../../api';
import { AutoGrid, Button, Column, Grid, LayoutRoomPreviewerView, Text } from '../../../../common';
import { useInventoryPets, useInventoryUnseenTracker } from '../../../../hooks';
import { InventoryCategoryEmptyView } from '../InventoryCategoryEmptyView';
import { InventoryPetItemView } from './InventoryPetItemView';
import { InventoryPetSearchView } from './InventoryPetSearchView';

interface InventoryPetViewProps
{
    roomSession: IRoomSession;
    roomPreviewer: RoomPreviewer;
    // Real reference: the search bar is a full-width sibling ABOVE the tabs - see InventoryView.tsx's own
    // comment for the real DOM position and why a portal is used.
    searchSlot?: HTMLDivElement;
}

export const InventoryPetView: FC<InventoryPetViewProps> = props =>
{
    const { roomSession = null, roomPreviewer = null, searchSlot = null } = props;
    const [ isVisible, setIsVisible ] = useState(false);
    const [ filteredPetItems, setFilteredPetItems ] = useState<IPetItem[]>([]);
    const { petItems = null, selectedPet = null, activate = null, deactivate = null } = useInventoryPets();
    const { isUnseen = null, removeUnseen = null } = useInventoryUnseenTracker();

    // Real, previously-missing feature: same real, functional search bar as Furniture/Bots - this project had
    // none at all for Pets. Same filter shape, applied to petData.name.
    useEffect(() =>
    {
        setFilteredPetItems(petItems ?? []);
    }, [ petItems ]);

    useEffect(() =>
    {
        if(!selectedPet || !roomPreviewer) return;

        const petData = selectedPet.petData;
        const roomEngine = GetRoomEngine();

        let wallType = roomEngine.getRoomInstanceVariable<string>(roomEngine.activeRoomId, RoomObjectVariable.ROOM_WALL_TYPE);
        let floorType = roomEngine.getRoomInstanceVariable<string>(roomEngine.activeRoomId, RoomObjectVariable.ROOM_FLOOR_TYPE);
        let landscapeType = roomEngine.getRoomInstanceVariable<string>(roomEngine.activeRoomId, RoomObjectVariable.ROOM_LANDSCAPE_TYPE);

        wallType = (wallType && wallType.length) ? wallType : '101';
        floorType = (floorType && floorType.length) ? floorType : '101';
        landscapeType = (landscapeType && landscapeType.length) ? landscapeType : '1.1';

        roomPreviewer.reset(false);
        roomPreviewer.updateRoomWallsAndFloorVisibility(true, true);
        roomPreviewer.updateObjectRoom(floorType, wallType, landscapeType);
        roomPreviewer.addPetIntoRoom(petData.figureString);
    }, [ roomPreviewer, selectedPet ]);

    useEffect(() =>
    {
        if(!selectedPet || !isUnseen(UnseenItemCategory.PET, selectedPet.petData.id)) return;

        removeUnseen(UnseenItemCategory.PET, selectedPet.petData.id);
    }, [ selectedPet, isUnseen, removeUnseen ]);

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

    // Real reference: the search bar stays visible even with zero owned items - same confirmed behavior as
    // Furniture/Bots' own empty states, so it portals unconditionally before the empty/non-empty branch.
    const searchPortal = searchSlot && createPortal(
        <InventoryPetSearchView petItems={ petItems ?? [] } setPetItems={ setFilteredPetItems } />,
        searchSlot
    );

    if(!petItems || !petItems.length)
    {
        return (
            <>
                { searchPortal }
                <InventoryCategoryEmptyView title={ LocalizeText('inventory.empty.pets.title') } desc={ LocalizeText('inventory.empty.pets.desc') } />
            </>
        );
    }

    return (
        <>
            { searchPortal }
            <Grid>
                <Column size={ 7 } overflow="hidden">
                    <AutoGrid columnCount={ 5 }>
                        { filteredPetItems && (filteredPetItems.length > 0) && filteredPetItems.map(item => <InventoryPetItemView key={ item.petData.id } petItem={ item } />) }
                    </AutoGrid>
                </Column>
                <Column size={ 5 } overflow="auto">
                    <Column overflow="hidden" position="relative">
                        <LayoutRoomPreviewerView roomPreviewer={ roomPreviewer } height={ 140 } />
                    </Column>
                    { selectedPet && selectedPet.petData &&
                        <Column grow justifyContent="between" gap={ 2 }>
                            <Text grow truncate>{ selectedPet.petData.name }</Text>
                            { !!roomSession &&
                                <Button variant="success" onClick={ event => attemptPetPlacement(selectedPet) }>
                                    { LocalizeText('inventory.furni.placetoroom') }
                                </Button> }
                        </Column> }
                </Column>
            </Grid>
        </>
    );
}
