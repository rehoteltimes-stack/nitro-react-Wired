import { FC, useEffect, useRef, useState } from 'react';
import { SendMessageComposer } from '../../api';
import { CasinoActionComposer, CasinoStateEvent, CasinoTalkMode, GetCasinoPreferences, ICasinoPreferences, ICasinoState, RegisterCasinoMessages, SetCasinoPreferences } from '../../api/games/CasinoProtocol';
import { Button, Column, Flex, LayoutCurrencyIcon, NitroCardContentView, NitroCardHeaderView, NitroCardView, Text } from '../../common';
import { useMessageEvent } from '../../hooks';

const GAMES = [
    { id: 'hl', name: 'High / Low', info: 'Call high (4-6) or low (1-3), the dealer rolls one dice.' },
    { id: 'tri', name: 'Tri', info: 'An opening roll decides who starts. Three dice each, the higher sum wins. A draw is rolled again.' },
    { id: 'poker', name: 'Poker', info: 'An opening roll decides who starts. Five dice each, the better hand wins. A draw is rolled again.' },
    { id: '21', name: '21', info: 'An opening roll decides who starts (the lowest). Roll up to 21 without going over. A draw is played again.' },
    { id: '13', name: '13', info: 'An opening roll decides who starts (the lowest). Roll up to 13 without going over. A draw is played again.' }
];

const TALK_MODES: { id: CasinoTalkMode, name: string }[] = [
    { id: 'chat', name: 'Chat' },
    { id: 'whisper', name: 'Whisper' },
    { id: 'window', name: 'Window only' }
];

const AUTO_GAMES = [ 'hl', 'tri', 'poker' ];
const AUTO_ROUNDS = [ 5, 10, 25 ];
const AUTO_PAUSE_MS = 1200;
const AUTO_REFUSED_MS = 3000;
const NEAR_POLL_MS = 1500;

export const CasinoView: FC<{}> = props =>
{
    RegisterCasinoMessages();

    const [ state, setState ] = useState<ICasinoState>(null);
    const [ isVisible, setIsVisible ] = useState(false);
    const [ game, setGame ] = useState('hl');
    const [ currency, setCurrency ] = useState(5);
    const [ amountText, setAmountText ] = useState('10');
    const [ side, setSide ] = useState('high');
    const [ preferences, setPreferences ] = useState<ICasinoPreferences>(GetCasinoPreferences);
    const [ autoSize, setAutoSize ] = useState(AUTO_ROUNDS[0]);
    const [ autoLeft, setAutoLeft ] = useState(0);
    const [ autoNote, setAutoNote ] = useState('');
    const [ autoTick, setAutoTick ] = useState(0);
    const expectedRound = useRef(0);
    const sentAt = useRef(0);
    const autoTimer = useRef(0);
    const autoStep = useRef<() => void>(null);

    useMessageEvent<CasinoStateEvent>(CasinoStateEvent, event =>
    {
        const next = event.getParser().state;

        if(!next) return;

        setState(next);
        setIsVisible(true);
    });

    useEffect(() => () => window.clearTimeout(autoTimer.current), []);

    useEffect(() =>
    {
        if(!isVisible || !state || state.near) return;

        const interval = window.setInterval(() => SendMessageComposer(new CasinoActionComposer('state')), NEAR_POLL_MS);

        return () => window.clearInterval(interval);
    }, [ isVisible, state?.near ]);

    useEffect(() =>
    {
        if(!autoLeft || !state || !state.settled) return;

        if((state.round ?? 0) < expectedRound.current)
        {
            if((Date.now() - sentAt.current) < AUTO_REFUSED_MS) return;

            setAutoLeft(0);
            setAutoNote('Autoplay stopped: the last bet was not accepted.');

            return;
        }

        window.clearTimeout(autoTimer.current);
        autoTimer.current = window.setTimeout(() => setAutoTick(tick => tick + 1), AUTO_PAUSE_MS);
    }, [ state, autoLeft ]);

    useEffect(() =>
    {
        if(autoTick && autoStep.current) autoStep.current();
    }, [ autoTick ]);

    if(!isVisible || !state) return null;

    const selected = state.currencies.find(entry => (entry.type === currency)) ?? state.currencies[0];
    const offered = GAMES.filter(entry => (!state.games || state.games.includes(entry.id)));
    const activeGame = offered.some(entry => (entry.id === game)) ? game : (offered[0]?.id ?? game);
    const info = GAMES.find(entry => (entry.id === activeGame));
    const amount = (/^\d+$/.test(amountText) ? parseInt(amountText) : 0);
    const problem = !selected ? '' : (!amountText.length ? 'Type how much you want to bet.' : (amount < selected.min || amount > selected.max) ? `Bets in ${ selected.name } must be between ${ selected.min } and ${ selected.max }.` : (amount > selected.balance) ? `You don't have ${ amount } ${ selected.name }.` : '');
    const valid = state.enabled && state.near && !state.run && selected && !problem;
    const canAuto = AUTO_GAMES.includes(activeGame);

    const changePreferences = (next: ICasinoPreferences) =>
    {
        setPreferences(next);
        SetCasinoPreferences(next);
        SendMessageComposer(new CasinoActionComposer('preferences'));
    }

    const placeBet = () =>
    {
        if(!valid) return false;

        expectedRound.current = (state.round ?? 0) + 1;
        sentAt.current = Date.now();
        SendMessageComposer(new CasinoActionComposer('bet', activeGame, amount, currency, (activeGame === 'hl') ? side : ''));

        return true;
    }

    const stopAuto = (note: string = '') =>
    {
        window.clearTimeout(autoTimer.current);
        setAutoLeft(0);
        setAutoNote(note);
    }

    const startAuto = () =>
    {
        setAutoNote('');

        if(placeBet()) setAutoLeft(autoSize - 1);
    }

    autoStep.current = () =>
    {
        if(autoLeft <= 0) return;

        if(!valid || !canAuto)
        {
            stopAuto(problem ? `Autoplay stopped: ${ problem }` : 'Autoplay stopped.');

            return;
        }

        if(placeBet()) setAutoLeft(left => left - 1);
    };

    return (
        <NitroCardView uniqueKey="casino" className="nitro-casino" theme="primary-slim" style={ { width: 380 } }>
            <NitroCardHeaderView headerText={ state.dealer ? `Casino - ${ state.dealer }` : 'Casino' } onCloseClick={ () => { stopAuto(); setIsVisible(false); } } />
            <NitroCardContentView gap={ 2 }>
                { !state.enabled && <Text small bold className="casino-warning">The casino is closed right now.</Text> }
                { state.enabled && !state.near && <Text small bold className="casino-warning">Walk back to a dealer to play.</Text> }
                { !!state.message && <Text small bold className="casino-message">{ state.message }</Text> }
                <Flex gap={ 2 } className="casino-balances">
                    { state.currencies.map(entry =>
                        <Flex key={ entry.type } alignItems="center" gap={ 1 }>
                            <LayoutCurrencyIcon type={ entry.type } />
                            <Text small bold>{ entry.balance }</Text>
                        </Flex>) }
                </Flex>
                { state.run &&
                    <Column gap={ 1 } className="casino-run">
                        <Text small bold>{ state.run.game } for { state.run.stake } { state.currencies.find(entry => (entry.type === state.run.currency))?.name }</Text>
                        { state.run.dealerFirst && <Text small>The house has { state.run.house }. Beat it without going over { state.run.target }.</Text> }
                        <Text small>Your total: <b>{ state.run.total }</b> / { state.run.target }</Text>
                        <Flex gap={ 1 }>
                            <Button variant="success" fullWidth onClick={ () => SendMessageComposer(new CasinoActionComposer('roll')) }>Roll</Button>
                            <Button variant="danger" fullWidth onClick={ () => SendMessageComposer(new CasinoActionComposer('stand')) }>Stand</Button>
                        </Flex>
                        <Text small className="casino-info">You can also click your dice to roll.</Text>
                    </Column> }
                { !state.run &&
                    <>
                        <Flex gap={ 1 } className="casino-games">
                            { offered.map(entry =>
                                <Button key={ entry.id } variant={ (activeGame === entry.id) ? 'primary' : 'dark' } className="casino-game" disabled={ autoLeft > 0 } onClick={ () => setGame(entry.id) }>{ entry.name }</Button>) }
                        </Flex>
                        { info && <Text small className="casino-info">{ info.info } Pays { state.payouts[activeGame] }x.</Text> }
                        { (activeGame === 'hl') &&
                            <Flex gap={ 1 }>
                                <Button variant={ (side === 'high') ? 'primary' : 'dark' } fullWidth onClick={ () => setSide('high') }>High (4-6)</Button>
                                <Button variant={ (side === 'low') ? 'primary' : 'dark' } fullWidth onClick={ () => setSide('low') }>Low (1-3)</Button>
                            </Flex> }
                        <Flex gap={ 1 } alignItems="center">
                            { state.currencies.map(entry =>
                                <Button key={ entry.type } variant={ (currency === entry.type) ? 'primary' : 'dark' } disabled={ autoLeft > 0 } onClick={ () => { setCurrency(entry.type); setAmountText(String(entry.min)); } }>
                                    <Flex alignItems="center" gap={ 1 }><LayoutCurrencyIcon type={ entry.type } /> { entry.name }</Flex>
                                </Button>) }
                            <input type="text" inputMode="numeric" className="form-control form-control-sm casino-input casino-amount" placeholder={ selected ? `${ selected.min } - ${ selected.max }` : '' } value={ amountText } disabled={ autoLeft > 0 } onChange={ event => setAmountText(event.target.value.replace(/\D/g, '').slice(0, 9)) } onFocus={ event => event.target.select() } onKeyDown={ event => (event.key === 'Enter') && placeBet() } />
                        </Flex>
                        { selected && <Text small className={ problem ? 'casino-warning' : 'casino-limits' }>{ problem || `Bets from ${ selected.min } to ${ selected.max } ${ selected.name }.` }</Text> }
                        <Button variant={ valid ? 'success' : 'dark' } disabled={ !valid || (autoLeft > 0) } onClick={ placeBet }>Place bet</Button>
                        { canAuto &&
                            <Flex gap={ 1 } alignItems="center" className="casino-auto">
                                { (autoLeft > 0)
                                    ? <Button variant="danger" fullWidth onClick={ () => stopAuto('Autoplay stopped.') }>Stop autoplay ({ autoLeft } left)</Button>
                                    : <>
                                        <Text small bold>Autoplay</Text>
                                        { AUTO_ROUNDS.map(rounds =>
                                            <Button key={ rounds } variant={ (autoSize === rounds) ? 'primary' : 'dark' } onClick={ () => setAutoSize(rounds) }>{ rounds }x</Button>) }
                                        <Button variant={ valid ? 'warning' : 'dark' } disabled={ !valid } className="casino-auto-start" onClick={ startAuto }>Start</Button>
                                    </> }
                            </Flex> }
                        { !!autoNote && <Text small className="casino-info">{ autoNote }</Text> }
                    </> }
                <Column gap={ 1 } className="casino-talk">
                    <Text small bold>Dealer talks to you</Text>
                    <Flex gap={ 1 }>
                        { TALK_MODES.map(entry =>
                            <Button key={ entry.id } variant={ (preferences.mode === entry.id) ? 'primary' : 'dark' } fullWidth onClick={ () => changePreferences({ ...preferences, mode: entry.id }) }>{ entry.name }</Button>) }
                    </Flex>
                    <Flex alignItems="center" gap={ 1 } pointer onClick={ () => changePreferences({ ...preferences, shareResults: !preferences.shareResults }) }>
                        <input className="form-check-input" type="checkbox" checked={ preferences.shareResults } readOnly />
                        <Text small>Announce my wins and losses to the room</Text>
                    </Flex>
                </Column>
            </NitroCardContentView>
        </NitroCardView>
    );
}
