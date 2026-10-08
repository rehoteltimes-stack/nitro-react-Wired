import { FeedbackIconUrl, GuessFeedbackKind } from '../../api/notification/FeedbackKind';
import { CSSProperties, FC, ReactNode, useEffect, useRef, useState } from 'react';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { ILinkEventTracker, NitroCommunicationDemoEvent } from '@nitrots/nitro-renderer';
import { AddEventLinkTracker, CreateLinkEvent, GetConfiguration, OpenOnSite, RemoveLinkEventTracker, SendMessageComposer } from '../../api';
import { EngagementActionComposer, EngagementStateEvent, EngagementStateRequestComposer, IEngagementState, RegisterEngagementMessages } from '../../api/engagement/EngagementProtocol';
import { Base, Button, Column, Flex, LayoutCurrencyIcon, NitroCardContentView, NitroCardHeaderView, NitroCardView, Text } from '../../common';
import { useMainEvent, useMessageEvent, useNotification } from '../../hooks';
import chestIcon from '../../assets/images/engagement/chest.png';
import flameIcon from '../../assets/images/engagement/flame.png';
import questIcon from '../../assets/images/engagement/quest.png';

// Habbo icons, never emoji (user): habbo.st's flame (their Flammen currency), Habbo's gift box, the quest scroll.
// every icon in the same square box: pixel art is never scaled up, only a bigger one is shrunk to fit, so the
// chest (30px), the flame (16px) and the scroll (17x24) line up at one size
const HabboIcon: FC<{ src: string, size?: number }> = ({ src, size = 30 }) =>
    <span className="engagement-icon-box" style={ { width: size, height: size } }><img src={ src } alt="" className="engagement-icon" /></span>;

// The daily loop (own feature, server: hcms-emulator-plugin engagement/): the Daily reward window (7-day calendar +
// streak + freezes) and the chest card in the right column, which uses the mystery box tracker's card
// (.nitro-notification-bubble, collapsible with a chevron). Links: engagement/daily, engagement/chest.

let state: IEngagementState = null;
const listeners = new Set<() => void>();

const useEngagementState = () =>
{
    const [ , setVersion ] = useState(0);

    useEffect(() =>
    {
        const listener = () => setVersion(value => value + 1);

        listeners.add(listener);

        return () => { listeners.delete(listener); };
    }, []);

    return state;
}

const act = (action: string) => SendMessageComposer(new EngagementActionComposer(action));

// the result of the player's last click (claim, open chest, freeze, swap): a line in the open Daily window / Daily Hub
// details for 8 seconds, otherwise a feedback bubble (user, 2026-10-03)
let lastMessage = '';
let lastMessageAt = 0;
// while the Daily reward window is open the result shows there, not on the Today bubble (user, 2026-10-01)
let dailyWindowOpen = false;
let hubDetailsOpen = false;

const ResultLine: FC<{}> = () =>
{
    const [ , setTick ] = useState(0);

    useEffect(() =>
    {
        if(!lastMessage) return;

        const timer = setTimeout(() => setTick(value => value + 1), Math.max(0, 8000 - (Date.now() - lastMessageAt)) + 50);

        return () => clearTimeout(timer);
    });

    if(!lastMessage || (Date.now() - lastMessageAt > 8000)) return null;

    const icon = FeedbackIconUrl(GuessFeedbackKind(lastMessage));

    return (
        <Flex alignItems="center" gap={ 1 } className="engagement-result">
            { icon && <img src={ icon } alt="" className="engagement-result-icon" /> }
            <Text small>{ lastMessage }</Text>
        </Flex>
    );
}

/** Always mounted (MainView): keeps the state, opens the Daily reward window once a day while the reward is waiting. */
export const EngagementView: FC<{}> = props =>
{
    RegisterEngagementMessages();

    const [ dailyOpen, setDailyOpen ] = useState(false);
    const shownFor = useRef('');
    const current = useEngagementState();
    const { showFeedback = null } = useNotification();

    useMessageEvent<EngagementStateEvent>(EngagementStateEvent, event =>
    {
        const next = event.getParser().state;

        // keep the last click's result for the card (pushes in between carry no message)
        if(next.message)
        {
            lastMessage = next.message;
            lastMessageAt = Date.now();

            if(!dailyWindowOpen && !hubDetailsOpen && showFeedback) showFeedback(next.message, GuessFeedbackKind(next.message));
        }

        state = next;
        listeners.forEach(listener => listener());

        // pop the calendar once per streak day while today's reward waits
        const key = `${ state.streak }`;

        if(!state.claimedToday && state.streak > 0 && shownFor.current !== key)
        {
            shownFor.current = key;
            setDailyOpen(true);
        }
    });

    useEffect(() => { SendMessageComposer(new EngagementStateRequestComposer()); }, []);

    // after a reconnect (e.g. an emulator restart) the state held here is the old server's: ask again
    useMainEvent<NitroCommunicationDemoEvent>(NitroCommunicationDemoEvent.CONNECTION_AUTHENTICATED, () => SendMessageComposer(new EngagementStateRequestComposer()));

    useEffect(() =>
    {
        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) =>
            {
                const parts = url.split('/');

                if(parts[1] === 'daily') setDailyOpen(value => !value);
                if(parts[1] === 'quests') CreateLinkEvent('habbopass/quests');
                if(parts[1] === 'chest' && state?.chestReady) act('chest');
            },
            eventUrlPrefix: 'engagement/'
        };

        AddEventLinkTracker(linkTracker);

        return () => RemoveLinkEventTracker(linkTracker);
    }, []);

    if(!dailyOpen || !current) return null;

    return <DailyRewardView state={ current } onClose={ () => setDailyOpen(false) } />;
}

const DailyRewardView: FC<{ state: IEngagementState, onClose: () => void }> = ({ state, onClose }) =>
{
    const { showConfirm = null } = useNotification();

    const buyFreeze = () =>
    {
        if(state.freezes >= state.freezeMax) return;

        showConfirm(`Buy a streak freeze for ${ state.freezePrice } Diamonds?`, () => act('freeze'), null, 'Buy', 'Cancel', 'Streak freeze');
    };

    useEffect(() =>
    {
        dailyWindowOpen = true;
        listeners.forEach(listener => listener());

        return () =>
        {
            dailyWindowOpen = false;
            listeners.forEach(listener => listener());
        };
    }, []);

    return (
        <NitroCardView uniqueKey="engagement-daily" className="nitro-engagement-daily" theme="primary-slim" style={ { width: 420 } }>
            <NitroCardHeaderView headerText="Daily reward" onCloseClick={ onClose } />
            <NitroCardContentView gap={ 2 }>
                <ResultLine />
                <Flex alignItems="center" justifyContent="between">
                    <Flex alignItems="center" gap={ 1 }><HabboIcon src={ flameIcon } /><Text bold>{ state.streak } day streak</Text></Flex>
                    <Text small className="engagement-muted">Best: { state.best } days</Text>
                </Flex>
                <Flex gap={ 1 } className="engagement-days">
                    { state.calendar.map((day, index) =>
                    {
                        const done = (index < state.dayIndex) || ((index === state.dayIndex) && state.claimedToday);
                        const today = (index === state.dayIndex);

                        return (
                            <Column key={ index } gap={ 1 } alignItems="center" className={ `engagement-day${ today ? ' is-today' : '' }${ done ? ' is-done' : '' }${ (index === 6) ? ' is-big' : '' }` }>
                                <Text small bold>Day { index + 1 }</Text>
                                <LayoutCurrencyIcon type={ day.currency } />
                                { done ? <i className="icon icon-pf-tick" /> : <Text small>{ day.amount }</Text> }
                            </Column>
                        );
                    }) }
                </Flex>
                { state.claimedToday
                    ? <Text small className="engagement-ok">You claimed today's reward. Come back tomorrow for day { (state.dayIndex + 1) % 7 + 1 }!</Text>
                    : <Button variant="success" onClick={ () => act('claim') }>Claim day { state.dayIndex + 1 }</Button> }
                <Column gap={ 1 } className="engagement-box">
                    <Text small bold>Streak freezes: { state.freezes } / { state.freezeMax }</Text>
                    <Text small className="engagement-muted">A freeze saves your streak when you miss a day.{ state.vip ? ' As VIP you get one free every week.' : '' }</Text>
                    <Button variant="dark" disabled={ state.freezes >= state.freezeMax } onClick={ buyFreeze }>Buy a freeze ({ state.freezePrice } Diamonds)</Button>
                </Column>
                <Column gap={ 1 } className="engagement-box">
                    <Text small bold>Earned online today{ state.vip ? ' (VIP x2)' : '' }</Text>
                    <Flex gap={ 3 }>
                        <Flex gap={ 1 } alignItems="center"><LayoutCurrencyIcon type={ 5 } /><Text small>{ state.todayDiamonds } / { state.capDiamonds }</Text></Flex>
                        <Flex gap={ 1 } alignItems="center"><LayoutCurrencyIcon type={ 101 } /><Text small>{ state.todayEmeralds } / { state.capEmeralds }</Text></Flex>
                    </Flex>
                    <Text small className="engagement-muted">Paid every 10 minutes you are in a room (not idle). Next in { state.nextPayoutMinutes } min.</Text>
                </Column>
            </NitroCardContentView>
        </NitroCardView>
    );
}

const bonusText = (state: IEngagementState) => state.questBonusPaid
    ? `Bonus collected (${ state.questBonus } Diamonds${ state.questBonusXp ? ` + ${ state.questBonusXp } XP` : '' }). More quests keep coming today, with smaller rewards.`
    : `${ Math.min(state.questsDoneToday, state.questBonusAfter) } / ${ state.questBonusAfter } done for the bonus: +${ state.questBonus } Diamonds${ state.questBonusXp ? ` + ${ state.questBonusXp } XP` : '' }.`;

const QuestCard: FC<{ title: string, progress: number, target: number, done: boolean, xp: number, badge?: string, time?: ReactNode, children?: ReactNode }> = ({ title, progress, target, done, xp, badge = '', time = null, children = null }) =>
{
    const site = GetConfiguration<string>('url.prefix', '');
    const progressStyle = { '--value': Math.min(progress, target), '--max': Math.max(1, target) } as CSSProperties;

    return (
        <article className={ `rewards-quest-card${ done ? ' is-locked' : '' }` }>
            <div className="rewards-quest-top">
                <div className={ `rewards-quest-icon${ badge ? ' is-badge' : '' }` }><img src={ badge ? GetConfiguration<string>('badge.asset.url').replace('%badgename%', badge) : questIcon } alt="" /></div>
                <div className="rewards-quest-text">{ title }</div>
                <div className="rewards-quest-badges">
                    { time && <span className="rewards-quest-badges-time" style={ { '--quest-time-icon': `url(${ site }/assets/img/icon/icon_time.png)` } as CSSProperties }>{ time }</span> }
                    { (xp > 0) && <span className="rewards-quest-badges-winwins" style={ { '--quest-xp-icon': `url(${ site }/assets/img/center/money/icon_winwin.png)` } as CSSProperties }>{ xp }</span> }
                </div>
            </div>
            <div className="rewards-quest-progress-row">
                <div className="rewards-quest-progress" style={ progressStyle }><span className="rewards-quest-progress-fill" /></div>
                <span className="rewards-quest-progress-label">{ done && <i className="icon icon-pf-tick" /> }{ done ? 'Done' : `${ progress } / ${ target }` }</span>
                { children }
            </div>
        </article>
    );
}

export const EngagementQuestsPanel: FC<{}> = props =>
{
    const current = useEngagementState();

    if(!current) return null;

    return <div className="nitro-engagement-daily engagement-quests-panel"><DailyQuestsView state={ current } /></div>;
}

const DailyQuestsView: FC<{ state: IEngagementState }> = ({ state }) =>
{
    const quests = state.quests || [];
    const open = quests.filter(quest => !quest.done);
    const missions = (state.missions || []).filter(mission => !mission.completed);

    return (
        <Column gap={ 2 }>
            <Flex alignItems="center" justifyContent="between" gap={ 2 }>
                <Text small className="engagement-muted">A new quest comes after each one. { state.questFullCount ? `The first ${ state.questFullCount } a day pay in full.` : '' }</Text>
                <Flex gap={ 1 } className="flex-shrink-0">
                    <Button variant="primary" onClick={ () => CreateLinkEvent('achievements/toggle') }>Achievements</Button>
                </Flex>
            </Flex>
            <Text small className={ state.questBonusPaid ? 'engagement-ok' : 'engagement-muted' }>{ bonusText(state) }</Text>
            <div className="rewards-quests-grid">
                { state.seasonQuest &&
                    <QuestCard
                        title={ (state.seasonQuest.step < state.seasonQuest.steps) ? `${ state.seasonQuest.title }: ${ state.seasonQuest.stepTitle }` : `${ state.seasonQuest.title }: done for today, a new one comes tomorrow` }
                        progress={ (state.seasonQuest.step < state.seasonQuest.steps) ? state.seasonQuest.progress : 1 }
                        target={ (state.seasonQuest.step < state.seasonQuest.steps) ? state.seasonQuest.target : 1 }
                        done={ state.seasonQuest.step >= state.seasonQuest.steps }
                        xp={ 0 }
                        time={ <Flex alignItems="center" gap={ 1 }>Step { Math.min(state.seasonQuest.step + 1, state.seasonQuest.steps) } / { state.seasonQuest.steps }{ (state.seasonQuest.step < state.seasonQuest.steps) && <> · +{ state.seasonQuest.reward } <LayoutCurrencyIcon type={ state.seasonQuest.rewardType } /></> }</Flex> } /> }
                { open.map(quest =>
                    <QuestCard
                        key={ quest.slot }
                        title={ quest.title }
                        progress={ quest.progress }
                        target={ quest.target }
                        done={ quest.done }
                        xp={ quest.xp || 0 }
                        badge={ quest.badge }
                        time={ <Flex alignItems="center" gap={ 1 }>Today · +{ quest.rewardAmount } <LayoutCurrencyIcon type={ quest.rewardType } /></Flex> }>
                        { !quest.done && (state.swapsLeft > 0) &&
                            <Button variant="dark" className="rewards-quest-swap" onClick={ () => act(`swap:${ quest.slot }`) }>{ state.freeSwap ? 'Swap (free VIP)' : <Flex alignItems="center" gap={ 1 }>Swap { state.swapPrice } <LayoutCurrencyIcon type={ 5 } /></Flex> }</Button> }
                    </QuestCard>) }
                { missions.map((mission, index) =>
                    <QuestCard
                        key={ `mission-${ index }` }
                        title={ mission.title }
                        progress={ mission.progress }
                        target={ mission.quantity }
                        done={ mission.completed }
                        xp={ mission.xp } />) }
            </div>
        </Column>
    );
}


type TodayTone = 'ready' | 'done' | 'idle';

const HUB_MINIMIZED_KEY = 'hcms.dailyhub.minimized';

const TodayPill: FC<{ tone?: TodayTone, children: ReactNode }> = ({ tone = 'idle', children }) =>
    <span className={ `engagement-today-pill is-${ tone }` }>{ children }</span>;

const XpIcon: FC<{}> = () => <span className="engagement-today-xp-icon" />;

const TodayRow: FC<{ icon: ReactNode, title: string, status?: ReactNode, sub?: ReactNode, onOpen?: () => void, disabled?: boolean, children?: ReactNode }> = ({ icon, title, status, sub, onOpen, disabled = false, children }) =>
    <Column gap={ 1 } className={ `engagement-today-row${ disabled ? ' is-disabled' : '' }` }>
        <Flex alignItems="center" gap={ 2 } className={ (onOpen && !disabled) ? 'engagement-today-head is-link' : 'engagement-today-head' } onClick={ disabled ? undefined : onOpen }>
            <span className="engagement-today-icon">{ icon }</span>
            <Column grow gap={ 0 } className="engagement-today-text">
                <Flex alignItems="center" justifyContent="between" gap={ 1 }>
                    <Text bold variant="white" truncate>{ title }</Text>
                    { status }
                </Flex>
                { sub && <Text small className="engagement-today-muted">{ sub }</Text> }
            </Column>
        </Flex>
        { !disabled && children }
    </Column>;

const TodayTile: FC<{ icon: ReactNode, label: string, value: string, tone: TodayTone, onClick: () => void, disabled?: boolean, wide?: boolean }> = ({ icon, label, value, tone, onClick, disabled = false, wide = false }) =>
    <Flex pointer={ !disabled } alignItems="center" gap={ 1 } className={ `engagement-today-tile is-${ tone }${ disabled ? ' is-disabled' : '' }${ wide ? ' is-wide' : '' }` } onClick={ disabled ? undefined : onClick }>
        <span className="engagement-today-icon is-small">{ icon }</span>
        <Column gap={ 0 } className="engagement-today-text">
            <span className="engagement-today-tile-label">{ label }</span>
            <span className="engagement-today-tile-value">{ value }</span>
        </Column>
    </Flex>;

const TodayBar: FC<{ percent: number, kind: string }> = ({ percent, kind }) =>
    <div className={ `engagement-today-bar is-${ kind }` }><div style={ { width: `${ Math.max(0, Math.min(100, percent)) }%` } } /></div>;

export const OnlineChestView: FC<{}> = props =>
{
    const current = useEngagementState();
    const [ detailsOpen, setDetailsOpen ] = useState(false);
    const [ minimized, setMinimized ] = useState(() =>
    {
        try { return (window.localStorage.getItem(HUB_MINIMIZED_KEY) === '1'); }
        catch { return false; }
    });

    useEffect(() =>
    {
        hubDetailsOpen = detailsOpen;

        return () => { hubDetailsOpen = false; };
    }, [ detailsOpen ]);

    if(!current) return null;

    const percent = (value: number, cap: number) => (cap > 0 ? (value * 100) / cap : 0);
    const plural = (count: number, word: string) => `${ count } ${ word }${ (count === 1) ? '' : 's' }`;
    const openQuests = () => CreateLinkEvent('habbopass/quests');
    const openPass = () => CreateLinkEvent('habbopass/show');

    const chestsDone = current.chestsToday >= current.chestMax;
    const chestPercent = current.chestReady ? 100 : 100 - percent(current.chestMinutesLeft, 30);
    const todayReward = (current.calendar || [])[current.dayIndex];
    const openQuestList = (current.quests || []).filter(quest => !quest.done);
    const pass = current.pass;
    const passDone = !!pass && (pass.level >= pass.maxLevel);
    const paused = (current.paused !== false);
    const missions = current.missions || [];

    const rewardTone: TodayTone = current.claimedToday ? 'done' : 'ready';
    const chestTone: TodayTone = chestsDone ? 'done' : (current.chestReady ? 'ready' : 'idle');
    const chestValue = chestsDone ? 'Done' : (current.chestReady ? 'Ready' : `${ current.chestMinutesLeft } min`);
    const anythingReady = [ rewardTone, chestTone ].includes('ready') || (!paused && (openQuestList.length > 0));

    const toggleMinimized = () =>
    {
        const next = !minimized;

        setMinimized(next);

        try { window.localStorage.setItem(HUB_MINIMIZED_KEY, next ? '1' : '0'); }
        catch { return; }
    };

    const earned = (
        <Flex alignItems="center" gap={ 1 } className="engagement-today-earned">
            <LayoutCurrencyIcon type={ 101 } />
            <Text small variant="white">{ current.todayEmeralds }/{ current.capEmeralds }</Text>
            <LayoutCurrencyIcon type={ 5 } />
            <Text small variant="white">{ current.todayDiamonds }/{ current.capDiamonds }</Text>
            <Text small grow className="engagement-today-muted text-end text-nowrap">{ current.vip ? 'x2 · ' : '' }{ current.nextPayoutMinutes } min</Text>
        </Flex>
    );

    const header = (
        <Flex alignItems="center" justifyContent="between" gap={ 1 }>
            <Flex alignItems="center" gap={ 1 }>
                <span className="engagement-today-info" title="Details" onClick={ () => setDetailsOpen(value => !value) }>i</span>
                <Text bold variant="white" className="engagement-today-title">Daily Hub</Text>
                { current.vip
                    ? <span className="engagement-today-vip">VIP</span>
                    : <span className="engagement-today-vip is-join" onClick={ () => OpenOnSite('/center/vip') }>Join VIP</span> }
            </Flex>
            <Flex alignItems="center" gap={ 1 }>
                { minimized && anythingReady && <span className="engagement-today-ready-dot" title="Something is ready" /> }
                <span className="engagement-today-toggle" title={ minimized ? 'Show' : 'Minimize' } onClick={ toggleMinimized }>{ minimized ? <FaChevronDown /> : <FaChevronUp /> }</span>
            </Flex>
        </Flex>
    );

    return (
        <>
            <Base className={ `nitro-notification-bubble rounded engagement-chest engagement-today is-collapsed${ minimized ? ' is-minimized' : '' }` }>
                <Column gap={ 1 }>
                    { header }
                    { !minimized && <>
                    <div className="engagement-today-tiles">
                        <TodayTile icon={ <HabboIcon src={ flameIcon } size={ 26 } /> } label="Reward" value={ current.claimedToday ? 'Claimed' : 'Claim' } tone={ rewardTone } onClick={ () => CreateLinkEvent('engagement/daily') } />
                        <TodayTile icon={ <HabboIcon src={ chestIcon } size={ 26 } /> } label="Chest" value={ chestValue } tone={ chestTone } onClick={ () => (current.chestReady && !chestsDone) ? act('chest') : setDetailsOpen(true) } />
                        <TodayTile icon={ <HabboIcon src={ questIcon } size={ 26 } /> } label="Quests" value={ paused ? 'Soon' : `${ current.questsDoneToday }/${ (current.quests || []).length }` } tone={ paused ? 'idle' : (openQuestList.length ? 'ready' : 'done') } onClick={ openQuests } disabled={ paused } wide={ !pass } />
                        { pass && <TodayTile icon={ <XpIcon /> } label="Pass" value={ paused ? 'Soon' : `Lv ${ pass.level }` } tone={ paused ? 'idle' : (passDone ? 'done' : 'ready') } onClick={ openPass } disabled={ paused } /> }
                    </div>
                    { earned }
                    </> }
                </Column>
            </Base>
            { detailsOpen &&
                <NitroCardView uniqueKey="daily-hub" className="engagement-hub-window" theme="primary-slim" style={ { width: 340 } }>
                    <NitroCardHeaderView headerText="Daily Hub" onCloseClick={ () => setDetailsOpen(false) } />
                    <NitroCardContentView>
                        <Column gap={ 1 } className="engagement-today engagement-hub-details">
                { !dailyWindowOpen && <ResultLine /> }
                <TodayRow
                    icon={ <HabboIcon src={ flameIcon } size={ 26 } /> }
                    title="Daily reward"
                    status={ <TodayPill tone={ rewardTone }>Day { current.dayIndex + 1 }/7</TodayPill> }
                    sub={ `Streak ${ plural(current.streak, 'day') } · best ${ current.best } · ${ plural(current.freezes, 'freeze') }` }
                    onOpen={ () => CreateLinkEvent('engagement/daily') }>
                    { current.claimedToday
                        ? <Text small className="engagement-today-ready">Claimed. Day { (current.dayIndex + 1) % 7 + 1 } is tomorrow.</Text>
                        : <Button fullWidth variant="success" onClick={ () => act('claim') }>
                            <Flex alignItems="center" justifyContent="center" gap={ 1 }>Claim { todayReward ? todayReward.amount : '' } { todayReward && <LayoutCurrencyIcon type={ todayReward.currency } /> }</Flex>
                        </Button> }
                </TodayRow>
                <TodayRow
                    icon={ <HabboIcon src={ chestIcon } size={ 26 } /> }
                    title="Online chest"
                    status={ <TodayPill tone={ chestTone }>{ current.chestsToday }/{ current.chestMax }</TodayPill> }
                    sub={ chestsDone ? 'All chests opened today' : (current.chestReady ? 'Ready to open!' : `Next one in ${ current.chestMinutesLeft } min in a room`) }>
                    { !chestsDone &&
                        <>
                            <TodayBar percent={ chestPercent } kind="chest" />
                            { current.chestReady
                                ? <Button fullWidth variant="success" onClick={ () => act('chest') }>Open chest</Button>
                                : <Button fullWidth variant="dark" onClick={ () => act('chest_skip') }><Flex alignItems="center" justifyContent="center" gap={ 1 }>Open now · { current.skipPrice } <LayoutCurrencyIcon type={ 5 } /></Flex></Button> }
                        </> }
                </TodayRow>
                <TodayRow
                    icon={ <HabboIcon src={ questIcon } size={ 26 } /> }
                    title="Daily quests"
                    status={ paused ? <TodayPill>Soon</TodayPill> : <TodayPill tone={ openQuestList.length ? 'ready' : 'done' }>{ current.questsDoneToday }/{ (current.quests || []).length }</TodayPill> }
                    sub={ paused ? 'Daily quests start on Monday' : (openQuestList.length ? `${ openQuestList.length } left today` : 'All quests done today') }
                    onOpen={ openQuests }
                    disabled={ paused }>
                    { openQuestList.map(quest =>
                        <Flex key={ quest.slot } alignItems="center" gap={ 1 } className="engagement-today-quest">
                            <span className="engagement-today-quest-dot" />
                            <Text small truncate grow>{ quest.title }</Text>
                            <Text small>{ Math.min(quest.progress, quest.target) }/{ quest.target }</Text>
                            <Flex alignItems="center" gap={ 0 } className="engagement-today-quest-reward">+{ quest.rewardAmount }<LayoutCurrencyIcon type={ quest.rewardType } /></Flex>
                        </Flex>) }
                </TodayRow>
                { pass &&
                    <TodayRow
                        icon={ <XpIcon /> }
                        title="HabboPass"
                        status={ paused ? <TodayPill>Soon</TodayPill> : <TodayPill tone={ passDone ? 'done' : 'ready' }>Lv { pass.level }/{ pass.maxLevel }</TodayPill> }
                        sub={ paused ? 'The season starts on Monday' : (passDone ? 'Max level reached' : `${ pass.into }/${ pass.perLevel } XP to the next level`) }
                        onOpen={ openPass }
                        disabled={ paused }>
                        <TodayBar percent={ passDone ? 100 : percent(pass.into, Math.max(1, pass.perLevel)) } kind="pass" />
                    </TodayRow> }
                <TodayRow
                    icon={ <LayoutCurrencyIcon type={ 101 } /> }
                    title="Earned online"
                    status={ <TodayPill>{ current.nextPayoutMinutes } min</TodayPill> }
                    sub={ `Paid every 10 minutes in a room${ current.vip ? ', VIP x2' : '' }` }>
                    <Flex alignItems="center" gap={ 1 }>
                        <LayoutCurrencyIcon type={ 101 } />
                        <TodayBar percent={ percent(current.todayEmeralds, current.capEmeralds) } kind="emeralds" />
                        <Text small variant="white" className="engagement-today-amount">{ current.todayEmeralds }/{ current.capEmeralds }</Text>
                    </Flex>
                    <Flex alignItems="center" gap={ 1 }>
                        <LayoutCurrencyIcon type={ 5 } />
                        <TodayBar percent={ percent(current.todayDiamonds, current.capDiamonds) } kind="diamonds" />
                        <Text small variant="white" className="engagement-today-amount">{ current.todayDiamonds }/{ current.capDiamonds }</Text>
                    </Flex>
                </TodayRow>
                        </Column>
                    </NitroCardContentView>
                </NitroCardView> }
        </>
    );
}
