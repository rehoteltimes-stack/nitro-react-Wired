# Operations: automation, economy config, QA, deployment, CDN, cleanup, docs

Verified against the source and the server on 2026-10-01. Re-check before relying on a number.

## 1. Automated / scheduled hotel systems (reuse before adding)
| Where | What runs | How |
|---|---|---|
| hCMS scheduler | Windows task `\hCMS-scheduler` runs `hCMS/storage/scheduler.cmd` every minute (= `artisan schedule:run`). Jobs in `routes/console.php`: `hcms:snapshot-wealth` 00:05, `hcms:sync-rare-enrolment` 10 min, `hcms:vip-notices` 09:00, `hcms:rare-rotations` every minute (rare rotations + LTD drops), `hcms:economy-snapshot` 00:10, `hcms:intel-scan` hourly at :17 (Habbo.com/sandbox intelligence, `retro-source/references/seasonal-intelligence.md`) | new website job = an artisan command in `app/Console/Commands` + one `Schedule::` line, `withoutOverlapping()` |
| Plugin timers (`hcms-emulator-plugin`) | `engagement/Engagement` (1 min payouts/chests/quests), `vip/VipSyncScheduler` (60 s), `activity/ActivityLogFlushScheduler` (3 s), `outbox/GameOutbox`, `stafffeed/*` (audit poll 5 s, duty), `security/*` (counters, incidents, trade-ban clock), `prison/Prison` (10 s clock), `staffpin/StaffPin`, `reconnect/ReconnectTicket` (cleanup), `bots/*`, settings reloads (~30 s) | `Emulator.getThreading()` / own executor; stop it in `onDisable` |
| Other plugins | `hcms-shop` (`ShopPlugin` catalog refresh 30 s, bubble registry), `hcms-furnieditor-plugin` (`FurniSources` downloads) | same |
| Core | room cycle 500 ms, Wired tick 50 ms, `CleanerThread` 10 s, stock credits/pixels/points/gotw schedulers (credits + points off: `hotel.auto.*.enabled = 0`; Snowflakes via gotw) | read-only; configure through `emulator_settings` |
Rule: a periodic **game-state** task (online players, rooms) belongs in a plugin timer. A **website/data** task (snapshots,
rotations, notices) belongs in the hCMS scheduler. Make each job idempotent and safe to rerun.
External intelligence runs as `hcms:intel-scan` in this scheduler (idempotent by gamedata hash; a failed source is
logged in `hcms_intel_runs` and keeps earlier results). stock_retro pulls are still manual.

## 2. Economy configuration: where each value lives (change it there)
| Value | Location | Owner / reload |
|---|---|---|
| Online payouts, caps, VIP ×, chest timing, quest counts/bonus/swap price | `hcms_engagement_settings` (24 rows) | plugin re-reads every minute |
| Login calendar, chest prizes, quest pool | `hcms_login_calendar`, `hcms_chest_rewards`, `hcms_daily_quest_pool` | plugin |
| Website game rewards (daily login, event won) | `config/hcms.php` `game_rewards` | hCMS (`hcms:game-event`) |
| VIP price/perks, HabboCash packages | `hcms_vip_settings`, `hcms_citycash_packages` | hCMS |
| Values / rares / banners / Bonamigo | `hcms_values_settings`, rare tables, `hcms_banners_settings`, `hcms_bonamigo_settings` | hCMS Filament |
| Catalog prices | `catalog_items` (`cost_credits`, `cost_points`, `points_type`) | emulator, `:update_catalogue` |
| Presence prices/items | `shop_*` tables, `shop.*` settings | hcms-shop, cache 30 s |
| Emulator economy switches (marketplace currency, auto payouts, gotw amounts) | `emulator_settings`, `permissions.auto_gotw_amount` | `:update_config` / `:update permissions` |
| Currency display names | `emulator_texts seasonal.name.<type>`, client ExternalTexts | restart / `?v=` bump |
| Purse currencies shown | client `ui-config.json` `system.currency.types` | full reload |
The admin panel already exposes much of this (`EconomySettings`, Filament resources). Add a field there before
building a new UI. Every change must stay server-side and be audited.

## 3. Testing / QA (what exists, what to run)
- No automated test suites to speak of: hCMS `tests/` has only the Laravel example tests; plugins and client have none.
  QA = the checks below plus live verification.
- Client: `npx tsc --noEmit -p .` (baseline 49), live CDP on the dev client (`yarn start`, 5173), DOM + computed styles,
  every UI state.
- Plugin: `mvn -q package` must pass. After an approved deploy, the boot log must show the "registered" lines and no new
  exceptions. Live round trip in the client; DB rows checked.
- hCMS: `php -l`, `Livewire::test(...)` (tinker) for Filament, `php artisan migrate --force`, real request through
  `https://dev.habbo.nz`.
- Economy/security: test a legitimate run **and** a tampered one (fake price/amount, double claim, rank-1 calling a staff
  opcode). Check the ledger and balances before and after.
- Test accounts: never `officialrooms` headless (the user logs in with it). Make a dedicated test account. Note that
  `VipSyncScheduler` resets ranks without a membership row.

## 4. Production / deployment
Environment model, Sandbox vs Live and real rollback paths: `environments.md`. Summary per layer:
| Layer | Command | Rule |
|---|---|---|
| Client | `yarn deploy` (`deploy.ps1`: build, check `dist/index.html`, robocopy /MIR to `hCMS/public/cdn/client`, keeps `pie.html`/`metro.html`/`cc.html`/`gd.html`, `rose/` (+ folders), `web.config`) | `public/ui-config.json` + `renderer-config.json` are copied by the build; keep the deployed copies identical to the repo copies |
| Plugins | `mvn -q package` → stop java → copy jar to `hcms-emulator-run/plugins/` (keep `*.jar.bak-<name>`) → `start-emulator.sh` → boot log | **ask the user first**: a restart disconnects everyone |
| hCMS | live from its folder through IIS (`dev.habbo.nz`); migrations with `--force`; config cache only if used | back up the DB before risky migrations (`c:/inetpub/wwwroot/db-backups/`) |
| DB data changes | backup table `bak_<date>_<what>` or a mysqldump first | mass economy/item changes need explicit confirmation |
No source maps ship. No secrets in `public/*.json` or client code.

## 5. CDN / assets
- Served from `hCMS/public/cdn/` (`cdn.habbo.nz`): `client/` (deployed build), `gamedata/` (FurnitureData,
  ExternalTexts, FigureData…), `bundled/` (`.nitro` furni/pets), `dcr/hof_furni/icon/`, `c_images/` (catalog, badges,
  notifications/feedback icons, stafftools), `images/wallet/` (currency icons), `shop/` (Presence assets),
  `furni-editor/`, `profile-icons/`, `sounds/`, `room-ads/`.
- **7-day browser cache.** After changing a file, bump its `?v=` in the client config: `feedback.icon.url` (v=9),
  `currency.asset.icon.url` (v=4), `furnidata.url` / `furni.asset.url` / icons / pets (`v=20260927f&n=…`). Change both the repo
  `public/*.json` and the deployed `hCMS/public/cdn/client/*.json`. Server-side icon URLs live in `emulator_settings`
  (e.g. feedback), followed by `:update_config`.
- Assets from other hotels: only read in the user's own browser session (no Cloudflare workaround), keep PNG/GIF checks,
  back up replaced files. Resolver, previews (`c_images/furni_previews/`): `asset-rendering.md`.
- Cloudflare in front of every hostname: which files it caches and when to purge (exact URLs only):
  `infrastructure.md`.

## 6. Cleanup of obsolete commands/code
Commands are registered in core `CommandHandler`, `plugin:commands/HabboCityCommands` + other `CommandHandler.addCommand`
calls, keys in `emulator_texts commands.keys.*`, permission columns in `permissions`, help text in
`src/components/help/HelpCommandData.ts`, and client-side `:` commands in `src/hooks/rooms/widgets/useChatInputWidget.ts`.
Check all of these before adding, changing or removing a command. Removal steps: references (code, plugin
registration, client + server protocol, config, docs) → remove → build → test → grep shows no references → document.

## 7. Documentation after every meaningful change
- `docs/PROJECT_STATE.md` (client or hCMS): a dated section with what changed, files, opcodes/tables, verified vs not, open.
- The short `CLAUDE.md` "Current focus" when the focus changes.
- The owning skill reference when an architecture fact was learned (Arcturus behaviour → `arcturus-emulator`, our
  systems → `custom-plugins`, website → `hcms`, client → `nitro-ui`, other retros → `retro-source`, how-to-work →
  PROJECT_WORKFLOW / this file).
- A new plugin/repo gets its short `CLAUDE.md` (PROJECT_WORKFLOW §16).
