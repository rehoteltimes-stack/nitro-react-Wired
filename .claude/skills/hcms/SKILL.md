---
name: hcms
description: The hCMS Laravel 13 + Filament 5 website at c:/inetpub/wwwroot/hCMS (APP_URL https://dev.habbo.nz) - auth/2FA, player Center (values, market, auctions, inventory, banners, badges, HabboBox, VIP Club, HabboCash), HabboPass/rewards/quests/winwins, economy service and ledger, rare economy (rotations, LTD drops), news/forum/support, the Filament admin panel (/admin), scheduler commands, and how the site talks to the emulator (RCON, GameNotifier, outbox, game-event command). Use whenever a task touches the website, admin panel, website-side economy/VIP/rewards, or data the website owns.
---

# hCMS (Laravel website + admin)

Root `c:/inetpub/wwwroot/hCMS`. Its `CLAUDE.md` is short. History is in `docs/PROJECT_STATE.md` (460 KB, grep only).

## Architecture (verified 2026-10-01)
- Laravel 13 (`laravel/framework ^13.17`), Filament 5, PHP ^8.3, Blade views + plain JS/CSS in `public/assets` (copied from the habboworld.be/HabboCity
  look). Domain-first:
  `app/Domain/<Area>/{Actions,Services,Models,Support,Queries,Exceptions}`. Areas: Activity, Administration,
  Auctions, Auth, Badges, Banners, Bonamigo, Catalog, Center, Citybox, Economy, EventAlerts, Feedback, Forum,
  GameBridge, Home, Hotel, Inventory, Market, News, Notifications, Organisations, Profiles, Ranking, Rewards, Rooms,
  Security, Settings, Staff, StaffFeed, Support, Users, VIP, Values.
- Path for business logic: Route → Controller (`app/Http/Controllers`, `Center/*`) → Request → Action/Service → Model →
  DB. Never put it in Blade, JS or routes.
- `routes/web.php` (~124 routes). Groups: `forum`, `support`, auth groups, `center` (middleware `SettleExpiredAuctions`,
  `RecordWealthSnapshot`), `rewards`. One API controller: `Api/RoomTemplateController`.
- Auth: own `LoginController` / `RegisterController` / `TwoFactorController` + `App\Domain\Auth\Actions`.
  `User::canAccessPanel` = rank ≥ `hcms.admin.panel_min_rank` (5); `isAdministrator` = rank ≥ `admin_min_rank` (7).
- Admin: `app/Providers/Filament/AdminPanelProvider` (`/admin`), auto-discovered `app/Filament/Resources/*` (Players,
  Ledger, AuditLog, Bans, Tickets, Rare*, LtdDrops, CityboxBoxes/Prizes, CityPassSeasons, Quests, Security*, StaffFeed*,
  Feedback*, FurniEdits…) and `Pages` (EconomyDashboard, EconomySettings, BotManagement, ComparePlayers, SendPresent).
- Users = the stock Arcturus `users` table (shared with the emulator). Balances = `users_currency`.
- Scheduler (`routes/console.php`): `hcms:snapshot-wealth` daily, `hcms:sync-rare-enrolment` every 10 min,
  `hcms:vip-notices` daily, plus `hcms:rare-rotations` and `hcms:economy-snapshot` (see PROJECT_STATE). Commands live in
  `app/Console/Commands`.
- Config: `config/hcms.php` (admin ranks, `game_rewards`, …), `.env` (DB `hcms`).
- Migrations: `database/migrations` (69). Plugins create their own tables at emulator boot. Check both before adding a table.

## Authority
- Website-owned rules: `App\Domain\Economy\Services\EconomyService` (credit/debit/transfer in `DB::transaction` with
  `lockForUpdate`, ledger `hcms_economy_transactions`, idempotency key), `Rewards\Services\WinwinService` /
  `CityPassService` / `QuestService`, `VIP\Services\VipService` (`hcms_vip_memberships` → in-game rank via plugin VIP sync),
  market/auctions/values/rarity.
- After writing anything an online player holds in memory, call `App\Domain\GameBridge\GameNotifier`
  (`toUser`/`toUsers`/`refresh`; RCON `hcmsrefresh`, outbox for offline players). Otherwise the emulator overwrites it.
- RCON client: `App\Support\EmulatorRcon::send($key, $data)`.
- Game → site: `php artisan hcms:game-event` (`GameEvent` command), called by the plugin's `GameEventBridge`.
- See the `custom-plugins` skill `references/economy-engagement.md` for the duplicated HabboPass logic (`HabboPassXp.java`).

## Working rules
- PHP 8.5.10: `"C:\Program Files (x86)\PHP\php-8.5.10\php.exe" artisan ...` (the 8.2 binary is too old for Composer).
- Verify Filament pages/components with `Livewire::test(...)` in tinker. It's more reliable than CDP clicks on this panel.
- `php -l` every changed file. Migrations: `php artisan migrate --force`. Check the table engine is InnoDB before relying
  on transactions.
- Avatar URLs only through `App\Domain\Users\Support\Avatar`.
- Zero comments in new code. `AGENTS.md` is a generic Laravel Boost bootstrap; ignore it.
- Payments (HabboCash packages) aren't connected. The provider is undecided; ask first.

## Catalog import/sync
`hcms:catalog-stage` / `hcms:catalog-swap` replace the whole catalog (rollback via `old_<suffix>_*`). Additive sync and
the planned admin approval queue: `project-workflow/references/catalog-sync.md`. Intelligence: `hcms:intel-scan` (hourly), `app/Domain/Intelligence`, admin Administration → Intelligence findings /
scans (`retro-source/references/seasonal-intelligence.md`; no campaign system). Cloudflare: `hcms:cloudflare`,
token `CLOUDFLARE_API_TOKEN` in `.env` only (`project-workflow/references/infrastructure.md`). Furni images:
`App\Domain\Values\Support\FurniImage` (preview, else icon; `project-workflow/references/asset-rendering.md`).

## References
- `references/data-ownership.md`: who owns, writes and reads each important table, and how it reaches the game.

## Trace checklist
Route → controller → request validation → action/service (transaction, lock, ledger, audit) → model/table → GameNotifier
→ Blade/JS response. For admin: Filament resource/page → action → same services → audit `hcms_admin_audit_log`.

## Coordination
Routed by `project-workflow`. When a change crosses into another layer, load that layer's skill too (routing table
there). Ops rules (schedulers, economy config, QA, deploy, CDN, cleanup, docs): `project-workflow/references/operations.md`.
Record new architecture facts in this skill's references.
