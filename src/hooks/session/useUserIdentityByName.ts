import { useCallback, useEffect, useRef, useState } from 'react';
import { useBetween } from 'use-between';
import { INamedIdentity, RegisterUserIdentityMessages, SendMessageComposer, UserIdentityByNameDataEvent, UserIdentityByNameRequestComposer } from '../../api';
import { useMessageEvent } from '../events';

const NONE: INamedIdentity = { webId: 0, identity: { staffColor: '', staffBackground: '', isVip: false } };
const BATCH_MS = 60;
const MAX_BATCH = 50;

// Resolves a username's real rank/VIP style (and its real webId) hotel-wide, the same data source as the profile
// card - unlike a room-local userDataManager lookup, this works for a mentioned player who isn't a co-occupant of
// the sender's own room, online or not.
const useUserIdentityByNameState = () =>
{
    RegisterUserIdentityMessages();

    const [ identities, setIdentities ] = useState<Map<string, INamedIdentity>>(new Map());
    const requested = useRef<Set<string>>(new Set());
    const queue = useRef<Set<string>>(new Set());
    const timer = useRef<ReturnType<typeof setTimeout>>(null);

    useMessageEvent<UserIdentityByNameDataEvent>(UserIdentityByNameDataEvent, event =>
    {
        const parser = event.getParser();

        setIdentities(previous =>
        {
            const next = new Map(previous);

            parser.identities.forEach((identity, name) => next.set(name, identity));

            return next;
        });
    });

    const request = useCallback((name: string) =>
    {
        const key = (name ?? '').trim().toLowerCase();

        if(!key.length || requested.current.has(key)) return;

        requested.current.add(key);
        queue.current.add(key);

        if(timer.current) return;

        timer.current = setTimeout(() =>
        {
            timer.current = null;

            const names = Array.from(queue.current);

            queue.current.clear();

            for(let i = 0; i < names.length; i += MAX_BATCH) SendMessageComposer(new UserIdentityByNameRequestComposer(names.slice(i, i + MAX_BATCH)));
        }, BATCH_MS);
    }, []);

    return { identities, request };
}

const useSharedUserIdentityByName = () => useBetween(useUserIdentityByNameState);

export const useUserIdentityByName = (name: string): INamedIdentity =>
{
    const { identities, request } = useSharedUserIdentityByName();
    const key = (name ?? '').trim().toLowerCase();

    useEffect(() =>
    {
        request(key);
    }, [ key, request ]);

    return identities.get(key) ?? NONE;
}
