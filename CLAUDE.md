# nitro-react-Wired — CLAUDE.md (short on purpose; loaded into every session)

0. **Skills** in `.claude/skills/` load automatically: `project-workflow` (master: decides which layers/skills a task
   needs), `nitro-ui`, `arcturus-emulator`, `custom-plugins`, `hcms`, `retro-source` (other retros: stock_retro + local
   reference packs, research only), `sandbox-dev` (dev server + sandbox test loop, headless tests, videos). Just state the task.
1. **Read `PROJECT_WORKFLOW.md` first.** It explains how to work: investigate → implement → verify → document.
2. **Project history and state live in `docs/PROJECT_STATE.md`** (~620 KB; it was this file until 2026-10-01).
   **Never read it whole.** Grep its `## ` headings and task keywords, then read only those sections. Newest dated
   sections win. Current code wins over the document.
3. Website/admin side: `../hCMS` (its own `CLAUDE.md` → `hCMS/docs/PROJECT_STATE.md`, same rule).

## Hard rules (details in PROJECT_WORKFLOW.md and docs/PROJECT_STATE.md)
- **Zero comments in new code.** No commented-out, debug, unused or temporary code (PROJECT_WORKFLOW §5a).
- Never edit `Arcturus-Community-Wired` (emulator core) without the user's explicit OK per change. Server logic goes in
  `hcms-emulator-plugin` or the other `hcms-*` plugins. Approved core changes are listed in docs/PROJECT_STATE.md
  "Core changes" (first one: gate walk-through fix, 2026-10-03). Build with mvn, back up `Habbo.jar` first.
- **Environment policy** (user, 2026-10-01; replaces the 2026-09-30 "ask before deploy/restart"):
  - Development/Sandbox: Claude may build, deploy, and restart automatically.
  - Production/Live: explicit approval required.
  - Destructive/mass SQL: approval required regardless of environment.
  - Mass economy changes: approval required.
  - Before hotel launch: development mode. After launch: production safeguards automatically apply.
  Today (hotel not open) the one stack is development (`.claude/skills/project-workflow/references/environments.md`).
- HabboCity and other hotels are read-only references. Observe through CDP only. Never work around Cloudflare or
  licence/domain locks. No habbox.
- HabboCity-ported components: 1:1 DOM, classnames and CSS from the live reference, verified via DOM and computed
  styles, never screenshots (see "STRICTER RULES" in docs/PROJECT_STATE.md). Own features: theme tokens, copy a
  sibling's layout, Habbo icons (no emoji).
- The server decides everything of value (currencies, prices, rewards, ranks). The client is never trusted.
- **Design principle: monetized / P2W-oriented, still fair to free players** (user, 2026-10-01). Premium spending may
  give faster progression, convenience, prestige, exclusive content and extra options; every major gameplay system
  keeps meaningful free progression and participation. Use it for future economy, progression, rewards, VIP, events,
  games and monetization decisions; balance stays feature-specific (no one model for every system). It is not a reason
  to change existing systems or to build Wired 2.0. Details: PROJECT_WORKFLOW §7.
- Don't test headless as `officialrooms` (the user logs in with it).
- Secrets (e.g. `CLOUDFLARE_API_TOKEN`) live only in `hCMS/.env` (git-ignored). Never print, log, document or commit them.
- Learning loop: grep `docs/PIPELINE_NOTES.md` before a task; after meaningful work add a note, route the knowledge,
  check for a skill gap. Seven skills (sandbox-dev added 2026-10-08 with the user's OK); an eighth only with the user's OK (`project-workflow/references/learning-loop.md`).

## Documenting work
New plugin, repo, feature, protocol or table: create its pointer `CLAUDE.md` (plugins/repos) and write it up the same session. See PROJECT_WORKFLOW.md §16 "New plugin, repo or feature".
Add a short dated section to the **end of `docs/PROJECT_STATE.md`** as you go: what changed, files, opcodes and
tables, what was verified vs not, open items. Keep the "Current focus" below up to date. Never paste the history
back into this file.

## Sandbox (2026-10-07)
Full sandbox: https://sandbox.habbo.nz + https://play-sandbox.habbo.nz, DB `hcms_sandbox`, emulator `hcms-emulator-sandbox`
(31010/31001, wss 2087). Test there first; layout + deploy steps in project-workflow `references/environments.md`.

## Latest (2026-10-07, all live; summary = PROJECT_STATE "Session summary 2026-10-06 night")
Live: identity logging/machine bans, permission changes (fun commands rank 1, VIP perks, :follow), Halloween + all
companion/misc/face clothing (renderer patches 8+9, newest first), emoji picker, performance tab, casino (dealer banks,
window, overhead badge), Dark Academia + Bots catalog pages. Open: staff `:update_permissions` for the floor plan
editor, live casino test, ranch animal games test, 0-price offers. Never `:update_plugins`; test in the sandbox first.
Sandbox only (2026-10-07 evening, PROJECT_STATE "Casino talk modes…"): casino whisper/bubble/room + window feedback +
amount box, 21/13 lowest-starts + tie replay (payouts 1.5/1.7), mole game like Habbo, sandbox login rank 3+ / Sandbox
landing. Live deploy waits for the user's OK.

## Current focus (2026-10-04, beta prep)
Hotel reset for beta (4 accounts kept, full dump in db-backups/hcms-full-before-reset-20261004.sql.gz), HabboPass
Diamonds fixed, economy simulation + open suggestions in PROJECT_STATE "Hotel reset for beta". Admin catalog holds the
hubba.cc + HabboCity imports (habboworld page names).
Beta mode ON (`HCMS_BETA`): players only see the Hobba-style beta landing (`beta/landing`, `hcms-beta` CSS/JS) and a bare `/hotel` iframe; staff rank 5+ see everything. Client: top-left dock, habbo.st music box (top right) + TV, room-entry banner (hCMS PROJECT_STATE "Beta mode" / "Beta landing", nitro "Client dock"). Old Hobba CMS on c.habbo.ltd (`habbonz-hobba`, DB `habbonz`).

## Focus (2026-10-03)
Sunset Ranch rebuild 1:1 from a G-Earth recording of habbo.com (`c:/tools/gearth-room-export`, design in
`docs/SEASONS_AND_SUNSET_RANCH.md` §6, history in PROJECT_STATE "Sunset Ranch"): rooms 538/539 copied, farm signs →
soil rings, single-click actions, Wired notification bubbles via `CommandFeedback`, Wired variable display (level
badge, counters, other players), all 7 parts live (orders, shop, animals, community challenge, animal games, quest
engine 15 days, quest panel 9670). Counters flash 3 s on change, signs at Habbo's plot+(1,3) with self-heal, starter
buyer Joshua, help terminal → habbopages/sept26ranch, clicks need the player next to the furni/buyer. Open: green shop button reported invisible (check in client),
stack height example from the user. Quest rewards = season currency at Habbo's amounts (user).
Video TVs (2026-10-04, HabHeights-style, our 8 TVs, `youtube/VideoTv` 9671-9675) + room 540 "Anime Night" (import of
HabHeights room 1884 via CDP frames, 6 missing furni skipped). Not live-tested yet.
Catalog 2026-10-04: HabboCity page images (CITY → HABBO logo) + English texts on 974 pages, "Right now:" holds
Autumn/Halloween like HabboCity, Staff › Retired pages, Seasonal Shop locked (PROJECT_STATE "HabboCity catalog images").
Afternoon: Ranch Shop window + Barn bar + Chloe opens shop, fertilizer fix, :ha card (OUT 9678), gold Halloween logo
(website + toolbar, seasonal switch), daily reward reverted, client iframe allows autoplay (PROJECT_STATE "Ranch shop/barn UI").

## Earlier focus (2026-10-02)
Done today (details in PROJECT_STATE): Halloween/seasonal import (933 furni), time-to-earn prices applied, Mia
cleaned, token-gated client chunks + staff windows, build hardening, server audit + 5 fixes (deployed 02:43), the
loading screen waits for the gated player files, browsers cache granted chunks.

Waiting for the user's choice:
- Integration plan: all 5 steps done (2026-10-02). Figure merge Phase A + B live: the client's figure set
  (`cdn/habbocity/`) has HabboCity's clothing plus official Habbo clothing; 620 clothing furni usable; Clothes Shop
  47 pieces (Habbo Furni > Clothing 36 × 150 Emeralds, Rares > Clothing 5 × 500 Diamonds); Golden Clothes Box on sale
  (14 pieces, 180 Diamonds). Left: about 80 pieces with no usable official set.
- Clothing economy: research done offline; the live HabboCity check needs the user to open habbocity.fr in Chrome.
- Catalog discovery + admin approval queue: designed (`project-workflow/references/catalog-sync.md`), not built.
- VIP buttons in Presence: test needs a `hcms_vip_memberships` row for Kasper (id 5).

Done 2026-10-02 (PROJECT_STATE "Toolbar logo, favicons, Today card, fun commands"): sharp toolbar "H", favicon pack
(client + website), clean Today card (closed tiles / open rows), fun commands (:hug :kiss :airkiss :airhug :love :like
:slap :slime, `<cmd> all` + *friends aliases, :facepalm). Waiting for the user to try them in their own client.

Built but not live-tested yet (staff PIN/duty/security modes/incidents/notes/trade ban/prison/sanctions and the
quest bonus + reduced rewards ARE verified, see PROJECT_STATE "Testing pass"):
- profile moderation as VIP/Moderator (needs a VIP membership row, user's OK); the security modes' automatic actions;
- the chest-ready bubble and the chest/freeze race (30 min in a room); builder erase; a moderation bubble;
- Halloween leftovers: the crackable dresser, the hatch teleport, placing a seasonal furni; 8 seasonal furni have no art.

New 2026-10-02: HabboPass window in the hotel (Today card > Pass; `hcms:pass` + PassProtocol 9648/9649), fun
commands, Today card redesign, favicons. Kasper (id 5) got 48 test winwins and collected pass level 1.

Seasonal vault (2026-10-03): prize crackables + clothes only in Staff › Seasonal Economy/Clothing; release per season with
`hcms:seasonal-vault` or Admin › Catalog discovery; free prize crackables need prices first.
Hotel intelligence: `hcms:intel-scan` (hourly) records Habbo.com campaigns/furni, news and the official achievement
ladder, and sandbox signals as findings; Admin > News > "From Habbo news" suggests Habbo articles (never imported). The
`retro-source` skill holds the procedures. No campaign/season system exists. Daily quests feed Habbo's Taskmaster +
Streak Freak achievements, HabboPass max level → Track Champ; 12 broken ladders fixed, 19 official ladders added
(2026-10-03, verified). All 174 official ladders exist (counters for trades, LTD, room-type minutes, game wins, VIP days,
name, pet breeding, 9 crafting tables incl. InfectedLab, crackables, Furious God spawns); about 38 still have no
progress source (PROJECT_STATE "All official
achievement ladders" + "Pet breeding, crafting and crackable achievements").
Cloudflare token: skipped by the user. Every client deploy means one fresh 8.3 MB main-file download for players.

Later:
- seasonal passes and the Nitro quest protocol;
- a premium pass track;
- merging the Presence shop and the website Center.

The full older handoff is the "Reusable prompt" section at the end of docs/PROJECT_STATE.md.
