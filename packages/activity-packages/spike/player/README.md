# Throwaway spike player

Proves the Phase 0 run-time: scorm-again `3.4.6` on a second local origin, framing an extracted package, posting commits to a stub. Never imported by production code; the real player lands in `apps/activity-player` (PR 8, PR 10).

## Run

```bash
node spike/player/server.mjs
```

- Content origin: http://content.localhost:3002 (browsers resolve `*.localhost` to loopback).
- Vendor origin: http://127.0.0.1:3003/vendor-page.html (a different port is a different origin, which is all the streamed-content relay needs).
- Open a fixture, press its buttons, then read the stub log at `/stub/commits`.

The player serves the already-extracted sources in `test/fixtures/sources/` as `/files/<fixture>/…`, which is what an extracted package looks like. Commits append to the gitignored `.spike-commits.jsonl` and the stub answers `{ "result": true, "errorCode": 0 }`, the shape scorm-again expects.

The three-module fixture renders a module menu that commits and terminates the outgoing module before swapping the iframe, which is the ordering question 8 asks about. The streamed launcher takes `?vendor=` to point at another vendor URL; it defaults to the local vendor origin.
