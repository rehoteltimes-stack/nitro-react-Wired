# Official sources: Habbo.com and sandbox.habbo.com

Habbo.com = the official seasonal/campaign reference. sandbox.habbo.com = development/testing signals. Neither controls
Habbo.nz. Everything here was checked from this server on 2026-10-01 unless marked otherwise. Re-check before relying
on it; Sulake can change any of it.

## What a plain server request gets (VERIFIED 2026-10-01)
| URL | Result |
|---|---|
| `https://www.habbo.com/gamedata/hashes2` | 200 JSON: `{"hashes":[{name,url,hash}]}` for furnidata, productdata, external_variables, external_texts, figurepartlist(_json) |
| `https://<host>/gamedata/<file>/1` | 307 to `/gamedata/<file>/<hash>` (follow redirects: `curl -L`) |
| `https://sandbox.habbo.com/gamedata/hashes2` | 200, same shape, its own hashes |
| `https://www.habbo.com/` | 200, an SPA shell (no campaign data in the HTML) |
| `https://www.habbo.com/api/public/news` | 404 (no news API at that path) |

A browser User-Agent was sent. No login, no Cloudflare challenge. Sizes on 2026-10-01: external_variables ~260 KB,
external_flash_texts ~3.7 MB, furnidata_json ~9.8 MB (18,256 furni), productdata_json ~2.8 MB.

**Change detection = the hash.** A new hash in `hashes2` means that file changed. Keep snapshots by hash; a run whose
hashes didn't change has nothing new to process.

## Where the campaign is (VERIFIED 2026-10-01)
`external_variables` is `key=value` lines.
- `landing.view.dynamic.slot.<n>.conf` = a schedule `YYYY-MM-DD HH:MM,<promoKey>;YYYY-MM-DD HH:MM,<promoKey>`. The
  newest start time that has passed is the live promo of that slot; a later one is scheduled.
  `landing_view_promo_slots` gives the slot order. The times are the hotel's local schedule (time zone not verified).
- `landing.view.<promoKey>.conf` → `catalogbutton,...,<catalogPageName>`: the official catalog page the promo opens.
- `landing.view.<promoKey>.layout` → `bitmap.uri,${image.library.url}web_promo_small/<file>.png`: the promo image.
- `landing.view.<promoKey>.header/.body` live in `external_flash_texts` (player-facing text).
- `landing.view.background_*.uri` carry a month tag (e.g. `background_left_sep26.png`).
- Promo keys carry the campaign code: `<code><yy><part>`, e.g. `hween26furni`, `hween26ducket1`, `hween26bundle`,
  `sept26crack2`, `sept26vbundle1`.

Observed 2026-10-01: slots 2-4 switch from `sept26*` to `hween26*` at `2026-10-01 11:00` (Halloween 2026);
`hween26furni` opens catalog page `hween26furni`, image `spromo_NewFurni_Oct26.png`.

## Where the campaign furni are (VERIFIED 2026-10-01)
`furnidata_json` → `roomitemtypes.furnitype[]` + `wallitemtypes.furnitype[]`, each with `classname`, `revision`,
`furniline`, `xdim`, `ydim`, `canstandon`, `cansiton`, `canlayon`, `name`, `description`, `rare`, `tradeable`.
`furniline` groups a season by year: `habboween_2026` (45), `habboween_2025` (51), `summer26`, `easter_2026`,
`newyear_2026`. The naming is not uniform (`habboween_2026` vs `summer26`), so match on season word + year, and
record each mapping in `knowledge-log.md` once verified.
Classnames don't always contain the campaign code (`hween26_nt_curseddragonlamp` does; most of the line doesn't).

Reconciliation against us (2026-10-01, case-insensitive `items_base.item_name`, colour `*N` variants folded to the
base): `habboween_2026` 0/45 present (all NEW), `habboween_2025` 34/51 present.

## Official JSON feeds and other APIs (VERIFIED 2026-10-03, scanned by `hcms:intel-scan`)
| Source | What it gives | Scan |
|---|---|---|
| `https://images.habbo.com/habbo-web-news/en/production/front.json` | the 30 newest Habbo.com news articles (id, title, published ms, summary, categories, thumbnail, path); the web app reads articles from `.../articles/<id>_<slug>.html` | kind `news`; staff write **our own** article from it in Admin > News > "From Habbo news" (never imported, user 2026-10-03) |
| `https://www.habbo.com/api/public/achievements` | all 167 official achievements: name, category, state (ENABLED / ARCHIVED / OFF_SEASON), level thresholds | kind `achievement`, compared with our `achievements` table: NEW / CHANGED / EXISTING |
| `https://www.habbo.com/api/public/users?name=` and `/users/<uniqueId>/...` | public profiles, badges, achievements of one Habbo | not scanned (players' data) |
| `https://habbofurni.com/api/v1/furniture` | furnidata of 10 official hotels + swf data | needs an account Bearer token; same data as our furnidata scan, not used |
| `https://www.habboassets.com/api/v1/badges` | newest badges per hotel | answered `Server Error` on 2026-10-03; retry before relying on it |
| `habboquests.co` | quest/badge/Wired guides (see `knowledge-log.md`) | browser-rendered, read with our headless Chrome |
- `habboquests.com` (with `.com`) is no longer the guide site: it serves a bot-check page with ad-network scripts. Use `.co`.
- Not public: marketplace stats (`/api/public/marketplace/stats/...` → "Cannot GET/POST"), hot looks, news under
  `/api/public/news`.
- Badge art: `images.habbo.com/c_images/album1584/<code>.gif` (also `.png`); our copy lives in
  `hCMS/public/cdn/c_images/album1584/`.

## Not available from these sources
- Catalog pages, offers, prices, bundles and limited stock of Habbo.com: they're not in gamedata. The catalog page
  **names** come from the promos. Habbo.com's own client and its socket weren't inspected (UNKNOWN). The
  nitro-catalog-sniffer reads Nitro hotels; whether it can read Habbo.com is not tested. Never break socket crypto
  (catalog-sync hard limits).
- `.nitro` bundles: Habbo.com doesn't serve Nitro bundles. New official furni get a `.nitro` only once some retro has
  converted them (resolve through the Furni Editor sources, else UNRESOLVED).
- Icons: Habbo's icon URL pattern `images.habbo.com/dcr/hof_furni/<revision>/<classname>_icon.png` is general
  knowledge, not verified here yet.
- Prices: never take them as ours anyway (economy rule).

## sandbox.habbo.com signals (VERIFIED 2026-10-01)
Compared with www on the same day:
- furnidata: identical classname sets (18,256 each), apart from one stray entry on each side;
- external_flash_texts: 1,687 sandbox-only keys, 510 changed;
- external_variables: 34 sandbox-only keys, 69 changed.

Sandbox-only variables include feature flags (`monsterplants.harvesting.enabled`, `achievement.post.enabled`,
`collectibles.hub.enabled` changed, `sandbox.enabled`) **and old test noise** (`test_230807`, `testingtesting1`, 2020-2023
promos). So:
- a key that exists only on sandbox = DEVELOPMENT (or EXPERIMENTAL when the name says test/experiment);
- the same key later on www = CONFIRMED (record the date it appeared there);
- old/static sandbox-only keys that never move = UNKNOWN noise; don't re-report them every run (keep a baseline).
Sandbox findings are research records and suggestions, never "Habbo released X".

## Procedure (automated by `hcms:intel-scan`; manual commands for ad-hoc checks)
```bash
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36"
curl -s -A "$UA" https://www.habbo.com/gamedata/hashes2
curl -s -L -A "$UA" -o www.external_variables https://www.habbo.com/gamedata/external_variables/1
grep -E '^landing\.view\.dynamic\.slot\.[0-9]+\.conf' www.external_variables
grep -E '^landing\.view\.<promoKey>\.(conf|layout)' www.external_variables
```
furnidata/texts are large: read them with Python (`json.load(..., encoding='utf-8-sig')`), never cat them. Compare to
our `items_base` (case-insensitive, `*N` folded) and to `hCMS/public/cdn/gamedata/FurnitureData.json`. Then continue
with `seasonal-intelligence.md` (classification) and `project-workflow/references/catalog-sync.md` (import path).
Store snapshots you want to keep by hash under `C:/tools/official-gamedata/<host>/<file>/<hash>` (folder not created
yet; create it the first time), and log the run in `knowledge-log.md`.
