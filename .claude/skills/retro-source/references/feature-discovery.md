# Feature discovery: retro ecosystem, individual hotels, HabboCity, sandbox

Purpose: learn what exists outside Habbo.nz, compare it with what we have, and turn it into structured suggestions.
Discovery never equals implementation: DISCOVER → RESEARCH → COMPARE → LEARN → SUGGEST → REVIEW → (implement only
when requested or approved, through the normal project workflow) → TEST → VERIFY → DOCUMENT → LEARN AGAIN.

## Sources and what each is for
| Source | Use it for | How (allowed) |
|---|---|---|
| HabTrack / `stock_retro` | the wider ecosystem: which hotels have which furni, texts, currencies, effects, client flags, and when they appeared | local clone, `git pull`, grep/history (`repository-guide.md`, `historical-analysis.md`). It mirrors each hotel's **public client gamedata**, not their source code or server values |
| Individual retro hotels found through HabTrack | concrete examples of a mechanism | their public gamedata/CDN by plain request, or read-only CDP in the user's browser; `hcms_furni_sources` lists 29 hotels whose CDN answers a plain request |
| HabboCity | one important deep-dive reference (custom gameplay, UI, catalog, events, VIP, economy mechanics) | stock_retro `habbocity.fr/` (last commit 2026-09-18 in our clone; 104 commits since 2026-08-01) + read-only CDP in the user's logged-in browser + saved bundle `c:/tools/nitro-catalog-copy/scripts/out/hc`. **habbocity.fr answers a server request with 403 (Cloudflare, checked 2026-10-01)**, so no unattended server-side scans |
| sandbox.habbo.com | development and testing signals | `official-sources.md` (sandbox section) |
| Implementation references | how something could work | Plugins.rar jars, cosas, HabboCM (`SKILL.md` table) |

## Ecosystem scan (repeatable)
```bash
cd /c/tools/stock_retro && git pull
git log --since=<last scan date> --format='%h %ci %s' | sed 's/Update for //' | head -200   # what moved
git diff <old>..HEAD --stat -- '*/external.ExternalTexts'                               # texts changed per hotel
git diff <old>..HEAD -- <hotel>/external.ExternalTexts | grep '^+' | grep -o '"[a-z0-9_.]*"' | sort -u   # new keys
```
New text keys grouped by prefix (`battlepass.*`, `casino.*`, `prison.*`) show new features. New furnituredata
classnames show custom furni lines. `renderer-config` changes show client features and flags. Record the last scanned
commit in `knowledge-log.md` so the next scan starts there.

## Several hotels, one concept
Record each implementation side by side (`comparison-workflow.md`): what exists, how it works as far as the evidence
shows, the evidence path/commit, dependencies. No "best" ranking. Then say what Habbo.nz already has, what is missing,
and what could be adapted.

## Comparing with Habbo.nz
Search our project first (routing in `project-workflow`). Our systems, as a starting map (check the code, it wins):
| Area | Habbo.nz system (owner) |
|---|---|
| quests, achievements, pass XP | daily quests, achievements → HabboPass XP (`hcms-emulator-plugin` engagement), HabboPass seasons (hCMS `CityPassSeason`, winwins) |
| daily loop / rewards | online payouts, 7-day login calendar + streak freezes, online chest (engagement); hCMS Rewards, Bonamigo, Citybox/HabboBox |
| cosmetics shop | Presence (`hcms-shop`: auras, spawns, borders, ornaments, bubbles, name styles) |
| economy | Wallet + currencies (Diamonds 5, Emeralds 101, Snowflakes 103, HabboCash 12), hCMS EconomyService + ledger, Values, Market, Auctions, rare rotation, LTD drops |
| VIP | hCMS VIP Club + `VipSyncScheduler` (plugin) |
| events | EventAlerts (hCMS), GameBridge / game-event command, `GameNotifier` |
| social | mentions, chat reactions/replies, organisations, forum, friends |
| staff | Staff Tools, PIN, staff feed, security incidents, prison, trade bans, feedback bubbles |
| building | Builder Mode, Furni Editor, room settings enforcement, Wired (fork-specific engine) |
Comparison result per feature: **ALREADY EXISTS · PARTIAL · MISSING · DUPLICATE · INCOMPATIBLE · EXPERIMENTAL ·
UNKNOWN**. A keyword match is a hint, not a result: open the code before saying ALREADY EXISTS or PARTIAL.

## Suggestion record (write it like this)
```
FEATURE: <name>
SOURCE: <Habbo.com | sandbox.habbo.com | HabTrack:<hotel> | HabboCity | <hotel>>  (URL / path / commit)
DISCOVERED: <date>      CONFIDENCE: VERIFIED | OBSERVED | INFERRED | UNKNOWN
SOURCE STATUS: CONFIRMED | DEVELOPMENT | EXPERIMENTAL | UNKNOWN   (sandbox/dev findings never CONFIRMED until seen live)
EVIDENCE: <keys, classnames, file excerpts, screenshots of DOM via CDP>
OUR HOTEL: ALREADY EXISTS | PARTIAL | MISSING | DUPLICATE | INCOMPATIBLE | UNKNOWN  (+ the system and its paths)
REUSABLE: <our systems that would be extended>
LAYERS: <hCMS | plugin | Arcturus | Nitro UI>
ECONOMY: <how it fits our P2W-but-fair-to-free principle; external values are reference only>
PROPOSAL: <adaptation in one paragraph>
STATUS: PROPOSED   (later: REVIEWING / APPROVED / REJECTED / IMPLEMENTED / IGNORED, with date and who decided)
```
Keep source facts, our analysis and the proposal visibly separate. A suggestion is never described as implemented.
Durable outcomes (approved, rejected and why, implemented where) go to `knowledge-log.md`; the full task write-up goes
to `docs/PROJECT_STATE.md`.

## Rules
- Never copy external code, databases, IDs, prices or economy values. Re-implement behaviour for our architecture,
  server authority and economy.
- Never present a sandbox or experimental signal as released functionality.
- Never work around Cloudflare, logins or licence/domain locks; HabboCity is observed only in the user's own browser.
- No habbox (user rule).
