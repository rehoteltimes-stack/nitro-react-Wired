import { FC, useEffect, useState } from 'react';
import { SendMessageComposer } from '../../api';
import { ILottoLive, LottoLiveBuyComposer, LottoLiveEvent, RegisterLottoLiveMessages } from '../../api/games/LottoLiveProtocol';
import { LayoutCurrencyIcon, LeftPanelPortal } from '../../common';
import { useMessageEvent } from '../../hooks';

const clock = (seconds: number) => `${ Math.floor(Math.max(0, seconds) / 60) }:${ String(Math.max(0, seconds) % 60).padStart(2, '0') }`;

export const LottoLiveView: FC<{}> = props =>
{
    RegisterLottoLiveMessages();

    const [ live, setLive ] = useState<ILottoLive>(null);
    const [ left, setLeft ] = useState(0);
    const [ open, setOpen ] = useState(true);

    useMessageEvent<LottoLiveEvent>(LottoLiveEvent, event =>
    {
        const next = event.getParser().live;

        setLive(next);
        setLeft(next ? next.secondsLeft : 0);
    });

    useEffect(() =>
    {
        if(!live) return;

        const interval = setInterval(() => setLeft(value => Math.max(0, value - 1)), 1000);

        return () => clearInterval(interval);
    }, [ live ]);

    if(!live) return null;

    const percent = Math.max(0, Math.min(100, (left / live.windowSeconds) * 100));

    return (
        <LeftPanelPortal>
            <div className="lotto-live">
                <div className="lotto-live-header" onClick={ () => setOpen(value => !value) }>
                    <span className="lotto-live-dot" />
                    <span className="lotto-live-title">Live Lotto</span>
                    <span className="lotto-live-players" title="Players">{ live.players }</span>
                    <span className="lotto-live-toggle">{ open ? '–' : '+' }</span>
                </div>
                { open &&
                    <div className="lotto-live-content">
                        <div className="lotto-live-prizes">
                            <div className="lotto-live-prize">
                                { (live.prizeCurrency >= 0)
                                    ? <><LayoutCurrencyIcon type={ live.prizeCurrency } /><span>{ live.prizeAmount.toLocaleString() }</span></>
                                    : <span>{ live.prizeLabel }</span> }
                            </div>
                            { (live.bonusDiamonds > 0) &&
                                <div className="lotto-live-prize is-bonus"><LayoutCurrencyIcon type={ 5 } /><span>+{ live.bonusDiamonds }</span></div> }
                        </div>
                        <div className="lotto-live-bar"><div style={ { width: `${ percent }%` } } /><span>{ clock(left) }</span></div>
                        <div className="lotto-live-footer">
                            <span className="lotto-live-mine">{ live.tickets } tickets · you { live.yours }</span>
                            <button type="button" className="lotto-live-buy" onClick={ () => SendMessageComposer(new LottoLiveBuyComposer(1)) }>+1 <LayoutCurrencyIcon type={ live.priceCurrency } />{ live.price }</button>
                            <button type="button" className="lotto-live-buy" onClick={ () => SendMessageComposer(new LottoLiveBuyComposer(5)) }>+5</button>
                        </div>
                    </div> }
            </div>
        </LeftPanelPortal>
    );
}
