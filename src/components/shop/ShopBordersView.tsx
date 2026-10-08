import { FC, useEffect, useRef, useState } from 'react';
import { IShopBorder } from '../../api/shop/ShopProtocol';
import { Button, LayoutCurrencyIcon } from '../../common';
import { ShopBorderFrame } from './ShopBorderFrame';
import { ShopProfileStand } from './ShopProfileStand';
import { ShopItemFlags } from './ShopItemFlags';

/** Borders tab: a grid of every border ("no border" first) and a detail panel with a framed preview and Use / Buy. */
export const ShopBordersView: FC<{ borders: IShopBorder[], activeId: number, baseUrl: string, isVip: boolean, busy: boolean, t: (key: string, fallback?: string) => string,
    onBuy: (border: IShopBorder) => void, onUse: (id: number) => void }> = props =>
{
    const { borders = [], activeId = 0, baseUrl = '', isVip = false, busy = false, t, onBuy, onUse } = props;
    const [ selectedId, setSelectedId ] = useState<number>(activeId);

    useEffect(() => { setSelectedId(activeId); }, [ activeId ]);

    const selected = borders.find(border => border.id === selectedId) || null;
    const previewRef = useRef<HTMLDivElement>(null);
    const [ fit, setFit ] = useState(1);

    // the stand + its frame (with the frame's overhang) is about 200 x 230; shrink it to the box, never enlarge
    useEffect(() =>
    {
        const element = previewRef.current;

        if(!element) return;

        const measure = () => setFit(Math.min(1, (element.clientWidth - 4) / 196, (element.clientHeight - 2) / 212));
        const observer = new ResizeObserver(measure);

        observer.observe(element);
        measure();

        return () => observer.disconnect();
    }, []);
    const inUse = (selectedId === activeId);
    const locked = !!selected && selected.vipOnly && !isVip;

    return (
        <section className="shop-borders">
            <header className="shop-section-header">
                <div className="shop-section-title">
                    <strong>{ t('borders.header', 'Borders') }</strong>
                    <span>{ t('borders.hint') }</span>
                </div>
            </header>
            <div className="shop-borders-layout">
                <div className="shop-borders-grid">
                    <button type="button" className={ `shop-border-item${ (selectedId === 0) ? ' is-selected' : '' }${ (activeId === 0) ? ' is-active' : '' }` } title={ t('borders.none', 'No border') } onClick={ () => setSelectedId(0) }>
                        <span className="shop-border-none">✕</span>
                    </button>
                    { borders.map(border =>
                        <button key={ border.id } type="button" title={ border.name }
                            className={ `shop-border-item${ (border.id === selectedId) ? ' is-selected' : '' }${ (border.id === activeId) ? ' is-active' : '' }${ border.owned ? ' is-owned' : '' }` }
                            onClick={ () => setSelectedId(border.id) }>
                            { /* the icon is the frame itself on a tiny infostand (the small name image is an ornament now) */ }
                            <span className="shop-border-thumb">
                                <span className="shop-border-mini">
                                    <ShopBorderFrame border={ border } baseUrl={ baseUrl } />
                                </span>
                            </span>
                            <ShopItemFlags owned={ border.owned } active={ border.id === activeId } vip={ border.vipOnly } small t={ t } />
                        </button>) }
                </div>
                <aside className="shop-border-detail">
                    
                    <div ref={ previewRef } className="shop-border-preview">
                        { /* your avatar stand exactly as on your profile, with the border drawn the way the profile draws it,
                             scaled down (never up) so the stand and its whole frame fit the box */ }
                        <div style={ { transform: `scale(${ fit })` } }>
                            <ShopProfileStand border={ selected } baseUrl={ baseUrl } />
                        </div>
                    </div>
                    <strong>{ selected ? selected.name : t('borders.none', 'No border') }</strong>
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
