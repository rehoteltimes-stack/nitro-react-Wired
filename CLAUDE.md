# nitro-react-Wired — CLAUDE.md

> ## CURRENT STATE (2026-09-22, branch `habbocity-rebuild`) — read this first
> The sections further down describe the **abandoned layered approach** (a `habbocity/_*.scss` overlay on top of stock
> Nitro CSS, kept only on branch `backup/habbocity-wip-2026-09-22`). It was replaced by a strict rebuild:
>
> * **Stylesheet = the reference stylesheet, verbatim.** `src/assets/styles/holo/` holds HabboCity's compiled CSS as
>   ordered segments (`_index.scss` imports them; **order is the cascade — never reorder or sort**), plus
>   `_tokens.scss` (`:root` = light, `body.dark-mode` = dark; theme switched in `src/index.tsx` from `?theme=`).
>   Segment headers list which owners each file contains. Regenerate/verify with the scripts in
>   `c:\tools\nitro-catalog-copy\scripts\` (`hc-gen-holo.js`, `hc-cssdiff.js`, `hc-extract.js`).
> * **All stock Nitro CSS was deleted** (the bootstrap copy, every component `.scss`, icons/utils/scrollbars/fonts).
>   Only own-feature SCSS remains: Wired (`components/wired*`, `wired/WiredEmbedded.scss`), `builder-toolbar`,
>   `clothes-shop`, `room-tools` (Wired `nw-*` tools) and the `common/habbo` layout engine (Flash-style window chrome
>   used only by the Wired Creator Tools port). `src/components/index.scss` lists exactly those.
> * **No new CSS for HabboCity components.** If something looks wrong the DOM/classnames are wrong: fix the TSX to the
>   reference structure (from the live DOM **and** the minified `index-*.js` component source), never add rules.
> * Tools: `cssdiff` (compiled ours vs reference: 0 rules missing, remaining diffs are Sass re-serialisation only),
>   DOM-tree dump + computed-style table on both clients, and an "undefined classes on live DOM" check
>   (classes present in our DOM that no stylesheet defines = leftover stock classnames to remove).
> * Done + verified (DOM and computed style vs reference): toolbar (+ inline Me-panel), purse, friend bar,
>   shared `Text` / `Button` primitives. Deliberate feature decisions: no `icon-reports`, achievements entry, purse
>   logout button or seasonal split (none exist in the reference and none have styling now).
> * Backlog (from the undefined-class check): chat input, room-tools, then every window (navigator, catalog,
>   inventory, avatar editor, user settings, profile, friends list, notifications, room widgets…), one at a time.


Persistent state doc for this project, same convention as `hCMS/CLAUDE.md`,
`LTDUIOVERLAY/habboworld.be/CLAUDE.md`, etc. — **read this fully before doing anything else.**

## What this project is

`nitro-react-Wired` — the real Nitro (game-room) client for hCMS, served at `https://play.habbo.nz`
and embedded via iframe from `hCMS`'s own `/hotel` route (see `hCMS/CLAUDE.md`'s "Real infra
discovery" and "THE GAME RUNS" sections for the full server-side story: the emulator, the websocket
bridge, DNS, the whole real-game-running setup). This file is scoped to the **client UI** only.

## Foundation-first migration process (mandated 2026-09-21, second hard correction)

**Read this section before touching anything else in this file, and before touching any
component.** Given verbatim by the user after the Navigator pass mixed DOM restructuring,
classname changes, new CSS, and new functionality (a "visit random room" feature) all in one
continuous pass — precisely what this section prohibits, even though each individual piece was
itself DOM-verified per Block 1 below. Block 1 and Block 2 still define **what counts as
verified** (source-of-truth priority, no invented classnames, no bulk/mechanical rewrites, full
feature parity). This section defines the **order** that work must happen in — do not skip phases,
do not combine them, even under time pressure.

```
PHASE 0  Freeze functionality — do not rewrite emulator/websocket/room/inventory/avatar/catalog
         logic unless absolutely required later. Keep UI STRUCTURE / UI STYLING / UI STATE /
         UI INTERACTION / APPLICATION LOGIC as separate concerns, not mixed in one change.
PHASE 1  Reverse-engineer HabboCity's base DOM. Start from the highest-level containers (body →
         app root → global header/main content/toolbar/overlays/modals/popups — discover the
         real structure, never assume the example diagram) and work downward. Record per
         container: TAG, CLASS, ID, PARENT, CHILDREN, POSITIONING, PURPOSE. Do not modify the
         project yet — produce the structure map first.
PHASE 2  Build the classname map from that DOM: element → exact class attribute → purpose → CSS
         rules → state classes → child relationships. Never invent class names — every one must
         come from the real rendered reference.
PHASE 3  Reverse-engineer base CSS/SCSS/variables, in this order: GLOBAL (box-sizing, body/html,
         fonts, colors, CSS variables, background, default margins, overflow, scrollbar behavior)
         → LAYOUT (containers, flex/grid, widths/heights/gaps, positioning, stacking contexts) →
         COMPONENT FOUNDATION (buttons, panels, tabs, inputs, dropdowns, cards, windows,
         overlays). Do not start with hover states or animations.
PHASE 4  Rebuild our DOM structure to match HabboCity's real hierarchy. If our structure is
         fundamentally different, change the structure — do not CSS-hack a mismatched structure
         into looking right. No unnecessary wrappers kept out of habit, no arbitrary new ones
         added either.
PHASE 5  Apply the verified base CSS only: layout, spacing, dimensions, fonts, colors,
         backgrounds, borders, positioning. No hover, no animations, no state logic, no feature
         additions yet. Compare the result before moving on.
PHASE 6  Add states (hover/active/selected/disabled/open/closed/expanded/collapsed/focus/loading)
         and responsive behavior. Every state verified against the live reference — never guessed.
PHASE 7  Add interactions (clicks, tabs, dropdowns, menus, dialogs, toolbar actions, outfit
         controls, inventory controls, etc.) now that structure and styling are already stable.
PHASE 8  Full HabboCity feature-parity scan: for every feature, does HabboCity have it → does our
         UI have it → if no, implement; if yes, compare. Extend the established structure rather
         than creating a second UI architecture (a duplicate toolbar/outfit implementation).
PHASE 9  Only now use Octane (this project's own existing logic layer — hooks/composers/category
         models) as a **logic** reference: packets, emulator communication, state, outfit/
         inventory logic, room interactions, client events, data flow. Never copy Octane's UI —
         HabboCity remains the UI/DOM/CSS/UX reference throughout.
PHASE 10 Full toolbar + outfit/change-look re-audit (DOM, classnames, CSS, icons, spacing,
         buttons, states, tooltips, menus, click behavior, responsive behavior for the toolbar;
         DOM, classnames, CSS, categories, items, colors, selections, preview, save/cancel,
         avatar update, persistence, interaction, responsive behavior for outfit/change-look),
         then final validation.
```

**Do not patch a broken foundation.** If a pass turns up 20 CSS overrides, 15 `!important`
declarations, duplicate classes, duplicate wrappers, conflicting selectors, or multiple parallel
toolbar/outfit implementations, the fix is to stop and restructure (remove/restructure → correct
DOM → correct classnames → correct base CSS → correct states), never to add another override on
top.

**Completion gate — do not declare a component (or the whole migration) done until every line
below is genuinely true, not assumed:**
```
[ ] Base DOM mapped                          [ ] No unnecessary wrappers
[ ] Base classnames mapped                   [ ] No duplicate UI systems
[ ] Base CSS mapped                          [ ] No CSS patch pile
[ ] CSS variables mapped                     [ ] Responsive foundation correct
[ ] Global layout correct                    [ ] States correct
[ ] Main containers correct                  [ ] Toolbar correct
[ ] Component structure correct              [ ] Outfit/change-look correct
[ ] Classnames verified                      [ ] Missing HabboCity features implemented
[ ] No invented classnames                   [ ] Octane logic integrated where required
                                              [ ] Full interaction audit complete
                                              [ ] Final comparison complete
```

See also `memory/feedback_foundation_first_migration.md` (this session's saved feedback memory) for
the why behind this correction.

### Mandatory: NO screenshots anywhere in this workflow (added 2026-09-21, tightened 2026-09-22,
sixth correction)

**Screenshots are banned outright from this reverse-engineering workflow — not "secondary,"
banned.** An earlier version of this rule allowed a screenshot as secondary visual confirmation
after the DOM/CSS chain already established the facts; the user explicitly revoked that: "screenshot
looks identical" / "visually seems correct" / "image comparison passed" are **not valid evidence at
any point**, including after CDP verification. The required chain for every component:
`CDP → actual DOM → actual classname → actual CSS rule → actual computed style → actual JS behavior
→ reproduce in our project`. Never: screenshot → guess HTML → guess classname → guess CSS. Do not
use the `screenshot.js`/`screenshot-clip.js` scratchpad helpers built earlier this session for
validation going forward — they're dead tooling now. If a live-DOM fact and a source-code
interpretation ever seem to disagree, investigate further (another bundle, dynamically-injected CSS,
runtime-generated classes, a media query, a state-specific selector) — never resolve it by looking
at a picture.

### Mandatory: feature-parity matrix, not just DOM/CSS parity (added 2026-09-22, seventh correction)

The goal is **complete relevant HabboCity UI + behavior + functionality**, not visual similarity — a
component isn't done because its HTML/CSS looks correct. For every interactive feature, trace the
full chain via CDP: user action → live DOM change → minified JS → state/event → request/client logic
→ result — on **both** HabboCity and our own dev client — and make sure our logic actually performs
the equivalent action (a tab must actually change content, a dropdown must actually perform its
selection, a button's full action→state-change→UI-update chain must run for real), not just look
like it does. Use Octane (this project's own logic layer) only when HabboCity's own minified JS
doesn't give enough to understand the mechanism, and only for logic — HabboCity remains the UI
reference throughout. **Do not stop at the first surface found** — finding a tab is not the end of
the audit; go into its own thumbnail mode, dropdowns, filters, sorting, selection, pagination,
scrolling, and empty/loading states before moving to the rest of the app. Maintain a feature-parity
record per surface (feature / reference UI / reference DOM/JS/CSS / our UI / our logic / status —
MATCHING/FIXED/IMPLEMENTED/MISSING/UNVERIFIED) rather than a single "looks done" verdict. Full detail
in `memory/feedback_full_feature_recreation.md`.

### Mandatory: DOM ↔ minified JS/CSS cross-referencing (added 2026-09-21, third correction)

DOM inspection and minified JS/CSS source inspection are **not separate tasks** — treat them as one
continuous, bidirectional loop for every important structure:

```
LIVE DOM  ↔  DEVTOOLS STYLES/COMPUTED  ↔  MINIFIED CSS  ↔  MINIFIED JS  ↔  RUNTIME DOM CHANGES
```

For every important classname/component found in the DOM: search the loaded JS for where it's
created/assigned (element creation, conditional classes, event handlers, state changes) and search
the loaded CSS for every selector using it (base/modifier/state/media-query/pseudo-element rules,
CSS variable dependencies) — confirm both against Computed. When a class toggles on interaction,
find the JS that adds it AND the CSS rule for the toggled state, not just the before/after DOM diff.
Don't conclude "no source implementation" just because a plain classname grep failed — minification
hides things; fall back to visible text strings, IDs, data attributes, event names, icon
identifiers. Never copy a dynamically-generated/hashed classname or a computed `var(--x)` value
without finding where `--x` is actually defined. When DOM and source seem to disagree, that's a
signal to dig further (dynamically-injected CSS, alternate stylesheet, generated selector, another
loaded bundle), never a reason to just pick one side and move on. `dump-network-body.js` (see
Tooling below) pulls the real loaded bundles out of an already-open tab's Network log for this —
use it instead of re-fetching HabboCity's own assets (which hits Cloudflare) and instead of relying
on the old bulk-extracted `_*.scss` baseline alone. Read-only rules apply identically to source
inspection as to DOM inspection — never patch/inject/rewrite anything on the reference. Full detail
in `memory/feedback_dom_js_css_cross_reference.md`.

### Phase 1 progress — base DOM structure map (started 2026-09-21, second slice, corrected)

**Status: incomplete — whole-app-shell pass in progress.** Captured via CDP against the real client
document (`cdn.habbocity.fr`'s own frame, reached through `eval-in-iframe.js`), reading
`document.body` and its subtree directly, cross-checked from multiple entry points (traced up from
`.navigation-item`, from `.nitro-toolbar`, and down from `#root`) — not inferred from any bundle. No
project code was touched while gathering this. **This replaces an earlier, wrong draft of this same
section from earlier the same session** — that draft mis-read one `.nitro-hotel-view` node reached
via two different traversal paths as two separate hotel-view instances; it is one node, and the
"collapses when in a room" claim in that draft was wrong (see below).

```
document.body [class: "dark-mode" — the dark-mode toggle lives here, at the very root]
└── #root [w-100 h-100]                                       — React mount point
    └── (unnamed) [w-100 h-100 overflow-hidden image-rendering-pixelated]   — viewport clipper,
        │                                                        position:static, real 1440×773
        ├── .animate__animated                                  — CSSTransition/animate.css wrapper
        │   └── .w-100.h-100 (this specific node's own rect reads 0×0 — harmless: everything real
        │       │             inside it uses position:absolute/fixed, so it never needed layout
        │       │             height of its own; do not read a 0×0 wrapper here as "collapsed" or
        │       │             "hidden", check the actual visible children's own rects instead)
        │       ├── .animate__animated (nested) → .nitro-hotel-view  [position:fixed, real
        │       │     1440×773, background-color rgb(152,197,247) i.e. the sky-blue backdrop
        │       │     visible behind the hotel exterior scenery]
        │       │       └── .container.h-100.py-3.overflow-hidden.landing-widgets [z-index:9]
        │       │           └── .row.h-100
        │       │               ├── .col-9.h-100.d-flex.flex-column → 5 of the 7 `.widget-slot`s
        │       │               │   (slot-1..slot-6, sized via `.col-N` bootstrap grid classes)
        │       │               └── .col-3.h-100 → `.widget-slot.slot-7`
        │       │           (all 7 slots were EMPTY + height:0 in the state captured — no
        │       │           promotional/news widgets configured at capture time; slot count/grid
        │       │           sizing is real, slot *contents* are still unmapped — needs a capture
        │       │           where the hotel actually has active landing widgets)
        │       ├── .nitro-toolbar [d-flex gap-2 align-items-center justify-content-between
        │       │     nitro-toolbar, position:absolute, z-index:91] — confirmed real root class,
        │       │     previously only individual toolbar icons had been inspected, never this
        │       │     container itself
        │       │       └── .nitro-toolbar-container.left → individual `.navigation-item` icons
        │       ├── .w-100.h-100.d-none → one hidden `<canvas>` (0×0) — a landing-widget mini
        │       │     preview canvas, NOT the main room/scene renderer (see gap below)
        │       ├── .nitro-left-side [position:absolute, z-index:20]
        │       │     └── .nitro-left-side-container [d-flex h-100 position-relative gap-1] — real
        │       │           container confirmed, genuinely EMPTY (0 width) on the landing view;
        │       │           almost certainly the room-tools-family left rail (this project's own
        │       │           `RoomToolsWidgetView` etc.), which only has content once inside a room —
        │       │           consistent with being empty here, not a bug in the reference
        │       └── .nitro-right-side [position:absolute, z-index:69, ~200×713]
        │             └── (unnamed) [d-flex position-relative flex-column gap-1]
        │                 ├── .nitro-purse-container [~200×75] — confirmed real, matches this
        │                 │     project's own already-verified `PurseView`/`CurrencyView` 1:1
        │                 └── (unnamed) [d-flex flex-column gap-1] — present but EMPTY (height:0) on
        │                       the landing view; almost certainly where the friends-bar
        │                       (`components/friends/views/friends-bar/`) mounts when populated —
        │                       not cross-checked against a state where it actually has content
        └── #draggable-windows-container [position:absolute, full viewport]
            └── .draggable-window [position:absolute; one per open card] — confirmed this is
                exactly the same pattern our own `common/draggable-window` + `NitroCardView`
                already implement (each wraps one `.nitro-card...` root) — this part of our
                foundation already matches, not a gap.
```

**Scenery-rendering gap — RESOLVED via DOM ↔ JS cross-reference** (the "Mandatory" section above
was applied here, not just DOM archaeology): DOM inspection alone genuinely could not explain the
hotel-exterior scenery (0 `<img>` tags, only one unrelated 0×0 hidden `<canvas>`). Pulled the real
bundles with `dump-network-body.js` (`nitro-renderer-e1eabbd3.js`, `index-b7d2b6d3.js`,
`_index.css` — all four of habbocity's own loaded assets, confirmed via
`performance.getEntriesByType('resource')` first so the right substrings were dumped) and grepped
the app's own React bundle (`index-b7d2b6d3.js`) for the `image-rendering-pixelated` string found in
the DOM, which led straight to the top-level scene-switching component (minified name `QB`), which
renders `fD` (the real **HotelView** component) inside a `FADE_IN` transition — confirming
`.animate__animated` is exactly `react-transition-group`/animate.css, not a red herring. `fD`'s own
source is fully readable despite minification and gives the real, complete `.nitro-hotel-view`
markup:
```
<div class="nitro-hotel-view" style="background: <hotelview.images.background.colour>">
  <div class="container h-100 py-3 overflow-hidden landing-widgets"> ...7 widget slots... </div>
  <div class="background position-absolute" style="background-image: url(<hotelview.images.background>)" />
  <div class="left position-absolute" style="background-image: url(<hotelview.images.left>)" />
  <div class="right-repeat position-absolute" style="background-image: url(<hotelview.images['right.repeat']>)" />
  <div class="right position-absolute" style="background-image: url(<hotelview.images.right>)" />
  { hotelview['show.avatar'] && <div class="avatar-image"><AvatarImage figure={userFigure} direction={2} /></div> }
</div>
```
**So the scenery is plain CSS `background-image` on stacked `.position-absolute` divs, sourced from
hotel-view config data (`pe("hotelview")` — this project's own `GetConfiguration` equivalent) —
genuinely a DOM/CSS/config concern, in scope for this migration, not a graphics-engine one as
earlier guessed.** `.avatar-image` renders exactly one avatar (the current user's own figure, config-gated).

**Room-vs-landing ambiguity — RESOLVED.** Confirmed directly: `.icon-house` (not `.icon-habbo`) is
present in the toolbar right now, and `.nitro-hotel-view .background`'s own inline style resolved to
a real, live URL — `background-image: url("https://habbocity.fr/swfs/c_images/upload/bZl2WmP05v5wms0.png")`
— i.e. a genuine static background image asset. **All of this session's earlier screenshots showing
"a crowd of ~9 avatars standing together" were the hotel landing view the whole time** — those
avatars are baked into that one static PNG as part of the artwork, not live-rendered. There is no
room-vs-landing ambiguity to resolve further; this was the landing view throughout.

**Notification-center — inconclusive, not guessed at.** Searched the bundle for a general toast/
alert container matching this project's own `notification-center` component. Found two real but
narrower things instead: a reusable `nitro-notification-bubble` component (`Ql`, fade-out timer,
used in exactly one place found — a colour-configurable achievement/badge-style bubble, not a
general toast) and a `messenger-notification-icon` (inline security/room-invite notices inside the
friends/messenger thread UI specifically, not a standalone container). Neither is a general
app-wide "notification center" the way this project has one. Two explanations remain open: either
the reference doesn't have a centralized notification-center at all (each feature handles its own
inline notices), or it's one of the ~20 still-unidentified top-level singleton components from the
`QB` list (`WD`, `OU`, `Zk`, `XB`, `Td`, `aM`, `ND`, `Jk`, `CL`, `dM`, `FM`, `VU`, `FU`, `PL`, `ik`,
`pD`, `lM`, `qL`, `YL`, `uk`, `_L`, `aL`, `GU` — none individually identified yet). Do not assume
either answer — this needs either a real click-through capture of an in-app notification appearing,
or reversing more of that component list.

**What Phase 1 has NOT covered yet:** landing-widget slot *contents* (need a capture with active
widgets — the `ao` component seen taking `widgetSlot`/`widgetType`/`widgetConf` props is the
per-slot widget renderer, not yet inspected itself), popups (context menus, tooltips), the ~20
still-unidentified top-level singleton components listed above, and a **real, confirmed in-room
capture** (a real room's own top-level container, distinct from `.nitro-hotel-view`, has not
actually been captured this session — see the resolved room-vs-landing finding above). Phase 1 is
**not complete**.

### Phase 2 progress — classname map (started 2026-09-21, shell pieces only)

**Status: incomplete — only the app-shell pieces Phase 1 already confirmed.** CSS rules below are
pulled verbatim from the real client stylesheet (`cdn.habbocity.fr/src/assets/index.css`, 1.7MB,
same one the original bulk extraction was based on — dumped fresh this session via
`dump-network-body.js` rather than trusted from that old extraction), not copied from the
`_*.scss` baseline and not guessed.

```
ELEMENT: Toolbar root
CLASS: .nitro-toolbar
PURPOSE: main bottom toolbar, always mounted (both landing view and in-room)
CSS RULES: position:absolute; bottom:15px; left:0; width:calc(100% - var(--holo-paddings)*2);
  height:60px; z-index:91; margin:0 var(--holo-paddings)
  Three real breakpoints, not one — **correction to an error made earlier this same session**: an
  initial pass only grepped the `@media (min-width:1106px)` rule and wrongly concluded "the toolbar
  has NO background pill below 1106px, not yet implemented in our project." Checking this project's
  own `_toolbar.scss` afterward found **all three breakpoints already correctly ported** (better
  than what the fresh grep alone had found): `@media (min-width:1106px)` and
  `@media (max-width:1105px) and (min-width:925px)` both style `.nitro-toolbar` itself (background/
  border-radius/box-shadow/border/backdrop-filter, the 925–1105px range additionally growing
  `.nitro-toolbar-container.center` and hiding the friend-bar container); `@media (max-width:924px)`
  moves that same background/border/backdrop-filter treatment onto `.nitro-toolbar-container`
  instead (each icon group gets its own pill rather than one bar-wide background). **Verified live**
  by resizing the actual dev client to 900px width via `Emulation.setDeviceMetricsOverride` and
  screenshotting — the per-group pill treatment renders correctly. Nothing needed fixing here; the
  earlier claim in this file was simply wrong and is corrected now rather than left standing.
STATE CLASSES: .inactive { display:none!important } (scoped `.nitro-toolbar .inactive`); child
  `#toolbar-chat-input-container` gets `flex-grow:1`
CHILD RELATIONSHIPS: → .nitro-toolbar-container.left → .navigation-item icons (icon-house/
  icon-habbo toggle by landing-vs-room state, confirmed via JS in Phase 1 above)
CONFIDENCE: VERIFIED (DOM + CSS + JS cross-referenced, AND now live-resize-tested — the strongest
  confidence tag used anywhere in this document so far)

ELEMENT: Hotel/landing view root
CLASS: .nitro-hotel-view
PURPOSE: full-viewport landing screen; fixed position so it renders correctly regardless of
  ancestor transition-wrapper collapse (see Phase 1 shell map above)
CSS RULES: display:block; position:fixed; width:100%; height:100%; background:black; color:#000
  (the black is the *default* — actual colour comes from inline style, `hotelview.images
  .background.colour` config, confirmed in Phase 1's JS trace)
CHILD RELATIONSHIPS (`.nitro-hotel-view .X` scoped rules, all confirmed real, several NOT yet seen
  in this project's own `NavigatorView`-adjacent code — this is a real gap list, not exhaustive):
  - `.avatar-image { bottom:39px; left:55px; position:absolute; z-index:1 }` — current user's own
    avatar, config-gated (`hotelview['show.avatar']`)
  - `.background { top:0; height:100%; width:100%; background-size:auto 100%;
    background-repeat:repeat-x; background-position:top left }` — the big scenery image
  - `.drape { width/height:100%; left:0; top:0; animation-name:slideDown; animation-duration:1s;
    z-index:3; background-repeat:no-repeat }` — a real, animated decorative layer; NOT seen in the
    JSX window captured in Phase 1 (that capture showed `.background`/`.left`/`.right-repeat`/
    `.right`/`.avatar-image` only) — its actual JSX usage still needs locating, flagged not guessed
  - `.sun { width/height:100%; top:0; left:0; right:0; margin:auto; background-repeat:no-repeat;
    background-position:top center }` — same situation as `.drape`, real CSS, JSX usage not yet
    located
  - `.left { ...; animation-name:slideUp; animation-duration:1s; background-position:left bottom }`
  - `.right { width/height:100%; right:0; bottom:0; animation-name:slideUp; animation-duration:1s;
    background-repeat:no-repeat; background-position:right bottom }`
  - `.right-repeat { width/height:100%; right:0; top:0; background-repeat:no-repeat;
    background-position:right top }`
  - `.landing-widgets { z-index:9; position:relative }` and `.widget-slot { z-index:9 }` — matches
    the DOM capture in Phase 1 exactly (both z-index:9, confirmed not guessed)
STATE CLASSES: none found yet (no `.nitro-hotel-view.foo` modifier classes located)
CONFIDENCE: PARTIALLY VERIFIED — the container and all named decorative-layer classes are CSS-
  confirmed; `.drape`/`.sun` specifically are CSS-verified but not yet JS/DOM-confirmed in context
  (their JSX usage sits outside the window captured in Phase 1's source read)

ELEMENT: Right-side rail
CLASS: .nitro-right-side
PURPOSE: vertical stack on the right edge (purse, and below it a currently-empty slot — almost
  certainly friends-bar, per Phase 1's DOM findings)
CSS RULES: position:absolute; top:0; right:var(--holo-paddings); min-width:200px; max-width:200px;
  height:calc(100% - 60px) (i.e. viewport height minus the toolbar's own 60px); z-index:69;
  pointer-events:none (children must opt back in with their own pointer-events, note for Phase 4/5)
CHILD RELATIONSHIPS: → .nitro-purse-container (own real rule: font-size:15px; pointer-events:all;
  margin:var(--holo-paddings) 0; --padding-adjusted:calc(var(--holo-paddings)*.5)) → then a second,
  currently-empty flex-column slot
CONFIDENCE: VERIFIED for the container + purse; the second (empty) slot's own class/rule not yet
  captured since it has no content to select right now

ELEMENT: Left-side rail
CLASS: .nitro-left-side
PURPOSE: vertical slot on the left edge, empty on the landing view — likely the room-tools-family
  rail (this project's own `RoomToolsWidgetView`), only populated inside a room
CSS RULES: position:absolute; top:100px; left:var(--holo-paddings); z-index:20; min-height:0;
  bottom:145px
  @media (max-width:924px) OVERRIDES: bottom:220px — **confirmed the exact same 924px breakpoint**
  already referenced in this project's own room-tools notes ("Real, currently-open findings" above,
  and `_room-tools.scss`'s own `@media (max-width:924px) { bottom:165px }`) — this is a real,
  shared, project-wide breakpoint, not isolated to one component. Worth checking whether other
  shell pieces (toolbar's own 1106px breakpoint above is a DIFFERENT one — don't conflate the two)
  also key off 924px specifically.
CONFIDENCE: VERIFIED (base rule + media override both confirmed with their exact condition)

ELEMENT: Draggable window wrapper
CLASS: .draggable-window (scoped as `#draggable-windows-container .draggable-window`)
PURPOSE: positioning wrapper for every open card (Navigator, Purse popouts, dialogs, etc.)
CSS RULES: display:inline-block; visibility:hidden; pointer-events:all
STATE CLASSES: **real, previously-unknown finding** — `visibility:hidden` is the BASE rule, meaning
  every draggable window starts hidden and something (a JS-added class or inline style, not yet
  located) must flip it visible post-mount/position-calculation. This project's own
  `common/draggable-window` does not currently replicate a hidden-until-positioned step — worth
  checking whether its absence causes a visible flash-of-unpositioned-window our own cards don't
  have a guard against. Flagged, not fixed (Phase 4+ concern, not Phase 2).
CONFIDENCE: VERIFIED for the rule itself; the mechanism that un-hides it is NOT yet found — do not
  assume it doesn't exist just because DOM inspection of an already-open window won't show it
```

**What Phase 2 has NOT covered yet:** almost everything — this is only the 5 shell pieces Phase 1's
first slice touched. Every individual toolbar icon, every card/window's own internal classnames,
the ~20 unidentified top-level singleton components, landing-widget slot internals, and every
component this project has already been through Block 1's protocol for (purse, room-tools,
chat-style, Me-panel/friend-bar, room-info, outfit editor, Navigator) have **not** been re-verified
under this newer, stricter Phase 2 format — they were verified under Block 1's protocol, which is
compatible but did not always produce this exact element→class→purpose→CSS→state→children record.
Do not backfill that retroactively unless a specific reason comes up; treat it as already covered by
Block 1 for now.

**Bundle map for future cross-referencing** (all pulled via `dump-network-body.js`, confirmed via
`performance.getEntriesByType('resource')` — don't re-fetch, don't guess filenames, they're
content-hashed and change on every habbocity deploy): `index-b7d2b6d3.js` is HabboCity's own React
app code (top-level scene component minified as `QB`, Toolbar as `kU`, HotelView as `fD` — these
minified names are almost certainly stale after habbocity's next deploy, re-grep by unique string
rather than trusting the name); `nitro-renderer-e1eabbd3.js` is `@nitrots/nitro-renderer`, the same
package this project itself already depends on for room/avatar rendering; `vendor-8f7f7c7a.js` is
third-party libs. **Correction to an error made earlier this same session:** the real client
stylesheet is `https://cdn.habbocity.fr/src/assets/index.css` (1.7MB — this is the one the original
bulk-extraction pass was actually based on, and the one Phase 2/3 CSS rules below are pulled from).
A same-named but unrelated, much smaller (11KB) `https://habbocity.fr/assets/css/_index.css` also
exists — that one belongs to the **outer wrapper page** (`habbocity.fr` itself, not the
`cdn.habbocity.fr` client), and was wrongly dumped/cited as "the compiled stylesheet" in an earlier
version of this note. When dumping CSS again, match on the full `cdn.habbocity.fr/src/assets/`
path, not just `index.css`, or the wrapper page's file will be grabbed by mistake.

### Phase 3 progress — base CSS/SCSS/variables (started 2026-09-21, GLOBAL slice only)

**Status: incomplete — GLOBAL tokens + the scrollbar primitive only, LAYOUT and COMPONENT
FOUNDATION sub-phases not started.** Pulled from the real 1.7MB client stylesheet (see corrected
bundle map above), not from the old bulk-extraction baseline.

**Full global design-token inventory** — `.dark-mode` (applied on `document.body`, confirmed in
Phase 1) sets, verbatim:
```
--dark-mode: 1
--holo-primary-H/S/L: 221 / 23% / 16%        --holo-secondary-H/S/L: 219 / 25% / 11%
--holo-tertiary-H/S/L: 222 / 24% / 45%        --holo-infostand-H/S/L: 240 / 7% / 12%
--holo-primary/-secondary/-tertiary/-infostand: hsl(...) built from the H/S/L triples above
--holo-notifications: var(--holo-primary)
--holo-text-primary: white          --holo-text-primary-invert: black
--holo-text-secondary: white        --holo-text-secondary-invert: black
--holo-text-tertiary: white         --holo-text-tertiary-invert: var(--holo-tertiary)
--holo-text-muted: #7F7F7F          --holo-text-infostand: white
--holo-font: "Ubuntu"               --holo-text-shadow: rgba(255,255,255,.25)
--holo-text-weight: 700
--holo-box-shadow-offset-x/y: 0px / 4px     --holo-box-shadow-blur-radius: 10px
--holo-box-shadow-spread-radius: 0px        --holo-box-shadow-color: #FFFFFF10
--holo-box-shadow: <composed from the four above>
--holo-border-radius: 12px
--holo-border-color-primary/-secondary: #2E334D     --holo-border-size: 3px
--holo-input-height: 37px           --holo-input-border-size: 3px
--holo-disabled-input-opacity: .4   --holo-paddings: 15px
--holo-inventory-color-theme-primary: #EE867B       --holo-inventory-color-theme-secondary: #EE867B4D
--holo-catalog-color-theme-primary: #EEB80E
--holo-navigator-color-theme-primary: #65AF64 (secondary/tertiary derived from --holo-tertiary-*)
--holo-camera-color-theme-primary: #DD93DD
--holo-friends-color-theme-primary: #9180FF
--holo-friends-item-color-theme-primary/-secondary: #3C90E6 / #7DB7F2
--holo-messages-color-theme-primary: #3C90E6        --holo-mentions-color-theme-primary: #E65B00
--holo-landing-view-color-theme-primary: #93AECA    --holo-me-color-theme-primary: #99D5DF
--holo-scrollbar-background: var(--holo-tertiary)
--holo-scrollbar-thumb: hsl(var(--holo-primary-H), var(--holo-primary-S), calc(var(--holo-primary-L) + 10%))
```
This is a **complete verbatim capture of the single `.dark-mode{...}` rule** — nothing in this list
is inferred or guessed. **Correction to a second error made this same session**: this note
originally claimed several of these (`inventory`/`catalog`/`camera`/`friends`/`messages`/
`mentions`/`landing-view`/`me` theme-primary colors) were "not previously known to this project's
own `_dark-mode.scss` baseline" — that claim was made without actually re-reading the current file,
and was wrong. A direct read of `src/assets/styles/habbocity/_dark-mode.scss` found **every single
token in the list above already present, byte-for-byte identical**, including all the ones just
claimed missing. There was no gap here at all. Recorded as a reminder to actually open and read the
current file before asserting something is missing from it, not just recall an earlier session's
partial grep — the toolbar-breakpoint correction earlier in this document is the same category of
mistake, made in the same session, twice.

**Bootstrap reset confirmed standard**, not habbocity-specific: `*,*:before,*:after{line-height:
normal;box-sizing:border-box}`, `body{margin:0;font-family:var(--bs-body-font-family);...}` with
`--bs-body-font-family: var(--bs-font-sans-serif); --bs-body-font-size:.9rem; --bs-body-font-weight:
400; --bs-body-line-height:1.5; --bs-body-color:#fff; --bs-body-bg:#000`, and `:root{scroll-
behavior:smooth}` under `@media (prefers-reduced-motion:no-preference)`. Nothing custom here beyond
the dark background/white text defaults — nothing to port beyond what Bootstrap already gives us.

**Custom scrollbar primitive — fully resolved** (this closes the gap flagged as open in the
Navigator pass's "open findings": *".scroll-container's real custom-scrollbar chrome was not
rebuilt... this project has no existing reusable component for it"*):
```
.scroll-container {
  --scrollbar-width: 6px; --scrollbar-height: 6px;
  position: relative;
  display: grid;  (implied by grid-template-* below — the container itself is a 2×2 CSS grid)
  grid-template-columns: 1fr var(--scrollbar-width, 0px);
  grid-template-rows: 1fr var(--scrollbar-height, 0px);
}
.scroll-container .scroll-content {
  grid-column: 1/2; grid-row: 1/2;   — occupies the real-content cell, NOT the scrollbar's own track
  flex: 1; overflow: auto; min-height: 0;
}
.scroll-container .scroll-content.vertical, .scroll-content.both { overflow-y: scroll }
.scroll-container .scroll-content.horizontal, .scroll-content.both { overflow-x: scroll }
.scroll-container .scroll-bar {
  box-shadow: var(--holo-box-shadow);
  background-color: var(--holo-scrollbar-background);
  overflow: hidden;
}
.scroll-container .scroll-thumb {
  position: absolute;
  background-color: var(--holo-scrollbar-thumb);
}
.scroll-container .scroll-bar, .scroll-thumb { border-radius: 15px }
.scroll-container .scroll-bar.vertical, .scroll-thumb.vertical { width: var(--scrollbar-width,0px) !important }
.scroll-container .scroll-bar.horizontal, .scroll-thumb.horizontal { height: var(--scrollbar-height,0px) !important }
```
Mechanism, fully understood now: the real, native browser scrollbar on `.scroll-content` is left in
place but visually invisible/off to the side (standard "hide native scrollbar, draw a fake one"
trick — the exact hiding CSS, e.g. a negative-margin/`scrollbar-width:none` rule, was not captured
in this pass and is the one remaining unknown for this primitive); the CUSTOM visible bar
(`.scroll-bar`/`.scroll-thumb`) lives in the grid's second column/row track and must have its
`.scroll-thumb`'s `height`/`top` (or `width`/`left` for horizontal) set via **inline style computed
by JS** from the real scroll position/ratio — confirmed empirically during the Navigator pass
(`style="height: 156.157px; top: 0px;"` was observed on a live `.scroll-thumb.vertical`). This is
now a complete-enough spec to actually build as a shared component in Phase 4+ — not done yet, this
is Phase 3 documentation only, per Phase 0's freeze.

**What Phase 3 has NOT covered yet:** the native-scrollbar-hiding rule itself — searched directly
(`.scroll-content{...}`'s own full rule block was read in full, plus every `scrollbar-width`/
`::-webkit-scrollbar` occurrence in the whole stylesheet) and found unrelated matches only (a
generic Bootstrap-family themed scrollbar used elsewhere, and an unrelated `.horizontal-scroll-
container`) — no hidden-native-scrollbar rule tied to `.scroll-content` exists in the CSS at all,
meaning it's most likely set inline by JS (same mechanism as the thumb's own inline height/position)
rather than in the stylesheet; not confirmed, don't guess further without a live DOM inline-style
check. LAYOUT foundation (containers/flex/grid/widths/heights/positioning beyond what Phases 1–2
already incidentally captured) is still untouched.

**COMPONENT FOUNDATION — `.nitro-card` checked, fully correct, no gap.** Pulled `.nitro-card`,
`.invisible-card`, `.resize-handler`, `.theme-primary`/`.theme-primary-slim` (incl. the real
`.nitro-card-header` min/max-height:40px), and the full `.nitro-card-tabs .nav-item` rule set
(including `.active`, `.small`, and the `.nitro-avatar-editor`/`.user-profile`/`.nitro-wired`
per-context overrides) straight from the fresh 1.7MB bundle and diffed against this project's own
`_card.scss` line by line — **byte-for-byte identical, zero divergence.** No fix was needed.

**Real strategic insight from this check (worth acting on for the rest of Phase 3 and beyond):**
every genuine CSS gap found so far this session — the search bar, custom-select dropdown, holo-
button, and scroll-container — was for **interactive/dynamically-rendered** UI (something that only
appears in the DOM after a click: a dropdown panel, a portal-rendered menu). Every **static,
always-present-in-the-DOM** structural class checked so far (`.nitro-card` and its whole family,
the dark-mode token sheet, the toolbar's responsive breakpoints, the room-tools breakpoint) has
turned out to be **already fully and correctly ported**. The bulk extraction's method (grep the
minified bundle for classes found in the rendered DOM at extraction time) explains this exactly: it
reliably captures anything always in the DOM, but can only capture a dynamically-rendered class if
that specific interaction happened to be triggered during the original extraction session. **For
the rest of Phase 3 (and Phase 8's feature scan), prioritize checking interactive/conditionally-
rendered UI over re-checking static component foundations** — tooltips, context menus, hover/
focus/open states, popups, and anything gated behind a click is where real gaps are actually
concentrated, not the base card/tab/button CSS.

**Self-correction pattern from this same session, worth flagging explicitly:** three "is this
missing?" checks were run this round (dark-mode tokens, toolbar breakpoint, now `.nitro-card`) —
two were wrongly claimed as gaps purely from memory of an earlier partial grep, without re-reading
the current file first, and were wrong both times. See `memory/feedback_dom_js_css_cross_reference.md`'s
self-caught addendum. Phase 3 is **not complete** (LAYOUT foundation still untouched, and Phase 3's
own "COMPONENT FOUNDATION" checklist item covers more than just `.nitro-card` — buttons/inputs/
windows/overlays haven't been individually diffed yet), but treat any further "X is missing" claim
skeptically until the current file has actually been opened and checked.

### Phase 4/5 — first built primitive: ScrollContainerView (2026-09-21)

Built `common/scroll/ScrollContainerView.tsx` + `assets/styles/habbocity/_scroll-container.scss`
from the Phase 3 spec above — the first piece of actual DOM+CSS (Phase 4/5) work to come out of the
foundation-first restart, deliberately scoped to structure+style only, no drag-to-scroll interaction
(that's Phase 7). Renders `.scroll-container` (CSS grid) > `.scroll-content.<direction>` +
`.scroll-bar.<direction>` > `.scroll-thumb.<direction>`, with the thumb's size/position computed via
a `ResizeObserver` + scroll-ratio calculation (mirrors the reference's own inline-style mechanism
found empirically during the Navigator pass). Takes an `innerRef` (matching this project's existing
convention) so callers needing direct scroll-position access (e.g. reset-to-top on new results)
don't lose that capability versus a plain `overflow:auto` div.

Wired into `NavigatorView.tsx`'s results list, replacing the plain `overflow:auto` `Column` that
pass had used as an honest placeholder (see the Navigator section's own "open findings" — this
closes that gap). `tsc` and HMR both compile clean. Verified structurally via live DOM inspection
on the dev client: `.scroll-container` correctly split into a content cell and a 6px `.scroll-bar`
track immediately beside it, pixel-matching the CSS grid math (`grid-template-columns: 1fr 6px`).
**Not yet verified**: actual thumb sizing/position with real overflowing content — this dev
server's seed data doesn't have enough rooms to produce a scrollable list, so the thumb's own
`ResizeObserver`-driven sizing logic hasn't been exercised against a real overflow case yet. Also
not yet done: swapping in the same primitive anywhere else it's needed (the custom-select dropdown
panel most likely also wants it, per Phase 1's own DOM find of `.scroll-content`/`.scroll-container`
nested inside `.custom-select-panel`).

## The current effort: HabboCity UI + feature parity (started 2026-09-21)

The user's own words, given verbatim mid-session as a hard correction after an earlier bulk/
mechanical approach was rejected, and extended once more to cover full feature parity (not just
CSS). **Read both blocks below in full before touching any component — then read the section above
this one, which governs the order this work must now happen in.**

### Block 1 — strict DOM-verified, component-by-component method

**Absolute rule: HabboCity (`habbocity.fr` / `cdn.habbocity.fr`) is READ-ONLY.** Never modify its
JS/CSS/DOM, never inject scripts/styles into it, never intercept/rewrite its network responses,
never disable its behavior. Only observe via Chrome DevTools/CDP — normal user interaction only
(navigate, click, hover, open menus, resize, inspect). If information is needed, inspect for it or
trigger it via real interaction; never modify the reference to make inspection easier.

**Source-of-truth priority, never reversed:**
```
Rendered DOM  >  DevTools Computed/Styles  >  loaded stylesheet/source  >  loaded JS  >
minified-bundle interpretation  >  your own assumption
```
A classname found in a minified bundle is **not** proof it belongs to the component being ported —
confirm it against the real rendered DOM and real computed styles first. If it can't be verified,
mark it `UNVERIFIED` and do not implement it. No "looks similar" / "probably this class" / "I
recreated it approximately" — every non-trivial change needs an observed reference capture
(outerHTML + computed styles), not an inference from grep/regex over a minified bundle.

**Work component-by-component, never mass-rewrite.** Sequence per component: verify → replace →
test → regression-check (build or HMR-reload, open the component, compare DOM / classnames /
computed styles / dimensions / interaction / responsive behavior / console against the reference)
— then move to the next component. **A prior pass in this same project (before this file existed)
extracted the whole ~1.7MB minified habbocity CSS bundle and batch-rewrote all ~140
`src/assets/styles/habbocity/_*.scss` override files in one mechanical, regex-matched shot. The
user explicitly rejected this method mid-turn** — even though the *goal* (full 1:1 replacement, not
a hand-picked diff) was correct, the *method* (bulk, unverified per-element) was wrong. Per the
user's own explicit direction afterward, that bulk output was **kept as a rough, unverified
starting point** (it turned out to be substantively accurate where spot-checked — see "What's been
verified" below) rather than reverted, and every component touched since has gone through the real
per-component protocol instead. **Do not repeat the bulk approach — not even under time pressure,
not even for "just the icon files" or "just the small ones."**

**Build a real inventory before changing code.** Per component: reference URL, reference DOM,
reference classes, reference computed styles, reference stylesheet, reference JS bundle, responsive
behavior, interaction states (hover/focus/active/disabled/open/closed/etc.), confidence tag —
`VERIFIED` / `PARTIALLY VERIFIED` / `UNVERIFIED`. Never treat non-`VERIFIED` info as fact or ship
it as if it were.

**Cascade/responsive/state debugging discipline:** trace `DOM → classnames → computed styles → box
dimensions → position → fonts → cascade → responsive rules → your UI`, fix only the first real
divergence found — don't rewrite the whole component speculatively. Don't cascade-fix with
`!important` unless the reference itself demonstrably needs equivalent priority. Check real
interaction states and real viewport breakpoints from DevTools, never invented ones.

### Block 2 — extension: full feature parity, not just visual/CSS

> **Our UI must contain every relevant UI feature that HabboCity has. If our UI is missing a
> HabboCity feature, implement it cleanly in our project.**

HabboCity stays the **UI/DOM/CSS/interaction** source of truth. This project's **own existing
code** (hooks, composers, category models — referred to as "Octane" in the user's own instructions,
meaning *our own already-existing logic layer*, not a separate external codebase) is the **logic**
reference only:
```
HabboCity → UI / DOM / CSS / UX / interaction
Our own existing code → logic / behavior / implementation reference
Final implementation → HabboCity's UI wired to our own real logic
```
**Do not copy our own UI patterns over HabboCity's** — the direction only ever runs the other way.
**Do not blindly port logic just because it exists already** — first understand what HabboCity
*does* (state, trigger, visible result), then use our own existing hooks/composers only where the
underlying mechanism itself is unclear, and implement a clean equivalent.

**Full feature inventory, not just the obvious components** — toolbar, navigation, room controls,
avatar/outfit editor, inventory, catalog, dialogs, popups, tabs, notifications, badges, currency
displays, settings, search/filters, dropdowns, tooltips, context menus, pagination, loading/empty/
error states, confirmation dialogs — **including features only reachable after an interaction**
(click, hover, open a menu, switch tabs, change outfit, select an item, enter a room, resize).
**Do not assume the initial page contains everything** — this exact assumption was wrong twice
already this session (see the Me-panel and chat-style-icon findings below: both looked "missing"
at first glance and were actually already correctly built, just gated behind an interaction that
hadn't been tried yet).

Classify every discovered feature:
```
EXISTS + MATCHING          EXISTS + NEEDS FIX          MISSING + NEEDS IMPLEMENTATION          NOT APPLICABLE
```
**No duplicate systems** — before adding anything, search for an existing implementation
(`toolbar2`/`outfit-new`/etc. are exactly what NOT to create). Correct, complete, or cleanly
replace the existing one instead.

**Don't remove code merely because it looks unused** — verify first. Example this session: the
Room Info panel's "Furni brush" button is a real, deliberate, already-documented temporary trigger
for a *different*, in-progress project (`nitro-builder-toolbar-plugin` — Builder Mode's toolbar,
see that repo's own `CLAUDE.md`) standing in until a proper notification-bubble trigger is built
there. It is **not** a real HabboCity button (confirmed absent from the live reference) but it is
also not dead code — removing it would leave Builder Mode with no way to open at all. Left in
place, flagged, not touched.

## Tooling / methodology that actually works

- **Chrome CDP, port 9222, the user's own already-authenticated browser** — same convention as
  `hCMS/CLAUDE.md`'s own established tooling (`c:\tools\nitro-catalog-copy\scripts\
  generic-page-reader.js`). Curl-based fetches of `cdn.habbocity.fr` get a real Cloudflare "Just a
  moment..." challenge page — the reference must be read through the real browser tab, never
  worked around.
- **`c:\tools\nitro-catalog-copy\scripts\eval-in-iframe.js`** (new this session, persisted from the
  scratchpad) — `node eval-in-iframe.js <tabIdOrUrlSubstring> <frameUrlSubstring> "<js
  expression>"`. Both habbocity's own site (`habbocity.fr` → iframe → `cdn.habbocity.fr`) and our
  own (`dev.habbo.nz` → iframe → `play.habbo.nz`) embed the actual Nitro client in a **cross-origin
  iframe** — plain `document.querySelector` from `generic-page-reader.js` only ever sees the outer
  wrapper page, never the client itself. This script finds the child frame via CDP's own
  `Page.getFrameTree` and creates a real isolated world inside it (`Page.createIsolatedWorld` +
  `Runtime.evaluate` with that `contextId`) — this is what actually lets you read/click the real
  client DOM on either site. **Use this, not `generic-page-reader.js` directly, for anything
  involving the Nitro client itself** (`generic-page-reader.js` is still right for the outer
  wrapper page, screenshots, and simple non-iframed pages).
- **`c:\tools\nitro-catalog-copy\scripts\dump-network-body.js`** — pulls a real response body
  (e.g. habbocity's own compiled JS/CSS bundles) out of an already-loaded page's own Network log via
  CDP, so it can be read/grepped locally without re-fetching (and re-hitting Cloudflare) — used once
  this session for the initial minified-CSS pull; **do not use this as a shortcut back into the
  rejected bulk-extraction method** — it's for pulling one real asset to inspect, not for
  regenerating whole override files.
- **Real dev workflow: `yarn start` (vite dev server, port 5173) + HMR**, not build+deploy per
  edit. Confirmed working and MUCH faster than the build/deploy loop used earlier in this session:
  edit a `.tsx`/`.scss` file, vite HMR picks it up in a few seconds (watch
  `nitro-react-Wired/vite-dev.log` if backgrounded), re-run the interaction, re-screenshot. Editing
  a shared `.ts` type file (e.g. `ButtonSizeType.ts`) triggers a cascade HMR update across every
  importer — normal, not an error. Editing `public/ui-config.json` or other files under `public/`
  is **not** hot-reloaded (it's fetched at runtime, not imported) — needs a real
  `location.reload()`.
  - **SSO tickets are single-use.** To open the dev client at `http://localhost:5173/?sso=<ticket>`,
    mint a fresh one by opening `https://dev.habbo.nz/hotel` in its own tab (creates a new tab:
    `curl -s -X PUT "http://127.0.0.1:9222/json/new?https%3A%2F%2Fdev.habbo.nz%2Fhotel"`), read its
    iframe's `src` (`.../index.html?sso=<ticket>&theme=dark`) via `generic-page-reader.js eval`,
    then navigate the dev tab to `http://localhost:5173/?sso=<ticket>&theme=dark` (same eval
    pattern). A stale/reused ticket gets the loading duck stuck at a fixed percentage forever — if
    that happens, mint a fresh one, don't wait it out.
  - **A raw `element.click()`/dispatched `MouseEvent` from CDP can silently no-op the first time**
    on some of these toggle buttons (confirmed on the Me-panel avatar toggle and the outfit-editor
    trigger both) — if a click doesn't produce the expected DOM change, just click again rather
    than assuming the feature itself is broken; this was a real, repeated false alarm this session,
    not an actual bug in any component.
  - **The real canonical build+deploy is `yarn deploy` (or `.\deploy.ps1` directly)** — already
    exists in this repo (added by an earlier session), builds with the correct heap size, refuses
    to touch the deploy target if the build didn't actually produce `dist/index.html`, and mirrors
    `dist/` into `hCMS/public/cdn/client` via `robocopy /MIR` (so stale hashed bundle files are
    cleaned up automatically — no manual `rm` needed, unlike the ad hoc `cp -r` this session did
    before finding the script). Use it for anything meant to go live at `play.habbo.nz`; HMR dev
    server is for iteration only.
- **Icon identification**: when a real icon renders as an inline SVG (react-icons), extract the
  real `<path d="...">` prefix from the live DOM and grep
  `node_modules/react-icons/fa/index.js` for a matching path to get the exact real icon component
  name (e.g. this session: the bottom-left avatar-editor action row is really `FaUndo`/
  `FaTrashAlt`/`FaDice`/`FaRecycle`, not `FaTrash` as the code had before).

## What's been verified/fixed this session (2026-09-21), in order

Full detail lives in the conversation itself; this is the durable summary. Everything below was
found via the protocol above — live DOM + computed-style capture on the real reference first, then
a matching fix, then an HMR-reload regression check.

1. **Purse widget** (`components/purse/{PurseView.tsx,views/CurrencyView.tsx}`) — markup was
   missing the real `.nitro-purse-list`/`.nitro-purse-buttons` wrapper divs (existing CSS had
   nothing to attach to); currency rows had icon/amount in the wrong order. Fixed, computed styles
   now match the reference exactly (background, gap, padding, dimensions). The purse's
   `.nitro-purse-subscription` block is real but was left exactly as-is (the real reference's own
   CSS force-hides it with `display:none!important` regardless — confirmed both sides render the
   same visually either way).
2. **Room-tools widget** (`components/room/widgets/room-tools/RoomToolsWidgetView.tsx`, new
   `assets/styles/habbocity/_room-tools.scss`, `components/room/widgets/RoomWidgets.scss`) — was
   rendering as a vertical dark stack (dead stock CSS in `RoomWidgets.scss`, keyed to the same
   outer classname, fighting the real ported CSS which had nothing real to attach to either, since
   the JSX used the wrong outer wrapper class). Real class is `.nitro-room-additional-widgets`
   (not `.nitro-room-tools-container`), real positioning is `position:absolute; bottom:90px; left:
   var(--holo-paddings)` with a real `@media (max-width:924px) { bottom:165px }` breakpoint (ported,
   not re-tested at that width yet). Fixed; now a real horizontal icon bar matching the reference.
   Deliberately **not** built: the real room-history back/forward group (needs actual
   previously-visited-room state tracking we don't have) and `icon-small-rights`/`icon-small-room`
   (real, room-owner-conditional edit-rights/build-mode icons — the build-mode one is very likely
   the eventual real trigger location for `nitro-builder-toolbar-plugin`'s own Builder Mode, not
   built here, flagged for whoever picks that up).
3. **Chat-style bubble picker** (`components/room/widgets/chat-input/
   {ChatInputView.tsx,ChatInputStyleSelectorView.tsx}`) — real markup is
   `.chatstyles-icon-container > .icon.chatstyles-icon` (two elements) positioned *inside*
   `.input-sizer` next to the `<input>`; ours was one div (`.chatstyles-selector`) as a sibling
   *before* `.input-sizer`. Fixed, DOM now byte-matches the reference.
4. **Me-panel** (`components/toolbar/ToolbarMeView.tsx`) and **friend bar**
   (`components/friends/views/friends-bar/FriendsBarView.tsx`) — initially assumed the
   outfit-editor trigger was missing entirely (no `icon-clothes-shop`-equivalent visible in the
   base toolbar). Wrong: clicking your own avatar expands the toolbar's left section in place to
   `icon-me-profile`/`icon-me-rooms`/`icon-me-clothing`/`icon-me-settings` — already built,
   already correct, verified byte-for-byte against the live reference. **Lesson repeated from the
   protocol's own "don't assume the initial page has everything" rule — confirmed the hard way.**
5. **Room Info panel** (`components/navigator/views/NavigatorRoomInfoView.tsx`) — real root theme
   is `theme-primary-slim` (ours was `theme-primary`, a different, real, already-CSS-supported
   variant — the panel rendered in totally unstyled default HTML button colors as a result, nothing
   to do with dark/light mode). Real house/favorite/room-link icons live in a `.btn-group.
   button-container` row of three `.btn.btn-primary.btn-xsm` buttons below the thumbnail — ours had
   the house icon inline with the room name and the room-link as a separate `FaLink` react-icon
   elsewhere. Fixed, and added a real, previously-**entirely-missing** feature: room favoriting
   (`icon-heart-small`) — the composers (`AddFavouriteRoomMessageComposer`/
   `DeleteFavouriteRoomMessageComposer`/`FavouriteChangedEvent`) already existed in
   `@nitrots/nitro-renderer` (the "Octane" logic layer) and had simply never been wired to any UI;
   wired now. Added a real `'xsm'` button size to `common/types/ButtonSizeType.ts` (was `'lg'|'sm'`
   only) — verified real, not invented (`.btn-xsm` exists in the real compiled CSS: padding
   `.1rem .25rem`, font-size `.54rem`).
6. **Outfit editor** (`components/avatar-editor/{AvatarEditorView.tsx,views/*}`,
   `public/ui-config.json`) — this component turned out to **already be a careful, verified port**
   from an earlier session (its own code comments cite the real minified-source component names,
   e.g. `"O1"`/`"A1"`, read directly rather than guessed) — not unbuilt, contrary to the initial
   assumption going in. Real bug found and fixed: `avatar.wardrobe.max.slots` was `14` in
   `public/ui-config.json`; the live reference confirmed exactly `10` (5 rows × 2, not 7 rows × 2).
   With the wrong value, the last 2 rows rendered outside the wardrobe panel's own styled bounds as
   broken solid-black boxes — a config-value bug, not a markup bug. Fixed to `10`. Also: the bottom
   action row's trash icon was `FaTrash` (wrong shape) → `FaTrashAlt` (real, path-verified); added
   the real 4th button (`FaRecycle`) that exists in the reference — confirmed live it is **always**
   disabled across every tab/category tried, so its real function is genuinely unknown; added
   visually (disabled, unwired) rather than guessed at, per the "don't implement unverified
   behavior" rule.

## Real, currently-open findings — not yet fixed, don't assume either way

- Room-info's real button-group icons (`icon-house-small`/`icon-heart-small`/`icon-room-link`) and
  the favorite composer are wired, but the **favorite toggle's own persisted/initial state** was
  not fetched from anywhere (there's no known "is this room already favorited" field on
  `navigatorData` — confirmed via search, not found). It currently always starts `false` regardless
  of real state; only the toggle *action* and the *live-update* event are real. A real initial-state
  source needs to be found (or confirmed not to exist client-side, in which case it's an honest,
  documented gap, not a bug) before this can be called fully correct.
- Zoom / chat-history / like-room icon click-through on the room-tools bar: CSS/DOM ported, never
  actually interaction-tested against the reference.
- ~~The 924px room-tools responsive breakpoint: ported, never re-screenshotted at that width.~~
  **RESOLVED 2026-09-21 (second session):** live-tested via `Emulation.setDeviceMetricsOverride` at
  900px width against the running dev client — `.nitro-room-additional-widgets`' own bounding rect
  moved from `y:640` (full width) to `y:565` (900px width), a 75px shift that exactly matches the
  documented `bottom:90px → bottom:165px` breakpoint change. Confirmed correct, no fix needed.
- Outfit editor: color-picker interaction (slider drag, wheel picker), category-item selection →
  live avatar update, and the save/close round trip were all visually confirmed present but not
  click-tested end-to-end against the reference this session.
- The bulk-extracted `assets/styles/habbocity/_*.scss` files (140 of them, from before this file's
  own history starts) remain a real, substantively-accurate-where-checked, but **formally
  unverified** baseline for every component not listed above. Treat each one as `UNVERIFIED` until
  it's actually gone through the protocol, not as already-correct.

## Navigator pass (2026-09-21, second session)

First real pass at the Navigator (`components/navigator/`) — the room-search/hotel-view surface
named in "Full feature inventory" below. Went through the real protocol: opened the reference
Navigator on `habbocity.fr` via `eval-in-iframe.js`, captured its real outerHTML and, since several
classes here were never in the bulk-extracted CSS at all (see below), real `getComputedStyle()`
values pulled over CDP — not inferred from the minified bundle.

**Root cause found**: the bulk extraction (140 `_*.scss` files, see "Block 1" above) only captured
CSS for classes it found in the minified bundle grep. Three real, load-bearing classes used by the
Navigator's own shell were **entirely absent** from that baseline — not wrong, just missing:
`.holo-main-search-bar-input-*` (the search bar), `.custom-select-root/-display/-panel/-group/-item`
(a portal-rendered custom dropdown, confirmed real via live click — options render in a
`document.body`-appended panel, not inline), and `.holo-button` (the footer action buttons). All
three turned out to be genuinely missing UI primitives, not a CSS bug — first time this project has
hit "missing from the bulk pass" rather than "bulk pass got it wrong."

**Fixed/built this pass**:
- New shared component `common/select/CustomSelectView.tsx` — a real portal-based dropdown
  (`createPortal` into `document.body`, closes on outside click, positions itself under its
  trigger). Built because the reference genuinely uses this same custom dropdown in **two** places
  already found (Navigator's search-filter select, and the Room Creator's three selects — see open
  findings below) — a real reusable primitive, not a one-off.
- New shared helper `api/navigator/VisitNavigatorRoom.ts` — the door/ownership branching logic
  (doorbell/password/group/own-room) was previously duplicated inline in
  `NavigatorSearchResultItemView`; extracted so `NavigatorView`'s new "visit random room" footer
  button could reuse the exact same real logic instead of re-deriving it.
- `NavigatorView.tsx` shell restructured to match the reference's real nesting: search bar and tabs
  both live *inside* `content-area`/`content-area-inner` (previously tabs were a sibling before the
  content area — wrong nesting, confirmed via live DOM dump), the tabs row's fake `+` "create room"
  tab was removed (reference has **no** such tab — room creation is only reachable via a footer
  button), and two real footer buttons were added: `navigator.random.room` ("Somewhere new" — real
  locale key confirmed in `hCMS/public/cdn/gamedata/ExternalTexts.json`, **not** the unrelated
  LTDCDN gamedata directory which briefly threw off the key lookup) and `navigator.createroom`
  ("Create room"). Confirmed via live interaction that "Somewhere new" actually **closes the
  navigator and teleports into a random room** (not a UI toggle) — implemented that exact behavior
  by picking a random room out of the current search results.
- `NavigatorSearchView.tsx` rewritten to the real markup: search icon + input + `CustomSelectView`
  all inside one `.holo-main-search-bar-input-element` bar positioned *above* the tabs (previously a
  separate native-`<select>` + input + button row rendered *below* the tabs — wrong element,
  wrong position, wrong control type).
- Found and fixed a real layout bug of our own making, not a porting gap: the reference's own
  `holo-main-search-bar-input-element` class carries a literal `flex-grow-1` in its class list, and
  copying that string verbatim (per the "verify against real DOM" rule) made our search bar expand
  to fill the whole panel, because — unlike the reference — nothing else in our tree was already
  claiming that flex space. Root cause: **the reference's real growable element is
  `.scroll-container`, which uses CSS Grid (`grid-template-rows: 1fr`) to fill remaining space, not
  flexbox `flex-grow`** — a mechanism this pass did not rebuild (see open findings). Fix applied
  here: dropped `flex-grow-1` from the search bar's own class list (an honest content-following
  fixed-height bar instead) and gave the actual results list Column `flex-grow` + `min-height: 0`
  so *it* absorbs the leftover space and scrolls — different mechanism, same real visual result as
  the reference, verified via HMR screenshot before/after.
- New CSS in `assets/styles/habbocity/_navigator.scss`, appended below the original bulk-extracted
  block with its own comment marking it as separately-verified (not part of the bulk pass): the
  three missing primitives above, all values taken from live `getComputedStyle()`, not guessed.

**Verified via HMR screenshot comparison** (dev tab vs. live `habbocity.fr` reference): search bar
position/shape, custom dropdown open/close/all-5-options (Anything/Room Name/Owner/Tag/Group —
confirmed these exact 5 already matched our own existing `SearchFilterOptions`, so no logic-layer
gap there, only a UI one), tabs row, results list (list-mode row for "My World", thumbnail-grid mode
for "Public"), and both footer buttons' colors/icons/layout. Not yet regression-checked: Bash/GitHub
issue-tracker style automated tests (none exist for UI) — verification here is screenshot-based only,
per this project's own methodology.

**Real, currently-open findings from this pass — not yet fixed:**
- **Room Creator (`NavigatorRoomCreatorView.tsx`) was not touched and does not match the
  reference.** The real reference's Room Creator is a **fully separate screen** (header text
  "Création"/"Room creation", no tabs, no search bar — confirmed live) with a **model carousel**
  (`.holo-room-creator-carousel` — prev/next arrows, a peek-style 3-up preview, a "104 cases" tile
  count) feeding into Name/Description/Trade-Settings/Max-Visitors/Category fields, where **all
  three dropdowns use the same `CustomSelectView` custom-select pattern**, not native `<select>`.
  Our version still renders the old grid-of-model-images-with-currency-badges layout and native
  `<select>` elements. This is the single biggest remaining gap from this pass — flagged, not
  guessed at, per the no-mass-rewrite rule.
- **`.scroll-container`'s real custom-scrollbar chrome was not rebuilt.** The reference implements
  its own scrollbar (`.scroll-container` > `.scroll-content.vertical` + a `.scroll-bar.vertical` >
  `.scroll-thumb.vertical` drag handle, positioned via CSS Grid) for both the Navigator's room list
  *and* the custom-select's own options panel. This project has no existing reusable component for
  it (confirmed via grep — two unrelated files hand-roll a similar-looking but different pattern).
  This pass used native `overflow: auto` browser scrolling instead — visually close, functionally
  equivalent (scrolls, same content), but **not** the real scrollbar chrome. Worth its own future
  pass as a shared primitive since it's needed in at least 2 places already.
- **`.icon.icon-rooms`** (the small icon at the right end of the search bar) — clicked it live
  multiple times against the reference; produced **no observable DOM/state change** (room list,
  active tab, and dropdown state all stayed identical). Implemented visually only, no `onClick`
  wired — genuinely unverified function, not guessed at, consistent with the outfit editor's
  `FaRecycle` precedent earlier in this file.
- Category-header collapse/expand and the list/grid toggle icon (`.navigator-items` section
  headers, e.g. "Lieux Publics" / "Public rooms") were visually present in both before/after but not
  click-tested against the reference this pass.
- No public rooms were flagged as "official" in this dev server's own data, so the thumbnail grid
  under the Public tab render couldn't be visually diffed against the reference's real thumbnails
  this pass — the empty-state render itself (just the category header, no cards) was confirmed
  correct, but real thumbnail-card layout under Public specifically still wants a real screenshot
  comparison once seed data exists.

## Catalog pass (2026-09-21, third session) — SHELL ONLY, real content untouched

First real pass at the Catalog (`components/catalog/`), verified CDP-first per the mandates above
(live `outerHTML`, `getComputedStyle`, and the real 1.7MB stylesheet — no screenshots used for any
of the structural/CSS verification below). **Scope: the card shell only** — header, search bar,
tabs, and the left navigation tree's container. The actual furniture grids, item detail pages,
purchase widgets, and the ~25 layout-type components (`CatalogLayoutPets2View`,
`CatalogLayoutMarketplace*`, `CatalogLayoutVipGiftsView`, etc.) were **not** touched or verified —
this project's own catalog logic layer is already extensive (see the full file list in
`components/catalog/views/page/layout/` and `.../widgets/`), but none of it has been checked against
the reference's real UI yet.

**Real structure confirmed** (`.nitro-catalog` root): the card has exactly 3 children —
`.nitro-card-header`, `.content-area` (containing `.content-area-inner` > search bar + tabs, same
nesting pattern as Navigator), and a **sibling** `.nitro-catalog-content` div (NOT nested inside
`.content-area`) holding the two-column nav-tree/page-content layout. The search bar reuses the
exact same `.holo-main-search-bar-input-element` primitive as Navigator, themed via
`var(--holo-catalog-color-theme-primary)` instead of the navigator green — confirms this primitive
is genuinely shared across features, not Navigator-specific, exactly as anticipated.

**Real bugs found and fixed:**
- `CatalogView.tsx` used `theme="primary-slim"` on `NitroCardView`; the reference is plain
  `theme-primary`. Fixed.
- `CatalogSearchView.tsx` was the exact same "native input + separate Button" anti-pattern
  Navigator had before its own fix — never wired into the search bar's real
  `.holo-main-search-bar-input-element` markup, and rendered inside the left nav column
  (`CatalogNavigationView`) instead of the top-level search-bar-above-tabs position the reference
  actually uses. Rewrote its markup to the real structure and moved it to `CatalogView.tsx`'s own
  `content-area-inner`, next to the tabs — same fix shape as Navigator's, applied to a second,
  independently-confirmed real instance of the same primitive.
- `CatalogNavigationView.tsx`'s nav-tree container had **no** `.scroll-container` at all (plain
  `Column overflow="hidden"` + `AutoGrid`) despite the reference using the exact same
  `.scroll-container`/`.scroll-bar` primitive built during the Navigator pass. Swapped in
  `ScrollContainerView` — first real reuse of that primitive outside Navigator, confirming it
  generalizes as intended. **First pass merged the two elements onto one div** (gave
  `ScrollContainerView` itself the `nitro-catalog-navigation-grid-container` classname) instead of
  nesting it inside a separate wrapper the way the reference actually does. Caught by the new
  side-by-side property table, not a screenshot:
  ```
  PROPERTY       HABBOCITY (outer nav container)   OURS (first pass)   OURS (fixed)   STATUS (fixed)
  display        flex                              grid                flex          MATCH
  backgroundColor rgb(21,26,35)                    rgb(21,26,35)       rgb(21,26,35) MATCH (was already ok)
  border         3px solid rgb(46,51,77)           rgb(46,51,77)       same          MATCH (was already ok)
  padding        11.25px 11.25px 11.25px 0px       same                same          MATCH (was already ok)
  borderRadius   12px                               12px               12px          MATCH (was already ok)
  ```
  Every box-model property had matched even in the broken first pass — only `display` differed,
  and only because merging the two elements meant `.scroll-container`'s own `display:grid` rule
  replaced the outer wrapper's real `display:flex` outright (one element can't be both). This is
  the exact case the side-by-side mandate above was written for: a same-side-only check would have
  looked completely fine. Fixed by giving `.nitro-catalog-navigation-grid-container` its own real
  outer `<div>` (flex, matching the reference's actual class list) with `ScrollContainerView`
  nested inside it as a genuine child, exactly matching the reference's real two-element structure.
- **Proactively re-checked the other two `ScrollContainerView` usages for the same merge mistake**,
  since finding it once meant it was worth checking everywhere: Navigator's own results-list usage
  (`.scroll-container`'s parent is `.content-area-inner` directly, no dedicated wrapper class to
  merge onto — never had this bug) and `CustomSelectView`'s dropdown-panel usage (`.custom-select-
  panel` is genuinely a separate flex wrapper around a nested grid `.scroll-container` in both the
  reference and our own code — also never had this bug). Both confirmed MATCH via the same
  side-by-side property table (`panelDisplay`/`scDisplay`/parent-identity checked on both sides).
  Only Catalog's nav container had actually merged the two roles onto one element.
- **Root-caused a real, live CSS bug via computed-style diffing** (not screenshot comparison — the
  bug was invisible in a screenshot at normal viewing size): `CatalogView.scss`'s own
  `.nitro-catalog-navigation-grid-container` rule block used hardcoded stock-Nitro gray colors
  (`#cdd3d9`/`#b6bec5`) with `!important` on `border-color`, actively fighting the already-correct
  ported habbocity CSS in `_catalog.scss`. Computed-style capture showed the real symptom exactly:
  `background-color` was already correct (`rgb(21,26,35)`, habbecity's real `--holo-secondary`,
  since that specific property had no `!important` collision) while `border-color` and
  `border-radius` were still wrong (`rgb(182,190,197)` and `4px` instead of the reference's real
  `rgb(46,51,77)` and `12px`) — a genuine, demonstrable specificity/`!important` conflict, not dead
  code. Removed the whole stale block from `CatalogView.scss`.
- Introduced and then caught **my own** regression while porting: carried over a leftover `rounded`
  Bootstrap utility class onto the new `ScrollContainerView` usage. This project's own Bootstrap
  build applies `!important` to `.rounded`'s `border-radius`, which silently overrode the correct
  `_catalog.scss` rule (reference had `border-radius:12px` computed; ours read `4px`). The
  reference's own DOM does carry a `rounded` class in the same spot, but evidently doesn't hit the
  same specificity collision there. Removed the redundant class; computed `border-radius` now reads
  `12px`, byte-matching the reference. Worth remembering: an inherited utility class from old
  markup can reintroduce exactly the kind of "20 CSS overrides" problem the foundation-first mandate
  warns about, even in a brand-new port — check computed styles after every structural change, not
  just visually.
- **A second real, more serious bug found the same way**: `CatalogNavigationItemView.tsx` never
  rendered the reference's `.nitro-catalog-navigation-item` wrapper div around the icon+text —
  `CatalogIconView`/`Text`/chevron were direct children of `.layout-grid-item` instead. This wasn't
  cosmetic: `_catalog.scss`'s real rule set explicitly forces `.layout-grid-item` (even
  `.layout-grid-item.active`) to `background-color:transparent!important` inside the catalog nav
  tree — the real selected/active highlight color
  (`.nitro-catalog-navigation-item.active{background-color:var(--holo-catalog-color-theme-primary)}`)
  is scoped to the missing wrapper specifically. Net effect before the fix: **clicking a category in
  the nav tree produced no visible selected-state highlight at all**, silently, because the class
  doing the highlighting never existed in our DOM. Added the wrapper (as a `Flex` with the real
  classnames, `active` applied conditionally on `node.isActive`) and verified via CDP: clicked
  "History" in the tree, read `getComputedStyle` on `.nitro-catalog-navigation-item.active`, got
  `rgb(238,184,14)` — exactly `#EEB80E`, i.e. `--holo-catalog-color-theme-primary` byte-for-byte.
  This is the kind of interactive-state gap the strategic insight above predicted (invisible from a
  static screenshot, only surfaces once you actually click something and check the resulting DOM).

All of the above verified via CDP DOM + `getComputedStyle` on the running dev client (per the
CDP-primary mandate above), screenshots used only as secondary/zoomed visual confirmation after the
DOM/CSS chain already established the facts. `tsc` and HMR both compile clean.

**What the Catalog pass has NOT covered:** everything past the shell — the actual navigation tree's
real icon/expand-chevron interaction, every one of the ~25 catalog layout types, the purchase
widgets, item grids, search-result rendering, gift view, marketplace post-offer flow, and any
state/responsive/interaction work for any of it. Do not treat Catalog as done — only its outer shell
has had a real pass.

## Inventory pass (2026-09-21/22, third session) — search bar markup only, real position gap flagged

CDP-verified against the live reference (`.nitro-inventory` root, `theme-primary`, header
"Inventaire"). Same 3-child shell as Catalog's `.content-area` pattern
(header/content-area/resize-handler), but **unlike Catalog, everything nests inside one
`content-area-inner`** — search bar, tabs, AND the item-grid content area are all siblings there
(no separate `.nitro-catalog-content`-style block). Tabs seen live: Mobiliers/Bots/Animaux/Badges/
Bannières — **does not match** this project's own `TABS` array
(`furni/rares/clothing/bots/pets/badges`) exactly; not resolved, likely account/config-driven
(inventory tab visibility can depend on what the account owns) rather than a real bug, but not
confirmed either way — do not assume.

**Real structural finding, not (yet) fully fixed:** the reference's search bar sits once, at the
top, shared visually across every tab — but this project's inventory has **three separate**
per-tab search components (`InventoryFurnitureSearchView`, `InventoryClothingSearchView`,
`InventoryRaresSearchView`), each rendered *inside* its own tab's content view with its own
`groupItems`/`setGroupItems` filtering state (Bots/Pets/Badges tabs have no dedicated search
component at all). Unifying this into one real top-level search slot shared across tabs — while
keeping each tab's own filter logic intact per Block 2 (HabboCity = UI position, our own code =
logic) — is a genuine architectural decision (a shared search-slot/portal mechanism), not a
one-line fix. **Deliberately not attempted this pass** to avoid exactly the kind of rushed,
mixed-concern change the foundation-first mandate warns against. What WAS fixed: all three search
components' own markup, which had the identical native-input-plus-Button anti-pattern already found
and fixed twice elsewhere (Navigator, Catalog) — rewritten to the real
`.holo-main-search-bar-input-element` structure, themed via `--holo-inventory-color-theme-primary`.
Verified via CDP on the dev client (Furniture tab, the default): computed `background-color` reads
`rgb(238,134,123)` = `#EE867B` = exactly that token. **The visual position is still wrong** (renders
inside the tab content area, not above the tabs) until the shared-slot question above is resolved —
flagged, not silently left as if fixed.

## Mandatory: side-by-side property comparison table (added 2026-09-22, fifth correction)

A component is only "VERIFIED" when compared **live, side by side, property by property** against
HabboCity — not when it looks right, and not when only our own side was checked. Required chain for
both sides: `DOM → classnames → matched CSS rules → computed styles → CSS variables → JS/state`,
then an explicit diff table:
```
PROPERTY         HABBOCITY                          OUR UI                             STATUS
display          flex                               grid                               DIFFERENT
padding          11.25px 11.25px 11.25px 0px        11.25px 11.25px 11.25px 0px        MATCH
```
Every property lands in MATCH/DIFFERENT/MISSING/EXTRA/WRONG STATE — never "looks similar." When
DIFFERENT, trace to the exact winning rule/stylesheet/specificity on both sides before fixing.
Screenshots are secondary, final visual confirmation only, never how correctness gets established —
do not write "X is fixed" from a screenshot alone. **This caught a real second bug immediately after
being adopted** (see the display:flex-vs-grid finding in the Catalog section below) that a
same-side-only check would have missed entirely, since the broken side alone still produced
byte-identical background/border/padding/radius values. Full detail in
`memory/feedback_side_by_side_property_comparison.md`.

## CRITICAL SELF-CORRECTION (2026-09-22): the search-bar CSS was scoped wrong the whole time

**The user reported "the style isn't looking right, everything is still wrong" after the Catalog/
Inventory/Settings passes above, and they were right.** Root cause, found by actually reloading the
dev client fresh and looking (screenshot as secondary confirmation, per the CDP-primary mandate,
after computed-style inspection had already located the exact element) rather than trusting the
verification already written down in this file: every `.holo-main-search-bar-input-element/
-container/-text` rule in `_navigator.scss` was written **scoped under `.nitro-navigator`**,
because that file was created during the Navigator pass and named for it. When those exact same
classnames were reused for Catalog and Inventory's own search bars later in this same session, the
CSS **silently never applied to them at all** — their search inputs rendered as bare, unstyled
native `<input>` elements (plain white background, native browser `2px inset` grey border),
because every single earlier "verified via CDP" check in the Catalog/Inventory sections above had
only checked the *element's own inline style and class name*, never actually loaded the panel fresh
in a real browser and looked at what a normal user would see. This is exactly the failure mode the
CDP-primary/DOM-verification mandates exist to prevent, and it still happened, because computed-
style checks on a hot-reloaded page don't catch a rule that was scoped wrong from the start — they
only prove the browser resolved *some* value, not that it's the *right* value from the *intended*
rule. **The actual fix**: verified (`getComputedStyle` on the reference, both Catalog's and
Inventory's own search bars, not assumed) that border/height/padding/border-radius are byte-
identical to Navigator's across all three — genuinely one shared primitive — and moved those three
rules out to be unscoped/global in `_navigator.scss`. Kept `.content-area`'s own `padding: 10px`
correctly scoped to `.nitro-navigator` specifically, because that one single-instance check (also
just run, also via live `getComputedStyle`) showed Catalog's real `.content-area` padding is `0px`,
not the same value — so that one genuinely isn't shared and unscoping it would have introduced a
new, different bug. Verified the fix on both Catalog and Inventory's dev-client search inputs
(computed background now transparent, white text, no border — correct) and via fresh screenshots.

**What this means going forward, concretely**: when a CSS rule is written scoped to the component
being worked on at the time, and that classname is later reused by a different component, the rule
must be explicitly re-verified for that new component — copying JSX markup that references a shared-
looking classname does not mean the CSS backing it actually is shared. "Verified via CDP" claims in
this file's own history should be read as verified *for the component and moment they were written*,
not as a permanent guarantee that later reuse of the same classname elsewhere was also checked.

## Catalog deep-interaction pass (2026-09-22) — went past the shell into real page content

Per the "don't stop at the first surface" mandate: went past Catalog's shell (already fixed) into
its actual navigation-tree interaction and page content, via real clicks on the live reference
(CDP only, no screenshots) — confirmed our own `isBranch`/`isOpen` expand-collapse logic already
matches the reference's real behavior (clicking "Nouveautés" expands real child categories in both).

**Two real, concrete bugs found and fixed in `CatalogLayoutDefaultView`** (the default/most-common
catalog page layout, confirmed via `GetCatalogLayout.tsx`'s own switch — `default_3x3` and the
fallback case both use it, and this project already has 18 other layout types fully implemented for
`GetCatalogLayout` to dispatch to, none individually re-verified this pass):
- **`Grid`+`Column` was the wrong primitive here.** This project's own `Grid` component
  unconditionally sets CSS-grid mode (`GridContextProvider value={{isCssGrid:true}}`), so every
  `Column` inside it renders `g-col-N` — but the reference's real markup for this exact split is a
  plain Bootstrap flex row (`d-flex h-100 overflow-hidden`) with real `col-7`/`col-5` classes, not
  CSS grid at all. Confirmed via computed `display` on both sides (`flex` on the reference,
  `grid` on ours before the fix). **Did not touch the shared `Grid` component itself** — it's used
  elsewhere in the app and changing its default risks breaking already-verified areas; fixed only
  this specific usage by swapping the `<Grid>` wrapper for a plain `<Flex fullHeight
  overflow="hidden">`, which lets the same `<Column size={7}>`/`<Column size={5}>` children render
  real `col-7`/`col-5` (a `Column` outside any `Grid` context defaults to `isCssGrid: false`).
  Verified fixed via CDP: parent `display` now reads `flex` on both sides, DOM now shows real
  `col-7`/`col-5` matching the reference exactly.
- **`CatalogItemGridWidgetView` (the actual furni-icon grid) had no `.scroll-container` at all** —
  same missing-primitive pattern as three other places already fixed this session (Navigator's
  results list, Catalog's nav sidebar, `CustomSelectView`'s dropdown). Wrapped it in
  `ScrollContainerView`, moving the scroll-reset-on-page-change `elementRef` from the old
  `AutoGrid.innerRef` to the new `ScrollContainerView.innerRef` (the actual scrollable element
  moved, so the ref needed to move with it). Verified via CDP: DOM now shows
  `.scroll-container.flex-grow-1 > .scroll-content.vertical > .overflow-auto.grid...`, matching the
  reference's real nesting exactly.

## CORRECTION to the section above: the "isLazy" conclusion was wrong, traced to completion

The original version of this section concluded the purchase widget "never appeared" for two test
categories and blamed `offer.isLazy`, tagging the whole chain `UNVERIFIED`. **That conclusion was
wrong, caused by a bug in the verification script itself, not the feature** — the query used to read
"the right panel" (`cols.children[cols.children.length-1]`) actually matched an ambiguous/wrong
element (the nav sidebar, re-selected because of a duplicate matching class), so it looked like
nothing changed when the real right panel had changed correctly the whole time.

**Redone properly, traced to completion, on a category with a real purchasable single item
("Hiboux" under a "New" sub-theme):**
- Confirmed `Offer.isLazy` (the class used for every real catalog-page offer, as opposed to
  `FurnitureOffer.isLazy` which is only used for client-side search results) is **hardcoded to
  always return `false`** — there is no actual async "lazy load" state machine for catalog grid
  offers at all; `isLazy` was a red herring from misreading the wrong DOM subtree, not a real
  async chain to reproduce.
- Clicking the furni icon **does** correctly call `selectOffer` → `offer.activate()` →
  `setCurrentOffer(offer)`, and the right panel **does** correctly switch from the category promo
  to the real purchase widget — verified by reading the *correct* DOM subtree this time: a
  `.room-preview-container` (real base64 room-render preview image), item name, price with
  currency icon, a quantity spinner (prev/next arrows + `input[type=number].quantity-input`), and
  both "Buy" and "Buy as gift" buttons all rendered correctly, on **our own dev client**, with real
  server data (item name "Hiboux", price, working room-preview image).
- Confirmed the two earlier "dead" test categories (Bellarose, Posters) never updating was **also**
  correct-but-unrelated behavior on both sides: those specific items had no `Buy` button at all in
  the reference either (a "Historique"/discontinued-item context in one case), not a lazy-load gap.

**Real bug found and fixed while completing this trace** (not left as a documented uncertainty):
the item name and "Select Amount" quantity-spinner text/icons rendered with `color: rgb(0,0,0)` —
literal black text — computed directly via `getComputedStyle`, not guessed. Root cause: this
project's shared `Text` component (`common/Text.tsx`) defaulted its `variant` prop to `'black'`,
adding a `.text-black` class to nearly every text element in the app unless the caller explicitly
overrode it. Verified the real mechanism instead of assuming: the reference's own `.text-element`
class carries **no color rule of its own anywhere** in the real stylesheet — text color comes from
`body`'s own real `color: #fff`, confirmed byte-identical (`rgb(255,255,255)`) on both the live
reference and our own dev client, cascading down via ordinary CSS inheritance. The old `'black'`
default was actively fighting that correct inheritance. **Fixed the shared default** (`variant =
null` instead of `'black'`) rather than patching each call site — deliberate, not reckless: checked
the real inheritance mechanism first, confirmed our own body already matches it, then changed the
one place the wrong default lived. Also removed a matching hardcoded `text-black` on the quantity
spinner's caret icons (`CatalogSpinnerWidgetView.tsx`), which aren't rendered via `Text` and needed
their own fix. **Regression-checked after the change** (not just the one broken spot): Catalog
purchase-widget item name (now `rgb(255,255,255)`, class list no longer includes `text-black`),
Purse currency amount (`rgb(255,255,255)`, `.text-element` class), and User Settings' checkbox
labels (`rgb(255,255,255)`, plain `.d-inline`) — all three confirmed correct after the fix, no
regressions found in the three other panels already verified this session.

**Status: `Offer` selection → purchase widget → quantity selector → Buy → Confirm → real purchase →
inventory delivery = IMPLEMENTED, VERIFIED end-to-end**, not left as a documented gap. Completed the
full chain on our own dev client with real state, not assumed from reading the code:
1. Clicked the real "Hiboux" (owl) furni offer → purchase widget rendered with real price/quantity.
2. Clicked "Buy" → button correctly transitioned to "Confirm" (`CatalogPurchaseState.NONE → CONFIRM`,
   confirmed via DOM text change on precisely-targeted button, not a broad/ambiguous selector this
   time — an earlier same-session mistake this exact investigation already made once).
3. Clicked "Confirm" within the real 3-second auto-revert window (confirmed the revert timer's
   existence by first missing it once, reverted to "Buy", and retried both clicks back-to-back in
   the same script call) → sent the real `PurchaseFromCatalogComposer`.
4. Confirmed real success via **two independent signals**, not just "no error appeared": a
   real console log (`"Unseen categories from server"` / `"Category: 1 Items: Array(1)"` — the
   unseen-item tracker reacting to newly-received inventory) and, definitively, opening Inventory
   and finding `Wniverso08_coruja_da_Noite_icon.png` ("coruja" = owl in Portuguese) actually present
   among the account's real items — the purchased item was genuinely delivered by the real server.

**Also corrects a live self-check bug found while doing this**: the first attempt to read "Buy"'s
resulting label used an overly broad `document.querySelectorAll('.btn')` and matched an unrelated
"Move" button elsewhere in the app, not the purchase widget's own button — same class of mistake
(ambiguous selector grabbing the wrong element) as the original `isLazy` misdiagnosis above. Fixed
by always scoping queries to the exact known DOM path (`.nitro-catalog-content` → main column → the
two-column row → the specific `.col-5` panel) rather than a broad selector, for the remainder of
this trace.

## Tabs overflowing the card (2026-09-22) — real root cause traced, real fix applied

User reported the tabs looked wrong too (Catalog's tab row visibly spilling past the card's right
edge). Traced fully rather than dismissed:

**Root cause of the long labels themselves — confirmed server data, not a client bug.** Traced the
exact data path: `CatalogNode.ts` constructor does `this._localization = node.localization` verbatim
from the incoming `NodeData` packet — zero string concatenation anywhere in this client's code. The
actual tab text on this dev server reads e.g. `"Official Furni (9966547)"` — that trailing raw page
ID is coming straight from the hCMS emulator's own catalog page configuration, not something the
client invents or could reasonably strip (it's real page data, not a client formatting choice).
Checked the real reference's own CSS for a text-overflow/min-width safety net near `.nitro-card-tabs`
and found none — because HabboCity's own real catalog page names are always short, this situation
simply never arises for them. **This is a real, separate, server-content gap in hCMS's own catalog
page names**, not something fixable from this repo — flagging it, not fixing it here.

**Real client-side fix applied regardless**, because a tab bar breaking its container is a real UI
robustness bug independent of whose content caused it: `.nav-item` (the shared tab item used by
every tabbed card — Navigator/Catalog/Inventory/Settings alike) had no `min-width` override, so it
inherited flexbox's default `min-width: auto`, which refuses to let a flex item shrink below its
own content's natural width even with `flex-shrink` otherwise allowed. One unusually long label was
enough to force the whole `.nitro-card-tabs` row wider than the card. Added `.nitro-card-tabs
.nav-item { min-width: 0; }` to `common/card/NitroCardView.scss` — a standard, safe flexbox fix, not
an invented habbocity behaviour (it only changes what happens once content already doesn't fit,
which the reference's own real usage never triggers). Verified via CDP, not screenshot-only: card
width unchanged (630px), tabs row now 578px and fully contained (`tabsRowRight < cardRight`,
confirmed `false` for overflow), re-screenshotted for secondary visual confirmation showing each
tab's own label now cleanly ellipsis-truncated instead of the row spilling past the card edge.

## Old-CSS cleanup pass (2026-09-22) — dead stock-Nitro rules removed from touched components

Prompted directly by the user after the search-bar scoping bug: "old css is still in there so its
interrupting need to delete all only keep habbocitys." Scope: the component-level `.scss` files
(NOT `assets/styles/habbocity/_*.scss`, which is already the real ported source) for the four
components touched this session (Navigator/Catalog/Inventory/User Settings) — a full sweep of all
53 component `.scss` files in the project was **not** done (the `wired`/`wired-chests`/
`wired-creator-tools`/`builder-toolbar` files were deliberately excluded: these back a genuinely
separate, custom Wired-scripting-tool UI this project built on its own, not part of the HabboCity
port, confirmed by this project's own recent commit history — "old CSS" there isn't in scope for
this migration at all).

**Method, per the side-by-side mandate**: for each old rule found, checked the *currently winning*
computed value against the reference before touching anything, then confirmed a real ported
habbocity rule already exists to replace it, only then deleted. Nothing was removed on the
assumption that habbocity's CSS would "probably" cover it.

- `CatalogView.scss`: removed `.catalog-search-button` — confirmed dead, no element in the codebase
  renders that class since the Catalog search-bar rewrite earlier this session replaced the old
  `<Button className="catalog-search-button">` entirely.
- `NavigatorView.scss`: removed `.nitro-navigator { width: $navigator-width; height:
  $navigator-height }` (stock 420×440) and the `.navigator-grid`/`.nitro-room-settings
  .list-item`/`.room-info` rules using `$grid-active-bg-color` (stock `#ececec`) and a stock
  `.room-info { width: 275px }`. Verified first: the real habbocity values (`.nitro-navigator`
  440×590, `.room-info` 325×325×325 min/max, `--holo-navigator-color-theme-secondary/-tertiary` for
  the grid stripe colors) were already winning on both the reference and our own dev client before
  deletion — these stock rules were dead weight, not active bugs, but real conflicting weight
  regardless. Re-verified all three panels' computed width/height after the edit: unchanged
  (440×590 / 528×450 / 630×522 for Navigator/Inventory/Catalog respectively) — the cleanup was
  confirmed safe, not just assumed safe.
- `InventoryView.scss`: removed `.nitro-inventory { width: $inventory-width; height:
  $inventory-height }` (stock 528×320) — width happened to already match by coincidence (528px
  both), but height was genuinely wrong (320px stock vs. 450px real) and only stayed invisible
  because `assets/styles/habbocity/_inventory.scss`'s real `450px`/`min-height:450px` rule already
  wins via load order. Confirmed the real rule exists before deleting.

**What this pass did NOT do**: a full audit of all 53 component `.scss` files (only the four
components already in this session's scope were checked), and it did not touch any rule inside
those four files that wasn't proven to be a stock/dead duplicate of an already-verified real
habbocity value (e.g. Catalog's `.quantity-input`, `.autocomplete-gift-container`, and the various
`.nitro-catalog-layout-*` sub-layout rules were left alone — not proven broken, not touched, per
the "don't remove code merely because it looks unused" rule in Block 2 above). A full project-wide
sweep for this same class of leftover-stock-CSS issue is a real, larger, not-yet-done piece of work
if the user wants it extended beyond the four components already in scope.

## User Settings pass (2026-09-22, third session) — real bug fixed + a real missing feature added

CDP-verified against the live reference: `.user-settings-window`, `theme-primary` (reached via the
purse's own `.icon-cog-purse` gear icon, not a toolbar icon — this trigger location wasn't
previously documented). Header "Paramètres", **3 real tabs**: Général / Floor / Modérer.

**Real bug fixed:** `UserSettingsView.tsx` used `theme="primary-slim"`; reference is `theme-primary`
— same wrong-theme pattern as Catalog, third confirmed instance this session.

**Real structural gap found:** this project's `UserSettingsView` had **no tabs at all** — a single
flat list of checkboxes/volume sliders. The reference splits into three real tabs. Added a real tab
system (`NitroCardTabsView`), but only ported **General** (already existed) and **Moderate** (new,
see below) — **Floor was deliberately skipped**: it's a HabboCity-specific anti-lag rendering
tuning panel (max-staircases/max-rectangles sliders using a custom `.custom-input-range` primitive
not seen anywhere else this session, controlling floor-tile batching internals of their own
rendering fork) with no clear equivalent hook in this project's Octane logic layer — flagged as a
real, deliberately-unbuilt gap, not silently dropped.

**Real missing feature found and built: the ignore/mute-user list ("Modérer" tab).** The reference's
tab is a working ignore-list manager (search + add + a scrollable list of ignored names, each
removable, header reads "Liste des utilisateurs ignorés (X/Y)"). This project had **zero** UI for
it, but the full logic layer already existed, unused, in `@nitrots/nitro-renderer` — exactly the
same "composers already existed, never wired to any UI" pattern as Room Info's favorite-toggle from
an earlier session: `IgnoredUsersManager`/`IIgnoredUsersManager`, `GetIgnoredUsersComposer`,
`IgnoreUserComposer`/`IgnoreUserIdComposer`/`UnignoreUserComposer`, `IgnoredUsersEvent`,
`IgnoreResultEvent`, and public `SessionDataManager.ignoreUser()`/`.unignoreUser()` methods. The
manager class tracks the list internally but exposes no public getter for it (only `isIgnored(name)`
membership checks) — so built a new hook, `hooks/session/useIgnoredUsers.ts` (`use-between` pattern,
matching this project's own `useSessionInfo` convention exactly), that listens to
`IgnoredUsersEvent`/`IgnoreResultEvent` directly via `useMessageEvent` and maintains its own local
list state, rather than touching the vendored `node_modules` package. New component
`UserSettingsModerateView.tsx` uses this hook plus the already-built `ScrollContainerView` primitive
for the list. **UI text here is plain literal strings, not `LocalizeText` calls** — checked
`ExternalTexts.json` for a real key and there isn't one for this brand-new tab; inventing a fake key
would have silently rendered the raw key path, so a plain string was the honest choice, flagged in a
code comment for whoever eventually adds real localization for it.

**Verification status — being precise about what was and wasn't confirmed:** `tsc` clean, HMR clean,
no runtime exceptions. Live-verified via CDP: root theme now reads `theme-primary`, both tabs render
("General"/"Moderate" — plain-text labels, same reasoning as above), clicking into Moderate renders
the real "Ignored users list (0)" / search / Add UI, and clicking Add successfully invokes
`GetSessionDataManager().ignoreUser(name)` without error. **Not confirmed**: the actual server round
trip populating the list, since testing needs a real, currently-valid username on this specific dev
database and the two names tried (`TestIgnoreUser`, `ads_starb0`) were both rejected/ignored by the
server (most likely because neither is a real account here, not because of a client-side bug — no
exception was thrown either time). Do not treat the add/remove flow as fully proven end-to-end;
treat it as "wired correctly, structurally verified, one hop from the server unconfirmed."

## Full feature inventory — still not done

Per the extension mandate, the following real HabboCity UI surfaces have **not** been scanned at
all yet: dialogs/popups in general, notifications, tooltips, context menus (found this project
already has a full, seemingly well-built `ContextMenuView` component family with position-tracking/
fade/collapse logic and matching ported CSS — not live-verified since triggering a real one needs an
actual in-room avatar/furniture click, more setup than a quick check afforded this session),
pagination, and every loading/empty/error state across all of the above. Navigator, Catalog,
Inventory, and User Settings all got first real passes this session (see their own sections above)
but none is fully done — Navigator's Room Creator carousel/custom-selects, Catalog's entire content
area beyond the shell, Inventory's per-tab vs. shared search-bar position, and User Settings' Floor
tab (deliberately unbuilt) are all still open. **Do not report the full mandate as complete** — only
the toolbar family (purse/room-tools/chat-style/Me-panel/friend-bar), the outfit editor, Navigator's
browse/search shell (not its Room Creator), Catalog's card shell (not its actual content),
Inventory's search-bar markup (not its position, not its content), and now User Settings (General +
the new Moderate/ignore-list tab, not Floor) have had a real pass.

## Reusable prompt — hand this to a fresh session to continue correctly

> Read `nitro-react-Wired/CLAUDE.md` in full before doing anything else — it has the exact strict
> protocol you must follow (HabboCity is read-only, DOM/computed-style-verified component-by-
> component work only, full feature parity not just CSS, no bulk/mechanical rewrites, no
> duplicate systems), the tooling that actually works on this box (`eval-in-iframe.js` for reading
> the real client DOM through its cross-origin iframe, the `yarn start` + HMR dev loop, SSO-ticket
> minting, `yarn deploy` for anything going live), and a precise account of what's already been
> verified-and-fixed vs. what's still an unverified assumption. Do not skip straight to writing
> code — inventory the real reference component first, exactly as the protocol demands, even
> under time pressure. Pick up from "Full feature inventory — still not done" for the next real
> chunk of work, or ask the user which surface to prioritize.
