import { FC, useEffect, useState } from 'react';
import { GetSessionDataManager } from '../../api';
import { IShopOrnament } from '../../api/shop/ShopProtocol';
import { Button, LayoutCurrencyIcon } from '../../common';
import { ShopOrnamentLayers } from './ShopInfostandBorder';
import { ShopRoomPreview } from './ShopRoomPreview';
import { ShopItemFlags } from './ShopItemFlags';

/** Ornaments tab: a grid of every ornament ("no ornament" first) and a detail panel previewing the player's name with it, plus Use / Buy. */
export const ShopOrnamentsView: FC<{ ornaments: IShopOrnament[], activeId: number, baseUrl: string, isVip: boolean, busy: boolean, t: (key: string, fallback?: string) => string,
    onBuy: (ornament: IShopOrnament) => void, onUse: (id: number) => void }> = props =>
{
    const { ornaments = [], activeId = 0, baseUrl = '', isVip = false, busy = false, t, onBuy, onUse } = props;
    const [ selectedId, setSelectedId ] = useState<number>(activeId);

    useEffect(() => { setSelectedId(activeId); }, [ activeId ]);

    const selected = ornaments.find(ornament => ornament.id === selectedId) || null;
    const inUse = (selectedId === activeId);
    const locked = !!selected && selected.vipOnly && !isVip;

    return (
        <section className="shop-borders">
            <header className="shop-section-header">
                <div className="shop-section-title">
                    <strong>{ t('ornaments.header', 'Ornaments') }</strong>
                    <span>{ t('ornaments.hint') }</span>
                </div>
            </header>
            <div className="shop-borders-layout">
                <div className="shop-borders-grid">
                    <button type="button" className={ `shop-border-item${ (selectedId === 0) ? ' is-selected' : '' }${ (activeId === 0) ? ' is-active' : '' }` } title={ t('ornaments.none', 'No ornament') } onClick={ () => setSelectedId(0) }>
                        <span className="shop-border-none">✕</span>
                    </button>
                    { ornaments.map(ornament =>
                        <button key={ ornament.id } type="button" title={ ornament.name }
                            className={ `shop-border-item${ (ornament.id === selectedId) ? ' is-selected' : '' }${ (ornament.id === activeId) ? ' is-active' : '' }${ ornament.owned ? ' is-owned' : '' }` }
                            onClick={ () => setSelectedId(ornament.id) }>
                            <span className="shop-border-thumb">
                                { ornament.image && <img src={ baseUrl + ornament.image } alt="" draggable={ false } /> }
                                { ornament.overlay && <img src={ baseUrl + ornament.overlay } alt="" draggable={ false } onError={ event => (event.currentTarget.hidden = true) } /> }
                            </span>
                            <ShopItemFlags owned={ ornament.owned } active={ ornament.id === activeId } vip={ ornament.vipOnly } small t={ t } />
                        </button>) }
                </div>
                <aside className="shop-border-detail">
                    
                    { /* your avatar in a small room with the real name tag above it (the same classes as the in-room name tag) */ }
                    <div className="shop-ornament-preview">
                        <ShopRoomPreview height={ 200 } direction={ 2 }>
                            { spot =>
                                <div className="nitro-context-menu name-only shop-ornament-tag" style={ { left: spot.x, top: spot.top + Math.round((spot.y - spot.top) * 0.28) } }>
                                    <div className="text-shadow shop-name-bordered">
                                        <ShopOrnamentLayers ornament={ selected } baseUrl={ baseUrl } />
                                        <span className="shop-name-text">{ GetSessionDataManager().userName }</span>
                                    </div>
                                </div> }
                        </ShopRoomPreview>
                    </div>
                    <strong>{ selected ? selected.name : t('ornaments.none', 'No ornament') }</strong>
                    { inUse && <span className="shop-border-state">{ t('label.in_use', 'In use') }</span> }
                    { !selected || selected.owned
                        ? <Button variant="success" disabled={ busy || inUse || locked } onClick={ () => onUse(selectedId) }>{ inUse ? t('label.in_use', 'In use') : t('button.use', 'Use') }</Button>
                        : <Button variant="primary" className="shop-price-button" disabled={ busy || locked } title={ locked ? t('label.vip_only') : undefined } onClick={ () => onBuy(selected) }>
                            <LayoutCurrencyIcon type={ selected.currencyType } />
                            <span>{ selected.price.toLocaleString() }</span>
                        </Button> }
                </aside>
            </div>
        </section>
    );
}
