---
name: arcturus-emulator
description: Knowledge and workflow for the Arcturus emulator core in this project (Arcturus-Community-Wired 4.0.3-beta, Java) - how the base server works and how plugins hook into it. Use for any server-side Habbo work - packets/protocols, rooms, furniture/interactions, catalog, inventory, currencies/economy, trading, marketplace, permissions/commands/staff, Wired, plugin events, database persistence, startup order, emulator debugging. This is ARCTURUS, not Polaris.
---

# Arcturus Emulator Skill

## Purpose
How to investigate, extend and debug **this** Arcturus fork safely. The details live in `references/`. Open only the
file your task needs.

Paths: `core:` = `c:/inetpub/wwwroot/Arcturus-Community-Wired/src/main/java/com/eu/habbo/`,
`plugin:` = `c:/inetpub/wwwroot/hcms-emulator-plugin/src/main/java/com/hcms/emulatorplugin/`.

## Critical rules
1. **Never edit the core** (`Arcturus-Community-Wired`) without the user's explicit OK for that change. Read it freely. All changes go in a plugin (`hcms-emulator-plugin`, `hcms-shop`, `hcms-feedback`, `hcms-furnieditor-plugin`, `hcms-buildermode-plugin`) or the Nitro client. Approved core changes: `docs/PROJECT_STATE.md` "Core changes". The core is the Wired fork, which differs from Morningstar/Polaris (e.g. its 750 ms walk-through pass on open furni).
2. **Ask the user before deploying a plugin or restarting the emulator.**
3. **The server decides everything of value.** Re-read prices, balances, ranks, ownership and limits from server state in every handler. Never use a value from the packet as truth.
4. Never invent class names, opcodes, columns, config keys or hooks. Grep the core and plugins. If something can't be found, say "unknown".
5. Follow `nitro-react-Wired/PROJECT_WORKFLOW.md`. History is in `docs/PROJECT_STATE.md` (grep, never read whole).

## Scope
This skill covers the **base** emulator and its extension points. Our own systems (engagement, Presence, staff tools,
feedback, custom protocols) are in the `custom-plugins` skill; cross-layer routing is in `project-workflow`.

## Source of truth
Current core + plugin source > DB schema/data (`hcms` MariaDB) > runtime config (`hcms-emulator-run/config.ini`,
`emulator_settings`) > protocol code > project docs > this skill > generic Arcturus knowledge. When this skill and the
source disagree, the source wins; fix this skill.

## Existing knowledge
General Arcturus Morningstar / Habbo emulator knowledge is a useful starting point, but **verify every project-specific
claim in the source**. This fork differs from stock Morningstar in important places (split `Room` managers, a new Wired
engine, write-behind variables, custom interactions). `references/architecture.md` lists generic concepts vs what this
repo actually does.

## Workflow (every non-trivial task)
UNDERSTAND → SEARCH (core + all plugins + client) → TRACE the full flow → COMPARE with known Arcturus concepts → PLAN
(reuse existing events/services/protocols) → IMPLEMENT the smallest change in a plugin → BUILD → TEST (legit + tampered
input) → VERIFY (boot log, DB, live client) → DOCUMENT (`docs/PROJECT_STATE.md`, plus this skill if an architecture fact
was learned).

## Where to look
| Task | Read |
|---|---|
| Startup order, managers, threads, plugin load timing | `references/architecture.md` |
| Packets, Netty/websocket, sessions, composers, gating stock packets | `references/packets.md` |
| Rooms, units, cycle, chat, rights | `references/rooms.md` |
| Furniture, interactions, items persistence, inventory | `references/furniture.md` |
| Catalog purchase flow | `references/catalog.md` |
| Currencies, trading, marketplace, money safety | `references/economy.md` |
| Ranks, permissions, commands, moderation, staff security | `references/permissions.md` |
| Wired engine | `references/wired.md` |
| Plugins, events, RCON, how hcms plugins are wired | `references/plugins.md` |
| DB access, logging, config/text tables | `references/database.md` |
| Debugging recipes and known traps | `references/debugging.md` |

## Packet workflow (short)
Find the opcode in `core:messages/incoming/Incoming.java` / `outgoing/Outgoing.java` (stock) or the plugin's `*Protocol`
class (custom, 95xx-96xx). Find the handler in `core:messages/PacketManager.java` (`register*()`), then trace the
handler → manager → DB → composer. To change stock behaviour, use `registerCallable` + `isCancelled`, an
`OutgoingPacketEvent` substitution, or a plugin event. Never replace the core class.

## Room / catalog / economy / plugin / database workflows
See the matching reference file. Each has a "trace this" checklist.

## Debugging workflow
Find where the failure starts: client, Netty, PacketManager (unregistered / auth / ratelimit), handler, event cancelled
by a plugin, DB, or cache not reloaded. Read `hcms-emulator-run/boot-stdout-new.log` / `boot-stderr-new.log`. See
`references/debugging.md`.

## Verification workflow
- Build a plugin with `/c/tools/apache-maven-3.9.16/bin/mvn -q package` (JDK 21; plugins compile against `libs/Habbo-4.0.3-beta.jar`).
- Deploy only after approval: stop java → copy the jar to `hcms-emulator-run/plugins/` → `start-emulator.sh` → check the boot log for your "registered" line and no new errors.
- Verify in a live client (CDP) and with DB queries. Test a tampered request for anything valuable.

## Keeping this skill current
When a task proves an architecture fact, decide whether it is generic or project-specific, then add it to the right
reference file under that heading. No duplicates, no source dumps. Keep this file short.

## Coordination
Routed by `project-workflow`. When a change crosses into another layer, load that layer's skill too (routing table
there). Ops rules (schedulers, economy config, QA, deploy, CDN, cleanup, docs): `project-workflow/references/operations.md`.
Record new architecture facts in this skill's references.
