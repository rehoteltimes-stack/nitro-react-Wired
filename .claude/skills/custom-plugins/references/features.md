# Other custom features (where they live)

| Feature | Server | Client | Data |
|---|---|---|---|
| Presence shop (auras, spawns, borders, ornaments, bubbles, name styles) | `hcms-shop/server` (`ShopPlugin`, `ShopService`, `ShopRepository` caches 30 s, `ShopBubbleGuard`, `room/*`) | `src/api/shop`, `src/components/shop` (window "Presence", `:presence`/`:shop`) | `shop_*` tables, schema version `shop.schema.version`, settings `shop.*`. The aura render hook is a renderer patch (`hcms-shop/renderer-hook`). Never call `ShopConfig.live()` from inside `ShopRepository.refresh()` (pool deadlock). |
| Sunset Ranch (official room game, rebuilt from a G-Earth recording of habbo.com) | `plugin:games/ranch/Ranch` (farms = sign → soil ring, crops, shop, single-click actions, players state), `RanchOrders` (buyer bots); messages via `GameRewards.tell` + `CommandFeedback` kinds | `components/ranch/RanchView` (Barn/Shop windows), `RanchPlayersView` (stacks over avatars), `RanchOrdersView` (orders over bots), `RanchFx` (Wired variable FX painters ported from habz geometry: level badge + arrow bar, blocky counters, striped time bar) | `hcms_ranch_*` (crop_types with unlock_level/order_value/seed_currency, players, inventory, crops per slot, farms), settings `hcms.ranch.*`; rooms 538/539; design `docs/SEASONS_AND_SUNSET_RANCH.md` §6 |
| Feedback bubbles | `hcms-feedback` (`FeedbackInterceptor` on outgoing bubbles/whispers, `FeedbackRules`, `FeedbackStyle`) | `src/api/notification/FeedbackKind.ts`, `useNotification.showFeedback` | `feedback_kinds`, `feedback_rules`, `feedback_styles`; icons `cdn/c_images/notifications/feedback_<kind>.png` (`feedback.icon.url ?v=`). Server code sends via `plugin:commands/CommandFeedback`: `tell` = notification bubble, `chat`/`say` = room line in the kind's Wired notification bubble (200-252, setting `hcms.feedback.chat_bubble.<kind>`; client `ChatWiredBubbles.scss` + `WiredMarkupHtml` for `[b] [i] [u] [red] [green] [blue] [purple] [cyan]`). Games call `GameRewards.tell(habbo, text, Kind)`. Players are kept off 2xx by `commands.cmd_chatcolor.banned_numbers`. |
| Furni Editor (+ RCON `furnieditorrevert`, `furnisourcesresolve`: `project-workflow/references/asset-rendering.md`) | `hcms-furnieditor-plugin` (rank 7+) | `src/components/furni-editor`, `src/api/furni-editor` | edits `items_base`, FurnitureData.json, audit `furni.edited`; revert via RCON |
| Builder Mode | `hcms-buildermode-plugin` | `src/components/builder-toolbar` | see `nitro-builder-toolbar-plugin/CLAUDE.md`; the forced-state toggle refuses gates with a Habbo on them (stock rule) |
| Mentions | `plugin:mentions/*` | `src/api/mentions`, chat views | `hcms_mention_log`, offline → `hcms_notifications` |
| Chat reactions/replies | `plugin:chatreact/*` | `src/api/chat/ChatReactions.ts` | memory only |
| Room settings switches | `plugin:roomsettings/*` (gates via callables/events, no exemptions) | navigator room settings tabs | `hcms_room_settings` (`RoomSettingsStore`) |
| Reconnect | `plugin:reconnect/ReconnectTicket` (`rc-` tickets) | `src/components/reconnect` + renderer patches | `users.auth_ticket` |
| Commands (`:pyramid`, `:enable vip`, `:faceless`, …) | `plugin:commands/HabboCityCommands` | help data `src/components/help/HelpCommandData.ts` | `permissions.cmd_hc_*` |
| Profile (stats, cover, pictures, wealth, banners, rarity) | `plugin:profile/*`, `banners/*`, `rarity/*` | `src/components/user-profile` | hCMS tables (`hcms_wealth_snapshots`, banners…) |
| Bots | `plugin:bots/*` (website page drives it over RCON `botpanel`) | none in game now | `hcms.bots.enabled` |
| Event alerts | `plugin:eventalert/*` (`:eha`) | `src/components/event-alert` | |
| Last login notice, session log | `plugin:activity/*` | | `hcms_session_log` |
| Upper-case floor heights | `plugin:rooms/UpperCaseHeights` + renderer patch | floor editor | A-Z = 36-61 |
| Sanction info fix | `plugin:sanctions/SanctionInfoFix` (outgoing packet substitution) | | |
