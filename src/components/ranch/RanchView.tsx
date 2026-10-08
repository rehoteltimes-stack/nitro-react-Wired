import { RoomEngineObjectEvent, RoomObjectCategory, RoomSessionEvent } from '@nitrots/nitro-renderer';
import { FC, useEffect, useRef, useState } from 'react';
import { FurniIconUrl, GetRoomSession, SendMessageComposer } from '../../api';
import { IRanchAnimal, IRanchChallenge, IRanchCropInfo, IRanchOrder, IRanchShopItem, IRanchPlayer, IRanchQuest, IRanchState, RanchActionComposer, RanchAnimalsEvent, RanchChallengeEvent, RanchCropsEvent, RanchOrdersEvent, RanchQuestEvent, RanchPlayersEvent, RanchShopItemsEvent, RanchStateEvent, RegisterRanchMessages } from '../../api/games/RanchProtocol';
import { DraggableWindow } from '../../common';
import { useMessageEvent, useRoomEngineEvent, useRoomSessionManagerEvent } from '../../hooks';
import { RanchAnimalsView } from './RanchAnimalsView';
import { RanchChallengeView } from './RanchChallengeView';
import { RanchHoverView } from './RanchHoverView';
import { RanchOrdersView } from './RanchOrdersView';
import { IRanchFlash, RanchPlayersView } from './RanchPlayersView';
import { RanchQuestView } from './RanchQuestView';
import { RanchBarnView, RanchShopView } from './RanchShopView';

type RanchWindow = '' | 'shop';

interface IRanchDialog
{
    key: string;
    icon: string;
    title: string;
    unit: number;
    currency: string;
    max: number;
}

const FLASH_MS = 3000;

const flashKeys = (before: IRanchPlayer, after: IRanchPlayer) =>
{
    const keys: string[] = [];

    if(after.balance !== before.balance) keys.push('gold');
    if(after.tokens !== before.tokens) keys.push('honor');

    Object.keys(after.crops).forEach(crop => ((after.crops[crop] ?? 0) !== (before.crops[crop] ?? 0)) && keys.push(crop));

    return keys;
}

export const RanchView: FC<{}> = props =>
{
    RegisterRanchMessages();

    const [ state, setState ] = useState<IRanchState>(null);
    const [ open, setOpen ] = useState<RanchWindow>('');
    const [ dialog, setDialog ] = useState<IRanchDialog>(null);
    const [ amount, setAmount ] = useState(1);
    const [ players, setPlayers ] = useState<IRanchPlayer[]>([]);
    const [ orders, setOrders ] = useState<IRanchOrder[]>([]);
    const [ animals, setAnimals ] = useState<IRanchAnimal[]>([]);
    const [ challenge, setChallenge ] = useState<IRanchChallenge>(null);
    const [ shopItems, setShopItems ] = useState<IRanchShopItem[]>([]);
    const [ cropInfo, setCropInfo ] = useState<IRanchCropInfo[]>([]);
    const [ hoveredFurni, setHoveredFurni ] = useState<number[]>([]);
    const [ hoveredAvatars, setHoveredAvatars ] = useState<number[]>([]);
    const [ hoveredStacks, setHoveredStacks ] = useState<number[]>([]);
    const [ quest, setQuest ] = useState<IRanchQuest>(null);
    const [ flashes, setFlashes ] = useState<IRanchFlash[]>([]);
    const playersRef = useRef<IRanchPlayer[]>([]);

    const flash = (added: IRanchFlash[]) => added.length && setFlashes(previous => [ ...previous.filter(item => !added.some(next => (next.roomIndex === item.roomIndex) && (next.key === item.key))), ...added ]);

    useEffect(() =>
    {
        if(!flashes.length) return;

        const timeout = setTimeout(() => setFlashes(previous => previous.filter(item => item.until > Date.now())), Math.max(50, Math.min(...flashes.map(item => item.until)) - Date.now()));

        return () => clearTimeout(timeout);
    }, [ flashes ]);

    useMessageEvent<RanchQuestEvent>(RanchQuestEvent, event => setQuest(event.getParser().quest));


    useMessageEvent<RanchStateEvent>(RanchStateEvent, event =>
    {
        const next = event.getParser().state;

        if(!next) return;

        setState(next);

        if(!next.inRanch)
        {
            setOpen('');
            setDialog(null);

            return;
        }

        if(next.open === 'shop') setOpen('shop');
    });

    useMessageEvent<RanchChallengeEvent>(RanchChallengeEvent, event => setChallenge(event.getParser().challenge));

    useMessageEvent<RanchShopItemsEvent>(RanchShopItemsEvent, event => setShopItems(event.getParser().items));

    useMessageEvent<RanchCropsEvent>(RanchCropsEvent, event =>
    {
        const updates = event.getParser().crops;

        setCropInfo(previous => [ ...previous.filter(info => !updates.some(update => update.objectId === info.objectId)), ...updates ]);
    });

    useMessageEvent<RanchAnimalsEvent>(RanchAnimalsEvent, event =>
    {
        const updates = event.getParser().animals;

        setAnimals(previous => [ ...previous.filter(animal => !updates.some(update => update.objectId === animal.objectId)), ...updates ]);
    });

    useMessageEvent<RanchOrdersEvent>(RanchOrdersEvent, event =>
    {
        const updates = event.getParser().orders;

        setOrders(previous => [ ...previous.filter(order => !updates.some(update => update.roomIndex === order.roomIndex)), ...updates ]);
    });

    useMessageEvent<RanchPlayersEvent>(RanchPlayersEvent, event =>
    {
        const updates = event.getParser().players;
        const until = Date.now() + FLASH_MS;

        flash(updates.flatMap(update =>
        {
            const before = playersRef.current.find(player => player.roomIndex === update.roomIndex);

            return before ? flashKeys(before, update).map(key => ({ roomIndex: update.roomIndex, key, until })) : [];
        }));

        playersRef.current = [ ...playersRef.current.filter(player => !updates.some(update => update.roomIndex === player.roomIndex)), ...updates ];

        setPlayers(previous => [ ...previous.filter(player => !updates.some(update => update.roomIndex === player.roomIndex)), ...updates ]);
    });

    useRoomSessionManagerEvent<RoomSessionEvent>([ RoomSessionEvent.CREATED, RoomSessionEvent.ENDED ], () =>
    {
        setPlayers([]);
        playersRef.current = [];
        setFlashes([]);
        setQuest(null);
        setOrders([]);
        setAnimals([]);
        setChallenge(null);
        setShopItems([]);
        setCropInfo([]);
        setHoveredFurni([]);
        setHoveredAvatars([]);
        setHoveredStacks([]);
        setState(null);
        setOpen('');
        setDialog(null);
    });

    const toggle = (previous: number[], roomIndex: number, isHovered: boolean) => isHovered ? (previous.includes(roomIndex) ? previous : [ ...previous, roomIndex ]) : previous.filter(index => index !== roomIndex);

    useRoomEngineEvent<RoomEngineObjectEvent>([ RoomEngineObjectEvent.MOUSE_ENTER, RoomEngineObjectEvent.MOUSE_LEAVE, RoomEngineObjectEvent.REMOVED ], event =>
    {
        if(event.category === RoomObjectCategory.FLOOR)
        {
            if(event.type === RoomEngineObjectEvent.REMOVED) setCropInfo(previous => previous.filter(info => info.objectId !== event.objectId));

            setHoveredFurni(previous => (event.type === RoomEngineObjectEvent.MOUSE_ENTER) ? [ event.objectId ] : previous.filter(id => id !== event.objectId));

            return;
        }

        if(event.category !== RoomObjectCategory.UNIT) return;

        if(event.type === RoomEngineObjectEvent.REMOVED)
        {
            setPlayers(previous => previous.filter(player => player.roomIndex !== event.objectId));
            playersRef.current = playersRef.current.filter(player => player.roomIndex !== event.objectId);
            setOrders(previous => previous.filter(order => order.roomIndex !== event.objectId));
            setHoveredAvatars(previous => toggle(previous, event.objectId, false));
            setHoveredStacks(previous => toggle(previous, event.objectId, false));

            return;
        }

        if(event.type === RoomEngineObjectEvent.MOUSE_ENTER) setHoveredFurni([]);

        setHoveredAvatars(previous => (event.type === RoomEngineObjectEvent.MOUSE_ENTER) ? [ event.objectId ] : previous.filter(id => id !== event.objectId));
    });

    const session = GetRoomSession();

    if(!state || !state.inRanch || !session) return null;

    const send = (action: string, arg: string = '', count: number = 0) => SendMessageComposer(new RanchActionComposer(action, arg, count));

    const currencyName = (key: string) => (key === 'tokens') ? 'Community Tokens' : 'Coins';
    const balanceOf = (key: string) => (key === 'tokens') ? state.tokens : state.balance;

    const buyDialog = (key: string, icon: string, title: string, unit: number, priceCurrency: string) =>
    {
        setAmount(1);
        setDialog({ key, icon, title, unit, currency: priceCurrency, max: Math.max(1, Math.min(50, Math.floor(balanceOf(priceCurrency) / Math.max(1, unit)))) });
    }

    const confirm = () =>
    {
        if(!dialog) return;

        send('buy', dialog.key, Math.max(1, Math.min(dialog.max, amount)));
        setDialog(null);
    }

    const total = dialog ? dialog.unit * Math.max(1, Math.min(dialog.max, amount)) : 0;
    const blocked = dialog && (total > balanceOf(dialog.currency));

    return (
        <>
            <RanchHoverView hovered={ hoveredFurni } shopItems={ shopItems } crops={ cropInfo } />
            <RanchChallengeView challenge={ challenge } />
            <RanchAnimalsView animals={ animals } />
            <RanchOrdersView orders={ orders } />
            <RanchQuestView quest={ quest } />
            <RanchPlayersView players={ players } flashes={ flashes } hovered={ [ ...hoveredAvatars, ...hoveredStacks ] } ownIndex={ session.ownRoomIndex } onHover={ (roomIndex, isHovered) => setHoveredStacks(previous => toggle(previous, roomIndex, isHovered)) } onOwnBadge={ () => setOpen((open === 'shop') ? '' : 'shop') } />
            <RanchBarnView state={ state } onAction={ (action, arg) => send(action, arg) } onShop={ () => setOpen((open === 'shop') ? '' : 'shop') } />
            { (open === 'shop') && <RanchShopView state={ state } onBuy={ buyDialog } onClose={ () => setOpen('') } /> }
            { dialog &&
                <DraggableWindow uniqueKey="ranch-dialog" handleSelector=".ranch-dialog-header">
                    <div className="nitro-ranch ranch-dialog">
                        <div className="ranch-dialog-header">Buy</div>
                        <div className="ranch-dialog-item">
                            <div className="ranch-dialog-img"><img src={ FurniIconUrl(dialog.icon) } alt="" /></div>
                            <div>
                                <div className="ranch-dialog-desc">{ dialog.title }</div>
                                <div className="ranch-dialog-price">{ dialog.unit } { currencyName(dialog.currency) } each</div>
                            </div>
                        </div>
                        <div className="ranch-dialog-stepper">
                            <div className="ranch-dialog-step" onClick={ () => setAmount(Math.max(1, amount - 1)) }>-</div>
                            <input className="ranch-dialog-input" type="number" min={ 1 } max={ dialog.max } value={ amount } onChange={ event => setAmount(Math.max(1, Math.min(dialog.max, Number(event.target.value) || 1))) } />
                            <div className="ranch-dialog-step" onClick={ () => setAmount(Math.min(dialog.max, amount + 1)) }>+</div>
                            <div className="ranch-dialog-max" onClick={ () => setAmount(dialog.max) }>Max</div>
                        </div>
                        <div className="ranch-dialog-total">{ total } { currencyName(dialog.currency) }</div>
                        { blocked && <div className="ranch-dialog-requirement">You need { total } { currencyName(dialog.currency) }, you have { balanceOf(dialog.currency) }.</div> }
                        <div className="ranch-dialog-buttons">
                            <div className={ 'ranch-dialog-confirm' + (blocked ? ' disabled' : '') } onClick={ () => !blocked && confirm() }>Buy</div>
                            <div className="ranch-dialog-close" onClick={ () => setDialog(null) }>Cancel</div>
                        </div>
                    </div>
                </DraggableWindow> }
        </>
    );
}
