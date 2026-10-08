# Pipeline notes

Short notes of meaningful work: what was learned, what failed, where the knowledge went. Format and rules:
`.claude/skills/project-workflow/references/learning-loop.md`. Grep by `| <area>` or keyword; never read it whole.

### 2026-10-01 | retro | official gamedata as an intelligence source
- Discovery: habbo.com and sandbox.habbo.com serve `/gamedata/hashes2` to a server request; files are content-hashed; campaigns are `landing.view.dynamic.slot.N.conf` schedules; furni lines in furnidata `furniline` (`habboween_2026`).
- Worked: `hcms:intel-scan` (hourly) snapshots by hash and records campaign/furni/dev findings; second run "unchanged".
- Failed: assuming slot times are UTC — the time zone isn't verified (hween26 showed "scheduled" at 12:34 CEST).
- Reusable: VERIFIED. Routed to: retro-source `official-sources.md`, `seasonal-intelligence.md`, `knowledge-log.md`.
- Evidence: `hcms_intel_runs`, `hcms_intel_findings` (47 on the first run). Next: verify the slot time zone.

### 2026-10-01 | assets | resolve by classname + official icons
- Discovery: `FurniSources` now resolves by classname (RCON `furnisourcesresolve`); Habbo icons need the revision in the path.
- Worked: 9 Halloween 2026 furni got a `.nitro` (atlantaserver.me) + official icon on the same day Habbo released them.
- Reusable: VERIFIED. Routed to: project-workflow `asset-rendering.md`.
- Evidence: `hcms_admin_audit_log` furni.asset_downloaded target_type furni_classname.

### 2026-10-01 | assets | nitro2png / swf2png previews
- Worked: nitro2png unpack + our composer render correct 64px previews (layers, offsets, flip, tint).
- Failed: nitro2png alone (it only unpacks); swf2png on Node 26 (`swf-extract` "incorrect header check" on every bitmap, even its sample) → SWF falls back to the icon.
- Reusable: VERIFIED / FAILED. Routed to: project-workflow `asset-rendering.md`.

### 2026-10-01 | cloudflare | zone inspection and token
- Discovery: zone habbo.nz, 6 proxied A records to one origin, SSL flexible; client entry files DYNAMIC, PNGs cached.
- Failed: creating the API token by script — Cloudflare answered "Attention Required" (not bypassed); storing a secret from the session was refused. User creates the token (procedure in `infrastructure.md`).
- Reusable: VERIFIED. Routed to: project-workflow `infrastructure.md`.
- Next: user adds `CLOUDFLARE_API_TOKEN`; then `php artisan hcms:cloudflare verify`.

### 2026-10-01 | hcms | website images use cdn.habbo.ltd
- Discovery: no `HCMS_CDN_URL` in `hCMS/.env` → `config('hcms.cdn_url')` = `https://cdn.habbo.ltd` (old zone); new CDN-only files 404 there.
- Reusable: VERIFIED. Routed to: project-workflow `infrastructure.md`. Next: user decides on `HCMS_CDN_URL=https://cdn.habbo.nz`.

### 2026-10-01 | catalog | official campaign furni sync (Halloween 2026)
- Discovery: of 45 `habboween_2026` furni, 15 had assets by the afternoon; 2 need hand config (crackable dresser, hatch teleport).
- Worked: `sync-official-furni.py` → 13 importable, SQL dry-run in a rolled-back transaction (13 items + 13 offers, nothing kept); previews rendered for all 13.
- Applied 15:06 (user approved): page 9967779 "Halloween 2026", items_base 2000041633-645, offers 2000073022-034, FurnitureData +13 (backup `FurnitureData.json.bak-hween26-20261001150630`), backup table `bak_202610011506_catalog_pages`; emulator restart 15:07, clean boot.
- Failed: `catalog_pages.visible/enabled` are ENUM('0','1'); an unquoted 1 is stored as '0' (page hidden). Fixed the row and the script (values quoted). Applies to every ENUM flag column (`vip_only` is ENUM('1','0')): always quote.
- Reusable: VERIFIED. Routed to: project-workflow `catalog-sync.md`.
- Evidence: `C:/tools/nitro-catalog-copy/scripts/out/official-sync/hween26/`. Next: in-client check (open page, buy, place).

### 2026-10-01 | catalog | Halloween 2026 live: names, New page, purchase
- Worked: page "Halloween 2026" under Events → Halloween (9967779) + mirror under NEW (9967780, first); 16 furni (3 more resolved later the same day); purchase in the client = BUY then CONFIRM (two steps), item delivered (Kasper, Bat Pillow).
- Failed: offers used the classname as `catalog_name` → catalog title showed `hween_c26_batpillow`; fixed (display name) + RCON `updatecatalog` (no restart needed for name changes; new items_base rows need a restart).
- Reusable: VERIFIED. Routed to: project-workflow `catalog-sync.md` (catalog_name rule, NEW-page rule).

### 2026-10-01 | nitro | purse without Income/Expenses and Hide wallet
- Removed both buttons (the Income link `balance-logs/toggle` had no handler anywhere); the purse always shows. CSS left verbatim (HabboPie copy).
- Failed: I called the blank purse after its expand animation a headless quirk. WRONG (corrected 2026-10-02): players saw it too ("sometimes purse not showing"). HabboPie's `smoothExpand` starts at opacity 0 / max-height 0; when it doesn't run (background tab) the purse stays invisible. Fixed with an override (`:not(.hidden){animation:none}`). Lesson: a rendering glitch seen in testing is a bug until proven otherwise.
- Reusable: VERIFIED. Routed to: none (component comment). Deployed `index-69875f6e.js`.

### 2026-10-01 | cdn | client CSS has a fixed URL (cached 4 h)
- Discovery: `yarn deploy` writes styles to `play.habbo.nz/src/assets/index.css`, same name every build, `max-age=14400`, Cloudflare caches it. A CSS-only change kept `index-<hash>.js` unchanged.
- Failed: my earlier note "a normal deploy needs no purge" — wrong for CSS changes.
- Reusable: VERIFIED. Routed to: project-workflow `infrastructure.md`. Next: purge that URL after CSS deploys once the token exists (or version the CSS URL in the build).

### 2026-10-01 | hcms | Presence messages showed twice (old hcms-shop jar)
- Discovery: the running `hcms-shop.jar` (Sep 29) still sent a server bubble in `ShopService.result()`; the source dropped it on Sep 30 but was never rebuilt/deployed → every shop message twice (red "!" + blue "?"). The client icon rule also missed "don't have enough".
- Worked: rebuilt + deployed hcms-shop (unused imports removed) and hcms-feedback; "have enough" added to the error rule (client + hcms-feedback); restart 22:55; one bubble with the error icon (verified as VIP, Kasper). VIP buttons themselves were fine (as VIP: price buttons, buy reaches the server).
- Reusable: VERIFIED. Lesson: when a symptom contradicts the source, compare the deployed jar (`javap`) with the source before changing code. Routed to: none (one-off), this note.

### 2026-10-01 | catalog | New → Halloween category
- New category 9967781 "Halloween" (pumpkin icon 34) under New, first; page 9967780 "Halloween 2026" moved into it; RCON `updatecatalog` (no restart). Verified in the client.
- Routed to: project-workflow `catalog-sync.md` (seasonal lines go New → <Season> → <Season YYYY>).

### 2026-10-01 | hcms | own avatar imager with aura (img.habbo.nz)
- Worked: billsonnn/nitro-imager + our assets render avatars (custom clothing included); aura = CPU port of `AuraFilter` (premultiplied maths, 12-direction outline sampling), verified glow/flames/halo at s/m/l and head-only; IIS HCMS-IMG + PHP front (no ARR) + task `hcms-imager`.
- Failed: canvas 2.x on Node 26 (fixed with npm `overrides` canvas 3); creating the Cloudflare DNS record from the session was refused by the permission check → the user adds `img`.
- Reusable: VERIFIED. Routed to: `hcms-imager/CLAUDE.md`, project-workflow `infrastructure.md`.
- Next: DNS `img` A proxied → set `HCMS_IMAGING_URL=https://img.habbo.nz/` → check profile/home layouts (aura images are larger: +20/+32 px per side pair).

### 2026-10-01 | hcms | right-click menu (website + hotel)
- Website: one partial in `partials/head` reaches every shell (app, Center, landing, 404); the SPA router (`router.js`) handles the menu's `<a>` links via body delegation. Toast type for success is `'succ'`, not `'success'`.
- Hotel: the client runs in a cross-origin iframe, so it needs its own menu (PageMenuView); site links go to `window.top`.
- Reusable: VERIFIED. Routed to: none (feature write-up in PROJECT_STATE).

### 2026-10-02 | catalog | official seasonal lines imported
- Worked: `resolve-official-assets.py` (bulk RCON resolver, 4 workers): 217/217 found art; `sync-official-seasons.py`: 933 furni, 61 pages; public season pages + "Seasonal Economy" under Staff for LTD/crackable/clothing (default interaction until configured). Restart 00:26.
- Reusable: VERIFIED. Routed to: project-workflow `catalog-sync.md`.

### 2026-10-02 | plugins | server-side message audit + fixes
- Worked: reading all 77 handlers found 2 high issues (VIPs could moderate profiles; the clothes shop sold 81 free
  staff/hidden clothes and accepted unbounded counts) and 2 medium ones (chest/freeze races, builder erase).
  A Node WebSocket test client (Origin `https://play.habbo.nz`, SSO 2419, temporary auth_ticket on Kasper, cleaned)
  verified the fixes live.
- Failed: the first estimate (7 exposed clothes) used `have_offer = '1'`, while the code used `have_offer = 1`, which
  matches '0', so the real exposure was 83. Lesson: reproduce the code's exact query, not the intended one.
- Reusable: VERIFIED. Routed to: custom-plugins `references/staff-security.md` (handler safety checklist).

### 2026-10-02 | economy | clothing economy (HabboCity model)
- Worked: reading HabboCity through the user's logged-in tab (in-page fetch of Center pages, read-only). A fresh CDP
  tab got Cloudflare "Attention Required" → stopped, as the rules say.
- Found: 605 of 765 `clothing_*` furni were plain decoration (`default` interaction) and many had no
  `catalog_clothing` mapping; FurnitureData `customparams` + a FigureData set check fixed 668 safely.
- Reusable: VERIFIED. Lesson: before selling clothing, check interaction = clothing AND a catalog_clothing row AND
  the figure sets exist. Routed to: retro-source knowledge-log (HabboCity model), this note.

### 2026-10-02 | assets | which figure files the client really loads
- Failed: today's clothing checks used `cdn/gamedata/FigureData.json` (official, 7,463 sets), but the client
  (renderer-config `avatar.figuredata.url` / `avatar.figuremap.url` / `avatar.asset.url`) and hcms-imager load
  `cdn/habbocity/…` (HabboCity's set, 4,573). Result: the clothing fix linked hundreds of pieces to sets that show
  nothing or the wrong piece. Rolled back to the 112 verified pieces.
- Lesson: validate clothing against the files named in renderer-config, and by library name (a set number means
  different pieces in different figure files). Check visually with img.habbo.nz (it uses the client's files).
- Routed to: project-workflow `references/catalog-sync.md` (clothing rule).

### 2026-10-02 | client | pixel-art icons in fixed slots
- Failed: a 46×56 pixel logo with `background-size: contain` + `image-rendering: pixelated` in a 42×44 slot (0.79×)
  dropped whole pixel rows and looked broken.
- Lesson: never scale pixel art by a fraction in CSS. Pre-render the exact size (Lanczos down, or nearest at
  integer factors up) and draw it 1:1; give HiDPI an `image-set` 2× file. Same for favicons: Lanczos for 16/32,
  integer nearest for 150-512.
- Also: the right column (purse, Today, bubbles) is 200 px. Own cards there must use width 100%, never a fixed
  wider width.

### 2026-10-02 | plugins | fun/roleplay commands reference
- Our old LTDCMS emulator plugin source is at `LTDWEB/LTD Emulator + LTDUI/ltdcms-plugin` (rp/, fishing/, afkpark/,
  casino/, jail/, games/…). It is the first place to look for "like ltdcms" requests, before the plugin jars.
- Lesson: `RoomUnit.setCanWalk(false)` stops a walk in progress; pin someone only after `isAtGoal()`.
- Routed to: custom-plugins skill (commands), this note.

### 2026-10-03 | plugins | ledger context must be JSON
- Failed: `Wallet.record(..., "lottery:1")` → `CONSTRAINT hcms_economy_transactions.context failed` (a json_valid
  CHECK). The balance was changed, but the ledger row was lost (only a WARN in boot-stdout).
- Lesson: always pass a JSON object string as the Wallet/ledger context (`{"draw":1}`). After a new payout path, grep
  the log for "ledger row … could not be written".

## 2026-10-03 artisan-per-request is slow; spawn tiles must be reachable
- A plugin call through `GameEventBridge.query` (php artisan) costs 3–4 s on this server (process 0.65 s + Laravel boot
  1.6 s + work). For anything a player opens often, cache the last answer in the plugin and refresh it in the background
  (see `PassProtocol`).
- Random free tiles in crowded rooms can be isolated (Bet room 357: the only free tile was walled in). Pick spawn tiles
  with a search from the door over walkable tiles, never "any empty OPEN tile".
- Raw test clients must answer ping 3928 with 2596, or the server drops them after about 50 s.

## 2026-10-03 catalog imports: ask the reference DBs, and changed interactions need a room reload
- New furni rows must take interaction_type, modes, walk/sit/lay/stack (and vending_ids) from the reference DBs
  (habboworld, hubblycata, ltdhabbo) when 2 of 3 agree, and only use an interaction we already use. The HabboCity
  importer had skipped this: 30 gates (scifiport/scifidoor/marquee) were 'default' and walkable, and 55 trophies, 5
  vending machines and others were wrong. Fixed by `ReferenceValues` in hCMS and `reference_values()` in
  sync-official-furni.py. 358 rows were repaired.
- A changed interaction_type only reaches furni already placed in a room after that room reloads (emulator restart):
  the placed item keeps its old class (e.g. InteractionDefault), so a fixed gate still could not be walked through.
  Restart after interaction repairs.
- Before adding plugin behaviour, check stock Arcturus. InteractionGate already refuses to toggle with a Habbo on the
  tile; the "gate closes on the user" report was the stale-instance problem above. A GateGuard plugin class was
  written and removed at the user's request.
- Lines whose furni are spread over many pages (buildersclub, hhistory) must not "top up" the page with the most of
  them: require at least 30% of the owned line furni on that page, else a new Furni Lines page.
- A plugin handler that cancels a stock action and does the work itself must repeat the stock checks. BuildModePlugin's
  toggle replacement skipped InteractionGate's "nobody on the tiles" check, so gates closed under avatars (2026-10-03).
  When testing gates headless, use a room the test account owns. The prison room refuses non-prisoners, and room 525's
  playtest flag removes rights.
- Our core is the Arcturus **Wired** fork, not stock Morningstar. It adds behaviour Polaris doesn't have, e.g.
  `RoomUserWalkEvent.addTemporaryOpenFurniOverrides` (a 750 ms walk-through pass on open gates after each click).
  When "it works on Polaris/stock" but not here, compare the fork's walk/room code, not just the interaction class.

### 2026-10-03 | retro+economy | official news/achievements feeds, Taskmaster/Streak Freak, XP grant race
- Discovery: Habbo news = `images.habbo.com/habbo-web-news/en/production/front.json` (from the web app's `habboWebNewsUrl`); `www.habbo.com/api/public/achievements` is public (167 ladders). habbofurni.com needs a token, habboassets badges API errored, habboquests.com is parked (the guide site is `.co`).
- Worked: both feeds in `hcms:intel-scan` (kinds `news`, `achievement`); Habbo news are admin suggestions (Admin > News > "From Habbo news"), never imports (user). Official `DailyTasksCompleted`/`DailyTaskStreakDays` fed by our daily quests.
- Failed: the first live test lost the 25 XP quest bonus: `AchievementXp` (pool thread) and the bonus grant wrote `hcms_citypass_progress` at once → MariaDB 12 snapshot isolation "Record has changed since last read". Fixed: `HabboPassXp.grant` in READ COMMITTED (unique ledger key keeps it idempotent).
- Reusable: VERIFIED. Any plugin transaction that reads before `SELECT ... FOR UPDATE` on a row other threads write can hit this on MariaDB 12; use READ COMMITTED or lock first. Routed to: retro-source `official-sources.md` + `knowledge-log.md`, custom-plugins `economy-engagement.md`.
- Evidence: Mia live test 2026-10-03 (ledger dq/dqb/ach rows, winwins 38 → 77, badges ACH_DailyTasksCompleted1 + ACH_DailyTaskStreakDays2).

### 2026-10-03 | emulator | achievements: a bad category stops the whole load
- Discovery: `achievements.category` is a DB ENUM + Java enum; Habbo's `crafting`/`crackables`/`collectibles` became `''` and `AchievementCategories.valueOf` threw inside a catch that sits outside the read loop, so the boot loaded only 122 of 174 ladders (log: "AchievementManager - Caught exception").
- Worked: categories set to `explore`, restart, 174 sent to the client. Testing room-type minutes needs a room loaded after the DB change (boot-loaded official/spawn rooms keep their old category); Mia created a Chat room via header 2752 for the test.
- Reusable: VERIFIED. After any `achievements` insert, grep the boot log for "AchievementManager - Caught" and count the list (header 219 → 305). Routed to: arcturus-emulator `economy.md`.

### 2026-10-03 | emulator | crackables/crafting/breeding achievements are data, and our crackable data was broken
- Discovery: the core already progresses achievements from `crafting_recipes.achievement`, `items_crackable.achievement_tick/_cracked` and breeding nests (`<Type>Breeder`); all 246 recipes had no achievement, jungle flowers pointed at the wrong ladder, 17 crackables had `interaction_type` default/"crackables" so they could never crack.
- Worked: mapping by Habbo's badge descriptions (crafting table → ladder, crackable family → ladder); live test: Mia cracked a Cursed Flame Knight (20 hits) → flamingknight 1.
- Failed: first crack test on the Flowering Bush did nothing: `required_effect` 192 (watering can), Habbo's own rule, not a bug. Also 3,4 isn't a model_a floor tile (placement silently fails).
- Reusable: VERIFIED. Routed to: arcturus-emulator `economy.md`.

### 2026-10-03 | retro+emulator | official furni arrive without their mechanics
- Discovery: Habbo gamedata (furnidata/texts) never says how a furni behaves; our imports land as `default`. Habbo's
  "(Non Crackable)" twin (e.g. `hween_c23_seth4`) is a hint that the other one is a crackable. Mechanics come from
  Habbox Wiki / Habbo posts; other emulators' dumps (LTDWEB Habboworld SQL) only had a half row (23 hits, no prizes).
- Worked: `crackable_master` = public crackable, prize to the cracker; spawn system extended for crackable spawns.
- Reusable: VERIFIED. When a seasonal line is imported, check the campaign's mechanics (crackables, crafting tables,
  effects) and set interaction + items_crackable / crafting achievement in the same pass. Routed to: arcturus-emulator
  `economy.md` (achievement data), custom-plugins `features.md`/economy (spawns).

## 2026-10-03 Client CSS was cached across deploys
- Failed: after deploying the ranch view, its styles were missing in a fresh browser. `src/assets/index.css` kept the
  same name every build with `Cache-Control: max-age=14400` (plus Cloudflare), while JS chunks are hashed.
- Worked: hash the CSS name (`assetFileNames` function in `vite.config`), update the `protect-chunks.mjs` guard.
- Reusable: VERIFIED. Any asset that changes per deploy needs a hashed name or `?v=`. Routed to: nitro-ui (deploy).

## 2026-10-03 Habbo's Wired 2.0 visuals (variable FX)
- Habbo shows ranch levels/counters with Wired 2.0 variable displays. habz.es ships the full renderer; its images are
  inlined base64 in `index.js` (extracted to `nitro-catalog-copy/scripts/out/habz/variablefx`). Polaris has the
  variable logic but no display. Read habz from the user's Chrome (9222); headless hits Cloudflare (never bypass).
- Reusable: VERIFIED. Routed to: retro-source (implementation references).
- 2026-10-03 G-Earth on this server: our emulator held 127.0.0.1:30000, so G-Earth could not proxy habbo.com and the
  AIR client showed "Maintenance break / -2" (= connection failed, not real maintenance). Game port moved to 30010.
  g-python 0.1.6 dies on G-Earth 1.5.3 message 10; patch the enum. Room snapshots: rebuild from the packet log, never
  trust "last Objects packet wins".
- 2026-10-03 Ranch rebuild lessons: (1) a new anchored overlay needs `position: fixed` itself; `ObjectLocationView` gave
  it before (badge vanished after the swap). (2) Masking with `destination-in` twice intersects; build one union mask
  (the badge number disappeared). (3) `Emulator.getConfig().register` never overwrites, so changing a setting's
  default needs an UPDATE of the existing row (`hcms.ranch.shop`). (4) Mass deletes are refused by the auto-mode
  classifier even with chat approval: hand the user a reviewed `.bat` + `.sql` (quote-free PowerShell in a `.ps1`).
  (5) Copied official rooms contain other players' live state (farms); reset it before use.

- 2026-10-03 Sunset Ranch part 7. (1) Habbo's Variable FX configs carry the display rules: `show_mode`, update mask,
  `hover`, `duration` (3000 ms for counters). Read them from `VariableFxConfigs` before guessing UI timing. (2) A
  copied room's furni position can be a wired-moved spot: compare full room loads (`Objects`) with `ObjectAdd`
  (signs were added on the plot and moved to plot+(1,3)). (3) Anything placed back on room exit must survive an
  unloading room: keep a self-heal list instead of trusting the exit path. (4) habbo.com/gamedata is
  DOSarrest-blocked for direct fetches; search the session transcript for an earlier capture through the user's Chrome.
- 2026-10-04 Video TVs + HabHeights room import. (1) A Nitro (websocket) hotel can't go through G-Earth: capture
  `Network.webSocketFrameReceived` on the user's own tab via CDP and let them re-enter the room; frames hold whole
  packets, decode with the hotel's own renderer parsers (saved bundle). (2) Some emulators chunk floor items (250 per
  1778 packet): append, don't take the first. (3) To place HTML over a furni, measure the art relative to the sprite
  anchor (asset offset = -asset.x; flipped = asset.x - width) and position from `getRoomObjectScreenLocation`; the
  bounding rectangle includes shadows. (4) A save + immediate control from one click needs separate server cooldowns.
- 2026-10-04 A black rectangle on the room canvas next to an embedded video with nothing at that point in the DOM is
  Chrome's video overlay hole-punch. Make the iframe non-promotable (opacity .999) instead of hunting the element.
- 2026-10-04 Dev server at 100% CPU / 74% RAM: ~440 bash shells left over from background `start-emulator.sh` runs
  (each restart left its shell waiting) plus the headless test Chrome. Cleaned: stale bash stopped (the emulator's own
  parent chain kept), headless Chrome closed (relaunch on 9223 when needed). Before restarting the emulator, stop the
  previous background start task (TaskStop) instead of launching another; close headless Chrome after tests. The
  heavy Chrome GPU process belongs to the user's debug Chrome (open hotel tabs).


- 2026-10-04 HabboCity catalog page info: crawl by UI clicks only; detect "unchanged" pages (category folders keep the
  previous page). Logos: template-match by luminance (dark outline + bright fill) over the whole image, not by colour;
  tinted variants and corner marks need their own template. Default 3x3 right-column image = `page_teaser`, not
  `page_headline`. Reusing one SSO ticket string makes the client try the stale `hcms:reconnect` ticket first; reload once.
- 2026-10-04 G-Earth VariableFx: furni statuses (non-user) hold plant growth and crop yields; configs carry category
  (stack group), width, hover. Decoder: scratchpad `furnivars.py`/`myplants.py` pattern (reuse `variables.configs/statuses`).
- 2026-10-04 Purchases: never debit before a write that can fail without a refund path (ranch fertilizer, column too
  short). Client config: `ui-config.json` is cached 7 days, version the `config.urls` in index.html on changes.
  Cross-origin client iframe: every permission (autoplay, fullscreen…) must be in the hCMS iframe `allow`.
- 2026-10-04 Restoring untracked files: rebuild old versions from the session transcript's recorded edit commands.
- 2026-10-04 Room imports: check `ads_background` items after building; Nitro retros send them as a map (imageUrl +
  offsets), Habbo/G-Earth as pair lists. Our stored format is `offsetZ=;offsetY=;offsetX=;clickUrl=;imageUrl=;`.
- 2026-10-04 Bulk staff import: reuse `CatalogImporter` (`--admin`) instead of new SQL; group counts are per run, so
  import overlapping sources in one order and expect "Already in items_base" for the second. Other hotels' hidden
  staff packs can only be grouped by furniline/classname prefix (no page names anywhere).
- 2026-10-04 Slow client entry / clothes lag: measure with Resource Timing in the play.habbo.nz frame (headless,
  `performance.getEntriesByType('resource')` sorted by duration) before guessing. Found: Cloudflare Development Mode
  left on (everything DYNAMIC), `.nitro` uncached by default, and `preloadNitroTruffle({styles:null})` blocking entry on
  43 font atlases (47 MB). Fix the cause (cache rule, lazy load), not symptoms. Pre-warming through Cloudflare uses the
  same origin upload as players: run it off-peak with low concurrency.
- 2026-10-04 Chat markup: regex passes that run after injecting HTML (currency `<img>`) must not cross tags
  (`[^.<]+`), or a URL gets cut (`https://cdn</b>.habbo.nz`).
- 2026-10-04 Guard detections: never require "N in a row" for a state the user can end (closing devtools resumes and
  resets the count); use one strong signal (pause > 1 s) instead.
- 2026-10-05 Moodlight/walls: the server side (InteractionMoodLight, RoomMoodlightData, MoodLight* events, RoomThicknessComposer,
  entry order) is identical in our core, Morningstar and Polaris; our `useRoom.ts` HEAD equals stock nitro-react and Octane.
  The renderer already applies hide-walls/thickness itself (`RoomMessageHandler.onRoomThicknessEvent`), so never
  re-apply plane visibility/thickness from React. Only the room colour races (the filter is created after INITIALIZED).
- 2026-10-07 `:update_plugins` reloads plugin classes but EmulatorLoadedEvent never fires again: everything a plugin
  starts in onEmulatorLoaded (our bots, spawns, ranch, casino, packet handlers) stays stopped and old handlers throw
  NoClassDefFoundError. Always restart the emulator (`:shutdown 0` via RCON, then start-emulator.sh).
- 2026-10-07 Yarn patches: copying whole data files (repetitive JSON-like TS) breaks hunk application ("Cannot apply
  hunk"); add a small helper file that mutates the data at init instead. Normalise CRLF first.
- 2026-10-07 Figure duplicates: compare rendered asset hashes (h_std_<type>_<id>_2_0), not library names — HabboCity
  ships the same art under its own library names. Hide the old twin, keep the new piece (newest-first list).
- 2026-10-07 Casino math: simulate every game against the player's best strategy before setting payouts (first 21 rules
  gave players +14 %).

- 2026-10-07 Overhead badges over avatars must call `SetRanchStackTop` (reuse `RanchAnchorView`), else the name bubble
  covers them. Casino rule changes: rerun the exact DP (scratch sim21.py idea: house-first + player-first, tie value
  solved by iteration) before shipping; tie-replay flips the edge to the player. Furni stacked on the same tile at the
  same z swallow clicks: accept clicks on every item of a game tile. Python edits on CRLF files: open with
  `newline=''` and write back with `newline='\r\n'`.

- 2026-10-08 hCMS: never call `env()` outside `config/*.php`. With `config:cache` it returns null, the code falls back
  to its default (RCON 30001 = live), and the sandbox silently drives the live emulator. Read settings via `config()`.
