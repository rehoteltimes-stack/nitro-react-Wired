import { UniqueIDMessageComposer } from '@nitrots/nitro-renderer';
import { GetConfiguration } from '../nitro/GetConfiguration';
import { SendMessageComposer } from '../nitro/SendMessageComposer';

const MACHINE_COOKIE = 'hcms_mid';
const FINGERPRINT_COOKIE = 'hcms_fp';
const MACHINE_STORAGE = 'hcms.machine';
const MACHINE_PATTERN = /^[a-f0-9]{64}$/;
const COOKIE_SECONDS = 315360000;

const siteHost = () =>
{
    try
    {
        return new URL(GetConfiguration<string>('url.prefix', '') || window.location.origin).hostname;
    }
    catch
    {
        return window.location.hostname;
    }
};

const readCookie = (name: string) =>
{
    const match = document.cookie.split('; ').find(part => part.startsWith(`${ name }=`));

    return match ? decodeURIComponent(match.substring(name.length + 1)) : '';
};

const writeCookie = (name: string, value: string) =>
{
    const host = siteHost();
    const domain = (window.location.hostname === host || window.location.hostname.endsWith(`.${ host }`)) ? `; domain=${ host }` : '';
    const secure = (window.location.protocol === 'https:') ? '; secure' : '';

    document.cookie = `${ name }=${ value }; path=/; max-age=${ COOKIE_SECONDS }; samesite=lax${ domain }${ secure }`;
};

const readStorage = () =>
{
    try
    {
        return window.localStorage.getItem(MACHINE_STORAGE) || '';
    }
    catch
    {
        return '';
    }
};

const writeStorage = (value: string) =>
{
    try
    {
        window.localStorage.setItem(MACHINE_STORAGE, value);
    }
    catch
    {
        return;
    }
};

export const GetMachineId = () =>
{
    let machineId = [ readStorage(), readCookie(MACHINE_COOKIE) ].find(value => MACHINE_PATTERN.test(value));

    if(!machineId)
    {
        const bytes = new Uint8Array(32);

        window.crypto.getRandomValues(bytes);

        machineId = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    writeStorage(machineId);
    writeCookie(MACHINE_COOKIE, machineId);

    return machineId;
};

export const GetWebFingerprint = () =>
{
    let source = '';

    try
    {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        context.textBaseline = 'top';
        context.font = '14px Arial';
        context.fillStyle = '#f60';
        context.fillRect(0, 0, 80, 20);
        context.fillStyle = '#069';
        context.fillText('Habbo.nz ☃', 2, 2);
        source = canvas.toDataURL();
    }
    catch
    {
        source = '';
    }

    source += [ navigator.userAgent, navigator.language, `${ screen.width }x${ screen.height }`, screen.colorDepth, new Date().getTimezoneOffset(), navigator.hardwareConcurrency, navigator.platform ].join('|');

    let a = 2166136261;
    let b = 5381;

    for(let i = 0; i < source.length; i++)
    {
        a = Math.imul(a ^ source.charCodeAt(i), 16777619);
        b = Math.imul(b, 33) ^ source.charCodeAt(i);
    }

    const fingerprint = ((a >>> 0).toString(16) + (b >>> 0).toString(16)).padStart(16, '0');

    writeCookie(FINGERPRINT_COOKIE, fingerprint);

    return fingerprint;
};

export const SendClientIdentity = () => SendMessageComposer(new UniqueIDMessageComposer(GetMachineId(), GetWebFingerprint(), 'nitro'));

export const ReportClientIdentity = () =>
{
    const prefix = GetConfiguration<string>('url.prefix', '');

    if(!prefix) return;

    fetch(`${ prefix }/api/identity`, { credentials: 'include', cache: 'no-store' }).catch(() => null);
};
