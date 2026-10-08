import { FC, Fragment, useEffect, useMemo, useState } from 'react';
import { GetSessionDataManager } from '../../api';
import { IShopNameDecor, IShopNameItem, IShopNameStyle } from '../../api/shop/ShopProtocol';
import { Button, LayoutCurrencyIcon } from '../../common';
import { StyledNameView } from './ShopStyledName';
import { ShopItemFlags } from './ShopItemFlags';

// Presence > Name, laid out like the other Presence tabs (Borders / Ornaments): a section header, a grid on the left and a
// detail panel on the right (preview, name, state, Use / Buy / Save). "Tag" = habbo.cc's "Nametag & Farben" (tag or emoji,
// tag / name colour with their palette and presets, VIP shadow and glow); the other modes are HabboJe's name decorations
// (colours, outlines, icons, backgrounds), collected and worn like borders, ✕ first to wear none.

/** habbo.cc's palette (21 colours) and presets. */
const PALETTE = [ '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#800080', '#ffc0cb', '#a52a2a', '#808080', '#000000', '#ffd700', '#32cd32', '#ff1493', '#00ced1', '#ff4500', '#8b008b', '#228b22', '#1e90ff' ];

const PRESETS = [
    { name: 'Classic', tagColor: '#ffffff', nameColor: '#ffffff' },
    { name: 'Red', tagColor: '#ff0000', nameColor: '#ffffff' },
    { name: 'Blue', tagColor: '#1e90ff', nameColor: '#ffffff' },
    { name: 'Green', tagColor: '#32cd32', nameColor: '#ffffff' },
    { name: 'Gold', tagColor: '#ffd700', nameColor: '#ffffff' },
    { name: 'Pink', tagColor: '#ff1493', nameColor: '#ffffff' },
    { name: 'Cyan', tagColor: '#00ced1', nameColor: '#ffffff' },
    { name: 'Orange', tagColor: '#ffa500', nameColor: '#ffffff' }
];

const EMOJIS = [ '⭐', '🔥', '💎', '👑', '🎯', '⚡', '💫', '🌟', '✨', '🎨', '🎭', '🎪', '🎬', '🎮', '🏆', '🥇', '💯', '🔱', '⚜️', '🔰' ];

const TAG_MAX = 5;

type Mode = 'tag' | IShopNameItem['kind'];

const KINDS: IShopNameItem['kind'][] = [ 'color', 'border', 'icon', 'background' ];

const EMPTY_STYLE: IShopNameStyle = {
    tag: '', tagColor: '', nameColor: '',
    tagShadowColor: '', tagShadowBlur: 0, tagShadowX: 0, tagShadowY: 0,
    nameShadowColor: '', nameShadowBlur: 0, nameShadowX: 0, nameShadowY: 0,
    tagGlowColor: '', tagGlowSize: 0, nameGlowColor: '', nameGlowSize: 0
};

const EMPTY_DECOR: IShopNameDecor = { ...EMPTY_STYLE, color: '', border: '', icon: '', background: '' };

const cutTag = (value: string) => Array.from(value || '').slice(0, TAG_MAX).join('');

/** A colour field: picker + hex text + palette + reset (empty = the normal colour). */
const ColorField: FC<{ label: string, value: string, onChange: (value: string) => void, resetLabel: string }> = ({ label, value, onChange, resetLabel }) =>
{
    const [ showPalette, setShowPalette ] = useState(false);

    return (
        <div className="shop-names-field">
            <div className="shop-names-field-head">
                <span>{ label }</span>
                <button type="button" className="shop-names-link" onClick={ () => onChange('') }>{ resetLabel }</button>
            </div>
            <div className="shop-names-color-row">
                <input type="color" className="shop-names-color" value={ value || '#ffffff' } onChange={ event => onChange(event.target.value) } />
                <input type="text" className="shop-names-input shop-names-hex" value={ value } maxLength={ 7 } placeholder="#ffffff" onChange={ event => onChange(event.target.value.trim()) } />
                <button type="button" className="shop-names-palette-button" title="Palette" onClick={ () => setShowPalette(open => !open) }>🎨</button>
            </div>
            { showPalette &&
                <div className="shop-names-palette">
                    { PALETTE.map(color =>
                        <button key={ color } type="button" className={ `shop-names-swatch${ (value === color) ? ' is-active' : '' }` } style={ { backgroundColor: color } } title={ color } onClick={ () => { onChange(color); setShowPalette(false); } } />) }
                </div> }
        </div>
    );
}

/** A slider row (VIP shadow / glow). */
const Range: FC<{ label: string, min: number, max: number, value: number, onChange: (value: number) => void }> = ({ label, min, max, value, onChange }) =>
    <label className="shop-names-range">
        <span>{ label }</span>
        <input type="range" min={ min } max={ max } value={ value } onChange={ event => onChange(parseInt(event.target.value) || 0) } />
        <b>{ value }</b>
    </label>;

export interface ShopNamesViewProps
{
    style: IShopNameStyle;
    items: IShopNameItem[];
    active: Record<string, number>;
    namesUrl: string;
    isVip: boolean;
    busy: boolean;
    t: (key: string, fallback?: string) => string;
    onSave: (style: IShopNameStyle) => void;
    onBuy: (item: IShopNameItem) => void;
    onUse: (kind: IShopNameItem['kind'], itemId: number) => void;
}

export const ShopNamesView: FC<ShopNamesViewProps> = props =>
{
    const { style = null, items = [], active = {}, namesUrl = '', isVip = false, busy = false, t, onSave, onBuy, onUse } = props;
    const [ draft, setDraft ] = useState<IShopNameStyle>({ ...EMPTY_STYLE, ...(style || {}) });
    const [ showEmojis, setShowEmojis ] = useState(false);
    const [ open, setOpen ] = useState<string>(null);
    const [ mode, setMode ] = useState<Mode>('tag');
    const [ selectedId, setSelectedId ] = useState<number>(0);
    const username = GetSessionDataManager().userName;

    // the saved style comes back after every save / purchase
    useEffect(() => setDraft({ ...EMPTY_STYLE, ...(style || {}) }), [ style ]);

    const set = (patch: Partial<IShopNameStyle>) => setDraft(value => ({ ...value, ...patch }));

    const kinds = KINDS.filter(kind => items.some(item => item.kind === kind));
    const activeId = (mode === 'tag') ? 0 : (active[`name_${ mode }`] || 0);

    // selecting a mode starts on what is worn there
    useEffect(() => setSelectedId(activeId), [ mode, activeId ]);

    /** The worn decorations, for the preview. */
    const worn = useMemo(() =>
    {
        const find = (kind: IShopNameItem['kind']) => items.find(item => (item.kind === kind) && (item.id === (active[`name_${ kind }`] || 0)))?.data || '';

        return { color: find('color'), border: find('border'), icon: find('icon'), background: find('background') };
    }, [ items, active ]);

    // sorted like the rest of Presence: everyone first, then VIP, then staff / rank items, each group under a heading
    const group = (item: IShopNameItem) => (item.rankItem ? 2 : (item.vipOnly ? 1 : 0));
    const modeItems = (mode === 'tag') ? [] : items.filter(item => item.kind === mode).sort((a, b) => group(a) - group(b));
    const selected = modeItems.find(item => item.id === selectedId) || null;
    const inUse = (mode !== 'tag') && (selectedId === activeId);
    const locked = !!selected && !selected.owned && selected.vipOnly && !isVip;
    const changed = JSON.stringify({ ...EMPTY_STYLE, ...(style || {}) }) !== JSON.stringify(draft);

    // the preview: the tag being edited + the worn decorations, with the selected decoration tried on
    const preview: IShopNameDecor = { ...draft, ...worn, ...((mode !== 'tag') ? { [mode]: selected ? selected.data : '' } : {}) };

    const vipSection = (key: string, title: string, body: JSX.Element) =>
        <div className="shop-names-vip">
            <button type="button" className="shop-names-vip-head" onClick={ () => setOpen(value => (value === key) ? null : key) }>
                <span>{ title }</span>
                <span>{ (open === key) ? '▲' : '▼' }</span>
            </button>
            { (open === key) && <div className="shop-names-vip-body">{ body }</div> }
        </div>;

    return (
        <section className="shop-borders shop-names">
            <header className="shop-section-header">
                <div className="shop-section-title">
                    <strong>{ t('tab.names', 'Name') }</strong>
                    <span>{ (mode === 'tag') ? t('names.tag_hint', 'Leave empty to remove the tag.') : t('names.items', 'Name decorations') }</span>
                </div>
                <div className="shop-names-kinds">
                    { ([ 'tag', ...kinds ] as Mode[]).map(value =>
                        <button key={ value } type="button" className={ `shop-names-kind${ (value === mode) ? ' active' : '' }` } onClick={ () => setMode(value) }>
                            { (value === 'tag') ? 'Tag' : t('names.kind.' + value, value) }
                        </button>) }
                </div>
            </header>
            <div className="shop-borders-layout">
                { (mode === 'tag')
                    ? <div className="shop-borders-grid shop-names-form">
                        <div className="shop-names-field">
                            <div className="shop-names-field-head"><span>{ t('names.tag', 'Tag (max. 5 characters)') }</span></div>
                            <div className="shop-names-color-row">
                                <input type="text" className="shop-names-input" value={ draft.tag } placeholder={ t('names.tag_placeholder', 'Tag or emoji...') } onChange={ event => set({ tag: cutTag(event.target.value) }) } />
                                <button type="button" className="shop-names-palette-button" onClick={ () => setShowEmojis(value => !value) }>⭐</button>
                            </div>
                            { showEmojis &&
                                <div className="shop-names-emojis">
                                    { EMOJIS.map(emoji => <button key={ emoji } type="button" className="shop-names-emoji" onClick={ () => { set({ tag: cutTag(emoji) }); setShowEmojis(false); } }>{ emoji }</button>) }
                                </div> }
                        </div>
                        <ColorField label={ t('names.tag_color', 'Tag colour') } value={ draft.tagColor } resetLabel={ t('names.reset', 'Reset') } onChange={ value => set({ tagColor: value }) } />
                        <ColorField label={ t('names.name_color', 'Name colour') } value={ draft.nameColor } resetLabel={ t('names.reset', 'Reset') } onChange={ value => set({ nameColor: value }) } />
                        <div className="shop-names-field">
                            <div className="shop-names-field-head"><span>{ t('names.presets', 'Presets') }</span></div>
                            <div className="shop-names-presets">
                                { PRESETS.map(preset =>
                                    <button key={ preset.name } type="button" className="shop-names-preset" title={ preset.name } onClick={ () => set({ tagColor: preset.tagColor, nameColor: preset.nameColor }) }>
                                        <span style={ { backgroundColor: preset.tagColor } } />
                                        <span style={ { backgroundColor: preset.nameColor } } />
                                    </button>) }
                            </div>
                        </div>
                        { isVip
                            ? <>
                                { vipSection('tagShadow', t('names.tag_shadow', 'VIP: tag shadow'), <>
                                    <ColorField label="" value={ draft.tagShadowColor } resetLabel={ t('names.reset', 'Reset') } onChange={ value => set({ tagShadowColor: value }) } />
                                    <Range label={ t('names.blur', 'Blur') } min={ 0 } max={ 20 } value={ draft.tagShadowBlur } onChange={ value => set({ tagShadowBlur: value }) } />
                                    <Range label="X" min={ -10 } max={ 10 } value={ draft.tagShadowX } onChange={ value => set({ tagShadowX: value }) } />
                                    <Range label="Y" min={ -10 } max={ 10 } value={ draft.tagShadowY } onChange={ value => set({ tagShadowY: value }) } />
                                </>) }
                                { vipSection('tagGlow', t('names.tag_glow', 'VIP: tag glow'), <>
                                    <ColorField label="" value={ draft.tagGlowColor } resetLabel={ t('names.reset', 'Reset') } onChange={ value => set({ tagGlowColor: value }) } />
                                    <Range label={ t('names.size', 'Size') } min={ 0 } max={ 20 } value={ draft.tagGlowSize } onChange={ value => set({ tagGlowSize: value }) } />
                                </>) }
                                { vipSection('nameShadow', t('names.name_shadow', 'VIP: name shadow'), <>
                                    <ColorField label="" value={ draft.nameShadowColor } resetLabel={ t('names.reset', 'Reset') } onChange={ value => set({ nameShadowColor: value }) } />
                                    <Range label={ t('names.blur', 'Blur') } min={ 0 } max={ 20 } value={ draft.nameShadowBlur } onChange={ value => set({ nameShadowBlur: value }) } />
                                    <Range label="X" min={ -10 } max={ 10 } value={ draft.nameShadowX } onChange={ value => set({ nameShadowX: value }) } />
                                    <Range label="Y" min={ -10 } max={ 10 } value={ draft.nameShadowY } onChange={ value => set({ nameShadowY: value }) } />
                                </>) }
                                { vipSection('nameGlow', t('names.name_glow', 'VIP: name glow'), <>
                                    <ColorField label="" value={ draft.nameGlowColor } resetLabel={ t('names.reset', 'Reset') } onChange={ value => set({ nameGlowColor: value }) } />
                                    <Range label={ t('names.size', 'Size') } min={ 0 } max={ 20 } value={ draft.nameGlowSize } onChange={ value => set({ nameGlowSize: value }) } />
                                </>) }
                            </>
                            : <small className="shop-names-hint">{ t('names.vip_hint', 'Shadow and glow are for VIPs.') }</small> }
                    </div>
                    : <div className="shop-borders-grid">
                        <button type="button" className={ `shop-border-item${ (selectedId === 0) ? ' is-selected' : '' }${ (activeId === 0) ? ' is-active' : '' }` } title={ t('names.none', 'None') } onClick={ () => setSelectedId(0) }>
                            <span className="shop-border-none">✕</span>
                        </button>
                        { modeItems.map((item, index) =>
                            <Fragment key={ item.id }>
                            { ((index === 0) || (group(modeItems[index - 1]) !== group(item))) &&
                                <div className="shop-names-group">{ [ t('names.group_all', 'Everyone'), t('names.group_vip', 'VIP'), t('names.group_staff', 'Staff & ranks') ][group(item)] }</div> }
                            <button type="button" title={ item.name + (item.vipOnly ? ' (VIP)' : '') }
                                className={ `shop-border-item shop-names-tile${ (item.id === selectedId) ? ' is-selected' : '' }${ (item.id === activeId) ? ' is-active' : '' }${ item.owned ? ' is-owned' : '' }` }
                                onClick={ () => setSelectedId(item.id) }>
                                <StyledNameView name="Ab" decor={ { ...EMPTY_DECOR, [item.kind]: item.data } } namesUrl={ namesUrl } />
                                <ShopItemFlags owned={ item.owned && !item.rankItem } active={ item.id === activeId } vip={ item.vipOnly } staff={ item.rankItem } small t={ t } />
                            </button>
                            </Fragment>) }
                    </div> }
                <aside className="shop-border-detail">
                    
                    <div className="shop-border-preview shop-names-preview">
                        <div className="bubble-container">
                            <div className="chat-bubble bubble-0">
                                <div className="user-container" />
                                <div className="chat-content">
                                    <b className="username"><StyledNameView name={ username } decor={ preview } namesUrl={ namesUrl } suffix=": " /></b>
                                    <span className="message">{ t('names.preview_message', 'Hello, this is my name!') }</span>
                                </div>
                            </div>
                        </div>
                        <div className="shop-names-preview-plain"><StyledNameView name={ username } decor={ preview } namesUrl={ namesUrl } /></div>
                    </div>
                    { (mode === 'tag')
                        ? <>
                            <strong>{ t('names.preview', 'Preview') }</strong>
                            <div className="shop-names-actions">
                                <Button variant="secondary" disabled={ busy } onClick={ () => setDraft({ ...EMPTY_STYLE }) }>{ t('names.reset', 'Reset') }</Button>
                                <Button variant="success" disabled={ busy || !changed } onClick={ () => onSave(draft) }>{ t('names.save', 'Save') }</Button>
                            </div>
                        </>
                        : <>
                            <strong>{ selected ? selected.name : t('names.none', 'None') }</strong>
                            { inUse && <span className="shop-border-state">{ t('label.in_use', 'In use') }</span> }
                            { !inUse && selected?.rankItem && <span className="shop-border-state">{ t('names.rank_free', 'Free for your rank') }</span> }
                            { !selected || selected.owned
                                ? <Button variant="success" disabled={ busy || inUse } onClick={ () => onUse(mode as IShopNameItem['kind'], selectedId) }>{ inUse ? t('label.in_use', 'In use') : t('button.use', 'Use') }</Button>
                                : <Button variant="primary" className="shop-price-button" disabled={ busy || locked } title={ locked ? t('label.vip_only', 'VIP only') : undefined } onClick={ () => onBuy(selected) }>
                                    <LayoutCurrencyIcon type={ selected.currencyType } />
                                    <span>{ selected.price.toLocaleString() }</span>
                                </Button> }
                        </> }
                </aside>
            </div>
        </section>
    );
}
