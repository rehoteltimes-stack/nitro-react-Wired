# ECONOMY-MAP.md

Audit date: 2026-10-05. Scope: how currency is stored, changed, validated, persisted and shown to the
client. Every class/method/table named here was read directly in the repo; flows not individually re-read are
marked *(stock Arcturus, not re-verified line-by-line)*.

## Authority model (one sentence)

The client never sends an amount or a balance. It sends an intent (buy this item, claim today, open the chest,
grant this user). The server reads the price/reward from the DB or config, checks the balance, mutates the
in-memory balance, persists it, and pushes the new balance back. The only inputs the client controls are
selectors (page id, item id, offer id, username, action string, counts) — all re-validated server-side.

## Currency types in this hotel

Currency is keyed by an integer `type`. There is no "credits currency" in play — the hotel runs on points-type
currencies (owner decision, 2026-09-29; see `economy/NoCredits.java`).

| Type | Name | Notes |
|---|---|---|
| (col) | Credits | Legacy `users.credits` column. Kept in code, effectively unused; coin redeems are redirected to Diamonds by `NoCredits`. |
| 0 | Duckets / Pixels | `getPixels()`/`setPixels()` alias type 0. Marketplace currency (`hotel.marketplace.currency = 0`). |
| 1–4 | legacy point slots | Broadcast but unused. |
| 5 | **Diamonds** | `seasonal.primary.type = 5`. The hotel's main currency: catalog, club, chests, quests, skip prices. |
| 12 | HabboCash | Website premium currency (listed in `AdminCurrencyProtocol.TYPES`). |
| 101 | Emeralds | Secondary currency (online payouts, welcome-back gift, clothes shop). |
| 102 | (slot) | Broadcast, unused. |
| 103 | **Season currency** | `SeasonCurrency.TYPE = 103`. Quest/season rewards (type-103 slot). |
| 104 | NFT Points | Listed in admin grant panel. |
| 105 | (slot) | Broadcast, unused. |

`seasonal.types = 0;1;2;3;4;5;101;102;103;104;105` — the list the purse composer broadcasts.

## Storage

- **In memory (authoritative while online):** `HabboInfo.currencies` — a `TIntIntHashMap` of `type → amount`.
  `getCurrencyAmount(type)`, `addCurrencyAmount(type, amt)`, `setCurrencyAmount(type, amt)`
  (`habbohotel/users/HabboInfo.java:235-251`). Legacy credits live in a separate `int credits` field with
  `getCredits/setCredits/addCredits`.
- **Database:**
  - `users.credits` column (legacy credits), saved by `HabboInfo.run()`.
  - `users_currency (user_id, type, amount)` — the points-type currencies.
  - `hcms_economy_transactions (user_id, currency_type, amount, balance_after, reason, context, created_at)` —
    the shared ledger written by both the website and the plugin.

## Server API for changing currency

| Method | File | Effect |
|---|---|---|
| `Habbo.giveCredits(int)` | `users/Habbo.java:237` | Fires `UserCreditsEvent`, `addCredits`, sends `UserCreditsComposer`. |
| `Habbo.givePixels(int)` | `users/Habbo.java:251` | Type-0 via `UserPointsEvent`. |
| `Habbo.givePoints(int)` | `users/Habbo.java:265` | Defaults to `seasonal.primary.type` (5). |
| `Habbo.givePoints(int type, int points)` | `users/Habbo.java:270` | Fires `UserPointsEvent`, `addCurrencyAmount`, sends `UserPointsComposer`. |
| `HabboInfo.addCurrencyAmount / setCurrencyAmount` | `users/HabboInfo.java:243-251` | Raw in-memory mutation (used by admin grant after a DB write). |
| **`Wallet.give(habbo, type, amount, reason, context)`** | `engagement/Wallet.java:23` | **Preferred plugin path:** calls `givePoints` *and* writes a `hcms_economy_transactions` ledger row. Use for every game payout so the website history/economy dashboard sees it. |
| `Wallet.giveOffline(userId, type, amount, …)` | `engagement/Wallet.java:30` | Offline payout: `users_currency` upsert + ledger row, no in-memory user. |
| `Wallet.record(habbo, …)` | `engagement/Wallet.java:55` | Ledger-only (balance already changed elsewhere). |

Negative amounts are how currency is *taken* (e.g. `Wallet.give(habbo, 5, -price, …)`).

## Per-currency detail

### Diamonds (type 5) — primary
- **Earned:** daily calendar reward, online chests, daily-quest rewards + bonus, season/HabboPass rewards, coin
  furni redeem (`NoCredits.onRedeem`), staff grant, website grants/market/auction payouts.
- **Spent:** catalog (`item.getPointsType()` is normally 5), HC/VIP club offers, marketplace *(config is type 0,
  not 5)*, chest skip price, streak-freeze price, quest-swap price, clothes shop.
- **Validation:** balance checked before every deduction (`getCurrencyAmount(5) >= price`). Caps on earning:
  `cap_diamonds` per day (× VIP multiplier) in `Engagement`.
- **Client notification:** `UserPointsComposer` (OUT 2275) for single-type deltas; `UserCurrencyComposer`
  (OUT 2018) for the full set.
- **Persistence:** `users_currency` via the emulator save cycle; ledger via `Wallet`.

### Emeralds (type 101)
- Earned via online payouts (`online.payout`), welcome-back gift (`welcome.back`), quests. Spent in the clothes
  shop and some catalog pages. Same validation/caps/notify/persist path as Diamonds (`cap_emeralds`).

### Duckets / Pixels (type 0)
- `givePixels` / `getPixels` alias. **Marketplace currency** (`hotel.marketplace.currency = 0`). Duckets delta
  plays the duckets sound client-side (`usePurse.ts`, `parser.type === 0`).

### Season currency (type 103)
- `SeasonCurrency.TYPE`. Paid by season quests / games at the season's amounts. Label via
  `SeasonCurrency.plural()`. Carried in the engagement state packet (OUT 9631) alongside Diamonds/Emeralds.

### HabboCash (type 12) / NFT Points (type 104)
- Website-owned premium currencies. In the game they appear only in the staff grant panel
  (`AdminCurrencyProtocol.TYPES`) and the purse broadcast. No in-game earn/spend path was found server-side.

### Credits (legacy)
- `giveCredits` / `users.credits` still exist and are used by a few stock paths (room bundles, club offers,
  trade "credit furni", marketplace when `MARKETPLACE_CURRENCY == 0`). The hotel sets marketplace to type 0 and
  redirects coin redeems to Diamonds, so credits are effectively dormant. **Worth confirming no catalog item
  still prices in credits** (see SECURITY-REVIEW §E).

## Reward subsystems (all server-authoritative)

`hcms-emulator-plugin/engagement/`:
- **LoginStreak** — daily calendar claim. Atomic conditional UPDATE guards against double-claim
  (`LoginStreak.java:136-141`). Pays via `Wallet.give`.
- **Engagement** — online minute payouts (capped), online chests (`chest_max`/day, `openChestLocked`
  synchronized), skip price. All amounts/caps from `hcms_engagement_settings`.
- **DailyQuests / SeasonQuests / Missions** — reward type+amount from the pool table, paid via `Wallet.give`.
- **HabboPassXp / AchievementXp** — XP tracks.

Client side: `api/engagement/EngagementProtocol.ts`, window in `components/engagement`. The client sends only an
action string (IN 9630: `claim` / `chest` / `chest_skip` / `freeze` / `swap:N`); everything else is computed in
`StateComposer` (OUT 9631).

## Staff grant (in-game)

`admin/AdminCurrencyProtocol.java` (IN 9603 lookup / 9604 change / OUT 9605). Rank 7+ enforced on every packet,
amount bounded to `MAX_AMOUNT = 10,000,000`, reason required, applied under a `SELECT … FOR UPDATE` transaction
with ledger + website notice + `hcms_admin_audit_log` row, then the online balance is corrected and pushed
(`UserCurrencyComposer`). This is the reference implementation for a safe currency mutation. (A sibling
`AdminGiveProtocol`, 9607–9610, grants items — see INVENTORY-MAP.)

## Client display chain

`hooks/purse/usePurse.ts` + `api/purse/Purse.ts`:
- `UserCreditsEvent` (IN 3475) → `purse.credits`.
- `UserCurrencyEvent` (IN 2018) → `purse.activityPoints` map (type → amount).
- `ActivityPointNotificationMessageEvent` (= `UserPointsComposer`, IN 2275) → single-type update + sound.
- Custom `PurseCurrencyColorDataEvent` (IN 9539) → per-currency display metadata (colour/icon), server-controlled
  via `currency/PurseCurrencyColorProtocol.java` (IN 9538 request / OUT 9539).

The purse is **display only**; it has no authority. The emulator re-sends the true balance on every change.
