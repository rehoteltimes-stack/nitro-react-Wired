# Architecture, startup, threads

`core:` = `Arcturus-Community-Wired/src/main/java/com/eu/habbo/`. Verified against source on 2026-10-01 unless marked.

## Repository facts (project-specific)
- Fork: **Arcturus-Community-Wired**, Maven artifact `Habbo` **4.0.3-beta** (`pom.xml`), Java, Netty, HikariCP, Gson, Trove.
  Boot message still says "Arcturus Morningstar".
- The running emulator `hcms-emulator-run/Habbo.jar` is byte-identical to
  `target/Habbo-4.0.3-beta-jar-with-dependencies.jar` (sha1 checked 2026-10-01). Started by
  `hcms-emulator-run/start-emulator.sh` with JDK 21 (`/c/tools/jdk21/...`). Logs: `boot-stdout-new.log`, `boot-stderr-new.log`.
- Recent core commits are a custom Wired engine (variables, write-behind, execution limits). See `wired.md`.
- Top packages: `core` (config, texts, schedulers, CleanerThread, DatabaseLogger), `database`, `habbohotel/*` (game
  domains), `messages` (packets, RCON), `networking` (gameserver, rconserver, camera), `plugin` (plugin API + events),
  `threading`, `crypto`, `util`.
- `sqlupdates/` holds stock upgrade SQL (up to `Update 3_5_4 to 3_5_5.sql`). There are no migrations: plugins create
  their own tables at boot.

## Startup order (`core:Emulator.main`)
1. Logging, `ConfigurationManager("config.ini")`, crypto.
2. `Database` (Hikari) + `DatabaseLogger`, then `config.loadFromDatabase()` (`emulator_settings`).
3. `ThreadPooling(runtime.threads)`; pool size = threads×2.
4. **`PluginManager.reload()`**: loads every `plugins/*.jar` and calls `onEnable()`, **before** the game exists.
   Then fires `EmulatorConfigUpdatedEvent`.
5. `TextsManager` (`emulator_texts`), `CleanerThread`.
6. `GameServer` / `RCONServer` constructed (not listening yet).
7. `GameEnvironment.load()`: PermissionsManager → HabboManager → HotelView → **ItemManager.load()** (fires
   `EmulatorLoadItemsManagerEvent` first) → Bot, Pet, Guild → Catalog → Room → Navigator → **CommandHandler** → ModTool →
   Achievements → Guides → WordFilter → Crafting → Polls → Calendar → ChatBubbles → WiredCreatorTools → Chests →
   schedulers (credits, pixels, points, gotw) → subscriptions.
8. `gameServer.initializePipeline()` + `connect()`, then RCON. Clients can connect from here on.
9. **`EmulatorLoadedEvent`**, then `isReady = true`.

Consequences:
- In `onEnable()`, `Emulator.getGameServer()` and `getGameEnvironment()` are **null**. Register packets, RCON messages,
  commands and managers in an `EmulatorLoadedEvent` handler (that's what `plugin:HcmsPlugin.onEmulatorLoaded` does).
- The websocket port opens before `EmulatorLoadedEvent`. A client logging in during that window can be dropped
  silently (seen 2026-09-30; the client's 15 s login timeout patch covers it).

## Threads / cycles
- `ThreadPooling.getService()` is a scheduled executor shared by everything.
- Each loaded room runs `Room.run()` every **500 ms** (`scheduleAtFixedRate` in room load): `cycleManager.cycle()` under
  `loadLock`, then `save()`.
- `WiredTickService` ticks every 50 ms by default (`wired.tick.interval.ms`, clamped 10-500).
- `CleanerThread`: every 10 s; flushes `DatabaseLogger` every 30 s (command logs, room chat logs, catalog purchase logs are
  batched in memory until then).
- `PacketManager.MULTI_THREADED_PACKET_HANDLING` exists (config). Packets for one client are handled on Netty / pool
  threads, so plugin code must be thread-safe.

## Known Arcturus concepts (generic, still valid here)
- `Emulator` holds the static singletons (`getConfig`, `getDatabase`, `getGameEnvironment`, `getGameServer`,
  `getPluginManager`, `getTexts`, `getThreading`).
- `GameEnvironment` holds the managers; `Habbo` = online player (`HabboInfo` persistent data, `HabboStats`,
  `HabboInventory`, `RoomUnit`).
- Packets: `MessageHandler` incoming, `MessageComposer` outgoing, registered by integer header.
- Plugins: jars with `plugin.json`, `@EventHandler` methods, cancellable events.
- `emulator_settings` / `emulator_texts` drive config and texts; `permissions` holds ranks.

## Project-specific implementation (differs from stock Morningstar)
- `Room` is split into sub-managers: `RoomTileManager`, `RoomUnitManager`, `RoomItemManager`, `RoomRightsManager`,
  `RoomChatManager`, `RoomCycleManager`, `RoomRollerManager`, `RoomTradeManager`, `RoomGameManager`,
  `RoomMessagingManager`, `RoomPromotionManager`, `RoomWordQuizManager` (getters on `Room`). `Room` keeps many
  delegating methods (`talk`, `hasRights`, `isOwner`…). Room data loads in parallel (`CompletableFuture.allOf`).
- Wired is a new engine (`habbohotel/wired/core/WiredManager` + `WiredEngine`). There is no stock `WiredHandler`.
- Event priority (`EventPriority`) is **not used** by dispatch (see `plugins.md`).
- `unregisterCallables(header)` clears **all** headers' callables (bug, see `packets.md`).
