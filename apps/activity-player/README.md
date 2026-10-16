# Activity player

SCORM player page served from the content origin. Skeleton state: the `scorm-again` adapter (`3.4.6`, pinned) boots from a launch token, exposes the run-time API, frames one module, and posts UI events to the activity page. It runs against the stub runtime server below; the production content host, launch route, and commit endpoint land in PR 8 and PR 10.

## Layout

- `src/main.ts` — bootstrap: launch token from `/activity/player/:token`, launch state fetch, adapter creation, `loadFromJSON`, parent bridge, `pagehide` flush, package iframe, did-not-connect handling.
- `src/scorm/adapter.ts` — `scorm-again` wrapper: settings, adapter creation, `window.API` / `window.API_1484_11` exposure, event names.
- `src/bridge.ts` — activity-page messages (`ready`, `initialized`, `terminated` with `adl.nav.request`, `did-not-connect`) to the exact parent origin, plus the `pagehide` flush for packages that never terminate.
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

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/` | Stub harness: fixture launcher and player-event log |
| GET | `/activity/player/:launchToken` | Player HTML (`stub-<fixture>` or `stub-<fixture>--<module>`) |
| GET | `/activity/player-assets/*` | Built player assets |
| GET | `/activity/content/:contentToken/*` | Fixture files, with `Range` support |
| GET | `/activity/scorm/runtime/:launchToken/state` | Canned launch state |
| POST | `/activity/scorm/runtime/:launchToken/commit` | Stub commit log, answers `{ "result": true, "errorCode": 0 }` |
| POST | `/activity/scorm/runtime/:launchToken/event` | Stub event log, answers `{ "result": true, "errorCode": 0, "recorded": true }` |
| GET | `/stub/commits` | Commit log |

## Parent Bridge Contract (for Dashboard / Host Embedding)

The player embeds inside an iframe on the activity page (`C/components/activity/activity-player.svelte`) or opens in a popup window (`window.opener`). It communicates lifecycle events to the embedding window via `postMessage`.

### Outbound Events (`PlayerOutboundMessage`)

The player posts the following JSON events to all authorized parent origins (`parentOrigins` from the launch token's `anc` claims):

| Event | Shape | Description |
| --- | --- | --- |
| `ready` | `{ "type": "ready" }` | Emitted once the player boots, initializes the SCORM adapter, and mounts the package iframe. The embedding page knows the player booted; its loading skeleton stays until `initialized`. |
| `initialized` | `{ "type": "initialized" }` | Emitted when the package calls `LMSInitialize` / `Initialize`. The embedding page hides its loading skeleton. |
| `terminated` | `{ "type": "terminated", "navRequest": string \| null }` | Emitted when the SCORM module calls `LMSFinish` (1.2) or `Terminate` (2004). For SCORM 2004, `navRequest` contains the target requested via `adl.nav.request` (`_next_`, `_previous_`, target module identifier, or `null`). The embedding page uses this to trigger completion or advance to the next item. |
| `did-not-connect` | `{ "type": "did-not-connect" }` | Emitted if the package does not call `LMSInitialize` / `Initialize` within 30 seconds (`DID_NOT_CONNECT_MS`). The embedding page can display a warning banner. |

### Multi-Origin Dispatch

The launch state provides `parentOrigins` (an array of allowed origins from `claims.anc`: tenant subdomain, verified custom domain, and `app.classroomio.com`). The bridge broadcasts outbound messages to both `window.parent` and `window.opener` across all origins in `parentOrigins`. This ensures events arrive whether an author previews on `app.classroomio.com` or a learner views the course on their tenant subdomain.

### Embedding Component Implementation (`activity-player.svelte`)

When implementing the dashboard listener in `C/components/activity/activity-player.svelte` (PR 10):

1. Attach a message listener: `window.addEventListener('message', handlePlayerMessage)`.
2. **Always validate `event.origin`**: Compare `event.origin` against the expected content origin (`contentHost` / `SCORM_CONTENT_DOMAIN`) and discard messages from untrusted origins.
3. Handle `ready`: the player booted — keep the loading state. Handle `initialized`: the package connected — dismiss the loading skeleton.
4. Handle `terminated`: Check if all modules meet the completion rule (via `openCourseCompletionIfDone`), reload attempt stats, or navigate per `event.data.navRequest`.
5. Handle `did-not-connect`: Show troubleshooting hint if the package failed to connect.
6. Clean up: Remove the event listener on component unmount (`onDestroy`).

## Notes

- `scorm-again` stays at `3.4.6`. Upgrade only after re-running every fixture and re-checking the LMS-rule defaults, per `packages/activity-packages/spike/SPIKE-FINDINGS.md`.
- The throwaway spike player (`packages/activity-packages/spike/player/`) proved the run-time first and is never imported here.
- Follow-ups outside this skeleton: serving from the API image (`docker/Dockerfile.api`), the content-host header gate and token checks (PR 8), launch/attempts/completion side effects (PR 10).
