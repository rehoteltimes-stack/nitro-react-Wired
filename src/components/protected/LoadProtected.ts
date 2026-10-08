import { ComponentType, FC, lazy, useEffect, useState } from 'react';

const Empty: FC<{}> = () => null;

let currentLevel = import.meta.env.DEV ? 99 : 0;

const listeners = new Set<(level: number) => void>();

let protectedReady = false;

const readyListeners = new Set<(ready: boolean) => void>();

export const SetProtectedReady = () =>
{
    protectedReady = true;

    readyListeners.forEach(listener => listener(true));
}

export const useProtectedReady = () =>
{
    const [ ready, setReady ] = useState(protectedReady);

    useEffect(() =>
    {
        readyListeners.add(setReady);
        setReady(protectedReady);

        return () =>
        {
            readyListeners.delete(setReady);
        };
    }, []);

    return ready;
}

let failureListener: () => void = null;
let failed = false;
let reported = false;

const notifyFailure = () =>
{
    if(!failed || reported || !failureListener) return;

    reported = true;
    failureListener();
}

export const SetProtectedFailureListener = (listener: () => void) =>
{
    failureListener = listener;

    notifyFailure();
}

const reportFailure = () =>
{
    failed = true;

    notifyFailure();
}

export const SetChunkLevel = (level: number) =>
{
    currentLevel = level;

    listeners.forEach(listener => listener(level));
}

export const useChunkLevel = () =>
{
    const [ level, setLevel ] = useState(currentLevel);

    useEffect(() =>
    {
        listeners.add(setLevel);
        setLevel(currentLevel);

        return () =>
        {
            listeners.delete(setLevel);
        };
    }, []);

    return level;
}

export const LoadProtected = <P extends object>(factory: () => Promise<ComponentType<P>>) =>
{
    let promise: Promise<{ default: ComponentType<P> }> = null;

    const start = () => (promise ??= factory().then(component => ({ default: component })).catch(() =>
    {
        reportFailure();

        return { default: Empty as ComponentType<P> };
    }));

    return Object.assign(lazy(start), { preload: start });
}
