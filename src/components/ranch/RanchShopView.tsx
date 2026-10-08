import { FC } from 'react';
import { FurniIconUrl } from '../../api';
import { IRanchState } from '../../api/games/RanchProtocol';
import { DraggableWindow } from '../../common';
import { RANCH_ICONS } from './RanchFx';

export const RANCH_SEEDS_ICON = 'ranch_c26_seedpacketsb';
export const RANCH_FERTILIZER_ICON = 'ranch_c26_soil';

export const RanchLabel = (key: string) => key.charAt(0).toUpperCase() + key.slice(1);

const Price: FC<{ amount: number, currency: string }> = props =>
{
    const { amount, currency } = props;
    const tokens = (currency === 'tokens');

    return (
        <span className={ 'ranch-shop-price' + (tokens ? ' is-tokens' : '') }>
            <img src={ tokens ? RANCH_ICONS.honor : RANCH_ICONS.gold } alt="" />
            { amount }
        </span>
    );
}

export const RanchShopView: FC<{ state: IRanchState, onBuy: (key: string, icon: string, title: string, unit: number, currency: string) => void, onClose: () => void }> = props =>
{
    const { state, onBuy, onClose } = props;
    const seeds = state.crops.filter(crop => crop.seeds > 0);
    const crops = state.crops.filter(crop => crop.crops > 0);
    const fertilizers = state.fertilizers.filter(fertilizer => fertilizer.amount > 0);

    return (
        <DraggableWindow uniqueKey="ranch-shop" handleSelector=".ranch-shop-header">
            <div className="nitro-ranch ranch-shop">
                <div className="ranch-shop-header">
                    <span>Ranch Shop</span>
                    <div className="ranch-shop-close" onClick={ onClose } />
                </div>
                <div className="ranch-shop-wallet">
                    <Price amount={ state.balance } currency="coins" />
                    <Price amount={ state.tokens } currency="tokens" />
                    <span className="ranch-shop-level">Ranch Level { state.level }</span>
                </div>
                <div className="ranch-shop-body">
                    <div className="ranch-shop-column">
                        <div className="ranch-shop-title">Buy</div>
                        { state.crops.map(crop =>
                        {
                            const locked = (state.level < crop.unlockLevel);

                            return (
                                <div key={ crop.crop } className={ 'ranch-shop-row' + (locked ? ' is-locked' : '') }>
                                    <div className="ranch-shop-icon" style={ { backgroundImage: `url(${ FurniIconUrl(RANCH_SEEDS_ICON) })` } }>
                                        { RANCH_ICONS[crop.crop] && <img className="ranch-shop-badge" src={ RANCH_ICONS[crop.crop] } alt="" /> }
                                    </div>
                                    <div className="ranch-shop-info">
                                        <div className="ranch-shop-name">{ RanchLabel(crop.crop) } Seeds</div>
                                        { locked
                                            ? <div className="ranch-shop-meta">Unlocks at Ranch Level { crop.unlockLevel }</div>
                                            : <div className="ranch-shop-meta"><Price amount={ crop.seedPrice } currency={ crop.seedCurrency } /> · grows in { crop.growMinutes } min</div> }
                                    </div>
                                    <div className={ 'ranch-shop-buy' + (locked ? ' is-disabled' : '') } onClick={ () => !locked && onBuy(crop.crop, crop.bigItem, `${ RanchLabel(crop.crop) } Seeds`, crop.seedPrice, crop.seedCurrency) }>{ locked ? `Lv ${ crop.unlockLevel }` : 'Buy' }</div>
                                </div>
                            );
                        }) }
                        { state.fertilizers.map(fertilizer => (
                            <div key={ fertilizer.kind } className="ranch-shop-row">
                                <div className="ranch-shop-icon" style={ { backgroundImage: `url(${ FurniIconUrl(RANCH_FERTILIZER_ICON) })` } } />
                                <div className="ranch-shop-info">
                                    <div className="ranch-shop-name">{ RanchLabel(fertilizer.kind) } Fertilizer</div>
                                    <div className="ranch-shop-meta"><Price amount={ fertilizer.price } currency={ fertilizer.currency } /> · crops grow faster</div>
                                </div>
                                <div className="ranch-shop-buy" onClick={ () => onBuy('fertilizer_' + fertilizer.kind, RANCH_FERTILIZER_ICON, `${ RanchLabel(fertilizer.kind) } Fertilizer`, fertilizer.price, fertilizer.currency) }>Buy</div>
                            </div>
                        )) }
                    </div>
                    <div className="ranch-shop-column">
                        <div className="ranch-shop-title">Your barn</div>
                        { !seeds.length && !crops.length && !fertilizers.length && <div className="ranch-shop-empty">Your barn is empty.</div> }
                        { seeds.map(crop => (
                            <div key={ 'seed-' + crop.crop } className="ranch-shop-row is-stock">
                                <div className="ranch-shop-icon" style={ { backgroundImage: `url(${ FurniIconUrl(RANCH_SEEDS_ICON) })` } }>
                                    { RANCH_ICONS[crop.crop] && <img className="ranch-shop-badge" src={ RANCH_ICONS[crop.crop] } alt="" /> }
                                </div>
                                <div className="ranch-shop-name">{ crop.seeds } { RanchLabel(crop.crop) } Seeds</div>
                            </div>
                        )) }
                        { crops.map(crop => (
                            <div key={ 'crop-' + crop.crop } className="ranch-shop-row is-stock">
                                <div className="ranch-shop-icon is-pixel">{ RANCH_ICONS[crop.crop] && <img src={ RANCH_ICONS[crop.crop] } alt="" /> }</div>
                                <div className="ranch-shop-name">{ crop.crops } { RanchLabel(crop.crop) }</div>
                            </div>
                        )) }
                        { fertilizers.map(fertilizer => (
                            <div key={ fertilizer.kind } className="ranch-shop-row is-stock">
                                <div className="ranch-shop-icon" style={ { backgroundImage: `url(${ FurniIconUrl(RANCH_FERTILIZER_ICON) })` } } />
                                <div className="ranch-shop-name">{ fertilizer.amount } { RanchLabel(fertilizer.kind) } Fertilizer</div>
                            </div>
                        )) }
                        <div className="ranch-shop-hint">Sell your crops to the buyers in the ranch.</div>
                    </div>
                </div>
            </div>
        </DraggableWindow>
    );
}

export const RanchBarnView: FC<{ state: IRanchState, onAction: (action: string, arg: string) => void, onShop: () => void }> = props =>
{
    const { state, onAction, onShop } = props;
    const selected = state.pending ?? '';

    return (
        <div className="nitro-ranch ranch-barn">
            <div className="ranch-barn-title">Barn</div>
            <div className="ranch-barn-slots">
                { state.crops.filter(crop => crop.seeds > 0).map(crop => (
                    <div key={ 'seed-' + crop.crop } className={ 'ranch-barn-slot' + ((selected === 'plant:' + crop.crop) ? ' is-selected' : '') } title={ `${ RanchLabel(crop.crop) } Seeds - click, then click a farming slot` } style={ { backgroundImage: `url(${ FurniIconUrl(RANCH_SEEDS_ICON) })` } } onClick={ () => onAction('plant', crop.crop) }>
                        { RANCH_ICONS[crop.crop] && <img className="ranch-shop-badge" src={ RANCH_ICONS[crop.crop] } alt="" /> }
                        <span className="ranch-barn-count">{ crop.seeds }</span>
                    </div>
                )) }
                { state.fertilizers.filter(fertilizer => fertilizer.amount > 0).map(fertilizer => (
                    <div key={ fertilizer.kind } className={ 'ranch-barn-slot' + ((selected === 'fertilizer:' + fertilizer.kind) ? ' is-selected' : '') } title={ `${ RanchLabel(fertilizer.kind) } Fertilizer - click, then click a growing crop` } style={ { backgroundImage: `url(${ FurniIconUrl(RANCH_FERTILIZER_ICON) })` } } onClick={ () => onAction('fertilizer', fertilizer.kind) }>
                        <span className="ranch-barn-tag">{ fertilizer.kind.charAt(0).toUpperCase() }</span>
                        <span className="ranch-barn-count">{ fertilizer.amount }</span>
                    </div>
                )) }
                { state.crops.filter(crop => crop.crops > 0).map(crop => (
                    <div key={ 'crop-' + crop.crop } className="ranch-barn-slot is-pixel" title={ `${ crop.crops } ${ RanchLabel(crop.crop) } - sell them to the buyers` }>
                        { RANCH_ICONS[crop.crop] && <img src={ RANCH_ICONS[crop.crop] } alt="" /> }
                        <span className="ranch-barn-count">{ crop.crops }</span>
                    </div>
                )) }
                <div className="ranch-barn-slot is-shop" title="Ranch Shop" onClick={ onShop }>Shop</div>
            </div>
        </div>
    );
}
