import { useCallback, useEffect, useState } from 'react';
import { GetConfiguration } from '../../api';

export interface IFindRetrosVoteState
{
    enabled: boolean;
    url?: string;
    voted?: boolean;
    claimed?: boolean;
    required?: boolean;
    loggedIn?: boolean;
    reward?: { type: number, amount: number };
}

const POPUP_WIDTH = 520;
const POPUP_HEIGHT = 760;

const REASONS: Record<string, string> = {
    not_voted: 'Your vote has not been counted yet. Try again in a moment.',
    claimed: 'You already claimed today\'s vote reward.',
    unavailable: 'Log in on the website again to claim the reward.',
    reward_failed: 'The reward could not be given right now. Try again in a moment.'
};

const endpoint = (path: string) => `${ GetConfiguration<string>('url.prefix', '') || '' }/api/findretros/${ path }`;

export const useFindRetrosVote = () =>
{
    const [ state, setState ] = useState<IFindRetrosVoteState>(null);
    const [ busy, setBusy ] = useState(false);
    const [ message, setMessage ] = useState<string>(null);

    const refresh = useCallback((opened: boolean = false) => fetch(endpoint(opened ? 'status?opened=1' : 'status'), { credentials: 'include', cache: 'no-store' })
        .then(response => (response.ok ? response.json() : null))
        .then((result: IFindRetrosVoteState) => result && setState(result))
        .catch(() => null), []);

    useEffect(() =>
    {
        refresh();
    }, [ refresh ]);

    const vote = useCallback(() =>
    {
        if(!state?.url) return;

        setMessage(null);

        const left = Math.round(window.screenX + Math.max(0, (window.outerWidth - POPUP_WIDTH) / 2));
        const top = Math.round(window.screenY + Math.max(0, (window.outerHeight - POPUP_HEIGHT) / 2));
        const popup = window.open(state.url, 'findretros-vote', `popup=yes,width=${ POPUP_WIDTH },height=${ POPUP_HEIGHT },left=${ left },top=${ top }`);

        if(!popup) return;

        refresh(true);

        const timer = window.setInterval(() =>
        {
            if(!popup.closed) return;

            window.clearInterval(timer);
            refresh();
        }, 1000);
    }, [ state, refresh ]);

    const claim = useCallback(() =>
    {
        setBusy(true);
        setMessage(null);

        fetch(endpoint('claim'), { method: 'POST', credentials: 'include' })
            .then(response => response.json())
            .then((result: { ok: boolean, reason?: string }) =>
            {
                if(!result.ok) setMessage(REASONS[result.reason] || REASONS.reward_failed);

                return refresh();
            })
            .catch(() => setMessage(REASONS.reward_failed))
            .finally(() => setBusy(false));
    }, [ refresh ]);

    const report = useCallback((text: string) => fetch(endpoint('issue'), { method: 'POST', credentials: 'include', headers: { 'Accept': 'application/json' }, body: new URLSearchParams({ message: text }) })
        .then(response => response.json())
        .then((result: { ok: boolean, message: string }) => result)
        .catch(() => ({ ok: false, message: 'The server could not be reached. Please try again.' })), []);

    return { state, busy, message, vote, claim, refresh, report };
};
