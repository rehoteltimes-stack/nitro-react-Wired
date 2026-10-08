# Database and persistence

## Access
- `core:database/Database` / `DatabasePool`: HikariCP, JDBC MySQL URL from config.ini `db.hostname/port/database/params`.
  Max pool = `runtime.threads × 2` (set in `Emulator.main`; config.ini `runtime.threads=8` ⇒ 16 connections).
  Database: MariaDB `hcms`, shared with the hCMS website.
- Pattern everywhere: `try (Connection c = Emulator.getDatabase().getDataSource().getConnection(); PreparedStatement s
  = ...)`. No ORM, no repository layer. SQL lives in managers and handlers.
- Transactions are rare in the core (most writes are single statements, autocommit). Project plugins use explicit
  transactions with `SELECT ... FOR UPDATE` for money (`AdminCurrencyProtocol`).
- Pool exhaustion is a real failure mode: holding a connection while calling code that opens another one can deadlock
  the boot (incident 2026-09-29, hcms-shop `refresh` → `ShopConfig.live()`).

## Write models
- Immediate: `HabboInfo.run()` (users + users_currency), `HabboItem.run()` (items), trades, marketplace.
- Batched: `DatabaseLoggable` entries (`CommandLog`, room chat, `CatalogPurchaseLogEntry`) queue in `DatabaseLogger`;
  `CleanerThread` flushes every ~30 s. The project's `plugin:activity/ActivityLogFlushScheduler` flushes every 3 s.
- Room/item state is saved by the room cycle (`Room.save()`) and on unload.
- Wired variables: write-behind (`wired/variables`, `WiredVariablePersistence`).

## Config and texts
- `config.ini` = DB/network only. Everything else is in `emulator_settings` (key, value), loaded at boot, reloaded with
  `:update_config`. `ConfigurationManager.register(key, default)` inserts a missing key.
- `emulator_texts`: messages and **command keys** (`commands.keys.cmd_x`). Loaded at boot; there's no live reload in
  stock, so a restart is needed (or a plugin's own cache).

## Important tables (stock)
users, users_currency, users_settings, users_badges, items, items_base, catalog_pages, catalog_items,
catalog_items_limited, rooms, room_rights, room_enter_log, room_trade_log(+_items), marketplace_items, permissions,
bans, sanctions, chatlogs_room, chatlogs_private, commandlogs, logs_shop_purchases, emulator_settings, emulator_texts,
wordfilter, support_cfh_topics, pet_* / bot tables. Project tables start with `hcms_`, `shop_`, `feedback_`.

## Rules
- `DESCRIBE` before using a column. Check the engine (InnoDB needed for transactions/locks). Keep a backup table before
  bulk changes.
- Remember the in-memory copies: items_base, catalog, permissions, settings and texts are cached; online players'
  balances/inventory/rank live in memory (see `economy.md`).
