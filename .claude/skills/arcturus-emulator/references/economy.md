# Currencies, trading, marketplace

## Where balances live (verified)
- Credits: `users.credits` → `HabboInfo.credits`. Activity points (every other currency): `users_currency (user_id, type,
  amount)` → `HabboInfo.currencies` (`TIntIntHashMap`), loaded once at login.
- **The online player's in-memory value is the authority while they're online.**
  `HabboInfo.addCurrencyAmount` / `setCurrencyAmount` / `addCredits` immediately call `HabboInfo.run()`, which upserts
  **all** in-memory currencies (`INSERT ... ON DUPLICATE KEY UPDATE amount = ?`, absolute values) and rewrites the `users`
  row (motto, look, credits, **rank**, home room, …).
  ⇒ A website/DB-only change for an online player is overwritten by the next in-game change. It must also be pushed
  into memory: this project uses hCMS `GameNotifier` → RCON `hcmsrefresh` → `plugin:sync/PlayerRefresh`.
- Changing balances in core: `Habbo.giveCredits(n)` (fires `UserCreditsEvent`) and `Habbo.givePoints(type, n)` (fires
  `UserPointsEvent`, then sends `UserPointsComposer`). Negative n = spend. **No balance check inside**: the caller must
  check first.

## Project currencies (data/config, not core)
5 Diamonds (premium, tradable), 101 Emeralds (earned, untradable), 103 Snowflakes (seasonal), 12 HabboCash (bought), 0
Duckets, 104 NFT Points. Credits are retired (catalog free except VIP/Rares). Names come from `emulator_texts`
`seasonal.name.<type>`.

## Project rules for writing money
- In a plugin, use `plugin:engagement/Wallet.give(habbo, type, amount, reason, ...)`: stock `givePoints` + a
  `hcms_economy_transactions` row. Don't add a new balance writer.
- Admin changes: `plugin:admin/AdminCurrencyProtocol` (DB transaction with a row lock, ledger, audit, then the
  in-memory push).
- HabboPass XP: `plugin:engagement/HabboPassXp` (Java copy of hCMS `WinwinService::grant`, idempotency key).
- Stock auto-payouts are disabled (`hotel.auto.credits/points.enabled = 0`). Snowflakes come from the stock
  `GotwPointsScheduler`. Online payouts come from `plugin:engagement/Engagement`.

## Trading (`core:habbohotel/rooms/RoomTrade`, `RoomTradeUser`, handlers `messages/incoming/trading/`)
offer/remove/accept → `confirm(habbo)`: at final confirm every offered item is re-checked against the owner's
`ItemsComponent` (ownership re-validated server-side), `TradeConfirmEvent` fires (only if a plugin registered it), then
`room_trade_log` + `room_trade_log_items` and `UPDATE items SET user_id`. Trades move items only (no currency in stock).
Trade permission: `HabboStats.allowTrade` / `users_settings.can_trade`. Project trade bans:
`plugin:security/TradeBan`.

## Marketplace (`core:habbohotel/catalog/marketplace/MarketPlace`, static)
- Currency = `hotel.marketplace.currency` (this project: 5 Diamonds).
- `sellItem` fires `MarketPlaceItemOfferedEvent`, `takeBackItem` fires `MarketPlaceItemCancelledEvent` (owner check
  in SQL), `getCredits` collects earnings (synchronized on the inventory).
- `buyItem`: reads the offer with `SELECT` (no row lock), checks `state == 1` and the balance, `UPDATE ... SET state = 2`,
  fires `MarketPlaceItemSoldEvent` (cancellable), then charges. **Possible race:** two buyers at the same moment
  (no `FOR UPDATE`, no conditional `WHERE state = 1` on the update). UNVERIFIED whether exploitable in practice; check
  before relying on the marketplace for valuable items.

## Trace checklist for any money feature
Who decides the amount (must be server data) → balance check → write path (Wallet / givePoints) → ledger row →
in-memory vs DB consistency → event listeners that could cancel or change it (`UserPointsEvent`,
`UserCatalogItemPurchasedEvent`, `MarketPlaceItemSoldEvent`) → test a tampered request.

## Achievements (`core:habbohotel/achievements/AchievementManager`, verified 2026-10-03)
- Loaded once at boot from `achievements` (one row per name + level). `achievements.category` is a DB ENUM **and** a Java
  enum (`AchievementCategories`: identity, explore, music, social, games, room_builder, pets, tools, other, test,
  invisible, events). Habbo's newer categories (`crafting`, `crackables`, `collectibles`) don't exist: MariaDB stores
  `''`, `valueOf('')` throws, and the catch sits outside the read loop, so **every row after it stops loading**. Only
  use enum categories (we use `explore`).
- `progressAchievement(habbo, achievement, amount)` works only for an online Habbo, creates the `users_achievements`
  row on first use, fires `UserAchievementProgressEvent` / `UserAchievementLeveledEvent`, sends the badge itself.
  Badge code = `ACH_<name><level>` (a single-level Habbo badge like `ACH_Profile1` becomes `ACH_Profile11` here).
- Rooms loaded at boot (official rooms, spawn rooms) keep the category they had then; a DB change needs a reload.
- `Login` is progressed by `UsernameEvent` (header 3878, which Nitro sends at login as the ignored-users request).
- Data-driven achievements (no code needed): `crafting_recipes.achievement` (progressed by `CraftingCraftItemEvent` /
  `CraftSecret`, plus `Atcg`/`AtcgSecret`), `items_crackable.achievement_tick` (each hit) / `achievement_cracked`,
  and breeding nests progress `<Boxtype>Breeder` (Dog/Cat/Pig/Terrier/BearBreeder). A crackable only works when its
  `items_base.interaction_type` is exactly `crackable`; `required_effect` must be worn (192 watering can, 186 …);
  the clicker must stand within 1.5 tiles. Crafting tables = `crafting_altars_recipes.altar_id` (items_base id).
