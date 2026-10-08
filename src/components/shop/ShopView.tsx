import { FC, useEffect, useRef, useState } from 'react';
import { AddEventLinkTracker, FeedbackKind, GetConfiguration, RemoveLinkEventTracker, SendMessageComposer } from '../../api';
import { RememberAuraVisual } from '../../api/shop/ShopAuras';
import { IShopAura, IShopBorder, IShopData, IShopNameItem, IShopOrnament, IShopResult, IShopSpawn, RegisterShopMessages, ShopBuyComposer, ShopDataEvent, ShopEquipComposer, ShopNameSaveComposer, ShopOpenComposer, ShopResultEvent } from '../../api/shop/ShopProtocol';
import { LayoutCurrencyIcon, NitroCardContentView, NitroCardHeaderView, NitroCardView } from '../../common';
import { useMessageEvent, useNotification, usePurse, useSessionInfo } from '../../hooks';
import { ShopAurasView } from './ShopAurasView';
import { ShopBordersView } from './ShopBordersView';
import { ShopBubblesView } from './ShopBubblesView';
import { ShopNamesView } from './ShopNamesView';
import { ShopOrnamentsView } from './ShopOrnamentsView';
import { ShopSpawnsView } from './ShopSpawnsView';

// hCMS Shop window. Everything shown (tabs, texts, items, prices) comes from the server, which reads it from the
// database. Opened with the link shop/toggle (or shop/show, shop/tab/<code>).

/** Text with *word* marks: the marked words are shown in gold. */
const GoldText = (text: string) => (text || '').split('*').map((part, index) => ((index % 2) ? <b key={ index } className="shop-gold">{ part }</b> : part));

export const ShopView: FC<{}> = props =>
{
    RegisterShopMessages();

    const [ isVisible, setIsVisible ] = useState(false);
    const { showFeedback = null } = useNotification();
    const [ data, setData ] = useState<IShopData>(null);
    const { purse = null } = usePurse();
    const { chatStyleId = 0, updateChatStyleId = null } = useSessionInfo();
    const [ tab, setTab ] = useState<string>(null);
    const [ busy, setBusy ] = useState(false);
    const [ result, setResult ] = useState<IShopResult>(null);
    const visibleRef = useRef(false);

    visibleRef.current = isVisible;

    const t = (key: string, fallback: string = '') => (data?.texts?.[key] ?? fallback);
    const siteUrl = GetConfiguration<string>('url.prefix', '');

    const request = () => SendMessageComposer(new ShopOpenComposer(GetConfiguration<string>('shop.language', '')));

    useEffect(() =>
    {
        const tracker = {
            linkReceived: (url: string) =>
            {
                const parts = url.split('/');

                if(parts.length < 2) return;

                switch(parts[1])
                {
                    case 'show': setIsVisible(true); return;
                    case 'hide': setIsVisible(false); return;
                    case 'toggle': setIsVisible(value => !value); return;
                    case 'tab': setIsVisible(true); setTab(parts[2] || null); return;
                }
            },
            eventUrlPrefix: 'shop/'
        };

        AddEventLinkTracker(tracker);

        return () => RemoveLinkEventTracker(tracker);
    }, []);

    useEffect(() =>
    {
        if(!isVisible) return;

        setResult(null);
        request();
    }, [ isVisible ]);

    useMessageEvent<ShopDataEvent>(ShopDataEvent, event =>
    {
        const next = event.getParser().data;

        if(!next) return;

        next.auras?.forEach(RememberAuraVisual);
        setData(next);
        setBusy(false);
        setTab(current => (current && next.tabs.includes(current)) ? current : (next.tabs[0] || null));
    });

    useMessageEvent<ShopResultEvent>(ShopResultEvent, event =>
    {
        const next = event.getParser().data;

        if(!next) return;

        setBusy(false);
        setResult(next);

        // always a feedback bubble (user: the window stays clean, no result text inside it)
        if(next.message) showFeedback(next.message, next.ok ? 'success' : null);
    });

    const buy = (aura: IShopAura) => { setBusy(true); setResult(null); SendMessageComposer(new ShopBuyComposer('aura', aura.id)); };
    const wear = (aura: IShopAura) => { setBusy(true); setResult(null); SendMessageComposer(new ShopEquipComposer('aura', aura.id)); };
    const remove = () => { setBusy(true); setResult(null); SendMessageComposer(new ShopEquipComposer('aura', 0)); };
    const buySpawn = (spawn: IShopSpawn) => { setBusy(true); setResult(null); SendMessageComposer(new ShopBuyComposer('spawn', spawn.id)); };
    const equipSpawn = (spawn: IShopSpawn) => { setBusy(true); setResult(null); SendMessageComposer(new ShopEquipComposer('spawn', spawn.id)); };
    const removeSpawn = () => { setBusy(true); setResult(null); SendMessageComposer(new ShopEquipComposer('spawn', 0)); };
    const buyBorder = (border: IShopBorder) => { setBusy(true); setResult(null); SendMessageComposer(new ShopBuyComposer('border', border.id)); };
    const useBorder = (id: number) => { setBusy(true); setResult(null); SendMessageComposer(new ShopEquipComposer('border', id)); };
    const buyOrnament = (ornament: IShopOrnament) => { setBusy(true); setResult(null); SendMessageComposer(new ShopBuyComposer('ornament', ornament.id)); };
    const useOrnament = (id: number) => { setBusy(true); setResult(null); SendMessageComposer(new ShopEquipComposer('ornament', id)); };

    const buyNameItem = (item: IShopNameItem) => { setBusy(true); setResult(null); SendMessageComposer(new ShopBuyComposer('name_' + item.kind, item.id)); };
    const useNameItem = (kind: string, id: number) => { setBusy(true); setResult(null); SendMessageComposer(new ShopEquipComposer('name_' + kind, id)); };

    if(!isVisible) return null;

    return (
        <NitroCardView uniqueKey="hcms-shop" className="hcms-shop" theme="primary-slim" style={ { width: 760, height: 600, ['--center-card-bg' as string]: `url(${ siteUrl }/assets/img/background/banner_card_banners.png)`, ['--center-loader' as string]: `url(${ siteUrl }/assets/img/loader/logo_loader_black.png)` } }>
            <NitroCardHeaderView headerText={ t('shop.title', 'Presence') } onCloseClick={ () => setIsVisible(false) } />
            <NitroCardContentView classNames={ [ 'hcms-shop-content' ] }>
                { /* the website Center's layout 1:1 (hCMS center/layouts/shell + partials/menu): the menu of icon pills,
                     then the header (the currency box + the alert of the open tab), then the tab's content */ }
                { data && (data.tabs.length > 1) &&
                    <div className="center-menu-wrapper" role="tablist">
                        { data.tabs.map(code =>
                            <button key={ code } type="button" role="tab" aria-selected={ tab === code } className={ `center-menu-items${ (tab === code) ? ' is-active' : '' }` } onClick={ () => setTab(code) }>
                                <div className="icon-center" style={ data.tabIcons?.[code] ? { backgroundImage: `url(${ data.tabIcons[code] })` } : null } />
                                <span>{ t('tab.' + code, code) }</span>
                            </button>) }
                    </div> }
                <div className="container_center">
                    { data &&
                        <div className="center-header">
                            <div className="center-header-monnaie">
                                { (data.balanceTypes?.length ? data.balanceTypes : GetConfiguration<number[]>('system.currency.types', [ data.currencyType ])).map(type =>
                                    <div key={ type } className="center-header-monnaie-title">
                                        <LayoutCurrencyIcon type={ type } />
                                        <div className="center-header-monnaie-text">{ (purse?.activityPoints?.get(type) ?? ((type === data.currencyType) ? data.balance : 0) ?? 0).toLocaleString() }</div>
                                    </div>) }
                            </div>
                            { data.enabled && tab && t('alert.' + tab) &&
                                <div className="center-alert">
                                    { data.tabIcons?.[tab] && <div className="center-alert-icon" style={ { backgroundImage: `url(${ data.tabIcons[tab] })` } } /> }
                                    <div className="center-alert-text">{ GoldText(t('alert.' + tab)) }</div>
                                </div> }
                        </div> }
                    <div className="center-content-wrapper">
                        <div className="tab-pane-center active shop-panel">
                            { !data &&
                                <div className="sub-section-loader show">
                                    <div className="sub-section-loader-content"><div className="sub-section-spinner" /></div>
                                </div> }
                            { data && !data.enabled && <div className="center-empty">{ t('msg.closed') }</div> }
                            { data && data.enabled && (tab === 'auras') &&
                                <ShopAurasView auras={ data.auras } activeId={ data.active?.aura || 0 } isVip={ data.isVip } busy={ busy } t={ t } onBuy={ buy } onWear={ wear } onRemove={ remove } /> }
                            { data && data.enabled && (tab === 'borders') &&
                                <ShopBordersView borders={ data.borders || [] } activeId={ data.active?.border || 0 } baseUrl={ data.bordersUrl } isVip={ data.isVip } busy={ busy } t={ t }
                                    onBuy={ buyBorder } onUse={ useBorder } /> }
                            { data && data.enabled && (tab === 'ornaments') &&
                                <ShopOrnamentsView ornaments={ data.ornaments || [] } activeId={ data.active?.ornament || 0 } baseUrl={ data.ornamentsUrl } isVip={ data.isVip } busy={ busy } t={ t }
                                    onBuy={ buyOrnament } onUse={ useOrnament } /> }
                            { data && data.enabled && (tab === 'names') &&
                                <ShopNamesView style={ data.nameStyle } items={ data.nameItems || [] } active={ data.active || {} } namesUrl={ data.namesUrl || '' } isVip={ data.isVip } busy={ busy } t={ t }
                                    onSave={ style => { setBusy(true); setResult(null); SendMessageComposer(new ShopNameSaveComposer(style)); } }
                                    onBuy={ buyNameItem } onUse={ useNameItem } /> }
                            { data && data.enabled && (tab === 'bubbles') &&
                                <ShopBubblesView bubbles={ data.bubbles || [] } currentStyleId={ chatStyleId } isVip={ data.isVip } busy={ busy } t={ t }
                                    onBuy={ bubble => { setBusy(true); setResult(null); SendMessageComposer(new ShopBuyComposer('bubble', bubble.id)); } }
                                    onUse={ bubble => { updateChatStyleId(bubble.bubbleId); showFeedback(t('msg.bubble_used', '%name% is now your chat bubble.').replace('%name%', bubble.name), 'success'); } } /> }
                            { data && data.enabled && (tab === 'spawns') &&
                                <ShopSpawnsView spawns={ data.spawns || [] } activeId={ data.active?.spawn || 0 } pattern={ data.spawnFramesUrl } isVip={ data.isVip } busy={ busy } t={ t }
                                    onBuy={ buySpawn } onEquip={ equipSpawn } onRemove={ removeSpawn } /> }
                        </div>
                    </div>
                </div>
            </NitroCardContentView>
        </NitroCardView>
    );
}
