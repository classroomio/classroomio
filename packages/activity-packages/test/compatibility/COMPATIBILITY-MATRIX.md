# SCORM compatibility matrix (v2)

Contract: `prd/scorm-support/v2/implementation-plan.md` Compatibility Matrix and Test Plan, `prd/scorm-support/v2/README.md` Acceptance Criteria 15-17, 19-23, 27-28.

Automated coverage: `compatibility-matrix.test.ts` in this folder. Run it with `pnpm --filter @cio/activity-packages test test/compatibility`.

## Axes

Run every row below in Chrome, Edge, Firefox, Safari on macOS and iOS, and Chrome on Android; embedded and new-window launch modes; on a tenant subdomain (`*.myclassroomio.com`) and a verified custom domain; as an item in a standard course and as a SCORM course.

`anc` in the launch and content tokens carries the allowed parent origins for the run, so the same package build covers the tenant-subdomain and custom-domain legs without a second upload. New-window mode falls back to the course page on phones because mobile browsers discard background windows.

## Sources

| Source | SCORM 1.2 | SCORM 2004 | What it exercises | Where it runs |
| --- | --- | --- | --- | --- |
| Hand-written fixtures (in git) | Yes | Yes | Every API call, errors, resume, exit values, three modules, a 1.2 mastery score, a streamed-content launcher, the two rejections | Automated in `compatibility-matrix.test.ts` plus `e2e/regression/scorm-compatibility.spec.ts` |
| Rustici golf examples (in git, CC BY 3.0) | Yes | 2nd to 4th | Multi-SCO and sequencing samples: module menu, rollup and the warnings | Automated in `compatibility-matrix.test.ts` |
| Adapt Learning (in git, GPL-3.0) | Yes | 4th | A single-page app with suspend data, using the pipwerks wrapper | Local: build from `adapt_authoring`, export both editions into `test/fixtures/vendor/`, then run the matrix spec |
| Articulate Storyline 360 | Yes | 2nd to 4th | Large compressed suspend data, resume prompt, video, the mastery score in 1.2 quiz manifests; launch file `index_lms.html` | Manual, local-only vendor export |
| Articulate Rise 360 | Yes | Yes | Responsive layout, many small files; launch file `indexapi.html` | Manual, local-only vendor export |
| iSpring Suite | Yes | Yes | Slide conversions, new-window options | Manual, local-only vendor export |
| Elucidat | Yes | 2nd to 4th | The default export streams content from Elucidat | Manual, local-only vendor export |
| Adobe Captivate | Yes | Check | Quizzes, interactions, mastery score | Manual, local-only vendor export |

Hand-written baselines live in `test/fixtures/README.md`. Rustici attribution lives in `test/fixtures/ATTRIBUTION.md`. Vendor setup lives in `test/fixtures/vendor/README.md`.

## Procedure per row

1. Import the ZIP through the package pipeline and confirm it reaches `ready` with its modules listed. The two rejection fixtures must fail with their specific codes (`external_launch`, `assets_only`).
2. Launch as a student, press the package buttons (initialize, set status, score, location, suspend data, commit, finish), close the tab mid-course, relaunch, and confirm location and suspend data resume.
3. Confirm the item completes by its rule: automatic settles graded modules from pass or fail, a 1.2 quiz with a manifest mastery score does not complete on `completed` alone, three modules complete in any order only after the last one, and a failed module restarts fresh on the next launch.
4. Confirm the streamed-content launcher finds the API on the content origin, frames the vendor origin, relays calls by `postMessage`, and reports completion.
5. Confirm package files come only from the content domain, forged and expired tokens return 401, and a token cannot read another prefix.
6. Confirm the second launch of a package in the same week serves its files from the edge cache (`cf-cache-status: HIT` in cloud).

## Reference

When a package misbehaves, run it in SCORM Cloud. If it fails there too, the package is at fault.

## Load testing

Load bullets from the same plan section are covered by `test/load/scorm-load.test.ts` (1,000 simulated learners committing every 30 seconds against the pure commit pipeline, plus the 64 KiB beacon budget and the 500 MB limit math), `apps/tenant-router/src/activity-content-load.test.ts` (200 learners opening the same package in one minute from the edge cache), and `apps/jobs/src/processors/activity-package/process-scorm-load.test.ts` (500 MB package with video processed through streaming uploads with flat memory). The full 500 MB staging run and the live `cf-cache-status: HIT` check run against a deployed content zone, not in CI.
