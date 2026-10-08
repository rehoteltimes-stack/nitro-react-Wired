# Ranks, permissions, commands, moderation

## Permission model (verified)
- Table `permissions`: one row per rank (`id`, `rank_name`, `level`, `badge`, `log_commands`, `staff_color`, …) with one
  column per permission key (`acc_*`, `cmd_*`), values `'0'` / `'1'` / `'2'` → `PermissionSetting.DISALLOWED` /
  `ALLOWED` / `ROOM_OWNER`. The column is an ENUM, so always use quoted values in SQL (`'1'`; a bare `1` means enum index 1 = `'0'`).
- `PermissionsManager` loads it at boot. `:update permissions` reloads it live.
- `Habbo.hasPermission(key[, hasRoomRights])` → `Rank.hasPermission`: ALLOWED, or ROOM_OWNER **and** room rights.
  If the rank says no, **every plugin's `HabboPlugin.hasPermission(habbo, key)` is asked and can grant it.**
  Plugins should return false unless they mean to grant.
- A missing column = DISALLOWED. Plugins add their own columns at boot if missing (e.g. `cmd_hc_*`, `acc_shop_admin`).
- `users.rank` = rank id. In this project `permissions.level` equals the rank id, and the client's
  `securityLevel` is the rank level. That is UX only.

## Commands (`core:habbohotel/commands/CommandHandler`)
- `addCommand(Command)` registry. Plugins add commands in `EmulatorLoadedEvent`.
- `handleCommand`: matches keys (`emulator_texts commands.keys.<cmd>`, `;`-separated) → permission check with room
  rights counted (rights in the room, `acc_placefurni`, or guild rights) → **`UserExecuteCommandEvent`** (cancellable,
  fires only after the permission check) → `handle` → `commandlogs` via `DatabaseLogger` if the rank has `log_commands = '1'`.
- A command the player lacks permission for falls through as normal chat (no event). Detect those in `UserTalkEvent`
  (project: `plugin:stafffeed/StaffFeedEvents.onTalk`).

## Moderation
`core:habbohotel/modtool/ModToolManager` (ban, kick, alert, tickets), `ModToolSanctions` (table `sanctions`), events
`SupportUserBannedEvent`, `SupportUserAlertedEvent`, `SupportUserKickEvent`, `SupportTicketEvent`, `SupportRoomActionEvent`.
Mod Tool packets are gated by `acc_supporttool` etc. inside their handlers.

## Project staff security (plugins)
- `plugin:staffpin/StaffPin`: staff (level ≥ 5) are locked until they enter the PIN. It refuses commands, blocks staff
  opcodes with `registerCallable`, and sends level 1 to the client. **Add every new staff opcode to its block list.**
- `plugin:security/*` (incidents, auto-actions, security modes), `plugin:prison/*`, `plugin:stafffeed/*`, audit in
  `hcms_admin_audit_log`.
- Rule: every staff handler checks the rank on the server. A hidden button in the client is never the check.

## Trace checklist
Find the permission key the handler checks (grep `hasPermission(` / `Permission.` in the handler) → the column in
`permissions` → that rank's value → plugin `hasPermission` overrides → for commands, the key list in `emulator_texts`.
