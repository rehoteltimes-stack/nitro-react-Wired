---
name: retro-source
description: Hotel intelligence and research layer. Official Habbo.com gamedata for seasons/campaigns and new or returning furni, sandbox.habbo.com for development signals, the Hab-Track stock_retro repository (local clone C:/tools/stock_retro, ~86 hotels of public gamedata history) for the wider retro ecosystem, individual retros and HabboCity as deep-dive references, plus local implementation references (Plugins.rar jars, cosas, HabboCM, saved client bundles). Use automatically for "what is new for the next season", "what does Habbo/HabboCity/other retros have that we don't", "what's new in Habbo development", preparing a seasonal catalog, comparing hotels, new game/economy/VIP/event/quest ideas, furni names/translations, and adapting external content (branding, localisation). Produces comparisons and structured suggestions; never implements by itself. Habbo.nz stays authoritative.
---

# Retro research (stock_retro + other references)

Our project is the product; this is the research library. Order of authority: our source > our DB/config/runtime >
our skills > `docs/PROJECT_STATE.md` > stock_retro > other external research > general knowledge. Never replace our
design because another retro did it differently.

## What stock_retro really is (verified 2026-10-01)
- `https://github.com/Hab-Track/stock_retro`: "keeps a history of all changes detected by Hab Track". One folder per
  hotel domain (e.g. `habbo.st/`, `habbocity.fr/`, `habbo.cc/`). Each holds the hotel's **public client gamedata**:
  `furnituredata`, `external.ExternalTexts`, `external.UITexts`, `external.BadgeTexts`, `avatar.figuremap`,
  `avatar.effectmap`, `renderer-config` (plus `productdata` in older history). JSON with a UTF-8 BOM.
- **It contains no emulator, plugin, CMS or client source code, and no server-side values** (prices, drop rates, reward
  amounts, permissions). Anything about server mechanics is inference from texts/config. Label it so.
- Every commit is "Update for <hotel>/<file>", so the history shows when each hotel added, renamed or removed furni,
  texts, effects or config.
- Not every retro is in it (~86 folders locally).
- Local clone: `C:/tools/stock_retro` (7.9 GB `.git`, last pulled commit 2026-09-20; run `git pull` there to update).
  It also holds our own untracked helper scripts (`build-furni-names-index.py`, `build-furni-words.py`,
  `furni-names-index.tsv`…, used by the Furni Editor names). Never commit or push anything to it.

## Implementation-level references (when you need *how*, not *what*)
| Source | Holds |
|---|---|
| `C:/tools/plugins-reference/` (+ `Downloads/Plugins.rar`, `Plugins/`) | ~512 compiled Arcturus plugins, extracted samples (lottery, pyramid, typing, mentions, retropass), notes `README.md` |
| `Downloads/cosas.rar` (index in a session scratchpad; extracts in `plugins-reference/cosas-*`) | HabboJe/Hekos/RetrosLab/apex-nitro CMS, client and plugin source |
| `c:/inetpub/wwwroot/HabboCM` | HabboCM emulator SQL, APIs, imager |
| `c:/tools/nitro-catalog-copy/scripts/out/{hc,hst,metro,soda,habz}` | saved minified client bundles of HabboCity, habbo.st, MetroHotel, sodaho, habz.es (habz = full Wired 2.0 incl. variable FX; `habz/variablefx/` images) |
| `LTDWEB/LTD Emulator + LTDUI/Polaris-Emulator-main` | Polaris emulator source: Wired 2.0 variable logic (no display) |
| live hotels via CDP (read-only) | HabboCity etc. Never work around Cloudflare or licence/domain locks |

## Workflow (automatic for retro-flavoured features)
1. Search our project first (project-workflow routing). Know what exists.
2. Search stock_retro (`references/feature-research.md` for which file reveals what) and the implementation references.
3. Compare factually (`references/comparison-workflow.md`), use history where it helps (`references/historical-analysis.md`).
4. Extract mechanisms and ideas. Design them for **our** architecture, economy authority and security. Reject what
   conflicts.
5. Never copy external code blindly. Check licence, compatibility, dependencies and security first; prefer
   re-implementing the behaviour. Record the origin of anything reused.
6. Record discoveries per `references/source-validation.md` (path, hotel, file, commit, fact vs inference, applicability).

## Catalog research
For a catalog copy, use the hotel's `furnituredata` / `renderer-config` here to identify the source and its CDN, and
its history to see what changed since the last sync. Then follow `project-workflow/references/catalog-sync.md`.

## Hotel intelligence (research and preparation; nothing here runs on its own)
Five sources with separate jobs. Habbo.nz is the source of truth; none of them controls it.
| Source | Job | Reference |
|---|---|---|
| Habbo.com | official seasons, campaigns, new/returning furni, promo assets, news feed, official achievement ladder | `official-sources.md`, `seasonal-intelligence.md` |
| sandbox.habbo.com | development signals: DEVELOPMENT / EXPERIMENTAL / CONFIRMED (only once seen on www) / UNKNOWN | `official-sources.md` |
| HabTrack `stock_retro` | the retro ecosystem: who has which furni, texts, flags, and since when | `repository-guide.md`, `historical-analysis.md`, `feature-discovery.md` |
| individual retros | concrete examples of a mechanism | `feature-discovery.md`, `comparison-workflow.md` |
| HabboCity | one important deep dive (browser-only: Cloudflare) | `feature-discovery.md` |
Loop: DISCOVER → RESEARCH → COMPARE → LEARN → SUGGEST → REVIEW → implement only when requested/approved (normal
project workflow) → TEST → VERIFY → DOCUMENT → LEARN AGAIN. Record findings with a confidence level and keep the
ledger in `knowledge-log.md` current. Adapted content follows `branding-localization.md`. **Habbo.nz has no
campaign/season system yet**: research and suggestions only, never "the campaign is live".

## References
`official-sources.md` (Habbo.com + sandbox gamedata, campaign detection) · `seasonal-intelligence.md` (season
research, NEW/EXISTING/CHANGED/RETURNING/UNRESOLVED, future campaign architecture) · `feature-discovery.md` (ecosystem
scans, comparison with our systems, suggestion format) · `branding-localization.md` · `knowledge-log.md` (confidence
levels, learned facts, baselines) · `repository-guide.md` (stock_retro layout, formats, search commands) ·
`feature-research.md` · `comparison-workflow.md` · `historical-analysis.md` · `source-validation.md`

## Coordination
Routed by `project-workflow`. When a change crosses into another layer, load that layer's skill too (routing table
there). Ops rules (schedulers, economy config, QA, deploy, CDN, cleanup, docs): `project-workflow/references/operations.md`.
Record new architecture facts in this skill's references.
