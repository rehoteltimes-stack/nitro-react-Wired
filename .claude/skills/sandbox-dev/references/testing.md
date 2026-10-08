# Headless sandbox tests (CDP)

Pattern used for the force-vote video, the dealer window check, the hover test and the dev-client login check
(2026-10-08). Scripts are written per task in the session scratchpad; this is the recipe.

## Browser
- `chrome.exe --headless=new --remote-debugging-port=<free port 9333+> --user-data-dir=<scratch>/chrome-<name>
  --window-size=1280,720 --mute-audio --no-first-run about:blank`
- Node 26 has a built-in `WebSocket`: connect to `/json/version` → `webSocketDebuggerUrl`, then
  `Target.attachToTarget { flatten: true }` and send commands with that `sessionId`.
- `Emulation.setDeviceMetricsOverride` 1280×720, `Page.enable`, `Runtime.enable`, `Network.setCookie` for the
  website session (`hcms_sandbox_session`, domain `sandbox.habbo.nz`, secure, httpOnly, Lax).
- Open `https://sandbox.habbo.nz/hotel?room=<id>` to land in a room.

## Reading the client
- The hotel runs in an iframe (`play-sandbox.habbo.nz`, same site). Get its frame from `Page.getFrameTree`, keep a
  map frameId → default execution context from `Runtime.executionContextCreated`, evaluate with that `contextId`.
- Wait for readiness by polling a selector (`.engagement-today`, `.casino-dealer-stack`, `.force-vote-panel`).
- `getBoundingClientRect()` inside the iframe + the iframe's own rect in the page = screen coordinates for clicks.

## Acting
- `Input.dispatchMouseEvent` mouseMoved → mousePressed → mouseReleased (real gesture: popups open).
- Popups appear as `Target.targetCreated` with an `openerId`; attach to film them, `Target.closeTarget` to close.
- Network debugging: `Network.requestWillBeSent` / `responseReceived` / `loadingFailed` filtered by URL showed the
  429 on `/api/findretros/claim`.

## Recording
- `Page.startScreencast { format: jpeg, quality: 80, maxWidth: 1280, maxHeight: 720 }`, ack every
  `Page.screencastFrame`, save frames with `metadata.timestamp`.
- ffmpeg concat list with `duration` = gap to the next frame (clamp 0.02-2 s), `-r 30 -c:v libx264 -crf 23
  -movflags +faststart`, pad to 1280×720.

## Data hygiene
- Test accounts only; restore anything changed for the run (rank, claims, test lists) and say so in the report.
- The sandbox DB is a copy of real accounts: screenshots and videos stay on this machine unless the user asks.
