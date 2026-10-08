# Plugins, events, RCON

## Loading (verified, `core:plugin/PluginManager`)
- Every `plugins/*.jar` gets its **own `URLClassLoader`**. It must contain `plugin.json` (`main`, `name`, `author`).
  The main class extends `HabboPlugin` (`onEnable`, `onDisable`, `hasPermission`).
- Loaded in `PluginManager.reload()`, **before** the game environment and game server exist (see `architecture.md`).
- Separate class loaders ⇒ one plugin can't import another's classes. Cross-plugin calls use reflection through the
  other plugin's class loader (`plugin:sync/PlayerRefresh` → hcms-shop).

## Events
- `registerEvents(plugin, listener)` collects `@EventHandler` methods with one `Event` parameter from the listener class.
- `fireEvent(event)`:
  1. the core's static default handlers (`registerDefaultEvents`: RoomTrashing, TagGame, FreezeGame, FootballGate,
     WiredManager…);
  2. then every plugin, in **undefined order** (THashSet), every method registered for the **exact class**
     `event.getClass()`. A handler for a parent event class is not called for subclasses.
- It calls `method.invoke(plugin, event)`: the **plugin instance** is the target. A handler method on a separate listener
  object only works if it is `static`. That's why `plugin:HcmsPlugin` registers itself (`registerEvents(this, this)`).
- `@EventHandler(priority)` exists but is **ignored**. Every handler runs even after another cancelled the event. Check
  `isCancelled()` yourself. To act only on a final, uncancelled event, re-check later (project helper
  `HcmsPlugin.counted()`, 50 ms delay).
- Cancellable base: `plugin/Event` (`setCancelled`). Most events expose public fields that handlers can change.
- Event packages under `core:plugin/events/`: bots, emulator (Loaded, ConfigUpdated, LoadItemsManager,
  LoadCatalogManager, StartShutdown, Stopped, OutgoingPacket, SSOAuthentication), furniture (+wired), games, guilds,
  inventory, marketplace, navigator, pets, rooms, roomunit, sanctions, support, trading, users (Login, Disconnect,
  Registered, Talk, ExecuteCommand, Credits, Points, RankChanged, NameChanged, SavedLook/Motto/Settings, Respected,
  TriggerWordFilter, EnterRoom, ExitRoom, TakeStep, Sign, Idle, …).

## RCON
`core:networking/rconserver/RCONServer` on `rcon.host:rcon.port` (127.0.0.1:30001, `rcon.allowed`). It takes JSON
`{key, data}`. Plugins add commands with `Emulator.getRconServer().addRCONMessage(key, Class<? extends RCONMessage>)`.
hCMS calls it through `app/Support/EmulatorRcon.php`. Project keys include `hcmsrefresh`, `botpanel`,
`furnieditorrevert`, plus stock ones (`alertuser`, `givebadge`, `givecredits`, `updatecatalog`…).

## How the hcms plugins are built (project pattern)
- `plugin:HcmsPlugin`: `onEnable` registers events; **`onEmulatorLoaded`** adds commands (`CommandHandler.addCommand`),
  registers protocols (`XProtocol.register()` → `registerHandler`), callables, RCON keys, schedulers. 32 feature
  packages: engagement, economy, staffpin, stafffeed, security, prison, sync, reconnect, mentions, roomsettings, …
- Tables: `CREATE TABLE IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS`, seeds with `INSERT IGNORE`, settings via
  `Emulator.getConfig().register(key, default)` and texts via `Emulator.getTexts().register(key, default)` (both insert
  only if missing).
- Other plugins (`hcms-shop`, `hcms-feedback`, `hcms-furnieditor-plugin`, `hcms-buildermode-plugin`) follow the same shape.
  Each has its own `CLAUDE.md`.
- Build against `libs/Habbo-4.0.3-beta.jar` (system-scope dependency in each `pom.xml`).

## Checklist for a new hook
1. Grep `core:plugin/events` for an event that fires exactly where you need it, and read the firing site (is it before
   or after the action, is it cancellable, which fields are used afterwards).
2. If none: `registerCallable` on the incoming header, or `OutgoingPacketEvent`.
3. Register in `EmulatorLoadedEvent`. Clean up in `onDisable` (two-argument `unregisterCallables`).
4. Log a "registered" line so the boot log proves it loaded.
