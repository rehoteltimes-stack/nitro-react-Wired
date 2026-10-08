import { FC, useEffect, useState } from 'react';
import { IShopSpawn, SpawnFrameUrl } from '../../api/shop/ShopProtocol';
import { Button, LayoutCurrencyIcon } from '../../common';
import { ShopRoomPreview } from './ShopRoomPreview';
import { ShopSpawnAnimation } from './ShopSpawnAnimation';
import { ShopItemFlags } from './ShopItemFlags';

/**
 * Spawn tab: a stage with the player's avatar and the selected animation played over it (Replay), the selected spawn's
 * name with Equip / Buy, and a picker of every spawn (thumbnail = one frame of it).
 */
export const ShopSpawnsView: FC<{ spawns: IShopSpawn[], activeId: number, pattern: string, isVip: boolean, busy: boolean, t: (key: string, fallback?: string) => string,
    onBuy: (spawn: IShopSpawn) => void, onEquip: (spawn: IShopSpawn) => void, onRemove: () => void }> = props =>
{
    const { spawns = [], activeId = 0, pattern = '', isVip = false, busy = false, t, onBuy, onEquip, onRemove } = props;
    const [ selectedId, setSelectedId ] = useState<number>(() => activeId || spawns[0]?.id || 0);
    const [ replay, setReplay ] = useState(0);

    useEffect(() => { if(activeId > 0) setSelectedId(activeId); }, [ activeId ]);
    useEffect(() => { if(!spawns.some(spawn => spawn.id === selectedId)) setSelectedId(spawns[0]?.id || 0); }, [ spawns ]);

    const selected = spawns.find(spawn => spawn.id === selectedId) || null;
    const equipped = !!selected && (selected.id === activeId);
    const locked = !!selected && selected.vipOnly && !isVip;

    return (
        <section className="shop-spawns">
            <header className="shop-section-header">
                <div className="shop-section-title">
                    <strong>{ t('spawns.header', 'Spawn') }</strong>
                    <span>{ t('spawns.hint') }</span>
                </div>
                { (activeId > 0) && <Button variant="danger" disabled={ busy } onClick={ onRemove }>{ t('button.remove', 'Remove') }</Button> }
            </header>
            { !selected && <p className="shop-empty">{ t('spawns.empty') }</p> }
            { selected &&
                <div className="shop-spawn-layout">
                    { /* your avatar in a small room; the animation is placed like in a real room: centred on the avatar + the spawn's offsets */ }
                    <div className="shop-spawn-stage">
                        <ShopRoomPreview height={ 220 } direction={ 2 }>
                            { spot => <ShopSpawnAnimation className="shop-spawn-effect" pattern={ pattern } spawn={ selected } replayKey={ replay }
                                style={ { position: 'absolute', margin: 0,
                                    left: spot.x - (selected.frameWidth * selected.scale) / 2 + selected.offsetX,
                                    top: spot.y - (selected.frameHeight * selected.scale) / 2 + selected.offsetY } } /> }
                        </ShopRoomPreview>
                    </div>
                    <div className="shop-spawn-panel">
                        <div className="shop-spawn-details">
                            <strong>{ selected.name }</strong>
                            <Button variant="dark" onClick={ () => setReplay(value => value + 1) }>{ t('button.replay', 'Replay') }</Button>
                            { equipped
                                ? <Button variant="success" disabled>{ t('label.equipped', 'Equipped') }</Button>
                                : selected.owned
                                    ? <Button variant="success" disabled={ busy || locked } title={ locked ? t('label.vip_only') : undefined } onClick={ () => onEquip(selected) }>{ t('button.equip', 'Equip') }</Button>
                                    : <Button variant="primary" className="shop-price-button" disabled={ busy || locked } title={ locked ? t('label.vip_only') : undefined } onClick={ () => onBuy(selected) }>
                                        <LayoutCurrencyIcon type={ selected.currencyType } />
                                        <span>{ selected.price.toLocaleString() }</span>
                                    </Button> }
                        </div>
                        <div className="shop-spawn-picker" role="list">
                            { spawns.map(spawn =>
                                <button key={ spawn.id } type="button" role="listitem" title={ spawn.name }
                                    className={ `shop-spawn-choice${ (spawn.id === selectedId) ? ' is-selected' : '' }${ (spawn.id === activeId) ? ' is-active' : '' }${ spawn.owned ? ' is-owned' : '' }` }
                                    onClick={ () => { setSelectedId(spawn.id); setReplay(value => value + 1); } }>
                                    <img src={ SpawnFrameUrl(pattern, spawn, spawn.thumbFrame) } alt="" aria-hidden="true" draggable={ false } />
                                    <ShopItemFlags owned={ spawn.owned } active={ spawn.id === activeId } vip={ spawn.vipOnly } small t={ t } />
                                </button>) }
                        </div>
                    </div>
                </div> }
        </section>
    );
}
