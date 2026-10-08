# Economy and engagement (custom)

## Currencies (project data)
5 Diamonds (premium, tradable, catalog VIP/Rares, marketplace), 101 Emeralds (earned, untradable, Presence shop), 103
Snowflakes (seasonal; stock `GotwPointsScheduler`), 12 HabboCash (bought on the website, converts), 0 Duckets, 104 NFT
Points. Credits retired. hCMS mirror: `App\Domain\Economy\Support\CurrencyType` (`GamePoints` = 101 = Emeralds).

## Two reward authorities (know which one you're in)
1. **hCMS owns** website-side rewards and ledgers: `EconomyService` (credit/debit/transfer with `lockForUpdate`, ledger
   `hcms_economy_transactions`), `WinwinService` (HabboPass "winwins", `hcms_winwin_ledger`), `QuestService` /
   `CityPassService`, the VIP daily Emerald. The game asks it with `plugin:rewards/GameEventBridge`, which runs
   `php artisan hcms:game-event <type> <userId> [ref]` (login, event won). Idempotent.
2. **The plugin also writes** money for in-game loops: `plugin:engagement/Wallet.give` (stock `givePoints` + a
   `hcms_economy_transactions` row) and `HabboPassXp` (a Java copy of `WinwinService::grant`: same tables, idempotency key,
   row lock).
- This is a known duplication (GameEventBridge's header still says the game never writes ledgers). When changing
  HabboPass/winwin rules, change **both** `WinwinService.php` and `HabboPassXp.java`, or move one onto the other. Don't add
  a third.

## Engagement (`plugin:engagement/`)
- `Engagement`: a 1-minute tick counts minutes in a room (not idle):
  - payout every `payout_minutes`: Diamonds 1/10 min (max 15/day), Emeralds 2/10 min (max 60/day), VIP ×2;
  - chest progress;
  - all numbers in `hcms_engagement_settings`; per-day state in `hcms_engagement_daily` (incl. payout/chest progress,
    saved every minute);
  - chest rewards weighted in `hcms_chest_rewards`.
- `LoginStreak`: `hcms_login_streaks`, 7-day calendar `hcms_login_calendar`, freezes (10 Diamonds; VIP 1 free a week),
  welcome-back after 3 days away.
- `DailyQuests`:
  - pool `hcms_daily_quest_pool`; per day `hcms_daily_quests` / `hcms_daily_quest_days`;
  - unlimited: 3 open at a time, a new one after each;
  - after `quest_full_count` (5) the rewards drop to a third; the bonus comes at 5 done;
  - swap price `quest_swap_price`;
  - XP per quest;
  - the next quest prefers a type not used today (repeats only when the pool is used up); each pool row has a `badge`
    (achievement badge code) sent at the end of OUT 9631 and shown on the quest card.
- `AchievementXp`: `UserAchievementLeveledEvent` → max(1, round(points / 5)) HabboPass XP per level. Achievement rewards
  are Emeralds (data).
- `OfficialAchievements` (2026-10-03; `progress` / `raiseTo` helpers): Habbo's official `DailyTasksCompleted` (Taskmaster, +1 per finished daily quest)
  and `DailyTaskStreakDays` (Streak Freak, raised to the current run of consecutive `bonus_paid` days in
  `hcms_daily_quest_days`, never lowered). Rows in `achievements` use Habbo's thresholds (`/api/public/achievements`),
  Emeralds ceil(level/2), points 5 × level. Badge art + texts on the CDN like any achievement. `RewardTracksCompleted`
  (Track Champ) +1 when a `HabboPassXp.grant` crosses the season's max level (online players only). Other counters:
  `TradeCount` (StaffFeedEconomy trade hook, both sides), `LTDPurchaser` (limited catalog purchase), `Name` (name
  change), `GamerPaycheck` (GameRewards payouts whose reason ends in `.win`), `TimeSpentRoomType{Chat,Trade,RPG,Games}`
  (Engagement minute tick by room category caption_save: chat, trading, roleplay, games), `HC` (VIP days from
  `hcms_vip_memberships`, at login). All 174 ladders carry Habbo's thresholds; the rest are progressed by the core or
  have no source yet.
- `HabboPassXp.grant` runs in READ COMMITTED. `AchievementXp` runs on a pool thread (via `counted()`), so it can write
  the same `hcms_citypass_progress` row at the same moment as a quest grant; under MariaDB 12's snapshot isolation that
  failed with "Record has changed since last read" and the grant was lost. The unique ledger key still stops double pay.
- `HcmsPlugin.counted()`: counts only events still uncancelled 50 ms later (event priority is ignored).
- Protocol: IN 9629 state, IN 9630 action (`claim`, `chest`, `chest_skip`, `freeze`, `swap:<slot>`), OUT 9631 state
  (quests, pass at the end). Client: `components/engagement/EngagementView.tsx` (Today card, Daily reward window).

## Other custom economy pieces
- `plugin:economy/NoCredits`: credit coins pay Diamonds instead.
- `plugin:boxes/HabboBoxes`: opening HabboBoxes in the game (prizes from hCMS tables).
- `plugin:admin/AdminCurrencyProtocol`: staff grant/remove (transaction + lock + ledger + audit + memory push).
- Presence shop prices are in `shop_*` tables (Emeralds). See `features.md`.
- Catalog prices are core data (`catalog_items`), see the arcturus skill `catalog.md`.

## Checklist for a new reward
Pick the authority (website rule → hCMS service + GameEventBridge/GameNotifier; in-game loop → Wallet/HabboPassXp) →
idempotency key → ledger row → in-memory push for online players → feedback bubble → client state refresh → test
double-claim and tampered amounts.

## HabboPass window in the hotel (2026-10-02)
- The website owns the pass (`CityPassService` state + claim, `RewardType` grant/describe). The hotel never copies it:
  `PassProtocol` (IN 9648 `state`|`claim`, OUT 9649) runs `php artisan hcms:pass <userId> [--claim]` through
  `GameEventBridge.query` (its own 2-thread pool, stdout returned) and forwards the JSON as typed fields.
- 1 s per-user interval + one request at a time per user; the client re-enables its button after 6 s if a reply is dropped.


## Seasonal spawns + Swap-o-Matic (2026-10-03)
- Crackable spawns (interaction `crackable_master`, e.g. the Furious God): not collected; players hit it with the stock
  click, the emptying hit triggers `banished()` (remove + delete + room line); prize + achievement come from
  `items_crackable`.
- `games/FurniSpawns`: furni of the current season (`hcms.spawns.season`, table `hcms_spawn_items`) appear on a free tile
  reachable from the door, only in allowed rooms (`hcms.spawns.rooms` list, else rooms of `owner_ids`, default 2 =
  officialrooms). Double-click walks the player next to it and collects it; it goes to the inventory and is recorded in
  `hcms_spawn_collects` (the token proof). Uncollected spawns vanish after `lifetime_seconds`; leftovers are deleted at boot.
- `games/Automat` (shown as **Swap-o-Matic**; only by double-clicking the machine furni within 2 tiles, no command): pays currency only for items listed in `hcms_spawn_collects` with
  `exchanged_at = 0`, so catalog-bought copies can't be swapped. Machine = `hcms.automat.machine_items` (5524). Payout via
  `Wallet.give` reason `automat.exchange`, JSON context `{offer, items}`.
