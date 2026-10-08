---
name: custom-plugins
description: Our own additions on top of Arcturus and Nitro - the hcms-* Java plugins (hcms-emulator-plugin, hcms-shop "Presence", hcms-feedback, hcms-furnieditor-plugin, hcms-buildermode-plugin), their custom protocols (opcodes 95xx-96xx), engagement (online payouts, login streak, chests, daily quests, HabboPass XP, achievements), economy helpers (Wallet, Diamonds/Emeralds/Snowflakes, no-credits), staff systems (Staff Tools, staff PIN, staff feed, security incidents, prison, trade bans), feedback bubbles, mentions, room settings enforcement, reconnect tickets and the hCMS <-> emulator bridge. Use whenever a task touches any of these or adds a new custom feature, packet or plugin table.
---

# Custom plugins (our additions)

Paths: `plugin:` = `c:/inetpub/wwwroot/hcms-emulator-plugin/src/main/java/com/hcms/emulatorplugin/`. The other
plugins are next to it (`hcms-shop/server`, `hcms-feedback`, `hcms-furnieditor-plugin`, `hcms-buildermode-plugin`).
Each plugin folder has a short `CLAUDE.md`.

## Base vs custom vs extension
- **BASE**: Arcturus core behaviour (`arcturus-emulator` skill). Not ours, never edited.
- **EXTENSION OF BASE**: our code that changes stock behaviour through hooks. Examples: `registerCallable` gates
  (room settings, staff PIN, prison), `OutgoingPacketEvent` rewrites (sanction info fix, feedback bubbles, follow
  feedback), event listeners (NoCredits on `FurnitureRedeemedEvent`, UpperCaseHeights on `RoomLoadedEvent`),
  `UserExecuteCommandEvent` interceptions (`:enable vip`, `:faceless`).
- **CUSTOM**: whole new systems with their own opcodes and tables (engagement, Presence, staff tools, Furni Editor…).

## Rules
- New feature = plugin code + client code, never core. Register everything in `EmulatorLoadedEvent`.
- Grep a new opcode in core, all plugins and the client before using it. The highest used today is 9675 (Video TVs); 9565 is free
  (a reverted feature).
- Every handler re-checks rank, ownership, price, balance and cooldown from server data. Staff opcodes go on the
  `staffpin/StaffPin` block list.
- Money in the game goes through `engagement/Wallet.give` (ledger row). No new balance writers. See
  `references/economy-engagement.md`.
- Tables: `CREATE TABLE IF NOT EXISTS`, `INSERT IGNORE` seeds, settings/texts via `register()`. Never overwrite admin edits.
- New plugin or restructure: follow `references/plugin-structure.md`. Search existing plugins first; extend the owner.
- Commands: search every registration (core `CommandHandler`, `HabboCityCommands`, other plugins, `emulator_texts
  commands.keys.*`), extend the existing one, register with a permission column, remove obsolete duplicates once
  references are checked.
  Emotes in `HabboCityCommands`: `emote(...)` (single target, optional friends-only/range, optional `Mass` for
  `<cmd> all`), `toAllFriends(Mass)` for the `*friends` aliases, `flashEffect`, `cooldownOk`. Reference for fun/RP
  commands: our old `LTDWEB/LTD Emulator + LTDUI/ltdcms-plugin` source (`rp/`).
- Zero comments in new code. Build with mvn; deploy only after the user approves.

## References (load only what you need)
| File | Covers |
|---|---|
| `references/plugin-structure.md` | canonical plugin layout, naming, per-plugin deviations, responsibility rules |
| `references/protocols.md` | opcode map per feature, client file for each, conventions |
| `references/economy-engagement.md` | Wallet, currencies, payouts, streak, chests, quests, HabboPass XP, achievements, the two reward authorities |
| `references/staff-security.md` | Staff Tools, PIN, staff feed, duty, incidents/security modes, prison, trade ban, admin give/currency |
| `references/integration.md` | hCMS ↔ emulator: RCON, outbox, PlayerRefresh, GameEventBridge, VIP sync, shared tables |
| `references/features.md` | Presence (hcms-shop), feedback, Furni Editor, Builder Mode, mentions, chat reactions, room settings, reconnect, profile/identity, others |

## Coordination
Routed by `project-workflow`. When a change crosses into another layer, load that layer's skill too (routing table
there). Ops rules (schedulers, economy config, QA, deploy, CDN, cleanup, docs): `project-workflow/references/operations.md`.
Record new architecture facts in this skill's references.
