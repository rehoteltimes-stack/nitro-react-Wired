# stock_retro: layout, formats, search

Clone: `C:/tools/stock_retro`. Folders = hotel domains (`ls -d */`, ~86). Files per hotel (counts across hotels on
2026-10-01): furnituredata 85, avatar.figuremap 83, avatar.effectmap 83, external.ExternalTexts 81,
external.UITexts 79, renderer-config 76, external.BadgeTexts 12.

## Formats (JSON, UTF-8 BOM: open with `encoding='utf-8-sig'`)
| File | Shape | Sizes (habbo.st) |
|---|---|---|
| `furnituredata` | `roomitemtypes.furnitype[]` + `wallitemtypes.furnitype[]`: id, classname, revision, category, xdim/ydim, partcolors, name, description, adurl, offerid, buyout, rentofferid, customparams, specialtype, canstandon/cansiton/canlayon, furniline, environment, rare | 27 MB |
| `external.ExternalTexts` | flat `{key: text}` (localisation of the whole client; reveals features, commands, currencies, windows) | 2.9 MB |
| `external.UITexts` | flat `{key: text}` (newer UI, e.g. wired) | 14 KB |
| `external.BadgeTexts` | badge name/desc keys | 1.1 MB |
| `avatar.figuremap` | clothing libraries and part ids | 2 MB |
| `avatar.effectmap` | `effects[]`: id, lib, type, revision | 41 KB |
| `renderer-config` | client config: socket/asset/gamedata URLs, feature flags and numbers (e.g. `transferwidget.currencies`, `banner.min/max`, fps, landscapes) | 15 KB |

Texts are in the hotel's language (German for habbo.st, French for habbocity.fr…).

## Fast searches
```bash
cd /c/tools/stock_retro
grep -l '"classname": "rare_dragonlamp' */furnituredata              # which hotels have a furni
grep -oh '"[a-z0-9_.]*battlepass[a-z0-9_.]*"' */external.ExternalTexts | sort -u   # feature keys by word (75 keys)
grep -l '"[a-z0-9_.]*battlepass' */external.ExternalTexts                         # which hotels (6 on 2026-10-01)
python - <<'EOF'
import json; d=json.load(open('habbo.st/renderer-config',encoding='utf-8-sig')); print(d.get('transferwidget.currencies'))
EOF
```
Big files: read with Python/`grep -o`, never cat them into context. For all-hotel furni names, reuse the index we built:
`furni-names-index.tsv` (classname, hotel names, languages, hotel list; built by `build-furni-names-index.py`).

Tested 2026-10-01: `rare_dragonlamp` is in 85 hotels' furnituredata. Text-key hits across hotels: casino 294 keys / 71
hotels, battlepass 75 / 6, lotto 2 / 2, fishing 2 / 1, prison 1 / 2. A missing key doesn't prove a hotel lacks a feature:
many features use hard-coded strings or another word.

## Updating
`git pull` in the clone (large). Our untracked helper files stay untracked. Never commit or push.
