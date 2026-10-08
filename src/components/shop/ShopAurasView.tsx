import { FC, useEffect, useState } from 'react';
import { IShopAura } from '../../api/shop/ShopProtocol';
import { Button, LayoutCurrencyIcon } from '../../common';
import { ShopAuraPreview } from './ShopAuraPreview';
import { ShopItemFlags } from './ShopItemFlags';

const PER_PAGE = 4;

/** Auras tab: a page of cards (avatar preview with the aura, tier, VIP mark) with Buy / Wear / Remove. */
export const ShopAurasView: FC<{ auras: IShopAura[], activeId: number, isVip: boolean, busy: boolean, t: (key: string, fallback?: string) => string,
    onBuy: (aura: IShopAura) => void, onWear: (aura: IShopAura) => void, onRemove: () => void }> = props =>
{
    const { auras = [], activeId = 0, isVip = false, busy = false, t, onBuy, onWear, onRemove } = props;
    const [ page, setPage ] = useState(0);
    const pages = Math.max(1, Math.ceil(auras.length / PER_PAGE));
    const current = Math.min(page, pages - 1);
    const shown = auras.slice(current * PER_PAGE, (current + 1) * PER_PAGE);

    useEffect(() => { if(page > pages - 1) setPage(pages - 1); }, [ pages ]);

    return (
        <section className="shop-auras">
            <header className="shop-section-header">
                <div className="shop-section-title">
                    <strong>{ t('auras.header', 'Auras') }</strong>
                    <span>{ t('auras.hint') }</span>
                </div>
                <div className="shop-pagination">
                    <Button variant="dark" disabled={ current <= 0 } onClick={ () => setPage(current - 1) }>‹</Button>
                    <span>{ current + 1 } / { pages }</span>
                    <Button variant="dark" disabled={ current >= pages - 1 } onClick={ () => setPage(current + 1) }>›</Button>
                </div>
            </header>
            <div className="shop-auras-grid">
                { !shown.length && <p className="shop-empty">{ t('auras.empty') }</p> }
                { shown.map(aura =>
                {
                    const wearing = (aura.id === activeId);
                    const locked = aura.vipOnly && !isVip;

                    return (
                        <article key={ aura.id } className={ `shop-aura-card tier-${ aura.tier }${ wearing ? ' is-active' : '' }${ locked ? ' is-locked' : '' }` } title={ aura.description }>
                            
                            <div className="shop-aura-card-preview">
                                <ShopAuraPreview aura={ aura } height={ 118 } />
                                <ShopItemFlags owned={ aura.owned } active={ wearing } label={ t('tier.' + aura.tier, aura.tier).toUpperCase() } labelClass={ `is-tier-${ aura.tier }` } t={ t } />
                            </div>
                            <div className="shop-aura-card-copy">
                                <strong>{ aura.name }</strong>
                                <small>{ t('tier.' + aura.tier, aura.tier) }</small>
                            </div>
                            { wearing
                                ? <Button variant="danger" disabled={ busy } onClick={ onRemove }>{ t('button.remove', 'Remove') }</Button>
                                : locked
                                    // VIP only and the viewer isn't VIP: a clear label, not a pale disabled button
                                    ? <div className="shop-locked-label">{ t('label.vip_only', 'VIP only') }</div>
                                    : aura.owned
                                    ? <Button variant="success" disabled={ busy || locked } title={ locked ? t('label.vip_only') : undefined } onClick={ () => onWear(aura) }>{ t('button.wear', 'Wear') }</Button>
                                    : <Button variant="primary" className="shop-price-button" disabled={ busy || locked } title={ locked ? t('label.vip_only') : undefined } onClick={ () => onBuy(aura) }>
                                        <LayoutCurrencyIcon type={ aura.currencyType } />
                                        <span>{ aura.price.toLocaleString() }</span>
                                    </Button> }
                        </article>
                    );
                }) }
            </div>
        </section>
    );
}
