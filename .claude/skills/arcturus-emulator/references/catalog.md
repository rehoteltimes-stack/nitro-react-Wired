# Catalog purchase flow

Files: `core:messages/incoming/catalog/CatalogBuyItemEvent`, `core:habbohotel/catalog/CatalogManager.purchaseItem`,
`CatalogItem`, `CatalogPage`, `CatalogLimitedConfiguration`, `CatalogPurchaseLogEntry`.

## Flow (verified 2026-10-01)
1. Client sends `pageId, itemId (offer), extraData, count`.
2. `CatalogBuyItemEvent` resolves the page and item **from server state**: by page, or by `getCatalogItem(itemId)` +
   `offer_id` for search purchases. Club offers, gifts and special pages have their own branches.
3. `purchaseItem(page, item, habbo, amount, extradata, free)`:
   - `isPurchasingFurniture` flag (one purchase at a time per player), club-only check, `amount > 0`;
   - LTD: daily per-item/total limits, a number from `CatalogLimitedConfiguration`;
   - price = `calculateDiscountedPrice(item.getCredits()/getPoints(), amount, item)` from DB values. If the balance is
     too low it **returns silently** (the client gets no error from this branch);
   - items, bots, pets and badges are created (`ItemManager.createItem` **inserts rows before payment**);
   - `UserCatalogItemPurchasedEvent(habbo, item, itemsList, totalCredits, totalPoints, badges)`. Its price fields are
     public, so a plugin can change them;
   - pay: `giveCredits(-total)` / `givePoints(pointsType, -total)` unless `free` or `acc_infinite_credits`;
   - `ItemsComponent.addItems`, `UserCatalogFurnitureBoughtEvent`, `AddHabboItemComposer`, `PurchaseOKComposer`,
     `InventoryRefreshComposer`;
   - `CatalogPurchaseLogEntry` goes to `DatabaseLogger` (table `logs_shop_purchases`, flushed every ~30 s).
4. `CatalogManager.offerDefs` only knows offers whose `catalog_items.offer_id != -1`. This project sets
   `offer_id = catalog_items.id` everywhere (2026-09-27).

## Security notes
- Price and currency type come from `catalog_items`, never from the packet. Good.
- Payment goes through `givePoints`, which fires **`UserPointsEvent`**. A plugin that cancels that event would make
  purchases free. Never cancel it broadly.
- No DB transaction spans item creation + payment. A crash in between leaves items without payment (low risk; know it).

## Reload / data
`:update_catalogue` reloads pages and offers. Prices live in `catalog_items.cost_credits` / `cost_points` /
`points_type`. Project rule (2026-09-29): everything free except VIP and Rares, priced in Diamonds (type 5).

## Importing from other hotels
See `project-workflow/references/catalog-sync.md` (existing pipeline, additive sync into the live catalog,
discovery/approval design). Never re-run `hcms:catalog-stage`/`catalog-swap` on the live catalog without confirmation.

## Generic vs project
Generic: page/offer model, LTD numbers, club offers, vouchers. Project: the catalog data was swapped in from other
hotels, `offer_id` rewrite, and rare rotation / LTD drops driven from hCMS (RCON `updatecatalog`).
