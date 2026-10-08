const ARROW_WALK_KEY = 'hcms.room.arrowwalk';
const listeners: Set<(enabled: boolean) => void> = new Set();

export const IsArrowWalkEnabled = () =>
{
    try
    {
        return (window.localStorage.getItem(ARROW_WALK_KEY) === 'on');
    }
    catch
    {
        return false;
    }
}

export const SetArrowWalkEnabled = (enabled: boolean) =>
{
    try
    {
        window.localStorage.setItem(ARROW_WALK_KEY, (enabled ? 'on' : 'off'));
    }
    catch
    {
        return;
    }
    finally
    {
        listeners.forEach(listener => listener(enabled));
    }
}

export const OnArrowWalkChange = (listener: (enabled: boolean) => void) =>
{
    listeners.add(listener);

    return () => { listeners.delete(listener); };
}
