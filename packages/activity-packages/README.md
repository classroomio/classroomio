# Activity packages

Pure helpers for packaged course content: SCORM manifest parsing, ZIP checks, run-time rules and activity tokens.

## Layout

- `src/zip/` — ZIP entry checks, manifest lookup, case-insensitive href fallback.
- `src/scorm/manifest/` — SCORM 1.2 / 2004 manifest parsing and version detection.
- `src/scorm/runtime/` — CMI normalization and merging, outcome mapping, LMS rules, completion rollup, terminate mapping.
- `src/token/` — HMAC launch and content tokens (WebCrypto, Node and Workers).
- `src/content-types.ts` — extension-to-content-type map for extracted files.
- `test/fixtures/` — hand-written packages plus Rustici Golf examples (CC BY 3.0). Sources are the contract; `.zip` files are built artifacts. See `test/fixtures/README.md` and `ATTRIBUTION.md`.
- `spike/` — throwaway two-origin player and Phase 0 findings. Never imported by production code.

## Commands

```bash
pnpm --filter @cio/activity-packages test
pnpm --filter @cio/activity-packages build
node test/fixtures/build-fixtures.mjs
node spike/player/server.mjs
```

Only dependency: `fast-xml-parser` (pinned exact). Nothing in `src/` touches the network, the filesystem, or the database.
