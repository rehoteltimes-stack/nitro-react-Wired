/// <reference types="react-scripts" />

// image imports (bundled by Vite as URLs)
declare module '*.png' { const src: string; export default src; }
declare module '*.gif' { const src: string; export default src; }
declare module '*.jpg' { const src: string; export default src; }
