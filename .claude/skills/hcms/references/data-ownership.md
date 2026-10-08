# Who owns which data (website vs game)

| Data | Owner / writer | Readers | Sync to the running game |
|---|---|---|---|
| Accounts `users` (rank, motto, look, credits) | emulator while online (`HabboInfo.run()` rewrites the row); website at registration, admin rank changes | both | `GameNotifier::refresh` → `PlayerRefresh.rank()` |
| Balances `users_currency` | website `EconomyService` + plugin `Wallet` / admin protocol; emulator memory while online | both | `GameNotifier` (refresh) for website writes |
| Ledger `hcms_economy_transactions` | `EconomyService`, plugin `Wallet`, `AdminCurrencyProtocol` | Admin > Ledger, Economy dashboard | n/a |
| HabboPass winwins `hcms_citypass_progress`, `hcms_winwin_ledger` | `WinwinService` (PHP) **and** `HabboPassXp` (Java copy) | website /rewards, client pass bar | client asks for state |
| VIP `hcms_vip_memberships` | website (`PurchaseVipMembershipAction`, `VipService`) | plugin `VipSyncScheduler` (60 s) | rank set by the plugin |
| Rares / values / rotations / LTD drops | website (Rare* resources, `hcms:rare-rotations`) | game catalog | RCON `updatecatalog` |
| Market (badges, rares, rooms), auctions | website `Market\Actions`, `Auctions` | website | items/badges via refresh |
| In-game marketplace `marketplace_items` | emulator core | game | n/a |
| Engagement `hcms_engagement_*`, daily quests, streaks, chests | plugin | client, (admin pages where built) | plugin pushes state |
| Presence `shop_*` | hcms-shop plugin | client | plugin |
| Staff/security `hcms_staff_*`, `hcms_security_*`, prison, trade bans | plugin (+ Filament edits of rules/tags) | Staff Tools, Filament | plugin re-reads every ~30 s |
| Feedback `feedback_*` | Filament (rules/kinds/styles), seeded by hcms-feedback | hcms-feedback | re-read every 30 s |
| Audit `hcms_admin_audit_log` | website + plugins | Admin > Audit log, staff feed (polls it) | n/a |
| Notifications `hcms_notifications`, outbox `hcms_game_outbox` | website (+ plugin for offline mentions) | website bell / plugin at login | outbox |
| Catalog `catalog_*`, `items_base` | emulator data, edited by Furni Editor / scripts / Filament rare pages | game | `:update_catalogue`, `:update_items`, RCON |

Rule: one writer per piece of important data where possible. When two exist (balances, winwins), use the same
transaction/idempotency pattern and push to the game.
