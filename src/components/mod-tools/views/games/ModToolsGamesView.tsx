import { FC, ReactNode, useEffect, useState } from 'react';
import { GetSeasonCurrencyName, SEASON_CURRENCY_TYPE, SendMessageComposer } from '../../../../api';
import { GamesAdminActionComposer, GamesAdminStateEvent, IGamesAdminState, RegisterGamesAdminMessages } from '../../../../api/games/GamesAdminProtocol';
import { Button, Column, DraggableWindowPosition, Flex, LayoutCenterLoaderView, NitroCardContentView, NitroCardHeaderView, NitroCardTabsItemView, NitroCardTabsView, NitroCardView, Text } from '../../../../common';
import { useMessageEvent } from '../../../../hooks';
import { StaffToolsIconUrl } from '../../../room/widgets/chat/ChatWidgetMessageView';

interface Field { key: string, label: string, options?: [ string, string ][] }

const CURRENCIES: [ string, string ][] = [ [ '101', 'Emeralds' ], [ '5', 'Diamonds' ], [ '103', 'Season currency' ], [ '0', 'Duckets' ] ];
const YES_NO: [ string, string ][] = [ [ '1', 'Yes' ], [ '0', 'No' ] ];

const LOTTERY_FIELDS: Field[] = [
    { key: 'schedule', label: 'Schedule', options: [ [ 'interval', 'Every X minutes' ], [ 'weekly', 'Weekly' ] ] },
    { key: 'interval_minutes', label: 'Interval (minutes)' },
    { key: 'weekly_day', label: 'Weekly day (1 Mon - 7 Sun)' },
    { key: 'weekly_hour', label: 'Weekly hour' },
    { key: 'weekly_minute', label: 'Weekly minute' },
    { key: 'price', label: 'Ticket price' },
    { key: 'price_currency', label: 'Ticket currency', options: CURRENCIES },
    { key: 'max_per_user', label: 'Max tickets per user / draw' },
    { key: 'max_per_ip', label: 'Max tickets per IP / draw' },
    { key: 'daily_cap', label: 'Max tickets per user / day' },
    { key: 'exclude_staff', label: 'Exclude staff', options: YES_NO },
    { key: 'staff_rank', label: 'Staff from rank' },
    { key: 'winners', label: 'Winners per draw' },
    { key: 'win_chance', label: 'Chance of a winner per draw (%)' },
    { key: 'repeat_winners', label: 'Same player can win twice', options: YES_NO },
    { key: 'prize_mode', label: 'Prize mode', options: [ [ 'jackpot', 'Jackpot (grows with tickets)' ], [ 'fixed', 'Fixed prize' ], [ 'random', 'Random (pool "random")' ], [ 'pool', 'Prize pool' ] ] },
    { key: 'seed_pot', label: 'Jackpot start' },
    { key: 'pot_share', label: 'Ticket share into jackpot (%)' },
    { key: 'fixed_currency', label: 'Fixed prize currency', options: CURRENCIES },
    { key: 'fixed_amount', label: 'Fixed prize amount' },
    { key: 'pool_name', label: 'Prize pool name' },
    { key: 'pool_switch', label: 'Pool switches', options: [ [ 'none', 'Never' ], [ 'daily', 'Daily (day-1..7)' ], [ 'weekly', 'Weekly (week-1..4)' ], [ 'monthly', 'Monthly (month-1..12)' ] ] },
    { key: 'bonus_diamonds', label: 'Bonus Diamonds per winner' },
    { key: 'predraw_alert_seconds', label: 'Warning before draw (s)' },
    { key: 'live_seconds', label: 'Live panel before draw (s)' },
    { key: 'badge', label: 'Winner badge' }
];

const WORD_FIELDS: Field[] = [
    { key: 'interval_minutes', label: 'Auto round every (minutes)' },
    { key: 'round_seconds', label: 'Round length (seconds)' },
    { key: 'prize_mode', label: 'Prize', options: [ [ 'random', 'Random from the prize pool' ], [ 'fixed', 'Fixed (below)' ] ] },
    { key: 'prize_type', label: 'Fixed prize currency', options: CURRENCIES },
    { key: 'prize_amount', label: 'Fixed prize amount' },
    { key: 'guess_cooldown_seconds', label: 'Guess cooldown (s)' },
    { key: 'badge', label: 'Winner badge' }
];

const SPAWN_FIELDS: Field[] = [
    { key: 'season', label: 'Season (spawns + Swap-o-Matic)' },
    { key: 'interval_seconds', label: 'Spawn every (seconds)' },
    { key: 'min_users', label: 'Min. players in a room' },
    { key: 'max_rooms', label: 'Rooms per spawn round' },
    { key: 'lifetime_seconds', label: 'Furni stays for (seconds)' },
    { key: 'daily_cap', label: 'Collects per player / day' },
    { key: 'rooms', label: 'Only these room ids (comma list, empty = by owner)' },
    { key: 'owner_ids', label: 'Rooms owned by user ids (2 = officialrooms)' }
];

const AUTOMAT_FIELDS: Field[] = [
    { key: 'machine_items', label: 'Machine furni (base ids, comma list)' }
];

const currencyName = (type: number) => ((type === SEASON_CURRENCY_TYPE) ? GetSeasonCurrencyName() : (CURRENCIES.find(entry => entry[0] === String(type))?.[1] ?? 'points'));

const timeLeft = (unix: number) =>
{
    const seconds = Math.max(0, unix - Math.floor(Date.now() / 1000));
    const hours = Math.floor(seconds / 3600);

    return `${ hours ? `${ hours }h ` : '' }${ Math.floor((seconds % 3600) / 60) }m`;
}

const send = (action: string, payload: Record<string, unknown> = {}) => SendMessageComposer(new GamesAdminActionComposer(action, payload));

const SettingsForm: FC<{ fields: Field[], values: Record<string, string>, onSave: (key: string, value: string) => void }> = ({ fields, values, onSave }) =>
{
    const [ draft, setDraft ] = useState<Record<string, string>>({});

    useEffect(() => setDraft({}), [ values ]);

    const changed = Object.keys(draft).filter(key => draft[key] !== values[key]);

    return (
        <Column gap={ 1 }>
            <div className="games-settings">
                { fields.map(field =>
                    <label key={ field.key } className="games-setting">
                        <span>{ field.label }</span>
                        { field.options
                            ? <select className="form-select form-select-sm" value={ draft[field.key] ?? values[field.key] ?? '' } onChange={ event => setDraft({ ...draft, [field.key]: event.target.value }) }>
                                { field.options.map(option => <option key={ option[0] } value={ option[0] }>{ option[1] }</option>) }
                            </select>
                            : <input className="form-control form-control-sm" value={ draft[field.key] ?? values[field.key] ?? '' } onChange={ event => setDraft({ ...draft, [field.key]: event.target.value }) } /> }
                    </label>) }
            </div>
            <Button variant="success" disabled={ !changed.length } onClick={ () => changed.forEach(key => onSave(key, draft[key])) }>Save { changed.length ? `(${ changed.length })` : '' }</Button>
        </Column>
    );
}

export const ModToolsGamesView: FC<{ onCloseClick: () => void }> = ({ onCloseClick }) =>
{
    RegisterGamesAdminMessages();

    const [ state, setState ] = useState<IGamesAdminState>(null);
    const [ tab, setTab ] = useState<'lottery' | 'word' | 'spawns' | 'automat'>('lottery');
    const [ confirm, setConfirm ] = useState('');
    const [ word, setWord ] = useState('');
    const [ words, setWords ] = useState('');
    const [ wordPrize, setWordPrize ] = useState({ currency: '101', amount: '10', weight: '1' });
    const [ spawnItem, setSpawnItem ] = useState({ itemId: '', weight: '1' });
    const [ offer, setOffer ] = useState({ itemId: '', need: '5', currency: '101', amount: '5' });
    const [ prize, setPrize ] = useState({ pool: 'default', type: 'currency', currency: '101', amount: '50', itemId: '0', weight: '1' });

    useMessageEvent<GamesAdminStateEvent>(GamesAdminStateEvent, event =>
    {
        const next = event.getParser().state;

        if(next) setState(next);
    });

    useEffect(() =>
    {
        send('state');

        const interval = setInterval(() => send('state'), 15000);

        return () => clearInterval(interval);
    }, []);

    const confirmThen = (key: string, action: () => void) =>
    {
        if(confirm !== key)
        {
            setConfirm(key);
            setTimeout(() => setConfirm(value => (value === key ? '' : value)), 3000);

            return;
        }

        setConfirm('');
        action();
    }

    const lottery = state?.lottery;
    const game = state?.word;
    const autoOn = game?.settings?.enabled === '1';
    const spawns = state?.spawns;
    const automat = state?.automat;
    const lotteryOn = lottery?.settings?.enabled === '1';
    const spawnsOn = spawns?.settings?.enabled === '1';
    const automatOn = automat?.settings?.enabled === '1';
    const season = spawns?.settings?.season ?? '';

    const statusRow = (icon: string, on: boolean, title: string, detail: string, button: ReactNode) =>
        <Flex gap={ 2 } alignItems="center" justifyContent="between" className={ 'admin-box staff-home-duty' + (on ? ' is-on' : '') }>
            <img className="staff-tools-icon" src={ icon } alt="" />
            <Column gap={ 0 } grow>
                <Text bold>{ title }</Text>
                <Text small className="admin-muted">{ detail }</Text>
            </Column>
            { button }
        </Flex>;

    const stat = (icon: string, value: ReactNode, label: string) =>
        <div className="admin-box staff-home-stat games-stat">
            <img className="staff-tools-icon" src={ icon } alt="" />
            <Text bold className="staff-home-number">{ value }</Text>
            <Text small>{ label }</Text>
        </div>;

    const listRow = (key: number, text: ReactNode, onRemove: () => void) =>
        <Flex key={ key } gap={ 2 } alignItems="center" justifyContent="between" className="games-row">
            <Text small>{ text }</Text>
            <Button variant="danger" className="games-small-button" onClick={ onRemove }>Remove</Button>
        </Flex>;

    return (
        <NitroCardView uniqueKey="mod-tools-games" className="nitro-mod-tools-administration nitro-mod-tools-staff-settings nitro-mod-tools-games" windowPosition={ DraggableWindowPosition.TOP_LEFT } theme="primary-slim" style={ { width: 440, height: 580 } }>
            <NitroCardHeaderView headerText="Games" onCloseClick={ onCloseClick } />
            <NitroCardContentView gap={ 2 }>
                <NitroCardTabsView>
                    <NitroCardTabsItemView isActive={ tab === 'lottery' } onClick={ () => setTab('lottery') }>Lottery</NitroCardTabsItemView>
                    <NitroCardTabsItemView isActive={ tab === 'word' } onClick={ () => setTab('word') }>Random Word</NitroCardTabsItemView>
                    <NitroCardTabsItemView isActive={ tab === 'spawns' } onClick={ () => setTab('spawns') }>Spawns</NitroCardTabsItemView>
                    <NitroCardTabsItemView isActive={ tab === 'automat' } onClick={ () => setTab('automat') }>Swap-o-Matic</NitroCardTabsItemView>
                </NitroCardTabsView>
                { !state && <LayoutCenterLoaderView /> }
                { !!state?.message && <Text small bold className="admin-ok">{ state.message }</Text> }
                { lottery && (tab === 'lottery') &&
                    <Column gap={ 2 } overflow="auto">
                        { statusRow(StaffToolsIconUrl('tag_economy'), lotteryOn, lotteryOn ? `Lottery running · draw #${ lottery.drawId }` : 'Lottery stopped', lotteryOn ? `Next draw in ${ timeLeft(lottery.drawAt) }` : 'Players can\'t buy tickets.',
                            <Button variant={ lotteryOn ? 'danger' : 'success' } onClick={ () => send(lotteryOn ? 'lottery.disable' : 'lottery.enable') }>{ lotteryOn ? 'Stop' : 'Start' }</Button>) }
                        <div className="staff-home-grid">
                            { stat(StaffToolsIconUrl('tag_economy'), lottery.prize, 'prize') }
                            { stat(StaffToolsIconUrl('tag_commands'), lottery.tickets, 'tickets sold') }
                            { stat(StaffToolsIconUrl('tag_new'), lottery.players, 'players') }
                        </div>
                        <Flex gap={ 1 }>
                            <Button fullWidth variant="primary" onClick={ () => confirmThen('draw', () => send('lottery.draw')) }>{ confirm === 'draw' ? 'Confirm: draw in 60 s' : 'Draw now' }</Button>
                            <Button fullWidth variant="dark" onClick={ () => confirmThen('reset', () => send('lottery.reset')) }>{ confirm === 'reset' ? 'Confirm (refunds all)' : 'Reset draw' }</Button>
                        </Flex>
                        { !!lottery.winners.length &&
                            <Column gap={ 1 } className="admin-box">
                                <Text bold>Last winners</Text>
                                { lottery.winners.map((winner, index) =>
                                    <Flex key={ index } justifyContent="between">
                                        <Text small bold>{ winner.username }</Text>
                                        <Text small className="admin-muted">#{ winner.draw } · { winner.prize }</Text>
                                    </Flex>) }
                            </Column> }
                        <Text bold>Settings</Text>
                        <Column gap={ 1 } className="admin-box">
                            <SettingsForm fields={ LOTTERY_FIELDS } values={ lottery.settings } onSave={ (key, value) => send('lottery.set', { key, value }) } />
                        </Column>
                        <Text bold>Prize pool</Text>
                        <Column gap={ 1 } className="admin-box">
                            <Text small className="admin-muted">Used by the prize modes "random" and "pool".</Text>
                            { !lottery.prizes.length && <Text small className="admin-muted">No prizes yet.</Text> }
                            { lottery.prizes.map(entry => listRow(entry.id, `${ entry.pool } · ${ entry.type === 'item' ? `furni #${ entry.itemId }` : `${ entry.amount } ${ currencyName(entry.currency) }` } · weight ${ entry.weight }`, () => send('lottery.prize.remove', { id: entry.id }))) }
                            <div className="games-settings">
                                <label className="games-setting"><span>Pool</span><input className="form-control form-control-sm" value={ prize.pool } onChange={ event => setPrize({ ...prize, pool: event.target.value }) } /></label>
                                <label className="games-setting"><span>Type</span>
                                    <select className="form-select form-select-sm" value={ prize.type } onChange={ event => setPrize({ ...prize, type: event.target.value }) }>
                                        <option value="currency">Currency</option>
                                        <option value="item">Furni (item id)</option>
                                    </select>
                                </label>
                                { (prize.type === 'currency')
                                    ? <>
                                        <label className="games-setting"><span>Currency</span>
                                            <select className="form-select form-select-sm" value={ prize.currency } onChange={ event => setPrize({ ...prize, currency: event.target.value }) }>
                                                { CURRENCIES.map(option => <option key={ option[0] } value={ option[0] }>{ option[1] }</option>) }
                                            </select>
                                        </label>
                                        <label className="games-setting"><span>Amount</span><input className="form-control form-control-sm" value={ prize.amount } onChange={ event => setPrize({ ...prize, amount: event.target.value }) } /></label>
                                    </>
                                    : <label className="games-setting"><span>Furni item id</span><input className="form-control form-control-sm" value={ prize.itemId } onChange={ event => setPrize({ ...prize, itemId: event.target.value }) } /></label> }
                                <label className="games-setting"><span>Weight</span><input className="form-control form-control-sm" value={ prize.weight } onChange={ event => setPrize({ ...prize, weight: event.target.value }) } /></label>
                            </div>
                            <Button variant="success" onClick={ () => send('lottery.prize.add', { pool: prize.pool, type: prize.type, currency: Number(prize.currency), amount: Number(prize.amount), itemId: Number(prize.itemId), weight: Number(prize.weight) }) }>Add prize</Button>
                        </Column>
                    </Column> }
                { game && (tab === 'word') &&
                    <Column gap={ 2 } overflow="auto">
                        { statusRow(StaffToolsIconUrl('tag_wordfilter'), autoOn, autoOn ? 'Auto rounds on' : 'Auto rounds off', game.running ? `Round ends in ${ timeLeft(game.endsAt) }` : (autoOn ? `Next round in ${ timeLeft(game.nextStartAt) }` : 'Start a round by hand below.'),
                            <Button variant={ autoOn ? 'danger' : 'success' } onClick={ () => send('word.auto') }>{ autoOn ? 'Turn off' : 'Turn on' }</Button>) }
                        <div className="staff-home-grid">
                            { stat(StaffToolsIconUrl('tag_wordfilter'), game.running ? game.scrambled : '-', game.running ? `answer: ${ game.word }` : 'no round') }
                            { stat(StaffToolsIconUrl('tag_economy'), game.running ? game.prizeAmount : (game.settings.prize_mode === 'random' ? '?' : game.settings.prize_amount), game.running ? currencyName(game.prizeType) : (game.settings.prize_mode === 'random' ? 'random prize' : currencyName(Number(game.settings.prize_type)))) }
                            { stat(StaffToolsIconUrl('tag_commands'), game.words, 'words') }
                        </div>
                        <Flex gap={ 1 } alignItems="center" className="admin-box">
                            <input className="form-control form-control-sm games-word-input" placeholder="word (empty = random)" value={ word } onChange={ event => setWord(event.target.value) } />
                            <Button variant="primary" onClick={ () => { send('word.start', { value: word }); setWord(''); } }>Start now</Button>
                            { game.running && <Button variant="dark" onClick={ () => send('word.stop') }>Stop</Button> }
                        </Flex>
                        <Text bold>Settings</Text>
                        <Column gap={ 1 } className="admin-box">
                            <SettingsForm fields={ WORD_FIELDS } values={ game.settings } onSave={ (key, value) => send('word.set', { key, value }) } />
                        </Column>
                        <Text bold>Prize pool</Text>
                        <Column gap={ 1 } className="admin-box">
                            <Text small className="admin-muted">With the random prize, each round draws one of these (weight = how often).</Text>
                            { !game.prizes.length && <Text small className="admin-muted">No prizes yet.</Text> }
                            { game.prizes.map(entry => listRow(entry.id, `${ entry.amount } ${ currencyName(entry.currency) } · weight ${ entry.weight }`, () => send('word.prize.remove', { id: entry.id }))) }
                            <div className="games-settings">
                                <label className="games-setting"><span>Currency</span>
                                    <select className="form-select form-select-sm" value={ wordPrize.currency } onChange={ event => setWordPrize({ ...wordPrize, currency: event.target.value }) }>
                                        { CURRENCIES.map(option => <option key={ option[0] } value={ option[0] }>{ option[1] }</option>) }
                                    </select>
                                </label>
                                <label className="games-setting"><span>Amount</span><input className="form-control form-control-sm" value={ wordPrize.amount } onChange={ event => setWordPrize({ ...wordPrize, amount: event.target.value }) } /></label>
                                <label className="games-setting"><span>Weight</span><input className="form-control form-control-sm" value={ wordPrize.weight } onChange={ event => setWordPrize({ ...wordPrize, weight: event.target.value }) } /></label>
                            </div>
                            <Button variant="success" disabled={ !Number(wordPrize.amount) } onClick={ () => send('word.prize.add', { currency: Number(wordPrize.currency), amount: Number(wordPrize.amount), weight: Number(wordPrize.weight) }) }>Add prize</Button>
                        </Column>
                        <Text bold>Add words</Text>
                        <Column gap={ 1 } className="admin-box">
                            <textarea className="form-control form-control-sm" rows={ 3 } placeholder="words separated by spaces or commas" value={ words } onChange={ event => setWords(event.target.value) } />
                            <Button variant="success" disabled={ !words.trim() } onClick={ () => { send('word.add', { value: words }); setWords(''); } }>Add words</Button>
                        </Column>
                    </Column> }
                { spawns && (tab === 'spawns') &&
                    <Column gap={ 2 } overflow="auto">
                        { statusRow(StaffToolsIconUrl('short_room'), spawnsOn, spawnsOn ? `Spawns running · ${ season }` : 'Spawns stopped', spawnsOn ? `Next round in ${ timeLeft(spawns.nextAt) }` : 'No furni appears in rooms.',
                            <Button variant={ spawnsOn ? 'danger' : 'success' } onClick={ () => send('spawns.set', { key: 'enabled', value: spawnsOn ? '0' : '1' }) }>{ spawnsOn ? 'Stop' : 'Start' }</Button>) }
                        <div className="staff-home-grid">
                            { stat(StaffToolsIconUrl('tag_new'), spawns.active, 'on the floor') }
                            { stat(StaffToolsIconUrl('tag_commands'), spawns.items.filter(entry => entry.season === season).length, 'furni this season') }
                            { stat(StaffToolsIconUrl('tag_economy'), spawns.items.filter(entry => entry.season === season).reduce((sum, entry) => sum + entry.collected, 0), 'collected') }
                        </div>
                        <Button variant="primary" onClick={ () => send('spawns.now') }>Spawn now</Button>
                        <Text bold>Settings</Text>
                        <Column gap={ 1 } className="admin-box">
                            <SettingsForm fields={ SPAWN_FIELDS } values={ spawns.settings } onSave={ (key, value) => send('spawns.set', { key, value }) } />
                        </Column>
                        <Text bold>Spawn furni</Text>
                        <Column gap={ 1 } className="admin-box">
                            <Text small className="admin-muted">Weight = how often it is picked. Only furni of the current season spawn.</Text>
                            { spawns.items.map(entry => listRow(entry.id, <>{ entry.season } · <b>{ entry.name }</b> (#{ entry.itemId }) · weight { entry.weight } · { entry.collected } collected</>, () => send('spawns.item.remove', { id: entry.id }))) }
                            <div className="games-settings">
                                <label className="games-setting"><span>Furni item id</span><input className="form-control form-control-sm" value={ spawnItem.itemId } onChange={ event => setSpawnItem({ ...spawnItem, itemId: event.target.value }) } /></label>
                                <label className="games-setting"><span>Weight</span><input className="form-control form-control-sm" value={ spawnItem.weight } onChange={ event => setSpawnItem({ ...spawnItem, weight: event.target.value }) } /></label>
                            </div>
                            <Button variant="success" disabled={ !Number(spawnItem.itemId) } onClick={ () => send('spawns.item.add', { itemId: Number(spawnItem.itemId), weight: Number(spawnItem.weight) }) }>Add to { season }</Button>
                        </Column>
                    </Column> }
                { automat && (tab === 'automat') &&
                    <Column gap={ 2 } overflow="auto">
                        { statusRow(StaffToolsIconUrl('tag_economy'), automatOn, automatOn ? `Swap-o-Matic open · ${ season }` : 'Swap-o-Matic closed', 'Players trade collected spawn furni next to a machine furni (double-click it, standing next to it).',
                            <Button variant={ automatOn ? 'danger' : 'success' } onClick={ () => send('automat.set', { key: 'enabled', value: automatOn ? '0' : '1' }) }>{ automatOn ? 'Close' : 'Open' }</Button>) }
                        <Text bold>Settings</Text>
                        <Column gap={ 1 } className="admin-box">
                            <SettingsForm fields={ AUTOMAT_FIELDS } values={ automat.settings } onSave={ (key, value) => send('automat.set', { key, value }) } />
                        </Column>
                        <Text bold>Offers</Text>
                        <Column gap={ 1 } className="admin-box">
                            { !automat.offers.length && <Text small className="admin-muted">No offers yet.</Text> }
                            { automat.offers.map(entry => listRow(entry.id, <>{ entry.season } · { entry.need } × <b>{ entry.name }</b> (#{ entry.itemId }) → { entry.amount } { currencyName(entry.currency) }</>, () => send('automat.offer.remove', { id: entry.id }))) }
                            <div className="games-settings">
                                <label className="games-setting"><span>Furni item id</span><input className="form-control form-control-sm" value={ offer.itemId } onChange={ event => setOffer({ ...offer, itemId: event.target.value }) } /></label>
                                <label className="games-setting"><span>Pieces needed</span><input className="form-control form-control-sm" value={ offer.need } onChange={ event => setOffer({ ...offer, need: event.target.value }) } /></label>
                                <label className="games-setting"><span>Currency</span>
                                    <select className="form-select form-select-sm" value={ offer.currency } onChange={ event => setOffer({ ...offer, currency: event.target.value }) }>
                                        { CURRENCIES.map(option => <option key={ option[0] } value={ option[0] }>{ option[1] }</option>) }
                                    </select>
                                </label>
                                <label className="games-setting"><span>Amount</span><input className="form-control form-control-sm" value={ offer.amount } onChange={ event => setOffer({ ...offer, amount: event.target.value }) } /></label>
                            </div>
                            <Button variant="success" disabled={ !Number(offer.itemId) } onClick={ () => send('automat.offer.add', { itemId: Number(offer.itemId), need: Number(offer.need), currency: Number(offer.currency), amount: Number(offer.amount) }) }>Save offer for { season }</Button>
                        </Column>
                    </Column> }
            </NitroCardContentView>
        </NitroCardView>
    );
}
