import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { GetConfiguration, BotPanelAction, BotPanelActionComposer, BotPanelRequestComposer, BotPanelStateEvent, BotPanelStateParser, BotTemplateDetailEvent, BotTemplateDetailParser, BotTemplateDetailRequestComposer, RegisterBotPanelMessages, SendMessageComposer } from '../../../../api';
import { AdminBannerListComposer, AdminBannerListEvent, AdminCurrencyChangeComposer, AdminCurrencyLookupComposer, AdminCurrencyResultEvent, AdminCurrencyResultParser, AdminGiveComposer, AdminGiveKind, AdminGiveResultEvent, RegisterAdminCurrencyMessages } from '../../../../api/admin/AdminCurrencyProtocol';
import { RegisterShopStaffMessages, ShopGiveComposer } from '../../../../api/shop/ShopStaffProtocol';
import { IShopData, RegisterShopMessages, ShopDataEvent, ShopOpenComposer, ShopResultEvent } from '../../../../api/shop/ShopProtocol';
import { Button, CustomSelect, DraggableWindowPosition, Flex, LayoutAvatarImageView, LayoutCurrencyIcon, NitroCardContentView, NitroCardHeaderView, NitroCardTabsItemView, NitroCardTabsView, NitroCardView, Text } from '../../../../common';
import { useMessageEvent } from '../../../../hooks';

// Mod Tools > Administration (rank 7+, user 2026-09-28): replaces the old Bots window. The bot management itself moved to
// the website admin panel (Administration > Bots); only the room templates stay here, because building one sends you into
// the new room. Plus a small currency panel: the website's admin grant, done from the game.

interface ModToolsAdministrationViewProps
{
    onCloseClick: () => void;
}

const TABS = [ 'Currency', 'Give', 'Room templates' ];


// Two-step button, like the catalog's Buy / Confirm: the first click turns it into "Confirm" for a few seconds, a second click within
// that time does it, and it goes back to normal on its own. Used for everything that cannot be undone.
const ConfirmButton: FC<{ label: string; variant?: 'primary' | 'danger' | 'secondary' | 'success'; disabled?: boolean; onConfirm: () => void }> = props =>
{
    const { label, variant = 'danger', disabled = false, onConfirm } = props;
    const [ confirming, setConfirming ] = useState(false);
    const timer = useRef<ReturnType<typeof setTimeout>>(null);

    useEffect(() => () => clearTimeout(timer.current), []);

    const click = () =>
    {
        if(!confirming)
        {
            setConfirming(true);
            timer.current = setTimeout(() => setConfirming(false), 3000);

            return;
        }

        clearTimeout(timer.current);
        setConfirming(false);
        onConfirm();
    }

    return <Button variant={ confirming ? 'success' : variant } disabled={ disabled } onClick={ event => { event.stopPropagation(); click(); } }>{ confirming ? 'Confirm' : label }</Button>;
}

type Act = (action: BotPanelAction, userId?: number, number?: number, text?: string, text2?: string, ids?: number[]) => void;

const heightOf = (c: string) =>
{
    if((c >= '0') && (c <= '9')) return c.charCodeAt(0) - 48;
    if((c >= 'a') && (c <= 'z')) return c.charCodeAt(0) - 87;
    if((c >= 'A') && (c <= 'Z')) return c.charCodeAt(0) - 55;

    return -1;
}

// The floor plan drawn tile by tile (lighter = higher, the red-outlined tile is the door) and every kind of furniture in it.
const TemplateDetail: FC<{ file: string }> = props =>
{
    const { file } = props;
    const [ detail, setDetail ] = useState<BotTemplateDetailParser>(null);

    useMessageEvent<BotTemplateDetailEvent>(BotTemplateDetailEvent, event =>
    {
        const parser = event.getParser();

        if(parser.file === file) setDetail(parser);
    });

    useEffect(() =>
    {
        setDetail(null);
        SendMessageComposer(new BotTemplateDetailRequestComposer(file));
    }, [ file ]);

    if(!detail) return <Text small variant="muted">Loading layout ...</Text>;

    const columns = detail.rows.reduce((max, row) => Math.max(max, row.length), 0);
    const cell = Math.max(4, Math.min(16, Math.floor(380 / Math.max(1, columns))));
    const missing = detail.kinds.filter(kind => kind.status === 1);
    const skipped = detail.kinds.filter(kind => kind.status === 2);
    const total = detail.kinds.reduce((sum, kind) => sum + kind.count, 0);
    const placed = detail.kinds.filter(kind => kind.status === 0).reduce((sum, kind) => sum + kind.count, 0);

    return (
        <Flex column gap={ 2 }>
            <Text small variant="muted">{ columns } x { detail.rows.length } tiles - door at { detail.doorX },{ detail.doorY }</Text>
            <div style={ { overflowX: 'auto' } }>
                <div style={ { display: 'grid', gridTemplateColumns: `repeat(${ columns }, ${ cell }px)`, gridAutoRows: `${ cell }px`, gap: 1, width: 'max-content' } }>
                    { detail.rows.map((row, y) => Array.from({ length: columns }).map((_, x) =>
                    {
                        const height = (x < row.length) ? heightOf(row[x]) : -1;
                        const isDoor = (x === detail.doorX) && (y === detail.doorY);

                        return <div key={ `${ x }-${ y }` } title={ (height >= 0) ? `${ x },${ y } height ${ height }` : '' } style={ { background: (height >= 0) ? `hsl(210, 55%, ${ Math.min(85, 32 + (height * 4)) }%)` : 'transparent', outline: isDoor ? '2px solid #e5484d' : 'none', outlineOffset: -2 } } />;
                    })) }
                </div>
            </div>
            <Text bold>Furniture: { detail.kinds.length } kinds, { placed } of { total } items can be placed</Text>
            { ((missing.length > 0) || (skipped.length > 0)) &&
                <Text small variant="muted">{ missing.length } kind(s) this hotel does not have, { skipped.length } special kind(s) that are never placed.</Text> }
            <div>
                { [ ...detail.kinds ].sort((a, b) => (b.count - a.count)).map(kind =>
                    <Flex key={ (kind.wall ? 'w' : 'f') + kind.className } alignItems="center" gap={ 2 } className="py-1 border-bottom">
                        <Text bold style={ { width: 34 } }>{ kind.count }x</Text>
                        <Flex column className="flex-grow-1" style={ { minWidth: 0 } }>
                            <Text truncate>{ kind.name || kind.className }{ kind.wall ? ' (wall)' : '' }</Text>
                            { !!kind.name && <Text small variant="muted" truncate>{ kind.className }</Text> }
                        </Flex>
                        { (kind.status === 1) && <Text small bold variant="danger">not in this hotel</Text> }
                        { (kind.status === 2) && <Text small bold variant="warning">skipped (special)</Text> }
                    </Flex>) }
            </div>
        </Flex>
    );
}

const TemplatesTab: FC<{ state: BotPanelStateParser; act: Act }> = props =>
{
    const { state, act } = props;
    const [ file, setFile ] = useState('');
    const [ roomName, setRoomName ] = useState('');
    const [ checked, setChecked ] = useState<string[]>([]);

    const toggleChecked = (name: string) => setChecked(value => value.includes(name) ? value.filter(entry => entry !== name) : [ ...value, name ]);

    const template = state.templates.find(entry => entry.file === file) ?? null;

    return (
        <div className="overflow-auto flex-grow-1" style={ { minHeight: 0 } }>
            <Flex column gap={ 2 }>
                <Text small variant="muted">Rooms captured from other hotels: floor plan and furniture only. Nothing is built until you press Build.</Text>
                <Text small variant="muted">Rooms arrive on their own: on any computer, run the capture helper next to Chrome (started with remote debugging on port 9222) and walk into a room on another hotel. It checks every hotel tab, reads the room and sends it here, and it shows up in this list within seconds. Set it up once with: node capture-room-templates.js --upload https://dev.habbo.nz --key &lt;ROOM_TEMPLATE_KEY&gt;</Text>
                <Flex gap={ 1 } className="flex-wrap">
                    <Button onClick={ () => act('template_scan') }>Scan other hotel tabs now</Button>
                    <ConfirmButton disabled={ checked.length === 0 } label={ `Delete selected (${ checked.length })` } onConfirm={ () => { act('template_delete_many', 0, 0, checked.join('|')); setChecked([]); setFile(''); } } />
                    <ConfirmButton disabled={ state.templates.length === 0 } label="Delete all" onConfirm={ () => { act('template_delete_many', 0, 0, state.templates.map(entry => entry.file).join('|')); setChecked([]); setFile(''); } } />
                </Flex>
                { !!state.lastBuild && <Text bold>{ state.lastBuild }</Text> }
                { (state.templates.length === 0) && <Text variant="muted">No templates yet. Capture a room with the capture-room-template script; files appear here on their own.</Text> }
                { state.templates.map(entry =>
                    <Flex key={ entry.file } alignItems="center" gap={ 2 } pointer className={ 'p-1 rounded ' + ((entry.file === file) ? 'bg-primary text-white' : '') } onClick={ () => setFile(entry.file) }>
                        <input type="checkbox" className="form-check-input flex-shrink-0" checked={ checked.includes(entry.file) } onClick={ event => event.stopPropagation() } onChange={ () => toggleChecked(entry.file) } />
                        <Flex column className="flex-grow-1" style={ { minWidth: 0 } }>
                            <Text bold truncate>{ entry.label }</Text>
                            <Text small variant={ (entry.file === file) ? 'white' : 'muted' } truncate>{ entry.hotel || 'unknown hotel' } - { entry.tiles } tiles, { entry.floorItems } floor + { entry.wallItems } wall items</Text>
                        </Flex>
                    </Flex>) }
                { template &&
                    <Flex column gap={ 1 } className="border-top pt-2">
                        <Text bold>{ template.label }</Text>
                        <TemplateDetail file={ template.file } />
                        <input type="text" className="form-control form-control-sm" placeholder={ `Room name (empty = ${ template.label })` } maxLength={ 40 } value={ roomName } onChange={ event => setRoomName(event.target.value) } />
                        <Button onClick={ () => act('template_build', 0, 0, template.file, roomName.trim()) }>Build this room and go there</Button>
                        <Button onClick={ () => act('template_heights', 0, 0, template.file) }>Check stack heights against this room</Button>
                        <ConfirmButton variant="secondary" label="Match my furniture heights to this room" onConfirm={ () => act('template_heights', 0, 1, template.file) } />
                        <ConfirmButton label="Delete template" onConfirm={ () => { act('template_delete', 0, 0, template.file); setFile(''); } } />
                    </Flex> }
            </Flex>
        </div>
    );
}


const CurrencyTab: FC<{}> = () =>
{
    // Registered synchronously, before useMessageEvent subscribes (see CLAUDE.md rule 7).
    RegisterAdminCurrencyMessages();

    const [ username, setUsername ] = useState('');
    const [ target, setTarget ] = useState<AdminCurrencyResultParser>(null);
    const [ message, setMessage ] = useState<{ ok: boolean, text: string }>(null);
    const [ type, setType ] = useState(5);
    const [ amount, setAmount ] = useState('');
    const [ note, setNote ] = useState('');
    const [ busy, setBusy ] = useState(false);

    useMessageEvent<AdminCurrencyResultEvent>(AdminCurrencyResultEvent, event =>
    {
        const parser = event.getParser();

        setBusy(false);
        setTarget(parser.userId ? ({ ...parser, balances: [ ...parser.balances ] } as AdminCurrencyResultParser) : null);
        setMessage(parser.message ? { ok: parser.ok, text: parser.message } : null);

        if(parser.ok && parser.message) setAmount('');
    });

    const find = () =>
    {
        if(!username.trim()) return;

        setBusy(true);
        setMessage(null);
        SendMessageComposer(new AdminCurrencyLookupComposer(username.trim()));
    }

    // only the hotel's own currencies (the ones the purse shows), each with its icon
    const hotelTypes = GetConfiguration<number[]>('system.currency.types', [ 5, 101, 103 ]);
    const balances = (target?.balances || []).filter(balance => hotelTypes.includes(balance.type));
    const value = parseInt(amount);
    const valid = !!target && (value > 0) && !!note.trim() && !busy && hotelTypes.includes(type);
    const change = (sign: number) =>
    {
        if(!valid) return;

        setBusy(true);
        setMessage(null);
        SendMessageComposer(new AdminCurrencyChangeComposer(target.username, type, sign * value, note.trim()));
    }

    return (
        <Flex column gap={ 2 } className="overflow-auto flex-grow-1" style={ { minHeight: 0 } }>
            <Flex gap={ 1 }>
                <input type="text" className="form-control form-control-sm" placeholder="Username" value={ username } maxLength={ 32 }
                    onChange={ event => setUsername(event.target.value) } onKeyDown={ event => (event.key === 'Enter') && find() } />
                <Button disabled={ !username.trim() || busy } onClick={ find }>Find</Button>
            </Flex>
            { !!message && <Text small bold className={ message.ok ? 'admin-ok' : 'admin-error' }>{ message.text }</Text> }
            { target &&
                <>
                    <Flex gap={ 2 } alignItems="center" className="admin-box">
                        <div className="admin-avatar"><LayoutAvatarImageView figure={ target.look } direction={ 2 } headOnly /></div>
                        <Flex column>
                            <Text bold>{ target.username }</Text>
                            <Text small className="admin-muted">{ target.online ? 'Online - the change shows in their purse at once' : 'Offline - they see it next time they log in' }</Text>
                        </Flex>
                    </Flex>
                    <div className="admin-balances">
                        { balances.map(balance =>
                            <Flex key={ balance.type } justifyContent="between" alignItems="center" pointer className={ 'admin-balance' + ((balance.type === type) ? ' active' : '') } onClick={ () => setType(balance.type) }>
                                <Flex gap={ 1 } alignItems="center"><LayoutCurrencyIcon type={ balance.type } /><Text small>{ balance.label }</Text></Flex>
                                <Text small bold>{ balance.amount.toLocaleString() }</Text>
                            </Flex>) }
                    </div>
                    <Flex gap={ 1 } alignItems="center">
                        <CustomSelect style={ { width: 140 } } value={ type } onChange={ v => setType(parseInt(v)) } noInvalid items={ balances.map(balance => ({ value: balance.type, text: balance.label })) } />
                        <input type="text" inputMode="numeric" className="form-control form-control-sm" placeholder="Amount" value={ amount } onChange={ event => setAmount(event.target.value.replace(/[^0-9]/g, '').slice(0, 8)) } />
                    </Flex>
                    <input type="text" className="form-control form-control-sm" placeholder="Reason (required, logged)" maxLength={ 200 } value={ note } onChange={ event => setNote(event.target.value) } />
                    <Flex gap={ 1 }>
                        <Button fullWidth variant="success" disabled={ !valid } onClick={ () => change(1) }>Grant</Button>
                        <ConfirmButton label="Remove" disabled={ !valid } onConfirm={ () => change(-1) } />
                    </Flex>
                    <Text small className="admin-muted">Logged like the website's admin grant: ledger, the player's notifications and the audit log.</Text>
                </> }
        </Flex>
    );
}


// What the Give tab can hand out. The first four are the hCMS plugin's (AdminGiveProtocol), the rest the shop's own items.
const GIVE_KINDS: { value: string, text: string, shop?: boolean }[] = [
    { value: 'badge', text: 'Badge' },
    { value: 'furni', text: 'Furni' },
    { value: 'banner', text: 'Profile banner' },
    { value: 'effect', text: 'Avatar effect' },
    { value: 'aura', text: 'Aura', shop: true },
    { value: 'spawn', text: 'Spawn', shop: true },
    { value: 'border', text: 'Border', shop: true },
    { value: 'ornament', text: 'Ornament', shop: true },
    { value: 'bubble', text: 'Chat bubble', shop: true }
];

const shopItemsOf = (data: IShopData, kind: string): { value: number, text: string }[] =>
{
    if(!data) return [];

    const list: { id: number, name: string, code?: string }[] = (kind === 'aura') ? data.auras : (kind === 'spawn') ? data.spawns : (kind === 'border') ? data.borders
        : (kind === 'ornament') ? data.ornaments : (kind === 'bubble') ? (data.bubbles || []) : [];

    return (list || []).map(item => ({ value: item.id, text: item.name || item.code || ('#' + item.id) }));
}

const GiveTab: FC<{}> = () =>
{
    // Registered synchronously, before useMessageEvent subscribes (see CLAUDE.md rule 7).
    RegisterAdminCurrencyMessages();
    RegisterShopMessages();
    RegisterShopStaffMessages();

    const [ username, setUsername ] = useState('');
    const [ kind, setKind ] = useState('badge');
    const [ key, setKey ] = useState('');
    const [ amount, setAmount ] = useState('1');
    const [ note, setNote ] = useState('');
    const [ banners, setBanners ] = useState<{ id: number, title: string }[]>([]);
    const [ shopData, setShopData ] = useState<IShopData>(null);
    const [ message, setMessage ] = useState<{ ok: boolean, text: string }>(null);
    const waiting = useRef(false);

    const current = GIVE_KINDS.find(entry => entry.value === kind);
    const isShop = !!current?.shop;

    useEffect(() =>
    {
        SendMessageComposer(new AdminBannerListComposer());
        SendMessageComposer(new ShopOpenComposer(GetConfiguration<string>('shop.language', '')));
    }, []);

    useMessageEvent<AdminBannerListEvent>(AdminBannerListEvent, event => setBanners([ ...event.getParser().banners ]));
    useMessageEvent<ShopDataEvent>(ShopDataEvent, event => { const data = event.getParser().data; if(data) setShopData(data); });

    const answer = (ok: boolean, text: string) =>
    {
        if(!waiting.current) return;

        waiting.current = false;
        setMessage({ ok, text });
    }

    useMessageEvent<AdminGiveResultEvent>(AdminGiveResultEvent, event => answer(event.getParser().ok, event.getParser().message));
    useMessageEvent<ShopResultEvent>(ShopResultEvent, event => { const data = event.getParser().data; if(data) answer(data.ok, data.message); });

    const valid = !!username.trim() && !!key && (isShop || !!note.trim());

    const send = (take: boolean) =>
    {
        if(!valid) return;

        waiting.current = true;
        setMessage(null);

        if(isShop) SendMessageComposer(new ShopGiveComposer(username.trim(), kind, parseInt(key), take));
        else SendMessageComposer(new AdminGiveComposer(username.trim(), kind as AdminGiveKind, key.trim(), Math.max(1, parseInt(amount) || 1), take, note.trim()));
    }

    const options = isShop ? shopItemsOf(shopData, kind) : (kind === 'banner') ? banners.map(banner => ({ value: banner.id, text: banner.title })) : null;

    return (
        <Flex column gap={ 2 } className="overflow-auto flex-grow-1" style={ { minHeight: 0 } }>
            <input type="text" className="form-control form-control-sm" placeholder="Username" value={ username } maxLength={ 32 } onChange={ event => setUsername(event.target.value) } />
            <CustomSelect value={ kind } onChange={ value => { setKind(value); setKey(''); setMessage(null); } } noInvalid items={ GIVE_KINDS.map(entry => ({ value: entry.value, text: entry.text })) } />
            { options
                ? <CustomSelect value={ key } onChange={ value => setKey(String(value)) } items={ [ { value: '', text: options.length ? 'Pick one...' : 'Loading...' }, ...options.map(option => ({ value: String(option.value), text: option.text })) ] } />
                : <input type="text" className="form-control form-control-sm" value={ key } maxLength={ 64 } onChange={ event => setKey(event.target.value) }
                    placeholder={ (kind === 'badge') ? 'Badge code, e.g. ADM' : (kind === 'furni') ? 'Furni id or classname, e.g. throne' : 'Effect id, e.g. 102' } /> }
            { (kind === 'furni') &&
                <Flex gap={ 1 } alignItems="center">
                    <Text small className="admin-muted">Amount</Text>
                    <input type="text" inputMode="numeric" className="form-control form-control-sm" style={ { width: 80 } } value={ amount } onChange={ event => setAmount(event.target.value.replace(/[^0-9]/g, '').slice(0, 3)) } />
                    <Text small className="admin-muted">(1-100)</Text>
                </Flex> }
            { !isShop && <input type="text" className="form-control form-control-sm" placeholder="Reason (required, logged)" maxLength={ 200 } value={ note } onChange={ event => setNote(event.target.value) } /> }
            <Flex gap={ 1 }>
                <Button fullWidth variant="success" disabled={ !valid } onClick={ () => send(false) }>Give</Button>
                { (kind !== 'furni') && <ConfirmButton label="Take away" disabled={ !valid } onConfirm={ () => send(true) } /> }
            </Flex>
            { !!message && <Text small bold className={ message.ok ? 'admin-ok' : 'admin-error' }>{ message.text }</Text> }
            <Text small className="admin-muted">{ isShop ? 'Shop items: logged in the shop log. The player can use it in Presence straight away.' : 'Logged in the audit log. An online player gets it at once.' }</Text>
        </Flex>
    );
}

const TemplatesPanel: FC<{}> = () =>
{
    // Registered synchronously, before useMessageEvent subscribes: the subscription resolves the header at subscribe time.
    RegisterBotPanelMessages();

    const [ state, setState ] = useState<BotPanelStateParser>(null);

    useMessageEvent<BotPanelStateEvent>(BotPanelStateEvent, event => setState(event.getParser()));

    const refresh = useCallback(() => SendMessageComposer(new BotPanelRequestComposer()), []);

    useEffect(() =>
    {
        refresh();

        const interval = setInterval(refresh, 4000);

        return () => clearInterval(interval);
    }, [ refresh ]);

    const act: Act = (action, userId = 0, number = 0, text = '', text2 = '', ids = []) => SendMessageComposer(new BotPanelActionComposer(action, userId, number, text, text2, ids));

    if(!state) return <Text>Loading...</Text>;

    return (
        <>
            { !!state.error && <Text bold className="admin-error">{ state.error }</Text> }
            <TemplatesTab state={ state } act={ act } />
        </>
    );
}

export const ModToolsAdministrationView: FC<ModToolsAdministrationViewProps> = props =>
{
    const { onCloseClick = null } = props;
    const [ tab, setTab ] = useState(0);

    return (
        <NitroCardView uniqueKey="mod-tools-administration" className="nitro-mod-tools-administration" windowPosition={ DraggableWindowPosition.TOP_LEFT } theme="primary-slim" style={ { width: 380, height: 520 } }>
            <NitroCardHeaderView headerText="Administration" onCloseClick={ onCloseClick } />
            <NitroCardContentView gap={ 2 }>
                <NitroCardTabsView>
                    { TABS.map((name, index) =>
                        <NitroCardTabsItemView key={ index } isActive={ tab === index } onClick={ () => setTab(index) }>{ name }</NitroCardTabsItemView>) }
                </NitroCardTabsView>
                { (tab === 0) && <CurrencyTab /> }
                { (tab === 1) && <GiveTab /> }
                { (tab === 2) && <TemplatesPanel /> }
            </NitroCardContentView>
        </NitroCardView>
    );
}
