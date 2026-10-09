# 🚨 EXECUTION CONTROLLER — MANDATORY

> **Moved here from `CLAUDE.md` on 2026-10-01** (unchanged). Start with `PROJECT_WORKFLOW.md` (repo root). This file
> (~620 KB) is project state and history; append new dated sections at the end. **Do not load it whole.** Grep its `## ` headings and keywords, then read only
> the matching sections (keyword list in PROJECT_WORKFLOW.md §3). Newest dated sections win over older ones. Current
> code wins over this file.

Before touching code, read this controller and the sections relevant to your task (see above).

## THIS FILE IS LIVE DOCUMENTATION — KEEP WRITING TO IT, EVERY SESSION, NOT JUST AT THE END

**Given verbatim, 2026-09-27, after a large amount of real feature work (Commands, Mentions, Event
Alert, Help menu, Bots panel, a Room Settings rework, username styling — see that section further
down) sat in the working tree fully uncommitted and completely undocumented here, across several
days, until a session noticed the gap by accident.** That is exactly the failure this rule exists to
prevent, and it is a standing rule from now on, not a one-time cleanup:

- **Write to this file as you go, continuously, not only when asked for a "handoff."** Every time a
  real component/feature/protocol is built, fixed, investigated, or found to have a gap, add or
  update a dated section here in the same style as the rest of the file — what was found, what's
  `VERIFIED` vs. code-level-only vs. genuinely unknown, what's still open. Don't wait until the end
  of a long session to write it all up in one pass, and don't rely on the conversation transcript
  alone to carry that information forward — the transcript is not visible to the next session,
  this file is.
- **Every new file, every new protocol/opcode pair, every new component gets a real entry before
  the session ends** — even a short, honest "built this, wired it up, compiles, NOT yet CDP-verified
  against a live reference" entry is far better than silence. Silence is what caused the gap this
  rule is written to prevent: undocumented work isn't just "not written up," it's work a future
  session (or the user, weeks later) has no way to know exists, no way to know is incomplete, and no
  way to know what was already tried.
- **Update the "Reusable prompt" section at the very end of this file whenever the real current
  focus changes** — not just at the end of a session. That section is what a fresh session reads
  first to know what to pick up; letting it go stale is the same class of failure as not documenting
  new work at all.
- **This applies regardless of effort/time pressure, and regardless of whether the user explicitly
  asks for a write-up in that specific message.** Documenting real work here is not a favor to ask
  for each time — it's a standing, default part of doing the work itself, the same way the CDP
  verification chain is not something to skip under time pressure.

## COLOURS FOR OWN-FEATURE WINDOWS: ALWAYS THE THEME TOKENS (standing rule, user-mandated 2026-09-27)

Given by the user after the first Furni Editor build rendered black text on dark inputs and white text on pale
"disabled" buttons: **every new own-feature window must get the right colours automatically from the theme's CSS base.
Never hand-pick colours, and never rely on Bootstrap defaults.**
- Base Bootstrap `.form-control` / `.form-select` are black-on-white (`holo/_08-forms.scss`). HabboCity only re-themes
  them **inside specific windows** (e.g. `.nitro-wired`, `.nitro-infostand`), so an own window that uses plain
  `form-control` gets unreadable black text on the dark card. **Fix pattern:** give the window a root class and a small
  scoped stylesheet (listed in `src/components/index.scss`, which is own features only) that maps controls to the
  tokens in `holo/_tokens.scss`: text `var(--holo-text-primary)`, field/box background `var(--holo-secondary)`,
  borders `var(--holo-border-color-primary)`, hover `var(--holo-primary)`, selected/checked `var(--holo-tertiary)`,
  muted text `var(--holo-text-muted)`, radius `var(--holo-border-radius)`. These swap automatically between
  `body.dark-mode` and light. Reference implementation: `src/components/furni-editor/FurniEditorView.scss`.
- Buttons: use the existing `Button` variants (`primary` #22abd6, `secondary`, `success` #52bc48, `warning` #eeb80e,
  `danger`, `dark`, from `holo/_63-buttons.scss`). A **disabled** button renders pale with white text (unreadable), so
  show "OK/matches" states as text (success green), never as a disabled button.
- No `bg-primary` / `text-black` / `text-white` Bootstrap utilities for colour in own windows; use the tokens.
- **Verify with computed styles** (CDP `getComputedStyle` on the live dev client) that text and background differ
  (e.g. white on `rgb(21,26,35)` in dark mode) before calling a window done. This rule is about *own* features;
  HabboCity-ported components still follow "no new CSS, fix the DOM/classnames".

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

## Mentions ("@name") pass + editing-rights full revert (2026-09-27)

**RULE: `Arcturus-Community-Wired` (the emulator core) is never edited, ever — only
`hcms-emulator-plugin`.** Given verbatim by the user this session after investigation strayed into
reading (never editing) core source. Confirmed against `hCMS/CLAUDE.md`'s own "GitHub, and the
emulator/client repos" section: `Arcturus-Community-Wired` and `nitro-react-Wired` are both read-only
clone+fork pairs kept for reference/analysis; every real, live custom-logic change for this whole
stack belongs in `hcms-emulator-plugin` (Java) or this client repo, never in core. Reading core is
fine and often necessary (e.g. to find a real packet header, a real event name, a real plugin-hook
point) — editing it is not, with the one pre-existing, already-approved exception documented
elsewhere in this file (the `PermissionsManager` badge-slot cap fix). Treat this as standing, not a
one-off caution for whichever investigation triggered it.

**Editing-rights enforcement feature fully reverted** (both the client-side `isEditRights` property
layer and the server-side `EditingRightsGuard` drag-revert layer built earlier this session) — the
user's explicit call, given twice ("revert the edit room things rights", then separately "revert
fully the edit rights for isOwner also why you kept that" after a first pass left one piece behind).
Reverted, in full:
- `hcms-emulator-plugin`: deleted `roomsettings/EditingRightsGuard.java` and
  `roomsettings/RightsModeSetEvent.java`; removed opcode `9565`/its registration from
  `RoomSettingsProtocol.java`; removed the three `@EventHandler` methods
  (`onEditingRightsFurnitureMoved/Rotated/UserDisconnect`) from `HcmsPlugin.java`. Rebuilt, deployed
  (stop → copy jar → restart), boot log confirmed `RoomSettingsProtocol registered
  (9555/9556/9557/9558)` with no `/9565`.
- Client: deleted `api/nitro/session/RoomSessionEditRights.d.ts`; removed `isEditRights` from
  `CanManipulateFurniture.ts` and `useCatalog.ts` (back to plain `isRoomOwner`/`controllerLevel`
  checks); removed `RightsModeSetComposer`/opcode `9565` from `RoomSettingsProtocol.ts`; removed the
  `RegisterRoomSettingsMessages()` call, the room-entry `isEditRights = true` effect, and the
  composer sends from `RoomToolsWidgetView.tsx`'s `toggleRightsMode` (the toggle now only calls
  `roomSession.setControllerLevel(...)`, nothing else).
- **`InfoStandWidgetFurniView.tsx`'s furni Move/Rotate gate was ALSO part of this revert**, not a
  separate standalone fix, despite an earlier note in this file describing it as "confirmed against
  HabboCity's own real client source" — the user's explicit instruction was to revert it fully
  regardless: restored the original `isValidController || avatarInfo.isOwner ||
  avatarInfo.isRoomOwner || avatarInfo.isAnyRoomController` gate (dropped the
  `roomControllerLevel !== GUILD_MEMBER` exclusion that came with the isEditRights work). **Lesson**:
  when a fix is built *during* an investigation into a feature that later gets reverted, don't assume
  it survives the revert just because it cited independent justification — ask, or revert it too and
  let the user say if they want it re-applied on its own.

**Chat input / mentions — what stayed vs. what got reverted, in the same pass:**
- **Kept**: `ChatWidgetMessageView.tsx`'s rewrite from canvas-rendered `TruffleChatText` to plain HTML
  (`<b className="username">` / `<span className="message">`, matching HabboCity's real decompiled
  DOM) — sender name colored only, no underline/click (that was a wrong guess, corrected). New
  `ChatMessageTextView.tsx`/`MentionSpan` colors `@name` tokens *inside* a message body via the same
  rank-color mechanism as the sender name, and makes them clickable to open that user's profile —
  the mentioned user, not the sender, per explicit correction. `useChatInputWidget.ts`: `@name` with
  no trailing message now sends instead of showing a client-side "Usage:" error (the plugin's own
  `MentionStore.deliver()`/`deliverGroup()`/`deliverOffline()` no longer bail out on an empty
  message either — this half **is** a real plugin change, kept, unrelated to the reverted rights
  work). An embedded, non-leading `@name` (e.g. "hey @Phi") is salvaged as a real mention only when
  there's no room to send normal chat to — normal in-room chat with a non-leading `@name` still just
  gets the cosmetic inline color, not a real ping, by design.
- **Reverted**: an attempt to make `ChatInputView` always-mounted (moved to `MainView.tsx`, toolbar's
  own `.inactive` class relaxed to not hide on the landing view) so mentions could be typed with no
  room — the user's explicit call ("no dont always show the chatinput thats wrong" / "revert that
  chat input change"), because HabboCity's own real CSS genuinely hides that whole toolbar section
  whenever `!roomSession` (confirmed earlier via their real stylesheet) and this project's own 1:1
  mandate wins over the custom feature's convenience. `ChatInputView`/`RoomWidgetsView`/`ToolbarView`
  are back to their exact original room-gated form. **The user separately stated mentions from the
  landing view were already reachable before this change, via a mechanism not identified this
  session** — flagged, not explained; don't assume the always-mount approach was the only way to
  achieve it, and don't re-attempt it without asking first.
- Also removed, per explicit request, unrelated to any of the above: the `icon-wired-tools` toolbar
  icon and its now-dead `canOpenWiredTools`/`showWiredToolbar` state/effect in `ToolbarView.tsx`.

**Real, live investigation into "text before @name fires nothing" (e.g. "hey @Phi") — root cause
NOT found, ruled out two real, concrete server-side candidates via actual DB/source inspection, not
guessed:**
1. `RoomUserTalkEvent.java` (Arcturus core, read-only) fires a cancellable `UserTalkEvent` plugin
   hook before ever broadcasting a room chat message — if any listener cancels it, the message is
   dropped with zero client-side error, which would look exactly like this report. The only
   registered listener is `HcmsPlugin.onBotUserTalk` → `BotManager.onRealPlayerTalked`, which never
   calls `setCancelled` and returns immediately anyway since bots are disabled
   (`hcms.bots.enabled=0`, confirmed live in boot log). **Ruled out.**
2. `RoomChatMessage.filter()` (core) can silently blank a message (`this.message = ""`) via the
   database-driven word filter when `hideMessageCheck()` matches, gated by
   `hotel.wordfilter.enabled`/`hotel.wordfilter.rooms` (confirmed both `=1` in the live `hcms` DB via
   direct `mysql.exe` query — the filter is genuinely active). Checked the actual `wordfilter` table
   contents directly: exactly one row (`com` → `bobba`, `hide=0/report=0/mute=0`), `room_wordfilter`
   empty. Nothing "@"-related, nothing configured to hide/mute. **Ruled out.**
3. A direct CDP test against the live dev client, same session, current (post-revert) code, sending
   the literal text "hey @Phi" via the real chat input, produced a real, correctly-rendered chat
   bubble with `@Phi` correctly rank-colored — i.e. the reported bug did not reproduce here. Given
   this session did many full-page reloads and several reverted-then-reapplied edits to
   `useChatInputWidget.ts` in a short window, a stale HMR/browser state on the reporting side is the
   leading unconfirmed suspicion, not a code bug in the current state. **If this resurfaces**: get a
   real hard reload (not just HMR) first, and get the exact literal text and exact mentioned username
   typed, not a paraphrase — "text before @username" alone isn't enough to reproduce from, per this
   session's own back-and-forth.

## Mentions follow-up: real ping for embedded @name, no duplicate resend, hotel-wide colour (2026-09-27)

**Resolves item 3 of the "text before @name fires nothing" investigation above** — the report turned
out to be three separate, real, now-fixed gaps, not a phantom/stale-bundle issue as that entry's own
leading suspicion guessed. Given verbatim, in order, across several short corrections:

1. **"it shows bubble but the mention isnt triggered"** — an embedded, non-leading `@name` (e.g. "hey
   @Phi") was only ever getting the cosmetic in-message colour from `ChatMessageTextView.tsx`, never
   a real mention/ping, because `useChatInputWidget.ts`'s embedded-mention regex only ran in the
   `catch` block (i.e. only when there was no room to chat in at all). **Fixed**: the embedded-mention
   check now always runs, independent of whether normal room chat also succeeds — typing "hey @Phi"
   in a room now produces both the real chat bubble *and* a real mention to Phi.
2. **"it resends in different way"** — once (1) was fixed, `MentionStore.deliver()`'s own
   room-chat echo (`sender.talk("@name message")`, needed for a *pure* leading mention which has no
   other visible trace in the room) became a genuine duplicate: the real chat message ("hey @Phi")
   and the mention system's own reformatted echo ("@Phi hey") both landed in the room for the exact
   same embedded case. **Fixed** with a new `silent` boolean threaded through the whole delivery
   chain: `SendMentionByNameComposer(name, message, silent)` (client, `MentionProtocol.ts`) →
   `SendMentionByNameEvent` (server, reads the new boolean) → `MentionStore.deliverByName/deliver/
   deliverGroup/deliverOffline(..., silent)`, each skipping its own `talk()` echo when `silent` is
   true. The client passes `sentAsRoomChat` as this flag — true exactly when real room chat already
   covered the announcement, so the server never re-broadcasts it a second time. A pure leading
   `@name` still passes `false` (unchanged, still gets its own real room announcement, since that's
   the only visible trace it has).
3. **"username color get it from same like profile so user dont need to be in a room to have it
   work"** — `MentionSpan` (`ChatMessageTextView.tsx`) only ever resolved a mentioned name's rank
   colour via the *current room's own* `userDataManager.getUserDataByName(name)`, so it silently fell
   back to "no colour" for anyone not physically co-located with the sender (a different room, the
   landing view, offline). **Fixed** with a new hotel-wide by-name identity lookup, deliberately
   reusing the exact same underlying data (`ProfileIdentity`) the profile card and the existing
   by-id `IdentityProtocol` (9559/9560) already serve — not a separate, parallel colour system:
   - Server (`hcms-emulator-plugin/identity/`): new `IdentityByNameRequestEvent`/
     `IdentityByNameDataComposer`, opcodes `9566`/`9567` (`IdentityProtocol.java` now registers
     both pairs). Resolves each requested username to a real user id — online first
     (`HabboManager.getHabbo(name)`), then a DB fallback (`SELECT id FROM users WHERE username = ?`)
     — then calls the same `ProfileIdentity.of(id)` the id-based path already uses. Because
     `ProfileIdentity.of()` is a pure DB+online-status read with no room dependency at all, an
     offline user's real rank colour/VIP badge comes back correctly too, per the user's own explicit
     follow-up ("keep the badge around like when user is offline") — this was already true by
     construction, not a separate fix.
   - Client: `UserIdentityProtocol.ts` gained the by-name composer/parser/event pair
     (`UserIdentityByNameRequestComposer`/`UserIdentityByNameDataEvent`, keyed by lower-cased name);
     new hook `useUserIdentityByName.ts` (`hooks/session/`) mirrors `useUserIdentities.ts`'s own
     batched/deduped-request pattern exactly, just keyed by name instead of id. `MentionSpan` now
     tries the room-local lookup first (fast, no round trip, unchanged for the common case), and
     only calls the new by-name hook when that comes back empty — `useUserIdentityByName(roomWebId ?
     '' : name)`, relying on the hook's own empty-string no-op guard to avoid firing a request when
     the fast path already resolved it.

Plugin rebuilt and redeployed (stop → copy jar → restart) for both this section's changes; boot log
confirmed `IdentityProtocol registered (9559/9560/9566/9567)` and no `MentionProtocol` regressions,
both live-verified.

## Commands / Mentions / Event Alert / Help menu / Bots panel / Room Settings rework / username
## styling (2026-09-27 write-up — this whole feature set existed uncommitted, undocumented, in the
## working tree before this entry; the entries below are a code-level inventory built by reading the
## actual source, not a record of live CDP verification — see the "NOT yet verified" callouts)

**Why this section exists**: at the start of this session the working tree already had a large set
of new/modified files (spanning file-modified-dates 2026-09-19 through 2026-09-27) for a real
feature set — none of it was ever written up in this file, which breaks this project's own standing
convention of documenting everything here. This entry is that missing write-up, reconstructed by
reading every new/changed file directly (per this file's own "OBSERVE, don't guess" rule), not by
trusting file/function names. **Do not treat anything below as CDP-verified against a live
reference** unless a line explicitly says so — most of it is "read the code, confirmed it's wired
together and compiles," which is a real, useful status, but a different and weaker claim than this
project's usual DOM/computed-style/JS verification.

**A real, unresolved naming inconsistency worth checking first, not smoothed over**: comments in
this new code cite at least three different reference names for what is supposedly one consistent
UI convention — `CommandListProtocol.ts`/`CommandsView.tsx` say **"habbo.st"** ("Your commands" /
"Deine Befehle" window), `HelpMenuView.tsx` says **"HabboCity's help windows"**, and
`UsernameStyle.ts` cites **"ltdws" / `ProfileHelpers.php`** (an hCMS-side PHP reference, not a
client). Either these are genuinely three different real reference points deliberately blended for
this own-feature work (plausible — the Commands/Mentions/Bots suite is an **hCMS-specific feature
set**, not a HabboCity port, so it may legitimately draw from habbo.st and hCMS's own PHP rather than
HabboCity), or one of these citations is simply wrong/stale. Not resolved this pass — flagged for
whoever verifies this feature set live, per this file's own "if source and observation disagree,
investigate further, never just pick one side" rule.

**1. Commands system** (`api/commands/`, `components/commands/`) — own-feature (habbo.st-style, not
HabboCity), all three pieces registered synchronously in their component body before their own
`useMessageEvent` (rule 7's hook-ordering fix applied correctly from the start in all three, not
retrofitted after a bug):
- `CommandListProtocol.ts` (9544 request / 9545 data) + `CommandsView.tsx` — the "Your commands"
  window opened by the server's reply to typing `:commands` (wired in `useChatInputWidget.ts`'s own
  `:commands` case → `CreateLinkEvent('cmdhelp/command')`, which `HelpMenuView` picks up and renders
  as `CommandListView`, not `CommandsView` directly — **these look like two separate, redundant
  command-list UIs** (`CommandsView.tsx`'s own category-select dropdown version vs. `HelpMenuView`'s
  `CommandListView` + static `HELP_COMMAND_SECTIONS`) that were never reconciled into one. Confirm
  live which one the reference/server flow actually surfaces before touching either — this smells
  like an in-progress duplicate, not two intentionally-different features.
- `CommandConfirmProtocol.ts` (9561/9562) + `CommandConfirmView.tsx` — an irreversible command
  (`:emptyfriends`, `:deletegroup`, etc.) asks for a yes/no confirm before the server runs it. Simple,
  mounted in `MainView.tsx`, self-contained.
- `ListConfirmProtocol.ts` (9563/9564) + `ListConfirmView.tsx` — **this is the thread the user picked
  to continue right now.** A deletion touching more than one real thing (friends, furniture on a
  tile, …) opens a searchable, checkbox-per-item list (all ticked by default, matching the old
  "delete everything" behaviour); untick what to *keep*, confirm sends only the ticked ids back.
  Code reads complete and self-consistent (search filter, All/None buttons, `ScrollContainer` reused
  correctly, count readout) but **nothing here has been checked against a live reference or a real
  server round-trip this pass** — no confirmation exists that `hcms-emulator-plugin`'s own
  `commands/ListConfirm.java` (cited in the file's own comment, 9563/9564) actually exists/matches
  this wire shape, that a real multi-item deletion scenario was ever triggered end-to-end, or what
  the reference's own real window looks like DOM/CSS-wise (this was built without a captured
  reference DOM at all, going by the total absence of any classname/CSS work in `ListConfirmView.tsx`
  — it's plain `Button`/`Flex`/native `<input>` markup, no dedicated `.list-confirm-*` stylesheet
  section exists anywhere in `src/assets/styles/holo/`). **This is the concrete next step**: find
  whether a real reference window for this exists anywhere (HabboCity, habbo.st, or hCMS's own admin
  UI) before assuming the current plain-Bootstrap-ish markup is correct, then do a real end-to-end
  test (trigger an actual multi-item deletion server-side, confirm the window populates, confirm
  the right ids come back).

**2. Mentions** (`api/mentions/MentionProtocol.ts`, 9552/9553/9554) — this is a **continuation** of
the mentions work already fully documented above (see "Mentions ('@name') pass" and "Mentions
follow-up" sections earlier in this file) — not new/undocumented itself, just grouped here because
it shares this session's file-timestamp cluster. No new gap found beyond what's already recorded
there.

**3. Event Alert** (`api/eventalert/EventAlertProtocol.ts`, 9551 in, no outgoing composer registered
— purely server-pushed) + `components/event-alert/EventAlertView.tsx` — a left-side card shown when
someone hosts an event via `:eha` (per the file's own comment), sharing the same `.nitro-left-side`
container this file's own Phase 1 DOM map (way above) already identified as real and previously
empty on the landing view. Renders via the new `HtmlDsl` component (see below) for the description
text and a real "goto room" button (`CreateLinkEvent('navigator/goto/' + roomId)`, the same helper
`NavigatorView`'s "Somewhere new" already uses). **Not verified against a live reference** — no
confirmation this pass that `:eha` exists server-side, what a real event-alert card looks like on
habbo.st/HabboCity, or that `image.library.notifications.url` config key actually resolves to a
real asset.

**4. `HtmlDsl` component** (`common/HtmlDsl.tsx`) — a real, carefully-built whitelisted-tag renderer
for rich text (bold/italic/underline/font/color/gradient/animated "effect" spans/lists/links), used
by the Event Alert description and (per its own doc comment) modeled on "the reference's own
HTMLDSL" tag builder functions. The `<a>` tag handling is a real, deliberate security-conscious
choice worth noting: only `https://` URLs with no embedded credentials/custom port pass validation
(`httpsUrl()`), and clicking always goes through a `showConfirm` "you are about to leave" dialog
before `window.open` — this is more defensive than a bare tag-to-DOM mapping would be, a reasonable
own-addition on top of whatever the real reference does (not confirmed either way whether the real
client has this same confirm step). **Not verified against a live reference** — the tag set and
attribute names are asserted from a code comment ("the reference's own HTMLDSL... build functions"),
never cross-checked against an actual habbo.st/HabboCity bundle this pass.

**5. Help menu** (`components/help/HelpMenuView.tsx`, `HelpCommandData.ts`, `HelpAvatarListView.tsx`)
— a link-tracker-routed window family for `cmdhelp/<window>` URLs (`help`/`command`/`enable`/
`handitem`), reachable via `:help`, `:help enable`, `:help handitem`, `:commands` (all wired in
`useChatInputWidget.ts`). `HelpCommandData.ts` is a **12.7KB static data file** (command name +
description strings) — not read in detail this pass; worth a real check for accuracy/completeness
against the actual command set this hotel supports (several real commands exist in
`useChatInputWidget.ts`'s own `sendRoomChat` switch — `:shake`, `:rotate`, `:d`/`:kiss`/`:jump` VIP
gates, `:pickall`, `:ejectall`, `:build`, `:wired`, `:floor`, `:togglefps`, `:settings`, etc. — cross-
referencing that switch against `HelpCommandData.ts`'s own entries would catch any command that's
real but undocumented in the help window, or documented but no longer real). `HelpAvatarListView.tsx`
(the `enable`/`handitem` windows) was **not read this pass at all** — genuinely unknown state.

**6. Mod Tools Bots panel** (`api/bots/BotPanelProtocol.ts`, 9546-9550, +
`components/mod-tools/views/bots/ModToolsBotsView.tsx`, 32KB) — a large staff-only bot-management
panel (create/enable/disable/delete bots individually or in bulk, builder mode, room templates with
a detail view listing furniture/tile counts, chat/dance/learn/build behaviour tuning, per-bot
friend/relationship settings). The protocol file alone implies a genuinely large feature surface
(30+ distinct `BotPanelAction` variants). **`ModToolsBotsView.tsx` itself was not read this pass** —
given its size, treat its actual UI/behaviour as completely unverified until someone reads it
directly; do not assume the protocol file's own shape (which is real and readable) tells you anything
about whether the UI built on top of it is complete, correct, or matches any reference.

**7. Username styling** (`api/user/UsernameStyle.ts`, `UserIdentityProtocol.ts` — 9559/9560 by id,
9566/9567 by name — `common/UsernameView.tsx`) — a shared "rank colour + glow + optional staff
background gif, or gold for a plain VIP" style, reused by the mention cards (already documented in
the Mentions sections above) and now factored into a standalone `UsernameView` span component for
reuse anywhere a name is shown. Real, deliberate design point in the code comment: this mirrors
hCMS's own `ProfileHelpers.php` (`profile_rank_username_style`/`profile_vip_username_style`), i.e.
this is explicitly an **hCMS-server-driven** style, not something scraped from HabboCity/habbo.st's
own client CSS — consistent with rule "our own existing code is the logic reference," but worth
remembering this one specifically is *styling* driven by our own server data, not a DOM/CSS port.
**Not verified**: whether `UsernameView` has actually been swapped in anywhere yet beyond the mention
cards (a project-wide grep for remaining plain `<Text>{name}</Text>` name renders that should use it
was not done this pass).

**8. `CollapsibleArea`** (`common/CollapsibleArea.tsx`) — new shared primitive (chevron-toggle
header + mount-only-while-expanded content), used so far only by the Help menu's command-list
sections. Per this file's own "search before creating anything" rule: worth checking whether this
duplicates or should replace any existing accordion-like pattern elsewhere in the project (the
Friends List rebuild earlier in this file explicitly moved *away* from
`NitroCardAccordionView`/`NitroCardAccordionSetView` because that was the wrong mechanism for that
component specifically — `CollapsibleArea` is a different, simpler primitive and that reasoning
doesn't automatically transfer, but it's worth a conscious check, not assumed fine by default).

**9. Room Settings rework** (`api/navigator/RoomSettingsProtocol.ts` — new, 9555-9558, own-feature
per-room permission switches + paint/skin save, explicitly *not* touching the stock room-settings
packets — `api/navigator/RoomPaintIds.ts` — new, real-looking paint/wallpaper/landscape id lists
captioned "in the order of HabboCity's own room settings appearance grid," source of that ordering
not re-verified this pass — plus six existing `NavigatorRoomSettings*TabView.tsx` files modified
with substantial diffs (66–113 changed lines each) and two brand-new untracked tabs,
`NavigatorRoomSettingsPermissionsTabView.tsx` and `NavigatorRoomSettingsSkinTabView.tsx`). **None of
the six modified tab files or the two new tab files were read this pass** — this is a real,
separate, substantial piece of in-progress work (a full Room Settings window rebuild, by the size of
the diffs) that this write-up does not cover at all. Treat as a third, independent thread from
Commands/Mentions and Bots — don't assume anything about its state without reading it first.

**10. Loading screen rebuilt to match a real reference mechanism** (`components/loading/
LoadingView.tsx`, new `assets/images/loading/arcadescreen2.gif`) — replaced the old centered
progress-bar layout with a fixed full-viewport duck-gif background and a small floating
`(NN%)`/error-message badge, plus a new `anim` class prop (fade-in/out wiring, presumably from
whatever mounts `LoadingView` — that caller wasn't checked this pass). Looks like a real, deliberate
1:1 rebuild (a genuinely different mechanism, matching this file's own "reverse-engineer the real
mechanism, don't CSS-patch" rule), but **not confirmed against a live reference this pass** — take
the "looks deliberate" read as a hint, not a verification.

**11. Small, scattered fixes not part of any of the above threads** (2–18 line diffs each, not
individually investigated this pass — flagged only so they aren't mistaken for accidental/unrelated
changes if seen in a future `git diff`): `CanManipulateFurniture.ts` (1 line), `ProfileStatsProtocol.ts`
(9 lines), several `CatalogLayout*View.tsx`/`CatalogGuildSelectorWidgetView.tsx` (6–13 lines each),
`FloorplanOptionsView.tsx` (18 lines), `FriendBarItemView.tsx`/`FriendsListGroupItemView.tsx`/
`FriendsMessengerView.tsx` (4 lines each — likely `UsernameView`/`UsernameStyle` wiring, given the
theme of this session, but not confirmed), `GroupMembersView.tsx`/`GroupTabIdentityView.tsx` (7–9
lines), `ModToolsView.tsx`/`ModToolsUserModActionView.tsx` (8–12 lines, plausibly Bots-panel-related
wiring), `InfoStandWidgetUserView.tsx`/`ChooserWidgetView.tsx`/`RoomToolsWidgetView.tsx`/
`ToolbarView.tsx` (4–31 lines), `WiredIcons.ts`/`WiredView.scss` (1–2 lines), `TruffleChatText.tsx`
(26 lines — likely the old canvas-chat-text mention-coloring path being trimmed now that
`ChatMessageTextView.tsx` owns that, but not confirmed).

**What this section does NOT do**: verify any of the above live against habbo.st/HabboCity/the dev
client via CDP. Every item above is a "read the source, here's what it does and how confident I am"
inventory, per this file's own distinction between source-level understanding and the real
DOM/computed-style/JS verification chain this project otherwise requires before calling something
done. Nothing above should be reported to the user as finished.

## Commands/ListConfirm resolution, `:enable vip`, and a full Room Settings enforcement build
(2026-09-27, same day as the section above — this closes out that section's "immediate focus")

**Commands/ListConfirm duplication — resolved as NOT a bug.** Read both `ListConfirm.java` and
`CommandConfirm.java` in `hcms-emulator-plugin` directly: both are real, complete, already wired to
real triggers (`:alldeleteitem`/`:emptyfriends` → `ListConfirm.ask`; `:warproom`/`:deletegroup`/stock
`:empty`+variants → `CommandConfirm.ask`), wire formats match the client byte-for-byte. The user
confirmed live this already works as intended — no fix made, `CommandsView.tsx`'s own
never-mounted/never-requested state was also confirmed real but left alone per explicit
instruction ("revert it already works everything"). Do not re-open this without being asked.

**`:enable vip` built end-to-end.** `EnableCommand` (core, untouched) only parses a numeric effect
id, so "vip" as `params[1]` always no-opped. Fixed via interception, not a core edit: a new
`UserExecuteCommandEvent` listener (`HabboCityCommands.onEnableCommand`, same mechanism
`CommandConfirm.onExecute` already used) checks for literal `"vip"` and toggles the effect itself;
every real `:enable <number>` still reaches the untouched stock command exactly as before. Real
effect id resolved from HabboCity's own reference `EffectMap.json` (935 → lib "VIP") — this hotel's
own live `EffectMap.json` had already reassigned 935 to an unused, non-HabboCity leftover
(`LifeGaugeBRN5`, part of an orphaned family with zero code/data references anywhere) — repointed
that id to the real `VIP` lib (asset copied in from the reference capture) rather than inventing a
free id, once confirmed nothing depends on the old value. New `cmd_hc_enablevip` permission column,
same "V" (rank 2+) convention as `:smack`/`:hit`. Deployed, boot-verified.

**`HelpCommandData.ts` fixed**: `:smack` wrongly said "kisses the target" (copy-paste from `:kiss`)
→ "smacks the target across the face"; `:hit` wrongly said "hits and pushes the target, needs
pushmode" (invented — the real implementation is a pure cosmetic emote, no pushing at all) → "hits
the target on the head". Both matched against the real `emote()` calls in `HabboCityCommands.java`.

**Room Settings: audited, found mostly unenforced, fully rebuilt.** The Permissions tab ("Réglages"
on the real HabboCity/habbo.st reference — confirmed field-for-field, same 4 sections and order:
Commandes/Actions/Options de marche/Autres) has 19 flags in `RoomSettingsStore.FLAGS`. Before this
pass, `RoomSettingsEnforcer.onCommand` only ever checked 8 of them (the ones with a real `:command`
chat-text equivalent: enable/handitem/cars+fastwalk/moonwalk/push+pull/transform/sit/lay) — the
other 11 (giveitem/danse/sign/greet/laugh/kiss/afk/jump/thumb_up/change_look/show_bubble) saved
fine and rendered fine but did nothing at all, because sitting-on-a-chair aside, most of those
happen through dedicated stock packets (expressions, dance, hand-item-giving, avatar-editor save,
the typing indicator), never through the generic chat-command path.

Real, sequential fixes, each verified against the actual firing site before being called done, not
assumed from a class name:
- `can_sign` → `UserSignEvent` (fired by `RoomUserSignEvent` **before** applying the sign status —
  real, cancellable, confirmed at the firing site).
- `can_change_look` → `UserSavedLookEvent` (fired by `UserSaveLookEvent`, the real avatar-editor
  save handler, **before** applying the new look).
- **A real mistake made and caught**: `can_thumb_up` was first wired to `UserRespectedEvent`
  (fired by `RoomUserGiveRespectEvent`) — that turned out to be the wrong system entirely: it's the
  click-a-player's-icon-to-give-a-real-reputation-point mechanic, not the `"_b"` **chat-typed
  gesture** the checkbox actually describes (confirmed by checking the client's own
  `sendExpressionMessage`/`RoomUnitActionComposer` call and the real `RoomUserAction` enum -
  `THUMB_UP(7)`). Removed the wrong hook once the real one was found.
- `can_giveitem`/`can_danse`/`can_greet`/`can_laugh`/`can_kiss`/`can_afk`/`can_jump`/`can_thumb_up`
  (corrected): none of these eight has any cancellable plugin event anywhere in this emulator
  (confirmed via a full read of every plugin event class Arcturus exposes) — so each is gated via
  `PacketManager.registerCallable(header, ICallable)` + `MessageHandler.isCancelled`, a real,
  minimal, additive extension point discovered by decompiling an actual published Arcturus plugin
  (`StartTyping.jar`, `Plugins.rar` reference collection — javap on the real class showed exactly
  this pattern) instead of guessing. This **replaced an earlier, riskier first attempt** that fully
  replaced three stock handler classes outright via reflection (hand-copying their real logic) —
  retired once the safer, real technique was found, since `registerCallable` never touches or
  duplicates the stock handler's own logic at all (zero risk of a hand-copy drifting from real
  behaviour). Where the decision needs the packet's own payload (the action id, the dance id), the
  value is peeked directly off the `ByteBuf` and the reader index rewound afterward, so the real
  stock handler still reads the identical bytes fresh.
- `show_bubble` — **also wrongly built at first**: initially gated real chat (`UserTalkEvent`),
  blocking actual sent messages. The user clarified this is "the bubble when someone starts typing"
  and pointed at the same `Plugins.rar` reference collection; decompiling `StartTyping.jar` (and its
  identical-bytecode "by rank" rebrand) showed the real mechanism gates the **typing indicator**
  specifically (`RoomUserStartTypingEvent`, opcode 1597, matching the client's real
  `RoomUnitTypingStartComposer` from `sendChatTypingMessage`), via the exact same
  `registerCallable`/`isCancelled` technique — not real chat at all. Reverted the wrong
  `UserTalkEvent` hook, built `RoomSettingsTypingHandler` against the real opcode instead.
- **`:nobubble` / `:chatbubble` command built**: a personal, account-level opt-out of one's own
  typing indicator, independent of any room's switch — same shape as `:nomention`'s own
  `MentionStore` (in-memory cache + one-column table, `hcms_typing_bubble_optout`), new
  `TypingBubbleStore` class, checked first in `RoomSettingsTypingHandler`. Staff-only for now (rank
  2+, same "V" convention), per explicit instruction — not yet opened to regular members.
- **Exemption model corrected in stages, each given verbatim by the user**: originally "owner and
  staff are never limited by their own room's switches" (a decision baked in before this session,
  never verified against any reference). Corrected step by step: (1) dropped `acc_supporttool` from
  the exemption check — in this hotel every rank 2+ already has it by default, since it only really
  gates the in-game Support/Mod Tool panel, not room-owner-level authority, so keeping it made every
  staff/VIP rank exempt from every room's switches everywhere, not just their own; (2) then the room
  owner's own exemption was removed too, given verbatim ("room own[er] shouldnt be exempt"); (3)
  then **all** exemption was removed, given verbatim ("also room owner and staffs with rank should
  not be able") — `RoomSettingsStore.exempt()` now always returns `false`. `canManage()` (who may
  *edit* the Settings/Appearance tabs at all) is unrelated and unchanged — the owner can still
  toggle their own room's switches, they're just no longer above them once set.

**A real, separate bug found and fixed while setting up two-account testing**: a second test
account (`officialrooms`, used as the non-exempt rank-1 tester) kept silently reverting to rank 2
seconds after being manually set to rank 1. Root cause: `VipSyncScheduler` (a real, pre-existing
60-second sweep, unrelated to this session's own work) re-syncs every online player's rank against
`hcms_vip_memberships` (hCMS's own real, shared-DB membership table) — the account had a real,
active membership row (`expires_at` in 2027) from earlier testing. Fixed by expiring that row
(`expires_at` set to the past, not deleted — reversible) rather than fighting the sync loop by
repeatedly resetting `users.rank`, which would have kept losing to the next sweep.

**Full live test, two real accounts in the same room simultaneously** (Phi, rank 8 owner; and
officialrooms, corrected to genuine rank 1, non-exempt) — of 19 flags: 14 directly click/command-
tested end to end (all 8 command-based ones, `can_sign`, `can_afk`, `can_change_look`, plus
`can_greet` blocked and `can_thumb_up` control-tested as still-allowed to prove the
`registerCallable`/peek-rewind mechanism doesn't corrupt the packet for the real handler). Also
directly confirmed: the room owner (Phi) gets blocked by their own room's switch exactly like a
guest, matching the fully-de-exempted model. Not directly click-tested: `can_danse`/`can_giveitem`
(need a canvas-rendered avatar click this session's tooling can't easily simulate — no real DOM
element to target) and `can_kiss`/`can_laugh`/`can_jump` (the client's own chat shortcuts for these
gate behind real Habbo Club/VIP status, which the test account no longer has) — both groups share
the exact same already-proven mechanism as the ones that were tested directly, just not
individually exercised. `show_bubble` + `:nobubble` both confirmed working together (the typing
indicator test initially looked inconclusive, then the user clarified their own account already had
`:nobubble` active from earlier testing, explaining it independently of the room switch).

## User Profile full re-audit (2026-09-27, same day) — Wealth clip-path bug + Rooms duplicate class

Requested directly: "check user profile" then "compare with habbocity also" then "check full
userprofile". Did a real side-by-side pass (live DOM/computed rects on both this dev client and the
real habbocity.fr reference, via CDP on both) across the header and all 4 tabs, not just re-reading
old notes.

**Wealth tab — real bug found and fixed.** The clip-path's right edge was flush with the rightmost
data point's own x-position (both at x=750), slicing that point's marker circle exactly in half.
Live-compared: the reference's own clip rect is 740 wide (right edge at 800 = `CHART_WIDTH`, not
`PLOT_RIGHT`) - 50px of margin past its own rightmost point (also at x=750) specifically so the
marker/hover-hit circles never get cut. Fixed `UserProfileWealthTabView.tsx`'s clip rect to use
`CHART_WIDTH - PLOT_LEFT` instead of `PLOT_RIGHT - PLOT_LEFT` (`PLOT_RIGHT` itself is untouched -
still the real x every data point is positioned at, already confirmed matching the reference).
Verified live: `x=60, width=740, right edge=800` now byte-identical on both. Everything else checked
in this tab (button row structure, axis tick counts, line stroke-width 4, circle radius 8, axis
stroke-width 3, details row structure) already matched - this was the one real divergence.

**Header**: still byte-identical (banner/data/infostand/stats rects match within 1px rounding).

**Groups tab**: empty-state markup (`.no-group-spritesheet.image-1/-2/-3`, no text) byte-identical
on both - neither test account (Phi here, xPhi on the reference) has a real group, so the populated
state is still genuinely unverified, not assumed fine.

**Rooms tab — real cosmetic bug found and fixed.** `UserProfileRoomsTabView.tsx` passed an explicit
`className="h-100"` into `<ScrollContainer>`, but `ScrollContainer` wraps `Grid`, whose own
`fullHeight` prop already defaults to `true` (confirmed in `Grid.tsx`) - so `h-100` was already being
emitted unconditionally, and the explicit one just duplicated it in the class list
(`"...scroll-container h-100"` instead of `"...scroll-container"`). Harmless visually (CSS classes
are idempotent) but real leftover cruft - removed the redundant prop, verified via HMR the class
list is now single and byte-identical to the reference's own.

**Photos tab**: empty-state structure matches. The reference account (xPhi) happens to have one real
photo, giving a live look at the real populated-state grid (`.scroll-container` >
`.grid.gap-2.justify-content-start` > `img.profile-picture-entry`) - matches what an earlier
session's own Photos-tab fix already built and documented; not re-derived from scratch, just
cross-checked against this real example.

## Profile Moderation panel — real 1:1 rebuild + full audit-log integration (2026-09-27)

Requested directly: "check moderate is nothing to do with mod tool check yourself" (correcting a
wrong gate I'd added), then "get 1:1 habbocity moderer all changes and its report banner etc...".
Went through a real byte-level (`dd`) extraction of the decompiled reference bundle after the user
pushed back twice on a too-fast read ("check again its not supprime and where does it say mod
tools?"). Confirmed reference behaviour: **every** viewer (not just staff) sees Ignore + Report on
someone else's profile; a moderator (rank ≥2, this hotel's own "V" convention, used instead of
tracing the exact stock `UserPermissionsComposer`/`isModerator` chain per explicit "just do by
rank") additionally sees Delete banner / Delete motto / Delete avatar / Open mod tools / Open admin
(the last was left unbuilt - no real `admin.url` config key found or confirmed, flagged as an honest
gap rather than invented).

**Real, pre-existing, unrelated bug found and fixed while wiring Report for regular users**
(`UserProfileView.tsx`/`UserProfileModerationView.tsx`): the whole Moderate panel (Report AND the
new Delete actions) silently failed to open for any target with a real profile banner set, because
the panel's own link-tracker parses its `CreateLinkEvent` URL via `url.split('/')` expecting exactly
7 segments, but the trigger passed the FULL `profileCoverUrl` (containing real `/` characters) as
the last segment instead of a bare filename. Fixed by tracking a separate `profileCoverFilename`
state and using that in the link instead - matches the real reference's own convention of only ever
passing a bare filename, never a full URL.

**New server protocol, `hcms-emulator-plugin/profile/ProfileModerationProtocol.java`** (opcode 9568,
`int targetUserId, int contentType` where 0=banner/1=motto/2=figure), rank-gated (≥2) same as
everywhere else. "Delete" means different things per real column shape: banner has its own row
(`hcms_users_profile_banners`, deleted outright); motto/look are NOT NULL columns on `users` -
motto resets to the literal string **"Changed by Staff"** (given verbatim, not blank), look resets
to this project's own already-established `DEFAULT_FIGURE` (reused from
`WiredEffectBotChangeClothesView.tsx`, not invented). Each action sends the acting moderator a real
feedback bubble (`CommandFeedback.tell`, e.g. "Banner deleted.") per explicit follow-up ("it works
but should give feedback also"), and both the online-target and offline-target (DB-only update)
paths are handled. Client: `src/api/user/ProfileModerationProtocol.ts` (composer +
`ProfileModerationContentType` enum), wired into `UserProfileModerationView.tsx`'s three new
`Button variant="danger"` actions via a `showConfirm(...)` guard - real gotcha caught during testing:
`showConfirm`'s 6th param is the dialog **title**, not a button label; the actual buttons are always
literally 'Yes'/'No'.

**Audit logging: routed into hCMS's own real, pre-existing `hcms_admin_audit_log` table**, not a new
one. An earlier pass in this same session built a separate `hcms_profile_moderation_log` table
before discovering the existing general-purpose one (already populated by hCMS's own Laravel admin
panel for rank changes/economy toggles/etc, already viewable via a real, working Filament page,
`AuditEntryResource.php` under Administration > Audit log) - dropped the new table (confirmed empty
first) and refactored `logAction()` to write into the real one instead
(`actor_id`=moderator, `action`=`profile.banner_deleted`/`profile.motto_deleted`/
`profile.figure_deleted`, `target_type`='user', `target_id`=target, `details`=JSON with
`username`+`from`/`to` where applicable). Deployed (stop → copy jar → restart), confirmed via a real
end-to-end CDP test (motto delete round-tripped and reflected in the DB) and via direct SQL that
real rows land in `hcms_admin_audit_log` with the correct action names.

## Full user-activity history inside hCMS's "Players" (Edit User) admin page (2026-09-27)

Requested directly: "is there any log" (after the moderation work above) → "i need full audit
inside edit user need full history" → then, after AskUserQuestion offered a scope choice, the user
explicitly picked the broadest option: **"Everything including chat"** - i.e. not just moderation
actions, every real thing a player has done: admin/moderator actions (both as actor and as target),
in-game commands used, rooms entered, and full chat history (room + private, both directions). This
is entirely a `hCMS` (Laravel/Filament) repo change - no client or emulator-plugin changes needed,
since all the source data already existed in stock Arcturus/hCMS tables, just never surfaced in the
admin UI or (for 4 of them) missing a primary key Eloquent/Filament need to address rows safely.

**Safety check done BEFORE altering any table** (per this project's own "don't guess, verify"
standing discipline, applied to the emulator's own raw JDBC writes this time rather than a UI
reference): confirmed live, by grepping `Arcturus-Community-Wired`'s real source, that all four
PK-less stock log tables (`room_enter_log`, `namechange_log`, `chatlogs_room`, `commandlogs`) are
written via `INSERT INTO table (col1, col2, ...) VALUES (...)` with **explicit named columns**, in
`RoomManager.java`, `ConfirmChangeNameEvent.java`, `RoomChatMessage.java`, and `CommandLog.java`
respectively - meaning a new `id` column is completely invisible to the emulator's own writes and
safe to add. (`chatlogs_private` already had a real `id` primary key, no migration needed for it.)

**Built, in `hCMS`:**
- New migration `database/migrations/2026_09_27_070000_add_id_to_stock_log_tables.php` - adds
  `bigIncrements('id')->first()` to all four PK-less tables, guarded by `Schema::hasColumn` so it's
  safely re-runnable. Run live (`php artisan migrate --force`), verified via `DESCRIBE` that `id`
  landed as the new first column with no data loss (row counts unchanged: 1068/0/1027/0).
- New models under `App\Domain\Activity\Models\`: `RoomVisit` (`room_enter_log`), `NameChange`
  (`namechange_log`), `RoomChatMessage` (`chatlogs_room`), `PrivateChatMessage`
  (`chatlogs_private`), `CommandUsage` (`commandlogs` - named `CommandUsage`, not `CommandLog`, to
  avoid colliding with the unrelated Java class of the same name). Also added
  `App\Domain\Rooms\Models\Room` (minimal read-only wrapper around the stock `rooms` table - no
  hCMS domain owned it before this).
- `User.php` gained: `roomVisits()`, `nameChanges()`, `roomChatMessages()` (sent only - the table has
  no real "received" concept), `commandUsages()`, and `privateChatMessages()` (a genuine two-way
  relation - `hasMany(..., 'user_from_id')->orWhere('user_to_id', $this->id)` - covers both sent AND
  received so the private-message history isn't split across two tabs).
- **`auditEntries()` widened to be bidirectional** per the "Everything including chat" scope: was
  `target_id`-only (actions taken against this player); now
  `hasMany(AuditEntry::class, 'actor_id')->orWhere(fn ($q) => $q->where('target_type','user')->where('target_id', $this->id))`
  - actions this player TOOK as staff, OR actions taken against them, in one combined, correctly-
    ordered-by-`id` list.
- Five new read-only `RelationManager`s (`RoomVisitsRelationManager`, `NameChangesRelationManager`,
  `RoomChatRelationManager`, `PrivateChatRelationManager`, `CommandUsagesRelationManager`), same
  `isReadOnly() => true` / `defaultSort('id','desc')` / `emptyStateHeading(...)` convention as the
  pre-existing `AuditEntriesRelationManager`/`BansRelationManager`. `PrivateChatRelationManager`
  additionally derives a "Sent"/"Received" badge column per row by comparing `user_from_id` against
  the owning record's own id, since the underlying relation deliberately merges both directions.
  All five registered in `PlayerResource::getRelations()`.
- All new/changed PHP files linted clean (`php -l`, PHP 8.5 - this box's `php.exe` under
  `/c/Program Files (x86)/PHP/php-8.2.0/` is too old for this Composer install's `>=8.4.1`
  requirement; use the `php-8.5.10` binary for any `artisan`/Composer-aware command in this repo
  going forward, plain `php -l` works fine on either).

**Verified against real data via `artisan tinker`, not assumed from the code alone**: for a real
target-only player (id 74, `officialrooms` - 0 rows as actor anywhere), every new relation returned
a real non-zero/plausible count matching a direct raw-SQL count on the same table
(`roomVisits`:81, `roomChatMessages`:46, `auditEntries`:8, `privateChatMessages`:1). For a real
mixed actor+target account (id 1), the bidirectional `auditEntries()` at first looked like a bug
(297 via the relation vs. an expected-but-wrong hand-added 297+2=299) - re-checked by pulling the
raw rows for that account's 2 target-side entries directly and found both were **self-actions**
(the account granted winwins to itself, hid itself in the economy) already counted in the 297
actor-side rows - the relation's 297 was correct all along; the manual arithmetic that flagged it as
a discrepancy was the actual mistake, corrected here rather than left as an unresolved doubt.

**Not built / explicitly out of scope for this pass**: no way to filter/search across all five new
tabs at once from a single view (each is its own tab, matching every other `RelationManager` in this
resource); no retroactive backfill of the new `id` columns' semantic meaning beyond insertion order
(these tables have no other natural sort key); command *parameters* are shown as their raw stored
string (`commandlogs.params`), not parsed/pretty-printed per-command.

**"commandslog not working" - real root cause found and fixed, not a bug in the migration/tab just
built.** `commandlogs` had exactly 0 rows even after the tab shipped, for every account. Traced via
the real core source (`CommandHandler.java:96-98`): a command is only ever logged when
`gameClient.getHabbo().getHabboInfo().getRank().isLogCommands()` is true, which reads a real,
per-rank `permissions.log_commands` column (`Rank.java:55`) - **every single rank in this hotel had
`log_commands = '0'`**, confirmed via direct `SELECT`, so command logging was globally a no-op
regardless of who ran what, unrelated to the new Filament tab (which correctly showed nothing,
because there was genuinely nothing to show). Fixed at the data layer, not the code layer: `UPDATE
permissions SET log_commands = '1' WHERE id >= 2` (ranks 2-8, i.e. VIP through Super Admin - Member
stays excluded, matching this hotel's existing rank-2+ "V" convention used everywhere else in this
file). **Real gotcha hit while fixing it**: the first attempt used a bare numeric `1`
(`SET log_commands = 1`), which silently set every row to `'0'` instead of `'1'` - for an
`ENUM('0','1')` column, MySQL/MariaDB interprets a plain integer literal as the enum's 1-based
**index**, not a value match, so `1` selected index 1 (`'0'`), not the string `'1'`. Re-ran with the
value explicitly quoted (`'1'`) and it took correctly. Confirmed the rank's `log_commands` flag is
read once at boot into an in-memory `Rank` object (`PermissionsManager`), so the DB change alone
doesn't affect an already-running emulator - reloaded live via the real, existing `:update
permissions` command (`UpdatePermissionsCommand.java` → `PermissionsManager.reload()`), sent through
the real chat input on the dev client via CDP (not a restart), then verified end-to-end: a second
real command sent after the reload produced a real new row in `commandlogs`
(`UpdatePermissionsCommand`, `user_id=1`, `succes='yes'`), confirmed both directly via SQL and
through the new `CommandUsage` model/relation.

**Second real bug caught while verifying that row, before it could ever surface as wrong data**:
`CommandUsage`'s own `succes` cast was `'boolean'`, but `CommandLog.java` stores this column as the
literal string `"yes"`/`"no"`, never `0`/`1` - Eloquent's `boolean` cast does a plain `(bool) $value`
under the hood, and `(bool) "no"` is `true` in PHP (any non-empty string is truthy), which would have
silently displayed every FAILED command as succeeded in the new "Commands used" tab. Fixed by
replacing the cast with a real `Attribute::make(get: fn ($v) => $v === 'yes')` accessor that compares
the raw string explicitly, instead of relying on PHP's own type coercion. Re-verified via tinker: the
one real row so far (`succes='yes'`) now correctly reads `true`; the failure case wasn't naturally
available to test against real data yet, but the fix is a direct string comparison, not a coercion,
so there's no equivalent failure mode left to hit.

**Trade logs + shop purchase logs added to the same full-history feature (2026-09-27, same day),
per explicit follow-up ("tradelogs buylogs").** Two more real, previously-unsurfaced stock/hCMS
tables, found the same way as the others (`SHOW TABLES LIKE '%trade%'`/`'%buy%'`/`'%purchase%'`,
then `DESCRIBE` before touching anything) - **both already had a real `id` primary key**, so no
migration was needed this time:
- `room_trade_log` (stock Arcturus - one row per completed trade between two players, written by the
  emulator itself: `user_one_id`/`user_two_id`/ips/timestamp/item counts per side). New model
  `App\Domain\Activity\Models\RoomTrade`, new bidirectional `User::trades()` relation (same
  `hasMany(..., 'user_one_id')->orWhere('user_two_id', $this->id)` shape as `privateChatMessages()`),
  new `TradesRelationManager` - derives "Traded with"/"Items given"/"Items received" per row by
  comparing `user_one_id` against the owning record's own id, same technique
  `PrivateChatRelationManager` already uses for its Sent/Received badge.
- `logs_shop_purchases` (hCMS's own real catalog/shop purchase log - not the stock Arcturus catalog
  system, a separate hCMS-side log table: `catalog_item_id`/`item_ids`/`catalog_name`/
  `cost_credits`/`cost_points`/`points_type`/`amount`). New model `ShopPurchase`, new
  `User::shopPurchases()` relation, new `ShopPurchasesRelationManager` showing item/qty/formatted
  cost (credits and/or points, whichever side of the purchase is non-zero).
- **Deliberately left out**: `room_trade_log_items` (composite-PK item-breakdown detail table for
  each trade - the summary counts already on `room_trade_log` itself cover what a per-user history
  tab needs; a future per-trade drill-down could use it, not built here) and
  `users_target_offer_purchases` (a marketplace-offer purchase-limit *state* table - `state`/
  `amount`/`last_purchase` per user+offer pair, overwritten in place on each purchase, not an
  append-only log the way the other five tables are - doesn't fit "buylogs" the same way
  `logs_shop_purchases` genuinely does).
- Both new PHP files linted clean and verified against real data via `artisan tinker`: user 1
  (Phi)'s `trades()` returns the one real trade (`user_one_id=1`), and the SAME row is correctly
  also returned by user 217's own `trades()` relation (`user_two_id=217`) - confirming the
  bidirectional `orWhere` works from both sides, not just the `user_one_id` side. `shopPurchases()`
  returned exactly 74 for user 1, matching a direct `GROUP BY user_id` count on the raw table
  byte-for-byte (the other 6 of the table's 80 total rows belong to a different user, id 74).
- Registered both in `PlayerResource::getRelations()` alongside the five tabs from the entry above -
  the "Players" (Edit User) admin page now has 7 new activity tabs total (Rooms visited, Name
  changes, Commands used, Room chat, Private messages, Trades, Shop purchases) plus the existing
  Audit history tab (now bidirectional), on top of the original Ban history/Support tickets/Forum
  topics/Ledger tabs.

**Root cause of "data isn't live-updating in the admin panel" found and fixed (2026-09-27,
same day), real emulator-side delay, not a Laravel/Filament caching issue.** Traced via core source,
not guessed: stock Arcturus batches some of its own database logs in memory
(`DatabaseLoggable`/`DatabaseLogger`) instead of writing them immediately - `CommandLog` (commands
used), `RoomChatMessage` (room chat) and `CatalogPurchaseLogEntry` (shop purchases, the real class
behind `logs_shop_purchases`) all implement this interface. The queue only drains when
`Emulator.getDatabaseLogger().save()` is called, which core's own `CleanerThread` does on a real
`SAVE_ERROR_LOGS = 30` (seconds) cadence, itself only checked once per `CleanerThread.DELAY = 10000`
ms tick - a real, confirmed ~30-40s worst-case wait baked into core, unrelated to anything this
project built. Room visits/name changes/private messages/trades all write immediately in core
(confirmed via each one's own real `INSERT` call) and were never affected by this.

Fixed via a new, additive scheduler in the plugin (never touching `CleanerThread`/core), mirroring
`VipSyncScheduler`'s own self-contained-executor shape exactly: `activity/
ActivityLogFlushScheduler.java` calls the same already-public `Emulator.getDatabaseLogger().save()`
every 3 seconds instead of every ~30-40s. Calling it more often than core's own timer is safe -
`save()` only ever drains whatever is currently queued, so a redundant call from either scheduler is
a no-op. Registered/stopped in `HcmsPlugin.onEnable()`/`onDisable()` alongside the VIP sync
scheduler. Deployed (stop → copy jar → restart), boot-verified (`"activity log flush scheduled every
3s"`), and live-verified end to end with real timing, not assumed: sent a real `:update_permissions`
command via the dev client's own chat input, recorded the exact send timestamp, and polled
`commandlogs` directly - the row appeared with `timestamp` matching the send time within **~7
seconds**, down from the old ~30-90+ second range. (One earlier test in the same investigation
looked like a ~93s delay and briefly suggested the fix wasn't working - re-examining it found that
row actually belonged to a *different* command from *before* the emulator restart that had been
misread as the new one; a clean, isolated re-test with precise send/poll timestamps is what actually
confirmed the ~7s figure - don't trust a "still 2-5 minutes" report without re-measuring precisely
against a single, clearly-identified row.)

## Activity-log tabs consolidated from 7 to 3, with real actions (2026-09-27, same day)

Per explicit direction ("make the logs better now is too many different also add actions"): merged
the 7 single-source tabs built earlier this session (Rooms visited, Name changes, Commands used,
Room chat, Private messages, Trades, Shop purchases) into **3 grouped, chronological feeds** -
`ActivityRelationManager` (rooms visited + name changes + commands, i.e. "what did this player do"),
`ChatRelationManager` (room chat + private messages, both directions), `EconomyRelationManager`
(trades + shop purchases) - each one real Filament table backed by a hand-merged/sorted/paginated
`Collection` (`Filament\Tables\Table::records(Closure)`, a real non-Eloquent data-source API this
Filament version supports) instead of a single relationship. The 7 old single-source files were
deleted outright (`Concerns/BuildsMergedActivityTable.php` holds the shared search/sort/paginate
logic all three reuse). Added a real **"View player" row action** on the Chat and Economy tabs -
jumps to the other party's own Players admin page (`PlayerResource::getUrl('view', [...])`) whenever
a row has a real counterpart (a trade partner, a private-message sender/recipient) - room chat/
commands/room visits/name changes have no natural "other party" and get no action, not a fake one.

**Two real Filament API bugs found and fixed while wiring this, both via server-side log evidence,
not guessed:**
- `->records(function (array $params) {...})` doesn't work - Filament's `evaluate()` resolves a
  `records()` closure's parameters **by name** against a fixed injection set
  (`search`/`sort`/`page`/`recordsPerPage`/`filters`/`columnSearches`/`sortColumn`/`sortDirection`),
  not by binding a single catch-all array. A single `$params` argument matches nothing, so Filament
  raises "attempt to evaluate a closure... but [$params] was unresolvable" - confirmed via
  `storage/logs/laravel.log`. Fixed by naming the closure's own parameters
  (`?string $search, array $sort, int|string $page, int|string $recordsPerPage`) and building the
  `$params` array from those inside the closure body instead.
- Every relation-manager table gets a **default** `recordAction`/`recordUrl` (row-click-to-view
  behaviour) set by Filament's own base `makeTable()`, both hard-typed `function (Model $record, ...)`
  - since these three tables' rows are plain arrays (no single Eloquent relationship backs them),
  every render threw "Argument #1 ($record) must be of type Model, array given" the moment the base
  default tried to run. Confirmed the same way, via the log, not assumed. Fixed by explicitly
  chaining `->recordAction(null)->recordUrl(null)` after `->records(...)` on all three tables (a row
  click does nothing now, same as before there was any click-to-view default to disable).

**Verification note, worth remembering for this admin panel specifically**: CDP-scripted `.click()`
on these Livewire tab buttons reliably updates the tab's own client-side `aria-selected` state (a
local Alpine/Livewire optimism) but does **not** reliably trigger the actual AJAX
`POST /livewire-*/update` that fetches the tab's real content - confirmed this is a **general
limitation of this exact CDP-click method on this admin panel**, not a defect in these three tables
specifically, by reproducing the identical "stuck on Loading..., no follow-up request in the IIS
log" symptom on an old, already-working, completely untouched tab ("Ban history") using the same
script. The real, decisive verification instead used `Livewire::test($class, ['ownerRecord' =>
..., 'pageClass' => ViewPlayer::class])->html()` directly in `artisan tinker` - a server-side,
browser-free Livewire component test - which rendered all three tables correctly on the first try
with zero "Loading...", real merged/sorted rows (307/304/77 results for Activity/Chat/Economy on
the dev account), and a real, correct "View player" link
(`https://dev.habbo.nz/admin/players/74`, the actual trade partner) once both bugs above were fixed.
Prefer this `Livewire::test()` approach over CDP browser scripting for verifying any Filament
admin-panel component in this repo going forward - it's faster, deterministic, and immune to this
click-reliability gap entirely.

## Real login/logout history added to the Activity tab (2026-09-27, same day)

Per explicit direction ("add also activity logged in client left client"). Confirmed first that no
such history existed anywhere in this hotel - `users.last_login`/`users.last_online`/`users.online`
only ever hold the CURRENT single value, never a log of past sessions (the user's own follow-up,
"in users its last_login", was a real correction of the exact column name to check, not a request to
reuse it for this - it doesn't carry history either way, so a new table was still the right call).

Found two real, already-firing plugin events with nothing recording them: `UserLoginEvent`
(`SecureLoginEvent.java`, carries the real login IP) and `UserDisconnectEvent`
(`Habbo.java`'s own `disconnect()`) - the same "event already exists, never wired to anything"
pattern as several other features this session (room favourites, the ignore list). Built, entirely
in the plugin (never touching core):
- New migration (hCMS) creates `hcms_session_log` (`id`, `user_id`, `ip`, `login_at`,
  `logout_at` nullable) - one row per real session, `logout_at` filled in on the matching disconnect
  rather than a second row, same enter/exit-in-one-row shape as `room_enter_log`.
- New `com.hcms.emulatorplugin.activity.SessionLogStore` - `recordLogin()` inserts a new open row;
  `recordLogout()` finds the most recent still-open row for that user (`logout_at IS NULL`) and fills
  it in. Wired into the ALREADY-EXISTING `onUserLogin` listener in `HcmsPlugin.java` (added the call
  there rather than a second independent listener for the same event - the exact lesson from this
  file's own rule 5) plus one genuinely new `onUserDisconnect` listener (no prior listener existed
  for that event at all).
- hCMS side: new `SessionLog` model, new `User::sessions()` relation, folded into the already-merged
  `ActivityRelationManager` as two more row types per session - "Logged in" (IP shown) and, only once
  a session has actually closed, "Left client" (session duration in minutes).

Deployed (stop → copy jar → restart), boot-verified clean. **Verified live, both directions, with a
real fresh connection** - minted a real SSO ticket, connected a dev-client tab, confirmed a real
`hcms_session_log` row appeared with `login_at` set and `logout_at` still null, then confirmed
`logout_at` filled in on the same row once that session ended - no manual reproduction needed, real
connect/disconnect cycles during this same verification pass produced both rows for two different
real accounts. Confirmed via `Livewire::test()` (not CDP) that the merged Activity tab renders both
new row types correctly with real data.

## Bans issued, real filters/actions, real trade item names, and a Compare Players page (2026-09-27,
## same day)

Per explicit follow-up direction across several short messages ("1" [pick the "round out the
activity log" option], "add also activity logged in client left client", "great whats next" → "1",
"also add filters and actions fully compare users and check same room chat and more", "should be
able choose multiple filters and set for example search username of other player or so also for
trade need more info").

**Bans issued** - new `User::bansIssued()` (`bans.user_staff_id`, the real "who banned this"
column the `Ban` model already exposed via its own `staff()` relation, just never queried in
reverse) folded into the merged Activity tab as a "Ban issued" row type, with the banned player as
the row's `other_user_id` so the existing "View player" action works on it too. Verified with a real
temporary test row (inserted directly, then deleted immediately after confirming) rather than
guessed - `Livewire::test()` showed the row, its correct summary text, and a working "View player"
link to the banned account.

**Real per-trade item names** - `room_trade_log_items` (`id` = the owning `room_trade_log.id`,
`item_id` = the real furni INSTANCE id in `items`) was sitting unused; new `RoomTradeItem` model
resolves `items.item_id → items_base.id` for the real `public_name` (falls back to `item_name` if
blank). The Economy tab's trade summary now reads e.g. "With officialrooms - gave 0, got 1 | Got:
Traffic Lights" instead of just item *counts* - confirmed against 3 real trades on the dev account,
real resolved names ("Traffic Lights", "Rare Voodoo Doll", "Maroon Powered Fan"), not placeholders.

**Filters added to all 3 merged tabs** (Activity/Chat/Economy), both real, generic mechanisms added
once to `Concerns/BuildsMergedActivityTable.php` rather than duplicated per tab:
- `SelectFilter::make('type')->multiple()` - narrows to one or more of the tab's own real row types
  (multi-select, per explicit correction: "should be able choose multiple filters").
- `Filter::make('withPlayer')` (a plain `TextInput` for a username substring) - matches against each
  row's own `other_username` wherever one exists (trade partner, chat counterpart, banned player);
  rows with no real other party (room chat, purchases, commands, etc.) correctly never match it,
  confirmed live rather than assumed.
Both verified via `Livewire::test()` with real filter state set on the Livewire component directly
(`$component->set('tableFilters.type.values', [...])` / `set('tableFilters.withPlayer.username',
...)`) - a same-side-only "the code looks right" check was NOT relied on; each filter combination
was checked against the real merged rows for a real account and confirmed to include exactly the
expected rows and exclude the rest.

**New page: Compare players** (`App\Filament\Pages\ComparePlayers`, auto-discovered under
`app/Filament/Pages` like `SendPresent`/`EconomySettings` already are - no manual page registration
needed) - the literal "fully compare users and check same room chat" ask. Two searchable player
pickers (same `Select::make(...)->searchable()->getSearchResultsUsing(...)` pattern `SendPresent.php`
already established), then four real sections once "Compare" is submitted:
- **Shared rooms** - rooms where BOTH players have a real `room_enter_log` row
  (`GROUP BY room_id HAVING COUNT(DISTINCT user_id) = 2`), with each player's own visit count for
  that room.
- **Room chat in shared rooms** - the literal "check same room chat" ask: real `chatlogs_room` rows
  from EITHER player, but only inside rooms both have actually been in (not a time-overlap guess -
  a real, provable "these two were both in this room at some point" fact, then every real message
  either of them sent there).
- **Private messages between them** - both directions, reusing the already-built
  `PrivateChatMessage` model.
- **Trades between them** - reusing `RoomTrade` (both directions).
Verified live on real accounts (Phi id 1, officialrooms id 74): 4 real shared rooms surfaced with
correct per-player visit counts, and real room-chat rows from both players inside those shared rooms
rendered correctly - not a placeholder result.

**Not built / explicitly out of scope this pass**: mutes/room-bans (`room_mutes`/`room_bans` are
real but hold only CURRENT state with no history - no `id`/no historical row the way every other
source in this feature has, same reasoning `users_target_offer_purchases` was excluded for earlier -
would need a real append-only log added first, not built here) and badge grants (`users_badges` has
no grant timestamp or granting-staff column at all - there is genuinely no "who/when" to show,
confirmed by reading the real schema, not assumed missing).

## Chat tab: cross-referenced room chat + a real Room filter (2026-09-27, same day)

Per explicit follow-up ("room chat should also be able to filter other user and also choose like
last rooms"). Room chat's own `other_user_id`/`other_username` were always null before this - public
chat has no single "other party" the way a trade or a DM does - so the existing `withPlayer` filter
silently did nothing for room-chat rows. Fixed properly, not by faking a value:
- When `withPlayer` has a real username, the Chat tab now additionally fetches THAT player's own
  room-chat messages, but only inside rooms the tab's own owner has actually visited (a real,
  provable "were both of them ever in this room" fact, not a time-overlap guess - the same
  `WHERE room_id IN (owner's own visited room ids)` shape `ComparePlayers` already established) -
  not that player's messages from anywhere else, which belongs on their own Chat tab.
- The owner's OWN room-chat messages **in those same shared rooms** get tagged with the other
  player's id/username too (not just the newly-fetched messages), so the real back-and-forth stays
  together under the filter - the "View player" action becomes available on both sides once
  `withPlayer` narrows things down, not only on the fetched player's own rows.
- New `SelectFilter::make('room_id')`, labelled "Room" - options are the owner's own last 20
  distinct rooms visited, most recent first (a real `unique('room_id')->take(20)` over their own
  `room_enter_log`, not every room that ever existed).
- Real bug caught and fixed in the shared trait while wiring the Room filter: the generic
  single-value filter comparison used strict `===`, but a Filament `SelectFilter`'s own value always
  arrives as a **string** from the form while a row's real `room_id` is a native **int** - `===`
  would have silently never matched anything. Fixed by comparing both sides as strings (also applied
  to the multi-select `values` branch for the same reason) - a real, generalizable bug that would
  have silently broken any future single-value filter on a numeric field, not just this one.

Verified live via `Livewire::test()` on the real dev account: the Room filter's own options list
came back with real room names ("Hix", "Theater", "Lobby", "Bet", falling back to "Room #N" for a
handful whose `rooms` row no longer resolves a name); filtering by room_id=89 ("Hix") showed only
that room's messages; searching `withPlayer=officialrooms` returned 10 real merged room-chat rows,
all inside "Hix" (the one real shared room), correctly mixing the owner's own messages ("hi", "d",
":update permissions") with officialrooms' own (":noalerts") in one true chronological
conversation - not two separately-filtered lists.

## Real "navigation not work" bug found and fixed - pagination on all 3 merged tabs was silently
## broken (2026-09-27, same day) + full Players-page audit

User report: "navigation not work". Root-caused properly rather than guessed - reproduced live
(not assumed): the sidebar's own "Compare players" link and every other nav link are plain, ordinary
`<a href>` tags (this panel doesn't use Livewire SPA mode / `wire:navigate` at all, confirmed by
checking several already-working sidebar links for comparison, so that wasn't it), and navigating
directly to every page/relation-manager produced no error and no blank page. The real, confirmed bug
was **pagination inside the three new merged tabs (Activity/Chat/Economy) silently doing nothing** -
clicking "next page" never advanced past page 1, which is exactly what "navigation not work" was
actually describing.

**Real cause, found by comparing against an already-working relation manager, not guessed**:
`BuildsMergedActivityTable::paginateMergedRows()` built its own `LengthAwarePaginator` with a
hardcoded `'pageName' => 'page'`. Filament's own pagination links, though, always call
`gotoPage($n, $this->getTablePaginationPageName())` - a name scoped per relation manager (confirmed
live: `activityRelationManagerPage`/`chatRelationManagerPage`/`economyRelationManagerPage`, vs. the
already-correct `ledgerRelationManagerPage` on the pre-existing, untouched Ledger tab). Since my
hand-built paginator's own `pageName` didn't match what the rendered link actually called,
`getTablePage()` kept reading a bucket that never changed - a real, generalizable lesson: **a
custom Eloquent-free Filament table (`->records()`) must supply `getTablePaginationPageName()` to
its own paginator explicitly** - a plain Eloquent `->paginate()` gets this correctly for free, which
is exactly why every *other* relation manager in this project never had this bug. Fixed by using
`$this->getTablePaginationPageName()` instead of a literal string, and (found+fixed at the same
time, same root cause class) the hardcoded `perPage: 25` default was also wrong versus this table's
real configured default (`getDefaultPaginationPageOption()`, confirmed live as `10` - every other
relation manager already honors this, mine was silently overriding it) - fixed to read the real
table default instead of a guessed number, with a safe `?: 10` fallback since a hand-built
paginator can't rely on Eloquent's own resolution to guarantee a non-null value.

**Verified live via `Livewire::test()`**: for a Ledger tab (already correct, used as the real
control) and all three merged tabs, extracted the ACTUAL rendered `gotoPage(2, '...')` call from the
HTML (not assumed from reading the code), called it with that exact real page-name, and confirmed
the table's own content genuinely changed between page 1 and page 2 - true for all three
(`activityRelationManagerPage`/`chatRelationManagerPage`/`economyRelationManagerPage`), where before
the fix every one of them silently stayed on page 1 regardless of which page was requested.

**Full audit of the whole Players page done per explicit direction ("redo full audit in player so
it will work perfect info needed")** - every piece checked via `Livewire::test()` (with a real
authenticated user via `auth()->login()`, after an unauthenticated first pass surfaced two
false-positive failures in `PlayerActions::staff()` - a real `auth()->user()` non-null assumption
that only fails in a test with nobody logged in, never in real production usage where the panel
itself requires login first; re-tested authenticated and both passed clean):
- `ListPlayers` (the players table) - renders clean.
- `ViewPlayer` (the infolist/header stats) - renders clean, real username/rank/balances shown.
- All 8 relation managers (Bans/Tickets/Forum topics/Ledger/Audit history/Activity/Chat/Economy) -
  render clean, no exceptions. Pagination re-confirmed advancing on every tab that actually has more
  than one page of real data (Bans/Tickets/Forum topics only have 1 page each on the dev account, so
  their own pagination genuinely couldn't be exercised - not a gap, just not enough data to trigger
  a second page).
- `ComparePlayers` - renders and produces real comparison results.

Everything in this audit passed clean after the pagination fix - **the pagination bug above was the
one real defect this whole audit found**, not a symptom of a wider problem.

## Room chat: sender name was never shown (2026-09-27, same day)

User report: "for room chat other users name not shown". Real, confirmed gap: room chat rows in the
Chat tab only ever rendered `"{room name}: {message}"` - never the actual sender's username. This
was harmless-looking on the owner's own unfiltered tab (every row is implicitly "you"), but became a
real, concrete problem the moment the `withPlayer` cross-reference feature (built earlier this same
session) merged in a SECOND player's own messages into the same room - at that point there was no
way to tell, from the rendered row alone, which of the two people actually said which line. Fixed by
adding the real sender username into every room-chat row's own summary text
(`"{room} - {sender}: {message}"`), for both the owner's own messages and the cross-referenced other
player's messages. Verified live: the owner's own rows now read e.g. "Hix - Phi: hi", and cross-
referenced rows read "Hix - officialrooms: hi" - confirmed both usernames appear correctly in a
merged, filtered view via `Livewire::test()`, not assumed from the code alone.

## Mentions folded into the Chat tab (2026-09-27, same day)

Per explicit direction ("Mentions also in Chat tab"). Traced the real mention delivery code
(`MentionStore.java`) before building anything, since the earlier "Mentions follow-up" section of
this file already documented that mentions aren't a simple single-table log:
- An **online**, non-silent mention only ever echoes into real room chat (`talk()`, the same
  `RoomChatMessage` row `roomChatMessages()` already merges) - already covered, nothing new needed.
- A **silent** online mention leaves no trace anywhere at all, by design (confirmed in the real
  source, not assumed).
- Only an **offline** mention gets persisted anywhere - one row in `hcms_notifications`
  (`type='game_mention'`), written by `MentionStore::deliverOffline()`. This is the one real,
  previously-invisible category this pass adds.

New `MentionNotification` model (table `hcms_notifications`) - the real sender's username has no
dedicated column at all, it's only ever embedded in the notification's own `title`, always exactly
`"{username} mentioned you in the hotel"` (confirmed verbatim against the real Java string, not
guessed) - parsed via a fixed regex, not a loose match. `User::mentionsReceived()` covers the
recipient side (`user_id` = real FK). There's no FK for the SENDER side at all, so "mentions sent"
is resolved the only way the data allows: an exact `title = "{owner's own username} mentioned you in
the hotel"` match (safe since usernames are unique, not a partial/loose string search) - deliberately
NOT built as a fake `User` relation method, since it isn't a real foreign-key relationship, just a
raw query kept inline in the Chat tab's own closure.

Folded into the merged Chat tab as two more real row types, "Mention (sent)" and "Mention
(received)", both wired into the existing `type` filter and the existing "View player" action.
Verified live via `Livewire::test()` on both real sides of an actual mention history between two
dev accounts (Phi id 1 → officialrooms id 74): Phi's own Chat tab, filtered to "Mention (sent)",
showed all 8 real mentions with the correct recipient/body/timestamp and a working "View player"
link to officialrooms; officialrooms' own Chat tab, filtered to "Mention (received)", showed the
exact same 8 rows from the other side (Phi as sender) with a working link back to Phi - the two
sides of the same real data, cross-checked against each other, not verified from only one direction.

## Dedicated "Player" column added to all 3 merged tabs (2026-09-27, same day)

Per explicit direction ("please do for oother player name own row"). The other-party username
already existed as real data on every row (`other_username`, driving the `withPlayer` filter and the
"View player" action) but was never actually rendered anywhere on its own - it either lived only
inside the free-text summary string (Room chat's `"Hix - Phi: hi"`, added earlier this session) or
wasn't shown at all (Economy's `"With officialrooms - gave..."`, Activity's `"Banned officialrooms
(...)"`). Added a real `TextColumn::make('player')` to all three tables (Activity/Chat/Economy),
placed right after the Type badge, and simplified each summary string to drop the now-redundant name
prefix instead of showing it twice.

One real distinction worth keeping straight: `player` is purely a *display* field (always shows
whoever is actually relevant to that row - the sender for Room chat, even the owner's own name for
their own messages), while `other_user_id`/`other_username` (which drive the filter/action) stay
`null` exactly where they already were - the owner's own un-cross-referenced Room chat rows show
"Phi" in the Player column but still correctly have no "View player" button, since there's no real
*other* party there to link to.

Verified live via `Livewire::test()` against real data on all three tabs: Chat showed a real "Phi"
Player column next to "Hix: hi"; Economy showed "officialrooms" next to "gave 0, got 1 | Got:
Traffic Lights"; Activity's Room visit rows correctly showed "-" (no player) since there's no
counterpart for a solo room visit.

## Real mention-delivery log built (2026-09-27, same day) - answers "how can we do it" (log online
## mentions too, not just offline ones)

Directly follows the "mention non log anymore after 11pm why?" investigation earlier this session,
which root-caused (via a real live test, not just reading code) that only OFFLINE mentions were ever
written anywhere - an ONLINE mention (the common case whenever both players are actually playing) was
delivered live with zero persisted trace beyond its own room-chat echo. The user asked how to fix
that gap; this is the real fix, not a workaround.

**Deliberately did NOT write into `hcms_notifications`** (the real player-facing website bell) for
online mentions - that table drives what an actual player sees in their own notifications, and
online mentions are already delivered live in-game, so adding a redundant bell entry for something
the player already saw would be a real, unwanted product change, not a staff-tooling improvement.
Instead, built a genuinely separate, staff-only audit table:

- New migration (hCMS): `hcms_mention_log` (`id`, `sender_id`, `target_id`, `message`, `group_kind`
  nullable, `delivered_live` boolean, `created_at`) - real FKs both ways, unlike
  `hcms_notifications` which has no sender column at all (only ever embedded in a title string,
  which is what the earlier version of the Chat tab's "Mention (sent)" rows had to fragile-parse
  around).
- Plugin: one shared `MentionStore.logMention(senderId, targetId, message, deliveredLive,
  groupKind)` helper, wired into all three real delivery paths - `deliver()` (1-to-1 online,
  `deliveredLive=true`), `deliverOffline()` (1-to-1 offline, `deliveredLive=false`, alongside the
  existing, untouched `hcms_notifications` insert), and `deliverGroup()`'s own per-recipient loop
  (`@all`/`@staff`/`@vip`, always `deliveredLive=true` since a group mention only ever reaches
  players who are currently online - there is no offline group-delivery path at all).
- hCMS: new `MentionLog` model, real `User::mentionsSent()`/`mentionsReceived()` relations (replacing
  the old `MentionNotification`-based ones, which only ever covered the offline half and needed a
  fragile exact-string match on `hcms_notifications.title` to find "sent" mentions at all - deleted
  outright, fully superseded, no remaining references). Chat tab's mention rows now show `(offline)`
  next to the message when `delivered_live` is false, and nothing extra when it was delivered live -
  a real, visible distinction, not silently merged.

**Verified live, both directly and from both sides**: sent a real `@all` group mention (0 real
recipients reached, since the only other online player wasn't staff and the sender excludes
themselves - correctly produced zero log rows, not a bug, a real precondition genuinely unmet) and a
real leading `@officialrooms` mention while the target happened to be offline (`delivered_live=0`
recorded correctly, matching the by-design offline path). Confirmed via `Livewire::test()` from BOTH
sides of that real mention: Phi's own Chat tab (filtered to "Mention (sent)") showed the real row
with "(offline)" and a working link to officialrooms; officialrooms' own Chat tab (filtered to
"Mention (received)") showed the identical row from the other side, with a working link back to Phi.
The online-delivery path (`deliver()`) was verified by direct code inspection rather than a second
live reconnection cycle - it calls the exact same, already-proven `logMention()` insert, just with
the literal `true` argument instead of `false`, so the underlying write mechanics are the same ones
already confirmed working for the offline case.

## Room visits split into "Entered room" / "Left room" (2026-09-27, same day)

Per explicit direction ("need left room also"). The Activity tab's own "Room visit" rows previously
combined enter+exit into one row ("Entered 'X', left HH:MM") - inconsistent with the Logged in/Left
client pair built earlier this session, which already gives login and logout their own separate
rows. Split `room_enter_log` the same way: **"Entered room"** (at `timestamp`) and, only once a
session has actually closed (`exit_timestamp > 0`), a separate **"Left room"** row showing the real
stay duration in minutes - same shape as the session pair, and both individually filterable via the
existing multi-select type filter. Verified live via `Livewire::test()`: unfiltered feed shows real
alternating Entered/Left room pairs; filtering to "Left room" alone returns only real exit rows with
correct stay durations, zero "Entered room" rows leaking through, and vice versa.

## Follow's "same room" feedback: whisper -> bubble, then wording aligned with the chat command
## (2026-09-27, same day)

Per explicit direction: "when clicking follow on mention or anywhere else should give bubble instead
of whisper", then "i like the follow command description better" (clarified via a follow-up
question to mean the literal in-game text, "%user% seems to be in this room already!").

**Real cause traced, not guessed**: stock Arcturus has TWO independent "follow a friend to their
room" mechanisms that happen to share the same underlying concept but not the same code path:
- The UI button (friends bar's `.icon-friendbar-visit`, the friends messenger's own Follow button,
  and the mention card's Follow button - `MentionsListView.tsx` reuses the exact same
  `FollowFriendMessageComposer`, confirmed in source, which is why the user saw this "on mention or
  anywhere else") - handled server-side by `StalkFriendEvent.java`.
- The real stock chat command `:stalk`/`:follow` (its own registered keys, `commands.keys.cmd_stalk`
  = `stalk;follow;rape` - the `rape` key is a genuine stock-Arcturus default, not anything hCMS added)
  - handled by `StalkCommand.java`, an entirely separate class.

Both hit an equivalent "you're already in the same room as them" case, but with two real,
independently-configured bugs:
1. `StalkFriendEvent`'s own same-room branch builds its whisper via `RoomChatMessage(text, habbo,
   habbo, bubble)` - the SAME real Habbo passed as both sender and target, a genuine self-whisper no
   real player-initiated whisper can ever produce (whispering yourself isn't a real chat mode). This
   is a different shape than `StockCommandFeedback.java`'s already-existing null-habbo detection (a
   *different* system-notice pattern - `Habbo.whisper()`, used by real stock commands like `:stalk`
   itself, always leaves `habbo` null instead). **Fixed** by widening
   `StockCommandFeedback.onOutgoingPacket()`'s check to also treat `sender != null && sender ==
   target` as a system notice - both real, distinct "this isn't a genuine player-to-player whisper"
   signals now handled by the one interceptor, still without touching core at all.
2. Even after both paths correctly become bubbles, they used **two different real locale keys with
   different wording**: `StalkFriendEvent` reads `stalk.failed.same.room` ("%user% is in this room
   too!"), while `StalkCommand` (which was ALREADY a bubble before this session, since
   `Habbo.whisper()`'s own null-habbo shape was already caught by the original, pre-existing
   interceptor) reads `commands.generic.cmd_stalk.same_room` ("%user% seems to be in this room
   already!") - the phrasing the user said they preferred. **Fixed as a pure data change** - updated
   `emulator_texts.value` for `stalk.failed.same.room` to match the command's own wording exactly,
   no code touched at all for this half of the fix (text values are DB rows, not hardcoded Java
   strings, in this stock table).

Both changes deployed: the plugin rebuild (part 1) and an emulator restart (part 2, since
`TextsManager` caches every row in memory at boot with no live-reload command the way permissions
has one via `:update permissions` - a full restart was the only way to pick up the new text). Boot
verified clean both times.

**Verification depth, stated honestly**: part 2 (the text change) is a simple, direct DB-value swap
with no ambiguity - confirmed via a direct `SELECT` after the update, not assumed. Part 1 (the
whisper-to-bubble widening) was verified by exact source-level match against the real bug
(`StalkFriendEvent.java`'s own same-room branch, read directly) and reuses a mechanism
(`StockCommandFeedback`) already proven working repeatedly this session for the analogous case - but
a live, both-accounts-in-the-same-room click-through of the UI Follow button specifically was
**not** completed this pass (repeated dev-account reconnect flakiness in this environment prevented
it, documented honestly rather than claimed as tested). If this specific whisper resurfaces after a
real click, that's a real signal there's a second, still-unfound code path producing it - re-open the
investigation rather than assuming this fix is incomplete without new evidence.

## Follow: the other 4 real outcomes given real feedback too (2026-09-27, same day)

Per explicit follow-up: "what about the outside room i want all behaviour have feedback error no
username success etc all" - the user wanted every real outcome of the UI-button Follow feature
covered, not just the one "same room" case already fixed above.

**Full real outcome inventory, traced from the actual source, not guessed**, for `StalkFriendEvent`
(server) / `FollowFriendFailedEvent` (the client's own real name for the failure composer,
confirmed via `NitroMessages.ts`):
1. Target not on the sender's friend list -> `NOT_IN_FRIEND_LIST`
2. Target offline -> `FRIEND_OFFLINE`
3. Target has "block following" on -> `FRIEND_BLOCKED_STALKING`
4. Target online but not currently in any room -> `FRIEND_NOT_IN_ROOM` (the literal "outside room"
   case asked about)
5. Target in a different room -> real success, `ForwardToRoomComposer` -> client's own
   `RoomForwardEvent` -> confirmed ALREADY correctly wired in `useNavigator.ts` (`TryVisitRoom`) -
   this path was never broken, verified by reading the real hook, not assumed working.
6. Target in the same room -> the whisper/wording fix from the section above.

**Real, confirmed gap**: cases 1-4 had ZERO client-side feedback of any kind before this pass - not a
whisper, not a bubble, nothing. `FollowFriendFailedEvent` is a real, already-registered message in
the vendored `@nitrots/nitro-renderer` package (so the framework CAN parse it), but a project-wide
search of this client's own `src/` found no component anywhere calling `useMessageEvent` for it -
the server sends a real, correct composer and this client silently drops it on the floor every time.

**Fixed server-side** (no client changes needed, keeping the fix in the plugin where every other
"stock composer needs a real bubble" fix already lives this session) - new
`com.hcms.emulatorplugin.commands.FollowFeedback`, registered alongside `StockCommandFeedback` in
`HcmsPlugin.java`, intercepts the real outgoing `StalkErrorComposer` and converts each of the 4 real
error codes into a `CommandFeedback.tell()` bubble:
- `FRIEND_OFFLINE` / `FRIEND_NOT_IN_ROOM` reuse the exact real stock text already used by the
  `:stalk`/`:follow` chat command for the equivalent case (`commands.error.cmd_stalk.not_found` /
  `commands.error.cmd_stalk.not_room`) - real, already-verified stock wording, not invented.
- `NOT_IN_FRIEND_LIST` / `FRIEND_BLOCKED_STALKING` have no equivalent in the chat command (it works
  on any username, not just friends) - these two use new, plain text added to `emulator_texts`
  (`stalk.failed.not_friend` / `stalk.failed.blocked`), **flagged honestly as new wording with no
  existing reference**, unlike the reused pair above.
- The reused pair's own text contains a literal `%user%` (the chat command has the real username in
  scope at that point; `StalkErrorComposer` only ever carries a bare error code, no username) -
  stripped/replaced rather than shown as a broken raw placeholder, since resolving the real target
  username here would mean re-implementing `StalkFriendEvent`'s own friend/online lookup a second
  time outside core, not worth it for a feedback bubble.

Deployed (rebuild → stop → copy jar → restart), boot-verified clean.

**Verification depth, stated honestly**: this is a direct, simple `int -> String` mapping onto an
already-proven bubble mechanism (`CommandFeedback.tell`, exercised successfully dozens of times this
session) - high mechanical confidence, confirmed by a clean Maven build and a clean boot. A live
click-through of any of these 4 specific cases was **not completed this pass**: reproducing them
needs a second real account in a very specific state (not-a-friend, or offline, or blocked, or
between rooms) and repeated dev-account reconnect attempts this session hit the same connection
flakiness already documented in the section above. The easiest real repro path for whichever of
these 4 comes up naturally: the mention card's own Follow button (`MentionsListView.tsx`) calls the
exact same `FollowFriendMessageComposer`, and doesn't require the mention's sender to be a friend at
all - a real mention from a non-friend, followed, is the simplest way to exercise
`NOT_IN_FRIEND_LIST` specifically without needing to stage two accounts in matching states.

## Mod Tools layout fix (2026-09-27, same day) — real bugs found via minified-JS fallback, not live DOM

User asked to "fix mod tool now layout," then explicitly nudged "habbocity" mid-turn — the standing
instruction to verify against the real reference rather than trust the already-ported CSS file
alone. **Live DOM capture turned out not to be possible this pass**: searched the currently-open
`habbocity.fr` reference tab's own toolbar for a staff/mod-tools trigger and found none at all
(`icon-habbo`/`item-avatar`/`icon-rooms`/`icon-catalog`/`icon-inventory`/`icon-camera`/
`icon-friendall`/`icon-message` only) — the account logged into that tab does not have staff rank on
the reference site, so `.nitro-mod-tools` itself was never reachable live this pass. **Falling back
to the next real source in the priority chain** (per Block 1: "Rendered DOM > Computed/Styles >
loaded stylesheet/source > loaded JS > your own assumption") — this project already has a real,
previously-dumped copy of HabboCity's own compiled React bundle on disk at
`c:\tools\nitro-catalog-copy\scripts\out\hc\index-b7d2b6d3.js` (1MB, confirmed real via
`dump-network-body.js` in an earlier session) — grepped it directly for every `nitro-mod-tools*`
classname to pull the real, verbatim component source. **This is real source-of-truth, not a guess**
— it's the actual shipped JSX, just minified, the same "fall back to the loaded JS" step this file's
own DOM↔JS cross-reference mandate already calls for when live interaction isn't available. Every
fix below is grounded in an exact string match against that real bundle, not inferred or assumed.

**Confirmed real bugs, all files fixed, `tsc`/HMR both clean:**
- **`theme="primary"` was wrong on every single Mod Tools window without exception** (the main
  launcher plus all 7 sub-windows: Room Info, Room Chatlog, User Chatlog, Issue Chatlog, User Info,
  Mod Action, Send Message, User Visits, Handle Issue) — the real reference uses `theme="primary-slim"`
  everywhere in this family (confirmed via exact string match, `theme:"primary-slim"`, at every one
  of these classnames in the real bundle). Only `.nitro-mod-tools-tickets` genuinely has no `theme`
  prop at all in the real source (ours already matched). This is the same wrong-theme-variant bug
  class already documented multiple times elsewhere in this file (Catalog/Inventory/Settings/Friends
  List) — here it turned out to affect the *entire* Mod Tools family at once, not just one component,
  most likely because this whole family was ported in one early, pre-strict-protocol pass. Fixed in:
  `ModToolsView.tsx`, `ModToolsRoomView.tsx`, `ModToolsChatlogView.tsx`, `ModToolsUserChatlogView.tsx`,
  `CfhChatlogView.tsx`, `ModToolsUserView.tsx`, `ModToolsUserModActionView.tsx`,
  `ModToolsUserSendMessageView.tsx`, `ModToolsUserRoomVisitsView.tsx`, `ModToolsIssueInfoView.tsx`.
- **Every single one of these same windows also carried an invented `className="text-black"` on its
  `NitroCardContentView`** (and on two native `<table>` elements, and on two `<Grid>` rows in User
  Visits) — the real source has no such class anywhere in this family (confirmed absent at every one
  of the same exact-match points above). Same root-cause pattern as the already-documented Catalog
  purchase-widget black-text bug (`Text`'s old `variant='black'` default) — here it's a literal,
  separately-invented Bootstrap utility class rather than a component default, so it needed removing
  file-by-file rather than a single shared-default fix. Removed from all 10 files above.
- **The main launcher's hardcoded `style={ { height: 205 } }`** — removed earlier this same pass
  (before the "habbocity" nudge), based on `_44-nitro-mod.scss`'s already-correctly-ported
  `.nitro-mod-tools { width: 175px }` with no height rule at all. The minified-source fallback above
  independently confirms the real component itself passes no `style` prop whatsoever on this window —
  the removal was correct, now confirmed two ways instead of one.
- **User Info panel (`ModToolsUserView.tsx`) was missing a real 5th action button, "Profile"**
  (`onClick:f=>Xn(r.userId)` in the real source — resolved to this project's own already-established
  `GetUserProfile(userId)` helper, the same one used by every other "click a name/icon to open a
  profile" spot in this codebase: friend rows, group members, mention text, room-tools owner icon,
  etc.). Ours only had 4 buttons (Room Chat/Send Message/Room Visits/Mod Action). Added the 5th.
- **Same panel's button row used an invented `<div className="d-flex justify-content-between mb-2">`**
  instead of the real `mod-tools-group-button` class — real, and not invented: `_44-nitro-mod.scss`
  already has a matching rule (`.nitro-mod-tools-user .mod-tools-group-button div { flex: 1 }`) that
  was simply never attached to anything, since the JSX never used the real classname. Rebuilt as
  `<Flex gap={1} shrink className="mod-tools-group-button">`, matching the real source's own
  `y.gap:1,shrink:!0` shape.
- **Same panel's scrollable table had no `ScrollContainer` at all** — real source wraps it in what is
  almost certainly this project's own already-established `ScrollContainer` primitive (`Ve` in the
  minified source, used the same way this project already uses `ScrollContainer` everywhere else a
  scrollable list/table sits inside a card). Wrapped it.
- **User Visits panel** (`ModToolsUserRoomVisitsView.tsx`): missing `resize="both"` on the
  `NitroCardView` (real source has it); the room-name `<Text>` was missing a real `textBreak` prop
  (`textBreak:!0` in the real source — this project's own `Text` component already supports it,
  confirmed in `common/Text.tsx`) — without it, a long room name has nothing stopping it from
  overflowing the `g-col-7` cell instead of wrapping.
- **Tickets panel** (`ModToolsTicketsView.tsx`): missing `resize="both"` (real source:
  `resize:"both",className:"nitro-mod-tools-tickets"`).

**Honest verification-depth caveat, per this file's own standing rule ("if you cannot verify it, mark
it UNVERIFIED and do not implement it as fact")**: every fix above is grounded in an exact string
match against the real, previously-dumped compiled bundle — real source, not invention — but this is
source-level confirmation, not the full live DOM → Computed Styles → CSS → JS → compare-ours chain
Block 1 asks for, because the reference account currently available has no staff access to actually
open `.nitro-mod-tools` live. If a staff-capable HabboCity reference account ever becomes available,
re-run the full live chain against it before treating this as fully done — in particular, the
Tickets-panel tab-nesting question above and the exact rendered spacing/height of the User Info
panel's new 5-button row are the two open items a live capture would resolve that source-reading
alone couldn't.

`ModToolsBotsView.tsx` (32KB own-feature panel, not part of the real reference at all — confirmed via
the same bundle grep, the real Mod Tools launcher has exactly 4 buttons, Room Tool/Chatlog Tool/
User/Report Tool, no Bots button) was **not** touched this pass — still the same "not read at all
yet" flagged gap from the write-up section above, unrelated to this layout fix.

**Follow-up, same day: user reported "still some black text" after the pass above.** A project-wide
grep of `components/mod-tools/` for `text-black` (the same first-pass sweep should have caught, but
only checked the files already opened for the theme fix, not every file in the family) turned up
5 more real instances, all confirmed absent in the real bundle the same way as before:
- `views/chatlog/ChatlogView.tsx` — the shared header-row `Grid` used by ALL THREE chatlog windows
  (Room/User/Issue Chatlog all render this same component) had `className="text-black fw-bold
  border-bottom pb-1"`; real source (`fw-bold border-bottom pb-1`, no `text-black`, confirmed at 5
  separate real occurrences in the bundle — this exact header row is reused for multiple real
  windows on the reference side too). This was almost certainly the actual visible black text the
  report was about, since this component is the real content of 3 of the family's windows and was
  never opened during the first pass (only each window's own outer `NitroCardView`/
  `NitroCardContentView` was checked, not what they render inside).
- `views/tickets/ModToolsOpenIssuesTabView.tsx`, `ModToolsMyIssuesTabView.tsx`,
  `ModToolsPickedIssuesTabView.tsx` — each had the identical pattern on both their header `Grid` and
  their per-row `Grid` (`text-black fw-bold border-bottom pb-1` / `text-black py-1 border-bottom`);
  real source confirmed the same two class-lists with no `text-black` at 5 separate real
  occurrences each. These are the Tickets window's own 3 tab bodies — not opened during the first
  pass either, since that pass only touched `ModToolsTicketsView.tsx`'s own shell.
- `views/bots/ModToolsBotsView.tsx`'s `NitroCardContentView` also had `text-black` — left alone in
  the first pass since this panel is a confirmed own-feature with no real reference to check against
  (see above), but fixed anyway since it's the same real visual bug (black text against this
  project's dark theme) regardless of whether HabboCity has an equivalent window to compare to.

All 5 removed. Lesson for next time: **"fix the theme/text-black bug for this component family"
means grepping the whole family's directory tree for the pattern, not just the files whose own
`NitroCardView` shell was already opened** — a window's content is very often a separate, nested
component (`ChatlogView`, the 3 issue-tab views) that a shell-level check doesn't see at all.

**Second follow-up, same day: user asked to "fix layout spacing based on like before inventory and
all see tickets" — resolves the Tickets tab-nesting question the first pass had deliberately left
open.** `InventoryView.tsx` (already CDP-verified against the live reference, per its own inline
comment) confirmed a real, live precedent for exactly the structure the Tickets minified source
showed: `NitroCardTabsView` living **inside** `NitroCardContentView`, not as a sibling before it —
Inventory's own comment states this plainly ("`NitroCardTabsView` is NOT a sibling of content-area,
it lives INSIDE content-area-inner"). This resolves the earlier uncertainty (previously flagged as
"deliberately left as a sibling... no live DOM to confirm whether this nesting is real or just how
the minifier serialized an otherwise-identical structure") — it's real, a second independent window
in this same project already proves the mechanism, not a minifier artifact. Restructured
`ModToolsTicketsView.tsx` to nest `NitroCardTabsView` inside `NitroCardContentView`, matching both
the Tickets bundle source and the Inventory precedent.

Re-pulled the 3 real ticket-tab-body components (`LD`/`kD`/`DD` in the minified bundle — Open/My/
Picked Issues) in full while investigating this — their own internal `Column`/`Grid`/gap structure
already matched ours exactly (`gap={0}` outer, `gap={2}` header row, `gap={1}` on each `Grid`, plain
`overflow="auto"` list — **no `ScrollContainer` used here in the real reference**, confirmed
directly, unlike most other scrollable lists elsewhere in this project). One real, separate bug
found in the same read: the header row's 3rd column reads **"Room/Player"** in the real source, not
just "Room" (ours had "Room" in all three tab views) — fixed in `ModToolsOpenIssuesTabView.tsx`,
`ModToolsMyIssuesTabView.tsx`, `ModToolsPickedIssuesTabView.tsx`.

**Verification depth**: same as the rest of this Mod Tools pass — exact string match against the
real dumped bundle, not a live DOM capture (still no staff-capable reference account available this
session). The Inventory cross-reference specifically, though, IS live-CDP-verified (by an earlier
session, per its own code comment) — so the tab-nesting fix rests on stronger footing than a bare
minified-source read alone.

## `:enable vip` gate had a real bypass: the raw numeric id skipped the permission check (2026-09-27)

User report: "when i use enable 935 it still gives user" — i.e. a plain (non-VIP) account could still
get the real VIP effect by typing the raw numeric command directly. Root cause, confirmed by reading
`HabboCityCommands.onEnableCommand` directly: the interceptor built earlier this session (see
"`:enable vip` built end-to-end" above) only ever matched when `params[1]` was literally the string
`"vip"` — a real `:enable 935` (the actual numeric id, same one the "vip" alias itself resolves to)
fell straight through to the untouched stock `EnableCommand`, which applies any numeric effect id to
anyone with **no permission check of any kind** in stock Arcturus. So the `cmd_hc_enablevip` gate only
ever covered the friendly alias, never the real id it was supposed to protect — a real, exploitable
gap, not a client display issue (confirmed the server-side `EffectMap.json` id→lib mapping itself was
already correct from the earlier session's fix; this was purely a missing permission check).

Per explicit direction ("just do in plugin if sent it should bubble 'You are not allowed to use this
effect' or so"): widened `onEnableCommand` to also match when `params[1]` equals the literal
`VIP_EFFECT_ID` (935) string, not just `"vip"` — same cancel-then-check-permission-then-toggle flow
either way, reusing the exact same existing bubble text ("You do not have permission to set this
effect!") the "vip" keyword path already used, rather than inventing new wording for the same denial.
Every other real `:enable <number>` call is still completely untouched and falls through to the stock
command exactly as before — this only ever intercepts the one specific VIP effect id, not effects in
general.

Rebuilt, deployed (stop → copy jar → restart), boot log confirmed clean ("hCMS plugin: 30 HabboCity
commands registered", no new errors, both test accounts reconnected fine). **User confirmed live
("works")** after testing `:enable 935` as a non-VIP account — trusted directly over this session's
own inconclusive CDP bubble-detection attempt (the dev tabs kept disconnecting/reconnecting on their
own during the automated test, an unrelated environment flakiness already documented elsewhere in
this file, not a sign the fix itself was wrong).

## `:faceless`/`:face` was corrupting the real saved look; rebuilt as a real, non-persistent toggle
(2026-09-27, same day)

User reports, verbatim, in order: "faceless should not be saved changing room its back also" then,
after asking what the real reference does, "on habbocitys using noface again shows face back".

**Root cause, confirmed by reading `FacelessCommand.java` directly (Arcturus core, read-only)**: the
stock command finds the avatar's `hd-<set>-<color>` figure part and calls
`HabboInfo.setLook(...)` directly with the set id replaced by `99999` (a blank/faceless head) - with
no code anywhere to ever put the real head back. `setLook()` only touches the in-memory field, but
this hotel (like any real Arcturus hotel) eventually saves that same field to the account's real,
persisted `users.look` column (autosave / disconnect) - so a player using this command could get their
real, permanent avatar figure stuck faceless forever, surviving logout and room changes alike. This
is a real, pre-existing stock-Arcturus bug, not something this session's own earlier work introduced.

**Real reference behaviour, confirmed by the user directly**: HabboCity's own equivalent is a plain
toggle - type it once, the face disappears; type it again ("noface"), the face comes back - and
(implicitly, since the user called the persistence itself a bug) it must never touch the account's
real saved figure at all.

**Fixed via interception, never touching core**: `HabboCityCommands.onFacelessCommand` (a new
`UserExecuteCommandEvent` listener, same mechanism as `onEnableCommand`/`CommandConfirm.onExecute`)
cancels the stock `FacelessCommand` outright and reimplements the exact same real head-blanking
transformation as a genuine toggle:
- `FACELESS_REAL_LOOK` (a `userId -> real look string` map) holds the account's true figure only for
  as long as the fake head is showing - so a room entered while still toggled on also renders
  faceless (matching a real toggle, not a one-room-only effect), but the map (not the account row)
  is the only place the real figure ever has to compete with the fake one.
- Typing the command again restores the real look from that map and clears the entry - "noface again
  shows face back", confirmed as the intended design, not guessed at.
- **Follow-up fix, same day: the toggle sent no feedback bubble at all** ("where are the bubblealert"
  - a real omission, not a design choice - every other real toggle in this same file,
  `toggleVipEffect`/`:cars`, already says something both ways). Added `say(me, ...)` after the two
  composer sends, mirroring `toggleVipEffect`'s own two-sided message shape exactly: "Your face is
  gone. Type the command again to get it back." on the way in, "Your face is back." on the way out.
- **Safety net for the case the user never toggles back before disconnecting**: `HcmsPlugin`'s own,
  already-existing `onUserDisconnect` listener (added to, not duplicated - the same single-listener
  rule this file already enforces elsewhere) now also calls
  `HabboCityCommands.restoreFacelessOnDisconnect(habbo)`, which puts the real look back in memory
  *before* whatever the normal disconnect save does - so even an abrupt disconnect while toggled on
  can never let the fake head reach the database.
- Added the real reference trigger word: `emulator_texts.commands.keys.cmd_faceless` was
  `"faceless;face"` (stock Arcturus's own two keys) - added `noface` as a third real key (a pure data
  change, needs the restart it already got to take effect, same as this session's earlier
  `stalk.failed.same.room` text fix) so `:noface` reaches `FacelessCommand` (and therefore this
  interceptor) at all, matching what the user says HabboCity itself calls it.
- `HelpCommandData.ts`'s own description ("your avatar loses its face.") was missing the toggle-back
  half entirely - fixed to "...Type the command again to get it back.", matching the exact phrasing
  convention this same file already uses for `:cars`/`:togglefps`, its own two other real toggle
  commands.

Rebuilt, deployed (stop → copy jar → restart), boot log clean, no faceless-related errors either
before or after. **Verification depth, stated honestly**: this is source-level-confirmed (the stock
command's own real bug, read directly) plus a mechanically-safe design (never assigns the fake head
anywhere except a scoped local map, restores it on both the manual-toggle and disconnect paths) - not
yet click-tested live end-to-end this pass (would need a real figure-string capture before/after
toggling, and a real disconnect-while-toggled-on repro, neither attempted yet). If this resurfaces,
the next step is a real before/after `users.look` DB read across exactly those two paths, not another
source re-read - the mechanism has already been read carefully once.

## Room Chat History window rebuilt - wrong mechanism entirely, not a styling gap (2026-09-27, same day)

Per direct instruction ("next room chat history") - the room-tools bar's own `.icon-chat-history`
icon (`CreateLinkEvent('chat-history/toggle')`) already had a real, wired component,
`ChatHistoryView.tsx`, but it was never actually built through this project's own per-component
protocol - the code style, formatting and structure were all visibly stock/unverified (flagged
earlier this file's own "Full feature inventory" notes as an untouched area). Pulled the real
`"nitro-chat-history"` component from the dumped bundle and found this was a real case of the
project's own "wrong mechanism entirely" rule, not a CSS/spacing tweak:

- **Real root is a plain `NitroCardView`/`NitroCardHeaderView`/`NitroCardContentView` window**
  (`theme:"primary-slim"`, real headerText `room.chathistory.button.text` - the same locale key the
  room-tools icon's own tooltip already uses) - this file had no header/close-button at all, just a
  bare `<div className="d-flex gap-2 nitro-chat-history">` plus an invented `chat-collapse-button`
  div with no real reference equivalent. Rebuilt on the standard card shell every other window in
  this project already uses.
- **A real filter-type dropdown was missing entirely** - the reference has a `CustomSelect` (this
  project's own already-built primitive, reused, not a new one) right next to the search input, with
  4 real options (`all`/`username`/`message`/`room` - French-locale capture said Tout/Pseudonyme/
  Message/Appartement, translated per this project's own English-throughout convention). The old file
  only ever substring-matched name+message together with no way to scope the search at all. Wired the
  4 filter values against this project's own real field shapes (`username`→`TYPE_CHAT` entries'
  `name`, `message`→`TYPE_CHAT` entries' `message`, `room`→`TYPE_ROOM_INFO` entries' `name`) - the
  predicate itself isn't traced from the reference's own minified filter logic (not visible from a
  static bundle read), an honest, reasonable implementation against real data shapes rather than a
  guess at new fields, same category as this project's own established acceptable-approximation
  precedents elsewhere (Wealth chart curve smoothing, etc.).
- **`dangerouslySetInnerHTML` removed - the real reference never uses it here at all.** The old file
  injected raw HTML for both the username (`` `${row.name}: ` ``) and the message
  (`` `${row.message}` ``); the real source renders both as plain text children
  (`{row.name}: ` / `{row.message}`) - a real, confirmed simplification that also removes an
  unnecessary raw-HTML-injection surface this component never actually needed (chat text/usernames
  were never real HTML to begin with).
- **The `TYPE_ROOM_INFO` row had the same recurring invented `text-black` bug** (`className="flex-
  grow-1 d-inline text-black text-wrap text-break"` wrapping an unnecessary extra `<span
  className="text-white">`) - real markup is just `<i className="icon icon-small-room" /><Text
  textBreak wrap grow>{row.name}</Text>`, relying on the same already-confirmed real inheritance
  (body's own white text) as every other place this exact bug was found and fixed this session.
- Every row-level `Flex` was missing `shrink` - same pattern as every other component fixed this
  session (Help/Mod Tools families) - added throughout.
- **Real, honest gaps, flagged not guessed**: the real reference splits bubble background
  (`colorBubble`) and message text colour (`colorMessage`) into two separate fields; this project's
  own chat pipeline (`useChatWidget.ts`'s `addChatEntry` call) only ever tracks one `color` (the
  user's own selected bubble colour) with no rank-based message-text colour threaded through at all -
  kept using the one real field for the bubble background, left the message text at its default
  inherited colour rather than inventing a second field with no real source. The reference's own
  `.bubble-container` also has real `onMouseEntering`/`onMouseLeave` handlers (minified, calls
  unreadable from source alone) - left unimplemented, flagged as genuinely unverified behaviour
  rather than guessed at, same category as `.icon-rooms`/`FaRecycle` elsewhere in this file.

**Verification depth, stated honestly**: `tsc` clean, HMR clean. This is source-level-confirmed
against an exact string match in the real dumped bundle (the strongest available evidence without a
staff-capable or otherwise reachable live reference session for this specific window this pass), not
a live DOM/computed-style capture - the dev-client tab available at the time of this fix had gone
stale (disconnected across the two emulator restarts earlier this same session) and re-verifying live
was not completed this pass. Re-run the full live chain (open a fresh room, click the chat-history
icon, compare against a live reference capture) before treating this as fully done.

## "Thanks for your call" duplicate-alert bug: built a second confirmation the project already had
(2026-09-27, same day)

Real mistake, caught by the user directly ("fix Thanks for your call it sending multiple times it
was there before you dont have to create new one") - exactly the failure this project's own "SEARCH
OUR PROJECT BEFORE CREATING ANYTHING" rule exists to prevent, and it still happened.

**What was built, wrongly, without searching first**: while fixing the Help-family layout and the
Profile Moderation report buttons, added a brand-new client-side "Thanks for your call" confirmation
in two places - a new `ReportState.REPORT_SENT` step + `ReportSentView.tsx` shown immediately after
`ReportSummaryView`'s submit button, and a `simpleAlert(...)` call fired immediately inside
`UserProfileModerationView.tsx`'s own report-confirm handler. Both used the real, correct locale keys
(`help.cfh.sent.title`/`.text`), which is exactly why the duplication wasn't obvious at a glance - the
text looked right, so it read as "the fix," not "a second copy of something that already exists."

**What already existed, found only after being told to look**: `hooks/help/useHelp.ts` already has a
real `useMessageEvent<CallForHelpResultMessageEvent>` listener that fires
`simpleAlert(..., LocalizeText('help.cfh.sent.title'))` the moment the **server** actually confirms
the call for help was received - not a client-side guess fired the instant the button is clicked.
Since `useHelp()` is a shared `useBetween` hook and `HelpView` (which owns it) is always mounted
(`MainView.tsx`), this listener is already live for **every** real `CallForHelpMessageComposer` send
in the whole app, regardless of which UI fired it - the multi-step Help/CFH window AND the Profile
Moderation report buttons both funnel into the exact same composer, so both were already covered
before this session ever touched either one. The two additions above didn't fix a gap - they added a
second, purely-optimistic alert on top of an already-working, more-correct (server-confirmed, not
guessed) one, so a single report action showed the message twice.

**Reverted, in full**: deleted `ReportSentView.tsx`; removed the `REPORT_SENT` value from
`ReportState.ts` and its `HelpView.tsx`/`ReportSummaryView.tsx` wiring (submit goes back to
`setActiveReport(null)` directly, closing the window immediately - the real confirmation now shows
on its own once the server responds, exactly as it already did before this session); removed the
`simpleAlert` call and its now-unused imports from `UserProfileModerationView.tsx`. **Kept** the one
real, unrelated fix made in the same pass - `report.button` (the specific per-action confirm-dialog
title, e.g. "Report banner", matching the real reference exactly) instead of a single generic
`'Report'` literal for all four report buttons - that part was a genuine bug with no duplicate
anywhere, confirmed separately against the real bundle, not part of this revert.

**Lesson, stated plainly for next time**: "the locale key is real" is not the same check as "does
this already exist somewhere" - both additions used correct, verified `help.cfh.sent.*` text, which
made the duplication easy to miss without actually grepping the project for `CallForHelpResultMessageEvent`/
`help.cfh.sent` first. The search step this project's own rules mandate has to happen even when the
thing being added *feels* like a small, obviously-needed addition - especially then, since that's
exactly when skipping the search feels harmless.

## Follow-up to the duplicate-alert revert: the EXISTING confirmation genuinely never fired, real
data gap found and fixed (2026-09-27, same day)

User, after the revert above: "use the existing and fire that also created still not working" - i.e.
don't build a second mechanism, make the real one actually fire, since testing showed it still
wasn't - a real, separate bug from the duplication itself, not a false alarm about the revert.

**Root cause, traced through the real server handler (`ReportEvent.java`, Arcturus core, read-only -
confirmed by matching its own field reads (`message, topic, userId, roomId, messageCount`) against
`CallForHelpMessageComposer`'s real constructor args, so this is genuinely the handler both send
sites reach, not a guess)**: for a real, existing user id (`userId != -1` - true for every Profile
Moderation report), the handler does
`this.client.sendResponse(new ModToolReportReceivedAlertComposer(REPORT_RECEIVED, cfhTopic.reply))`
unconditionally once it finds a `CfhTopic` match - and `cfhTopic.reply` on a `null` `cfhTopic`
(`getCfhTopic(topic)` returns `null` for any topic id not present in this hotel's own
`support_cfh_topics` table) throws a real `NullPointerException`, crashing the handler before the
response is ever composed or sent. Checked the actual table directly, not assumed: this hotel's own
`support_cfh_topics` only had topic **13** (`badwords.motto`) - **topic 106**, the id 3 of the 4 real
Profile Moderation report buttons all use (banner/motto/look; only the 4th, username, uses 13), was
completely missing. So the "existing" `CFH_RESULT_MESSAGE` (opcode 3635) confirmation `useHelp.ts`
already listens for was never a client-side bug at all - the server-side response for 3 of those 4
report types was crashing before it could ever be sent, and only ever worked for the 1 report type
(username) that happened to use an id this hotel's data already had.

**Fixed as a real data gap, not a code change** (same category as this session's own earlier
`EffectMap.json` id 935 fix and `FigureData.json` colour merge - `support_cfh_topics` is ordinary,
admin-configurable content, not something `ReportEvent.java` itself is wrong to trust): confirmed
topic 106's real meaning first (`help.cfh.topic.106` = "Other Problem" in this project's own already-
captured real locale data - a genuine generic catch-all, matching its reuse across three unrelated
"invalid X" report buttons), then inserted the missing row directly
(`id=106, category_id=3` - the same category as topic 13, keeping all profile-content reports grouped
together for staff - `name_internal='other.problem', name_external='Other Problem', action='mods'`
- so it stays open for real staff review rather than auto-closing, matching a "Other Problem" catch-
all's real intent - `auto_reply='Thank you for your report. A member of our staff team will look into
this.'` - a real, sensible message rather than leaving the column `NULL`, since `auto_reply` flows
directly into the wire response's own message string with no null-guard visible in the composer).
`ModToolManager` loads this table once at boot with no live-reload command (same category as
`emulator_texts`/`EffectMap.json`) - restarted the emulator, boot log clean, no new errors.

**Verification depth, stated honestly**: the NPE theory is a strong, source-confirmed mechanical
explanation (a null-dereference on a provably-null object, on the exact code path both report
buttons' composer reaches) and the missing-topic fact is a direct, confirmed DB read, not inferred -
but a live click-through confirming the alert now actually arrives for a banner/motto/look report was
not completed this pass (same current gap as the layout work earlier this session - no reachable
live reference/dev-client session at the moment this was fixed). If this resurfaces, check the real
server log for a stack trace on the exact report click first - that would mean a second, different
`cfhTopic`-dependent crash elsewhere, not this same one recurring.

## In-game Sanction Status panel showed a permanently-wrong "1 day left" - real stock Arcturus bug,
fixed via packet substitution, never touching core (2026-09-27, same day)

User: "why does it say on client 1 day and on homepage 30 days" - the hCMS home page's own new
Sanction card (see hCMS/CLAUDE.md's own entries the same day) showed 30 real days left; the in-game
client's own Sanction Status panel (reached via the purse's help icon -> "My sanction status",
`SanctionStatusView.tsx`) always showed "1 day" for the exact same account at the exact same moment.

**Root cause, confirmed by reading the stock composer directly (`ModToolSanctionInfoComposer.java`,
Arcturus core, read-only, opcode 2221 per `Outgoing.java`)**: wire field 8 is the CLIENT's own real
`probationHoursLeft` (confirmed via the vendored `@nitrots/nitro-renderer`
`SanctionStatusMessageParser.ts` - the same field this project's own `SanctionStatusView.tsx` and,
independently confirmed via habbocity.fr's own dumped client bundle, the *real reference client too*
(`Math.trunc(e.probationHoursLeft/24)+1`, byte-identical formula) both use to compute the "Probation
days left:" number - but the stock composer hardcodes `appendInt(0)` at that exact position, its own
comment literally reading "unused - reserved protocol value". Since both the real reference and this
project's own port already correctly implement the SAME real client-side formula
(`Math.trunc(0/24)+1 = 1`, always), the client was mathematically guaranteed to show "1" forever,
completely independent of the account's real probation state - a genuine, pre-existing stock-Arcturus
bug, not something introduced or fixable from the client side at all.

**Fixed in `hcms-emulator-plugin` (new package `sanctions`), never editing core**:
`FixedSanctionInfoComposer` is a byte-for-byte copy of the stock composer's own real logic (every
other field identical) with the one bug fixed - `hoursLeft = max(0, (item.probationTimestamp -
now) / 3600)` computed for real and sent in field 8's place. `SanctionInfoFix.onOutgoingPacket`
(a new `OutgoingPacketEvent` listener) detects the stock `ModToolSanctionInfoComposer` on its way out
and calls `event.setCustomMessage(new FixedSanctionInfoComposer(event.habbo).compose())` - the real,
already-existing substitution path `GameClient.sendResponse()` checks for on every packet
(`hasCustomMessage()`/`getCustomMessage()`, confirmed by reading `GameClient.java` directly) - not a
cancel-and-manually-resend workaround, and the stock incoming handler (`MySanctionStatusEvent`, core,
untouched) still runs exactly as before; only the bytes that actually reach the wire differ.

Rebuilt, deployed (stop -> copy jar -> restart), boot log clean. **Verified live, end to end, not
assumed**: reconnected the real officialrooms dev-client session, clicked through Purse -> help icon
-> "My sanction status" for real (not scripted around), read the actual rendered panel text -
`"Probation days left: 30"` - now matching the hCMS home page's own real value for the exact same
account exactly, replacing the previously-guaranteed-wrong "1".

## `?room=xyz` deep link could double-load a room when the account's own home room was the same
room (2026-09-27, same day)

User: "fix if room has room=xyz dont load room twice if homeroom is from room=xyz".
`MainView.tsx`'s own `?room=<id>` deep-link handling (`pendingRoomId`, consumed once by
`openPendingRoom()`) has two triggers: the real `DesktopViewEvent` (fires on reaching the landing
view) and a 4s fallback `setTimeout`, added specifically because an account with its own home room
configured skips the landing view entirely on connect (the server auto-enters it directly into that
room), so `DesktopViewEvent` never fires for that account at all. The fallback timer, though, always
fires after 4s regardless - so for an account whose home room happens to be the exact same room the
URL's `?room=` already points at, the server had already put them there for real, and then 4 real
seconds later the client's own fallback re-ran `CreateLinkEvent('navigator/goto/'+roomId)` for that
same room a second time, a real, unnecessary reload of a room the account was already correctly in.

**Fixed** in `openPendingRoom()`: before firing the navigate-again link event, check
`GetRoomSession()` - if a real room session is already active and its own `roomId` already equals
the pending `?room=` id, just consume the pending value and return, since the account is already
exactly where the deep link wanted it. Only actually re-navigates when the account is NOT already in
that specific room (matching every other real case the fallback timer exists for - a landing-view
account whose `DesktopViewEvent` was missed or delayed). `tsc` clean, HMR picked it up.

## User Profile stats font styling (2026-09-27)

Source: the real `.profile-stats` component in the dumped bundle (`index-b7d2b6d3.js`). Each stat is a
`Flex gap:1` of two `noWrap` Texts: a bold label and a plain value. None of them use `small`, so the
size comes from `.profile-stats { font-size:13px }`. Our old version used `Text small` plus
`dangerouslySetInnerHTML` locale strings with an embedded `<b>`, so the stats were smaller than 13px.
Rebuilt to the reference structure and live-checked on the dev client: every label and value computes
to 13px, labels 700, values 400. The motto also gained `pointer` and `select="text"`, which the
reference has. Per the user's direction, the second label always reads "Last login:" (the reference
switches to "Online since:" when the user is online). Open gap: the reference formats that value with
`FriendlyTime.shortFormat(..., '.ago')`, but our `ExternalTexts.json` has no `friendlytime.*.short.ago`
keys (it rendered the raw key), so we still use `format(..., '.ago', 2)` ("3 minutes ago") until the
real key values are captured.

## Avatar infostand house icon to the website profile (2026-09-27)

Source: the real user infostand in the dumped bundle. The header is `Flex alignItems:center gap:2`
holding the `G0` component (`.icon.icon-profile-house-cms`, click opens
`window.open(`${profile.url}/${userName}`, '_blank')`) followed by the name. Ours used
`UserProfileIconView` (the in-client profile sprite) with `gap:1`. Added
`common/layout/UserProfileHouseIconView.tsx` (a copy of `G0`) and
`"profile.url": "${url.prefix}/profil"` in `public/ui-config.json` (hCMS route `/profil/{username}`).
The icon CSS already existed in `_23-icons.scss`. `tsc` is clean. The avatar infostand was not
checked live: config needs a full reload, and opening an infostand needs a canvas avatar click.

Also pulled (nothing built yet): the reference room-tools `rights_mode` action. The toggle is only
shown when `trueControllerLevel >= GUEST && != GUILD_MEMBER`. On toggle it calls
`session.setRightsMode(v)` (a static flag, so it persists across rooms; the default is true),
sends composer `TOGGLE_RIGHTS` = header **5006** with a single boolean, sets `controllerLevel` to
`trueControllerLevel` or NONE, and shows the bubble. Its renderer's `RoomPermissionsHandler`
also reapplies `rightsMode` whenever `RoomRightsEvent` arrives. Our version only did the
client-side level swap, with no 5006 send and no persistence across rooms. **Built the client side (same day, per user direction)**: the flag is `editingRights` in the existing
shared `WiredCreatorToolsSettings` store, default on, not a new system. That store already broadcasts
changes to every Inspect button, and like the reference's static `_rightsMode` it survives room
changes. `RoomToolsWidgetView.tsx` sets the flag, tracks the true level through
`RoomRightsEvent`/`RoomRightsClearEvent`, and forces `controllerLevel` to NONE while the flag is off.
It does this on mount and after every rights update, because our renderer's `RoomPermissionsHandler`
always reapplies the granted level. **Per the user ("if enable remove user rights no exemptions"),
turning it off also removes every exemption**: `CanManipulateFurniture` returns false, and the furni
infostand (`canEdit`) and furni context menu (`canManipulate`) hide Move/Rotate/Pickup/Eject for
everyone, room owners, moderators and furni owners included. Use stays available. The first version
cleared those flags on `avatarInfo` in `AvatarInfoUtilities` instead, but that value is computed once
when the stand opens, so an already-open stand kept Move/Rotate until it was closed (user report).
That change was reverted in favour of this render-time check, which reads the live settings state and
so updates in both directions while the stand is open. The user confirmed it works ("perfect now"). The Inspect button (avatar menu, furni menu,
furni infostand) only shows while the flag is on. The user reported "still same" before this change;
the owner/moderator/furni-owner exemptions were the cause. This is client-side only, and 5006 is still
not sent: the server would still accept a crafted move. `tsc` is clean. Not yet live-tested in a room. Plugin code that
received the earlier 9565 version of this was deliberately reverted (see the "editing-rights full
revert" section).

## Catalog layouts vs the real page data (2026-09-27)

Per the user: our catalog *data* is already HabboCity's, so only the JS needed fixing. The live
`catalog_pages.page_layout` values are `default_3x3` (1624 pages), `pets` (19), `pets3` (8),
`trophies` (3), `petcustomization`, `bots`, `guilds`, `guild_furni`, `info_loyalty` and
`recent_purchases`. The reference layout switch (`Kk` in `index-b7d2b6d3.js`) is identical to our
`GetCatalogLayout.tsx`, so `guilds`/`guild_furni`/`petcustomization`/`recent_purchases` fall back to the
default layout on both sides. `info_loyalty` (`Nk`) and `pets3` (`OI`, the text-only page; `pets2` →
`yk` → `OI`) already matched verbatim.

Fixed against the reference `vk` (default) and `Pk` (trophies):
- New shared `widgets/CatalogFurniDescriptionWidgetView.tsx` = reference `Ms`: a
  `.catalog-furni-description` column holding the limited plate (our `CatalogLimitedItemWidgetView` =
  `Ik`), a `Flex between gap:3` of the bold name and total price (our `CatalogTotalPriceWidget` = `fk`),
  and the description. Below that sits `Ek`, a **staff-only** (`isModerator`) block with a
  `horizontal-separator` and selectable `pageId:` / `offerId:` / `className:` (furnitureData fullName ||
  className). This is the "information code" the user asked for. Ours previously showed only name + price.
- Default: left column gets `.catalog-layout-furniture-view` (real CSS `padding-right:
  var(--holo-paddings)`, which already existed but was unused), with the grid wrapped in
  `Column overflow:hidden`. Page text renders through `HtmlDsl` (reference `bt(text, Dt)`) instead of
  `dangerouslySetInnerHTML`. The badge add-on class is `catalog-layout-background` (was `bg-muted`).
- Trophies: the engraving textarea is a full-width row below the grid/preview row (it was inside the
  col-7), and the purchase footer is always rendered, with "No furni selected" (it was offer-only).
- Left unchanged: the default layout's root fragment and footer (CDP-verified in an earlier pass).

Live-verified on the dev client ("Academy of Evil"): `.catalog-layout-furniture-view` computes 15px
right padding, and selecting an item renders `.catalog-furni-description` with name + description in
white. The staff block was not seen live because the dev tab's account isn't a moderator.
**Not done yet:** the `pets` layout (`$k`), which also uses `Ms`.

## Catalog "Information" pages (2026-09-27)

Reference (live DOM, opened through normal clicks on habbocity.fr): every top tab's first page,
"INFORMATIONS", uses the `pets3` text layout (`OI`). It holds an image
(`catalogue/vp5MOrE4irkn2rx.gif`, which is really a PNG), the headline "Deux, trois trucs à savoir", a
body of four tips separated by `

` (rendered as `<br><br>`), and a bold footer asking players to
contact support. Our 5 "Information" pages (ids 9966552/9966919/9967436/9967547/9967755) were empty
`default_3x3` pages with no text and no offers. This was a data gap; the JS was fine.

Arcturus `Pets3Layout` serializes images `[page_headline, page_teaser]` and texts `[page_text1,
page_text2, page_text_details, page_text_teaser]`. `OI` reads image 1 (= `page_teaser`) and texts 1/2/3
(= `page_text2` / `page_text_details` / `page_text_teaser`). Updated those 5 rows to `pets3` with an
English translation of the reference text (this project's UI is English throughout). At the user's request
("do good habbo translation") the wording was then rewritten in Habbo-style English rather than translated
literally: headline "Good to know", tips about buying and placing furni, the search bar, `:setz`/`:build`
(both real here; `:setz` is an alias of `:sh`), and pets/bots in the inventory, plus the footer "Got a
question? Our support team is always happy to help!" The image was
fetched from inside the HabboCity page (browser session, no Cloudflare workaround) and saved to
`hCMS/public/cdn/c_images/catalogue/vp5MOrE4irkn2rx.gif`. Reloaded live with `:update_catalogue`,
with no restart ("Catalogue has been refreshed!").

Verified: our Information page's DOM now matches the reference's element for element and class for
class, and the image loads. One remaining difference: the reference's HTMLDSL output renders spaces
as `&nbsp;`, while our `HtmlDsl` keeps normal spaces. It is not visible at these widths and was not
changed. Note that `dump-network-body.js` **reloads** the tab it attaches to, so it can't grab an
asset that was loaded lazily after a click.

## Catalog Information pages: per-tab text + VIP (2026-09-27, follow-up)

The reference's "INFORMATIONS" page **differs per tab** (read live on all 5). Each was mapped to our tab
and written in Habbo-style English:
- **Official**: headline "Good to know", tips on buying/placing furni, the search bar, `:setz`/`:build`
  and pets/bots, plus a support footer.
- **Custom**: headline "Good to know:", the same kind of tips but pointing chair-hunters to our real
  "Types" category, noting new categories every other Monday, and "ask the Catalogue team". No footer,
  matching the reference.
- **City**: "City Club", exclusive furni by our own designers and pixel artists. No footer.
- **Utilities**: "Our utilities": wallpaper + dimmer, groups, bots, coloured/magic stack tiles, plus a
  website support footer.
- **Rares**: its own image `F3eEAeeEXsOclp9.gif` (fetched from inside the HabboCity page and saved to our
  `c_images/catalogue`), covering diamonds, boxes/gold bars, CityCash packs, the diamond market, and
  diamonds <-> Nest Eggs (reference "magots" = our real "Nest Egg" category). No footer.
The reference names "HabboCity" and its Discord; our hotel has no configured display name
(`APP_NAME=hCMS`) and no confirmed Discord, so the text says "our hotel" and drops the Discord line.

**VIP** (user request; HabboCity has no VIP tab, so there is no reference text): added page **9967774**
(parent 679, `pets3`, `order_num` 1, `min_rank` 2, cloned from the Official row). The text uses real
perks from hCMS `resources/views/center/vip.blade.php`: the VIP catalogue, a daily Emerald and VIP box,
doubled event prizes, no AFK, full rooms, `:enable vip`/`:smack`/`:hit`, and 250 rooms. The footer points
to the website's VIP Club page. The VIP tab's own root page (679, `info_loyalty`) still holds stock demo
placeholder text ("You can use any colour you would like…"); untouched, flagged.

All 6 were verified live after `:update_catalogue` + reopening the catalog. **CDP testing gotcha:** a
catalog tab auto-opens its first child, so re-clicking that already-active nav item and reading after
~2s can return the *previous* page's DOM. Wait ~4s, or click a sibling first, before concluding a page
didn't load.

## Pet items were deleted by the 2026-09-20 catalog swap: found and reverted (2026-09-27)

Symptom: every Adoption pet page had 0 offers. Only 5 `a0 petN` rows were left in `items_base`
(`pet10/20/32/35/54`), and the 2026-09-24 backup had the same 5, so the loss predates it.

**Cause:** hCMS `php artisan hcms:catalog-stage` (`app/Console/Commands/StageCleanCatalog.php`) + the swap on
2026-09-20. Its rule "furni: not sold, owned, pointed-at or wired (unused)" drops every `items_base` row no offer
points at. Pet offers in the ltdhabbo source use `item_ids` 0/empty (display-only), so all `a0 petN` rows looked
unused and were deleted. **If that stage command is ever re-run, whitelist `item_name LIKE 'a0 pet%'` first, or
the pets disappear again.**

**Reverted:** re-inserted the 26 missing rows verbatim from `old_20260920_085704_items_base` (the live table right
before the first swap; identical columns; original ids `50000 + petN`, all free). `items_base` now has 31 pet rows:
0-12, 14, 15, 17-25, 28-32, 35, 54. Rollback: `DELETE FROM items_base WHERE id BETWEEN 50000 AND 50031 AND id NOT
IN (50010, 50020)`. Types 13/16/26/27/33/34 and 36+ were never in that table; `ltdhabbo.items_base` has `a0 pet0-80`.
The emulator loads `items_base` at boot, so this needs `:update_items` or a restart to take effect.

**Adoption scan of the reference (same day):** `scratchpad/hc-walk.js` walks a catalog subtree forward-only by
caption path (never re-clicks an open folder, re-opens closed ancestors, reads a page only once its pageId changed).
It reads each page's `page` object and the pet layout's hook state (the sellable breed palettes) from React
props in the frame's main world, via the new `c:/tools/nitro-catalog-copy/scripts/eval-in-iframe-main.js` (same
as `eval-in-iframe.js` but in the default context, so `__reactFiber` is visible; read-only).

Result for Adoption: every species page is `pets` with exactly one offer `a0 petN` plus N sellable breeds
(`type/breedId/paletteId/sellable/rare`, which is exactly our `pet_breeds` row: race/color_one/color_two/
has_color_one/has_color_two). Folders are `pets2` text pages. Saddles/Dyes are `default_3x3` (ours:
`petcustomization`). Horseback Riding has 38 offers (ours 0), Toys 57 (56), Food 34 (33). The earlier dom-scrape
crawler captured 0 offers on every pet page (it only recognised furni classnames), which is why our pet pages were
imported empty. "Adoption Info" on the reference behaves like a link: clicking it made "Cochons" (#141) active.
Unverified; the user says it "gives adoption info". "Coupes" = horse **hairstyles** (was mistranslated
"Trophies" with a `trophies` layout; caption fixed to "Hairstyles", layout still to fix from the reference).

**Decided with the user: copy HabboCity's pet type numbering 1:1** (their `renderer-config` `pet.types` has 60 entries;
ids 0-26 match ours, 27+ differ: 27 velociraptor, 28 pterosaur, 29 bbwibb, 30 fools, 31 haloompa, 32 wolfbaby, 33 cow,
34 LeetCaviaaa, 35 LeetE, 36 owl, 37 penguin, 38 Pikachu, 39 Mew, 40 Mario, 41 elephants, 42 duck, 43 pigletbaby,
44 puppybaby, 45 kittenbaby…). Safe because `users_pets` is empty. Caveat: core `PetManager`/`GnomePet` hardcode
27 = leprechaun (the leprechaun box), so that box must be removed or fixed. **Not done yet:** renderer-config
pet.types, pet_actions/pet_breeds renumbering + new types, the missing `a0 petN` rows from ltdhabbo, the pet .nitro
files, and the catalog offers/layouts/texts.

## Wrong-colour catalog icons: dragon lamps (2026-09-27)

User report: some furni show the wrong colour in the catalog icon/preview (the "dragon lamp issue"; the user
believes it was fixed before and reverted, but no earlier fix for it is recorded in any notes or transcripts).
Checked and **ruled out sprite ids**: all 34,967 floor/wall `items_base` rows have `sprite_id` pointing at the
FurnitureData entry with their own classname, and `rare_dragonlamp*0`-`*9` have exactly HabboCity's ids and
partcolors (1619-1628). Real cause: **the icon file**. `hof_furni/icon/rare_dragonlamp_1_icon.png` (blue) was
byte-identical to `_0_` (red), both md5 `4d2362c9`, from a non-HabboCity source. Replaced both with HabboCity's
own (`swf.habbocity.fr/dcr/hof_furni/icons2/`, md5 `51921502`/`68bfc5d3`), fetched from inside the HabboCity
page. Old files are in the session scratchpad `icon-backup/`. A scan of all 314 colour families for identical
sibling icons with different partcolors found only this pair. A pixel-colour-vs-partcolors scan, which would
find icons that differ but still show a sibling's colour, was started and then stopped by the user; **not run**.
HabboCity's own custom lamps (`*10`, `*12`, pink, egpt, blackrose, blackwing) use HabboCity-specific ids
(1425xxxxxx) that differ from ours. That's harmless for rendering (icons/.nitro are keyed by classname).

## Pets imported 1:1 from HabboCity, sprite ids unified, dragon lamp assets fixed (2026-09-27, later)

All DB work is in the live `hcms` DB, each step backed up first:
- **Pet types renumbered to HabboCity's ids** (the user chose "copy HabboCity 1:1"; `users_pets` was empty so it's safe).
  Ours->theirs: 34->27 Velociraptor, 33->28 Pterodactyl, 32->30 Fools, 35->33 Cow, 30->43 Baby Pig, 29->44 Baby Dog,
  28->45 Baby Cat, 27->60 Leprechaun (parked; HabboCity has none; core still hardcodes 27 for the leprechaun box, so
  that box now hatches type 27 = velociraptor visuals with gnome behaviour. Still open). New types 29 Bbwibb, 32 Wolf
  Cub, 34 Hamster, 35 Monster Egg, 36 Owl, 37 Penguin, 38 Pikachu, 39 Mew, 40 Mario, 41 Elephant, 42 Duck: actions,
  commands and vocals cloned from the nearest existing pet. Tables touched: pet_actions, pet_breeds, pet_breeding_races,
  pet_commands, pet_vocals (backups `bak_20260927_<table>`).
- **pet_breeds** for 41 types replaced with HabboCity's sellable palettes (read from the pets layout's hook state;
  row = race/color_one=breedId/color_two=paletteId/has_color_one=sellable/has_color_two=rare, duplicates removed).
- **items_base `a0 petN`**: 0-45 (+54) now exist. 26 were restored from `old_20260920_085704_items_base`, and 16 more
  (13, 16, 26, 27, 33, 34, 36-45) were created as copies of `a0 pet0` with id `50000+N`.
- **renderer-config.json `pet.types`** = HabboCity's 60-entry list (old copy in the session scratchpad). 14 missing pet
  `.nitro` files were downloaded from `cdn.habbocity.fr/resources/bundled/pet/`: dragon_pet, bbwibb, wolfbaby,
  LeetCaviaaa, LeetE, LeetUi1, LeetPen, LeetPikachu, LeetMewt1, LeetHotelMari1, LeetFantj, LeetEendj16, slenderm1,
  pkmnente1. The rest of their list (46+: sponge, luigi, the pkm* ones, elephants) 404s on HabboCity too.
- **Adoption catalog** (pages 9967690-9967752; backups `bak_20260927_adoption_pages/_items`): 43 species pages are now
  `pets` with their free `a0 petN` offer, HabboCity header image and English text. Adoption, Adoption Info and 8
  sub-folders are `pets2` text pages. Hairstyles/Saddles/Dyes are `default_3x3` like HabboCity. Missing furni offers
  were added by classname where the furni exists in our items_base. **Still short:** Horseback Riding 8/38,
  Toys 56/57, Food 33/34, because those classnames aren't in our items_base/furnidata at all (the "missing furni +
  .nitro" task). 13 HabboCity catalogue header images were added to `c_images/catalogue/`.
- **sprite_id = items_base.id for every floor/wall furni** (user decision, same rule as the LTD project): 7,706 floor +
  411 wall rows changed, and FurnitureData.json was rekeyed so each entry's id is the items_base id of the row that
  uses it (backup `FurnitureData.json.pre-sprite-rekey-20260927-163420.bak`, table `bak_20260927_items_base_sprite`).
  Before this, items_base ids and sprite ids overlapped (e.g. 2000039411 was `wallmirror`'s sprite AND
  `styx_plage_bouteille`'s id). Verified after: 34,967/34,967 rows resolve to their own classname, 0 duplicate ids.
- Live-reloaded with `:update_items`, `:update_pet_data`, `:update_catalogue` (no emulator restart).
- **Dragon lamps (the user's wrong-colour report):** the client wiring was right (offer -> sprite -> icon file), but
  the assets weren't. Our `rare_dragonlamp.nitro` only had colours 0-10 (HabboCity's has 0-13, and we sell `*12`), and
  `egpt`/`blackrose`/`blackwing` had no .nitro at all. `pink` and icons `_10`/`pink` differed; icons `_12`, `_13`,
  `egpt`, `blackrose` and `blackwing` were missing. All replaced or added from HabboCity (old files in the session
  scratchpad `icon-backup/`). The same "our asset != HabboCity's" problem very likely affects other furni. A full
  compare of every catalog furni's .nitro + icon against HabboCity is the logical next step (not run yet).

## offer_id = items_base id for all offers (2026-09-27, user rule)

Wrong-colour-on-buy root cause per the user: the **offer link**. Every `catalog_items.offer_id` was -1 or (228 rows)
pointed at a different furni than the offer sells, and FurnitureData `offerid` was -1 for most furni but set for some.
The emulator only registers an offer in `CatalogManager.offerDefs` when `offer_id != -1`, and the client uses furnidata
`offerid`/`buyout` for buying from catalog search and the infostand Buy link. **Applied the user's rule
(corrected by the user after a first pass wrongly used the items_base id): `catalog_items.offer_id = catalog_items.id`**
for all 59,221 offers (backup table `bak_20260927_catalog_offer_id` holds the original values). FurnitureData `offerid`
= the `catalog_items.id` of the offer that sells that furni (if sold in several places: the visible+enabled page with
the lowest min_rank, then the lowest id), and `buyout = true`. 34,822 furni have one; the rest are -1/false (backups
`FurnitureData.json.pre-offerid-*.bak`). This matches `CatalogBuyItemEvent`'s search path, which looks the offer up by
catalog item id. Reloaded with
`:update_catalogue`. Clients need a hard refresh to get the new FurnitureData.

Checked and **ruled out** along the way: `catalog_items` order and item ids on the dragon page are exactly the captured
HabboCity order (`rares/classiques/dragons`: *4, *0, *5, *2, *8, *9, *7, *6, *1, pink, *3). 7,073 offers carry a
`catalog_name` that doesn't match the furni's `public_name` (ltdhabbo named every colour of a family the same, e.g.
all sleeping bags "Maroon Sleeping Bag", all polyfon beds "Red Single Bed"). The furni handed out is correct there;
only the offer label is wrong. **Not changed yet**, pending the user's choice.

## Catalog order + colour variants vs the HabboCity crawl (2026-09-27)

Matched each of our pages to its crawled page in `c:/tools/nitro-catalog-copy/catalog/dom-tree.json` by furni-set
overlap (crawl writes `name_N` for `name*N`). 992 of 1,166 pages with offers matched (174 have no crawled
counterpart). Mapping saved in the session scratchpad as `page-crawl-map.json`.
- **Order itself is right everywhere**: no matched page has the right furni in the wrong order.
- **Real colour bug found and fixed**: on 324 positions our offer handed out a different colour variant than HabboCity
  has in that exact spot (often shifted inside a family, e.g. Iced pos 81 `icedblk_c16_div2*4` where HabboCity has
  colour 2, or the same `*9` twice where HabboCity has `_8` and `_7`). 279 were repointed to HabboCity's exact classname
  (backup table `bak_20260927_colour_fix`; `catalog_name` set to that furni's real name), and FurnitureData `offerid`
  was re-synced (backup `FurnitureData.json.pre-colourfix-*.bak`). After this, **927/992 matched pages are identical
  to HabboCity**.
- **Remaining 65 pages are missing furni HabboCity sells there** (268 classnames, e.g. base `gothic_chair`,
  `bed_polyfon`, `glass_chair`, 75 Norja/Iced items; the 45 unresolved colour positions are among these). 201 of the
  name variants already exist in our items_base (offer just missing), and ltdhabbo has 381/416 (likely also deleted by
  the 2026-09-20 "unused" rule). **Not yet done:** rebuild those 65 pages 1:1 (add offers in HabboCity's positions,
  restore furni from ltdhabbo, fetch .nitro/icons from HabboCity).

## Dragon lamps "still wrong" = browser cache; asset URLs now versioned (2026-09-27)

Compared the Dragons page live on both clients (read-only React page objects): HabboCity page 9994123 vs ours 9967765.
All 11 offers are **identical**: same classname, colour index, colour values and order (only offer ids differ; HabboCity's
Pink uses its own class id). The data was right, but `cdn.habbo.nz` sends `Cache-Control: max-age=604800` (7 days).
The dev browser still held the OLD `rare_dragonlamp_0/_1_icon.png` (both the old red file, sha1 `dddf8e1a`) and the
old FurnitureData, while the server already served the new ones. **Fix:** `renderer-config.json` now appends
`?v=20260927` to `furnidata.url`, `furni.asset.url`, `furni.asset.icon.url` and `pet.asset.url` (AssetManager decides the
file type by Content-Type, so a query string is safe). The same file was copied to the deployed client
`hCMS/public/cdn/client/renderer-config.json` (it also carried the new `pet.types`; old copy in the session scratchpad).
`play.habbo.nz` serves renderer-config with only ETag/Last-Modified, so browsers revalidate it.
**Rule from now on: whenever FurnitureData, .nitro or icon files change, bump that `?v=` value**, or players keep the
old files for up to 7 days.

## rare_dragonlamp*11 restored (2026-09-27)

The one member of the numbered `rare_dragonlamp*0-*12` family we lacked was `*11` ("Dragon Champagne" on HabboCity),
deleted here by the 2026-09-20 cleanup. Restored from `ltdhabbo.items_base` with its original id 2000028658
(sprite_id = id), renamed from ltdhabbo's wrong "Lime Green Dragon Lamp" to "Champagne Dragon Lamp", physical and
interaction fields copied from `*10`. FurnitureData entry copied from HabboCity's (id 2000028658; backup
`FurnitureData.json.pre-dragon11-*.bak`). Colour 11 is in the new `rare_dragonlamp.nitro`. HabboCity has no
`rare_dragonlamp_11_icon.png` either, so the icon is blank on both. It's not on HabboCity's Dragons page, so no offer
was added. Asset version bumped to `?v=20260927b` in both renderer-configs. HabboCity also has ~45 custom
`rare_dragonlamp_*` lamps (`_viol`, `_rain`, `_gala`, `_aurora`...) we never had; they belong to the missing-furni task.

## Dragon lamp icons were shifted by one colour (the real "shows black, get green" bug) (2026-09-27)

User: the catalog icon shows the Black dragon lamp, but buying gives the Green one. The purchase log
(`logs_shop_purchases`) proved the client sent offer 2000072911 "Green Dragon (C)" and the server gave `*5` Forest
Dragon correctly, so the **icon** was lying. Comparing each icon's dominant colour with the lamp's FurnitureData colour
showed our `rare_dragonlamp_N_icon.png` files were **shifted by one**: our `_N` showed HabboCity's `_(N-1)` (`_5` =
black, `_4` = silver, `_3` = jade...), because the icon source counted colours from 1 instead of 0 (the user's
"starting from 1 not *0"). Byte hashes are useless for this check, because HabboCity re-encodes its PNGs between
requests; compare pixel colour instead. Replaced all 13 lamp icons with HabboCity's (backups in the session scratchpad
`icon-backup/shift/`). Then checked every colour family that has a `*0` variant (77 families, 598 icons) the same way
(`scratchpad/icon-shift-fix.py`): 565 already match HabboCity (154 identical, 411 re-encoded), 28 aren't on HabboCity,
and only 5 differed (`rare_fountain_5` black vs dark green; small shade differences on `rare_icecream_2/3/9` and
`rare_fan_2`), which were replaced. Asset version bumped to `?v=20260927d`.
Also from the Hubbly comparison: the lamps' `stack_height` was 1.00, Hubbly has 1.75 (`*0-*10`) and 1.50 (`*11`);
set to Hubbly's values (backup `bak_20260927_dragon_stack`, loaded with `:update_items`). Across all furni, 4,222
differ from Hubbly in size/height/behaviour. HabboCity's FurnitureData can't be used for those fields (sit/lay/walk
flags mostly unset, ~16% wrong sizes). Proposed source for the full physical fix: .nitro logic dimensions for
width/length, Hubbly for height/interaction/flags. Pending the user's go.

## English furni names from Hab-Track (2026-09-27)

User: "do public name based on habtrack data" (github.com/Hab-Track/stock_retro, one `furnituredata` per retro, 87
hotels). Auto-detected the English-language hotels from the first 400 KB of each (scripts in the session scratchpad:
`habtrack-lang.py`, `habtrack-names.py`, `habtrack-apply.py`, `names-sync-rest.py`) and used 12: lumohotel.com,
habboon.pw, bobba.ca, sadierp.com, tabbo.biz, hablix.org, playhabborp.com, anubisrp.com, habhub.net, brasilrpg.io,
habcrush.pw, peacehotel.my. habblive.in was dropped: its names are Portuguese ("Trono", "Cripta"). Per classname, the
majority name wins (needs a real majority or >= 3 hotels agreeing). Placeholders (`*_name`, the lower-case classname
itself) are ignored, but a capitalised real word equal to the classname ("Throne") is kept. `rare_dragonlamp*11`
stays "Champagne Dragon Lamp", because our .nitro is HabboCity's (colour 11 = champagne; official Habbo says Lilac).
Applied to all three places: FurnitureData `name` (7,161), `items_base.public_name` (7,125) and
`catalog_items.catalog_name` (13,288). Backups: `FurnitureData.json.pre-englishnames-*.bak`,
`bak_20260927_names_items_base`, `bak_20260927_names_catalog_items`. The remaining 434 mismatches (mostly
HabboCity's own custom furni, not on Hab-Track) were synced: if the item name was a placeholder or half-French
("Black Plancher", `egg04_name`), it took the offer's English name (262 items + FurnitureData); otherwise the offer
took the item name (172). **Result: 0 offers whose name differs from their furni.** (The temporary names table must use
`COLLATE utf8mb4_unicode_ci` or MariaDB rejects the join.) Asset version `?v=20260927f`; reloaded with
`:update_items` + `:update_catalogue`.

## Furni physical fields fixed with two-source agreement (2026-09-27)

Sources: Hab-Track (vote of 12 English retros; furnidata has only xdim/ydim/cansiton/canlayon/canstandon), Hubbly
`items_base` (same lineage as ours, so not independent on its own), and each furni's own `.nitro` (logic dimensions
x/y/z, and visualization animation ids < 100 = its states). Scripts in the session scratchpad: `nitro-dims.py`,
`nitro-modes.py`, `phys-fix.py`. Every change needs two sources agreeing:
- **width/length:** 371 fixed where `.nitro` = Hab-Track and ours differed (e.g. studio_lights1 1x8->1x1, bling_bed 3x3->2x3,
  theatre_wall 1x4->1x1). In 2,770 cases the `.nitro` agrees with ours (Hab-Track wrong, kept); 529 match neither
  (fractional wall decor/rotations, left). Backup `bak_20260927_dims`.
- **interaction_modes_count:** 4,140 raised to the `.nitro` state count where ours was lower on ordinary types
  (default/vending/gate/switch/multiheight...), e.g. fridge/bar 0->2, doorC 1->3, rare_icecream 1->2. Dice, pet_food and
  crackable excluded (their counts mean faces/food/hits). Furni with MORE modes than states (8,243, e.g. plain chairs 2
  vs 1 look) left alone: harmless, and Hubbly agrees with ours. Backup `bak_20260927_modes`.
- **sit/lay/walk:** changed only if Hab-Track is >= 90% of >= 8 hotels AND (Hubbly agrees OR the name clearly says so:
  carpet/rug/tile/floor = walk, chair/sofa/bench/throne = sit, bed/hammock = lay). Never removed sit/lay/walk from
  furni whose name says it's for that. 139 flags changed; ~660 disagreements left for lack of a second source.
- **stack_height:** Hubbly's value taken where ours was the generic 1.00 default or `.nitro` z backs Hubbly (892, e.g.
  rugs 1.0->0, toy balls 1.0->0, rare_fountain*1 1.0->1.5); 430 left.
- **multiheight:** 699 multiheight furni got Hubbly's per-state heights where ours was empty (e.g. school_platform
  "0.5;1;1.5;2"). Backup `bak_20260927_phys` (984 rows changed). Loaded with `:update_items`.

## Chairs made sittable by name (2026-09-27)

User: "still so many chairs not right". 255 furni named chair/sofa/bench/stool/seat/throne/couch/armchair/pouf were
`allow_sit=0`, almost all custom HabboCity furni Hab-Track doesn't have (so the two-source rule never touched them).
Made 231 sittable + not walkable by name, excluding names that only mention a seat word (floors, tables incl.
"sofatable" drinks tables, lamps, walls, posters, chests, beds, the `yufex_gameofthrones_*` decor, the `sablier_poufsou`
hourglass). The 5 `throne_bed*` made layable. 19 seat-named furni that were walkable made non-walkable. 253 rows
changed in total, backup `bak_20260927_chairs`. **Not checked:** sitting height. Arcturus seats avatars at the
furni's stack height, and 759 sittable chairs sit at the generic 1.00, so some may look slightly too high or low.

## Stack heights (2026-09-27, "fix all stackheights")

`.nitro` `logic.model.dimensions.z` matches the real stack_height only ~40% of the time (catalog-copy notes 2026-09-17:
the server does stacking, so the client asset never needed it), so it's only a referee/last resort. Script
`scratchpad/stack-fix.py`. Findings: 19,691 of our floor furni already equal Hubbly. Where ours had a deliberate
non-default value and Hubbly disagreed (386), the `.nitro` height sided with **ours** 186 vs 90 (e.g. bar chairs 1.3,
gothic sofas 1.3, beds 1.7, wooden_screen 3.0 vs Hubbly 1.0), so Hubbly was NOT allowed to override those. 7,698 rows
where Hubbly says 0 on non-flat furni were kept too. Applied (347, backup `bak_20260927_stack`): every walkable
rug/carpet/floor/tile/floor-window -> 0 (345), plus 2 customs still on the generic 1.00 -> their `.nitro` height.
Remaining custom furni on 1.00 already equal their `.nitro` height (4,298). Loaded with `:update_items`.

## hCMS Furni Editor (own plugin + client window) (2026-09-27)

User: build an in-client tool to fix furni data per item (bulk rules kept missing things), modelled on sodaho.tel's
admin-only "Furni Editor". Their minified client (`https://sodaho.tel/assets/index-fHHCTbJu.js`, read in-page only)
showed the whole mechanism. **Search / Edit** tabs. **Room preview** (click = cycle state, Shift+click = rotate).
**Asset data** measured from the loaded asset collection: modes = size-64 visualization animations WITHOUT
`transitionTo`/`transitionFrom`, length = `logic.model.dimensions.y`, width = `.x`, height = `.z`. Each value gets a
"Set ..." / "... matches" button and nothing is saved automatically. Server: 5 request/reply pairs (search, detail +
catalog offers, update all fields, delete, interaction list).
User choices: **suggest + confirm** (no auto-apply), **rank 7+**, and **its own plugin** named "hCMS Furni Editor"
by Habbo.nz (not inside hcms-emulator-plugin).
- **Plugin** `c:/inetpub/wwwroot/hcms-furnieditor-plugin` (package `com.hcms.furnieditor`, builds
  `target/hcms-furnieditor.jar` with `/c/tools/apache-maven-3.9.16/bin/mvn -q package`; same pom/libs as
  hcms-buildermode-plugin). Opcodes: in 9569 search(query,type,page), 9570 detail(id), 9571 update(...), 9572
  interactions, 9573 page items(catalogPageId); out 9574-9578 (checked free in core and both plugins). Every handler
  checks rank >= 7. Update writes `items_base`, refreshes the loaded definition in place via `Item.update(ResultSet)`
  (no `:update_items` needed) and logs `furni.edited` (before/after) to hCMS `hcms_admin_audit_log`. No delete
  implemented (deliberate).
- **Client** `src/api/furni-editor/FurniEditorProtocol.ts`, `src/components/furni-editor/FurniEditorView.tsx` +
  `FurniEditorMeasure.ts`, mounted in `MainView`. Opened with chat `:furnieditor` / `:fe` or links
  `furni-editor/toggle|item/<id>|page/<catalogPageId>`; hidden unless `securityLevel >= 7` (permissions.level == rank
  id here). Tabs: Search, **Catalog page** (loads the page open in the catalog and steps through its furni in order:
  Prev / Next / "Save & next", the user's catalog-mode idea), Edit (preview, asset-data buttons, name-based
  sit/lay/walk hint, all items_base fields, catalog pages selling it). Reuses `LayoutRoomPreviewerView`.
  `tsc` clean. **Deployed and live-tested (user-approved restart 19:53):** boot log "hCMS Furni Editor plugin enabled"
  + "protocol registered (9569-9578)". On the dev client `:fe` opens it, search/detail/interactions round-trip, and
  catalog-page mode stepped through a real 38-furni page with asset data measured ("Modes match (6)", "Size matches
  (L2 x W1)", "Height matches (1)"). Colours were then fixed to the theme tokens (see the colour rule at the top); verified
  with computed styles: inputs are white on rgb(21,26,35) with border rgb(46,51,77). Save not yet exercised live.
  Reconnecting a dev tab: `generic-page-reader.js` takes the tab via `--tab <id>`, and the hotel page's own iframe
  spends the single-use SSO within seconds, so grab it, close that tab at once, then navigate the dev tab.

**Height ruler + test avatar + auto test added (2026-09-27, later).** Asked: "add measure lineal for stackheight and
also in preview can we add user and it decides walk sit or lay", then "can it auto test if sit lay walk". New
`components/furni-editor/FurniEditorPreview.tsx` wraps the shared `LayoutRoomPreviewerView` (click/shift-click unchanged):
- **Ruler**: SVG overlay projected through the preview room's own geometry (`getRoomInstanceGeometry` +
  `getRoomInstanceRenderingCanvas` for `RoomId.makeRoomPreviewerId(id)`, furni tile 2,2): ticks every 0.5 up to 4, a
  dashed line + label at the current stack height, and dragging the ruler sets the height (rounded to 0.05). Verified
  live: 1 unit = 32px; clicking near "2" set the field to 2.05 (the form only; nothing is saved until Save).
- **Test avatar**: the viewer's own figure added as room user id 2 on the furni tile at z = stack height, posture
  `std` / `sit` / `lay` (height passed as the posture parameter). Stand/Sit/Lay buttons, plus **Auto test**, which cycles
  Stand → Sit → Lay every 1.5s (verified live via the preview image changing for every pose and the sampled sequence
  SIT, LAY, STAND, ...).
- `SuggestPose()` (name/size/height heuristic) picks the starting pose when an item opens and shows a "Suggested: …
  (why)" line; **"Use: <pose>"** writes allowWalk/allowSit/allowLay for the pose being shown. This keeps the
  suggest-and-confirm rule: the admin looks at the avatar and confirms. The "decision" is the admin's eye plus a
  heuristic; nothing is auto-applied or saved.
- Ruler colours: `--holo-text-primary` for the axis and the theme warning yellow `#eeb80e` for the height line. Scoped
  in `FurniEditorView.scss`.

**Pose auto test, catalog sync, audit page, layout (2026-09-27, later).**
- **Pose auto test:** when an item opens, the avatar tries walk, then sit, then lay, then nothing. It stops on the pose
  the evidence settles on. Evidence comes from the plugin's detail reply, which now also sends the same classname's
  sit/lay/walk/stack height from the local reference DBs `hubblycata`, `habboworld` and `ltdhabbo` (same MariaDB
  server, read as root; a missing schema is skipped). Each copy votes and the name gives one more vote.
  `DecidePose` counts a pose as "found" when it has at least 2 votes and a clear lead. With no clear answer the test
  stops after one round with "No clear answer". Nothing is applied automatically: "Use: <pose>" writes the three flags,
  and "Reference height X" writes the height the agreeing references use. The old "Name suggests" button was removed
  because the name is now one of the votes. The client parser reads the reference rows only if `bytesAvailable`, so an
  older plugin build still works. Verified live against the old build: "No clear answer (no reference data)", then it
  stops. **The new plugin build is not deployed yet** (it needs an emulator restart).
- **Catalog sync:** while the editor is open, the page open in the catalog is loaded automatically, and clicking a furni
  in the catalog opens it in the editor (matched by `product.productClassId` = items_base id). The editor's Next/Prev also
  select the same offer in the catalog (`offer.activate()` + `setCurrentOffer`). On the last item the button becomes
  "Next page": it activates the next visible node in the catalog tree (depth first), and the sync loads that page.
  "Save & next" works the same way. Verified live on "Academy of Evil": clicking tile 3 opened #2000034271, and editor
  Next moved the catalog highlight in step (3/38, "Pupitre").
- **Audit:** `FurniEditorUpdateEvent` now logs `{"item_name","public_name","changes":{column:[before,after]}}` and only
  the fields that changed. A save that changes nothing is neither written nor logged ("No changes"); before this,
  no-op saves were logged. New hCMS admin page **Administration > Furni edits** (`app/Filament/Resources/FurniEdits/`,
  `/admin/furni-edits`, administrators only). It filters the audit log to `furni.edited` and shows when, the staff
  member, the furni (#id, classname, public name) and one line per changed field (the older before/after string format
  is parsed as well). Filters: staff, furni id/classname. Rendered with `Livewire::test` against the 3 real earlier
  rows. No revert action: the emulator only reloads items_base with `:update_items`, so a DB-only revert from the panel
  would not reach the running game.
- **Layout:** the Edit tab is 800x520. The left column (`.furni-editor-side`, 230px, scrolls) holds the preview, a muted
  hint (`--holo-text-muted`), a "Pose test" box and the "Asset data" box. Measured live: no overflow in either column.

**Size/multiheight rulers, walking test, height scan, layout v2 (2026-09-27, later).**
- The preview (`FurniEditorPreview.tsx`) projects everything through the preview room's own geometry:
  - **Footprint:** a dashed outline on the floor labelled W/L from the form. It follows the furni's live rotation
    (`getRoomObject(...PREVIEW_OBJECT_ID, FLOOR).getDirection().x / 45`). At rotation 0/4 the width runs along x; at
    2/6 width and length swap, the same as core `RoomLayout.getTilesAt`.
  - **Top surface:** the footprint drawn at the stack height.
  - **Height ruler:** stands at the footprint's right corner. It has a blue mark per multiheight state
    (`index: height`, the furni's current `getState(0)` in bold), and dragging it sets the stack height.
  - Tile corners are at tile ± 0.5. Verified on `doormat_love`: the rug's rendered bounds x 65-122 / y 150-181 vs the
    drawn diamond x 62-126 / y 151-183.
- **Walk instead of Stand:** the test avatar uses posture `mv` (really walking) for walk.
- **Height scan, replaced the same day by a surface scan (below).** First version: `getRoomObjectBoundingRectangle` gave the furni's own on-screen bounds; the avatar is a separate
  object, so it doesn't count. A flat-topped furni's highest point is its back corner at the stack height, so
  scan = (back floor corner y - bounds top - 1px) / pixels-per-unit, rounded to 0.05. The rug scans 0, a 2-tile
  pillar 3.45. For backrests, lamp shades and the like this gives the overall height, so it stays a suggestion:
  "Scanned height X - use it". Every "use it" height button also puts the avatar walking on that height, so the result
  shows immediately.
- **Layout:** Edit tab 820x560.
  - Left column (250px, scrolls): preview (210px), hint, "Pose test" box (Walk/Sit/Lay buttons, result, Use/Reference
    height), "Asset data" box (modes, size, asset height, scanned height).
  - Right column: a fixed header (bold truncated name, muted public name/type/usage, Prev n/m Next on the right), a
    scrolling middle with Size / Behaviour (interaction + flags in a 3-column grid) / Advanced (+ "Sold on") boxes, and a
    fixed Reset/Save/Save & next row.
  - Measured live: no overflow in either column.

**Stack height = surface scan (2026-09-27, later).** The bounds-top scan measured the highest point, which is wrong for
backrests and lamps. It was replaced by a pixel scan of the furni's own image: `visualization.getImage()` draws only the
preview furni's sprites (no floor, no avatar), and `TextureUtils.getPixels` gives the RGBA data. For each pixel column
across the footprint (10% margin at each end), the first solid pixel (alpha > 64) is measured against the footprint's
back floor edge at that column, minus 1px, divided by pixels per unit and rounded to 0.05. The height most columns share
wins (ties go to the lower one), so a flat top outvotes narrow parts. The result is cached per type/state/rotation/bounds.
The user confirmed the scanned value in the Asset data box is the right height; the test avatar now stands, sits and lies
at the scanned surface height (the form's stack height until the scan is ready), and the "Highest point" line was
removed. Live: `chair_norja` scans 1 (stored 1.0), `doormat_love` 0. A benchmark against the three reference DBs
was started and then dropped at the user's word (scratch tables `test.fe_*` removed).

**Furni Editor round 3 (2026-09-27, evening): catalog panel, fixed preview, scans, names, test furni, revert.**
Client files: `FurniEditorView.tsx`, `FurniEditorPreview.tsx`, `FurniEditorMeasure.ts`, new `FurniNames.ts` and
`FurniEditorRenameView.tsx`. Plugin: new `FurnitureDataFile`, `FurniNamesIndex`, `TestFurni`, `FurniEditorRevert`,
`FurniEditorRenameEvent` and `FurniEditorTestFurniEvent`. hCMS: `app/Support/EmulatorRcon.php` and the Revert actions in
`FurniEditResource`. **Plugin built, NOT deployed yet (needs a user-approved emulator restart).** The client falls back
safely: every new reply field is read only `if(w.bytesAvailable)`.
- **Layout (no scrolling):** 1120x670 with 4 columns: the catalog's own tabs (`NitroCardTabsView small`) and page tree
  (the real `CatalogNavigationView`, whose CSS is not scoped to the catalog window); preview + Pose test + Test in room +
  Asset data; Name + Size; Behaviour + Advanced. The header and Save row span the last two. The editor asks for the
  catalog index itself (`GetCatalogIndexComposer`), because the hook only asks when the catalog opens.
  **Bug found and fixed:** flex children in the scrolling columns were squeezed instead of scrolling (titles 9px of 14,
  preview 168 of 210); fixed with `flex-shrink: 0` on column and box children. Measured live: every column has
  scrollHeight == clientHeight.
- **Preview fixed:** `RoomPreviewer.disableUpdate` stops its auto re-centre and zoom-out
  (`validatePreviewSize`). `holdFrame` keeps the chosen zoom (0.5-2x in 1/8 steps; +/- buttons, mouse wheel, % label
  resets) and pins the furni tile at 42%/72% of the canvas plus the drag pan. Drag = pan; a click without moving still
  cycles the state. Verified: rug, bed and pillar all put the tile at (104,135) at 32px per unit.
- **Rulers:** footprint W/L outline following the live rotation, top surface at the stack height, a height ruler with a
  mark per multiheight state (current state bold), drag the ruler = height. **Height stepper** like build mode
  (-1/-0.1/-0.01 | value | +0.01/+0.1/+1), theme tokens only.
- **Height scan = surface scan:** per pixel column of the furni's own image (`visualization.getImage` +
  `TextureUtils.getPixels`), the top against the back floor edge; the most common height wins. The user confirmed this
  is the right value; the test avatar uses it until the height is edited.
- **Size scan = floor-contact scan:** in every state (3 frames each), the lowest solid pixel per column is converted
  back to tile units (x: +32px/+16px, y: -32px/+16px); the furthest contact gives the tiles along x/y, then width/length
  by rotation. A first bounds-based version was wrong for overhanging art (a window) and compact art (a 2x2 table).
  The floor-contact version matched 7/7 stored and reference sizes. `minidisco_kdh_25` stays 1x1 by every source.
  Scan suggestions sit in the Size box under their fields.
- **Pose test:** Walk (posture `mv`) / Sit / Lay / **Stack**. The stack test places a real test furni at the height:
  default the Freeze ice block (`es_box`, full tile), or crate / gift. The decision votes come from the reference DBs,
  the name, and the **all-hotels names** (a 60% majority weighted by hotel count). With no reference DB rows the names
  alone can decide (bed -> lay).
- **Names:** `FurniNames.ts` translates FR/PT/ES/IT/DE/NL/FI/TR/SV furni words to English in English order (adjectives
  before nouns, "X de Y" -> "Y X", phrases like "chauve souris", diminutives -inho/-ito/-ette). `ConvertClassname`
  makes a name from a classname (drops digits and set codes, splits glued words: `pilarazul_kdh_25` -> "Blue Pillar").
  The name rules for sit/lay/walk also use it. **All-hotels index:** `C:/tools/stock_retro/build-furni-names-index.py`
  -> `furni-names-index.tsv` (85 Hab-Track hotels, 8 languages, 168,205 classnames); the plugin scans it per lookup.
  The Name box lists every source (current, from classname, FurnitureData, catalog, reference DBs, hotels with
  count/languages) with "-> English" for each. Saving a name updates `items_base`, `catalog_items.catalog_name` and
  FurnitureData.json (in-place edit, temp file + rename). It also adds `&n=<time>` to the furnidata URL in both
  renderer-configs, so only FurnitureData is re-fetched.
- **Rename page popup:** every furni of the page with a suggestion (most-used English hotel name from the page-items
  reply, else converter, else translator). Only clearly-not-English names start ticked; suggestions are editable;
  Apply renames one by one (9579/9580).
- **Test in room (Place/Remove, 9581/9583):** a real furni placed on the tile in front of you. It is deleted, never put
  in anyone's inventory (owner 0 + `needsDelete` + `pickUpItem`), on the next Place, Remove, moving to another furni,
  leaving the room or logging out.
- **Keys:** Ctrl+S = Save & next, Ctrl+X = skip (a normal cut while text is selected).
- **Admin revert:** Furni edits page: per-row Revert and bulk "Revert selected" (filter by staff, select all). Through
  RCON `furnieditorrevert` {entry_id, actor_id}, so the loaded furni changes live. A field is only put back when it
  still has the value that edit set; anything else is reported as skipped. Writes `furni.reverted`. Edits logged before
  per-field changes existed cannot be reverted.
- **Queued by the user, not started:** a hotel-catalog scanner mode (scan other hotels' clients' catalog pages and
  items, import them, then edit, add or remove catalog pages and items).

**Deployed + seat heights (2026-09-27, 22:21).** The Furni Editor plugin round 3 was deployed with a user-approved
restart. Boot log: "protocol registered (9569-9583)" and "RCON furnieditorrevert registered". Verified from hCMS:
`EmulatorRcon::send('furnieditorrevert', {entry_id: 0})` returned status 1 "Not a furni edit", so the admin panel ->
RCON -> plugin path works. **Not yet exercised live:** a real revert, a name save + FurnitureData write, the rename
popup's Apply, Place/Remove test furni.
**Sit / lay heights** (user: "chairs and beds never get the right height, it shouldn't go after the highest point"):
- The client draws a sitting/lying avatar one height unit lower than its sit height (`AvatarVisualization`
  `_postureOffset = scale / 2`; `RoomMessageHandler` puts the user at z = status.z + height). So the stored height =
  seat top + a pose offset. Calibrated on classic furni: **sit = seat top + 0.6** (chair_norja seat 0.4 -> 1.0),
  **lay = mattress top + 0.9** (classic beds ~0.9 -> 1.8). A benchmark against "trusted" heights (ours == Hubbly,
  56 furni) was useless: 20 of 35 chairs store a generic 1.0 while their seat tops range 0.05-4.6.
- Seat top: first the lowest column group (>= 15% of columns, > 0.2), which failed on an armchair
  (yufex_gameofthrones_sandalye: armrests and back cover every column top). Replaced by **seat-edge detection**: at the
  sitting spot, walk each column UP from the floor; the first sharp brightness edge with a lighter face above (lit
  top face) is the seat front edge, and its height comes from the footprint's front edge. The group method is the
  fallback. NOT yet verified live (the user was using the dev tab; I stopped driving it).
- `FitSeatHeight` (place the avatar, measure its hips from its own pixels, correct the height, repeat, max 6 steps)
  exists as a manual "Fit avatar (beta)" button only: its hip measurement was 1.5 units off on chairs (-49px at 1.0)
  and one run hung, so it is not trusted yet. It stops when another furni is opened.

**Names round 2 + bulk rename (2026-09-27, late).**
- Translator fixes: English "of" no longer triggers the "X de Y" reorder (Game of Thrones stays). A name with no known
  word is returned unchanged. Numbers and Roman numerals stay last, upper-case. Unknown words keep their capitals.
  Placeholders (`x_y name`, `classname_name`) are never offered. A plural of a hand-made word (glaces, chaises) wins over
  learned words, and nouns stay plural (Red Chairs).
- **Learned dictionary** `furni-words.json` (4,644 words, 91KB): `C:/tools/stock_retro/build-furni-words.py` aligns
  every classname's English hotel name with its foreign names in the 85-hotel index. It is seeded with FurniNames.ts's
  hand list; one-word pairs and "all but one word known" alignment; 6 passes; >= 2 agreeing furni and a 60% share; the
  English side must be used in >= 3 English furni names. Spot checks are ~85% right; the rest are suggestions a person
  confirms. Hand-added: Crab, Feast, Tray, Cold Cuts, Sword in 10 languages ("Trone de Crabe" -> "Crab Throne").
- Name box: two-line candidate rows (name + "-> English"; the sources on their own line, never cut off) and a
  "Bulk rename..." button.
- **Bulk rename modal** rebuilt: a grid table (tick | classname | current | new name + dropdown | status), bulk "fill
  ticked" (Best English / Translate / From classname / Keep current), Apply, a page chooser (all catalog pages,
  indented), "Next page", and "Apply & next page". The page-items reply now carries each furni's top 6 names in all
  languages (plugin `FurniNamesIndex.namesFor`). **Plugin rebuilt 22:35, NOT deployed** (needs a restart; until then
  the per-row dropdown only has current / from classname / translated).
- Pose test: Walk/Sit/Lay/Stack are toggles and the test only tries the ticked ones (none = all). Preset: the
  confident verdict, else the name (chair -> sit, rug -> walk, bed -> lay), else all.

**HabboCity sync through the browser (2026-09-27, 23:00).** User: missing icons/.nitro should download automatically, "I
need HabboCity". Findings:
- HabboCity's renderer-config: `furni.asset.url` = `https://cdn.habbocity.fr/resources/bundled/furniture/%libname%.nitro`,
  `furni.asset.icon.url` = `https://swf.habbocity.fr/dcr/hof_furni/icons2/%libname%%param%_icon.png`.
- **A plain server request to any HabboCity host (cdn., swf., habbocity.fr/swfs) gets the Cloudflare challenge (403).**
  This is never worked around. sodaho.tel's "Ripper" (renderer-config URL -> scan furnidata -> import) defaults to
  habbox.co and has a "cf-bypass" option we do not copy. A habbox.co server download was built and then **removed at
  the user's word ("no habbox, revert")**: not in the plugin, never deployed.
- **What works:** reading inside the user's open HabboCity tab (the cdn.habbocity.fr client frame), the way the page
  itself loads. `cdn.habbocity.fr` files are readable there (a missing file is a real 404). `swf.habbocity.fr` icons are
  NOT readable that way (CORS "Failed to fetch"): a different browser-side route is needed (not done).
- New `c:/tools/nitro-catalog-copy/scripts/hc-sync.js`:
  - `report`: HabboCity's FurnitureData (fetched in the tab, cached 6h) vs ours -> `hc-sync-report.json`. First run:
    HabboCity 50,474 furni, ours 34,968; 18,713 only on HabboCity; 3,208 only ours; **3,271 of our base classnames have
    no .nitro on our CDN, 1,095 of them HabboCity has**.
  - `assets [max]`: downloads those into `hCMS/public/cdn/bundled/furniture/` (8 per call, base64 out of the tab, temp
    file + rename, HTML/too-small responses rejected). The test run saved 20/20 with the same header as ours
    (`00 02` + name). Full run finished: **1,000 .nitro files saved in total** (20 test + 980), 95 failed with a real HTTP 404 (listed in HabboCity's FurnitureData but no file on its CDN either); see `hc-sync-assets.log`.
- **Icons through Chrome debug:** `hc-icons.js [max]` finds our furni whose `<base><_colour>_icon.png` is missing in
  `dcr/hof_furni/icon/` and loads each from `swf.habbocity.fr/dcr/hof_furni/icons2/` with
  `Network.loadNetworkResource` on the HabboCity tab. That is the tab's own browser request (a page fetch() is
  CORS-blocked, a server request is Cloudflare-blocked); only real PNGs are saved. First run: 45 missing, **1 saved**
  (Stellar_Laser_Atlanta), 47 real 404s (mostly our own customs that HabboCity doesn't have). Log: `hc-icons.log`.
- Not done yet: a full catalog-page compare (pages/offers/order) using the older
  `hc-walk.js` walker; importing HabboCity furni we don't have at all.
- "Can't open categories after Academy": the data is fine (visible/enabled/rank 1) and a click on Bellarose opened it
  normally; the user was asked which page exactly.

**Deploy 23:11 + HabboCity retries (2026-09-27, late).** Plugin with the per-furni hotel names for the bulk rename modal
deployed (user-approved restart); the boot log shows "protocol registered (9569-9583)" and "RCON furnieditorrevert
registered"; no habbox code in the jar. Dev tab reconnected with a fresh SSO ticket.
- `hc-sync.js assets-all`: asked HabboCity's CDN for all 2,271 still-missing .nitro files, including furni its
  FurnitureData doesn't list: **1 more saved**, 2,270 real 404s. `hc-icons.js` now tries 5 paths x 2 letter cases per
  icon: still 0 of 44 (all real 404s). `hc-nitro-retry.js` (case variants via loadNetworkResource): 0 of 95. What is
  still missing does not exist on HabboCity.
- "Bellarose not working": reproduced right after login. The first catalog click did nothing and the page arrived one
  click late (the catalog was still loading its index). Later clicks open every page (Bellarose 39 offers, Decorations
  9, Game of Thrones). The user confirmed "now works". No code change.

**Bulk rename: choose the hotel + word hints (2026-09-27, 23:30).**
- `build-furni-names-index.py` now records WHICH hotels use each name (4th field, hotel list; top 24 names per
  classname; 55MB) and adds **HabboCity** from `hc-sync-furnidata.json` (its FurnitureData, read through the browser):
  50,031 of its classnames are in the index.
- Plugin: `FurniNamesIndex.Name.hotelList`; the page-items reply writes `-2` (format marker) and then the names with
  their hotel list. The client parser reads both the old and the new format. **Built 23:29, NOT deployed** (needs a
  restart; until then the Hotel dropdown stays empty and "Best English" works as before).
- Modal: a **Hotel** dropdown ("Best English (all hotels)" + every hotel naming furni on the page, sorted by how many).
  Picking one fills each row with that hotel's own name, translated into English (word order too) when needed. Under
  the suggestion it shows the hotel's original name and **word-by-word hints** (`WordHints`: e.g. "Trone -> Throne,
  Crabe -> Crab").

## Furni Editor round 4 + `:buildertool` (2026-09-28)

- **Deployed** the 23:29 plugin build (hotel lists in the page-items reply) with a user-approved restart at 00:13; boot log
  "protocol registered (9569-9583)" + "RCON furnieditorrevert registered".
- **`:buildertool` / `:buildtool`** never existed anywhere (client, plugins, `emulator_texts`; the chat log shows the
  attempts going out as plain chat). The brush toolbar used to open from the room-tools build icon, which the room-tools
  rework pointed at `build-mode/toggle`. Added both commands in `useChatInputWidget.ts` -> `builder-toolbar/toggle`,
  gated like `:build` (controllerLevel >= GUEST). Live-verified: typed in a room, the toolbar opened (13 `.bm-btn`).
- **Bulk rename saved only part of a batch:** every successful rename updated the parent's `items`, and the modal's
  effect on `[items, hotelNames]` rebuilt every row, so the rows still waiting lost their ticks, hotel choice and edited
  names. Now rows are rebuilt only when the page's item ids or hotel names change (the chosen hotel is reapplied); a name
  change only updates the "Current name" column. Code-level fix, **not yet run with a real Apply**.
- **Translate** now translates the picked hotel's own name (`row.source`) when a hotel is chosen, else the current name.
  Live: Dragons page + habbo.st gives e.g. "Hellblaue Drachenlampe" -> "Light Blue Dragon Lamp" for all 11 lamps.
- **Names show at once after saving:** `applyNameLocally` sets the loaded FurnitureData entry's `_localizedName` and the
  open catalog page's offers' `_localizationId` (the offer name = `LocalizeText(catalog_name)`). A bulk run ends with a
  re-request of the open catalog page (`GetCatalogPageComposer`); a plain Save re-requests it with the current offer kept.
  Plugin: new `CatalogNames.refresh(itemsBaseId, name)` sets only the private `name` of the emulator's loaded
  `CatalogItem`s (reflection; `update()` would also reload prices/limited counts), called from Rename, Update and Revert.
  Deployed 00:56 with the words build.
- **Word dictionary:** `furni-words.json` was **empty** (`{}`) since the 23:30 index rebuild: the index gained a 4th field
  (hotel list) and the learner only accepted exactly 3, so it learned nothing and wrote `{}`. Fixed (`>= 3`). Also:
  `plain()` in the index builder, learner and `FurniNames.ts` now maps ß->ss, ı->i, ł, ø, æ, œ (Turkish words were cut in
  pieces); the index tags language **per name** (a word is English when English hotels use it about as much as others;
  a name is English at >= 75% English words), so habbo.cc (15k de / 11k en), the German hotels' English names and the
  .com.tr hotels' Turkish names are tagged right; the learner splits compounds (one side known, German linking letters
  n/s/en/e/es/er) and learns the other side. Result: 7,328 words (was 4,644 in the last good build); top-400 word coverage
  of habbo.cc/hubba.cc/habbo.st 31-32% -> 44-56% (the rest is mostly English already, or compounds split at runtime).
  Translator (`FurniNames.ts`): compound parts stay together in order ("Geld Eismaschine" -> "Money Ice Machine"),
  linking letters in `splitGlued` (Drache-n-lampe), unknown hyphenated words split, "aus" is a link word ("Toilette aus
  Gold" -> "Gold Toilet"), punctuation around a word ignored ("(Yeşil)" -> Green). Some learned words are wrong
  (Nebelmaschine -> Rocket, Raumschifftür -> Monolith): alignment noise, the reason suggestions stay suggest-and-confirm.
  Backups: `furni-names-index.tsv.bak-20260928`, `build-furni-words.py.bak-20260928`.
- The 69 `tsc` errors predate this work; none are in `components/furni-editor/`.
- **Staff word translations** (user: "so I can add translations inside the furni editor"): table `hcms_furni_words`
  (word PK in plain form, english, kind adj/noun, added_by, updated_at; created by the plugin at boot,
  `FurniWords.ensureTable`). Packets IN 9584 list / 9585 save (string word, string english - "" deletes -, string kind),
  OUT 9586 list (int n, then word/english/kind/addedBy); 9584-9586 checked free everywhere. Each save is logged to
  `hcms_admin_audit_log` (`furni.word_saved` / `furni.word_deleted`, target_type `furni_word`) and the new list is sent to
  every online rank-7+ player. Client: `FurniNames.SetCustomWords` fills a map `lookup()` checks **first** (so a custom
  word also overrides a wrong learned one, and compounds split on it); `UnknownWords(name)` lists what the dictionary
  doesn't know. UI (`FurniEditorWordsView.tsx`): a **Words** tab (search, add/change, Edit, Delete); `WordChips` (unknown
  words dashed yellow, known words "x → y" blue, click = fill the form) + `WordForm` in the Edit tab's Name box and in the
  Bulk rename modal ("Teach a word"). Rows keep an `auto` flag: when the word list changes, unsaved tool-made suggestions
  are made again, hand-typed ones are left. Unit-checked with esbuild: "Schwarze Nebelmaschine" -> "Black Rocket" before,
  "Black Fog Machine" after adding the word. **Deployed 00:56 (user-approved restart; boot log "protocol registered
  (9569-9586)", table created).** Live-verified on the dev client: Words tab "Words (0)" -> added "Nebelmaschine = Fog
  Machine" through the form -> "Words (1)", DB row (added_by 1), audit row `furni.word_saved`; computed colours white on
  rgb(21,26,35). The word was left in (it fixes the wrong learned "Rocket"). Delete, the chips and the bulk re-suggest
  are not live-tested yet.
- **Bulk rename Find & replace** (user chose "Find & replace in bulk", 2026-09-28): a row under the Hotel/Page row with
  Find / Replace with / Match case / "Replace (N)". It changes the New name of every unsaved row that contains the text
  (plain text, special characters escaped, case-insensitive unless Match case; empty "Replace with" removes it, spaces are
  tidied), marks those rows hand-edited (`auto: false`) and ticks the ones that now differ from the current name. N =
  rows it would change. Client-only; `tsc` clean; the replace line was unit-checked in node ("Green Dragon (C)" minus
  "(c)" -> "Green Dragon", "a.b" doesn't match "axb"). Not clicked live yet. The emulator (01:48) and the Vite dev
  server were restarted this session; Chrome debug was relaunched on 9222 with `C:\Tools\chrome-debug-profile` (started
  directly, without `start-chrome-debug.bat`, which force-kills every Chrome window).
- **Furni Editor Auto run** (user picked "Furni Editor, item by item", 2026-09-28): an "Auto run" / "Stop" button plus
  Modes / Size / Pose / Height ticks next to Save (only in catalog-page mode, `pageIndex >= 0`). Per furni it waits until
  the asset measure, the size scan, the height scan (`scanFor` ref = the item the scan belongs to, so a stale scan of the
  previous furni is never used) and the pose test are finished, or 10s (`AUTO_RUN_WAIT`), then applies the ticked
  suggestions to a copy of the form and sends the normal update with `nextAfterSave` (same path as Save & next):
  modes = asset states; size = floor-contact scan; pose = only when `DecidePose` is confident (`decision.found`);
  height = the same rule as the "Scanned ... - use it" button (seat/mattress top + SIT/LAY offset for sit/lay furni,
  else the surface), using the pose just applied. An empty page moves on to the next one; it stops on Stop, a save error,
  the editor closing, or the end of the catalog tree. Status line: "N done, M changed - classname: what changed". Every
  save goes through `FurniEditorUpdateEvent`, so each is logged per field and can be reverted from Admin > Furni edits.
  Caveat: the sit/lay seat-edge height is still not live-verified (see "Deployed + seat heights"). `tsc` clean;
  **not run live yet**.

## Furni Editor round 5: seat benchmark, multiheight, download from other hotels, Auto run review (2026-09-28)

- **Seat / bed height rules re-chosen from a real benchmark.** Truth set: 184 floor furni (153 sit, 31 lay) whose
  stack height `hubblycata`, `habboworld` and `ltdhabbo` all agree on and that isn't the generic 1.0. Each was opened in
  the Furni Editor of a **separate headless Chrome** (`--headless=new --remote-debugging-port=9223`, profile
  `C:\Tools\chrome-bench-profile`, swiftshader WebGL; the user's own debug Chrome's background dev tab is `document.hidden`
  so its animation frames pause and Nitro never finishes loading) logged in as the test account SoonE2E6660 (rank 7,
  `users.auth_ticket` set directly), and every scan candidate was read from `window.__furniEditorScan` (new debug hook
  set by `scanSurface`, also `export let LastScanDetail`). Scripts: scratchpad `bench-run.js`, `bench-truth.json`,
  `bench-results2.json`, `cdp-tab.js`. **Gotcha:** the first run read the scan while Nitro still drew the grey
  placeholder box (43 furni all "surface 1 / edge 0.9 / sweep 0.85"); wait until the editor shows its asset data.
  Results (within 0.2 of the agreed height): chairs old rule 51% -> **min(column-group seat, strongest sweep band) +
  0.70 = 65%**; beds old 29% -> **column-group mattress + 0.80 = 77%**. The old "highest band" often took an armrest or
  backrest. The agreed heights are partly convention (61 of 152 chairs are exactly 1.2), so it stays a suggestion.
  `scanSurface` now returns `seat` (sit) and `bed` (lay); `SIT_OFFSET 0.7`, `LAY_OFFSET 0.8` in FurniEditorView.
- **Multiheight detection:** `ScanStateHeights` (FurniEditorPreview) switches the preview through every state (<= 20,
  2 frames each, lower surface wins) after the size scan and reads the surface height; `IsMultiheight` = max - min >=
  0.1. The Size box shows "States have different heights (...) - make it multiheight" (sets interaction `multiheight` +
  the list) or "✓ Multiheight matches". Auto run applies it (with the Height tick) only when the interaction is
  default/multiheight/empty (gates, lamps, teleports change per state for other reasons). Live on the Door Wall
  (`hfdiy_walldoor2_luopei`): `3;3;3;3;3;3;3.65;3.65;3.65;3.65;3.7;3.7`.
- **Download a furni from other hotels (user chose "hotels without block").** Probed all Hab-Track renderer-configs
  from the server (`scratchpad/probe-hotels.js`; configs start with a BOM, missing furni URLs = Nitro defaults): 29
  hotels hand out real files, HabboCity and ~10 others answer 403 (Cloudflare), many are down. Plugin
  (`hcms-furnieditor-plugin`, built, **not deployed yet**): `FurniSources` + table `hcms_furni_sources` (name, nitro_url,
  icon_url with %libname%/%param%, enabled, priority; seeded once with the 29, habbox.co disabled per the user's earlier
  "no habbox"), IN **9587** (int itemsBaseId, boolean replace) / OUT **9588** (boolean ok, string message). Tries the
  enabled sources in priority order on a worker thread; keeps a .nitro only if the classname appears in it, an icon only
  if it is a PNG; backs up an existing file to `C:/inetpub/wwwroot/hcms-furni-backups`; bumps `&n=` on the furni .nitro
  and icon URLs in both renderer-configs; logs `furni.asset_downloaded`. Client: Asset data box buttons "Download
  missing from other hotels" (warning colour while the asset hasn't loaded) and "Replace ours".
- **Auto run review list** (user: "after auto run it should give preview audit list and i can revert change or accept
  bulk or one or two or three"): every furni the run changed is kept with its values from before
  (`IAutoRunChange`); when the run stops `FurniEditorReviewView` opens: tick rows, Accept / Revert ticked, Accept all /
  Revert all, or per row; clicking a name opens that furni. Revert re-saves the before-values (each save logged like any
  edit), 400ms apart, marked via a `reverting` ref so the editor doesn't jump. A "Review (n)" button reopens it.
  Client-only; not yet run live.
- **Auto run size rule (user: "dont do too high width length, it should always work by assets or nitro file, only
  change when different hotels say the same, else leave the asset's and flag if unsure"):** the size is the asset's own
  (`MeasureFurni` = the .nitro's logic dimensions). Another size only when every reference hotel that has the furni
  (>= 2 of Hubbly/HabboWorld/LTD) agrees on it; disagreeing references, a differing floor-contact scan, or no asset size
  are only **flagged "unsure"** (never applied) and listed in the review window (⚠ line, "only unsure" filter; rows can
  be in the list with "no change" just for the flag). Needs the reference sizes: the detail reply now ends with an extra
  section (int n, then width/length per reference, same order) - added at the end so an older client still parses.
- **Deployed 11:10 (plugin, user-approved restart; boot "protocol registered (9569-9588)", "filled hcms_furni_sources
  with 29 hotels") and 11:17 (client `yarn deploy`, live bundle `index-2dc7ec66.js`).** Download verified end to end in
  the headless client on `picnic_blanket_weel` (id 3980, no .nitro and no icon): 28 hotels asked, no .nitro anywhere
  (classname likely a typo in our data), icon from spacehotell.nl (391-byte PNG), audit row `furni.asset_downloaded`
  (actor 221 = the test account), `&n=1790586760` on both renderer-configs. A scan of our floor items: **3,091 have no
  .nitro, 65 no icon** - candidates for this button. The review list and the multiheight auto-apply were not run live.
- **Auto run skips already-edited furni + review shows Old -> Current (user, 2026-09-28).** The catalog-page reply
  ends with a new section (int n + ids whose latest `furni.edited`/`furni.reverted` log entry is an edit); the editor
  adds every furni saved this session. Auto run jumps over them (status "... skipped (already edited)") unless the new
  "Skip edited" tick is off (= rescan everything); the header shows "✓ edited". The review window lists each changed
  field as **Old → Current** (`IAutoRunChange.diffs`, fields width/length/modes/height/walk/sit/lay/stack/interaction/
  multiheight). Plugin jar rebuilt 11:46, **not deployed**; client not deployed. Names are not touched by Auto run.
- ":fe / this furni has an error" (user): the Door Wall's files exist; what the user saw was the multiheight case and
  the seat heights, handled above.

## MetroHotel boutique (Auras / Spawn / Lotto) - reverse-engineered, NOT built yet (2026-09-28)

User: "check metrohotel.net i want the auras spawn lotto create that boutique 1:1 check minified". Read-only, from the
user's own logged-in debug-Chrome tab (`metrohotel.net/hotel`, client iframe `metrohotel.net/nitro/`). Their bundles
were fetched inside that frame (base64, byte-exact) and pretty-printed with esbuild; local copies:
`c:\tools\nitro-catalog-copy\scripts\out\metro\` (`index-CGSH98XI.js` + `index.pretty.js` = app, 19.5MB;
`nitro-renderer-DBDWu6Cv.js` + `renderer.pretty.js` = their renderer fork). Line numbers below are in the pretty files.
The website (not the client) only has a casino "Toroloto" and a web "Boutique"; the wanted feature is in the client.

- **Window** `Ps3` (index.pretty ~28095): `uniqueKey:"boutique"`, root classes `container-todo shop-window metro-boutique`,
  headerless card, `.boutique-shell` > `.boutique-shell__feature` (label "Boutique MetroHotel" + tab row
  `.boutique-shell__tabs`, `border-tab`) + `.boutique-shell__content` > `main.boutique-shell__panel` >
  `.container-conteudo.boutique-content.boutique-content--<tab>` (+ `is-auras` for auras/bubbles/spawns/boxes/lotto).
  Tabs `us3`: home, bundle (VIP), jewel (Diamants), collectibles (Packs), **auras**, **bubbles**, **spawns**, **boxes**,
  **lotto**. Currency for these tabs: emeralds (their type 103 = `Ea`; ours is 101).
- **Server calls**: all buys go through `O0` = renderer `Qf`, header **9901 `KUBBO_CUSTOM`**, one string:
  `spawn_shop:buy:<id>` / `spawn_shop:select:<id>`, `chat_bubbles:buy:<id>`, `boutique:lotto`, `boutique:buy:<plan>`,
  `avatar_trophy_shop:buy:...`. Replies arrive as events with a JSON-ish `data` (e.g. Lotto `Ude`).
- **Auras** (`Us3`, ~27979; also inside the "Personnalisation" window `B7` tab "Auras"): 4 per page with pagination,
  card = avatar preview (`b2`: a RoomPreviewer with `updateObjectUserAction(FIGURE_AURA, id)`), VIP icon, tier
  (Basique/VIP/LTD), button Porter / Retirer / price. Data list `pi` (~27900s): `{id, key, name, tier, price, vipOnly,
  animated, description, colors:[a,b]}` (ids ~300+). Protocol: IN `HABBO_LIFE_AURAS_DATA` 6069 (status, message,
  diamonds, activeAuraId, shopItems[], ownedItems[]), `ROOM_UNIT_AURA_SHOW` 6075 (unitId, auraId); OUT 9077 request /
  9078 buy / 9079 select. **Rendering is in their renderer fork**: avatar visualization keeps `_auraId`, applies a
  custom Pixi filter `Qse(colorA, colorB, animated, effectMode)` on the avatar and draws `CUSTOM_AURA_LAYER_COUNT`
  extra ADD-blended sprites per `overlayMode` 1-15 (sin/cos motion formulas per mode; 11-15 use VIP gif textures,
  `VIP_GIF_LAYOUTS`) - renderer.pretty ~53340-53440, aura table `ol`. Building this means patching our vendored
  `@nitrots/nitro-renderer` AvatarVisualization.
- **Spawn** (`Ls3`/`Ds3`, ~28009): stage with the avatar + a frame-sequence image animation (`xp(id)` config: folder,
  frameCount, frameDurationMs, frame size, scale, offsets; `Ax(config, frame)` = frame url), Rejouer / Équiper / price,
  picker of thumbnails. Text: plays on room entry, or every 10s with `;spawn`. In-room playback not traced yet.
- **Lotto** (`ws3`, ~28030): 100 emeralds, 9 cards (`client/voucherEmblema.png`), spin animation then the server's
  `winningIndex` card shows the reward (rare furni / badge / banner / winwins / diamonds) + a "GAIN LOTTO" result popup.
- **Bubbles** (`Bs3`, chat bubble ids 7001-7021, 20 emeralds), **Boxes** (`vs3`, Lot Box plans), trophy creator (`Fs3`).
- **Not done**: nothing built; their CSS (`nitro/build/index.css`) not pulled yet; assets (spawn frames, VIP aura gifs,
  bubble images, `client/boutique/*`) not listed; server rules (prices per item, Lotto reward table/odds) are
  server-side and not visible in the client.
- Aura filter extracted for reference only: `out/metro/aura-filter-Qse.js`, `aura-shader-Kse.glsl` (vertex),
  `aura-shader-qse.glsl` (22KB fragment, effectMode 1-19 + 30-33), `aura-table-ol.js` (35 auras), `auras-pi.js` (shop list).

**Decisions (user, 2026-09-28):** build the **whole** Boutique, **auras first**, patching the renderer is OK. "1:1 but
still clean own for maybe future sell with own design": same features/behaviour/layout structure as MetroHotel, but our
**own** code, shader, aura set, texts and look, no MetroHotel code/assets copied, so it can be sold later. Languages:
**English, German, French, Portuguese, Spanish**. Built as a **standalone product**: its own Arcturus plugin + a
drop-in client module + a small, separate renderer hook patch, config-driven (items, prices, currency id, packet
headers, texts, admin rank), nothing tied to hCMS. **Lotto = our existing Bonamigo** (hCMS `hcms_bonamigo_prizes` /
`_settings` / `_logs`) through a provider setting; other hotels get a built-in prize table.

**Renderer hook design** (our renderer is TS source, `main=./index`; the root `nitro/...` files are the ones used, not
`src/...`; the project already patches it via `.yarn/patches/@nitrots-nitro-renderer-npm-1.6.6-c15ae4be91.patch`, a
4.8MB whole-source patch): `RoomObjectVariable.FIGURE_AURA = 'figure_aura'`; a `case FIGURE_AURA` in
`RoomEngine.updateRoomObjectUserAction` that sets the model value; `AvatarVisualization` reads it in `updateModel` and,
where it sets the avatar sprite's `filters` (today `[]`), asks a registered provider (`AvatarAuraRegistry`) for the
aura's filters; animated auras bump `updateSpriteCounter` every update so `RoomSpriteCanvas` redraws an avatar that
isn't moving (it only redraws when `needsUpdate(instanceId, updateSpriteCounter)`). The effect itself (our own shader)
lives in the Boutique client module.

**Renderer hook DONE + applied (2026-09-28):** made with `yarn patch @nitrots/nitro-renderer --update` + `yarn
patch-commit`; Yarn stored it as a second, chained patch `.yarn/patches/@nitrots-nitro-renderer-patch-abf9a4d94e.patch`
(7.7KB; `package.json` now points at the chain), `yarn install` applied it. Files: `api/nitro/room/object/
RoomObjectVariable.ts` (+FIGURE_AURA), `nitro/room/RoomEngine.ts` (FIGURE_AURA case sets the model value),
`nitro/room/object/visualization/avatar/{AvatarAuraRegistry.ts (new: IAvatarAuraProvider getFilters/isAnimated),
index.ts (export), AvatarVisualization.ts (_aura from the model; avatar sprite filters = registry filters; animated
auras refresh filters + updateSpriteCounter++ each tick)}`. `tsc` count unchanged (69, all pre-existing). Product copy
of the hook alone: `c:\inetpub\wwwroot\hcms-boutique\renderer-hook\aura-hook.patch`; backup of the old project patch
next to it. **Product repo** `c:\inetpub\wwwroot\hcms-boutique\{server,client,renderer-hook}` (just created).

**User rules for the plugin (2026-09-28):** (1) on first start it checks and creates everything itself ("auto scan and
add the sqls", done "clean" like the Plugins.rar jars); (2) **everything editable in the database, nothing hardcoded**
(auras incl. colours/effect settings, prices, spawns, bubbles, boxes, lotto, texts, settings; the client gets it all
from the server). Clean install pattern found: Mentions (Hxmada & Jonas) registers texts with
`Emulator.getTexts().register(key, default)` on `EmulatorLoadedEvent`; core `TextsManager.register` /
`ConfigurationManager.register` INSERT into `emulator_texts` / `emulator_settings` **only if the key is missing** (never
overwrite an admin's edit) - stock API, portable. Its own tables it does NOT create (ships a .sql). Our plan: `CREATE
TABLE IF NOT EXISTS`, a schema version in `emulator_settings` for later migrations, permission column added only if
`information_schema` shows it missing (works on MySQL and MariaDB), default data seeded only into an empty table.

**Renamed to hcms-shop (user, 2026-09-28: "instead boutiqua" / "do hcms-shop"):** repo `c:\inetpub\wwwroot\hcms-shop\
{server,client,renderer-hook}`, package `com.hcms.shop`, classes `Shop*`, tables `shop_*`, settings `shop.*`, plugin name
"hCMS Shop", jar `hcms-shop.jar`, client link prefix `shop/`, chat `:shop`. (Earlier notes above that say
hcms-boutique / boutique_* / boutique.* mean these.) Also checked `Plugins.rar\Plugins\Open-Source Plugins\
retropass-main` (extracted to `c:\tools\plugins-reference\retropass-extracted\`): listeners split by theme, `onDisable`
removes its packets and restores the stock handler it replaced (via the private `PacketManager.incoming` map), custom
item interactions on `EmulatorLoadItemsManagerEvent`, a remote licence check on start; it creates no tables.

**hcms-shop, auras part - BUILT, not deployed, not live-tested (2026-09-28):**
- Server (`hcms-shop/server`, builds `target/hcms-shop.jar` with the same Maven/JDK21 setup as the Furni Editor):
  `ShopPlugin` (on `EmulatorLoadedEvent`: `ShopInstaller.run()` then registers packets; a header clash is logged, not
  thrown; `onDisable` removes exactly its own handlers), `ShopConfig` (all `shop.*` settings with defaults: enabled,
  language, currency.type 101, vip.rank 2, admin.rank 7, header.in.open/buy/equip/room 9590-9593, header.out.data/result/
  aura/room 9595-9598), `install/ShopInstaller` (tables `shop_tabs`, `shop_texts` (lang, key, value), `shop_auras`
  (code, tier, price, currency_type -1 = default, vip_only, effect, color_a, color_b, speed, intensity, sort_order,
  enabled), `shop_user_items`, `shop_user_active`, `shop_log`; `permissions.acc_shop_admin` added if missing; schema
  version `shop.schema.version`), `install/ShopSeed` (tabs: only auras enabled; 16 own auras over 8 effects; UI + aura
  names/descriptions in en/de/fr/pt/es, inserted with INSERT IGNORE), `data/ShopRepository` (catalog + texts cached 30s so
  DB edits apply within half a minute; equipped cache per user), `ShopService` (all rules server-side: enabled, VIP
  rank, ownership, balance; `givePoints(type, -price)`; results translated with %name% / %currency%), `room/RoomAuras`
  (room list on request, change pushed to the room), `messages/incoming/ShopHandlers` (Open(lang), Buy(type,id),
  Equip(type,id; 0 = off), Room()), `messages/outgoing/ShopComposer` (every reply = one JSON string).
- Client (`hcms-shop/client/src`, copied into this repo as `src/api/shop/*` + `src/components/shop/*`):
  `AuraFilter.ts` (our own GLSL fragment shader, Pixi 6 `Filter`, 8 effects: 1 glow, 2 sparkles, 3 flames, 4 mist,
  5 orbit, 6 rainbow, 7 frost, 8 electric; uniforms from the DB row; padding 10-16px), `ShopAuras.ts` (visual registry,
  the `AvatarAuraRegistry` provider, one filter per aura + zoom, `ApplyUnitAura` via
  `updateRoomObjectUserAction(roomId, unitId, FIGURE_AURA, id)`), `ShopProtocol.ts` (headers from ui-config
  `shop.headers`, JSON parsers), `ShopView` (window: title/subtitle/balance, tabs from the DB, auras tab, result line),
  `ShopAurasView` (4 per page + pagination, card = preview + VIP mark + tier + Buy/Wear/Remove), `ShopAuraPreview`
  (RoomPreviewer avatar + FIGURE_AURA), `ShopAuraSync` (always mounted: on unit ADDED asks the room's auras after 400ms;
  applies pushed changes), `ShopView.scss` (theme tokens only). Mounted in `MainView` next to FurniEditorView; `:shop`
  in `useChatInputWidget.ts`; `@import './shop/ShopView'` in `components/index.scss`. `tsc`: still 69 (none from shop).
- **Deployed + first live test (2026-09-28 03:35, user-approved restart):** boot log "[hCMS Shop] ready: schema v1,
  packets [9590, 9591, 9592, 9593]" and "added permission column acc_shop_admin"; the installer created all 6 `shop_*`
  tables, 16 auras, 60 texts x 5 languages, 14 `shop.*` settings, `acc_shop_admin` = 1 for ranks 7-8. **Bug found and
  fixed:** the aura shader failed to link ("Could not initialize shader": `inputSize` precision differed between Pixi's
  default filter vertex shader (highp) and our fragment (mediump)); fixed by declaring `uniform highp vec4 inputSize /
  outputFrame`. After the fix, on the dev client: window "Shop", balance 998.233, 4 cards per page with the right
  names/tiers/prices, no console errors; every preview's image changes between frames (animation runs) and decoded
  pixels show the effect colours (Frostbite ~390 icy-blue pixels; orbit/electric effects are small and subtle).
  **Not yet tested live:** buy, wear/remove, the room sync on other avatars, how the effects look to a human eye.
- **More auras (user: "there are more add more" / "translate it to english" / chose "Their 35, names in English"):**
  shader extended with our own effects 9 streak, 10 void, 11 shine, 12 power, 13 halo, 14 bubbles (padding 16 for
  10/12/14). MetroHotel's 35 auras (English names/descriptions, their tiers/prices/colours, mapped to our effects; their
  GIF overlays NOT copied) are **hotel data for our DB only**, not in the product seed:
  `hcms-shop/hotel-data/build_metro_auras.py` -> `metro-auras.sql` (INSERT IGNORE, sort 200+), loaded into `hcms`
  (backup `bak_20260928_shop_auras`). Now 51 auras (17 basic / 18 VIP / 16 LTD). Live: all 13 shop pages render, no
  shader errors. Other languages fall back to English for these 35.
- **Spawn (user: "do next spawn", 2026-09-28) - BUILT, not deployed yet.** MetroHotel mechanism (read from their bundle):
  a spawn = a folder of PNG frames (`client/spawns/<folder>/frameNNNN.png`, their table `A03`, 52 entries with frameCount,
  frameDurationMs, frame size, scale, offsets), drawn as an HTML `<img>` over the room canvas at the avatar's screen
  location (re-read every animation frame), on room entry and with `;spawn` (10s); their server broadcasts (unitId,
  spawnId). User chose "Copy MetroHotel's 52 for our hotel": `hcms-shop/hotel-data/fetch_metro_spawns.py` fetched all
  788/788 frames through the user's MetroHotel tab (same-origin fetch in their client frame, read-only) into
  `hCMS/public/cdn/shop/spawns/<folder>/` (3MB) + `metro-spawns.json`; `build_metro_spawns.py` -> `metro-spawns.sql`
  (English names made from the folder names, price 500 each - MetroHotel's prices are server-side, unknown - and
  `shop.spawn.frames.url` = `https://cdn.habbo.nz/shop/spawns/%folder%/frame%frame%.png`). **Not loaded yet** (the table is
  created by the new plugin). These frames look like a third-party effects pack: our hotel only, not the product.
  Server: schema **v2** with a real migration step (`ShopInstaller.migrate`, runs only when the stored version is older;
  v2 switches the spawns tab on once), table `shop_spawns` (code, price, currency_type, vip_only, folder, frame_count,
  frame_ms, frame_width, frame_height, scale, offset_x, offset_y, thumb_frame, sort_order, enabled), settings
  `shop.spawn.frames.url` / `shop.spawn.cooldown` (10) / `shop.header.in.spawn` 9594 / `shop.header.out.spawn` 9599,
  `data/ShopItem` (common interface; Aura + Spawn implement it; buy/equip generic in `ShopService`), `room/RoomSpawns`
  (plays the equipped spawn for the room; entry max once per 3s, `;spawn` per cooldown, both checked server-side),
  handler `ShopHandlers.Spawn(boolean entry)`, texts spawns.* / button.replay / button.equip / label.equipped /
  msg.spawn_cooldown / msg.no_spawn / msg.spawn_removed. Client: `ShopProtocol` (IShopSpawn, ShopSpawnComposer,
  ShopSpawnPlayEvent, `SpawnFrameUrl`), `ShopSpawnAnimation` (preloads all frames, plays once, onDone), `ShopSpawnsView`
  (stage: avatar + animation + Replay; name + Equip/Buy; thumbnail picker; Remove), `ShopSpawnPlayer` (always mounted in
  MainView: own unit ADDED -> ShopSpawnComposer(true) once per visit; draws every broadcast at
  `GetRoomObjectScreenLocation` following the avatar), `;spawn` / `:spawn` in `useChatInputWidget.ts`. `tsc` still 69.
- **Spawn deployed + tested (04:09 / 04:13, user-approved):** boot "migrated the database to v2 (spawns)", "ready: schema
  v2, packets [9590..9594]"; `metro-spawns.sql` loaded (52 spawns / 788 frames / 52 names, frames URL set). **Bug found
  and fixed: a protocol string holds at most 65535 bytes** (2-byte length) - with 51 auras + 52 spawns the shop data JSON
  was 78,438 bytes and arrived cut at 12,902 (= 78438 - 65536), so `JSON.parse` failed silently and the window stayed on
  "…". Now every JSON reply is `int count` + parts of <= 16,000 chars (surrogate pairs never split;
  `ShopComposer.json`), joined by the client's `JsonParser`. After the fix: Spawn tab shows all 52 with CDN thumbnails;
  the user bought + equipped "Blue Impact" (shop_log buy 500, equip; `shop_user_active` spawn 9) and earlier bought/wore
  auras (Ultra Instinct 3600). **Built, not yet deployed:** separate texts `msg.spawn_equipped` ("%name% is now your
  spawn.") / `msg.spawn_removed` instead of the aura wording. **Not yet verified:** the in-room overlay on entry and
  `;spawn` (position/offsets over the avatar), other players seeing it. Also: settings written straight to
  `emulator_settings` after boot need `:update_config` (or a restart) before the running emulator sees them.
- **Borders (user: "add also now borders", 2026-09-28) - BUILT, not deployed.** MetroHotel mechanism (their bundle): a
  border decorates the **infostand**. Their `iX4` infostand draws `client/slice2/<n>.gif` as a 9-slice CSS
  `border-image` (slice/width "142 114 146 113", box left -20 / top -15 / width +20 / height +35 -> right 0, bottom -20,
  z-index 14); border 74 is one stretched image 5px around. The shop (`Ss3`) shows `client/slice/<n>.gif` + overlay
  `client/slice2/<n>a.gif`; commands `bordures:request|buy:<n>:emeralds|equip:<n>`; the infostand asks the owner's
  `activeBorderId` per user. 89 borders (1-93 without 43/52/53/85). Copied for our hotel (user's choice, same as spawns):
  `fetch_metro_borders.py` -> `hCMS/public/cdn/shop/borders/{preview,frame}/` (89 previews, 89 frames - 74.gif is really a
  PNG -, 89 overlays, 2.1MB) + `metro-borders.json`; `build_metro_borders.py` -> `metro-borders.sql` (89 rows, "Border
  #n", 300 each, `shop.borders.url` = `https://cdn.habbo.nz/shop/borders/`). Server: schema **v3** (migration adds the
  borders tab), table `shop_borders` (code, price, currency_type, vip_only, preview/frame/overlay_file, mode
  slice|stretch, slice, box_left/top/right/bottom, sort_order, enabled), `data/Border` (ShopItem), settings
  `shop.borders.url`, `shop.header.in.user` 9600 / `shop.header.out.user` 9601, handler `ShopHandlers.User(int userId)`
  -> `ShopService.sendUser` {userId, bordersUrl, border}, also sent to the player after equip/remove; texts tab.borders,
  borders.*, button.use, label.in_use, msg.border_equipped/removed. Client: `ShopBorderFrame` (slice or stretch),
  `ShopInfostandBorder` (asks per user, caches, draws) inserted as the first child of `InfoStandWidgetUserView`'s
  `.nitro-infostand` root (already `position: relative`), `ShopBordersView` tab (grid + "no border" + detail with an
  infostand-sized framed preview + Use/Buy), protocol `ShopUserComposer` / `ShopUserEvent`. `tsc` still 69.
- **Borders deployed (04:44, user: "yes its great")** + **small border (user: "can you do the small border also",
  deployed 05:33).** Reference: MetroHotel's avatar name menu `qf` (their equivalent of our `AvatarInfoWidgetNameView`)
  draws, when the clicked player has a border, `client/slice/<n>.gif` at 97x80 centred behind the name (z 0) and
  `client/slice2/<n>a.gif` as `.context-menu-extra-border` (their CSS: absolute, inset 0, background centred no-repeat,
  z 1); the name box also gets `chat-bubble bubble-<n> type-0`, which only styles chat bubbles inside `.bubble-container`
  (no effect there). Built: the server's border visual now also carries `small` (preview file) and `overlay`;
  client `useShopUserDecor(userId)` (shared per-player cache, re-asks at most every 30s) used by `ShopInfostandBorder`
  and the new `ShopNameBorder`, rendered inside `AvatarInfoWidgetNameView` (`.shop-name-bordered`: frame 97x80 behind,
  overlay above it, name text on top; `.nitro-context-menu.name-only` doesn't clip overflow). Their CSS saved at
  `out/metro/index.css` (5.9MB). **Not yet seen live** on a clicked avatar.
- **Spawn on room entry never played (user report, 2026-09-28, fixed client-side):** `ShopSpawnPlayer` asked for the
  entry spawn on `RoomEngineObjectEvent.ADDED` when `objectId === session.ownRoomIndex`, but the renderer dispatches
  ADDED inside `addRoomObjectUser` *before* `RoomMessageHandler` calls `setRoomSessionOwnUser` (RoomMessageHandler
  ~828/832), so `ownRoomIndex` was still -1 (or the previous room's index) and it never matched. Now the check runs 300ms
  after ADDED, and the "already asked" key resets on `RoomSessionEvent.ENDED` so re-entering the same room replays it.
  Product copy updated. `tsc` 69. **Not yet confirmed live** (user to re-enter a room with a spawn equipped).
- **Player toggles :nospawn / :noentryspawn / :noaura (user, 2026-09-28; deployed 05:50, schema v4).** MetroHotel has
  none of these (grep of their bundle), so own design, chosen with the user: `:nospawn` = you see nobody's spawn,
  `:noentryspawn` = your own spawn no longer auto-plays on entry (`;spawn` still does), `:noaura` = you see nobody's
  aura; **the same command turns it back** (user: "no same command turns back on"). Server: table `shop_user_settings`
  (user_id, setting_key, enabled), `room/PlayerSettings.change(habbo, key, mode -1/0/1)`, IN **9602**
  (`shop.header.in.setting`; string key, int mode), cached in `ShopRepository.setting/setSetting`. Hidden things are
  simply not sent: `RoomSpawns.play` sends per viewer, skipping hide_spawns; `RoomAuras.broadcast` skips hide_auras and
  `sendRoom` sends a null aura for every unit to a hiding player (so toggling clears/restores the ones drawn at once).
  Texts `msg.spawns_hidden/shown`, `msg.entry_spawn_off/on`, `msg.auras_hidden/shown` (5 languages). Client:
  `SHOP_SETTING_COMMANDS` + `ShopSettingComposer` in `ShopProtocol.ts`, matched in `useChatInputWidget.ts` (`:` or `;`).
  **Fixed along the way:** shop results (incl. `;spawn` cooldown) were only shown inside the shop window; `ShopView` now
  shows them as an INFO bubble when the window is closed. Help list: new "Shop commands" section in `HelpCommandData.ts`
  (:shop, ;spawn, :nospawn, :noentryspawn, :noaura). **All auras set VIP-only** (user: "auro will be vip" -> "All auras
  VIP-only"; `UPDATE shop_auras SET vip_only = 1`, backup `bak_20260928_shop_auras_vip`; hotel data, not the product
  seed). Note: an aura someone already wears keeps showing after their VIP ends (only buy/equip check VIP).
- **Ornaments split from borders (user: "borders and ornaments should be separate", chose "Two tabs, two items";
  deployed 05:59, schema v5).** In MetroHotel's `qf` the image behind the name comes from `activeBorderId`, but they
  also have a separate ornament system (`ornamentId` per user, `ornaments/images|icons/`, "Ornaments <id>" command, their
  phone/Personalisation menu). Ours now: **border** = infostand frame only (`Border.visual()` no longer sends `small`);
  **ornament** = new item type `ornament`, table `shop_ornaments` (code, price, currency_type, vip_only, image_file,
  overlay_file, width 97, height 80, sort_order, enabled), `data/Ornament`, tab `ornaments` (sort 26, v5 migration),
  `shop.ornaments.url`, texts `tab.ornaments`, `ornaments.header/hint/none`, `msg.ornament_equipped/removed`
  (equip/remove result keys are now `type + "_equipped/_removed"`, aura keeps `msg.equipped/removed`). `sendUser` also
  carries `ornament` + `ornamentsUrl`. Client: `ShopOrnamentsView` (grid + a name preview), `ShopNameOrnament` /
  `ShopOrnamentLayers` in `ShopInfostandBorder.tsx` (replaces `ShopNameBorder`), CSS `.shop-name-bordered` now unscoped
  (`.shop-name-ornament`, `.shop-name-ornament-overlay`). Hotel data: the 89 small images + overlays copied to
  `hCMS/public/cdn/shop/ornaments/<n>.gif` / `<n>a.gif`, `hotel-data/build_metro_ornaments.py` -> `metro-ornaments.sql`
  (150 each), loaded. `shop.ornaments.url` was written after boot, so it needs `:update_config` once. Not yet seen live.
- **`;spawn` renamed to `:spawn` (user, 2026-09-28):** the chat input only accepts `:spawn` now (`;spawn` goes out as
  normal chat), and the setting toggles only `:nospawn` etc. (no `;`). Help list, client comments, the product seed and
  the 15 live `shop_texts` rows were changed (`REPLACE(';spawn', ':spawn')`; the shop's 30s text cache picks it up). The
  rebuilt jar only differs in seed/comments, so it waits for the next restart.
- **Ornament links + border icons fixed (user: "fix ornaments links and borders icons", 2026-09-28, deployed 09:56):**
  (1) ornament images got the relative default `shop/ornaments/` because `shop.ornaments.url` was written after boot and
  the emulator's in-memory config never re-reads it. Now `ShopRepository` also loads the `shop.%` rows of
  `emulator_settings` with its 30s catalog refresh, and `ShopConfig`'s runtime values (spawn frames / borders /
  ornaments URL, spawn cooldown) read them first (`live()`), so edits apply without `:update_config`; headers/ranks still
  come from the normal config. (2) the Borders tab icon showed the small name image + overlay (= the ornament now); it
  is now a real 185x270 infostand box scaled to 0.16 with `ShopBorderFrame` drawn on it (`.shop-border-mini`).
  Verified: CDN files 200; the old tab DOM showed `borders/preview/*.gif` as icons. New icons not yet seen live.
- **":fe not working" (2026-09-28, 10:10) = not a code bug.** The dev tab had been kicked ("logged in from somewhere
  else", Phi logged in again at 10:07:46), and the live client at play.habbo.nz was still the 2026-09-26 build, which has
  no Furni Editor/shop at all. **Deployed the client with `yarn deploy` (user's choice, 10:11)**: live bundle
  `index-4dd53fe8.js` now has the Furni Editor, hcms-shop (auras/spawns/borders/ornaments), `:spawn`, the toggles, etc.
  Checked before deploying: `renderer-config.json` repo == live; `ui-config.json` only differed by the new
  `profile.url`; `src/assets` is build output. The build rewriting `dist/` crashed the running Vite dev server (a
  file-watcher error); it was restarted. Remember: until a `yarn deploy`, anything built here only exists in the dev client.
- **Shop look = our HabboPass center style (user: "get metros shop style", then "or no reuse our habbopass center style
  for that shop", then "remove the title background head, I just want one colour like the other windows, not like that
  modal").** The center/HabboPass is hCMS's web page (`/rewards`) shown in the hotel modal (`modal-client.js`,
  `hotel.css .hotel-modal-*`), outside Nitro, so the shop can't be that page (aura previews / spawns need the renderer).
  Instead `ShopView` got its own tab markup (`.shop-header-tabs > .shop-tabs > button.shop-tab(.active)`, replacing
  `NitroCardTabsView`) and a scoped block at the end of `ShopView.scss` with values copied from `rewards.css`: pill tab
  bar `rgba(18,18,22,.35)` r16, tab `#9fb2d1` 16px/600, active `#223150`/`#e7eefc`; cards `#0f192b` + 1px `#223150` r12;
  previews `linear-gradient(#2b3b5c,#18243d)`; balance pill `#17243b`/`#233358`/`#cfe0ff`; buy buttons = the green
  `.collect-rewards-pass` gradient with `#0b3d0b` text (`!important`, `.btn-primary` wins otherwise). The window frame,
  title bar and content keep the normal Nitro look (all `rgb(31,37,50)`, checked with computed styles). Fixed colours,
  not theme tokens, on purpose: the HabboPass page is always dark. **Deployed with `yarn deploy` (user: "Deploy now",
  2026-09-28): live bundle `index-c0b56fdf.js`** (contains `shop-header-tabs`; the CSS has the new rules). The dev server
  survived this build.
- **Presence (the shop renamed, 2026-09-28).** User: "change Shop to Player Customization or cooler", rejected Style
  Lab etc. ("better"), then suggested "Presence" -> `shop.title` = **Presence** (all 5 languages, DB + product seed),
  commands `:presence` / `:stylelab` / `:shop`, help section "Presence commands". The subtitle row was removed (user) and
  the tabs moved into the top row next to the balance (`.shop-top.shop-header-tabs`).
  - **Info box per tab** (user: "add the alert message and the explanation of every one, use gold"): like the website
    Center's `.center-alert` (hCMS `_center.css`: 2px border, 10px radius, icon + paragraphs). Text = `shop_texts`
    `alert.<tab>` (auras/spawns/borders/ornaments, 5 languages, DB + seed; script scratchpad `presence_alerts.py`),
    `*word*` shows in gold (`.shop-gold` #ffc93c). Icon = `shop_tabs.icon` (now sent as `tabIcons` in the shop data;
    set to hCMS center icons `/assets/img/center/navigation/icon_vip|icon_boxs|icon_banners|icon_badge|icon_market.png`).
    The tab icons need the rebuilt `hcms-shop.jar` (built 11:55, **not deployed**); the texts are live.
  - **Previews** (user: "room floor background like the catalog preview; the border preview 1:1 the avatar stand like in
    the profile; ornaments should show the user in the room with that ornament"): new `ShopRoomPreview` = the player's
    avatar in a RoomPreviewer room with floor/walls (`updateRoomWallsAndFloorVisibility(true,true)` +
    `updateObjectRoom(floor, wall, landscape)` from the current room, else 101/101/1.1 - the inventory bot preview's
    pattern) + optional aura, and an overlay that follows the avatar (`getRoomObjectScreenLocation` = feet,
    `getRoomObjectBoundingRectangle.y` = head) for things drawn on it. Used by the aura cards (`ShopAuraPreview`), the spawn
    stage (animation placed exactly like in a room: centred on the feet + the spawn's offsets) and the ornament preview
    (the real in-room name tag classes `nitro-context-menu name-only` + the ornament layers, centred above the head).
    Borders: `ShopProfileStand` = the profile's markup 1:1 (`.profile-infostand` > `.body-image` with your equipped
    player banner + avatar, then `LayoutBadgeRackView` with your badges; banner/badges asked like the profile does) with the
    border at scale 0.55; CSS = the profile's values copied under `.shop-profile-stand` (the profile rules only apply
    inside `.user-profile`, whose root forces width 488 !important). Live-checked in the headless client.
  - **Borders on the profile:** `UserProfileView` draws `ShopInfostandBorder` inside `.profile-infostand`;
    `ShopBorderFrame` got a `scale` (edge widths + box offsets), the profile uses 0.55 because the frames are made for the
    taller room infostand (at 1.0 the frame hung 80px below and 5px outside the clipped content area). Live: Phi's border
    #36 at 455-641 x 185-394 around the stand.
  - Gotcha: after a broken edit Vite kept serving an **empty module** for `ShopAuraPreview.tsx` even once the file was
    fixed ("does not provide an export named ..." on a `?t=` URL, white screen). Restarting the dev server fixed it.
- **Bubbles - waiting for the user's choice.** User: "use our bubbles, it is already limited there right". Reality: of
  our 48 `chat.styles` only 3 are locked, and only in the client (20 = rank 4, 37 = rank 5, 23 = HC); the server
  (`RoomChatMessage`, `BANNED_BUBBLES` empty, `chat_bubbles` table empty) accepts any bubble id. Selling bubbles needs a
  server check (plugin: set the bubble back to normal via reflection on `RoomChatMessage.bubble` in a `UserTalkEvent`
  listener when not owned) and a list of which bubbles become paid.
- VPN question (user): MetroHotel's client has no VPN logic; their website only builds a device fingerprint
  (`createFingerprint`, SHA-256 of browser properties -> `localStorage.metro_client_fingerprint`); the VPN decision is
  server-side. Not helping bypass it; offered to build our own VPN/proxy check.
- **Open:** tune the effects by eye, test buy/equip/room sync, the MetroHotel-style window layout (feature column + tab row) is only approximated so far, a toolbar/purse
  entry point, credits as a currency (only activity-point types now), then bubbles, spawn, boxes, lotto (Bonamigo
  provider), and a staff editor for the shop tables.

## Snowflakes, Presence balances/bubbles, feedback icons + hcms-feedback plugin (2026-09-28)

**Snowflakes (winter currency).** The name comes from Habbo's own Christmas 2025 seasonal currency ("It's Christmas"
campaign; habbo.com article 37466). Activity-point **type 103** (102 is used by 123 catalog offers, so it isn't free).
- hCMS: `CurrencyType::Snowflakes = 103`, `RewardType::SNOWFLAKES` (HabboPass levels can give it), config
  `hcms.game_rewards.login_snowflakes` (10/day) and `event_snowflakes` (5 per event won, doubled for VIP), in
  `GameEvent` login/event_won. Each credit is followed by `GameNotifier::toUser(..., refresh: true)`, because the game
  keeps balances in memory. **Verified live:** a fresh login gave the test account 10.
- Time online: the stock `GotwPointsScheduler`, settings only: `hotel.auto.gotwpoints.enabled=1`, `.name=snowflake`,
  `seasonal.currency.snowflake=103`, `permissions.auto_gotw_amount=2` for every rank (every 10 minutes, in a room, not
  idle). Backups: `bak_20260928_gotw_settings`, `bak_20260928_gotw_perms`.
- Icons (our own pixel art): `cdn/images/wallet/103.png` (15px) and `/assets/img/center/money/money_snowflakes_25.png`.
- Purse: credits removed; `system.currency.types` = [5, 101, 103] (Diamonds, Emeralds, Snowflakes), and every
  configured type shows, with 0 when the player has no row. Per the user, amounts use font-weight 400 (reference: 700,
  changed in `holo/_47-nitro-purse.scss` with a note).
- Not done yet: a Snowflakes catalog page (spending), and Presence items priced in Snowflakes.

**Presence** (hcms-shop):
- The header shows the purse currencies as a row of pills with live amounts from `usePurse`.
  - Types come from the server's `balanceTypes` (setting `shop.balance.types` = "5;101;103"), else from
    `system.currency.types`.
- Preview rooms are always floor 307 + wall 307 (white), not the player's room.
- Borders tab:
  - the stand is scaled down to fit its box (never up), in a 280px column;
  - `ShopBorderFrame` gains `outset` (the stand's 4px border) and `centered` (splits the horizontal box overhang evenly,
    because the offsets -20/0 are made for the room infostand's left column);
  - both are used on the profile and in the preview.
- Ornament tag: anchored at 28% of the way from the bounding-box top to the feet (the box is taller than the visible
  avatar).
- **Bubbles**, all built but **not deployed**:
  - schema v6, table `shop_bubbles` (bubble_id = chat.styles id), `data/Bubble`;
  - `ShopBubbleGuard` on `UserTalkEvent` resets an unowned premium bubble to NORMAL (reflection on
    `RoomChatMessage.bubble`; staff at `shop.admin.rank` are exempt; owned ids cached per player);
  - `sendUser` for yourself adds `premiumBubbles` / `ownedBubbles`, and is sent again after a bubble purchase;
  - client: `api/shop/ShopBubbles.ts` store, `ShopBubbleSync` (mounted in MainView, asks once after login), the chat
    style picker hides unowned premium bubbles, and `ShopBubblesView` renders each bubble with the real
    `.chat-bubble bubble-N` markup;
  - hotel data `hcms-shop/hotel-data/hcms-bubbles.sql`: 15 illustrated bubbles at 100 Emeralds (53, 54, 55, 58, 59,
    16, 17, 19, 21, 22, 24, 10, 56, 57, 52). My proposal, not yet confirmed by the user.
- **Bug found:** the emulator only registers bubble ids 0-49, so bubbles 50-59 fell back to normal for everyone. Fixed
  as data: `chat_bubbles` rows 50-59 (loaded at boot or with `:update_chat_bubbles`).

**Feedback icons.** 7 own 30px icons, `c_images/notifications/feedback_<kind>.png`: success, error, not_found,
no_permission, cooldown, warning, info.
- **New standalone plugin `c:/inetpub/wwwroot/hcms-feedback`** (package `com.hcms.feedback`, jar
  `target/hcms-feedback.jar`), per the user: "add to any emu and it works, no extra code in other plugins".
  - `FeedbackInterceptor` (OutgoingPacketEvent):
    - system whispers (no sender, or a self-whisper) become a bubble;
    - `generic` bubbles get the icon from their `kind` key or a text guess;
    - a map of stock error/denied/success keys gets its kind; other stock keys keep their own picture;
    - a bubble that already has an `image` is untouched.
  - Settings registered if missing: `feedback.icon.url`, `feedback.whispers`, `feedback.bubbles`.
  - Optional API `Feedback.tell`. The icons are in the jar under `icons/`.
- hcms-emulator-plugin:
  - `CommandFeedback` now only sends a plain generic bubble (optional `kind` key, optional link);
  - `StockCommandFeedback` was deleted (moved into hcms-feedback);
  - `GameOutbox` bubbles go through `CommandFeedback`.
- Client twin: `api/notification/FeedbackKind.ts` + `showFeedback(text, kind?)` in `useNotification`. Used by
  Presence results, the builder toolbar, the editing-rights toggle and the chat input usage messages. ui-config
  `feedback.icon.url`.

**Follow-up the same day.**
- **Deployed 16:55:** emulator restart with hcms-feedback, hcms-emulator-plugin, hcms-shop (migrated to v6) and
  hcms-furnieditor; the client went out with `yarn deploy` twice, the second one carrying the bubble-card/tab CSS.
- Verified live:
  - the Bubbles tab lists 15 bubbles with real samples;
  - a Buy with 0 Emeralds comes back as a server bubble with `feedback_error.png`.
- Shop results are now sent by the shop plugin as a stock generic bubble with a `kind` key, so hcms-feedback gives them
  the icon. The client no longer shows its own inline result or bubble for them; only the client-only "Use" of a bubble
  uses `showFeedback`.
- Icons:
  - Snowflakes = **Habbo's own snowflake**, cut from the "O" of `c_images/catalogue/catalog_snowflake_en.gif`;
    `wallet/103.png` is 20px, `money_snowflakes_25.png` is 25px, and my first drawing is in the scratchpad backup;
  - success feedback icon = `assets/img/rewards/icon_respect.png` (the thumbs-up, 40px);
  - `?v=2` on `currency.asset.icon.url` / `feedback.icon.url`.
- Known: hcms-feedback logs "ready" twice (its handlers are registered twice). Harmless: every handler skips packets
  that are already cancelled or replaced.
- Presence tabs are tighter (15px, 4px gap, no wrap) so 5 tabs + 3 currencies fit on one line.

- **Chat bubbles registered by the plugin instead of the table (user: "register more but with plugin").**
  - hcms-shop `room/BubbleRegistry` registers, through the stock `RoomChatMessageBubbles.addDynamicBubble`:
    - every bubble sold in `shop_bubbles`;
    - the ids in the new setting `shop.bubbles.register` (ranges and lists, e.g. `50-59` or `60,61,70-75`).
  - Ids the emulator already knows are skipped.
  - Runs at start and every 30s (daemon timer), because the stock `:update_chat_bubbles` command removes all dynamic
    bubbles.
  - Ours: `shop.bubbles.register = 50-59`. The client draws 1-59 and the emulator knows 0-49 by itself.
  - The earlier `chat_bubbles` rows 50-59 were deleted (backup `bak_20260928_chat_bubbles`).
  - Deployed 17:28 (user-approved restart); the boot log says "registered chat bubbles [50, 51, ..., 59]".

- **"All shop bubbles available for everyone" (user report) = staff exemption, not a bug.** Checked in the headless
  client as a real rank-1 account (Robin, id 1170), inside room 89: the picker shows 31 of the 48 `chat.styles`
  (0,3-7,9,11-15,18,20,25-27,29,39-51), with no premium bubble; 23/37 are rank-locked. Staff (rank >= `shop.admin.rank`
  7, e.g. Phi 8, officialrooms 8, SoonE2E6660 7) see all 48 by design (`ShopBubbleGuard.exempt`). Gotcha: a dynamic
  `import()` from CDP can load a second copy of a module under Vite HMR (a separate store/classes), so read the DOM,
  not module state.

- **Snowflakes purse icon redone crisp (user: "check good right quality icon").**
  - The purse draws each currency icon at natural size in a fixed 15x15 box (`.nitro-currency-icon`, no background
    scaling). The 20x26 resized Habbo cut was therefore cropped and blurry.
  - `wallet/103.png` is now a hand-placed 15x15 pixel snowflake in the colours sampled from Habbo's own snowflake
    (#154357 / #4c547d / #8dd5df / #e9fdfd). Script: scratchpad `snow15.py`.
  - Website `money_snowflakes_25.png` = the Habbo cut at its original 26x34 (not resized).
  - `currency.asset.icon.url` is now `?v=3`, copied straight into the live `cdn/client/ui-config.json` (it differed only
    in that line).
  - Verified in the headless client: the icon loads with `?v=3` and shows whole in the purse.

- **Feedback icons from hCMS `assets/img` (user: "yes" to swapping all).** In `cdn/c_images/notifications/feedback_*`
  and in the hcms-feedback jar's `icons/`; my drawn set is backed up in the scratchpad `icon-backup/feedback-own/`.
  - success = `rewards/icon_respect.png` (thumbs up)
  - error = back to my own red round X (user: "for error the red icon we used at first"), `?v=4`, applied live with
    `:update_config`; verified 30x30 on a real "Usage:" bubble
  - not_found = `forum/icon_myticket.png` (magnifier)
  - no_permission = `forum/icon_closed.png` (padlock)
  - cooldown = `gamers/icon_time.png` (stopwatch)
  - warning = `32_warn.png` (orange !)
  - info = `32_warn_blue.png` (blue !)
  - All are <= 41px, and the bubble's image box is 50x50 (`_46-holo-components.scss`).
  - `feedback.icon.url` is now `?v=3` in `emulator_settings` (applied live with `:update_config` from the rank-7 test
    account), in the plugin default, and in both client ui-configs.
  - Verified live: ":ss" -> error, ":spawn" with none -> not_found, "Configuration reloaded!" -> info.
  - "reloaded" was added to the success words (plugin + client `FeedbackKind.ts`). hcms-feedback jar built 18:03, **not
    deployed** (next restart).

- **Mention / group mention / system (Frank) feedback kinds (user, 2026-09-28).** Icons from hCMS
  `assets/img/settings`:
  - mention = `icon_email.png` (blue @);
  - mention_group = `icon_arobase.png` (brown @);
  - no_permission = `icon_pin.png` (padlock, replaces `forum/icon_closed`);
  - system = `icon_version.png` (Frank; the user's pick).
- Rules: text with "mention sent to" -> mention_group, any other "mention" -> mention. Both come after the
  cooldown/error checks, so "Please wait ... mentioning" stays cooldown and "You cannot mention yourself" stays error.
  SYSTEM is only set explicitly: `GameOutbox` (website -> game messages: daily login, badge added, presents...) sends
  kind SYSTEM.
- hcms-feedback prefixes SYSTEM text with `<b>Frank said:</b>` (setting `feedback.system.prefix`; bubble text is HTML).
  Icons `?v=5`. Client `FeedbackKind.ts` has the same kinds.
- Deployed 18:18 (restart + `yarn deploy`). Verified live in the headless client (SoonE2E6660, room 89):
  - outbox row -> "Frank said: Daily login: +10 Snowflakes!" with `feedback_system.png`;
  - "@Robin hello" -> "Robin is offline ..." with `feedback_mention.png`;
  - "@staff test" -> "Mention sent to 1 player." with `feedback_mention_group.png`.
- Still plain: the room-entry notice "Discussions in Habbo rooms may be monitored..." (a stock bubble key with no image).

**Was built before that deploy:**
- jars: hcms-feedback.jar (new), hcms-emulator-plugin.jar, hcms-shop.jar (v6), hcms-furnieditor.jar (11:46 build);
- client: everything above.

## Furni Editor: more learned words, suggestions for "?" words, icon checks (2026-09-28)

- **More words from Hab-Track** (user: "add more words of custom furni as translation from the habtrack in all languages").
  `C:/tools/stock_retro/build-furni-words.py` gained a **co-occurrence stage** after the strict alignment:
  - Per classname, all English names' words are pooled. For each foreign name, words already explained on both sides
    are removed, and each remaining foreign word counts the remaining English words next to it.
  - A pair is **learned** when it has >= 3 names, >= 60% agree, it beats the runner-up 1.5x, **and** the foreign word
    is among the English word's 12 strongest partners (two-way check).
  - The English word must be real: >= 8 English furni names, >= 3 letters, not in `JUNK` (name, desc, ltd, cf, bbb,
    hotel, habbo, pokeweebz, bonusrare, livefurni...). Foreign words need >= 4 letters. "Sink" targets (> 40 foreign
    words through co-occurrence) are dropped.
  - Result: `furni-words.json` 7,328 -> **9,189** words; coverage of the index's foreign word occurrences 54.9% ->
    **57.3%**. A random sample is ~80% right (the strict part ~85%).
  - Looser rules reached 62% with a sample much less often right (words -> "name", "pokeweebzs", "st"); that was rejected.
  - Backups: `build-furni-words.py.bak-20260928b`, `furni-words.json.bak-20260928b`; `measure-words.py` prints coverage.
- **Suggestions** (user: "when word is with ? add english word suggestion or auto translate it"):
  - The weaker pairs (>= 25% agree) go to `hCMS/public/cdn/furni-editor/furni-word-suggestions.json` (29,678 words,
    1.4MB, `{word: [[english, share, names], ...]}`), covering another 15.6%.
  - It is served from the CDN (CORS `*`) and **not bundled**: ui-config `furni-editor.suggestions.url` (`?v=2`; bump it
    whenever the file is rebuilt, since the CDN caches for 7 days). `FurniNames.LoadWordSuggestions` loads it once, when
    the editor opens.
  - `FurniNames.ts` now has `lookupKnown` (dictionary only; used by `UnknownWords`, `WordHints` and compound splitting)
    and `lookup` (plus a suggestion fallback).
  - Translate/name suggestions use a suggestion by themselves only when >= 2 names, >= 50% agree and it clearly leads
    (4,742 of them).
  - "?" chips show `word ? → suggestion` (tooltip: names + % agree); click fills the word form with it.
  - Verified in the dev client (the app's own module instance, see the gotcha below):
    - "Bombo Rosso" -> "Red Drum";
    - "Vinas" (a tie between elf and santa) stays a "?" word with the suggestion "Elf".
  - **Gotcha:** the dev server stamps imports of hot-reloaded modules with `?t=`, so a plain `import()` from CDP gets a
    second copy. Take the URL from the served importer (`fetch('/src/.../FurniEditorView.tsx')`). Also, Nitro fills the
    browser's resource-timing buffer, so a fetch may not show in `performance.getEntries`.
- **Asset data icon checks** (user: "for asset data also check page id icon"): `FurniEditorIconChecks.tsx` loads, for
  real:
  - the furni icon (`furni.asset.icon.url`, %libname% = classname before `*`, %param% = `_<colour>`);
  - every "Sold on" page's icon (page id -> catalog tree node -> `iconId` -> `catalog.asset.icon.url`).
  - Each row shows ✓, "✗ missing" (warning yellow) or "not in your catalog tree". Live: rare_dragonlamp*3 -> "✓ furni
    icon", "✓ page icon 9993838: Dragons (page #9967765)".
- **Short words, link words, "and" (user: "need also like Luz, Á, de, etc").** The learner skips words under 4 letters,
  so these are hand-made entries in `FurniNames.ts`, each checked against the index with `C:/tools/stock_retro/
  shortwords.py` (for names containing a word: which English words the same furni has, per language).
  - Added:
    - Light: luz/lumiere/luce; Lights: luzes/lumieres/luci/lichter
    - Sea: mar/mer/mare/zee/meer
    - Christmas (adj): natal/noel/natale/navidad/kerst
    - Eye: ojo/olho/oeil/auge/oog/goz
    - Wine: vin/vino/vinho/wein/wijn/sarap
    - Hand: mano/mao
    - also sole = Sun, kral = King, ev = House, pane = Bread, goud = Gold
  - Data facts: **"sol" = floor** in fr/es/de names (fr 67%), so it stays Floor; pt "guarda-sol" = parasol.
    "de pie" / "de pé" = standing (lamp) -> PHRASES turn it into "standing" (adj Standing).
  - Left out (data too mixed): ay, beira, no (es "no" = not), el, and "main" (English word too).
  - LINKS (X link Y -> Y X) gained a/au/aux/ao/aos/al/alla/alle/ai/zum/zur (plain() folds à/á to a): "Machine à café"
    -> Coffee Machine, "Mesa á Luz" -> Light Table.
  - AND_WORDS y/e/et/und/ve/och/ja: each side is translated on its own and joined with "and" ("Sol y Luna" -> Floor and
    Moon).
  - Verified in the dev client on 18 names. Still unknown there: Beira, Candeeiro, Boule. Known quirk: `UnknownWords`
    also lists plain English words the dictionary lacks ("Machine").

- **Per-language words + word order (user: "nl translations ... then spanish, portuguese brazil, turkish, german";
  "right orders auto detecting: dried grass comes out grass dried").**
  - Builder per-language stage: each language is counted on its own. A word is learned when >= 5 of its names in one
    language agree on the same real English word, with any of these:
    - >= 50% agree and it has 1.5x the runner-up;
    - >= 80% agree and it is the top candidate;
    - >= 20 names, >= 30% agree and 2x the runner-up.
  - English synonyms count as one word (`SAME_PAIRS`: plush/plushie, bush/shrub, colorful/colourful,
    tradeable/tradable, christmas/xmas, ...).
  - Learned 1,749 (de 403, es 289, fr 281, pt 241, nl 206, tr 171, it 158) -> `furni-words.json` 10,925 words.
  - Hand entries for frequent words the data supports but the rules miss (Counter, Barrier, Coffee, Floral, Divider,
    Giant, Cherry Tree, Sign, Lime, Pot, Furniture, Painting, Display, Rustic, Snake, Ceiling, Long, Valentine,
    Colorful, Tradeable, Not, Circus, Dried = seca/seco/secca/kuru). Left out: mobilier, safira, gekleurde, symbool (the
    data doesn't show the meaning).
  - Coverage per language (`measure-lang.py`): nl 57.9% -> 64.4%, es 55.0 -> 63.0, pt 66.2 -> 74.2, tr 64.5 -> 70.8,
    de 44.8 -> 53.6, fr 51.6 -> 63.6, it 66.9 -> 72.5.
  - Word order: `furni-english-adjectives.json` (2,254 words, 22KB, bundled). These are English words that come before
    another word in >= 85% of >= 6 English names, or always in >= 3 (golden, wooden, christmas, ice, dried...; lamp,
    table, chair, grass stay nouns).
  - `englishKind()` in FurniNames.ts gives the role for learned words, suggestions and unknown English words (plus the
    endings -ed/-ful/-ous/-less/-ive), so they go first.
  - Verified: "Grass Dried" / "Hierba Seca" -> Dried Grass, "Trono Dorado" -> Gold Throne, "Tahta Masa" -> Wooden Table,
    "Mesa Rústica Uzun" -> Rustic Long Table, "Mueble de Cocina" -> Kitchen Furniture, "Niet ruilbaar" -> Not Tradeable.
  - Not handled: Romance noun+noun without a link ("Bancone Caffè" -> Counter Coffee), since the language of a single
    name isn't known.
  - Backup `build-furni-words.py.bak-20260928c`. Deployed with the client at 20:05.
- **Editor layout (user: the review is hard to compare, the editor is too big for the room).**
  - The review is no longer its own 860x560 window. It is a 320px panel docked in the editor in place of the catalog
    column (`FurniEditorReviewView` rewritten). It shows compact field old -> new rows, the open furni highlighted and
    scrolled into view, "only to check" / "only unsure" filters, "Next to check", Accept all / Revert all, and ✓ / ↩ per
    row.
  - Deciding on the open furni opens the next one still to check (`openNextToCheck`; after a revert it waits for the
    saves).
  - Header buttons (`NitroCardHeaderView.buttonList`): Compact (780x620, no catalog tabs/column, the two field columns
    stacked in one scrolling column) and Minimize (340px, title bar only, showing "#id classname"). Both are remembered
    in localStorage `furni-editor.compact/minimized`.
  - Verified live: 1120x670 -> 780x620 (no catalog column, fields column) -> 340x46 -> back to 780x620. The docked
    review was not seen live (it needs a real Auto run, which saves furni).

- **Feedback settings + where feedback comes from (user: "full settings which for which, check where it gives
  feedback, also all of furnieditor").**
  - hcms-feedback `FeedbackRules` + `FeedbackDefaults`. On first start it creates and fills (never overwrites):
    - `feedback_kinds` (kind PK, label, enabled, icon URL override, prefix, sort; system = "Frank said:");
    - `feedback_rules` (match_type contains/starts/regex/key, pattern, kind, priority, enabled, note; 81 built-in rules:
      the old word lists + the stock bubble keys).
  - Read every 30s; the first enabled rule by priority wins, else info. A disabled kind = the plain bubble, no icon or
    prefix. If the tables can't be read, the built-in rules are used.
  - hCMS: `App\Domain\Feedback\Models\{FeedbackRule,FeedbackKind}` and Filament Administration > **Feedback rules**
    (filters, "Test a message" = which rule and kind a text gets, the same logic as the plugin) and **Feedback kinds**
    (icon preview, inline edit).
  - Deployed 20:04 (restart). Verified:
    - tables filled (81/10);
    - both pages render (Livewire::test as user 1);
    - the matcher: Usage -> error, not online -> not_found, Banner deleted -> success, Please wait -> cooldown,
      Mention sent to -> mention_group;
    - live `:ss` -> feedback_error, `:spawn` -> feedback_not_found.
  - Where feedback comes from:
    - server, all through these rules: hCMS commands (`CommandFeedback`: `:ss`, `:eha`, mentions, room settings, profile
      moderation, follow, `:faceless`...);
    - website -> game outbox (kind system = Frank);
    - hcms-shop results (the shop names the kind);
    - stock whispers (`:ban`, `:mute`...);
    - stock bubble keys.
  - Client-side, through the built-in rules in `FeedbackKind.ts`, NOT the DB rules:
    - the Furni Editor (new, below);
    - Presence "Use bubble";
    - the builder toolbar;
    - the editing-rights toggle;
    - chat `@name` usage.
- **Furni Editor feedback bubbles:** save (success; "no changes" = info; a failed save is an error bubble instead of the
  old popup), download from other hotels, test furni in the room, word saved/removed, one summary when Auto run stops,
  and bulk rename finished. Quiet during Auto run (only the summary) and for review reverts (the panel shows those).
  Prefix "Furni Editor:".
- Client deployed 20:05: `index-45054f8a.js` (editor layout/review, feedback, words, word order). `tsc` 69.

- **Catalog page icons from HabboCity (user: "swf.habbocity.fr/c_images/catalogue/ catalog page icon link list").**
  - 129 of the 1,088 `catalog_pages.icon_image` ids had no `c_images/catalogue/icon_<id>.png` on our CDN.
  - New `c:/tools/nitro-catalog-copy/scripts/hc-page-icons.js` (a copy of hc-icons.js) fetches
    `https://swf.habbocity.fr/c_images/catalogue/icon_<id>.png` with `Network.loadNetworkResource` on the user's open
    habbocity.fr/hotel tab (its own browser request; no Cloudflare workaround). It keeps PNG or GIF data only.
  - Result: **129/129 saved** (445278 is GIF data under .png). New files, so no cache bump. Log `hc-page-icons.log`.
- **Pixel check for walk / sit / lay / none (user: "scan many working old chair furni, check similarities, a script that
  checks per pixel") - IN PROGRESS.**
  - `scanSurface` (FurniEditorPreview.tsx) now also records `features` (in `LastScanDetail` / `window.__furniEditorScan`),
    all in tile units:
    - top outline + fill (floor to top), each in 16 slices across the footprint;
    - floorCover (share of the floor diamond covered);
    - legsGap (empty share of the zone just above the floor);
    - flatTop and low (shares of the width);
    - backRest (max - seat), surface / max / seat / sitSeat, footprintW, imageH.
  - Live: a rug is top 0 / floorCover .88 / low 1; bed_silo_one is top ~.88 flat / footprint 4.
  - Truth: scratchpad `pose_truth.py` joins hcms / hubblycata / habboworld / ltdhabbo in Python (the SQL join is far too
    slow without indexes; the reference DBs have non-UTF-8 names -> `errors='replace'`). All four agree on 16,000
    of 34,427 floor furni (none 12,000, walk 2,047, sit 1,647, lay 212). Sample: 500 (130 none/sit/walk, 110 lay, <= 3
    per name family) -> `pose-truth.json`.
  - `pose-run.js` (from bench-run.js) opens each one in the headless editor -> `pose-results.json` (~8 per minute).
  - `pose_train.py`: plain Python kNN on standardised features (the 16-slice features weigh 0.35, the summaries 1.0),
    leave-one-out score, a confusion table, accuracy per confidence level; `--write` saves `pose-model.json`
    (prototypes). The comparison baseline is the current name rule (`SuggestFlags`), i.e. what a custom furni without
    reference rows gets today.

- `tsc` still 69, none in `furni-editor/`. **Deployed** with `yarn deploy` (user: "yes"): live bundle `index-74356650.js`
  contains the suggestions loader, and the live ui-config has `furni-editor.suggestions.url`.

## Furni Editor: multiheight rule, wall items, sit height rule; Room Settings feedback (2026-09-28, late)

- **Multiheight** (user: "check classic multiheight furni"): all 8 editor saves that set multiheight were wrong (the
  reference hotels have them as default); 4 had been reverted, the last 4 (Habblet_loveadv_17/_21,
  Bellarose_Chase_janela, Hellsinore_Sierra_35) were reverted now through RCON `furnieditorrevert` (audit entries
  5109/5113/5115/5180; backup `bak_20260928_mh_revert`). The 169 multiheight furni all three reference DBs agree on
  (platforms, podiums, stages, eleblocks) climb step by step (0;0.5;1;1.5;2). New `IsMultiheight`: >= 3 states,
  >= 3 distinct levels, every step up >= 0.25, one final drop allowed. Plus a reference guard: the detail reply now
  ends with each reference's `interaction_type` + `multiheight` (plugin `FurniEditorDetailEvent`, parser reads it only
  if `bytesAvailable`); if the references have the furni and none is multiheight, nothing is suggested; if they agree it
  is, their heights are suggested. Applies to the Size box button and Auto run.
- **Wall items** (`type 'i'`): their width/length mean nothing (0x0, 1x0, 2x0... in every DB), so the ruler/footprint
  overlay is hidden (`FurniEditorPreview` prop `wall`), no size scan, no asset/scan size suggestions (a note says why),
  and Auto run only checks modes for them.
- **Sit height** (user: "scans 0.2 then 0.9, on many it was 1.2"): the first value shown is the surface (before the pose
  is known), then seat top + 0.7. The 124 chairs pose-run.js scanned in Chrome (`pose-results.json`) vs our DB and the
  agreeing references (scratchpad `height_check.py` / `height_rules.py`) showed low seat scans (0.1-0.4) are often the
  front of the base, not the cushion, and most classic seats are stored at 1.0 whatever their pixels. New
  `SitHeight(seat)` = 1.0 unless seat top >= 0.5, then seat top + 0.6 rounded to 0.1: within 0.2 on 84% (91% vs
  references), exact 48% (63%); the old rule was 68% / 11%. Beds (lay + 0.8) unchanged: no lay furni scanned yet.
- **Room Settings feedback** (user: "when tick untick on settings allow enable etc"): `RoomSettingsSaveEvent` (plugin)
  now sends a bubble per changed switch ("The :enable command is now allowed/blocked in this room.", success/warning
  kind) and for the walking mode. Roller speed has no bubble (typing would spam).
- **Deployed 21:40** (user-approved restart; boot log "Furni Editor: protocol registered (9569-9588)",
  "RoomSettingsProtocol registered") and client `yarn deploy` (live bundle `index-6ec9e700.js`). pose-run.js was
  stopped at 368/500 for the restart (the results so far are in `pose-results.json`; no lay furni scanned yet).

## Admin currency instant + Mod Tools Administration + bots moved to the website (2026-09-28, late)

User: "granting currency on adminpanel not working because its not updating instant on client ... do small panel grant
currency on mod tool, revert fully the bot functions or move it to admin panel, only keep themes, do like new mod tool
Administration". Answers: bots -> **hCMS admin panel**; the in-game window is **rank 7+**.
- **Website grant now instant:** hCMS `AdjustCurrencyAction` wrote `users_currency` only, and the emulator keeps
  balances in memory, so the purse changed after a relog. It now calls `GameNotifier::toUser($target, 'You received N
  X.' | null, null, refresh: true)` (the outbox refresh re-reads users_currency and sends `UserCurrencyComposer`).
  Verified: +1 / -1 Diamond on Phi through the real action, outbox row 19 delivered within ~3s.
- **Mod Tools > Administration** (replaces the Bots button; shown only at `securityLevel >= 7`),
  `components/mod-tools/views/administration/ModToolsAdministrationView.tsx` + `ModToolsAdministrationView.scss`
  (theme tokens). Tabs: **Currency** (find a player by name -> head + online state + balances of all 6 hCMS currencies,
  pick one, amount, required reason, Grant / Remove (two-step confirm)) and **Room templates** (the old Templates tab,
  moved unchanged, still over the BotPanel protocol 9546-9550). The old `views/bots/ModToolsBotsView.tsx` is deleted.
  Protocol `api/admin/AdminCurrencyProtocol.ts` <-> plugin `admin/AdminCurrencyProtocol.java`: IN 9603 lookup(string
  username), 9604 change(string username, int type, int amount +/-, string note), OUT 9605 result(bool ok, string
  message, int userId, string username, string look, bool online, int n, then type/label/amount). Server checks rank >= 7
  and does what AdjustCurrencyAction + EconomyService do in one DB transaction: users_currency (row lock; an online
  player's in-memory balance is the starting point), `hcms_economy_transactions` row (admin.grant / admin.removal,
  context {by, note, source: game}, created_at UTC), the website notice in `hcms_notifications` (same text as
  EconomyNotices), audit `currency.granted/removed` (source game); then the new balance goes into the running game
  (`getCurrencies().put` + UserCurrencyComposer) with a success bubble for a grant. Max 10,000,000 per action.
- **Bots on the website:** new page Administration > **Bots** (`app/Filament/Pages/BotManagement.php`,
  `resources/views/filament/pages/bot-management.blade.php`, administrators only): create one / create many, per-bot
  switch on/off, builder, send to room id, leave, say, remove; mass actions on the ticked bots (none ticked = all);
  learning buttons; all behaviour settings as a form (only changed ones are sent). Every call goes over RCON
  `botpanel` (plugin `bots/BotPanelRcon.java`: {action, user_id, number, text, text2, ids}, answers the state as
  JSON); each action writes an audit row `bots.<action>`. The action switch moved from `BotPanelActionEvent` into
  `BotPanelActions.run(..., Habbo staff)` shared by the packet and RCON (staff null from the website: mass_summon and
  template_build need the game). The plugin's pom got gson (provided scope) for this.
- **Follow-up, same evening** (user: "remove all of bots from ui", "changing ornament isn't displayed to users, only
  after reload", "add in administration grant all possible to any user, banners, aura etc"):
  - Room templates tab: the "owner of the new room" bot picker is gone (always the staff member's own account); no
    bot UI is left in the game.
  - **Ornament/border change not seen by others:** `ShopService.equip` only sent the new decor to the player
    themselves; others kept their per-player cache (`useShopUserDecor`, re-asks after 30s, and an open name tag never
    re-asks). New `ShopService.sendUserToRoom(habbo)` sends it to everyone in the player's room; the client already
    updates its cache from any pushed `ShopUserEvent`.
  - **Give tab** in Mod Tools > Administration: username, kind, item, reason; Give / Take away (two-step). Kinds:
    badge (code), furni (items_base id or classname, 1-100, give only), profile banner (list from `hcms_banners`),
    avatar effect (id, given permanent = duration 0) - plugin `admin/AdminGiveProtocol.java`, IN 9607 give(string
    username, string kind, string key, int amount, boolean take, string note) / OUT 9608 result(bool, string), IN 9609
    banner list / OUT 9610 (n, id, title); audit `item.given` / `item.taken` (source game); an online player gets it
    at once (badge via `Habbo.addBadge`, furni into the inventory, banners list resent, effect via EffectsComponent).
    Aura / spawn / border / ornament / chat bubble go to the **shop plugin** (it owns `shop_user_items`): new packet
    `shop.header.in.give` 9606 (string username, string type, int itemId, boolean take), `ShopService.adminGive`
    (shop.admin.rank), logged in `shop_log` as give / take (staff id in the price column); taking an equipped item takes
    it off; an online player gets a bubble and fresh shop data. The item lists come from the shop's normal data reply.
- **Deployed 22:17** (user-approved restart; boot: AdminCurrencyProtocol 9603-9605, AdminGiveProtocol 9607-9610,
  shop packets incl. 9606) + client `yarn deploy` (live `index-49dffc5b.js`). Website Bots page verified against the
  live emulator with `Livewire::test` (11 bots, bots switched off). Not yet tested live: the in-game Currency and
  Give tabs, the ornament broadcast.
- **Shop bubbles check** (user: "wrong bubbles in the shop, some we can't see even as admin"): all 15 sold bubbles
  (10, 16, 17, 19, 21, 22, 24, 52-59) render in the Presence Bubbles tab and in the chat style picker (headless rank-7
  client, screenshots), all have CSS (images are data URIs, nothing can 404), all are in `chat.styles`, and all are
  known to the emulator (core enum 0-49 + BubbleRegistry 50-59). `commands.cmd_chatcolor.banned_numbers` = 23;33;34
  (staff, Frank, wired; staff bypass with acc_anychatcolor) - none sold. Nothing found broken; asked the user which
  bubble exactly. Ownership changes are live (buy / staff give -> ShopBubbleGuard.forget + sendUser -> picker).
- Give tab, taking an effect from an online player now also sends `EffectsListRemoveComposer` (was: gone only after
  a relog; user rule: everything must work without logging out). Plugin rebuilt 22:28, **not deployed**.

## Instant grants from the website AND the game, full player refresh (2026-09-28, late)

User: "grant from client and homepage should both work instant, some need a logout (banners etc), do it in the
emulator plugin"; then "Mod Tools Administration should also be instant".
- **Why the website was slow or lost grants:** it writes the DB, the emulator keeps each online player in memory. The
  old outbox refresh (every 3s) only added furni/badges and re-read currency; banners, rank, effects, shop items and
  removals (market, transfers, speed-sell) waited for a relog. And any in-game balance change in those 3s ran
  `HabboInfo.run()`, which saves ALL in-memory balances over the website's grant.
- **Plugin (`hcms-emulator-plugin`, jar 22:41, NOT deployed yet):** new `sync/PlayerRefresh.refresh(habbo)` = furni
  added AND removed (only when the DB says the item isn't this player's any more), badges added and removed (+ worn
  badges resent to the room), activity points + credits from the DB, profile banners (BannerDataComposer), rank from
  `users.rank` (+ UserPermissionsComposer), the VIP rank sync (`PlayerRefresh.vipSync` = the plugin's
  VipRankSynchronizer), avatar effects added/removed, and the hCMS Shop (forget bubble cache, resend decor + shop data;
  called by reflection through the shop plugin's own class loader). `GameOutbox.refresh` now calls it. New RCON
  **`hcmsrefresh`** (`sync/RefreshRcon`: {user_ids, message, link_url, refresh} -> {"online":[..],"offline":[..]}),
  runs the refresh + Frank bubble at once for online players.
- **hCMS:** `GameNotifier::toUsers` now waits for the transaction to commit, calls RCON `hcmsrefresh` first, and only
  queues outbox rows for players reported offline (and only when there is a message: an offline player loads everything
  at login). RCON unreachable -> the old outbox path. New `GameNotifier::refresh(...$ids)`. Refresh calls added to:
  EconomyService (every currency change), RewardType::grant (HabboPass/quest/box rewards), CreateAuction, auction
  settlement, BuyBanner, Bonamigo, market place/buy/remove (badges + rares), SpeedSellRare, TransferBadge (both
  players), ChangeUserRank (notice text now "applies straight away"). Script: scratchpad `add_refresh.py`. Not covered:
  room transfers/market rooms (a loaded room keeps its old owner in memory).
- **In-game Mod Tools > Administration** was already instant (it changes memory + DB together); the effect-take fix
  (EffectsListRemoveComposer) is in the same jar.
- **Bots "not working" (user):** not a restart issue - the master switch `hcms.bots.enabled` was 0, so no bot was online
  and "send to room" did nothing. The website Bots page now shows a warning + "Turn bots on" / "Turn bots off"
  (`BotManagement::setOnline`). Log noise: missing config keys `hcms.bots.accept_requests` etc. (defaults used).

## Feedback icons: one of its own per kind (2026-09-28, late)

User: "the thumbs up I don't like, check hCMS/public/assets/img, suggest icons for everything, I want their own, not
one". All 366 small (12-64px) images there were put on contact sheets (scratchpad `icon_sheet.py`, `icons_*.png`,
`icons_index.txt`) and three per kind offered; the user picked:
success = `header/v2/icon_ranking.png` (trophy), error = **a red copy of `32_warn.png`** (user: "same ! but in red";
hue shift of the orange only), not_found = `chat/icon_search.png`, no_permission = `forum/icon_closed.png`,
cooldown = `center/rares/soon.png` (hourglass), warning = `32_warn.png` (kept), info = `header/icon_info.png` (blue ?),
mention = `settings/icon_email.png` (kept), mention_group = `header/navig_community.png` (group), system =
`settings/icon_version.png` (Frank, kept). Files: `cdn/c_images/notifications/feedback_<kind>.png` + hcms-feedback
`icons/`; old set backed up in scratchpad `icon-backup/feedback-v5/`. `feedback.icon.url` now `?v=6` (emulator_settings,
applied with `:update_config`; both ui-configs; plugin default). Verified live: `:ss` bubble loads the red "!" v6.
hcms-feedback jar rebuilt, not deployed (only its built-in copies/default differ; the live icons come from the CDN).

## Currency names fixed + FULL ECONOMY RESET (2026-09-28, 23:20)

- **Currency names** (user: "emeralds says snowflakes, emeralds show game points, too many currencies showing
  nothing"): `:userinfo` names balances from `emulator_texts seasonal.name.<type>`, which were stock (101 = Snowflakes,
  104 = Clouds, 0 = Pixels, nothing for 5/12/103). Now 0 Duckets, 5 Diamonds, 12 HabboCash, 101 Emeralds, 103
  Snowflakes, 104 NFT Points (backup `bak_20260928_seasonal_names`). hCMS `CurrencyType::GamePoints` label -> "Emeralds".
  Plugin `AdminCurrencyProtocol` label fixed; `PurseCurrencyColors` gained 103 Snowflake (#9FE6FF) so its gain bubbles
  say Snowflakes, not "points". ExternalTexts (backup `ExternalTexts.json.pre-currencynames-*.bak`): not-enough / price /
  notification / achievement texts for 5/101/103 (were Seashells/Stars/missing); `?v=20260928b` in both
  renderer-configs. Mod Tools > Administration > Currency now lists only `system.currency.types` (Diamonds, Emeralds,
  Snowflakes), each with its `LayoutCurrencyIcon`. Success feedback icon = blue ! (`32_warn_blue.png`), `?v=7`.
- **Economy reset** (user: "reset whole economy, keep Phi's rooms and items, keep Phi, officialrooms and Khalil, give all
  Phi's rooms to officialrooms, clean start"; answers: delete all other accounts incl. bots/test accounts, start clean,
  clear all history, "whole economy values should have no entries", "ids start from 1 2 3"; then "do it now").
  - Full backup first: `c:/inetpub/wwwroot/db-backups/hcms-before-economy-reset-20260928-2314.sql` (71MB mysqldump).
  - Script `db-backups/economy_reset.py` -> `economy_reset.sql` (run with the emulator stopped): 101 tables TRUNCATEd
    (all logs/history, ledger, market, auctions, value entries, wealth, notifications, HabboPass/quest progress,
    friendships, inventories, currencies, shop items, badges, LTD numbers, bots...); only Phi's 12 rooms kept, now owned
    by officialrooms with their 5,241 furni (LTD data cleared, `catalog_items.limited_sells` = 0); users = **1 Phi,
    2 officialrooms, 3 Khalil** (74 -> 2, 217 -> 3 in every user-id column), AUTO_INCREMENT 4; credits 0, stats reset,
    only the ADM staff badge kept. Config kept (catalog, items_base, settings, value categories/settings, rare pages,
    shop catalogue, feedback rules). Audit log holds one `economy.reset` row.
  - Emulator restarted with the rebuilt plugins (currency names, feedback v7); client deployed `index-a397fdf2.js`
    (no bot UI strings left). Test account SoonE2E6660 no longer exists (headless tests need a new account).
- Open: a JS "retro economy scanner" (user asked: scan any retro's site + minified JS to understand its economy), and
  "make everything work seamlessly together" after the reset.

## Feedback styling, one voice for all texts, :noornaments, Furni Editor team work, sodaho floor editor (2026-09-28/29, night)

- **Emeralds capitalised** in the shop (`shop_texts currency.name`, 5 languages; seed fixed). Gotcha: text with accents
  sent through the bash shell to mysql gets mangled (É stored as E2 95 94); write such SQL from a Python file.
- **Feedback styling** (user chose all four): hcms-feedback `FeedbackStyle` + table `feedback_styles` (seeded once:
  Diamonds/Emeralds/Snowflakes/Credits/HabboCash in their colour + wallet icon, :commands gold, "quoted" bold, Habbo
  names bold in `permissions.staff_color` of their rank, numbers bold; setting `feedback.styles`). Applied in
  `Feedback.message()` to the plain text only (tags untouched). Deployed 23:49. Not yet seen live (Phi was offline).
  Admin page **Administration > Feedback colours** (`FeedbackStyleResource`, model `FeedbackStyle` with a preview in
  the table; inline colour/bold/priority/enabled; create/edit/delete), render-tested. Client-made bubbles
  (Furni Editor, Presence "Use", chat usage hints) are NOT styled - only server bubbles pass through hcms-feedback.
- **One voice** (user: short & friendly, "Habbo" for a person, all four scopes): 493 `emulator_texts` rewritten
  (scratchpad `texts_voice.py`; check = no new placeholder; backup `bak_20260928_emulator_texts_voice`), incl. all 135
  command descriptions as ":cmd <args> - what it does" (the give-rank error appends the description). Fixed the stock
  `cmd_summon.not_found` "%%" bug and the offensive pirate parrot line. Live since the 23:49 restart.
  **Plugins + website done 2026-09-29 00:10:** scratchpad `plugin_voice.py` (exact replacements in hcms-emulator-plugin
  and hcms-shop, 11 files: "Type a Habbo name.", "No Habbo called X here.", "You can't ...", player -> Habbo, ...) and
  `hcms_voice.py` (GameEvent daily login / event won, badge pack, feed badge). Deployed with a restart at 00:10.
  The Furni Editor's own messages were left as they are (staff tool).
- **:noornaments** (+ :noornament): shop setting `hide_ornaments`; `ShopService.sendUser` drops other Habbos'
  ornaments for that viewer; toggling resends everyone in the room's decor. `sendUser` for yourself now includes
  `settings` (hide_auras/hide_ornaments/hide_spawns/no_entry_spawn); client store `api/shop/ShopSettings.ts`
  (`useShopSettings`), filled by `ShopBubbleSync`. **Settings > General** has "Hide other Habbos' auras / ornaments"
  (same server setting as the commands). Texts msg.ornaments_hidden/shown (5 languages, DB + seed). Help list entry.
  Deployed 23:49.
- **Furni Editor team work** (user: remember last work, see who worked on what, flag done furni): plugin
  `FurniEditorWork` + table `hcms_furni_editor_work` (last page/furni per staff member, written on page/furni open),
  IN 9611 / OUT 9612 activity (my last work, 40 recent edits from the audit log with fields, pages worked on with
  edited/total and last editor, staff in the editor in the last 15 min); page-items reply gained per-furni last
  editor + "others on this page". Client: **Team** tab (Continue button, in the editor now, pages worked on -> open
  page, recent edits -> open furni), page list shows "✓ name, 2 h ago" / "to do" and "X of Y already done", a yellow
  warning when someone else is on the same page. Deployed 2026-09-29 00:04 (plugin + client `index-8502cede.js`).
  Note: the economy reset emptied the audit log, so edit history starts from 2026-09-28 23:20.
- **sodaho.tel floor editor** (user: "their flooreditor is also changed, do 1:1"): main bundle still
  `index-fHHCTbJu.js` (unchanged, no lazy chunks). Their floor editor is a full live in-room editor: body class
  `floorplan-edit-mode`, draggable `.floorplan-live-panel` (--mini / --max, header with area "total (walkable)",
  options, main, footer Cancel/Save, overlay "Drag to move, click to maximize"), `.floorplan-edit-toolbar` with
  `.fpe-btn-group` tools (e.g. "Set door" icon-set-door), `applyToArea(...)`, separate `.floorplan-import-export`
  window. Saved: `c:/tools/nitro-catalog-copy/scripts/out/soda/index-fHHCTbJu.js` (full), `floor-editor-region.js`
  (chars 3.20M-3.26M), their CSS `src/assets/index-nNGwChFU.css` -> `floor-editor.css` (extraction running). Port
  not started.

## Furni Editor: size = asset size, stack tiles first, review ticks (2026-09-29)

User: "scan says wrong width length, check first with stack tile furni then with the user for lay/sit, do it right";
"on review should just untick before accept".
- **Measured, not guessed:** 100 floor furni whose width/length ours, hubblycata, habboworld and ltdhabbo all agree on
  (60 multi-tile, 40 single; scratchpad `size_truth.py` -> `size-truth.json`, runner `size-run.js` in the headless
  Chrome 9223 logged in as `officialrooms`, results `size-results.json`, debug hook `window.__furniEditorSizeScan`).
  **The asset size (.nitro logic dimensions) was right 100/100, the pixel floor-contact scan 91/100.** The scan
  undercounts art drawn against the back (shelves, wall pieces: 1 instead of 2-3) and overcounts art hanging over its
  tiles (limo, track corner).
- So: the asset size is the answer. The Size box only shows "Pixel scan saw WxL - the asset size counts" as a muted note
  when they differ; the "use it" button only appears for furni with no asset size ("No asset size - scanned ..."). Auto run
  no longer flags "scan says" as unsure.
- Pose auto test order is now **Stack (stack tiles over the width x length footprint) -> Walk -> Sit -> Lay**, and the
  stack step always runs first even when only one pose is ticked. Verified live on `glass_sofa*5`: Stack, then Sit (found).
- Review panel: each pending row has a tick (all ticked by default, "tick all" box); the buttons are
  "Accept ticked (n)" / "Revert ticked (n)"; per-row ✓ / ↩ stay.
- Client only, `tsc` 69 (none in furni-editor). **Deployed 2026-09-29** (`yarn deploy`, live bundle `index-3ed96bc5.js`).

## sodaho floor editor + builder toolbar: investigation (2026-09-29, nothing built yet)

Sources (read-only): `c:/tools/nitro-catalog-copy/scripts/out/soda/` - `index-fHHCTbJu.js` (+ `soda.pretty.js`),
`floor-editor.pretty.js` (its builder + floor editor region), `floor-editor.css` (every `floorplan`/`fpe-` rule from
`https://sodaho.tel/src/assets/index-nNGwChFU.css`), `soda-vendor.js` (`/assets/vendor-C4ZI-37Y.js`, for icon ids).
Icon map script: scratchpad `iconmap.js <exportId...>` (vendor export -> react-icons name by SVG path).

**Floor editor** (their `Dlt`): a live in-room editor, not a window. Body class `floorplan-edit-mode` hides the
toolbar (except the chat input), purse, room tools. Left vertical `.floorplan-edit-toolbar`: tools set/unset/up/down/
door (`icon-set-tile` etc.), select area (`FaVectorSquare`), height chip -> height palette flyout, pan (`FaArrowsAlt`),
zoom (`FaSearchPlus/Minus`, x2 / /2 between 0.5 and 2), settings flyout (door direction, wall/floor thickness, wall
height with `FaCaretLeft/Right`), undo/redo (`FaUndo/FaRedo`, 20 steps), reload (`FaHistory`), save (`FaSave`), exit
(`FaTimes`). Draggable `.floorplan-live-panel` mini (240x170, click = maximise) / max (min(1100px,95vw) x
min(600px,90dvh)) with header (title, "total (walkable)", `FaCompress/FaExpand`), options row, the 2D canvas
(canvas 2D, not Pixi), footer Reload / wall height / Import-export / Save. Every edit is applied to the room at once
(`aQ`: RoomPlaneParser + ObjectRoomMapUpdateMessage, same steps as our RoomMessageHandler.onRoomModelEvent), and the
original map is put back on exit without saving. Painting on the room itself uses their renderer fork's
`floorTileEditManager` (tile mouse events + inverse geometry for void tiles, furni `lookThrough`, `moveBlocked`);
ours can do the same from the client (window capture listener on the room canvas + `getRoomInstanceGeometry`).
Heights: `x0-9a-zA-Q`; their parser maps A-Z to 36-61 (`parseHeightCharacter`, also in their renderer's
FloorHeightMapMessageParser). **Our stack reads A-Z as 10-35** (core RoomLayout.parse / FloorPlanEditorSaveEvent
lowercase them; our renderer uses parseInt(c, 36)). Plan agreed with the user: plugin listener on RoomLoadedEvent
fixes the tiles of upper-case letters to 36-61 (core untouched, `roomTiles` via reflection) + a renderer patch of
FloorHeightMapMessageParser like theirs. The heightmap reaches the client unchanged (`getRelativeMap`), so case
survives. Known edge: core's floor-save "item on tile" check still compares with the old A=10 value.

**Builder toolbar vs theirs (current bundle):** same 8 tools and order. Differences in ours: Select title ("then
rotate or change state"), Undo title ("Undo the last builder action"), brush button icon `FaCube` (ours
FaPaintBrush), tool icon sizes (fill/erase/move/height 15, others 14), zoom x2 / /2 in 0.5-2 (ours 1.25/0.8, min 0.25),
brush grid items have the owned count + name title + `layout-inner`, brush status "Will place ~N" while dragging a fill
area and size swapped for rotation 2/6, clipboard flyout only for paste with a clipboard (`totalItems`), select header =
the furni name when one is selected, height flyout only once an area is picked with `FaChevronUp/Down` (size 9) + step and
text "(highlighted blue)", move arrows `GrFormNextLink` rotated (ours FaLocationArrow), no "need rights" flyout in their
toolbar. Mechanism: their area preview is their own Pixi grid overlay (white box, red for pickup), furni in the area get
`selectionHighlightColor` (pickup red 0xFF5555, copy/selected blue 0x66AAFF); ours uses the stock areaSelectionManager
+ a gold tint on selected furni. Result toasts: "Placed / Pasted / Picked up / Moved / Undid / Adjusted N item(s)".

## Floor heights above z: A-Z = 36-61 (2026-09-29, built + verified)

Groundwork for the sodaho floor editor (whose heights go `x0-9a-zA-Q`).
- **Plugin** (`hcms-emulator-plugin`, core untouched): `rooms/UpperCaseHeights.apply(room)`, called from the existing
  `onRoomSettingsRoomLoaded` handler (RoomLoadedEvent fires after layout + items + bots are loaded). It walks the raw
  heightmap; for every upper-case letter except `X` (still blocked) it sets the existing RoomTile's `z` and `stackHeight`
  to 36 + letter index (reflection; the tile objects are kept because bots/pets/items already point at them), moves
  `doorZ` if the door's front tile changed, then `room.updateTiles(changed)`. Logs
  "room N: n tile(s) raised above height 35". The floor-plan save (core `FloorPlanEditorSaveEvent`) stores the map with
  its case and reloads the room, so the fix runs after every save. Known edge: that save's "furni on a changed tile" check
  still computes A = 10.
- **Renderer patch** `.yarn/patches/@nitrots-nitro-renderer-patch-4834514322.patch` (third in the chain, made with
  `yarn patch '<full aura-patched locator>' --update` + `yarn patch-commit -s`): `FloorHeightMapMessageParser.
  parseHeightCharacter` = sodaho's mapping (0-9, a-z 10-35, A-Z 36-61). The aura hook is still in the chain.
- **Verified live** (headless client as officialrooms, emulator restarted 01:02): test room **521 "Height test"**
  (owner officialrooms, left in place) saved with `x0aAMMx`: server log "3 tile(s) raised", client LegacyWallGeometry
  a = 10, A = 36, M = 48, DB keeps the upper case; the avatar cannot step from 10 onto 36 (normal step limit), which
  confirms the server height too.
- Deployed: plugin (emulator restart). The client renderer patch goes live with the next `yarn deploy` (the current
  floor editor can't write A-Z anyway; the new one will).

## Floor editor rebuilt 1:1 on sodaho.tel's + edit modes + landing chat box (2026-09-29, built, dev-verified, NOT deployed)

Replaces the old HabboCity-style floor plan window (the user asked for sodaho's newer editor). Files in
`components/floorplan-editor/`:
- `common/FloorplanEditor.ts` = their `Ya`: canvas 2D (no Pixi), tiles from our `floor_editor` asset (colour diamonds
  from COLORMAP for heights without a sprite), pointer painting, square select, undo/redo (20, one per stroke),
  applyToTile / applyToArea, select all / deselect all. `Constants.ts`: heights `x0-9a-zA-Q` (X_HEIGHT_INDEX skipped),
  sodaho's full colour palette, `heightOfCharacter` (A-Z = 36-61), FloorAction.NONE (the default, like theirs).
- `common/FloorplanRoomLive.ts`: `ApplyTilemapToRoom` (their `aQ`, every edit shown in the room; the received map is put
  back on exit without saving), `ShowRoomGrid`/`ShowAreaPreview`/`HideAreaPreview`/`HideRoomGrid` (their grid + drag box
  on the room canvas), `FloorplanRoomPainter` (their renderer fork's floorTileEditManager, done from the client: window
  capture listeners on the room canvas; floor tiles hit-tested at their own height, empty space at height 0 only with
  "set tile" or area select; furni see-through; clicks never reach furni/avatars). Our renderer's `moveBlocked` also
  blocks room dragging, so pan mode lifts it (clicks are still swallowed, the avatar never walks).
- views: `FloorplanEditToolbarView` (their `Nlt`: 16 buttons, height palette + settings flyouts), `FloorplanHeightPaletteView`
  (`pae`), `FloorplanLivePanelView` (`_lt`: mini 240x170 bottom right, drag / click to maximise; max 1100x600 centred),
  `FloorplanOptionsView` (`Mlt`), `FloorplanCanvasView` (`Olt`: mini = fitted, full = scroll + zoom + touch draw/pan),
  import/export kept (their markup) but **no lower-casing** (theirs lower-cases, which would turn A-Z into a-z).
- `FloorplanEditorView.tsx` (`Dlt`) + `FloorplanEditorContext.tsx` (their `fae` state). "Floorplan saved!" feedback
  bubble when the new heightmap arrives within 8s of Save. Our choices vs theirs: one area-select switch for room + 2D
  plan; colours = theme tokens (`FloorplanEditorView.scss`); mini panel bottom 87px (our toolbar height).
- **Edit modes** (their CSS): `body.floorplan-edit-mode` and `body.builder-edit-mode` (added by BuilderToolbarView while
  open) hide purse, room tools and every toolbar part except the chat input (centred, max 480px).
- **Landing view chat box fixed** (`ToolbarView.tsx`): the centre container was only `.inactive` on `!roomSession`, which
  stays stale on the landing view (rule 4); now also `!isInRoom`.
- Verified live (headless, officialrooms, room 521): edit mode + 16 buttons + mini panel + tile count "21 (21)"; pan drags
  the room; clicking a tile on the room paints it (20, then 40 = `E`); undo / redo; exit restores the original floor;
  maximised panel layout; Save -> "Floorplan saved!", server "4 tile(s) raised", DB `x00E00`, room shows 40 after reload.
  Builder edit mode hides everything but the chat and comes back on exit. `tsc` 69 (none new). Not tested: touch
  devices, import/export save, door direction / thickness changes, very large maps.

## Builder Mode feedback: one icon per action (2026-09-29, built, dev-verified, NOT deployed)

User: "do different feedback items for building". New client feedback kinds (`api/notification/FeedbackKind.ts`):
`build_place / build_pickup / build_move / build_height / build_copy / build_paste / build_undo / build_brush`, icons
`cdn/c_images/notifications/feedback_build_<action>.png` from hCMS `assets/img` (place = rewards/icon_rooms, pickup =
forum/icon_drafts, move = center/navigation/icon_market, height = icon/icon_fleche scaled 50->40 nearest, copy =
forum/category/icon_topics, paste = forum/icon_newtopic, undo = header/icon_logout, brush = center/navigation/7).
`BuilderToolbarView` passes the kind per BuilderActionType; failures: no rights -> no_permission, nothing to do / nothing
to undo -> info, no furni left -> warning, else error; brush set / used up / pick a brush -> build_brush. These are
client-only bubbles, so the hcms-feedback DB kinds/rules are not involved. Verified live (room 89): "Copied 6 items"
with feedback_build_copy.png, "Nothing to undo." with feedback_info.png.

## MetroHotel reconnect: investigation (2026-09-29, nothing built yet)

Read-only from `c:/tools/nitro-catalog-copy/scripts/out/metro/` (`renderer.pretty.js`, `index.pretty.js`).
- **Renderer fork, SocketConnection (`Is`, renderer.pretty ~12146-12343):** on an unintended close it re-opens the
  socket itself: delay = min(1000 * 2^(attempt-1) + random 0-1000, 30000) ms, max 15 attempts, then
  `window.location.reload()`; attempt counter resets after 30s stable. A heartbeat every 30s and a
  `visibilitychange` check force a reconnect when nothing was received for 90s. While authenticated but not "ready",
  outgoing and incoming messages are queued and flushed on ready.
- **Communication manager (`i6`, ~47041):** on every CONNECTION_OPENED it redoes the handshake and sends the **same
  SSO ticket** again (`sso.ticket` config); pong every `system.pong.interval.ms` (20s); a server "shutdown reload" message
  reloads the page.
- **App (`P63`, index.pretty ~38705):** remembers the room on CONNECTION_ESTABLISHED and re-enters it 500ms after
  CONNECTION_AUTHENTICATED (removes the stale session first). On CONNECTION_CLOSED / ERROR: a page reload after backoff
  (count in sessionStorage `nitro:auto-reconnect` {count, updatedAt}, stale after 90s, gives up after 4) with the text
  "... Reconnexion automatique dans N secondes"; offline / online browser events handled. UI: a dimmed overlay with a
  `theme="primary"` card `connection-lost-card` (360px, no close, not draggable) "Connexion perdue" / "Oups, tu as été
  déconnecté." / message / green "Reconnexion" button (= reload).
- **Blocker for us:** Arcturus clears `users.auth_ticket` right after login (`HabboManager.loadHabbo`, unless debugging),
  so re-sending the same ticket fails; and our iframe's SSO in the URL is single-use, so a plain reload fails too. Needs a
  decision: a plugin "reconnect ticket" (new secret ticket written after login and sent to the client) or reloading the
  hCMS hotel page (mints a new ticket; cross-origin top navigation needs a user click).

## Reconnect like MetroHotel, with a reconnect ticket (2026-09-29, built + verified in dev, plugin deployed, client NOT deployed)

User chose "Reconnect ticket" (see the investigation section above).
- **Plugin** `reconnect/ReconnectTicket.java`: IN 9614 (no payload) -> writes a fresh `rc-<64 hex>` secret to
  users.auth_ticket and answers OUT 9613 (string). Core's normal login uses and clears it. An unused one is removed 10
  minutes after the player went offline (`auth_ticket LIKE 'rc-%'` only, so a website-issued ticket is never touched).
  Registered in HcmsPlugin ("ReconnectTicket registered (9614/9613)"); disconnect hook in the existing onUserDisconnect.
- **Renderer patch 4** `.yarn/patches/@nitrots-nitro-renderer-patch-d70c3a4a50.patch` (SocketConnection only, chained after
  aura + heights): their `Is` reconnect: backoff 1s*2^n + jitter (max 30s, 15 tries, then page reload), stable reset 30s,
  90s receive timeout via a 30s heartbeat and on tab visible (Arcturus pings every 30s, IdleTimeoutHandler(30, 60)),
  `_isReady = _wasEverReady` on reopen, write() guards a null socket. The stock communication demo already re-handshakes
  and logs in with `sso.ticket` on every open.
- **Client** `api/reconnect/ReconnectProtocol.ts`, `components/reconnect/ReconnectView.tsx` (+ .scss, mounted in MainView):
  asks for a ticket on mount and after every login, puts it in `sso.ticket` and sessionStorage `hcms:reconnect`
  {urlTicket, ticket}; remembers the room on CONNECTION_CLOSED and re-enters it 500ms after CONNECTION_AUTHENTICATED;
  "Connection lost" card (their connection-lost-card: 360px, no close, not draggable, dimmed overlay, green Reconnect =
  reload) with offline / online texts. `index.html` NitroConfig: when the URL's ?sso= equals the saved urlTicket (a reload
  of a spent URL), the saved reconnect ticket is used.
- **Verified live** (headless, officialrooms, room 521): ticket issued on login (DB + config + sessionStorage); socket
  closed by hand -> card shown -> logged in again and back in room 521 after 2.5s, new ticket; a page reload of the spent
  URL logs in with the saved ticket. Not tested: 15-attempt give-up, a real emulator restart, offline/online events.

## Editing-rights bubble showed a "?" (2026-09-29, fixed, dev-verified, NOT deployed)

User: "why edit rights disabled showing ?". The room-tools rights icon itself is byte-identical to HabboCity's CSS
(`icon-small-rights` / `icon-small-no-rights`, same PNG, the "no" one greyed with `filter: grayscale(.8) brightness(.6)`),
and the setting is only in memory (default on, never persisted). The "?" was the **feedback bubble**: the toggle sent
kind `info`, whose icon is the blue "?" (header/icon_info). New client kinds `rights_on` / `rights_off`
(`feedback_rights_on.png` = HabboCity's hand-and-chair icon at 2x nearest, `feedback_rights_off.png` = the same greyed
like their CSS filter). Verified live: disable -> feedback_rights_off.png, enable -> feedback_rights_on.png.

## Reconnect: stop when the ticket is refused + feedback icons one size (2026-09-29)

- **Bug found in the reconnect:** when the website issues a new SSO ticket for the account (hotel opened / logged in
  somewhere else), the old session is kicked and our reconnect ticket is gone; the client kept retrying (emulator log
  "non-existing SSO token" every few seconds, the loading % climbing) and would reload after 15 tries. Renderer patch 5
  `.yarn/patches/@nitrots-nitro-renderer-patch-32aad3b938.patch` (SocketConnection): a socket that closes before its
  login succeeded counts as a refused ticket; after 2 in a row (`MAX_AUTH_FAILURES`) it stops (`isGaveUp`), and the
  15-attempt page reload is replaced by the same give-up (a reload can't log in once the ticket is gone - theirs can
  because their server reuses tickets). `ReconnectView` watches `isGaveUp`, clears the saved sessionStorage ticket and
  shows "Your session has ended..." with "Open the hotel" (`${url.prefix}/hotel`, top window). Verified: normal drop ->
  back in room 521 after 1.5s; replaced DB ticket -> gave up after 8s with the new card, saved ticket cleared.
- **Feedback icons one size** (user: "make the icon smaller, all icons same position and size"): all 20
  `cdn/c_images/notifications/feedback_*.png` trimmed to their visible pixels and centred on one 32x32 canvas
  (fitted to 32, scaled down with LANCZOS; the small move / cooldown / rights icons scaled up to ~30 with nearest).
  Script: scratchpad `normalize_feedback_icons.py`, backup `icon-backup/feedback-v7/`. `feedback.icon.url` now `?v=8`
  in both ui-configs and emulator_settings (the running emulator needs `:update_config`). The copies inside the
  hcms-feedback jar (`icons/`, fallback only) are still the old ones.
- **"Connection lost" card was hidden behind its own dim overlay** (user: "where is the alert"): the card is a
  draggable window (z-index ~401) and the overlay was z-index 500, so only a darkened screen showed. Fix in
  `ReconnectView.scss`: `.draggable-window:has(.connection-lost-card) { z-index: 600 !important }`. Verified with
  elementFromPoint: the card and its button are on top. Redeployed.
- **Floor editor grid moved after Save** (user): saving reloads the room, which rebuilds the room canvas with a new
  geometry origin (measured 432,-250 -> 288,-336), while the grid overlay stayed drawn for the old one. Fix in
  `FloorplanEditorView`: on RoomEngineEvent.INITIALIZED while the editor is open, `ShowRoomGrid()` again and re-request
  entry tile + occupied tiles. Verified: after Save the grid's first point equals the new geometry's (-0.5,-0.5) and it
  sits on the current canvas master (debug: `window.__floorplanGrid`). Deployed `index-dff5aeeb.js`.
- **"?" on "No Habbo called x here."**: the voice rewrite changed the texts but not the feedback rules. New
  `feedback_rules` 82-86: `no habbo called` / `no bot called` -> not_found (20), `is offline` -> not_found (62, after
  mention so offline-mention notices keep their icon), `couldn't` / starts `type a` -> error (50); same in the client's
  GuessFeedbackKind.
- **Feedback icons "good sizing"**: every icon's longest side is now exactly 32px, centred on 32x32, rebuilt from the
  originals (scratchpad `normalize_feedback_icons2.py`, LANCZOS down / NEAREST up). `feedback.icon.url` `?v=9`
  (both ui-configs + emulator_settings; the running emulator still needs `:update_config`).
- **Testing note:** the user also logs in as officialrooms (a website login at 02:46 kicked the headless test session),
  so do not use officialrooms for headless tests; ask for / create a dedicated test account.

## Builder Mode 1:1 with sodaho + free brush + no walking; edit-mode toolbar frame (2026-09-29)

User: "when user has no furni should still place furni but saying not item ... in our voice, fix the 1:1 sodahotel style
buildtool", "when buildtool enabled cant walk", and (edit modes) "this still showing" = the toolbar's `@media
(min-width:1106px)` frame. All in `components/builder-toolbar/BuilderToolbarView.tsx` (script: scratchpad
`patch_builder.py`) and `floorplan-editor/FloorplanEditorView.scss`, following sodaho's builder code
(`out/soda/floor-editor.pretty.js` lines 57-346). Client only, `tsc` still 69, **not live-tested, not deployed**.
- **Brush = furni type** (`brush {spriteId, name}`), like sodaho, not an inventory item. The eyedropper arms any furni,
  owned or not ("Brush set to X. You don't have any of it yet."). The picker keeps showing it with "Remaining: 0" in red.
  Fill sends `brush.spriteId`, and the server's reply says what was placed and how many were missing. The old
  "used up -> reset the brush" effect is gone.
- **Texts in our voice:**
  - failures: 1 "You need rights in this room.", 2 "That area is too big.", 3 "Nothing to do there.", 4 "Nothing to
    undo.", 5 "You don't have any of that furni.", 6 "You're not in a room.", 7 "That's too many furni at once.",
    default "That didn't work.";
  - success: "Placed N furni[, X skipped][ - you ran out of that furni (N more needed)]." (warning kind when short);
  - copy: "Copied N furni - click a tile to paste." and it switches to Paste.
  - When Builder Mode is off or you have no rights, a bubble shows and the toolbar closes (the rights flyout is gone).
- **1:1 details:**
  - brush button `FaCube`, and the brush icon falls back to `getFurnitureFloorIconUrl`;
  - brush status "W×L · rot N" (width and length swapped at rotation 2/6);
  - grid items: `layout-inner`, a title, a count;
  - icon sizes 15/14; the sodaho select / undo titles;
  - zoom ×2 / ÷2 between 0.5 and 2;
  - clipboard flyout only for Paste with a clipboard;
  - Select header shows the furni name when one is picked;
  - move arrows `GrFormNextLink`;
  - height flyout only once an area is picked, with chevron + step buttons and "(highlighted blue)".
- **Highlights:** selected furni tinted blue (0x66AAFF, was gold); copy / select / move / height areas use a blue
  `highlight_blue` filter; pickup stays red.
- **No walking:** while the toolbar is open, `click` / `dblclick` on the room canvas are stopped in the capture phase
  (the floor editor does the same). The tools work on mouse down/up, and dragging the room still works.
- **Edit-mode toolbar frame:** the edit-mode rule only removed `border-top`, so the reference's
  `border: 3px solid` (sides and bottom) stayed around the chat input. It now sets `border: none`, `border-radius: 0` and
  `-webkit-backdrop-filter: none`.
- **Deployed 2026-09-29** (user "yes"): live bundle `index-fb1aa1a5.js`. Verified live afterwards on the dev client as
  officialrooms in room 521: in `builder-edit-mode` at 1384px the toolbar computes border 0 / transparent / no shadow /
  no blur; with Builder Mode open a floor click leaves the avatar on (0,2), with it closed the same click walks it to
  (3,2).
- **Notification bubbles had no fixed layout** (user: "i want it fixed layout sizing"): the 50px `.bubble-image-container`
  was a shrinkable flex item, so long text squeezed it to 32px and the icon and text moved (text at 48px vs 66px).
  `NotificationDefaultBubbleView` now passes `shrink` (Bootstrap `flex-shrink-0`, no new CSS). Measured on three real
  server bubbles (:noaura on/off, :noornaments): box 50px, icon at 17px, text at 66px in all of them.
- Icon version: the running emulator still sent `feedback_*.png?v=8` until `:update_config` was typed (done as
  officialrooms, 2026-09-29); bubbles now load `?v=9` (32x32). The shop toggles (:noaura, :noornaments...) use kind
  `success`, whose icon is still the blue "!" (`32_warn_blue.png`); the user said "still not the icon" - asked which icon.
- **Builder brush when the furni runs out, checked against sodaho's minified builder** (`out/soda/floor-editor.pretty.js`
  58-320; user: "no furni anymore should still have that mode active", "check again on minified sodahotel"): the brush
  and Autofill stay active with "Remaining: 0" in red, the grid only lists owned furni (count > 0), and a drag still
  sends the fill (the server answers). Sodaho's eyedropper only arms furni you own ("You have none of that furni in your
  inventory.") - ours had been changed to arm any furni; reverted to sodaho's rule. Live as officialrooms, room 521:
  armed "Sb Til" (1 owned), placed it -> "Placed 1 furni.", brush + Autofill still active, Remaining 0, Sb Til gone
  from the grid; a second drag -> "You don't have any of that furni." (not_found icon), mode still active.
- **Sodaho's fill preview built** (user: "yes 1:1 like sodaho"): while a fill is dragged, ghost furni of the brush
  (alpha 0.5, at the tile's stacking height, stepped by the brush size, swapped at rotation 2/6, capped at
  min(maxItemsPerOp, owned count)) and "Will place ~N" under Remaining; removed on release, tool change or exit. Our
  stock area selection has no preview callback, so a requestAnimationFrame loop reads its `_highlightRootX/Y/Width/
  Height` while `areaSelectionState === SELECTING`. The alpha is set again every frame (a ghost's model resets while its
  asset loads; the first ghost read alpha 1 otherwise). Live: 2 lamps owned + a 2x2 drag -> 2 ghosts at 0.5, "Will
  place ~2"; release -> "Placed 2 furni, 2 skipped - you ran out of that furni (2 more needed).", ghosts gone; Stairs
  test placed 2 and Undo gave them back. Deployed 2026-09-29 with the eyedropper change.
- **Bubble spam** (user: "spams bubbles when clicking, or is it because I don't have limits"): there was no cooldown or
  duplicate check anywhere (client `showSingleBubble` or hcms-feedback), for any rank; staff limits have nothing to do
  with it (the emulator's flood control only covers chat). Fixed in `useNotification.showSingleBubble`, which every
  bubble goes through (server notifications + client feedback): a bubble with the same text, type and icon as one on
  screen replaces it (new one on top, its 8s timer restarts), and at most `MAX_BUBBLES` = 5 show (oldest dropped).
  Wired chest bubbles keep their own key logic. `tsc` 69. Live-tested as officialrooms: 6x `:noaura` -> 2 bubbles
  (hidden / visible), 7 different `:follow qaN` -> only the newest 5. Deployed 2026-09-29.
- **Competitor feature references saved** (2026-09-29): HabboPie client `https://cdn.habbopie.biz/nitro/dist/` (bundle
  `index-cc627c03.js`, CSS, ui-config, renderer-config) and its separate Vue overlay `/websocket/js/app.js` downloaded
  to the scratchpad `pie/`. MetroHotel window list from `out/metro/index.pretty.js` (`uniqueKey`s).
- **habbo.cc client read** (2026-09-29, user "check habbo.cc client" / "check on chrome debug"): German Nitro fork at
  `https://habbo.cc/client/game/` (own websocket `wss://game.habbo.cc:8443`). A server request to the game client gets a
  Cloudflare block, so it was read inside the user's own logged-in habbo.cc tab (frame fetch, read-only, byte-exact base64
  chunks; helper scratchpad `cc/pull.sh`). Saved: `cc/cc-index-ClYP6gDT.js` (3.8MB), `cc-index.css` (2.6MB),
  `cc-ui-config.json`, `cc-renderer-config.json`. Also read: the lottery plugins in Plugins.rar
  (`c:/tools/plugins-reference/lottery-extracted/`): furnibuilder Lottery = one entry per player; phblotto =
  `users_loteria`, `:buylotto` one ticket, but a `loteria` catalog furni converts every purchase into a ticket (so
  several tickets per player), `:lotto award` draws a random row.
- **Pyramid check** (2026-09-29, user "check for pyramid plugin"): `Pyramid.jar` is listed in Plugins.rar, but that archive
  is no longer in Downloads (only the small 90-jar `Plugins.zip`, without it), so it could not be read. Stock Arcturus already
  has pyramids: `InteractionPyramid` (interaction `pyramid`) is a gate that opens/closes by itself every 1..
  `pyramids.max.delay` (18) s while nobody stands on it, run from the room's roller cycle. Our data: `pyramid` on
  bb_pyramid, wf_pyramid, es_geysir and (wrongly) `invisible_tile`; `alien_pinkpyramid` has `wf_pyramid`, which no
  emulator code registers (so it acts as plain furni). 191 placed items use these. Not changed yet.
- **Name customisation reference** (2026-09-29, user: "cosas has old versions of HabboJe etc, same habbo.cc base, check how
  name customisation works in habbo.cc"). `C:/Users/Administrator/Downloads/cosas.rar` (4.3GB, 519k files; full file list
  in scratchpad `cosas-list.txt`): HabboJe, Hekos, RetrosLab, apex-nitro under `documents/`, plus BattlePass,
  RetroPass-client, plugin-web, beast-cms, cm-cliente, nitro-react-dev-cliente, Nitro-newWireds, release/ (Arcturus
  3.5.3). HabboJe's customisation files extracted to `c:/tools/plugins-reference/cosas-customize/` (read-only).
  Plugins.rar was unpacked by the user to `Downloads/Plugins/Plugins/` (Pyramid.jar is there, not read yet).
  - **habbo.cc now** (live bundle, window `name-prefix-info` "Nametag & Farben", 600px, theme primary-slim): a tag of up
    to 5 characters or one emoji (20-emoji picker), tag colour, name colour (colour input + hex field + 21-colour palette
    + 8 presets "Klassisch", "Rot Weiß"...), and for premium users shadow (colour, blur 0-20, X/Y -10..10) and glow
    (colour, intensity) for tag and name, each with Reset. Right side: live chat-bubble preview with your head. Save
    sends one composer (tag, colours, premium flag, all shadow/glow values); the reply updates a per-user cache and chat
    renders `<span color>tag</span> <span color>name</span>`. Empty tag = "off".
  - **HabboJe (older, same base)**: items bought in the catalog (4 catalog layouts): name colour (a per-letter gradient,
    `ColorUtils.mixedColours`), name icon, name border (outline via text-shadow), name background (a gif behind the
    name); owned lists per type (`users_color_name`, `users_icon_name`, ...), catalog tables `customize_colors/icons/
    background/border` (`id`, `data`), picked in "Username bearbeiten" (892x460), sent over their separate RetroPass
    websocket. Banners too (`banners`, `users_banner`).
- **Built (2026-09-29, user "yes do it"): `:pyramid` + pyramid data fix, and Presence > Name (name tags).** Deployed 05:14
  (restart without asking, per the user's new rule) + client `index-ce1eca04.js`; `shop.names.url` =
  `https://cdn.habbo.nz/shop/names/` (folder created, empty). Boot: "added permission column cmd_hc_pyramid", "31 HabboCity
  commands", "migrated the database to v7 (name tags)", packets incl. 9615. Live-tested as officialrooms in room 521: Name tab
  renders (6 tabs, alert, fields, Colours/Outlines, 9 cards); saving tag 👑 + #ffd700 / #ff1493 -> "Your name tag is saved.",
  DB tag bytes F09F9191, chat name = gold 👑 + pink name; staff-give + wear Rainbow -> 13 letters red..purple; Gold outline ->
  8 gold text shadows; `:pyramid` -> "There are no pyramids in this room.". Left on officialrooms: that tag, Rainbow and Gold
  outline (owned + worn). Not tested: VIP shadow/glow sliders, icons/backgrounds (no images yet), the infostand/profile.
  - `:pyramid` / `:pyramids` (hcms-emulator-plugin `HabboCityCommands`, permission column `cmd_hc_pyramid`, default '2' =
    room rights, like ArpyAge's Pyramid Command): switches every stock `InteractionPyramid` in the room at once, skipping
    tiles someone stands on; bubble "Switched N pyramids." / "There are no pyramids in this room.". Help list entry added.
    Data (live, backup `bak_20260929_pyramid_types`): `alien_pinkpyramid` wf_pyramid -> pyramid, `invisible_tile`
    pyramid -> default (needs `:update_items`; placed items take the new type when their room reloads).
  - **Presence > Name** (hcms-shop schema v7, tab `names` sort 24): habbo.cc's "Nametag & Farben" + HabboJe's name items.
    - Server: `data/NameStyle` (tag max 5 code points or emoji, markup/control chars stripped, run through the hotel word
      filter; tag + name colour `#rrggbb` or '' for everyone; VIP only: tag/name shadow colour, blur 0-20, x/y -10..10 and
      glow colour + size 0-20), table `shop_name_styles` (row only when set), IN **9615** `shop.header.in.name` (one JSON
      string, 3s cooldown -> `msg.name_wait`). `data/NameItem` = table `shop_name_items` (code, kind color/border/icon/
      background, data, price, currency_type, vip_only, sort_order, enabled); each kind is its own item type
      (`name_color` ...) in shop_user_items / shop_user_active, bought and equipped with the normal Buy/Equip packets.
      Seed: 8 gradient colours (galaxy, rainbow VIP) and 6 outline colours; icons/backgrounds need image files under
      `shop.names.url` (default `shop/names/`, our hotel should get `https://cdn.habbo.nz/shop/names/`). Shop data now has
      `nameItems`, `nameStyle`, `namesUrl`; `sendUser` adds `name` (style + worn color/border/icon/background data) and is
      sent to the whole room on save/equip. Texts in 5 languages (INSERT IGNORE on boot).
    - Client: `components/shop/ShopStyledName.tsx` (`StyledNameView` draws tag + name: gradient letter by letter,
      outline = 8 text shadows like HabboJe, shadow, glow, icon before, background image behind; `ShopStyledName` fetches
      the player's decor through the shared `useShopUserDecor` cache). Used by `common/UsernameView` (infostand, profile,
      mentions ...), the chat bubble username (`ChatWidgetMessageView`, only senderWebId > 0) and the avatar name menu.
      Staff keep their rank colour (`lockColor` when identity.staffColor); tag and decorations still show.
      `components/shop/ShopNamesView.tsx` = the tab (tag + emoji picker, tag/name colour with habbo.cc's 21-colour palette
      and 8 presets, VIP shadow/glow sections, live chat-bubble preview, Save/Reset; decorations grid per kind with a
      None card). Styles appended to `ShopView.scss`. `tsc` 69.
- **Rank colours are name items (2026-09-29, user: "change the by rank namecolor so on basic it will scan permissions
  tables colors and create preexisting names").** hcms-shop schema v8 (`shop_name_items.rank_id`, `.title`): every catalog
  refresh (start + every 30s) `ShopRepository.syncRankNames` upserts `rank-<id>` (kind color, data = permissions.staff_color,
  first 7 chars) and `rank-bg-<id>` (kind background, data = `shop.rank.backgrounds.url` + staff_background; ours
  `https://cdn.habbo.nz/profile-icons/`), title "<rank_name> colour/background", price 0; a rank that lost its colour has its
  item switched off. Rank items: owned only by that exact rank (`owns` checks `userRank`), never sold (buy -> unavailable),
  shown only to that rank (`nameItemsFor`), and worn by default (`wornName`: chosen item > chosen none = -1 row in
  shop_user_active > the rank's own item). Equip with id 0 on a name type stores -1 ("None" sticks). Client: once a player's
  decor has loaded it decides the whole look (`baseStyle` = the old GetUsernameStyle only until then; `plainStyle` = the
  colour of a name with no colour of its own, e.g. the chat bubble text colour); `lockColor` removed; absolute URLs in icon/
  background data are used as they are. Staff hint text changed (DB + seed). Deployed 05:32 (client `index-542a0695.js`).
  Live (officialrooms, rank 8): 13 rank items created (Administrator has no gif); the Name tab shows only "Super Admin
  colour" plus a new Backgrounds group; chat name gets the glitter gif by default; choosing None removes it and stores -1.
  **Incident:** the first build of this hung the emulator boot for ~2.5 min: `syncRankNames` read a setting through
  `ShopConfig.live()` -> `settingValue()` -> `refresh()` -> `syncRankNames()` ... each holding a pool connection until the
  pool ran out (found with jstack). Fixed by reading `shop.rank.backgrounds.url` on the sync's own connection. **Rule: never
  call `ShopConfig.live()` (or anything that refreshes the catalog) from inside `ShopRepository.refresh()`.**
- **Furni Editor Team tab opens things in context (2026-09-29, user "clicking it will go to that exact furni or last
  stage and we continue").** `goTo(itemId, pageId)` in FurniEditorView: Continue = your last furni on your last page;
  "Pages worked on" = that page's first furni not done yet (`FIRST_TODO` = -2 in `pendingOpen`); "Recent edits" = the
  furni on the first page selling it (`contextFor`: the detail's offers give the page, then goTo). The catalog moves to that
  page too (choosePage, or a direct loadPage when it is already open), so Prev / Next / Save & next continue from there.
  A page list that arrives twice (catalog sync + direct load) keeps the open furni instead of jumping to the first.
  Live (officialrooms): Bazaar row -> Edit 84/94 (first to do); recent edit bazaar_c17_curtainpink -> 83/94 on Bazaar.
- **Layout rule + overlap checker (user: "follow a layout every time", "it's overlapping").** Memory
  `feedback_follow_existing_layout`. Presence > Name rebuilt on the Borders/Ornaments structure (`.shop-borders` >
  `.shop-section-header` > `.shop-borders-layout` = `.shop-borders-grid` + `aside.shop-border-detail`), mode row Tag /
  Colours / Outlines / Icons / Backgrounds; tag form rows got `flex-shrink: 0` (they were squeezed onto each other).
  Furni Editor Search / Catalog page header rows got `shrink` (37px controls in a 32px row). Checker:
  scratchpad `overlap.js` (`window.__overlaps(selector)` = children sticking out of their parent or covering a sibling);
  run on every Name mode and every Furni Editor tab in compact (780x620) and full (1120x670): no overlaps.
- **Big name collection (user: "habbo icons ... big collection sorted user VIP staff").** Sources: HabboPie's client
  bundle has 351 name prefix icons (16px pixel art, `cdn.habbopie.biz/prefixes/<n>.png`) - downloaded for our hotel to
  `hCMS/public/cdn/shop/names/icons/pie-<n>.png`; cosas (HabboJe / Hekos / apex-nitro) only has code, their lists came
  from their servers (Hekos dumps have empty player_colours tables). Animated colours like HabboPie's "Animasyonlu"
  (VIP / rank 8+): colour data starting with "~" = a moving gradient (`background-clip: text`, keyframes `shop-name-flow`,
  outlines / shadows become drop-shadow filters). hcms-shop v9 adds `min_rank` (free for that rank and up). Hotel data
  `hcms-shop/hotel-data/build_name_items.py` -> `name-items.sql` (upsert by code) + backgrounds drawn into
  `cdn/shop/names/`: 495 items; total enabled now colours 90, outlines 26, icons 372, backgrounds 34. The tab sorts each
  mode into Everyone / ⭐ VIP / 🛡 Staff & ranks with headings. Live: counts match, all 372 icons load, animation runs.
  Client deployed `index-e5d73cf3.js`.
- **Pixel pose model (user: "learn again multiple furni").** `components/furni-editor/FurniPoseModel.ts` (same vector +
  kNN as scratchpad `pose_train.py`, model from ui-config `furni-editor.pose.model.url`), `DecidePose(..., picture)` adds
  one vote "picture NN%" only at >= 80% sure (leave-one-out on 455 furni: 74.5% overall, 90% right at >= 80% sure). A
  bigger scan (scratchpad `pose-truth2.json`, 1,271 more furni, `pose-run2.js`, stops on a lost session) is running; then
  retrain with `--write`, publish `pose-model.json` to the CDN and set the ui-config key. Until then the vote is inactive.
  Gotcha: the headless officialrooms session gets kicked when the user logs in as officialrooms; the scan used to mark
  every furni failed after that.

## Presence marks, badge icons removed, Furni Editor Team fix + "Auto run pages" (2026-09-29)

- **Name tab flags** (user: "the vip and staff flag should be same", then "like on auras the VIP"): no more emoji
  badges. New shared `components/shop/ShopItemFlags.tsx`: VIP (the Auras card's `.shop-aura-card-vip` mark) or STAFF
  (same mark, blue #22abd6) top right; the player's state bottom left, "Owned" (#3c90e6) or "In use" (green), on
  **every** Presence tab (Auras, Name, Borders, Ornaments, Bubbles, Spawn; user: "owned not showing, need to click
  first, do a good one for the whole shop"). `.is-small` = the 58px tiles; bubble cards put the state top left (their
  button is at the bottom). Owned tiles also get a blue frame. Group headings are plain "VIP" / "Staff & ranks".
  Verified in the headless client with one test item of each type (removed again): every tab shows "Owned", no overlaps.
- **Badge images are no longer name icons** (user: "dont use badges as icons"): `h-i-*`, `h-vi-*`, `h-ri-*` (21 rows)
  set `enabled = 0` and removed from `hcms-shop/hotel-data/build_name_items.py`. A worn one disappears within the shop's
  30s cache (the cache only holds enabled items). Name tab info icon = `icon_clothing.png` (hotel data in `shop_tabs`).
- Spawn tab: `.shop-spawn-details` was squeezed to 11px by the picker below; now `flex-shrink: 0`.
- **Furni Editor Team tab** (user: "layout on team is still"): its boxes were squeezed in the scrolling column (a box
  31px tall with 53px of content, rows spilling into the next box). `.furni-editor-team > *` and `.furni-editor-list > *`
  joined the `flex-shrink: 0` rule. Overlap check clean on Search / Catalog page / Words / Team.
- **Auto run pages** (user: "let me tick multiple categories or just auto run all"): `FurniEditorRunPagesView.tsx`,
  docked where the review panel docks (same `.furni-editor-review-dock` classes; the window widens the same way).
  Every visible catalog page in tree order with a checkbox; ticking a category ticks every page under it; filter box;
  "Run ticked (n)", "Run all (n)", "None". The button "Auto run pages..." is in the Catalog page tab, the Team tab and the
  Edit tab's Save row, and turns into "Stop auto run" while a run is going. Mechanism: `runQueue` ref = the pages still
  to do; `nextCatalogNode()` takes the next queued page while a queued run is on (pages no longer in the tree are
  skipped), so the existing page-end / empty-page moves work unchanged; the run stops after the last page. Gotcha
  found while testing: the shared `Button` is a div, so a *disabled* one still fires onClick - guard handlers.
  Verified live: ticking "Official Furni" ticked 368 pages; a run opened the first ticked page's first sub-page and
  saved 4 furni (Hippo statues), which were reverted with the review panel's "Revert ticked" (DB values back to 0.00 / 2).
- Pose scan: stopped at 1,612 results when a deploy restarted the dev tab; not retrained on them yet.
- Deployed: client `index-b5b24d67.js`.

## Presence restyled on the website Center's look and layout (2026-09-29)

User: "use hcms website style and layout all", then "yes all of presence". Source: hCMS
`resources/views/center/layouts/shell.blade.php` + `partials/menu.blade.php` + `banners.blade.php` and
`public/assets/css/_center.css` / `_theme.css` (read directly; the website stylesheet isn't loaded in the client, so the
rules are copied scoped under `.hcms-shop.nitro-card` in `ShopView.scss`, replacing the earlier HabboPass block).
- **Structure** (`ShopView.tsx`): `.center-menu-wrapper` of `.center-menu-items` (30px `.icon-center` from `tabIcons` +
  label, active pill with the bounce arrow), then `.container_center` > `.center-header` (`.center-header-monnaie` =
  the currency box, `.center-header-monnaie-title` rows with `LayoutCurrencyIcon` + amount; `.center-alert` with the 80px
  icon) > `.center-content-wrapper` > `.tab-pane-center.active` (the tab views, unchanged). Empty/closed = `.center-empty`.
- **Colours:** the website's theme values as `--center-*` variables: WHITE (`#0E1320` / `#FFFFFF` / `#EEF2F9` / `#C4CEE2`)
  by default, DARK (`#FFFFFF` / `#1b202c` / `#202635` / `#2E334D`) under `body.dark-mode`, so it follows the client's mode.
- **Cards** (aura, bubble, the Borders/Ornaments/Name detail): `.banners-card` look (18px radius, the website's
  `banner_card_banners.png` at 25% via `--center-card-bg`, built from `url.prefix`) + the moving `.shiny-bg` shine (new
  `ShopShine.tsx` as each card's first child). Tiles = website boxes; section header rows = `.center-header-troc-menu`;
  Name sub-tabs = `.tab-control-troc`; buy buttons = `.banners-btn` gold gradient. Selected = `--color-blue`, in use =
  `--color-green`.
- Window 760x600 (the header takes ~124px; at 560 the ornament room preview was cut by 33px).
- Verified live (headless, officialrooms): one menu row (6 pills, 42px), header 110+604 x 104, content 335px; computed
  colours match the website DARK values exactly; light mode gives the WHITE values; no overlaps and nothing clipped in
  any tab. `tsc` 69 (none new). Deployed: client `index-2d1a13b7.js`.
- Also this session: Presence owned/in-use marks (`ShopItemFlags`), badge name icons switched off, Furni Editor Team
  squeeze fix and "Auto run pages" - see the section before this one.

## Staff monitoring feed + MetroHotel chat reactions: investigation (2026-09-29, nothing built yet)

- **ltdws "[NEW USER]" alerts** (user: "same for all staff actions, wordfilter triggered, [NEW USER] [MODERATION]
  [WORDFILTER]"): not in any local source. `LTDCDN/client/plugins/ltdws` (PHP + JS) only has private-message chat, and the
  LTD Polaris emulator source only has stock `HabboManager.staffAlert` (`cmd_staffalert`, a plain alert to every
  Habbo with that permission). The tagged feed most likely lives in the live LTD hotel's compiled plugin, which isn't on
  this box. What we have to build on: `hcms_admin_audit_log` (every staff action from the website, Mod Tools
  Administration, Furni Editor...), `hcms_session_log` (logins), `hcms_mention_log`, the stock chat/command logs, and the
  plugin events (UserRegisteredEvent, UserLoginEvent, UserTalkEvent / word-filter hits, ban/mute/kick events).
- **MetroHotel chat bubble** (`out/metro/index.pretty.js` ~24620-24770): each bubble has a `stableId`. Hovering the
  message shows a "Sent N seconds ago" tag right of the bubble. Hovering the bubble shows `.reactions-box`: a reply
  button (↩, sets a reply preview in the chat input; a reply bubble shows the quoted "username message" line with
  `client/mention.png` on top) and 4 reactions `smile/like/heart/angry` (`.reaction-button` > `.reactbtn.<name>` +
  `.reaction-count`, `.active` when counted). A reaction sends composer `q5e(stableId, reaction)`; the server broadcasts
  `V5e {chatMessageId, userId, reaction}` and every client adds the user to that reaction's set. Their bubbles also carry
  per-message name colour / text colour / tag / VIP icon / bubble animation (fade, pop, tada...) / bubble font.
  Our chat has none of this (no stable message id either); it needs a plugin protocol (ids on chat, reaction + reply packets).

## Staff feed + chat reactions / replies / time (2026-09-29, built, deployed, live-tested)

**Staff feed** (user: "not with the notification bubble, send in the room only to staff who enabled it", then "use the
chat bubble like lotto and bsalad in ltdws"). Mechanism copied from the LTD hotel's own plugin source
(`LTDWEB/LTD Emulator + LTDUI/ltdcms-plugin`, `com.ltd.cms.Msg.selfBubble` + `staff/NewUserAlert`): a normal talk line
(`RoomUserTalkComposer`, `RoomChatMessage(text, habbo.getRoomUnit(), bubble 34)`) over the staff member's own avatar,
sent only to that staff member's client. Bubble 34 is message-only in our client (no username).
- Plugin `hcms-emulator-plugin/stafffeed/StaffFeed.java` + `StaffFeedEvents.java`; tables `hcms_staff_feed` (who has it
  on + muted tags), `hcms_staff_feed_log` (every line), `hcms_staff_feed_seen` (ltdcms' first-login rule: back-filled on
  boot with every account with `last_login > 0`; a login not in it = new user). Setting `hcms.stafffeed.bubble` (34).
- Tags and sources: `[NEW USER]` (first login, IP + other accounts on the same IP), `[MODERATION]`
  (SupportUserBanned / SupportUserAlerted / SupportRoomAction events + the stock moderation commands by class name),
  `[WORDFILTER]` (UserTriggerWordFilterEvent, max once per player+word per 30s; staff aren't filtered, acc_chat_no_filter),
  `[REPORT]` (SupportTicketEvent), `[STAFF]` (a 5s poll of `hcms_admin_audit_log`: website + game staff actions).
- Command `:stafffeed` / `:feed` / `:sf` (permission `cmd_hc_stafffeed`, new level "S" = ranks 4+): on/off;
  `:stafffeed <tag>` mutes/unmutes a tag; `:stafffeed tags` lists them. Help list entry added.
- Client: `ChatWidgetMessageView` colours the leading `[TAG]` of bubble-34 lines (NEW USER green #3cd070, MODERATION red
  #ff4d4d, WORDFILTER orange #ffa334, REPORT pink #e967c6, STAFF blue #6d95f3). Players can't use bubble 34
  (`commands.cmd_chatcolor.banned_numbers`), so it can't be faked.
- Verified live: `:roomalert` produced `[MODERATION] officialrooms used :roomalert staff feed test` as a bubble-34 line and
  a log row. Not yet seen live: [NEW USER], [REPORT], [STAFF], [WORDFILTER] (can't be triggered by a staff account).

**Chat reactions, replies, time** (MetroHotel's chat bubble, `out/metro/index.pretty.js` ~24620-24770 + their CSS):
- Plugin `chatreact/ChatReactions.java`: on UserTalkEvent (talk/shout, not whispers or ":" commands) a line gets an id;
  OUT **9618** (unit index, chat id, reply id/username/text) goes to the room before the stock broadcast; IN **9617**
  (chat id) = "my next line replies to this" (15s); IN **9616** (chat id, reaction smile/like/heart/angry) toggles the
  player's reaction, OUT **9619** (chat id, user id, reaction, on) to the room. Last 300 lines per room, memory only,
  dropped on RoomUnloadedEvent.
- Client `api/chat/ChatReactions.ts` (protocol + a small store); `useChatWidget` registers it and puts the pending id on
  the next talk/shout bubble of that unit (3s window); `ChatBubbleMessage` got `stableId`, `reply`, `receivedAt`;
  `ChatWidgetMessageView`: reply quote (`.chat-reply-reference`), "Sent N seconds ago" on hovering the message
  (`.message-time`), `.reactions-box` (↩ reply + the 4 reactions with counts; stays visible once a line has reactions);
  `ChatInputView`: `.chat-input-reply-preview` with × to cancel; `useChatInputWidget` sends 9617 before the line.
  Styles `components/room/widgets/chat/ChatReactions.scss` (MetroHotel's rules and their small reaction sprite, our hotel).
- Verified live (officialrooms, room 521): a heart reaction came back as count 1 / active / mine; reply preview shown,
  the reply bubble shows "↩ officialrooms reaction test line", the preview cleared. The hover time was not driven by CDP.
- Deployed: plugin (restart 17:09) + client `index-877bdb81.js`.

## Chat reaction / reply feedback bubbles (2026-09-29, deployed)

User: "You reacted (emoji) to xy's message / Username reacted to your message with emoji / replied to your chat, with
feedback, and your own ideas". Plugin `chatreact/ChatReactionNotices.java`, called from `ChatReactions`:
- the reactor: "You reacted ❤️ to Phi's message: "…"" (or "to your own message");
- the author: "Bob reacted ❤️ to your message: "…"". Own idea: reactions to the same line + emoji within 3s are
  grouped into one bubble ("Bob and Ann…", "Bob and 3 others…");
- the author on a reply: "Bob replied to your message "…": "…"";
- own idea: each reaction has its own icon. New feedback kinds `reaction_smile/_like/_heart/_angry` + `reply` (hcms-feedback
  `FeedbackKind` + labels; the kinds table is now filled with INSERT IGNORE so a later kind gets its row). Icons
  `cdn/c_images/notifications/feedback_reaction_*.png` / `feedback_reply.png`, made 32x32 from the website's forum icons
  (reactions/icon_like, reactions/icon_heart, icon_lol, reactions/icon_dislike, icon_discussion);
- own idea: `:noreactions` (everyone) stops the author bubbles for yourself (table `hcms_chat_react_optout`); help entry.
Verified live: reacting shows "You reacted ❤️ to your own message: "notice test line"" with feedback_reaction_heart.png.
The author and reply bubbles need a second account in the room and were not seen live yet. Client `index-d0b1331a.js`.

## Staff feed: every command + security + styling (2026-09-29, deployed, live-tested)

User: "why stafffeed not for all commands, I want moderation monitor security for the hotel", then "do text styling".
- `[COMMAND]`: every command anyone runs (UserExecuteCommandEvent), with rank and room; moderation commands stay `[MODERATION]`.
- `[SECURITY]`:
  - commands tried without permission: core only fires the command event after the permission check, so a denied
    command falls through as chat; `StaffFeedEvents.onTalk` (from the UserTalkEvent handler) looks the command up in
    CommandHandler's table (reflection) and checks `hasPermission(permission, roomRights)`; once per player and
    permission per 60s;
  - staff logins (rank 4+) with the IP, "a new IP for this account!" when `hcms_session_log` hasn't seen it;
  - a login from the IP of a banned account (`bans.ip`, active bans);
  - several accounts online on one IP;
  - rank changes (UserRankChangedEvent) and name changes (UserNameChangedEvent).
- `[STAFF]` audit details are plain "key: value" text now (no JSON).
- Client styling (`ChatWidgetMessageView.staffFeedHtml`, bubble 34 only): the tag as a coloured label (NEW USER green,
  MODERATION red, WORDFILTER orange, REPORT pink, STAFF blue, COMMAND teal, SECURITY purple), the player in bold,
  `:command` amber, "room names" bold italic, `(#id)` faded, IPv4 addresses monospace, warning phrases ("without permission",
  "a new IP for this account!", "logged in from the IP of banned", "is online on the same IP as", "message hidden",
  "muted Ns") bold red. The formatter was unit-checked in Node on one line of each kind.
- Live: `:pyramid` gave `[COMMAND] officialrooms used :pyramid (Super Admin) in "Height test" (#521)`; logins gave the
  staff-login and same-IP `[SECURITY]` lines (Phi and officialrooms share this machine's IP). Plugin restart 17:46,
  client `index-40030552.js`.

## Staff feed control, watchlist, hover actions, Staff Settings window (2026-09-29, deployed, partly live-tested)

- **Hotel-wide control** (user: "full control but not too much"): plugin tables `hcms_staff_feed_tags` (tag, label,
  description, enabled, min_rank, default_on, sort; seeded INSERT IGNORE: [STAFF] rank 5+, [COMMAND] default off) and
  `hcms_staff_feed_ignore` (harmless commands that never make a [COMMAND] line; 30 seeded once, setting
  `hcms.stafffeed.ignore_seeded`). Both re-read every 30s. Every line is logged even when its tag is off hotel-wide. The
  same line within `hcms.stafffeed.repeat_seconds` (20) is dropped. `:stafffeed` switches on with the hotel defaults
  (important tags); `:stafffeed all` / `quiet`. **Website admin pages for these tables are NOT built yet** (was next when
  the user moved on to the Staff Settings window; the window's text points to "Administration > Staff feed").
- **Watchlist**: `hcms_staff_feed_watch`; `:stafffeed watch <name>` flags/unflags; a flagged player's chat (said/shouted/
  whispered), rooms entered and every command (ignored ones too) go out under `[WATCH]` (rose). `:stafffeed commands <name>`
  sends only the asker their last 10 logged commands (`[COMMANDS]`, slate).
- **Feed line actions** (user: "like the emojis but the other"): `StaffFeedActionsView` = the reactions box look on a
  hovered bubble-34 feed line, icons Info (Mod Tools user info via the by-name identity lookup's webId), Go to (`:follow`),
  Flag (`:stafffeed watch`), Commands (`:stafffeed commands`). Clicking a feed line no longer selects your own avatar.
- Tag label = the text's own height (`font-size/line-height: inherit`).
- **Chat time tag was black**: HabboCity's `.chat-bubble .chat-content * { color: black }` beat `.message-time`; rule
  raised to `.chat-bubble .chat-content .message-time`.
- **officialrooms' black name**: leftover "None" rows in `shop_user_active` from my earlier Presence test (removed; the
  shop caches them until that account logs out). Phi's own choices untouched.
- **Staff Settings window** (user: "for stafffeed please do a Staff Settings menu"): Mod Tools button (rank 4+),
  `mod-tools/staff-settings` link, `:staffsettings`. `components/mod-tools/views/staff-settings/ModToolsStaffSettingsView.tsx`
  (the Administration window's layout/classes): tab "Staff feed" (on/off, Important only / Everything, a switch + coloured
  label + description per tag you may see) and tab "Flagged" (flag by name, list with who/when, Unflag). Protocol
  `api/stafffeed/StaffFeedProtocol.ts` <-> plugin `stafffeed/StaffFeedProtocol.java`: IN 9620 state, IN 9621 (action,
  argument), OUT 9622 (on, tags, flagged, message). Live: 8 tags listed, switching COMMAND off/on round-trips; theme
  colours checked. Flag tab and hover actions not clicked live yet.
- Deployed: plugin restart 21:03, client `index-ee3c71b1.js`.

## Staff feed line buttons without chat commands (2026-09-29)

User: "when clicking commands shouldn't show". The hover buttons sent real chat commands (`:follow`, `:stafffeed ...`),
and `:follow` then made its own [COMMAND] line. Now all four go over the Staff Settings packet (IN 9621): new actions
"commands" (the last 10, to the asker only) and "goto" (like the stock StalkCommand: `RoomDataComposer(room, staff, true,
false)`, with offline / not in a room / same room bubbles); Flag uses "watch". Live: Commands on a [MODERATION] line
showed "Last 3 commands of officialrooms" + 3 lines, and no new feed line. Deployed 21:12, client `index-403a2de8.js`.

## Per-staff flags, economy feed, reply chip + bubbles, repeat count (2026-09-29, deployed, live-tested)

- **Flags are per staff member** (user: "if one staff flags, only for them"): table `hcms_staff_feed_flags` (staff_id,
  user_id, username, created_at; PK staff_id+user_id; the first shared `hcms_staff_feed_watch` rows with a known
  `added_by` are copied over). `StaffFeed.postWatch(subject, text)` logs and sends [WATCH] only to the staff who flagged
  that player (unless they muted "watch"); flag/unflag answers only the flagger. The Staff Settings "Flagged" tab lists
  only your flags. Live: flag Khalil -> row (2, 3), "only you see" line; unflag -> row gone.
- **Economy** (user: "flagged buying in the shop or trade should show, do an economy tag, full, better security"):
  `stafffeed/StaffFeedEconomy.java`, tag `economy` (ECONOMY, brown #a16207): every trade (what each side gave, first 5
  item names), marketplace sales, shop purchases from `hcms.stafffeed.economy.min_credits` (1000) credits /
  `min_points` (500) points up; a flagged player's purchases, trades and marketplace offers go to their flaggers under
  [WATCH]; [SECURITY] for a trade between two accounts on the same IP and for items going to an account younger than
  `hcms.stafffeed.security.fresh_hours` (24) (alt feeding). Events: UserCatalogItemPurchasedEvent, TradeConfirmEvent,
  MarketPlaceItemSoldEvent, MarketPlaceItemOfferedEvent. Not triggered live yet (needs a real trade/purchase).
- **Reply**: the indicator is now a green chip inside the chat input ("↩ name ×", Esc cancels; the floating preview could
  be clipped). Bubbles (user: "should give bubble when click reply"): "Replying to X: "…". Type your message, or press
  Esc / × to cancel." (kind reply), "Reply cancelled." (info), "Reply sent to X." (reply). Client FeedbackKind gained
  reply + reaction_*. Live-tested all three.
- **Repeat count** (MetroHotel `repeatCount`, user: "1x 2x 3x ... just do like count"): the same line again straight
  after (same sender, text, type, reply) adds to the newest bubble's `repeatCount` instead of a new bubble; shown as an
  "x2" badge on the bubble's top-left corner in the reactions look (`.chat-repeat-count`). Live: 2 identical lines -> 1
  bubble with "x2".
- Deployed: emulator 21:25; client (see the newest `index-*.js`).

## Staff feed website pages (2026-09-29, built, render-tested)

hCMS: models `App\Domain\StaffFeed\Models\{StaffFeedTag,StaffFeedIgnore,StaffFeedLogEntry}` and three pages under
**Moderation**: "Staff feed" (`StaffFeedTagResource`, administrators: coloured label, editable description, On, From rank
(permissions ranks), Default on), "Staff feed: ignored commands" (`StaffFeedIgnoreResource`, administrators: add / "show
again" / bulk delete; ":" stripped on save), "Staff feed log" (`StaffFeedLogResource`, every moderator: all lines incl.
switched-off tags, search, tag filter, refreshes every 10s). All three render with `Livewire::test` as user 1 (tinker
`--execute="require '<file>';"`, stdin didn't print); the log shows the newest rows. The plugin re-reads the tables
every 30s. Staff Settings' footer text points to these pages.

## Staff duty, personal staff settings, repeat counters on bubbles (2026-09-29, deployed + live-tested)

User: "Staff Settings where staffs can do settings like stafffeed etc and maybe we do a AdminDuty" (idea source: the Plus
emulator pack's `ADMDutyCommand.cs`: effect 187 + a hotel-wide "Admin X is now on adminduty!" bubble). Own build:
- **Plugin** `stafffeed/StaffDuty.java`:
  - `:duty` (+ `:adminduty`, `:admduty`) is level S (rank 4+, column `cmd_hc_duty`); `:onduty` (+ `:staffonduty`) is for
    everyone (`cmd_hc_onduty`) and lists the staff on duty or says to use Help.
  - On duty: the effect `hcms.duty.effect` (102 "Staff") is re-applied 1s after every room entry; every online Habbo gets
    an INFO bubble when `hcms.duty.announce` = 1; a [STAFF] feed line on / off; every new report gives each on-duty staff
    member a WARNING bubble linking to `mod-tools/tickets` (sent from `SupportTicketEvent`, even with the feed off).
  - Duty is kept in memory and ends on logout.
  - Personal settings: table `hcms_staff_settings` (user_id, setting_key, value; only non-default rows), keys
    `auto_duty` (0), `duty_effect` (1), `report_alerts` (1), read/switched through `StaffDuty.SETTINGS`.
  - Protocol: IN 9621 actions `duty` and `setting <key>`; OUT 9622 appends onDuty, the on-duty list (name, since) and
    the settings (key, label, description, on). The client reads each part only if `bytesAvailable`.
- **Client** Staff Settings: tabs Duty / Staff feed / Flagged. Duty = on/off switch, "My settings" checkboxes, "Staff on
  duty now". Rows in the scrolling tabs no longer shrink (`.overflow-auto > * { flex-shrink: 0 }`; the Staff feed tab's
  rows were squeezed before). Help list has `:duty` and `:onduty`.
- **Repeat counters** ("add counter on right", "same for the feedback bubble", then "counter on top right"):
  - chat `.chat-repeat-count` sits on the bubble's top right, and the reactions box moves to `right: 16px` when a counter
    shows;
  - feedback / notification bubbles got the same badge: `NotificationBubbleItem.count` adds up the bubbles it replaces
    (`useNotification.showSingleBubble`), shown as `.bubble-repeat-count` in `NotificationDefaultBubbleView` (CSS in
    `ChatReactions.scss`).
- Verified live (officialrooms, rooms 521 / 89):
  - effect 102 on duty and still on after a room change; 0 after `:duty` off;
  - `:onduty` text; the settings toggle round-trips;
  - `:ss` x3 gives one bubble "x3"; "hello" x2 gives a chat "x2", both top right.
- Not tested: the report pop-up and the everyone-online bubble (both need a 2nd account); auto duty at login.
- Plugin deployed 22:16; client `index-807f7bf6.js`.
- **Follow-ups (same night):**
  - Staff Settings results ("You're on duty now.", "Staff feed is on.", flag / setting messages) are feedback bubbles,
    not a line inside the window (user: "use bubble instead of in settings").
  - The feedback bubble's "xN" badge sat on the corner, where the next bubble stacked above covered it (user). It now sits
    inside the bubble (top 4px / right 4px). Checked with `elementFromPoint`: the badge's own bubble is on top with 4
    bubbles showing. Note that `elementFromPoint` never returns the badge itself, because it has `pointer-events: none`.
  - Client `index-0bda4369.js`.

## Settings > Options (every "no" command as a switch) + more Staff Settings (2026-09-29, deployed, live-tested)

User: "more features also make for nocommands and room settings allow and all user settings so they dont need to write
the command" ("nocommands" = every command that starts with "no").
- **Player side:** plugin `settings/PlayerSettingsProtocol.java`: IN 9623 = list, IN 9624 = switch one (string key),
  OUT 9625 = n x (key, label, description, command, group, on).
  - Each switch uses the command's own store and gives the same bubble. It only shows when the player has that
    command's permission (`:mutebots` / `:mutepets` have none, so they always show).
  - Switches:

    | Group | Switch | Command | Store |
    |---|---|---|---|
    | Chat | Mentions | `:nomention` | `MentionStore.isOptedOut` |
    | Chat | Reaction and reply bubbles | `:noreactions` | `ChatReactionNotices.isOptedOut` |
    | Chat | My typing bubble | `:nobubble` | `TypingBubbleStore` |
    | Chat | Staff alerts | `:blockalerts` | `HabboStats.blockStaffAlerts` |
    | Room | Bot chat | `:mutebots` | `ignoreBots` |
    | Room | Pet chat | `:mutepets` | `ignorePets` |
    | Room | Event alerts | `:eventsoff` | `EventAlertManager.INSTANCE.isOptedOut` |
    | Looks | My face | `:noface` | `HabboCityCommands.isFaceless` / `toggleFaceless` |

    `toggleFaceless` was split out of `onFacelessCommand`.
  - Client `api/settings/PlayerSettingsProtocol.ts` + `components/user-settings/UserSettingsOptionsView.tsx`, a 4th tab
    "Options" in Settings (the General tab's layout).
  - The tab adds the Presence settings from `useShopSettings`: `:nospawn`, `:noaura`, `:noornaments`, `:noentryspawn`.
    The two Presence checkboxes that had been added to General moved here, so General is back to the reference's 3.
  - A "This room" box points at the room's Permissions tab. Its "Open room settings" button sends
    `RoomSettingsComposer` and only works with rights in the current room.
  - Live: 12 switches in 3 groups; Mentions off gave "Mentions are now off." and flipped back.
- **Staff side:** `StaffDuty.SETTINGS` rows now carry a 4th field, the Staff Settings tab (duty / feed / flags). The
  protocol appends it per setting.
  - Duty tab:
    - "Report pop-ups off duty too" (`off_duty_reports`); report bubbles now go to all online staff by duty state.
  - Staff feed tab, the "How my feed works" section, all through `StaffFeed.deliver`:
    - `hide_own`: a line starting with your own name;
    - `room_only`: a line naming another room "(#id)";
    - `feed_outside` (default on): a bubble when you're not in a room, for `post` and `tell` alike;
    - `security_bubbles` / `new_user_bubbles`: an extra bubble; new users link to `mod-tools/open-user-info/<id>`.
  - Flagged tab:
    - flags now have a reason and an expiry: `hcms_staff_feed_flags.reason` / `expires_at`, added when missing;
      expired rows are removed on the 30s reload;
    - new action `flag` with argument "name|hours|reason". The same name again unflags.
    - `flag_login_alert` (default on): a bubble linking to user info when a player you flagged logs in.
    - The protocol appends each flag's reason and expiry after the message.
  - Expiry select themed: `.form-select` joined the `.form-control` token rule.
- Live (officialrooms, room 521):
  - every tab lists its switches with no squeezed rows;
  - flag Khalil / 24h / "test reason" -> DB row with 86400s and the reason, shown as "ends in 23 h" (then unflagged);
  - "Hide my own actions" hid a `:roomalert` feed line, which showed with the switch off.
- Not tested: feed outside rooms, room only, the security / new-user bubbles, off-duty reports, the flag login alert.
- Plugin deployed 22:48; client `index-c5d76d71.js`.
- **Black screen after Options -> Moderate (user report, fixed):** `useEffect(() => SendMessageComposer(...), [])`
  returns a boolean, and React calls whatever an effect returns as its clean-up. On unmount that threw "destroy is not
  a function" and took the whole app down.
  - Fixed with braces in `UserSettingsOptionsView`, `ModToolsStaffSettingsView` and `ReconnectView.requestTicket`.
  - A grep of every arrow-bodied `useEffect` found no other offenders; the rest return nothing or an unsubscribe.
  - Live: switching Options -> Moderate -> Options -> General -> Options -> Floor, and opening and closing Staff
    Settings, gave no warnings.
  - **Rule: an effect body that calls something returning a value needs braces.**
- **Feed display choice** (user: "set if all shows as bubble or in the room with 34 or both"):
  - two staff settings, `feed_room` (default on) and `feed_bubble` (default off); both off counts as room chat;
  - `StaffFeed.deliver` sends the chat line and/or the notification bubble, and the extra security / new-user /
    outside-room bubble only when no bubble was sent already;
  - Staff Settings > Staff feed shows the pair as one "Show lines as: Room chat / Bubble / Both" choice.
  - Live: each mode showed exactly its chat line / bubble for a `:roomalert`.
  - Plugin 23:06, client `index-e8c63f01.js`.

## Security detection + incidents with one-click actions (2026-09-29, deployed, live-tested)

User: "when detected words, behaviour etc give odd behaviour detected, action needed - fully security detection and
action", then "check plus emu also". Plus pack ideas used:
- `CustomEvents/Filter/AWSFilter.cs`: the anti-advert ladder (warn -> mute -> last warning -> ban within 15 minutes, a
  staff alert with the chat line each time);
- Regelwarnung / Regelmute / Lastwarn: three warning levels with fixed texts plus a staff note;
- LastMessages: a player's last 10 lines.
- **Not** done yet from Plus: its text normalisation (accents, spaces and symbols removed before matching).

**Plugin `security/`:**
- `SecurityGuard`:
  - tables `hcms_security_rules` (rule, label, description, enabled, threshold, window_seconds, severity 1-3,
    suggested, auto_action ''|mute|escalate, auto_value, sort; seeded INSERT IGNORE) and `hcms_security_words` (word,
    category scam/advert/safety/insult/other; 22 seeded once, setting `hcms.security.words_seeded`); both re-read
    every 30s;
  - hit counters in memory per user + rule; staff (the `cmd_hc_stafffeed` permission) are never checked.
  - Rules and their hooks:
    - `flood` / `repeat_message` / `watch_words`: every chat line (`HcmsPlugin.onBotUserTalk`);
    - `wordfilter_repeat`: `onWordFilter`;
    - `denied_commands`: `StaffFeedEvents.onTalk`, every attempt;
    - `room_hopping`: room enter;
    - `trade_burst` / `fresh_trade`: `StaffFeedEconomy`;
    - `banned_ip` / `same_ip`: `StaffFeed.loginSecurity`.
- `Incidents`: table `hcms_security_incidents`.
  - An open incident for the same user + rule counts up (`hits`), and staff are alerted again at most every 10
    minutes.
  - Each alert = an [ALERT] feed line starting with the name, so the hover buttons work: "Name: rule - detail in room.
    Action needed. Suggested: …". It links to `mod-tools/incidents`.
  - Auto actions: `mute` (auto_value seconds) and `escalate` (the Plus ladder; the 24h ban uses an online staff member
    with `cmd_ban` as the stock ban's moderator).
  - Staff actions, each marking the incident and logged `security.incident_<action>` in `hcms_admin_audit_log`:
    - warn / mute (+5 min) / lastwarn, through the stock `ModToolManager.alert`, plus an optional note;
    - kick (`ModToolManager.kick`);
    - ban 24h (`ModToolManager.ban`, needs `cmd_ban`);
    - flag (7 days, with the reason);
    - messages (last 10 lines from `chatlogs_room` into the asker's feed);
    - dismiss / done.
- `SecurityProtocol`: IN 9626 list (boolean open only), IN 9627 action (int id, string action, string note), OUT 9628
  (open count, open-only flag, rows); the open list is pushed to every online staff member on every change.
- Staff feed: new tag `alert` (ALERT, #b91c1c, sort 1, default on) and staff setting `incident_bubbles` (default on:
  ALERT lines always pop as a bubble too).

**Client:**
- `api/security/SecurityProtocol.ts`;
- `ModToolsIncidentsView.tsx`, the first Staff Settings tab "Incidents (n)":
  - Open / Last 7 days;
  - cards with severity label and colour bar, name, "x hits", when, rule, detail, room;
  - Info, Go to, Last messages, a note field, the action buttons (the suggested one outlined), Handled, Dismiss;
  - a ban asks for confirmation;
  - kept mounted but hidden (`hidden` -> `d-none`) so the count stays live.
- `mod-tools/incidents` link opens Staff Settings on that tab.

**hCMS:** Moderation > Security rules (inline edit: on, hits, window, severity, suggested, auto action / value), Watch
words (add / delete, category filter), Security incidents (log, 10s refresh, status / rule filters). Models in
`app/Domain/Security/Models`. All three render with `Livewire::test`.

**Live test:**
- Setup: officialrooms as staff in tab 1; test player user 4 "Habbo" (rank 1) in a 2nd headless tab
  (`/json/new`, `sso=player…`); both in room 521.
- Detections:
  - "free credits" -> Watch word incident;
  - 9 quick lines -> Chat flood at the 8th line;
  - both as ALERT line + bubble;
  - a same-IP incident (both tabs on this machine).
- In the Incidents tab: "INCIDENTS (3)"; "Warn + mute 5m" -> handled + audit row; "Dismiss" -> dismissed + audit row;
  "Last messages" printed the lines; the list updated live.
- Test rows removed afterwards; user 4's ticket cleared.
- Not tested: repeat_message (stock flood control stopped the test player), room hopping, trades, banned IP, the
  escalate ladder, kick, ban.

Plugin 23:24; client `index-e5e8e3b6.js`.

## Research: cosas / Plus security + economy scan (2026-09-29, nothing built yet, suggestions given to the user)

**Extracted (read-only)** to `c:/tools/plugins-reference/cosas-security/`: PrisonSystem-1.jar, NewUserLogin.jar,
BubbleRankLogin.jar, Apollyon (= a camera plugin, not security) and HabboJe RetroPass's source under
`cosas/documents/HabboJe/RetroPass/`. **UnRAR gotcha:** pass the exact path read from `UnRAR lb` output; hand-typed
backslash paths silently extract nothing.
- **PrisonSystem** (Dome / habbo.st):
  - tables for prisons (name, room_id, can_chat, can_command, is_rp) and prisoners (prison, prisoned_by, till,
    reason); `:prison <name> <minutes> <reason>`;
  - overrides RequestRoomLoadEvent + HotelViewEvent (always forwarded back to the prison room, "run_away" alert);
    UserTalkEvent (chat / commands blocked per prison); UserFriendChatEvent (cancelled);
  - PrisonThread counts time down only while online, then home room. RetroPass's `RemovePlayerPrison` deletes from
    `users_prisoned` and sends the player home.
- **NewUserLogin** (ArpyAge): a staff whisper with the new user's name, mail and register IP.
- **BubbleRankLogin** (ArpyAge): table `bubble_rank_login` (rank, message, image); when that rank logs in, everyone
  gets a bubble; `:update_bubble_ranks`.
- **RetroPass** (HabboJe): battle pass, casino (blackjack / roulette), collector park / chips, room buy/sell, bank
  (roleplay), staff duty, global chat, rewards, Among Us.

**Our economy (live DB):**
- catalog_items by points_type:
  - 0 = credits: 56,293 offers, 26,235 with a credit price. But the purse no longer shows credits.
  - 5 = diamonds: 2,651 offers.
  - 102 = **no name, no way to earn**: 123 offers.
  - 104 = NFT Points: 78 offers; nobody holds any.
  - 101 = emeralds: 76 offers.
- Snowflakes (103) are earned but have no catalog use.
- Presence shop: all in Emeralds at flat prices (spawns 500, borders 300, ornaments 150, bubbles 100, names 0-600,
  auras 150-9800, all VIP-only).
- Money: `hcms_citycash_packages` (10 packages, EUR 4.99-149.99 -> 300-12,000 HabboCash). `CitycashController::buy`
  says "payments aren't connected". VIP = 150 HabboCash a month (`hcms_vip_settings`). HabboCash (12) is not in the
  purse (the older sync gap).

## No credits; catalog free except VIP and Rares (2026-09-29, applied live)

User: "i dont want credits anymore", then "catalog all is free except the vip and rares", "staff catalog also free".
Online earning of credits / Diamonds: **0** (the Snowflake payout stays). New accounts' starting money is undecided (the
user first wants to look at other hotels' economies); `users.credits` default 2500 and existing balances are untouched.
- SQL `c:/inetpub/wwwroot/db-backups/catalog_free_20260929.sql`, run with the emulator stopped.
  - Backups: `bak_20260929_catalog_prices` (id, cost_credits, cost_points, points_type of all 59,221 offers),
    `bak_20260929_club_offers`, `bak_20260929_target_offers`, `bak_20260929_economy_settings`.
  - Kept priced, in Diamonds: every offer under VIP (679) and Rares (9966551), plus exchangeable coins
    (CF_/CFC_/DF_/PF_) and limited offers anywhere. Credits and currency 102 were added 1:1 into their Diamond price.
  - Everything else was set to 0 / 0. Then, per the follow-up, the 5 still-priced offers under Staff (7) were made free
    as well: 2 coins, 2 LTD, Mini Habberge Egg.
  - Result: 0 offers with credits, 225 priced offers, all points_type 5. Dragons, for example, are 350.
  - HC club offers: 100 / 240 Diamonds. Targeted offer: 378 Diamonds.
  - Settings: `hotel.auto.credits.enabled` 0, `hotel.auto.points.enabled` 0, `hotel.marketplace.currency` 5.
- Plugin `economy/NoCredits`: a credit-coin redeem (`FurnitureRedeemedEvent` CREDITS; its fields are final) is
  cancelled and redone the stock way, paying Diamonds; a bubble "You got N Diamonds.".
- Verified: after the restart a real purchase (Phi, "Autumn Fallen Leaves") logged at 0 / 0 and went through.
- **Open risk:** the Staff tab's coins are now free, so staff (rank 7+) could redeem them into free Diamonds (up to
  5000 per coin).
- Emulator restarted 23:5x.

## The daily loop: online payouts, 7-day login calendar + streak, online chest (2026-09-30, deployed, live-tested)

User: "diamonds auto earn also and bind in emeralds, full gameplay that makes it fun, addictive, come back, log in
daily". Chosen:
- Diamonds for everyone: 1 per 10 minutes, max 15 a day;
- Emeralds: 2 per 10 minutes, max 60 a day;
- VIP (rank >= 2) gets x2 on both the amount and the cap;
- build order: this loop first.

**Plugin `engagement/`:**
- `Engagement`:
  - a 1-minute tick counts minutes in a room (not idle) per player, pays out every `payout_minutes`, and moves the
    chest (ready after `chest_minutes`, max `chest_max` a day);
  - tables: `hcms_engagement_settings` (every number, re-read every minute), `hcms_login_calendar` (day 1-6 Emeralds
    10/15/20/25/30/40, day 7 5 Diamonds), `hcms_chest_rewards` (weighted: Emeralds 5-10 55, 15-25 25, Diamonds 1-2 15,
    Diamonds 5 5), `hcms_engagement_daily` (per user + UTC day, so a relog keeps the caps).
- `LoginStreak` (table `hcms_login_streaks`), 4s after login:
  - +1 the day after, freezes cover missed days, else back to 1;
  - VIP: one free freeze a week (max 3);
  - away >= 3 days: 25 Emeralds welcome back;
  - Frank's summary bubble (link `engagement/daily`);
  - claim = today's calendar day (once, guarded in SQL); a freeze costs 10 Diamonds.
- `Wallet.give`: stock `givePoints` + a row in `hcms_economy_transactions` (reasons online.payout / daily.reward /
  chest.open / chest.skip / streak.freeze / welcome.back).
- `EngagementProtocol`: IN 9629 state, IN 9630 action (claim | chest | chest_skip | freeze), OUT 9631 state. Pushed on
  every change and every 5 minutes online.

**Client:**
- `api/engagement/EngagementProtocol.ts`;
- `components/engagement/EngagementView.tsx`:
  - `EngagementView` (MainView, always mounted): opens the "Daily reward" window once a day while the reward waits;
    the window has 7 day tiles, claim, freezes, and today's online earnings vs caps;
  - `OnlineChestView` in `RightSideView` under the purse: the mystery box tracker's `.nitro-notification-bubble`
    card, collapsible; progress bar; Open / "Open now (5 Diamonds)";
  - links `engagement/daily`, `engagement/chest`.
- `EngagementView.scss` uses the theme tokens.

**Live:**
- on login the window popped up and Frank said "Day 1 streak · daily reward waiting: 10 Emeralds · next chest in 30
  min";
- claim -> "Day 1: you got 10 Emeralds!" + a ledger row;
- "Open now" with 0 Diamonds -> "You need 5 Diamonds…".
- Not yet seen: a real 10-minute payout, a ready chest, the day-2 streak, a freeze covering a gap.

Plugin 00:06; client `index-a3af3692.js`.

**Next (user order):**
1. daily quests (existing `hcms_quests`);
2. Staff login PIN (a card like the reconnect card);
3. Prison;
4. login bubbles (rank);
5. Snowflake shop;
6. economy dashboard;
7. limited drops;
8. Premium HabboPass;
9. then the full audit (Claude project page).

Also to research: the fish farm, the lotto with several tickets, and cosas's economy (CMS + UI + gameplay; the user can
provide the database).

## Daily quests deployed, reconnect login timeout, Presence loader + aura tier badge, backups (2026-09-30)

- **Daily quests** (next item on the daily-loop list) had already been written by the previous session but were **not
  in this file and not deployed**: plugin `engagement/DailyQuests.java` (pool `hcms_daily_quest_pool`, 10 keys: chat,
  rooms, online, respect_give, respect_get, place, look, motto, trade, chest; per player+UTC day `hcms_daily_quests`
  (3 slots) and `hcms_daily_quest_days` (swaps, bonus_paid); settings `quest_bonus_diamonds` 5, `quest_swap_price` 3,
  `quest_swaps` 3 in `hcms_engagement_settings`; paid via `Wallet.give` reason `quest.daily` / `quest.daily_bonus` /
  `quest.swap`), sent at the end of OUT 9631, swap = IN 9630 action `swap:<slot>`. Client: Quests tab in the Daily
  reward window + "📜 Quests n / 3" on the chest card, link `engagement/quests`. The quest definitions are a separate
  pool, not `hcms_quests` (those stay the season-long HabboPass/winwin quests driven from PHP).
  - Fixed this session: the look / motto / place / respect / chat hooks now only count once the event is final
    (`HcmsPlugin.counted()`: re-checks `isCancelled()` 50ms later, because core ignores `@EventHandler` priority, so a
    room-settings or football-gate handler could cancel after ours ran); a swapped-in "rooms" quest forgets today's
    visited rooms (else rooms already visited never count). `hcms.stafffeed.bubble` is now registered (was logging
    "Config key not found" on every feed line).
  - Deployed (2 plugin restarts, 03:02 / 03:09). **Verified live** (officialrooms, room 521): 21 chat lines ->
    "Quest done: Chat 20 times! +10 Emeralds.", window + chest card updated at once, `hcms_economy_transactions` row;
    free VIP swap -> "New quest: Visit 5 different rooms (free VIP swap).", next swap priced 3 💎, swaps row = 1.
    Not tested: the all-3 bonus, the other quest keys.
  - **User rule (2026-09-30): "dont change the emulator"** - given mid-session after the plugin restarts. Ask before
    any further emulator/plugin change or restart.
- **Reconnect hang after an emulator restart (found while testing):** the emulator opens its websocket port early in
  its boot and silently drops a login sent then, while its pings keep the socket alive, so the 90s receive timeout
  never fires and the client sat on "Reconnecting..." forever (seen live with a recorded event list: CLOSED ... 
  ESTABLISHED, HANDSHAKING, never AUTHENTICATED; the `rc-` ticket was still valid in the DB). Renderer patch 6
  `.yarn/patches/@nitrots-nitro-renderer-patch-1a26008291.patch` (SocketConnection): a socket not logged in within
  `LOGIN_TIMEOUT_MS` (15s) is replaced with `forceReconnect()` (not counted as a refused ticket). `EngagementView` now
  re-requests its state on every `CONNECTION_AUTHENTICATED` (it kept the old server's state). **Not yet verified with
  a real restart** (the user asked not to touch the emulator). Gotcha: `yarn patch <locator> --update` needs the
  exact `resolution:` string from yarn.lock, and extracting takes ~2 min, `yarn install` ~4 min.
- **Presence loader** (user: "not the blue banner and ..., it's the hCMS website loader"): the loading state was a blue
  `.center-empty` box with "…". It is now the website Center's `.sub-section-loader > .sub-section-loader-content >
  .sub-section-spinner` (the hCMS logo `/assets/img/loader/logo_loader_black.png` spinning 0.6s, from `_center.css`),
  image via `url.prefix` (`--center-loader`), rules scoped in `ShopView.scss`. Verified in the dev client: 62x60
  spinner, image loads, gone once the data arrives.
- **Aura badge** (user: every aura says VIP top right while the name line says Basic): `ShopItemFlags` got optional
  `label` / `labelClass`; aura cards show their tier there (`tier.*` shop texts, upper case; Basic #7F7F7F, VIP gold as
  before, Limited #E65B00). All auras are still `vip_only = 1` (the buy check is unchanged).
- Client deployed `index-51e0429b.js`, then `index-f2394ff9.js` (adds the aura tier badge and the removal below).
- **Room-entry "Discussions in Habbo rooms may be monitored" bubble removed** (user): it was stock Nitro client code
  (`useNotification` showed `mod.chatdisclaimer` on the first `RoomEnterEvent`), not the emulator; handler deleted.
- **"Last login" bubble (user asked to find it in the Plus pack / HabboCM):** HabboCM (`emu/emulator.sql`, 57 plugins)
  has none. The Plus pack's `HabboVIN Emulator/Habbo/HabboHotel/GameClients/GameClient.cs` line 209 sends on every
  login `RoomNotificationComposer.SendBubble("last_success_login", "Your last successful Login was at <last_online
  +2h> o'clock.")`; its welcome MOTD (line 271, `welcome_message`) is commented out; lines 287/316 = a daily
  "flame" login bubble. **Built after the user's go-ahead ("do it now")**: plugin `activity/LastLoginNotice.java` reads
  the previous session's `login_at` from `hcms_session_log` before `recordLogin` writes the new row, and 5s after login
  sends an INFO bubble "Your last login was <3 days ago / yesterday / N hours ago> (<Tue 29 Sep, 23:14> hotel time)."
  (nothing on a first login; setting `hcms.lastlogin.enabled` 1). Deployed with a restart the user approved ("yes"
  after a first attempt was refused by the permission check). **Verified live**: a forced re-login showed "Your last
  login was 2 minutes ago (Wed 30 Sep, 09:26 hotel time)." with `feedback_info.png`. The same restart verified the
  reconnect: the headless tab went CLOSED -> ERROR -> ESTABLISHED -> AUTHENTICATED about 23s after the emulator stopped
  and the card closed (this time the first open already logged in, so the 15s login timeout itself wasn't needed).
- **Retro bible doc** (Claude Doc "Habbo.nz Feature, Gameplay & Economy Bible",
  https://claude.ai/code/artifact/16a1fab7-5e77-4fc8-96bc-0610b3d47c69): section 1 (current system audit) written;
  **all 18 sections written 2026-09-30** (4 = HabboCM, habbo.st, Habboon, MetroHotel; habbo.st's public GitBook
  `https://habbo.gitbook.io/habbo.st/llms.txt` + `<page>.md` documents fishing, mine, vault, arena, crafting, Rarecoins,
  rare rotation, lottery, battle pass, store tiers with prices). Recommended build order (section 17): economy dashboard
  -> market fee/limits/price stats -> Snowflake seasonal shop -> season pass in the client -> event league + tickets ->
  autogame arena -> fishing/mining -> crafting + LTD calendar; payments in parallel. Open question left as a doc comment:
  keep Emeralds untradable / never convertible to Diamonds? Debug Chrome started at user request: `chrome.exe --remote-debugging-port=9222
  --user-data-dir=C:\Tools\chrome-debug-profile https://habbocity.fr/hotel` (logged in as xPhi, passes Cloudflare).
  Reader: scratchpad `hc-read.js <url> <out.json>` opens a page in a NEW tab (keeps the hotel tab), saves text + links,
  closes it; saved pages in the 2026-09-30 session scratchpad `hc/` (Center + all sub-pages, CityPass, 4 rankings,
  organisations, CGU, 6 articles). Key facts: CityCash 12 packs EUR 4.99-249.99 -> converts to Diamonds or Emeralds;
  VIP 150 CityCash (perks list on /center/vip); Center market 15 sales/day (VIP 50); values show two figures at a
  fixed 1:200 ratio (unit of the first unnamed); gambling allowed only staff-approved, 18+ (CGU art. 4).
- **Backups before the planned "shop and Center as one" merge:** `db-backups/hcms-before-shop-center-merge-20260930-0326.sql`
  (full DB) and `db-backups/hcms-code-before-shop-center-merge-20260930-0326.tar.gz` (hCMS without vendor, node_modules,
  public/cdn, logs). hCMS git's last commit is 2026-09-25 with 63 files uncommitted.
- Queued by the user: merge the shop (Presence) and the website Center into one ("I want to sell it after"); a full
  retro feature + economy research bible (being written as a Claude Doc); a new reference pack at
  `c:/inetpub/wwwroot/HabboCM` (not read yet).

## Admin panel audit + Rare rotation (2026-09-30, hCMS side; full write-up in hCMS/CLAUDE.md)

- Every admin resource and page renders (Livewire test as user 1).
- The rare registry pointed at the wrong catalog pages since the 2026-09-20 catalog swap; re-pointed to the Rares tab,
  9 non-rares removed (206 rares). New catalog pages Rares > "Rare of the Week" (9967775) and "Past Rares" (9967776,
  hidden).
- New Admin > Rare Economy > Rare rotation: staff pick furni + confirm a suggested price + dates; `hcms:rare-rotations`
  (every minute) puts the offer on Rare of the Week, registers it in the economy Center, announces it hotel-wide
  (bubble opens the catalog page), moves it to Past Rares at the end or on sell-out; in-game marketplace sales now move
  rare values too. No emulator change (catalog reload via RCON `updatecatalog`).
- Same day: tier start prices set (flatter ladder, S = Soon has none), smarter price suggestion (scarcity, rotation
  length, market median), and **Admin > Rare Economy > LTD drops** (monthly LTD page 9967777, first-Sunday default,
  24-hour teaser bubble). All in hCMS; details in hCMS/CLAUDE.md.
- Same day: CityBox renamed HabboBox (text, catalog pages, box furni) and the ~70 "... City" catalog pages renamed
  (City dropped; Habbo Furni / Habbo Town / Habboween). **HabboBoxes now open in the game** (plugin
  `boxes/HabboBoxes.java`, double-click your own box; deployed with a restart 13:40, verified live) and sell for 180
  Diamonds each (were 3-5); admin helpers Fill drop chances / Use suggested price / Sell in catalog. Emeralds stay
  untradable (user agreed). Details in hCMS/CLAUDE.md.
- Same day: **Admin > Economy > Economy dashboard** (created vs destroyed per currency, sources/sinks, daily history
  with an "untracked" column for stock-emulator money, nightly `hcms:economy-snapshot`).

## Staff login PIN (2026-09-30, deployed + verified)

User's choices: Moderator and up (rank level >= 5), asked once per 12 h per IP, plugin change + restart OK.
- **Why the rank is not dropped while locked:** `HabboInfo.run()` saves `users.rank` on logout AND on in-game balance
  changes, so an in-memory rank change could land in the DB. Instead the plugin (`staffpin/StaffPin.java`) keeps a
  lock set and: refuses commands a Member (rank 1) couldn't use (`UserExecuteCommandEvent`), cancels Mod Tools packets
  and our staff packets (Furni Editor 9569-9588, Administration + Presence give 9603-9610, staff feed / settings /
  security 9620-9628, bots panel 9546-9550) via `PacketManager.registerCallable`, sends the client a
  UserPermissionsComposer with level 1 so staff UI hides, and `StaffFeed.deliver` skips locked accounts.
- PIN = set on the website (hCMS Settings, section shown to rank 5+, password required, 4-8 digits, no rows / repeats;
  `SetStaffPinAction`, route POST /settings/staff-pin throttled 10/min) as `hcms_staff_pins.pin_hash =
  pbkdf2_sha256$100000$salt$hash` (base64), verified the same way in Java (PBKDF2WithHmacSHA256). A correct PIN writes
  `hcms_staff_pin_trust` (user, ip, expires +12 h; `hcms.staffpin.trust_hours`); a new PIN clears the trust rows.
  3 wrong PINs = disconnect + [SECURITY] staff feed line; unlock also posts one. IN 9632 verify(string, "" = state),
  OUT 9633 state(locked, hasPin, attemptsLeft, message). Settings `hcms.staffpin.min_rank` 5.
- Client: `api/staffpin/StaffPinProtocol.ts`, `components/staffpin/StaffPinView.tsx` (+ .scss, theme tokens; mounted
  in MainView), closable, reopened with `:pin` / `:staffpin` (link `staffpin/open`); no-PIN state links to Settings.
- Verified live (officialrooms with a temporary test PIN, since removed): card after login, wrong PIN "2 tries left",
  right PIN unlocks + trust row + feed line, relocked after removing trust: `:roomalert` -> "Enter your staff PIN
  first.", client security level 1. Website action: wrong password refused first, rank 1 refused.
- **Changing the PIN needs the current PIN** (user: a stolen password alone must not be enough; user chose "old PIN
  only" over requiring 2FA): the first PIN needs only the account password, a change needs password + current PIN
  (`SetStaffPinAction::matches()` verifies the PBKDF2 hash in PHP); a wrong current PIN is audited
  (`staff.pin_change_failed`, so it shows in the staff feed). Forgotten PIN: Admin > Players > Staff actions > **Reset
  staff PIN** (administrators, reason required, audited `staff.pin_reset`, clears the trust rows); the staff member
  then sets a new one. Known weakness (accepted by the user): someone with the password can set the FIRST PIN before
  the real owner does, so staff should set theirs now. Tested: first PIN saved, change without / with wrong current
  PIN refused, with the right one saved.
- **Follow-ups the same evening (deployed: plugin restart 21:50, client `index-c5c6ec84.js`):**
  - The card is now a **full blocking overlay** like the reconnect card (`.staff-pin-overlay`, no close button, not
    draggable; user: "admin shouldn't be able to do anything before"); `:pin` still reopens it if needed.
  - **Set the first PIN in the client** (user): with no PIN the card shows a "Set a staff PIN" form (PIN twice, same
    rules as the website); IN **9634** set(pin, confirm), only while locked and without a PIN (changes stay on the
    website with the current PIN); stored in the same PBKDF2 format, audited `staff.pin_set` `{"source":"game"}`;
    then the card asks for the PIN once and unlocks.
  - **Rank changes apply at once**: `StaffPin.onRankChanged` from `UserRankChangedEvent` (in-game :giverank / RCON)
    and from `PlayerRefresh.rank()` (website rank change): promoted to 5+ = locked + card immediately, demoted = card
    gone. Verified live with the test player: promote to 5 -> set-PIN card within seconds, demote to 1 -> gone.
  - Phi has set a PIN (seen in hcms_staff_pins); officialrooms' test PIN was removed again.
- **Nobody has a PIN yet** (superseded: see above), so Phi and officialrooms are locked in the game until they set one under Settings on the
  website (the website admin panel is unaffected). Client deployed `index-f3ddb00d.js`, plugin restart 21:04.
- Known gap: room-owner level staff rights inside rooms (e.g. `acc_anyroomowner` for placing furni / kicking via room
  tools) still come from the real rank while locked; the lock covers commands, Mod Tools and our staff windows.

## Daily loop fixes + Habbo icons (2026-09-30)

- **Chest countdown restarted on every reload** (user report): `Engagement` kept "minutes toward the next payout" and
  "minutes toward the chest" only in memory and dropped them on logout. Now `hcms_engagement_daily.payout_progress` /
  `chest_progress` (added by the plugin with `ADD COLUMN IF NOT EXISTS`) are saved and loaded, and the counters are
  saved **every minute** (was every 5) so even an emulator stop loses nothing; a normal logout always saved the exact
  value.
- **No emoji, Habbo icons** (user, standing rule - memory `feedback_habbo_icons_not_emoji`): Daily reward window and
  chest card use habbo.st's flame (their Flammen icon, from the Plus pack), Habbo's gift box, the quest scroll
  (bundled in `src/assets/images/engagement/`, pixelated `.engagement-icon`), `LayoutCurrencyIcon` for Diamonds and
  `icon icon-pf-tick` for done; the server's "Day N streak" bubble lost its emoji.
- `src/react-app-env.d.ts` now declares `*.png` / `*.gif` / `*.jpg` modules: tsc went from 69 to 49 errors (the old
  image-import errors are gone too).

## Presence lag, Staff Tools (Player tab, feed card), staff-only links (2026-09-30)

- **Presence lag** (user: "if open shop it's lagging hard"). Measured in the headless client (scratchpad `perf2.js`):
  with Presence open the client fell from 60 fps to 0.2-4 fps; removing the window from the DOM brought 60 back.
  Causes found: the `.shiny-bg` card shine (blur filters + mix-blend-mode + an endless animation), the reference card's
  `filter: drop-shadow` over animated content, and the shared `LayoutRoomPreviewerView` encoding a PNG data URL on every
  changed frame (animated auras change every frame). A fix for all three was deployed, then **reverted at the user's
  word: only the shine was removed** (`ShopShine.tsx` and its CSS deleted). User confirmed "now it's not lagging
  anymore" (live `index-7fb481e8.js`). Gotcha: in the headless swiftshader browser any animation at all (even a 20px
  moving square) drops to ~9 fps, so judge by long tasks / profiles there, not fps.
- **Staff Settings is now "Staff Tools"** (window title, Mod Tools button, `:stafftools`; `:staffsettings` still works).
  Tabs: Incidents, **Player**, Duty, Staff feed, Flagged.
  - Player (user: "same like incidents but I choose my own user"): `ModToolsPlayerView.tsx`, protocol
    `api/security/PlayerToolsProtocol.ts` <-> plugin `security/PlayerToolsProtocol.java`: IN 9635 look up (name), IN 9636
    action (name, action, note), OUT 9637 card (found, id, name, look, online, rank name, room, flagged by me, open
    incidents, last 5 incidents, message). Buttons as on an incident: Info, Go to, Last messages, Refresh, note, Warn,
    Warn + mute 5m, Last warning, Kick, Ban 24h, Flag/Unflag. Server: `Incidents.actOn` is now shared by incidents and
    `Incidents.actOnPlayer` (audit `staff.player_<action>`); can't act on yourself; results as feedback bubbles.
  - **Flag from an incident now updates the Flagged tab at once**: after any flag the server sends the Staff Tools
    state (`StaffFeedProtocol.sendState`).
  - **Staff feed card** (user: "staff feed only shown in a card, when opened it shows all"): `StaffFeedCardView.tsx`
    (always mounted in ModToolsView to collect lines) + `api/stafffeed/StaffFeedCardStore.ts` (last 300 lines, unread
    count). Every delivered feed line also goes out as OUT 9638 (tag, label, text, time, link); opening the card loads
    the log's last 100 lines once (IN 9639 / OUT 9640, visible tags only, never others' WATCH lines). Tag filter, search,
    Pause/Resume, Clear, the chat line's hover buttons, click a line = its link. New staff setting `feed_card`: Staff
    feed tab "Show lines as" = Room chat / Bubble / Both / **Card only** (no chat lines or bubbles) + "Open the Staff
    feed card". Opened with `:feed` (with a tag `:feed` still goes to the server command) or link `mod-tools/feed-card`.
    Unread count on the toolbar's Mod Tools icon while the card is closed.
  - **Normal users could open Staff Settings** through the link / `:staffsettings` (only the button was gated): the
    `staff-settings`, `incidents` and `feed-card` links, the window render and the chat commands now need
    securityLevel >= 4. The server already refused the packets; 9635/9636/9639 were added to the staff PIN's blocked list.
- Deployed: plugin restart 23:10 (boot "PlayerToolsProtocol (9635-9637), StaffFeed card (9638-9640)"), client
  `index-88a9ee74.js`.
- **Feed card History tab** (user: "I need the staff feed history, that's what I meant with card"; and "a staff member
  who doesn't want bubbles or chat just opens that and gets it there" = Card only). The card now has tabs **Live** (as
  above) and **History** (`StaffFeedHistoryView.tsx`): the whole `hcms_staff_feed_log` searched on the server, 60 lines
  a page, filtered by tag and text (LIKE, escaped, max 60 chars), grouped by day (Today / Yesterday / date), "Load
  older" pages back by log id. IN 9641 (tag, search, beforeId) / OUT 9642 (the tags you may see, rows with log id, more,
  beforeId echo); tags = visible for the rank, never WATCH. `StaffFeed.history(habbo, tag, search, beforeId, limit)`;
  9641 is on the staff PIN block list. Lines in both tabs use `StaffFeedLineView.tsx` (same styling and hover buttons).
  Deployed: plugin restart 23:19, client `index-b6e25714.js`. Not yet click-tested live.
- **Presence result text removed from the window** (user: "all clean"): the result ("Soft Glow is yours!") sat in
  `.center-content-wrapper`, a flex row, so it became a whole left column. Results are now always a feedback bubble
  (`showFeedback`, also the client-only "Use" of a bubble); the `.shop-result` element and CSS are gone. Client
  `index-307b833f.js`. `tsc` 49 (unchanged). **Not yet click-tested live**: Player tab actions, the feed card, Card only.

## Prison, staff commands removed, Staff Tools v2 (Home), security modes (2026-10-01)

User asked for prison (check HabboCM + habbo.st), removing staff commands that have buttons, a cleaner Staff Tools with a
Home tab, duty that works with the rest, feed display as multi-select, important things always shown, and security modes
with auto-bans (answers: remove the commands; rank 7+ switches the mode in game and on the website).

- **References:** HabboCM uses the Dome `PrisonSystem-1.jar` (table `users_prisoned`: prison_id, reason, prisoned_till =
  seconds left, prisoned_by; texts run_away / cant_enter / time_left; staff gave 1-3 h for trolls). habbo.st GitBook
  (saved in the session scratchpad `st2/`): Adminprison (can't leave the room, reminder every 30 s, the room is told,
  after a relog you sit out the rest), Checkpoint Prison (walk N checkpoints; not built), tradeban, report/guard voting,
  hotel ban, ban-evasion rules.
- **Prison** (plugin `prison/Prison.java` + `PrisonProtocol.java`; tables `hcms_prisons`, `hcms_prison_sentences`):
  sentence from the Players card (`PlayerToolsActionComposer` action `prison:<minutes>:<prisonId>`, note = reason; a
  second sentence adds time), release from the card or the prisoners list. `registerCallable` on RequestRoomLoad (2312)
  and HotelView (105): a prisoner going anywhere else is cancelled + ForwardToRoomComposer back ("You haven't served your
  time yet"), entering the prison itself uses `enterRoom(..., overrideChecks)`; non-staff can't enter a prison room.
  10 s clock only for online prisoners (saved every tick), a bubble every 30 s, served = home room / hotel view. Per prison
  can_chat / can_commands; private messages always blocked (UserFriendChatEvent). Audit `staff.prison`,
  `staff.prison_extend`, `staff.prison_release`, `staff.prison_room_added/removed`; MODERATION feed lines.
  `Prison.systemSentence` = security modes' auto-prison (first prison room, sent by "Security"). IN 9643 state / IN 9644
  action (release, add_here, remove, chat, commands; rooms need rank 7+) / OUT 9645 state (pushed to all staff). The
  player card got the prison fields + prison list at its end. 9643/9644 on the PIN block list.
- **Commands removed:** `:stafffeed/:feed/:sf`, `:duty/:adminduty/:admduty` (plugin defs gone), client `:stafftools/
  :staffsettings`, `:feed`, `:pin/:staffpin` and their help entries. `:onduty` (players) stays.
- **Staff Tools v2** (`ModToolsStaffSettingsView.tsx`): tabs **Home / Incidents / Players / Settings**.
  Home: duty box (go on/off duty), hotel security mode (switch buttons for rank 7+), three numbers that open their tab
  (open incidents, prisoners, feed on/off -> card), staff on duty (click = Players), shortcuts with a line each
  (Incidents, Find a Habbo, Staff feed card, Reports, This room, Room chatlog). Players (`ModToolsPlayerView.tsx`):
  lookup card + prison controls, In prison list, Flagged by you, Prison rooms (admins: "Use the room I'm in", chat /
  commands switches, remove); names elsewhere open the card here (`lookupRequest`). Settings: duty switches, feed on/off,
  "Show feed lines in" checkboxes (Room chat / Bubble / Staff feed card, any mix, none = card), feed behaviour, tags
  (ALERT always on). Results everywhere are feedback bubbles.
- **Duty works with the rest:** going on duty turns the feed on and tells you how many incidents need action (bubble
  -> Incidents). Incidents have **"I'm on it" / "Let go"** (claim, `claimed_by/claimed_name` columns, shown to all staff,
  a STAFF feed line), so two staff don't act on the same incident.
- **Always shown:** `[ALERT]` lines reach every staff member (even with the feed off or the tag muted), always go into
  the card and always pop up as a bubble. The `incident_bubbles` setting was removed; `feed_card` is now "In the Staff
  feed card" (default on) instead of "card only"; `feed_outside` only applies when Room chat is ticked.
- **Security modes** (`SecurityGuard`: `hcms.security.mode` normal|strict|safest, re-read every 30 s; columns
  `strict_action/value`, `safest_action/value`, seeded once via `hcms.security.modes_seeded`): Strict = hits needed x0.75
  + strict action, Safest = x0.5 + safest action; empty falls back to the milder one. New actions kick, ban (hours, own
  `bans` insert, no staff needed), prison (minutes), block (disconnect). New rule `scam_words` (scam/advert watch words;
  other categories stay `watch_words`). Seeds: flood mute 60/300 s, repeat mute 60/120 s, wordfilter escalate, watch
  words -/mute 300 s, scam words escalate/ban 24 h, denied commands -/kick, room hopping -/kick, banned IP block/ban 24 h.
  Switch: in game Staff Tools > Home (admins, via SecurityIncidentActionComposer(0, 'mode:<x>'), audit `security.mode`,
  ALERT line) and website Moderation > Security rules header button (+ the Strict / Safest columns).
- Deployed: plugin restarts 23:54 and 00:01, client `index-1dacea34.js`; the website page renders (Livewire test).
  `tsc` 49. **Not yet tested live in game:** sending someone to prison / relog / leaving, Home, claim, the modes' auto
  actions.

## Players card: reset sanctions, chatlog evidence, trade ban, last trades, staff notes; aura preview (2026-10-01)

All on the Staff Tools > Players card (server `security/PlayerToolsProtocol.java`; every new card field is appended at
the end and read by the client only if present, in this order: sanctions, trade ban + trades, notes, chat lines).
- **Reset sanctions** (action `reset_sanctions`, `Incidents.resetSanctions`): deletes the stock `sanctions` rows (levels,
  probation, trade lock, mute behind "My sanction status"; they are read fresh at login, no cache), sets
  `users_settings.can_trade='1', mute_end_timestamp=0`, unmutes / allows trading online, forgets the escalate strikes.
  Bans and prison stay. Audit `staff.sanctions_reset`. The card shows "Sanction level N (x sanctions)".
- **Chatlog evidence** (user: "staff add chatlogs of the user as additional reason"): the card lists the Habbo's last 20
  `chatlogs_room` lines with checkboxes (max 10). `PlayerToolsActionComposer` got a 4th string = ticked line ids; the
  server only keeps lines that are that Habbo's own (`user_from_id` check). Warn / mute / last warning / kick alerts show
  them ("Because of what you wrote: ..."); ban / prison / trade ban reasons get "[chatlog attached]"; every sanction with
  evidence writes an audit row `staff.evidence` with the lines (id, time, room, message).
- **Trade ban** (`security/TradeBan.java`, table `hcms_trade_bans`, habbo.st's Tradeban): action `tradeban:<hours>`
  (1 h - 30 days in the UI, max 90 days), `tradeban_lift`. Uses the stock trade switch (`HabboStats.allowTrade` +
  `users_settings.can_trade`, already checked by TradeStartEvent) but its own one-minute clock, because the stock trade
  lock only expires at login; a running ban is re-applied 2 s after login. Audit `staff.tradeban(_lifted)`.
- **Last trades**: the last 5 from `room_trade_log` with the partner and what each side gave (`room_trade_log_items` ->
  `items` -> `items_base.public_name`, max 3 names each).
- **Shared staff notes** (user: "smart tools ... work together"): table `hcms_staff_notes`, action `note` (the note field
  is the text), last 5 on the card for every staff member, a STAFF feed line.
- **Aura preview "dark"**: all auras are VIP-only, and a locked card (viewer not VIP) had
  `.is-locked .shop-aura-card-preview { opacity: 0.6 }`, which on the dark card looked dark. Removed; a locked card now
  shows a gold "VIP only" label instead of the pale disabled button (colour rule).
- Deployed: plugin restart 00:40, client `index-ebdb5b86.js`. `tsc` 49. Not yet tested live in game.

## Staff Tools icons, Today card, quest research (2026-09-30 / 10-01)

- Staff Tools icons from our own CDN: `cdn/c_images/stafftools/tag_*.png` (feed tags) and `short_*.png` (Home
  shortcuts), all 32x32 (script scratchpad `staff_icons.py`); ui-config `staff-tools.icon.url`. Feed tag icon 16x16,
  Staff Tools icons 32x32 pixelated. New feedback kinds prison / trade_ban / sanctions / staff_note / duty in
  hcms-feedback, `CommandFeedback.Kind` and the client (`FeedbackKind.ts`, wording rules first). Plugins + hcms-feedback
  deployed ~01:0x.
- Chest card renamed **Today** (`OnlineChestView` in EngagementView.tsx): rows Chest / Streak / Quests / online earnings,
  collapsed summary; `HabboIcon` is a fixed-size box; the action result shows once, under the Today title, with its
  feedback icon (removed from the Daily reward window). Client `index-11b5fbc1.js`.
- `'you need'` added to the client's error wording rule (not deployed yet).
- Quest research: Arcturus core has no quest system, but the Nitro renderer has the full Habbo quest protocol
  (GetQuests / Accept / Activate / Cancel / Reject / GetDailyQuest / GetSeasonalQuestsOnly / OpenQuestTracker composers;
  Quests / Quest / QuestCompleted / QuestCancelled / QuestDaily / SeasonalQuests events). `QuestMessageData` carries
  campaignCode, completed/total in campaign, **activityPointType + rewardCurrencyAmount** (so Emerald/Diamond rewards
  are native), steps, catalogPageName. Achievements table: 76 achievements / 732 levels, every reward_type 0
  (duckets, 5-100), `points` = achievement score. Proposal given to the user (quests on the Habbo protocol in the plugin,
  seasonal pass XP); nothing built.

## Open report (2026-10-01): Presence prices + VIP buttons, moderation/chest icons, Staff Tools chatlog height

User: "the features are expensive also in shop the buttons are broken for vip also icons are wrong for moderation and
chest please fix all and check all also chatlog height broken in stafftools". **Investigation only so far, nothing
changed in code or data:**
- Presence prices (live `shop_*` tables, Emeralds): auras 51 (basic 150-2800, vip 340-4600, ltd 900-9800, average
  3127), spawns 400-500, borders 300, ornaments 150, bubbles 100. A free player earns about 60-100 Emeralds a day
  (online cap 60 + calendar/quests/chests), VIP about double, so an average aura is a month of play.
- VIP buttons: opened Presence in the headless client (port 9223) as test account Kasper (id 5). Every aura card showed
  the "VIP members only." label because `VipSyncScheduler` put Kasper back to rank 1 within the minute (no
  `hcms_vip_memberships` row), so this test did NOT reproduce what the user sees as VIP. Next: test with a real
  membership row (or ask the user which button / which account). Test data removed again (currency rows, ticket).
- Moderation / chest icons and the Staff Tools > Players chatlog evidence list height: not looked at yet.
- Gotcha: `CreateLinkEvent` lives in `src/api/nitro/CreateLinkEvent.ts` (importing it from CDP works and opens windows).

## HabboPie reference client at play.habbo.nz/pie.html (2026-10-01, partly working)

User: "run habbopie's js file so we can enter the client and see it with play.habbo.nz/pie.html?sso=". Their saved
bundle (scratchpad of session 1a913d4e `pie/`: `index-cc627c03.js`, `vendor-0d29fbcf.js`, `index.css`, configs)
copied to `hCMS/public/cdn/client/pie/` (`assets/`, `src/assets/index.css`, `ui-config.json` = theirs with our
URL keys merged in and their radio/voice-upload URLs blanked, `renderer-config.json` = ours + `socket.urls` array,
which their fork reads instead of `socket.url`) and `pie.html` (noindex, their bundle, our configs, `?sso=` like ours,
no Vue `/websocket` overlay). `deploy.ps1` robocopy now has `/XF pie.html /XD pie`, so `yarn deploy` keeps them.
**Works (2026-10-01):** the real cause was not renumbered packets (their ID table = stock: 2491 login OK, 1450,
340, 2875, 411...) but their "Login OK" (2491) parser (`oh0`), which reads a banner list (int count, count x string,
string active) that stock Arcturus doesn't send. `pie.html` now wraps `window.WebSocket` and appends `int 0 + string ""`
to an empty 2491 (frames are split by int32 length + short header; Blob/ArrayBuffer both handled, order kept). After
that the client logs in and shows its toolbar. Left over: one more "Error parsing message" (packet not identified),
their banner API fetch fails (it calls their own website), some unhandled promise errors. Emulator untouched.
Older notes: with `socket.urls` also set in `pie.html`'s NitroConfig (plus their debug logging) the socket opens
and our emulator accepts the login (log: "Kasper logged in"), but the client stays at 60%: almost every packet our
emulator sends shows as `IncomingMessage <id> UNREGISTERED` (2875, 340, 1450, 3738, 411...) and the first one fails to
parse. HabboPie's renderer fork uses its own incoming header numbers, so it can't read stock Arcturus packets. Making it
enter needs a header map (theirs <-> ours), not a config fix. Earlier status: the bundle loads; the login did NOT finish in the headless test ("Failed to select WebSocket URL ... reading
'map'" = `socket.urls` read as null, most likely a cached config from before the fix). A cache-bust test was blocked
by the permission check; not resolved. Missing images (their summer loading screen) 404, harmless.

## Purse = HabboPie's purse 1:1 (2026-10-01, dev only, not deployed)

User: "backup our ui, I want the purse added from them", then "no, I want byte by byte 1:1 the purse" (and "change
Habbopie to Habbo"). A first version in our own class names + theme tokens was replaced the same hour.
- Backup first: `c:/inetpub/wwwroot/db-backups/nitro-ui-before-pie-purse-20261001-0427.tar.gz` (client repo without
  node_modules/dist/.git/yarn cache + the deployed `hCMS/public/cdn/client`).
- Source: their component `aB0` (+ row `_f`) in `pie/assets/index-cc627c03.js`, their CSS in `pie/src/assets/index.css`.
- `components/purse/PurseView.scss` = their 36 purse rules + `@keyframes smoothCollapse/smoothExpand` **verbatim**
  (incl. their data-URI icons, #181818, Poppins), only `Habbopie` -> `Habbo`. Regenerate from their CSS, don't hand-edit.
- `PurseView.tsx` / `views/CurrencyView.tsx` = their markup element for element: `.Habbo-right-side-purse d-none d-sm-block
  mt-2` > `.d-flex.flex-column.animasyonlagizlenecekdiv(.hidden)` > rows `.Habbo-right-side-purse-item icon-<type>`
  (left-side p, right-side p, empty type-container; tooltip with the full amount when short), club row (`hc.disabled`
  is true here, so hidden), buttons Help (`help/show`) / Settings (`user-settings/toggle`), then full-width Income /
  Expenses (`balance-logs/toggle`) and Hide/Show wallet. `index.html` loads Poppins like their page.
- Deliberate differences: English texts (theirs Turkish); no credits row (this hotel has no credits; rows =
  `system.currency.types`); row names = our server's currency names (theirs `Habbopie.purse.<type>` keys).
- **Gaps that come with 1:1:** their CSS has no `icon-101` rule, so the Emeralds row has no icon picture and plain
  white text (same in their client). `balance-logs/toggle` opens nothing here (their window doesn't exist in ours).
- Verified side by side (headless, our dev client as Kasper vs `pie.html` as Mia, same 1384px viewport): 109 computed
  properties identical across root / row / text / icon box / button / button icon / wide button. Differences: their
  credits row (+34px height), name text width (their raw locale key), and the whole purse sits 5px further right on
  ours because our `.nitro-right-side` has `right: 15px` (HabboCity's `--holo-paddings`) vs their 10px - left as is.
- **Our icons and colours added** (user: "add our icons and colors"): every row gets `has-own-icon` + the server's
  currency colour as `--currency-color`, and `LayoutCurrencyIcon` inside the type container. A marked "Own additions"
  block at the end of `PurseView.scss` (2 rules, same specificity as theirs, later in the file) colours the text and
  replaces their box image with a box tinted 30% with that colour + a 2px ring. Verified: Diamonds rgb(0,191,255),
  Emeralds rgb(80,200,120), Snowflakes rgb(159,230,255), each with our wallet icon (`wallet/<type>.png?v=3`); so the
  Emeralds row is no longer empty.
- Test gotcha: a background tab in the headless Chrome never finishes loading (stuck at 80-120%); activate it first
  (`/json/activate/<id>`).

## Today card: closed by default with badges, clearer details (2026-10-01, dev only, not deployed)

User: "make Today better infos, and when entering the hotel it's closed or only shows some counts like new to claim, and
less big until opened". `OnlineChestView` (EngagementView.tsx) now starts closed every time the hotel loads
(`useState(false)`, not remembered). Closed (`.is-collapsed`, 200x34): "Today", a green count of things ready to claim
(chest ready + daily reward unclaimed), and small badges: chest (minutes left / "Open"), "Claim" while the daily reward
waits, quests done/total; click opens it. Open: Daily reward (day N of 7, streak / best / freezes, a Claim button with
today's amount + currency icon, or "Claimed, come back tomorrow"), Online chest (status text, chests today, bar,
Open / Open now), Daily quests (each quest: tick or dot, title, progress, reward with currency icon; bonus line; the
row opens the Quests window), Earned online today (VIP x2 note, next payout, Emerald and Diamond bars against the
caps). Styles appended to EngagementView.scss. Verified on the dev client (Kasper): closed "Today | 1 | 30m | Claim |
0/3", open 200x375 with all four parts filled from real data.

## Purse yellow tags, Diamond icon, Today closed = earnings only, result line (2026-10-01, deployed)

- **Purse:** every row keeps HabboPie's yellow tag behind the icon (user: "the yellow background should stay for
  all"): the plain tag (their 4 box images with the icon pixels filled in their yellow #f9c804) is a data URI in the
  "Own additions" rule of `PurseView.scss`, with `padding-left: 4px` so our wallet icon sits on the tag body (x 6-27).
- **Diamond icon** (`hCMS/public/cdn/images/wallet/5.png`) was 20x20 (a 16x16 diamond in a 2px white glow) inside the
  15x15 `.nitro-currency-icon` box (centred, not scaled), so its edges were cut off everywhere. Now 15x15 (glow removed,
  16->15 nearest). Old file: session scratchpad `icon-backup/wallet/5-20x20.png`. `currency.asset.icon.url` -> `?v=4`
  in both ui-configs.
- **Today icons:** `HabboIcon` box 30px (was 22), so chest 30x30, flame 16x16 and scroll 17x24 all show at their own
  size (measured live), never shrunk.
- **Today closed** (user: "when closed show only Earned online today"): title + the Earned online today block only
  (shared `earned` element, same block at the bottom of the open card); the earlier badges/count were removed.
- **Action results** (claim, chest, freeze, swap): after some back and forth (bubble + card, bubble only, then "leave
  only the card line ... not on the Today bubble when the card is open"): no bubble; `ResultLine` shows the message
  for 8s in the Daily reward window while it is open (module flag `dailyWindowOpen`), otherwise on the open Today card.
- Deployed `index-53624bbd.js` (before it `index-b5e209a7.js` with the 1:1 purse + first Today rework).

## Quests + achievements -> HabboPass XP, unlimited daily quests (2026-10-01, deployed + live-tested)

User: "the achievements system should be the quests and give XP for HabboPass, all work together, and daily can earn
more, not only 3". Answers: unlimited daily quests (a new one after each, smaller rewards after the first 5);
achievement XP = level points / 5.
- **HabboPass XP = the website's winwins** (hcms_citypass_progress for the live season, 100 per level, 26 levels in
  HabboPass Season 1, ends 2026-11-01). New plugin class `engagement/HabboPassXp` = Java copy of hCMS
  `WinwinService::grant` (idempotency key, live-season rule as `CityPassSeason::current()`, row lock, hcms_winwin_ledger
  row, website notice type "rewards" -> /rewards on a new level + an in-game bubble, UTC times). `state(userId)` gives
  season / level / max / into / perLevel / xp.
- **Daily quests unlimited** (`engagement/DailyQuests`): `quest_open` (3) always open; finishing one pays it, grants
  `quest_xp` (10) XP (key dq:user:day:slot) and adds the next quest (`addNext`, next slot, not one of the open keys).
  The first `quest_full_count` (5) done a day pay full; later ones a third of the reward (min 1) + `quest_xp_reduced`
  (3) XP (decided when the quest is picked, also for swaps). The bonus comes at `quest_bonus_after` (5) done:
  `quest_bonus_diamonds` + `quest_bonus_xp` (25) XP (key dqb:user:day). New column hcms_daily_quests.xp. All numbers
  are rows in hcms_engagement_settings (seeded INSERT IGNORE). Today's already-rolled open quests got xp 10 by hand.
- **Achievements = the long quests** (`engagement/AchievementXp`, HcmsPlugin `onAchievementLeveled` on Arcturus'
  UserAchievementLeveledEvent, via `counted()` so a cancelled event pays nothing): every level reached (each level of a
  multi-level jump) gives max(1, round(points / achievement_xp_divisor)) XP, key ach:user:name:level, then a bubble
  and a state push. All 732 levels = ~5,486 XP. Data: `achievements.reward_type` 0 (Duckets) -> 101 Emeralds,
  reward_amount = max(1, round(old/10)) (1-10, 3,389 total); backup table `bak_20261001_achievements`.
- **Protocol** (OUT 9631, appended after the message so an older client still parses): n + XP per quest, bonus
  after, bonus XP, done today, full-reward count, then hasPass + season, level, maxLevel, into, perLevel, xp.
  Client `api/engagement/EngagementProtocol.ts` (IHabboPass, quest.xp, questBonusAfter/Xp, questsDoneToday,
  questFullCount).
- **Client** (EngagementView.tsx): `PassBar` (season, level x / max, XP bar purple #9180ff, "x / 100 XP to level n")
  on top of the Quests tab and in the open Today card; Quests tab: an Achievements button (`achievements/toggle`),
  open quests (reward + "+N XP", swap), bonus line "x / 5 done for the bonus: +5 Diamonds + 25 XP", a "Done today"
  list; tab label "Quests (N done)"; Today card lists open quests and "N done today". Pass bar styles also scoped
  under `.engagement-today` (the daily window's bar rule is scoped to `.nitro-engagement-daily`).
- **Verified live** (emulator restart 05:18, test account Kasper): "Chat 2 times" done -> bubble "Quest done: Chat 2
  times! +15 Emeralds and +10 HabboPass XP. A new quest is waiting.", winwins 10 -> 20, ledger row dq:5:2026-10-01:0,
  slot 3 "Change your look" (+10 XP) added; Today + Quests tab show the pass (level 0/26, 20/100 XP) with no overflow.
  **Not live-tested:** an achievement level-up (code path only), the reduced rewards after 5, the 5-done bonus.
  Client `index-776394be.js`. `tsc` 49 (unchanged).
- Still open from the earlier plan: seasons named after Habbo's seasonal currencies (Snowflake now, Seashell...) and
  the Nitro quest protocol / quest tracker; a premium pass track.

## MetroHotel reference client at play.habbo.nz/metro.html (2026-10-01, stopped: their domain lock)

User: "setup metrohotel client" (like pie.html), "check but don't login". Their files were read from a NOT logged-in
metrohotel.net tab in the user's debug Chrome (direct requests get Cloudflare 403; the static build is readable
same-origin). Saved to the session scratchpad `metro2/` (helper `metro-pull.js`, run with `MSYS_NO_PATHCONV=1` so Git
Bash doesn't rewrite `/nitro/...`): `index.html` (app mounts on `#habbo`, configs `./renderer-config.php` +
`./ui-config.json`), `build/index-CyAAtNRV.js` (19.5MB, a NEW build: the 2026-09-28 names in out/metro/ are gone),
`build/nitro-renderer-DwoWGFtJ.js`, `build/vendor-BWnbsHvc.js`, `build/index.css`, `build/vendor.css`; their socket is
`wss://nitro.metrohotel.net:2096`. Set up like pie.html: `hCMS/public/cdn/client/metro/` (build + our renderer config +
their ui-config with our URL keys) and `metro.html`; `deploy.ps1` robocopy also excludes `metro.html` / `metro`.
**Result:** their bundle refuses to start: `Error: Nitro is not authorized to run on play.habbo.nz.` (a domain lock in
their code, `$63`), and it calls home to metrohotel.net. **Not bypassed on purpose** - patching out their licence /
domain check would be defeating their protection. Their client then redirects the browser to metrohotel.net, so `metro.html` and `metro/` were removed from the server
again (user report "it's redirecting to metrohotel") and `deploy.ps1` is back to excluding only pie; copies stay in the
scratchpad `metro2/`, and their code can still be read statically (out/metro/ + metro2/) for reference.
Then put back at the user's word ("revert the metro files" -> "Put metro.html back"): `metro.html` + `metro/` restored
as before and `deploy.ps1` excludes `metro.html` / `metro` again; it still redirects to metrohotel.net (lock not removed;
the user asked to remove the lock and that was declined). Their CSS also needs ~195 images from their own site (/client/...).

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
> under time pressure.
>
> **This work spans two repos, not just this one — expect to touch both.** The client UI lives here
> (`nitro-react-Wired`); the real server-side logic for every custom/own-feature protocol referenced
> throughout this file (Commands, Mentions, Event Alert, Bots panel, Room Settings rework, username
> styling, the Wealth tab, profile cover upload, ignore-list, favourites, everything under an opcode
> in the 9500s) lives in `hcms-emulator-plugin` (Java) — never in `Arcturus-Community-Wired` (the
> emulator core), which stays read-only except for the one already-approved exception documented
> above (the `PermissionsManager` badge-slot cap fix). When a client-side protocol file references a
> `.java` class by name (as almost all of the new API files under `src/api/` do, in their own header
> comments), that class is real, already-built server-side logic to go read — not something to
> assume exists or reinvent from the client side alone. A feature here is only actually finished when
> both halves are done: the real wire format/composer/parser pair on the client AND the matching
> registered opcode handler in the plugin, deployed (stop → copy jar → restart) and boot-log-
> confirmed, exactly like every other protocol pair already shipped elsewhere in this file.
>
> **CURRENT FOCUS (2026-09-28): Presence (hcms-shop), Snowflakes, hcms-feedback** - see the section just above this prompt; four plugin jars and the client are built but not deployed. Earlier focus: **the hCMS Furni Editor** (see its sections just above this prompt, esp. "round 4").
> Open items, in order: (1) the plugin build `hcms-furnieditor-plugin/target/hcms-furnieditor.jar`
> (2026-09-28 00:51: `CatalogNames` in-memory catalog rename + staff word translations 9584-9586) is deployed (00:56).
> (2) Not yet
> tested live: a name save + FurnitureData write, the bulk-rename Apply, Place/Remove test furni, a real
> admin revert, the seat-edge sit-height detection. (3) Queued by the user, not started: a hotel-catalog
> scanner mode. `tsc` has 69 errors that predate this work (truffle-text, wired, a background-colour
> hook); none are in `components/furni-editor/`.
>
> **As of 2026-09-27 (later the same day): Commands/ListConfirm and Room Settings are both DONE.**
> Read the "Commands/ListConfirm resolution, `:enable vip`, and a full Room Settings enforcement
> build" section directly above this prompt in full — it closes out everything the previous version
> of this prompt flagged as open. Concretely: `ListConfirmView.tsx`/`CommandsView.tsx`'s apparent
> duplication was checked and is not a bug (user confirmed live, explicitly said not to touch it);
> Room Settings now has real enforcement for all 19 Permissions-tab flags (not just the original 8),
> the owner/staff exemption was fully removed per explicit instruction, a new `:nobubble` command
> was added, and 14 of 19 flags were directly click/command-tested end to end with two real
> simultaneous accounts (the other 5 share the exact same proven mechanism, just weren't
> individually click-tested — canvas-click and Habbo-Club-status limitations, not doubt about the
> mechanism). Do not re-investigate either of these without a specific new reason to.
>
> **As of 2026-09-27 (latest): Mod Tools layout fixed via a minified-JS fallback, NOT a live DOM
> capture — read the "Mod Tools layout fix" section directly above this prompt before touching this
> family again.** The reference account currently open in this environment has no staff rank on
> `habbocity.fr` (confirmed: its own toolbar has no mod/staff icon at all), so `.nitro-mod-tools`
> itself was never reachable live. Every fix was instead grounded in an exact string match against
> the real, already-dumped compiled bundle at
> `c:\tools\nitro-catalog-copy\scripts\out\hc\index-b7d2b6d3.js` — real source, not a guess, but one
> rung short of this project's full live-DOM chain. Fixed: wrong `theme="primary"` (should be
> `primary-slim`) across every single window in the family, an invented `text-black` class on every
> one of them, a missing 5th "Profile" button + wrong button-row class + missing `ScrollContainer` in
> the User Info panel, a missing `textBreak` prop and `resize="both"` in User Visits, and a missing
> `resize="both"` in Tickets. If a staff-capable reference account ever becomes available, re-run the
> full live DOM/computed-style chain against this family before calling it fully done — two specific
> open questions are flagged in that section (the Tickets tab-nesting order, and the User Info panel's
> exact rendered button-row spacing).
>
> Two other real, independent, **still completely unverified** threads exist in the same working
> tree and should NOT be assumed related to anything above: the Mod Tools Bots panel
> (`ModToolsBotsView.tsx`, 32KB, not read at all yet — and now confirmed via the same bundle grep to
> be a pure own-feature addition with no HabboCity equivalent at all, so it is never a "port" target,
> only ever a "does this own feature work" one) and the Help menu's own
> `HelpAvatarListView.tsx`/`HelpCommandData.ts` beyond the two description fixes already made (not
> otherwise read). Ask the user before switching to either — don't assume priority order.
>
> **As of 2026-09-23 (older, still-open work from before this session)**: User Profile has all 4 real
> tabs built (Groups, Rooms, Photos, Wealth — Wealth was flagged by the user as not matching 1:1 and
> is not a finished feature). Read every "Real, honest gaps, flagged not guessed" callout earlier in
> this file before assuming any of that is complete. Past that, "Full feature inventory — still not
> done" (well above) has the next real chunk of work if nothing above takes priority.

## Workflow + skill system (2026-10-01)
- `PROJECT_WORKFLOW.md` (root): the operating manual, starting with the GLOBAL DEVELOPMENT STANDARD (follow the skill system;
  zero comments in new code, §5a). The old 620 KB `CLAUDE.md` moved here unchanged (`docs/PROJECT_STATE.md`, sha1 checked);
  `CLAUDE.md` is now a short pointer. Same for `hCMS` (`hCMS/docs/PROJECT_STATE.md`). Each `hcms-*` plugin got a short
  `CLAUDE.md`.
- Skills in `.claude/skills/`: `project-workflow` (master routing), `arcturus-emulator` (base server, 10 references),
  `custom-plugins` (5 references), `hcms` (1), `nitro-ui` (1). All referenced paths were checked to exist. Skills
  auto-load only in sessions started in this repo; hCMS and plugin `CLAUDE.md` files point to them.
- Findings recorded in the skills:
  - Arcturus core facts:
    - plugins load before the game environment;
    - event priority is ignored; dispatch matches the exact event class, invoked on the plugin instance;
    - `PacketManager.unregisterCallables(header)` clears every header's callables;
    - every balance change calls `HabboInfo.run()`, which upserts absolute values;
    - catalog creates items before charging, and a cancelled `UserPointsEvent` would make purchases free;
    - marketplace `buyItem` has no row lock (possible race, unverified);
    - `HabboPlugin.hasPermission` can grant any permission;
    - the Wired engine is fork-specific (no `WiredHandler`).
  - Duplicated reward authority: `GameEventBridge` says the website owns all ledgers, but `Wallet` / `HabboPassXp` write
    them too (`HabboPassXp` copies `WinwinService`).
  - Client: no code splitting, so all staff UI ships to every player; no source maps.
- No production code changed.
- Same day, follow-ups:
  - cleanup / intent / configuration rules added (PROJECT_WORKFLOW §5b, project-workflow skill);
  - canonical plugin structure documented (`custom-plugins/references/plugin-structure.md`), based on hcms-shop and
    the Furni Editor;
  - deviations recorded: hcms-buildermode-plugin uses the `com.hcms.emulatorplugin.buildermode` package;
    hcms-emulator-plugin holds ~32 domains;
  - nothing was migrated (a split needs a plan and approval).
- Same day: skill `retro-source` added (Hab-Track stock_retro at `C:/tools/stock_retro` + local reference packs). Finding:
  stock_retro holds only public client gamedata snapshots per hotel (furnituredata, texts, figure/effect maps,
  renderer-config) and their history. It has **no source code and no server values**, so server mechanics need the
  plugin jars, cosas, HabboCM or saved client bundles.
- Same day: the skill system is finished (6 skills, no new ones). `project-workflow` gained a task routine and
  `references/operations.md`, which inventories:
  - the schedulers: hCMS Windows task `\hCMS-scheduler` → `storage/scheduler.cmd` every minute, 5 scheduled commands,
    and the plugin timers;
  - where each economy value lives (`hcms_engagement_settings` etc.);
  - QA: no real test suites; `tsc` / mvn / `php -l` / `Livewire::test`, live checks, tamper tests;
  - deployment per layer, CDN folders and `?v=` cache busting;
  - command cleanup locations and doc rules.

  Every domain skill ends with a Coordination section pointing back to the master.
- Same day: catalog copy/sync workflow documented in `project-workflow/references/catalog-sync.md`, routed from the
  master and linked from the arcturus, hcms and retro-source skills.
  - Finding: the existing pipeline (`C:/tools/nitro-catalog-copy` `run.js` → `ltdhabbo_build_<hotel>` →
    `hcms:catalog-stage` → `hcms:catalog-swap`) is a **full replace**. Re-running it would drop every live catalog edit
    since 2026-09-20, so the default is an additive sync (page matching by furni overlap, diff, reviewed SQL,
    confirmation).
  - The matching/diff scripts from 2026-09-27 only existed in a scratchpad.
  - The continuous-discovery + Filament approval queue is designed (`hcms_catalog_sources` / `_scans` /
    `_candidates`, Add/Ignore/Retry/Re-scan, import command), not built. Scans of Cloudflare-protected hotels must run
    through the user's browser.
- Same day: Sandbox → Live workflow in `project-workflow/references/environments.md`.
  - From IIS/config: there is **one stack** (IIS `LTDCMS` → hCMS for `dev.habbo.nz`, `HCMS-PLAY` → `cdn/client`,
    `HCMS-CDN`, `HCMS-SOON` → coming-soon page for `habbo.nz`; one emulator; DB `hcms`). No isolated Sandbox; the Vite
    dev server uses the same emulator and DB.
  - Documented the per-layer flows with the rollback paths that really exist. `yarn deploy` keeps no previous build:
    make a tarball before risky deploys.
  - A proper Sandbox (`hcms_sandbox` DB, second emulator, sandbox site) is proposed, not built.
  - Launch finding: `APP_DEBUG=true` / `APP_ENV=local`.

## Chest + moderation icons, Staff Tools chatlog height, price proposal (2026-10-01, deployed)

From the open report ("icons are wrong for moderation and chest", "chatlog height broken in stafftools").
- **Cause (icons):** the bubbles had generic kinds. "Your chest is ready!" was SUCCESS (blue "!"), and every staff-feed
  bubble for moderation was WARNING (orange "!"). The Today card's "chest" was Habbo's red gift box.
- **New feedback kinds `moderation` and `chest`** in all three places: `CommandFeedback.Kind` (hcms-emulator-plugin),
  `FeedbackKind` + label (hcms-feedback; `feedback_kinds` rows "Moderation" / "Online chest" were created at boot) and
  the client `FeedbackKind.ts`.
  - `StaffFeed.kindFor("moderation")` returns MODERATION; the other tags are unchanged.
  - `Engagement` sends the chest-ready bubble as CHEST.
  - Text rule (client and hcms-feedback built-in, after the error rules): "your chest" / "the chest" / "chests for
    today" -> chest. Quest lines like "Open 2 chests" stay success.
- **Icons:** `cdn/c_images/notifications/feedback_chest.png` (32x32, Habbo `bewitched_golden_chest` icon centred, not
  scaled) and `feedback_moderation.png` (copy of `stafftools/tag_moderation.png`, the gavel).
  `src/assets/images/engagement/chest.png` is now the gold chest at 24x26 (the gift box is in the session scratchpad
  as `chest-giftbox-backup.png`).
- **Chatlog height (Staff Tools > Players):** each `.staff-evidence-line` had computed `min-height: 0` and shrank in the
  `max-height` list, so 20 lines were drawn 5px tall on top of each other. Now `flex-shrink: 0`, `align-items: center`
  and the list is `max-height: 170px` (about 6 lines of 28px with the standard 26px holo checkbox, then it scrolls).
- **Deployed:**
  - plugin jars hcms-feedback + hcms-emulator-plugin (backups `*.jar.bak-preiconkinds`), emulator restart 11:40, boot
    clean apart from the errors that were already there;
  - client `index-8e4a5348.js` (was `index-776394be.js`), backup `db-backups/nitro-ui-before-iconkinds-20261001.tar.gz`.
- **Verified live** (headless, test account Mia temporarily rank 5 with a test PIN):
  - Evidence list: 20 lines, 28px each, no overlap, list 170px with scroll.
  - Today card: chest 24x26 shown at its own size.
  - `GuessFeedbackKind` gives chest for the 4 chest messages, error for "You need 5 Diamonds", success for the quest
    line.
  - `feedback_kinds` rows exist and both icon URLs return 200.
  - Achievement level-up XP was seen live for the first time: "Achievement level 1: +1 HabboPass XP" bubble on Mia's
    login.
- **Not verified:**
  - A moderation bubble live. Running a moderation action on test account Pete was blocked by the permission check.
  - The chest-ready bubble live (it needs 30 minutes online).
- **Test data left over (cleanup blocked by the permission check; the user must run it or allow it):** Mia (id 6) is
  still rank 5 with a test staff PIN (`hcms_staff_pins`) and a trust row, and has a `hcms_staff_settings`
  `feed_bubble = 0` row. Undo: delete those rows for user_id 6 and set rank 1 / empty auth_ticket.
- **Presence price proposal** (not applied): `db-backups/presence-price-proposal-20261001.sql` (backup tables first,
  31 aura rows; borders 300->200, ornaments 150->100, spawns 500->350). Aura rule: up to 600 (LTD up to 1200) stays the
  same, higher prices x0.35 rounded to 50 (min 400). Averages: basic 1176->453, VIP 2045->851, LTD 6860->2527.
  - Free income model from the live settings: casual (1.5 h, 3 chests, 3 quests, calendar) ~95 Emeralds a day;
    active (5 h, 8 chests, 5 quests) ~200; plus ~3,400 one-time from achievements. VIP doubles the online payout only.
  - Finding: all 51 auras are `vip_only = 1`, including the basic tier, so a free player can't buy any aura.
- **Design principle** added to CLAUDE.md and PROJECT_WORKFLOW §7 (user): monetized / P2W-oriented, still fair to free
  players, feature-specific balance.

## Hotel intelligence in the skill system (2026-10-01, documentation only)

User asked for a Seasonal + Feature Intelligence capability (Habbo.com, sandbox.habbo.com, HabTrack/stock_retro,
individual retros, HabboCity) inside the existing six skills, research/preparation first, no Wired 2.0. An earlier
request in the same session for a full system (tables, scheduler job, admin, auto-import) was superseded before any
code was written.

**Gap analysis (from inspecting the project):**
- **Already exists:** stock_retro clone + research references; the catalog pipeline (nitro-catalog-copy crawl/build,
  `hcms:catalog-stage/swap`, nitro-catalog-sniffer passive capture, `hc-*` HabboCity asset tools); the asset resolver
  `FurniSources` (`hcms_furni_sources`, 28 enabled hotels); the FurnitureData name editor `FurnitureDataFile`; the
  hCMS scheduler (5 jobs); the rare rotation/LTD pattern; Filament clusters + `AdminAudit`; the catalog Seasons tree
  (Halloween 2022-2025 pages).
- **Partial:** additive catalog sync + approval queue (designed in catalog-sync.md, not built); `FurniSources` resolves
  by `items_base` id only (no resolve-by-classname); `FurnitureDataFile` edits names only (no append).
- **Missing:** any knowledge of Habbo.com / sandbox as sources; campaign detection; a confidence/learning model;
  branding/localisation rules; routing for research intents.
- **Not yet needed (not built):** campaign tables/states, intelligence scheduler job, research admin area, automatic
  imports. Integration points are documented so they extend existing systems when built.

**Verified while inspecting (2026-10-01):**
- `www.habbo.com` and `sandbox.habbo.com` `/gamedata/hashes2` answer a plain server request; gamedata files are
  content-hashed.
- The campaign is in `external_variables` `landing.view.dynamic.slot.N.conf`; `hween26*` promos started 2026-10-01
  11:00 (Halloween 2026).
- furnidata `furniline` `habboween_2026` has 45 furni, none in our `items_base`; `habboween_2025` 34/51 present.
- Sandbox has 1,687 extra text keys and 34 extra variables (flags and old test noise).
- habbocity.fr gives 403 to the server (Cloudflare).

**Added:**
- `retro-source/references/official-sources.md`, `seasonal-intelligence.md`, `feature-discovery.md`,
  `branding-localization.md` and `knowledge-log.md` (confidence levels + ledger seeded with the facts above and the
  gamedata hashes as the baseline).
- retro-source `SKILL.md` description, a "Hotel intelligence" section and the reference list.
- `source-validation.md`: confidence line.
- Routing:
  - `project-workflow/SKILL.md`: 5 routing rows + knowledge maintenance;
  - `catalog-sync.md`: sniffer and official-source rows;
  - `operations.md`: where a future intelligence job goes;
  - `hcms/SKILL.md`: the future admin area;
  - PROJECT_WORKFLOW §14.
- Still six skills; all reference links checked. No production code, tables, jobs or deploys. Downloaded gamedata
  stayed in the session scratchpad.

**Open:**
- Habbo.nz brand assets: `logo_habbo.png` (word mark) and `logo_habbo_h.png` ("H"). The user named
  "logo_habbo_icon.png", which doesn't exist; confirm which file they mean. No ".nz" brand kit found.
- Not checked: whether Habbo.com's catalog is readable through its own client, and the official icon URL.

## Intelligence automation, resolver by classname, furni previews, Cloudflare, learning loop (2026-10-01)

Follow-up requests the same day ("do both", Cloudflare automation, consolidate into the six skills, pipeline notes).
- **Resolver** (hcms-furnieditor-plugin): `FurniSources` refactored into one `fetchAssets` path used by the Furni
  Editor button and the new RCON **`furnisourcesresolve`** {classname, revision, actor_id} (`FurniSourcesResolve`).
  `%revision%` placeholder; icon-only sources; source row **habbo.com** (official icons, priority 5) added at boot;
  asset version only bumped for classnames in `items_base`; audit `furni.asset_downloaded` target_type
  `furni_classname`. Deployed: emulator restart 12:33 (backup `hcms-furnieditor.jar.bak-preresolve`), RCON
  registration seen in the boot log.
- **Intelligence scan** (hCMS): migration `2026_10_01_150000_create_hcms_intel_tables` (`hcms_intel_snapshots/_runs/
  _findings`), `app/Domain/Intelligence` (IntelScanner, models), `hcms:intel-scan` hourly at :17, Filament
  Administration → Intelligence findings (filters, Evidence, audited Review) / Intelligence scans. Snapshots gzipped in
  `storage/app/intel/<source>/<file>/<hash>.gz`.
  - Verified:
    - first run: 47 findings (2 campaigns, 45 Halloween 2026 furni);
    - second run: unchanged, no duplicates;
    - every run retries 3 furni through the resolver: 9 NEW with assets, 36 UNRESOLVED;
    - sandbox first run = baseline only;
    - both Filament pages render (`Livewire::test`, NEW filter = 9).
  - Not verified: the sandbox → CONFIRMED promotion (needs a later sandbox change), the slot time zone.
- **Previews**: `C:/tools/nitro-catalog-copy/scripts/render-furni-preview.py` (Hab-Track nitro2png unpack + our
  composer; swf2png fallback via `C:/tools/swf2png/render-swf.js`; else icon; else unresolved) →
  `cdn/c_images/furni_previews/`.
  - Verified renders: dragon lamp (+ `*4` tint), throne, hc_chr.
  - swf2png FAILED on Node 26 ("incorrect header check" in swf-extract, also on its sample); the clone's deps were
    changed locally to load at all.
  - hCMS `App\Domain\Values\Support\FurniImage`; the Values rare modal shows the preview, else the icon.
- **Cloudflare**:
  - Inspected through the user's dashboard session (read-only): zone habbo.nz, 6 proxied A records to one origin,
    SSL flexible, cache facts.
  - Token creation stopped: Cloudflare blocked the scripted write, and storing a secret was refused. Procedure for
    the user is in `infrastructure.md`.
  - `hcms:cloudflare verify|dns|settings|purge` + `config/services.php` `cloudflare`, waiting for the token.
  - Nothing in Cloudflare was changed.
  - Finding: `HCMS_CDN_URL` is unset, so the site uses `cdn.habbo.ltd` (the user decides).
- **Skills** (still six):
  - project-workflow: `infrastructure.md`, `asset-rendering.md`, `learning-loop.md`, routing rows, task routine and
    description;
  - operations / catalog-sync / custom-plugins features / hcms skill: pointers;
  - retro-source: seasonal-intelligence, official-sources, knowledge-log, branding (logos confirmed by the user).
- **Learning loop**: `docs/PIPELINE_NOTES.md` (5 notes) + rules in `learning-loop.md` and `CLAUDE.md`.

## Halloween 2026 in the catalog, NEW page rule, purse buttons removed (2026-10-01)
- Applied with the user's approval: `sync-official-furni.py --campaign hween26`:
  - pages: "Halloween 2026" under Events → Halloween (9967779) and the same offers under NEW (9967780, first;
    user rule: new furni always on a New page);
  - items/offers: 16 furni (items_base 2000041633-648), free offers, `catalog_name` = display name;
  - FurnitureData +16, backups `FurnitureData.json.bak-hween26-*`, tables `bak_202610011506_catalog_pages`,
    `bak_202610011536_*`;
  - restarts at 15:07 and 15:37.
  - Verified in the client (Kasper): the page shows 16 icons, names correct, buy (BUY → CONFIRM) delivers the item.
    Not tested: placing it in a room.
  - Not imported: the crackable dresser and the hatch teleport (need a hand config), plus 27 furni without assets yet.
- Fixes found while applying (now in the script):
  - quote ENUM flag columns (the page was hidden);
  - `catalog_name` = display name.
- Purse: "Income / Expenses" (dead link) and "Hide wallet" removed, the purse always shows. Deployed
  `index-69875f6e.js` (backup `db-backups/nitro-ui-before-purse-20261001.tar.gz`).
- Misclick during testing: my script clicked "Buy a freeze" in the Daily reward window; the server refused it
  (Kasper has 0 Diamonds), and no transaction or freeze was created (checked).

## Own avatar imager with auras: img.habbo.nz (2026-10-01, running locally, DNS pending)
- New service `c:/inetpub/wwwroot/hcms-imager` (billsonnn/nitro-imager, ISC, + our aura renderer). Details:
  `hcms-imager/CLAUDE.md`.
- Running: Windows task `hcms-imager` (node on 127.0.0.1:3030) and IIS site HCMS-IMG (`img.habbo.nz`, PHP front).
- Verified locally through IIS (Host header):
  - plain 64x110;
  - auras glow, flames, halo;
  - size l with the wave action;
  - head-only;
  - 400 without a figure.
- hCMS: `Avatar::withAura()` on the profile and home avatars; the old imager ignores the parameter until the switch.
- Open:
  - the user adds the Cloudflare DNS record `img` (A, same origin, proxied);
  - then set `HCMS_IMAGING_URL=https://img.habbo.nz/` and check the profile/home layouts with the larger aura
    images.

## img.habbo.nz live + right-click menu (2026-10-01)
- **Imager live:**
  - The user added DNS `img` (A, proxied).
  - `https://img.habbo.nz/?figure=…` answers 200 image/png through Cloudflare (DYNAMIC; the imager caches on disk).
  - hCMS `config/hcms.php` `imaging_url` default is now `https://img.habbo.nz/` (no `HCMS_IMAGING_URL` in `.env`),
    so every website avatar uses our imager.
  - Phi's profile renders the flames aura in the round frame. The avatar is a little smaller there (96 px image
    scaled to 140); left as is.
- **Right-click menu, website** (`partials/context-menu.blade.php` included at the end of `partials/head`, so every
  page shell; `public/assets/js/context-menu.js`, `public/assets/css/_context-menu.css`, theme variables):
  - logged in: Home, My profile, Hotel, Values, Settings | Back, Reload, Copy link; guest: Home | Back, Reload, Copy
    link;
  - the native menu stays on inputs/selects/editable/selected text/iframes and with Shift.
  - Verified (headless, guest): items listed, input keeps the native menu.
- **Right-click menu, hotel client** (`components/page-menu/PageMenuView` + scss, mounted in MainView):
  - Home, My profile, Values, Settings open on the website in the top window (`url.prefix`); Reload hotel;
  - skips events a window already prevented (`preventContextMenu`), inputs and selections.
  - Verified in the dev client (Kasper). Deployed with the client build below.

## Seasonal Habbo.com lines imported, catalog IDs removed, purse visibility fix (2026-10-02)
- **Seasons** (user: "only seasons"; LTD/crackables/clothing "to economy" in a Staff category):
  - 933 furni, 61 pages:
    - public season pages under Events (Easter, Halloween, Christmas, New Year, new Valentine's) and Seasons
      (Summer, Winter);
    - 13 existing pages topped up;
    - 2026 lines mirrored under New → <Season>;
    - 67 items in Staff → Seasonal Economy (min_rank 7, default interaction until configured).
  - Art: 217/217 resolved by the bulk resolver.
  - 8 furni without art not imported.
  - Backups: `FurnitureData.json.bak-seasons-20261002002600` and table `bak_<stamp>_season_pages`.
  - Restart 00:26.
  - Scripts `resolve-official-assets.py`, `sync-official-seasons.py`.
- **Catalog:** the staff-only pageId/offerId/className block under the selected offer is removed. Those ids stay in
  the Furni Editor (user).
- **Purse "sometimes not showing":** HabboPie's expand animation started at opacity 0 and sometimes never ran. It's
  now switched off (the purse can't be hidden anyway). Verified on the deployed client `index-e66e3aa2.js`.

## Token-gated client chunks (2026-10-02, deployed + verified)
User: "only things we added in chunks the file can only be fetched with a short-lived token from the server, so even
someone who finds the file name gets nothing."
- **Plugin** (hcms-emulator-plugin `chunkaccess/ChunkAccess.java`, registered in HcmsPlugin):
  - IN 9646 = request; OUT 9647 = `string token, int lifetime, int level`;
  - table `hcms_client_chunk_tokens` (token CHAR(64) PK, user_id, rank_level, expires_at), created on boot;
  - tokens last 600 s; level 1 while the staff PIN is locked; at most one token per user every 5 s.
  - Jar built at 01:08, not copied: the emulator restart was refused by the permission check.
- **Client:**
  - `src/api/chunk/ChunkAccessProtocol.ts` and `src/components/protected/ProtectedViews.tsx` (mounted in MainView
    instead of the 15 views);
  - React.lazy for ShopView, ShopAuraSync/BubbleSync/SpawnPlayer, EventAlert, CommandConfirm, ListConfirm,
    Chest/Contract/RewardPopup, WiredCreatorTools, AreaHide, BuilderToolbar, ClothesShop, and FurniEditor (level 7,
    rendered only for a level-7 token; after a staff PIN unlock a new token is requested);
  - the cookie `hcms_ct` (Path=/assets, Secure, SameSite=Strict); a failed chunk renders nothing rather than crashing;
    Vite dev skips all of it;
  - `vite.config.js`: `build.manifest`, our chunks named `c-<hash>.js`. The index bundle went from about 9.3 MB to
    7.86 MB.
  - Not moved: EngagementView (its module state is shared with RightSideView's OnlineChestView), StaffPinView and
    ReconnectView (they must work without a token), PageMenuView, and our code inside stock components.
- **Deploy:** `scripts/protect-chunks.mjs` (run by deploy.ps1 before robocopy):
  - moves the chunks reachable only from those 15 roots into `C:/inetpub/wwwroot/hcms-client-chunks` with
    `protected.json` (file → level);
  - deletes `dist/manifest.json` so source paths are never published;
  - fails the deploy if a root is no longer a dynamic entry.
- **Gate:** `C:/inetpub/wwwroot/hcms-chunk-gate` (CLAUDE.md there):
  - IIS application `HCMS-PLAY/gate` (pool LTDCMS, PHP handler for index.php only, set in applicationHost);
  - `hCMS/public/cdn/client/web.config` rewrites a missing `assets/c-xxxxxxxx.js` to `gate/index.php?f=`;
  - every refusal is a 404; responses are `private, no-store`.
  - The IIS application and the rewrite are live. They are harmless because the current client has no `c-*` files.
- **Deployed 01:19-01:25** (user allowed it): jar copied (backup `.bak-prechunkaccess`), emulator restarted (boot log:
  `ChunkAccess (9646/9647)`), client `index-6674d350.js` deployed. The gate's first web.config listed `web.config` in
  hiddenSegments, which IIS already has, giving 500.19; removed.
- **Verified** (headless, Kasper rank 1, CDP):
  - all 18 player chunks loaded with 200;
  - fetching a player chunk from the page gives 200; the FurniEditor chunk (level 7) gives 404;
  - outside the browser, no cookie: 404, `cf-cache-status: BYPASS`; `/gate/web.config`, `/gate/CLAUDE.md`, a
    `../protected.json` file name and a fake token: 404;
  - cdn.habbo.nz/client/assets/<chunk>: 404 (the file is no longer under cdn/client).
- **Still visible in the main bundle:** the protocol files (`src/api/*Protocol.ts`, packet ids and fields) and our
  code inside stock components, e.g. ModTools administration (give currencies).

## Staff windows gated + build hardening (2026-10-02, deployed + verified)
- **Moderation Tools:** the Room, Chatlog, User, User chatlog, Tickets, Staff Tools and staff feed views are now
  staff files (level 4), and Administration (give currencies etc.) is level 7.
  - Files: `src/components/mod-tools/ModToolsStaffViews.ts` and `src/components/protected/LoadProtected.ts`
    (`LoadProtected` with `preload`, `SetChunkLevel` / `useChunkLevel`). ModToolsView renders them only for a
    matching token.
  - Fetched right after a staff token arrives (`PreloadStaffViews`), so the 600 s token lifetime doesn't matter.
  - protect-chunks roots extended.
- **Build** (`vite.config.js`, build only): esbuild `drop: debugger`, `pure` for console.log/debug/info/trace,
  `legalComments: none`, `sourcemap: false` written out. One `console.log("snowwar")` stays because its return value
  is used.
- **Not done, on purpose** (user agreed): a code obfuscator on the main bundle. It is too slow on 7.8 MB, and the
  traffic is visible in DevTools anyway.
- **Deployed:** client `index-bc21d9af.js` (7.79 MB); 28 protected chunks, 10 of them staff-only.
- **Verified:**
  - Kasper (rank 1): 18 player chunks 200; level-4 and level-7 chunks 404.
  - Temporary token rows (user_id 0, deleted afterwards): level 4 → staff chunk 200, admin chunk 404; level 7 →
    admin chunk 200, `cf-cache-status: BYPASS`, `private, no-store`.
  - Readable strings: "Mod Tools", "Staff Tools" and "Administration" remain only as button labels in the main bundle.
  - Not clicked through: the Moderation Tools windows as a real staff member (no staff test login).
- **Still open:** a server-side audit of every incoming message in our plugins (rank/permission, ownership, amounts,
  rate limit). That is the real protection.

## Staff message formats out of the main bundle (2026-10-02, deployed)
- `ShopGiveComposer` (9606) moved to `src/api/shop/ShopStaffProtocol.ts`. It is used only by the Administration view
  (level 7); the header still comes from `shop.headers.inGive`.
- `StaffFeedActionsView` (chat hover buttons) is a level-4 staff file, rendered only for a staff token.
  `StaffFeedSubject` moved to `src/api/stafffeed/StaffFeedSubject.ts`.
- Client `index-cfa3e72d.js`: 9606, 9620, 9621 and 9638 no longer appear in it. Kasper: player chunk 200, staff 404.
- Assessment: the client hiding is complete. Further hiding is not worth the complexity; the next step is the
  server-side message audit.
- **Token retry** (same day): `ProtectedViews` keeps asking until a token arrives: every 6 s for 10 tries, then every
  30 s (the server allows one every 5 s). A staff PIN unlock uses the same retry. Client `index-2f51cc90.js`;
  Kasper got the token and all 18 player files. No "could not issue" errors in the emulator log.
  Not live-tested: the PIN unlock → staff token step (no staff test account with a PIN).
- **Wired Creator Tools reverted to static** (user: "was basic in ui"). As a lazy chunk, Vite split its styles into
  `src/assets/WiredCreatorToolsView.css`, and the window rendered unstyled. It is mounted in MainView again (after
  WiredView) and removed from ProtectedViews and the protect-chunks roots. After the deploy only `index.css` exists.
  Lesson: before gating a view, check that the build emits no separate CSS file for it.
- **All wired windows static again** (user: "all wired"): ChestView, ContractView and RewardPopupView are back in
  MainView (after WiredView, before WiredCreatorToolsView) and out of ProtectedViews and protect-chunks. Gated now:
  the shop (4 parts), event alerts, the 2 confirms, area hide, builder toolbar, clothes shop, plus the staff files.
- **Why the wired windows looked basic:** `common/habbo/HabboLayoutView.scss` and `HabboChromeView.scss` are used only
  by Wired Creator Tools layouts. With that view lazy, Vite moved them into `WiredCreatorToolsView.css`, outside
  `index.css`. Now they are back in `index.css` (verified in the deployed file).
- `protect-chunks.mjs` now fails the deploy if any stylesheet other than `src/assets/index.css` is emitted. Every
  client style ships in `index.css`; `public/` holds no CSS.
- Open (not changed, user said "nvm"): the origin sends `Cache-Control: no-cache` for `src/assets/index.css`, but
  Cloudflare's Browser Cache TTL rewrites it to `max-age=14400`, so browsers keep an old stylesheet for up to 4 h
  after a deploy. Fix options: set Cloudflare's Browser Cache TTL to "Respect existing headers", or give the
  stylesheet a hashed name (index.html and pie.html reference `src/assets/index.css` by name).

## Website loader until the gated windows are ready + reload prompt (2026-10-02, deployed)
- **Loader:** the user wanted "our loader from website" until everything works. `ProtectedViews` shows the website's
  loader 1:1 (`router.js` injectLoader markup `div.loader-content > div.spinner-image`; CSS copied from
  `hCMS/public/assets/css/_main.css` into `src/components/protected/ProtectedViews.scss`; logo
  `src/assets/images/loader/logo_loader_black.png`, the same file). It stays until the token has arrived and every
  player file (plus staff files for the level, and FurniEditor at 7) has loaded. `PreloadStaffViews` now returns a
  promise.
  - Verified in the headless browser: shown from about 7.5 s to 9.5 s after a reload, then gone. Computed styles
    match the website: fixed, z-index 2000, blur(4px), 62×60, rotationLoader 0.6 s. 12 player files loaded.
- **Failure:** Chrome remembers a failed module URL (tested: the same URL fails again even with a valid cookie; a
  new URL works), so a silent in-page retry is not reliable. If a gated file fails, the loader closes and a confirm
  appears once ("Part of the hotel did not load… Reload / Later"). The reload keeps the login through the reconnect
  ticket.
- **Builder:** BuilderToolbarView stays a level-1 file. Build mode is allowed for anyone with rights in the room
  (`BuildModePlugin.java:59`), so every logged-in player has to be able to load it. Visitors without a login get
  nothing.

## Server-side message audit (2026-10-02, findings only, nothing changed yet)
Read all 77 incoming handlers in hcms-emulator-plugin, hcms-shop, hcms-furnieditor-plugin, hcms-buildermode-plugin
and nitro-builder-toolbar-plugin. Important context: `io.client.multithreaded.handler = 1`, so one client's packets run
in parallel and read-check-write code without a lock can race.
- **HIGH — profile moderation (IN 9568, `profile/ProfileModerationProtocol.java:98`)**: allowed for rank id ≥ 2,
  which is now VIP. Any VIP can delete anyone's banner or reset their motto or look, staff included. There is no
  target-rank check, and 9568 is not in the StaffPin locked list. The client view `UserProfileModerationView` should
  match.
- **HIGH — clothes shop buy (`clothesshop/ClothesShopBuyEvent.java`, `ClothesShopService`, `ClothesShopRepository`)**:
  - `new int[count]` with a client count: a huge value can exhaust memory;
  - every id runs `findById`, which reloads 3 full tables, and there is no rate limit (DB flood);
  - the sellable list takes any clothing with a `catalog_items` offer and ignores page visibility/min_rank/enabled:
    7 of 10 items come from staff-only or hidden pages (min_rank 11 / 99);
  - no lock: parallel buys can push credits or points below 0;
  - duplicate ids in one request charge twice.
- **MEDIUM — chest open, chest skip, streak freeze (`engagement/Engagement.openChest`, `LoginStreak.buyFreeze`)**:
  read → check → save without a lock and without a rate limit. Parallel packets can give a double chest reward, go
  past chest_max, or buy freezes past freeze_max. The daily claim is safe: a conditional UPDATE on claimed_day.
- **MEDIUM — builder erase area (`BuilderModeManager.eraseArea`)**: anyone with room rights picks up every furni in
  the area. Items go back to their owners, but stock lets only the owner pick up others' furni (griefing).
- **LOW**: profile cover upload has no rate limit; the name tag is free text (word filter only), so it can imitate
  "Staff"; several handlers NPE on a null rank (harmless).
- **Solid**:
  - Admin currency (rank 7, cap, FOR UPDATE, no negative, audit) and Admin give (rank 7, 1-100, audit);
  - Presence shop buy/equip/give (server price, owns/VIP/balance under `synchronized(habbo)`, give rank 7);
  - the daily claim;
  - staff feed, security, player tools and prison (permission + StaffPin);
  - all 11 Furni Editor handlers (rank 7 + StaffPin);
  - the bot panel;
  - room settings/skin (owner or acc_anyroomowner);
  - mentions (cleaned, 1 s, opt-out, group mentions need a permission + cooldown);
  - command/list confirm (token + owner + expiry, list capped at 5000);
  - reconnect ticket and chunk token;
  - builder fill/paste/copy/move/height (rights + caps, uses own inventory only).
- **Not reviewed**: stock Arcturus handlers (core, not ours), the website/hCMS endpoints, read-only info handlers
  only skimmed (identity, rares, wealth).

## Server audit fixes (2026-10-02, deployed + partly verified live)
- **Profile moderation (IN 9568):** Moderator rank 5+ only, never self or an equal/higher rank, 1 s rate limit, added
  to the StaffPin locked list. Client: the "Moderate" button needs securityLevel ≥ 5, and `UserProfileModerationView`
  is a level-5 gated chunk (`ModToolsStaffViews.PROFILE_MODERATION_LEVEL`, rendered by ProtectedViews; removed from
  MainView).
- **Clothes shop:**
  - buy: 1-20 items per order, duplicates refused, 1 s rate limit, `synchronized (habbo)` around check → charge →
    grant;
  - the item list is loaded once per buy (`loadShopItemsById(rank)`; `findById` removed);
  - the list only takes offers with `have_offer = '1'` on pages that are visible, enabled and min_rank ≤ the player's
    rank. Before, the numeric `have_offer = 1` matched '0' offers: 83 free items, 81 from staff/hidden pages; now 3.
    No player had taken any (`users_clothing` had 0 such rows).
- **Engagement:** `openChest`, `buyFreeze` and `DailyQuests.swap` run under `synchronized (habbo)`; ActionEvent has a
  500 ms rate limit.
- **Builder erase** (nitro-builder-toolbar-plugin): without ownership or acc_anyroomowner, only the player's own furni
  are erased.
- **Profile cover upload:** 10 s rate limit.
- **Name tags** (hcms-shop): below rank 4, tags matching staff, admin, adm, mod, owner, supp or habbo (after 0→o,
  1→i, 3→e, 4→a, 5→s, 7→t, @→a, $→s) are refused with the new text `msg.name_reserved` (5 languages, seeded on
  start).
- **Deploy 02:43:** backups `*.jar.bak-preaudit` for hcms-emulator-plugin, hcms-shop and hcms-buildertoolbar;
  emulator restarted; client deployed (25 gated chunks, 13 staff-only).
- **Verified live** (Node WebSocket client as Kasper, temporary auth_ticket removed afterwards):
  - clothes list for rank 1 = 3 items (719, 718, 578);
  - count 100,000,000 → result 2 (unavailable);
  - duplicate ids → 2;
  - name tag "ST4FF" → msg.name_reserved;
  - the emulator still answers afterwards; no exceptions in the log.
  - Kasper's previous reconnect ticket was overwritten by the test, so the headless tab needs a fresh SSO login next
    time.
- **Not verified live:** the profile moderation rank rule (needs a VIP and a Moderator account), the chest/freeze
  race, builder erase for a rights holder. Each is checked in the code only.
- **Loader change** (user: "loader should not be there after loading screen"): the website loader is removed again
  (markup, `ProtectedViews.scss` and the logo copy deleted). Instead, `App.tsx` keeps Nitro's own `LoadingView` up
  while `useProtectedReady()` is false. `SetProtectedReady` fires once the token has arrived and all gated files for
  the level have loaded. MainView mounts underneath (`.nitro-loading` is z-index 9999). Verified headless (fresh SSO
  for Kasper): loading screen → all 12 player files done at 5.3 s → hotel at 4.4 s on the sample clock, with no
  second loader.
- **Speed** (user: "now it loads slow"):
  - The gate now sends `Cache-Control: private, max-age=31536000, immutable` for granted files (hashed names; only
    the browser that got it with a token keeps it; Cloudflare still never caches it). Refusals stay
    `private, no-store`.
  - The loading screen waits only for the player files; staff files and FurniEditor preload afterwards without
    blocking.
  - Measured headless:
    - first visit: hotel ready 5.10 s, gated done 5.38 s, screen hidden 5.45 s;
    - repeat visit: 12/12 gated files from the browser cache in 0 ms, screen hidden 4.80 s (0.39 s after the hotel
      mounted, mostly the token round trip).
  - Each deploy still means one fresh download of the 8.3 MB main file.
- Test gotcha: navigating the headless tab while its previous page still had a reconnect ticket produced
  "non-existing SSO token" warnings and a stuck 80 % load. That was a test artifact: a clean login → reload rotates
  rc- tickets and logs straight back in (verified).

## Live test of the staff features + prison/quest fixes (2026-10-02)
Two raw WebSocket clients (`scratchpad/hclient.mjs`): Mia as staff (rank 7 for the test, PIN set then entered) and
Kasper as the target.
- **Passed live:**
  - staff PIN set → locked until entered → unlocked;
  - duty toggle;
  - security mode strict → normal (audit `security.mode` ×2);
  - incident 37 claim → let go;
  - shared staff note;
  - trade ban 1 h → lift (audit tradeban / tradeban_lifted);
  - prison 2 min: Kasper is forwarded to room 524; his own room (522) and the hotel view are both sent back to 524;
  - release → free to go;
  - reset sanctions (audit staff.sanctions_reset).
  The card replies (9637) and list replies (9628) all arrived.
- **Found and fixed:**
  - Phi's sentence #1 on "Habbo" (2026-09-30) reached 6 days because the button fired 5 extensions in one second.
    Now `Prison.sentenceBy` caps the time left at 7 days (MAX_SECONDS), refuses an extension past it, and adds the
    extension to `seconds_total`. `PlayerToolsProtocol.ActionEvent` has a 1 s rate limit.
  - `DailyQuests.advance` read → done → pay without a lock: parallel packets could pay a quest or the 5-done bonus
    twice. It now runs under `synchronized (habbo)` (re-entrant with the shop and chest locks).
  - Deploy: restart 03:18 (backup `hcms-emulator-plugin.jar.bak-prequestlock`).
- **Re-test after the fix:** 7-day prison accepted; +60 min refused (no extend audit, total 604800); a second click
  within 1 s ignored; released.
- **Cleanup:** Mia rank 1, PIN + trust rows deleted, the test note deleted. Test sentences 6-7 and audit rows kept as
  history.
- **Still not live-tested:** reduced quest rewards after 5 + the 5-done bonus (code read: reward decided at pick time,
  bonus once a day via `bonus_paid`); the security modes' automatic actions; an achievement level-up.

## Website "Today" card (2026-10-02)
On the hCMS home page (not the Center), view-only, reading the plugin's engagement tables. Details: hCMS
`docs/PROJECT_STATE.md` "Today card on the home page".

## Quest merge, game side (2026-10-02, deployed)
- **Plugin:**
  - `engagement/Missions.java` reads hCMS `hcms_quests` + `hcms_quest_progress` (active, uncollected, completed first,
    then by progress, max 8);
  - EngagementProtocol OUT 9631 appends `int n + n x (string title, int progress, int quantity, int xp, boolean
    completed)` at the very end;
  - `GameEventBridge.report(type, userId)` (static), called after `LoginStreak` saves a moved streak (`streak`), per
    finished daily quest (`daily_quest`) and after a chest opens (`chest`).
  - Restart 03:41, backup `hcms-emulator-plugin.jar.bak-premissions`.
- **Client:** `IMission` + parser (only if bytes remain); Quests tab "HabboPass missions": engagement-box rows with an
  XP pill (`engagement-xp`), progress bar, "Done! Collect your XP in HabboPass." when completed.
- **Verified:**
  - raw client: Kasper's 9631 contains the missions;
  - headless: the Quests tab shows "HabboPass missions" with "Log in 7 days in a row 3/7" etc.
- Website side and mission data: hCMS `docs/PROJECT_STATE.md` "One quest system".

## Wardrobe on the website (2026-10-02)
hcms-shop RCON `shopwear` (restart 03:57, backup `hcms-shop.jar.bak-prewardrobe`); website Center > Inventory >
Presence. Details: hCMS `docs/PROJECT_STATE.md` "Wardrobe".

## Economy overview (2026-10-02)
`Wallet.record` (log only), clothes shop → `clothes.buy`, NoCredits → `Wallet.give` `furni.redeem` (restart 04:06).
Dashboard: hCMS `docs/PROJECT_STATE.md` "Economy overview".

## Clothing economy, game side (2026-10-02)
`boxes/HabboBoxes.java`: prize id + `stock`; sold-out prizes are skipped when loading; a limited prize is awarded
only after `UPDATE hcms_citybox_prizes SET stock = stock - 1 WHERE id = ? AND stock > 0` succeeds (else rerolled);
"Everything in this box is gone for now" when all are sold out. Restart 05:14 (also loads the clothing interaction
fix), backup `.bak-preboxstock`. Details: hCMS `docs/PROJECT_STATE.md` "Clothing economy".

## Clothes Shop layout fixed (2026-10-02, deployed + verified)
User: "fix clothing shop layout".
- **Causes:**
  - the window reuses `.nitro-avatar-editor` / `.nitro-avatar-editor-content`, whose HabboCity CSS shifts the content
    70 px left (`--left-shift`) to make room for the outfit editor's wardrobe sidebar; the shop has no sidebar, so
    tabs, preview and basket text sat outside the window;
  - `useAvatarEditorGridColumns` measured once on mount, while the shop was still hidden (null ref), so the grid
    stayed at 1 column;
  - card text is white in the light theme (the basket total was invisible);
  - the Buy button wrapped;
  - the right column was empty without a selection.
- **Fix:**
  - `ClothesShopView.tsx`: card class `clothes-shop`; hint `clothesshop.hint` when nothing is selected
    (`clothes-shop-details` panel); `clothesshop.basket.empty` instead of a hard-coded string; totals
    `variant="muted"`; grid column `fullWidth`; Buy `clothes-shop-buy`;
    `RegisterClothesShopMessages()` moved from an effect into the component body (skill rule);
  - new `components/clothes-shop/ClothesShopView.scss` (imported in components/index.scss): `--left-shift: 0` for
    the shop only, the badge overlay, the details panel (wardrobe-container tokens), the Buy button nowrap;
  - `useAvatarEditorGridColumns(ref, dependencies = [])`; the shop passes `[ isVisible ]`;
  - `UITexts.json` (backup `.bak-20261002`) got the 2 keys; renderer-config `UITexts.json?v=20261002`.
- **Verified** (headless Kasper, cache off):
  - card 390-1010 and content 390-1010 (was 320);
  - hint and empty-basket texts;
  - HEAD tab 4 tiles in one row;
  - selecting the drink hat shows it on the preview, details "Casque Anti soif (V) 500 Remove", basket chip, BUY (1),
    total 500 readable;
  - the outfit editor still has 5 per row and the -70 px shift.
- Players who loaded the client in the last 4 h keep the old index.css until it expires or a hard refresh
  (Cloudflare Browser Cache TTL).

## Right-click menu keeps the hotel loaded (2026-10-02, deployed, needs a test by the user)
User: right-click actions shouldn't reload the page; the player should go back to the client still logged in.
- **Before:** `PageMenuView` set `window.top.location.href`, so the whole page left /hotel and unloaded the client.
- **Now:** inside the website frame the menu sends `postMessage({ type: 'hcms:navigate', path }, '*')` to the
  parent; standalone (play.habbo.nz on its own) it opens the page in a new tab. "Reload hotel" still reloads only the
  client frame.
- **Website** (`hCMS/public/assets/js/client/client.js`, `ModuleClient.bindClientNavigation`, bound once): accepts
  the message only when `event.source` is the `.ModuleClient iframe` window and the path is a plain site path
  (`/^\/(?!\/)[A-Za-z0-9\/_\-.%]*$/`), then calls `Router.routerExec(path)`. The router hides the hotel layer without
  unloading it, and going back to /hotel uses `showHotelOnly` (no reload, same session).
- **Not tested live:** the headless browser has no website login. Players need a page reload to get the new
  client.js / client once.
- **Menu redesign** (user: "better design with icons and open shop there"): two titled sections.
  - Hotel: Presence shop `shop/show`, Catalog `catalog/show`, Clothing shop `clothes-shop/toggle`, Inventory
    `inventory/show`; until now Presence opened only with `:shop` / `:presence`.
  - Website (hotel stays loaded): Home, My profile, Values, Settings; then Reload hotel.
  - Each row has a Habbo icon (`icon-pf-rare`, `icon-catalog`, `icon-me-clothing`, `icon-inventory`, `icon-house`,
    `icon-me-profile`, `icon-credits`, `icon-me-settings`, `icon-arrows`) drawn at 22×22 pixelated.
  - `PageMenuView.scss`: section titles, flex rows, hover/active states, 0.12 s fade-in, theme panel colour.
  - Verified headless: all 9 rows with icons; "Presence shop" opens the Presence window; "Clothing shop" opens the
    Clothing shop; the menu closes after a click.

## Toolbar logo, favicons, Today card, fun commands (2026-10-02, deployed + verified)
- **Toolbar "C" → our "H"**:
  - `src/components/toolbar/ToolbarBranding.scss` is imported last in `components/index.scss`.
  - It overrides `.nitro-toolbar-container .icon.icon-habbo` with `cdn.habbo.nz/c_images/icons/logo_habbo_icon_toolbar.png`
    (34×41) plus an `@2x` file (68×82) via `image-set`, drawn at 1:1.
  - The source `logo_habbo_icon.png` (46×56, a copy of `assets/img/header/logo/logo_habbo_h.png`) squeezed into the
    42×44 slot with `pixelated` dropped pixel rows (user: "bad quality"). It is now pre-scaled with Lanczos.
  - The 2× file is nearest ×2, then Lanczos.
  - Verified headless in room 522 (computed background + crop).
- **Favicon pack from logo_habbo_icon**:
  - Files: favicon.ico (16/32/48), favicon-16/32, apple-touch 180 (dark background), android-chrome 192/512,
    mstile-150, safari-pinned-tab.svg.
  - Copied to `public/` (client → play.habbo.nz) and `hCMS/public/` (website + Filament admin, which falls back to
    /favicon.ico); `favicon.ico` also to `hcms-soon/`.
  - Links use `?v=2`. `index.html`, `site.webmanifest` and `browserconfig.xml` now say "Habbo" with the theme colour #1b1b1b.
  - Old files backed up in `db-backups/favicons-20261002/`. Verified: all URLs 200; play's favicon.ico is
    byte-identical to the website's.
- **Daily reward window restyle** (user: "too bright"):
  - Softer surfaces via `--engagement-surface` (5% of the text colour); the today tile is gold.
  - The Quests tab scrolls (`.engagement-scroll`, max-height min(60vh, 520px)).
- **Today card redesign** (`OnlineChestView`, `EngagementView.tsx/.scss`; user: "give info about all, clean"):
  - **Closed** (the default): a 2×2 grid of tiles (Reward claim/claimed, Chest ready/min/done, Quests x/bonus,
    Pass level).
    - Green border = something to do.
    - Click: reward → Daily window; chest → opens it when ready; quests/pass → Quests tab.
    - Then one earnings line (Emeralds x/cap, Diamonds x/cap, minutes to the next payout).
  - **Open**: one `TodayRow` per system (icon, title, status pill, sub-line, bar/button):
    - Daily reward (claim button);
    - Online chest (bar + open / skip for Diamonds);
    - Daily quests (open quests + bonus line);
    - HabboPass (level bar + missions done/total);
    - Earned online (two bars).
  - Width follows the 200 px right column; tile text truncates. The first deploy used 230 px and overflowed (user:
    "today width is broken").
  - Removed CSS: `engagement-chest-bar`, `engagement-today-count/badge/dot`.
  - Verified headless: closed and open both 200 px wide, scrollWidth 200.
- **Fun commands** (hcms-emulator-plugin `commands/HabboCityCommands.java`):
  - Reference: our old LTDCMS plugin, `LTDWEB/LTD Emulator + LTDUI/ltdcms-plugin/src/main/java/com/ltd/cms/rp/`
    (RpEmoteCommand, RpMassEmoteCommand, FacepalmCommand); the Krews fun-commands jar in `c:\tools\plugins-reference`.
    Rewritten in our command framework, not copied.
  - Single target, friends only, 5 s cooldown, effect for 5 s on both:
    - `:hug` / `:kiss` need to stand next to the friend (effects 9 / 168);
    - `:airkiss`, `:airhug`, `:love`, `:like` work at any distance in the room (168 / 9 / 9 / 165);
    - `:slap` works on anyone next to you (53, no friendship needed).
  - `:slime <name>`: friends only; lands after 1 s, misses if the target walks (red bubble), otherwise green bubble +
    Slimed effect 169.
  - **`<name>` or `all`** (user: "air commands with username all"): `:airkiss all`, `:airhug all`, `:love all`,
    `:like all`, `:slime all` reach every friend in the room (30 s cooldown).
    - `:hugfriends`, `:kissfriends` (`:airkissfriends`), `:lovefriends` (`:airlove`), `:likefriends`, `:slimefriends`
      are the same as `all`.
    - `:airlove` is a key of `:love` (user: "airlove also user"): `:airlove <name>` for one friend, `:airlove all` for
      every friend in the room. Verified: Mia gets it, `all` counts 1 friend, Tobias (not a friend) is refused.
    - All of them share one `Mass` routine, `toAllFriends`.
  - `:facepalm <name>`, room rights (level 2):
    - Refused on staff (`acc_unkickable`), the owner, people with rights and yourself.
    - The actor shouts; the target walks to the door and is pinned there for 15 s (`pinAtDoor` waits until they
      arrive).
    - LTD's version set `canWalk=false` right after `setGoalLocation`, which froze the target in place instead.
  - Permission columns `cmd_hc_*` were created on boot, default '1' (facepalm '2').
  - Help list: Fun commands + a new "Friend commands" section; facepalm is under Moderation (`HelpCommandData.ts`).
  - Verified with 3 raw clients in room 522 (Kasper owner, Mia friend, Tobias not a friend):
    - hug on a non-friend refused; airkiss/airhug/slime/like all/airkiss all/slimefriends delivered to Mia;
    - self-target refused;
    - Mia's facepalm (no rights) stays plain chat; Kasper's facepalm sends Tobias to the door + notice.
  - Jar backup: `hcms-emulator-run/plugins/hcms-emulator-plugin.jar.bak-prefuncmds`.
- **Dev server**: `vite.config.js` `server.watch.ignored: ['**/dist/**']`. A deploy build rewriting `dist/` crashed
  `yarn start` with EBUSY. Verified: the dev server survives a deploy.
- Type check 52 errors (baseline 49). None are in the files touched here; they are in wired/truffle/protected files
  from earlier work.
- Open: the user to try the new commands and the Today card in their own client.

## HabboPass window in the hotel (2026-10-02, deployed + verified)
User: a HabboPass card in the client, "center design", then "remove the background colour, same as the UI" and
"fix avatar placing with our avatar imager".
- **Owner stays the website:**
  - New command `hCMS/app/Console/Commands/PassState.php`, `hcms:pass {userId} {--claim}`: prints the pass as JSON
    (`CityPassService::state`, names/images from `RewardType::describe` made absolute with APP_URL, winwins,
    `Avatar::body` image).
  - `--claim` runs `CityPassService::claim` first (row lock + per-level idempotency keys).
- **Plugin:** `engagement/PassProtocol.java`, IN 9648 (string `state`|`claim`), OUT 9649:
  - `bool loaded`, then `bool active`, `int collected`;
  - if active: `string season`, `int endsAt`, `int level`, `int maxLevel`, `int into`, `int perLevel`,
    `int freeClaimed`, `int vipClaimed`, `bool isVip`, `int winwins`, `string avatar`;
  - then `int n` + n × (`int level`, `string freeName`, `string freeImage`, `string vipName`, `string vipImage`).
  - Runs through the new `GameEventBridge.query()` (separate 2-thread pool, full stdout); Gson parses it.
  - 1 s per-user interval, one at a time per user. About 1.1 s per call (artisan boot).
- **Client:**
  - `api/engagement/PassProtocol.ts`.
  - `components/habbopass/HabboPassView.tsx/.scss`: lazy and token-gated (PLAYER_VIEWS + `protect-chunks.mjs`
    level 1), SCSS through `components/index.scss`. Link `habbopass/show|hide|toggle`; the Today card's Pass tile and
    HabboPass row open it.
  - Layout = the website's HabboPass (`rewards/index.blade.php` + `css/hotel/rewards.css`), same class names
    (top-rewards-pass, profile, progress pill, info text, collect button, grand-prize "lot" box, horizontal
    tracks-grid with free / level / VIP).
  - Colours are theme tokens (no dark Center background). The VIP lock is the Habbo icon
    `icon-navigator-room-locked`, not the emoji.
  - Clicking a column shows its reward in the prize box. It scrolls to the next level.
  - Avatar: the imager's full 128×220 `size=l` canvas drawn 1:1 at -24/-40 px inside the 80 px box (head and
    shoulders), instead of the website's stretched crop.
- **Verified headless (Kasper):**
  - The window opens from the Today tile: 26 columns, "You have 52 winwins", "48 winwins to go", prize "HabboPass S1
    - Level 26 banner".
  - Claim: after a test grant of 48 winwins to Kasper (`WinwinService::grant`, key
    `test:habbopass-client:20261002`), "Collect 1 reward" → "You collected 1 reward", column 1 shows Collected, the
    button disappears.
  - DB: `free_claimed` 1, item 10217 (Teal Elephant Statue) in Kasper's inventory.
- Levels without a reward on a track show "-" (7, 13, 15, 18, 24 free; 7, 11, 14, 17, 22, 26 VIP). That is the
  season data, not a bug.

## Testing pass: daily quests after 5 + the 5-done bonus (2026-10-02, verified live)
Raw client as Kasper (chat 21 lines in 522, visit open rooms 89/352/353/354/357/360):
- Quests 3-5 done (chat 20, rooms ×2): each "Quest done … +10 Emeralds" bubble; Emeralds 69 → 79 for the 5th.
- 5th done: "5 daily quests done! Bonus: 5 Diamonds"; Diamonds 1 → 6; `hcms_daily_quest_days.bonus_paid` = 1.
- The quest drawn after the bonus (slot 7, respect_give) has a reduced reward: 3 Emeralds + 3 XP (pool value 10/10).
- Earlier today's staff test (section "Live test of the staff features") already covered staff PIN, duty, security
  modes, incident claim, notes, trade ban, prison and reset sanctions. The CLAUDE.md list was stale; corrected.
- Still open:
  - profile moderation as VIP/Moderator (needs a VIP membership row; the user's OK);
  - the chest-ready bubble and the chest/freeze race (needs 30 min in a room);
  - builder erase;
  - Halloween furni (dresser, hatch teleport, placing);
  - the security modes' automatic actions.

## Avatars: head images framed like Habbo's, HabboPass/Quests in the website style (2026-10-02, deployed)
- **Root cause of "website avatars not centred where img.habbo.nz is used":**
  - Our imager (hcms-imager, nitro-imager base) returned `headonly=1` on the full 64×110 body canvas.
  - Habbo's imager (which the website's copied CSS assumes) returns a tight 54×62 head (108×124 at size=l).
  - Fix: `hcms-imager/src/app/router/habbo-imaging/handlers/utils/CropHead.ts`. For `headonly` without an aura,
    the PNG is cut to 54×62 × size around the head's visible pixels.
  - The 7 cached `st-head` files in `saved-figures/` were removed; the imager was rebuilt (`npx tsc`) and restarted.
  - hCMS `Avatar::head()` adds `v=2` to bust the 1-day image cache (the imager's index.php drops unknown params).
  - Verified: headonly 54×62 (bbox centred), size=l 108×124, full body unchanged 64×110.
  - Not seen by me: the logged-in pages (navbar, home feed, Center owner tags). The headless browser has no website
    session.
- **HabboPass avatar box** (website `rewards.css` + hotel `HabboPassView.scss`; user: "like before but centre the
  avatar"):
  - The old size is kept: the size=l body shown at 120×206 (0.9375), positioned -22/-36.
  - The head is now centred, with the shoulders below. The website's old rule was also squeezed by the global
    `img { max-width: 100% }`; `max-width: none` stops that.
- **Winwins → XP** on the HabboPass (website `rewards/index.blade.php` + hotel window): "You have N XP", "N XP to go".
  The data name stays `winwins`.
- **Hotel Quests tab** (Daily reward window; user: "quests same like website style"):
  - `DailyQuestsView` now uses the website's quest cards (`rewards-quests-grid` / `rewards-quest-card` / badges /
    progress row) in theme colours, open quests first, done ones dimmed with a tick in the "Done" pill.
  - Missions are the same cards; there are HabboPass + Achievements buttons.
  - The time/XP pill icons come from the website (`url.prefix` + `/assets/img/icon/icon_time.png`,
    `/assets/img/center/money/icon_winwin.png`).
  - `PassBar` and `QuestReward` were removed (unused).
  - Verified headless: 16 cards, 5 dimmed.

## Avatar framing matched to HabboCity's imager (2026-10-02, live)
User: "same like HabboCity avatars position spacing". Measured in the user's Chrome (HabboCity home tab, read-only):
- **HabboCity:**
  - home `.card-avatar img` = `avatar.habbocity.fr` 128×220 (size=l, action=wav), drawn with the original CSS at
    (13, 3);
  - the same look on their imager has bbox (36, 32)-(95, 201).
- **Ours** was (36, 44)-(96, 214): every avatar 12 px lower at size=l (6 px at 64×110), our geometry's canvas `dy: 6`.
- **Fix (hcms-imager `HabboImagingRouterGet.ts`):** `translate(pad, pad - avatarCanvas.offset.y * size)`. Now
  (36, 32)-(96, 202), the same as HabboCity.
- **Auras:** the padded canvas is cut back to the normal size for PNGs, so aura avatars sit exactly where plain ones
  do (the glow stays inside). GIFs keep the padding.
- The whole `saved-figures/` cache was cleared. hCMS `Avatar::build` appends `v=3` to every imager URL (cache bust);
  head's own `v=2` was removed.
- **CSS reverted to HabboCity's originals:**
  - `_left-profil.css` `.card-avatar img` (left 7% / small −10%, relative);
  - `rewards.css` `.avatar-rewards-pass img` (120 × 100%, cover, −26/−23);
  - the hotel `HabboPassView.scss` mirrors the website rule.
  My centring workarounds from earlier today are gone.
- Verified: our home card with the live CSS beside HabboCity's: same head height and spacing (screenshot compare).

## Room YouTube, :info card, word filter, Kasper chat bridge (2026-10-02, deployed + verified)
- **Room YouTube `:play`** (like LTDCMS `youtube/YtManager`, rebuilt):
  - Plugin `youtube/RoomYoutube.java`: IN 9650 (string pause|resume|seek|stop, int seconds), OUT 9651 (string
    videoId ("" = stop), int position, bool paused, string by, bool roomWide, bool canControl).
  - Command Def `play` (keys play/yt/video, level 1): `:play <link>` = whole room (needs rights or
    `acc_anyroomowner`), `:play own <link>`, `:play stop`. 5 s command / 0.7 s control cooldowns.
  - State lives in memory per room: sent on room enter, cleared on leave (client) and on RoomUnloaded.
  - Client `api/youtube/RoomYoutubeProtocol.ts` + `components/room-youtube/RoomYoutubeView.tsx/.scss` (lazy, gated):
    youtube-nocookie iframe with the JS API via postMessage. Rights holders get Pause/Play, ±10 s and Stop for the
    room; everyone gets Mute and Close (local).
  - Verified with 2 clients: play/pause/resume reach everyone, canControl only for rights, a late joiner gets paused
    at 6 s. Fixed: controls use the position at click time.
- **`:info` / `:about` card** (LTDCMS `staff/AboutInfoCommand` + `comp-notification.js packetEmuInfo` /
  `.ltdEmu` CSS, 1:1):
  - Plugin `info/HotelInfo.java` cancels the core `AboutCommand` (UserExecuteCommandEvent, like faceless) and sends
    OUT 9652: name, version, engine, licensee, copyright (settings `hcms.info.*`, registered defaults), int uptime,
    online, rooms, total, today.
  - Client `api/info/HotelInfoProtocol.ts` + `components/hotel-info/HotelInfoView.tsx/.scss` (DraggableWindow, banner
    handle).
  - Assets copied to `hCMS/public/cdn/c_images/info/` (banner.png from LTD's imgur banner, close_24.png,
    glitter.gif). Our "H" replaces LTD's h_icon.
  - Verified headless: card with live numbers.
- **Word filter** (user/Habbo: normal words got "bobba"):
  - The only entry was `com`, so it hit coming/welcome/computer. It is now `.com`.
  - `hotel.wordfilter.normalise` = 0: the core normalise turns dots into spaces, so `.com` could never match.
    Loaded with `:update_config` by staff.
  - Added the 36 findretros.com hotels (Khalil): 35 domains + distinctive brand names → "Habbo", 69 rows. Ordinary
    words were left out (fresh, aura, casper, dito, rova, wobbly, "Habbo Days").
  - Exotic link endings (.pw .io .nu .tel .xyz .online .life .my.id .co.uk) → "" so a brand + ending ends as "Habbo".
  - 79 rows total. RCON `updatewordfilter`.
  - Verified as Kasper: "join Habbo or Habbo, Habbo, Habbo"; "fresh aura habbo come welcome" untouched.
  - Core quirk: a filtered line is lowercased.
- **Kasper chat bridge** (users asked Claude to talk in the room):
  - scratchpad `chat-bridge.mjs` (raw client: logs room chat to chat-in.txt, says lines from chat-out.txt, `!look`
    sends 2730).
  - Kasper's look was changed by request (beanie + 3D glasses).
  - Not part of the product; it stops when the session ends.

## HabboPass window v2, Daily Hub, shared loader, reconnect 3 attempts (2026-10-02, deployed)
- **Shared loader** `common/layout/LayoutCenterLoaderView.tsx/.scss` (exported from `common`): the website Center's
  spinning logo (`url.prefix` + `/assets/img/loader/logo_loader_black.png`), as an overlay (default) or inline. Use it
  wherever a window waits for data (user: "our loader, always when one is needed").
- **HabboPass window** (`components/habbopass/HabboPassView.tsx/.scss`):
  - Tabs like the Presence shop: the website Center menu pills (`center-menu-wrapper` / `center-menu-items` /
    `icon-center`). Their CSS moved into a shared mixin `components/shop/_center-menu.scss` (`@include center-menu`),
    used by the shop and HabboPass. Icons from the website: `rewards/menu/icon_pass.webp`, `icon_quest.png`.
  - Tab Quests = `EngagementQuestsPanel` (exported from `engagement/EngagementView.tsx`, reads the live engagement
    state).
  - The Daily reward window lost its Quests tab; `engagement/quests` and the Daily Hub quest tile open
    `habbopass/quests`.
  - The loader replaces "Loading HabboPass..." and covers the pass while collecting.
  - Avatar: `.avatar-rewards-pass img` absolute at (-22, -25), 120 wide, height auto (the box is a grid in the client,
    which centred the 206 px image; the website ends up at (-22, -25)).
  - Content `zoom: .9`, window 690 px (user: smaller, then "a little less zoom").
  - Quest cards compacted (padding, 32 px icon, 13 px text, progress row indented); the list scrolls at
    min(46vh, 400px).
- **Today card → "Daily Hub"** (`OnlineChestView`; user: "better name", "VIP badge or Join VIP", "don't expand, open
  info in a card"):
  - It never expands now. A gold VIP pill for VIP members; a "Join VIP" pill otherwise (opens `/center/vip` on the
    website via `OpenOnSite`).
  - An "i" button opens a "Daily Hub" window (NitroCardView `daily-hub`, 340 px) with the detail rows, in theme
    colours (`.engagement-hub-window` overrides).
  - `OpenOnSite` moved from PageMenuView to `api/hc-center/OpenOnSite.ts` (shared).
- **Reconnect** (`components/reconnect/ReconnectView.tsx`; user: "use our loader and give 3 retries"):
  - `SocketConnection.MAX_RECONNECT_ATTEMPTS = 3`, `BASE_RECONNECT_DELAY_MS = 10000` (about 10 s / 20 s / 30 s, so an
    emulator restart of ~60 s is covered).
  - While reconnecting it shows the startup `LoadingView` with "… Attempt N of 3" (reads `_reconnectAttempt`); after
    giving up, the existing card with "Open the hotel".
  - Not tested live (needs a dropped connection, i.e. an emulator restart).
- Verified headless: HabboPass tabs + avatar head/shoulders + compact quests (11 cards); Daily Hub card ("Join VIP")
  + details window.
- **HabboPass icon = our "H"** (user: "logo_habbo_icon for habbopass and on pass level 1 on daily hub", then "it's
  pixelated"):
  - The Daily Hub Pass tile + HabboPass row (`.engagement-today-xp-icon`) and the HabboPass window's HabboPass tab use
    the logo.
  - Exact-size Lanczos files on the CDN: `c_images/icons/logo_habbo_icon_{20,26,30}.png` + `@2x` (nearest ×4, then
    Lanczos ×2), `image-set`, `image-rendering: auto`.
  - Scaling the 34×41 toolbar file with `pixelated` (the Center menu icon box) dropped rows.

## Lotto (ReactLottery-style raffle, habbo.cc homepage), Random Word, Games admin panel (2026-10-02/03, deployed + verified)
User asks: Buchstabensalat → "Random Word" `:rw`; lotto with several tickets + draw, "like habbo.cc"; then "do this one"
(devbest ReactLottery, read in the user's Chrome) with Random Word "in that panel"; room chat bubble 34 like the staff
feed; text style + badges RANDOMWORD / LOTTO "like staff feedback".
- **First version reverted:**
  - A website-owned number lotto (hCMS LottoService / `hcms:lotto` / homepage picker) existed for a few hours.
  - All payments were refunded (`lotto.refund`, 138 Emeralds to users 1, 3, 4, 5), its migration was rolled back
    and the files were deleted.
- **Lottery (plugin `games/Lottery.java`):**
  - The plugin owns it, like ReactLottery: `:buylotto <amount>` (keys buylotto/lotto/lottery; `:lotto` alone = info).
  - Settings `hcms.lottery.*` in emulator_settings: schedule interval|weekly (+ weekly day/hour/minute), price +
    price_currency, max_per_user / max_per_ip per draw, daily_cap, exclude_staff + staff_rank, winners,
    repeat_winners, prize_mode jackpot|fixed|random|pool, seed_pot, pot_share, fixed_currency/amount, pool_name,
    pool_switch none|daily|weekly|monthly (pool names day-N / week-N / month-N, fallback "default"),
    bonus_diamonds (3, like habbo.cc), predraw_alert_seconds, badge LOTTO, bubble 34.
  - Tables: `hcms_lottery_draws`, `hcms_lottery_tickets`, `hcms_lottery_prizes`, `hcms_lottery_winners`.
  - Winners are weighted by tickets. Prizes are paid via `GameRewards` (Wallet.give, or the new `Wallet.giveOffline`
    for offline winners, ledger rows included; rare/furni prizes as items). The badge goes with a feedback bubble.
  - No tickets = the pot rolls over.
  - Announcements are self room lines in bubble 34 ("[LOTTO] …", like the staff feed): a 1-minute warning, the
    draw, and a personal win line.
- **Staff:** `:lottoadmin start|stop|draw|reset|set <key> <value>` (rank S). Reset refunds all tickets of the open
  draw.
- **Random Word (`games/WordScramble.java`, was Buchstabensalat):**
  - `:rw <word>` / `:randomword`; `:rwstart [word]` and `:rwauto` (staff).
  - "[RANDOM WORD]" bubble-34 room lines; winner badge RANDOMWORD.
  - Auto rounds respect `hcms.scramble.enabled`; expiry runs even with auto off.
- **Games admin panel:**
  - Plugin `games/GamesAdmin.java`, IN 9653 (string action, string JSON) / OUT 9654 (string JSON:
    `{lottery, word, message}`).
  - `hcms.games.admin_rank` (6). 9653 is on the StaffPin lock list.
  - Actions: lottery.enable/disable/draw/reset/set/prize.add/prize.remove, word.auto/start/stop/set/add.
  - Client: `api/games/GamesAdminProtocol.ts`, `components/mod-tools/views/games/ModToolsGamesView.tsx/.scss`
    (Mod Tools → "Games", securityLevel ≥ 6, chunk level 6).
- **Badge bubble:** `CommandFeedback.tellWithImage` (a bubble with an `image` key; hcms-feedback leaves bubbles that
  already have an image alone).
  - `GameRewards.badge` shows the badge GIF (`hcms.badge.image.url`) and links to inventory/show.
  - `RANDOMWORD.gif` was drawn (40×40) into `cdn/c_images/album1584/`.
  - ExternalTexts badge_name/desc for LOTTO + RANDOMWORD (backup `ExternalTexts.json.bak-20261002-games`,
    renderer-config `?v=20261002g`).
- **Homepage (hCMS):**
  - The "Lotto" section is 1:1 with habbo.cc's home lotto (classes home-section / section-header /
    lotto-jackpot-label / lotto-featured-card / lotto-compact-item, CSS taken from habbo.cc's stylesheets via CDP,
    with our theme variables): current jackpot, the latest winner featured, and 2 compact winners with +Diamonds.
  - Today and Random Word (letter tiles) sit in the same section style below. The publish (staff feed) box was
    removed from home.
  - `_games.css`, `LotteryQuery`, `ScrambleQuery`. Ranking: `/ranking/lotto` (most wins / most won / most tickets),
    menu "Top Lotto".
- **Also:**
  - HabboPass counts VIP rank and staff as VIP (`CityPassService::countsAsVip`: membership or rank ≥
    engagement `vip_rank`), so no locks for staff.
  - The HabboPass loader only shows before the first load and while collecting.
- **Verified:**
  - `:buylotto 2` / `:lotto` / `:buylotto 1` as Kasper (pot 50 → 54 → 56, ledger `lottery.tickets` with JSON
    context);
  - Random Word announcements and wins as bubble-34 lines (GALAXY by Habbo);
  - the panel protocol as a temporary rank-6 Mia (state / set / word.add 50 → 52; Mia back to rank 1, PIN removed);
  - the homepage rendered as Kasper.
- **Fixed during testing:** the ledger `context` must be valid JSON (the CHECK constraint failed on "lottery:1").
  Four missing rows were backfilled (3 Random Word wins + 1 ticket payment, `backfilled: true`). Phi got
  RANDOMWORD for an earlier win.
- **Not verified yet:** a real draw with a winner (the first is at 02:05 on 2026-10-03), the client Games window UI
  (only its protocol), the weekly schedule.

## Game chat lines styled (2026-10-03)
- `src/components/room/widgets/chat/ChatWidgetMessageView.tsx`: bubble-34 lines starting with `[LOTTO]` or
  `[RANDOM WORD]` go through `gameLineHtml` (in `staffFeedHtml`, so the Staff Settings preview gets it too):
  - the game badge gif (`badge.asset.url`) as the icon, then the tag as a coloured label (LOTTO `#c27c0e`, RANDOM WORD `#6d28d9`);
  - the rest of the line:
    - UPPERCASE words (the scrambled word, the answer) bold in the tag colour;
    - amounts like "56 Emeralds" bold green, with the wallet icon (`currency.asset.icon.url`);
    - `:commands` amber;
    - the solver's name and the lotto winners bold;
    - normal word wrapping (`word-break: normal`).
- A new game tag needs one entry in `GAME_TAGS` (colour + badge code). No server change was needed.
- Verified: in the headless client as Mia, the Bet room `:rw` and `:lotto` lines had the expected HTML, checked with a screenshot. Mia's temporary ticket and home room were reset afterwards.

## Seasonal furni spawns, Swap-o-Matic, HabboPass cache, games UI (2026-10-03, deployed + verified)
- **Furni spawns** (`hcms-emulator-plugin games/FurniSpawns.java`):
  - Settings `hcms.spawns.*`: enabled, season (halloween), interval_seconds 300, min_users 2, max_rooms 3,
    lifetime_seconds 120, daily_cap 20, bubble 34, rooms (list) / owner_ids (2 = officialrooms).
    The user set rooms=525 and min_users=0 while testing.
  - Tables: `hcms_spawn_items` (seeds 4274 Pumpkin w10, 6216 Colorful Candy Skull w4, 4268 Habboween Pumpkin w1),
    `hcms_spawn_active` (cleaned at boot), `hcms_spawn_collects`.
  - Tiles: only free tiles reachable from the door (BFS over walkable tiles). Bet room 357 has one isolated free tile, so
    it is skipped.
  - Collecting: double-click walks the player next to the furni (`HEADING` + `UserTakeStepEvent`) and collects it;
    stepping onto it also collects. Pickup and move of a spawn are cancelled.
  - Collected = the item moves to the collector's inventory. Uncollected = removed after its lifetime ("vanished").
  - Room lines use the "[SPAWN]" tag.
- **Swap-o-Matic** (was "Automat"; `games/Automat.java`, IN 9656 / OUT 9655):
  - `:swap` (aliases swapomatic, automat), or double-click the machine furni (`hcms.automat.machine_items` = 5524
    xmas13_machine1 "Magical Machine").
  - Trading needs a machine in the room. Offers come from `hcms_automat_offers` for the spawn season (4274 ×5 → 5 Emeralds,
    6216 ×3 → 6 Emeralds, 4268 ×1 → 2 Diamonds).
  - Only collected, not yet swapped items count. They are deleted on a swap, which pays via Wallet with a JSON ledger
    context. Room lines use the "[SWAP]" tag.
  - Client: `components/automat/AutomatView.tsx/.scss` (lazy, player chunk), link `automat/open`, Help entry `:swap`.
- **Games panel**:
  - Spawns and Swap-o-Matic tabs. The layout copies Staff Tools: `nitro-mod-tools-staff-settings` classes, duty-style
    status row, `staff-home` stat grid, `admin-box`.
  - New GamesAdmin actions: spawns.set/now/item.add/item.remove and automat.set/offer.add/offer.remove.
- **Lotto**: new `hcms.lottery.win_chance` (60 %). On a miss there is no winner, the tickets are used up and the jackpot
  rolls over ("No winner this time!").
- **Chat game lines**:
  - `gameLineHtml` in `ChatWidgetMessageView.tsx`, tags LOTTO `#c27c0e`, RANDOM WORD `#0284c7`, SPAWN, SWAP. No badge icons.
  - Amounts show as number + wallet icon; words in capitals, commands and names are highlighted.
- **HabboPass speed**:
  - Every open ran `php artisan hcms:pass` (3–4 s on this server: 0.65 s process start, 1.6 s Laravel boot, 1–1.7 s query).
  - `PassProtocol` now keeps the last state per player, sends it at once and refreshes it in the background. The cache is
    warmed 15 s after login and cleared on disconnect.
  - Measured: 6–40 ms instead of 3–4 s.
- **Website /home**:
  - Lotto and Today side by side in `card-eco` boxes (same CSS as "Latest additions to the economy"; `home-game-label` pill).
  - Random Word was removed from the website (`_randomword.blade.php`, `ScrambleQuery` deleted).
- **habbo.cc lotto (read-only, via CDP and their saved client bundle)**:
  - Ticket based, no number picking.
  - The server pushes a "Live Lotto" panel to the client (show/update/hide: Taler jackpot, Diamonds, player count,
    countdown bar).
  - The homepage only lists the jackpot and the winners.
  - How players join isn't in the client (server side). That part is inference.
- **Verified with a raw client (Mia, rank restored to 1, PIN rows deleted)**:
  - spawn, walk-and-collect, the inventory row and the collect row;
  - the swap (+1 Emerald, ledger `automat.exchange`), and a second swap refused;
  - `:swap` opens the window;
  - HabboPass answers from the cache;
  - reconnect: an RCON disconnect shows the loader "Attempt 1 of 3" and the client is back after about 10 s.
- **Not verified**: the Swap-o-Matic window and the Games tabs by eye in a real client; a natural timed spawn round.
- **Open**:
  - No Swap-o-Matic machine is placed in any official room yet.
  - The permission column `cmd_hc_automat` is unused since the rename to `cmd_hc_swap`.

## Swap-o-Matic: machine furni only (2026-10-03, deployed + verified)
- User: "user can only swap with the furni automat".
- `:swap` / `:swapomatic` / `:automat` removed from `HabboCityCommands`; the Help entry and the client link `automat/open`
  are removed too.
- `Automat.java`:
  - The window opens only by double-clicking a machine furni (`hcms.automat.machine_items`) while standing within 2 tiles
    of it (`REACH`). Farther away you get "[SWAP] Walk up to the Swap-o-Matic to use it."
  - An "open" packet sent away from a machine is ignored. An exchange away from a machine is refused ("Walk back to the
    Swap-o-Matic machine to trade in.").
- The spawn collect line now says "Trade it in at a Swap-o-Matic machine."
- Verified (Mia, raw client, room 525): `:swap` opens nothing, the open packet is ignored, the exchange is refused.
- Not tested: the positive path at a placed machine. No machine is placed yet.
- The permission columns `cmd_hc_swap` / `cmd_hc_automat` are now unused.

## Game payouts show a "You received" bubble (2026-10-03, deployed + verified)
- User: "why no received emeralds bubble feedback". `Wallet.give` only changes the balance and writes the ledger; the games
  never told the player.
- `games/GameRewards.currency` now also sends `received(habbo, type, amount)` to an online player: a feedback bubble
  "You received N <currency>!" with the wallet icon (`hcms.currency.image.url`, default
  `https://cdn.habbo.nz/images/wallet/%type%.png?v=4`).
- The Swap-o-Matic exchange and the Random Word prize now pay through `GameRewards.currency` (they called Wallet
  directly). The lotto win, bonus and refund already used it.
- Verified: Mia won a Random Word round → bubble "You received 10 Emeralds!" with the 101 icon; ledger `scramble.win`.
  Mia was reset afterwards (rank 1, PIN rows deleted).
- Seen: a badge win shows two bubbles, the stock "You received a new badge!" (its image is still
  `${image.library.url}…`) and ours "New badge: …".

## Random Word: random currency prize (2026-10-03, deployed + verified)
- User: "random prize but only currencies".
- `games/WordScramble.java`:
  - New setting `hcms.scramble.prize_mode` = random (default) | fixed. Fixed keeps prize_type/prize_amount.
  - New table `hcms_scramble_prizes` (currency, amount, weight, enabled; unique currency+amount). Seeds: 10 Emeralds w6,
    20 Emeralds w3, 2 Diamonds w2, 5 Diamonds w1.
  - Each round draws its prize when it starts. It shows in the start line, the win line and the "You received" bubble.
- GamesAdmin: `word.prize.add` (currency 0/5/101/103, amount, weight) and `word.prize.remove`. `prize_mode` was added to
  the word keys. The state carries prizeType/prizeAmount/prizes.
- Games window, Random Word tab: a prize mode select, a "Prize pool" list with add/remove, and the stat shows the current
  round's prize.
- Verified (Mia temporarily rank 6, reset afterwards): 3 rounds drew 10, 10 and 20 Emeralds; win lines, bubbles and
  `scramble.win` ledger rows matched. Mia kept the 40 test Emeralds.
- (2026-10-03) Game chat lines: the amount before a currency icon takes that currency's colour (`GAME_CURRENCY_COLORS` in
  `ChatWidgetMessageView.tsx`: Emeralds #1e9e4a, Diamonds #1d9bd7, Duckets #a855f7, Snowflakes #38bdf8). Before, every
  amount was green.
- (2026-10-03) Currency icons sized to their pixels: in game chat lines the wallet icon is drawn at its own 15 px height
  (it was scaled to 13 px), pixelated. In feedback bubbles a wallet icon (`img[src*="/images/wallet/"]`, rule in
  `ChatReactions.scss`) shows at exactly 2× (30 px), pixelated, instead of a tiny 15 px icon in the 50 px box.
  Verified in the DOM: chat icon natural 13×15, drawn at 15 px. The bubble size was not checked live.

## Chest icon sizing, :plugins card (2026-10-03, deployed + verified)
- **Chest icon:** `chest.png` is 24×26 and was squeezed into 20 px (Daily Hub tiles) and 24 px (details rows) boxes, so it
  was blurry. The quest icon (17×24) had the same problem.
  - Fix: tile/row icon boxes are 26 px (`.engagement-today-icon.is-small` 26 px; HabboIcon size 26), so every icon is
    drawn at its own size.
  - Verified headless: chest 24×26 drawn at 24×26, quest 17×24 drawn at 17×24.
- **`:plugins`:**
  - The core PluginsCommand alert is replaced: `info/HotelInfo.onCommand` cancels it and sends OUT 9657 (string hotel
    name, int count, then name/author pairs, sorted).
  - Client: `api/info/HotelInfoProtocol.ts` `HotelPluginsEvent`; `components/hotel-info/HotelInfoView.tsx` shows our UI
    card (NitroCardView primary-slim, header "Plugins") styled like `:info`: the banner with the H icon and
    "N plugins loaded", the glitter heading, and rows with the name on the left and "by author" on the right (theme
    tokens, scrolls past 360 px).
  - `:info` itself is unchanged.
  - Verified headless (Mia temporarily rank 2, reset afterwards): 7 plugins listed.
  - Permission stays `cmd_plugins` (rank 2+).

## :plugins header banner, dark-mode borders, catalog ids (2026-10-03, deployed + verified)
- **`:plugins` card:** the banner image is now the card header itself (NitroCardHeaderView `classNames={['plugins-header']}`,
  headerText = H icon + hotel name + "N plugins loaded"; header 62 px, `max-height: none`). The separate banner block
  is gone.
- **Dark mode without card borders (user: "remove for whole darkmode borders like white mode"):**
  - `--holo-border-size` is now 0px in dark mode, in both `holo/_tokens.scss` (body.dark-mode) and the
    second dark block in `holo/_24-utilities.scss` (line ~280, the one that won).
  - This is a deliberate change from HabboCity's 3px dark border. `--holo-input-border-size` stays 3px in dark (inputs).
  - Verified headless with body.dark-mode: the plugins card border is 0px.
- **Catalog ids:**
  - The core added " (pageId)" to catalog page names for ranks with `acc_catalog_ids` (Administrator, Super Admin).
    Set to 0 for ranks 7 and 8 (2 permission rows); the emulator was restarted to load it.
  - The Furni Editor shows the ids itself: CatalogNavigationView/SetView/ItemView take an optional `showIds` that only
    FurniEditorView passes. Ids also appear on the Furni Editor's root tabs and in its page select labels.
  - Not checked by eye as an admin account.
- (2026-10-03) Dark-mode text fields have no border either: `--holo-input-border-size` 3px → 0px in the dark block of
  `holo/_24-utilities.scss` (light was already 0px). Component-specific input borders (1px in some windows, set in
  their own segments) apply in both modes and are unchanged. Verified headless: the chat input border is 0px in dark mode.
- (2026-10-03) Settings window double scrollbar fixed.
  - Cause: the card is 350 px; header 40 + content 316 (the content-area kept flex `min-height: auto`, so it could not
    shrink below tabs + list + 15 px margins), so the whole card scrolled by 6 px.
  - Fix: new `components/user-settings/UserSettingsView.scss` (`.user-settings-tab-container { min-height: 0 }`, imported
    in components/index.scss).
  - Verified headless: only the General list scrolls now (318 px content in 230 px; the scroll-container is part of the
    HabboCity reference).

## Dark mode: grey instead of navy (2026-10-03, deployed + verified)
- User edited our UI in Chrome to grey and asked for it: dark background `hsl(0deg 0% 16.68%)`. habbo.cc's grey client
  (read via CDP, read-only) was the reference: panels #333, inner rgba(38,38,38,.92), borders rgba(255,255,255,.06–.08).
- Both dark blocks (`holo/_tokens.scss` body.dark-mode and the one in `holo/_24-utilities.scss`) changed:
  primary H0 S0% L16.68%, secondary H0 S0% L15%, tertiary H0 S0% L40%, infostand H0 S0% L20%,
  border-color-primary/secondary #FFFFFF14. A deliberate change from HabboCity's navy dark palette.
- Verified headless (body.dark-mode): card background rgb(43,43,43).
- Not checked: components with their own hard-coded navy colours (if any show up, switch them to tokens).
- (2026-10-03) `:plugins` header height fixed.
  - Cause: the stock `.nitro-card-header-content` is absolutely centred (translate -50%) with 15 px top padding, so in the
    62 px banner header it was 92 px tall and the "N plugins loaded" line was cut off.
  - Fix, plugins header only: content static, 100% width/height, padding 0 15 px (sides unchanged), `transform: none`; header text
    height auto.
  - Verified headless: header 62 px, banner 36 px, centred (13 px above and below).
- (2026-10-03) `:info` and `:plugins` share one UI card.
  - `HotelCard` in `HotelInfoView.tsx`: NitroCardView primary-slim, 380 px, the banner as the header (`hotel-card-header`),
    the glitter title, then rows. The old white `.hotel-info-card` / DraggableWindow markup and CSS are removed.
  - Header: only the height changed from stock (content `height: 100%`, `padding-top: 0`); left/right stay stock.
  - H icon was blurry (34×41 art squeezed into 36×36 with `contain`). Now exactly 34×41 with image-set 1x/2x
    (`logo_habbo_icon_toolbar(@2x).png`).
  - Rows: info = label muted / value bold; plugins list = name bold / "by author" muted.
  - Verified headless: `:info` card, 8 rows, icon 34×41.

## Swap-o-Matic machine placed, single badge bubble (2026-10-03, deployed + verified)
- **Machine:** item 142912 = Magical Machine (base 5524), placed by SQL in the Lobby (room 352, owner officialrooms) at
  24,4 rot 4, two steps from the door. The room was empty and unloaded, so it loads on the next entry.
- **Badge bubbles:**
  - The core `Habbo.addBadge` always sends its own bubble, whose image `${image.library.url}album1584/X.gif` was never
    filled in (broken image).
  - Client: `useNotification.getNotificationImageUrl` now fills `${key}` from the client config, so every stock badge
    bubble (achievements, :badge…) shows its image.
  - Plugin: `GameRewards.badge` grants online badges through its own `grantBadge` (BadgesComponent.createBadge +
    AddUserBadgeComposer + AddHabboItemComposer, no stock bubble), so game wins show only ours ("New badge: X!",
    opens the inventory).
- **Verified end to end (Mia, raw client, temporarily rank 6, reset after; offers restored):**
  - a Random Word win gave 2 bubbles (currency + one badge);
  - a spawn collected in 525;
  - in the Lobby, double-click from far → "Walk up to the Swap-o-Matic", no window;
  - from 23,4 → window with machineHere=true; trade → "Traded 1 for 1 Emeralds", a "You received 1 Emeralds!" bubble
    and a [SWAP] line.
- **Seen:** the Random Word pool now also has Snowflakes prizes (ids 7–8, added via the panel, not by Claude).

## Prison: timer panel + bail (habbo.cc style) (2026-10-03, deployed + verified)
- **Reference:** habbo.cc (read-only: their saved client bundle + the live tab).
  - The roleplay jail shows a top overlay with the type, a text, an mm:ss timer and `:kaution` (bail).
  - Their moderation prison is a room ("Habbo Knast") with a "Deine Sanktion endet in … / Frei um" message.
  - User picked: timer panel + bail command.
- **Plugin:**
  - New `prison/PrisonerPanel.java`: OUT 9658 status (bool active; prison name, reason, seconds left, seconds total,
    bail allowed, bail price, bail currency) and IN 9659 bail.
  - Settings `hcms.prison.bail_enabled` 1, `bail_currency` 101, `bail_per_minute` 2 (price = remaining minutes,
    rounded up, × per-minute).
  - `Prison.java`:
    - Sentence has `secondsTotal` + `bail`; `hcms_prison_sentences.bail` column added (ALTER IF NOT EXISTS).
    - The panel is pushed on sentence / extra time / login and every 30 s; this push replaces the old 30-s
      "Prison: N left" bubble. It is cleared on served / staff release / bail.
    - `Prison.bail(habbo)`: checks the balance (synchronized), `Wallet.give(-price, "prison.bail", {"sentence":id})`,
      ends as released with released_by = the prisoner, sends home. Audit `player.prison_bail`; MODERATION feed
      "X paid N … bail and left prison".
    - `:bail` / `:kaution` (`HabboCityCommands`, cmd_hc_bail) stays allowed in a prison where commands are off.
  - Staff: Players card action `prison:<min>:<id>:nobail` (new "No bail" checkbox; extending a sentence with No bail
    turns bail off). Auto-prison by the security modes keeps bail on.
- **Client:** `api/prison/PrisonerProtocol.ts`; `components/prison/PrisonerPanelView.tsx/.scss` (lazy player chunk, theme tokens).
  - Top-centre panel: red bar, prison icon, name, reason, a progress bar and the mm:ss/h:mm:ss timer, counted down
    locally and corrected by every push.
  - Bail button with price + currency icon, two-step confirm ("Sure?").
  - Help entry `:bail`.
- **Verified headless (Mia, prison "Adminprison" room 524, commands off):**
  - 3-min sentence → the panel showed, bail 6 → 4 as time passed;
  - `:bail` → "You paid 4 Emeralds bail. You are free!", panel gone, status released (released_by 6), ledger
    `prison.bail` −4;
  - no-bail sentence → no button, `:bail` refused.
- **Also verified (staff path + button):**
  - Mia (temporarily rank 6, reset after) sent offline Tobias with `prison:2:1:nobail` via the Players card packet 9636
    → row bail=0; Tobias logged in headless → panel without a Bail button.
  - Staff release → the panel disappeared.
  - A new sentence with bail → "Bail 4" button; first click → "Sure? 4", second click → "You paid 4 Emeralds bail",
    panel gone, released_by = 7, ledger `prison.bail` −4 (Tobias kept the cost).

## Dark mode leftovers + Live Lotto panel (2026-10-03, deployed + verified)
- **Navy in dark mode:** only the Presence shop (`ShopView.scss`) and HabboPass (`HabboPassView.scss`) had their own
  dark palettes. Now: box #262626, box-double #2e2e2e, border #FFFFFF14, text-2 #B5B5B5. The holo segments
  already use tokens.
- **Live Lotto (habbo.cc "Live Lotto"):**
  - New setting `hcms.lottery.live_seconds` (300; in the Games window under Lottery settings).
  - When the draw is within that window, `Lottery.tick` pushes OUT 9660 to every online player: prize label, amount,
    currency (-1 = random/pool), bonus Diamonds, players, tickets, their own tickets, seconds left, window, ticket price
    and currency.
  - It is pushed again after every ticket purchase, to players who log in during the window (4 s after login), and
    hidden by `createDraw` / `reschedule` or when the window is shortened.
  - IN 9661 (int amount 1–50) buys through `Lottery.buy` (all the usual limits).
  - Plugin file `games/LottoLive.java`. Client: `api/games/LottoLiveProtocol.ts`, `components/lotto-live/LottoLiveView.tsx/.scss`
    (lazy player chunk). Bottom-left card: pulsing dot, "Live Lotto", player count, collapse toggle, prize (+ bonus
    Diamonds), a countdown bar (time left / window), "N tickets · you N", +1 (price + icon) and +5.
  - Verified (live_seconds temporarily 20000, Tobias headless, Mia temporarily rank 6): panel "50 Emeralds +3",
    +1 → tickets 1 / you 1 / prize 52 (pot share); `lottery.set live_seconds 300` → hidden on the next tick.
    Tobias paid 3 Emeralds for that real ticket in draw 22.
- **Seen, not fixed:** the hotel view shows the untranslated keys `landing.view.2021NitroPromo.header/body/button`.
- (2026-10-03) Opening the chest now gives feedback.
  - Cause: the result of a Daily Hub click (chest, claim, freeze, swap) was only shown as a line inside the open Daily
    reward window or the Daily Hub details card (a 2026-10-01 rule). The chest tile opens the chest directly, with
    neither window open, so nothing showed.
  - Fix (`EngagementView.tsx`): a `hubDetailsOpen` flag; when neither window is open the result is shown with
    `showFeedback(message, GuessFeedbackKind(message))` (the chest kind for chest lines).
  - Verified headless (Luna, chest_progress set to 30): tile "CHEST Ready" → click → bubble "The chest had 15
    Emeralds!", ledger `chest.open` +15.
- (2026-10-03) Hotel view promo replaced.
  - Slot 2 (`widgetcontainer`) was the stock placeholder: the Canal Bundle image, the untranslated key
    `landing.view.2021NitroPromo.*` and a google.com button.
  - Now: image `web_promo_small/spromo_hween20.png` (official Habbo Halloween 2020 promo, downloaded to our CDN with
    `spromo_hween21.png`), texts `landing.view.hcmsSpawns.header/body/button` ("Seasonal spawns!" / "Grab the furni
    that appear in busy rooms and swap them for Emeralds at the Swap-o-Matic in the Lobby." / "Go to the Lobby"),
    btnLink `navigator/goto/352`.
  - ExternalTexts backup `ExternalTexts.json.bak-20261003-promo`; renderer-config `?v=20261003a`.
  - Verified headless (Luna): the widget shows the texts and the button enters the Lobby.

## Furnished prison room "Habbo Prison" (2026-10-03, built + verified)
- Like habbo.cc's "Habbo Knast". New room **526 "Habbo Prison"** (owner officialrooms; settings copied from the Lobby;
  description "Serve your time. Behave, or pay bail with :bail."; floor 110, wall 1101; users_max 50).
- Custom model `room_models_custom` id 526: 20×16 floor (x 2–21, y 1–16), door 1,9 dir 2, `override_model = 1`.
- 76 furni (owner 2):
  - 5 cells along the back wall, each with a camp cot `army_c15_bed`, a toilet stall `school_toilet_stall` and a
    `sink`; stone/barbed-wire walls `prison_dvdr2` between and in front of the cells, an open `prison_gate` and a
    `prison_dvdr1` bar per cell;
  - watchtower `army_c15_watchtwr`, guard booth `army_c15_guardcub` + sandbag by the door;
  - gym (3 `olympics_c16_treadmill`, dumbbell rack, 2 `track12_weight`);
  - chainlink fence `graffiti_c24_fence`;
  - canteen: 6 `army_c15_table` with "Army Slop" and 12 `army_c15_chair`;
  - two `prison_stone`.
- Build script (rerunnable: it clears and refurnishes the room): `hCMS/storage/app/build_prison_526.php`.
  A loaded room only shows the new furni after it unloads (or an emulator restart).
- Registered as prison id 2 in `hcms_prisons` (chat on, commands off). Adminprison (id 1, room 524) stays and is still
  the one the security modes' auto-prison uses (lowest id).
- Verified headless (Luna): a 2-min sentence to prison 2 → on login taken into "Habbo Prison", panel "Habbo Prison |
  Testing the new prison | 01:56 | Bail 4", login bubble. Test sentence closed afterwards.
- (2026-10-03) Auto-prison target is configurable: new setting `hcms.prison.auto_prison_id` (registered by
  PrisonerPanel, default 0 = the lowest prison id as before), set to **2** (Habbo Prison). `Prison.systemSentence`
  uses it when that prison exists, else the lowest id. The plugin was deployed and restarted; the security modes'
  auto-prison itself was not triggered in a test.

## Gates under builder mode, Lotto "Draw now" in 60 s, reconnect card back (2026-10-03)
- **Gate closing on a player (cause found in our plugin).** `hcms-buildermode-plugin` `BuildModePlugin.onToggle` cancels
  the stock toggle and sets a random forced state when the builder toolbar has states + "apply on click". That skipped
  stock `InteractionGate.onClick`'s "nobody on the gate's tiles" check, so a gate could close under an avatar. Fix:
  for `InteractionGate` items, the handler refuses (cancels, no change) when a Habbo stands on any tile of the gate's
  footprint (`gateOccupied`, same tiles as stock). Stock behaviour itself was re-verified headless (Mia, own test
  room): closing mid-walk stops the avatar one tile before; closing while the avatar steps onto the gate is refused.
  With builder mode: a click while standing on the gate is refused; from the next tile it closes; a normal click reopens.
  The test rooms 527/528 were removed. Phi's `divider_poly3*6` placed in room 527 went back to Phi's inventory (item 143135).
- **Lotto "Draw now"** (Staff Tools > Games and `:lottoadmin draw`) now calls `Lottery.drawSoon()`: the open draw
  moves to now + 60 s (`draw_at` saved, `predraw_sent` reset), the Live Lotto panel is pushed to everyone and the
  "less than a minute" alert goes out; the normal tick (10 s) draws. Refused when the draw is already under a minute
  away. Button confirm text: "Confirm: draw in 60 s". Not triggered live yet.
- **Reconnect card** (user: "like we had before"): `ReconnectView` shows the "Connection lost" card during the retries
  as well (with "Attempt N of 3" and the Reconnect button) instead of the loading screen; after giving up it offers
  "Open the hotel". Verified headless on the deployed client (socket closed by hand: card, then reconnected and gone).
- Deployed: both plugin jars (one emulator restart), client (`yarn deploy`).
- **Gate closing under the avatar: cause is the Wired fork's core, not our plugins (open decision).** Reproduced
  headless: stand next to an open gate, click the gate tile, close the gate within ~0.1 s, and you end up on the closed
  gate. Cause: `Arcturus-Community-Wired` `RoomUserWalkEvent.addTemporaryOpenFurniOverrides` (in the fork since its
  "Initial release: Arcturus Wired" commit). On every walk click it gives the walker a 750 ms override
  (`RoomUnit.addTemporaryOverrideTile`) on the tiles of every furni that is open at that moment (`isWalkable()`,
  not allow_walk, except one-way gates). `RoomUnit.cycle` skips the walkability check on override tiles
  (`canOverrideTile`), so a gate closed during those 750 ms is walked onto anyway. Stock Morningstar and Polaris don't
  have this, which is why it works there. A plugin check (`GateSteps`) was tried and removed (the user wants no plugin
  for default behaviour). The user declined a core edit ("it should already work"). Left as is; the user decides.

## Core changes (approved one by one by the user)
- **2026-10-03 gate walk-through fix** (user: "do edit core rule"). `Arcturus-Community-Wired`
  `messages/incoming/rooms/users/RoomUserWalkEvent.java` `addTemporaryOpenFurniOverrides`: `InteractionGate`
  (and its subclasses) is skipped like `InteractionOneWayGate`, so a walk click no longer gives a 750 ms pass over open
  gates. A gate closed right after clicking its tile now blocks the step, as in stock Morningstar/Polaris (this code is
  unchanged upstream, Harmonicrain/Arcturus-Community-Wired main). Built with `mvn -DskipTests package`, installed as
  `hcms-emulator-run/Habbo.jar` (backup `Habbo.jar.bak-20261003-gate`, the 2026-09-23 build). Checked by the user
  clicking in the hotel. Not committed in the core repo (the older local change to `UserWearBadgeEvent.java` is
  also uncommitted and was already in the running jar).

## Official Habbo feeds in intel-scan, Habbo news suggestions, Taskmaster + Streak Freak (2026-10-03, deployed + verified)
- User: "a skill for official Habbo data… habboquests, habbofurni api, habboassets api… build eco/quests like habbo.com,
  all connected"; then "we use the same news as Habbo" → "don't import, we create new ones" → "suggest Habbo's news in
  the admin panel".
- **Skill:** no seventh skill. `retro-source` already owns official Habbo data; its `official-sources.md` got a table of
  the feeds/APIs (news JSON, `/api/public/achievements`, profiles, habbofurni (token), habboassets (errors),
  habboquests.co vs the parked .com) and `knowledge-log.md` the findings.
- **hCMS `IntelScanner`:** the habbo.com scan also snapshots (by sha1) the news feed `images.habbo.com/habbo-web-news/
  en/production/front.json` and `www.habbo.com/api/public/achievements` (files `news`, `achievements` in
  `hcms_intel_snapshots`). Findings: kind `news` (title, published_at, categories, summary, image, link) and kind
  `achievement` (our_status NEW 112 / CHANGED 24 / EXISTING 31, with official vs our thresholds). First run 197 new,
  second run "unchanged". Filters added in Intelligence findings.
- **Admin > News > "From Habbo news"** (`ManageArticles`): badge = open suggestions; pick a Habbo article (preview with
  thumbnail, summary, link to the original), write our own title/image/body (shared `ArticleResource::fields()`),
  publish → the finding becomes `implemented`, audit `intel.news_written` with the article id. Nothing is copied
  automatically. Verified with a rolled-back Livewire script (create, mark, audit, a second publish of the same
  suggestion refused). Not looked at by eye in the browser.
- **Plugin `engagement/QuestAchievements`:** official `DailyTasksCompleted` (Taskmaster, +1 per finished daily quest) and
  `DailyTaskStreakDays` (Streak Freak, set to the run of consecutive bonus days). 35 `achievements` rows (INSERT IGNORE,
  Habbo's thresholds, Emeralds ceil(level/2) = 110 + 64 total, points 5 × level → +level HabboPass XP via AchievementXp).
  Badge GIFs from images.habbo.com in `cdn/c_images/album1584/`; texts `badge_name/desc_ACH_DailyTasksCompleted` and
  `..._DailyTaskStreakDays` in ExternalTexts.json (backup `.bak-20261003-dailytasks`), `?v=20261003b`.
- **Fix `HabboPassXp.grant`:** READ COMMITTED (see PIPELINE_NOTES 2026-10-03); before, a concurrent achievement grant
  made the daily bonus XP fail ("Record has changed since last read").
- **Verified live** (Mia, raw client, room 525, seeded: 4 done + chat 19/20, yesterday's bonus): one chat → quest done,
  Taskmaster I, bonus, Streak Freak I + II; ledger dq 10 + dqb 25 + ach 1 + 1 + 2 = winwins 38 → 77; Emeralds
  101 → 113, Diamonds 10 → 15; badges ACH_DailyTasksCompleted1 + ACH_DailyTaskStreakDays2. Mia kept the results.
  Plugin jar backup `hcms-emulator-plugin.jar.bak-20261003-dailytasks`.
- **Open:** our `RoomEntry` thresholds are broken (level 10 = 2400 > level 11 = 1080, level 20 = 39600); 112 official
  achievements we lack (RewardTracksCompleted for the HabboPass, TradeCount, RecycledItems, LTDPurchaser,
  GamerPaycheck…) wait for a decision; the Taskmaster badge in the achievements window not seen by eye.
- Project-workflow skill + environments.md now match the CLAUDE.md environment policy (dev = automatic deploy/restart).

## Official achievement ladders: fixes, 20 added, Track Champ (2026-10-03, deployed + verified)
- User: "please do it" (fix `RoomEntry` with Habbo's thresholds, add the missing official achievements).
- Backup `bak_20261003_achievements` (767 rows). Then, from the intel findings (`/api/public/achievements`):
  - **Fixed 12 broken ladders** to Habbo's thresholds (56 rows changed): RoomEntry, RespectEarned, AllTimeHotelPresence,
    GiftGiver, GiftReceiver, BattleBallTilesLocked, EsA, Spr, RoomDecoFloor/Landscape/Wallpaper, FreezePlayer
    (each had levels out of order or an extra zero on the last level). The 12 ladders that are only balanced differently
    (GnomeFeeding, FreezePowerUp, MusicCollector, RoomDecoFurniCount, FriendListSize, Atcg, AtcgSecret, CameraPhotoCount,
    Chef, Restorer, AdvancedHorticulturist, ffusion) were left as they are.
  - **Added 19 ladders the core already progresses** but that had no rows (310 levels with RewardTracksCompleted):
    Login, PetFeeding, GameAuthorExperience, GamePlayerExperience, TagA/TagC, RbTagA/RbTagC, RbBunnyTag,
    RoomDecoFurniTypeCount, RoomDecoHosting, NotesLeft/NotesReceived, MusicPlayer, snowBoardBuild, HorseJumping,
    HorseConsecutiveJumpsCount, MonsterPlantBreeder, LeprechaunFeeding. Rewards: Emeralds ceil(level/2), points 5 × level.
    Archived official ones (SelfModForum*) were skipped.
  - **Track Champ** (`RewardTracksCompleted`, 10 levels): `HabboPassXp.grant` notices when a grant crosses the season's
    max level (`maxLevel()` helper, shared with `state()`) and calls `QuestAchievements.trackCompleted` (online only; XP
    granted by the website while offline doesn't count).
- 20 badge GIFs downloaded to `cdn/c_images/album1584/` (ACH_VicGar10 doesn't exist on Habbo, an older gap); texts
  `badge_name/desc_ACH_RewardTracksCompleted` ("Track Champ %roman%", "For completing %limit% HabboPass tracks"),
  backup `.bak-20261003-trackchamp`, `?v=20261003c`. Plugin jar backup `.bak-20261003-trackchamp`.
- **Verified live** (Mia, raw client): entering room 525 finished "Visit 5 different rooms" at 2597 XP → HabboPass level
  26 (max) → Track Champ I + 1 XP; Taskmaster progress 4. `Login` progress 1 after header 3878 (Nitro's ignored-users
  request at login, which Arcturus handles as `UsernameEvent`). Mia's winwins put back to 81 afterwards.
- Intel findings now: 65 EXISTING, 12 CHANGED (balance only), 90 NEW (official ladders with no progress source here,
  e.g. TradeCount, RecycledItems, LTDPurchaser, GamerPaycheck, crafting/crackable campaign ones).

## All official achievement ladders + counters (2026-10-03, deployed + verified)
- User: "yes add all". Backup `bak_20261003b_achievements`. The 76 remaining non-archived official ladders were added
  (807 levels; 174 ladders now; DailyHotelPresence has no levels, the 12 ARCHIVED ones were skipped), rewards as before
  (Emeralds ceil(level/2), points 5 × level). 293 badge GIFs from images.habbo.com (`ACH_Profile1/2` copied to
  `ACH_Profile11/21`, the code Arcturus awards), 53 official texts + explicit Profile11/21 texts merged into
  ExternalTexts.json (backup `.bak-20261003-allachievements`, `?v=20261003e`).
- **Bug found and fixed the same hour:** Habbo's categories crafting/crackables/collectibles aren't in the DB ENUM or
  Arcturus' `AchievementCategories`; the load aborted at the first one (122 of 174 loaded, older ladders included).
  185 rows set to `explore`; restart → 174 loaded and sent. The category tiles/texts made for those categories were
  removed again.
- **Counters** (`engagement/OfficialAchievements`, the renamed `QuestAchievements`): TradeCount, LTDPurchaser, Name,
  GamerPaycheck (game `.win` payouts), TimeSpentRoomType Chat/Trade/RPG/Games (minute tick by room category), HC (VIP
  days at login), plus Taskmaster / Streak Freak / Track Champ. New navigator categories 10 Trading (`can_trade` 1) and
  11 Role Play (`navigator.flatcategory.global.ROLEPLAY` text). Jar backup `.bak-20261003-allachievements`.
- **Verified live (Mia):** achievement list = 174 entries; in a new Chat room (created by Mia via 2752, deleted after)
  TimeSpentRoomTypeChat reached 2 after two ticks. **Not live-tested:** TradeCount (needs two clients), LTDPurchaser,
  GamerPaycheck, HC (no VIP rows exist), Name.
- **Still without a progress source (rows only, stay at 0):** crafting/crackable campaign ladders (bazaar17, Festival,
  Suncity, Tokyo, victailor, wintercity, WitchesCoven, Xmascrystal, Horticulturist, GhostHunter, CreatureRearer, Farmer,
  EasterCreatures, InfectedLab, flamingknight, HweenTombsCrackable), recycler (RecycledItems, RecycleBoxOpener,
  RecycleEcoprizes, RecyclerGrandPrize, RecyclerRarePrize), breeders (Bear/Cat/Dog/Pig/Terrier), Haloompa*, SnowStorm*
  / SnowWar*, Habbicon*, NFT/Collectibles/Silver, CoinValueTraded, LTDEarlyBird, BuildersClub/RoomDecoBC, VipHC,
  ChatStyleOwner, Profile*, FairPlay, EmailVerification, HabboExplorer, LegDay, FurniOrganizer, MoneyPrinter,
  PlaceCreditValue, HabboBuilder_TSale_, HorseRent, RoomHorseJumpCount, MonsterPlant Color/Shape/Unlucky, TagB,
  SkateBoard*.

## Pet breeding, crafting and crackable achievements (2026-10-03, deployed; crackable verified)
- User: "we will add pet breeding, crafting, crackables". All three are data in Arcturus, no plugin code:
  - **Pet breeding:** the core progresses `<Type>Breeder` when a breeding nest hatches; the ladders exist since the
    "add all" step, so Dog/Cat/Pig/Terrier/BearBreeder now count. Not live-tested.
  - **Crafting** (backup `bak_20261003_crafting_recipes`): 106 recipes got the achievement of their crafting table:
    Artisan Sewing Box → Festival (17), Trashbot Jr. → Suncity (8), Toolbot → Tokyo (6), Witch's Crafting Table →
    WitchesCoven (5), Snowman table → Xmascrystal (5), Tailor's Sewing Machine → victailor (6), Nutcracker → wintercity (7),
    Dye Bucket → bazaar17 (52). The other tables (jungle workbench, combi stove, tainted washing machine, spa bath,
    India sewing station, 3 altars without items_base rows) have no official ladder. Not live-tested.
  - **Crackables** (backup `bak_20261003_items_crackable`): Slimey/Glowing Ghost → GhostHunter, Cursed Flame Knight →
    flamingknight, Christmas Citadel creatures + Golden Egg → CreatureRearer, Easter 2019 hatchlings → EasterCreatures,
    Flowering Bush (last Bag of Seeds stage) → Farmer; the 12 jungle flowers moved from AdvancedHorticulturist to
    Horticulturist (Habbo: Horticulturist = Stranded Jungle, Advanced = Easter Garden). No InfectedLab or Halloween tomb
    furni exist here.
  - **Fix:** 17 crackables had `interaction_type` `default` (16) or `crackables` (1) and could never crack (Bag of Seeds
    stages, Christmas Citadel creatures, Coral Kingdom chests, Easter 2020 rocks/prizes); set to `crackable` (backup
    `bak_20261003_items_base_crackable`).
- Verified live (Mia, own test room, deleted after): 20 hits on a Cursed Flame Knight cracked it and flamingknight
  progress = 1. The Flowering Bush needs the watering-can effect 192 (Habbo's rule), so it can't be clicked without it.
- Still without a progress source: InfectedLab, HweenTombsCrackable (no furni), recycler, SnowStorm/SnowWar, Habbicons,
  Collectibles/NFT, profile/BC/misc (list in the previous section).

## InfectedLab + Furious God (Banished Furious Gods) from Habbo's own mechanics (2026-10-03, deployed + verified)
- User: "check Habbo, it's the latest, why not auto get? InfectedLab and Halloween". Answer: we already had the furni
  (Habboween 2018 lab line, Habboween 2023 `hween_c23_seth3` Furious God) but imported as plain `default` furni; Habbo's
  public gamedata has names/sizes only, never server behaviour (hits, prizes, effects, achievements), so intel-scan
  can't learn it. Mechanics taken from Habbox Wiki / Habbo's own post (sources below).
- **InfectedLab** ("cleaning Infected Laboratory items") = crafting at the Tainted Washing Machine (altar 10270): its 11
  recipes now carry `InfectedLab`.
- **Furious God** (Tombs of Egypt 2023: Evil Pharaohs dropped them in public rooms, the first player to empty the health
  bar won a random item, rarely an Ancient Cat Mask or Candle Hat):
  - `items_base` 2000042559 `hween_c23_seth3` → `crackable_master` (anyone may hit it; backup
    `bak_20261003_items_base_seth3`); `items_crackable` row: 20 hits, no effect, `achievement_cracked`
    HweenTombsCrackable, prizes = Habboween 2023 jars ×12 (w6), webs/sand (w5), plushie/cat doll (w4), Eye of Horus /
    Pharaoh Bust (w3), Sculpture of Anubis (w2), clothing_catmask + clothing_candlehat (w1).
  - Spawned by the Halloween furni spawns (`hcms_spawn_items` weight 3). `FurniSpawns` now treats crackable spawns
    differently: no collecting on step/double-click, the stock click hits it; the click that empties it (adjacent,
    effect ok, ticks + 1 = count, first one wins) schedules `banished()` 2 s later: removes and deletes the god, clears
    the active row and says "[SPAWN] <name> banished the Furious God and won a prize!". The prize goes to the
    banisher's inventory (crackable_master gives it to the cracker).
- Verified live (Mia temporarily rank 6 + PIN for `spawns.now`, other spawn items disabled for the test; everything
  restored): spawn line, banish line, HweenTombsCrackable 1, prize hween_c23_isisjar2 in Mia's inventory, no active
  spawn left. Jar backup `.bak-20261003-furiousgod`.
- Not done: the catalog **Raging God** (`hween_c23_seth`, banished with the Pirate Sword effect, drops one of three
  chests; `hween_c23_rachest` is still `default` while the other two chests are crackable).
- Sources: habboxwiki.com Tombs_of_Egypt, Crackables, Infected_Laboratory; habbox.com "Infected Lab Crafting";
  x.com/Habbo status 1710331797479833973.
- (2026-10-03, follow-up) **Exploit closed:** the crackable Furious God was also a free offer (catalog_items 2000073964,
  page 9967833 "Halloween", cost 0/0). A bought `crackable_master` resets after each crack = unlimited prizes and
  HweenTombsCrackable progress. Offer removed (backup `bak_20261003_catalog_furiousgod`), RCON `updatecatalog`; no copy
  was owned. Habbo sold only the "(Non Crackable)" twin. Still free on that page (decoration only, older import gap):
  Raging God 2000073963, Grand Pagoda 2000073972.
- (2026-10-03, follow-up) User rule: "always leave them for decoration and the other for crackable". Halloween page
  9967833 now sells **Furious God (Non Crackable)** `hween_c23_seth4` (new offer 2000075032, same slot) and the Raging
  God offer 2000073963 switched to **Raging God (Non Crackable)** `hween_c23_seth2` (backup
  `bak_20261003_catalog_ragingod`); `hween_c23_seth` / `seth3` are not sold and nobody owns one. RCON `updatecatalog`.
  The only other sold `crackable_master`, "Test Your Strength!" (4753), has no items_crackable row (no prizes) and stays.
  Rule recorded in catalog-sync.md + memory.

## Seasonal vault: crackables + clothes staff-only, released per season (2026-10-03, done + verified)
- User: "move them all to staff cata own category and only when season we release, also all clothes".
- Backups: `bak_20261003_vault_catalog_pages` (1,742), `bak_20261003_vault_catalog_items` (61,120).
- **Moved** (the only player-reachable ones): prize crackables Christmas Market dolls 10 → Staff › Seasonal Economy ›
  Christmas, Palooza piñatas 4 → Summer, Easter storybooks 4 + Bag of Seeds chain 3 → Easter; clothing: the Clothes Shop
  page (Habbo Furni › Clothing, 36 × 150 Emeralds, all xmas lines) → Staff › Seasonal Clothing › Christmas, Rares ›
  Clothing (5 HabboCity customs, 500 Diamonds) → new Seasonal Clothing › Other (9967875). Prices stay on the offers.
  The other ~110 crackables and ~560 clothes were already under Staff.
- **Purchase hole closed:** Arcturus' `CatalogBuyItemEvent` checks only the offer's own page rank, so rank-1 pages
  under Staff or under hidden roots were buyable with a crafted packet. 114 pages raised to their ancestors' rank (7 when
  an ancestor is hidden). Left: 4 hidden pages with no offers (Classic, Creators, Economy roots, Past Rares).
- **Release tool** (hCMS `Domain/Catalog/Services/SeasonalVault`, table `hcms_seasonal_vault` = released page + home
  parent/rank/caption): `php artisan hcms:seasonal-vault status | release <season> [--allow-free] | lock <season>`, and
  Admin › Catalog discovery header buttons "Release season" / "Lock season". Release re-parents the season's
  Seasonal Economy + Seasonal Clothing pages into a player root **Seasonal Shop** (created hidden, shown while anything
  is released; clothing page captioned "<Season> Clothing"); lock puts them back. Refuses public crackables
  (crackable_master) always and free prize crackables unless allowed; audits `catalog.season_released/locked`; RCON
  `updatecatalog`.
- Verified: Christmas refused (10 free Matryoshka dolls), Valentine's and Winter released + locked (command and
  Livewire), audit rows; nothing is released now.
- Open (user decision): the vault's free prize crackables need prices before their season (Christmas 10, Easter 7,
  Summer 4), and most seasonal clothes are free (only the moved 41 have prices). The Golden Clothes Box (HabboBox,
  180 Diamonds) stays on sale.

## Achievements window rebuilt, quest badges, no repeated quest types (2026-10-03, deployed + verified)
- User: "fix achievements with HabboCity's minified … card layout also", then "smaller so 4 in a row", "fix the second
  scroll bar", "the number on the achievement image", "tab icons are bad".
- **HabboCity has no achievements window:** their saved client (`nitro-catalog-copy/scripts/out/hc/index-b7d2b6d3.js`)
  keeps the stock data hook and `getAchievementCategoryImageUrl`, but nothing calls it and no view exists; their website
  only has /profil and /center/badges. Their `.nitro-achievements` CSS (375×405) is stock leftover. So the window follows
  the own-feature rule: HabboCity card frame + the Inventory/Badges sibling layout.
- **New window** (`components/achievements`): `AchievementsView` = card header, NitroCardTabsView with one icon tab
  per category (unseen count), a 4-column badge `Grid` (`--nitro-grid-column-min-height: 48px`, the only scroller),
  `AchievementPreviewView` (badge, name, 2-line description, level, reward, progress) and a score + total progress row.
  `AchievementItemView` = LayoutGridItem. Own `AchievementsView.scss` (tabs share the row, icons at `zoom: .5` +
  pixelated, small count badge, readable progress bars via holo tokens). Old stock views deleted (category list,
  achievement list, category view, details view).
  - The "4 px bar" under the tabs was the selected grid item: plain `Grid` doesn't set the item height variable that
    `AutoGrid` sets.
- **Quest badges:** `hcms_daily_quest_pool.badge` (filled only where empty: trade → ACH_TradeCount1, chat →
  ACH_TimeSpentRoomTypeChat1, rooms → ACH_RoomEntry1, online → ACH_AllTimeHotelPresence1, respect_give/get →
  ACH_RespectGiven1/ACH_RespectEarned1, place → ACH_RoomDecoFurniCount1, look → ACH_AvatarLooks1, motto → ACH_Motto1,
  chest → ACH_RecycleBoxOpener1). OUT 9631 now ends with `int n + string badge` per quest (read only if bytes remain);
  QuestCard shows the badge (44 px box) instead of the scroll. Missions keep the scroll.
- **No repeated quest types:** `DailyQuests.addNext` first picks a type not used today, only falls back to repeats when
  every pool type was used (stays unlimited). Verified: Mia finished "look" → next was "chest". Reduced rewards after the
  first 5 quests are unchanged (by design).
- Verified headless (Mia, dev client): window 375×405, 8 tabs fit, one scroll area, 4 columns, details readable; quest
  cards show their badges. Client deployed (`index-…` 16:20). Jar backup `.bak-20261003-questbadges`. tsc 52 (the 3 over
  the baseline belong to other work: truffle/clove/wired).

## Trading window ported from HabboCity (2026-10-03, deployed + verified)
- User: "do habbocity trading window". Source: HabboCity's saved bundle `out/hc/index-b7d2b6d3.js` (their trade view,
  minified `SD`, and the inventory call site); their trade CSS was already in `holo/_43-nitro-inventory.scss`.
- **Inventory in trade mode** (`InventoryView`): `className="nitro-inventory is-trading"` (their 500 px trade height) and
  `theme="primary-slim"` (was `primary`, no is-trading); the inventory search bar stays above the trade view (search slot
  portal, `InventoryFurnitureSearchView`), the room previewer is passed in.
- **`InventoryTradeView`** = their structure: virtualised furni list (`InfiniteScroll`, rows of 44 px items in
  `.inventory-trade-item-list`, width tracked with a ResizeObserver), then `.inventory-trade-offer-container`:
  `LayoutRoomPreviewerView` (253 px, shows the last clicked item in the room's wall/floor) + `.inventory-trade-offer`
  (`NumberInput` amount + success "are offering" button, "You are offering" / "<name> is offering" 3×3 grids with
  `.trade-text`, lock icons, hover `.trade-information` name/description/LTD plate, a `.trade-button` FaChevronLeft
  remove on the selected own item) and the Cancel + state buttons row. Icons identified from their other uses:
  `Sh` = FaLock (effect min level), `hC` = FaUnlock, `rr` = FaChevronLeft (all "previous" buttons).
- Shared `Flex` got their `fill` prop (`flex-fill`).
- Verified headless (dev client): Mia (raw client) created a trade room, opened a trade with Tobias and offered a duck;
  Tobias's window 528×500 with all parts, select → preview + amount 1, "are offering" → both sides 1 item. Trade closed
  unaccepted; test room 534 deleted, Tobias's home room reset. Deployed.

## Season currency = Pumpkins, Halloween released, prison fix, chatlogs cleared (2026-10-03, deployed + verified)
- **Season currency slot (type 103), Habbo's model** (`seasonalcurrency.id.103` → `<id>.currency.name`, per-currency
  colour): settings `hcms.season.currency.singular/plural/color` (plugin `currency/SeasonCurrency`, persisted to
  `emulator_settings` by `set()`). Purse meta, `Wallet.name` (now the single currency-name helper; the copies in
  GameRewards/WordScramble/Prison were removed), admin currency labels read it. RCON `hcmsseasoncurrency`
  {singular, plural, color} changes it live and pushes the purse meta to everyone. hCMS `Economy/Support/SeasonCurrency`
  (CurrencyType/RewardType/Lottery labels, login/event notices) + `php artisan hcms:season-currency [<singular> <plural>
  <#RRGGBB>]` (needs `cdn/images/wallet/season/<plural>.png`, 15×15; audit `economy.season_currency`). Client
  `api/purse/SeasonCurrency` (filled from the purse meta): `LayoutCurrencyIcon` uses `wallet/season/<plural>.png` for
  103, chat game lines and the Games panel use the name/colour. Icons: `season/snowflakes.png` (old 103.png),
  `season/pumpkins.png` (Habboween pumpkin furni icon, 15×15). Switched: **Pumpkin / Pumpkins #F28C28**.
- **Halloween released:** Seasonal Clothing › Halloween priced 50 Pumpkins (108 offers, backup
  `bak_20261003_halloween_clothes`; earn ≈ 10/day login + 5/event + 5–10 Random Word), `hcms:seasonal-vault release
  halloween` → 2 pages / 127 offers. **Seasonal Shop = its own page in Official Furni right after History** (user; SHOP_PARENT = 9966547, order 3, later pages shifted).
- **Prison:** the room-load gate cancelled the stock RequestRoomLoad and called `enterRoom` without the stock exit
  (logExit, wired leave trigger, `removeHabbo`, clear current room) → the room user lists broke. `leaveCurrentRoom()`
  now runs those steps first. Verified (Mia staff, Tobias prisoner, Luna observer): one removal for Luna, Tobias seen
  in prison, chat in the old room fine. The prisoner counter (PrisonerPanel, pushed at sentence/login/every 30 s)
  verified on the dev and live client.
- **Quests:** finished daily quests and completed missions are no longer listed (counts stay in the texts).
- **Chatlogs cleared** (user): `chatlogs_room` (2,375) + `chatlogs_private` truncated after
  `db-backups/chatlogs-before-clear-20261003.sql`.
- Jar backup `.bak-20261003-seasoncurrency`; client deployed.

## Habboween 2026 sold like Habbo: line in the shop, rares one by one, LTD stock, crackables from games (2026-10-03)
- User: "do like Habbo", "check how Habbo releases the rares and which furni they sell; crackables shouldn't be there".
  Source: habbotemplarios.com "Octubre 2026 en Habbo" + Habbo's news. Habbo: the Dark Academia line (+ the Skeletal
  Headband) is sold all month; 5 rares one at a time for a few days (Cursed Cauldron 2–5 Oct, then Gargoyle Fountain,
  Wizard's Garb, Possessed Pumpkin, Aura of Darkness); the Cursed Dragon Lamp LTD until sold out; the crackables Dark
  Fiend (→ Tiny Owl, Raven, Persian Cat, Haunted Puppet) and Antique Dresser (→ 10 clothes) are given out in games and
  challenges, never sold; 5 bundles.
- **Fixed a leak I caused:** releasing Seasonal Shop › Halloween put `hween_ltd26_curseddragonlamp` on sale free and
  unlimited for a few minutes (no copy taken). The offer is back on the staff page and `SeasonalVault::release` now
  refuses LTD furni (`%ltd%`) that aren't a limited stack.
- **Shop:** both public "Halloween 2026" pages (Events › Halloween, New › Halloween) sold all 42 items free since the
  2 Oct import. Crackables, their 14 prize clothes, the 5 rares and `hween26_nt_curseddragonlamp` moved to Staff ›
  Seasonal Economy (24) and the duplicates on the second page deleted (23); backup `bak_20261003_hween26_offers`. Left:
  the 18 line furni + Skeletal Headband on each page, the hatch teleport on Seasonal Shop › Halloween.
- **Crackables:** `hween_c26_darkfiend` and `hween_c26_dresserb` → `crackable` (backup
  `bak_20261003_hween26_items_base`), 10 hits, equal-weight prizes as above; both added to the Halloween spawns
  (weight 2), so they're won in games. Reloaded live with RCON `hcmsreloaditems`.
- **Rares/LTD:** hCMS Rare Rotations (hotel time Europe/Berlin): Cursed Cauldron now → 5 Oct 23:59 (150 💎, live on
  Rares › Rare of the Week), Gargoyle Fountain 6–9 Oct (200), Wizard's Garb 10–13 (150), Possessed Pumpkin 14–17 (150),
  Aura of Darkness 18–21 (250); LTD Cursed Dragon Lamp 10 Oct 20:00, 50 copies, 500 💎. Editable in Admin › Rare
  Rotations / LTD Drops before they start.
- Open: Habbo's 5 bundles; Ducket items (Autumn Candle, Leaf Pile, Leaf Crown, Apple Tree); Gargoyle Fountain in the
  lobby; Cursed Cauldron's Dark Potion hand item; Habboween events/quests paying Pumpkins; Sunset Ranch (user: next).

## Habboween events: daily season quest paying Pumpkins, Cauldron potion, lobby fountain (2026-10-03, deployed + verified)
- User chose "Habboween events first" (Sunset Ranch after). habboquests.co had only the Cauldron rare (30c + 30d,
  "Furni → Rares") and the Dark Academia bundle (90c + 90d, "Furni → Room Bundles") guides so far.
- **Season quest** (Habbo's daily seasonal quest: one chain a day, steps = common actions, each step pays the season
  currency): plugin `engagement/SeasonQuests`, tables `hcms_season_quests` (season, day, step, quest_key, title {n},
  target, reward, enabled; 7 Halloween chains / 26 steps seeded, 5–15 Pumpkins a step ≈ 30–35 a day) and
  `hcms_season_quest_progress` (user, day, step, progress). Settings `hcms.season.quests.season` (halloween; empty =
  off), `.title` ("Habboween quest"), `.xp` (5 HabboPass XP a step). Chain of the day = (UTC epoch day) mod the number
  of chain days, cached per day. Every `DailyQuests.advance` key also feeds it (chat, rooms, online, respect_give/get,
  place, look, motto, trade, chest) + new keys `spawn` (FurniSpawns collect) and `game_win` (GameRewards `.win`).
  Pays via `Wallet.give(103, …, "season.quest")` + `HabboPassXp` (key sq:user:day:step), bubble with the next step.
  OUT 9631 ends with bool + title, step, steps, step title, progress, target, reward, reward type; the Quests tab shows
  it as the first card. Verified (Mia + Tobias raw): motto → step 1 (+5), respect → step 2 (+5), 55 → 65 Pumpkins,
  ledger 5+5, progress step 2/4.
- **Cursed Cauldron** → `vendingmachine` with hand item 25 (Love potion; Habbo's Dark Potion has no sprite in our assets
  yet). Backup `bak_20261003_cauldron_items_base`.
- **Gargoyle Fountain**: item 143150 in officialrooms' inventory for the user to place in the Lobby.
- Open: Habbo's 5 room bundles (contents not published yet), Ducket items, Sunset Ranch Phase 1 (next).

## Sunset Ranch: plugin game, Habbo-style level badge, ranch window (2026-10-03, deployed)
- Plugin `games/ranch/Ranch.java` (hcms-emulator-plugin), the ranch room is setting `hcms.ranch.rooms` (537). Tables
  `hcms_ranch_crop_types` (tomato/corn/grapes/pumpkin/duckbergine), `hcms_ranch_players` (xp, tokens = waters given,
  sold_today), `hcms_ranch_inventory` (seed/crop/item), `hcms_ranch_crops`. Double-click the Plant Sign to claim (gift
  seeds), a `ranch_c26_plotsmall` to plant, a crop to harvest/water/fertilize. Commands `:plant :water :fertilizer :ranch
  [buy|sell]`. Buying/selling uses Pumpkins (type 103) through `Wallet.give`; daily sell cap `hcms.ranch.sell_cap`.
  Messages are `[RANCH]` chat lines (no `|`, no `<>`).
- Protocol: IN 9662 `RanchAction` (string action, string arg, int amount: buy/sell/plant/water/fertilizer/state), OUT 9663
  `RanchState` (inRanch, open, level, maxLevel, xp, xpIntoLevel, perLevel, plots, slots, tokens, currency, balance,
  soldToday, sellCap, fertilizerPrice, fertilizer, pending, crops[crop, seedPrice, sellPrice, growMinutes, yield,
  bigItem, seeds, crops]). Pushed on room enter (1.5 s) and after every action. The server re-checks room, balance, cap.
- Client `components/ranch/RanchView.tsx` (lazy player view) + `RanchFx.tsx` + `api/games/RanchProtocol.ts`.
  Over the own avatar (`ObjectLocationView`): the official Wired 2.0 "level_with_progress" badge (level + 5 arrow chunks
  = XP into the level). Hover (badge or avatar) shows Habbo's counter stack: grapes, pumpkin, badge, coin (Pumpkins),
  aubergine, handshake (tokens), corn, tomato. Drawn on canvas from the official variablefx layers (copied to
  `src/assets/images/ranch/`, from the habz.es bundle). Clicking the badge opens the barn/shop/market windows (LTDCMS
  fishing layout values, buy/sell dialog with slider).
- Fixed: a ripe crop was stored at z = -1 (`getStackHeight` returns -1 on a non-stackable plant) and showed a tile off.
  It now takes the growing plant's height and is placed after the plant is removed; if placing fails the farmer gets
  the harvest in the barn.
- Build fix: `index.css` had a fixed name with a 4 h cache, so after a deploy players ran new JS with old CSS. CSS now
  gets a content hash (`vite.config` assetFileNames; `scripts/protect-chunks.mjs` guard updated).
- `FurniIconUrl` moved from the Furni Editor to `api/utils` (used by both).
- Research: habz.es (`c:/tools/nitro-catalog-copy/scripts/out/habz`: index.js, vendor.js, index.css, `variablefx/` 121
  images) has the full Wired 2.0 variable FX renderer. Polaris (`LTDWEB/.../Polaris-Emulator-main`) has the Wired 2.0
  variable logic (user/furni/room variables, `WiredExtraVariableLevelUpSystem`) but no variable display. Our core has
  neither; the ranch feeds the display from the plugin instead.
- Verified: headless as Mia in room 537 (badge + hover stack screenshots), Mia's ticket/home room restored. Not yet
  verified live: harvest after the z fix, buy/sell from the window. Tomato `grow_minutes` is still 1 (testing); set it
  back to 5 when testing is done.
- Open: other players' badges (only your own shows), official room layout (scan the habbo.com room via CDP), ranch
  quests/crafting (habboxwiki: Farmer's Workbench, 21 recipes).
- 2026-10-03 later: habbo.com runs only in the Habbo Launcher, so CDP can't read its rooms. With the user's OK
  (G-Earth chosen over pictures) a G-Earth extension was written: `c:/tools/gearth-room-export/ranch_recorder.py`
  (+ `run.bat`, `README.md`). The user plays; it writes `exports/<time>/room_<id>.json` (heightmap, properties, floor
  and wall furni with type ids) and `packets.jsonl` (all packets, raw, minus login/handshake/messenger) plus
  `packet_infos.json`. Parsers tested offline with fake packets; not yet run against Habbo. Next: an importer that maps
  type ids to classnames via habbo.com furnidata and rebuilds the rooms; decode the ranch gameplay from the packets.
  Claude does not play on habbo.com itself (no access to the user's account, and bots break Habbo's rules).

## Sunset Ranch rooms rebuilt from the G-Earth recording (2026-10-03)
- The user played habbo.com through G-Earth 1.5.3 (`c:/tools/G-Earth/G-Earth`, Flash/Air, manual host
  `game-us.habbo.com:30000`). Emulator game port moved 30000 → **30010** (`hcms-emulator-run/config.ini`, backup
  `config.ini.bak-20261003-port`) because G-Earth needs 30000; Nitro uses only the websocket 8443, RCON stays 30001.
  G-Earth "Automatisch" still fails (it also wants 127.0.0.1:30001 = our RCON); use manual mode.
- `ranch_recorder.py`: g-python 0.1.6 crashes on G-Earth 1.5.3 message type 10 (not handled upstream either); the
  recorder maps unknown types to UNKNOWN. It records nothing until G-Earth sends the packet table (no unnamed login
  packet can be written). Known bug: a later small `Objects` packet overwrote the live room file;
  `rebuild_rooms.py <export dir>` rebuilds `rebuilt_room_<id>.json` from `packets.jsonl` (first full Objects/Items per
  room, door = own avatar's spawn tile + body direction, later Objects kept as `live_objects` for the gameplay).
- `build_room.php <rebuilt json> [name]` (hCMS bootstrap, prison-526 pattern): `rooms` row copied from 537, owner
  officialrooms (2), `override_model=1`, `room_models_custom`, items; re-running updates the same room (by owner + name).
  Classnames from the stored official furnidata (`hCMS/storage/app/intel/habbo.com/furnidata/*.gz`; habbo.com direct
  download answers a Cloudflare block, not bypassed). Conversions: `ads_bg` → `key=value;…` with images.habbo.com →
  `cdn.habbo.nz` (35 backgrounds copied to `hCMS/public/cdn/c_images/...`), `background_toner` → `s:h:s:l`, other
  non-legacy states → `0`, wall `a=<angle>` suffix dropped (`wall_pos` is varchar(20)).
- Built: **538** "Sunset Ranch: The Adventure Begins" (official 80435574, 60×49, 558 of 560 items) and **539**
  "Sunset Ranch - 2" (official 80435582, 64×64, 1521 items incl. 17 wall). 537 untouched; `hcms.ranch.rooms` still 537.
- Missing types (have a `.nitro` on our CDN but no `items_base`/FurnitureData row): ranch_c26_farmtools,
  ducket_c26_charcuterie/cosyblanket/picnicbasket/pumpkinspice, fall_c23_picnicbasket, petfood26, bonusrare16_5*2,
  ads_aftv_floorlight, info_terminal, gold_c15_arc_lantern (+ conf_invis_control, invisible).
- Verified: DB rows (models, doors, item counts, converted states), CDN serves the backgrounds. Not verified: the rooms
  headless (login as Mia was refused by the auto-mode classifier). The user opened both rooms in their own client and
  confirmed they look right (2026-10-03).
- Quests (same day): Habbo's client texts (`hCMS/storage/app/intel/habbo.com/external_texts`) hold the whole ranch
  campaign: `quests.sept26_campaign` … `sept26_campaign14` = Day 1 "Welcome to Sunset Ranch" … Day 15 "Sunset Ranch
  Finale", 64 steps (name/desc/hint) → `c:/tools/gearth-room-export/ranch_quest_texts.json`. The recorded `Quests`
  packet (decoded → `exports/20261003-185834/quests_decoded.json`; layout: campaign s, done i, count i, currency i, id i,
  accepted B, type s, image s, reward i, loc s, steps_done i, steps_total i, sort i, catalogPage s, chain s, easy B,
  hasTimer B [+ seconds i]) shows quest 2249 type **CUSTOM_WIRED_ACTION** (room Wired gives the progress), 1 step,
  reward 0 / currency -1, 7 quests in Day 1, ~19 days left (campaign ends about 2026-10-22).
  Systems in the quests that our plugin lacks: orders, feeding animals, animal games, community challenges
  (contribute crops), room goals ("N grown X in the room at once"), Ranch Shop paid in community tokens, slots unlocked
  by level (6 / 8 slots), level 8/10 goals. Wired in the official rooms is hidden (`WiredPermissions` 00 00 for visitors).
- Quest step 1 recorded (official flow): click a free `ranch_c26_sign` (state 4) → whisper "This farming plot is now
  yours! Time to start planting." → the sign is removed and 4 `easter_c24_farmsoil` owned by the player appear in a row
  next to it (z 0.3, = 4 starting slots; ours: `hcms.ranch.start_slots` 4) → `QuestCompleted` 2249 → next quest 2250
  "Buy your first seeds from the Ranch Shop". Room 2 holds 5 signs, 178 + 84 farmsoil, 21 `ranch_c26_plot`, 12
  `ranch_c26_plotsmall`. Decoder: `c:/tools/gearth-room-export/timeline.py <export> <from> <to>` (furni names, chat,
  quests, achievements).
- Recorded steps 2-3 (official): Day 1 step 2 completes on the first seeds ("Oh, you're new around here! Take some seeds
  to help you get started." / "Some seeds have been added to your inventory! Click your farming plot to see what you
  have.") = gift **10 Tomato + 5 Corn** (ours: tomato:5,corn:5). Habbo uses chat commands like ours: `:plant tomato` →
  "Tomato selected! You have 10 seed(s) available. Click an empty farming slot to plant it."; plant → "[b]Tomato
  planted! You have 9 seeds left.[/b]"; clicking a growing crop → "Tomato - [b]Ready in 0 hours, 4 minutes and 59
  seconds[/b]" (**tomato = 5 min**); `:water` → "You are now holding a watering can! Click another player's crop that
  hasn't been watered yet."; clicking the plot lists "Your Seeds: Tomato / Corn / Grapes / Pumpkin / Eggplant" and "Your
  Fertilizers: Regular / Premium". 3 tomatoes planted → step 3 done + "You're now participating in the current Community
  Challenge! Stay in the room until the challenge is completed to receive your reward." Step 4 "Harvest your first
  crop" pays **15 of currency 0** (duckets). A claimed sign becomes as many soil tiles as the player's unlocked slots
  (new player 4 in a row; others 7 or 12 around the sign); free signs respawn (`ranch_c26_sign`, state 4).
- Counters decoded (`c:/tools/gearth-room-export/variables.py`; VariableFxConfigs/Status format from the habz client:
  status = key "config|variable", init B, isUser B, entity i (= room unit index, not user id), value long, hasBounds B
  [min long, max long], extra map). Room 2 user counters: tomato, corn, grape, pumpkin, aubergine, gold, honor (tokens),
  level badge (renderer 20/21, extra max_level 10 / current_level), timeleft bar. Observed (user, 2026-10-03):
  plant = **+1 XP, +5 tokens**; water another farmer's crop = **+1 token**; "•" whisper event = +1 token +1 XP (when
  others water your crops, not confirmed); harvest a tomato = **+3 tomatoes, +1 XP**; still level 1 at 26 XP (level 2
  threshold not reached yet). Ours: `hcms.ranch.xp_per_level` 100, tokens only from watering.
- Community Challenge reward (recorded): ~15 min after joining (3 tomatoes planted) → whisper "Community Challenge
  complete! Everyone who participated and stayed until the end received a reward." + `WiredRewardResult` 6 (Wired
  "give reward" success) + one inventory furni **`mnstr_seed_nt`** (Plant Seed, non-tradeable, monsterplant line) with
  map stuff `rarity=3`. Ranch Shop opened with the whisper "Welcome to the Ranch Shop! Hover over an item to check its
  price, then click it to select it. Press the green button to complete your purchase." (purchase not recorded yet).
- **Orders = bots** (recorded): room 2 has 3 order bots, Roxie (46,39), Bianca (54,20), Matheus (52,21). Each shows its
  order as Wired 2.0 user counters over its head (crop icons + `gold` + `timeleft` bar 100 → 0, 0.63 s per step = a new
  order every ~60 s, bots staggered 20 s). Removals come as `VariableFxStatusRemoved` strings `config|variable|u|<unit
  index>`. An order asks 1-4 crop types (1-8 each) and pays gold (Coins): gold ≈ 1 + Σ qty × value with value about
  tomato 2, corn 3, grape 4, pumpkin 6, aubergine 6 (fits most of 24 orders; tomato/pumpkin vary by ±1). Too few crops →
  whisper "You don't have all the crops needed to complete this order." Coins buy seeds in the Ranch Shop (Tomato
  Seeds 2, Corn Seeds 5). In 28 min no order asked for tomatoes alone.
- Official help page (`info_terminal` → `habbopages/sept26ranch`, read through the user's Chrome on 9222; curl gets a
  DOSarrest 463, not bypassed) saved as `c:/tools/gearth-room-export/habbopages/sept26ranch.md`. Facts: grow times
  **Tomato 5 / Corn 10 / Grapes 20 / Pumpkin 30 / Eggplant 60 min**; crops grow while away and stay ready; fertilizer or
  another farmer's watering = boost; orders are shared by everyone, change regularly, a buyer can be sold to many
  times; animals are fed with the crops they ask for, a fully fed animal opens its game for a limited time, each game
  has its own badge; Community Challenges need you to stay in the room (leaving removes you), `:challenge` shows
  eligibility; Coins mainly from orders (regular supplies), Community Tokens from helping/community (special items);
  levelling unlocks farming slots; 15 quest chains released over time, `:quest` shows when the next one opens.
  Commands: `:plant <crop>`, `:plant none`, `:water`, `:fertilizer <type>` (regular/premium), `:remove`, `:inventory`,
  `:quest`, `:challenge`.
- First order recorded: an order of **4 tomatoes → 9 Coins** (= 1 + 4 × 2, formula confirmed) and **+5 XP**; whisper
  "Order completed! You received [b]9 Coins[/b]."; sold twice to the same buyer within 2 s (same order, allowed).
  Step 5 done → **+20 Duckets**; next quest 2247 = "Water another farmer's crop".
- Day 1 finished (recorded): step 6 water another farmer's crop → done (0 reward); step 7 "Buy seeds using Coins" →
  "You bought [b]1x Tomato Seeds[/b] for [b]2 Coins[/b]. You now have [b]52 Coins[/b]." + "Your next quest will be in
  [b]16 hours, 0 minutes and 0 seconds[/b]" + **25 Duckets**. Day 1 total: 15 + 20 + 25 Duckets. **Ranch Shop prices**:
  Tomato Seeds 2 Coins, Corn 5 Coins, Grape 9 Coins, Pumpkin 10 Community Tokens, Eggplant 15 Community Tokens; one item
  is locked: "You need to reach Ranch Level [b]5[/b] before you can buy this item. Your current Ranch Level is
  [b][red]1[/red][/b]." Watering another farmer's crop also joins the Community Challenge.
- Official message styling: whispers use the Wired 2.0 notification bubbles (ids 201 challenge, 202 welcome/info, 211
  credits, 221 error, 223 success, 252 shop) with markup `[b] [i] [u] [green] [cyan] [red] [blue] [purple]` (habz client:
  colours #008000 #008b8b #d60000 #005dff #7d31b8; unclosed tags are closed at the end). The user also entered room
  69699629 (model_i) and went back to 80435574.

## Wired notification bubbles for system lines, through the feedback system (2026-10-03, deployed)
- User: "use the bubbles from Wired with different colors for our system messages", "do it with feedback, handle
  there bubble and chat". `CommandFeedback` (hcms-emulator-plugin) now owns both paths: `tell` = notification bubble
  (unchanged), new `chat(habbo, text, kind)` = a room line over the player's own avatar in the kind's Wired bubble,
  `say` = chat, else the notification bubble. Kind → bubble = settings `hcms.feedback.chat_bubble.<kind>` (registered
  at load; success 223, error/not_found 221, no_permission 220, cooldown 200, warning 210, info 211, system 202,
  chest 212, rest 211). `GameRewards.tell/roomLine/announce` take a `CommandFeedback.Kind`; Lottery, FurniSpawns,
  Automat, WordScramble and Ranch use it (Ranch: `tell` info, `fail` error, `done` success; lotto/spawn errors and wins
  got their kinds). Removed: the per-game `bubble` settings (`hcms.{lottery,spawns,automat,ranch,scramble}.bubble`,
  rows deleted) and WordScramble's own chat-line code. The staff feed keeps bubble 34.
- The Wired fork already defines bubbles 200-229/250-252 (`RoomChatMessageBubbles`, not overridable, no permission), so
  players could send them: added to `commands.cmd_chatcolor.banned_numbers` (now `23;33;34;200;…;252`; the incoming
  chat path applies the list to every bubble; plugin lines have no habbo attached and keep their bubble).
- Client: `components/room/widgets/chat/ChatWiredBubbles.scss` = the 44 official Wired notification bubble rules from
  the habz client (grey box, coloured strip, icon). `ChatWidgetMessageView`: `SystemLineHtml` (34 → staff feed format;
  2xx → `[TAG]` label + `WiredMarkupHtml`: `[b] [i] [u] [green #008000] [cyan #008b8b] [red #d60000] [blue #005dff]
  [purple #7d31b8]`, unclosed tags closed, applied after escaping), `EscapeChatHtml` shared with StaffFeedLineView;
  chat history renders the same for 2xx.
- Verified: both plugins build, boot log clean, settings registered, client built and deployed, CSS in the bundle.
  tsc 52 errors, none in the touched files (baseline drift from other work). Not verified live (headless login
  refused earlier): the user should see a red bubble for `:plant` without a crop and a green one after planting.

## Sunset Ranch moved to the official rooms 538/539 with Habbo's farm mechanics (2026-10-03, deployed)
- `hcms.ranch.rooms` = `538,539` (537 no longer a ranch room). Farm mechanic copied from the recording: a free
  `ranch_c26_sign` (21 on the official 7×3 grid, x 23..59 step 6, y 39/45/51, rot 6) is a farm spot; clicking it removes
  the sign and places the player's `easter_c24_farmsoil` tiles in the 4×4 square around it (top-left = sign −1,−1),
  clockwise from the top-left, `slots(level)` tiles (start 4, +1 per level, max 12). Crops sit on the soil (z +0.1):
  `ranch_c26_saplingsb` (first half) → `ranch_c26_small_<crop>b` → `ranch_c26_big_<crop>` (ripe). Watered soil state 2,
  harvest back to 0. Leaving the room or `:plant none` releases the farm: crops hidden (they keep growing), soil
  removed, sign back; the next claim shows them again. Hand items: `:plant <crop>` → `hcms.ranch.hand_seed` 1097,
  `:water` → `hcms.ranch.hand_water` 1081 (our hh_human_item has no art above 668 yet). Official texts for select,
  plant, time left, claim, first gift. Plant +1 XP, harvest +1 XP (`xp` 1 for all crops), tomato 5 min / yield 3, gift
  tomato:10,corn:5.
- Tables: `hcms_ranch_crops` now keyed by `(user_id, slot)` (dropped `plot_item_id`), new `hcms_ranch_farms` (active
  farms; at boot every stored farm is released: soil deleted, sign re-inserted, crop furni deleted, `item_id` 0).
  Removed: plot-tile claiming (`ranch_c26_plotsmall` + `claim_radius`), CLAIMS.
- Migration (run by the user through `c:/tools/gearth-room-export/run-ranch-migration.bat` because the auto-mode
  classifier refused the deletes): backups `bak_20261003_items_539` (1521) and `bak_20261003_ranch_crops` (6); the 6
  ripe test crops in 537 refunded as harvested tomatoes (user 2: 8, user 6: 3, user 1: 2); frozen farms of other players
  in 539 (soil/crops/saplings/old signs inside the 21 squares) deleted and 21 signs placed; jar backup
  `hcms-emulator-plugin.jar.bak-20261003-farms`.
- Verified: migration rows, plugin build, boot ("Sunset Ranch ready (5 crop types, 0 crops growing)"). Not verified
  live: claim/plant/grow/release in a client.
- Next (user requests, in order): real Habbo Wired variable display (level badge + counters 1:1 from the habz renderer
  and CSS, also over other players, name label moved up, plant hover progress `timeleft`, seed shop), hand item art
  1081/1097 (MetroHotel, read from the user's logged-in tab), the 11 missing furni incl. `info_terminal` (help page),
  the "button" (to be clarified).
- Ranch Shop (recorded, then built): the 5 `easter_c17_seedbag` on the counter in 539 (10,49 tomato … 10,45
  duckbergine; setting `hcms.ranch.shop`) select a seed ("[b]Tomato Seeds[/b] costs [b]N …[/b]. You have …"), the
  `wf_button_green` at `hcms.ranch.shop_button` (12,47) buys one (`buy`, our season currency, not Habbo's Coins); its
  first press for a new player gives the starter seeds (shared `giveStarterSeeds` with the claim). The seed bags are
  crackable in items_base; the toggle is cancelled before they crack. Deployed 20:43.
- Hand items: `HabboAvatarActions` CarryItem maps hand item 1081 → art 215 and 1097 → art 249, and our
  `hh_human_item.nitro` has both, so no new art is needed (MetroHotel's `.metro` bundle, read from the user's tab, has
  the same 248 ids and was not used).
- Single click (1:1 with Habbo, whose ranch is Wired "user clicks furni"): the plugin hooks `Incoming.ClickFurniEvent`
  (2789, sent by Nitro's `FurnitureSingleClickComposer`) with `registerCallable`, reads the item id and resets the
  buffer so Wired still runs. All ranch actions (sign claim, plant, water, harvest, time left, seed-bag select, green
  button) run on that click; a repeat click on the same item within 400 ms is ignored; the double-click on ranch furni
  is cancelled (no crack/toggle). Clicking any growing crop, also your own with the watering can, whispers
  "<Crop> - Ready in h hours, m minutes and s seconds". Deployed 20:51.
- Wired variable display research (habz, re-implement, no code copy): number_recolorable "blocky" = digits 22 px high,
  source x/width table, spacing 3, icon left with 6 px gap (overlap −6), centred vertically on max(icon, 22),
  double = second icon after the digits; digits = numbers layer multiplied by the counter colour, then darkening
  (multiply) and lighting (add). Colours (`WSt`): GREEN 0x36B24A, LIME_GREEN 0x8DDD35, YELLOW 0xFFD83D, ORANGE 0xFFA024,
  RED 0xDF291E, CYAN 0x42D4E8, BLUE 0x3B7DE3, PURPLE 0x8752D1, WHITE 0xD8D8D8, GOLD 0xFFC63D, DYNAMIC_LEVELLING 0x2DCC1E.
  Ranch counter configs from the recording (renderer/colour id/icon/alignment/hover) are in the recorder export.
- Wired variable display rebuilt 1:1 from the habz renderer (re-implemented, no code copied; research above):
  `components/ranch/RanchFx.tsx` (level badge: 21 px, three-slice 10/10, frame tinted with the level colour = HSV
  hue 115→360 over the levels, s .85 v .8, digits `numbers_large` 8 px at x 7 (1 digit) / 6, y 5, darkening multiply,
  lighting add; arrow bar 3 arrows × 9 px + 2 × 3 px, starts 3 px inside the badge, centred, chunk tinted +
  darkening/lighting, splitters; blocky counters: 22 px digits, spacing 3, icon gap 6, left/right/double;
  colours WHITE crops, GOLD coins, LIME_GREEN tokens). New layer images: arrow_bar_splitter_left/darkening/lighting.
  `RanchPlayersView.tsx`: one stack per ranch player (server OUT 9664 `RanchPlayers`: room index, level, max,
  xpIntoLevel, perLevel, tokens, balance, crops; sent to a newcomer for everyone present and to the room on every
  push), anchored like habz (avatar screen point −86 px zoomed in / −45 zoomed out, +½/+1 avatar height when
  sitting/lying), centred column, 4 px gap, badge always visible, counters while the avatar or the stack is hovered.
  `api/games/RanchStackTops.ts` + `ContextMenuView`: the avatar name stays above a ranch stack.
- Shop gating: `hcms_ranch_crop_types.unlock_level` (added at boot; tomato 1, corn 1, grapes 2, pumpkin 3,
  duckbergine 5; only duckbergine 5 is recorded from Habbo, the rest are our guesses) with Habbo's message; clicking
  furni on a locked ring tile of your farm says which Ranch Level unlocks it. Deployed 21:15 (plugin) / 21:2x (client).
- **Part 1 of the full ranch build: order bots** (deployed 21:37). Bots in 539 (`bots` ids 1-4, owner 2): Joshua
  (24,34), Frederik (26,34), Margot (28,34) = buyers (`hcms.ranch.order_bots`), Chloe (13,42) shopkeeper, official
  figures. `games/ranch/RanchOrders.java`: one order per buyer, new order every `hcms.ranch.order_seconds` (63) with
  the first rotation staggered by a third, 1-4 random crop types × 1-8, reward = 1 + Σ qty × `order_value`
  (new column: tomato 2, corn 3, grapes 4, pumpkin 6, duckbergine 6), sold by clicking the bot (`registerCallable` on
  `Incoming.ClickAvatarEvent` 2790, 300 ms debounce), shared, repeatable; pays our season currency through
  `Wallet.give` ("ranch.order"), +`hcms.ranch.order_xp` (5) XP, Habbo's texts. OUT 9665 `RanchOrders` (unit index,
  seconds left, duration, reward, crops) to the room on every new order and to newcomers. Client `RanchOrdersView`:
  stack over the buyer (crop counters in Habbo's order colours, gold with coin icons on both sides, striped time-left
  bar `RanchStripedBarFx` = habz striped_progress: 53 px, fill tinted, darkening/lighting tiled, stripes in the colour
  at value ×0.5 scrolling 1 px / 70 ms, 2 px end cap, time-left icon). Ranch helpers in Ranch.java are now
  package-visible for the new ranch classes.
- **Part 2: Ranch Shop like Habbo** (deployed 21:49). Prices from the recording: seeds tomato 2, corn 5, grapes 9
  coins (= our season currency) and pumpkin 10, duckbergine 15 Community Tokens (`hcms_ranch_players.tokens`); new
  column `seed_currency`. Shop spots (`hcms.ranch.shop`, furni types seed bag / `ranch_c26_soil` / `bc_sphere*17`):
  seed bags, fertilizer regular (11,43, 10 coins) and premium (11,42, 15 tokens), badges TTH18 "Ranch Tycoon" (9,39,
  5,000 coins) and TTH19 "Helping Hand" (10,39, 2,500 tokens); prices for non-crops in `hcms.ranch.price.<item>`
  ("amount:coins|tokens"). Click selects ("[b]X[/b] costs [b]N …[/b]. You have …"), green button buys one; token
  payment is an atomic `UPDATE … WHERE tokens >= cost`; owned badge → "You already own this badge."; Habbo's bought
  and not-enough texts. Fertilizer: `:fertilizer regular|premium` (pending `fertilizer:<kind>`), removes
  `hcms.ranch.fertilizer.regular` 50 % / `.premium` 75 % of the remaining time (our choice, Habbo publishes no
  numbers); old `fertilizer` items renamed to `fertilizer_regular`. `:inventory` whispers seeds and fertilizers.
  Removed: market/`:ranch sell`/`sell_cap`/`fertilizer_price`/`sellPrice` (orders replace selling, as on Habbo);
  ranch window = Barn + Shop (currency per item, locked seeds show their level). OUT 9663 changed (fertilizer list,
  seed currency, unlock level; sell fields gone). `GameRewards.badge` is public. Badge gifs TTH16/18/19 copied from
  images.habbo.com to `cdn/c_images/album1584/`, names/descriptions added to ExternalTexts (backup
  `.bak-20261003-ranchbadges`, `?v=20261003f`).
- **Part 3: animal feeding** (deployed 22:0x). Recorded rules (bunny trace): each animal asks for one crop type and an
  amount (60-190 seen, steps of 5); the counter shows what is still needed, the food bar the % fed; every feed takes
  5 crops from the clicking player; when full the counters go and a 5-minute time bar runs (the animal game window);
  ~2 min after it closes a new request starts. `games/ranch/RanchAnimals.java`: settings `hcms.ranch.animal_room`
  (539), `hcms.ranch.animals` (`name@x,y:crops`; bunny 36,21, chickens 38,16, cow 43,11, goat 48,11, pig 55,10),
  `feed_amount` 5, `feed_xp` 1, `feed_tokens` 1 (our choice; Habbo shows no numbers), `animal_min/max` 12/40 (×5),
  `animal_open_seconds` 300, `animal_rest_seconds` 120. Feeding = single click on the animal's tile; room-wide whisper
  when full. OUT 9666 `RanchAnimals` (furni id of the animal furni, name, phase 0 hungry / 1 open / 2 resting, crop,
  required, remaining, seconds left, duration). Client `RanchAnimalsView`: crop counter (order colours) under an
  orange striped food bar (#ff9f24, food icon offset 2/0), open = blue extra-large time bar; anchored like habz furni
  FX (bounds centre, 4 px above the top). State is in memory (resets on restart). Next: community challenge (4),
  animal games behind the open window (5).
- **Part 4: community challenge** (deployed 22:1x). Recorded (statue `mnstr_seed_rare` 38,31): one challenge at a
  time, rotating planting (sapling icon) / feeding (food) / watering (droplet); counter = still needed (start 71-276
  seen), green bar = % done; first contribution whispers "You're now participating…"; at the goal everyone who
  contributed and is still in the room gets "Community Challenge complete!…" + the reward; lasted 15-68 min.
  `games/ranch/RanchChallenge.java`: random type (never the same twice in a row), target `challenge_min/max`
  150/280; contributions: plant +1, water +1, feed +crops fed; leaving the room drops you; reward = item
  `hcms.ranch.challenge_reward_item` (default `mnstr_seed_rare`, the closest we own to Habbo's non-tradeable
  `mnstr_seed_nt`; tradeable here, decide or clear) + `challenge_reward_tokens` 10 + `challenge_reward_xp` 5 (ours);
  `:challenge` shows eligibility. OUT 9667 `RanchChallenge` (statue furni id, type, target, remaining). Client
  `RanchChallengeView`: counter (lime/orange/cyan) under a green extra-large striped bar without icon
  (`RanchStripedBarFx` icon now optional). `GameRewards.item` public. In memory (resets on restart).
- **Economy safety (user: "make it so our economy will still be good", 2026-10-03):** the ranch no longer touches
  any hotel currency. Like Habbo it has its own closed-loop **Coins** (`hcms_ranch_players.coins`): orders pay Coins,
  the Ranch Shop's coin prices take Coins, the hover "gold" counter and the windows show Coins. Community Tokens stay
  ranch-only (shop items, badge). Challenge reward = 15 tokens + 10 XP, no item (`challenge_reward_item` cleared).
  Before this, orders paid unlimited season currency (Pumpkins) every minute: an inflation leak, now closed. Season
  currency will only come from the ranch quests (Habbo's 15/20/25-per-step scale). OUT 9663 dropped the currency type
  field. Old columns `sold_day`/`sold_today` are unused (left in place, no destructive DDL).
- **Hover displays like Habbo** (deployed 22:3x). Shop items: hovering a seed bag / fertilizer / badge sphere shows
  its price (blocky counter, icon on the right; ORANGE + gold icon for Coins, LIME + honor icon for tokens). Crops:
  hovering a growing crop shows a `block_progress` bar (small = 4 blocks 37×13, green #6bdc34, "upgrading" icon,
  growth in quarters like Habbo's) above the expected harvest (crop counter, WHITE, yield +1 if watered); ripe
  crops show nothing (recorded: the hover is removed when ripe). Server OUT 9668 `RanchShopItems` (furni id, price,
  currency) on entry, OUT 9669 `RanchCrops` (crop furni id, crop, seconds elapsed, total, ready, expected yield) on
  entry and on plant/stage/water/fertilize. Client `RanchHoverView` + `RanchBlockBarFx` (habz block_progress), floor
  furni hover via `RoomEngineObjectEvent` MOUSE_ENTER/LEAVE.
- **Part 5: animal games, game 1 = mole** (deployed 22:4x). Sources: habboquests 2788, HabboFever "De Sunset Ranch is
  geopend!" (`:start`, 25 moles in 90 s, penalty for mistiming, badge per game), Habbo texts for the badges: mole
  TTH24 "Problem Solver", bunny TTH22 "Carrot Cuddles", chicken TTH23 "The Stare", cow TTH21 "Five More Minutes",
  goat TTH26 "Goat Appetite", pig TTH25 "Pretty in Pink" (gifs copied, texts added, ExternalTexts `?v=20261003g`).
  No packet data for the games (the user never played them). `games/ranch/RanchGames.java`: mole holes
  `hcms.ranch.mole_holes` (6 compost holes at 2-3,52-54 in 539, a `ranch_c26_molehill` ensured on each); `:start` or
  `:join` near the holes, one player at a time, `mole_seconds` 90; a mole pops (molehill state 1) every 0.8 s for
  1.1 s; click a raised mole = hit (state 2), click an empty hole = −1; `mole_target` 25 → badge `mole_badge` +
  `game_xp` 10; time up or leaving ends the round. Game tick 200 ms.
- **Part 5 continued: bunny, chicken, cow, goat, pig games** (deployed 23:0x). `games/ranch/RanchAnimalGames.java`
  (one player per game; pens `hcms.ranch.pen.<game>` = x1,y1,x2,y2; free tiles = walkable `RoomTileState.OPEN`).
  Entry: when an animal is full a `wf_button_yellow` spawns next to it (removed when its window closes); clicking
  the button or the full animal starts its game. Bunny: a random `val_r21_bunny` glows (state 1) 2 s, then moves to a
  random tile in the pen; click it while standing next to it → TTH22. Chicken: an `lt_c26_arrows` spawns at the
  tile farthest from the coops; golden eggs (`easter_c26_elvenegg3`) appear next to coops with eggs left
  (`chicken_eggs` 3 each); click the egg next to it to carry it, step on/click the arrow to deliver; badge TTH23
  after the first egg (as the guides say), round ends when all coops are empty. Cow: the first `ranch_c26_cow`
  follows onto the tile you just left while you stay within 2 tiles; more than 4 away → she runs back ("The cow ran
  away!"); next to the arrow (farthest tile) → TTH21. Goat: `goat_seconds` 45 + 5 s per step; pick up a goat → it
  wants the trough on the left or right → then a random correct barn (`ranch_c26_shelter`, "This barn is full"),
  `goat_rounds` 3 → TTH26. Pig: arrow on the pen's south edge; step on/click it for a RIP Monster Plant, click a pig
  next to it → a `mnstr_compost` placed beside it; `pig_count` 4 different pigs → TTH25. Others: `game_seconds` 120,
  `game_xp` 10 per win; spawned furni removed and moved animals restored when a round ends. Step hook
  `Ranch.onStep` from `HcmsPlugin.onSpawnStep`. Built from the guides (no recording of the games): timings,
  egg counts and goat rounds are our choices.
- **Part 6: quest engine** (deployed 23:10). `games/ranch/RanchQuests.java`; tables `hcms_ranch_quest_steps` (day,
  step, type, crop, target, reward, name, description; seeded with all 15 days / 64 steps from Habbo's client texts,
  editable) and `hcms_ranch_quests` (per user: day, step, progress, data, unlock_at, finished). Sequential steps like
  Habbo's chains; next day unlocks at the daily reset `hcms.ranch.quest_reset_hour` (11 UTC) after finishing a day
  ("Your next quest will be in … hours, … minutes and … seconds", as recorded). Rewards in season currency via
  `Wallet.give` ("ranch.quest"): Day 1 = Habbo's 0/0/0/15/20/0/25, other days 15 per step and 25 for the last (our
  scale; total ≈ 1,100 for the whole campaign). All 15 days → badge `hcms.ranch.quest_badge` TTH16. Step types:
  claim, gift, plant, harvest, harvest_watered, harvest_types, harvest_each, order, water_other, water_farmers
  (distinct owners), watered_by_others, fertilize, buy, buy_coins, feed, feed_animals (distinct), feed_crops,
  challenge (crops contributed), game, slots, level, planted, planted_types, planted_combo, fill_slots, room_grown,
  room_planted, room_grown_each (state types are checked on events and every 10 s for players in 539). `:quest`
  shows the current step or the time left. Next: the quest panel (part 7).

## Sunset Ranch part 7 + fixes (2026-10-03, deployed 23:49)
- **Quest panel** (part 7): OUT 9670 `RanchQuest` (day, day count, day title = first step name without its number,
  finished, seconds until unlock, current step, progress, season currency type, steps: description/target/reward).
  Sent by `RanchQuests.send` on every `Ranch.push` and every progress save, only in ranch rooms. Client
  `components/ranch/RanchQuestView.tsx` reuses the Lotto Live panel classes (`.lotto-live.ranch-quests`, top-left),
  header toggles; done steps ticked, the current step shows n/target and a bar; a locked day shows the countdown.
- **Counters flash on change** (Habbo's Variable FX configs in the recording: user counters `hover=true`,
  `duration=3000`, update mask 7): a stack counter that changes (coins, tokens, each crop) shows for 3 s without
  hovering (`RanchView` diffs RanchPlayers updates; `FLASH_MS`). Community contributions: OUT 9671 `RanchDelta`
  (unit index, icon `challenge_<plant|feed|water>`, amount) from `RanchChallenge.contribute`, shown for 3 s under
  the level with the challenge icon.
- **Farm signs at Habbo's spot**: every full room load in the recording has free signs at plot + (1,3) (Habbo adds
  the sign on the plot, then moves it). Our 20 signs were on the plots; moved +1,+3 (room 539). Farms stay anchored
  on the plot (`hcms.ranch.sign_offset` 1,3; claim subtracts it, release/boot release add it). Bug: a room reload
  released the farm while the room was unloading, so `place` was skipped and the sign was lost. Now
  `hcms.ranch.signs` (21 plot spots) is checked every 60 s (`restoreSigns`): a free spot without a sign gets one;
  `claim` registers the farm before removing the sign.
- **Starter buyer**: `hcms.ranch.order_starter_bot` (Joshua) always orders 1 kind, 1..`order_starter_max` (3), only
  level-1 crops, so new farmers can sell.
- **Help terminal**: `info_terminal` (id/sprite 5315 = Habbo's, furnidata entry added, `information_terminal`
  interaction, extra data `internalLink=habbopages/sept26ranch`) at (15,29) rot 4 like Habbo; the client's
  `furniture_internal_link` logic opens it. `habbopages.url` now `${url.prefix}/habbopages/` (folder
  `hCMS/public/habbopages` with a web.config serving extensionless files as text/plain; the HC Center habbopage links
  had no folder before). Page text follows Habbo's sept26ranch page (captured earlier through the user's Chrome;
  direct fetch is DOSarrest-blocked), plus Quests/Commands. Promo image copied to `cdn/c_images/web_promo_small`.
- **Commands**: `:fart` and `:sulk` removed (`HabboCityCommands`); `:userstats` is the name of the public stats
  command (`StatsCommand`, alias `:stats`, rank VIP+); Help list VIP entry `userinfo` (a staff tool VIPs never had) →
  `userstats`.
- Open: the green shop button (12,47) reported invisible; DB row, furnidata, bundle and CDN are fine, so it needs a
  look in the user's client in room 539. The stack height ("level not at the same height") waits for the user's
  example; G-Earth can't show client-side hover.

## Sunset Ranch follow-up (2026-10-04, deployed 00:02)
- Removed OUT 9671 `RanchDelta` and the "+N community" flash: the recording shows only the user's own counters change
  (tokens = community icon, coins, crops, each with its running total); the challenge progress shows on its furni.
  9671 is free again.
- Distance rule: ranch furni (signs, farm slots, crops, shop items, shop button, animals, animal button) and buyer
  bots only respond when the player stands within 1 tile of the furni footprint (`Ranch.near`), else "Stand next to it
  first." Mole and animal games keep their own ranges. Habbo's recording has no distance message; ours is our text.

## Video TVs (HabHeights-style) + "Anime Night" room import (2026-10-04, deployed 00:4x)
- Research (read-only, the user's Chrome 9222, habheights.online): their "Video TV" = a YouTube/Twitch player drawn
  over a TV furni (`room-video-tv-overlays`), a remote inside the furni infostand (`video-tv-remote__*`: status + LED,
  prev/play-pause/next, stop, local volume -/+, up to 50 URL rows with titles via YouTube oEmbed, Save), fullscreen
  with a room chat panel (`video-tv-fullscreen*`), local mute/volume per viewer. Their opcodes 10198/10199/10200 +
  OUT 9145; their TV furni are their own art. User: use our existing TVs (not theirs).
- Built (re-implemented, no code copied): plugin `youtube/VideoTv.java`; tables `hcms_video_tv_types` (item_name,
  geometry "dir:x,y,w,h,slant;…" at scale 64 relative to the furni anchor; admins can add TVs) and `hcms_video_tvs`
  (item_id, urls, track, state 0 stopped/1 playing/2 paused, position_ms, started_at). Opcodes IN 9671-9673, OUT
  9674/9675 (next free 9676). Control = room rights or `acc_anyroomowner`; "ended" may come from any viewer but only
  advances the current track once (index check + 3 s). Links: YouTube (normalised) and Twitch (channel/VOD/clip).
- 8 TVs measured from their .nitro art (scratchpad `tvcompose.py`/`tvmeasure.py`: composite layers, flood-fill the
  screen, slant = isometric skew 26.565°): ads_videoplayer (front, also HabHeights' TV in their room), cine_screen,
  hygge_c25_tv, army15_largescreen (wall), xm09_infotv (wall), cstm_modern_tv, hc_tv, gracie_24_tv_01.
  `ads_videoplayer` interaction ads_yt → default; the stock Nitro YouTube widget skips Video TVs.
- Client: `api/videotv/VideoTvProtocol.ts`, `hooks/video-tv/useVideoTv.ts` (states, per-viewer mute/volume in
  localStorage `hcms.videotv.volume`), `components/video-tv/VideoTvOverlayView.tsx` (mounted in RoomWidgetsView;
  follows the furni every frame, scales with zoom, clicks pass through except the 2 buttons — HabHeights blocks the
  furni click), `VideoTvRemoteView.tsx` (in InfoStandWidgetFurniView for controllers), `VideoTv.scss` (their CSS
  values, theme colour from `--holo-primary`, dark mode via body.dark-mode).
- Room import: HabHeights is websocket, so G-Earth can't record it. CDP `Network.webSocketFrameReceived` on the
  user's tab while they re-entered the room (scratchpad `hh-capture.js`, `hh_rooms.py`). Their floor items arrive in
  chunks of 250 (several 1778 packets); an empty wall list can lack its count. Room 1884 "HabHeights Anime Night" →
  our room **540 "Anime Night"** (officialrooms, door 4,25 dir 2, wallpaper 304, floor 205), 223 items. User chose to
  skip the 6 furni we lack (Haaziq_concrete_floor 160x, black_corner 46x, habbox_haaziq_bean_bag, ironhotel_gotham_planta,
  bobba_hub_leafy, mrare_rarityfountn_green).
- Ranch: click range now `hcms.ranch.click_range` (3 tiles, user: "not next to, but not too far"), text "You're too
  far away. Walk a bit closer."
- Not verified live (no headless login): screen alignment per TV/direction, sync between two clients, Twitch embeds,
  fullscreen chat. Open: a "Video TVs" volume slider in settings (HabHeights has one), placing TVs needs them bought.

## Video TV fixes, game message opt-outs, :nobubbles (2026-10-04, deployed 01:1x)
- Black box under the TV: no DOM element there (elementsFromPoint = canvas). Chrome promoted the YouTube video to a
  hardware overlay and punched a hole in the room canvas at the wrong place (HabHeights has the same box). Fix: iframe
  `opacity: .999` (no overlay promotion) and plain offsets instead of `translate(-50%,-50%)`. Verified in the user's
  localhost tab via CDP: box gone with the overlay visible.
- Overlay "jumping" while dragging: also updates on pointermove/wheel, and the size uses the canvas zoom
  (`getRoomInstanceRenderingCanvas(...).scale`, which getRoomObjectScreenLocation also applies). Not re-verified by drag.
- Fullscreen: `body.video-tv-fullscreen-open` hides the room chat bubbles; chat only in the fullscreen box.
- Game messages: tag `[RANDOM WORD]` → `[RW]` (WordScramble + client GAME_TAGS; badge code RANDOMWORD unchanged).
  New store `games/GameMutes` (table `hcms_game_mutes` user_id+tag) filters hotel-wide broadcasts
  (GameRewards.announce, WordScramble.announce); own replies still arrive. Commands (level 1) :norw, :nolotto,
  :nogames, :nobubbles = PlayerSettingsProtocol options game_rw / game_lotto / game_all / chat_bubbles (also in
  Settings > Options). :nobubbles hides room chat bubbles client-side (ChatWidgetView listens to OUT 9625 and
  requests it on mount). :nospawn was not reused (Presence spawn animations).

## Camera, ranch shop range, pyramids (2026-10-04, deployed 01:4x)
- **Camera was dead**: the core handlers need Arcturus' old external render server (`CameraClient`, gone) → "camera
  disabled"; output paths were Linux defaults (/var/www/testhotel/...); `camera.item_id` 45970 didn't exist; only ranks
  7/8 had `acc_camera`; purchase charged credits (we have none). Fix: plugin `camera/CameraService.java` takes over
  IN 3226 (picture), 1982 (room thumbnail), 2408 (purchase), 2068 (publish) with `registerCallable` + isCancelled.
  Picture: PNG signature + ImageIO check, max 2 MB / 1600 px, 2 s cooldown, saved to `hcms.camera.output`
  (hCMS/public/cdn/assets/camera/<user>_<ts>.png), replies CameraURL with the file name (client `camera.url` =
  cdn.habbo.nz/assets/camera). Thumbnail: room owner or acc_anyroomowner → camera/thumbnail/<roomId>.png.
  Purchase: `hcms.camera.price` (default 10:101 = 10 Emeralds, via Wallet "camera.photo"), photo furni
  `hcms.camera.photo_item` = external_image_wallitem_poster_small (added: items_base 4597, wall, interaction
  external_image; furnidata wall entry 4597 = Habbo's id). Publish: `hcms.camera.publish_price` (0), stock camera_web
  insert + delay. Settings fixed: camera.url, imager.location.output.camera/thumbnail, camera.item_id 4597;
  `acc_camera` = 1 for all ranks (Habbo: everyone). Not tested live.
- **Ranch shop**: shop items/green button now use `hcms.ranch.shop_range` (5); the counter's blocked front row kept
  players > 3 tiles from the seed bags, so selection failed ("too far") and the button had nothing to buy.
- **Pyramids** (no core edit): this core runs pyramids inside RoomRollerManager.processRollerCycle, which returns early
  when roller speed is -1, so pyramids froze in such rooms; and InteractionPyramid.change() never calls
  room.updateTile, so walkability stayed stale. Plugin `rooms/PyramidFix.java` (250 ms): flips due pyramids in rooms
  with roller speed -1 and calls updateTile whenever a pyramid's state changed. 189 pyramids placed hotel-wide.

## Fix round: inventory walls, messenger, help card, hovers, rarity count, ranch (2026-10-04, deployed 02:4x)
- Inventory: the furniture grid filtered with getFloorItemData only, so wall furni vanished; now wall → getWallItemData.
  Verified headless as Kasper (7 items → 6 groups incl. wall mirror/fan/lamp).
- Messenger: like HabboCity (`!e || c.length <= 0 ? null`), the card no longer opens empty; names bold.
- Help card (Nitropedia): content class `nitropedia-content` (was `text-black`, unreadable in dark) + own
  `components/nitropedia/NitropediaView.scss` (hides the padding-top/bottom spacer spans, theme text, smaller headings,
  floated images, 440x480). habbopages folder web.config sends `Access-Control-Allow-Origin: *` (client on
  play.habbo.nz/localhost fetches dev.habbo.nz).
- Ranch hovers: single hovered furni/avatar, a leave only clears its own id (enter/leave can arrive out of order).
- Ranch: `hcms.ranch.animal_range` 6 (animals + yellow button); clicking a non-shop ranch furni drops the shop
  selection; quest step type "gift" also completes on a buy or when the gift was already claimed; the shop button is
  kept at `hcms.ranch.shop_button_z` 0.1 (it dropped to 0.0 and sorted under the ground furni) on entry + every 60 s.
- Rarity (user: Habbo.com rarity level + count, infostand + inventory): plugin `rarity/RarityCount` IN 9676 (sprite id)
  → OUT 9677 (sprite id, count of that sprite in the hotel, level), 5 min cache; level = 1 + thresholds met in
  `hcms.rarity.count_levels` (1000,250,50,10 → 1-5; our scale, Habbo's isn't public). Client: `useRareLevels().counts`,
  `LayoutRarityLevelView` gem top-left + "N in hotel" in InfoStandWidgetFurniView and the inventory preview (floor
  furni). Next free opcode 9678.
- hCMS `/hotel`: the header dock nav is hidden (`display: none`, user).
- Headless testing: temporary auth_ticket on Kasper (id 5) via headless Chrome 9223, cleared after each run.

## Room 540 furni, catalog art, badge rarity, infostand relations, daily reward look (2026-10-04, deployed 03:5x)
- Room 540: the 6 skipped HabHeights furni installed (art from public CDNs: habz.es x5, lumohotel bush; icons habz,
  bush icon cut from its bundle): Haaziq_concrete_floor 95835460 (walk, h 0), black_corner 53619 (h 1.5),
  habbox_haaziq_bean_bag 52385821 (sit), ironhotel_gotham_planta 60590426, bobba_hub_leafy 32292639,
  mrare_rarityfountn_green 67586793 (furnidata + items_base, not in catalog); 227 items placed at the captured spots.
- Catalog art (user: "furni from the HabboCity catalog that had no art"): 2,245 catalog base names had no .nitro.
  Scratchpad `resolve_missing.py` tries every stock_retro hotel that lists the furni (furni.asset.url from its
  renderer-config, plain GET, header must be a bundle of that name, icon too if missing): **1,869 saved, 376 not found
  anywhere** (log `resolve_missing.log`; sources mostly bobba.li, habbo.ax, fresh-hotel, habblet, habbo-alpha).
- Rarity: the furni gem/count was reverted (user: furni rarity already matches the Center). Now **badge rarity**:
  `rarity/RarityCount` IN 9676 (badge code) -> OUT 9677 (code, owners = distinct users_badges.user_id, level by
  `hcms.rarity.badge_levels` 1000,250,50,10), 5 min cache. Client `api/rarity/BadgeRarity.ts` (one shared listener +
  cache), shown in LayoutBadgeImageView's hover card (gem + "N Habbos have this badge"). The Center has no badge
  rarity (hcms_values_badges is empty).
- Infostand (user): saving the motto made the relations disappear (the motto echo replaces avatarInfo, the effect reset
  relationships and the re-request did not come back). Relations/badges now reload only when webID changes; the motto
  follows avatarInfo.motto. Motto edit itself verified headless ("testing motto" saved).
- Room thumbnails: a missing `assets/camera/thumbnail/<id>.png` (all rooms so far) showed a broken image; the img hides
  on error so the HabboCity placeholder background shows.
- Daily reward window restyled like hbeta.net's "Bonus de connexion" (user: look only, keep our 7-day rewards):
  carousel of day cards (centre = selected, click today's to claim), dot strip, streak/best line, rule line; freezes and
  online earnings unchanged. Own CSS (`engagement-bonus-*`, no hbeta images). Verified headless.
- Follow-up 04:2x: relations confirmed headless after a motto change ("testing motto v2", relation line stays).
  Missing-art retry with each hotel's exact spelling: +8. The last **368 catalog offers** (362 base furni, retro
  customs such as Black_sapphire_*, Beff_*, Arcade_*; none official, none in HabboCity's current furnidata) were
  hidden (user): moved to page 9967877 "Hidden: no art" (under Staff, visible 0, enabled 0, min_rank 7). Backup with
  the original page_id: table `bak_20261004_hidden_noart`. Restore = `UPDATE catalog_items c JOIN
  bak_20261004_hidden_noart b ON b.id = c.id SET c.page_id = b.page_id`. HabboCity's CDN (assets-all) was not tried:
  needs the user's HabboCity hotel tab.
- 2026-10-04 11:18: Kasper chat bridge restarted (user) in room 540 "Habbo Cinema" (scratchpad of session 7d761374:
  `chat-bridge.mjs` + `hclient.mjs`, chat in `chat-in.txt`, lines to say in `chat-out.txt`; temporary ticket cleared
  after login). The "new FurniSpawns/Automat jar" from that session's to-do was already live (sources 2026-10-03 20:05,
  running jar built 03:22 / deployed 03:37); no client change pending. The bridge stops when the session ends.
- 2026-10-04 11:2x: dev client stuck at "(0%)" after a reload: index.html's NitroConfig `sso.ticket` prefers the
  saved reconnect ticket (`sessionStorage hcms:reconnect`) on a reload of the same URL; that ticket was stale ("non-
  existing SSO token") and there was no fallback, so `?sso=` was never used. Fix: before using a saved ticket the page
  marks it in `hcms:reconnect-try`; ReconnectView clears the mark when a new reconnect ticket arrives (= logged in);
  if the mark still equals the saved ticket on the next load, the URL ticket is used. Deployed (live + dev Vite).


## HabboCity catalog images + texts in English, "Right now:", catalog clean-up, ranch hover fixes (2026-10-04)
- User: "all HabboCity catalog images and descriptions in English, CITY on the image → our H/Habbo logo, image
  otherwise unchanged". Tools in `C:/tools/nitro-catalog-copy/scripts/`: `hc-page-info.js` (CDP UI-click crawl of the
  user's habbocity.fr/hotel tab, all 5 tabs, 1,223 pages → `out/hc-page-info.json`; pages that only expand are marked
  `unchanged`), `hc-page-images.js` (927 GIFs via `Network.loadNetworkResource` → `out/hc-page-images/originals`),
  `hc-page-rebrand.py` (CITY logo: two glyph templates cut from reference images, luminance matchTemplate over the
  whole image, threshold 0.85, inpaint only the logo mask, paste `logo_habbo.png`; animated GIFs per frame; overrides:
  `TAGS` = teal badge tags flood-filled with their own colour, `WORDS` = "CITY MUSIC" → "HABBO MUSIC", `FORCE`).
  884 rebranded, 43 had no branding. Left as is: `colorss.gif` (French chat line naming HabboCity), the History image
  (French bubble text).
- 948 texts translated by hand (City/HabboCity → Habbo, creator credits kept, pet breed names/picker labels skipped).
  Mapping by icon id + parent icon, caption-token tie-break, nav-order zip on the full sibling list: 1,037 pages.
- Applied (user "do it"): backup `catalog_pages_bak_20261004_hcinfo`; 974 default_3x3 pages, only empty fields:
  `page_teaser` = image (slot 1 = the right-column image in `CatalogLayoutDefaultView`, like HabboCity; first written to
  `page_headline` = header slot, which is off, then moved) and `page_text1` = English text. Images copied to
  `cdn/c_images/catalogue` (19 overwritten, old copies in `out/hc-page-images/cdn-backup`). RCON `updatecatalog`.
  Verified in a Kasper headless client (Academy of Evil, Halloween 2025). Note: the column text is white like HabboCity's,
  hard to read in our light theme.
- Seasonal Shop removed again: `hcms:seasonal-vault lock halloween` (pages back in the staff vault).
- **"Right now:"** (HabboCity's "EN CE MOMENT :", 4th entry of Official Furni, icon 34): new page 9967878 (order 3) holding
  Autumn (9966768), Habbo Autumn (9967472), Halloween (9966787) and Habbo Halloween (9967486), moved out of
  Seasons/Events like HabboCity does. Backup `catalog_pages_bak_20261004_rightnow`.
- Clean-up (user): Staff › **Retired pages** (9967879, rank 7) holds Halloween 2015/2017/2019/2020 (1–5 furni) and
  New › From HabboCity (19 pages, all rank 7). New › Summer/Easter/Halloween hidden (rank 7): their 2026 pages were
  exact duplicates of Seasons › Summer, Events › Easter, Events › Halloween. Backup `catalog_pages_bak_20261004_cleanup`.
- Ranch, from the G-Earth recording (`exports/20261003-185834`, furni VariableFx statuses): the plant hover bar
  (config "upgrading", renderer 2 style 19 width 1, hover) starts at 25 and rises 1 per 3 s to 75, then the plant is ready;
  the crop counter on the plant stays at the yield (+1 per watering). `RanchHoverView` now shows 25 % + 50 % × growth
  in whole percents (was rounded to quarters). Yield at level 1 is random per plant (tomato 2–5, corn 3–8, aubergine
  8–11); the recording never left level 1, so a level effect is unknown. Level bar = category 2, counters = category 5:
  `RanchPlayersView` now puts the level bar on top, the counters under it (coins, tokens, corn, tomato, grapes, pumpkin,
  aubergine = Habbo's config order); the stack stays bottom-anchored. Client deployed.
- **Correction (user screenshots of Naz, Jo!!, Chain on habbo.com):** the stack order differs per player and the level
  bar is one entry in it (grapes, the last crop unlocked, always under it). Rule copied: the order in which the player
  first owned each thing. `hcms_ranch_players.stack_order` (new column) gets a key appended the first time it is owned
  (`Ranch.stackOrder`: crops > 0, gold = coins > 0, honor = tokens > 0, level = xp > 0); existing players get their
  current holdings in the default order once. Sent as a trailing block after the players list in the RanchPlayers
  packet (one string per player, client reads it `if bytesAvailable`); `RanchPlayersView` renders that order, unknown
  keys appended. Plugin deployed (jar backup `.bak-20261004-stackorder`), client deployed, verified a player row got
  `tomato,gold,honor,level`.

## Ranch shop/barn UI, fertilizer fix, Chloe, :ha card, Halloween logo, daily reward revert (2026-10-04 afternoon)
- **Fertilizer purchases lost coins:** `hcms_ranch_inventory.crop` was VARCHAR(16), `fertilizer_regular`/`_premium`
  are 18 → insert failed after `pay()`. Column now VARCHAR(32) (live + `register`), `execute()`/`add()` return success
  and `buy()` refunds when the item can't be added. Phi (id 1) got the 3 Regular Fertilizers from the 3 failed buys.
- **Ranch Shop window** (`components/ranch/RanchShopView.tsx`, PeakRP blacksmith layout from retrotimes.co screenshots,
  Sunset Ranch colours): Buy column (seeds with price/grow time/level lock, fertilizers) + "Your barn" column.
  Opened by the green button (`shopButton` → starter seeds if new, then `push(habbo, "shop")`; `SHOP_SELECTION`
  removed), by `:ranch`, by the own level badge, by the barn bar and by clicking **Chloe** (bot 4, setting
  `hcms.ranch.shop_bot`, within `shop_range`). Chloe moved to (11,45) in front of the seed stall.
- **Barn bar** (`RanchBarnView`, bottom centre above the chat): seeds (click = `:plant`), fertilizers (click =
  `:fertilizer`), crops, Shop button; the selected one is highlighted from `state.pending`. Old Inventory/Shop tile
  windows and their CSS removed. Hints now point at the Barn.
- **Buy dialog** rebuilt (flex, −/amount/+/Max stepper, Sunset Ranch buttons); the old slider/input picked up global
  input styles.
- **Leaving the ranch**: `RanchView` resets on `RoomSessionEvent.CREATED` too (room-to-room moves don't always fire
  ENDED); the server re-sends ranch state 1.5 s after entering a ranch room.
- **:ha card** (user's habbo.com "Welcome to Habbo" NUX card, 1:1, staff avatar instead of Frank): plugin
  `alerts/HotelAlertCard` takes over `HotelAlertCommand` (UserExecuteCommandEvent, staff feed still logs it) and sends
  OUT **9678** (sender, figure, message, roomId, roomName) to everyone without blocked alerts, always to the sender.
  Client `api/alerts/HotelAlertCardProtocol.ts`, `components/hotel-alert/HotelAlertCardView` (+scss, mounted in
  MainView): banner `cdn/c_images/nux/hotel_alert_banner.png` (Habbo's NUXroom_prompt with Frank inpainted out; the
  local copy of that file was HabboX-branded, not used), avatar drawn by the client, "Enter the room!" → staff's room,
  else "OK". Verified on Kasper's client (Phi's `:ha`). Phi didn't see it because Phi has `block_alerts = 1`.
- **Daily reward** reverted to our old window (carousel components + `engagement-bonus-*` CSS removed, width 420)
  from this session's recorded edits (the files have no git history).
- **YouTube on the TVs**: hCMS `hotel/client.blade.php` client iframe only allowed `microphone`; now also autoplay,
  encrypted-media, fullscreen, picture-in-picture, clipboard-write + allowfullscreen.
- **Halloween logo** (user's HabboCity "CITY + Scream" reference; user: keep it gold): our gold logos + blood drips +
  our own pixel ghost mask (`scratchpad/hw/halloween_logo.py`). Website: `App\Support\Branding::logo()` +
  `config('hcms.logo')` (October → `logo_habbo_halloween.png`) in navbar/index/hotel. Client: `hotel.logo.season`
  in ui-config (`halloween`) adds `season-halloween` to the toolbar H (`ToolbarBranding.scss`,
  `logo_habbo_icon_toolbar_halloween[@2x].png`, 37×45). Config URLs in index.html now versioned (`?v=20261004`);
  bump it whenever ui/renderer config changes, otherwise browsers keep the 7-day cached copy.
- Plugin jar backups `.bak-20261004-stackorder`, `.bak-20261004-hacard`. tsc 52 (49 baseline + 3 not from this work).
- Open: barn seed click needs a claimed farm first (by design); Kasper chat bridge restarted.

## hubba.cc Welcome Lounge + Café, Official tab like habbo.com (2026-10-04 15:2x)
- Rooms copied from hubba.cc (user's game.hubba.cc tab, CDP `Network.webSocketFrameReceived` via scratchpad
  `hh-capture.js` → `hubba/frames.jsonl`, decoded with `hh_rooms.py` + their live FurnitureData): "HuBBa
  Empfangslounge" 754926 → **room 541 "Welcome Lounge"** (141 items, door 2,16 dir 2), "HuBBa Café" 709399 →
  **room 542 "Café"** (83 items, door 1,20 dir 2), owner officialrooms, built with
  `c:/tools/gearth-room-export/build_room.php`. Doors = the user's first unit position after the room load.
- 9 missing furni from nitro.hubba.cc / data.hubba.cc installed (ids 2000043187-195, English names: Snack Vending
  Machine (ads_cheetos, brand dropped), Little Worm, Invisible Walkway (walk), White Mini Fan, Mr. Spike the Hedgehog,
  Large Cefalu Pot, Sleepytime Duck, Invisible Seat (sit), Magic Sun Egg); FurnitureData entries added, `&n=` bumped,
  client config URLs `?v=20261004b`.
- `hotel.room.nooblobby` 3 → **541** (the NUX "Enter the room!" welcome room).
- Official tab = habbo.com's `official_view` (decoded from the G-Earth recording, `scratchpad/navblocks.py`): New,
  Official Rooms, Games, Room Bundles, Our Fansites, Help & Safety. `navigator_publiccats` renamed/reordered (ids 1 New,
  4 Official Rooms (was BAW), 2 Games, 5 Room Bundles, 3 Our Fansites, 6 Help & Safety; Arcturus sorts ascending and
  hides empty categories), `navigator_publics` filled (New: only new room bundles, empty until Dark Academia (user); Official Rooms: 541, 542, 540; Games: 538, 514;
  Help & Safety: 354). Backups `navigator_publiccats_bak_20261004`, `navigator_publics_bak_20261004`.
- Habbo's New list starts with "Dark Academia Bundle" (80455774, noodlesoup) = the new dark Halloween room. Not in our
  recording: next step is the G-Earth recorder (`c:/tools/gearth-room-export/run.bat`) while the user visits it and the
  other official rooms (Welcome Lounge, Club NX, Theatre, Picnic, Coffee House, Hall of Habbo, HC Lounge…), then
  `rebuild_rooms.py` + `build_room.php`, and put Dark Academia first in New.
- Room ads (user: "where is the roomads"): the hubba rooms' `ads_background` (the painted room backgrounds) arrive as a
  category-1 map (imageUrl, offsetX/Y/Z) which `build_room.php` didn't handle → stored as `0`. Images copied to
  `cdn/room-ads/hubba_welcome_lounge.png` / `hubba_cafe.png` (checked: no hubba branding) and both items set to our
  format `offsetZ=..;offsetY=..;offsetX=..;clickUrl=;imageUrl=..;`. `build_room.php` now converts that map too (URL kept
  as is; copy external images to our CDN separately).

## Admin catalog: hubba.cc + HabboCity furni whose art we already had (2026-10-04 16:0x)
- User: "furnipacks we don't have (hubba.cc/HabboCity hidden staff pages) into our staff catalog, in categories, create
  an Admin category", then "only the ones already on our CDN", "both". Classname comparison (items_base + our
  FurnitureData, case/underscore-insensitive): hubba.cc 12,748 / HabboCity 16,539 furni we lack; their pages are hidden
  at the source (HabboCity: 16,576 of 16,599 on no public page), so pages come from the data. Art sample: 15% had
  our `.nitro` under the same classname, 2.5% the same art under another name.
- hCMS `CatalogImporter` admin mode (`hcms:catalog-import --source=<hotel> --admin`): offers only on **Admin** (root,
  rank 7) › From <hotel> › NFT / Rares / Lines (furniline) / Creators & Packs (classname prefix, other hotels' brand
  words stripped) with a page per group of 10+, else Other <letter>; free offers, no NEW or public category offer;
  same refusal rules as before. hubba.cc added as a discovery source (`C:/tools/nitro-catalog-copy/sources/hubba.cc/
  furnituredata`, icons data.hubba.cc); its clothing/ads/sound/test candidates auto-ignored like HabboCity's.
- Result: **1,606 furni** (HabboCity 1,081 + hubba.cc 525; 977 hubba.cc ones were the same classnames HabboCity
  delivered first) on **107 Admin pages**, all rank 7; RCON `hcmsreloaditems` (61,475 item types, 1,855 pages).
  Refused for a hand-set interaction: 392 by name (rollers, dice, wired, ltd, rare…), 48 crackable, 13 pet
  customisation, 3 ecotron, 33 size disagreements, 26 colour duplicates; 86 lack an icon. Backups
  `items_base_bak_20261004_admin`, `catalog_items_bak_20261004_admin`, `catalog_pages_bak_20261004_admin`, plus the
  importer's `FurnitureData.json.bak-catalogsync-*`.
- Not imported (user's choice): furni whose art isn't on our CDN yet (hubba.cc ~10,000 downloadable directly,
  HabboCity ~15,000 only through the user's tab), incl. hubba creator packs (aydin, alp, tc, lizeng…).
- Some hubba.cc Lines pages ended small (1-6 offers) because the 10+ check counts candidates before the duplicates
  were refused.

## All missing hubba.cc/HabboCity furni into Admin with habboworld page names; more hubba rooms; pyramids (2026-10-04 evening)
- User: "use hubbly pages to fix page naming, all furni not only the ones we have", then "habboworld's staff catalog
  and diamonds", "don't compare with ltdhabbo/hubblycata, use stock retro", "add all and fix fr".
- Art: `C:/tools/nitro-catalog-copy/scripts/fetch-hotel-assets.py` (hubba.cc direct: 9,628 bundles + 6,064 icons, 403
  not on their CDN); HabboCity-only furni from other hotels' public CDNs (scratchpad `resolve_missing.py`, ~93% found).
- `scripts/admin-page-map.py` → `out/admin-page-map.json` (classname → habboworld catalog path translated to English
  via `hw_captions_en.json`, roots Equipe→Staff, Mobis→Furni, Diamants→Diamonds…, other hotels' names → Habbo; English
  names from the habbo.com intel snapshot + stock_retro `furni-names-index.tsv`). `hcms:catalog-import --admin
  --map=<file>` puts mapped furni on Admin › <that path> with that name; unmapped ones keep the data grouping.
- The first 1,606 were re-homed in place (scratchpad `hubba/rehome_admin.php`: 1,162 moved, 1,300 renamed incl.
  FurnitureData) because Phi already owned 2. hubba.cc run: 8,333 imported (refused: 355 present logic, 267 by name,
  136 size, 27 credit, 5 crackable). Admin then 543 pages / 9,940 offers. HabboCity run started after.
- Rooms from hubba.cc (frames2 capture): **543 Hotel Isla** (221 items, 2 backgrounds → `cdn/room-ads/hubba_isla_1/2.png`,
  koi fountain added after the import), **544 Pub** (was "HuBBa Kneipe", 1,691 items), **545 Lido** (278); all in
  Official Rooms. Infocenter/Ping Pong captured but not built (user). Welcome Lounge 541 reset from its capture (needed
  an emulator restart to unload it).
- Pyramids (user: stay down, block, only double-click/Wired): `wf_pyramid` + `alien_pinkpyramid` → `default`
  interaction, `allow_walk` 0, 2 states, all 191 placed set to state 1 (down; state 0 = raised per the .nitro frames).
  The core's random InteractionPyramid toggling no longer touches them. Backups `items_base_bak_20261004_pyramid`,
  `items_bak_20261004_pyramid`.

## Hotel reset for beta + economy simulation + HabboPass Diamonds fix (2026-10-04 17:1x)
- User: "reset the whole hotel, only keep Phi, Khalil, officialrooms, Kasper, fresh opening", then a quick economy
  test. Choices: kept users get a fresh start; also wipe logs & history, market & economy, old backup tables.
- Backup first: `db-backups/hcms-full-before-reset-20261004.sql.gz` (full `hcms` dump, verified complete).
- Reset (scratchpad `reset/gen_reset.py` → `reset.sql`, one transaction; first run rolled back on an enum quote):
  6 accounts deleted (Habbo, Mia, Tobias, Luna, Jaxon, Pete) with their rows; test rooms 522/523/525 deleted with
  contents; kept users: 150 Diamonds (the RegisterUserAction start), 0 credits, no inventory, progress/achievements
  cleared, ACH_ badges removed, users_settings counters reset; 90 tables wiped (chatlogs, audit, staff feed, ledger,
  quests, ranch, pass progress, lottery, market, auctions, LTD sales + `limited_sells` 0, sessions…); 121 old/bak tables
  dropped (`old_guilds_*` kept). Kept: catalog (76,413 offers / 75,183 types), officialrooms' 22 rooms (9,941 items),
  settings, official bots. Stale navigator entry for room 514 removed.
- Economy simulation (scratchpad `econ/simulate.py`, 1,000 players × 4 types × 30 days, real settings): HabboPass
  levels paid 2,500/15,000/20,000/25,000/35,000 real Diamonds (copied from HabboCity), so a regular player had ~78k
  Diamonds after 30 days. Fixed (user OK): free L4 10, L11 25, L20 40, L25 60; VIP L13/L16 30, L23 50 (backup was
  `hcms_citypass_levels_bak_20261004`, dropped by the reset; originals are in the full dump). After the fix: regular
  ~20 Diamonds/day (rare every 1-2 weeks), casual ~80 in month one, VIP ≈ +48% Diamonds; Emeralds ~3,700/month for a
  regular with few sinks.
- Open suggestions (not applied): more Emerald sinks or online cap 60 → 40; day-7 login 10 Diamonds + small Diamond
  first-quest for casuals; `hcms.spawns.rooms` still points to deleted room 525 (repoint to public rooms); HabboPass
  Season 1 ends 2026-11-01 and regulars clear all 26 levels in ~30 days (new season/longer for beta).
- HabboCity furni import finished before the reset (Admin catalog now 2,575 pages loaded in total catalog).

## Boot loading screen in the client HTML (2026-10-04)
The black screen before the client came from the client page itself: while the ~8 MB main script downloads, `index.html` showed a plain dark body. `index.html` now has an inline style (`html,body` #192331) and a static `.boot-loading` arcade duck inside `#root`, which React replaces on its first render. Same look as `LoadingView` and as the hCMS beta `/hotel` page, so the website → client hand-off has no black gap. Deployed (`yarn deploy`); index.html is `no-cache`, so no version bump is needed.

## Client dock, habbo.st-style YouTube music box, room-entry banner (2026-10-04)
Reference: habbo.st `/nitroframe` (read through CDP, not copied as code).
- **Room-entry banner** (`index.html`, 1:1 with habbo.st's `#ad1.roomenterad-habblet-container.banner-static`): shows on the client's `load` at most once per 2 hours (`localStorage.lastAdShown`), "Ad closes in N seconds" countdown from 60, red X to close. Images on our CDN: `cdn/room-enter-ad/frame.png` (hanging sign) and `beta.png` (our own 728x90 "Welcome to Habbo Beta!" banner; habbo.st's own banner was not reused).
- **Client dock** (`components/client-dock/ClientDockView`, a lazy player view): our website's hotel dock made smaller (top 10, left 15, 44 px high, so the ranch quests at top 70 fit under it). It has a ☰ toggle (state in `localStorage hcms:client-dock-open`), logo (Halloween logo when `hotel.logo.season`=halloween), Center / HabboPass / Support (website icons from `url.prefix`, opened through `OpenOnSite`), and a YouTube button (link event `room-youtube/toggle`). - **YouTube** (`room-youtube/RoomYoutubeView` rewritten, same protocol 9650/9651 and `:play` command): habbo.st's music box (`#music-box`, red theme) sits top right like habbo.st (`top 4px; right 205px`, just left of our 200px right-side column; user: "the youtube is on right side"), and the TV opens under it (x = width-205-432, y 65). It shows the title (from the YouTube iframe API `infoDelivery`), "Played by X" / "Playing just for you" / "Use :play to play", a stop button (room stop for controllers, otherwise local), and volume (`hcms:youtube-volume`). The TV toggle shows habbo.st's draggable red TV (`cdn/jukebox/jukebox-tv.png`, `jukebox-tv-toggle.png`, fetched through the user's browser). Hidden TV = offscreen, so audio keeps playing. A new video opens the music box. Controllers get Pause / -10s / +10s under the TV.
- Verified in the user's Chrome (player account): dock 55..659 x 10..54 with all icons loaded, music box opens/closes from the YouTube button with "No song selected / Use :play to play", banner shows on a fresh load. Not verified: a real `:play` video through the new box/TV.
- Note: two tabs logged in as the same account keep kicking each other (SecureLoginEvent "non-existing SSO token" + reconnect loop), which looks like a stuck loading screen.
- 2026-10-04 later: the client dock uses the client's dark-mode greys (#2b2b2b bar/toggle, #262626 tooltips and active toggle, rgba(255,255,255,.08) borders, gold #f5c25c BETA badge) instead of the blue-black glass. Room-entry banner `cdn/room-enter-ad/beta.png` redrawn: Habbo logo with a gold BETA badge on its top-right corner; index.html loads it as `beta.png?v=2` (the CDN caches for 7 days). Deployed.

## Beta batch: dock, loaders, banner, menu, daily hub, badge (2026-10-04 evening)
- Dock (top-left): plain logo (24 px, `object-fit: contain`, because a global client img rule had `object-fit: none`), gold BETA label, Presence shop (`shop/toggle`), YouTube, and `?` last (opens `BetaInfoView`, a hotel-info-style card: what the beta is, beta ends Sunday 11 October, Monday: HabboPass season, achievements + daily quests, Rares, Sunset Ranch; after the beta: website, Center, events). Link event `beta-info/toggle`.
- Right-click menu: the Website section was removed; Hotel = Presence shop, Catalog, Inventory, Commands (`cmdhelp/command`), Beta info; Account = Logout (`RequestLogout` posts `hcms:logout` to the parent page, which POSTs /logout with its CSRF token and goes to /). Clothing shop removed from the menu and from the avatar editor.
- Loaders: #262626 everywhere (index.html boot loader with an instant "(0%)", `.nitro-loading`, hCMS beta /hotel). The arcade GIF background was recoloured to grey (`arcadescreen-grey.gif`, renamed to bust the 7-day CDN cache).
- Room-entry banner: runs at once (not on window load) so it shows over the loading screen; banner image `beta.png?v=2` (logo + gold BETA on its top-right).
- Plain logo everywhere for now: hCMS `config('hcms.logo.months')` = [] and ui-config `hotel.logo.season` = "".
- Daily hub: Quests and HabboPass tiles/rows greyed out ("Soon", not clickable) until Monday.
- Texts: "Habbo.com"/"Habbo Staff" → "Habbo.nz"/"Habbo.nz Staff" in ExternalTexts (30 keys, URL and habbo.com.br texts restored afterwards; backup `ExternalTexts.json.bak-20261004-habbonz`; version `?v=20261004i`). Badge BTA1 = "Habbo Beta Tester".

## Beta polish, evening 2026-10-04
- **Client** (deployed): daily hub result icon 32 px native (`EngagementView.scss`); `:nitro`/`:client` send `:info`
  (`useChatInputWidget`); `[BETA]` chat tag gold #f5c25c with dark text (`ChatWidgetMessageView` `GAME_TAGS`/`GAME_TAG_TEXT`);
  browser context menu always blocked, our page menu unchanged (`PageMenuView`); messenger + guide chat bubbles lost
  `text-black` (HabboCity 1:1, checked in the saved HabboCity bundle); moodlight/toner colour and hide-walls/thickness are kept in state
  and re-applied once the room filter/instance exists (`hooks/rooms/useRoom.ts`, fixes "sometimes" on room entry).
- **Client lock**: `src/index.tsx` redirects to https://habbo.nz unless the host and every ancestor frame are habbo.nz
  (or localhost) and the `sso` starts with `hcms-` (localhost skips the prefix check). Verified headless: no ticket /
  `abc123` → habbo.nz, `hcms-…` → client. The real server-side lock stays the websocket origin whitelist
  (`websockets.whitelist` = `*.habbo.nz,localhost`).
- **Tickets**: website `IssueSsoTicketAction` → `hcms-<48 hex>`; plugin reconnect tickets → `hcms-rc-…`.
- **Plugin** `beta/BetaClub`: free HC on login (`hcms.beta.free_hc_enabled/days 31/min_days 7`), HC gift claim packet
  2276 cancelled and the gift notification (OUT 2188) dropped (`hcms.beta.hc_gifts_disabled`). Verified: Test got a
  31-day HABBO_CLUB row. HC payday (10 % credits back, `subscriptions.hc.payday.*`) is still on.
- **Catalog/DB**: Bank (9967548) + Colored Phrase (9967549) + Habbo Club Gifts (9968453) hidden; Sunset Ranch pages
  (9967873/4) icon 369 (official, from the G-Earth CatalogIndex "Sunset Ranch Furni!", file from images.habbo.com);
  Habbo Furni info page text rewritten (no CITY/City Club), Diamonds info page lost the CityCash line. Hotel view news reloaded
  via RCON `executecommand` as Khalil.
- Dev server: `node_modules/.vite` was from 2026-10-02 (unpatched renderer, badge slots compacted on localhost) → cleared.
- Open: catalog history image (needs the HabboCity file; open habbocity.fr in Chrome), wired modifier translations,
  MetroHotel nitropedia, last-login clock icon, YouTube box habbo.st-only styling.

## Go-live hardening, late 2026-10-04
- **Guard** (`guard/hcms-guard.js` → obfuscated `public/hcms-guard.js` by `yarn build`, javascript-obfuscator with
  self-defending): host/ancestor/`hcms-` ticket check → https://habbo.nz, sets `NitroConfig` (config URLs now
  `?v=20261004h` live here, not in index.html), the room-entry banner (DOM built in JS, 2 h `lastAdShown`), F12 /
  Ctrl+Shift+I/J/C/K / Ctrl+U blocked and a devtools trap (redirect) for non-staff. The bundle (`src/index.tsx`)
  refuses to start without the guard's `__hg` marker and exposes `__hs` (rank ≥ 5 skips the trap). index.html is
  2 KB: loader, guard, bundle. localhost skips all of it.
- Browser context menu always blocked; our page menu still opens (`PageMenuView`).
- Room entry: moodlight/toner colour and hide-walls kept in `useRoom` state and applied when the room is ready.
- Presence › Name tab: old navy colours → `--center-*` tokens; Reset button neutral.
- Streak freeze asks for confirmation before spending Diamonds.
- `hcms.beta.pass_paused` (plugin `beta/BetaPause`: achievement progress cancelled, `HabboPassXp.grant` and
  `DailyQuests.advance` off) + hCMS `hcms.beta.pass_paused` (`HCMS_BETA_PASS_PAUSED`, GameEvent skips winwins/quests).
  Monday: set both to 0 (emulator_settings + .env, then `php artisan config:cache`).
- Home room: `hotel.home.room` 541, `users.home_room` default 541, all 7 users 541 (the earlier change had not held:
  new users had 0 and stayed on the hotel view).
- Swap-o-Matic (item 142912) moved from locked room 352 to 541 (6,14 rot 2); hotel view news id 5; landing text
  "in the Welcome Lounge" (ExternalTexts `?v=20261004k`).
- `hcms.info.engine` = "Arcturus Morningstar HabboNZ Edition". ADM badge image = habbo.st HM02 (backup ADM.gif.bak-20261004).
- E2E verified headless: register on the landing → /hotel → client with `hcms-` ticket → Welcome Lounge, gold
  [BETA] welcome lines, chat works, HC 31 days, BTA1, achievements stay at 0. Test accounts Beta214602 (13) and
  Beta215116 (14) still exist.

## Entry speed, clothes lag, chat icon (late 2026-10-04)
- Cloudflare (Global key in hCMS .env, user-approved): Development Mode off, cache rule "Cache all CDN files
  (cdn.habbo.nz)" 7 days, Tiered Cache + Smart Topology, 3,810 figure/effect files pre-warmed (the rest on demand).
  Clothing pack test: 21 s under load before, 0.06 s HIT after. See project-workflow `infrastructure.md` "CDN caching".
- Truffle fonts: `App.tsx` no longer waits for `preloadNitroTruffle` (all 43 `.tfc` atlases, 47 MB, on every entry).
  `wired-creator-tools-habbo/WiredCreatorToolsView` loads them the first time the window opens (`truffleReady`, the
  window shows once loaded). Entry now ~3.1 MB transferred, 0 truffle files, room ready 1.1 s after /hotel (headless).
- Chat: `gameLineHtml` "Winners:" bolding stopped at the first dot inside the currency icon URL → `[^.<]+`.
- Mod tools Games tab: rank 7 (`GAMES_LEVEL` 7 + `hcms.games.admin_rank` 7).
- Banner every entry: works in a clean browser (2 h `lastAdShown`); a storage-clearing browser extension resets it.
- Not verified live: opening the Wired Creator Tools after the lazy font change (needs a room with rights).
- Badge images are versioned: `badge.asset.url` = `.../album1584/%badgename%.gif?v=2` (both renderer-config copies,
  renderer-config `?v=20261004j` in the guard). After replacing a badge image under the same code: bump `v`, bump
  the renderer-config version in `guard/hcms-guard.js`, deploy (browsers keep badge images 7 days otherwise).

## Full session simulation + tool (late 2026-10-04)
- Headless player session as Beta215116: login → Welcome Lounge, chat, `:info`, navigator (enter room), catalog tab,
  inventory, Daily Hub claim (+10 Emeralds, ledger row `daily.reward`), Presence, friends, own infostand, `:rw`.
  0 client errors, no emulator/website errors. `:info` engine name only showed after the 23:55 config reload.
- Reusable tool for the user: `C:\tools\hcms-simtest` (`run.bat` asks username/password, starts headless Chrome on
  9223, `simulate.js` writes `reports/<time>/report.txt` + screenshots). G-Earth not used: Nitro needs a proxy/cert
  setup and only sees packets, not the UI.

## 2026-10-05 — Moodlight/wall fix reverted
Reverted the uncommitted `src/hooks/rooms/useRoom.ts` change (deferred room background colour, toner/filter, and
wall visibility/thickness via `RoomVisualizationSettingsEvent`, applied on a new `roomInstanceReady` flag) — it
broke room walls. `git checkout HEAD -- src/hooks/rooms/useRoom.ts`, rebuilt + deployed (`index-4b19d2d4.js`);
walls render correctly again. The removed logic was also what persisted moodlight colour + hide-walls on room
entry, so reintroduce that narrowly (walls-only) if it regresses. Broken version saved at
`../hcms-furni-backups/useRoom.ts.moodlight-fix-20261005`. A follow-up black screen turned out to be the user's
MacBook browser cache, not the build.

## 2026-10-05 — Moodlight/walls compared with official Arcturus and Polaris (investigation, no code change)
- Server: moodlight files are identical to Morningstar (git.krews.org) and only differ from Polaris in Trove vs
  `Map.values()`. Entry order (paint → thickness → wall items) is the same. Not the cause.
- Renderer fork vs official 1.6.6: moodlight path unchanged; room planes differ (highlight areas, 16 ms update interval,
  pooled-texture guard in `RoomTextureUtils`, floor holes).
- Cause of the 2026-10-05 break: the reverted `useRoom` change re-sent `updateRoomInstancePlaneVisibility/Thickness`
  that the renderer already applies; the planes part was redundant. The real "sometimes" bug is only the colour race:
  `ROOM_COLOR` / `ROOM_BACKGROUND_COLOR` can fire before `useRoom` creates the AdjustmentFilter/background sprite, and
  `updateRoomFilter` drops it (stock nitro-react has the same race).
- Fix proposed (not applied): keep the last colour/HSL in state and apply when the filter/background exist; no plane calls.
- Data: room 354 (Habbo: Infobus, officialrooms) has two dimmers (dimmer_buttn 82284 + dimmer_swtch 82287), both on,
  inserted by the room import (placement blocks a second one). The user confirmed this is the issue. It is the only room
  with more than one dimmer. Fix: pick one up in the client (a DB edit while the room is loaded gets overwritten).

## 2026-10-05 — Builder Mode: brush flyout closes on tool switch (sodaho 1:1)
- Sodaho's toolbar tool click (`floor-editor.pretty.js` `p`) does `g(C === "fill" && !a)`: any tool other than Fill
  (and toggling a tool off) closes the "Furni brush" flyout; picking in the grid keeps it open; the eyedropper switches
  to Fill with it closed; the brush itself stays armed. Ours only touched the flyout for Fill, so it stayed open over
  Pickup/Height/Select (and hid their flyouts, `flyoutsVisible = !brushPickerOpen`).
- `BuilderToolbarView.tsx`: `selectTool` sets `setBrushPickerOpen((tool === 'fill') && (activeTool !== 'fill') && !brush)`,
  grid click re-opens it after `selectTool('fill')`, eyedropper closes it. Deployed (chunk `c-c3fd0a72.js`).
- tsc 52 (baseline 49; the 3 extra are elsewhere, none in builder-toolbar). Not live-clicked yet.

## 2026-10-05 — Live Lotto moves to the Ranch Quests spot (top left)
- New `common/LeftPanelStack.tsx` (+ `.scss`): `LeftPanelStackView` (mounted in `MainView` before `ProtectedViews`) is a
  column at top 70 / left 15 (z 55, hidden when empty); `LeftPanelPortal` renders a panel into it.
- `LottoLiveView` and `RanchQuestView` render through `LeftPanelPortal`; their own absolute positions are gone
  (lotto was bottom 150). Ranch Quests has `order: -1`, so in a ranch room the lotto sits under it, elsewhere the
  lotto takes the top spot. Deployed; tsc 52 (unchanged). Not checked live with both panels visible yet.

## 2026-10-05 — Test account reset (twice) + profile cover delete race
- **Test (id 12) fresh start** (user OK): backup `db-backups/test-user-12-before-reset-20261005.sql` (users row + 30
  tables). RCON `disconnect` first (the emulator would save its in-memory state back), then one transaction deletes its
  rows in 30 tables (items, achievements, badges, currencies, quests, pass, lottery, ledger, session/enter logs,
  security incidents, banner/ad rows, chatlogs_room …) and resets the users row (default look, motto '', 0 credits,
  `account_created` now). Seeded like `RegisterUserAction`: zero rows for 0/12/101/103/104 + 75 Diamonds through
  `EconomyService::credit` (`auth.registration_bonus`). Repeated after the user's test login. Script:
  `reset12.sql` in the session scratchpad (table list = every int column named like user/owner/player/staff).
- **Ads banner**: once per account per 24 h (`hcms_room_ad_views`, `HCMS_ROOM_AD_INTERVAL=1440`); Test had seen it at
  01:41. Deleting the row shows it on the next /hotel.
- **Profile cover delete** (Settings → Change profile cover): `io.client.multithreaded.handler = 1` runs one player's
  packets in parallel, so a Delete sent right after an upload could finish first and the upload then wrote the cover
  back. `UserSettingsView` now locks Change/Delete (`coverBusy`) until the server's `ProfileCoverDataEvent` (9535) for
  the own user arrives, and shows "saved"/"removed" from that reply. Deployed; tsc 52. Not clicked live.
- Follow-up (user: "just remove the image, no need to wait"): Delete is never locked; it shows "Profile cover removed!"
  and fires link event `user-profile/cover-removed` at once (`UserProfileView` clears the own cover immediately). If an
  upload is still in flight, the delete is queued (`coverDeleteQueued`) and sent when the upload's 9535 reply arrives,
  so the server order stays upload → delete. Only Change waits for the reply. Deployed; tsc 52.

## 2026-10-05 — Beta: everything enabled for testing (pass, quests, achievements), one switch for client + server
- User: "enable everything in beta mode now for testing after reset and disable again on client". Beta mode itself stays
  (`HCMS_BETA=true`: landing + staff-only website); only the beta pause is lifted.
- `emulator_settings hcms.beta.pass_paused` = 0 (was 1) and hCMS `.env HCMS_BETA_PASS_PAUSED=false` + `config:cache`:
  HabboPass XP, daily quests, achievement progress and website winwins/quests run again.
- The client's "Soon" tiles/rows now follow the same switch: the engagement state packet (plugin `EngagementProtocol`)
  ends with `BetaPause.paused()`; client `IEngagementState.paused` (missing byte = paused). Hub tiles show quests
  done/total and the pass level; rows show "N left today" / "Lv x/y" and are clickable. Plugin jar deployed
  (backup `plugins/hcms-emulator-plugin.jar.bak-20261005-pausedflag`), emulator restarted 22:21 (boot clean), client deployed.
- Disable again: `UPDATE emulator_settings SET value='1' WHERE key='hcms.beta.pass_paused'` + `:update_config` (or restart),
  `.env HCMS_BETA_PASS_PAUSED=true` + `config:cache`. Clients show "Soon" again on their next state update (relog).
- Open: the user's own reset after testing; `hcms.beta.hc_gifts_disabled` (1) and free HC left as they were.

## 2026-10-05 — HabboPass showcase shows the VIP reward for VIP players
- User: "why it shows normal user reward when I have VIP". `HabboPassView` showcase picked the FREE reward of a clicked
  level whenever one existed; the VIP reward only showed with no level selected. Now VIP players (`state.isVip`) see
  the clicked level's VIP reward; non-VIP see the free one (VIP teaser when nothing is selected). Deployed; tsc 52.
- `isVip` itself was right: hCMS `CityPassService::countsAsVip` = VIP Club membership OR rank ≥ `vip_rank` (2).
  `hcms:pass 1/2` → true (staff rank), `hcms:pass 12` (Test) → false: the free beta HC is not VIP, and
  `hcms_vip_memberships` is empty since the beta reset.

## 2026-10-05 — Achievements (and every badge) open faster
- User: "why is achievements opening slow". The data is fetched once at login; the cost was `LayoutBadgeImageView`:
  for every normal badge it waited for the renderer's badge texture and then ran `TextureUtils.generateImage`
  (a GPU readback + PNG encode per badge, one category = dozens), only to read width/height - the shown image was
  already the plain `badge.asset.url` file. Normal badges now load a plain `Image` from that URL (parallel, browser
  cache); group badges keep the renderer path (they are composed). Same DOM/style. Deployed; tsc 52. Not timed live.
- Follow-up (user: "after delete it disappears but still shows after reopening the profile"): DB had no cover rows (a
  delete reached the server at 22:37), but two gaps: a queued delete waited forever when an upload reply never came
  (e.g. emulator restart 22:21 with the client still open), and reopening the profile while a delete waited asked the
  server, which still had the cover. Now `SetCoverDeletePending/IsCoverDeletePending` (ProfileCoverProtocol.ts) marks a
  pending delete until an empty own-cover reply; `UserProfileView` ignores own cover filenames meanwhile; Settings
  releases a stuck upload after 8 s and then sends the queued delete. Orphan file
  `profile_banner_12_1791230704472.png` (22:05, no DB row) left from the earlier race. Deployed; tsc 52.

## 2026-10-05 — Profile "Moderate" (Ignore + Report) back for every player
- User: "where is the report on the user profile, I only see Message / Add friend". The 2026-10-02 audit gated the
  whole Moderate panel (button + chunk) to rank 5, so players lost Ignore and the 4 Report buttons (HabboCity shows
  the panel to everyone). Split: `UserProfileModerationView` (Ignore + Reports, player chunk level 1, in
  `PLAYER_VIEWS`) and new `UserProfileModerationStaffView` (Delete banner/motto/avatar + Open mod tools, staff chunk
  level 5, `ModToolsStaffViews` + `PreloadStaffViews`), rendered only for moderators with chunk level ≥ 5. The Moderate
  button shows on every profile but your own. Server rule for deletes (IN 9568, rank 5+) unchanged.
- `scripts/protect-chunks.mjs` updated (first deploy put the new staff chunk in public assets; fixed and verified:
  `c-42b9487b.js` level 5, `c-ba892161.js` level 1, nothing left in public). Deployed; tsc 52.
- Note: two accounts in one browser share the `hcms_ct` chunk cookie (Path=/assets); the last tab to get a token wins,
  so a staff tab can lose its staff chunks (or the test tab gets staff ones) until reload. Separate browsers/profiles
  for staff + test accounts.
- **Reports open incidents** (user: "normal reports should open incident also"): stock `ReportEvent` → ModToolIssue
  ticket (mod tools) + `SupportTicketEvent` → `StaffFeedEvents.onTicket` (feed line "X reported Y"). That hook now also
  calls `SecurityGuard.report(reportedId, …, "player_report", "reported by X: <message>", roomId)` when a player is
  named (not self). New default rule `player_report` "Reported by a player" (threshold 1, severity 1, suggested warn,
  no auto action, sort 110; `INSERT IGNORE`, editable on the website like the other rules). Staff reported players are
  exempt (SecurityGuard.exempt). Repeat reports add hits to the open incident.
- **Profile delete warns with the reason** (user: "after deleting the banner it should state in warn the reason"):
  `ProfileModerationProtocol` delete banner/motto/avatar now runs `Incidents.actOnPlayer(staff, target, "warn", reason)`
  ("Your profile banner was removed / Your motto was removed / Your look was reset because it was inappropriate." as
  the warning's Note; audited as staff.player_warn). Offline targets get no warning (staff sees "X is offline.").
- Plugin deployed 23:05 (backup `hcms-emulator-plugin.jar.bak-20261005-reports`), boot clean, 12 rules loaded.
  Not tested live with two accounts.
- **Why the first report made no incident:** ticket 14 = Test reported Phi (staff) and every security rule skipped
  staff. `SecurityGuard.report` now lets `PLAYER_REPORT` through for staff targets but opens it with no target Habbo,
  so no automatic action can ever hit staff from a report. Plugin redeployed 23:09, boot clean. Stock rule still
  applies: a player with an open ticket can't send another report (they get the pending form) until staff close it.

## 2026-10-05 — Tagged chat lines show only the badge (no icons)
- User: "remove the icon from all staff feed chat room bubbles, only keep the badge (ALERT, RANCH…)".
  `staffFeedHtml` no longer puts the `c_images/stafftools/tag_*.png` icon before the tag (`STAFF_FEED_TAG_KEYS`
  removed; `StaffToolsIconUrl` stays for the Games tab). Lines starting with a known staff-feed or game tag get
  `has-tag` on `.chat-bubble`, and `ChatWiredBubbles.scss` hides the wired bubble's 35 px icon column (`:before`/`:after`)
  and its 36 px text offset for them. Untagged wired bubbles keep their icons. Deployed; tsc 52.
- **Reverted the same evening** (user: "it's broken, I meant the small icon image, not the chat bubble"): `has-tag`
  class + CSS removed again; only the small tag icon `<img>` in staff feed lines stays removed. Deployed.

## 2026-10-05 — Staff feed bubbles and buttons open the right window
- Click on a staff feed bubble (bubble 34, chunk level ≥ 4): `[ALERT]` lines → `mod-tools/incidents` (Staff Tools,
  Incidents tab); every other tag → Staff feed card, History tab (server search over the whole log) with the line's tag
  (`StaffFeedTagKey`, COMMAND/COMMANDS → `command`) and the player's name (`StaffFeedSubject`) as filters.
  `StaffFeedCard.focusOn(tag, search, history = true)` + `focus` in `useStaffFeedCard`; `StaffFeedHistoryView` takes
  `initialTag/initialSearch` (remounted per focus).
- Hover mini menu (`StaffFeedActionsView`): the terminal button "Last commands" opens that History view (command +
  name) instead of asking the server to post [COMMANDS] chat lines.
- "Last messages" in Staff Tools › Incidents and › Player opens Mod Tools' user chatlog (`mod-tools/open-user-chatlog/<id>`)
  instead of posting chat lines. Server actions `commands` (9621) / `messages` (Incidents.actOn) are no longer used
  by the client: cleanup candidates after a reference check.
- Deployed; tsc 52. Not clicked live.
- Follow-up (user: "don't do a bubble for the normal mod tool report"): a `player_report` incident no longer posts its
  own [ALERT] feed line/bubble (`Incidents.open` returns after `pushToStaff()` unless an auto action ran); the [REPORT]
  line and the Incidents tab entry stay. Plugin deployed 23:25, boot clean.

## 2026-10-05 — Card scrollbar on the window edge (every card, light + dark)
- User screenshot (Staff Tools): a thin scrollbar on the card's own right edge. Cause: `.content-area` height is
  HabboCity's `calc(100% - 33px - border*2 - 1px)` = 40 px only with a 3 px border; with `--holo-border-size` 0 (light
  always, dark since 2026-10-03) it subtracts 34 px, so header 40 + content overflowed the fixed-height card by 6 px and
  the card (`overflow: auto` by default in NitroCardView) scrolled.
- `_27-nitro-card.scss`: `.nitro-card.theme-primary|theme-primary-slim:not(.nitro-infostand) > .content-area
  { height: calc(100% - 40px) }` (the header is fixed 40 px for those themes; percentage = content box, so it is right for
  any border). Per-window overrides (catalog, chat style selector, pet popover, chest) use !important / max-height and
  still win. Deployed. Not checked by eye.

## 2026-10-05 — Hovered chat bubble pushes the bubbles under it down
- User (screenshot): the hover reaction row of a bubble covered the bubble below. Bubbles are in arrival order (newer =
  later sibling = lower), so `ChatReactions.scss`: `.bubble-container:hover:has(.reactions-box) ~ .bubble-container
  { transform: translateY(14px) }` with `transition: top .2s, transform .15s` on `.bubble-container`. Deployed. Not checked by eye.

## 2026-10-05 — Room settings no longer wipe the room chat; chat bubbles button in room tools
- User: "changing anything in room settings (VIP chat), the room chat always disappears fully". Cause (stock, same in
  Morningstar and Polaris `RequestRoomDataEvent`): a save sends RoomSettingsUpdated → client asks GetGuestRoom(id, 0, 0)
  → core `enterRoom = (a != 0 || b != 1)` = true → every `roomEnter` handler acted as a fresh entry: chat cleared, room
  info popup again, history closed, group info refetched. The flags can't fix it (the core always sets roomForward,
  and a non-enter reply re-enters the room). Client fix: `api/navigator/RoomDataRefresh.ts` (`ExpectRoomDataRefresh`
  in useNavigator's RoomSettingsUpdated handler, 5 s window, ended after the reply); useNavigator, useChatWidget
  (only updates chat settings), RoomToolsWidgetView and GroupRoomInformationView treat that reply as a refresh.
- Room tools (bottom left): new chat bubbles button after Chat history (`icon-message` at 17×21, dimmed when off);
  toggles the existing player setting `chat_bubbles` (PlayerSettingToggleComposer, same as `:nobubbles`), state from
  PlayerSettingsEvent (requested on mount).
- YouTube/Video TV fullscreen already hides the bubbles on purpose and shows its own chat panel (unchanged; asked the user).
- Deployed; tsc 52. Not clicked live.
- Mod Tools window: the "Staff Tools" button shows the same red counter as the toolbar Mod Tools icon (unread staff
  feed lines, `useStaffFeedCard().unread`, cleared when the Staff feed card opens). Deployed; tsc 52.

## 2026-10-06 — Hotel recorder tool (C:\tools\hotel-recorder)
- User: "screen record here on the server, game only, two clients side by side, then upload to an Imgur album".
- `1 Open clients.bat` (`open-clients.ps1`): two Chrome `--app` windows of dev.habbo.nz/hotel, 720×860 each, own
  profiles `profiles/left|right` (log in once per side). `2 Record.bat` (`record.ps1`): ffmpeg gdigrab of the working
  area (1440×860, 30 fps, x264), 60 s cap (Imgur), a topmost "Stop & upload" bar on the taskbar strip (outside the
  capture), then curl upload to Imgur (`/3/upload` + hidden anonymous album via deletehash), opens the album, link on
  the clipboard + `videos/uploads.txt`. Client ID from `hCMS/.env IMGUR_CLIENT_ID` (not set yet: user has no Imgur
  app; without it the file is kept and its folder opens). ffmpeg: BtbN win64 build in `C:\tools\ffmpeg` (gyan.dev
  download hung). Verified: 3 s test capture 1440×860. Upload not tested (no Client ID).
- Follow-up (user: "just open imgur in the Chrome debug"): without `IMGUR_CLIENT_ID`, `record.ps1` runs
  `upload-imgur.js`: starts/uses the debug Chrome (9222, `C:\tools\chrome-debug-profile`), opens imgur.com/upload in a
  new tab and sets the file on the page's `input[type=file]` (CDP `DOM.setFileInputFiles`), so it uploads under the
  Imgur account logged in there. Headless was declined (not logged in → anonymous, often blocked). Not run yet.

## 2026-10-06 — Research: habbo.gd CMS (Wayback), no code change
- 2024 landing (blacky-index, Bootstrap 5, gold-on-dark split login/register, 4-step register, snowflakes, online
  counter) is fully in the archive and was rebuilt locally as a preview (`C:\tools\habbogd-preview\index.html`, archived files in `archive/`).
  The 2026 React CMS has only its CSS (BW3KBl2F + 3 chunks) and 6 of 52 JS chunks archived: look/palette known, pages not.
  Details in retro-source knowledge-log. Waiting for the user: where to use it (beta landing / main landing) and own artwork.
- (2026-10-06) Preview extended (user: "make habbo.gd's me page too, English, example users from hCMS, me on it, use
  habbo.gd icons"): `C:\tools\habbogd-preview\me.html` + `assets/css/gd-layout.css` (archived DlTWXdro.css),
  `gd-empty.css`, own `gd-me.css`, `assets/js/gd-me.js`. Frame 1:1 from the archived layout chunk CJeW1513.js (topbar
  with premium dropdown + 4 currencies, banner with news/event ticker + walking online-users rail, header nav with
  Community dropdown, user menu, Check in, footer); currency icons extracted from the chunk's data URLs, logo
  `logo-doh_hE_Z.gif` from the archive, avatars from imager.habbo.gd (still live). The home content (not archived)
  is our own in the same style: profile card (Phi, Owner, balances), latest hCMS news, friends, online now, event
  plan empty state. index.html translated to English; "Log in" opens me.html. Users/looks from the hCMS `users` table.
- (2026-10-06) User: "this is habbo.cc's CMS". Confirmed: the 2026 CMS used for me.html = habbo.cc's live CMS (same code).
  BlackyCMS (2024) inner pages exist in no archive (Wayback, archive.today) and the CMS is not public. me.html is
  therefore habbo.cc-style, not Blacky. Waiting for the user (screenshots / own design in the Blacky index style).
- (2026-10-06) The user found a screenshot of the real BlackyCMS me page (saved as
  `C:\tools\habbogd-preview\archive\blacky-me-original.png`). Rebuilt from it (screenshot only, no DOM exists):
  `me.html` + `assets/css/blacky-me.css` + `assets/js/blacky-me.js` (Ubuntu font like habbo.gd, Blacky colours
  #232629 / #ffb820 from blacky-index.css, header ARTICLE/HABBO TEAM/PRICE LIST/EXTRAS + user + PLAY + flag, hero with
  room background, welcome, 4 currency boxes, group bar, Play/Profile, hotel image + online pill, snowflakes; Hotel
  Lotto Activities (jackpot, winners, last-winner card), Latest Articles slider with author pill, Newest Habbo,
  Most Popular Rooms). English, Phi as "me", names/rooms/news from hCMS, lotto numbers made up. The habbo.cc-style
  page moved to `me-2026.html`.
- (2026-10-06) 1:1 pass on `me.html`: rendered at the screenshot's size (1440×787 @2x) and compared overlaid.
  Fixes: font Poppins (not Ubuntu), nav 11.5px/.8 spacing, hero content at 52px/139px, Play 179px + Profile, hotel
  image 440px (top 6, right 32) with the online pill at 37.5%, lotto list = 280px scroll box (cut card like the
  original), text sizes (winners 14/11.5/10, values 12, last win 19/16, article 19/14, avatar 64, pill 15), section
  spacing. Remaining differences are images only (room background, slot machine, logo variant, purple currency icon).
- (2026-10-06) 2nd 1:1 pass: original images cut from the user's 2x screenshot into `assets/img/orig/` (logo without
  "Golden Dream", credits/purple gem/diamond/flame icons, group badge, round lotto machine, big coin + gem, author
  avatar; backgrounds keyed out with PIL) and the big lotto card picture with the old winner text and info icon
  removed (OpenCV inpaint) as `lotto-card.png`. Header content shifted -20px like the original, nav gap 28, PLAY 10px
  padding. Only remaining difference: the hero room background (original image unknown; GitBook bank room used).
- (2026-10-06) 3rd pass: the hero background is the ORIGINAL room, reconstructed from the user's screenshot
  (`assets/img/orig/hero-bg.png`, 2850×628 @2x): see-through boxes un-darkened, borders/text/Play button/snowflakes
  removed with OpenCV inpaint; it contains the original hotel image, so our hotel <img> was dropped and only a live
  "N Habbos online" pill sits exactly over the baked one (top 181px, left calc(50% + 311.5px)). Background drawn at
  1425px wide (original size) over a cover-scaled copy for wider screens. Lotto: "Jackpot now:" is sticky at the top
  of the 280px scroll list (user: "when scrolling, jackpot now stays"); 6 example winners so it scrolls.
- (2026-10-06) More pages in the Blacky style (no originals exist): shared header/banner/footer script
  `assets/js/blacky-layout.js` (Extras dropdown: Rules, FAQ, Event plan, Discord; user menu), `assets/css/blacky-pages.css`,
  `assets/js/blacky-pages.js`, data `assets/data/site.js` (hCMS staff/news + examples) and `assets/data/rares.js`
  (all 101 hCMS `hcms_values_rares` with icons copied to `assets/img/furni/`). Pages: articles.html, article.html?id=,
  team.html, pricelist.html (search + category chips), rules.html, faq.html, events.html. Subpage banner = room-only crop
  of the reconstructed background. Avatars added (header head, hero full avatar, waving avatar in banners, winner heads)
  and every avatar now comes from OUR imager `https://img.habbo.nz/?v=3&figure=…` (same params as hCMS Avatar.php).
- (2026-10-06) Lotto winner circles: the winner's avatar (img.habbo.nz, size m, 52px wide, top -4px) stands inside the circle over the machine picture, showing head + upper body (user request).
- (2026-10-06) Subpages restyled with the me-page boxes (user: "more habbo.gd style, keep the header"): winner-style cards with the avatar inside the lotto circle + yellow pill (team, events, other articles), me-style black article cards with slanted picture + author pill (articles), yellow value pills (price list), section titles like HOTEL LOTTO ACTIVITIES; page banner kept as before (title + plain subtitle, darkened room), waving banner avatar removed.

## habbo.gd Blacky preview: content pages + no-reload navigation (2026-10-06)
- `C:\tools\habbogd-preview`: new pages ranking, market, auctions, vip, badges, forum (Extras dropdown) and profile,
  settings, support (user menu), renderers in `assets/js/blacky-content.js`. No Center/tabs (user: "like gd pricelist").
- Smaller scale for all page content (hero 116px, compact cards/price grid with 6 columns).
- `assets/js/blacky-router.js`: Nuxt-style navigation without reload (header stays, yellow top loading bar, prefetch on
  hover, back/forward). Needs http: `python -m http.server 8765 --bind 127.0.0.1` in the folder, open
  `http://127.0.0.1:8765/me.html`. Verified via CDP: 7 hops + back, no reload, no errors.
- cosas.rar CMS/lotto survey: retro-source `knowledge-log.md`.

## cosas CMS preview: Je CMS + cm-cliente running locally (2026-10-06)
- `C:\tools\cms-preview` (README there): HabboJe `cms-typescript` (http://127.0.0.1:8771) and RetrosLab cm-cliente /
  PixelPalace (http://127.0.0.1:8772, lotto + daily roulette), built from the cosas.rar source.
- Their server (`plugin-web`, Arcturus websocket plugin, JSON `{header, data}`) is replaced by
  `mock-server.mjs` (port 8770) with Habbo.nz example data; any login works. Start: `node mock-server.mjs`.
- Verified headless: index, me/dashboard, community, profile on both, no console errors. Reference only.

## habbo.gd reference client: not set up (2026-10-06, stopped: their domain lock)

User: "https://habbo.gd/client/ set up for testing on hcms like pie metro". Read-only fetch of their `/client/`
page (session scratchpad `gd/`): Nitro build `assets/index-DSdWoKTK.js` + `vendor-DGXKYQ4D.js`,
`src/assets/index-CvgtL64_.css` (1.6 MB, saved), socket from `?wsb=` + `?sso=` (`t=` query), texts from
habbo.gd/gamedata. The page's first script is a domain lock: any host other than habbo.gd / *.habbo.gd / localhost
replaces the page with "Zugriff verweigert" and throws `HABBOGD_DOMAIN_LOCK`. Their `renderer-config.json` and
`ui-config.json` return 403 to direct requests (Cloudflare). Nothing was copied to `hCMS/public/cdn/client/`, no
`gd.html`, `deploy.ps1` unchanged: hosting it on play.habbo.nz needs removing their lock, and using their localhost
allowance to point it at our emulator goes around the same lock (CLAUDE.md: never work around licence/domain locks).
Their code and CSS stay readable statically for reference.

## habbo.cc reference client at play.habbo.nz/cc.html (2026-10-06, works)

User: "check habbo.cc ... yes" (set it up like pie). habbo.cc's client has no domain lock (game page, index/vendor
bundles and configs checked); they protect it with Cloudflare on `/client/`, `X-Frame-Options: SAMEORIGIN` and a
per-login websocket ticket from their CMS. Their build (`habbo.cc/client/game/`: `index-ClYP6gDT.js`,
`vendor-BevvXHmR.js`, `ResetWindowPositions-QfT3OKSg.js`, `src/assets/index.css` + `Ubuntu-C.ttf`,
`fallback-event.png`, `habbo-logo.gif`) is in `hCMS/public/cdn/client/cc/` with `renderer-config.json` = ours,
`ui-config.json` = theirs with our `url.prefix`, camera, thumbnails, habbopages, group and currency-icon URLs (their
roleplay audio URL blanked), `texts-cc.json` = their English ExternalTexts keys that ours lack (27,513, loaded after
ours, so ours win). `cc.html` (noindex, no shim needed) takes `?sso=` like ours. `deploy.ps1` robocopy also excludes
`cc.html` / `cc`. Verified headless as `Test` (id 12, temporary auth_ticket, cleared): logs in, their toolbar, purse
bar, chat bar and "Sprachkanäle" panel render in our room with our currencies and beta notices. Left: `/api/online`
404 (their CMS API), effect `DrugLeafOk` missing on our CDN, their own systems (gangs, fishing, marketplace...) have
no server side here. habbo.gd: same client family (1,330 shared `nitro.*` keys, gd 49 own, cc 391 own) but its
`/client/` page carries a domain lock, so it is not set up (asked again 2026-10-06, declined).
- 2026-10-06 later: habbo.gd's stylesheet (`index-CvgtL64_.css` + its 36 fonts/images, from habbo.gd/client/src/assets)
  is in `cc/gd/`; `cc.html?css=gd` loads it instead of cc's. Tested headless: it does NOT fit cc's build (cc's client
  uses 1,451 classes gd's CSS lacks: purse, chat, friends, loading screen), so the purse stacks vertically and the
  toolbar/chat bar break. gd's own look is its light/dark theme (712 `data-theme` rules vs cc's 75), tied to gd's build.
  Default stays cc's CSS.

## habbo.gd reference page play.habbo.nz/gd.html (2026-10-06, set up like metro, their lock left in)

User: "add gd.html, I edit the lock myself". `hCMS/public/cdn/client/gd/`: their build (`assets/index-DSdWoKTK.js`,
`vendor-DGXKYQ4D.js`, `ResetWindowPositions-BevWhe85.js` from cdn.habbo.gd), their CSS + 36 fonts/images (moved here
from `cc/gd/`; `cc.html?css=gd` now loads `/gd/src/assets/...`), `renderer-config.json` = ours, `ui-config.json` =
cc's merged one (theirs is 403), `texts-gd.json` = their ExternalTexts/UITexts keys ours lack (21,048). `gd.html` =
their `/client/` page with only paths, config URLs, socket fallback (`wss://ws.habbo.nz:8443` when no `?wsb=`),
texts, icons and title changed and the Cloudflare beacon dropped; their domain-lock script is byte-identical.
`deploy.ps1` excludes `gd.html` / `gd`. Verified: all files 200, the page shows their "Zugriff verweigert" and throws
`HABBOGD_DOMAIN_LOCK`. Claude did not and will not edit the lock; the user said they will.
- 2026-10-06 later: the user edited the lock in `gd.html` themselves (host check line); gd.html now runs on
  play.habbo.nz. A re-copy of their page brings the lock back. The HabboCity clothing/effects seen in it come from OUR
  `gd/renderer-config.json` (`cdn.habbo.nz/habbocity/...`); habbo.gd's own bundle and CSS contain no "habbocity".

## Nitro React Rose reference client at play.habbo.nz/rose/ (2026-10-06, works)

User: "setup the rose ui so I can see". `c:/inetpub/wwwroot/nitro-react-rose` (Nitro React 2.1.1 "Rose": Flash-style
1:1 UI via Truffle, repo untouched) built with `npx vite build --outDir <scratchpad>/rose-dist` (110 MB, 97 MB of it
`assets/truffle`) and copied to `hCMS/public/cdn/client/rose/`; its `web.config` left out (the parent covers `.tfc`),
`renderer-config.json` + `ui-config.json` = ours, `index.html` config URLs → `/rose/...` + noindex. `deploy.ps1`
excludes `rose`. Verified headless as `Test` (temporary auth_ticket, cleared): logs in to the room with Rose's
toolbar, purse, friend bar and side menu. Missing: 4 "clove" icons under `/nitro-assets/clove/` (from the Rose
author's decompiled AIR client, not available) and the text `purse.seasonal.currency.103`. Rebuild after a
`git pull` there, same steps.

## hAirUI: second client with the official Habbo AIR look (2026-10-06, started)

User: keep the current UI clean, make another UI "like Habbo AIR", 1:1 from habbo.com, folder `hAirUI`.
- `c:/inetpub/wwwroot/hAirUI` = copy of `nitro-react-rose` (own `git init`, nothing committed yet; `node_modules` =
  junction to Rose's; pointer `hAirUI/CLAUDE.md`). Main client `nitro-react-Wired` untouched (no commit).
- Reference: official AIR client from the installed Habbo Launcher (`downloads/air/15/HabboAir.swf`, AIR 1.0.31,
  production build `WIN63-202609091217-117204808` from the ClientHello composer, `FLASH29`), copied to
  `C:/tools/habbo-air/HabboAir-15.swf`, exported with JPEXS FFDec 26.3.0 (`C:/tools/ffdec`, JDK 21) to
  `C:/tools/habbo-air/export/`: `binaryData/` (977 window XML + embedded localizations), `images/` (2,295),
  `scripts/` (8,863 AS3), `fonts/`. habbo.com `/api/client/clienturls` is behind DOSarrest (not bypassed).
- Deploy: `hAirUI/deploy.ps1` (vite build via `cmd /c`, robocopy → `hCMS/public/cdn/client/air/`) =
  `https://play.habbo.nz/air/?sso=`; main `deploy.ps1` excludes `air`. Dev: `npx vite --port 5180`
  (`vite.config.js`: `optimizeDeps.exclude` harfbuzzjs + freetype-wasm, `server.fs.allow` = the junction's real
  path, `server.watch.ignored` dist). Built assets now `src/assets/[name]-[hash].[ext]`: Rose's fixed
  `index.css` name was served stale by Cloudflare for hours (HIT, max-age 14400).
- Loader 1:1 from `HabboLoadingScreen.as` + `splash/PhotoSplashScreen.as` + `onBoardingHcUi/LoaderUI.as`:
  background #0E151C, splash_bg/splash_top 500×434 + random userphoto_1..30 at (96,51) (`public/air-loader/`),
  revolving `client.starting.revolving` English messages (Ubuntu Bold 28 white; LoaderUI bold = Ubuntu-B, regular =
  Ubuntu-C), bar 400×25 white border, inner black well, fill #BAC9D3 / #8CA1AD, fake progress every 750 ms with the
  original random steps and message rotation (incl. its `% (n-1)`), real percent 14 bold #999999, version 12 bold
  #999999 top right, error 16 #7ECAEE width clamp(320, W-80, 760). Verified live (Test, temporary ticket).
  Not pixel-identical: browser vs Flash text rasterisation and TextField metrics.
- Cloudflare: `hcms:cloudflare` needs `CLOUDFLARE_API_TOKEN`; `.env` only has `CLOUDFLARE_GLOBAL_API_KEY` +
  `CLOUDFLARE_EMAIL`, which the command does not use. PHP CLI: `C:/Program Files (x86)/PHP/php-8.5.10/php.exe`.
- Next: every window 1:1 against `export/binaryData/*_xml` (window XML) + skins, foundation first.
- 2026-10-06 later: hAirUI loader rebuilt as a byte-exact port (canvas): verified against captures of the real AIR
  client (`Habbo.exe -server hhus -ticket <dummy>` skips Sign In and shows `HabboLoadingScreen`; PrintWindow
  captures). Splash/background/bar/positions 100.000 % identical at 7 sizes incl. AIR's double-layout resize drift;
  text from AIR's own pixels (13 strings × 2 parities). Flash blend rule and all details in `hAirUI/CLAUDE.md`.
  Tools: `hAirUI/tools/build-air-loader.py`, `hAirUI/tools/air-capture/`. Deployed to play.habbo.nz/air/.
- 2026-10-06 later: hAirUI windows from the SWF (user: no live login, build 1:1 from the decompile). All 59 Rose
  layouts synced to the current AIR XML (3 had changed), all 2,106 UI images served from our own export through the
  AS3 class bindings (were 404s from the Rose author's private path). Deployed; live check: no failed requests,
  current chat bar/progress menu layouts. Details + tools in `hAirUI/CLAUDE.md`. Open: Flash filters (drop shadows)
  not supported by Rose's layout engine.

## habbo.com stack (habbo.ltd) — 2026-10-06

New, separate hotel next to hCMS (development). Pointer: `habbocom-web/CLAUDE.md`.
- Emulator: stock Arcturus Morningstar 3.5.5 built from git.krews.org master (`habbocom-arcturus`), run folder
  `habbocom-emulator-run` (game 30020, rcon 30021, NitroWebsockets 3.1 wss 2096 with the hCMS ssl pair), DB `habbocom`
  from `BaseDB MS 3.5.5.sql` (DennisObject/retro-hotel-files; bobba `catalog.sql` skipped on the user's request),
  `websockets.whitelist = *.habbo.ltd,localhost`.
- DNS (Cloudflare, hCMS global key, user's OK): CNAME www / images / game-us → habbo.ltd, proxied.
- IIS: HABBOCOM-WWW (www.habbo.ltd → habbocom-web/public, PHP 8.5), HABBOCOM-IMAGES (images.habbo.ltd → habbocom-images).
- Web: habbo.com's habbo-web mirrored 1:1 (host rewrite + PLAY → /hotel patch), PHP API for login, registration
  (hCaptcha test keys), session, client ticket, gamedata, imaging. Verified in a browser: register, login, PLAY opens the
  client in habbo-web's frame, WEB returns to the site with the socket open, PLAY returns to the same client.
- Client: hAirUI build copied to `www.habbo.ltd/client/air/` by `habbocom-web/tools/deploy-client.py`.
- Open: hotel view still points at hCMS reception images and seasonal currency 103 (not in the stock pack); first
  load about 45 s (assets not yet cached at Cloudflare); real hCaptcha keys; emulator as a service; 1:1 habbo catalog
  after the UI.
- Fix (same day): `/habbo-imaging/avatar/<figure>,s-.g-.d-.h-.a-,<hash>.png` now uses habbo-web's own pose table
  (s: 0 big, 2 bighead, 3 smallhead, 4 large, 5 largehead → size + headonly; g/a per `getLegacyImagerUrl`). Header
  avatar = 54x62 head like habbo.com; habbo.ltd Cloudflare cache purged once (old full-body images were cached).

## Client machine id (2026-10-06 night)
`src/api/utils/ClientIdentity.ts`: machine id (localStorage `hcms.machine` + cookie `hcms_mid`), web fingerprint (cookie `hcms_fp`), `UniqueIDMessageComposer` sent on CONNECTION_HANDSHAKING, `/api/identity` ping after login (App.tsx). Server side and status: hCMS PROJECT_STATE "Identity logging + machine bans". Not deployed yet (waiting for approval).

## Chat bubble word wrap (2026-10-06 night)
`_49-chat-bubbles.scss` `.chat-bubble` and `_33-overlays.scss` `.alert-text`: `word-break: break-all` (split words mid-word, e.g. "pla/yers") replaced by `word-break: normal; overflow-wrap: anywhere` (wraps at spaces, still breaks very long strings). Deliberate deviation from the HabboCity stylesheet (user request). Not deployed yet (ships with the next client deploy).

## Halloween clothing, companions renderer, reply quote fix, banner (2026-10-06 night)
- **Halloween clothing (LIVE, no deploy needed):** 16 official libraries converted from images.habbo.com
  (flash-assets-PRODUCTION-202609231918) with the HabboCM nitro-converter (`--convert-swf`), merged into
  `hCMS/public/cdn/habbocity/gamedata/FigureData.json` + `FigureMap.json` (backups `*.bak-prehween-20261006`), 26 sets,
  all `selectable`, `sellable: false`, `club: 0` (free in the editor, user request). Includes Scarecrow faces 6519/6520,
  Bat Onesie, Wizard's Garb, Gothic Make-Up, Doll-like Hairdo, Wizardly Curls (80000606), Checkered Skirt, Loose Ankle
  Socks (library `shoes_U_loosesocks_hcm`, sh 7557 → 70000035), student cardigans, Vintage Book Bag, Skeletal Headband,
  plus 2020-2024 pieces whose libraries we had but no set (Pumpkin Backpack 80000603, Hime Cut 80000604, Catwoman,
  Bloody Prom, Back Spider, Silver Jammy Toast). Report: `gamedata/hween-clothing-20261006.json`. renderer-config
  `?v=20261006p` (both copies). Imager restarted; renders verified.
- **Companions (`pt`) and misc (`mc`) — needs the client deploy:** renderer patch 8
  `.yarn/patches/@nitrots-nitro-renderer-patch-e9999608f5.patch`: new `src/nitro/avatar/data/HabboAvatarExtraParts.ts`
  adds pt/ptl/ptr/mc/mcl/mcr geometry items (torso/leftarm/rightarm of vertical, sitting, horizontal, swhorizontal) and
  part sets + the `figure` active part set at init (`AvatarRenderManager`), and `AvatarFigurePartType.PET/MISC`. Values
  ported from Octane-Renderer (LTDUI, GPL-3, same licence as Nitro). Copying Octane's whole data files failed: Yarn
  cannot apply hunks in the repetitive geometry file, hence the helper. Companions are static (no idle animation yet;
  Octane adds Default/Sit/Lay animations + AvatarImage changes for that). Editor: `FigureData.PET/MISC`, TorsoModel
  categories, tab icons from AIR (`icon_misc_pets`, `icon_misc_misc`, `src/assets/images/avatareditor/pt-*/mc-*`),
  styles `components/avatar-editor/AvatarEditorView.scss`. Data installed live already (10 sets: Raven, Tiny Owl,
  Friendly Bat, Persian Cat, Haunted Puppet, Possessed Pumpkin, Ghostly Friends, Shroomie, Ruffled Cuffs, Wand; report
  `gamedata/hween-companions-20261006.json`); the current live client ignores those types. hcms-imager has its own
  part sets without pt/mc, so website avatars won't show companions yet.
- **Reply quote in dark bubbles:** `ChatReactions.scss` forces the quote's span/b colour (#3f3f3f, icon green); the
  white `chat-content *` rules of dark bubbles made it unreadable. Needs the client deploy.
- **Banner:** 468×60 animated GIF (6 frames × 400 ms, same structure as the user's example): Halloween logo, half-size
  official Halloween furni scene, Bat Onesie mascot with sml/srp/spk/agr gestures from our imager, Volter Goldfish
  bubbles (PLAY HABBO.NZ!, HALLOWEEN EVENT!, SUNSET RANCH!, HABBOPASS!, DAILY REWARDS!, OPEN BETA!).
  `https://habbo.nz/cdn/c_images/banners/habbonz-halloween-468x60.gif`. Builder scripts were in the session scratchpad.

## Client deploy + Cloudflare challenge off (2026-10-06 night)
- Client deployed with user OK (`index-70411c8d.js`): machine id, chat word wrap, reply quote colour, renderer patch 8 (companions/misc) + editor tabs, editor keeps figure-data order for ties (newest sets first; FigureData reordered, `?v=20261006o`, backup `FigureData.json.bak-preorder-20261006`).
- User: "clear cf captcha". habbo.nz zone `security_level` medium → essentially_off (the only Cloudflare setting that challenged players; Bot Fight Mode was already off). Rate limit + scanner block rules stay. Whole zone cache purged. Registration Turnstile unchanged. Revert: security_level medium.

## All companions/misc/faces, companion animations, newest-first editor (2026-10-06 night, deployed)
- **All official companions + misc**: 91 more sets (63 libraries, 2 Habbo test sets skipped) → pt 37, mc 64 sets in total.
  Report `gamedata/all-companions-misc-20261006.json`.
- **All missing official faces**: 114 sets (20 new libraries, several renumbered as `_hcm`) + 6 whose HabboCity library
  lacked parts (official copies installed as `<lib>_hcm`: possesseddoll, vivideyes2, heartmakeup, cartoonheroine2,
  bluehearteyes, mannequin). Reports `all-faces-20261006.json`, `six-faces-20261006.json`. `face_U_blocked` skipped.
  The 682 cross-type / 18 within-type duplicate set ids were already in HabboCity's file before tonight.
- All via direct download from images.habbo.com (no Chrome/CDP needed) + HabboCM nitro-converter.
- Renderer patch 9 `.yarn/patches/@nitrots-nitro-renderer-patch-85c5e969b8.patch`: `AddExtraAnimations` mirrors bd/lh/rh
  frames to pt/mc, ptl/mcl, ptr/mcr in every animation (walk, wave…) and adds Default/Sit/Lay 8-frame idle loops for those
  types only; `AvatarStructure.maxFrames(actions, figure)` ignores those idle loops unless the figure has pt or mc, so
  other avatars don't start animating. Missing frames fall back to std frame 0 (AvatarImageCache).
- Editor tab icons were invisible (scss `url('../../…')` not rebased) → `url('@/assets/…')`, now inlined.
- Newest first: the editor builds lists back to front, so data order can't be used. `AvatarEditorUtilities.newestSorter`
  puts set ids from ui-config `avatareditor.newest.sets` (newest first) on top; everything else keeps the original
  HabboCity sort. The list holds all 247 sets added tonight ordered by official set id; update ui-config (no deploy) when
  adding clothing.
- Versions: FigureData/FigureMap `?v=20261006g`. Client deployed (`index-a484b0a2.js`), imager restarted.

## Bots catalog page, emoji button inside the input, :noemoji (2026-10-06 night, live)
- Public Bots page 9967631 (Interactions) was empty: copied the 3 bot offers from the staff page 9 (Casual Bot, Waiter, Belle; all priced 0 like the rest of Interactions), header `catalog_bots_headline1_en` + texts, `updatecatalog`. Belle (catalog_items 6) had hair `hr-999999357` that does not exist in our figure set → `hr-515-31`. **Open:** most Interactions pages (Elevators, Music, Gates, Rollers) are empty and the filled ones are priced 0 — needs a pricing decision.
- Emoji button moved inside the chat input (absolute, right, input padding-right 30px). `:noemoji` (client-side, never sent to the server) toggles automatic `:code:` conversion, stored in localStorage `hcms.chat.emojicodes`. Note: `api/utils/GetLocalStorage` never returns its value (old bug, not used here).

## Duplicates swapped instead of hidden (2026-10-07)
User: "add the faces back, why is pumpkin etc gone". The 63 hidden new duplicates (61 faces + Back Spider + Pumpkin Backpack) are selectable again and back in `avatareditor.newest.sets` (247 ids); their older visual twins are hidden instead (55, `selectable: false`), except 6 preselectable starter faces (kept so new-avatar defaults are unchanged). List: `gamedata/duplicates-swapped-20261007.json`, backup `FigureData.json.bak-preswap-20261007`, `?v=20261007a`. Players reload the client.

## Sandbox (2026-10-07)
Built except the IIS sites (permission check blocked creating them). Details and the open step: `.claude/skills/project-workflow/references/environments.md` "Sandbox built". Sandbox emulator running (ports 2087/31001/31010, clean boot). Mole game: holes at 539 (2-3, 52-54), :start within 5 tiles (user was elsewhere).

## Session summary 2026-10-06 night → 2026-10-07 (index of everything done, read this first)
Details live in the dated sections above (nitro) and in hCMS/docs/PROJECT_STATE.md (server/website). habbo.nz is LIVE
(production): live deploys/restarts need the user's OK; the new **sandbox** is for testing first.

**Done and live**
- Identity logging + machine bans (hCMS "Identity logging + machine bans"): users columns, `hcms_user_identity_log`,
  client sends machine id, super bans spread to machines.
- Moderation/permissions: `:enable :handitem :push :pull` for all; `:follow` (privacy-checked, aliases follow;stalk —
  the stock `rape` alias removed); fun emotes + `:kill` + `:mimic` for rank 1; `:moonwalk :fastwalk :transform
  :faceless` VIP and up (rank 2+); AFK kick off (`hotel.roomuser.idle.cycles.kick` 2147483647);
  `acc_floorplan_editor` for all ranks (**needs `:update_permissions` by a staff member — not reloaded yet**).
- Clothing: Halloween 2026 + scarecrow faces, all official companions (pt) and misc (mc), all missing faces (official
  SWFs converted with the HabboCM nitro-converter); renderer patches 8+9 (pt/mc geometry, part sets, animations);
  editor tabs + icons; newest first via ui-config `avatareditor.newest.sets`; duplicates: new copies shown, older twins
  hidden (`gamedata/duplicates-swapped-20261007.json`). Figure files `?v=20261007a`.
- Chat: word wrap fix, readable reply quotes, emoji picker inside the input (right), `:skull:` codes, `:noemoji`.
- Client settings: Performance tab (FPS limit, furni animation speed).
- Spawns: collected pieces are non-tradeable twins (`token_item_id`), Swap-o-Matic counts them.
- Casino "hCMS Gambling Bot by Habbo.nz": `:dealer`, `:dealerbank`, `:bet hl|tri|poker|21|13 <amount>
  <diamonds|emeralds>`, `:roll`, `:stand`, `:casino`; real dice (5 player + 5 bot), opening roll for 21/13, house edge
  2-7 % (simulated), zero-sum dealer banks with payout reservations, Casino window (click the dealer), Ranch-style
  overhead badge with stake + bank counters. `:rd`/`:cd` dice commands.
- Catalog: Bots page filled (Belle's hair fixed), Dark Academia page under New.
- Website: beta allow-list `HCMS_BETA_USERS` (currently empty, Que removed again).
- Halloween 468×60 banner: https://habbo.nz/cdn/c_images/banners/habbonz-halloween-468x60.gif
- Cloudflare: security level essentially_off (no captcha), cache purged; DNS sandbox + play-sandbox.
- **Sandbox** (project-workflow `references/environments.md` "Sandbox built"): sandbox.habbo.nz + play-sandbox.habbo.nz,
  DB `hcms_sandbox`, emulator `hcms-emulator-sandbox` (31010/31001, wss 2087), website copy `hcms-sandbox`, own
  chunk gate + chunks. Verified 200/200/101.

**Lessons recorded (memory)**: never `:update_plugins` for hcms plugins (half-loads them, restart instead); test in
the sandbox first.

**Open / not verified live**
1. `:update_permissions` for the floor plan editor permission (no staff was online).
2. Casino: a full round with a funded dealer, the window and the badge — untested in a room.
3. Ranch animal games: loaded without errors but never played (mole: `:start` within 5 tiles of 539 2-3,52-54).
4. Emoji passing through server chat — untested.
5. Prices: Dark Academia, Bots and most Interactions offers cost 0 (pricing decision for the user); several
   Interactions pages are empty.
6. Furni bets for the casino (stake a furni, win 2) — designed, not built.
7. Render-quality (resolution) setting — needs a renderer change.

## Casino talk modes, 21/13 rules, mole game like Habbo, sandbox-only login (2026-10-07 evening, SANDBOX ONLY)
User: casino badge covered by the name bubble, amount box stuck on 0, no feedback, dealer should whisper / bubble / room
chat (player decides), 21: lowest opening roll starts, a tie replays (starter goes again) instead of going to the house;
mole game "like Habbo"; sandbox: no beta, Sandbox landing, no register, only rank 3+ may log in ("No permission.").
- Client: `CasinoDealersView` reuses `RanchAnchorView` (ranch/RanchPlayersView) (its own copy skipped `SetRanchStackTop`, so
  `ContextMenuView` never lifted the name bubble above the badge). `CasinoView`: amount is a text field (digits only,
  empty allowed, select on focus, Enter bets), the disabled reason is shown under it, "Dealer talks to you"
  Whisper / Bubble / Room chat + "Announce my wins and losses to the room" (localStorage `hcms.casino.preferences`,
  sent as a 6th string on every 9691 action; action `preferences` only stores + pushes state).
- Plugin `games/Casino.java`: `line()` (steps: whisper = `RoomUserWhisperComposer` from the bot's unit, bubble =
  CommandFeedback, room = `bot.talk`), `result()` (wins/losses: room when shared, plus bubble/whisper per mode);
  the last line per player goes into state `message` (cleared when the window opens by clicking the dealer).
  21/13: `startRound()`; lowest opening roll starts; a tie at the end replays the round with the same starter
  (reservation kept). Exact DP (best play): tie replay at the old payouts gave players +11 % (21) / +6.7 % (13), so
  `payout.21` 1.75 → **1.5** (house 4.7 %), `payout.13` 1.9 → **1.7** (4.6 %); defaults changed, sandbox DB rows
  updated, **live rows still 1.75 / 1.9**.
- Plugin `games/ranch/RanchGames.java` (mole): Habbo's room has 6 `mnstr_compost` holes, only 2 `ranch_c26_molehill`
  (2,53 + 2,54) and a `wf_button_yellow` at 4,54 (G-Earth export 20261003, no gameplay packets). Now: the yellow
  button (`hcms.ranch.mole_button`) or `:start` starts; `mole_count` 2 moles move onto random compost holes (z of the
  compost), pop 1.1 s every 0.8 s; a click on the mole OR the compost on its tile hits (stacked tiles swallowed clicks
  before); moles go home at the end. Live room 539 has 4 extra molehills we added (150781-150784) → delete on the live
  deploy (sandbox already has only Habbo's 2).
- hCMS **sandbox copy only** (`hcms-sandbox`): `App\Support\LoginAccess`, middleware `EnforceLoginAccess` (web, logs
  out a session below the rank), `LoginController`/`RegisterController` checks, config `hcms.login.{sandbox,min_rank,users}`
  (`HCMS_SANDBOX=true`, `HCMS_LOGIN_MIN_RANK=3`, `HCMS_LOGIN_USERS`), `HCMS_BETA=false`; `LandingController` shows the
  beta landing with `label` Sandbox and no register panel (the hidden `.hcms-beta-toggle` must stay: the minified
  hcms-beta.js binds it without a null check). Not yet in `hCMS` (= live code): port before the next sandbox refresh.
- Deployed: sandbox emulator (jar, clean boot), sandbox client (`hcms-client-chunks-sandbox`, own configs kept).
  tsc: no casino errors (52 total, 3 above baseline from other uncommitted work). Not tested in a room yet.
- Open: live deploy (client + plugin + payout rows + 4 molehill deletes + hCMS port) needs the user's OK; 2 farm plots
  at Ranch level 10 (one farm per user in FARMS / `hcms_ranch_farms` PK / crop slots → bigger change, user said
  "maybe"); "friendly wait before play/reward like forcevote" needs the user's meaning.

## Sandbox: gated client parts never loaded (2026-10-07 night, fixed)
Cause: IIS app `HCMS-SANDBOX-PLAY/gate` had no PHP handler (live `HCMS-PLAY/gate` has `php-gate`: index.php, GET,
FastCgiModule, php-cgi 8.5.10), so every `assets/c-*.js` got IIS's static 404, which Cloudflare then cached 4 h.
Fix: same handler added (`appcmd set config … /commit:apphost`), the 37 sandbox chunk URLs purged
(`hcms:cloudflare purge`). Verified: 37/37 chunks 200 with a token, 404 `no-store` / BYPASS without.
Sandbox login allow-list: `HCMS_LOGIN_USERS=12` (Test, rank 1) on user request.

## Casino: fair odds, dealer settings window, rank limits; force vote; editor lag (2026-10-08 night, SANDBOX ONLY)
- Fair payouts (user: "should be random, bot wins too often, users have nothing"): highlow 2.0, duel (tri/poker) 2.0,
  21 1.57, 13 1.78 (exact DP: 0 / 0 / +0.25 % / +0.07 % house edge). Sandbox emulator_settings + plugin DEFAULTS;
  live still 1.9 / 1.95 / 1.75 / 1.9 (old rules).
- Dealer window (staff, permission `cmd_hc_dealer` = rank 4+): bot infostand (rentable bot) button "Casino dealer" →
  IN 9691 `dealer_open|toggle|fund|save|ranks_save` (side = `<roomIndex>|<json>`) → OUT 9693 config JSON →
  `components/casino/CasinoDealerSettingsView` (gated chunk level 4). Make/remove dealer (refused while the bank holds
  currency), bank +/- (reuses `dealerBank`), games the dealer plays, per-dealer min/max bet and per-player daily loss
  (0 = hotel default). `hcms_casino_dealers` + games, min_5, max_5, daily_5, min_101, max_101, daily_101.
- Rank limits (all dealers): `hcms.casino.rank_limits` JSON {rank: {max_5, daily_5, max_101, daily_101}}, edited in the
  same window by `GamesAdmin.allowed` (rank >= hcms.games.admin_rank 6), saved via `GamesAdmin.save`. Order: dealer
  value > rank value > hotel default. Casino state now lists `games` the near dealer plays; the window shows only those.
- Fixes: amount/limit inputs themed (`.casino-input`, was black text in dark mode); dealer badges requested on mount when
  already in a room (hotel opened straight into a room never showed them); DealersComposer/StateComposer → JsonComposer.
- Avatar editor lag: 9,584 selectable sets / 6,635 libraries; `CategoryData.init()` initialised every part (download +
  render + generateImageUrl) on category open. Now each `AvatarEditorFigureSetItemView` calls `partItem.init()` when it
  scrolls into view (IntersectionObserver, 200 px margin); `CategoryData.init` removed.
- Male/female mix: 7,546 selectable sets are `U`. 101 have gendered library names (hair_M_, hair_F_…); official genders
  need habbo.com figuredata (DOSarrest blocks scripts: user saves it from Chrome or runs Chrome with port 9222). Open.
- Force vote (sandbox): claim/status/issue throttles have their own counters (`throttle:N,1,<name>`; shared default key
  made claims 429 after the status polls); test-mode "claimed" now uses the normal account-or-IP rule; client retries a
  failed claim every 6 s. Live: only /vote/done (+ BetaGate allow) is live.

## Bot Walk, dice click, casino talk modes, dev server, sandbox-dev skill (2026-10-08 night, SANDBOX ONLY)
- Bot Walk: bot overhead menu (owner/room controller) "Walk" → `CreateLinkEvent('bot-walk/open/<roomIndex>/<name>')`
  → `components/room/widgets/bot-walk/BotWalkView` (4 diagonal arrows like the builder move pad) → IN 9694
  `BotWalkComposer(roomIndex, dx, dy)` (`api/room/BotWalkProtocol.ts`). Plugin `bots/BotWalk.java`: room owner, bot
  owner or `ACC_ANYROOMOWNER`; one tile from the goal (clicks chain), walkable tiles only, turns the bot's random walk off.
- Dice: during the player's own 21/13 round a click on one of their dice (`playerDice`) is taken over by
  `Casino` (callable on `Incoming.TriggerDiceEvent`, `handler.isCancelled`) and does `:roll`.
- Casino talk modes now Whisper / Room chat / Window only (no Bubble; a saved "bubble" maps to whisper). Errors are
  `[CASINO]` chat lines like `[RANCH]` (`CommandFeedback.say`), none in Window only. No `|` or `<placeholders>` in texts
  (`|` draws a heart). Dealer window has tabs Dealer / Games / Limits / Rank limits. Hover: counters close when the
  pointer is over neither the canvas nor the badge.
- Dev server: `yarn start:sandbox` (port 5190, sandbox configs, no-referrer) + `scripts/sandbox-dev-url.ps1`;
  sandbox `HCMS_DEV_CLIENT_ORIGIN` in `config/cors.php`. Ports 5173/5174 are the user's live-config dev servers.
- New skill `.claude/skills/sandbox-dev` (user OK, seventh skill): the loop, headless tests, recordings, pitfalls.
- Update (later the same night): talk modes are Chat (default, `[CASINO]` lines like `[RANCH]`) / Whisper / Window only;
  "room"/"bubble" map to Chat; results go to the room via `dealer.talk` only when "Announce my wins and losses" is on.
  `CASINO` added to `GAME_TAGS` in `ChatWidgetMessageView` (badge instead of the info bubble's "?").
  Tri/Poker: opening roll (lowest starts), the starter rolls first, a draw is rolled again (up to 20 rounds) -> payout
  2.0 is exactly fair. Autoplay (High/Low, Tri, Poker; 5/10/25 rounds): state `round` + `settled` (`SETTLED_AT`,
  `ROUNDS`), next bet 1.2 s after the round settles, stops when a bet is refused, limits fail or the window closes;
  the server still checks every bet. Dealer hover = Ranch model (separate avatar/stack hover lists).
- Room announcements ("Announce my wins and losses"): a `[CASINO]` line to every player in the room (`CommandFeedback.say`), no longer `dealer.talk` — bot speech is dropped for players with `users_settings.ignore_bots = 1` (Phi had it on, so announcements never showed).
- Dice required (no dice, no bet; no stake taken): player dice within 2 tiles hl 0 / tri 3 / poker 5 / 21-13 1, dealer dice hl 1 / tri 3 / poker 5 / 21-13 1. The house's 21/13 rolls play one after another on its dice (`rollSequence`, 1.3 s steps) and the 21/13 messages wait for them, so every number in chat is on a real die. Rolls stay `SecureRandom.nextInt(6) + 1` (no bias; the earlier "rigged" look came from more values than visible dice).
- Dice close 5 s after every result (`closeDiceLater` from `result()`: player's and dealer's dice back to state 0), skipped when a new round has started in the meantime (ROUNDS counter / RUNS).
- Player report "group badge is messed" (Create your group, step 2 symbol picker = flat grey bars): `.nitro-group-creator .badge-image` had no size (only `.nitro-group-manager` had 42×42), so the background-image badges collapsed. Same rule added for the creator (_40-nitro-group.scss). The parts bundle `group_badge.nitro` (246 textures) covers all 158 symbols + 28 bases in guilds_elements. Not yet compared 1:1 with HabboCity (needs the user's Chrome on port 9222).
- Player report (Yugi, 2026-10-08): "All badges went missing" — DB had 24 badges, inventory showed 2 (worn + newest). `useInventoryBadges` built the new-codes list inside the `setBadgeIds` updater and read it in `setBadgeCodes`; when React ran the updaters late (hook order) the list was empty, so only BadgeReceived badges appeared. Now both updaters use the parser's codes directly (dedup), BadgeReceived skips codes already listed. Sandbox build; live with the next client deploy.
- Player report "can't create group" (2026-10-08): (1) catalog page 9967688 "Create Your Group" had page_layout default_3x3 (furni grid, no create button); correct is `guilds` (Arcturus sends it as guild_frontpage; `guild_furni` → guild_custom_furni, same keys as the HabboCity bundle). Fixed on the SANDBOX + updatecatalog; live UPDATE was blocked by the permission check (SQL for the user: UPDATE catalog_pages SET page_layout='guilds' WHERE id=9967688; then RCON updatecatalog / :update_catalog). (2) Group price 10 credits but no player has credits (41/41 at 0) → every purchase fails; user chose Diamonds (plugin takeover of RequestGuildBuyEvent, Wallet, catalog.guild.price = Diamond amount) — not built yet. HabboCity texts: "Crée un Groupe pour %amount% Crédits", HC only.

## Player bug reports batch: catalog search, group page, inventory delete + buy one (2026-10-08, SANDBOX)
- Catalog search: results are a flat list (`CatalogNavigationItemView flat`, no caret/children) and deduplicated by
  pageId — a matching category used to unfold its matching pages again under it ("pages twice when searching").
- Group page: CatalogLayouGuildFrontpageView left column = `rounded p-2 catalog-layout-background` (was
  bg-muted/text-black); classes, radius, padding and the btn-primary btn-sm button verified against HabboCity via the
  user's debug Chrome (`c:/tools/nitro-catalog-copy/scripts/eval-in-iframe.js habbocity cdn.habbocity …`); only the
  theme colour differs (their account dark, ours light). catalog_pages 9967688 page_layout default_3x3 → `guilds`
  (sandbox; live blocked). catalog.guild.hc_required 0 on the sandbox (user: no HC). Price: stock charges real credits
  (players have 0) — user chose stock only, open: free vs code for 10 Diamonds.
- Inventory delete (HabboCity 1:1 from the minified bundle: `Ml(0,type)` furni = ALL of that type, `Ml(3,code)` badge,
  texts inventory.furni.delete / inventory.badge.delete "no refund"): server = plugin `inventory/InventoryDelete`
  (port of Polaris RequestInventoryItemsDelete 10018 / RequestInventoryBadgeDelete 10031: ownership count, max 1000,
  refused during a trade, QueryDeleteHabboItems, badge removed + wearing badges resent, logged); client
  `api/inventory/InventoryDeleteProtocol.ts`, furni trash = confirm then delete all of that furni, badge trash =
  confirm then `removeBadge` (list + slot + composer). Our confirm has no image yet (HabboCity shows the item).
- Inventory "Buy one": HabboCity `catalog/open/offerId/<purchaseOfferId>/reset`; shown only when the furni has an offer.
- Bug reporter (requested): not built yet — design: Help window "Report a bug", what's wrong / how it should work /
  other hotel, type, pick a furni/avatar/window, auto context + optional room screenshot → support ticket (category 31)
  + `hcms_bug_reports`.

## In-client bug reporter (2026-10-08, SANDBOX)
- Help window → "Report a bug" (`CreateLinkEvent('bug-report/show')`) opens `components/bug-report/BugReportView.tsx` (+ `.scss`), a gated player chunk (level 1, `PROTECTED_ROOTS` + `ProtectedViews`).
- Fields: category chips, "What is wrong?" (min 10 chars), "How should it work?", "Does it work on another hotel?".
- "Pick in the hotel": the window hides and a top banner asks for a click. Furni (floor/wall) → name, classname, item id, x/y/z, direction; avatar/bot/pet → name, id, x/y; a UI click → window title, element path, text (the click is swallowed); empty room click → the room. Esc/Cancel stops.
- Sent automatically: room id, page URL without query (no SSO), browser, window size, theme, open window titles, last 10 JS errors (collected after login), optional room picture (`createTextureFromRoom`, PNG data URL, max ~3 MB).
- POST `url.prefix/api/bug-report` (URLSearchParams, credentials) → hCMS `Api\BugReportController` (see hCMS PROJECT_STATE).
- Verified: tsc 52 (baseline), build + sandbox deploy (39 gated chunks), endpoint as Test (id 12) creates the report + a category-31 ticket. Not yet clicked through in a browser. Live: not deployed.

## Bug reporter v2, companions fix, editor speed, Daily Hub, arrow walk (2026-10-08, SANDBOX)
- **Companions/misc never rendered**: renderer patches 8+9 edited the package's unused `src/` copy; the package entry
  (`index.ts`) uses the top-level folders. Both `.yarn/patches/@nitrots-nitro-renderer-patch-{e9999608f5,85c5e969b8}.patch`
  now target `api/…` / `nitro/…` (old copies in the session scratchpad), `yarn install` re-applied; build bundle has the code.
  Live client still lacks it until the next live client deploy.
- **Bug reporter v2**: report carries a snapshot (catalog page id/name/layout/offer/classname/price/search, inventory
  item), picking inside Catalog/Inventory lets the click through and records the selection. Plugin
  `rooms/ActionRefusals` (callables on 1258 place / 248 move-rotate, read-only core checks) writes refused actions to
  `hcms_action_refusals` (hCMS migration `2026_10_08_130000…`, also adds `hcms_bug_reports.refusals`); the report
  attaches the last hour (20). Admin › Moderation › Bug reports (`BugReportResource`, view modal with picture, Fixed/Close).
  Prune schedule `prune-action-refusals` 04:20 (14 days). Pictures: `storage/app/private/bug-reports/`.
- **Clothing editor**: thumbnails and face heads render through `api/avatar/AvatarEditorTaskQueue` (6 ms per frame);
  the clear (X) item is always first, then `avatareditor.newest.sets`, then the stock order.
- **Daily Hub**: vote tile/row removed (force-vote window keeps voting), "i" left of the title, chevron minimize on the
  right (localStorage `hcms.dailyhub.minimized`, green dot when something is ready); Quests tile wide without Pass.
- **Settings › Options**: Emoji codes (`:noemoji`) and "Walk with the arrow keys" (`api/room/ArrowWalkSettings`,
  `room/widgets/arrow-walk/ArrowWalkView`, screen directions, skipped while typing, localStorage `hcms.room.arrowwalk`).
- Pumpkins report: live DB/emulator/client all Pumpkins, no balance below its last ledger value (checked 2026-10-08).
- `:freeze` in own room: blocked by the permission check; needs `permissions.cmd_freeze` enum + '2' (owner/rights).
- **Ideas (2026-10-08, sandbox)**: the reporter has a Bug / Idea switch (Help › "Suggest an idea" = `bug-report/idea`).
  Ideas use category `idea` in `hcms_bug_reports`, a ticket in category 32 "Suggestion or feedback", their own texts;
  admin entry renamed "Bugs & ideas" (Idea filter, green badge). Verified with the Test user (row removed).

## Live deploy (2026-10-08 afternoon, user: "push now all to main")
- Restart alert sent (RCON `hotelalert`). Backups: `db-backups/nitro-ui-before-20261008.tar.gz`,
  `hcms-emulator-plugin.jar.bak-20261008`, `hcms-files-before-20261008.tar.gz`.
- Live: client (`yarn deploy`, then `index-d572b531.js` with the face fix + private-chat emoji codes), hCMS files
  (bug reports/ideas, force vote + login code with defaults off, CORS, schedule; migrations 70/71), plugin + emulator
  restart (clean boot, InventoryDelete + ActionRefusals registered).
- Face thumbnails bug (introduced by the editor queue, fixed): BodyModel disposes the head image right after setting
  `thumbContainer`, so the setter renders the thumbnail at once instead of queueing it.
- NOT applied (blocked by the permission check, user to run or allow): casino payouts 2.0/2.0/1.57/1.78,
  `catalog.guild.hc_required` 0, `catalog_pages` 9967688 → `guilds`, `permissions.cmd_freeze` enum + '2'.
- Sandbox client is one build behind live (face fix + messenger emoji not on sandbox yet).

## Creator (player badges/banners), page source cleanup, RCON fix (2026-10-08)
- **Creator (SANDBOX)**: dock button "Creator" (top left, `creator/toggle`) → `components/creator/CreatorView.tsx` (gated
  level 1): Badge 40×40 / Banner 67×170 pixel editor (pencil, eraser, fill, palette + own colour, undo/redo, flip, clear,
  upload ≤2 MB, Ctrl+V paste), optional friend copy. Plugin `creator/CustomCreator` IN 9695 config → OUT 9696, IN 9697
  create (type, friend, png base64 ≤62000) → OUT 9698; checks size/PNG/limits, charges Diamonds (settings
  `hcms.creator.*`: badge 150, banner 300, friend +30, 5/day, 3 pending), row in `hcms_custom_creations`.
  hCMS Admin › Moderation › Player creations (`CustomCreationResource`, `ReviewCustomCreationAction`): approve = badge
  `NZC<id>` GIF into `c_images/album1584` + RCON givebadge (owner + friend), banner `custom_<id>.png` + `hcms_banners`
  row with `owner_user_id` (hidden from the shop, not buyable) + `hcms_users_banners`; reject = refund + notice.
  Client shows "Custom badge" for `NZC*` names. Not on live yet.
- **Website page source**: comments that reached the HTML removed (live + sandbox, backup
  `db-backups/hcms-views-before-comments-20261008.tar.gz`); translations moved to `public/assets/js/i18n.js` (minified);
  `MinifyHtml` middleware collapses whitespace outside pre/textarea/script/style (skips admin, livewire, api).
  Verified: pages 200, `window.t` + jQuery work, no JS errors on /home.
- **RCON bug fixed (both sites)**: `EmulatorRcon` read `env()` directly, which returns null under `config:cache`, so
  the sandbox website talked to the LIVE emulator (30001) since its config was cached. Now `config('hcms.rcon.*')`.
  Two test badges that reached live Test (NZC3, NZCTEST) were removed.

## Creator v2 live (2026-10-08 evening, user: prices 50/100/10, "push to live")
- Creator = one window like Metro's atelier (Badge / Banner / My creations tabs inside the content area, Inventory
  pattern), 560 px, badge canvas 6×. Title (required, ≤40) + description (≤120) per creation; badges show them in the
  hotel via hCMS `GET /api/custom-badges` (`CustomBadgesController`, cached 60 s) → `api/creator/CustomBadgeTexts`
  used by LocalizeBadgeName/Description for `NZC*`. Banners use the title as `hcms_banners.title`.
- Tools: pencil, eraser, fill, line, rectangle, circle (filled option), undo/redo, flip, clear, upload/paste. Badge:
  28 group badge bases from `c_images/Badgeparts` tinted with the colour (CDN sends ACAO *), own Habbo head/full with
  position + size. Banner: backgrounds (gradient, sky, stripes, dots, checker, behind the drawing), frames (Arch,
  Square), Habbo-style isometric stands (Round, Tile, Steps, Cloud), preview with own Habbo. No retro in stock_retro
  offers a stand editor (only `banner.upload.rank` in habda.sh, habfrost.com, habrealm.com, webbohotel.it,
  zenhotel.org), so the shapes are drawn in-house.
- Drafts in localStorage `hcms.creator.drafts` (10 + one auto-save per type on tab switch/close, cleared after create).
- My creations: summary (approved/waiting/rejected), filter, cards with title/description/status/date/reason, send a
  copy (friend price, free to yourself if you deleted yours). Plugin IN 9699 list → OUT 9700, IN 9701 send copy.
- Settings: Admin › Economy › Creator settings (`CreatorSettings` page: open, prices 50/100/10, 5/day, 3 waiting);
  the plugin reads `hcms.creator.*` from the DB every 30 s, no restart needed. Staff can edit title/description
  before approving (Player creations › Edit text).
- Live: hCMS migrations 72/73 + files (backup `db-backups/hcms-files-before-creator-20261008.tar.gz`), plugin
  (backup `hcms-emulator-plugin.jar.bak-20261008-creator`) + restart, client `index-72cd0563.js`. Smoke-tested as Test.
- Open: Create Group window 1:1 from the HabboCity minified bundle (user asked; not started).

## Create Group window 1:1 with HabboCity (2026-10-08, live client index-b3fd0045.js)
- Source: HabboCity bundle `index-b7d2b6d3.js` (yL creator, FI identity, PI/TL badge, UI colors, xL confirmation),
  then the LIVE window via the debug Chrome (new tab, closed afterwards): DOM skeleton identical element for element;
  computed sizes/paddings/radius/fonts/button colours equal (differences = dark vs light theme border/background and
  French label wrapping).
- Changes: card `overflow="visible"`, content columns `fullHeight`, footer `Flex between fill gap 2` with red
  `danger` Cancel/Back; Next disabled while step 1 is invalid (HabboCity runs the step action in an effect; only step 1
  is checked here because doing it on the badge/colour steps loops). Identity: name 32 / description 255,
  `fill-remaining-height`, room select `noInvalid` (auto-picks the first room), save also compares the home room (old
  bug: a changed room after going back was lost), existing groups only send a save when changed. Badge: `badge-select`
  classes, part list in ScrollContainer. Colours: no label above the preview, lists in ScrollContainer. Confirmation:
  badge + colours side by side, Title:/Description:/closing note (English), no price line (HabboCity has none).

## Profile photos fixed (2026-10-08 night, live)
- Cause: `camera_web.url` holds a full URL, the client built `camera.url/<url>.png` → broken images. Client
  `UserProfilePicturesTabView` now uses absolute URLs as-is. Also only published photos (camera_web) were listed;
  plugin `ProfilePicturesRepository` now unions the player's own photo furni (`external_image%`, extra_data `w`/`t`),
  distinct by URL, newest first. Live plugin restart (backup `hcms-emulator-plugin.jar.bak-20261008-photos`).

## Clothing gender fix (2026-10-09, live data)
- Official figuredata fetched with a headless Chrome (habbo.com/gamedata/figuredata/1, 3,312 sets). Our FigureData has
  9,648 sets (7,520 not official). Rule: official gender wins when id AND parts match (only M/F, never widen to U);
  otherwise the library names of the set's parts (`_M_` / `_F_`) decide when they agree. 115 sets changed
  (U→M 73, U→F 37, F→M 3, M→F 2); 2,215 sets have no gender hint and stay U. List
  `cdn/habbocity/gamedata/gender-fix-20261009.json`, backup `FigureData.json.bak-pregender-20261009`,
  `?v=20261009a` in all three renderer-configs.

## Website avatars show companions + misc (2026-10-09, live)
- hcms-imager had its own avatar code without renderer patch 8. Ported: `data/HabboAvatarExtraParts.ts` (geometry
  items, part sets, walk/wave frames mirrored from bd/lh/rh; no idle loops so other avatars' GIF frame counts stay the
  same), `AvatarFigurePartType.PET/MISC` in FIGURE_SETS, wired in `AvatarRenderManager`. Built, task restarted, 29
  cached figures with pt/mc moved to `db-backups/imager-cache-pt-20261009`. Verified: pt-5961 (teddy) and mc-6621
  (trash can) render on img.habbo.nz.
