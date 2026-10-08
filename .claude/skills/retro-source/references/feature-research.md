# What each source can tell you

| Question | stock_retro file (data, fact) | Implementation reference (mechanism) |
|---|---|---|
| Does hotel X have feature Y (lottery, fishing, mining, battle pass, casino, prison, auras…)? | `ExternalTexts` / `UITexts` keys and texts (search the feature word in the hotel's language too) | Plugins.rar jars, cosas source, saved client bundles, the hotel's own wiki (e.g. habbo.st GitBook) |
| Which currencies exist and how they are named | ExternalTexts `seasonal.*`, `purse.*`, currency keys; renderer-config `transferwidget.currencies` | client bundle purse code; server values are never in stock_retro |
| Furni: which hotels sell a classname, size, sit/lay/walk, colours, category, line, rare flag | `furnituredata` | `.nitro` assets on the hotel CDN (via the hotel's renderer-config URLs) |
| Furni names / translations | `furnituredata` name/description per hotel; our `furni-names-index.tsv` | |
| Clothing / effects (auras, enables) | `avatar.figuremap`, `avatar.effectmap` | |
| Client feature flags, CDN layout | `renderer-config` | client bundles |
| Commands a hotel offers | ExternalTexts command help keys (when present) | plugin jars, cosas, `docs-habbost-commands.md` / `docs-habbocity-commands.md` in our repo root |
| Staff tools, games, rewards logic, prices, odds | not in stock_retro (only labels) | plugin jars, cosas, HabboCM, live read-only observation |
| UI flows / layouts | texts give window names and steps | saved client bundles + live DOM (read-only) |

Gameplay research extracts: the loop, player actions, server validation, rewards/progression, currencies, cooldowns,
events, UI, room integration and persistence. Then map each to our systems (engagement, Wallet, Presence, Wired, plugin
events). Economy research compares mechanics, never values. Our economy decides the numbers.
