import { CSSProperties, FC, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { GetConfiguration } from '../../api';
import voteIcon from '../../assets/images/engagement/vote.png';
import { Base, Button, Column, Flex, LayoutCurrencyIcon, Text } from '../../common';
import { useFindRetrosVote } from '../engagement/FindRetrosVote';

const POLL_MS = 4000;
const LEAVE_MS = 1600;
const CLAIM_RETRY_MS = 6000;

type Phase = 'waiting' | 'checking' | 'done';

const VOTED_ORIGIN = /^https:\/\/([a-z0-9-]+\.)?habbo\.nz$/;

const CURRENCY_NAMES: Record<number, string> = { 0: 'Credits', 5: 'Diamonds', 101: 'Emeralds' };

export const ForceVoteView: FC<{}> = props =>
{
    const { state, busy, vote, claim, refresh, report } = useFindRetrosVote();
    const [ visible, setVisible ] = useState(false);
    const [ phase, setPhase ] = useState<Phase>('waiting');
    const [ issueOpen, setIssueOpen ] = useState(false);
    const [ issueText, setIssueText ] = useState('');
    const [ issueResult, setIssueResult ] = useState<{ ok: boolean, message: string }>(null);
    const [ issueBusy, setIssueBusy ] = useState(false);
    const lastClaim = useRef(0);

    useEffect(() =>
    {
        if(state?.required) setVisible(true);
    }, [ state?.required ]);

    useEffect(() =>
    {
        if(!visible || phase === 'done') return;

        const interval = window.setInterval(() => refresh(), POLL_MS);
        const onFocus = () => refresh();
        const onMessage = (event: MessageEvent) =>
        {
            if(!VOTED_ORIGIN.test(event.origin) || event.data?.type !== 'hcms:voted') return;

            setPhase('checking');
            refresh();
        };

        window.addEventListener('focus', onFocus);
        window.addEventListener('message', onMessage);

        return () =>
        {
            window.clearInterval(interval);
            window.removeEventListener('focus', onFocus);
            window.removeEventListener('message', onMessage);
        };
    }, [ visible, phase, refresh ]);

    useEffect(() =>
    {
        if(!visible || !state) return;

        if(!state.required || state.claimed)
        {
            setPhase('done');

            const timeout = window.setTimeout(() => setVisible(false), LEAVE_MS);

            return () => window.clearTimeout(timeout);
        }

        if(state.voted && !busy && ((Date.now() - lastClaim.current) > CLAIM_RETRY_MS))
        {
            lastClaim.current = Date.now();
            setPhase('checking');
            claim();

            return;
        }

        if(!state.voted && phase === 'checking') setPhase('waiting');
    }, [ visible, state, busy, claim, phase ]);

    if(!visible || !state) return null;

    const container = document.getElementById('draggable-windows-container');

    if(!container) return null;

    const reward = state.reward;
    const rewardName = CURRENCY_NAMES[reward?.type] ?? 'Credits';
    const stateText = (phase === 'done') ? `Thanks for voting! You got ${ reward?.amount ?? 0 } ${ rewardName }.` : (phase === 'checking') ? 'Checking for your vote' : 'Waiting for your vote';
    const loaderStyle = { '--force-vote-loader': `url(${ GetConfiguration<string>('url.prefix', '') || '' }/assets/img/loader/logo_loader_black.png)` } as CSSProperties;

    const openVote = () =>
    {
        setPhase('checking');
        vote();
    }

    const sendIssue = () =>
    {
        setIssueBusy(true);
        setIssueResult(null);

        report(issueText.trim()).then(result =>
        {
            setIssueResult(result);
            setIssueBusy(false);

            if(result.ok) setIssueText('');
        });
    }

    return createPortal(
        <div className={ 'nitro-force-vote' + ((phase === 'done') ? ' is-leaving' : '') }>
            <Base className="nitro-notification-bubble rounded engagement-today is-collapsed force-vote-panel">
                <Column gap={ 2 }>
                    <Flex alignItems="center" justifyContent="between" gap={ 1 }>
                        <Text bold variant="white" className="engagement-today-title">Vote to play</Text>
                        <span className="engagement-today-vip">Daily</span>
                    </Flex>
                    <Text small className="force-vote-text">One quick vote on FindRetros helps new players find the hotel. It takes a few seconds, once a day.</Text>
                    { reward &&
                        <Flex alignItems="center" gap={ 1 } className="engagement-today-tile is-ready">
                            <span className="engagement-today-icon is-small"><span className="engagement-icon-box" style={ { width: 26, height: 26 } }><img src={ voteIcon } alt="" className="engagement-icon" /></span></span>
                            <Column gap={ 0 } className="engagement-today-text">
                                <span className="engagement-today-tile-label">Reward for every daily vote</span>
                                <Flex alignItems="center" gap={ 1 } className="engagement-today-tile-value">{ reward.amount } { rewardName } <LayoutCurrencyIcon type={ reward.type } /></Flex>
                            </Column>
                        </Flex> }
                    <Button variant="success" fullWidth disabled={ phase === 'done' } onClick={ openVote }>Vote for Habbo.nz</Button>
                    <div className={ 'force-vote-loader is-' + phase } style={ loaderStyle }>
                        <span className="force-vote-spinner" />
                        <span className="force-vote-state">{ stateText }</span>
                    </div>
                    { (phase !== 'done') &&
                        <>
                            <div className="force-vote-issue-link" onClick={ () => setIssueOpen(!issueOpen) }>Issues with voting?</div>
                            { issueOpen &&
                                <div className="force-vote-issue">
                                    <textarea maxLength={ 500 } rows={ 3 } placeholder="Tell us what goes wrong when you vote" value={ issueText } disabled={ issueResult?.ok } onChange={ event => setIssueText(event.target.value) } />
                                    { issueResult && <div className={ 'force-vote-issue-result' + (issueResult.ok ? ' is-ok' : '') }>{ issueResult.message }</div> }
                                    { !issueResult?.ok && <Button variant="warning" fullWidth disabled={ issueBusy || (issueText.trim().length < 5) } onClick={ sendIssue }>Send report</Button> }
                                </div> }
                        </> }
                </Column>
            </Base>
        </div>, container);
}
