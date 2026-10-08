---
name: project-workflow
description: Master coordination skill for the Habbo.nz hotel project (Nitro React client, Arcturus emulator, hcms-* Java plugins, hCMS Laravel site, shared MariaDB). Use it at the start of EVERY task in this project - features, fixes, UI, economy, VIP, quests, games, staff tools, marketplace, deployment - to decide which layers and which other skills (nitro-ui, arcturus-emulator, custom-plugins, hcms, retro-source) are involved and to run the cross-system workflow - including scheduled systems, economy configuration, testing/QA, deployment, CDN/assets, Cloudflare (DNS, cache purge, SSL, ws.habbo.nz), furni asset resolution and PNG previews (nitro2png/swf2png), seasonal/retro research routing, pipeline notes and skill-gap checks, cleanup of obsolete code and documentation updates.
---

# Project workflow (master skill)

Read `c:/inetpub/wwwroot/nitro-react-Wired/PROJECT_WORKFLOW.md`, the operating manual. This skill adds the routing:
which layers a request touches and which skill to load for each one.

## Global standard
- Follow this skill system. **Zero comments in new code**. No commented-out, debug, unused or temporary code. Docs go
  in `docs/PROJECT_STATE.md` / skill references.
- The client is never trusted. The server (plugin/emulator or hCMS) decides currencies, balances, prices, purchases,
  ownership, rewards, quests, VIP, HabboPass, chests, marketplace, trading, games, staff permissions, moderation.
- Never edit `Arcturus-Community-Wired`. HabboCity and other hotels are read-only references. Deploys and restarts follow
  the environment policy (CLAUDE.md, user 2026-10-01): development = automatic, production = approval; destructive/mass
  SQL and mass economy changes always need approval.
- Don't load big docs whole: `docs/PROJECT_STATE.md` (client 620 KB, hCMS 460 KB). Grep headings/keywords. Load only the
  skill references a task needs.

## Source of truth
Current source > DB schema/data > runtime config > protocol code > PROJECT_WORKFLOW.md > skills > PROJECT_STATE.md >
history. If a skill disagrees with the source, fix the skill.

## The system (one picture)
```
Browser ── hCMS website (Laravel, https://dev.habbo.nz / habbo.nz)  ── /hotel iframe ──┐
                │  writes DB, then RCON hcmsrefresh / outbox                            ▼
                │                                         Nitro client (play.habbo.nz, React + patched renderer)
                ▼                                                     │ websocket (NitroWebsockets plugin)
         MariaDB `hcms`  ◄────────────────────────────  Arcturus core (read-only) + hcms-* plugins (Java)
```
Online players live in emulator memory (balances, inventory, rank). Website writes must be pushed into the game.

## Routing: which layers, which skill
| Request touches… | Layer | Skill |
|---|---|---|
| A window, button, toolbar, purse, any visual | Nitro client | `nitro-ui` |
| New client↔server message | protocol, both halves | `nitro-ui` + `custom-plugins` |
| Game rules in rooms, furni, catalog, trade, chat, commands, stock packets | emulator core behaviour | `arcturus-emulator` |
| Our features: Presence shop, engagement/quests/HabboPass XP, staff tools/PIN/feed/security/prison, feedback, Furni Editor, economy helpers | our plugins | `custom-plugins` |
| Website pages, Center, values, market/auctions, VIP club, HabboPass season, admin panel (Filament), payments | hCMS | `hcms` |
| Currency/money anywhere | economy, every layer it touches | `custom-plugins` (Wallet) + `hcms` (EconomyService) + `arcturus-emulator` (economy.md) |
| Staff/admin | permissions + staff code exposure | `arcturus-emulator` permissions + `custom-plugins` staff + `hcms` admin + `nitro-ui` exposure |
| "Like other retros do", new game/economy/VIP/event ideas, furni names/translations, hotel comparisons | external research (never authoritative) | `retro-source` |
| "Research new retro features", "what does HabboCity have that we don't" | research → compare with our systems → suggestions (no code) | `retro-source` (`retro-source/references/feature-discovery.md`) |
| "What is new for the next season?", Habbo.com campaigns, new/returning official furni | official research → reconcile with `items_base`/catalog → suggestions | `retro-source` (`retro-source/references/official-sources.md`, `retro-source/references/seasonal-intelligence.md`) |
| "Prepare the next (seasonal) catalog" | official research, then the existing catalog pipeline, assets, validation, approval | `retro-source` (`retro-source/references/seasonal-intelligence.md`) → `references/catalog-sync.md` |
| "What's new in Habbo development?" (sandbox) | classify DEVELOPMENT / EXPERIMENTAL / CONFIRMED / UNKNOWN | `retro-source` (`retro-source/references/official-sources.md`) |
| Implement something found by research (a game, event, feature) | the normal layers for that feature; research only if still needed | owning skills (+ `retro-source` for the evidence) |
| Scheduled/automatic systems (payouts, rotations, drops, cleanups, announcements) | plugin timer or hCMS scheduler | `references/operations.md` §1 + the owning skill |
| Economy values (rewards, prices, caps, multipliers, cooldowns) | the config table that owns the value | `references/operations.md` §2 + owning skill |
| Copy / import / sync / update another hotel's catalog; catalog discovery and admin approval | catalog pipeline (nitro-catalog-copy → build DB → hcms) + Arcturus catalog + CDN + hCMS admin | `references/catalog-sync.md` + `arcturus-emulator` catalog.md + `hcms` + `retro-source` |
| Deploying, going live, Sandbox vs Live, rollback | environments | `references/environments.md` |
| Testing/QA, deploy, production, CDN/assets, cache busting | operations | `references/operations.md` §3-5 |
| "Deploy the client", "cdn shows old files", purge, DNS, new hostname, SSL, WAF, "why is ws.habbo.nz broken" | Cloudflare + IIS origin (+ emulator for ws) | `references/infrastructure.md` (+ `nitro-ui` deploy, `arcturus-emulator` for ws) |
| Missing `.nitro`/icon, "previews for Values", furni images on the website, nitro2png / swf2png | resolver + renderer + CDN + hCMS | `references/asset-rendering.md` + `hcms` |
| "Prepare this campaign" | research → compare → catalog/assets → reviewed import (no campaign system exists yet) | `retro-source` (`retro-source/references/seasonal-intelligence.md`) → `references/catalog-sync.md` + `references/asset-rendering.md` |
| Try / show / record a change before live, dev server, headless test, video, "test it" | sandbox loop | `sandbox-dev` |
| What did we learn / fail at before; recording a discovery; "do we need a new skill?" | learning loop | `references/learning-loop.md` + `docs/PIPELINE_NOTES.md` (grep, never whole) |

Load the smallest set. A UI-only colour fix needs only `nitro-ui`. A Diamond-paying quest needs `nitro-ui`,
`custom-plugins`, `arcturus-emulator/economy`, and possibly `hcms`.

## Cross-system workflow (every non-trivial task)
1. **Understand** the outcome in one sentence.
2. **Identify layers** with the table above. Only the layers that really exist for this feature, not all of them.
3. **Search** each layer for what already exists (grep client `src/`, `hcms-*` plugins, hCMS `app/`, the DB). Reuse it.
   No duplicate APIs, packets, tables, services, reward systems or components. For features other retros have, research
   them with `retro-source` after checking ours.
4. **Trace** the real flow end to end, e.g. UI → composer → opcode → plugin handler → core/manager → DB/hCMS → reply →
   parser → UI.
5. **Decide authority** per layer:
   - What belongs here? What doesn't? Who is authoritative?
   - Data ownership: who owns, validates, writes and reads it, and how it reaches the running game (RCON/outbox/push).
   - One owner per piece of important data.
6. **Plan** the change across layers (smallest correct set).
7. **Implement**, clean, no comments.
8. **Build/test/verify** every touched layer:
   - client: `tsc` baseline 49, live CDP check;
   - plugin: mvn build, deploy after approval, boot log;
   - hCMS: `php -l`, `Livewire::test`;
   - DB rows.
   - Test a tampered request for anything valuable.
9. **Update skills** when an architecture fact was learned (put it in the owning skill's reference, no duplicates).
10. **Document** in `docs/PROJECT_STATE.md` (client or hCMS). New plugin/repo = its own short `CLAUDE.md` (PROJECT_WORKFLOW §16).

## Intent first (the user says WHAT, Claude decides WHERE/HOW)
Never ask the user for file paths or which skill to use. Before changing anything, answer:
1. Does it already exist (command, service, plugin, setting, table, protocol, UI)?
2. Which domain owns it, and who is authoritative?
3. Is the value config/DB-driven, plugin-controlled, emulator-controlled, hCMS-controlled or client display only?
   Change it there, never hardcode it in the wrong layer.
4. Do the needed event, hook, setting, API or UI already exist?
5. What are the security implications, and what becomes obsolete?
- Staff-tunable values (rewards, cooldowns, intervals, limits, VIP multipliers, prices, durations) go in DB/config tables
  (e.g. `hcms_engagement_settings`, `emulator_settings`, `shop_*`), exposed through the existing Filament admin when
  staff need it, with audit logging. Don't build an admin UI for everything.
- Automation: reuse existing schedulers (plugin timers such as Engagement/VipSync, hCMS `routes/console.php` schedule,
  core schedulers) before adding a new one.

## Cleanup while working
Inspect the code around a change for obsolete commands, duplicate handlers/services, dead code, old packets/routes,
debug or commented-out code and inconsistent naming. Remove only what is clearly unused: search all references,
plugin registrations, protocol use (client + server), config and docs first. Then build and test, and confirm no
references remain. Never keep two implementations of one feature. No unrelated large refactors. Destructive steps
(DB deletes, mass economy changes, data-destroying migrations, removing widely used features, production deploys)
need explicit user confirmation. Known candidates (verify before removing): bots panel opcodes 9546-9550 (bots now run
from the website), `CommandsView` vs Help command list (the user said keep, 2026-09-27), the duplicated HabboPass
logic (PHP + Java).

## Worked examples (what to investigate, not what to assume)
- *Daily quest paying Diamonds*:
  - client: `components/engagement` + `api/engagement/EngagementProtocol.ts`;
  - plugin: `engagement/DailyQuests`, `Wallet.give`, `hcms_economy_transactions`;
  - the quest pool table `hcms_daily_quest_pool`;
  - Diamonds = type 5 (`users_currency`);
  - reply OUT 9631.
- *Staff dashboard*:
  - client: `components/mod-tools` (Staff Tools, all in the main bundle);
  - plugin: `security/`, `stafffeed/`, `staffpin/`, which re-check rank on every packet;
  - website: hCMS Filament admin;
  - core: the `permissions` table.
- *New game*:
  - Arcturus room/game classes + Wired;
  - plugin events or protocol;
  - rewards through `Wallet` / `HabboPassXp`;
  - the UI in Nitro.

## Task routine (every task, in this order)
1. Intent → layers (routing table) → load only those skills/references (+ `retro-source` if other retros help).
2. Search for existing code, config, schedulers, commands, tables and protocols. Reuse or extend them. Grep
   `docs/PIPELINE_NOTES.md` for the area/keyword (earlier discoveries and failures).
3. Trace the flow. Decide authority and data ownership. Values staff may tune go in config/DB.
4. Implement cleanly: zero comments, no debug/unused code, canonical plugin layout, smallest correct change.
5. Clean up obsolete code you touched (after a full reference check, `references/operations.md` §6).
6. Verify every touched layer (§3) and the end-to-end flow; tamper-test anything valuable. Prepare the Live step
   (artifact, SQL, rollback path). Before launch the one stack is development: build, deploy and restart automatically;
   destructive/mass SQL and mass economy changes still need approval (`references/environments.md`).
7. Document (§7): PROJECT_STATE entry, CLAUDE.md focus, owning skill reference. If the task taught something
   reusable (or failed instructively): a pipeline note, route the knowledge, check for a skill gap
   (`references/learning-loop.md`; never create an eighth skill without asking).
8. Report: Changed / Verified / Security / Documentation / Remaining.

## References
- `references/catalog-sync.md`: the existing catalog crawler/build/asset tools, full-replace vs additive sync, the
  "copy this hotel's catalog" steps, and the continuous-discovery + admin-approval design.
- `references/environments.md`: the real IIS sites/paths/ports/DBs, Sandbox (what exists, what is proposed) vs
  Live, per-layer deploy and rollback, the approval boundary.
- `references/operations.md`: schedulers inventory, where every economy value lives, QA, deployment, CDN/assets,
  command cleanup, documentation rules.
- `references/infrastructure.md`: Cloudflare zone/DNS/SSL/cache facts, `hcms:cloudflare`, token setup, what needs a
  purge, ws.habbo.nz, approval boundaries.
- `references/asset-rendering.md`: resolve (`FurniSources`, RCON by classname, official icons), render (nitro2png →
  swf2png → icon → unresolved), furni previews on the website.
- `references/learning-loop.md`: pipeline notes (`docs/PIPELINE_NOTES.md`), knowledge routing, failures, skill gaps.

## Knowledge maintenance
External intelligence (sources, campaign signals, matching/asset lessons, suggestion outcomes) → `retro-source`
(`retro-source/references/knowledge-log.md`, with a confidence level). Research never becomes an implementation without a normal
task and, where the policy requires it, approval.
Generic emulator facts → `arcturus-emulator`. Our additions → `custom-plugins`. Website → `hcms`. Client → `nitro-ui`.
How-to-work rules → PROJECT_WORKFLOW.md. Current state and TODOs → `docs/PROJECT_STATE.md` + the short `CLAUDE.md`.
