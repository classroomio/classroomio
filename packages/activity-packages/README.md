# Activity packages (Phase 0)

Throwaway spike and test fixtures for SCORM support. Contract: `prd/scorm-support/v2/README.md`, `activity-integration-map.md`, `implementation-plan.md`.

## Layout

- `test/fixtures/sources/` — hand-written package sources (`imsmanifest.xml` plus SCO pages).
- `test/fixtures/*.zip` — built packages, produced by `test/fixtures/build-fixtures.mjs`.
- `test/fixtures/vendor/` — not in git. Download and build notes for Rustici golf examples and the Adapt course live here.
- `test/fixtures/ATTRIBUTION.md` — license record for every fixture.
- `test/fixtures/README.md` — fixture index with the per-fixture baseline.
- `spike/player/` — throwaway two-origin player. Never imported by production code.
- `spike/SPIKE-FINDINGS.md` — answers to the nine Phase 0 questions.

## Commands

```bash
node test/fixtures/build-fixtures.mjs
node spike/player/server.mjs
```

`src/` with the ZIP checks, manifest parser, outcome mapping and token helpers lands in PR 5. Nothing in this folder is imported by the app until then.
