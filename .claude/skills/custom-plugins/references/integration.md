# hCMS ↔ emulator integration

Both sides use the same MariaDB `hcms`. The emulator caches online players, so every website change that affects a
player in the game must be pushed.

| Direction | Mechanism | Code |
|---|---|---|
| Website → game, now | RCON (`127.0.0.1:30001`, JSON `{key, data}`) | hCMS `app/Support/EmulatorRcon.php`. Keys: `hcmsrefresh` (`plugin:sync/RefreshRcon` → `PlayerRefresh.refresh`: furni, badges, currencies, banners, rank, effects, shop), `botpanel`, `furnieditorrevert`, stock `updatecatalog`, etc. |
| Website → game, notice | `App\Domain\GameBridge\GameNotifier::toUser/toUsers/refresh` | After commit: RCON `hcmsrefresh` first, then `hcms_game_outbox` rows only for offline players; `plugin:outbox/GameOutbox` delivers them at login. |
| Game → website, reward rule | `plugin:rewards/GameEventBridge` | Runs `php artisan hcms:game-event <type> <userId> [ref]` (hCMS `app/Console/Commands/GameEvent.php`) on a daemon thread. |
| VIP rank | `plugin:vip/VipSyncScheduler` + `VipRankSynchronizer` | Every 60 s it sets the rank from `hcms_vip_memberships` (website VIP Club). A test account without a membership row drops back to rank 1. |
| Logins/activity for the admin panel | `plugin:activity/*` | `hcms_session_log`, faster `DatabaseLogger` flush (3 s). |
| Audit | both write `hcms_admin_audit_log` | Website Filament + plugin staff actions. |

## Data ownership rules
- Balances: `users_currency`. Online = emulator memory wins (`HabboInfo.run()` writes absolute values). The website must
  write the DB **and** call `GameNotifier` (refresh), or the next in-game change overwrites it.
- Rank: `users.rank`. Same overwrite risk; `PlayerRefresh.rank()` re-reads it.
- Catalog / items_base: DB + emulator cache; reload with RCON `updatecatalog` / `:update_items`.
- Plugin-owned tables (`hcms_engagement_*`, `shop_*`, `feedback_*`, staff/security tables) are read by Filament pages.
  The plugin re-reads its settings tables on a timer (often 30 s).
