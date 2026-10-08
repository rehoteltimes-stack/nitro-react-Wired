# Custom protocols

Wire conventions:
- one opcode per direction, constants inside the plugin's `*Protocol` class;
- handlers extend `MessageHandler`, replies extend `MessageComposer`;
- client composer/parser/event in `nitro-react-Wired/src/api/<feature>/…Protocol.ts`, registered with a
  `Register…Messages()` call in the component/hook body before `useMessageEvent`;
- new reply fields only at the end, read on the client `if (bytesAvailable)`;
- JSON over 16-64 KB is split (`hcms-shop` `ShopComposer.json`).

Opcodes in use (grep 2026-10-01; always re-grep before adding):

| Range | Feature | Server class |
|---|---|---|
| 9501-9502, 9511-9513, 9521, 9531 | banners + profile banners | `plugin:banners/BannerProtocol`, `ProfileBannerProtocol` |
| (own range) | clothes shop | `plugin:clothesshop/ClothesShopProtocol`; check the file |
| 9522-9543 (not 9531) | profile stats, pictures, wealth, cover, purse colours, rarity | `plugin:profile/*`, `rarity/*`, `currency/*` |
| 9544-9545 | command list | `plugin:commandlist/*` |
| 9546-9550 | bots panel (bots run from the website now) | `plugin:bots/*` |
| 9551 | event alert (server push) | `plugin:eventalert/*` |
| 9552-9554 | mentions | `plugin:mentions/*` |
| 9555-9558 | room settings switches / skin | `plugin:roomsettings/*` |
| 9559-9560, 9566-9567 | identity by id / by name (rank colour, VIP) | `plugin:identity/*` |
| 9561-9562 / 9563-9564 | command confirm / list confirm | `plugin:commands/*` |
| 9568 | profile moderation (delete banner/motto/look) | `plugin:profile/ProfileModerationProtocol` |
| 9569-9588, 9611-9612 | Furni Editor | `hcms-furnieditor-plugin` (`FurniEditorHeaders`) |
| 9590-9602, 9606, 9615 | Presence shop (configurable `shop.header.*` settings) | `hcms-shop/server` (`ShopConfig`) |
| 9603-9605 | admin currency | `plugin:admin/AdminCurrencyProtocol` |
| 9607-9610 | admin give | `plugin:admin/AdminGiveProtocol` |
| 9613-9614 | reconnect ticket | `plugin:reconnect/ReconnectTicket` |
| 9616-9619 | chat reactions / replies | `plugin:chatreact/ChatReactions` |
| 9620-9622, 9638-9642 | staff feed / Staff Tools settings, feed card + history | `plugin:stafffeed/StaffFeedProtocol` |
| 9623-9625 | player settings (Options tab) | `plugin:settings/PlayerSettingsProtocol` |
| 9626-9628 | security incidents | `plugin:security/SecurityProtocol` |
| 9629-9631 | engagement state/actions | `plugin:engagement/EngagementProtocol` |
| 9632-9634 | staff PIN | `plugin:staffpin/StaffPin` |
| 9635-9637 | Players card | `plugin:security/PlayerToolsProtocol` |
| 9643-9645 | prison | `plugin:prison/PrisonProtocol` |
| 9646/9647 | client chunk token | `plugin:chunkaccess/ChunkAccess` |
| 9648/9649 | HabboPass window (state / claim via `php artisan hcms:pass`) | `plugin:engagement/PassProtocol` |
| 9650/9651 | room YouTube (`:play`) | `plugin:youtube/RoomYoutube` |
| 9671-9675 | Video TVs (video on TV furni): IN 9671 set URLs (item, newline list), IN 9672 control (item, play/pause/stop/next/prev/select/ended, index), IN 9673 request (item); OUT 9674 state (item, urls, track, state 0/1/2, positionMs, canControl), OUT 9675 types (name, screen geometry per direction) | `plugin:youtube/VideoTv`; client `api/videotv/VideoTvProtocol.ts`, `hooks/video-tv/useVideoTv.ts`, `components/video-tv/*` |
| 9652 | hotel info card (`:info`) | `plugin:info/HotelInfo` |
| 9653/9654 | staff Games panel (lottery, Random Word, spawns, Swap-o-Matic; JSON) | `plugin:games/GamesAdmin` |
| 9657 | `:plugins` card (hotel name, count, name/author pairs) | `plugin:info/HotelInfo` |
| 9662-9670 | Sunset Ranch: IN 9662 `RanchAction` (action, arg, amount: buy/plant/water/fertilizer/state); OUT 9663 `RanchState` (own level/xp/slots/tokens/balance/pending, fertilizers, crops with seed currency + unlock level); OUT 9664 `RanchPlayers` (per ranch player in the room: unit index, level, progress, tokens, balance, crops); OUT 9665 `RanchOrders` (per buyer bot: unit index, seconds left, duration, reward, crops); OUT 9666 `RanchAnimals`; OUT 9667 `RanchChallenge`; OUT 9668 `RanchShopItems`; OUT 9669 `RanchCrops`; OUT 9670 `RanchQuest` (day, steps, progress, unlock seconds). Next free: 9679. Clicks use stock packets via `registerCallable`: 2789 `ClickFurniEvent`, 2790 `ClickAvatarEvent` | `plugin:games/ranch/Ranch`, `RanchOrders`; client `api/games/RanchProtocol.ts`, `components/ranch/*` |
| 9660/9661 | Live Lotto panel (OUT state / IN buy int amount) | `plugin:games/LottoLive` + `Lottery`, client `components/lotto-live/LottoLiveView` |
| 9658/9659 | prisoner panel status (OUT) / bail (IN, no args) | `plugin:prison/PrisonerPanel`, client `components/prison/PrisonerPanelView` |
| 9655/9656 | Swap-o-Matic (OUT state JSON / IN action string + offer int) | `plugin:games/Automat`, client `components/automat/AutomatView` |

Builder Mode uses its own headers (`hcms-buildermode-plugin` `BuildModeHeaders`). Check them before choosing a number.
| 9678 | Hotel alert card: OUT 9678 `HotelAlertCard` (sender, figure, message, roomId, roomName), replaces the stock `:ha` alert | `plugin:alerts/HotelAlertCard`; client `api/alerts/HotelAlertCardProtocol.ts`, `components/hotel-alert/HotelAlertCardView.tsx` |
