# Staff systems and security (custom)

All server-side checks are in the plugin. The client UI (`components/mod-tools/...`) only hides things.

| System | Server | Notes |
|---|---|---|
| Staff PIN | `plugin:staffpin/StaffPin` | Rank level ≥ 5 (`hcms.staffpin.min_rank`) locked until the PIN is entered. Refuses commands Members couldn't use, blocks staff opcodes via `registerCallable`, sends level 1 to the client, skips the staff feed. PBKDF2 hash in `hcms_staff_pins`; trust per IP 12 h `hcms_staff_pin_trust`. Add new staff opcodes to its list. |
| Staff feed | `plugin:stafffeed/StaffFeed`, `StaffFeedEvents`, `StaffFeedEconomy` | Tagged lines (NEW USER, MODERATION, WORDFILTER, REPORT, STAFF, COMMAND, SECURITY, ECONOMY, WATCH, ALERT) as bubble-34 chat, bubbles and/or the feed card. Tables `hcms_staff_feed*`. |
| Duty + staff settings | `plugin:stafffeed/StaffDuty` | `hcms_staff_settings`, duty effect, report pop-ups. |
| Security detection | `plugin:security/SecurityGuard`, `Incidents` | Rules `hcms_security_rules` (+ strict/safest modes, `hcms.security.mode`), watch words, incidents `hcms_security_incidents`, auto actions (mute/escalate/kick/ban/prison/block), staff actions logged to `hcms_admin_audit_log`. |
| Players card | `plugin:security/PlayerToolsProtocol` | Lookup + actions (warn/mute/kick/ban/prison/trade ban/notes/reset sanctions, chatlog evidence checked as the player's own lines). |
| Prison | `plugin:prison/Prison`, `prison/PrisonerPanel` | `hcms_prisons`, `hcms_prison_sentences` (+ `bail`); callables on room load (2312) / hotel view (105). Prisoner panel OUT 9658 / bail IN 9659 + `:bail` (`:kaution`); `hcms.prison.bail_enabled/bail_currency/bail_per_minute`; staff action `prison:<min>:<id>:nobail`. |
| Trade ban | `plugin:security/TradeBan` | `hcms_trade_bans` + stock `allowTrade`. |
| Admin grants | `plugin:admin/AdminCurrencyProtocol`, `AdminGiveProtocol` | Rank ≥ 7. |
| Website admin | hCMS Filament (`hcms` skill) | Same tables, plus RCON for live effects. |

## Client exposure (finding 2026-10-01)
The client has **no code splitting** (`dist/assets/index-*.js` ≈ 9.3 MB holds everything). Staff Tools, Mod Tools
Administration and the Furni Editor ship to every player (strings like "Staff Tools" are in the bundle), gated only by
`securityLevel`. Server checks make this exposure, not a hole. Options if wanted: `React.lazy` chunks for staff
windows (still downloadable by anyone; a really protected chunk needs the server to refuse the file to non-staff, which
the static CDN can't do today). Never put secrets, reward tables or algorithms in client code.

## Known client-only gap
"Editing rights off" (room tools) is client-side only; the server still accepts a crafted move. Not a staff feature,
but a security note.

## Handler safety checklist (audit 2026-10-02)
- `io.client.multithreaded.handler = 1`: one client's packets run **in parallel**. Any read → check → write on
  currency, rewards or limits must run under `synchronized (habbo)` (the Presence shop, clothes shop, chest, freeze
  and quest swap use it) or be a single conditional SQL UPDATE (the daily claim).
- Give every paying or writing handler `getRatelimit()`.
- Never size an array or loop from a client count without a cap; refuse duplicate ids.
- Staff gates use the rank id/permission, never "rank ≥ 2": rank 2 is VIP. Refuse targets of an equal or higher
  rank, and add new staff packet ids to `StaffPin` LOCKED_PACKETS.
- Catalog-derived sale lists must join `catalog_pages` (visible = '1', enabled = '1', min_rank ≤ rank). Quote ENUM
  values: `have_offer = 1` matches the first ENUM entry, '0'.
