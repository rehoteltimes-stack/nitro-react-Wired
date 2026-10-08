# Rooms

Package `core:habbohotel/rooms/` (41 files + `pathfinding/`).

## Structure (project-specific split)
`Room` (~3,300 lines) owns sub-managers, each with a getter: Tile (heightmap/`RoomTile`), Unit (`RoomUnit`s of
habbos/bots/pets), Item (floor/wall items), Rights, Chat, Cycle, Roller, Trade, Game, Messaging, Promotion, WordQuiz.
`RoomManager` (~1,600 lines) loads, caches and unloads rooms. `RoomLayout` parses the heightmap (stock: `x` = blocked,
`0-9`, `a-z` = 10-35, upper case lower-cased).

## Lifecycle
- Load (`Room.loadData`): data loads in parallel (rights, word filter, bots, pets, wired). Then the 500 ms cycle task is
  scheduled, then trax/jukebox, then `loaded = true`, then **`RoomLoadedEvent`** (items, bots and units already loaded,
  so it's safe to adjust tiles there; `plugin:rooms/UpperCaseHeights` does this).
- Unload: `RoomUnloadingEvent` / `RoomUnloadedEvent` (`Room` ~line 1147); `RoomUncachedEvent` exists too.
- Cycle: `Room.run()` → `cycleManager.cycle()` (units, rollers, wired timers…) under `loadLock`, then `save()`.

## Chat (stock TALK)
`messages/incoming/rooms/users/RoomUserTalkEvent`: `allowTalk()` (mute) → `new RoomChatMessage(this)` → length check →
**`UserTalkEvent`** (cancellable; plugins may also change the message or bubble) → `room.talk(...)` →
`RoomChatManager.talk` (word filter `RoomChatMessage.filter()`, flood, wired "user says", chat log batched by
`DatabaseLogger`). Commands starting with `:` are handled by `CommandHandler` from the chat path. An unknown command or
a missing permission falls through as normal chat.

## Rights
- `RoomRightsManager.hasRights(habbo)` = owner OR in the rights list OR (`RoomUnit` rights level != NONE and in the room).
- `isOwner`, `getGuildRightLevel` (`RoomRightLevels`). The client's controller level comes from `RoomRightsLevelComposer`.
- Permission settings value `2` (`ROOM_OWNER`) in `permissions` = allowed only with room rights (see `permissions.md`).

## Useful events
`UserEnterRoomEvent`, `UserExitRoomEvent`, `HabboAddedToRoomEvent`, `UserTakeStepEvent`, `RoomUnitSetGoalEvent`,
`UserSignEvent`, `UserIdleEvent`, `RoomFloorItemsLoadEvent`, `UserVoteRoomEvent`.

## Trace checklist
Packet handler → `Room` delegate → sub-manager → `RoomUnit` / `RoomTile` state → composer sent with
`room.sendComposer(...)`. Check `RoomTile` z/stackHeight for height bugs, `hasRights` for permission bugs, and the
cycle for timing bugs.

## Generic vs project
Generic: room units, tiles, pathfinding, the 500 ms cycle, rights, rollers. Project: the manager split, parallel load,
loadLock-synchronized cycle (a comment says it's against wired desync), plugin `UpperCaseHeights` (A-Z = 36-61 at runtime).
