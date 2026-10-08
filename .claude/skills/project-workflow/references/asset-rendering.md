# Asset resolution and furni previews

One resolver, one renderer, one CDN. Source assets are never modified; a preview PNG is a derived presentation file.

## Resolve (get the source asset)
`FurniSources` (hcms-furnieditor-plugin, table `hcms_furni_sources`) downloads a missing `.nitro` / icon from other
hotels, keeping only files that really are that furni, backing up anything replaced, auditing
`furni.asset_downloaded`.
- Furni Editor button: by `items_base` id.
- **RCON `furnisourcesresolve` {classname, revision, actor_id}** (2026-10-01): by classname, also for furni we don't
  have yet; answers `{classname, nitro, icon, tried}` (`have` / source name / `missing`). The asset version in the
  renderer-configs is bumped only when the classname exists in `items_base`.
- URL placeholders `%libname%`, `%param%`, `%revision%`. Row **habbo.com** (priority 5, icon only):
  `https://images.habbo.com/dcr/hof_furni/%revision%/%libname%%param%_icon.png` (VERIFIED 2026-10-01; needs the furnidata
  revision, the `/icons/` path without revision 404s). Rows with an empty `nitro_url` are icon-only.
- Habbo.com has no `.nitro`; new official furni get one when a retro converts them (on 2026-10-01 atlantaserver.me had
  Halloween 2026 furni the same day).

## Render (make a web preview)
`C:/tools/nitro-catalog-copy/scripts/render-furni-preview.py <item_name...> [--from-file f] [--force]`
| Priority | Source | How |
|---|---|---|
| 1 | `cdn/bundled/furniture/<base>.nitro` | Hab-Track **nitro2png** (`C:/tools/nitro2png`, MIT) unpacks the bundle; the script composes the 64px visualisation: direction 2 (else the first), state 0 / first animation frame, layers by z then index, asset offsets, `flipH`, colour tint for `name*N`, layer alpha, ink ADD; cropped to the drawn area |
| 2 | `.swf` in `cdn/dcr/hof_furni` or `bundled/furniture` | Hab-Track **swf2png** (`C:/tools/swf2png`, MIT) via `render-swf.js <swf> <png>`; its output is a sprite sheet, not a composed furni |
| 3 | existing icon `dcr/hof_furni/icon/<name>_icon.png` | reused as is (result `icon_only`) |
| 4 | nothing | `unresolved` (never a substitute image) |
Output: `hCMS/public/cdn/c_images/furni_previews/<item_name with . - * → _>.png`. Log: one JSON line per item in
`C:/tools/nitro-catalog-copy/scripts/out/furni-previews.jsonl`. Existing previews are skipped unless `--force`.
Never brand renders (they show the furni only).

Notes:
- nitro2png's README says it renders states; its code only unpacks (JSON + sprite sheet). The composing is ours.
- **swf2png FAILED on this server (2026-10-01)**: `swf-extract` throws "incorrect header check" on every bitmap,
  even for the repo's own sample SWF (Node 26). Its local deps were changed to run at all (canvas 3, lodash, approved
  canvas install script in the clone's package.json). Until fixed, SWF-only furni fall back to the icon. Only one
  `.swf` exists on our CDN (misplaced in the icon folder).
- Verified renders: `rare_dragonlamp`, `rare_dragonlamp*4` (tint), `throne`, `hc_chr`.

## Use on the website
`App\Domain\Values\Support\FurniImage` (hCMS): `previewUrl($itemName)` = the preview (`?v=<mtime>`, so no Cloudflare
purge needed) when it exists, else `iconUrl($itemName)`. The Values furni modal uses it
(`ModalController::rareModal` → `imageUrl`). Grids keep icons (sized for them). Value/economy logic is untouched.
Caveat: URLs are built on `config('hcms.cdn_url')`, which is `cdn.habbo.ltd` until `HCMS_CDN_URL` is set
(`infrastructure.md`).

## Typical requests
- "Add the new furni to Values" → the furni must exist in `items_base` and Values (hCMS) first; then render previews
  for those item names; check the modal.
- "Previews for all rares" → export the Values item names (`RareValue` → `items_base.item_name`) to a file and run the
  script with `--from-file`.

## Avatar figure set (2026-10-02)
- Client and hcms-imager both load `cdn/habbocity/gamedata/FigureData.json` / `FigureMap.json` and
  `cdn/habbocity/bundled/figure/` (renderer-config uses `?v=`; bump it on every change, browsers keep JSON for 7 days).
- It is HabboCity's set plus merged official clothing (Phase A, see hCMS PROJECT_STATE "Figure merge Phase A").
  Merge rules: never change existing sets/parts; add only libraries with new names and parts whose number is free
  (or same library); renumber clashing set ids from 80,000,000; hard-link the .nitro files.
- Restart the imager after changing figure files (`schtasks /End /TN hcms-imager`, then stop the `node dist\index.js`
  process by PID, then `/Run`).
- Phase B (clashing part numbers): rewrite a copy of the official .nitro as `<lib>_hcm.nitro` with new part ids
  (asset names, `source`, sprite-sheet frame keys `<lib>_<asset>`, json `name`, `meta.image`); never edit the
  hard-linked originals. .nitro = uint16 file count, then per file uint16 name length + name + uint32 length +
  zlib data (json + png). Script: session scratchpad `phase_b.py` (2026-10-02).
