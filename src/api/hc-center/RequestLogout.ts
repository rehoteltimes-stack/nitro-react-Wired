import { GetConfiguration } from '../nitro';

export const RequestLogout = () =>
{
    if(window.parent !== window)
    {
        window.parent.postMessage({ type: 'hcms:logout' }, '*');

        return;
    }

    window.location.href = (GetConfiguration<string>('url.prefix', '') || '') + '/';
}
