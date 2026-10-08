// vite.config.js
import react from '@vitejs/plugin-react';
import { createReadStream, existsSync, statSync } from 'fs';
import { extname, resolve, sep } from 'path';
import { defineConfig } from 'vite';

const MIME_TYPES = {
    '.gif': 'image/gif',
    '.json': 'application/json; charset=utf-8',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp'
};

const mountAssetRoot = (server, route, configuredRoot, label) =>
{
    const assetRoot = resolve(configuredRoot);
    const rootPrefix = `${ assetRoot }${ sep }`;

    server.middlewares.use(route, (request, response, next) =>
    {
        let relativePath = '';

        try
        {
            relativePath = decodeURIComponent((request.url || '/').split('?')[0]).replace(/^\/+/, '');
        }
        catch
        {
            response.statusCode = 400;
            response.end('Invalid asset path.');
            return;
        }

        const requestedPath = resolve(assetRoot, relativePath);

        if(requestedPath !== assetRoot && !requestedPath.startsWith(rootPrefix))
        {
            response.statusCode = 403;
            response.end('Asset path is outside the configured root.');
            return;
        }

        if(!existsSync(requestedPath) || !statSync(requestedPath).isFile())
        {
            next();
            return;
        }

        response.setHeader('Content-Type', MIME_TYPES[extname(requestedPath).toLowerCase()] || 'application/octet-stream');
        response.setHeader('Cache-Control', 'no-cache');
        createReadStream(requestedPath).pipe(response);
    });

    server.config.logger.info(`[Clove] ${ label }: ${ assetRoot }`);
};

const cloveAssetBridge = () => ({
    name: 'clove-nitro-assets',
    apply: 'serve',
    configureServer(server)
    {
        mountAssetRoot(server, '/__clove-assets', process.env.CLOVE_NITRO_ASSETS || resolve(__dirname, '..', 'nitro-assets'), 'nitro-assets');
        mountAssetRoot(server, '/__clove-decompile', process.env.CLOVE_ASSET_ROOT || 'C:\\Users\\steet\\Desktop\\DecompiledHabbo\\scripts\\_assets', 'decompiled UI assets');
    }
});

const SANDBOX_CLIENT = 'C:/inetpub/wwwroot/hcms-sandbox/public/cdn/client';

const sandboxConfigs = mode => ({
    name: 'hcms-sandbox-configs',
    apply: 'serve',
    configureServer(server)
    {
        if(mode !== 'sandbox') return;

        for(const name of [ 'renderer-config.json', 'ui-config.json' ])
        {
            server.middlewares.use(`/${ name }`, (request, response) =>
            {
                response.setHeader('Content-Type', 'application/json');
                response.setHeader('Cache-Control', 'no-store');
                createReadStream(`${ SANDBOX_CLIENT }/${ name }`).pipe(response);
            });
        }

        server.config.logger.info(`[sandbox] configs from ${ SANDBOX_CLIENT }`);
    },
    transformIndexHtml(html)
    {
        if(mode !== 'sandbox') return html;

        return html.replace('<head>', '<head><meta name="referrer" content="no-referrer">');
    }
});

export default defineConfig(({ command, mode }) => ({
    base: command === 'serve' ? '/' : './',
    plugins: [ react(), cloveAssetBridge(), sandboxConfigs(mode) ],
    server: { watch: { ignored: [ '**/dist/**' ] } },
    esbuild: command === 'build' ? { drop: [ 'debugger' ], pure: [ 'console.log', 'console.debug', 'console.info', 'console.trace' ], legalComments: 'none' } : {},
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
            '~': resolve(__dirname, 'node_modules'),
            'node:fs/promises': resolve(__dirname, 'src/truffle/browserFsPromises.ts')
        }
    },
    build: {
        assetsInlineLimit: 102400,
        manifest: true,
        sourcemap: false,
        rollupOptions: {
            output: {
                assetFileNames: asset => (asset.name && asset.name.endsWith('.css') ? 'src/assets/[name]-[hash].[ext]' : 'src/assets/[name].[ext]'),
                chunkFileNames: chunk => ([ 'vendor', 'nitro-renderer' ].includes(chunk.name) ? 'assets/[name]-[hash].js' : 'assets/c-[hash].js'),
                manualChunks: id =>
                {
                    if(id.includes('node_modules'))
                    {
                        if(id.includes('@nitrots/nitro-renderer')) return 'nitro-renderer';

                        return 'vendor';
                    }
                }
            }
        }
    }
}))
