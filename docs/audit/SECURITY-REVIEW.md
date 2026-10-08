# SECURITY-REVIEW.md — economy & inventory trust boundaries

Audit date: 2026-10-05. Method: read the actual handlers/services (see PACKET-MAP / ECONOMY-MAP / INVENTORY-MAP
for file:line). This reviews whether the **server** is authoritative for every valuable operation. Findings are
ranked; each says what was checked and whether it is a real exposure or a note.

## Verdict

The server is authoritative across the board. No economy or inventory handler trusts a client-supplied **amount,
price or balance**. Prices/rewards come from DB/config; ownership is resolved through `ItemsComponent.getHabboItem`
(forged ids return null → abort); balances are checked before every deduction; the custom handlers add
rate-limits, row locks, transactions and audit logging. The findings below are **one config-dependent gap
(clothing)**, a **missing price cap**, and **data-hygiene / consistency notes** — not currency-dup or
balance-forgery holes.

---

## A. Clothing ownership is not enforced on look change — MEDIUM (config)

- **Where:** `UserSaveLookEvent` (stock) gates the ownership check behind
  `ClothingValidationManager.VALIDATE_ON_CHANGE_LOOKS`, which is `false`
  (`clothingvalidation/ClothingValidationManager.java:20,37`); DB confirms
  `hotel.users.clothingvalidation.onchangelooks = 0` (also onlogin/onmimic/onmannequin/onfballgate = 0).
  `SaveWardrobeEvent` (IN 800) stores the look string with no ownership check at all.
- **Why it matters here:** the custom `ClothesShop` (`clothesshop/ClothesShopService.java`) **sells clothing for
  Emeralds/Diamonds** and writes `users_clothing`. But because look changes aren't validated, any client can wear
  any clothing id by sending a raw figure string to `UserSaveLookEvent` — without owning it. The paid ownership is
  cosmetic-only and unenforced. This weakens the clothing economy (a P2W/monetised item that free players can
  simply wear) rather than allowing theft of currency or furni.
- **Trust check results:** amounts ✔ (shop is server-priced), ownership ✘ (not enforced on wear),
  duplicate ✔ (ALREADY_OWNED guard in the shop).
- **Options:** (1) accept it as a deliberate open-wardrobe hotel (then the clothes shop is a convenience/vanity
  unlock, document that); or (2) set `hotel.users.clothingvalidation.onchangelooks = 1` and verify HabboCity's
  imported figure sets all exist in `users_clothing`/figuredata so legitimate players aren't stripped. Decide per
  the "monetised but fair to free players" principle — currently it leans *too* free for a sold item.

## B. Catalog purchase — SERVER-AUTHORITATIVE (verified, no action)

`CatalogBuyItemEvent` (IN 3492) + `CatalogManager.purchaseItem`:
- price **[server]** from `item.getCredits()/getPoints()/getPointsType()`; `calculateDiscountedPrice` server-side.
- balance checked (`getCredits()-total < 0`, `getCurrencyAmount(type)-total < 0`) **before** deduction.
- `count <= 0` rejected; `amount * item.getAmount() > 100` rejected; bulk-without-offer → scripter alert.
- rank gate, club-only gate, inventory cap (10000), purchase cooldown (`CatalogManager.PURCHASE_COOLDOWN`),
  re-entrancy flag `isPurchasingFurniture`.
- LTD: `amount` forced to 1, sold-out check, per-day caps, serial assigned server-side.
- Deduction skipped only for `ACC_INFINITE_CREDITS/POINTS` permissions (staff) — correct.

## C. Trading — SERVER-AUTHORITATIVE (verified, no action)

`RoomTrade` + trading handlers:
- offered item resolved via `getHabboItem(itemId)` (ownership) and `allowTrade()` (`TradeOfferItemEvent`); a
  forged/unowned id aborts.
- offered items are pulled from the owner's component immediately (`offerItem` line 63); at confirm,
  `tradeItems()` re-checks each item is no longer duplicated in the component before swapping.
- both parties must `confirm()`; swap runs once; `items.user_id` reassigned in a batch; logged to
  `room_trade_log(_items)`.
- "credit furni" worth is read from the item (`getCreditsByItem`), not the client.

## D. Marketplace sell has no maximum price — LOW

- **Where:** `SellItemEvent` (IN 3447) rejects `credits < 0` (scripter) but there is **no upper bound**;
  `MarketPlace.sellItem` only checks `price < 0`.
- **Impact:** a user can list at an absurd price. Not an exploit (nobody is forced to buy, commission is
  calculated server-side at buy time), but it enables junk/trolling listings and odd economy signals.
- **Buy side is safe:** `BuyItemEvent` (IN 1603) takes only `offerId`; price, state and balance are all
  recomputed server-side in `MarketPlace.buyItem`.
- **Suggestion:** add a `hotel.marketplace.max.price` check in `SellItemEvent`, mirroring the negative check.

## E. Legacy credits still wired — DATA-HYGIENE

- `giveCredits`/`users.credits` and `MARKETPLACE_CURRENCY == 0 ? credits` branches remain in stock paths (room
  bundles, club offers, trade credit-furni, marketplace fallback). The hotel sets `hotel.marketplace.currency = 0`
  (Duckets) and redirects coin redeems to Diamonds (`NoCredits`), so credits are dormant.
- **Risk:** not a vulnerability. A catalog/bundle item still priced in credits would be **unbuyable** (players
  have 0 credits → balance check blocks it), not free — but it's a silent failure.
- **Suggestion:** audit `catalog_items`/`catalog_club_offers`/room bundles for any row with `credits > 0 AND
  points = 0`; convert to Diamonds. Confirms the "no credits" model end to end.

## F. Staff grant / give — SERVER-AUTHORITATIVE (verified, no action)

- `AdminCurrencyProtocol` (9603/9604): **rank 7+** on every packet (`allowed()`), `amount != 0` and
  `|amount| <= 10,000,000`, reason required, `SELECT … FOR UPDATE` + transaction, ledger + website notice +
  `hcms_admin_audit_log`, overflow guard (`next > Integer.MAX_VALUE`), underflow guard (`next < 0`), online
  balance corrected and pushed. Reference-quality.
- `AdminGiveProtocol` (9607–9610): reuses the same `AdminCurrencyProtocol.allowed()` rank-7 gate on each handler.

## G. Reward claims — SERVER-AUTHORITATIVE (verified, no action)

`engagement/*` via `EngagementProtocol` (IN 9630 action string only, rate-limit 500ms):
- **daily claim:** double-claim blocked both by the in-memory `claimedToday` flag **and** an atomic conditional
  `UPDATE … WHERE claimed_day <> today` (rowcount 0 ⇒ already claimed) — race-safe (`LoginStreak.java:127,136-141`).
- **online payout / chest:** daily caps (`cap_diamonds`, `cap_emeralds`, `chest_max`), `openChestLocked`
  synchronized, chest readiness and skip-price balance enforced; counters persisted per day so a relog can't reset
  caps (`Engagement.counters` loads from DB).
- **freeze / swap:** balance and per-day limits checked server-side.
- all payouts flow through `Wallet.give`, so amounts are config-driven and ledgered.

## H. Rate-limiting & duplicate-request protection — GOOD

- Catalog: `PURCHASE_COOLDOWN`. Engagement action: 500ms. Admin change: 500ms. Clothes buy: 1000ms, max 20/order,
  distinct-id check. Re-entrant purchase blocked by `isPurchasingFurniture`. Chest open synchronized.

## I. Ledger consistency — NOTE (for future code)

`HabboInfo.addCurrencyAmount/setCurrencyAmount` and `Habbo.givePoints/giveCredits` mutate balance **without**
writing `hcms_economy_transactions`. Only `Wallet.give/record/giveOffline` and the admin path write the ledger.
**Rule for new economy code:** always go through `Wallet` (or replicate its ledger write) so the website economy
dashboard and player history stay complete. Stock paths (catalog/trade/marketplace) do not ledger to
`hcms_economy_transactions` today — if full economic observability is wanted, those are the gaps to close
(they still write `catalog_purchase_log` / `room_trade_log` / `marketplace_*`).

---

## Checklist requested in the brief

| Validated server-side? | Result |
|---|---|
| amounts | ✔ never from client (prices/rewards from DB/config) |
| item IDs | ✔ resolved via `getHabboItem` / catalog lookup; forged → abort |
| quantities | ✔ `count<=0` rejected, ×100 cap, LTD forced to 1, order caps |
| ownership (furni/trade/sell) | ✔ `getHabboItem`; trade/market flags checked |
| ownership (clothing on wear) | ✘ **not enforced** with current config (§A) |
| catalog prices | ✔ server-side, discounts server-side |
| reward eligibility | ✔ cooldowns, daily caps, atomic claim (§G) |
| trade ownership | ✔ (§C) |
| VIP status | ✔ `hasActiveClub()` / rank for gates; subscription created server-side |
| duplicate operations | ✔ atomic claim, synchronized chest, purchase re-entry flag |
| repeated requests | ✔ rate-limits + cooldowns (§H) |
| malformed values | ✔ gender/number parsing guarded, scripter alerts |
| negative values | ✔ rejected (purchase, sell, grant underflow) |
| excessively large values | ✔ amount caps (grant 10M, purchase ×100); **marketplace sell price uncapped (§D)** |

## Recommended actions (priority order)

1. **Decide the clothing model (§A).** Either enforce `onchangelooks = 1` (after verifying imported figure data)
   or formally treat clothing as an open/vanity unlock and reprice/retire the clothes shop accordingly.
2. **Cap marketplace sell price (§D).**
3. **Sweep catalog data for credit-priced items (§E).**
4. **Keep all new payouts on `Wallet` (§I);** consider ledgering stock catalog/trade/marketplace if full economy
   observability is a goal.
