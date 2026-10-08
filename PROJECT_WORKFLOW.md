# PROJECT_WORKFLOW.md — how to work on this project

## GLOBAL DEVELOPMENT STANDARD
All work across this project must follow the project skill system (`.claude/skills/`, entry point `project-workflow`)
and keep the codebase clean.
Production source code uses **ZERO COMMENTS** by default.
Never leave commented-out code, temporary code, debug code, unused code or unnecessary abstractions.
Documentation belongs in the project documentation/skill system, not inside source code.
(Full policy: §5a. Existing code still has many comments; don't strip them in unrelated changes. New and rewritten
code has none.)

The operating manual for every session. Read this file first and in full. It is short on purpose.
Project state and history: `docs/PROJECT_STATE.md` (~620 KB; hCMS: `hCMS/docs/PROJECT_STATE.md`, ~460 KB). Search them;
never load them whole. `CLAUDE.md` in each repo is a short pointer file that loads automatically.

Sequence for every task: **UNDERSTAND → SEARCH → TRACE → PLAN → IMPLEMENT → VERIFY → DOCUMENT.**

---

## 1. Source-of-truth order

1. Current source code (client, plugins, hCMS)
2. Current database schema and data (live `hcms` MariaDB)
3. Current runtime config (`public/ui-config.json`, `public/renderer-config.json`, `emulator_settings`, hCMS `.env`/`config/`)
4. Current protocol implementation (composer/parser pairs ↔ plugin handlers)
5. This file
6. `docs/PROJECT_STATE.md` current-state sections + the short `CLAUDE.md` (newest dated entries win over older ones)
7. Historical notes, backups, `.bak` jars, reference packs

When docs and code disagree, check which is stale. Trust the code unless there is clear evidence the code is the outdated
part. Then fix the stale doc so the conflict doesn't stay.

**UI exception:** for HabboCity-ported components, the live HabboCity client (read-only, through CDP) decides DOM,
classnames, CSS and behaviour. Our code is checked against it, not the other way round. Own features (Presence, Staff
Tools, Furni Editor, engagement…) use theme tokens and copy the layout of an existing sibling.

## 2. Architecture (all under `c:\inetpub\wwwroot\`)

| Part | Path | Notes |
|---|---|---|
| Nitro client (React/TS, Vite) | `nitro-react-Wired` | `src/api` (protocols, helpers), `src/components`, `src/common` (shared primitives), `src/hooks`, styles `src/assets/styles/holo/` (HabboCity CSS, cascade order — never reorder) |
| Renderer | `@nitrots/nitro-renderer` 1.6.6 + **chained Yarn patches** in `.yarn/patches/` | change with `yarn patch '<exact resolution from yarn.lock>' --update` + `yarn patch-commit -s`; never edit node_modules by hand |
| Main server plugin | `hcms-emulator-plugin` (Java, `com.hcms.emulatorplugin`) | almost all custom protocols, economy, engagement, staff, security, prison |
| Other plugins | `hcms-shop` (Presence: `server/`, `client/`, `hotel-data/`), `hcms-feedback` (bubble kinds/icons/rules), `hcms-furnieditor-plugin`, `hcms-buildermode-plugin` | each builds its own jar |
| Emulator core | `Arcturus-Community-Wired` | **read-only reference. Never edit.** Read it to find hooks, packet IDs, events |
| Running emulator | `hcms-emulator-run` (`Habbo.jar`, `plugins/`, `config.ini`, logs) | deploy = stop → copy jar to `plugins/` → start → check boot log |
| Website/admin | `hCMS` (Laravel + Filament) | own `docs/PROJECT_STATE.md` (~460 KB, same search-only rule); PHP 8.5 binary for artisan; serves `public/cdn` (client, gamedata, icons) |
| Deployed client | `hCMS/public/cdn/client` = `https://play.habbo.nz` | written only by `yarn deploy` (`deploy.ps1`, robocopy /MIR; keeps `pie.html`/`metro.html` reference clients) |

Website and game share one DB. The emulator keeps online players in memory, so a website write must be pushed into the
game: `GameNotifier` → RCON `hcmsrefresh` → `PlayerRefresh`. An offline player gets the outbox at next login.

## 2a. Skill system
`.claude/skills/` (this repo): `project-workflow` (master routing, use for every task), `nitro-ui`, `arcturus-emulator`
(base server), `custom-plugins` (our plugins and protocols), `hcms` (website/admin), `retro-source` (research on
other retros: Hab-Track stock_retro gamedata history + local reference packs; never authoritative). Skills hold reusable architecture;
PROJECT_STATE.md holds state and history; source code holds the truth. Load only the references a task needs. When a
task proves an architecture fact, update the owning skill's reference (no duplicates, keep SKILL.md short).

## 3. Large-file rule

- **Never load all of `docs/PROJECT_STATE.md` (either repo).** Grep headings (`^## `) and keywords, then read only the matching lines with offset/limit.
- Keyword starting points:
  - economy: `economy|wallet|Diamonds|Emeralds|Snowflakes|VIP|transaction|marketplace|catalog_free`
  - engagement: `engagement|streak|chest|payout|DailyQuests|HabboPass|winwin`
  - staff/security: `Staff Tools|staffpin|stafffeed|security|incident|prison|permission|rank`
  - Presence: `Presence|hcms-shop|shop_`
  - protocols: the opcode number (e.g. `9631`) or the class name
- The same applies to minified reference bundles (`c:\tools\nitro-catalog-copy\scripts\out\…`). Grep a unique string, read a window.

## 4. Investigation (before any change)

1. State the outcome the user wants in one sentence.
2. Find the real implementation: grep `src/`, the plugins and hCMS. Search the whole repo and `package.json`, not just `common/`.
3. Trace the full flow: UI → hook/state → composer → plugin handler → DB/hCMS → outgoing composer → parser → state → UI.
4. Look for an existing system that already solves part of it (shared primitive, existing protocol, existing table, `Wallet.give`, `CommandFeedback`, `GameNotifier`…).
5. Check permissions, transactions and conventions on that path.
6. For "looks wrong" UI: trace the state owner too, not only the CSS (PROJECT_STATE.md "STRICTER RULES" 3-4).
7. Only then plan the change.

## 5. Implementation rules

- Extend what exists. No duplicate APIs, protocols, tables, services, economy logic, permission checks or UI systems.
- Make the smallest correct change. Don't rewrite working code. Don't delete code just because it looks unused; verify first.
- Keep concerns separate: don't mix DOM restructuring, CSS, behaviour and new features in one pass for ported components.
- Never invent paths, columns, opcodes, config keys, classnames or business rules. Search first. If it can't be found, say so.
- Client conventions:
  - call `RegisterXMessages()` in the component body, before `useMessageEvent`, never inside an effect;
  - effect bodies that call something returning a value need braces (`useEffect(() => { send(); }, [])`), otherwise React gets a bogus clean-up and crashes;
  - own windows use the `holo/_tokens.scss` colours. No hand-picked colours, no Bootstrap colour utilities;
  - no emoji in hotel UI or bubbles; use Habbo pixel icons;
  - user-facing feedback goes through `showFeedback` (client) or `CommandFeedback`/hcms-feedback kinds (server).

## 5a. Code cleanliness and comment policy (user rule, 2026-10-01)
- No comments in new or rewritten code in any layer (TS/TSX, SCSS, Java, PHP, Blade, SQL, scripts): no `//`, `/* */`,
  JSDoc, `#`, XML comments, TODO/FIXME, or commented-out code. Make code clear through naming, small functions and
  structure instead.
- Only keep a comment when a tool, compiler, licence or generated file requires it (e.g. an eslint/ts directive). Keep
  just the directive.
- Before finishing, remove temporary/debug code (`console.log`, test prints), unused imports, variables and functions,
  dead code and duplicated logic. Don't reformat unrelated parts of large files.
- Explanations, decisions and TODOs go in `docs/PROJECT_STATE.md`, the skill references or this file.
- This replaces the older "match the surrounding comment density" habit.

## 5b. Intent, cleanup, configuration (user rules, 2026-10-01)
- Work from the user's intent: find the owning systems, files, tables, protocols yourself. Routing lives in the
  `project-workflow` skill.
- Cleanup: remove clearly obsolete code near a change only after a full reference check (code, plugin registration,
  protocol both sides, config, docs), then build/test. Never leave two implementations of one feature.
- Commands: extend the existing command/infrastructure; one registration per command; permission column; drop obsolete
  aliases only when not intentionally kept.
- Plugins: one domain per plugin, canonical layout in `custom-plugins/references/plugin-structure.md`.
- Staff-tunable values live in server config/DB tables (admin UI only when useful, audited). Reuse existing schedulers.
- Autonomous ≠ reckless: confirm before destructive or production-impacting steps.

## 6. Client/server authority

The client is never trusted. The server decides everything of value: currencies, balances, prices, purchases, ownership,
rewards, quests, VIP, HabboPass XP, chests, login rewards, marketplace, trading, inventory, staff permissions, moderation.

- The client displays state, collects input, sends a request, and renders the reply.
- Every handler re-checks rank, ownership, price, balance, cooldown and limits from server data. Prices and amounts come from DB rows, never from the packet.
- Hidden or disabled UI, `securityLevel` checks in React, and obfuscation are UX only, never security. A request sent by hand must be refused by the server.
- Known client-only gaps (state them when relevant, don't build on them): the room-tools "editing rights off" mode is client-side only (no 5006 sent), so a crafted move packet still works.

## 7. Economy rules

**Design principle (user, 2026-10-01).** The hotel is designed as a monetized/P2W-oriented hotel, while remaining
enjoyable and viable for normal non-paying players.
- Premium spending may provide faster progression, convenience, prestige, exclusive content and additional options.
- Major gameplay systems keep meaningful free-player progression and participation.
- Apply it to future economy, progression, rewards, VIP, events, games and monetization decisions.
- Keep balance and implementation feature-specific; don't force one monetization model on every system.
- It is not a reason to implement Wired 2.0 or to change existing systems.

- Currencies: Diamonds (5, tradable, premium), Emeralds (101, untradable, earned), Snowflakes (103, seasonal), HabboCash (12, bought). Credits are retired (catalog free except VIP/Rares, priced in Diamonds).
- In the game, change balances through the existing paths: `engagement/Wallet.give` (stock `givePoints` + a `hcms_economy_transactions` row) or the admin/economy services. On the website use `EconomyService` / actions. Don't add a new balance writer.
- Every valuable change leaves a trace (`hcms_economy_transactions`, `hcms_winwin_ledger`, `hcms_admin_audit_log`, `shop_log`). Use transactions, row locks and idempotency keys (`HabboPassXp` copies `WinwinService::grant`).
- Watch the in-memory/DB split. `HabboInfo.run()` saves in-memory balances and rank over the DB, so a DB-only change for an online player is lost unless it is pushed into memory too.
- Before changing prices or rewards, check them against what players actually earn (Economy dashboard, `hcms_engagement_settings`).

## 8. Staff / admin systems

- Server checks on every staff packet: rank/permission (`acc_*`, `cmd_*` columns in `permissions`) plus the staff PIN lock (`staffpin/StaffPin` blocks staff opcodes while locked; add any new staff opcode to its block list).
- Staff UI is currently bundled with the player client and gated by `securityLevel`. Treat that as exposure: never put secrets, reward tables or server algorithms in client code.
- Log staff actions to `hcms_admin_audit_log`.

## 9. Protocols

- Custom opcodes are in the 95xx-96xx range. Grep the number in client, all plugins and core before taking one. The last ones used are listed in docs/PROJECT_STATE.md.
- A feature is done only when both halves exist: client composer/parser (`src/api/<feature>/…Protocol.ts`) **and** the plugin handler registered at boot, deployed, with the boot log confirming it.
- To stay compatible, append new reply fields at the end and have the client read them only `if (bytesAvailable)`.
- A protocol string is at most 65,535 bytes. Split big JSON (see `ShopComposer.json`).

## 10. Database

- Inspect before changing: `DESCRIBE`, existing rows, indexes, which code writes the table (core writes with named columns?).
- Plugins create their own tables with `CREATE TABLE IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS` and seed with `INSERT IGNORE` (never overwrite admin edits). hCMS uses migrations.
- Before any bulk data change: a backup table (`bak_<date>_<what>`) or a `mysqldump` into `db-backups/`. Never reset or truncate as a shortcut.
- Gotchas: `ENUM('0','1')` needs quoted values. Accented text goes through a Python file, not the bash → mysql pipe. Some caches only reload at boot or with a command (`:update_items`, `:update_catalogue`, `:update_config`, `:update permissions`).

## 11. Build / test / verify

- Client: `yarn start` (Vite + HMR on 5173) for iteration; `npx tsc --noEmit -p .` (baseline **49** errors, all old; new code adds none); `yarn deploy` to go live. Bump `?v=` on asset/config URLs when CDN files change (7-day cache).
- Plugins: `/c/tools/apache-maven-3.9.16/bin/mvn -q package` → copy the jar → restart the emulator → read the boot log. **Ask the user before restarting the emulator** (standing rule since 2026-09-30, "dont change the emulator"; it overrides the older "restart without asking" memory).
- hCMS: `php -l`, `Livewire::test(...)` in tinker for Filament pages (more reliable than CDP clicks), `php artisan migrate --force`.
- Live checks via CDP: `c:\tools\nitro-catalog-copy\scripts\eval-in-iframe.js` (the client sits in a cross-origin iframe). 9222 = the user's own Chrome; 9223 = headless test Chrome. Don't test headless as `officialrooms` (the user logs in with it). SSO tickets are single-use.
- Verify the flow, not the compile: DOM + computed styles (no screenshots as evidence), protocol round trip, DB rows, boot log.
- For valuable/security features, also test a tampered request (fake price, fake amount, rank-1 calling a staff opcode) and confirm the server refuses it.
- Scroll elements into view before computing click coordinates. If HMR logged "Failed to reload", reload the tab before concluding a fix failed.

## 12. Debugging

Find where the failure starts and who owns that data (client, protocol, plugin, DB, config) before patching the symptom.
Common silent causes:
- unregistered message class (handler gets -1);
- a cancelled plugin event;
- a cache not reloaded;
- a 65 KB string cut off;
- stale browser cache (`?v=`);
- a stale HMR module.

After the fix, re-run the whole flow. A vanished error message is not proof.

## 13. Production / deployment
- Sandbox → Live flow, real environments and rollback: `.claude/skills/project-workflow/references/environments.md`.
  There is one stack today (`dev.habbo.nz`, `play.habbo.nz`, `cdn.habbo.nz`, one emulator, DB `hcms`). It counts as
  Live: prepare and test first, deploy only with approval.

- `yarn deploy` only. It refuses to deploy a failed build, and production builds ship no source maps (checked 2026-10-01).
- No secrets in `public/*.json` or any client code. API secrets, RCON and DB credentials stay server-side.
- Backups before risky deploys: `db-backups/` (DB dumps, UI tarballs). Older plugin jars are kept as `*.jar.bak-<name>` in `plugins/`.

## 14. Reverse engineering and references

- HabboCity and other hotels are **read-only**: observe through CDP and normal interaction only. Never inject, intercept or modify.
- Never work around Cloudflare, licence checks or domain locks (e.g. MetroHotel's lock stays in place).
- No habbox. Reference packs (`Plugins.rar`, `cosas`, `HabboCM`, saved bundles) are for learning; never copy them wholesale or install them.
- Mark anything not observed as UNVERIFIED and don't build it as fact.
- Hotel intelligence (Habbo.com seasons, sandbox signals, HabTrack ecosystem, individual retros, HabboCity) lives in the
  `retro-source` skill. It produces research records and suggestions with a confidence level, never an implementation
  by itself. Habbo.nz is the source of truth; external prices and rewards are reference only. Habbo.nz has no
  campaign/season system yet.

## 15. Changing existing systems

- Never edit `Arcturus-Community-Wired`. Extend through plugin events, `registerCallable`, outgoing-packet substitution or reflection in the plugin.
- Keep stock behaviour where a plugin intercepts (only cancel the exact case you handle).
- Check sibling components and sibling states for the same bug class (PROJECT_STATE.md rules 5-6).
- Something built during an investigation that later gets reverted: ask whether its side fixes stay.

## 16. Documentation

- `docs/PROJECT_STATE.md` = project state. After meaningful work, append a short dated section at its end: what changed, where, opcodes/tables, what was verified vs not, open items. hCMS changes go in `hCMS/docs/PROJECT_STATE.md`.
- Keep the short `CLAUDE.md` "Current focus" up to date. It loads into every session, so keep it under ~60 lines and never paste history into it.
- Write as you go, not only at the end. Don't paste source files or this workflow into either file.
- Durable user preferences go in the memory folder, not here.

### New plugin, repo or feature: create and document (mandatory, same session)
A new **plugin or repo** (e.g. a new `hcms-*` folder) is not finished until it has:
1. Its own short `CLAUDE.md` pointer file, max ~25 lines, using the template below (copy an existing one, e.g. `../hcms-feedback/CLAUDE.md`).
2. A row in this file's §2 architecture table.
3. A dated section at the end of `docs/PROJECT_STATE.md`: purpose, folder, jar name, opcodes, tables and settings it creates, what's verified, what's open.
4. If it's ongoing work, a line in the client `CLAUDE.md` "Current focus".

A new **feature, protocol, table or window** inside an existing repo needs a dated section in the right
`docs/PROJECT_STATE.md` before the session ends: what it is, files, opcode pair (both halves), tables/settings, and
what was verified vs not. Even "built, compiles, not live-tested" counts; silence doesn't.

Template for a new plugin's `CLAUDE.md`:
```
# <folder> — CLAUDE.md (short pointer)
<one line: what this plugin does, its opcodes/tables>.
- Workflow: read ../nitro-react-Wired/PROJECT_WORKFLOW.md first.
- History/state: ../nitro-react-Wired/docs/PROJECT_STATE.md (never read whole). Grep for: <keywords>.
- Hard rules: never edit Arcturus-Community-Wired; ask before deploy/restart; server re-checks everything of value.
- Build: /c/tools/apache-maven-3.9.16/bin/mvn -q package. Deploy (after approval): copy <jar> to ../hcms-emulator-run/plugins/, restart, read the boot log.
- Document work: append a dated section to ../nitro-react-Wired/docs/PROJECT_STATE.md.
```

## 17. Conflicts

Inspect code → runtime → DB → newest docs. Identify which source is stale, make the smallest safe correction, then update
the doc. Never silently pick an assumption when the source can be checked. When the user's own words conflict with a
document (e.g. restart rules), the latest user instruction wins. Ask if unclear.

## 18. Completion checklist and report

Before saying "done":
- [ ] Searched for existing implementations; no duplicates added
- [ ] No new comments, no commented-out/debug/unused code left
- [ ] Full flow traced and changed on both sides where needed
- [ ] Server re-validates everything of value; tampered input tested where relevant
- [ ] `tsc` count not increased; jar built; deployed only with approval where required
- [ ] Verified live (DOM/computed/protocol/DB/boot log), all relevant states covered
- [ ] docs/PROJECT_STATE.md (+ CLAUDE.md focus if it changed) updated
- [ ] New plugin/repo? It has its own short `CLAUDE.md` + a row in §2 + a PROJECT_STATE entry

Report as **Changed / Verified / Security / Documentation / Remaining**. Never call something verified if it wasn't tested.
