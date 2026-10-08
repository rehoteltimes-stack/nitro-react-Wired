import { IObjectData, RoomObjectVariable, RoomPreviewer, TradingListAddItemComposer, TradingListAddItemsComposer, Vector3d } from '@nitrots/nitro-renderer';
import { FC, Fragment, ReactElement, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FaChevronLeft, FaLock, FaUnlock } from 'react-icons/fa';
import { FurniCategory, getGuildFurniType, GetRoomEngine, GroupItem, IFurnitureItem, LocalizeText, NotificationAlertType, SendMessageComposer, TradeState } from '../../../../api';
import { Base, Button, Column, Flex, Grid, InfiniteScroll, LayoutGridItem, LayoutLimitedEditionCompactPlateView, LayoutRoomPreviewerView, NumberInput, Text } from '../../../../common';
import { useInventoryTrade, useNotification } from '../../../../hooks';
import { InventoryFurnitureSearchView } from './InventoryFurnitureSearchView';

interface InventoryTradeViewProps
{
    roomPreviewer: RoomPreviewer;
    cancelTrade: () => void;
    searchSlot?: HTMLDivElement;
}

const MAX_ITEMS_TO_TRADE: number = 9;
const ITEM_WIDTH: number = 44;

export const InventoryTradeView: FC<InventoryTradeViewProps> = props =>
{
    const { roomPreviewer = null, cancelTrade = null, searchSlot = null } = props;
    const [ groupItem, setGroupItem ] = useState<GroupItem>(null);
    const [ ownGroupItem, setOwnGroupItem ] = useState<GroupItem>(null);
    const [ otherGroupItem, setOtherGroupItem ] = useState<GroupItem>(null);
    const [ previewItem, setPreviewItem ] = useState<GroupItem>(null);
    const [ filteredGroupItems, setFilteredGroupItems ] = useState<GroupItem[]>([]);
    const [ countdownTick, setCountdownTick ] = useState(3);
    const [ quantity, setQuantity ] = useState<number>(1);
    const [ listWidth, setListWidth ] = useState(0);
    const listRef = useRef<HTMLDivElement>(null);
    const { ownUser = null, otherUser = null, groupItems = [], tradeState = TradeState.TRADING_STATE_READY, progressTrade = null, removeItem = null, setTradeState = null } = useInventoryTrade();
    const { simpleAlert = null } = useNotification();

    useEffect(() =>
    {
        setFilteredGroupItems(groupItems);
    }, [ groupItems ]);

    const isOpen = ((tradeState !== TradeState.TRADING_STATE_READY) && !!ownUser && !!otherUser);

    useEffect(() =>
    {
        const element = listRef.current;

        if(!isOpen || !element) return;

        const observer = new ResizeObserver(() => setListWidth(element.offsetWidth));

        observer.observe(element);

        return () => observer.disconnect();
    }, [ isOpen ]);

    useEffect(() =>
    {
        if(!previewItem || !roomPreviewer) return;

        const furnitureItem = previewItem.getLastItem();

        if(!furnitureItem) return;

        const roomEngine = GetRoomEngine();
        let wallType = (roomEngine.getRoomInstanceVariable<string>(roomEngine.activeRoomId, RoomObjectVariable.ROOM_WALL_TYPE) || '101');
        let floorType = (roomEngine.getRoomInstanceVariable<string>(roomEngine.activeRoomId, RoomObjectVariable.ROOM_FLOOR_TYPE) || '101');
        let landscapeType = (roomEngine.getRoomInstanceVariable<string>(roomEngine.activeRoomId, RoomObjectVariable.ROOM_LANDSCAPE_TYPE) || '1.1');

        roomPreviewer.reset(false);
        roomPreviewer.updateObjectRoom(floorType, wallType, landscapeType);
        roomPreviewer.updateRoomWallsAndFloorVisibility(true, true);

        if([ FurniCategory.WALL_PAPER, FurniCategory.FLOOR, FurniCategory.LANDSCAPE ].includes(furnitureItem.category))
        {
            floorType = ((furnitureItem.category === FurniCategory.FLOOR) ? previewItem.stuffData.getLegacyString() : floorType);
            wallType = ((furnitureItem.category === FurniCategory.WALL_PAPER) ? previewItem.stuffData.getLegacyString() : wallType);
            landscapeType = ((furnitureItem.category === FurniCategory.LANDSCAPE) ? previewItem.stuffData.getLegacyString() : landscapeType);

            roomPreviewer.updateObjectRoom(floorType, wallType, landscapeType);
        }
        else if(previewItem.isWallItem)
        {
            roomPreviewer.addWallItemIntoRoom(previewItem.type, new Vector3d(90), furnitureItem.stuffData.getLegacyString());
        }
        else
        {
            roomPreviewer.addFurnitureIntoRoom(previewItem.type, new Vector3d(90), previewItem.stuffData, furnitureItem.extra.toString());
        }
    }, [ roomPreviewer, previewItem ]);

    const canTradeItem = (isWallItem: boolean, spriteId: number, category: number, groupable: boolean, stuffData: IObjectData) =>
    {
        if(!ownUser || ownUser.accepts || !ownUser.userItems) return false;

        if(ownUser.userItems.length < MAX_ITEMS_TO_TRADE) return true;

        if(!groupable) return false;

        let type = spriteId.toString();

        if(category === FurniCategory.POSTER) type = ((type + 'poster') + stuffData.getLegacyString());
        else if(category === FurniCategory.GUILD_FURNI) type = getGuildFurniType(spriteId, stuffData);
        else type = (((isWallItem) ? 'I' : 'S') + type);

        return !!ownUser.userItems.getValue(type);
    }

    const attemptItemOffer = (count: number) =>
    {
        if(!groupItem) return;

        const tradeItems = groupItem.getTradeItems(count);

        if(!tradeItems || !tradeItems.length) return;

        let coreItem: IFurnitureItem = null;
        const itemIds: number[] = [];

        for(const item of tradeItems)
        {
            itemIds.push(item.id);

            if(!coreItem) coreItem = item;
        }

        if((ownUser.userItems.length + itemIds.length) > 1500)
        {
            simpleAlert(LocalizeText('trading.items.too_many_items.desc'), NotificationAlertType.DEFAULT, null, null, LocalizeText('trading.items.too_many_items.title'));

            return;
        }

        if(!coreItem.isGroupable && itemIds.length)
        {
            SendMessageComposer(new TradingListAddItemComposer(itemIds.pop()));

            return;
        }

        const tradeIds = itemIds.filter(() => canTradeItem(coreItem.isWallItem, coreItem.type, coreItem.category, coreItem.isGroupable, coreItem.stuffData));

        if(!tradeIds.length) return;

        if(tradeIds.length === 1) SendMessageComposer(new TradingListAddItemComposer(tradeIds.pop()));
        else SendMessageComposer(new TradingListAddItemsComposer(...tradeIds));
    }

    const getLockIcon = (accepts: boolean) => (accepts ? <FaLock className="text-success fa-icon" /> : <FaUnlock className="text-danger fa-icon" />);

    const updateQuantity = (value: number, totalItemCount: number) =>
    {
        if(isNaN(Number(value)) || (Number(value) < 0) || !value) value = 1;

        value = Math.min(Math.max(Number(value), 1), totalItemCount);

        if(value !== quantity) setQuantity(value);
    }

    const changeCount = (totalItemCount: number) =>
    {
        updateQuantity(quantity, totalItemCount);
        attemptItemOffer(quantity);
    }

    useEffect(() =>
    {
        setQuantity(1);
    }, [ groupItem ]);

    useEffect(() =>
    {
        if(tradeState !== TradeState.TRADING_STATE_COUNTDOWN) return;

        setCountdownTick(3);

        const interval = setInterval(() =>
        {
            setCountdownTick(prevValue =>
            {
                const newValue = (prevValue - 1);

                if(newValue === 0) clearInterval(interval);

                return newValue;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [ tradeState, setTradeState ]);

    useEffect(() =>
    {
        if(countdownTick !== 0) return;

        setTradeState(TradeState.TRADING_STATE_CONFIRMING);
    }, [ countdownTick, setTradeState ]);

    const getRows = () =>
    {
        if(!listWidth || !filteredGroupItems.length) return [];

        const perRow = Math.max(1, Math.floor((listWidth - 20) / ITEM_WIDTH));
        const rows: ReactElement[][] = [];
        let row: ReactElement[] = [];

        filteredGroupItems.forEach((item, index) =>
        {
            const count = item.getUnlockedCount();

            row.push(<LayoutGridItem key={ index } className={ count ? '' : 'opacity-0-5' } itemImage={ item.iconUrl } itemCount={ count } itemActive={ (groupItem === item) } itemUniqueNumber={ item.stuffData.uniqueNumber } onClick={ event =>
            {
                if(!count) return;

                setGroupItem(item);
                setPreviewItem(item);
            } } onDoubleClick={ event => attemptItemOffer(1) } />);

            if(((index + 1) % perRow) === 0)
            {
                rows.push(row);
                row = [];
            }
        });

        if(row.length) rows.push(row);

        return rows;
    }

    const getInformation = (item: GroupItem) =>
    {
        if(!item) return null;

        return (
            <Base className="trade-information py-1 px-2 small">
                <Flex fullWidth alignItems="center" justifyContent="between">
                    <Column gap={ 0 }>
                        <Text textBreak className="fw-bold mb-1">{ item.name }</Text>
                        <Text textBreak>{ item.description }</Text>
                    </Column>
                    { item.stuffData.isUnique &&
                        <LayoutLimitedEditionCompactPlateView uniqueNumber={ item.stuffData.uniqueNumber } uniqueSeries={ item.stuffData.uniqueSeries } /> }
                </Flex>
            </Base>
        );
    }

    if(!isOpen) return null;

    const selectedCount = (groupItem?.getUnlockedCount() ?? 0);

    return (
        <>
            { searchSlot && createPortal(<InventoryFurnitureSearchView groupItems={ groupItems } setGroupItems={ setFilteredGroupItems } />, searchSlot) }
            <Column grow>
                <Column innerRef={ listRef } fullWidth className="inventory-trade-item-list">
                    <InfiniteScroll rows={ getRows() } overscan={ 5 } rowRender={ (row: ReactElement[]) => <Flex fill>{ row.map(element => <Fragment key={ element.key }>{ element }</Fragment>) }</Flex> } />
                </Column>
            </Column>
            <Column>
                <Flex shrink grow gap={ 2 } className="inventory-trade-offer-container">
                    <LayoutRoomPreviewerView roomPreviewer={ roomPreviewer } height={ 253 } />
                    <Column className="inventory-trade-offer">
                        <Column className="inventory-trade-offer-content">
                            <Flex shrink fill gap={ 2 } className="inventory-trade-offer-controls">
                                <NumberInput placeholder={ LocalizeText('catalog.bundlewidget.spinner.select.amount') } disabled={ (selectedCount < 1) } value={ Math.min(selectedCount, quantity) } onEvent={ setQuantity } min={ 1 } max={ Math.min(selectedCount || 100, 100) } />
                                <Button variant="success" disabled={ (selectedCount < 1) } onClick={ event => changeCount(selectedCount) }>{ LocalizeText('inventory.trading.areoffering') }</Button>
                            </Flex>
                            <Flex justifyContent="around">
                                <Column>
                                    <Flex justifyContent="between" alignItems="center">
                                        <Text className="trade-text">{ LocalizeText('inventory.trading.you') } { LocalizeText('inventory.trading.areoffering') }:</Text>
                                        { getLockIcon(ownUser.accepts) }
                                    </Flex>
                                    <Grid columnCount={ 3 } className="inventory-trade-item-list" gap={ 0 }>
                                        { Array.from(Array(MAX_ITEMS_TO_TRADE), (e, index) =>
                                        {
                                            const item = (ownUser.userItems.getWithIndex(index) || null);

                                            if(!item) return <LayoutGridItem key={ index } />;

                                            return (
                                                <LayoutGridItem key={ index } overflow="visible" itemActive={ (ownGroupItem === item) } itemImage={ item.iconUrl } itemCount={ item.getTotalCount() } itemUniqueNumber={ item.stuffData.uniqueNumber } onClick={ event =>
                                                {
                                                    setOwnGroupItem(item);
                                                    setPreviewItem(item);
                                                } } onDoubleClick={ event => removeItem(item) }>
                                                    { getInformation(item) }
                                                    { (ownGroupItem === item) &&
                                                        <Button position="absolute" variant="danger" className="trade-button bottom-1 start-1" onClick={ event => removeItem(item) }>
                                                            <FaChevronLeft className="fa-icon" />
                                                        </Button> }
                                                </LayoutGridItem>
                                            );
                                        }) }
                                    </Grid>
                                </Column>
                                <Column>
                                    <Flex justifyContent="between" alignItems="center">
                                        <Text className="trade-text">{ otherUser.userName } { LocalizeText('inventory.trading.isoffering') }:</Text>
                                        { getLockIcon(otherUser.accepts) }
                                    </Flex>
                                    <Grid columnCount={ 3 } className="inventory-trade-item-list" gap={ 0 }>
                                        { Array.from(Array(MAX_ITEMS_TO_TRADE), (e, index) =>
                                        {
                                            const item = (otherUser.userItems.getWithIndex(index) || null);

                                            if(!item) return <LayoutGridItem key={ index } />;

                                            return (
                                                <LayoutGridItem key={ index } overflow="visible" itemActive={ (otherGroupItem === item) } itemImage={ item.iconUrl } itemCount={ item.getTotalCount() } itemUniqueNumber={ item.stuffData.uniqueNumber } onClick={ event =>
                                                {
                                                    setOtherGroupItem(item);
                                                    setPreviewItem(item);
                                                } }>
                                                    { getInformation(item) }
                                                </LayoutGridItem>
                                            );
                                        }) }
                                    </Grid>
                                </Column>
                            </Flex>
                        </Column>
                        <Flex fill justifyContent="between" gap={ 2 } className="inventory-trade-offer-controls">
                            <Button variant="danger" onClick={ cancelTrade }>{ LocalizeText('generic.cancel') }</Button>
                            { (tradeState === TradeState.TRADING_STATE_RUNNING) &&
                                <Button variant="secondary" disabled={ (!ownUser.itemCount && !otherUser.itemCount) } onClick={ progressTrade }>{ LocalizeText(ownUser.accepts ? 'inventory.trading.modify' : 'inventory.trading.accept') }</Button> }
                            { (tradeState === TradeState.TRADING_STATE_COUNTDOWN) &&
                                <Button variant="secondary" disabled>{ LocalizeText('inventory.trading.countdown', [ 'counter' ], [ countdownTick.toString() ]) }</Button> }
                            { (tradeState === TradeState.TRADING_STATE_CONFIRMING) &&
                                <Button variant="secondary" onClick={ progressTrade }>{ LocalizeText('inventory.trading.button.restore') }</Button> }
                            { (tradeState === TradeState.TRADING_STATE_CONFIRMED) &&
                                <Button variant="secondary">{ LocalizeText('inventory.trading.info.waiting') }</Button> }
                        </Flex>
                    </Column>
                </Flex>
            </Column>
        </>
    );
}
