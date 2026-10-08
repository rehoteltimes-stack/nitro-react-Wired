import { GetTicker, NitroConfiguration } from '@nitrots/nitro-renderer';

const FPS_KEY = 'hcms.performance.fps';
const ANIMATION_KEY = 'hcms.performance.animationfps';

export const FPS_OPTIONS = [ 15, 24, 30, 60, 0 ];
export const ANIMATION_OPTIONS = [ 12, 24 ];
export const DEFAULT_FPS = 60;
export const DEFAULT_ANIMATION_FPS = 24;

const read = (key: string, fallback: number, allowed: number[]) =>
{
    try
    {
        const raw = window.localStorage.getItem(key);
        const value = (raw === null) ? NaN : parseInt(raw, 10);

        return allowed.includes(value) ? value : fallback;
    }
    catch
    {
        return fallback;
    }
};

const write = (key: string, value: number) =>
{
    try
    {
        window.localStorage.setItem(key, String(value));
    }
    catch
    {
        return;
    }
};

export const GetFpsLimit = () => read(FPS_KEY, DEFAULT_FPS, FPS_OPTIONS);

export const GetAnimationFps = () => read(ANIMATION_KEY, DEFAULT_ANIMATION_FPS, ANIMATION_OPTIONS);

export const ApplyFpsLimit = () =>
{
    const ticker = GetTicker();

    if(ticker) ticker.maxFPS = GetFpsLimit();
};

export const ApplyAnimationFps = () => NitroConfiguration.setValue('system.fps.animation', GetAnimationFps());

export const ApplyPerformanceSettings = () =>
{
    ApplyFpsLimit();
    ApplyAnimationFps();
};

export const SetFpsLimit = (value: number) =>
{
    write(FPS_KEY, value);
    ApplyFpsLimit();
};

export const SetAnimationFps = (value: number) =>
{
    write(ANIMATION_KEY, value);
    ApplyAnimationFps();
};
