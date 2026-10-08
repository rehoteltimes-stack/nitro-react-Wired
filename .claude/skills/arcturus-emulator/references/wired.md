# Wired (project-specific engine)

This fork replaced stock Arcturus Wired (`WiredHandler`, which no longer exists) with its own engine. Recent core
commits: "harden execution cycles, temp variables, stacked extras", "write-behind system for all permanent variables".

## Layout (`core:habbohotel/wired/`)
- `api/`: `IWiredTrigger`, `IWiredCondition`, `IWiredEffect`, `IWiredSelector`, `IWiredVariable`, `WiredStack`,
  `WiredTextPlaceholderProvider`.
- `core/`:
  - `WiredManager` (static facade): `initialize()` on `EmulatorLoadedEvent`, `handleEvent`, `trigger*` helpers such as
    `triggerUserWalksOn/Off`, `triggerUserSays`, `triggerUserPerformAction`, `triggerUserEntersRoom`;
  - `WiredEngine` (executes stacks, step limits, recursion depth, per-room rate limits and bans);
  - `WiredContext` / `WiredEvent` / `WiredState`;
  - `RoomWiredStackIndex` (stacks per room);
  - movement, mouse-hold, signal antenna, timers, placeholders, usage tracking.
- `tick/WiredTickService` (+ `WiredTickable`): 50 ms default tick (`wired.tick.interval.ms`, 10-500).
- `variables/`: variable store, write-behind persistence (`WiredVariablePersistence`, `migrate/`).
- `creator/`: Wired Creator Tools (inspection, logs, room stats; `WiredCreatorToolsCatalogManager` loads in GameEnvironment).
- `highscores/`.
- Furni classes: `core:habbohotel/items/interactions/wired/{triggers,conditions,effects,selectors,extra,variables,
  interfaces,utils}` (186 files), plus `WiredSettings`, `WiredTriggerReset`.
- Config keys: `wired.engine.enabled`, `wired.engine.exclusive`, `wired.engine.maxStepsPerStack`,
  `wired.engine.maxStepsPerExecution`, `wired.engine.maxEventsPerWindow`, `wired.engine.debug`.
- Incoming Wired packets: `PacketManager.registerWired()`.

## Where new gameplay goes
- A new trigger/effect/condition box is a core change. **Not allowed here** (core is read-only). Gameplay features go in
  plugins as room events, commands or interactions, and can call `WiredManager.trigger*` / `handleEvent` to feed
  existing Wired. UNVERIFIED: whether a plugin can register new box types without core changes (no registry API was found
  in this pass; check `ItemManager.addItemInteraction` with a class implementing the `api/` interfaces before claiming it).

## Generic vs project
Generic: trigger → condition → effect stacks on the same tile, saved settings per box. Project: everything above
(selectors, variables, ticks, engine limits) is fork-specific. Don't apply stock Morningstar Wired knowledge without
reading `wired/core` first.
