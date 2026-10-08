# Official Habbo gameplay and economy (research, 2026-10-03)

Reference for building our seasons, games, quests and crafting the official way, with our extras added on top.
Design and build plan: [SEASONS_AND_SUNSET_RANCH.md](SEASONS_AND_SUNSET_RANCH.md).

## Sources
| Source | What it gives | Reliability |
|---|---|---|
| habbo.com gamedata `external_texts` (saved snapshot `hCMS/storage/app/intel/habbo.com/external_texts/*.gz`) | campaign codes, kit parts (`featured.offer.<code><part>.title`), landing promos, badge names/descriptions | official, exact names |
| habbo.com furnidata (same folder) | furni lines, classnames, `furniline` | official |
| habboquests.co badge guides `/guide/<id>` (~2,700, `/guides?page=1..130`) | step-by-step rules of room games and badge events, prices seen in the shop | fan site, high for steps, medium for prices |
| habboquests.co `/news/6` Quests, `/news/3` Wired Tutorials, `/news/4` Tips n' Tricks (mostly crafting) | daily seasonal quests, Wired 2.0 builds, crafting recipes | fan site |
| `C:/tools/stock_retro` (HabTrack) | which retros copied what, and when | retro ecosystem |

Access notes: habboquests returns one HTML shell to plain requests; read it in our own headless Chrome (port 9223).
Habbo.com answered our server with DOSarrest "463 Restricted Client" on 2026-10-03: never work around it, use the
saved snapshots, retry later. Not checked yet: Puhekupla (campaign tracking), Habbox wiki.

## 1. The monthly campaign kit
One code per month, e.g. `sept26` (Sunset Ranch), read from `featured.offer.sept26*.title`:
| Part | sept26 |
|---|---|
| `furni` | NEW: Sunset Ranch Furni! (line `ranch_c26_*`) |
| `bundle` | NEW: Ranch Life Bundle (badge TTH08) |
| `vbundle` | Put the fire out! (badge TTH15) |
| `crack1`, `crack2` | Beginner Farming Tools, Seed Packets |
| `craft` | Farmer's Workbench Crafting Table (badge THH1 "Sunset Ranch Crafting Quest!") |
| `ltd` | Scary Scarecrow LTD (badge TTH06) |
| `r1`..`r4` | RARE Little Lamb Plush, Rancher Statue, Spotted Goat, Pumpkin Throne (one per week, badges TTH02-05) |
| `rm` | Glowing Fireflies (TTH07) |
| `ducket` | NEW: Ducket items! |
| `variable` | NEW: Variable FX! |
| `cf` | Gold Skull Credit Furni |
| room game | `landing.view.game26farm.*`: "Sunset Ranch is open! Quests, rewards, and animals are waiting for you to volunteer." |
Other bundles of the month with badges: Great Farm Bake (TTH09), Floral Farm (TTH10), Hanami 1-3 (TTH11-13),
Camping Trip (TTH14).

## 2. The five loops
### Earn: daily seasonal quests
- In the quest menu: "Activate quest" first, then do the steps. A new quest every day of the season.
- 3-7 steps, each a normal hotel action. Seen in the guides:
  - send 3 friend requests; visit 5 rooms with 2+ players, or 10 rooms with 5+ players;
  - sit on a certain furni (flower wagon, bunny chair, prom chair), step on a rug, lie in a certain bed;
  - take a hand item from a furni (carrot from a fridge) and give it to 2 different users;
  - use a certain teleporter (forest ring, film projector), double-click a certain furni, use a firework 3 times;
  - dance on farm grass with 2 others; wave in 3 different rooms;
  - change hair colour, wear a certain clothing item (bunny ears, tie), wear an effect (ghost, spotlight, butterflies);
  - say a word ("Boo") next to friends while wearing an effect, 5 times;
  - click a certain furni while holding a sign (`:sign 11`);
  - visit a public room and wear your team badge;
  - play Freeze: double-click a freeze block 3 times, throw 3 snowballs, freeze 1 then 3 opponents;
  - finish a badge event (room game) and wear its badge.
- Each step pays the season currency: 100-1,000 (Flowers, Candy, Popsicles, Pumpkins); a full quest 550-4,000.
- Examples: Fae Farm 1-8 (Easter, Flowers), Maude's Mini World (Candy, wear 7 event badges), Neon Prom (Halloween,
  300 Pumpkins), Freeze / Graffiti Life II (Popsicles).

### Spend: season shop
- The season currency buys collectibles and items on a season page until a deadline ("You have until May 1st to
  spend your Candy").
- Shop quests: buy a season item and get currency back. Elvira's Shop (Halloween): Yellow/Blue/Green Skull Bottle
  for 25 Pumpkins each, each step pays 100 Pumpkins; the 4th (Pink Skull Bottle, a later day) pays 50 Duckets.

### Play: room games and badge events
- Built by staff in rooms, often with Wired. Each has its own badge(s); quests ask for those badges.
- Sunset Ranch (§3) and e.g. [Ducket] Mob Heist: arrow teleports, talk to bots, sneak past security cameras to
  collect 6 keys, a 2-minute shooting game (10 bullets, hit the bot 5 times or back to the queue), collect 50 coins of
  loot, gallery search.

### Craft
- One crafting table per campaign (9 credits + 10 diamonds); double-click it to see the recipes; ingredients must be in
  your inventory.
- Ingredients from crackable packs sold on set weekdays (Dreamy Fairytale Book on Mondays, Mirror of Dreams on
  Tuesdays; 4c + 10 diamonds; opens 1 of 8 packs at 12.5% each, 3 ingredients per pack).
- Grown ingredients (Dragonfly Farmstead): Elemental Seed pack (2c + 2 diamonds, each seed 25%); a seed + a certain
  effect becomes fruit, 95% normal / 5% "Dazzling" (Air + HRJP-3000, Earth + Bad Side Floor tile, Water + Watering
  Can, Fire + Torch, Light/Fairy + "All eyes are on you!", Dark + Calaca Mask, Rainbow + Butterflies).
- Some ingredients are crafted (Opulent Star, Ornamental Sundial). Recipes take 3-6 ingredients and give the
  campaign's furni and clothing (Dream Kingdom: Rainbow Path ×3, Cloud Slippers, Dreamer's Pillow, Soothing
  Waterfall, Dreamer's Portal…).

### Buy (premium)
| Item | Price seen |
|---|---|
| Room bundle | 99 credits, or 45 credits + 45 diamonds |
| Weekly rare | 30-40 credits + 30-40 diamonds |
| LTD | 750 credits + 150 diamonds |
| Crafting table | 9 credits + 10 diamonds |
| Ingredient pack | 2-4 credits + 2-10 diamonds |
| Effect | 150 duckets or 1 credit |

## 3. Sunset Ranch (official room game, Sept 2026, habboquests guide 2788)
Room "Sunset Ranch: The Adventure Begins" (owner Giorgos). Players called it the best event in years and asked for it
to stay. Built with Wired 2.0 (variables shown above avatars).

### Farming
- Enter by the entrance. Stand next to a sign and click it to claim that plot until you leave; everything on it is
  saved, crops keep growing while you're away, any plot location works next time.
- `:plant tomato|corn|grapes|pumpkin|eggplant`: you hold the seeds, click plot tiles to plant.
- Grow time: tomato 5 min, corn 10, grapes 20, pumpkin 30, eggplant ("Duckbergine") 60.
- `:water`: hold the watering can and click other players' crops. A watered crop gives +1 (tomato 2 → 3). Both
  players get community tokens when it's harvested.
- `:fertilizer regular|premium` speeds up growth (bought in the shop).
- `:inventory`: bubbles "Your Seeds: Tomato 0 / Corn 3 / …" and "Your Fertilizers: Regular 2 / Premium 0".
- XP from harvesting, feeding animals, watering and games. Start with 4 slots, +1 per level (level 3 = 6, level 5 = 8).
  One player can grow at most 12 at once.
- Hover over an avatar: tokens, crops per type, level + XP bar, coins.

### Shop, orders, community
- Shop: seed bags and fertilizers on stools; hover for the price, click the item then the green button. Day-1 gift:
  5 tomato + 5 corn seeds ("Claim Free Seeds", green button).
- 3 order bots, each with an order (crops → coins or other crops) and a progress bar; orders change when the bar fills.
- Community statue (golden, centre): shared goal; water drop = watering crops, chicken leg = feeding animals.
- Community tokens buy the token badge and pumpkin/eggplant seeds.
- Shop badges: TTH18 "Ranch Tycoon" for 5,000 coins, TTH19 "Helping Hand" for 2,500 community tokens.

### Animal games (badges TTH21-26)
Above each animal pen: a progress bar and the vegetable it needs. The room feeds it together; when full, a yellow
button appears for a limited time; click it to play.
| Game | Rules |
|---|---|
| Mole (no feeding) | far left, always open; `:join`, click 25 moles in 1 min 30 s |
| Bunny | a highlighted bunny vanishes and reappears elsewhere; find it, stand next to it, click |
| Chicken | golden eggs spawn at the coops; carry them to the arrow until each coop counter is 0 |
| Cow | guide the cow to the arrow in time; stay close or it walks away |
| Goat | queue on the arrows; collect a goat, take it to the food it asks for, then carry it to a barn (some barns don't work); each action adds 5 s |
| Pig | stand on the arrow to take a monster plant bed, place it next to a pig; 4 pigs |

### 15 daily quest chains (one per day, final badge TTH16 "Sunset Rancher" after all 15)
1. Welcome to Sunset Ranch: claim a plot; claim free seeds; plant; harvest; complete an order; water another user's crops; buy seeds.
2. Growing Together: plant 5 corn; fertilize a corn; harvest 5 corn; water 3 times; have 6 farming slots (level 3).
3. Life on the Ranch: harvest 5 grapes; feed an animal; complete an animal game; contribute 10 crops to the community challenge; complete 2 orders.
4. Crop Challenge: 3 different crops planted at once; 2 orders; 20 fully grown corn in the room at once (needs other players).
5. Ranch Business: 8 farming slots (level 5); contribute 15 to the community challenge; 3 orders; harvest 10 corn.
6. Good Neighbors: water crops of 3 different users; have 2 of your crops watered; harvest a watered crop; buy something in the shop.
7. Harvest Day: 8 crops planted at once; harvest 20; harvest 3 of 3 different types; 24 fully grown crops in the room at once.
8. Ranch Needs You: feed 2 different animals; water 3 different users; contribute 15; 16 grapes planted in the room at once.
9. Growing Ranch: reach level 10; fill all your slots; fertilize 3 pumpkins; harvest 3 pumpkins; 3 orders.
10. A Little Bit of Everything: harvest 10; 2 orders; water 3 farmers; feed an animal; contribute 10.
11. Special Crops: 3 pumpkins + 2 duckbergines planted at once; fertilize a duckbergine; harvest 2 duckbergines; harvest 3 pumpkins.
12. Community Day: water 5 different farmers; contribute 20 crops to feeding; contribute 20 to the challenge; 15 fully grown duckbergines in the room at once.
13. Experienced Farmer: harvest 3 of each crop type; 4 orders; reach level 8.
14. All Together Now: water 5 farmers; contribute 20 to feeding; contribute 25 to the challenge; 30 fully grown crops in the room at once.
15. Finale: all 5 crops planted; harvest 20; 5 orders; feed 3 different animals; contribute 25; 5 grown crops of each type in the room at once.

### Official furni used (our `items_base`, imported 2026-10-03)
`ranch_c26_sign` "Plant Sign" (12 states), earth tiles `earth`/`darkearth`/`lightearth` (2×2, 6 states), grass
(6), growing plants `small_tomato/grape/duckbergine` (3 states), grown `big_corn/grape/pumpkin/tomato/duckbergine`,
baskets and sacks per crop, `plot`/`plotsmall`, `molehill` (3), `cow`/`piglet` (4), `shed`/`shelter` (8), `scarecrow`
(8), `workbench` (crafting table), rares `ranch_r26_statue`/`spottedgoat`/`pumpkinthrone`. Not imported: 7 clothing,
6 crackables (`*b` non-crackable versions are in).

## 4. Rules for our hotel
- Same loops and same logic as official; our extras on top (user, 2026-10-03).
- Game, quest and season-shop money = the season's quest currency (purse slot 103, renamed per season). Never
  Emeralds or Diamonds as game payouts.
- Premium shortcuts (e.g. premium fertilizer) are optional and paid in Diamonds: faster, never required.
- The server decides every value (prices, timers, rewards); the client only shows them.
