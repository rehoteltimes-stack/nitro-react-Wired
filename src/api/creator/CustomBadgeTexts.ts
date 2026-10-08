import { GetConfiguration } from '../nitro/GetConfiguration';

const PREFIX = /^NZC\d+$/;
let texts: Record<string, [ string, string ]> = {};
let loading = false;
let loadedAt = 0;

const REFRESH_MS = 60000;

const load = () =>
{
    if(loading || ((Date.now() - loadedAt) < REFRESH_MS)) return;

    loading = true;

    fetch(`${ GetConfiguration<string>('url.prefix', '') || '' }/api/custom-badges`, { credentials: 'omit' })
        .then(response => (response.ok ? response.json() : {}))
        .then((result: Record<string, [ string, string ]>) => (texts = result || {}))
        .catch(() => null)
        .finally(() =>
        {
            loading = false;
            loadedAt = Date.now();
        });
}

export const IsCustomBadge = (code: string) => PREFIX.test(code || '');

export const GetCustomBadgeName = (code: string) =>
{
    load();

    return texts[code]?.[0] || 'Custom badge';
}

export const GetCustomBadgeDescription = (code: string) =>
{
    load();

    return texts[code]?.[1] || 'Made by its owner in the Creator.';
}
