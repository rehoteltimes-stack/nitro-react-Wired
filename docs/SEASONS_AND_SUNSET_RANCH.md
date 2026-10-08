# Seasons + Sunset Ranch (design, 2026-10-03)

Goal (user): our hotel follows official Habbo's gameplay and economy logic. When furni are released they have the
same use as on Habbo.com (crafting, games, quests, season shop). We add extra features on top. First build: the
Sunset Ranch room game ("game first", user 2026-10-03). Full research: [OFFICIAL_HABBO_GAMEPLAY.md](OFFICIAL_HABBO_GAMEPLAY.md).

## 1. Official model (research, sources in `retro-source/references/knowledge-log.md` + `seasonal-intelligence.md`)
- **Campaign kit** per month, one code (e.g. `sept26`): furni line, bundles, crackables, crafting table + crafting
  quest, LTD, 4 weekly rares, ducket items, Variable FX, a room game with its own badges, landing promo.
- **Season currency** (user: "the game currencies is always quest currency … so its season"): each season has one
  quest currency (Halloween = Pumpkins). Earned from the season's quest series and games, spent on a season shop page
  ("Elvira's Shop": items for 25 Pumpkins, shop quests that pay 100 Pumpkins back, last step 50 Duckets).
- **Sunset Ranch** (official game, built with Wired 2.0 variables), from habboquests guide 2788:
  - claim a plot by clicking its sign (kept while you are in the room; progress saved; growth continues offline);
  - `:plant tomato|corn|grapes|pumpkin|eggplant` then click plot tiles; grow times 5/10/20/30/60 min;
  - `:water` then click other players' crops: +1 harvest (tomato 2 → 3); both get community tokens when harvested;
  - `:fertilizer regular|premium` speeds growth; `:inventory` shows seeds and fertilizer;
  - XP from harvesting, feeding, watering, games; each level +1 plot slot (start 4);
  - hover stats above the avatar: tokens, crops per type, level bar, coins;
  - shop: seed bags and fertilizer, click item then the green button; day-1 gift: 5 tomato + 5 corn seeds;
  - 3 order bots with changing orders (crops → coins or other crops);
  - community statue: shared goal (water drop = watering, chicken leg = feeding);
  - 6 animal games: mole (`:join`, 25 moles in 90 s, no feeding), bunny, chicken, cow, goat, pig (the 5 others need
    the room to feed that animal first, then a button spawns for a limited time);
  - 2 shop badges (5,000 coins / 2,500 tokens), TTH16/18/19 + TTH21-26 badges;
  - 15 daily quest chains (3-7 tasks each, listed in the guide), final badge after all 15.

## 1b. Official gameplay loops (28 habboquests guides read 2026-10-03: quests, crafting, bundle/LTD/rare/ducket)
| Loop | How official does it |
|---|---|
| **Earn (season)** | Daily seasonal quests in the quest menu ("Activate quest"), new quest every day of the season. 3-7 steps, each a common hotel action: send friend requests, sit on a certain furni in a public room, take a hand item from a furni and give it to 2 users, use a certain teleporter, dance on a furni with 2 others, change hair colour, wear a badge or effect, wave in 3 different rooms, say a word near friends while wearing an effect, finish a badge event (room game) and wear its badge. Each step pays 150-1,000 of the season currency (Flowers, Candy, Pumpkins). |
| **Spend (season)** | The season currency buys collectibles/items on a season shop page until a deadline ("you have until May 1st"). Shop quests: buying a season item pays currency back (Elvira's Shop: buy for 25, get 100), last step pays Duckets. |
| **Play** | Room games / badge events built by staff (Sunset Ranch, [Ducket] Mob Heist: bots, teleports, timed mini-games, collect items), each with its own badge. Quests require those badges, which links play to earning. |
| **Craft** | One crafting table per campaign (9c + 10 diamonds). Ingredients come from crackable packs sold on set weekdays (2-4c + 2-10 diamonds; 1 of 8 packs at 12.5%, or each seed 25%). Some ingredients are grown: a seed + a certain effect turns into fruit (95% normal, 5% "Dazzling"). Recipes of 3-6 ingredients give the campaign furni/clothing; some recipes make intermediate ingredients. |
| **Buy (premium)** | Monthly line + bundles (99c or 45c + 45 diamonds), weekly rares (30-40c + 30-40 diamonds), one LTD (750c + 150 diamonds), effects (150 duckets or 1c). Prices pair credits with diamonds. |
Our version keeps these loops with our currencies (season currency = slot 103; premium = Diamonds/Emeralds per the
P2W-but-fair rule) and adds extras. Mapping of official credits/diamonds to ours: open question (decide per phase).

## 2. Our mapping
| Official | Ours |
|---|---|
| Season currency (Pumpkins…) | the purse's seasonal slot, type **103** (today "Snowflakes", earned by the 10-minute online timer `hotel.auto.gotwpoints.*`). Name + icon come from the active season record. Payouts through `engagement/Wallet.give` (ledger). Never Emeralds/Diamonds. |
| Coins of the game | = season currency (103) |
| Community tokens | game-local counter (only helping others; spent on the token badge and seeds), not a purse currency |
| Wired variable hover stats | Phase 2: our own above-avatar overlay fed by the plugin (exact numbers, server-authoritative). Our Wired fork has `wf_var_user` + `wf_xtra_var_lvlup_system` if we later want staff-built rooms. |
| Quest chains | the quest engine (`engagement/DailyQuests`, `hcms_daily_quest_pool`) extended with season chains; Nitro quest protocol later (already on the "Later" list) |
| Premium fertilizer | optional purchase with Diamonds (faster, never required) = the "P2W but fair" rule |

## 3. Architecture (server decides everything)
- Plugin package `hcms-emulator-plugin/.../seasons/` (season record, currency name, active season) and
  `.../games/ranch/` (the game), like `games/FurniSpawns` / `games/Automat`. No new plugin jar.
- Tables (created at boot, `CREATE TABLE IF NOT EXISTS`): `hcms_seasons` (code, name, currency_type, currency_name,
  icon, starts_at, ends_at, active), `hcms_ranch_settings`, `hcms_ranch_players` (user, xp, level, tokens, seeds,
  fertilizer, gift_claimed), `hcms_ranch_crops` (user, room, tile, crop, planted_at, ready_at, watered_by,
  fertilized), `hcms_ranch_orders`, `hcms_ranch_community` (goal progress), `hcms_ranch_quests` (day, step, progress).
- Furni = the official ranch line we imported (`ranch_c26_*`). Their states (sign 12 modes, earth tiles 6, growing
  plants 3, big crops) show plot/growth state; the plugin sets the state, the client only draws it.
- Commands through `HabboCityCommands` (permission columns), handled only in the ranch room(s).
- Client: one window for the shop/inventory/orders (copy the Automat/Swap-o-Matic window layout), bubbles via the
  existing notification feed, a small above-avatar stats overlay.
- Admin: Staff Tools > Games gets a "Sunset Ranch" tab (same layout as Lottery/Spawns): room, prices, grow times,
  rewards, on/off.

## 4. Phases
1. **Season base + core loop**: season record (103 name/icon), plots (claim by sign), plant/water/fertilize/harvest
   with grow timers, seeds/fertilizer inventory, shop, day-1 gift, XP/levels/slots, order bots. Room built from the
   official furni.
2. Hover stats overlay, community statue, token badge + coin badge, first quest days.
3. Animal games one by one (mole first: needs no feeding).
4. All 15 quest chains + TTH badges; season shop page + shop quests (Elvira's-shop pattern).
5. Campaign checklist (the official kit vs what we have) in the admin panel.

## 5. Open questions (ask when the phase starts)
- Exact numbers official doesn't publish (seed prices, XP per action, order rewards): start from the guide's
  screenshots and the time-to-earn price rule, tunable in the settings table.
- Which room: a new official "Sunset Ranch" room owned by officialrooms (built by script like the prison room).

## 6. Recorded official room 2 (G-Earth, 2026-10-03) → build reference for the "everything in one go" phase
User decisions (2026-10-03): quest rewards in our season currency at Habbo's amounts; build orders, community
challenge, animal feeding, animal games, quest engine and a Lotto-Live-style quest panel for rooms 538/539 together.
- **Bots** (room 2 = our 539): order buyers **Joshua (24,34), Frederik (26,34), Margot (28,34)** (z .34, in a row);
  shopkeeper **Chloe (13,42)**. Room 1 (538): Roxie (46,39), Bianca (54,20), Matheus (52,21). Figures in the export.
- **Orders**: one per buyer, counters over the bot (crop icons, gold, time-left bar 100 → 0 at 0.63 s per step ≈ 60 s,
  buyers staggered 20 s), 1-4 crop types × 1-8, reward gold ≈ 1 + Σ qty × (tomato 2, corn 3, grapes 4, pumpkin 6,
  eggplant 6), +5 XP per order, shared by everyone, sell to the same buyer repeatedly.
- **Shop** (counters on furni): seed bags tomato 2 / corn 5 / grapes 9 gold, pumpkin 10 / eggplant 15 tokens;
  fertilizer `ranch_c26_soil` (11,43) regular 10 gold, (11,42) premium 15 tokens; badges `bc_sphere*17` (9,39)
  5,000 gold, (10,39) 2,500 tokens; green button (12,47) buys the selected item.
- **Animals** (feed with crops they ask for, 5 per click): bunny `circus_c24_surprisebunnyhat` (36,21) grapes+corn;
  chickens `easter_c17_chickens` (38,16) grapes+tomato+corn; cow `ranch_c26_cow` (43,11) grapes+corn+tomato; goat
  `ranch_r26_spottedgoat` (48,11) grapes+corn+tomato; pig `ranch_c26_piglet` (55,10) tomato+grapes+corn. Each shows
  a food bar 0-100 %, a time-left bar and fed-crop counters. Full → a yellow button opens the animal's game for a
  limited time (habboquests). Games: mole (no feeding, `:join`, 25 moles in 90 s), bunny (find it), chicken (carry
  golden eggs to the arrow until coop counters reach 0), cow (herd to the arrow), goat (fetch, feed, barn, +5 s per
  action), pig (carry a monster plant bed to 4 pigs). Each game has a badge.
- **Community challenge**: golden statue `mnstr_seed_rare` (38,31): counters planted (sapling, 0→265), fed (food,
  0→185), watered (droplet, 0→295), progress bar (0→99). You join by contributing; stay in the room until it completes;
  reward = a monster plant seed (`mnstr_seed_nt`, rarity 3 seen). `:challenge` shows eligibility.
- **Quests**: 15 day chains (habboquests 2788 + client texts), next chain 16 h after finishing the last
  ("Your next quest will be in 16 hours…"); Day 1 rewards 0/0/0/15/20/0/25 (Habbo Duckets → our season currency).
- XP: plant +1, harvest +1, order +5, watering/feeding/games give XP; levels unlock slots (4 + level − 1, max 12);
  tomato yield 2, +1 when watered; watering gives tokens to both when the crop is harvested.
