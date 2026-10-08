# Debugging recipes and known traps

## Where to look
- Boot/runtime logs: `hcms-emulator-run/boot-stdout-new.log`, `boot-stderr-new.log` (plus `emulator-*.log`). Plugins
  log a "registered" line per protocol. Missing = registration failed (often an exception in `onEmulatorLoaded`).
- `debug.mode` (emulator_settings) turns on DEBUG logging **and stops SSO tickets from being cleared**. Never leave it on
  in production.
- `PacketManager.DEBUG_SHOW_PACKETS` logs dropped/ratelimited packets.

## Symptom → likely cause
| Symptom | Check |
|---|---|
| Client request does nothing, no error | header not registered (plugin didn't load / registered too early in `onEnable`), handler needs auth, ratelimit, a callable cancelled it, exception caught in `handlePacket` (search the log for "Caught exception") |
| Client never gets the reply | `OutgoingPacketEvent` listener cancelled or replaced it; reply string over 65 KB; client parser not registered (client-side hook-ordering bug) |
| Plugin event handler never runs | method not on the plugin instance and not static; handler typed for a parent event class (exact-class dispatch); event fired before your plugin registered |
| Feature works, then is undone | another plugin cancels later (priority ignored); `HabboInfo.run()` overwrote a DB edit; room save overwrote tile changes |
| Website change not visible in game | in-memory cache (balances, inventory, rank, items_base, catalog, permissions, texts). Use RCON `hcmsrefresh` or the reload commands (`:update_items`, `:update_catalogue`, `:update_config`, `:update permissions`) |
| "Header already registered" at boot | opcode clash; pick a free number (grep core + all plugins + client) |
| Boot hangs | DB pool exhausted by nested connections (jstack the java process) |
| Command silently becomes chat | missing permission column/value, key not in `commands.keys.*`, rank lacks it |
| Login stuck after restart | client connected while the emulator was still booting; SSO already spent |

## Root-cause discipline
Find the first point where the data is wrong (packet bytes → handler input → manager state → DB → outgoing composer).
Fix it there, then re-run the whole flow. Don't patch a later symptom.

## Safe experiments
Read-only DB queries, reading core source, client-side CDP checks. A plugin deploy or emulator restart disconnects
everyone online: **ask first**.
