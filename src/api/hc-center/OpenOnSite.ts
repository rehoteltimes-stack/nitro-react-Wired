import { GetConfiguration } from '../nitro';

export const OpenOnSite = (path: string) =>
{
    const prefix = GetConfiguration<string>('url.prefix', '') || '';

    if(window.parent !== window)
    {
        window.parent.postMessage({ type: 'hcms:navigate', path }, '*');

        return;
    }

    window.open(prefix + path, '_blank');
}
