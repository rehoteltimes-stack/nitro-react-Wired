import { IgnoredUsersEvent, IgnoreResultEvent } from '@nitrots/nitro-renderer';
import { useState } from 'react';
import { useBetween } from 'use-between';
import { GetSessionDataManager } from '../../api';
import { useMessageEvent } from '../events';

// IgnoredUsersManager (@nitrots/nitro-renderer) tracks its own list internally but only exposes isIgnored(name)
// membership checks, no getter for the whole list - so this hook keeps its own local copy, updated from the same two
// real events the manager itself listens to. Result codes read straight from IgnoredUsersManager's own
// onIgnoreResultEvent (our real logic reference): 0 = no-op/failure, 1 = ignored, 2 = ignored + list was full (server
// evicted the oldest entry), 3 = unignored.
const useIgnoredUsersState = () =>
{
    const [ ignoredUsers, setIgnoredUsers ] = useState<string[]>([]);

    useMessageEvent<IgnoredUsersEvent>(IgnoredUsersEvent, event =>
    {
        const parser = event.getParser();

        setIgnoredUsers(parser.ignoredUsers ?? []);
    });

    useMessageEvent<IgnoreResultEvent>(IgnoreResultEvent, event =>
    {
        const parser = event.getParser();
        const name = parser.name;

        switch(parser.result)
        {
            case 1:
                setIgnoredUsers(previousValue => previousValue.includes(name) ? previousValue : [ ...previousValue, name ]);
                return;
            case 2:
                setIgnoredUsers(previousValue => [ ...previousValue.slice(1), name ]);
                return;
            case 3:
                setIgnoredUsers(previousValue => previousValue.filter(existing => (existing !== name)));
                return;
        }
    });

    // the initial list arrives on its own: SessionDataManager requests it once, right after session init.
    const ignoreUser = (name: string) => GetSessionDataManager().ignoreUser(name);
    const unignoreUser = (name: string) => GetSessionDataManager().unignoreUser(name);

    return { ignoredUsers, ignoreUser, unignoreUser };
}

export const useIgnoredUsers = () => useBetween(useIgnoredUsersState);
