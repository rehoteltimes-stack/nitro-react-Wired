import { FC, useEffect, useState } from 'react';
import { IRanchQuest } from '../../api/games/RanchProtocol';
import { LayoutCurrencyIcon, LeftPanelPortal } from '../../common';

const clock = (seconds: number) =>
{
    const value = Math.max(0, seconds);
    const hours = Math.floor(value / 3600);
    const minutes = Math.floor((value % 3600) / 60);

    return `${ hours }:${ String(minutes).padStart(2, '0') }:${ String(value % 60).padStart(2, '0') }`;
}

export const RanchQuestView: FC<{ quest: IRanchQuest }> = props =>
{
    const { quest } = props;
    const [ open, setOpen ] = useState(true);
    const [ left, setLeft ] = useState(0);

    useEffect(() =>
    {
        setLeft(quest ? quest.unlockSeconds : 0);

        if(!quest || (quest.unlockSeconds <= 0)) return;

        const interval = setInterval(() => setLeft(value => Math.max(0, value - 1)), 1000);

        return () => clearInterval(interval);
    }, [ quest ]);

    if(!quest || !quest.steps.length) return null;

    const waiting = !quest.finished && (left > 0);
    const current = quest.steps[quest.step - 1];
    const percent = current ? Math.min(100, (Math.min(quest.progress, current.target) / current.target) * 100) : 100;

    return (
        <LeftPanelPortal>
            <div className="lotto-live ranch-quests">
                <div className="lotto-live-header" onClick={ () => setOpen(value => !value) }>
                    <span className="lotto-live-dot" />
                    <span className="lotto-live-title">Ranch Quests</span>
                    <span className="lotto-live-players" title="Day">{ quest.day }/{ quest.dayCount }</span>
                    <span className="lotto-live-toggle">{ open ? '–' : '+' }</span>
                </div>
                { open &&
                    <div className="lotto-live-content">
                        <div className="ranch-quests-day">Day { quest.day } - { quest.title }</div>
                        { waiting && <div className="lotto-live-bar"><div style={ { width: '0%' } } /><span>Next quest in { clock(left) }</span></div> }
                        { quest.finished && <div className="lotto-live-mine">You finished every Sunset Ranch quest!</div> }
                        { !waiting && !quest.finished &&
                            <div className="ranch-quests-steps">
                                { quest.steps.map((step, index) =>
                                {
                                    const number = index + 1;
                                    const status = (number < quest.step) ? 'is-done' : (number === quest.step) ? 'is-current' : 'is-locked';
    
                                    return (
                                        <div key={ number } className={ `ranch-quests-step ${ status }` }>
                                            <span className="ranch-quests-check">{ (number < quest.step) ? '✓' : number }</span>
                                            <span className="ranch-quests-text">{ step.description }</span>
                                            { (number === quest.step) && <span className="ranch-quests-count">{ Math.min(quest.progress, step.target) }/{ step.target }</span> }
                                            { (step.reward > 0) && <span className="ranch-quests-reward"><LayoutCurrencyIcon type={ quest.currencyType } />{ step.reward }</span> }
                                        </div>
                                    );
                                }) }
                            </div> }
                        { !waiting && current && <div className="lotto-live-bar"><div style={ { width: `${ percent }%` } } /><span>{ Math.min(quest.progress, current.target) }/{ current.target }</span></div> }
                    </div> }
            </div>
        </LeftPanelPortal>
    );
}
