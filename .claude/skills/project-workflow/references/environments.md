# Environments: Sandbox → Live

Discovered from IIS, the configs, the DB and the deploy scripts on 2026-10-01. Re-check with
`C:/Windows/System32/inetsrv/appcmd.exe list site` / `list vdir` before relying on this.

## What actually exists today: ONE stack (it is the Live stack)
| Part | Where | Notes |
|---|---|---|
| Website + admin | IIS site `LTDCMS` (bindings `dev.habbo.nz`, `c.habbo.ltd`) → `C:/inetpub/wwwroot/hCMS/public` | `.env`: `APP_ENV=local`, `APP_DEBUG=true`, `APP_URL=https://dev.habbo.nz` |
| Game client | IIS `HCMS-PLAY` (`play.habbo.nz`) → `hCMS/public/cdn/client` | written by `yarn deploy` |
| CDN | IIS `HCMS-CDN` (`cdn.habbo.nz`) → `hCMS/public/cdn` | 7-day browser cache, `?v=` versioning |
| Public front page | IIS `HCMS-SOON` (`habbo.nz`, `www.habbo.nz`) → `C:/inetpub/wwwroot/hcms-soon` (a "coming soon" page) | the hotel isn't public yet |
| Emulator | `C:/inetpub/wwwroot/hcms-emulator-run` (`Habbo.jar` + `plugins/`), game 30010 (moved from 30000 on 2026-10-03 so G-Earth can use 30000 for habbo.com recording; Nitro uses the websocket only), RCON 30001, websocket `wss://ws.habbo.nz:8443` (NitroWebsockets plugin) | one instance |
| Database | MariaDB `hcms` (shared by website + emulator) | 10 accounts (staff/test) on 2026-10-01 |
| Scheduler | Windows task `\hCMS-scheduler` → `hCMS/storage/scheduler.cmd` every minute | |
Other DBs on the server: `ltdhabbo_build_habbocity` (catalog build), `hubblycata`, `habboworld`, `ltdhabbo` (reference
data), `ltdcms`, `test` (empty). Old LTD sites (`LTDCDN`, `LTDSOON`, stopped `LTDWEB`/`LTDTEST`) are separate projects.

**So there is no isolated Sandbox.** The Vite dev server (`yarn start`, localhost:5173) is a client-only preview, but it
connects to the **same** emulator and `hcms` database, so data actions taken from it are real. Treat today's stack as
Live: after launch it serves real players, and even before launch it holds the real economy data.

## Sandbox that exists today (use it as far as it goes)
- Client: Vite dev server + `npx tsc` + the built `dist/` before `yarn deploy`.
- Plugins: `mvn -q package` (artifact in `target/`). The running emulator is Live, so plugin testing happens there,
  only after approval.
- hCMS: `php -l`, `Livewire::test` in tinker (runs against `hcms`: read-only checks are fine, writes are real).
- Catalog: the build DB `ltdhabbo_build_<hotel>` and `stage_*` tables (never live until swapped).
- Data: work on copies (`bak_<date>_*`, `stage_*`, `test` DB) and dry-run SQL files.

## Proper Sandbox (proposed; needs the user's decision and approval, not built)
A copy of the stack on the same server:
- DB `hcms_sandbox` (restored from a dump);
- a second emulator folder (e.g. `hcms-emulator-sandbox`) on other ports with its own `config.ini`;
- an hCMS IIS site (e.g. `sandbox.habbo.nz`) with its own `.env` pointing at `hcms_sandbox`;
- a client build with a sandbox `renderer-config` / `ui-config`.

Until it exists, say so when a "Sandbox test" is really a Live-stack test.

## Change flow
REQUEST → inspect → implement → Sandbox (as far as above) → build → test → QA → review → prepare deployment (artifact,
SQL, rollback) → **explicit approval** → Live deployment → post-deployment verification. Never skip the preparation and
approval steps for meaningful changes.

### Per layer
| Layer | Sandbox steps (automatic) | Live steps (after approval) | Rollback that really exists |
|---|---|---|---|
| Client / CDN | edit → `tsc` → Vite dev check → `yarn build` | `yarn deploy` → bump `?v=` on changed CDN files (repo + deployed configs) → load `play.habbo.nz`, check network/console | none kept by the deploy (robocopy /MIR overwrites `cdn/client`). Rollback = rebuild from git or from a tarball in `C:/inetpub/wwwroot/db-backups/` (e.g. `nitro-ui-before-*.tar.gz`). Make a tarball before risky deploys. |
| Plugins | edit → `mvn -q package` | stop java → copy the jar (keep `<name>.jar.bak-<tag>` in `plugins/`) → `start-emulator.sh` → boot log → test | the previous jar (`*.jar.bak-*`). Plugin schema changes (`ADD COLUMN`/new tables) aren't reversed automatically. |
| hCMS | edit → `php -l` → `Livewire::test` → review migration | runs live from its folder (no deploy step); `php artisan migrate --force` only after approval | `php artisan migrate:rollback` if the migration has a `down()`. Code: git (last commit 2026-09-25; much uncommitted) or the `hcms-code-*.tar.gz` backups |
| Database / economy | dry-run SQL file, counts, backup tables, `Livewire::test`, tamper tests (on copies where possible) | run the SQL after approval, then reload caches (`:update_*`, RCON) and push to online players (`GameNotifier`) | `bak_<date>_*` tables, full dumps `db-backups/hcms-*.sql` (mysqldump before mass changes) |
| Catalog | build DB / `stage_*` / reviewed sync SQL (`catalog-sync.md`) | apply after approval → `:update_items`, `:update_catalogue` / RCON `updatecatalog` → `?v=` bump → buy/place test | `old_<suffix>_*` after a swap (`hcms:catalog-swap --rollback=`); backup tables for additive syncs |
| Config (`emulator_settings`, ui/renderer config) | prepare the values | apply + `:update_config` / full client reload | previous values recorded in the change notes / backup table |
| Scheduled jobs | add as disabled/configurable (a setting), test the command by hand | enable after approval | disable the setting / remove the `Schedule::` line |

### Economy changes
Change config/data/code → test rewards, purchases and transactions → tamper-test (fake amounts/prices, double claims) →
verify balances and `hcms_economy_transactions` → approval → Live. Mass changes need explicit confirmation and a dump.

### Scheduled production changes
Use the existing schedulers (`operations.md` §1). Every job must be switchable (setting), configurable, logged, audited
and tested by running the command by hand first.

## Automation boundary
Automatic: inspect, edit source, build, test, prepare deployments (artifacts, SQL, client builds, catalog diffs, rollback
notes).
Environment policy (user, 2026-10-01, CLAUDE.md): before the hotel launches the one stack counts as **development**, so
deploys (`yarn deploy`, plugin copy) and emulator restarts are automatic. **Always with explicit approval:** destructive
or mass SQL, mass economy changes, mass catalog imports, and every Live deploy/restart/migration once the hotel is open.

## Launch checklist items found
`APP_DEBUG=true` and `APP_ENV=local` on the site that serves `dev.habbo.nz`. Set production values before real players
arrive (debug pages leak stack traces and config).

## Sandbox built (2026-10-07, user request "can you make sandbox") — complete
| Part | Sandbox | Live |
|---|---|---|
| Database | `hcms_sandbox` (copy of `hcms` 2026-10-07 01:35, dump `db-backups/hcms-for-sandbox-20261007.sql`; all users offline, tickets cleared) | `hcms` |
| Emulator | `C:/inetpub/wwwroot/hcms-emulator-sandbox` (same Habbo.jar + plugins, `config.ini` db `hcms_sandbox`, game 31010, RCON 31001), `bash start-emulator.sh`; websocket `ws.nitro.port` 2087 → `wss://ws.habbo.nz:2087` (Cloudflare-proxied port; firewall rule "hcms sandbox ws 2087 (Cloudflare only)") | `hcms-emulator-run`, 30010/30001/8443 |
| Plugin paths (sandbox DB) | `hcms.gameevents.artisan_dir` = hcms-sandbox, profile covers → hcms-sandbox/public/…, camera → hcms-sandbox/storage/camera/, `hcms.bots.enabled` 0 | hCMS |
| Website | `C:/inetpub/wwwroot/hcms-sandbox` (copy of hCMS without node_modules/.claude/logs; `.env`: APP_URL https://sandbox.habbo.nz, DB hcms_sandbox, HCMS_RCON_PORT 31001, HCMS_CLIENT_URL https://play-sandbox.habbo.nz/, SESSION_COOKIE hcms_sandbox_session, SESSION_DOMAIN sandbox.habbo.nz, no Cloudflare keys, FINDRETROS_NAME empty; caches rebuilt) | hCMS |
| CDN | `hcms-sandbox/public/cdn/*` = junctions to the live cdn folders, except `client` (own copy: renderer-config socket 2087, ui-config url.prefix https://sandbox.habbo.nz) | |
| DNS | `sandbox.habbo.nz`, `play-sandbox.habbo.nz` A 62.68.75.108 proxied (Cloudflare API) | |
| IIS (created after the user said "do all") | IIS sites `HCMS-SANDBOX` (sandbox.habbo.nz → hcms-sandbox/public, pool LTDCMS) and `HCMS-SANDBOX-PLAY` (play-sandbox.habbo.nz → hcms-sandbox/public/cdn/client) with app `/gate` → a copy `hcms-chunk-gate-sandbox` whose `index.php` uses `CHUNK_DIR` hcms-client-chunks-sandbox and `ENV_FILE` hcms-sandbox/.env (copy of hcms-client-chunks). | |
Sandbox deploy of a client build: copy `dist` into `hcms-sandbox/public/cdn/client` and re-apply the two config lines; plugin: copy the jar to `hcms-emulator-sandbox/plugins` and restart only that java (port 31001). Data in the sandbox is a copy of real accounts (hashed passwords): keep it private.

Verified 2026-10-07: https://sandbox.habbo.nz 200, https://play-sandbox.habbo.nz 200 (socket 2087, url.prefix sandbox), wss://ws.habbo.nz:2087 → 101, live unaffected. Use the sandbox for every test before live.
The `/gate` app of a new play site needs the `php-gate` handler (copy it from `HCMS-PLAY/gate`); without it every gated chunk is a static 404 that Cloudflare caches for 4 h (purge the chunk URLs after fixing). Sandbox login: `HCMS_SANDBOX`, `HCMS_LOGIN_MIN_RANK` (3), `HCMS_LOGIN_USERS` (allow-list ids) in hcms-sandbox/.env, then `config:cache`. The sandbox client calls the website API cross-site, so hcms-sandbox/.env needs `FINDRETROS_CLIENT_ORIGIN=https://play-sandbox.habbo.nz` (config/cors.php allowed origin), else every `/api/*` call from the client (FindRetros vote tile, force vote) is silently blocked.
