import { useCallback, useEffect, useRef, useState } from 'react';
import { useBetween } from 'use-between';
import { IUsernameIdentity, RegisterUserIdentityMessages, SendMessageComposer, UserIdentityDataEvent, UserIdentityRequestComposer } from '../../api';
import { useMessageEvent } from '../events';

const NONE: IUsernameIdentity = { staffColor: '', staffBackground: '', isVip: false };
const BATCH_MS = 60;
const MAX_BATCH = 50;

// One shared cache of every player's name style (rank colour / gif / VIP), filled by batched requests to the plugin.
const useUserIdentitiesState = () =>
{
    // Registered in the body, before useMessageEvent subscribes, so the reply's header is already known.
    RegisterUserIdentityMessages();

    const [ identities, setIdentities ] = useState<Map<number, IUsernameIdentity>>(new Map());
    const requested = useRef<Set<number>>(new Set());
    const queue = useRef<Set<number>>(new Set());
    const timer = useRef<ReturnType<typeof setTimeout>>(null);

    useMessageEvent<UserIdentityDataEvent>(UserIdentityDataEvent, event =>
    {
        const parser = event.getParser();

        setIdentities(previous =>
        {
            const next = new Map(previous);

            parser.identities.forEach((identity, userId) => next.set(userId, identity));

            return next;
        });
    });

    const request = useCallback((userId: number) =>
    {
        if(!(userId > 0) || requested.current.has(userId)) return;

        requested.current.add(userId);
        queue.current.add(userId);

        if(timer.current) return;

        timer.current = setTimeout(() =>
        {
            timer.current = null;

            const ids = Array.from(queue.current);

            queue.current.clear();

            for(let i = 0; i < ids.length; i += MAX_BATCH) SendMessageComposer(new UserIdentityRequestComposer(ids.slice(i, i + MAX_BATCH)));
        }, BATCH_MS);
    }, []);

    return { identities, request };
}

const useSharedUserIdentities = () => useBetween(useUserIdentitiesState);

/** The name style of one player; empty (normal text) until the plugin has answered, or when the player has none. */
export const useUserIdentity = (userId: number): IUsernameIdentity =>
{
    const { identities, request } = useSharedUserIdentities();

    useEffect(() =>
    {
        request(userId);
    }, [ userId, request ]);

    return identities.get(userId) ?? NONE;
}
