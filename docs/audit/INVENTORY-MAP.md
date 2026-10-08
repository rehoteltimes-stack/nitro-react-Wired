# INVENTORY-MAP.md

Audit date: 2026-10-05. Scope: how each owned-item type is defined, stored, given and removed, and where
ownership is validated. Classes/methods named here were read in the repo; stock paths not re-read line-by-line
are marked *(stock)*.

## Inventory container

`HabboInventory` (`habbohotel/users/HabboInventory.java`) holds the per-component inventories. Floor/wall furni:
`ItemsComponent`. Hard cap `HabboInventory.MAXIMUM_ITEMS = 10000`, checked in `CatalogBuyItemEvent.handle()`
(line 50) before a purchase.

`ItemsComponent` (`habbohotel/users/inventory/ItemsComponent.java`):
- `addItem(HabboItem)` : 67
- `addItems(THashSet<HabboItem>)` : 82
- `getHabboItem(int itemId)` : 99 — **the ownership lookup; returns null if the user does not own that id**
- `removeHabboItem(int)` / `removeHabboItem(HabboItem)` : 122 / 126

Every mutation that trusts a client-supplied item id resolves it through `getHabboItem` first, so a forged id
simply returns null and the handler aborts. This is the single most important ownership primitive in the server.

---

## Furni (floor / wall)

| Field | Value |
|---|---|
| Item definition | `items_base` (base item: name, type, interaction, trade/marketplace/recyclable flags). |
| Instance | `items` table → `HabboItem` (id, user_id, item_id, room_id, x/y/z, extradata, limited data). |
| Ownership | `items.user_id`; in-memory in the owner's `ItemsComponent`. |
| Quantity | One row per item (furni are individual, not stacked counts). |
| Give | `ItemManager.createItem(...)` then `ItemsComponent.addItem/addItems`; client told via `AddHabboItemComposer` (OUT 2103) + `InventoryRefreshComposer` (OUT 3151). |
| Remove | `ItemsComponent.removeHabboItem` + `RemoveHabboItemComposer` (OUT 159); DB delete via `QueryDeleteHabboItem`. |
| Validation | `item.getBaseItem().allowTrade()` / `allowMarketplace()` gate trade/market; `getHabboItem(id)` gates ownership. |

Creation paths: catalog purchase (`CatalogManager.purchaseItem`), trade (`RoomTrade.tradeItems`), marketplace
buy (`MarketPlace.buyItem`), gift redeem, staff give (`AdminGiveProtocol`), rewards.

## Rare furni

No separate storage — a "rare" is an ordinary `items` row whose `items_base` is flagged rare. The rare economy
(rotation / counts) is informational: `rarity/RarityProtocol.java` (IN 9540 levels request / 9542 room request,
OUT 9541/9543) and `RarityCount` serve rarity level + how many exist, for the in-game info panel. **Read-only; no
mutation.** Client mirror: `api/rarity/RarityProtocol.ts`. Rotations/LTD drops are owned by the website (see
`hcms` skill, rare economy).

## LTD / limited-edition furni

| Field | Value |
|---|---|
| Limited data | `limitedStack` (total minted) + `limitedSells`/`limitedNumber` (serial) on the `HabboItem`, set at creation (`InteractionDefault` constructor, `limitedStack, limitedSells`). |
| Config/stock | `CatalogLimitedConfiguration` tracks remaining stock; `getLimitedConfig(item).available()`. |
| Give | In `purchaseItem`: if `item.isLimited()` → `amount` forced to 1; sold-out check (`available() == 0` → `AlertLimitedSoldOutComposer`); optional daily caps `hotel.purchase.ltd.limit.daily.total` and `…daily.item` via `habboStats.totalLtds()`. On purchase, `limitedConfiguration.limitedSold(...)` records the serial and `habboStats.addLtdLog`. |
| Serial to client | Carried in the furni-list / add-item serialisation (stock limited-edition data block). |
| Validation | Quantity forced to 1, stock decremented server-side, per-day purchase limits enforced server-side. |

## Badges

| Field | Value |
|---|---|
| Storage | `users_badges`; in-memory `BadgesComponent`. |
| Ownership | `getBadgesComponent().hasBadge(code)`. |
| Give | `new HabboBadge(0, code, 0, habbo)` + `addBadge` + `AddUserBadgeComposer`; from catalog badge items, bundles, rewards, commands. Duplicate guard: `hasBadge` → `ALREADY_HAVE_BADGE`. |
| Wear | `UserWearBadgeEvent` (IN 644) / `RequestWearingBadgesEvent` (2091); slots validated server-side; `UserBadgesComposer` (OUT 1087), `InventoryBadgesComposer` (OUT 717). |
| Validation | Server owns which badges exist; wearing a badge you don't own is rejected (`InteractionBadgeDisplay` path in `purchaseItem` flags a scripter and substitutes `UMAD`). |

## Clothing

| Field | Value |
|---|---|
| Storage | `users_clothing (user_id, clothing_id)`; in-memory `WardrobeComponent.getClothing()` (owned pieces) + `getClothingSets()`. |
| Wardrobe looks | `SaveWardrobeEvent` (IN 800) stores slot/look/gender into `WardrobeComponent` **raw, no ownership check**. |
| Set look | `UserSaveLookEvent` → `ClothingValidationManager.validateLook(...)` **only if `VALIDATE_ON_CHANGE_LOOKS`**. |
| Give | Stock: `RedeemClothingEvent` (clothing-rack furni). Custom: `clothesshop/ClothesShopService.buy(...)` — instant grant, writes the same `users_clothing` + `WardrobeComponent`, charged in Emeralds/Diamonds (price from DB, server-side). |
| Client | Clothes shop protocol `ClothesShopProtocol` (IN 9501 buy / request, OUT 9502); `UserClothesComposer` on grant. |
| Validation | **`VALIDATE_ON_CHANGE_LOOKS = false`** and `hotel.users.clothingvalidation.onchangelooks = 0` → clothing ownership is **not** enforced when a player changes look. See SECURITY-REVIEW §A. |

## Effects

| Field | Value |
|---|---|
| Storage | `users_effects`; in-memory `EffectsComponent`. |
| Give | `EffectsComponent.createEffect(effectId)` — from catalog items of `FurnitureType.EFFECT` in `purchaseItem` (gender-specific `getEffectM/F`). |
| Enable | `AvatarEffectActivated`/`…Selected` events *(stock)*; `RoomUserEffectComposer` (OUT 1167), `UserEffectsListComposer` (OUT 340). |
| Validation | Server owns the effect list; enabling an effect you don't own is rejected by the stock effect component. |

## Pets

| Field | Value |
|---|---|
| Storage | `users_pets` → `Pet`; `PetsComponent`. Cap `PetManager.MAXIMUM_PET_INVENTORY_SIZE` (bypass: `ACC_UNLIMITED_PETS`). |
| Give | `PetManager.createPet(...)` in `purchaseItem` (pet layout); name validated (3 parts, alphanumeric, length bounds, `CheckPetNameEvent`). `AddPetComposer` + `PetBoughtNotificationComposer`. |
| Validation | Inventory cap checked before purchase; pet name validated server-side. |

## Bots

| Field | Value |
|---|---|
| Storage | `bots` → `Bot`; `BotsComponent`. Cap `BotManager.MAXIMUM_BOT_INVENTORY_SIZE` (bypass: `ACC_UNLIMITED_BOTS`). |
| Give | `BotManager.createBot(...)` in `purchaseItem` for `rentable_bot_`/`bot_` base items. `AddBotComposer`. |
| Note | Bot *panel* management now runs from the website; client opcodes 9546–9550 are cleanup candidates (see CLAUDE.md). |

## VIP / subscription (membership, not an item but an ownership state)

| Field | Value |
|---|---|
| Storage | `users_subscriptions` via `HabboStats.createSubscription(Subscription.HABBO_CLUB, seconds)`. |
| Buy | `ClubBuyLayout`/`VipBuyLayout` branch in `CatalogBuyItemEvent` (lines 147-198): sums days/credits/points over `count`, checks balance, deducts, extends subscription. |
| State | `hasActiveClub()`; gates club-only catalog items (`item.isClubOnly()`). Website owns `hcms_vip_memberships`. |
| Client | `UserSubscriptionEvent` → `usePurse.ts` (`clubDays`, `isVIP`). |
| Validation | Balance checked before deduction; subscription creation failure rolls the purchase into a `SERVER_ERROR`. VIP rank for engagement = `rank >= vip_rank (2)`. |

## Give / remove notification summary

| Action | Composer (opcode) |
|---|---|
| Add furni/badge/pet/bot (batched, "unseen") | `AddHabboItemComposer` (2103) |
| Remove furni | `RemoveHabboItemComposer` (159) |
| Full inventory refresh | `InventoryRefreshComposer` (3151) |
| Badge list / worn | `InventoryBadgesComposer` (717) / `UserBadgesComposer` (1087) |
| Clothing | `UserClothesComposer` |
| Effects | `UserEffectsListComposer` (340) / `RoomUserEffectComposer` (1167) |

## Not individually re-read (flagged for completeness)

Gift wrapping/opening, recycler/ecotron, crafting, trophies text filtering internals, mannequin/mimic clothing
paths, and the pet/bot full lifecycle were seen only where they intersect `purchaseItem`/trade. They are stock
Arcturus and should be spot-checked if they become economically relevant.
