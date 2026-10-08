# Intelligence knowledge log (persistent learning)

What the project has learned about external sources, matching, assets, campaigns and suggestion outcomes. It is how
knowledge survives between sessions. Production code never changes itself from it; a person or a normal workflow task
acts on it.

## Confidence
| Level | Meaning |
|---|---|
| VERIFIED | checked first-hand (request, file, DB query, live test) with date and how |
| OBSERVED | seen once in a source, not re-checked or not fully understood |
| INFERRED | concluded from evidence (texts, config, names) |
| PROPOSED | a suggestion or design, not built |
| FAILED | tried and didn't work (keep it, so nobody repeats it blindly) |
| UNKNOWN | not checked yet |
Rules: never overwrite VERIFIED with a weaker entry; on a conflict add a CONFLICT line, re-check, then update the
entry with the new date. Don't delete entries; mark them superseded.

## Where knowledge goes
- Stable rules / current focus → `CLAUDE.md` (short).
- How a source works, procedures → this skill's references (`official-sources.md`, `feature-discovery.md`,
  `seasonal-intelligence.md`, `branding-localization.md`, `repository-guide.md`).
- Short durable facts and outcomes → the ledger below (one line each, dated, with confidence).
- Full task write-ups, decisions, files changed → `docs/PROJECT_STATE.md`.

## Ledger
### Sources
- 2026-10-01 VERIFIED: `www.habbo.com` and `sandbox.habbo.com` `/gamedata/hashes2` return JSON to a plain server request; files at `/gamedata/<file>/<hash>` (307 from `/1`).
- 2026-10-01 VERIFIED: Habbo.com campaign = `landing.view.dynamic.slot.<n>.conf` schedules in `external_variables`.
- 2026-10-01 FAILED: `www.habbo.com/api/public/news` → 404.
- 2026-10-03 VERIFIED: Habbo news is a JSON feed at `images.habbo.com/habbo-web-news/en/production/front.json` (found in the web app's `habboWebNewsUrl`); `www.habbo.com/api/public/achievements` is public. Both are scanned by `hcms:intel-scan` (197 findings on the first run). habbofurni.com needs a token; habboassets.com badges API errored; habboquests.com is parked (use `.co`).
- 2026-10-03 OBSERVED: official ladders vs ours: 112 official achievements we don't have, 24 with other thresholds, 31 equal. Our `RoomEntry` rows are broken (level 10 = 2400 > level 11 = 1080; level 20 = 39600).
- 2026-10-01 VERIFIED: `www.habbocity.fr` → 403 to a server request (Cloudflare). Use stock_retro + the user's browser only.
- 2026-10-01 OBSERVED: stock_retro clone last pulled 2026-09-20; `habbocity.fr` last commit 2026-09-18. Habbo.com and sandbox are not in stock_retro.
- UNKNOWN: whether Habbo.com's catalog (pages/offers) is readable read-only through its own client (not a Nitro client; not tested).

### Campaigns and seasons
- 2026-10-01 VERIFIED: promo keys `hween26*` replace `sept26*` in slots 2-4 at `2026-10-01 11:00` (hotel time zone not verified) → campaign code `hween26` = Halloween 2026.
- 2026-10-01 VERIFIED: code `hween<yy>` ↔ furniline `habboween_20<yy>` (45 furni in 2026, 51 in 2025).
- 2026-10-01 OBSERVED: other lines `summer26`, `easter_2026`, `newyear_2026`, `nft2026`; naming isn't uniform.

### Matching and assets
- 2026-10-01 VERIFIED: case-insensitive `items_base.item_name`, `*N` folded to the base → `habboween_2026` 0/45 present, `habboween_2025` 34/51 present.
- 2026-10-01 VERIFIED: `FurniSources` resolves by classname over RCON `furnisourcesresolve`; official icons need the revision (`/dcr/hof_furni/<revision>/<classname>_icon.png`, the `/icons/` path 404s). First runs: 9 of 45 Halloween 2026 furni got a `.nitro` (atlantaserver.me) the same day.
- 2026-10-01 OBSERVED: sandbox and www furnidata had the same 18,256 classnames; sandbox texts +1,687 keys, variables +34 keys (flags + old test noise).

### Decisions and outcomes
- 2026-10-01: intelligence first as skill references; later the same day the user asked for automation: `hcms:intel-scan` + findings admin + resolve-by-classname built. The campaign system itself is still not built.
- 2026-10-01: design principle — monetized/P2W-oriented, fair to free players; external prices/rewards are reference only.

- 2026-10-03: user "add all": the 76 remaining non-archived official ladders added (174 total; DailyHotelPresence has no levels, 12 archived skipped); new navigator categories Trading (10) and Role Play (11).
- 2026-10-03: user approved: 12 broken ladders reset to Habbo's thresholds, 19 core-progressed official ladders + RewardTracksCompleted added (backup `bak_20261003_achievements`); findings now 65 EXISTING / 12 CHANGED (balance) / 90 NEW (no progress source).
- 2026-10-03: official `DailyTasksCompleted` (Taskmaster, 20 levels) and `DailyTaskStreakDays` (Streak Freak, 15 levels) added with Habbo's thresholds, progressed by our daily quests (`engagement/QuestAchievements`). The user asked to keep Habbo news as admin suggestions, not imports.

### Baselines (for the next diff)
- 2026-10-01 www hashes: furnidata `21ffeb72…`, external_variables `03005708…`, external_texts `5f9150f9…`, productdata `b0655547…`.
- 2026-10-01 sandbox hashes: furnidata `1c4c2932…`, external_variables `5fa79ee9…`, external_texts `9a1fb2c6…`, productdata `83271701…`.
- stock_retro: last scanned = the clone's HEAD of 2026-09-20 (not yet pulled for an intelligence scan).

## HabboCity clothing economy, live read (2026-10-02, VERIFIED via the user's logged-in Chrome, CDP, read-only)
- No clothing shop page. Clothing is a full economy item next to rares and badges: Center Values / Market (Troc) /
  Auctions / Inventory each have a `clothings` tab (`/center/values/clothings`, `/center/market/clothings`, ...).
- Items are `clothing_*` furni (`swf.habbocity.fr/dcr/hof_furni/image/clothing_*.png`), so tradeable; the value card
  shows copies in circulation, a Diamond value and the "Valeur eco" (= Diamonds x 200). Top: "Sac à dos squelette",
  5 copies, 625 Diamonds / 125K; then 500, 400, 375 ... about 60 per page, 7 pages.
- Where clothing comes from:
  - CityBox loot boxes, opened in the hotel. "[V1] Box vêtements dorés" = 61 lots, all clothing, each with its own
    small stock ("N exemplaires restants", 1-9), drop 0.870 % (7 top items) or 1.739 %, sum 100 %, eco value 2-5K.
    Other boxes (S1-S6 seasons, E1-E4 events like Dragon Ball / Scream) mix Diamonds, clothing, badges and
    sometimes LTD rares.
  - packs ("+ un vêtement exclusif au pack");
  - Emeralds: the VIP page says the daily VIP Emerald is for "acheter des box ou des vêtements tant convoités".
- Not readable from the website: box and catalog prices (sold in the hotel catalog).
- Cloudflare: a fresh tab got "Attention Required"; the user's own logged-in tab worked. Never work around it.

### habboquests.co (fan site, checked 2026-10-03, confidence: HIGH for official mechanics described step by step, LOW for numbers they guess)
- Not a hotel and not affiliated with Sulake. Plain HTTP returns one 32 KB shell for every URL; the content renders in a
  browser (read with our own headless Chrome 9223, no challenge involved). Read-only research, never copied wholesale.
- Badge guides `/guide/<id>` (~2,700, `/guides?page=1..130`, newest 2801): one per official campaign/bundle/rare/
  fansite event, with room name, steps, commands, rewards. Example 2788 "Sunset Ranch" (official sept 2026 room game):
  plots claimed by a sign, `:plant <crop>` (tomato 5 min, corn 10, grapes 20, pumpkin 30, eggplant/duckbergine 60),
  `:water` other players' crops (+1 harvest, community tokens for both), `:fertilizer regular|premium`, `:inventory`,
  XP levels unlock plot slots (start 4, +1 per level), a shop (seeds/fertilizer for coins), 3 order bots, a community
  statue challenge, 6 animal mini-games (mole :join 25 clicks in 90 s, bunny, chicken eggs, cow herding, goat, pig),
  2 shop badges (5,000 coins / 2,500 tokens) and 15 daily quest chains of 3-7 tasks.
- Quests `/news/6` (Fae Farm 1-8, Maude's Mini World, Freeze, Graffiti Life II, Neon Prom, Elvira's Shop), Wired
  Tutorials `/news/3` (~70, mostly "[Wired 2.0]": variables, text connector, anti-camp, real-time clock, teleport to
  room), Tips n' Tricks `/news/4` (~60, mostly official crafting recipes per campaign). Habbo menu: badges, furni,
  teleporter values, badge leaderboard; Extras: imager, alterations.
- Applicability: our quests are `engagement/DailyQuests` (`hcms_daily_quest_pool`, 10 rows); crafting tables exist
  (246 recipes); the Wired 2.0 tutorials match our Wired fork and can serve as test cases and help pages.
- habboquests loops (28 guides, 2026-10-03; HIGH for step lists, MEDIUM for prices since they change): daily
  seasonal quests (common actions, 150-1,000 season currency per step), season shop + shop quests, crafting (table
  9c+10d, weekday ingredient packs, seed + effect → fruit 95/5%), premium (bundle 99c, rare 30-40c+30-40d, LTD
  750c+150d). Summary table in `nitro-react-Wired/docs/SEASONS_AND_SUNSET_RANCH.md` §1b.

### habbo.com live room games via G-Earth (2026-10-03, confidence HIGH for recorded values)
- Method: the user plays in the Habbo Launcher (AIR client) through G-Earth 1.5.3 (manual host `game-us.habbo.com:30000`)
  with our recorder `c:/tools/gearth-room-export` (room snapshots, every packet, `timeline.py`, `variables.py`). We never
  play or automate on habbo.com. Habbo pages (`/gamedata/habbopages/<name>`) and MetroHotel files are read through the
  user's own Chrome tab (9222) when their protection blocks our direct requests (never bypassed).
- Learned: Habbo room games are Wired 2.0: whispers in notification bubbles 2xx with `[b]/[colour]` markup, state shown
  as Variable FX counters over users/bots/furni (decoded format in `variables.py`), game logic hidden from visitors
  (`WiredPermissions` 00 00). Packet room labels lag by one room change; group by `RoomReady`.
- 2026-10-06 | habbo.gd (Wayback) | VERIFIED: 2024 site = German retro "Habbo Golden Dream", PHP landing `blacky-index`
  (Bootstrap 5.1.3, `assets/css|js/blacky-index.*?<ts>`, CSS/JS archived 2023-12 → 2024-04-23, language flags, artwork
  on i.imgur.com WRjji2t.gif/uku3x0o.png still live) → fully reconstructable (local preview rendered). 2026 site = React
  Vite SPA (routes: news, shop/premium|mystery|gluecksrad|tasks, auctions, trades, top-habbos, photos, groups, forms,
  staff/*, eventplan…; palette #333 + gold rgba(251,186,67)); only 6/52 JS chunks archived → CSS shell + auth page only,
  page markup NOT reconstructable. Inspiration only; their logo/artwork are habbo.gd's.
- 2026-10-06 | habbo.gd / habbo.cc | VERIFIED: the 2026 React/Vite CMS (Wayback habbo.gd 2026-04) is the same CMS habbo.cc
  runs live today: all 195 habbo.gd CSS classes are in habbo.cc's CSS (223), same tokens; habbo.cc's bundle says
  "Bezug zu Habbo.cc", imager.habbo.cc, "seit 2023" (same hotel/dev, GoldenDream). BlackyCMS (habbo.gd 2024 PHP,
  blacky-index) is NOT public (GitHub, web, h4bbo.net CMS archive: nothing) and only its index is archived
  (Wayback + archive.today checked; /staff 2024 = 404, logged-in pages never crawled). habbo.gd 2024-06 *.php pages =
  an unrelated MMORPG ("Guru Kal").
- 2026-10-06 | BlackyCMS search | NOT FOUND anywhere: urlscan.io (filename:blacky-index.css/.js, habbo.gd, habbo.cc),
  Common Crawl 2024 (habbo.gd = only the unrelated MMORPG pages), GitHub code search (file names + markers HabboLogin,
  registerButton/toLoginButton, inside-image/online-counter, clip-right, magic-snowflakes habbo), web search. No other
  site is known to use it; treat BlackyCMS as private to habbo.gd. Only its index survives (Wayback).
- 2026-10-06 | habbo-gd.gitbook.io (user lead) | VERIFIED: 61 help pages, 545 images (copied to C:\tools\habbogd-preview\gitbook).
  Only ONE BlackyCMS page among them: the ban page (Hotelverbot, 31.01.2025): dark card, Habbo logo + gavel, gold glowing
  "BANN INFORMATION", Arial, gold labels, red reason, yellow pill "HILFE AUF DISCORD" button with glow
  (archive/blacky-ban-page-2025-01.png). The rest: client UI (catalog, alerts, floor plan editor), effects, rooms, items.
- 2026-10-06 | habbo.gd/ehrenamt | /ehrenamt never archived (Wayback: habbo.gd, www, habbo.cc, .php variants). Live habbo.gd
  now runs a THIRD CMS (React SPA, Poppins, light/dark `habbo_theme`, assets on cdn.habbo.gd/cms, habbo-boot.js) — not
  Blacky, not the habbo.cc one; every path returns the same shell, headless render stays blank (needs API/login).
- 2026-10-06 | BlackyCMS me page | VERIFIED via the user's own screenshot (archive/blacky-me-original.png): header
  ARTICLE · HABBO TEAM · PREISLISTE · EXTRAS, user ▾, PLAY, flag; hero "WELCOME BACK, NAME!" + 4 currency boxes + group
  bar + Play/Profile + hotel image with "N Habbos online"; Hotel Lotto Activities (jackpot, winners, last win card);
  Latest Articles slider; Newest Habbo; Most Popular Rooms.

### cosas.rar: CMS projects and lotto (2026-10-06, confidence: high, read from source)
- CMS projects: `beast-cms-main` and `cm-cliente` (same React CMS), `HabboJe/cms-typescript`, `HabboJe/hk-frontend`
  (housekeeping), `Hekos/cms-frontend-ts-main`, `Hekos/hekos-cms`, `RetrosLab/cms-react-kubbo`,
  `RetrosLab/comet-advance/cms-frontend-ts`, `RetrosLab/Comet-Basic/cms-hgalaxy`.
- Lotto exists only in beast-cms/cm-cliente (`LotteryModalView.tsx`: pick 6 of 49 numbers, one ticket per round) with
  its server half in `plugin-web` (Arcturus websocket plugin, tables `website_lottery` + `website_lottery_jackpot`,
  ticket 3500 credits into the jackpot). No draw code in the plugin source. Comet (RetrosLab) has a staff `:lottery
  start|run|clear|pool` command: random winner takes entries × ticket price.
- Extracted lotto files: `C:/tools/plugins-reference/cosas-lotto/`. Our Live Lotto is already server-authoritative and
  more complete; nothing to copy.
- 2026-10-06 | cosas Hekos CMS | `Hekos/cms-frontend-ts-main/src` is only a login page; the full CMS (home, news,
  shop/HekosClub, community tops, staff teams, settings, play) sits unused in its `xd/` folder and is a fork of RetrosLab
  Comet `cms-frontend-ts` (identical packets). `hekos-cms` is a bare Vite/Tailwind template. Preview: `cms-preview/hekosxd`, :8781.
- 2026-10-06 | habbo.gd vs cosas CMSes | NOT the same base: live habbo.gd = Vite ESM chunks (/assets/js/*.js), REST
  `/api/*` (auth/discord/login, badge/rarities, maintenance/status), no websocket; Hekos/Comet/Je/beast = CRA +
  Bootstrap + react-use-websocket JSON packets (sso_cms, met-loc). None of their markers in habbo.gd's bundle.
- 2026-10-06 | habbo.gd/client | VERIFIED: Nitro (Vite) client with an inline domain lock (habbo.gd, *.habbo.gd,
  localhost only → `HABBOGD_DOMAIN_LOCK`), socket via `?wsb=&sso=`, configs 403 to direct requests. Not hostable on
  play.habbo.nz (lock); reference-only like MetroHotel.
- 2026-10-06 | habbo.gd + habbo.cc clients (static read, confidence: high for "what exists", none for server rules)
  Same Nitro fork on both (1,330 shared `nitro.*` keys; cc 1,721 keys = newer, gd 1,379). Texts in their public
  ExternalTexts (cdn.habbo.gd/gamedata). Own systems: German roleplay layer (Gang Zentrale: gangs, zones/territories
  with protection timers, invites; weapons + 6 ammo types, weapon shop, hotbar 1-5 with medkit/shield potion; prison
  `:kaution`, wounds healed by bots for 150 Taler; bounty "Kopfgeld"; ATM / Zentralbank robbery; weed farming with
  fertilizer charges), fishing (Angelpark room, rod durability/repair/XP, rare fish, trash), slot machine with jackpot,
  lotto, room pass (1h/3h/6h), Pfand (daily collect cap), mystery boxes + keys, player marketplace with bundles and
  buy requests (1 % fee), room auctions + giveaways, advent calendar, macros (key presets), pick-all-items window,
  Stats window (session/fishing/trade/mystery/pfand/market), HC payday, hourly + premium pending rewards, season
  currency, big Wired 2.0 UI set (ui11-ui24), voice-message mic, radio + YouTube window (gd only). Files: session
  scratchpad `gd/` + `cc/` (bundles, `nitro-keys.txt`, ExternalTexts). habbo.cc `/client/game/` has no domain lock in
  its HTML/bundle; habbo.gd `/client/` has one.
- 2026-10-06 | habbo.cc client lock check | VERIFIED: no domain lock anywhere in habbo.cc's client (game page, index
  bundle, vendor bundle, configs; habbo.gd's lock is only the inline script in its `/client/` page, not in the bundle).
  habbo.cc protects at the edges: Cloudflare 403 on `/client/`, `X-Frame-Options: SAMEORIGIN`, no socket URL in
  renderer-config; their CMS passes `wsb` (socket URL) + `wst` (per-login websocket ticket) in the iframe URL and
  throws "SSO-Ticket fehlt" / missing WebSocket without them.
- 2026-10-06 | habbo.gd / habbo.cc vs HabboCity CSS (confidence: medium) | Class sets vs HabboCity's saved CSS (out/hc,
  526 classes not in stock Nitro, 811 rules using them): habbo.gd has 256 of those classes (49%), 304 of the rules,
  173 byte-identical (icons, invisible-card headers, gift autocomplete, custom selects/ranges, bubbles 40-48). habbo.cc
  has only 54 classes / 26 identical rules: cc's newer build replaced most of it. So gd's older design is partly
  HabboCity-derived, not a 1:1 copy (could also be a shared upstream fork). Most of gd's look (light/dark theme, gang,
  RPG, stats) is its own.
- 2026-10-06 | cosas.rar roleplay (confidence: high, read from source) | NOT habbo.gd's system: no gang, territory, bounty
  or weapon-shop code anywhere in cosas. What exists: (1) HabboJe `RetroPass` (Arcturus plugin `dev.retros`, German):
  bank accounts (4-digit PIN, "MP" IBAN, deposit/withdraw/transfer of credits/duckets/diamonds/type 104 "Herzen"),
  ATM furni (`InteractioAtm`, opens UI via NuxAlert links `authBank/show`), fishing (`:fish` toggle, needs a
  FishermanBot in the room + water in front, timed catches by weighted chance, sell to the bot), plus casino
  (blackjack, roulette, slot machine), mini-games (Among Us, BattleBall skills, SnowStorm, BattleBuild, food delivery)
  and a battle/collector pass; client half in `habboje-nitro/src/components/roleplay/bank`. (2) Comet (RetrosLab/Hekos)
  only stubs: RolePlayAttribute/Chart, FishingPoolFloorItem, RPWeaponSync/RolePlayProduct web packets.
  SECURITY: RetroPass bank never checks amount > 0 (`deposit`, `withdraw`, `transfer` only test `balance >= amount`),
  so a negative deposit mints currency and a negative transfer drains the receiver. Never copy; re-implement with
  server-side positive/limit checks and ledger. Extract: `C:/tools/plugins-reference/cosas-rp/`.
- 2026-10-06 | HabboCM plugins + "coffeehouse" | HabboCM `emu/` runs 55 Arcturus plugins + `PassRetro-1` (2024-03,
  338 classes) = the compiled HabboJe RetroPass from cosas (same bank/ATM/fishing/casino/games, no gangs/weapons).
  No coffeehouse/café system in cosas, HabboCM, the 512-plugin list or the habbo.gd/cc clients. Only trace: habbo.gd/cc
  bonus quest key `ROB_KAFFEEHAUS` whose text now says "rob the Habbo Zentralbank, type :ausrauben" (renamed quest).
  Their 14 daily bonus quests: FIND_ANY_COLLECT, ROB_KAFFEEHAUS, PLAY_YOUTUBE, WIN_BUCHSTABENSALAT, WAVE, FIND_HAZED,
  FIND_MAEXEL, KISS_USER, SLIME_OTHERS, FIND_POKEBALL_GOLD, DANCE20, ICE_25_USERS, FISH_3_THUNFISH.
- 2026-10-06 | habbo.gd roleplay origin (confidence: high for the old version, read from source) | `LTDWEB/OLD Plus
  Emulator Pack` (C#, Plus-based, German: HabboVIN Emulator, Saturn Emulator, VINCMSDE = same code) holds the RP
  system habbo.gd's client still targets: `CustomEvents/Kaffeehaus.cs` (central-bank robbery window at 17/20/23 h,
  15 min open), `:ausrauben` (stand on the i-point in the vault room, survive 240 s inside the vault area, police
  alerted, leave/AFK = jail, 24 h cooldown), `:kaution` (2,500 credits bail), HP/heal/medic/medkit/shield potion/
  body armour, shoot/deagle/scar/terlik/hit with `Addons/Roleplay/Weapons` (WeaponManager, ammo), arrest/jail/
  unjail, police/cop chat, rob user credits/diamonds/season, K/D, fishing (`AngelCommand`), AFK collect rooms
  (Minen/Park sammeln), RpgZeit (timed "no police" free-for-all), Lotto, Buchstabensalat, Shuffle. habbo.gd's newer
  gangs/territories/weapon shop/Pfand are NOT in it (later work). Porting = re-implement on Arcturus (plugin), not copy.
