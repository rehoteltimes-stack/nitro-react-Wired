import { FC } from 'react';
import { GetSessionDataManager } from '../../api';
import { IShopBubble } from '../../api/shop/ShopProtocol';
import { Button, LayoutCurrencyIcon } from '../../common';
import { ShopItemFlags } from './ShopItemFlags';

/** A chat bubble drawn with the room chat's own markup (chat-bubble bubble-<id>), the player's name and a sample line. */
export const ShopBubbleSample: FC<{ bubbleId: number, text: string }> = ({ bubbleId, text }) =>
    <div className="shop-bubble-sample">
        <div className="bubble-container">
            <div className={ `chat-bubble bubble-${ bubbleId }` }>
                <div className="user-container" />
                <div className="chat-content">
                    <b className="username">{ GetSessionDataManager().userName }: </b>
                    <span className="message">{ text }</span>
                </div>
            </div>
        </div>
    </div>;

/** Bubbles tab: every premium chat bubble with a live sample. Owned ones can be used straight away (the same as picking it in the chat's bubble picker). */
export const ShopBubblesView: FC<{ bubbles: IShopBubble[], currentStyleId: number, isVip: boolean, busy: boolean, t: (key: string, fallback?: string) => string,
    onBuy: (bubble: IShopBubble) => void, onUse: (bubble: IShopBubble) => void }> = props =>
{
    const { bubbles = [], currentStyleId = 0, isVip = false, busy = false, t, onBuy, onUse } = props;

    return (
        <section className="shop-bubbles">
            <header className="shop-section-header">
                <div className="shop-section-title">
                    <strong>{ t('bubbles.header', 'Chat bubbles') }</strong>
                    <span>{ t('bubbles.hint') }</span>
                </div>
            </header>
            { !bubbles.length && <p className="shop-empty">…</p> }
            <div className="shop-bubbles-grid">
                { bubbles.map(bubble =>
                {
                    const inUse = bubble.owned && (bubble.bubbleId === currentStyleId);
                    const locked = !bubble.owned && bubble.vipOnly && !isVip;

                    return (
                        <div key={ bubble.id } className={ `shop-bubble-card ${ inUse ? 'is-active' : '' }` }>
                            
                            <ShopBubbleSample bubbleId={ bubble.bubbleId } text={ t('bubbles.sample', 'Hello!') } />
                            <ShopItemFlags owned={ bubble.owned } active={ inUse } vip={ bubble.vipOnly } t={ t } />
                            <div className="shop-bubble-name">{ bubble.name }</div>
                            { bubble.owned
                                ? (inUse
                                    ? <span className="shop-border-state">{ t('label.in_use', 'In use') }</span>
                                    : <Button variant="primary" disabled={ busy } onClick={ () => onUse(bubble) }>{ t('button.use', 'Use') }</Button>)
                                : <Button className="shop-price-button" disabled={ busy || locked } title={ locked ? t('label.vip_only', 'VIP only') : undefined } onClick={ () => onBuy(bubble) }>
                                    <LayoutCurrencyIcon type={ bubble.currencyType } /> { bubble.price.toLocaleString() }
                                </Button> }
                        </div>
                    );
                }) }
            </div>
        </section>
    );
}
