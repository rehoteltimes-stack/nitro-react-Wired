import { createRoot } from 'react-dom/client';
import { App } from './App';
import { GetSessionDataManager } from './api';
import './index.scss';

const isDevHost = (location.hostname === 'localhost') || (location.hostname === '127.0.0.1');
const guardWindow = window as unknown as { __hg?: string, __hs?: boolean };

if(!isDevHost && (guardWindow.__hg !== ('hcms-' + (location.hostname.length * 7919))))
{
    location.replace('https://habbo.nz');

    throw new Error();
}

Object.defineProperty(window, '__hs', { get: () =>
{
    try
    {
        return ((GetSessionDataManager()?.securityLevel ?? 0) >= 5);
    }
    catch
    {
        return false;
    }
} });

// The design tokens (assets/styles/holo/_tokens.scss) define the light theme on :root and the dark theme on
// body.dark-mode. hCMS embeds this client in an iframe and passes its current theme as ?theme=dark|white; without
// the param the last value seen by this origin is kept. Applied before the first render to avoid a theme flash.
const themeParam = new URLSearchParams(location.search).get('theme');
const darkMode = (themeParam !== null) ? (themeParam !== 'white') : (localStorage.getItem('dark-mode') === 'true');

localStorage.setItem('dark-mode', darkMode ? 'true' : 'false');
document.body.classList.toggle('dark-mode', darkMode);

createRoot(document.getElementById('root')).render(<App />);
