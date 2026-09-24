# 🚨 EXECUTION CONTROLLER — MANDATORY

Before touching code, read this controller AND the rest of this `CLAUDE.md`.

## NEVER GUESS

This is a reverse-engineering task, not a design task.

Never invent or assume:

* DOM structure
* wrappers
* classnames
* IDs
* CSS values
* spacing
* breakpoints
* icons
* component behavior
* states
* interactions
* JavaScript logic
* feature behavior

If you don't know → **investigate the real HabboCity client.**

If you cannot verify it → **mark it UNVERIFIED and do not implement it as fact.**

---

## DO NOT IMPLEMENT BEFORE INVESTIGATING

Never:

```text
assume → code → open reference → discover it was wrong
```

Always:

```text
HabboCity
→ inspect
→ interact
→ inspect DOM
→ inspect computed styles
→ inspect CSS
→ inspect JS
→ understand state/behavior
→ inspect our implementation
→ identify exact divergence
→ implement
→ verify again
```

Do not build an interpretation first and reverse-engineer the reference afterward.

---

## MANDATORY ORDER FOR EVERY COMPONENT

1. **Live DOM via CDP**
2. **DevTools Styles / Computed**
3. **Real loaded CSS**
4. **Real loaded/minified JS**
5. **Reference interactions and states**
6. **Our DOM**
7. **Our computed styles**
8. **Our source/state**
9. **Identify the FIRST real divergence**
10. **Fix that divergence**
11. **Re-test**
12. **Regression-check the component and its siblings**

Never skip directly to CSS changes.

---

## IF OUR IMPLEMENTATION USES THE WRONG MECHANISM

Do not patch it until it visually resembles the reference.

First determine how the reference actually works.

Example:

```text
REFERENCE:
resize/move crop rectangle with 8 handles

OURS:
pan image inside fixed frame
```

Do NOT make the pan widget look similar with CSS.

Reverse-engineer the reference mechanism and reproduce that mechanism.

---

## STATE COVERAGE IS REQUIRED

Never verify only the first state you see.

Where applicable, test:

* empty
* loading
* populated
* selected
* unselected
* hover
* focus
* active
* disabled
* open
* closed
* expanded
* collapsed
* error
* success
* min/max
* landing
* in-room
* narrow viewport
* desktop

Also test features that only appear after clicking, hovering, opening, selecting, scrolling, filtering, resizing, etc.

---

## NO CSS BAND-AIDS

If something is positioned incorrectly, trace:

```text
element
→ parent
→ container
→ root
```

Compare the DOM hierarchy and computed layout with the reference.

Do not solve a wrong hierarchy with:

```css
top: ...
left: ...
margin: ...
transform: ...
!important
```

unless the reference itself demonstrably uses that mechanism.

Fix the real cause.

---

## SEARCH OUR PROJECT BEFORE CREATING ANYTHING

Before creating a component, hook, primitive, wrapper or CSS rule, search:

* `common/`
* sibling components
* existing hooks
* existing primitives
* existing styles
* existing implementations

If the project already has the correct primitive, use it.

Do not create duplicate systems.

---

## REQUIRED COMPARISON

Before a substantial change, determine:

```text
REFERENCE:
DOM:
CLASSNAMES:
CSS:
COMPUTED:
JS:
STATE:
INTERACTION:

OURS:
DOM:
CLASSNAMES:
CSS:
COMPUTED:
JS:
STATE:
INTERACTION:

FIRST DIVERGENCE:
ROOT CAUSE:
REQUIRED CHANGE:
```

Only then modify code.

---

## AFTER FIXING SOMETHING

A symptom disappearing does NOT mean the component is finished.

Run the verification chain again:

```text
DOM
→ computed
→ CSS
→ JS
→ states
→ interactions
→ our client
→ regression
```

---

## FINAL RULE

Ask before every implementation decision:

> **Did I observe this, or did I invent it?**

If it was invented, stop and investigate.

**OBSERVE → UNDERSTAND → IMPLEMENT → VERIFY**

Never:

## **ASSUME → IMPLEMENT → PATCH**

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

## STRICTER RULES (2026-09-22, user-mandated, applies to EVERY component — not just whichever one is being
## touched right now)

**Given verbatim by the user, twice in the same session** — first as a full reverse-engineering protocol after a
toolbar button turned out to be misplaced, then explicitly widened: *"not only toolbar every component."* Treat
every rule below as standing, project-wide, permanent — not a one-off checklist for the toolbar incident that
prompted it.

1. **1:1 with HabboCity, no skipped features, ever.** The goal is never "close enough" or "looks right" — it is
   the same DOM, the same classnames, the same CSS, the same interaction behavior, for every component, not just
   the ones currently being worked on. A feature HabboCity has and we don't is a gap to close, not a footnote.

2. **The mandated investigation order for ANY discrepancy (visual, positional, behavioral) is fixed and does not
   skip steps:**
   ```
   1. Live DOM (CDP) - actual hierarchy, classnames, attributes, order
   2. DevTools Styles/Computed - actual winning rules, actual resolved values
   3. Minified CSS - the real declaration, the real selector, the real specificity
   4. Minified JS - the real component source, the real state, the real event wiring
   5. Compare ours the exact same way (DOM -> classnames -> computed -> our source)
   6. Only then replace/fix
   ```
   Never reorder this, never shortcut to step 6. Screenshots are not, and have never been, part of this chain at
   any step.

3. **Positioning/layout bugs are traced upward through the DOM, never patched with numbers.** For any
   element in the wrong place: `element -> immediate parent -> parent -> container -> root`, capturing DOM
   hierarchy + computed layout (display, position, flex/grid, gap, padding, margin, top/right/bottom/left,
   transform, z-index, box-sizing, overflow) at **every** level, on both the reference and ours, at matching
   viewport/state. Compensating with `top`/`left`/`margin`/`!important` instead of fixing the real hierarchy or
   the real state is exactly what this rule forbids — it hides the actual bug instead of fixing it.

4. **A wrong-looking element is not automatically a CSS bug.** The 2026-09-22 toolbar incident is the concrete
   case study: `icon-house` was showing instead of `icon-habbo` while genuinely inside a room. The CSS/DOM
   structure was already byte-correct — the actual cause was **component state**, not layout: `ToolbarView` kept
   its own local `isLandingView` state via a second, independent `RoomSessionEvent.CREATED/ENDED` listener that
   mirrored the reference's own toolbar pattern, separate from `MainView`'s already-correct `landingViewVisible`
   (passed down as the `isInRoom` prop). On a fresh load where the account starts already inside a room, that
   second listener can miss the `CREATED` event fired before it finished mounting, leaving stale default state -
   a real race, confirmed live (not assumed) by checking which of two props/states each sibling icon was actually
   gated on. **When investigating "wrong" behavior, trace state ownership through the component tree exactly like
   DOM hierarchy is traced** - which component owns the state, who else reads/derives the same real thing, and
   whether two independent listeners for the same event exist where one, single source of truth would do. Prefer
   deriving from an already-correct parent-provided prop over a second independent listener, even when the
   reference itself uses two independent listeners — copy HabboCity's real UI/behavior, not a fragile
   implementation detail that provably races in our own environment.

5. **Audit for the same class of bug elsewhere, not just where it was first found.** Finding one component with a
   duplicated/racy local copy of state a parent already owns correctly is a signal to check for the same pattern
   in sibling components, not a closed, one-off fix.

6. **A component is not done after its first working state — enumerate every real state on the reference before
   calling it finished, and check for an existing shared primitive before writing new markup for a solved
   problem.** Case study, 2026-09-22: fixing Catalog's purchase-widget footer (buttons wrongly nested in the
   preview column instead of a full-width footer row) was treated as complete after verifying only the
   one-item-selected state. Three more real, confirmed gaps in the exact same component surfaced only because
   the user separately had to ask about each one:
   - The quantity spinner's own sub-markup (minus/plus buttons, input) had never been captured from the real
     DOM/JS at all — it was built from a guessed icon set (`FaCaretLeft`/`FaCaretRight` + a native number
     input) that doesn't exist on the reference (real: `FaMinus`/`FaPlus` in colored `.btn-xsm` buttons around
     a `.custom-input-number`). "The container class is right" is not the same as "the contents are verified."
   - The furni-icon grid used a plain native `overflow: auto` scrollbar instead of this project's own
     already-built `ScrollContainer` component (used correctly elsewhere in this same file's nav sidebar) —
     a shared primitive that already existed in the codebase went unused because nobody checked for one before
     writing `<AutoGrid>` directly.
   - The **empty/no-selection state** of the footer (nothing picked yet) was never checked at all — the
     reference always renders the footer, showing a full-width disabled "no selection" button instead of
     nothing. Only the happy-path (item selected) state had been interacted with on the reference.
   None of these three needed a new investigation technique — the existing DOM/CSS/JS chain in rule 2 would
   have caught every one of them. They were missed because the *state coverage* was incomplete, not because the
   *method* was wrong. Concretely, before calling any component/interaction done:
   - **List every real state it can be in** (empty/no-selection, loading, error, disabled, min/max boundary,
     hover/focus/active/open/closed) by actually driving the reference into each one via CDP interaction — not
     just whichever state happened to render first — and verify each one, not only the one that prompted the
     fix.
   - **Before writing any new sub-markup** (a control, an icon, a spinner, a scrollbar, a dropdown), search this
     project's own `common/` and the component's siblings for an existing shared primitive built for that exact
     pattern first. Reaching for a plain native element or a guessed icon when a verified, already-built
     equivalent exists elsewhere in the codebase is itself a bug, not a neutral choice.
   - This extends rule 5 (audit for the same bug in *sibling components*) to also cover *sibling states of the
     same component* — a fix scoped to only the state that was reported is exactly as incomplete as a fix
     scoped to only the component that was reported.

7. **A symptom clearing up is not the same as a fix being complete — go back through the DOM/CSS/JS chain even
   after the obvious bug resolves.** Given verbatim, 2026-09-23, after the Photos tab's stuck-loading-spinner
   bug was fixed (a real hook-ordering issue, see the case study below) and reported as done: *"no check in
   minified js css"* — the user rejected "the spinner resolves, therefore this is fixed" outright. Root-causing
   *why* something is broken does not excuse skipping rule 2's own chain for verifying *what it should actually
   look like* once it works. Going back through the chain on the now-working Photos tab immediately surfaced
   three more real, independently-confirmed bugs a "spinner cleared, ship it" stop would have missed entirely:
   a missing `ScrollContainer` wrapper, an image `src` built from the raw un-prefixed server value instead of
   the real `${camera.url}/${id}.png` construction (would have rendered broken images for every real photo),
   and a guessed empty-state string instead of the real locale key. **Concretely: finding and fixing the root
   cause of a broken interaction is the START of verification, not the end of it** — once the mechanism works,
   still walk it through Live DOM → Computed Styles → Minified CSS → Minified JS → compare ours, exactly as if
   nothing had been fixed yet, because the original broken state usually prevented any of that comparison from
   being meaningful in the first place.

   **Case study — the hook-ordering registration bug class**, first documented in
   `hooks/inventory/useInventoryBanner.ts`, confirmed as a recurring, real pattern (not a one-off) when the
   exact same bug caused the Photos tab's stuck spinner and, separately, was pre-empted while building the
   Wealth tab: any component that calls `RegisterXMessages()` inside a `useEffect` *after* a `useMessageEvent`
   hook is declared will silently drop the real server response. React commits effects in hook-declaration
   order — `useMessageEvent`'s own internal subscription effect resolves the real network header via
   `getEventId()` at subscribe time; if the message class isn't registered yet when that runs, `getEventId()`
   returns -1, the subscription silently no-ops, and the real response arrives with zero live listeners. No
   client or server error is ever raised — the only visible symptom is data that never arrives (a spinner that
   never resolves, a tab that never populates). **The fix is always the same shape: call `RegisterXMessages()`
   synchronously in the component body, before any `useMessageEvent` hook for that same message class** — never
   from inside a `useEffect`, regardless of how natural that placement looks. Check this specifically whenever
   a brand-new request/response pair is wired into a component for the first time.

See also `memory/feedback_side_by_side_property_comparison.md`, `memory/feedback_dom_js_css_cross_reference.md`,
and `memory/feedback_component_state_coverage.md` for the earlier, narrower versions of this same discipline this
section supersedes/generalizes.

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

## Catalog purchase-widget + Outfit editor + Clothes shop pass (2026-09-22/23)

**Catalog purchase widget fixed** (`CatalogLayoutDefaultView.tsx`, `CatalogPurchaseWidgetView.tsx`,
`CatalogSpinnerWidgetView.tsx`, `CatalogItemGridWidgetView.tsx`): the default page layout used
`<Grid>` (CSS grid, `g-col-7`/`g-col-5`) instead of the real `d-flex` `col-7`/`col-5`, and nested the
Buy/Gift buttons + quantity spinner inside the ~200px col-5 preview column instead of the real
full-width `catalog-purchase-widget` footer row below the whole grid — same class of bug as
Inventory's Furniture/Badges tabs earlier. Fixed the layout, reordered Gift→spinner→Buy (verified via
CDP: 150px/166px/150px, byte-identical to the reference), rebuilt the spinner as the real
`.controls-input-number` box (`FaMinus`/`FaPlus` in `.btn-xsm` buttons, not the guessed
`FaCaretLeft`/`Right`), and wrapped the furni-icon grid in the existing `ScrollContainer` primitive
(was plain `overflow:auto` AutoGrid).

**Outfit editor (`AvatarEditorView.tsx` family) — full structural rebuild**, since it turned out to
still be the pre-rebuild stock layout (`Grid`/`col-9`/`col-3`), not the real habbocity structure
despite older notes above claiming it was "already a careful, verified port" (that note predates the
`habbocity-rebuild` reset). Real structure verified via CDP: `.nitro-avatar-editor-content` holds an
**always-visible wardrobe sidebar** (not a 5th tab that replaces the model view — this was the single
biggest structural miss) beside a main column (4 category tabs, then a row split into a LEFT column
— figure-preview + rotate arrows + gender/category icon row, then the item grid — and a RIGHT column
— a real 3-slider HSL `.input-color-picker` + a `.color-preview` toggle swatch, then the palette
grid). Real, confirmed-and-fixed bugs along the way, roughly in the order found:
- Wardrobe rebuilt to the real always-visible sidebar (5 rows × 2 slots, empty slot = `FaPlusCircle`
  save button, filled slot = avatar render + hover-reveal Wear/Overwrite buttons) instead of a
  tab-gated `AutoGrid`. Real crash found switching it: `savedFigures` starts as a **sparse**
  `new Array(maxWardrobeSlots)` until the real `UserWardrobePageEvent` arrives; the old code iterated
  with `.forEach()` (which skips holes), the rewrite used a `for` loop (which doesn't) — fixed with
  `savedFigures[index] || [null, null]`. Gender-mismatch dimming (`pointer-events:none` +
  `gender-mismatch` class on a saved look whose gender differs from the active one) added, verified
  against the reference's own minified source; the wear action's head-strip-on-wear toggle left
  unreplicated (real, unresolved gating flag in their source).
- Real, cascading flex-sizing bugs, all the same root shape (a sibling with no matching
  `flexBasis:0`/`grow` claims 100% of its neighbour's space): figure-preview-section collapsing to 0
  height, then 0 width; the category-icon row squeezing the 90px-wide avatar preview down to 30px on
  the 5-icon HEAD tab; the 3 colour-picker slider bars themselves rendering at 0px height (their own
  CSS has no explicit height, same shape as `.figure-preview-section`'s own `height:0`-as-flex-basis
  contract) — every one confirmed by measuring the real reference's own computed rects first, never
  guessed. `AvatarEditorFigurePreviewView`'s leftover `scale={2}` (from the old, differently-sized
  layout) also fixed — real avatar-image is a plain unscaled 90×130px, not 180×260.
- Real feature-set/palette grid columns: was `AutoGrid` (CSS-grid auto-fill, `columnMinWidth`),
  producing 7 columns at 32px instead of the real 5 columns at 40px
  (`.avatar-editor-figure-set-item`/`.avatar-editor-palette-set-item`'s own real CSS is fixed
  40×40px + margin, confirmed in `_32-nitro-avatar.scss`). Replaced with a new shared hook,
  `useAvatarEditorGridColumns.ts` (`ResizeObserver`-driven `Math.floor((width+14)/47.5)`, the +14
  compensating for the real ScrollContainer scrollbar gutter this grid always sits inside — matches
  the reference's own real column count exactly, verified on all 4 tabs incl. HEAD's 5-icon case).
- **Colour picker's real function, resolved by direct interaction, not by reading source alone**: an
  early pass added a CIE-Lab colour-distance palette filter based on a minified function that looked
  like the mechanism; live-dragging the reference's own hue slider through 5 different positions
  disproved that (palette count identical every time) and the filter was removed - then the user
  asked for it back (their own explicit call, palette usefulness over strict fidelity to an
  under-populated dev palette), so it's back, gated so it only filters once a slider is actually
  adjusted (confirmed via CDP: enabling the picker alone does not filter; the first real drag does).
  Running the **identical drag on both clients** confirmed the filter math itself is byte-correct —
  our 5 matches for a fixed target hue were an exact, in-order subset of the reference's 55 matches
  for the same hue — the gap was `FigureData.json` itself (see below), not the component.
- Bottom action row (`ButtonGroup` + a new own-feature `FaShoppingBag` "open the shop" button + Save)
  had `grow`; since `AvatarEditorModelView` (the real space-filling middle section) is conditionally
  rendered and briefly absent on a cold mount before `model.init()`/`selectCategory()` resolve, that
  row became the only growing flex child and expanded to fill the whole card - "buttons show huge
  first, then the boxes appear," reported after a real cache-cleared load. Fixed by removing the
  unneeded `grow` (the model view's own `fullHeight` already claims the space once it mounts).

**`hCMS/public/cdn/gamedata/FigureData.json` merged with HabboCity's real colour palettes**
(separate repo, real production game data — not a client-code fix). Confirmed via a direct
side-by-side drag test that our palette 2/3 had far fewer colours than habbocity's (218/229 vs.
850/872) — this, not a filtering bug, was why the colour picker looked so much less useful on our
side. Backed up the original file, then did an **additive-only merge** (new HabboCity colours not
already present by hex code get appended with brand-new, non-colliding ids; every existing colour
id/hex/club/selectable value stays byte-identical) rather than a wholesale replace, since a straight
replace risks silently reassigning existing colour ids to different hexes and changing already-worn
outfits site-wide. Result: palette 1 136→162, palette 2 218→761, palette 3 229→824. Verified:
`setTypes` untouched, every original colour preserved byte-for-byte, no id collisions (1747 unique
ids for 1747 colours), and a live re-test of the same drag now returns 56 matches (vs. the
reference's 55 for the same hue) with a newly-added colour confirmed clickable and applying to the
avatar. Backup at `FigureData.json.bak-<timestamp>` in that same directory if this ever needs
reverting.

**Clothes shop (`ClothesShopView.tsx`) rebuilt 1:1 to this now-fixed outfit editor's real structure**,
per explicit user direction — this is hCMS's own instant-grant clothing shop, not a HabboCity
feature, so "1:1" here means matching our own now-corrected reference implementation rather than a
second, independent habbocity capture. Reuses `.nitro-avatar-editor`'s real CSS, `AvatarEditorFigurePreviewView`
directly, and the same `useAvatarEditorGridColumns` 40×40px row-chunked grid. No wardrobe sidebar
(no save/load-look concept in a shop) and no colour-picker/palette (`ClothesShopItemData` carries no
colour data at all, confirmed in `ClothesShopProtocol.ts`) - the right column instead shows the
focused item's name/price/basket-toggle. Per explicit follow-up direction, the bottom full-width
slot that's a plain "Save" button in the outfit editor is instead the actual basket contents here
(scrollable row of small icon+name tags, click to remove) next to the credit/point totals and the
Buy button - "where it saves outfits, list what's in the basket instead; everything else (choosing
clothes) stays the same." A real bug found while wiring the new outfit-editor→shop button: clicking
it left the outfit editor open underneath the shop (both default to the same centred position) -
fixed by closing the editor (`setIsVisible(false)`) before firing `CreateLinkEvent('clothes-shop/toggle')`.
Verified end-to-end: opening the shop, adding a real unowned item to the basket, seeing it listed
with its price, removing it via the basket entry, and the empty-basket state ("Basket is empty",
"BUY (0)" disabled) all confirmed via CDP on the dev client.

## Full feature inventory — still not done

Per the extension mandate, the following real HabboCity UI surfaces have **not** been scanned at
all yet: dialogs/popups in general, notifications, tooltips, context menus (found this project
already has a full, seemingly well-built `ContextMenuView` component family with position-tracking/
fade/collapse logic and matching ported CSS — not live-verified since triggering a real one needs an
actual in-room avatar/furniture click, more setup than a quick check afforded this session),
pagination, and every loading/empty/error state across all of the above.

**Updated status (2026-09-23):** Navigator, Catalog, Inventory, User Settings, and the Outfit editor
have all had real passes (see their own sections above), plus the own-feature Clothes shop — but
**none of these is fully done**:
- Navigator: browse/search shell only — Room Creator carousel/custom-selects still stock.
- Catalog: card shell, the default page layout's purchase widget, **and (2026-09-23) all 9 of the
  other layout types** (`CatalogLayoutBadgeDisplayView`, `ColorGroupingView`, `GuildCustomFurniView`,
  `GuildForumView`, `RoomBundleView`, `SingleBundleView`, `SoundMachineView`, `SpacesView`,
  `TrophiesView`, plus `pets/CatalogLayoutPetView`) checked directly in source and confirmed to have
  the exact same two bugs as the pre-fix default layout: root `<Grid>` (CSS grid `g-col-7`/`g-col-5`)
  instead of the real `d-flex` `col-7`/`col-5`, and `CatalogPurchaseWidgetView`/`CatalogSpinnerWidgetView`
  nested inside the narrow col-5 column instead of the real full-width `catalog-purchase-widget`
  footer sibling — none had inherited the default layout's fix for free, contrary to the "likely
  inherited" guess this note previously made. All 9 fixed the same way (`tsc` clean across all),
  but **not individually CDP-verified against a live reference page for each of the 9 real
  layoutCodes** (`badge_display`/`default_3x3_color_grouping`/`guild_custom_furni`/`guild_forum`/
  `room_bundle`/`single_bundle`/`soundmachine`/`spaces_new`/`trophies`/`pets`) - only the mechanism
  (shared component, shared real CSS class) was confirmed, not each page's own unique content
  (bundle grids, guild widgets, pet colour/name flow, etc.). Flag for a real per-type verification
  pass if any of these looks wrong on a live page.
- Inventory: search-bar markup only, not its shared-vs-per-tab position.
- User Settings: General + Moderate tabs, not Floor (deliberately unbuilt).
- **Outfit editor: now a real, deep, structural pass** (wardrobe sidebar, figure-preview/category-icon
  sizing, item/palette grid columns, colour-picker mechanics, bottom-row cold-mount race) — see the
  dedicated section above. Not yet checked: the colour-picker's own gradient-stop generation for
  canal-b/c (ours computes them from HSL math; the reference's own exact per-drag gradient formula
  wasn't traced, only the static default-state values were confirmed to match), and full interaction
  parity for every one of the 4 category tabs' item-set edge cases (only Face&Body/Head/Torso/Legs
  base structure was checked, not e.g. HC-gated parts or the football-gate variant referenced in the
  reference's own `isFromFootballGate` prop, never investigated).
- **Clothes shop: real, own-feature-adapted pass complete** for its scope (grid, tabs, figure
  preview, basket) — see its own section above. Its own bottom-row cold-mount behaviour (does it
  have the same race the outfit editor had?) was not separately re-tested after the fix.
- **`FigureData.json` colour palettes** (hCMS repo, not this one) now much closer to habbocity's real
  counts (761/824 vs. 850/872 for palettes 2/3) but not byte-identical — the additive merge only adds
  colours habbocity has that we don't; it doesn't reconcile ordering/index groupings, which may still
  differ from the reference's own real layout within the palette grid.

**Do not report the full mandate as complete.**

## Badges + User Profile pass (2026-09-23)

**Badge wear/remove parity + 7-slot cap fixed.** Root cause of "wearing 7 badges only shows 5": a
hardcoded `for(int i=0;i<5;i++)`/`slot<1||slot>5` loop bound in Arcturus core's own
`UserWearBadgeEvent.java` (a genuine stock-emulator limitation, not a client bug) - fixed to `7`
directly in core (the one exception to the "extend via the plugin, not core" rule, explicitly
approved). Client-side: `useInventoryBadges.ts` rewritten from a compacting `activeBadgeCodes[]` to
a fixed-size `activeBadgeSlots[]` with real slot-swap logic (`toggleBadgeAtSlot`), matching the
reference's actual drag-to-slot mechanism (new `draggable`/`onDragStart` on
`InventoryBadgeItemView.tsx`, new shared `common/layout/LayoutBadgeRackView.tsx` reused by both
Inventory's own rack and the Me-panel/infostand badge display). Also fixed: `InfoStandWidgetUserView`
never requested another player's current badges on open (only listened for the change broadcast) -
added the missing `UserCurrentBadgesComposer` request, same pattern `UserProfileView` already used.

**User Profile: Banner/Stats/Cover/Pictures protocols added end-to-end**, all via
`hcms-emulator-plugin` (never core), mirroring the project's established custom-protocol pattern
(opcode consts, `RegisterXMessages()`, composer/parser pairs on the client; `XProtocol.java`,
`MessageHandler`/`MessageComposer` pairs registered in `HcmsPlugin.onEmulatorLoaded` on the server).
Real bug fixed along the way: the equippable "player banner" (`.body-image`) and the user-uploaded
profile cover (`.profile-banner`) are two separate real fields/elements - an early pass wired the
wrong one onto `.profile-banner`, caught by comparing computed styles on the live reference (no
image on `.profile-banner` for the test account vs. a real `background-image` on `.body-image`).

**Cover-crop widget rebuilt from the real reference mechanism, not guessed.** First implementation
was a "pan image inside a fixed frame" widget built without checking the real minified source first
- explicitly stopped and redone per the OBSERVE-FIRST/IMPLEMENT-SECOND protocol. The real reference
(`sO` in the minified bundle) is a resize/move rectangle with 8 drag handles, aspect-ratio-locked to
`wantedSize`, drawn over a letterboxed (never-cropped) source image, dimmed via an SVG `<mask>` (a
white full-rect plus a black rounded-rect cutout). Rebuilt as `common/profile/
ProfileCoverCropWidgetView.tsx` and live-verified byte-identical against the reference via simulated
CDP drag tests (settled rect position/size and post-drag deltas matched exactly on both clients).

**Photos tab: built, found broken, root-caused via the mandated JS/CSS cross-reference, fixed.**
Symptom: the tab's loading spinner never resolved, with no client or server error. Root cause was a
**hook-ordering bug**, same class already documented in `hooks/inventory/useInventoryBanner.ts`'s own
comment: `UserProfilePicturesTabView.tsx` called `useMessageEvent<ProfilePicturesDataEvent>` *before*
the `useEffect` that called `RegisterProfilePicturesMessages()`. React commits effects in
hook-declaration order, so `useMessageEvent`'s own subscription effect (which resolves the real
network header via `getEventId()`) ran first, while the message class was still unregistered -
`getEventId()` returned -1, the subscription silently no-opped, and the real 9536 response had zero
live listeners. Fixed by moving `RegisterProfilePicturesMessages()` to run synchronously in the
component body, before the `useMessageEvent` hook - the same fix shape as `useInventoryBanner.ts`.

**Per the user's explicit correction mid-fix ("check in minified js css") - did not stop at "spinner
resolves," went back through the mandated chain against the live reference and found two more real
bugs the original build had guessed wrong:**
- The furni-icon-grid-style `.scroll-container`/`ScrollContainer` wrapper (used identically by
  Catalog's item grid, Navigator's results list) was missing entirely - confirmed via live DOM
  capture of the reference's own Photos panel (`.scroll-container.h-100...grid...` wrapping a
  `.scroll-content.vertical` wrapping the AutoGrid). Added.
- **Image `src` was wired directly to the raw server value** (`picture.url`), but the reference
  builds it as `` `${camera.url config}/${a.url}.png` `` (confirmed via the real minified bundle:
  `src:`${pe("camera.url")}/${a.url}.png`` ``) - the stored `camera_web.url` value (traced through
  Arcturus core's own `CameraPublishToWebEvent`/`CameraResultURLEvent`) is a bare render-server id
  with no host or extension, same convention this project's own `CameraWidgetCheckoutView.tsx`
  already uses for a different camera flow. Passing it raw would have rendered a broken path for
  every real photo. Fixed to `` `${GetConfiguration('camera.url')}/${picture.url}.png` ``.
- Empty-state text was a guessed English string; the real bundle showed the actual title/desc pair
  ("Pas de photos!" / "Cet utilisateur ne possède pas encore de photos."). No confirmed locale key
  exists for the title specifically, but `avatar.profile.photos.empty` (found in hCMS's own
  `ExternalTexts.json`) matches the desc's real meaning - swapped the hardcoded desc string for
  `LocalizeText('avatar.profile.photos.empty')`, left the title as an honest plain-string
  translation since no distinct key was found for it.
- Also confirmed via the same minified-bundle read, **not yet built, flagged not guessed**: the
  reference has a distinct `isPrivate` empty state ("Photos privées!") with no backing anywhere in
  this project's stack (no privacy-toggle column found, same documented gap as before - the gallery
  stays always-public, matching real data honestly).
- **Click-to-view (`profile-picture/<username>/<id>/<index>`) investigated live, found non-
  functional on the reference itself - not built.** The minified source calls an internal router
  function (`Ce(...)`) on click, so a follow-up pass tested it directly on `habbocity.fr` (own
  account, own profile, the one real published photo, fresh tab to rule out stale state): recorded
  the iframe's `window.location.href` and the full CDP tab list before clicking, clicked the real
  `.profile-picture-entry` image, then rechecked both. Result: **no observable effect at all** -
  frame URL unchanged (no hash change either), no new browser tab opened, no new
  `.draggable-window` card appeared, outer `habbocity.fr/hotel` tab URL unchanged. Same class of
  finding as `.icon.icon-rooms` and the outfit editor's `FaRecycle` button elsewhere in this file -
  a real, present click handler that produces zero confirmed effect on the live reference right
  now. Per the "don't implement unverified behavior" rule, left the `<img>` non-interactive rather
  than wire a click handler to a route with no confirmed real destination.

**Still fully unbuilt**: the Wealth tab (real historical wealth-over-time chart - diamonds/badges/
items/total/classics; no backing anywhere in the stack, not attempted this session).

**Rooms tab fixed** (user report: "rooms is wrong"). Root cause traced via the minified bundle:
`UserProfileRoomsTabView.tsx` reused `NavigatorSearchResultView` with its plain defaults, but the
real reference (`VI` in the minified bundle) passes two extra props into this exact same shared
component rather than using a separate one - `fromProfile:!0` (confirmed live: disables the
collapse/expand toggle entirely, the reference's profile Rooms-tab header has no +/- icon and
clicking that area does nothing) and `setCategoryTitle:` \`Appartements de ${username}\` `` (a
literal override string hardcoded in their own source, not a LocalizeText key - bypasses the
`searchResult.code` locale-key lookup, which was falling through to the server's own literal
`searchResult.data` echo since `"profile_view"` isn't a real navigator code, producing a
wrong-looking "Text Search" header). Added both props to `NavigatorSearchResultView.tsx` itself
(optional, default off/empty, so the main Navigator's own usage is unaffected) and wired them from
`UserProfileRoomsTabView.tsx`. Also fixed in the same pass: the shared component's list-mode toggle
icon was `FaBars`; the real icon (confirmed by exact SVG path match against `node_modules/
react-icons/fa/index.js`) is `FaTh` - a real bug in the shared component affecting the main
Navigator too, not profile-specific. Added the missing `.scroll-container` wrapper (same recurring
gap as everywhere else this session). Verified live on the dev client: header now reads "Phi's
Rooms", the toggle area has zero children (matches reference exactly), `.scroll-container` present.

**Profile header structure fixed** (user report: "why overall profile structure layout is not
right"). Traced upward through the DOM per rule 3 rather than patched: the header block's real
reference structure is `.content-area-inner`'s first child, a plain `flex-column` wrapping
`.profile-banner` (full-width, 452x115, ITS OWN sibling row) directly above `.profile-data` (a row
containing `.profile-infostand` + a second flex-COLUMN of button-group/`.profile-stats`/motto-row) -
confirmed via `getBoundingClientRect` on both: `.profile-banner` at (494,127,452x115),
`.profile-data` at (494,246,452 wide) directly below it (same x, same width, stacked not
side-by-side), and the three children of the bottom block all sharing x=673 at increasing y
(246/291/340, i.e. also stacked). This file had `.profile-banner` and `.profile-data` as two
children of one `Flex` **row** (banner squeezed beside the avatar/data column instead of a full-
width strip on top), and the bottom block as a `Flex` **row** justified `between` (button-group and
the stats+motto Column side by side) instead of a column - both wrong container directions, not a
CSS issue (the real `.profile-banner`/`.profile-infostand`/`.profile-stats` rules were already
correctly ported in `_59-user-profile.scss`, confirmed before touching anything). Also added two
real, previously-missing classnames found in the same DOM capture: `.profile-stats` (own real
`font-size:13px` rule, already in the SCSS, just never applied) wrapping the created/lastlogin and
achievement/respects columns with a real `.vertical-separator` between them, and
`.profile-stats-online-icon` on the online/offline `<i>`. Fixed `UserProfileView.tsx`'s JSX to the
real column/row nesting; verified live on the dev client - every rect now byte-identical to the
reference's own captured values (banner 494,127,452x115; data 494,246,452w; button-group/stats/
motto at x=673, y=246/292/340).

**Rooms tab, second bug fixed: rooms genuinely not showing (server-side, not the client fix above).**
After the header/toggle/icon fix, the account's own real Rooms tab still showed 0 rooms despite the
account genuinely owning 2 (confirmed via the toolbar's own separate "My Rooms" shortcut,
`icon-me-rooms` -> `navigator/search/myworld_view`, an independent code path that correctly showed
both). Traced server-side rather than assumed a data gap: `NavigatorSearchComposer('profile_view',
'owner:'+username)` - `'profile_view'` is confirmed real (byte-identical to HabboCity's own minified
source), but stock Arcturus's `RequestNewNavigatorRoomsEvent.handle()` only strips the `"owner:"`
query prefix **inside an `if (filter != null)` block**, and `NavigatorManager.filters` (a real
`THashMap<String,NavigatorFilter>`) has no `"profile_view"` entry in stock Arcturus - so `filter`
stays `null`, the prefix-stripping is skipped entirely, and the request falls through to the
`"hotel_view"` fallback filter searching room NAMES for the literal, still-prefixed text
`"owner:xPhi"` - which obviously never matches. A genuine stock-emulator routing gap, not a client
bug and not a real "this account has no rooms" case. Fixed via the plugin, not core (`filters` is a
public field `Emulator.getGameEnvironment().getNavigatorManager().filters`, mutable from outside):
new `hcms-emulator-plugin/profile/NavigatorProfileViewFilter.java` registers `"profile_view"`,
delegating to the already-existing, already-correct `RoomManager.getRoomsForHabbo(String username)`
(handles both online and offline owners). One real trap found and avoided while writing it: the
returned `SearchResultList`'s own `filter` flag (8th constructor arg) must be `false`, not `true` -
`RequestNewNavigatorRoomsEvent` unconditionally re-runs a generic reflection-based field match
(`filter.filter(field.field, part, resultLists)`) after `getResult()` returns, and `true` there
would re-filter the already-correct, already owner-scoped room list against the bare username as a
room-NAME match, wiping out every real room again. Registered in `HcmsPlugin.onEmulatorLoaded`,
built, deployed (stop/copy/start, user-approved), verified live: boot log shows
`"NavigatorProfileViewFilter registered (profile_view)"`, no errors, and the dev client's own
profile Rooms tab now shows both real rooms ("Habbo", "Hix") - matching the toolbar's own
independent "My Rooms" count exactly.

**Motto editing investigated (user report: "cant edit motto") - confirmed already correctly built,
in its real location, not the profile card.** Traced the real mechanism via the minified bundle
first, per rule 2 (not guessed): the reference's own profile-card motto (`.profile-stats-motto`)
has `pointer:!0`/`select:"text"` but **no `onClick` at all** in its own source - confirmed live too
(clicking it on the reference produces zero DOM change). Motto editing is a **different, real
feature entirely**: the in-room infostand for your OWN avatar (`e.type===$t.OWN_USER` in the
minified bundle) - a pencil icon, click-to-edit `Text`->`<input type="text" className="motto-input"
maxLength={motto.max.length}>` swap, save on blur/Enter. This project's own
`InfoStandWidgetUserView.tsx` **already implements this exactly**, byte-for-byte matching what was
just independently decompiled (same `FaPencilAlt` icon, same click-to-edit swap, same
`motto.max.length` config key, `roomSession.sendMottoMessage(motto)` -> real `UserMottoComposer` ->
Arcturus core's own `SaveMottoEvent` handler, confirmed registered in `PacketManager.java`) - this
was already a real, verified pass from earlier in this project's history, not new work. No bug
found; the likely explanation is the report came from testing the profile card specifically (the
surface being actively worked on this session), which was never supposed to be editable there
either - the reference confirms the exact same non-interactive-on-the-profile-card behavior.

## Wealth tab built (2026-09-23) - real backing data found in a third repo, not "no data anywhere"

Corrects an earlier, wrong claim in this same file (now removed from `UserProfileView.tsx`'s own
comment): "Richesse... has NO backing anywhere in this project's stack" was asserted without
checking hCMS (the separate Laravel website repo, same shared MySQL database) - it does. hCMS
already has a complete wealth-snapshot system built specifically for this exact chart concept:
`hcms_wealth_snapshots` (one row per player per day: diamonds/rares/badges/total, upserted daily),
`hcms_values_rares`/`hcms_values_badges` (diamond-value catalogs), `WealthSnapshotService.php`/
`WealthCalculator.php` (the real source of truth), already powering hCMS's own Center > Inventory >
Richesse chart and confirmed, via `InventoryController::richessChart()`'s own real JSON field names
(`diamants`/`patrimoine`/`classiques`/`badges`), to be the same French-key-naming reference family
as HabboCity's own client. Exposed via a new `hcms-emulator-plugin` protocol (9528 out / 9537 in,
`ProfileWealthProtocol`/`Repository`/`RequestEvent`/`DataComposer`, all in `profile/`), mirroring
hCMS's own SQL in Java (JDBC has no way to call PHP) rather than adding anything to Arcturus core.

**Real reference structure, CDP-verified against the live profile card (own account)**: `.profile-
wealth-tab` > `.nitro-graph-view.profile-wealth-graph.rounded` (an SVG multi-series smoothed line+
area chart, `viewBox 0 0 800 350`, a clip-path'd plot area x:[60,750] y:[0,290], one semi-transparent
filled area path + one solid line path per active series) + `.profile-wealth-curve-button-container`
(5 real toggle buttons: **Diamants** `#00BFFF`, **Badges** `#E967C6`, **Mobis** `#FFA66A`, **Total**
`#54DE7D` - all active by default - then a `.vertical-separator`, then **Classiques** `#FFA66A`
(same color as Mobis), inactive by default) + `.profile-wealth-details` (two real detail rows:
`icon-pf-rare` + "X rares différents", `icon-pf-badge` + "X badges différents"). "Mobis" confirmed to
mean the diamond VALUE of owned rares via hCMS's own blade partial literally labelling the same
number "wealth in furni" (`inventory-richess.blade.php`). Built `UserProfileWealthTabView.tsx` +
`api/user/ProfileWealthProtocol.ts` to this structure: 4 real chart series (toggleable, each showing
its own current value formatted with a real k-suffix, e.g. "3.5k"), plus the Classiques button and
the details row. Registration ordering follows rule 7's own hook-ordering fix (`RegisterProfileWealth
Messages()` called synchronously in the component body, avoided the bug pre-emptively rather than
hitting it and fixing it after).

**Real, honest gaps, flagged not guessed:**
- The curve-smoothing math (Catmull-Rom -> cubic Bezier, producing the same "M x,y C x,y x,y x,y..."
  path shape seen in the reference's own SVG) is a standard technique, not the reference's own traced
  internal formula - same acceptable-approximation precedent as the outfit editor's own colour-picker
  gradient stops elsewhere in this file.
- **"Classiques" shows a real number (`uniqueRareCount`) and toggles its own active state, but adds
  no 5th chart line** - `hcms_wealth_snapshots` only tracks the daily diamond VALUE of owned rares
  (the "Mobis" series), never a daily COUNT of distinct rares owned, so there is no real time-series
  to draw for it. Wiring a line here would mean fabricating history that doesn't exist.
- **Cross-profile privacy is a deliberate, mirrored policy choice, not a confirmed reference
  behaviour**: hCMS's own `richessChart()` endpoint only ever serves the logged-in player's own
  history (explicitly documented there as an undecided product question for cross-profile access) -
  mirrored the same restriction server-side (a non-own `targetUserId` gets an honest empty history
  back) for consistency within this project, since HabboCity's own live cross-profile behaviour was
  never actually tested (would need a second real account).
- Chart shown with real snapshot data only when `history.length >= 2` (matching hCMS's own
  `richess.js` "hide chart below 2 points" convention) - a brand-new account's single same-day
  snapshot shows an honest "not enough history yet" state instead.

**Deployed and boot-verified** (`"ProfileWealthProtocol registered (9528/9537)"`, no errors,
user-approved stop/copy/start), **then live-CDP-verified on the dev client - three real bugs found
and fixed** (user report: "its not the same 1:1"):
- **Missing `<clipPath>` entirely.** The reference's own SVG clips every series to the plot area
  (`<defs><clipPath><rect x="60" y="0" width="740" height="290"/></clipPath>`, every
  `<g clip-path="url(#...)">`) - this file had neither, so a Catmull-Rom curve overshooting between
  two data points (a real risk with real, jagged wealth data) rendered outside the chart box instead
  of being cut off cleanly. Added the real `<defs>`/`clipPath`/`clip-path` structure.
- **Labels were French, matching the reference's own French-locale capture verbatim** (Diamants/
  Mobis/Classiques) - per direct correction, this project's own UI language is English throughout
  (every other tab/locale key already is), the French was only ever an artifact of which locale
  build of habbocity.fr got captured. Renamed to Diamonds/Furni ("Mobis" is Habbo slang for
  furniture, confirmed via hCMS's own "wealth in furni" label for that exact number)/Classics.
- **A value over a million formatted wrong** ("1049.02k" instead of "1.05M") - found live on this
  dev account's own real (large, dev-scale) diamond balance. `formatK` only had a k-suffix tier;
  added an M-suffix tier for values >= 1,000,000.

All three verified live via CDP: button text now reads "Diamonds 1.05M / Badges 30k / Furni 86.07k /
Total 1.17M / Classics 41", `svg.querySelector('clipPath')` exists, every `<g>` carries
`clip-path="url(#profile-wealth-plot-clip)"`.

**Still "not the same 1:1" after those three fixes - the real, much bigger gap was the chart's
entire axis system, found by pulling the reference's FULL live SVG markup instead of re-checking
only the specific attributes already fixed.** The earlier three fixes were real but minor; the
reference chart is a fully labeled axis chart and this file's version was two bare curves floating
in empty space with no labels, no gridlines, no data-point markers, and a half-width line stroke.
Confirmed via a complete `outerHTML` dump of the reference's own chart SVG (not just the clipPath
attribute check from before):
- **Y-axis: 8 real value-tick labels** (`0`/`600`/`1.2k`/.../`4.2k` on the captured reference),
  each a `<g transform="translate(60, y)">` with a left tick mark (`<line x1="-6" x2="0">`) and a
  right-aligned `<text x="-10" dy="0.32em" font-size="20">`. The step (600) is NOT a raw
  `max/7` - it's rounded up to a clean number first. Reverse-engineered the rounding (round the raw
  step up to 2 significant figures, i.e. `Math.ceil(rawStep / (magnitude/10)) * (magnitude/10)`),
  confirmed it reproduces the one real captured step (600 for a raw max/7 of ~598) - not the
  reference's own traced source formula, an acceptable approximation like the Catmull-Rom smoothing.
  **This also means the axis max has real headroom above the actual data max** (`step * 7`, not
  clamped to the peak value) - a real, visible difference from the old "highest point always touches
  the very top" behavior.
- **X-axis: one real date-tick label per data point** (`DD-MM-YYYY`, formatted from the raw
  `YYYY-MM-DD` snapshot date), staggered alternately above/below (`tick length 26/label y:44` on
  even indices, `tick length 6/label y:22` on odd) specifically so adjacent short-interval date
  labels don't overlap each other - entirely absent before.
- **A real solid axis frame** (left vertical `x=60` from `y:25` to `y:290`, bottom horizontal `y:290`
  from `x:60` to `x:750`, `stroke-width:3`) - was completely unrendered; the plot area had no visible
  boundary at all.
- **A filled circle + an invisible larger hit-circle at every single data point**
  (`<circle r="8" fill="{series-color}">` + `<circle r="12" fill="transparent">`, the second one
  presumably for hover/tooltip - tried to confirm via a dispatched `mouseenter`/`mouseover` on the
  live reference and got no observable tooltip or radius change, so this stays UNVERIFIED behavior,
  same class of finding as `.icon-rooms`/`FaRecycle` elsewhere in this file - the DOM structure
  (both circles) was added for 1:1 fidelity, no hover logic was invented on top of it).
- **Line `stroke-width` was `2`, reference is `4`.**
- **The plot's actual scale top is `y:25`, not `y:0`** (the clip rect's own top is genuinely `y:0` -
  confirmed both values live, they're deliberately different: the clip rect gives the topmost
  circle's own radius some headroom, while `y:25` is where the axis/ticks/scale math actually starts).

Rebuilt `UserProfileWealthTabView.tsx`'s chart to this real structure. Verified live on our own dev
client (not just re-reading the code): `circleCount:20` (4 series x 5 dev-data points),
`lineCount:15` (5 X-ticks + 8 Y-ticks + 2 axis-frame lines), `lineStrokeWidths:["4"]`, Y-axis text
labels reading real formatted values across both k and M ranges
(`"0","230k","460k","690k","920k","1.15M","1.38M","1.61M"`) - confirming `formatK`'s M-suffix fix
from earlier in this same pass also works correctly when reused for axis labels, not just the
button row.

**Wealth chart hover tooltip + dot-grow animation built (2026-09-24).** Pulled the reference's
complete live SVG (not just re-checking the earlier clip-path fix) and found a real hover feature
entirely missing: hovering a data point's dot (1) grows it from `r=8` to `r=12` with a smooth
`transition: r 0.1s ease-in-out` (already present as an inline style on the reference's own dot,
confirmed real via a genuine CDP `Input.dispatchMouseEvent` mouse move - a page-JS `dispatchEvent`
does NOT trigger this, only real pointer movement does, which cost real debugging time before
realizing it), and (2) shows a `.nitro-graph-tooltip` box (real CSS pulled verbatim from the
reference bundle - it didn't exist anywhere in this project's own SCSS yet, added to
`_59-user-profile.scss`) reading `<strong>date</strong><br>Label: value` with the series' own color
via a `--holo-text-primary` CSS var, flipped left/right (`transform`+arrow direction) based on which
half of the plot the point falls in so it never overflows the card edge (confirmed via testing both
the leftmost and rightmost data points). Tooltip values use a plain space-separated-thousands format
(`"3 917"`), NOT the k/M abbreviation used on the buttons/axis - two genuinely different real formats,
not an inconsistency. Implemented via an invisible `r=12` hit-circle per point (matching the
reference's own two-circles-per-point structure) with `onMouseEnter`/`onMouseLeave`, positioned with
viewBox percentages rather than measured pixel rects (valid since the SVG's `width:100%` always keeps
the container at the exact 800:350 aspect ratio).

**Classics button: real interaction model found, backing data built (2026-09-24).** A first click
test (checking DOM state synchronously right after `.click()`, in the same tick) wrongly concluded
Classics does nothing at all - the real bug was the test itself, not the button: React defers
re-rendering past the current synchronous tick, so *every* button looked inert in that test,
including the 4 already-known-real ones. Redone with a proper `await wait(200)` between each click
and its snapshot, the real model is: **the 4 money series (Diamonds/Badges/Furni/Total) toggle
independently in their own Set (unchanged from the original build), but Classics is a mutually
exclusive solo-select** - clicking it clears all 4 money series and activates only itself; clicking
any money series while Classics is active clears Classics back. Comparing the raw SVG path
coordinates of a Classics-solo line against a Furni-solo line proved this isn't a shared/aliased
series (same color #FFA66A is coincidental) - both change on the same real day (acquiring a rare
touches both metrics at once) but at different step heights, meaning Classics is a real, distinct
daily unique-rares-**count** history, not the same data re-labeled.

No retroactive backfill was possible - a subagent confirmed the stock Arcturus `items` table has
**no acquisition-timestamp column at all** (only `user_id`/`room_id`/`x`/`y`/`z`/`rot`/`extra_data`/
`limited_data`), so historical counts genuinely cannot be reconstructed. Built as a new tracked
column instead, same "starts from today, existing rows read 0" shape as every other similar honest
gap in this project: `hcms_wealth_snapshots.rares_count` (new hCMS migration, run live via
`php artisan migrate`), `ProfileWealthRepository.java`'s `Snapshot`/`recordTodaySnapshot`/
`getHistory` all updated to read/write it, `ProfileWealthDataComposer.java` serializes it per
snapshot, and the client (`ProfileWealthProtocol.ts`'s `ProfileWealthSnapshot.raresCount`,
`UserProfileWealthTabView.tsx`'s `CLASSICS_SERIES`/`activateClassics`/`visibleSeriesList`) wires it
as a genuine 5th toggleable series sharing the exact same chart/tooltip/hover machinery as the other
4. Deployed (stop/copy/start, user-approved) and boot-verified
(`"ProfileWealthProtocol registered (9528/9537)"`, no new errors). Live-verified on the dev client
via a delay-aware click test replicating the reference's exact exclusive-toggle behavior
(`Diamonds/Badges/Furni/Total` all deactivate the instant `Classics` is clicked, and clicking a money
series afterward deactivates `Classics` back) - hover/tooltip specifically on the Classics line
wasn't successfully reproduced via CDP's synthetic mouse simulation (kept landing on the right
target element per `elementFromPoint` but never triggering the React handler, unlike the same
mechanism working correctly for the money series), but the user confirmed via real interaction that
hover works correctly there too - trusting real human interaction over an inconclusive automation
quirk, since the exact same tooltip/hover code path is shared with the already-CDP-verified money
series and nothing in the Classics-specific code differs from that shared path.

**Profile cover upload fixed (2026-09-24) - real off-by-4-bytes wire bug, found via a full CDP-driven
end-to-end test, not guessed.** User report: "profile banner upload not showing." Confirmed first
via direct DB/filesystem inspection (PHP PDO + `ls`) that `hcms_users_profile_banners` had 0 rows and
`public/assets/img/center/profile-banners/` was empty despite the feature being built and deployed
earlier - meaning no upload had ever actually persisted. Reproduced the full flow live using CDP's
`DOM.setFileInputFiles` on the real hidden `<input type="file">` (not a mocked event) to drive an
actual pick -> crop -> confirm cycle on the dev client, which showed the client-side "Cover sent to
the server!" message every time - but the server logs showed the true story:
`WARN ... ProfileCoverUploadEvent - rejected profile cover upload from user 1 (2747 bytes,
validPng=false)`. **The client's own success message is purely optimistic** (fires immediately after
`SendMessageComposer`, before any server response) - a real, separate UX inaccuracy flagged here but
not yet fixed (still shows "success" even when the server silently rejects the upload).

Root cause: `ProfileCoverUploadComposer`'s data array was `[ imageBytes.byteLength, imageBytes.buffer ]`
- copying a `push(byteLength, arrayBuffer)` shape seen elsewhere in this project without checking
whether it actually applied here. Read the real serializer instead of assuming
(`node_modules/@nitrots/nitro-renderer/core/communication/codec/evawire/EvaWireFormat.ts`'s own
`encode()`): an `ArrayBuffer` element in a composer's data array is written via
`writer.writeBytes(value)` with **no per-field length prefix of its own** - only the whole encoded
packet gets one length prefix, at the transport layer. So the leading `byteLength` int became 4 real
stray bytes on the wire ahead of the actual PNG data; the server's own handler reads "all remaining
bytes in the packet" as the image, so those 4 bytes shifted the real `\x89PNG\r\n\x1a\n` magic bytes
out of position, failing the format check on every single upload, silently (client never learns).
Fixed by sending only `[ imageBytes.buffer ]`. Verified end-to-end on the dev client via the same real
CDP file-input-injection test: after the fix, `hcms_users_profile_banners` gained a real row, the
real PNG file appeared on disk, no rejection warning in the log, and the profile card's
`.profile-banner` div picked up the correct real `background-image` URL and rendered it. (A test PNG
was left in place on the dev account from this verification - real proof the fix works, not left
accidentally; replace/delete it via the real upload/delete flow whenever convenient.)

**User Settings: full 1:1 pass (2026-09-24) - Floor tab built, real custom slider primitive built,
two real bugs fixed, one deliberate divergence made and flagged.** Pulled the reference's complete
live DOM for all 3 tabs plus its own minified JS source (not just DOM/CSS this time - needed the JS
to get the Floor sliders' real min/max/default numbers, which aren't derivable from a single static
DOM snapshot).

- **General tab had 5 checkboxes, the reference has exactly 3** (confirmed via both live DOM and the
  minified source: `darkMode`/`roomInvites`/`cameraFollow`, in that order). This file previously had
  an extra "prefer old chat" checkbox (a stock-Nitro-only concept, not read anywhere else in this
  project either - dead even before this pass) and two catalog-preference checkboxes
  (place-multiple-objects/skip-purchase-confirmation) that ARE real reference hooks (confirmed
  `CATALOG_PLACE_MULTIPLE_OBJECTS`/`CATALOG_SKIP_PURCHASE_CONFIRMATION` exist in their own bundle,
  localStorage-backed) but are surfaced elsewhere on the reference (the Catalog purchase flow
  itself), never as a Settings checkbox - removed both from here. Neither hook is currently wired
  into this project's own Catalog purchase flow either (confirmed via a project-wide grep - only this
  file referenced them) - a real, separate, out-of-scope gap for whoever picks up the Catalog
  purchase widget next.
- **Added the real, previously entirely-missing "Dark theme" checkbox** - a genuine reference
  feature this file had no equivalent for at all. Traced the wire protocol before wiring it: the
  reference's own `dark_mode` checkbox sends the exact same composer opcode slot (0) this project's
  stock Nitro build uses for `UserSettingsOldChatComposer` - HabboCity's own custom server fork
  reinterprets that slot as dark-mode, but this project runs its own Arcturus emulator, which almost
  certainly stores/reads that slot with the STOCK meaning (prefer-old-chat). Sending it here would
  silently flip an unrelated server-side preference with no way to know from the client alone.
  Deliberately wired as a **client-only** toggle instead, reusing this project's own already-real
  dark-mode mechanism (`src/index.tsx`'s `body.dark-mode` class + `localStorage['dark-mode']`,
  already driven by hCMS's own `?theme=` on initial load) - a real, flagged divergence from the
  reference's own wire behavior, not a silent guess.
- **Built the real, previously-deliberately-unbuilt Floor tab** ("Paramètres anti lag de floor").
  Pulled exact real values from the minified source, not guessed: 3 sliders (max staircases/max
  rectangles/max room width-length), ranges `[0, threshold+1]` where `threshold+1` displays as
  "Infinite" (2048/4096/256 thresholds → slider max 2049/4097/257), reset defaults 512/1024/256,
  persisted to the reference's own exact real localStorage keys (`nitro.floorStairsTreshold` etc,
  their own spelling, confirmed via their own `localStorage.setItem` calls - purely client-side,
  never sent to their server either). **Real, honest gap, flagged not guessed**: this project's
  vendored `@nitrots/nitro-renderer` package has no equivalent floor-complexity-limiting hook at all
  (confirmed via search) - the UI and the persisted value are both real, but nothing yet actually
  caps room-floor rendering complexity when a threshold is exceeded; wiring real enforcement means
  patching the vendored renderer package itself, out of scope for a Settings-UI pass.
- **Built the missing shared primitive this all depends on**: `common/CustomInputRange.tsx`. Live DOM
  proved every slider in this window (volume x3, now Floor x3) uses a fully custom drag/click track
  (`.custom-input-range > .custom-range-track > .custom-range-fill + .custom-range-thumb`), NOT a
  native `<input type="range">` - this file previously used native range inputs for the volume
  sliders, styled via a `.custom-range` class that doesn't even match the real primitive's own
  classname. The CSS for the real primitive was already bulk-extracted (`_30-forms.scss`) but had no
  component using it until now.
- **Corrected mid-pass, given verbatim by the user ("why you build from scratch read claude.md again
  and check the rules"): the FIRST version of `CustomInputRange` hand-rolled its own mousedown/
  mousemove/mouseup drag math from scratch, without first checking `package.json` for an existing
  slider dependency.** `react-slider` was already there, and already used the same way in 4 other
  real components in this project (`CameraWidgetEditorView`, `FurnitureDimmerView`, `WiredControls`,
  `FloorplanOptionsView`) - a real, already-verified "existing implementation" this file's own
  mandatory rule ("SEARCH OUR PROJECT BEFORE CREATING ANYTHING... If the project already has the
  correct primitive, use it. Do not create duplicate systems") exists specifically to catch, and
  which a `common/`-only search missed because the existing usage was in `components/`, not `common/`
  - **the search has to cover actual usages project-wide, and dependencies in `package.json`, not
  just the `common/` folder.** Rebuilt as a thin wrapper around `react-slider`'s own `renderTrack`/
  `renderThumb` API (index 0 = filled portion, index 1 = empty remainder, mapped onto the real
  reference's own `.custom-range-fill`/`.custom-range-track`/`.custom-range-thumb` classnames -
  confirmed CSS descendant selectors still match correctly even though react-slider's own DOM is a
  flat sibling structure, not literally nested the way a byte-for-byte reference capture would show;
  reuse of an already-tested primitive took priority over exact DOM-nesting once the two goals
  genuinely conflicted, consistent with this project's own already-established acceptable-
  approximation precedents elsewhere). Confirmed byte-identical fill percentages against the
  reference's own live capture either way (`24.9878%`/`24.9939%`/`99.6109%` for 512/2048, 1024/4096,
  256/256) - the visual/behavioral correctness was never in question, only the implementation
  strategy. Replaced all 3 volume sliders with this component too, not just used it for Floor.
- **Two more real bugs found and fixed while verifying it, both via computed-style inspection, not
  visually**:
  1. The track computed to `height: 0.796875px` instead of the real `6px`, even with an inline
     `height:6px` override (ruling out a CSS specificity/cascade issue outright, confirmed by testing
     it) - the real cause was a flexbox min-content-size interaction: nested in a flex-column next to
     sibling `<Text>` lines (which have a real, non-zero min-content line-height and resist
     shrinking), this element's own empty-div zero min-content size let the flexbox algorithm crush
     it to near-nothing so the text siblings could fit. `height` alone is only a flex-basis hint, not
     a hard floor. Fixed with `flex-shrink: 0` added directly to `.custom-input-range`'s own rule in
     `_30-forms.scss` (a project-added fix, not a reference-captured value - flagged as such in the
     file itself).
  2. The first (since-replaced) hand-rolled version used React `onPointerDown`/native
     `PointerEvent`s - worked with real mouse hardware but a CDP-simulated `Input.dispatchMouseEvent`
     drag test never triggered it at all (same class of CDP-simulation gap already hit once this
     session with the Wealth chart's dot hover, where `MouseEvent`s worked reliably but synthetic
     pointer dispatch didn't). Moot once rebuilt on `react-slider` (which handles this correctly
     already), but worth remembering for any future custom drag/pointer component in this project:
     verify with `Input.dispatchMouseEvent`, not `PointerEvent`-only handlers, or CDP verification
     will silently give false negatives.
- Also fixed a smaller, real divergence: "Change profile cover"'s own size hint was a guessed plain
  text label (`"452x115"`) where the reference actually shows a real `.icon-navigator-info` icon
  (confirmed live) - swapped to the real icon with a native `title` tooltip standing in for their own
  tooltip mechanism (not traced - same acceptable-approximation precedent as elsewhere in this file).

Deployed: none of this needed a server change (dark mode and floor thresholds are both client-only,
volume sliders reuse the exact same existing composers, checkbox removal touches no wire protocol) -
verified entirely via HMR + live CDP against the dev client.

**Layout/order bug fixed after user report (2026-09-24): "layout spacing order and all is still
wrong".** Traced the whole General tab against a fresh live DOM capture of the reference instead of
re-checking only what was already "verified" - two real, previously-missed structural bugs:
- **The whole General tab content was missing its `.scroll-container`/`.scroll-content` wrapper
  entirely** (confirmed on the reference: title/checkboxes/cover/volume all live inside the same
  real scroll primitive already used elsewhere in this project) - added via `ScrollContainer`, plus
  the real outer `gap-3` (16px) between the 3 top-level groups (was un-wrapped, no gap at all). Fixed
  the Floor tab identically (its own title+content were also missing this wrapper).
- **Cover-upload and Volume sections were in the wrong order.** Confirmed by reading each group's own
  first text content live, in DOM order: "Thème sombre" (checkboxes) → "Changer la couverture de
  profil" (cover) → "Régler le son" (volume) - this file had volume rendering BEFORE cover, a real
  ordering bug, not just a missing wrapper.

**Two more real bugs found and fixed after further reports ("the sliders are broken",
"slider width is too long"), both root-caused via live interaction testing, not assumed fixed from a
structural check alone**:
- **Pointer-events on a fully-filled slider silently ate every click.** `renderTrack`'s first version
  added the real `.custom-range-fill` classname directly onto the SAME div `react-slider` uses as the
  clickable "before thumb" track segment - `.custom-range-fill`'s own real CSS rule sets
  `pointer-events:none` (correct for the reference's own structure, where fill is a separate,
  decorative child nested INSIDE the clickable track, not a dual-role element). Confirmed live via
  `document.elementFromPoint()` resolving to an ancestor container instead of the track whenever the
  click landed in an already-filled region - meaning a maxed-out slider (the common real case: system
  volume defaults to 100) failed 100% of the time, while a partially-filled one worked inconsistently
  depending on exactly where the click landed. Fixed by nesting a separate, purely decorative fill
  child instead of merging the two roles onto one element.
- **The earlier `flex-shrink: 0` height fix (see the Floor-tab section above) broke the sliders' own
  real width-shrink-to-fit behavior.** That fix was correct for the Floor tab's flex-COLUMN context
  (main axis = height) but the exact same class is also used inside the Volume row's flex-ROW context
  (main axis = width there) - `flex-shrink:0` there blocked the slider from shrinking down to make
  room for its sibling icons, so it overflowed past its real width. Confirmed on the reference: its
  own slider has `flex-shrink:1` and shrinks to exactly the row's remaining space (176px of a 230px
  row, after subtracting sibling icons + gaps) - never the full row width. Replaced `flex-shrink:0`
  with `min-height: var(--height)` instead - a hard floor on the specific axis that was actually being
  crushed (height), without touching width/shrink behavior on the other axis at all.

**A real process lesson from this same pass, worth remembering going forward**: after a syntax-error
state occurred mid-edit (a JSX tag-balance mistake while restructuring the General tab), the
dev-client browser tab's own Vite HMR runtime got stuck in a permanently-failed state - the file
compiled successfully again moments later (confirmed via a clean `tsc` and successful subsequent HMR
log lines), but THIS SPECIFIC TAB kept silently running the last-successfully-compiled (i.e., broken)
version of the component, logging `[hmr] Failed to reload ... could be due to syntax errors` once and
then never recovering on its own. Every "still broken" report after that point was 100% real and
reproducible - not user error, not a flaky test - because the live tab genuinely was running stale,
broken code while the source file itself was already fixed. **Whenever a fix is verified as compiling
clean but a live CDP recheck still shows the old broken behavior, check the vite dev log for a
"Failed to reload" line before concluding the fix itself is wrong** - the fix might be correct and
the browser tab might just need a full reload (fresh SSO ticket + fresh tab, per this file's own
established tooling section) to actually pick it up.

**Thumb-overflow bug fixed (2026-09-24), after a further user report ("still overlapping to
right").** A near-max-value slider's thumb extended ~6px past its own column's right edge. Root
cause: the reference's real fix for this is `.user-settings-input-range { padding: 0 8px }`
(confirmed live) - but `react-slider` positions the thumb using its own root's `clientWidth`, and
`clientWidth` **includes padding** (padding never reduces it) - so putting that padding directly on
`react-slider`'s own root (as this file did, matching the reference's literal single-element
structure) has zero effect on the actual computed drag range: the thumb still gets positioned across
the full, unreduced width and poked out past the padded box's own edge exactly as if the padding
weren't there at all. Fixed by moving the padding to a **wrapping** element instead, giving
`react-slider` a genuinely narrower box to measure - its 0%/100% positions then correctly land
inside the reserved overhang room. This introduced two further regressions along the way, both
caught and fixed in the same pass before landing:
- The new wrapper had no explicit width, creating a circular sizing dependency (a flex item with no
  width shrinks-to-fit its child; the child wants 100% of a not-yet-determined parent width) that
  resolved to **zero width** for both elements - fixed by giving the wrapper `width: 100%` (mirroring
  the width rule `.custom-input-range` itself already carried before this wrapper existed).
- A first attempt used `flexShrink: 0` on the new wrapper for crush-protection, which would have
  reintroduced the exact row-context width-overflow bug from the section above - corrected to
  `minHeight` only (matching `_30-forms.scss`'s own established reasoning: floor only the specific
  axis that's actually at risk of being crushed, never disable shrink wholesale).

**A further "still broken"/"overlapping" report after this, root-caused to a test-only false
negative, not a real product bug** - worth documenting since it looked exactly like a regression at
first: re-verifying via CDP showed a drag on the very first (topmost) volume slider silently failing
again. Full diagnosis (`elementsFromPoint`, not just `elementFromPoint`) showed the click coordinate
resolved to an ancestor several levels up, with `.scroll-container` and everything inside it entirely
absent from the hit-test stack - not covered by anything, genuinely not there at that screen
position. Checked `.scroll-content.scrollHeight` vs `.clientHeight`: 321 vs 224, a real 97px
overflow, `scrollTop: 0` - the general tab's own content is taller than its visible scroll window,
and the "first" volume slider sits only ~2px below the visible fold. `getBoundingClientRect()` still
reports its real laid-out position regardless of whether that position is currently scrolled into
view, so a test script blindly computing coordinates from it without scrolling first will click a
point that's genuinely off-screen (covered by nothing, since overflow:hidden content past the fold
isn't painted at all) - this is completely correct, expected scrollable-container behavior, not a
bug. Confirmed two ways before concluding this: (1) calling `.scrollIntoView()` on the exact same
slider first, then re-running the exact same drag test, produced a clean success (100 -> 60 as
intended); (2) checked the reference's own live `scrollHeight`/`clientHeight` at the same card size
and found an even larger real overflow (107px) - HabboCity's own General tab needs the same scrolling
to reach its lower controls. **Lesson for future CDP interaction tests in this project: always call
`.scrollIntoView()` (or otherwise confirm the target is actually within its scrollable ancestor's
visible bounds) before computing click coordinates from `getBoundingClientRect()` - a stale/off-screen
rect produces a silent, convincing-looking false negative that's easy to mistake for a real
regression**, exactly what happened here.

**`CustomInputRange` rebuilt custom (2026-09-24, final), after `react-slider` proved to be the wrong
tool for this specific requirement - given verbatim by the user ("maybe need custom slider") after
several rounds of increasingly fragile workarounds around the same root incompatibility.** The
reference's own real overhang-reservation mechanism is plain CSS: `.user-settings-input-range
{ padding: 0 8px }` on `.custom-input-range` itself, relying on the browser's normal box model (an
absolutely-positioned child's percentage position resolves against its parent's padding box, which
correctly excludes padding automatically - no library involved). `react-slider` doesn't use that
mechanism - it computes thumb position from its own root's `clientWidth` in JS, and `clientWidth`
**includes** padding, so the padding-based technique the reference itself depends on had no way to
actually take effect through that library, regardless of which element the padding/width fixes were
moved onto (tried on the slider root directly, then a wrapping element - the wrapper approach fixed
the overflow but needed extra `width`/`minHeight` workarounds and briefly introduced a real
zero-width regression along the way, both documented in earlier passes above and now moot).

Rebuilt as a plain hand-rolled implementation, single-level structure exactly matching the reference
(`.custom-input-range` carrying the real padding class directly, `.custom-range-track` as an
ordinary child, no extra wrapper needed) - `getBoundingClientRect()` on the TRACK element (not the
padded root) naturally already reflects the parent's padding-box-inset position via normal DOM
layout, so drag/click math needs zero padding-awareness of its own; this is the same real mechanism
the reference's own CSS depends on, not an approximation of it. Applies every lesson learned across
the earlier attempts in this same pass: `MouseEvent` handlers (not `PointerEvent` - confirmed
unreliable under this project's own CDP-driven verification, same gap hit with the Wealth chart's
dot hover), `min-height` for crush-protection (not `flex-shrink:0`, which would block the volume
row's real width-shrink-to-fit behavior - see the dedicated section above for the full reasoning).

Verified end-to-end via a single atomic CDP test covering everything reported broken across this
whole pass: opened Settings fresh, scrolled the first General-tab volume slider into view (the
earlier "still broken" report turned out to be a scroll-position test artifact, not a real bug - see
the dedicated section above), confirmed the click landed directly on `.custom-range-track` (no
occlusion), dragged it from 20% to 60% and got exactly `fillWidth:"60%"`/`thumbLeft:"60%"` back, then
switched to the Floor tab's near-max (99.6%-filled) size-threshold slider and confirmed its thumb
overflows neither its own track nor the card - the exact failure mode originally reported ("still
overlapping to right"). All three real, distinct bugs from this whole pass - pointer-events blocking
clicks on a filled region, thumb overhang past the container edge, and the underlying react-slider/
padding incompatibility that made both hard to fix cleanly - are resolved by this rebuild in one
consistent, reference-matching mechanism.

**Two smaller real bugs fixed in the same pass (2026-09-24):**
- **Volume row gap was wrong** (`gap={1}`/4px instead of the reference's real `gap-3`/16px),
  confirmed via a direct width comparison against the reference in an identical 230px-wide row - the
  smaller gap let the slider (which fills whatever space its sibling icons don't) claim 12px more
  than it should have (197px vs the reference's real 176px). Fixed to `gap={3}` on all three volume
  rows; slider width now reads exactly `175.96875px`, byte-identical to the reference's own live
  capture.
- **The "Change profile cover" info icon's `title` tooltip was an invented behavior - corrected
  twice.** First pass: guessed a native `title` attribute. Second pass: two live interaction tests (a
  real click, then a real CDP mouse-move hover) both came back with zero observable effect, so the
  `title` was removed entirely, wrongly concluding this icon was inert like `.icon-rooms`/the outfit
  editor's `FaRecycle`. **Both tests were wrong** - the real mechanism only surfaced by reading the
  component's own source directly (`"BU"` in the minified bundle): a real `onMouseOver`/`onMouseLeave`
  state toggle driving a `react-bootstrap` `Overlay`/`Popover` (`show`/`target`/`placement="right"`),
  the exact same already-established pattern this project already uses for the same `icon-navigator-
  info` class in a different context (`NavigatorSearchResultItemInfoView.tsx`, byte-identical prop
  shape). Real content, previously entirely unknown: a bold "Ideal size:" label next to the plain
  size value, then a second bold line about animated images ("Only the first frame of an animated
  image is used.") that no earlier pass had ever found. Built `UserSettingsCoverInfoView.tsx` reusing
  the exact established `Overlay`/`Popover` pattern (an already-vendored `react-bootstrap` dependency,
  not new) - verified live via a real CDP hover: `.popover` appears with the exact real text
  (`"Ideal size: 452x115Only the first frame of an animated image is used."`).

## Friends List pass (2026-09-24) — real mechanism was wrong, full rebuild

`FriendsListView.tsx` used an **accordion** (`NitroCardAccordionView`/`NitroCardAccordionSetView` -
expandable stacked sections for Online/Offline/Requests/Search) - a fundamentally different real UI
mechanism than the reference, confirmed via live DOM + the minified source together (the exact "wrong
mechanism entirely" case this file's own rules call out: don't CSS-patch a wrong structure, reverse-
engineer the real one). The reference's real "Amis" window is a top search bar (the same
`.holo-main-search-bar-input-element` primitive already used elsewhere) plus **4 real tabs** ("En
ligne"/"Hors ligne"/"Requêtes"/"Rechercher", `nitro-card-tabs small`) sharing one scrollable content
area below - confirmed both live and via the minified source's own tab-index switch
(`m===0`..`m===3`).

**Real findings, not guessed:**
- `SearchBar` (`common/SearchBar.tsx`) already exists in this project and is already byte-identical
  to the reference's own real search-bar component (`iconClass`/`color`/`value`/`onChange` props,
  same `.holo-main-search-bar-input-element` markup) - just never wired into this feature. No new
  primitive needed.
- The Online/Offline tabs and the Search tab **share the same top search bar value** - confirmed via
  the minified source (`m===3&&t(gL,{searchValue:g})`, the identical `g` state used to filter the
  friend lists). This file previously had a second, independent search input duplicated inside the
  Search tab's own accordion section - removed; `FriendsSearchView` now takes `searchValue` as a
  prop from its parent instead.
- Real per-friend row (`.nitro-friend-list-entry`) has a **genuine full character avatar render**
  (`.avatar-image-container > .avatar-image`) next to the name, not just the small
  `icon-profile-sm` sprite button this file already had correctly - that sprite is a separate
  click-to-view-profile button alongside chat/relationship icons, not a replacement for the avatar.
  Added via `LayoutAvatarImageView` (already used elsewhere in this project, e.g. the Wealth tab's
  cover-crop preview), rendering `friend.figure` (a real field `MessengerFriend` already exposed,
  just never rendered here).
- Row selection is click-anywhere-on-the-row (a `bg-primary text-white` highlight), not a checkbox -
  this file's own pre-existing `selectFriend`/`selectedFriendsIds` logic already matched this exactly
  (only the wrapping wrapper element - `NitroCardAccordionItemView` swapped for a plain `Flex` with
  the real `nitro-friend-list-entry` classname - needed to change, confirming the underlying
  selection/room-invite/remove-friend logic in this file was already correct and didn't need
  rewriting, only its container).
- Real root theme is `theme-primary-slim` (this file previously had a non-existent
  `theme="friends"`, which would have resolved to a dead `theme-friends` CSS class with no matching
  rule) with `resize="both"` (confirmed via the live `.resize-handler` present on the reference's own
  window - this project's own `NitroCardView` already supports both, just wasn't passed here).

Applied the same fix to `FriendsListRequestItemView.tsx` (rule 5 - same class of accordion-wrapper
bug in a sibling component) and rebuilt `FriendsListRequestView.tsx`/`FriendsListSearchView.tsx` to
take their data as plain props from the new tab-based parent instead of rendering themselves as
accordion sections. `FriendsListGroupView.tsx`/`FriendsListGroupItemView.tsx`'s own internal
selection/follow/relationship-picker logic was left untouched - only the outer wrapper changed.

Verified live on the dev client: real search bar renders with the correct theme color
(`rgb(145,128,255)` = `#9180FF` = `--holo-friends-color-theme-primary`, confirmed against this
file's own already-captured dark-mode token sheet), all 4 tabs switch correctly, a real friend entry
renders with a genuine avatar image, and no console errors during the full interaction (tab
switching, opening each tab). **Not yet done**: the Messenger/private chat window - a separate,
larger investigation, next up per the user's own explicit request for both in the same pass.

## Purse currencies (2026-09-24) — attempted, reverted per user ("leave it just keep credits for now")

User asked to add hCMS's own real currencies (beyond stock HabboCity's activity points) to the
purse - real registry found in `hCMS/app/Domain/Economy/Support/CurrencyType.php`
(`Duckets=0`/`Diamonds=5`/`CityCash=12`/`GamePoints=101`/`NftPoints=104`; `RewardType.php` confirms
"Emeralds" is the real display name for `GamePoints`). Added `5`/`12`/`101` to
`system.currency.types` plus real icon assets reused from hCMS's own existing art
(`icon_emeraude.png`/`money_citycash_25.png`) copied into the `wallet/` icon folder.

**Live-verified real bug found before the revert**: Diamonds and Emeralds displayed correctly with
real live balances, but **CityCash (type 12) never appeared at all, despite the account genuinely
holding 776,386 of it** (confirmed directly in `users_currency`) - types 1/2/3 (zero rows for this
account) still rendered as "0", so this wasn't "no data shows nothing" - type 12 specifically drops
somewhere in the sync chain despite real data existing for it. A background investigation into the
root cause was started then abandoned per the user's own explicit call to stop and revert instead of
chasing it now - **the CityCash-specific sync gap is real and still unresolved**, flagged here for
whenever this is picked up again.

**First reverted to just the original `[1,2,3]` stock types, then corrected again per direct
follow-up ("no keep diamomdf emeralds credits"): final state is `system.currency.types: [5, 101]`**
(Diamonds + Emeralds only - "credits" itself is always shown separately, hardcoded outside this
config array in `PurseView.tsx`). CityCash stays excluded given its real, unresolved sync bug above.
Re-added the Emerald wallet icon (`wallet/101.png`) that had been deleted during the brief full
revert. Live-verified on the dev client: purse shows exactly 3 entries - Credits (2,485), Diamonds
(1,049,020), Emeralds (998,226) - nothing else.

**Do not report the full mandate as complete.**

## Reusable prompt — hand this to a fresh session to continue correctly

> Read `nitro-react-Wired/CLAUDE.md` in full before doing anything else — it has the exact strict
> protocol you must follow (HabboCity is read-only, DOM/computed-style-verified component-by-
> component work only, full feature parity not just CSS, no bulk/mechanical rewrites, no
> duplicate systems, rule 7's hook-ordering-registration bug class and "a symptom clearing up is
> not a finished fix" discipline), the tooling that actually works on this box (`eval-in-iframe.js`
> for reading the real client DOM through its cross-origin iframe, the `yarn start` + HMR dev loop,
> SSO-ticket minting, `dump-network-body.js` for pulling the reference's own minified bundle,
> `yarn deploy` for anything going live), and a precise account of what's already been
> verified-and-fixed vs. what's still an unverified assumption. Do not skip straight to writing
> code — inventory the real reference component first, exactly as the protocol demands, even
> under time pressure. **As of 2026-09-23: User Profile now has all 4 real tabs built** (Groups,
> Rooms - fixed twice this session (header/toggle structure, then a real server-side navigator-
> filter routing gap), Photos - fixed (hook-ordering bug, then three more real bugs found by going
> back through the chain per rule 7), Wealth - just built, deployed, boot-verified, but **not yet
> live-CDP-verified on the dev client and the user has already flagged it as not matching 1:1** -
> this is the immediate next step, not a finished feature. Also fixed this session: the profile
> header's own container-direction bug (banner/data were a row, should be a column - see "Profile
> header structure fixed" above). Read every "Real, honest gaps, flagged not guessed" callout before
> assuming any of the above is complete. Past that, pick up from "Full feature inventory — still not
> done" for the next real chunk of work, or ask the user which surface to prioritize.
