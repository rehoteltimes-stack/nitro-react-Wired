# Furniture, interactions, inventory

## Definitions vs instances
- `items_base` → `core:habbohotel/items/Item` (definition: sprite_id, size, stack height, sit/lay/walk flags,
  `interaction_type`, `interaction_modes_count`, `multiheight`), loaded once by `ItemManager.loadItems()` at boot.
  Reload with `:update_items`.
- `items` → `core:habbohotel/users/HabboItem` (instance: owner `user_id`, `room_id`, x/y/z/rot, wall_pos,
  `extra_data` = state, `limited_data` "stack:number").
- Each interaction is a subclass of `HabboItem` in `habbohotel/items/interactions/` (99 entries there, plus 186 Wired
  classes under `interactions/wired/`).

## Interaction registry (`ItemManager`)
- `interactionsList` maps the `items_base.interaction_type` string to its class (`loadItemInteractions()`, e.g.
  `"gate"` → `InteractionGate`).
- `EmulatorLoadItemsManagerEvent` fires at the start of `ItemManager.load()`, **before** the built-in list is filled.
  Plugins add custom interactions there with `ItemManager.addItemInteraction(new ItemInteraction(name, Class))`, which
  throws if the name or class is already used (built-ins are added without that check).
- Override points on `HabboItem`: `canWalkOn`, `isWalkable`, `onClick`, `onWalk`, `onWalkOn`, `onWalkOff`, `onMove`,
  `onPlace`, `onPickUp`, `serializeExtradata`. Read the base class before overriding.

## Persistence
- `HabboItem.needsUpdate(true)` + `Emulator.getThreading().run(item)` → `HabboItem.run()` writes
  `UPDATE items SET user_id, room_id, wall_pos, x, y, z, rot, extra_data, limited_data` (`needsDelete` → `DELETE`).
- New items: `ItemManager.createItem(userId, baseItem, limitedStack, limitedNumber, extradata)` inserts the row right away.
- Placement and stacking are checked server-side in `Room` / `RoomItemManager` (`FurnitureMovementError`).

## Inventory
- `HabboInventory` → components in `habbohotel/users/inventory/`: `ItemsComponent`, `BadgesComponent`, `BotsComponent`,
  `PetsComponent`, `EffectsComponent`, `WardrobeComponent`.
- Ownership: handlers look items up in the player's own `ItemsComponent.getHabboItem(id)` (inventory) or check
  `room.hasRights` / owner for room items. Trading re-checks ownership at confirm (`economy.md`).
- After a DB-only change (website), the in-memory inventory is stale. This project syncs it with
  `plugin:sync/PlayerRefresh` (RCON `hcmsrefresh`).

## Events
`FurniturePlacedEvent`, `FurnitureMovedEvent`, `FurnitureRotatedEvent`, `FurniturePickedUpEvent`, `FurnitureToggleEvent`,
`FurnitureRedeemedEvent` (coins; this project's `plugin:economy/NoCredits` cancels credit redeems and pays Diamonds),
`FurnitureDiceRolledEvent`, `FurnitureStackHeightEvent`, `FurnitureBuildheightEvent`, `InventoryItem(s)Added/RemovedEvent`.

## Project-specific
- Custom `conf_*` interactions in the core (`conf_invis_control`, `conf_area_hide`, `conf_wired_disable`,
  `conf_handitem_block`).
- `sprite_id = items_base.id` for every furni (data rule set 2026-09-27; FurnitureData is keyed the same way).
- The Furni Editor plugin edits `items_base` and refreshes the loaded `Item` in place with `Item.update(ResultSet)`.
