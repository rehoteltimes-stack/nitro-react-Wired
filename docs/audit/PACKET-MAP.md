# PACKET-MAP.md

Audit date: 2026-10-05. The economy/inventory packets, with real opcode numbers, handler classes and the
client/server split. Opcodes are from `Arcturus-Community-Wired/.../messages/incoming/Incoming.java` and
`.../outgoing/Outgoing.java` (stock) and the `hcms-emulator-plugin` protocol classes (custom, 95xx–96xx).

## How packets are registered

- **Stock:** `PacketManager` maps an opcode constant (from `Incoming.java`) to a `MessageHandler` subclass.
  Each handler reads fields off `this.packet` and may `sendResponse(new SomeComposer(...))`.
- **Custom:** `HcmsPlugin` calls each protocol's `register()`, which does
  `Emulator.getGameServer().getPacketManager().registerHandler(OPCODE, Handler.class)`. Composers extend
  `MessageComposer` and `this.response.init(OPCODE)`.
- **Client:** composers/parsers live in `@nitrots/nitro-renderer` (stock) or in `src/api/**` (custom TS mirrors
  of the 95xx/96xx opcodes).

Client→server values are **selectors**, re-validated server-side. Values the server calculates are marked
**[server]**.

---

## Catalog / purchase

### CatalogBuyItemEvent — buy furni/pet/bot/badge/effect/club
- **Header:** IN 3492 · **Dir:** client→server
- **Source/handler:** `messages/incoming/catalog/CatalogBuyItemEvent.java`
- **Fields:** `int pageId`, `int itemId`, `string extraData`, `int count`
- **Client-supplied:** pageId, itemId, extraData, count. **[server]:** price (`item.getCredits()` /
  `item.getPoints()` + `item.getPointsType()`), discounts, rank/club gates, stock, inventory cap, cooldown.
- **Server effect:** `CatalogManager.purchaseItem(page, item, habbo, count, extraData, false)` — creates items,
  deducts currency, decrements limited stock, logs.
- **Client effect:** `AddHabboItemComposer` (2103), `PurchaseOKComposer` (869), `InventoryRefreshComposer`
  (3151); on failure `AlertPurchaseFailedComposer` / `AlertPurchaseUnavailableComposer` / `AlertLimitedSoldOut`.

### CatalogBuyItemAsGiftEvent
- **Header:** IN 1411 · `messages/incoming/catalog/CatalogBuyItemAsGiftEvent.java`. Same pricing path, recipient
  resolved server-side; *(not re-read line-by-line — flagged)*.

### Club/VIP buy (same opcode 3492)
- Handled inside `CatalogBuyItemEvent` when the page is `ClubBuyLayout`/`VipBuyLayout`. Fields reused.
  **[server]:** days/credits/points summed over `count`, balance checked, subscription extended.

### Supporting (read-only)
- `RequestCatalogIndexEvent` (2529), `RequestCatalogPageEvent` (412), `RequestCatalogModeEvent` (1195),
  `CatalogSearchedItemEvent` (2594), `CatalogSelectClubGiftEvent` (2276), `CatalogRequestClubDiscountEvent`
  (2462), `CatalogBuyClubDiscountEvent` (3407). No currency mutation; display only.

---

## Marketplace (rare economy, type-0 Duckets)

### BuyItemEvent
- **Header:** IN 1603 · **Dir:** client→server · `messages/incoming/catalog/marketplace/BuyItemEvent.java`
- **Fields:** `int offerId`
- **[server]:** price = `MarketPlace.calculateCommision(offer.price)`, state check (must be on-sale), balance
  check, item ownership transfer, currency deduction. Client sends only offerId.
- **Server effect:** `MarketPlace.buyItem(offerId, client)` — moves `items.user_id`, sets offer `SOLD`, charges
  buyer in `MARKETPLACE_CURRENCY` (0).
- **Client effect:** `AddHabboItemComposer`, `InventoryRefreshComposer`, `MarketplaceBuyErrorComposer` (2032,
  also used for REFRESH/UPDATES/SOLD_OUT/NOT_ENOUGH_CREDITS).

### SellItemEvent
- **Header:** IN 3447 · `messages/incoming/catalog/marketplace/SellItemEvent.java`
- **Fields:** `int price`, `int (unused)`, `int itemId`
- **[server]:** ownership (`getHabboItem(itemId)`), `allowMarketplace()`, `price >= 0` (negative → scripter).
  **No maximum price cap** (SECURITY-REVIEW §D).
- **Effect:** `MarketPlace.sellItem(...)` — removes item from inventory, creates offer. `MarketplaceItemPosted`.

### RequestSellItemEvent (848), GetMarketplaceConfigEvent (2597), RequestMarketplaceConfigEvent, RequestOffers/OwnItems/ItemInfo/CreditsEvent, TakeBackItemEvent
- Read-only / offer-management. `TakeBackItemEvent` returns an unsold item to the owner (ownership checked).

---

## Trading

| Packet | Header | Handler | Fields |
|---|---|---|---|
| TradeStartEvent | 1481 | `incoming/trading/TradeStartEvent` | `int userId` (target) |
| TradeOfferItemEvent | 3107 | `…/TradeOfferItemEvent` | `int itemId` |
| TradeOfferMultipleItemsEvent | 1263 | `…/TradeOfferMultipleItemsEvent` | item id list |
| TradeCancelOfferItemEvent | 3845 | `…/TradeCancelOfferItemEvent` | `int itemId` |
| TradeAcceptEvent | 3863 | `…/TradeAcceptEvent` | — |
| TradeUnAcceptEvent | 1444 | `…/TradeUnAcceptEvent` | — |
| TradeConfirmEvent | 2760 | `…/TradeConfirmEvent` | — |
| TradeCloseEvent | 2551 | `…/TradeCloseEvent` | — |
| TradeCancelEvent | 2341 | `…/TradeCancelEvent` | — |

- **[server], all of it:** the handler only names *which* item (by id) to offer; `TradeOfferItemEvent` resolves
  it via `getHabboItem(itemId)` (ownership) and `allowTrade()`, then `RoomTrade.offerItem` removes it from the
  inventory and holds it in the trade. Final swap is `RoomTrade.tradeItems()` on mutual confirm.
- **Client effect:** `TradeStartComposer`, `TradeUpdateComposer`, `TradeAcceptedComposer`,
  `TradingWaitingConfirmComposer`, `TradeCompleteComposer` (2369), `TradeClosedComposer`.
- Both parties must confirm; items re-validated at swap; trade logged to `room_trade_log(_items)`.

---

## Inventory / items

| Packet | Header | Dir | Notes |
|---|---|---|---|
| RedeemItemEvent | 3115 | in | Redeem credit-furni. Hotel overrides to pay **Diamonds** via `NoCredits.onRedeem` (stock redeem cancelled). |
| AddHabboItemComposer | 2103 | out | Batched "unseen" new items (furni/badge/pet/bot). |
| RemoveHabboItemComposer | 159 | out | Item removed from inventory. |
| InventoryRefreshComposer | 3151 | out | Tells client to re-request the furni list. |
| RequestInventoryBadgesEvent | 2769 | in | Badge list request. |
| InventoryBadgesComposer | 717 | out | Owned badges. |

Furni-list (full inventory) request/response are stock `requestfurniture`/`FurnitureListAdd` *(not re-read;
carries limited-edition serial block for LTD items)*.

---

## Currency (outgoing / display)

| Packet | Header | Dir | Fields | Source |
|---|---|---|---|---|
| UserCurrencyComposer | 2018 | out | `int n`, then n×(`int type`, `int amount`) over `seasonal.types` | `outgoing/users/UserCurrencyComposer.java` |
| UserCreditsComposer | 3475 | out | `string credits` | stock |
| UserPointsComposer | 2275 | out | `int balance`, `int amount`, `int type` (single delta + sound) | stock |

Client parsers: `UserCurrencyEvent`, `UserCreditsEvent`, `ActivityPointNotificationMessageEvent` → `usePurse.ts`.

---

## Clothing / look / badges

| Packet | Header | Dir | Fields | Validation |
|---|---|---|---|---|
| SaveWardrobeEvent | 800 | in | `int slot`, `string look`, `string gender` | **none on look content** |
| UserSaveLookEvent | (stock) | in | `string gender`, `string look` | ownership only if `VALIDATE_ON_CHANGE_LOOKS` (currently **off**) |
| RequestUserWardrobeEvent | 2742 | in | — | — |
| UserWardrobeComposer | 3315 | out | wardrobe slots | — |
| UserWearBadgeEvent | 644 | in | badge slots | server re-checks ownership |
| RequestWearingBadgesEvent | 2091 | in | target user | — |
| SaveWardrobeEvent gender | — | — | `HabboGender.valueOf` guarded (scripter on bad value) | — |

---

## Custom hCMS economy/engagement packets (95xx–96xx)

| Packet | Opcodes | File | Purpose / split |
|---|---|---|---|
| EngagementProtocol | IN 9629 state, IN 9630 action, OUT 9631 | `engagement/EngagementProtocol.java` | Daily rewards/chest/quests. Client sends **action string only**; all amounts **[server]**. Rate-limited 500ms. |
| PassProtocol | IN/OUT 9648/9649 | `engagement/PassProtocol.java` | HabboPass state/collect. |
| AdminCurrencyProtocol | IN 9603/9604, OUT 9605 | `admin/AdminCurrencyProtocol.java` | Staff grant/remove currency. **Rank 7+**, amount ≤ 10M, row-locked txn + audit. |
| AdminGiveProtocol | 9607–9610 | `admin/AdminGiveProtocol*` | Staff give item/badge (rank-gated — verify, §F). |
| ClothesShopProtocol | 9501/9502 | `clothesshop/ClothesShopProtocol.java` | Buy clothing for currency. Server-priced, synchronized, refund-on-fail. Client sends `count` + clothing ids only. |
| RarityProtocol | 9540–9543 | `rarity/RarityProtocol.java` | Rare counts/levels (read-only). |
| PurseCurrencyColorProtocol | 9538/9539 | `currency/PurseCurrencyColorProtocol.java` | Currency display metadata (read-only). |
| ProfileWealthProtocol | 9528/9537 | profile | Shows wealth on profile (read-only). |

Full custom-opcode registry: `HcmsPlugin.java` startup log lines (quoted in the file around lines 177–342).

---

## Client→server vs server-calculated — summary

| The client may choose | The server always decides |
|---|---|
| which page/item/offer/user/slot (ids & names) | every price, reward, commission, discount |
| counts / quantities (re-capped server-side) | every balance check and deduction |
| extraData strings (filtered/validated) | stock, LTD serials, limited caps |
| an action string (claim/chest/swap/…) | eligibility, cooldowns, daily caps, VIP multiplier |
| which item id to trade/sell/offer | ownership (via `getHabboItem`), trade/market flags |

No economy or inventory packet accepts a client-supplied amount, balance or price that is used without
server-side recomputation. The exceptions and caveats are in SECURITY-REVIEW.md.
