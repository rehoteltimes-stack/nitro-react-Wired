import { ILinkEventTracker } from '@nitrots/nitro-renderer';
import { CSSProperties, FC, useEffect, useRef, useState } from 'react';
import { AddEventLinkTracker, GetConfiguration, RemoveLinkEventTracker, SendMessageComposer } from '../../api';
import { IPassLevel, IPassReward, IPassState, PassRequestComposer, PassStateEvent, RegisterPassMessages } from '../../api/engagement/PassProtocol';
import { LayoutCenterLoaderView, NitroCardContentView, NitroCardHeaderView, NitroCardView } from '../../common';
import { EngagementQuestsPanel } from '../engagement/EngagementView';
import { useMessageEvent } from '../../hooks';

const BUSY_TIMEOUT = 6000;

const formatEnd = (endsAt: number) =>
{
    const date = new Date(endsAt * 1000);

    return `${ date.getDate() } ${ date.toLocaleString('en-GB', { month: 'long' }) } at ${ String(date.getHours()).padStart(2, '0') }:${ String(date.getMinutes()).padStart(2, '0') }`;
}

const TrackImage: FC<{ reward: IPassReward }> = ({ reward }) =>
    <div className="tracks-image-rewards-pass">
        { reward.name
            ? <img src={ reward.image } alt={ reward.name } title={ reward.name } />
            : <span className="no-reward" title="No reward at this level">-</span> }
    </div>;

export const HabboPassView: FC<{}> = props =>
{
    RegisterPassMessages();

    const [ isVisible, setIsVisible ] = useState(false);
    const [ state, setState ] = useState<IPassState>(null);
    const [ busy, setBusy ] = useState(false);
    const [ claiming, setClaiming ] = useState(false);
    const [ notice, setNotice ] = useState('');
    const [ shown, setShown ] = useState<IPassLevel>(null);
    const [ tab, setTab ] = useState<'pass' | 'quests'>('pass');
    const currentRef = useRef<HTMLDivElement>(null);
    const busyTimer = useRef(0);

    const request = (action: 'state' | 'claim') =>
    {
        setBusy(true);
        setClaiming(action === 'claim');
        window.clearTimeout(busyTimer.current);
        busyTimer.current = window.setTimeout(() => setBusy(false), BUSY_TIMEOUT);
        SendMessageComposer(new PassRequestComposer(action));
    }

    useMessageEvent<PassStateEvent>(PassStateEvent, event =>
    {
        const next = event.getParser().state;

        window.clearTimeout(busyTimer.current);
        setBusy(false);

        if(!next.loaded)
        {
            setNotice('HabboPass could not be loaded. Try again in a moment.');

            return;
        }

        setState(next);

        if(next.collected > 0) setNotice(`You collected ${ next.collected } reward${ (next.collected === 1) ? '' : 's' }. Currencies are in your purse, everything else in your inventory.`);
    });

    useEffect(() =>
    {
        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) =>
            {
                const parts = url.split('/');

                if(parts[1] === 'show') { setTab('pass'); setIsVisible(true); }
                if(parts[1] === 'quests') { setTab('quests'); setIsVisible(true); }
                if(parts[1] === 'hide') setIsVisible(false);
                if(parts[1] === 'toggle') setIsVisible(value => !value);
            },
            eventUrlPrefix: 'habbopass/'
        };

        AddEventLinkTracker(linkTracker);

        return () =>
        {
            RemoveLinkEventTracker(linkTracker);
            window.clearTimeout(busyTimer.current);
        };
    }, []);

    useEffect(() =>
    {
        if(!isVisible) return;

        setNotice('');
        setShown(null);
        request('state');
    }, [ isVisible ]);

    useEffect(() =>
    {
        if(isVisible && currentRef.current) currentRef.current.scrollIntoView({ block: 'nearest', inline: 'center' });
    }, [ isVisible, tab, state?.season, state?.level ]);

    if(!isVisible) return null;

    const close = () => setIsVisible(false);

    const renderPass = () =>
    {
        if(!state) return <LayoutCenterLoaderView overlay={ false } />;

        if(!state.active) return <div className="habbopass-empty">{ notice || 'No HabboPass season is running right now.' }</div>;

        const maxed = state.level >= state.maxLevel;
        const ready = Math.max(0, state.level - state.freeClaimed) + (state.isVip ? Math.max(0, state.level - state.vipClaimed) : 0);
        const last = state.levels[state.levels.length - 1];
        const showcase = shown || last;
        const showcaseReward = showcase ? ((showcase.vip.name && (state.isVip || !shown)) ? showcase.vip : (showcase.free.name ? showcase.free : showcase.vip)) : null;
        const showcaseVip = !!showcase && (showcaseReward === showcase.vip);
        const progressStyle = { '--value': state.into, '--max': Math.max(1, state.perLevel) } as CSSProperties;
        const nextLevel = Math.min(state.maxLevel, state.level + 1);

        return (
            <>
                <div className="top-rewards-pass">
                    <div className="card-rewards-pass">
                        <div className="profile-rewards-pass">
                            <div className="avatar-rewards-pass">{ state.avatar && <img src={ state.avatar } alt="" /> }</div>
                            <div className="wins-rewards-pass">
                                <div className="wins-text-rewards-pass">You have <b>{ state.winwins.toLocaleString('en-GB') }</b> XP</div>
                                <div className="badges-rewards-pass">
                                    <span className="badge-rewards-pass">{ state.level }</span>
                                    <span className="progress-rewards-pass" style={ progressStyle }>
                                        <div className="progress-text-rewards-pass">{ maxed ? 'Max level reached' : `${ (state.perLevel - state.into).toLocaleString('en-GB') } XP to go` }</div>
                                    </span>
                                    <span className="badge-rewards-pass">{ nextLevel }</span>
                                </div>
                            </div>
                        </div>
                        <div className="info-with-button-rewards-pass">
                            <div className="info-rewards-pass">
                                <b>{ state.season }</b> is available { state.endsAt ? <>until <b>{ formatEnd(state.endsAt) }</b>,</> : 'for a limited time,' } unlock its exclusive content by taking part in quests, events and activities in the hotel!
                                { !state.isVip && <div className="habbopass-vip-note">The VIP track pays out once you join the VIP Club. Levels you reach stay waiting for you.</div> }
                                { notice && <div className="habbopass-notice">{ notice }</div> }
                            </div>
                            { (ready > 0) &&
                                <div className="habbopass-actions">
                                    <button type="button" className="collect-rewards-pass" disabled={ busy } onClick={ () => request('claim') }>{ `Collect ${ ready } reward${ (ready === 1) ? '' : 's' }` }</button>
                                </div> }
                        </div>
                    </div>
                    { showcase && showcaseReward &&
                        <div className="lot-rewards-pass">
                            { showcaseVip && <span className="vip-tag-vitrine">VIP</span> }
                            <span className="habbopass-lot-level">Level { showcase.level }</span>
                            <div className="image-lot-rewards-pass" title={ showcaseReward.name }>{ showcaseReward.image && <img src={ showcaseReward.image } alt="" /> }</div>
                            <div className="desc-lot-rewards-pass">{ showcaseReward.name }</div>
                        </div> }
                </div>
                <div className="tracks-rewards-pass">
                    <div className="tracks-grid-rewards-pass">
                        { state.levels.map(level =>
                        {
                            const freeDone = level.level <= state.freeClaimed;
                            const vipDone = state.isVip && (level.level <= state.vipClaimed);
                            const reached = level.level <= state.level;
                            const current = level.level === nextLevel;
                            const classes = [ 'tracks-col-rewards-pass' ];

                            if(freeDone) classes.push('tracks-col-rewards-pass-obtain-free');
                            if(vipDone) classes.push('tracks-col-rewards-pass-obtain-vip');
                            if(reached && (!freeDone || (state.isVip && !vipDone))) classes.push('is-ready');
                            if(current && !maxed) classes.push('is-current');
                            if(shown && (shown.level === level.level)) classes.push('is-shown');

                            return (
                                <div key={ level.level } ref={ current ? currentRef : null } className={ classes.join(' ') } onClick={ () => setShown(level) }>
                                    <div className="tracks-free-rewards-pass"><TrackImage reward={ level.free } /></div>
                                    <div className="tracks-lvl-rewards-pass"><span className="lvl">{ level.level }</span></div>
                                    <div className={ `tracks-vip-rewards-pass${ state.isVip ? '' : ' tracks-is-locked' }` }>
                                        <TrackImage reward={ level.vip } />
                                        <span className="vip-tag">VIP</span>
                                        { !state.isVip && <span className="habbopass-lock"><i className="icon icon-navigator-room-locked" /></span> }
                                    </div>
                                </div>
                            );
                        }) }
                    </div>
                </div>
                { busy && claiming && <LayoutCenterLoaderView /> }
            </>
        );
    }

    const site = GetConfiguration<string>('url.prefix', '');

    return (
        <NitroCardView uniqueKey="habbopass" className="nitro-habbopass" theme="primary-slim" style={ { width: 690 } }>
            <NitroCardHeaderView headerText="HabboPass" onCloseClick={ close } />
            <NitroCardContentView className="habbopass-content">
                <div className="center-menu-wrapper" role="tablist">
                    <button type="button" role="tab" aria-selected={ tab === 'pass' } className={ `center-menu-items${ (tab === 'pass') ? ' is-active' : '' }` } onClick={ () => setTab('pass') }>
                        <div className="icon-center" style={ { backgroundImage: "image-set(url('https://cdn.habbo.nz/c_images/icons/logo_habbo_icon_30.png?v=1') 1x, url('https://cdn.habbo.nz/c_images/icons/logo_habbo_icon_30@2x.png?v=1') 2x)", backgroundSize: '25px 30px', imageRendering: 'auto' } } />
                        <span>HabboPass</span>
                    </button>
                    <button type="button" role="tab" aria-selected={ tab === 'quests' } className={ `center-menu-items${ (tab === 'quests') ? ' is-active' : '' }` } onClick={ () => setTab('quests') }>
                        <div className="icon-center" style={ { backgroundImage: `url(${ site }/assets/img/rewards/menu/icon_quest.png)` } } />
                        <span>Quests</span>
                    </button>
                </div>
                { (tab === 'pass') && renderPass() }
                { (tab === 'quests') && <div className="habbopass-quests-scroll"><EngagementQuestsPanel /></div> }
            </NitroCardContentView>
        </NitroCardView>
    );
}
