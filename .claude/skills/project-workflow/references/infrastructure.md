# Infrastructure: Cloudflare, DNS, CDN, cache, SSL, WebSocket

Verified 2026-10-01 unless marked. Re-check with `hcms:cloudflare` (below) before relying on it.

## What exists
- Cloudflare account `c91ea6410e1456527b9c42d9efdc92fb` (the user's), zone **habbo.nz** `59a1ede7403b27d9db26aff7a066a179`,
  Free plan, nameservers `dell` / `mario.ns.cloudflare.com`. No `cloudflared` tunnel runs (`C:/tools/cloudflared/` has
  only the exe).
- DNS: `habbo.nz`, `www`, `dev`, `play`, `cdn`, `ws` are all **A records, proxied, TTL auto, one origin IP** (this
  server). Nothing else in the zone.
- Zone settings: SSL **flexible** (Cloudflare → origin over HTTP), always_use_https off, min TLS 1.0, TLS 1.3 on,
  websockets on, cache_level aggressive, browser_cache_ttl 14400, security_level medium, http3 on, development_mode off.
- **img.habbo.nz** (own avatar imager, `hcms-imager/CLAUDE.md`): IIS site HCMS-IMG → PHP → node 127.0.0.1:3030, task
  `hcms-imager`. **No DNS record yet** (2026-10-01): the user adds an A record `img` → the same origin IP, proxied.
- `ws.habbo.nz:8443` = the emulator's NitroWebsockets endpoint, proxied through Cloudflare (8443 is a Cloudflare-proxied
  HTTPS port). How it reaches the origin under "flexible" was not inspected; treat it as working and don't touch it.
- A second, older zone exists for **habbo.ltd** (account token "Habbo.nz API Cache Purge" is scoped to zone
  `0ce9f4b2…`). **`hCMS/.env` has no `HCMS_CDN_URL`, so the website builds image URLs on `https://cdn.habbo.ltd`**
  (config default). New files placed only on our CDN (e.g. furni previews) 404 there. Setting
  `HCMS_CDN_URL=https://cdn.habbo.nz` is the user's call (it changes every image URL on the site).

## Cache facts (what needs a purge)
| URL | Cloudflare | Purge after a change? |
|---|---|---|
| `play.habbo.nz/` (index.html), `renderer-config.json`, `ui-config.json` | DYNAMIC (not cached) | no |
| `play.habbo.nz/assets/index-<hash>.js` | cached (MISS → HIT), 4 h | no: every build has a new name |
| `play.habbo.nz/src/assets/index.css` (the client stylesheet, **fixed name**, not versioned in index.html) | cached, 4 h (Cloudflare + browser) | **yes after a CSS change**: purge that URL (`hcms:cloudflare purge https://play.habbo.nz/src/assets/index.css`), else up to 4 h of old styles (hard refresh shows the new one) |
| `cdn.habbo.nz/gamedata/*.json`, `bundled/**/*.nitro` | DYNAMIC; browsers 7 days | no: bump `?v=` / `&n=` (existing versioning) |
| `cdn.habbo.nz/**/*.png|gif|css|js` | cached (HIT) | **yes**, if the file is replaced at the same URL without a version change |
So a `yarn deploy` needs a purge only when CSS changed (the stylesheet URL). Purge only the exact URLs of overwritten cached files. Never purge the
whole zone.

## API access (the repeatable path)
- Command: `php artisan hcms:cloudflare verify | dns | settings | purge <url...>` (hCMS,
  `app/Console/Commands/Cloudflare.php`, config `services.cloudflare`). It never prints the token; A/AAAA targets are
  shown as "origin". `purge` only takes full URLs on habbo.nz hostnames, 30 per call, no purge-everything.
- Token: env **`CLOUDFLARE_API_TOKEN` in `hCMS/.env`** (git-ignored, the site's existing secret store). Account/zone ids
  have safe defaults in `config/services.php` (`CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_ZONE_ID`, `CLOUDFLARE_ZONE`).
  Never put the token in git, docs, skills, logs, source or chat.
- **Status 2026-10-01: no token configured.** Creating it from Claude was stopped: the dashboard's token API answered a
  scripted request with Cloudflare's own "Attention Required" block (not bypassed), and storing a secret from the
  session was refused by the permission check. The user creates it (procedure below).

### Token procedure (user, in the dashboard)
Manage account → Account API tokens → Create Token → Start from scratch. Name `Habbo.nz automation (server)`.
Resources: **Specific zone → habbo.nz** (not "Entire Account"). Permissions (exact names in the UI, all zone-scoped):
| Read | Write |
|---|---|
| Zone Read, Zone Settings Read, DNS Read, SSL and Certificates Read, Cache Settings Read, Firewall Services Read, Zone WAF Read, Workers Routes Read, Page Rules Read, Analytics Read | DNS Write, Cache Purge |
Client IP filtering: `62.68.75.108` and `2a12:edc0:4:f62::1` (this server's egress, 2026-10-01). Expiry: the user's
choice. Then put `CLOUDFLARE_API_TOKEN=<value>` in `hCMS/.env` and run `php artisan hcms:cloudflare verify`
(prints token status, zone, and that account membership reads are refused).
No settings/SSL/WAF write permissions on purpose: those changes stay dashboard actions with approval.
Existing tokens (names only): two user tokens "Cloudflare Agent…" (2026-08-27, account-wide, another tool) and the
habbo.ltd purge token. Token values can't be read back, so none is reusable here.

## Chrome Debug (dashboard work)
The user's Chrome on port 9222 (`c:/tools/nitro-catalog-copy/scripts/eval-in-iframe.js` style CDP) has the dashboard
logged in. Read-only GETs to the dashboard's own `/api/v4/...` from inside the dashboard tab work (zones, DNS,
settings, token names, permission groups). Writes from a script are blocked by Cloudflare ("Attention Required") —
don't work around it; use the UI or the API token. Never read cookies or storage.

## Boundaries (pre-launch development policy, CLAUDE.md)
Automatic: inspect zone/DNS/SSL/cache/security, verify deploys and public assets, purge exact URLs after a deploy that
overwrote cached files, diagnose. **Approval first** (hotel can go offline or security weakens): deleting or retargeting
DNS, proxy on/off, SSL/TLS mode, WAF/firewall/rate limits, Workers/routes, mass DNS changes, anything touching
`ws.habbo.nz`.

## Procedures
- **New hostname**: check it doesn't exist (`dns`), pick target (same origin A record, proxied unless it's a raw socket),
  create it (DNS Write, after approval if it's public-facing), add the IIS binding, verify HTTPS.
- **"cdn shows old files"**: is the URL versioned (`?v=`/`&n=`)? `curl -I` → `cf-cache-status`; origin file date;
  purge the exact URL only if Cloudflare cached the old copy.
- **"dev/play not loading"**: DNS (`dns`), `curl -I` through Cloudflare, then the IIS site/origin; read Cloudflare
  error codes (52x = origin).
- **"ws.habbo.nz not connecting"**: emulator running + NitroWebsockets in the boot log first, then DNS/proxy/TLS. Don't
  toggle proxying or SSL to "test".
- **Rollback**: DNS → recreate from `dns` output taken before the change; purge can't be undone (harmless).

### Protection settings applied 2026-10-04 (user request, via a one-off Global API Key, removed after use)
Zone habbo.nz (Free plan): Hotlink Protection on (foreign referers get 403 on images, same-zone and empty referers
pass), Always Use HTTPS on, minimum TLS 1.2, rate limiting rule "Habbo.nz flood protection (website + client)":
`http.host in {dev.habbo.nz, play.habbo.nz}`, 300 requests / 10 s per IP + colo, block 10 s (the Free plan allows
one rule). Unchanged on purpose: SSL mode Flexible (IIS origin has no certificate), security level medium, Bot
Fight Mode off (it can challenge the game client and asset requests). Cloudflare's L3/L4 and HTTP DDoS protection
is always on. The user chose to keep the Global API Key for Claude's Cloudflare changes: `CLOUDFLARE_EMAIL` +
`CLOUDFLARE_GLOBAL_API_KEY` in `hCMS/.env` (headers `X-Auth-Email` / `X-Auth-Key`; read them from .env inside the
command, never print them). Full account access: every change still needs the user's approval first.

### CDN caching (2026-10-04, user-approved)
Root cause of "clothes loading lag": cdn.habbo.nz answered `cf-cache-status: DYNAMIC` for everything, because
**Development Mode was on** (it bypasses all caching) and `.nitro` is not cached by default. Every player pulled every
clothing pack (up to 2.5 MB, 12 packs over 1 MB) from the IIS origin; under load one pack took 21 s.
Now: Development Mode off; cache rule "Cache all CDN files (cdn.habbo.nz)" (`http.host eq "cdn.habbo.nz"`, cache on,
edge TTL 7 days, browser TTL = origin); Tiered Cache + Smart Topology on; all figure/effect libraries + figure
gamedata pre-warmed once through Cloudflare. **Replacing a CDN file under the same name now needs a purge**:
`POST /zones/<zone>/purge_cache {"files":["https://cdn.habbo.nz/<path>"]}` with the Global key headers from .env.
Prefer new names or `?v=` for bigger changes. Don't switch Development Mode on for deploys: client files are
hashed or versioned already.

## Update 2026-10-06: global key + development mode
- `hcms:cloudflare` now also works with `CLOUDFLARE_EMAIL` + `CLOUDFLARE_GLOBAL_API_KEY` (used only when
  `CLOUDFLARE_API_TOKEN` is empty; `config/services.php` keys `email`, `global_key`). After editing `.env` or
  `config/services.php`: `php artisan config:cache` (hCMS runs with cached config).
- New action `devmode on|off` (Cloudflare Development Mode: cache bypassed zone-wide for 3 h, then off by itself).
  The user asked for it on 2026-10-06 for client development. Turn it off before launch.
- PHP CLI on this box: `C:/Program Files (x86)/PHP/php-8.5.10/php.exe` (not on PATH).
