import { FC, useState } from 'react';
import { SendMessageComposer } from '../../api';
import { CasinoActionComposer, CasinoDealerConfigEvent, ICasinoDealerConfig, ICasinoRankLimit, RegisterCasinoMessages } from '../../api/games/CasinoProtocol';
import { Button, Column, Flex, LayoutCurrencyIcon, NitroCardContentView, NitroCardHeaderView, NitroCardTabsItemView, NitroCardTabsView, NitroCardView, Text } from '../../common';
import { useMessageEvent } from '../../hooks';

const GAMES: { id: string, name: string }[] = [
    { id: 'hl', name: 'High / Low' },
    { id: 'tri', name: 'Tri' },
    { id: 'poker', name: 'Poker' },
    { id: '21', name: '21' },
    { id: '13', name: '13' }
];

const RANK_FIELDS: { key: keyof ICasinoRankLimit, label: string, type: number }[] = [
    { key: 'max_5', label: 'Max bet', type: 5 },
    { key: 'daily_5', label: 'Daily loss', type: 5 },
    { key: 'max_101', label: 'Max bet', type: 101 },
    { key: 'daily_101', label: 'Daily loss', type: 101 }
];

type Tab = 'dealer' | 'games' | 'limits' | 'ranks';

const digits = (value: string) => value.replace(/\D/g, '').slice(0, 7);

export const CasinoDealerSettingsView: FC<{}> = props =>
{
    RegisterCasinoMessages();

    const [ config, setConfig ] = useState<ICasinoDealerConfig>(null);
    const [ tab, setTab ] = useState<Tab>('dealer');
    const [ games, setGames ] = useState<string[]>([]);
    const [ limits, setLimits ] = useState<Record<string, string>>({});
    const [ funds, setFunds ] = useState<Record<number, string>>({});
    const [ ranks, setRanks ] = useState<Record<string, string>>({});

    useMessageEvent<CasinoDealerConfigEvent>(CasinoDealerConfigEvent, event =>
    {
        const next = event.getParser().config;

        if(!next) return;

        setConfig(next);
        setGames(next.games);
        setFunds({});

        if(!next.dealer) setTab(previous => ((previous === 'ranks') ? previous : 'dealer'));

        const nextLimits: Record<string, string> = {};

        for(const currency of next.currencies)
        {
            for(const field of [ 'min', 'max', 'daily' ] as const) nextLimits[`${ field }_${ currency.type }`] = currency[field] ? String(currency[field]) : '';
        }

        setLimits(nextLimits);

        const nextRanks: Record<string, string> = {};

        for(const rank of (next.ranks || []))
        {
            for(const field of RANK_FIELDS) nextRanks[`${ rank.id }.${ field.key }`] = rank[field.key] ? String(rank[field.key]) : '';
        }

        setRanks(nextRanks);
    });

    if(!config) return null;

    const send = (action: string, amount: number = 0, type: number = 0, data: string = '') => SendMessageComposer(new CasinoActionComposer(action, '', amount, type, `${ config.roomIndex }${ data ? `|${ data }` : '' }`));

    const toggleGame = (game: string) => setGames(previous => previous.includes(game) ? previous.filter(entry => entry !== game) : [ ...previous, game ]);

    const save = () =>
    {
        const body: Record<string, unknown> = { games };

        for(const [ key, value ] of Object.entries(limits)) body[key] = value ? parseInt(value) : 0;

        send('dealer_save', 0, 0, JSON.stringify(body));
    }

    const fund = (type: number, sign: number) =>
    {
        const amount = parseInt(funds[type] || '0');

        if(!amount) return;

        send('dealer_fund', amount * sign, type);
    }

    const saveRanks = () =>
    {
        const body: Record<string, Record<string, number>> = {};

        for(const rank of config.ranks)
        {
            const row: Record<string, number> = {};

            for(const field of RANK_FIELDS)
            {
                const value = ranks[`${ rank.id }.${ field.key }`];

                if(value) row[field.key] = parseInt(value);
            }

            body[rank.id] = row;
        }

        send('ranks_save', 0, 0, JSON.stringify(body));
    }

    const limitInput = (key: string, placeholder: number) =>
        <input type="text" inputMode="numeric" className="form-control form-control-sm casino-input casino-rank-cell" placeholder={ String(placeholder) } value={ limits[key] || '' } onChange={ event => setLimits({ ...limits, [key]: digits(event.target.value) }) } />;

    return (
        <NitroCardView uniqueKey="casino-dealer" className="nitro-casino nitro-casino-dealer" theme="primary-slim" style={ { width: 400 } }>
            <NitroCardHeaderView headerText={ `Casino dealer - ${ config.name }` } onCloseClick={ () => setConfig(null) } />
            <NitroCardTabsView>
                <NitroCardTabsItemView isActive={ (tab === 'dealer') } onClick={ () => setTab('dealer') }>Dealer</NitroCardTabsItemView>
                { config.dealer && <NitroCardTabsItemView isActive={ (tab === 'games') } onClick={ () => setTab('games') }>Games</NitroCardTabsItemView> }
                { config.dealer && <NitroCardTabsItemView isActive={ (tab === 'limits') } onClick={ () => setTab('limits') }>Limits</NitroCardTabsItemView> }
                { config.canEditRanks && <NitroCardTabsItemView isActive={ (tab === 'ranks') } onClick={ () => setTab('ranks') }>Rank limits</NitroCardTabsItemView> }
            </NitroCardTabsView>
            <NitroCardContentView gap={ 2 }>
                { !!config.message && <Text small bold className="casino-message">{ config.message }</Text> }
                { (tab === 'dealer') &&
                    <>
                        <Flex alignItems="center" justifyContent="between" gap={ 2 } className="casino-balances">
                            <Text small bold>{ config.dealer ? `${ config.name } is a casino dealer.` : `${ config.name } is not a dealer yet.` }</Text>
                            <Button variant={ config.dealer ? 'danger' : 'success' } onClick={ () => send('dealer_toggle') }>{ config.dealer ? 'Remove dealer' : 'Make dealer' }</Button>
                        </Flex>
                        { config.dealer &&
                            <Column gap={ 1 } className="casino-run">
                                <Text small bold>Bank</Text>
                                { config.currencies.map(currency =>
                                    <Flex key={ currency.type } alignItems="center" gap={ 1 }>
                                        <LayoutCurrencyIcon type={ currency.type } />
                                        <Text small grow>{ currency.bank } { currency.name } (in play { currency.inPlay }, you have { currency.wallet })</Text>
                                        <input type="text" inputMode="numeric" className="form-control form-control-sm casino-input casino-fund" placeholder="Amount" value={ funds[currency.type] || '' } onChange={ event => setFunds({ ...funds, [currency.type]: digits(event.target.value) }) } />
                                        <Button variant="success" onClick={ () => fund(currency.type, 1) }>+</Button>
                                        <Button variant="danger" onClick={ () => fund(currency.type, -1) }>-</Button>
                                    </Flex>) }
                                <Text small className="casino-info">+ moves currency from your purse into the bank, - takes free bank currency back.</Text>
                            </Column> }
                    </> }
                { config.dealer && (tab === 'games') &&
                    <Column gap={ 1 } className="casino-run">
                        <Text small bold>Games this dealer plays</Text>
                        <Flex gap={ 1 } className="casino-games">
                            { GAMES.map(game =>
                                <Button key={ game.id } variant={ games.includes(game.id) ? 'primary' : 'dark' } className="casino-game" onClick={ () => toggleGame(game.id) }>{ game.name }</Button>) }
                        </Flex>
                        <Button variant="success" disabled={ !games.length } onClick={ save }>Save games</Button>
                    </Column> }
                { config.dealer && (tab === 'limits') &&
                    <Column gap={ 1 } className="casino-run">
                        <Flex gap={ 1 } className="casino-rank-row">
                            <span className="casino-limit-icon" />
                            <Text small bold className="casino-rank-cell">Min bet</Text>
                            <Text small bold className="casino-rank-cell">Max bet</Text>
                            <Text small bold className="casino-rank-cell">Daily loss</Text>
                        </Flex>
                        { config.currencies.map(currency =>
                            <Flex key={ currency.type } alignItems="center" gap={ 1 } className="casino-rank-row">
                                <span className="casino-limit-icon"><LayoutCurrencyIcon type={ currency.type } /></span>
                                { limitInput(`min_${ currency.type }`, currency.defaultMin) }
                                { limitInput(`max_${ currency.type }`, currency.defaultMax) }
                                { limitInput(`daily_${ currency.type }`, currency.defaultDaily) }
                            </Flex>) }
                        <Text small className="casino-info">Empty = hotel default (shown in grey). Daily loss = how much one player may lose per day.</Text>
                        <Button variant="success" onClick={ save }>Save limits</Button>
                    </Column> }
                { config.canEditRanks && (tab === 'ranks') &&
                    <Column gap={ 1 } className="casino-run">
                        <Text small bold>Bet limits by rank (all dealers)</Text>
                        <Flex gap={ 1 } className="casino-rank-row">
                            <Text small bold className="casino-rank-name">Rank</Text>
                            { RANK_FIELDS.map(field => <Flex key={ field.key } center gap={ 1 } className="casino-rank-cell"><LayoutCurrencyIcon type={ field.type } /><Text small>{ field.label }</Text></Flex>) }
                        </Flex>
                        { config.ranks.map(rank =>
                            <Flex key={ rank.id } gap={ 1 } alignItems="center" className="casino-rank-row">
                                <Text small className="casino-rank-name">{ rank.name }</Text>
                                { RANK_FIELDS.map(field =>
                                    <input key={ field.key } type="text" inputMode="numeric" className="form-control form-control-sm casino-input casino-rank-cell" placeholder="-" value={ ranks[`${ rank.id }.${ field.key }`] || '' } onChange={ event => setRanks({ ...ranks, [`${ rank.id }.${ field.key }`]: digits(event.target.value) }) } />) }
                            </Flex>) }
                        <Text small className="casino-info">Empty = hotel default. A dealer's own limits win over these.</Text>
                        <Button variant="success" onClick={ saveRanks }>Save rank limits</Button>
                    </Column> }
            </NitroCardContentView>
        </NitroCardView>
    );
}
