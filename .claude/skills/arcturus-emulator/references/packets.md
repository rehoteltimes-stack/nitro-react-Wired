# Packets, networking, sessions

## Transport
- Core `networking/gameserver/GameServer` is a raw Netty TCP server on `game.host:game.port` (config.ini: 127.0.0.1:30010 since 2026-10-03; unused by Nitro, which connects through the NitroWebsockets port 8443).
  Pipeline: `GamePolicyDecoder` → `GameByteFrameDecoder` → `GameByteDecoder` → (logger) → `IdleTimeoutHandler(30, 60)` →
  `GameMessageRateLimit` → `GameMessageHandler`; out: `GameServerMessageEncoder`.
- **WebSocket for Nitro is not in the core.** It comes from the plugin jar `hcms-emulator-run/plugins/NitroWebsockets-wired.jar`
  (Krews "Nitro Websockets", `org.krews.plugin.nitro.main`, adds a websocket codec to the Netty pipeline). Its config keys
  were not traced (UNVERIFIED).
- Frame format (Habbo wire, also what the client codec uses): int32 length, short header, body (int32, short string
  with a 2-byte length, boolean). A string is at most 65,535 bytes.

## Incoming dispatch (`core:messages/PacketManager.handlePacket`)
1. Header not registered → ignored silently.
2. `client.getHabbo() == null` and the handler class isn't `@NoAuthMessage` → dropped (pre-login protection).
3. A new handler instance is created per packet; `getRatelimit()` > 0 → per-client per-handler throttle (dropped silently).
4. Every `ICallable` registered for that header runs first (`callable.call(handler)`). Any of them may set
   `handler.isCancelled = true`.
5. `handler.handle()` runs if not cancelled. Exceptions are caught and logged ("Caught exception").
- `registerHandler(header, class)` **throws if the header is already taken**. Plugins can't silently override a stock
  handler this way.
- Constants: `messages/incoming/Incoming.java` (~414 entries), `messages/outgoing/Outgoing.java` (~518). Registration grouped
  in `PacketManager.register*()` (catalog, rooms, users, trading, modtool, wired, ...).

## Outgoing (`core:habbohotel/gameclients/GameClient.sendResponse`)
- `MessageComposer.compose()` caches the `ServerMessage` and tags it with its composer.
- Every outgoing packet fires **`OutgoingPacketEvent`** (habbo, composer, message): a plugin can cancel it or
  `setCustomMessage(...)` to replace the bytes (used by `plugin:sanctions/SanctionInfoFix`, hcms-feedback, follow feedback).

## Changing stock behaviour without editing the core
| Need | Mechanism |
|---|---|
| Block/allow a stock incoming packet | `PacketManager.registerCallable(header, handler -> { ... handler.isCancelled = true; })`. To read the payload, peek the `ByteBuf` and reset the reader index so the real handler reads fresh bytes. |
| Change what the client receives | `OutgoingPacketEvent` + `setCustomMessage` / `setCancelled` |
| React to a game action | the matching plugin event (`plugins.md`) |
| New feature | new opcode pair registered in `EmulatorLoadedEvent` |

## Custom protocols in this project
- Opcodes are in the 95xx-96xx range, each plugin keeps its own constants (`plugin:*/…Protocol.java`, `hcms-shop`
  `ShopConfig` settings `shop.header.*`, Furni Editor 9569-9588/9611-9612). Before taking a new number, grep it in core +
  all plugins + `nitro-react-Wired/src/api`.
- Pattern: `XProtocol.register()` calls `getPacketManager().registerHandler(IN, Handler.class)`; replies extend
  `MessageComposer`. The client half lives in `nitro-react-Wired/src/api/<feature>/…Protocol.ts`.
- Append new reply fields at the end so older clients still parse. Split JSON over 65 KB (`hcms-shop` `ShopComposer.json`).

## Sessions / login
- `messages/incoming/handshake/SecureLoginEvent` reads the SSO, then `HabboManager.loadHabbo(sso)`: `SELECT ... WHERE
  auth_ticket = ?`, then **clears `auth_ticket`** unless `debug.mode`. That's why a reconnect needs a fresh ticket
  (`plugin:reconnect/ReconnectTicket`, `rc-` prefix).
- Fires `UserRegisteredEvent` on first visit, then `UserLoginEvent` (with the login IP).
- `GameClient` holds the channel, `getHabbo()`, `messageTimestamps` (ratelimit) and machine id. Disconnect →
  `Habbo.disconnect()` → `UserDisconnectEvent`, saves `HabboInfo`.

## Trace checklist
Client composer → opcode → `PacketManager` registration (stock) or plugin `register()` → handler `handle()` → manager →
state/DB → composer → client parser. Check `@NoAuthMessage`, the ratelimit, callables on that header (grep
`registerCallable(` in the plugins), and `OutgoingPacketEvent` listeners that might rewrite the reply.

## Known trap
`PacketManager.unregisterCallables(Integer header)` calls `this.callables.clear()`, which removes the callables of
**every** header. Use the two-argument `unregisterCallables(header, callable)` in `onDisable`.
