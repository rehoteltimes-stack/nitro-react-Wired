import { IRoomSession, RoomObjectVariable, RoomPreviewer, Vector3d } from '@nitrots/nitro-renderer';
import { FC, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { attemptItemPlacement, DispatchUiEvent, FurniCategory, GetRoomEngine, GetSessionDataManager, GroupItem, LocalizeText, UnseenItemCategory } from '../../../../api';
import { AutoGrid, Button, Column, Grid, LayoutLimitedEditionCompactPlateView, LayoutRarityLevelView, LayoutRoomPreviewerView, Text } from '../../../../common';
import { CatalogPostMarketplaceOfferEvent } from '../../../../events';
import { useInventoryFurni, useInventoryUnseenTracker } from '../../../../hooks';
import { InventoryCategoryEmptyView } from '../InventoryCategoryEmptyView';
import { InventoryFurnitureItemView } from './InventoryFurnitureItemView';
import { InventoryFurnitureSearchView } from './InventoryFurnitureSearchView';

interface InventoryFurnitureViewProps
{
    roomSession: IRoomSession;
    roomPreviewer: RoomPreviewer;
    // Real reference: the search bar is a full-width sibling ABOVE the tabs (.content-area-inner's own direct
    // child), not nested inside this tab's own 7-column grid - see InventoryView.tsx's own comment for the real
    // DOM position this was confirmed against and why a portal is used instead of lifting this tab's own filter
    // state up into the shared shell component.
    searchSlot?: HTMLDivElement;
}

const attemptPlaceMarketplaceOffer = (groupItem: GroupItem) =>
{
    const item = groupItem.getLastItem();
    if(!item) return false;
    if(!item.sellable) return false;

    DispatchUiEvent(new CatalogPostMarketplaceOfferEvent(item));
}

export const InventoryFurnitureView: FC<InventoryFurnitureViewProps> = props =>
{
    const { roomSession = null, roomPreviewer = null, searchSlot = null } = props;

    const [ isVisible, setIsVisible ] = useState(false);
    const [ filteredGroupItems, setFilteredGroupItems ] = useState<GroupItem[]>([]);

    const { groupItems: allGroupItems = [], selectedItem = null, activate = null, deactivate = null } = useInventoryFurni();
    const { resetItems = null } = useInventoryUnseenTracker();

    // Real reference has one unified Furniture tab - no separate Rares/Clothing category to route these into, so
    // they're no longer filtered out here (previously excluded for this project's own now-removed Rares/Clothing tabs).
    const groupItems = useMemo(() => allGroupItems.filter(group =>
{
    const item = group.getLastItem();
    if(!item) return false;

    const furniData = GetSessionDataManager().getFloorItemData(item.type);
    if(!furniData) return false;

    return true;
}), [ allGroupItems ]);


    // Sync filteredGroupItems whenever groupItems changes
    useEffect(() =>
    {
        setFilteredGroupItems(groupItems);
    }, [ groupItems ]);

    useEffect(() =>
    {
        if(!selectedItem || !roomPreviewer) return;

        const furnitureItem = selectedItem.getLastItem();
        if(!furnitureItem) return;

        const roomEngine = GetRoomEngine();

        let wallType = roomEngine.getRoomInstanceVariable<string>(roomEngine.activeRoomId, RoomObjectVariable.ROOM_WALL_TYPE);
        let floorType = roomEngine.getRoomInstanceVariable<string>(roomEngine.activeRoomId, RoomObjectVariable.ROOM_FLOOR_TYPE);
        let landscapeType = roomEngine.getRoomInstanceVariable<string>(roomEngine.activeRoomId, RoomObjectVariable.ROOM_LANDSCAPE_TYPE);

        wallType = (wallType && wallType.length) ? wallType : '101';
        floorType = (floorType && floorType.length) ? floorType : '101';
        landscapeType = (landscapeType && landscapeType.length) ? landscapeType : '1.1';

        roomPreviewer.reset(false);
        roomPreviewer.updateObjectRoom(floorType, wallType, landscapeType);
        roomPreviewer.updateRoomWallsAndFloorVisibility(true, true);

        if((furnitureItem.category === FurniCategory.WALL_PAPER) ||
           (furnitureItem.category === FurniCategory.FLOOR) ||
           (furnitureItem.category === FurniCategory.LANDSCAPE))
        {
            floorType = ((furnitureItem.category === FurniCategory.FLOOR) ? selectedItem.stuffData.getLegacyString() : floorType);
            wallType = ((furnitureItem.category === FurniCategory.WALL_PAPER) ? selectedItem.stuffData.getLegacyString() : wallType);
            landscapeType = ((furnitureItem.category === FurniCategory.LANDSCAPE) ? selectedItem.stuffData.getLegacyString() : landscapeType);

            roomPreviewer.updateObjectRoom(floorType, wallType, landscapeType);

            if(furnitureItem.category === FurniCategory.LANDSCAPE)
            {
                const data = GetSessionDataManager().getWallItemDataByName('window_double_default');
                if(data) roomPreviewer.addWallItemIntoRoom(data.id, new Vector3d(90, 0, 0), data.customParams);
            }
        }
        else
        {
            if(selectedItem.isWallItem)
            {
                roomPreviewer.addWallItemIntoRoom(selectedItem.type, new Vector3d(90), furnitureItem.stuffData.getLegacyString());
            }
            else
            {
                roomPreviewer.addFurnitureIntoRoom(selectedItem.type, new Vector3d(90), selectedItem.stuffData, furnitureItem.extra.toString());
            }
        }

    }, [ roomPreviewer, selectedItem ]);

    useEffect(() =>
    {
        if(!selectedItem || !selectedItem.hasUnseenItems) return;

        resetItems(UnseenItemCategory.FURNI, selectedItem.items.map(item => item.id));
        selectedItem.hasUnseenItems = false;

    }, [ selectedItem, resetItems ]);

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

    // Real reference: the search bar stays visible even with zero owned items (confirmed live on the Bots tab,
    // 0 bots owned, real reference still showed the search input above the "Désolé, parti à la pêche!" empty
    // message) - so it portals unconditionally, before the empty/non-empty branch, not only in the non-empty path.
    const searchPortal = searchSlot && createPortal(
        <InventoryFurnitureSearchView groupItems={ groupItems } setGroupItems={ setFilteredGroupItems } />,
        searchSlot
    );

    if(!groupItems.length)
    {
        return (
            <>
                { searchPortal }
                <InventoryCategoryEmptyView title={ LocalizeText('inventory.empty.title') } desc={ LocalizeText('inventory.empty.desc') } />
            </>
        );
    }

    return (
        <>
            { searchPortal }
            <Grid>
                <Column size={ 7 } overflow="hidden">
                    <AutoGrid columnCount={ 5 }>
                        { filteredGroupItems.length > 0 &&
                            filteredGroupItems.map((item, index) =>
                                <InventoryFurnitureItemView key={ index } groupItem={ item } />
                            )
                        }
                    </AutoGrid>
                </Column>

                <Column size={ 5 } overflow="auto">
                    <Column overflow="hidden" position="relative">
                        <LayoutRoomPreviewerView roomPreviewer={ roomPreviewer } height={ 140 } />

                        { selectedItem?.stuffData.isUnique &&
                            <LayoutLimitedEditionCompactPlateView
                                className="top-2 end-2"
                                position="absolute"
                                uniqueNumber={ selectedItem.stuffData.uniqueNumber }
                                uniqueSeries={ selectedItem.stuffData.uniqueSeries }
                            />
                        }

                        { selectedItem && selectedItem.stuffData.rarityLevel > -1 &&
                            <LayoutRarityLevelView
                                className="top-2 end-2"
                                position="absolute"
                                level={ selectedItem.stuffData.rarityLevel }
                            />
                        }
                    </Column>

                    { selectedItem &&
                        <Column grow justifyContent="between" gap={ 2 }>
                            <Text grow truncate>{ selectedItem.name }</Text>

                            <Column gap={ 1 }>
                                { !!roomSession &&
                                    <Button variant="success" onClick={ () => attemptItemPlacement(selectedItem) }>
                                        { LocalizeText('inventory.furni.placetoroom') }
                                    </Button>
                                }

                                { selectedItem.isSellable &&
                                    <Button onClick={ () => attemptPlaceMarketplaceOffer(selectedItem) }>
                                        { LocalizeText('inventory.marketplace.sell') }
                                    </Button>
                                }
                            </Column>
                        </Column>
                    }
                </Column>
            </Grid>
        </>
    );
};
