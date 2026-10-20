# Activity player

SCORM player page served from the content origin. The `scorm-again` adapter (`3.4.6`, pinned) boots from a launch token, exposes the run-time API, frames one module, and posts UI and lifecycle events to the activity page.

## Layout

- `src/main.ts` — bootstrap: reads the launch token from `/activity/player/:token`, queues module sessions, takes delegated fullscreen, and handles messages from the embedding page.
- `src/session.ts` — one module session: launch state fetch, adapter creation, `loadFromJSON`, parent bridge, `pagehide` flush, package iframe, did-not-connect handling. `end()` unloads the package, saves a module it left running and removes the API, so the next module starts in the same page.
- `src/scorm/adapter.ts` — `scorm-again` wrapper: settings, adapter creation, `window.API` / `window.API_1484_11` exposure and removal, event names.
- `src/bridge.ts` — messages to the embedding page, tagged with the session number, plus the `pagehide` flush for packages that never terminate.
- `src/inbound.ts` — validates messages from the embedding page.
- `src/toolbar.ts`, `src/nav-state.ts` — the player toolbar: module nav (previous, module list, next), time limit, status and the exit-fullscreen button.
- `src/fullscreen.ts`, `src/fullscreen-reroute.ts` — fullscreen helpers, and the reroute that lets a package's own fullscreen calls work in browsers that refuse nested fullscreen.
- `src/notice.ts` — the in-player snackbar.
- `stub/server.mjs` — zero-dependency stub content origin. Serves the built player at the production paths, extracted fixtures as package files, and stub launch-state/commit endpoints.

## Run

```bash
pnpm --filter @cio/activity-player build
pnpm --filter @cio/activity-player stub
```

The stub listens on `http://content.localhost:3004` by default (port 3002 is reserved
for the API dev server). To customize the port:

```bash
ACTIVITY_PLAYER_STUB_PORT=3999 pnpm --filter @cio/activity-player stub
```

Open `http://content.localhost:3004`, pick a fixture module, and use its buttons. Player events appear under the frame; commits land in `stub/.stub-commits.jsonl` (gitignored) and are viewable at `/stub/commits`.

## Routes (mirrors the production table)

| Method | Path                                          | Purpose                                                                        |
| ------ | --------------------------------------------- | ------------------------------------------------------------------------------ |
| GET    | `/`                                           | Stub harness: fixture launcher and player-event log                            |
| GET    | `/activity/player/:launchToken`               | Player HTML (`stub-<fixture>` or `stub-<fixture>--<module>`)                   |
| GET    | `/activity/player-assets/*`                   | Built player assets                                                            |
| GET    | `/activity/content/:contentToken/*`           | Fixture files, with `Range` support                                            |
| GET    | `/activity/scorm/runtime/:launchToken/state`  | Canned launch state                                                            |
| POST   | `/activity/scorm/runtime/:launchToken/commit` | Stub commit log, answers `{ "result": true, "errorCode": 0 }`                  |
| POST   | `/activity/scorm/runtime/:launchToken/event`  | Stub event log, answers `{ "result": true, "errorCode": 0, "recorded": true }` |
| GET    | `/stub/commits`                               | Commit log                                                                     |

## Parent Bridge Contract (for Dashboard / Host Embedding)

The player embeds inside an iframe on the activity page (`apps/dashboard/src/lib/features/course/components/activity/activity-player.svelte`). The player owns the module nav and fullscreen; the activity page owns launches, module locks and progress. They talk over `postMessage`.

### Sessions

Each module the activity page loads into a running player is a session. The first module, from the iframe URL, is session `0`; the activity page numbers every later `load-launch` it sends. The player adds `"session": n` to every outbound message, and the activity page acts only on messages from its current session. Late messages from an earlier session (for example the `terminated` sent while that module unloads) only refresh progress.

### Outbound Events (`PlayerOutboundMessage`)

The player posts the following JSON events to all authorized parent origins (`parentOrigins` from the launch token's `anc` claims). Each carries `session` as described above.

| Event                    | Shape                                                                                         | Description                                                                                                                                                                                                                                                                                                  |
| ------------------------ | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ready`                  | `{ "type": "ready" }`                                                                         | Emitted once a session starts: adapter initialized and package iframe mounted. The embedding page sends `player-ui` in reply; its loading skeleton stays until `content-loaded` or `initialized`.                                                                                                            |
| `content-loaded`         | `{ "type": "content-loaded" }`                                                                | Emitted once the package document has parsed (or its frame fired `load`), before external images, fonts and embeds finish. The embedding page hides its loading skeleton.                                                                                                                                    |
| `initialized`            | `{ "type": "initialized" }`                                                                   | Emitted when the package calls `LMSInitialize` / `Initialize`. The embedding page hides its loading skeleton if `content-loaded` has not already, and clears any did-not-connect warning.                                                                                                                    |
| `progress`               | `{ "type": "progress" }`                                                                      | Emitted when an intermediate commit succeeds so the host page can refresh progress state.                                                                                                                                                                                     |
| `completed`              | `{ "type": "completed" }`                                                                     | Emitted when a module save meets completion criteria mid-session so the host page can update UI immediately without waiting for terminate.                                                                                                                                   |
| `terminated`             | `{ "type": "terminated", "navRequest": string \| null }`                                      | Emitted when the SCORM module calls `LMSFinish` (1.2) or `Terminate` (2004). For SCORM 2004, `navRequest` contains the target requested via `adl.nav.request` (`_next_`, `_previous_`, target module identifier, or `null`). The embedding page uses this to trigger completion or advance to the next item. |
| `did-not-connect`        | `{ "type": "did-not-connect" }`                                                               | Emitted if the package does not call `LMSInitialize` / `Initialize` within 30 seconds (`DID_NOT_CONNECT_MS`). The embedding page can display a warning banner.                                                                                                                                               |
| `boot-error`             | `{ "type": "boot-error", "error": string \| null }`                                           | Emitted when a session cannot start, for example an expired launch token. Broadcast to `*` because the parent origins may be unknown; carries no learner data.                                                                                                                                               |
| `nav`                    | `{ "type": "nav", "action": "previous" \| "next" \| "select", "identifier": string \| null }` | Emitted from the player's module nav. The embedding page checks locks, launches the module and replies with `load-launch`.                                                                                                                                                                                   |
| `exit-immersive`         | `{ "type": "exit-immersive" }`                                                                | Emitted from the player's exit button (or Escape in full-window mode) while the embedding page holds fullscreen or full-window mode. The embedding page leaves it.                                                                                                                                           |
| `fullscreen-unavailable` | `{ "type": "fullscreen-unavailable" }`                                                        | Emitted when a delegated `request-fullscreen` could not be honoured. The embedding page falls back to full-window mode.                                                                                                                                                                                      |

### Inbound Messages (embedding page to player)

The player accepts these only from `window.parent` or `window.opener` at one of the session's `parentOrigins`, and validates every field (`src/inbound.ts`).

| Message              | Shape                                                                                   | Description                                                                                                                                                                                                                                                    |
| -------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `player-ui`          | `{ "type": "player-ui", "ui": { units, currentIdentifier, timeLimit, labels, theme } }` | What the toolbar renders: modules (`identifier`, `title`, `completed`, `locked`), the open module, the time limit, translated copy and theme colors (the dashboard's `--background`, `--primary` … tokens). Sent after `ready` and whenever any of it changes. |
| `load-launch`        | `{ "type": "load-launch", "launchToken": string, "session": number }`                   | Opens another module in the running player. The player ends the current session, then starts the new one, so fullscreen survives module changes.                                                                                                               |
| `request-fullscreen` | `{ "type": "request-fullscreen" }`                                                      | Sent with `postMessage(…, { targetOrigin, delegate: 'fullscreen' })` from the learner's click on the embedding page's fullscreen button, in Chromium. The player fullscreens itself, or answers `fullscreen-unavailable`.                                      |
| `host-immersive`     | `{ "type": "host-immersive", "mode": "fullscreen" \| "full-window" \| null }`           | The embedding page's own immersive state: its frame is fullscreen, fills the window, or neither. The player shows its exit button and reroutes package fullscreen accordingly.                                                                                 |

### Fullscreen

The fullscreen button sits on the embedding page, under the frame; the module nav and the exit button live in the player's toolbar, which stays a normal row above the package so it never covers content.

- **Chromium:** the embedding page hands its click to the player (`request-fullscreen` with fullscreen delegation) and the player fullscreens its own page. A package's own fullscreen (a video's button, YouTube) then nests inside the player's fullscreen.
- **Safari and Firefox:** they cannot delegate the click, so the embedding page fullscreens the box around the player frame. The screen shows the same thing: the player toolbar and the package.
- **iPhone:** no element fullscreen; the embedding page grows the frame over the window (full-window mode).

Safari refuses nested fullscreen whichever page owns fullscreen, so outside Chromium the player wraps the package's `requestFullscreen`, `webkitRequestFullscreen` and `webkitEnterFullscreen`: it leaves fullscreen (its own, or the embedding page's through `exit-immersive`), waits `REROUTE_SETTLE_MS`, then lets the call through within the learner's click. Retrying immediately froze Safari's tab. Native `<video controls>` buttons and cross-origin embeds (YouTube, Vimeo …) cannot be wrapped; when the player sees one while fullscreen in such a browser, it shows a snackbar with an "Exit full screen" action.

### Multi-Origin Dispatch

The launch state provides `parentOrigins` (an array of allowed origins from `claims.anc`: tenant subdomain, verified custom domain, and `app.classroomio.com`). The bridge broadcasts outbound messages to `window.parent` across all origins in `parentOrigins`. This ensures events arrive whether an author previews on `app.classroomio.com` or a learner views the course on their tenant subdomain.

## Notes

- `scorm-again` stays at `3.4.6`. Upgrade only after re-running every fixture and re-checking the LMS-rule defaults, per `packages/activity-packages/spike/SPIKE-FINDINGS.md`.
- The throwaway spike player (`packages/activity-packages/spike/player/`) proved the run-time first and is never imported here.
- Follow-ups outside this skeleton: serving from the API image (`docker/Dockerfile.api`), the content-host header gate and token checks, and the launch/attempts/completion side effects.
