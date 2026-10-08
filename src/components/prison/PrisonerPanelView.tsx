import { FC, useEffect, useState } from 'react';
import { SendMessageComposer } from '../../api';
import { IPrisonerStatus, PrisonerBailComposer, PrisonerStatusEvent, RegisterPrisonerMessages } from '../../api/prison/PrisonerProtocol';
import { LayoutCurrencyIcon } from '../../common';
import { useMessageEvent } from '../../hooks';
import { StaffToolsIconUrl } from '../room/widgets/chat/ChatWidgetMessageView';

const clock = (seconds: number) =>
{
    const total = Math.max(0, seconds);
    const hours = Math.floor(total / 3600);
    const minutes = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
    const rest = String(total % 60).padStart(2, '0');

    return hours > 0 ? `${ hours }:${ minutes }:${ rest }` : `${ minutes }:${ rest }`;
}

export const PrisonerPanelView: FC<{}> = props =>
{
    RegisterPrisonerMessages();

    const [ status, setStatus ] = useState<IPrisonerStatus>(null);
    const [ left, setLeft ] = useState(0);
    const [ confirming, setConfirming ] = useState(false);

    useMessageEvent<PrisonerStatusEvent>(PrisonerStatusEvent, event =>
    {
        const next = event.getParser().status;

        setStatus(next);
        setLeft(next ? next.secondsLeft : 0);
        setConfirming(false);
    });

    useEffect(() =>
    {
        if(!status) return;

        const interval = setInterval(() => setLeft(value => Math.max(0, value - 1)), 1000);

        return () => clearInterval(interval);
    }, [ status ]);

    useEffect(() =>
    {
        if(!confirming) return;

        const timeout = setTimeout(() => setConfirming(false), 4000);

        return () => clearTimeout(timeout);
    }, [ confirming ]);

    if(!status) return null;

    const percent = status.secondsTotal > 0 ? Math.max(0, Math.min(100, (1 - (left / status.secondsTotal)) * 100)) : 0;
    const price = Math.max(1, Math.ceil(left / 60)) * (status.bailPrice / Math.max(1, Math.ceil(status.secondsLeft / 60)));

    const bail = () =>
    {
        if(!confirming) return setConfirming(true);

        setConfirming(false);
        SendMessageComposer(new PrisonerBailComposer());
    }

    return (
        <div className="prisoner-panel">
            <div className="prisoner-panel-indicator" />
            <img className="prisoner-panel-icon" src={ StaffToolsIconUrl('short_prison') } alt="" />
            <div className="prisoner-panel-info">
                <div className="prisoner-panel-title">{ status.prison || 'Prison' }</div>
                <div className="prisoner-panel-text">{ status.reason ? status.reason : 'You are serving your time.' }</div>
                <div className="prisoner-panel-bar"><div style={ { width: `${ percent }%` } } /></div>
            </div>
            <div className="prisoner-panel-side">
                <div className="prisoner-panel-timer">{ clock(left) }</div>
                { status.bail &&
                    <button type="button" className={ `prisoner-panel-bail ${ confirming ? 'is-confirming' : '' }` } onClick={ bail }>
                        { confirming ? 'Sure?' : 'Bail' } { Math.round(price) } <LayoutCurrencyIcon type={ status.bailCurrency } />
                    </button> }
            </div>
        </div>
    );
}
