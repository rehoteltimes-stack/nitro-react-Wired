import { createRoot } from 'react-dom/client';
import { App } from './App';
import './index.scss';

// The design tokens (assets/styles/holo/_tokens.scss) define the light theme on :root and the dark theme on
// body.dark-mode. hCMS embeds this client in an iframe and passes its current theme as ?theme=dark|white; without
// the param the last value seen by this origin is kept. Applied before the first render to avoid a theme flash.
const themeParam = new URLSearchParams(location.search).get('theme');
const darkMode = (themeParam !== null) ? (themeParam !== 'white') : (localStorage.getItem('dark-mode') === 'true');

localStorage.setItem('dark-mode', darkMode ? 'true' : 'false');
document.body.classList.toggle('dark-mode', darkMode);

createRoot(document.getElementById('root')).render(<App />);
