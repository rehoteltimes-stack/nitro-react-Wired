---
name: nitro-ui
description: The Nitro game client at c:/inetpub/wwwroot/nitro-react-Wired (React 18 + TypeScript + Vite, @nitrots/nitro-renderer 1.6.6 with chained Yarn patches, served at https://play.habbo.nz inside the hCMS /hotel iframe). Covers app structure, components/windows, hooks and state, client protocols (composers/parsers), HabboCity-1:1 styling (holo CSS, theme tokens), custom UI (Presence, engagement/Today, Staff Tools, Furni Editor, purse, reconnect), feedback bubbles, assets/config, build/deploy and client code exposure. Use for any visual or client-side task, and for the client half of any new protocol.
---

# Nitro UI (client)

Root `c:/inetpub/wwwroot/nitro-react-Wired`. Workflow and rules: `PROJECT_WORKFLOW.md`. History:
`docs/PROJECT_STATE.md` (grep only).

## Structure (verified 2026-10-01)
- `src/index.tsx` (theme from `?theme=`), `src/App.tsx`, `src/components/main/MainView.tsx` (mounts the windows).
- `src/components/<feature>/`: one folder per window/feature (navigator, catalog, inventory, avatar-editor, room,
  toolbar, purse, right-side, mod-tools, user-profile, user-settings, engagement, shop, furni-editor, floorplan-editor,
  builder-toolbar, reconnect, staffpin, help, wired*, …).
- `src/common/`: shared primitives (`Button`, `Flex`, `Column`, `Grid`, `Text`, `ScrollContainer`, `SearchBar`,
  `CustomSelect`, `CustomInputRange`, `card/NitroCard*`, `draggable-window`, `layout/*` such as
  `LayoutCurrencyIcon`/`LayoutAvatarImageView`, `UsernameView`, `HtmlDsl`). **Search here and in sibling components
  before writing new markup.**
- `src/hooks/`: state via `use-between` shared hooks (`useNotification`, `useInventory*`, …);
  `hooks/events/useMessageEvent.tsx` subscribes to server messages.
- `src/api/`: helpers and protocols. `api/nitro/SendMessageComposer.ts`, `CreateLinkEvent.ts` (link-tracker URLs such as
  `engagement/daily`, `mod-tools/incidents`), `AddLinkEventTracker.ts`, `GetConfiguration.ts`. Custom protocols live in
  `api/<feature>/…Protocol.ts`.
- Styles: `src/assets/styles/holo/` = HabboCity's compiled CSS in cascade order (never reorder), `holo/_tokens.scss`
  (light `:root`, dark `body.dark-mode`). Own-feature SCSS is listed in `src/components/index.scss`.
- Config at runtime (not bundled): `public/ui-config.json`, `public/renderer-config.json` (gitignored). The deployed copies
  are in `hCMS/public/cdn/client/`. CDN assets in `hCMS/public/cdn` (7-day cache; bump `?v=`).

## Base Nitro vs custom
- **Base Nitro**: stock nitro-react windows, rebuilt 1:1 to HabboCity's live DOM/CSS (navigator, catalog, inventory,
  toolbar, profile, settings, mod tools…). Rule: verify against the live reference (DOM + computed styles, no
  screenshots); don't invent classnames; don't add CSS for HabboCity components, fix the markup.
- **Custom UI**: Presence (`components/shop`), Today card + Daily reward (`components/engagement`), Staff Tools / feed
  card / incidents / Players / prison (`components/mod-tools/views/*`), staff PIN overlay, Furni Editor, floor editor
  (sodaho 1:1), builder toolbar, reconnect card, purse (HabboPie 1:1 + own icons), feedback kinds. Own windows use
  theme tokens, copy a sibling's layout, Habbo pixel icons (no emoji).
- **Renderer** = `@nitrots/nitro-renderer` with 6 chained patches in `.yarn/patches/` (aura hook, A-Z heights,
  reconnect/backoff, auth give-up, 15 s login timeout). Change with `yarn patch '<resolution from yarn.lock>' --update` +
  `yarn patch-commit -s`.

## Protocol rules (client half)
- Call `RegisterXMessages()` synchronously in the component/hook body **before** `useMessageEvent`, never in an effect.
  Otherwise the header resolves to -1 and replies are silently dropped.
- Read new trailing fields only `if (wrapper.bytesAvailable)`. Server half: `custom-plugins` skill.
- `useEffect(() => { send(); }, [])`: braces required, or React treats the return value as a clean-up and crashes.
- Feedback: `useNotification().showFeedback(text, kind)`; kinds in `api/notification/FeedbackKind.ts`.

## Build / verify
- Dev: `yarn start` (Vite HMR, 5173). Type check: `npx tsc --noEmit -p .` (baseline 49 errors).
- Deploy: `yarn deploy` (`deploy.ps1`: build, check `dist/index.html`, robocopy /MIR to `hCMS/public/cdn/client`; keeps
  `pie.html`/`metro.html` reference clients).
- Verify live with CDP (`c:/tools/nitro-catalog-copy/scripts/eval-in-iframe.js`; 9222 = the user's Chrome, 9223 = headless).
  Don't test as `officialrooms`. Scroll targets into view before computing click points. After an HMR "Failed to reload",
  reload the tab.

## References
- `references/patterns.md`: recipes for a new window, client protocol half, shared hook, HabboCity fix, notifications.

## Client exposure (finding 2026-10-01)
- Production builds have **no source maps**, but also **no code splitting**: three chunks (`index` ~9.3 MB, `vendor`,
  `nitro-renderer`), no `React.lazy`. All staff/admin UI ships to every player, gated only by `securityLevel`.
- The websocket protects transport, not source. Lazy chunks would reduce casual exposure, but a chunk on the public CDN
  is still downloadable. All authority must stay server-side. Keep secrets, reward tables and algorithms out of the client.

## Coordination
Routed by `project-workflow`. When a change crosses into another layer, load that layer's skill too (routing table
there). Ops rules (schedulers, economy config, QA, deploy, CDN, cleanup, docs): `project-workflow/references/operations.md`.
Record new architecture facts in this skill's references.
