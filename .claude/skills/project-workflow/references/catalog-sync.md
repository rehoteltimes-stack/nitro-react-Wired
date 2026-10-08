# Catalog copy / import / sync ("Copy this hotel's catalog")

Use the existing pipeline. Don't write a second importer. Verified against the tools on 2026-10-01.

## The existing tools
| Stage | Tool | Output |
|---|---|---|
| Crawl source hotel | `C:/tools/nitro-catalog-copy/scripts/run.js` (orchestrator, process lock `.run.lock`): attaches to the user's logged-in debug Chrome (port 9222, `CDP_PORT`), detects the Nitro tab, `ensure-furniture-data.js` (source FurnitureData in-browser), `dom-scrape.js` (clicks through the catalog UI; resumable), `exhaustive-source-asset-acquisition.js` | `catalog/`, `furniture/`, `raw/` |
| Build | `build-output.js --sql` → `clone-database.js` (isolated DB `ltdhabbo_build_<hotel>`, name from `db-connection.deriveBuildDbName`; refuses an existing DB unless `FORCE_RECLONE=1`) → `repair-offer-linkage.js` → `validate-build-db.js` | `builds/<hotel>/` (catalog, furniture, nitro, assets, sql, reports, `manifest.json`) + the build DB |
| Data fixes (optional) | `fix-*` scripts (physical fields from `.nitro`/families/majority), `sit-lay-walk-classifier.js`, `translate-unmatched-furni.js`, `generate-furnidata-*`, `rekey-furnidata-to-items-base-id.js`, `relink-*` | in the build DB / files |
| Assets for HabboCity specifically | `hc-sync.js report|assets|assets-all`, `hc-icons.js`, `hc-page-icons.js`, `hc-nitro-retry.js`: requests made from inside the user's HabboCity tab | `hCMS/public/cdn/{bundled/furniture,dcr/hof_furni/icon,c_images/catalogue}` |
| Missing assets per furni | RCON `furnisourcesresolve` by classname (`asset-rendering.md`) or Furni Editor "Download missing from other hotels" (`hcms-furnieditor-plugin` `FurniSources`, table `hcms_furni_sources`, 29 hotels without a Cloudflare block) | CDN + backup in `hcms-furni-backups` |
| Into hcms (full rebuild) | `php artisan hcms:catalog-stage --source=<db> [--official=...]` → `stage_items_base/catalog_pages/catalog_items` + generated FurnitureData + `catalog-stage-report.json`; then `php artisan hcms:catalog-swap` (atomic RENAME, keeps `old_<suffix>_*`, `--rollback=<suffix>`) | live catalog tables |
| Names | `furni-names-index.tsv` + Furni Editor bulk rename / words | |
| Research | `retro-source` (stock_retro furnituredata/texts of the hotel, its history) | |
| Live catalog of a Nitro hotel by passive capture | `C:/tools/nitro-catalog-sniffer` (`sniff.js` + `decode-capture.js` while the user browses; `fetch-static-gamedata.js` for renderer-config gamedata) | captured pages/offers |
| Official campaign furni → our catalog (additive) | `C:/tools/nitro-catalog-copy/scripts/sync-official-furni.py --campaign <code> --parent-page <id> --caption <text> --after-page <id> [--apply]`: reads `hcms_intel_findings` + the habbo.com furnidata snapshot + our `.nitro`; classnames already in `items_base` are skipped; special logic (crackable, teleport, …) and size disagreement (furnidata vs `.nitro` dimensions) go to review; missing assets = unresolved; free offers (`points_type` 0, cost 0); stack height from `.nitro` `logic.model.dimensions.z`; interaction modes = animation count for multistate (INFERRED, the 71% heuristic) | `out/official-sync/<code>/sync.sql`, `furnidata-additions.json`, `report.json`. `--apply` (only after approval) runs the SQL in one transaction, backs up + patches `FurnitureData.json`, bumps the furnidata `&n=`; then an emulator restart loads the items + catalog |
| Official seasonal lines → season pages (bulk) | `resolve-official-assets.py --lines-file f` (art for whole lines via RCON `furnisourcesresolve`, 4 workers), then `sync-official-seasons.py --lines-file f [--apply]`: line → season page by rules (Easter/Halloween/Christmas/New Year/Valentine's under Events, Summer/Winter under Seasons), existing page = top up, lines with <4 furni → "<Season> Classics", current-year lines mirrored under New → <Season>; review items (LTD, crackable, clothing) → Staff → Seasonal Economy (min_rank 7) | `out/official-sync/seasons/` |
| Official Habbo.com / sandbox source | plain HTTP gamedata by hash (`retro-source/references/official-sources.md`): furnidata `furniline`, promo schedule, catalog page names. No offers/prices | research records; seasonal candidates follow `retro-source/references/seasonal-intelligence.md`, then steps 3-10 below |
Tool docs: `C:/tools/nitro-catalog-copy/README.md` and its `CLAUDE.md` (270 KB; grep only. "How to run this on a NEW
hotel" is in the session 8 section).

## Hard limits (from the tool and the user)
Read-only observation inside the user's own logged-in browser. No Cloudflare/login/CAPTCHA bypass, no crafted game
packets (UI clicks only), no breaking a hotel's websocket crypto, attach to Chrome but never launch it for the user.
Never defeat licence/domain locks.

- **Catalog = decoration, crackable = events** (user, 2026-10-03): never sell a `crackable_master` furni that has an
  `items_crackable` row (it resets after each crack = unlimited prizes). Sell the "(Non Crackable)" twin; the crackable
  one only spawns or comes from staff events. Check `items_base.interaction_type` of every offer in an import.
- **Seasonal vault** (user, 2026-10-03): prize crackables and clothing live in Staff › Seasonal Economy / Seasonal
  Clothing (rank 7) and go on sale only per season via `hcms:seasonal-vault release <season>` (or the Catalog discovery
  buttons); `lock` puts them back. Imports put new seasonal crackables/clothes there, never on player pages.
- Arcturus checks only the offer's own page rank on purchase: a page under a hidden/staff parent must carry the
  parent's rank itself.

## ⚠ Full replace vs. sync into the live catalog
`hcms:catalog-stage` + `catalog-swap` **replace the whole catalog**. Since the 2026-09-20 swap the live catalog has many
edits a re-stage would lose:
- free catalog except VIP/Rares in Diamonds;
- `offer_id = catalog_items.id` and `sprite_id = items_base.id`, plus the FurnitureData rekey;
- colour-variant fixes; Information and VIP pages;
- rare rotation / LTD pages, the Snowflake shop;
- names from Hab-Track; the pet import.

The stage also drops furni no kept offer sells. That deleted every `a0 petN` once; whitelist pets before any
re-stage. Use a full stage/swap only when the user explicitly wants a fresh catalog, and confirm first.

**The default for "copy/sync/update another hotel's catalog" is an additive sync into the live catalog:**
1. **Identify** the hotel and its renderer-config / gamedata URLs (stock_retro has `<hotel>/renderer-config` and `furnituredata`).
2. **Crawl/build** with `run.js` (needs the user's Chrome session on that hotel), or reuse an existing `builds/<hotel>/`.
3. **Match** source pages to live pages by furni-set overlap (method used 2026-09-27: page-crawl map; 992/1,166
   pages matched). Classnames are resolved against live `items_base.item_name` and our `FurnitureData.json` (`name*N`
   colour variants; the crawl may write `name_N`).
4. **Diff**:
   - new furni → new `items_base` rows (next free id, `sprite_id = id`) + FurnitureData entries;
   - missing offers on matched pages → new `catalog_items` (`offer_id = id`);
   - new pages → new `catalog_pages` under the matching tab;
   - changed data (order, colour variant, name) → UPDATEs on the existing ids;
   - never renumber existing ids that players own or rares reference (`values_rares`, `users` items).
5. **Assets**: for each new classname check `bundled/furniture/<base>.nitro` and `dcr/hof_furni/icon/<base><_N>_icon.png`.
   Fetch them through the existing tools: in-browser for the source hotel, Furni Editor sources for others. Compare
   icons by pixel colour, not bytes (hotels re-encode PNGs; the dragon-lamp shift bug).
6. **Generate SQL** into a reviewable file (backup tables `bak_<date>_*` first). Prices follow our economy rule (free
   except VIP/Rares in Diamonds); never copy the source hotel's prices blindly.
7. **Validate before applying**:
   - no orphan offers or parents; no duplicate `item_name` or `sprite_id`;
   - every offer's furni exists with a valid `interaction_type` known to `ItemManager`;
   - sit/lay/walk, size, stack height and modes come from the reference DBs (`hubblycata`, `habboworld`, `ltdhabbo`) +
     `.nitro` with two-source agreement (2026-09-27 rule);
   - currencies only 5 (or the agreed type); the furni exists in FurnitureData; assets resolve.
   - ENUM flag columns (`catalog_pages.visible/enabled/club_only`, `vip_only` = ENUM('1','0'), `catalog_items.have_offer/
     club_only`) take quoted values; an unquoted 1 means the first enum value ('0') and hides the page (2026-10-01).
   - `catalog_items.catalog_name` = the display name ("Weed 3"), not the classname: the catalog shows it as the title.
   - **New furni always also go on a page under NEW** (`catalog_pages` 9966554, one child page per line, newest first;
     user rule 2026-10-01). `sync-official-furni.py` mirrors the campaign page there (`--new-parent`).
     Seasonal lines go one level deeper: New → <Season> category (empty page with the season icon, e.g. New → Halloween
     9967781, pumpkin icon 34) → <Season YYYY> page; pass `--new-parent <that category id>` (user, 2026-10-01).
8. **Report** unresolved items (no classname, no asset anywhere, no reference data) as a list. Never invent data.
9. **Apply only after the user confirms** (mass production change). Then: `:update_items` + `:update_catalogue` (or
   RCON `updatecatalog`), bump `?v=` on `furnidata.url`/asset/icon URLs in both renderer-configs, and verify in the dev
   client: pages open, offers render, a purchase delivers the right colour, the item places and interacts.
10. **Document** in `docs/PROJECT_STATE.md` (what was added/changed/unresolved, backups, SQL file).

## Gaps (be honest about them)
- Official campaign furni now have a script (`sync-official-furni.py`, above). The page-matching and diff/SQL steps for
  another *retro's* catalog were done with session-scratchpad scripts on
  2026-09-27 (`page-crawl-map.json`, colour fix). They aren't in the tool. Rebuild them as one script in
  `C:/tools/nitro-catalog-copy/scripts/` the first time this workflow runs again, not in a second tool.
- `run.js` end-to-end chaining was never live-tested on a second hotel (tool CLAUDE.md session 8).
- Pets/adoption tiles don't expose classnames in the DOM. They need the React-props reader (`eval-in-iframe-main.js`;
  the walker `hc-walk.js` lived in a scratchpad).
- The build DB schema follows the LTDHabbo base; `hcms:catalog-stage` maps it to our Arcturus tables. Check columns
  when the source DB differs.

## Continuous discovery + admin approval (design 2026-10-01; steps 1-2 built 2026-10-03, furni level only)
Goal: detect what a reference hotel (e.g. HabboCity) added or changed, show only NEW / CHANGED / UNRESOLVED items in
the hCMS admin panel, and import an item only when an administrator clicks Add. It is one system: the existing crawler
+ build + asset tools feed it, and Arcturus catalog tables are the final destination.

### Flow
```
scan (nitro-catalog-copy run.js / ensure-furniture-data, in the user's Chrome) → normalize (build-output)
→ compare against live hcms (the sync step above) → write candidates → Filament review → Add / Ignore / Retry
→ import job (same diff/SQL/asset steps, one candidate group at a time) → validate → mark synchronized
```

### Data (hcms, plugin-free; created by an hCMS migration)
- `hcms_catalog_sources`: hotel, gamedata/asset URLs (from renderer-config), last scan, enabled.
- `hcms_catalog_scans`: source, started/finished, counts, status, log path.
- `hcms_catalog_candidates`:
  - kind: page / furni / offer / bundle / asset / furni_update;
  - source key (hotel + classname / page path / offer key), parent page;
  - status: new / changed / unresolved / ignored / queued / imported / failed;
  - reason (why it's new or changed: which fields differ), source payload JSON;
  - matched live ids, asset status (nitro / icon: present / fetched / missing), import result, timestamps.
    The source key is unique, so a re-scan updates the row instead of duplicating it. Ignored stays ignored until
    the source changes again.
- Imported records keep pointers back to their candidate, so a later scan sees them as EXISTING.

### Classification rules
- EXISTING: classname in live `items_base` (or an `*N` colour match) and an offer for it on the matched page.
- NEW: no live classname, no live offer on the matched page, or no matched page.
- CHANGED: the source differs from live in name/size/flags/colour or position, and the live row wasn't hand-edited.
  The Furni Editor audit (`furni.edited`) wins, so never overwrite a staff edit.
- UNRESOLVED: no classname, no `.nitro`/icon anywhere, or no reference data for physical fields. Tracked, never imported.

### Admin (Filament, `app/Filament/Resources/CatalogSync*`, pattern of `RareRotationResource` actions)
- Table filtered by source/kind/status.
- Row actions: Preview (icon, `.nitro` present, source vs live diff, target page), Add, Ignore, Retry (re-resolve assets).
- Bulk Add / Ignore.
- Header: Re-scan. Queues a scan request; the scan runs on this machine through the user's Chrome, so it reports
  "waiting for browser" until the tool picks it up.
- Status columns: asset resolution, import status.
- Every action is audited (`catalog.sync_*`).

### Import job (artisan command, e.g. `hcms:catalog-sync-import`, run by the scheduler or right after Add)
- Per candidate: backup rows; insert/update `items_base` (next id, `sprite_id = id`), FurnitureData entry,
  `catalog_items` (`offer_id = id`, our pricing rule), `catalog_pages` under the matched tab.
- Validate (rules in step 7 above); on failure mark it failed with the reason. Nothing half-written: one DB transaction
  per candidate group.
- Then RCON `updatecatalog` (+ `:update_items` equivalent), bump the furnidata `?v=`, mark imported.
- Assets are fetched by the existing tools before import (in-browser for the source hotel, `FurniSources` for others).
  Server-side the job only checks presence.

### Constraints
- No automatic live insert without approval.
- No Cloudflare bypass: scans of protected hotels need the user's browser session.
- No second catalog system: reuse `run.js` stages, build-output normalisation, the reconciliation rules above and the
  asset tools.
- Deploy, restart and the first migration need the user's confirmation.

### Built (2026-10-03)
- Tables `hcms_catalog_sources` / `hcms_catalog_scans` / `hcms_catalog_candidates` (hCMS migration
  `2026_10_03_060000_create_hcms_catalog_sync_tables`). Source habbocity.fr = `C:/tools/stock_retro/habbocity.fr/furnituredata`
  (public furnidata, no browser needed; `git pull` stock_retro to refresh).
- `php artisan hcms:catalog-discover [hotel]` (`App\Domain\Catalog\Services\CatalogDiscovery`, scheduled daily 05:40):
  classname not in `items_base` = candidate; `.nitro` on our CDN = new (asset ok / no_icon), else unresolved (missing).
  Ignored stays ignored until the source payload changes; candidates that appear in `items_base` become imported.
- Filament Administration → Catalog discovery (`CatalogCandidateResource`): icon (our CDN or the source's icon URL),
  filters, Details, Ignore / Restore, bulk Ignore, Re-scan; audit `catalog.sync_*`.
- Step 3 built: Add / bulk Add in the resource and `hcms:catalog-import {keys*}` (`CatalogImporter`), checked per
  candidate:
  - refused: not in the source any more, assets missing, special name or logic (crackable/teleport/vending/…), or a size
    disagreement. Exception: a 1×1 furnidata entry takes the `.nitro` size (`NitroBundle` reader).
  - English name from `stock_retro/furni-names-index.tsv`, else the source name.
  - walk/sit/lay/stack from a colour sibling (all values), else a line sibling (same size and height), else flat
    (height 0) = walkable.
  - offer on NEW → "From <hotel>" (created on first use) plus the category page where the line already is (prefix
    match, flat with flat, no dump/staff/test pages), at that page's most common price, else free.
  - FurnitureData append (backup `.bak-catalogsync-*`) + `&n=` bump in both renderer-configs.
  - RCON `hcmsreloaditems` (hcms-emulator-plugin `sync/ReloadItemsRcon`: ItemManager.loadItems + catalog reload).
- Not built: page/offer candidates (need a crawl), the browser re-scan handshake (step 4).
- Admin mode (2026-10-04): `hcms:catalog-import --source=<hotel> --admin` imports every ready candidate onto hidden
  **Admin** pages (rank 7, free, grouped NFT/Rares/Lines/Creators & Packs/Other <letter>), never NEW. Sources now
  habbocity.fr and hubba.cc (`C:/tools/nitro-catalog-copy/sources/hubba.cc/furnituredata`, direct CDN downloads).
  Clothing/ads/sound/test candidates are auto-ignored by SQL after a scan (not in code).

### Build order (proposed)
1. Discovery tables + a scan writer added to nitro-catalog-copy (compare the build against live hcms, upsert candidates).
2. Filament review resource (preview/ignore/retry, read-only diff).
3. Import command + Add action, with validation and audit.
4. Re-scan request handshake (admin → tool) and asset retry.

## Clothing items (2026-10-02)
- A clothing furni is usable only with `items_base.interaction_type = 'clothing'` + a `catalog_clothing` row
  (name → setid) + a set that exists **in the client's figure files**: renderer-config `avatar.figuredata.url` =
  `cdn/habbocity/gamedata/FigureData.json` (not `cdn/gamedata/`).
- Match by library name (set → parts → FigureMap library), never by set number alone: the official and HabboCity
  files use the same numbers for different pieces. Confirm with img.habbo.nz, which uses the client's files.
