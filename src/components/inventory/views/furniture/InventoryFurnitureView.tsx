import { IRoomSession, RoomObjectVariable, RoomPreviewer, Vector3d } from '@nitrots/nitro-renderer';
import { FC, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { FaTrash } from 'react-icons/fa';
import { attemptItemPlacement, CreateLinkEvent, FurniCategory, GetRoomEngine, GetSessionDataManager, GroupItem, LocalizeText, SendMessageComposer, UnseenItemCategory } from '../../../../api';
import { DeleteItemsComposer, RegisterInventoryDeleteMessages } from '../../../../api/inventory/InventoryDeleteProtocol';
import { AutoGrid, Button, Column, Flex, Grid, LayoutLimitedEditionCompactPlateView, LayoutRarityLevelView, LayoutRoomPreviewerView, Text } from '../../../../common';
import { useInventoryFurni, useInventoryUnseenTracker, useNotification } from '../../../../hooks';
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

export const InventoryFurnitureView: FC<InventoryFurnitureViewProps> = props =>
{
    const { roomSession = null, roomPreviewer = null, searchSlot = null } = props;

    const [ isVisible, setIsVisible ] = useState(false);
    const [ filteredGroupItems, setFilteredGroupItems ] = useState<GroupItem[]>([]);

    const { groupItems: allGroupItems = [], selectedItem = null, activate = null, deactivate = null } = useInventoryFurni();
    const { showConfirm = null } = useNotification();

    const deleteSelected = () =>
    {
        const target = selectedItem?.getLastItem();

        if(!target) return;

        const amount = selectedItem.getTotalCount();

        showConfirm(`Do you really want to delete all "${ selectedItem.name }" furni from your inventory? There is no refund.`, () =>
        {
            RegisterInventoryDeleteMessages();
            SendMessageComposer(new DeleteItemsComposer(target.id, amount));
        }, null, null, null, LocalizeText('generic.alert.title'));
    }
    const { resetItems = null } = useInventoryUnseenTracker();

    const buyOfferId = (groupItem: GroupItem) =>
    {
        const item = groupItem?.getLastItem();

        if(!item) return -1;

        const furniData = item.isWallItem ? GetSessionDataManager().getWallItemData(item.type) : GetSessionDataManager().getFloorItemData(item.type);

        return (furniData && (furniData.purchaseOfferId > 0)) ? furniData.purchaseOfferId : -1;
    }

    const attemptBuyAnother = (groupItem: GroupItem) =>
    {
        const offerId = buyOfferId(groupItem);

        if(offerId > 0) CreateLinkEvent(`catalog/open/offerId/${ offerId }/reset`);
    }

    // Real reference has one unified Furniture tab - no separate Rares/Clothing category to route these into, so
    // they're no longer filtered out here (previously excluded for this project's own now-removed Rares/Clothing tabs).
    const groupItems = useMemo(() => allGroupItems.filter(group =>
    {
        const item = group.getLastItem();

        if(!item) return false;

        return !!(item.isWallItem ? GetSessionDataManager().getWallItemData(item.type) : GetSessionDataManager().getFloorItemData(item.type));
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

    // Real reference: the button row is NOT nested inside the right preview column - it's a fourth, separate,
    // full-width sibling of the search bar/tabs/grid inside .content-area-inner, confirmed live via bounding-rect
    // capture (button width 455px, near the card's own full 528px width, not the ~200px the right column alone
    // would give it). Same real structural pattern this project's own Banners tab already got right (its own
    // Wear/Remove button sits outside its Grid entirely) - Furniture had it wrong, nested inside Column size={5}.
    return (
        <>
            { searchPortal }
            { /* grow, not fullHeight: this Column is a flex child of content-area-inner alongside the search bar,
                 tabs, and the footer button row below - h-100 ignores those siblings' own real space and
                 overflows/pushes the footer out, flex-grow-1 correctly fills only what's left after them. */ }
            <Column grow overflow="hidden">
                <Grid fullHeight overflow="hidden">
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
                            <Column grow>
                                <Text grow truncate>{ selectedItem.name }</Text>
                            </Column>
                        }
                    </Column>
                </Grid>
            </Column>

            { /* Real reference footer, confirmed live on two unrelated, ordinary items ("Corde d'alpiniste",
                 "Poubelle") - a horizontal row (.d-flex.w-100.flex-grow-1.flex-shrink-0.gap-1), not the vertical
                 stack this used to be: a .flex-fill sub-row holding the equal-width action buttons, plus a
                 separate icon-only .btn-danger.btn-sm as a third sibling. See attemptBuyAnother's own comment
                 above for what "Acheter un" does on the reference vs. what's actually implemented here. */ }
            { selectedItem &&
                <Flex fullWidth gap={ 1 }>
                    <Flex fullWidth grow gap={ 1 }>
                        { !!roomSession &&
                            <Button variant="success" fullWidth onClick={ () => attemptItemPlacement(selectedItem) }>
                                { LocalizeText('inventory.furni.placetoroom') }
                            </Button>
                        }

                        { /* Marketplace/sell disabled per explicit user direction - never confirmed present in
                             this exact footer on the reference anyway (both test items were non-sellable). */ }

                        { (buyOfferId(selectedItem) > 0) &&
                        <Button variant="primary" fullWidth onClick={ () => attemptBuyAnother(selectedItem) }>
                            { LocalizeText('infostand.button.buy') }
                        </Button> }
                    </Flex>

                    <Button variant="danger" onClick={ deleteSelected }>
                        <FaTrash className="fa-icon" />
                    </Button>
                </Flex>
            }
        </>
    );
};
