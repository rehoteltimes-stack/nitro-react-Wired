# Client recipes

## New own-feature window
1. Copy the closest sibling window's structure and classes (`NitroCardView` + header + content, or the Staff Tools /
   Presence layout). Don't invent a new layout system.
2. Mount it in `components/main/MainView.tsx`. Open it through a link-tracker URL (`AddEventLinkTracker`, triggered by
   `CreateLinkEvent('feature/toggle')`) or a chat command in `hooks/rooms/widgets/useChatInputWidget.ts`.
3. Styles: a scoped SCSS file listed in `components/index.scss`, colours only from `holo/_tokens.scss` (`--holo-*`).
   Check computed colours in both dark and light mode. No Bootstrap colour utilities. A disabled `Button` is pale and
   unreadable: show status as text instead.
4. Icons: Habbo pixel art (CDN or `src/assets/images`), never emoji.
5. Staff-only window: gate the render and the link with `GetSessionDataManager().securityLevel`. The server must still
   refuse the packets.

## New protocol (client half)
`src/api/<feature>/<Feature>Protocol.ts`:
- a composer class (`IMessageComposer`) + parser (`IMessageParser`) + event (`MessageEvent`);
- `Register<Feature>Messages()` adds them to the renderer's message map;
- call it at the top of the hook/component body, then `useMessageEvent(EventClass, handler)`;
- send with `SendMessageComposer(new XComposer(...))`.
- Server half and opcode choice: `custom-plugins` skill.

## Shared-state hook
`const useXState = () => { ... }; export const useX = () => useBetween(useXState);`. Several components share it.

## HabboCity-ported component fix
Live reference DOM + computed styles (CDP, read-only) → ours → find the first divergence → fix the markup/state, not CSS.
Cover every state (empty, loading, selected, disabled…). See PROJECT_STATE "STRICTER RULES".

## Feedback / notifications
`useNotification()`: `showFeedback(text, kind)`, `simpleAlert`, `showConfirm(message, onYes, onNo, yes, no, title)`.
Bubbles with the same text replace each other, max 5 on screen.

## Reusing the outfit editor layout (2026-10-02)
- `.nitro-avatar-editor .nitro-avatar-editor-content` shifts content 70 px left for the wardrobe sidebar. A window
  that borrows the class without a sidebar must set `--left-shift: 0px` under its own class (see
  `components/clothes-shop/ClothesShopView.scss`).
- `useAvatarEditorGridColumns(ref, deps)` measures on mount; pass the window's visibility in `deps` when the
  component mounts hidden, or the grid stays at 1 column.
- Card text is white in the light theme: use `variant="muted"` (or a panel) for text on the white card body.

## Wired variable FX look (counters, level badges, bars) (2026-10-03)
- Reuse `components/ranch/RanchFx.tsx` for any Habbo Wired 2.0 style display: `RanchCounterFx` (blocky number, icon
  left/right/double, colour multiply + darkening/lighting), `RanchLevelFx` (badge + arrow bar, HSV level colour),
  `RanchStripedBarFx` (animated striped progress). Geometry comes from habz's renderer (`scripts/out/habz`), layers in
  `assets/images/ranch/`. Anchor stacks over units like `RanchAnchorView` (screen point −86 / −45 zoomed out), centred
  column with 4 px gap; publish the stack top in `api/games/RanchStackTops` so `ContextMenuView` keeps names above it.

## Heavy assets: load on demand (2026-10-04)
Never block client entry on optional assets. Truffle font atlases (`src/truffle`, 47 MB) load only when the Habbo
Wired Creator Tools window opens (`preloadNitroTruffle()` + a ready flag). Check entry cost with Resource Timing in
the play.habbo.nz frame after adding anything that preloads.
