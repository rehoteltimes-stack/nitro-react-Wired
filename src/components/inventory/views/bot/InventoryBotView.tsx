import { IRoomSession, RoomObjectVariable, RoomPreviewer } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { attemptBotPlacement, GetRoomEngine, IBotItem, LocalizeText, UnseenItemCategory } from '../../../../api';
import { AutoGrid, Button, Column, Grid, LayoutRoomPreviewerView, Text } from '../../../../common';
import { useInventoryBots, useInventoryUnseenTracker } from '../../../../hooks';
import { InventoryCategoryEmptyView } from '../InventoryCategoryEmptyView';
import { InventoryBotItemView } from './InventoryBotItemView';
import { InventoryBotSearchView } from './InventoryBotSearchView';

interface InventoryBotViewProps
{
    roomSession: IRoomSession;
    roomPreviewer: RoomPreviewer;
    // Real reference: the search bar is a full-width sibling ABOVE the tabs (.content-area-inner's own direct
    // child) - see InventoryView.tsx's own comment for the real DOM position and why a portal is used.
    searchSlot?: HTMLDivElement;
}

export const InventoryBotView: FC<InventoryBotViewProps> = props =>
{
    const { roomSession = null, roomPreviewer = null, searchSlot = null } = props;
    const [ isVisible, setIsVisible ] = useState(false);
    const [ filteredBotItems, setFilteredBotItems ] = useState<IBotItem[]>([]);
    const { botItems = [], selectedBot = null, activate = null, deactivate = null } = useInventoryBots();
    const { isUnseen = null, removeUnseen = null } = useInventoryUnseenTracker();

    // Real, previously-missing feature: the reference's Bots tab has the same real, functional search bar as
    // Furniture (confirmed live: typing filters the owned-bot grid, not decorative) - this project had none at
    // all for this tab. Same filter shape as InventoryFurnitureSearchView, applied to botData.name.
    useEffect(() =>
    {
        setFilteredBotItems(botItems);
    }, [ botItems ]);

    useEffect(() =>
    {
        if(!selectedBot || !roomPreviewer) return;

        const botData = selectedBot.botData;

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
        roomPreviewer.addAvatarIntoRoom(botData.figure, 0);
    }, [ roomPreviewer, selectedBot ]);

    useEffect(() =>
    {
        if(!selectedBot || !isUnseen(UnseenItemCategory.BOT, selectedBot.botData.id)) return;

        removeUnseen(UnseenItemCategory.BOT, selectedBot.botData.id);
    }, [ selectedBot, isUnseen, removeUnseen ]);

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
    // Furniture's own empty state, so it portals unconditionally before the empty/non-empty branch.
    const searchPortal = searchSlot && createPortal(
        <InventoryBotSearchView botItems={ botItems } setBotItems={ setFilteredBotItems } />,
        searchSlot
    );

    if(!botItems || !botItems.length)
    {
        return (
            <>
                { searchPortal }
                <InventoryCategoryEmptyView title={ LocalizeText('inventory.empty.bots.title') } desc={ LocalizeText('inventory.empty.bots.desc') } />
            </>
        );
    }

    // Real reference: same structural fix as Furniture/Badges (couldn't confirm this exact tab's own footer
    // against a real owned bot - the reference account owns none - but the shell structure itself
    // (search/tabs/grid/footer as four siblings of content-area-inner, footer full-width not nested in the right
    // column) is already confirmed universal there, so applied consistently rather than left with the old,
    // already-disproven-elsewhere nested layout).
    return (
        <>
            { searchPortal }
            <Column grow overflow="hidden">
                <Grid fullHeight overflow="hidden">
                    <Column size={ 7 } overflow="hidden">
                        <AutoGrid columnCount={ 5 }>
                            { filteredBotItems && (filteredBotItems.length > 0) && filteredBotItems.map(item => <InventoryBotItemView key={ item.botData.id } botItem={ item } />) }
                        </AutoGrid>
                    </Column>
                    <Column size={ 5 } overflow="auto">
                        <Column overflow="hidden" position="relative">
                            <LayoutRoomPreviewerView roomPreviewer={ roomPreviewer } height={ 140 } />
                        </Column>
                        { selectedBot &&
                            <Column grow>
                                <Text grow truncate>{ selectedBot.botData.name }</Text>
                            </Column> }
                    </Column>
                </Grid>
            </Column>

            { selectedBot && !!roomSession &&
                <Button fullWidth variant="success" onClick={ event => attemptBotPlacement(selectedBot) }>
                    { LocalizeText('inventory.furni.placetoroom') }
                </Button> }
        </>
    );
}
