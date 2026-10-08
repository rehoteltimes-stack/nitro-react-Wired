---
name: sandbox-dev
description: The fast build-and-test loop for the Habbo.nz hotel on the sandbox (sandbox.habbo.nz / play-sandbox.habbo.nz, DB hcms_sandbox, emulator hcms-emulator-sandbox). Covers the Vite dev server in sandbox mode with one-time login links, deploying plugin jars and client builds to the sandbox only, headless Chrome (CDP) tests as test accounts without kicking the user, screenshots and MP4 recordings of a flow, economy math checks before shipping odds, and the sandbox pitfalls already solved. Use whenever a change should be tried, shown or recorded before it goes live, when the user says "test it", "show me", "make a video", "start the dev server", or when a live deploy is blocked and the work has to stay on the sandbox.
---

# Sandbox dev loop

Created 2026-10-08 with the user's OK as the seventh skill ("make own workflow"). The sandbox layout itself lives in
`project-workflow/references/environments.md`; this skill is how to work on it fast. Live (habbo.nz) is never touched
from here: live deploys need the user's approval and Claude Code's permission check (`/permissions`).

## 1. Pick the fastest loop
| Change | Loop | Turnaround |
|---|---|---|
| Client UI/logic only | dev server in sandbox mode (§2), HMR | seconds |
| Plugin (Java) | `mvn -q -o package -DskipTests`, restart only the sandbox emulator (§3) | ~1 min |
| hCMS website | edit `C:/inetpub/wwwroot/hcms-sandbox` (copy of hCMS), `php -l`, `config:cache` / `route:cache` / `view:clear` | seconds |
| What players get on play-sandbox | full client build + sandbox deploy (§4) | 15-20 min |

Batch client changes into one build. Iterate looks on the dev server or a headless screenshot first.

## 2. Dev server against the sandbox
- `yarn start:sandbox` = `vite --mode sandbox --port 5190 --strictPort`. The `hcms-sandbox-configs` plugin in
  `vite.config.js` serves `renderer-config.json` / `ui-config.json` from `hcms-sandbox/public/cdn/client` (socket
  `wss://ws.habbo.nz:2087`, url.prefix `https://sandbox.habbo.nz`) and adds `<meta name="referrer" content="no-referrer">`
  (Cloudflare hotlink protection 403s images for a `localhost` referer; no referer passes).
- Ports 5173/5174 run plain `vite` with the LIVE config (the user's); 5180 is hAirUI. Never stop them.
- Login link: `powershell -File scripts/sandbox-dev-url.ps1 -User Test` → `http://localhost:5190/?sso=…` (one-time).
- `hcms-sandbox/.env HCMS_DEV_CLIENT_ORIGIN=http://localhost:5190` lets the dev client call the sandbox API
  (`config/cors.php`). `websockets.whitelist` already allows `localhost`.
- In dev every gated chunk loads (`LoadProtected` level 99), so staff-only views show without a token.

## 3. Plugin to the sandbox
1. `mvn -q -o package -DskipTests` in `hcms-emulator-plugin` (no output = success).
2. Stop only the sandbox java: owner of port 31001 (`Get-NetTCPConnection -LocalPort 31001`). Live = 30001, never touch.
3. Copy `target/hcms-emulator-plugin.jar` to `hcms-emulator-sandbox/plugins/` (backup first for risky changes).
4. `bash start-emulator.sh` in the background; boot is done when `boot-stdout-new.log` shows `RarityProtocol registered`
   and `runtime.threads` warning; check `ERROR|Exception` (ignore `Config key not found`, `BadgeImager`).
5. `emulator_settings` changes need `:update_config` (RCON `executecommand` as an online staff user) or a restart.

## 4. Client build to the sandbox
`yarn build` (NODE_OPTIONS `--max-old-space-size=8192`) → `node scripts/protect-chunks.mjs dist C:/inetpub/wwwroot/hcms-client-chunks-sandbox`
→ `robocopy dist hcms-sandbox/public/cdn/client /MIR /XF web.config .gitkeep renderer-config.json ui-config.json …`.
Robocopy exit 0-7 is success (3 = copied + removed extras). New gated views: add the root to `PROTECTED_ROOTS`
(level 1 players, 4 staff, 7 editor) and mount it in `ProtectedViews`.

## 5. Headless tests (CDP) — see `references/testing.md`
- Never as `officialrooms`. Use Test (id 12). Logging in as Phi (id 1) kicks the user's own sandbox session.
- Need a staff test? Raise Test's rank in `hcms_sandbox.users` for the run and set it back to 1 afterwards.
- Website session for a test account: a tinker script that saves a session with `login_web_<sha1(SessionGuard)>`
  and prints the encrypted cookie (`CookieValuePrefix` + `Crypt::encrypt(..., false)`), then `Network.setCookie`.
- Elements in the client iframe: evaluate in its execution context (`Runtime.executionContextCreated`, frame URL
  contains `play-sandbox`). Real clicks (`Input.dispatchMouseEvent`) for anything that opens a popup.
- Videos: `Page.startScreencast` frames with timestamps → ffmpeg concat (`C:/tools/ffmpeg/.../ffmpeg.exe`), save to
  the user's Desktop.

## 6. Pitfalls already solved (don't rediscover)
- `/gate` IIS app of a new play site needs the `php-gate` handler; a missing handler + Cloudflare = cached 404 chunks
  (purge the chunk URLs with `hcms:cloudflare purge`).
- Client → website calls are cross-site: the origin must be in `config/cors.php`; IIS answers OPTIONS itself, so send
  simple requests (form data, no JSON content type, no custom headers except Accept).
- Laravel `throttle:N,1` shares one counter per user across routes; give each route a name (`throttle:10,1,name`).
- `vote_date` / `now()` are UTC (app timezone); MariaDB `CURDATE()` is local time.
- Files are often CRLF: Python edits read with `newline=''` and write the same ending back. Bash heredocs break on
  quotes/backticks inside Python → write the script with the Write tool and run it.
- Chat font draws `|` as a heart; game texts use plain examples, never `|` or `<placeholders>`.

## 7. Before shipping odds or rewards
Exact maths, not feelings: dynamic programming over every state (best player strategy, ties solved by iteration) for
dice games; report the house edge per game and the payout that makes it fair. Casino history: hCMS PROJECT_STATE.

## 8. Finish
Document in `docs/PROJECT_STATE.md` (SANDBOX ONLY in the title until live), note what was verified and what not, and
list the exact live steps for when the user allows the deploy.
