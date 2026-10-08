# Seasonal / campaign intelligence

**State (2026-10-01): automated research, no campaign system.** Built: `php artisan hcms:intel-scan` (hCMS scheduler,
hourly at :17) snapshots Habbo.com + sandbox gamedata by hash and records findings in `hcms_intel_findings` (kinds
`campaign`, `furni`, `furniline`, `dev_flag`, `dev_texts`; runs in `hcms_intel_runs`; admin: Administration →
Intelligence findings / scans, review status New → Reviewing/Approved/Rejected/Implemented/Ignored, audited
`intel.reviewed`). For campaign furni it classifies NEW / EXISTING / CHANGED / RETURNING / UNRESOLVED (below) and asks
the resolver for missing assets (3 furni per run, each at most daily). Code: `hCMS/app/Domain/Intelligence/`.
Habbo.nz has **no campaign/season system**: nothing activates, schedules or imports a campaign. A finding's
`habbo_state` (live / scheduled / replaced) is Habbo.com's state, never ours. What exists that a future campaign system
would extend:
- hCMS scheduler (`routes/console.php`, Windows task every minute);
- rare rotations / LTD drops (`RareRotationService`: catalog offer, RCON `updatecatalog`, `GameNotifier`
  announcement, scheduled start/end);
- the HabboPass season (`CityPassSeason`, live-season rule);
- Snowflakes as the seasonal currency (type 103) and the Snowflake shop;
- the catalog's existing **Seasons** tree (e.g. Halloween → Halloween 2022/2023/2024/2025 pages, page id 9966787);
- the catalog pipeline in `project-workflow/references/catalog-sync.md`.

## Research procedure: "What is new for the next season?"
1. Read the live/scheduled promos from Habbo.com (`official-sources.md`): slot schedule → promo keys → campaign code
   (`hween26`), start time, catalog page names, promo images, header/body texts.
2. Name the campaign: code → season word + year. Mappings seen so far are in `knowledge-log.md`; add new ones only when
   verified (furniline and promo agree).
3. Collect the furni: the `furniline` of that season and year, plus classnames that are new since the previous
   snapshot hash.
4. Compare with Habbo.nz and classify each item:

| Class | Rule |
|---|---|
| EXISTING | classname in `items_base` (case-insensitive; `name*N` colour variants count for the base) **and** a `catalog_items` offer sells it |
| RETURNING | furni of an earlier year's line that the source promotes again, or one we have in `items_base` but sell on no page |
| NEW | no `items_base` row for the classname |
| CHANGED | we have it but the source differs in name, size or sit/lay/walk, **and** our row was not hand-edited (a Furni Editor `furni.edited` audit wins; never overwrite a staff edit) |
| UNRESOLVED | no classname, no `.nitro`/icon from any source, or no trustworthy physical data. Kept on the list, never imported, never replaced with invented content |

5. Assets: `.nitro` and icon presence on our CDN (`bundled/furniture/<base>.nitro`,
   `dcr/hof_furni/icon/<base><_N>_icon.png`). Missing ones go through the existing resolver: RCON
   `furnisourcesresolve` by classname (`project-workflow/references/asset-rendering.md`); previews via
   `render-furni-preview.py`.
6. Output a research record (`knowledge-log.md` format) plus suggestions: which furni to import, which page in the
   Seasons tree, a possible event/quest/HabboPass tie-in. Prices follow **our** economy (catalog-sync step 6), never
   Habbo's.
7. Importing anything goes through catalog-sync (additive sync, reviewed SQL, backup tables, user approval).

## Future campaign lifecycle (architecture, not built)
RESEARCH → DISCOVER → COMPARE → SUGGEST → DESIGN → IMPLEMENT → TEST → APPROVE → SCHEDULE → ACTIVATE → RUN → END → ARCHIVE.
States when built: DRAFT, SCHEDULED, ACTIVE, ENDING, ARCHIVED. Recurring seasons (New Year, Valentine's, Easter,
Spring, Summer, Halloween, Autumn, Christmas/Winter) are data, not hard-coded; Habbo.com detection only proposes
them.

Integration points, so nothing is duplicated when it's built:
| Need | Extend, don't rebuild |
|---|---|
| periodic detection | one hCMS artisan command in `routes/console.php` (`withoutOverlapping`, idempotent by gamedata hash) |
| sources, scans, candidates | the tables designed in catalog-sync "Continuous discovery" (`hcms_catalog_sources/_scans/_candidates`); a campaign is a candidate group, not a second catalog system |
| asset resolution | `FurniSources` RCON `furnisourcesresolve` (built 2026-10-01) |
| FurnitureData entries | `FurnitureDataFile` (the Java in-place editor) gains an append; don't add a second writer |
| loading new furni live | the same calls as `:update_items` (`ItemManager.loadItems()`), then RCON `updatecatalog` |
| scheduled start/end, announcements | the rare-rotation pattern (`RareRotationService::tick/start/end`, `GameNotifier`) |
| admin | Filament, a cluster like `RareEconomy`; actions audited through `AdminAudit::record` |
| seasonal currency / pass | Snowflakes (103), `CityPassSeason` |

Build it only when the user asks for the campaign system. Until then, research records and suggestions are the
product.

## The official campaign kit (VERIFIED 2026-10-03 from habbo.com external_texts, campaign `sept26`)
Every monthly campaign ships as one kit under a code, readable from `featured.offer.<code><part>.title`,
`landing.view.<code>*` and the badge texts. Example `sept26` = Sunset Ranch:
| Part (key suffix) | sept26 |
|---|---|
| `furni` | the line (`ranch_c26_*`) |
| `bundle`, `vbundle` | Ranch Life Bundle, "Put the fire out!" |
| `crack1`, `crack2` | Beginner Farming Tools, Seed Packets (crackables) |
| `craft` | Farmer's Workbench crafting table (+ badge THH1 "Sunset Ranch Crafting Quest") |
| `ltd` | Scary Scarecrow LTD |
| `r1`..`r4` | rares: Little Lamb Plush, Rancher Statue, Spotted Goat, Pumpkin Throne (weekly) |
| `rm` | Glowing Fireflies |
| `ducket`, `variable`, `cf` | ducket items, Variable FX, credit furni |
| room game | `landing.view.game26farm.*` "Sunset Ranch is open!"; badges TTH16 Sunset Rancher, TTH18 Ranch Tycoon, TTH19 Helping Hand, TTH21-26 (one per animal game) |
Gameplay of the room game, quests and crafting: habboquests.co guides (see knowledge-log). Furni carry the game's
states (e.g. `ranch_c26_sign` 12 modes, earth tiles 6, growing plants 3), so our version can use the official furni.
Habbo.com answered our server with DOSarrest "463 Restricted Client" on 2026-10-03: don't work around it; use the
saved snapshots in `hCMS/storage/app/intel/habbo.com/` and retry later.

## Known gaps
- Habbo.com catalog structure, offers, bundles and limited stock: not observable through gamedata (see
  `official-sources.md`).
- The slot time zone isn't verified (times are stored as given; the scanner compares them as UTC).
- Brand-new official furni usually have no `.nitro` anywhere for days or weeks → UNRESOLVED until a retro converts them.
