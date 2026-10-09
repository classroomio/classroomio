# SCORM Support Implementation Plan (v2)

Engineering breakdown of [`README.md`](./README.md). Every pull request below owns rows in [`activity-integration-map.md`](./activity-integration-map.md) (shown as “Map”); a PR is done when its rows are checked and their tests pass.

**Do not follow the prototypes in `prototypes/scorm-support/` for now.** They predate the activity content type and still show SCORM as a lesson. Build UI from `README.md` § Functional Requirements. The prototypes are rebuilt after sign-off and before PR 7 starts; until then they are not a reference for any PR.

Estimates assume one full-stack engineer who knows the codebase: about 14 to 16 weeks. Two engineers, one on the API, worker and Worker, one on the dashboard and player, finish in about 9 weeks of calendar time, because Foundations and Phase 1 must land in order before most parallel work starts.

## Timeline

| Phase | Weeks | Pull requests | Exit criteria |
| --- | --- | --- | --- |
| 0 · Spike and decisions | 1 | none (notes and fixtures) | A real SCORM 1.2 and 2004 package initialize, commit and resume across a reload, served from a second local origin |
| Foundations | 1.5 to 2 | 0, 0b, 0c, 0d | Students cannot write course content; lesson completion moves compliance records; characterization suite green in CI with Postgres; every content-type branch exhaustive; zero behaviour change |
| 1 · Activity platform, dark | 3 to 3.5 | 1, 2, 3, 4 | Activity rows inserted by tests show up correctly everywhere in map § 1 to 8; characterization suite unchanged; no production way to create one |
| 2 · SCORM packages | 2 | 5, 6, 7 | Upload, process and inspect a package in a course, behind the plan and license check |
| 3 · Player and run-time | 2.5 to 3 | 8, 9, 10 | Launch, resume and complete; progress, certificates and compliance update. Beta line |
| 4 · Results, SCORM courses, copying | 2.5 | 11, 12, 13 | Results and CSV, reset, SCORM courses, courses from packages, copy and templates with packages |
| 5 · Hardening and launch | 1 to 1.5 | 14, 15 | Acceptance criteria pass; docs published; license server issues `scorm` |

## Pull Request Sequence

One migration per PR, and only PR 1 and PR 5 add one. Titles follow Conventional Commits.

| # | Title | Depends on | Migration | Size |
| --- | --- | --- | --- | --- |
| 0 | `fix(api): restrict course content writes to the course team` | - | No | S |
| 0b | `fix(api): sync compliance progress on lesson completion` | - | No | S |
| 0c | `test: characterize course content, progress and copy behaviour` | - | No | M |
| 0d | `refactor: make course content type handling exhaustive` | 0c | No | M |
| 1 | `feat(db): add course activities and course format` | 0d | Yes | M |
| 2 | `feat(api): include activities in course structure, progress and lifecycle` | 1 | No | L |
| 3 | `feat(api): support activities in copy, templates, drafts and agents` | 2 | No | L |
| 4 | `feat(dashboard): render and navigate course activities` | 2 | No | L |
| 5 | `feat(db): add content package and SCORM tables` | 1 | Yes | M |
| 6 | `feat(activity): upload and process SCORM packages` | 5 | No | L |
| 7 | `feat(dashboard): add SCORM packages to courses` | 4, 6 | No | M |
| 8 | `feat(activity): serve packages from a separate content origin` | 5 | No | M |
| 9 | `feat(tenant-router): serve and cache activity content at the edge` | 8 | No | S |
| 10 | `feat(activity): launch SCORM packages and save learner progress` | 0b, 7, 8 | No | L |
| 11 | `feat(activity): add SCORM results, attempts and progress reset` | 10 | No | M |
| 12 | `feat(course): add SCORM courses` | 7, 10 | No | M |
| 13 | `feat(activity): create courses from packages and copy packages` | 3, 12 | No | M |
| 14 | `feat(activity): add run-time diagnostics` | 11 | No | S |
| 15 | `docs: document SCORM packages, SCORM courses and licensing` | 12 | No | S |

Before each PR, run the checks from `CLAUDE.md` for the areas touched, on Node 20, plus the regression suites:

```bash
export PATH="$HOME/.nvm/versions/node/v20.19.3/bin:$PATH"
pnpm --filter @cio/api^... build && pnpm --filter @cio/api build
pnpm --filter @cio/api exec vitest run
pnpm --filter @cio/utils test
pnpm --filter @cio/dashboard test
cd apps/dashboard && npx svelte-check --threshold error
pnpm format:check
```

For the dashboard, use svelte-check and Vitest instead of the Vite build, which runs out of memory on development machines. Compare the svelte-check error count with the baseline taken before the PR (the repository has about 270 pre-existing errors); a PR must not add any.

Run `cd apps/dashboard && pnpm translate` whenever `en.json` changes, then check that `{placeholders}` survived. Run `pnpm --filter @cio/ui prefix:check:staged` if anything under `packages/ui/src` changes.

**Merge rule for every PR from 0d on:** the characterization suite (PR 0c) must pass unchanged. A PR that needs to change a snapshot must point to the PRD line that makes the change intended; otherwise it is a regression.

## Phase 0 · Spike and Decisions

- Sign off the proposed decisions in `README.md`. Then rebuild the prototypes for revision 3 (activity content type, SCORM courses, plan and license states) and lift the “do not follow” notice in `README.md`.
- Register the content domain and add it to Cloudflare with a wildcard record.
- Confirm with whoever owns `enterprise-api.classroomio.dev` how a license gains the `scorm` feature, and schedule that change before the self-hosted release.
- Collect fixtures into `packages/activity-packages/test/fixtures/` with `ATTRIBUTION.md`:
  - two hand-written minimal packages, one per version, with a button for each API call and each exit value;
  - a hand-written SCORM 2004 package with three modules, one of them graded;
  - a hand-written SCORM 1.2 quiz package with `adlcp:masteryscore` in the manifest that never sets a status itself;
  - a hand-written streamed-content package: a launcher that finds the API and frames a page served from a second local origin, relaying calls by `postMessage`;
  - rejection fixtures: a SCO with an absolute `https://` launch URL, and a manifest with assets only;
  - Rustici’s golf examples (CC BY 3.0);
  - an Adapt Learning course built in-house (GPL-3.0, compatible with the repo’s AGPL-3.0 for test fixtures).
- Collect vendor exports locally only (not in git): Storyline 360 in 1.2 and 2004 4th edition, Rise 360, Captivate, iSpring, and Elucidat’s default export, which is a 7 KB package that streams content from Elucidat.
- Build a throwaway player on `http://content.localhost:3002` (browsers resolve `*.localhost` to loopback) that loads `scorm-again`, frames an extracted package, and posts commits to a stub.
- Answer these questions and record them in this folder:
  1. Is scorm-again’s default synchronous commit smooth enough, or is the asynchronous mode worth being non-compliant?
  2. With `sendFullCommit: false`, does the server merge cleanly, and does the Terminate beacon stay under 64 KiB with large suspend data?
  3. Does scorm-again accept SCORM 1.2 suspend data longer than 4,096 characters?
  4. Does Chrome’s Permissions-Policy opt-out for `unload` on content-host responses restore old packages’ `onunload` saves?
  5. Do new-window mode and resume after reload work in Safari on iOS?
  6. Which LMS-side rules does scorm-again already apply: SCORM 1.2 `completed` when `LMSFinish` arrives with no status, the mastery-score override, the 2004 threshold and passing-score evaluation? `applyLmsRules` must not apply them twice.
  7. Does a SCORM 1.2 package that exited without `suspend` resume cleanly when relaunched with `entry = resume` and its suspend data?
  8. When the activity page swaps the iframe to another module, does the outgoing module’s final commit land before the next launch reads state?
  9. Does a Worker `cache.put` of R2 responses with `Cache-Control: immutable` give `cf-cache-status: HIT` on the second request on our Cloudflare plan, and what file size limit applies?
- Record a baseline per fixture: version, SCO count, whether it sets `exit`, suspend data size, file count, total size, sequencing in the manifest, pass mark in the manifest.

## Foundations (no behaviour change)

### PR 0 · Restrict course content writes to the course team

- Lesson create, update and delete in `apps/api/src/routes/course/lesson.ts` use `courseMemberMiddleware`, which accepts students. The same was reported for `lesson-language.ts`, `section.ts` and `exercise.ts`.
- Switch them to `courseTeamMemberMiddleware`, or its automation-key variant where MCP authoring must keep working.
- Check that ids in the path belong to `:courseId`.
- Tests: students get 403 on every write route; tutors and admins still succeed; a cross-course id returns 404.

### PR 0b · Sync compliance progress on lesson completion

- Extract the shared part of `syncComplianceProgressFromSubmission` (`apps/api/src/services/course/compliance.ts`) into `syncComplianceProgressForMember(courseId, profileId, source)`.
- Call it after `evaluateCourseCertification` in the lesson completion and watch-progress routes (`apps/api/src/routes/course/lesson.ts`). PR 10 adds the activity call.
- Fill `time_spent_minutes` when a caller supplies it. SCORM will.
- Tests: a compliance course with only lessons becomes `compliant` when the last lesson completes; submissions still sync as before.

### PR 0c · Characterization tests (Map § 12)

| Area | Files | Work |
| --- | --- | --- |
| CI | `.github/workflows/package-build-check.yml` | Postgres 16 service, migrations, `DATABASE_URL`, so database-backed tests run instead of skipping |
| Fixtures | `apps/api/src/__tests__/fixtures/course-content-fixtures.ts` | Builders for five courses with no activities: grouped, ungrouped, compliance with a final exercise, template-derived, locks with sequential progression; two students with partial progress, one with a certificate |
| Database | `apps/api/src/__tests__/characterization/*.db.test.ts` | Snapshot every function in Map § 3b plus 3.1, 3.6, 3.23, 3.24, 3.25 |
| Services | same folder | Snapshot the service list in Map § 12 |
| Dashboard utilities | `C/utils/content.test.ts`, `content-navigation.test.ts` (extend), `content-lock-utils.test.ts`, `content-completion.test.ts`, `ui/course-landing-page/utils.test.ts` (extend) | Snapshot the utility list in Map § 12 |
| Playwright | `e2e/regression/course-content.spec.ts` | Create a section, lesson and exercise; reorder; lock and unlock; complete a lesson as a student; submit an exercise; check the progress ring, the next-item button and the certificate |

Snapshots are explicit expected values in the test files, not generated snapshot files, so a diff in review shows exactly what changed.

### PR 0d · Exhaustive content-type handling

No behaviour change; PR 0c proves it. Map rows 1.2, 1.5, 1.6, 1.7, 3.2, 4.1, 4.2, 4.3, 4.15, 4.21, 6.5, 7.3, 7.15:

- Add `assertNever` to `packages/utils/src/functions/assert-never.ts`.
- Replace every `if (type === Lesson) … else …` that treats the `else` as an exercise with an exhaustive `switch`.
- Derive `ZCourseContentUpdateItem`, `ZCourseContentReorderItem`, `ZCourseContentDeleteItem` and `reorderContentParam` from `ContentType` instead of string literals.
- Make unknown types throw in `applyCourseContentBulkUpdates`, `normalizeDeleteItems`, `itemBlocksProgression` and `annotateNavigableAccess`.
- Delete `apps/api/src/services/course/utils.ts`’s copy of `buildCourseContent` and import the one in `packages/core`.
- Tests: the characterization suite; new unit tests that an unknown type throws in each place above.

## Phase 1 · Activity Platform (dark)

Nothing in this phase lets a production user create an activity. Tests insert `course_activity` rows directly.

### PR 1 · Schema and shared contracts (Map § 1, § 2.1–2.4, 3.9)

| Area | Files | Work |
| --- | --- | --- |
| Constants | `packages/utils/src/constants/content.ts`, new `activity.ts`, new `course-format.ts` | `ContentType.Activity`, `ACTIVITY_KINDS`, `COURSE_FORMAT_VALUES` |
| Schema | `packages/db/src/schema.ts`, `relations.ts` | `course.format`; `course_activity`; `activity_completion`, as defined in `README.md` |
| Migration | `packages/db/src/migrations/0031_course_activities.sql`, `meta/_journal.json` | Generate with `pnpm --filter @cio/db db:generate`. Read the SQL line by line: the snapshot disagrees with migration 0017 on three foreign keys, so the diff may try to revert them. Run the high-water-mark check from `CLAUDE.md` and renumber if main moved |
| Types | `packages/db/src/types.ts` | `TCourseActivity`, `TActivityCompletion` and their `TNew…` forms; `TCourseFormat` |
| Queries | `packages/db/src/queries/activity/activity.ts`, `queries/index.ts` | Map 3.9 |
| Validation | `packages/utils/src/validation/activity/activity.ts`, `course/course.ts` (`format` on create, `scorm → standard` only on update) | Schemas from `README.md` |
| Registry | `packages/core/src/services/activity/providers/index.ts`, `types.ts` | `ActivityProvider` interface and an `ACTIVITY_PROVIDERS` record with a stub SCORM provider whose launch returns “not available yet” |
| Tests | `packages/db` and `packages/utils` | Migration applies on a copy of the seeded database; existing rows get `format = 'standard'`; characterization unchanged |

### PR 2 · Server plumbing (Map § 3a, 3b, 3c except copy rows, 4a, 4b, 4d, 5.3)

| Area | Files | Work |
| --- | --- | --- |
| Content listing | `packages/db/src/queries/course/content.ts`, `content-batch.ts`, `packages/core/src/services/course/utils.ts`, `content.ts`, `section.ts`, `course.ts`, `slug.ts` | Activity branch in the union, bulk updates, reorder, update, delete, promote ungrouped, grouping toggle, slugs; section delete guard `SECTION_HAS_ACTIVITIES` |
| Progress | Every file in Map § 3b | `isActivityCompletedSql` added to all 13 calculations; new activity counts in responses |
| Progression and access | `packages/utils/src/functions/course-progression.ts`, `packages/core/src/services/course/progression.ts`, `apps/api/src/services/course/access.ts` | Activity rules; widened types |
| Completion | `packages/core/src/services/activity/activity.ts`, `apps/api/src/services/course/completion.ts`, `apps/api/src/utils/course-completion.ts`, `compliance.ts` | `completeActivityOnce`, `runActivityCompletionSideEffects`; certification and compliance include activities |
| Lifecycle | `reset-progress.ts`, `member-lifecycle.ts`, `scripts/lib/org-deletion.ts` | Map 3.23, 3.27, 3.30 |
| Guards | `packages/core/src/services/course/course.ts` `updateCourse`, `public-course-guard.ts` | Refuse `PUBLIC` while activities exist |
| Go-live | `go-live-readiness.ts` | Activities count; `ACTIVITY_NOT_READY` through the provider |
| Assets | `packages/core/src/services/assets/assets.ts`, `apps/api/src/routes/organization/assets.ts`, `packages/utils/src/validation/assets/assets.ts` | Target `activity`, slot `activity_package`, liveness |
| Analytics | `packages/core/src/services/course/course.ts`, `apps/api/src/services/organization.ts`, `apps/api/src/services/cohort/goal.ts` | Activity totals and rates |
| Routes | `apps/api/src/routes/course/activity.ts` (new, mounted in the course router), `content.ts` | Activity CRUD without kind data, lock, delete; content routes accept `ACTIVITY` |
| Tests | per row in the map | Mixed-course tests for every function changed; characterization unchanged |

### PR 3 · Copy, templates, drafts, MCP and agents (Map 1.9–1.12, 3.24–3.26, 3.28, 4c, § 6)

| Area | Files | Work |
| --- | --- | --- |
| Clone | `apps/api/src/services/course/clone.ts` | Copy activities and `course.format` through provider `copy`; never learner state |
| Templates | `course-template.ts`, `template-sync.ts`, `packages/utils/src/validation/course/template-sync.ts`, `packages/db/src/queries/course/template-sync.ts`, `course-template.ts` | Preview, stamping, `activity` unit kind, order shifting |
| Drafts and public API | `apps/api/src/services/course-import/course-import.ts`, `packages/utils/src/validation/course-import/course-import.ts`, `apps/api/src/services/v1/courses/course.ts`, `packages/utils/src/validation/public-api/*` | Activities as references; activity-only courses; replace mode never deletes them; `ACTIVITY_SECTION_REMOVED` |
| MCP | `packages/mcp/src/tools/course-drafts.ts`, `analytics.ts` | Descriptions and draft guidance |
| Agents | `packages/core/src/services/agent/chat-tools.ts`, `chat-context.ts`, `apps/api/src/services/agent/student-tools.ts`, `packages/ai-assistant/src/tools/shared.ts`, `apps/api/src/routes/agent/agent.ts`, `packages/utils/src/validation/agent/agent.ts`, `packages/db/src/queries/agent/chat-resource.ts` | Structure, reorder, `activityId` context, outline and search |
| Tests | `course-template-integrity`, `template-sync`, `asset-transfer`, draft publish (new), `services-v1-*`, `student-tools`, public API contract tests | Activity cases; characterization unchanged |

### PR 4 · Dashboard plumbing (Map § 7a–7e, 7g, § 8)

| Area | Files | Work |
| --- | --- | --- |
| Utilities | `C/utils/content.ts`, `content-navigation.ts`, `content-lock-utils.ts`, `content-completion.ts`, `toggle-lesson-completion.ts`, `sidebar-routes.ts`, `functions.ts`, `mobile-bottom-nav.ts`, `compliance-utils.ts`, `ai-assistant/utils/content-ask-ai-bar.ts` | Activity definitions, routes, counts, the shared completion helper |
| Content authoring | `C/pages/lessons.svelte`, `C/components/lesson/*`, `content-count-badges.svelte`, `course-content-icon.svelte`, `C/api/content.svelte.ts`, `course.svelte.ts`, new `C/api/activity.svelte.ts` | Activity rows, reorder, lock, delete, counts |
| Navigation | `C/components/sidebar/*`, `C/components/mobile/*`, `content-navigation-actions.svelte`, `student-content-locked-notice.svelte`, `routes/(app)/courses/[id]/+layout.svelte`, `course-header.svelte` | Activity rows and params |
| Route | `routes/(app)/courses/[id]/activities/[activityId]/+page.server.ts`, `+page.svelte`, `features/activity/pages/activity.svelte` | Page that shows “not available yet” until PR 7 and PR 10 add the editor and player |
| Lists and progress | course cards, lists, LMS dashboards, audience cards, widget panel, landing-page utils, analytics pages, progress card, template components, AI assistant mentions | Activity counts and rows |
| Shared UI | `packages/ui/src/custom/org-landing-page/course-curriculum.svelte` and theme curricula, icons | Activity rows; Storybook stories updated |
| Copy | `en.json` and the ten other locales | Map 7.53 |
| Tests | PR 0c dashboard tests extended with activities; `svelte-check` | Characterization unchanged |

## Phase 2 · SCORM Packages

### PR 5 · Package and SCORM schema, `packages/activity-packages` (Map 2.5, 2.6)

| Area | Files | Work |
| --- | --- | --- |
| Shared package | `packages/activity-packages/package.json`, `src/zip/`, `src/scorm/manifest/`, `src/scorm/runtime/`, `src/token/`, `src/content-types.ts` | Pure functions only: ZIP entry checks; SCORM manifest parsing and version detection (pass marks, external launch URLs, asset-only manifests); CMI normalization and limits; LMS rules; outcome mapping; `isScormRuleMet` with the module rollup; `statusAfterTerminate` per version; launch and content tokens with WebCrypto; extension-to-content-type map. Depends on `fast-xml-parser` only |
| Schema | `packages/db/src/schema.ts` | `content_package_version`, `content_package_unit`, `activity_scorm`, `scorm_attempt`, `scorm_sco_attempt`, `scorm_session_event` |
| Migration | next free number after PR 1 | Same checks as PR 1 |
| Queries | `packages/db/src/queries/activity/package-version.ts`, `package-unit.ts`, `packages/db/src/queries/scorm/*` | README § Query Layer |
| Tests | `packages/activity-packages/src/**/*.test.ts` | Parser: 1.2, 2004 2nd to 4th editions, nested root folder, missing manifest, invalid XML, DOCTYPE, missing launch file, `xml:base`, absolute launch URL, assets only, pass marks (`masteryscore`, `minNormalizedMeasure` with and without `satisfiedByMeasure`), several organizations, items without resources, both attribute casings. ZIP checks. Outcome mapping and the LMS rules. Rollup: one module, three modules in any order, a graded module among ungraded ones, a failed module, the score rule averaging only modules that report a score, assets ignored. `statusAfterTerminate`: every exit value in both versions. Tokens: sign, verify, expire, tamper, week rollover |

### PR 6 · Upload and processing (Map 4.41, § 5.1)

| Area | Files | Work |
| --- | --- | --- |
| Storage config | `packages/core/src/config/storage.ts`, `apps/jobs/src/config/storage.ts`, `docker-compose.yaml`, `docker-compose.images.yaml`, `docker/coolify/docker-compose.yaml` | Private bucket `OBJECT_STORAGE_BUCKET_SCORM` (default `scorm`); the storage init container creates it without anonymous access |
| Limits and types | `packages/utils/src/config/upload-limits.ts`, `packages/utils/src/validation/constants.ts` | `UPLOAD_MAX_SCORM_MB` (500); accept `application/zip`, `application/x-zip-compressed` and an empty type, because browsers report ZIPs inconsistently. The worker checks the magic bytes |
| Plan and license | `packages/utils/src/license/constants.ts`, `plan-features.ts`, `apps/api/src/services/activity/plan.ts` | `LICENSE_FEATURE.SCORM`; Early Adopter gains it; `assertActivityKindAllowed`: cloud checks `planName !== PLAN.BASIC` like `certificate-plan.ts`, self-hosted calls `isFeatureLicensed('scorm')`; throws `UPGRADE_REQUIRED` or `FEATURE_REQUIRES_LICENSE` |
| S3 helpers | `packages/core/src/utils/s3.ts` | Presigned PUT for the ZIP, `HeadObject`, ranged `GetObject` stream |
| Services | `packages/core/src/services/activity/packages.ts`, `packages/core/src/services/jobs/activity-package-jobs.ts` | Create asset (kind `scorm`, status `processing`) and version 1; process; new version; make current; delete (blocked by `activity_scorm` foreign key) |
| Jobs | Map 5.1, `apps/jobs/src/utils/storage.ts`, `apps/jobs/src/index.ts`, `apps/jobs/package.json` | `activity-package` queue (3 attempts, exponential backoff); worker concurrency 1; SCORM processor per `README.md` § Package Processing using `yauzl`; streaming upload helper; `dev:activity-package` script |
| Routes | `apps/api/src/routes/activity/index.ts`, `packages.ts`, `apps/api/src/app.ts` | `.route('/activity', activityRouter)` once; sub-routers composed in `index.ts` |
| Storage summary | `packages/db/src/queries/assets/assets.ts`, `packages/core/src/services/assets/assets.ts` | SCORM bytes come from version rows (ZIP plus extracted); deleting an asset cleans up its prefixes |
| Tests | `apps/api/src/__tests__/activity-package*.test.ts`, `apps/jobs` processor tests | Services with mocked storage and queue; processor against fixtures; plan and license refusals in cloud and self-hosted modes |

### PR 7 · SCORM packages in courses (Map 4.11, 7.19, 7.20, 7.30)

| Area | Files | Work |
| --- | --- | --- |
| SCORM provider | `packages/core/src/services/activity/providers/scorm/*` | `createDetails`, `getEditorData`, `updateSettings`, `delete`, `goLiveBlockers`; attach a processed package |
| Routes | `apps/api/src/routes/course/activity.ts` | Kind data on GET, `settings`, `package`; plan or license check on authoring routes only |
| Create flow | `C/components/content/constants.ts`, `content-create-modal.svelte`, `features/activity/components/activity-create-stepper.svelte` | “SCORM package” option; hidden in `PUBLIC` and SCORM courses; plan pill in cloud, license notice on self-hosted |
| Editor | `features/activity/pages/activity.svelte`, `components/package-upload.svelte`, `package-details.svelte`, `package-settings.svelte`, `features/activity/api/*`, `utils/types.ts`, `utils/scorm-utils.ts` | Package, Instructions, Results (placeholder until PR 11), Settings tabs; upload with presigned PUT progress and `JobPoller`; details, warnings, replace, preview; settings; plan-lapsed and no-license states |
| Copy | translations | `activity.*`, `snackbar.activity.*` |
| Test ids | same components | `activity-package-dropzone`, `activity-settings` |
| Tests | route tests for gating; dashboard component tests | Free plan and unlicensed server get 403 on authoring and 200 on reads |

## Phase 3 · Player and Run-Time

### PR 8 · Content origin and content server

| Area | Files | Work |
| --- | --- | --- |
| Environment | `packages/core/src/config/env.ts`, `apps/api/.env.example`, `apps/dashboard/.env.example`, `.env.example`, compose files, `classroomio.sh` | `SCORM_CONTENT_ORIGIN` (self-hosted), `SCORM_CONTENT_DOMAIN` (cloud wildcard), `ACTIVITY_SIGNING_SECRET` (generated by `classroomio.sh`) |
| Host gate | `apps/api/src/middlewares/activity-content-host.ts`, `apps/api/src/app.ts` | On the content host, allow only `/activity/player`, `/activity/player-assets`, `/activity/content` and `/activity/scorm/runtime`; 404 for the rest. Runs before session lookup and CORS. Replaces the global secure headers with the content-host header table from `README.md` |
| Rate limits | `apps/api/src/middlewares/rate-limiter.ts`, `apps/api/src/utils/redis/key-generators.ts` | Exempt content-host paths from the global limiter; 60 run-time requests per minute per module try |
| Content route | `apps/api/src/routes/activity/content.ts` | Content-token check, path normalization and prefix check, case-insensitive index fallback, Range, stored content types, `Cache-Control: public, max-age=604800, immutable`. Modelled on `apps/api/src/routes/hls/hls.ts` |
| Player app | `apps/activity-player/`, `apps/api/src/routes/activity/player.ts`, `docker/Dockerfile.api` | Vite and TypeScript, SCORM adapter on `scorm-again` pinned; built into the API image; HTML with no cache, hashed assets immutable |
| CSP | `apps/dashboard/src/lib/utils/csp-domains.js`, `apps/dashboard/src/lib/utils/csp.ts` | Cloud: `https://*.{content domain}` in `frame-src`. Self-hosted: add `SCORM_CONTENT_ORIGIN` automatically |
| Tests | `apps/api/src/__tests__/activity-content*.test.ts` | App routes 404 on the content host; traversal rejected; prefix isolation; Range; cache headers; no `X-Frame-Options` on content responses; content token week rollover |

### PR 9 · Edge serving and caching in the tenant-router

| Area | Files | Work |
| --- | --- | --- |
| Handler | `apps/tenant-router/src/activity-content.ts`, `apps/tenant-router/src/index.ts` | Serve `/activity/content/*` from R2, mirroring `handleHlsRequest`: content-token check, prefix check, Range, content types, `frame-ancestors`. `caches.default` lookup keyed by storage path plus an `anc` hash; `cache.put` on a miss for full (non-Range) responses. Forward `/activity/player*` and `/activity/scorm/runtime/*` to the API upstream as `/proxy` is forwarded |
| Config | `apps/tenant-router/wrangler.toml` | Route `*.{content domain}/*`; R2 binding for the `scorm` bucket; secret `ACTIVITY_SIGNING_SECRET` |
| Release | release checklist | The tenant-router is deployed by hand with `wrangler deploy`; this must ship before the cloud beta |
| Tests | Worker unit tests | Token rejected before any cache read; second request served from cache; different `anc` does not share a cache entry |

### PR 10 · Launch, player, saving and the module menu

| Area | Files | Work |
| --- | --- | --- |
| Launch | `apps/api/src/routes/course/activity.ts`, SCORM provider `launch` | `courseMemberMiddleware`, `assertEnrolledStudentContentAccess` with type Activity; the attempts policy from `README.md`, with module choice and `newAttempt`; team members get preview tokens; `anc` from the org’s tenant host, verified custom domain and `app.classroomio.com`; never plan- or license-gated |
| Run-time | `apps/api/src/routes/activity/runtime-scorm.ts`, `apps/api/src/services/activity/runtime-scorm.ts` | `GET state`; `POST commit` accepting JSON and `text/plain`; answers `{ "result": true, "errorCode": 0 }`; the commit transaction from `README.md`; side effects after commit, including `syncComplianceProgressForMember` |
| Player | `apps/activity-player/src/main.ts`, `scorm/adapter.ts`, `bridge.ts` | Bootstrap from `README.md`; flush on `pagehide`; parent messages with exact origins, including `terminated` with any `adl.nav.request`; “did not connect” after 30 seconds; new-window mode |
| Activity page | `features/activity/components/activity-player.svelte`, `module-menu.svelte`, `features/activity/pages/activity.svelte` | States from `README.md`, including not available yet, module complete, failed and review with **Start a new attempt**; module menu that relaunches on click; wide layout; full screen; accepts messages only from the content origin; completion through the shared `openCourseCompletionIfDone` |
| Compliance | SCORM provider `complianceSnapshot` | Best attempt score, attempt count, minutes from session times |
| Tests | `apps/api/src/__tests__/activity-runtime-db.test.ts`, player unit tests | Database-backed: one open attempt per learner even with two launches; resume; stale sequence ignored; passing commit writes `activity_completion` and claims the certificate; compliance record becomes compliant with score and minutes; a three-module item completes only after the last module, in any order; a failed module starts fresh on the next launch without retakes; 1.2 unfinished exit resumes and 2004 `normal` exit starts fresh; `newAttempt` is refused with retakes off and opens attempt 2 with them on; “move everyone” closes old-version attempts; launch works on the Free plan for an existing item. Unit: bridge drops messages from other origins |

## Phase 4 · Results, SCORM Courses and Copying

### PR 11 · Results, attempts and progress reset (Map 3.23, 3.27, 7.33, 7.34)

| Area | Files | Work |
| --- | --- | --- |
| Queries | `packages/db/src/queries/scorm/report.ts`, `outcome.ts` | Summary and learner rows from SQL aggregates over attempts and module tries, using `scormAttemptRollupSql`; nothing derived is stored |
| API | `apps/api/src/routes/course/activity.ts` results routes, SCORM provider `listLearnerSummaries`, `getLearnerDetail`, `resetLearner` | Results, learner detail grouped by attempt and module (interactions read from `cmi.interactions`), reset for one learner |
| Reset | `packages/db/src/queries/course/reset-progress.ts` | Provider `resetLearner` inside the reset transaction; impact counts include attempts |
| Dashboard | `features/activity/components/activity-results-panel.svelte`, `learner-attempts-sheet.svelte`, `C/components/people/student-course-rail.svelte`, `student-exercise-list.svelte`, `reset-progress-dialog.svelte` | Results tab with `ExportMenu`; student sheet; activity rows on the student page; reset bullets |
| Tests | database-backed | Outcome SQL matches the TypeScript mapping on the shared fixtures; reset leaves no attempts and rolls back with everything else |

### PR 12 · SCORM courses (Map 4.8, 4.14, 7.8, 7.10, 7.31, 7.38, 7.43, § 7f, 8.1)

| Area | Files | Work |
| --- | --- | --- |
| Create | `packages/core/src/services/course/course.ts` `createCourse`, `apps/api/src/routes/course/course.ts`, `packages/utils/src/validation/course/course.ts` | `format: 'scorm'` creates the course and one empty SCORM activity in one transaction, after the plan or license check |
| Guards | `assertCourseAcceptsContent` in `packages/core/src/services/course/content.ts`, called from lesson, exercise, section and activity create, draft publish to an existing course and the public API structure update | Refuse new content in a SCORM course; type limited to Self-paced or Compliance; the only activity can’t be deleted |
| Convert | `updateCourse`, `C/pages/settings.svelte` | `scorm → standard` only, with confirmation |
| Navigation | `C/components/sidebar/course-sidebar-navigation.svelte`, `constants.ts`, `C/utils/functions.ts`, footer and mobile nav | Package item in place of Content; hide Submissions, Marks, Attendance; hide previous and next |
| Entry | `C/pages/lessons.svelte`, `routes/(app)/courses/[id]/+page.svelte`, `C/utils/student-course-navigation.ts` | `/lessons`, `?next=true` and Continue go to the package |
| New course modal | `C/components/new-course-modal.svelte`, `features/activity/components/scorm-course-create.svelte` | “Build a course” or “Upload a SCORM package”; type, title, description |
| Display | course cards and rows, landing-page utils and curriculum components | “SCORM · N modules”; package and module list as the curriculum |
| Compliance | `getComplianceCompletionSnapshot` | Score, attempts and minutes from the package in a SCORM course |
| Tests | guard tests for every caller; navigation and entry utility tests; `update-course.test.ts`; Playwright `e2e/regression/scorm-course.spec.ts` | Standard courses unchanged (characterization) |

### PR 13 · Courses from packages and package copying (Map 3.26, 3.32, 4.29, 4.31, 4.39)

| Area | Files | Work |
| --- | --- | --- |
| Courses from packages | `packages/core/src/services/activity/courses.ts`, `apps/api/src/routes/activity/courses.ts`, `packages/utils/src/validation/activity/course.ts` | `POST /activity/courses` for 1 to 20 packages: one draft SCORM course per package with the package attached, title from the manifest, the chosen type; one transaction per course after checking every package first |
| Copy | SCORM provider `copy`, `packages/core/src/services/assets/asset-transfer.ts`, `template-sync.ts`, `template-assets.ts` | Same organization shares the package and adds a usage; another organization transfers the asset and all its versions’ prefixes; template sync detects package version changes |
| Media manager | `apps/dashboard/src/lib/features/media/pages/media.svelte`, `components/storage-cards.svelte`, `features/activity/components/courses-from-packages-dialog.svelte` | SCORM filter, usage, storage, module count, **Create course from package**, **Select** and **Create N courses** |
| Seed | `packages/db/src/utils/seed/scormActivities.ts` | Opt-in `SEED_SCORM=true` |
| Tests | `asset-transfer.test.ts`, `course-template-integrity.test.ts`, `template-sync.test.ts`, new course-from-package tests | Cross-org clone moves package bytes; learner state never copied |

## Phase 5 · Hardening and Launch

### PR 14 · Diagnostics

- Write `scorm_session_event` rows for launch, initialize, commit, terminate, beacon, errors and “did not connect”.
- Show them in the student sheet.
- Delete events older than 90 days and unpinned package versions 30 days after replacement in `apps/jobs/src/workers/maintenance.ts`.

### PR 15 · Docs and release (Map § 9)

- Help articles with framed 1350×830 screenshots, per `skills/add-docs-image/SKILL.md`:
  - `apps/help/content/help/build-courses/add-a-scorm-package.mdx`
  - `apps/help/content/help/build-courses/create-a-scorm-course.mdx`
  - `apps/help/content/help/analytics-and-reporting/review-scorm-results.mdx`
  - All added to `apps/help/blume.config.ts`.
- The build articles cover packages with several modules, failed learners trying again, the Passed rule for packages that report completed early, streamed packages and their limits, SCORM courses and converting them, and what happens when a plan or license lapses.
- Self-hosted setup: `apps/docs/content/docs/self-hosted/scorm.mdx` and `docker/docs/SELF_HOST.md`. Default to `content.yourdomain.com` with one DNS record and `SCORM_CONTENT_ORIGIN`; explain that a subdomain is a separate origin but the same site, and how to use a separate domain instead. Add the variable to the Coolify, Dokploy and Railway environment references.
- Licensing: `apps/docs/content/docs/self-hosted/101.mdx` and `enterprise.mdx` add SCORM to the enterprise list; the 101 wording is approved by the product owner.
- OpenAPI: `apps/docs/openapi/public-api.json` gains the activity fields.
- Playwright demo: `e2e/demos/scorm-package.spec.ts`, using the hand-written fixture.
- Release checklist: license server returns `scorm`; tenant-router deployed; content domain live; organization flag on for design partners.

### Compatibility Matrix

Run in Chrome, Edge, Firefox, Safari on macOS and iOS, and Chrome on Android; embedded and new-window; on a tenant subdomain and a custom domain; as an item in a standard course and as a SCORM course.

| Source | SCORM 1.2 | SCORM 2004 | What it exercises |
| --- | --- | --- | --- |
| Hand-written fixtures (in git) | Yes | Yes | Every API call, errors, resume, exit values, three modules, a 1.2 mastery score, a streamed-content launcher, the two rejections |
| Rustici golf examples (in git, CC BY 3.0) | Yes | 2nd to 4th | Multi-SCO and sequencing samples: module menu, rollup and the warnings |
| Adapt Learning (in git, GPL-3.0) | Yes | 4th | A single-page app with suspend data, using the pipwerks wrapper |
| Articulate Storyline 360 | Yes | 2nd to 4th | Large compressed suspend data, resume prompt, video, the mastery score in 1.2 quiz manifests; launch file `index_lms.html` |
| Articulate Rise 360 | Yes | Yes | Responsive layout, many small files; launch file `indexapi.html` |
| iSpring Suite | Yes | Yes | Slide conversions, new-window options |
| Elucidat | Yes | 2nd to 4th | The default export streams content from Elucidat |
| Adobe Captivate | Yes | Check | Quizzes, interactions, mastery score |

### Test Plan

- **Characterization (PR 0c)**: the zero-activity snapshots, on every PR.
- **Unit (Vitest)**: parser, ZIP checks, outcome mapping, completion rules, rollup, tokens, CMI limits, path normalization, player bridge, dashboard content utilities, `assertNever` paths.
- **API**: route authorization matrix (student, tutor, admin, other organization, Free plan, unlicensed self-hosted, expired token, wrong prefix), host gate, headers, cache headers, rate limits, SCORM course guards from every route.
- **Database-backed**: every function in Map § 3 with activities present; attach transaction; launch and resume; ordered commits; completion side effects; reset and its rollback; clone and template copying; draft publish in both modes.
- **Playwright**: `e2e/regression/course-content.spec.ts` (PR 0c), `scorm-course.spec.ts` (PR 12), and the package flow: upload the fixture, add it, launch as a student, press the fixture’s buttons, close the tab, relaunch, check resume and the completion tick; the three-module fixture through the module menu.
- **Security**: a fixture that tries to read `parent.document`, cookies and `/proxy` must fail; forged and expired tokens get 401; edge cache entries never cross organizations.
- **Load**: 1,000 simulated learners committing every 30 seconds; processing a 500 MB package with video while memory stays flat; 200 learners opening the same package in one minute served from the edge cache.
- **Reference**: when a package misbehaves, run it in SCORM Cloud. If it fails there too, the package is at fault.

### Rollout

- Phase 1 ships dark: production behaviour is unchanged and verified by the characterization suite.
- From Phase 2, an organization-level flag gates SCORM authoring for three to five design partners with SCORM libraries, then every paid organization in cloud.
- Self-hosted: released once the license server issues `scorm` and the self-hosted guide is published.
- Watch processing failures by error code, commit error rate, “did not connect” events, p95 commit latency, edge cache hit rate, storage growth and dead-letter jobs.
- Support playbook for “it is not tracking”: open the learner’s events, confirm Initialize and Commit, compare with SCORM Cloud, check the completion settings in the authoring tool.
- Update the website only at general availability. Say “Import and track SCORM 1.2 and 2004 packages”. Do not claim “SCORM certified”, full conformance or sequencing support.

## Later (not scheduled)

| Item | Why | Size |
| --- | --- | --- |
| cmi5 kind | Newer authoring exports; reuses the package pipeline, content origin and platform; needs a learning record store, for example Yet Analytics SQL LRS (Apache-2.0) | L |
| LTI 1.3 kind (ClassroomIO as platform) | Launch external tools inside courses; per-organization tool registrations, OIDC launch, Assignment and Grade Services | L |
| H5P kind | Interactive content; reuses the package pipeline and player with h5p-standalone | M |
| LTI 1.3 tool (ClassroomIO inside other LMSs) | Embed ClassroomIO courses in Canvas, Moodle and others | L |
| Results in the public API, then webhooks | Customers sync completions to HR and CRM systems; webhooks do not exist yet | M |
| Activities in the marks gradebook, and as a required final item | The marks query only knows exercises | S |
| Text extraction for the AI tutor and search | Package content is invisible to them | M |
| SCORM export, dispatch-style | Push ClassroomIO courses into partners’ LMSs while keeping content here | L |
| SCORM 2004 sequencing, or a SCORM Cloud provider | Only when a deal depends on it; scorm-again’s sequencing support may shrink the first option | L to XL, or M |
| Pin one module to its own item | Authors who want a library package split across a course | S |
| A limit on tries after failing | Some compliance programmes cap retries | S |
| SCORM in Public courses, played anonymously | Free samples and lead magnets; design in `README.md` decision 9 | M |
| Unify the existing lesson and exercise progress rules | Map § 11 | M |
| `__Host-` prefix on auth cookies | Hardens self-hosted against same-site cookie overwrites; logs everyone out once; its own security ticket | S |
