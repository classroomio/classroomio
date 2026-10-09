# SCORM Support PRD (v2)

## Status

- Draft, for review. Written 8 October 2026 from a fresh audit of the codebase (commits `05ac3248b` and `43d5a1efa`) and primary SCORM sources.
- Revision 2, 9 October 2026: one item per package with a module menu, “graded” settled from the manifest, attempts per SCORM version, the self-hosted content host, packages that stream content from elsewhere.
- **Revision 3, 9 October 2026 (this version):**
  - SCORM is a separate **activity** content type with its own tables, routes and pages, built generically so cmi5, LTI and H5P plug in later (decision 4).
  - **SCORM courses** are a course format whose navigation shows one Package item (decision 11).
  - SCORM is an **Enterprise feature**: every paid cloud plan, and a license key on self-hosted (decision 3).
  - A **zero-regression contract** with an exhaustive integration map (decision 13, [`activity-integration-map.md`](./activity-integration-map.md)).
  - Package files are cached at Cloudflare’s edge through a per-version content token (decision 14).
- This folder sits beside the earlier draft in `prd/scorm-support/README.md` and `prd/scorm-support/implementation-plan.md`. That draft is kept unchanged and was not used as a source.
- Decisions below are **proposed**. They become the contract once a reviewer signs them off.
- **This folder is the contract.** Implementing agents follow, in this order of authority:
  - this README for scope;
  - [`activity-integration-map.md`](./activity-integration-map.md) for every place the new content type touches;
  - [`implementation-plan.md`](./implementation-plan.md) for tasks.
- **Do not follow the prototypes for now.** They predate revision 3 and still show SCORM as a lesson (§ Prototypes). For UI, follow this README until they are rebuilt.
- Companion guide with a SCORM primer, an interactive run-time simulator, a curated reading path and architecture diagrams: <https://claude.ai/artifact/NMeoeHgKoG32AzA5gqLFyp> (private until shared from its Share menu). It is an explainer only. It predates revisions 2 and 3, and this folder wins wherever the two disagree.

## Prototypes — outdated, do not follow

> **The prototypes in `prototypes/scorm-support/` are outdated and must not be followed for now.** They were built for revision 2, where a SCORM package was a lesson. They do not show the separate activity content type, SCORM courses, the plan and license gating, or the removal of lesson-only controls (language picker, version history, comments). Where they disagree with this README, this README wins. They will be rebuilt after this revision is signed off; until then, use them only to understand the general look of the package panel, the player and the Results tab.

Current files, with what is out of date in each:

| Surface | File | Out of date |
| --- | --- | --- |
| Add content modal | `add-content.html` | Creates a “SCORM lesson”; no Free-plan or no-license states |
| Package editor | `lesson-editor.html` | Shown as a lesson editor with a language picker and version history; Free-plan state blocks authoring on an empty lesson instead of the plan-lapsed and no-license states |
| Package settings | `package-settings.html` | Lesson wording; still has Lesson comments |
| Learner player | `player.html` | Lesson wording and language picker; its single-package-course state is replaced by SCORM courses (decision 11); no “not available yet” state |
| Results | `results.html` | Lesson wording |
| Media manager | `media.html` | “Course from package” creates a standard course with one lesson and offers Live class, instead of a SCORM course |
| Student page | `people-learner.html` | “SCORM lessons” wording; failed learners shown as stuck unless reset |
| SCORM course | not built | New course flow, Package nav item for admins and learners, course cards, convert to standard |

UI calls the earlier prototypes made, still part of this design and for the reviewer to confirm:

- SCORM items get four tabs: Package, Instructions, Results, Settings. Results live on the item.
- Learners see a status pill in place of “Mark as complete”, and a save indicator under the package.
- An xAPI or cmi5 ZIP gets its own error message, so authors know to re-export as SCORM.
- The module menu sits above the player as a row of chips, not in the course sidebar, so the sidebar keeps one row per item.
- A retake starts from a **Start a new attempt** button in the review banner, never automatically on launch.
- Bulk course creation lives in the Media Manager’s SCORM filter, behind a **Select** button.
- In a SCORM course the Package nav item sits where Content sits today and behaves like every other nav item: click to enter, nothing to expand.

## Customer Documentation Draft

### Overview

SCORM is the format most e-learning tools export to: Articulate Storyline and Rise, Adobe Captivate, iSpring, Elucidat, Lectora and others. With SCORM support you upload the ZIP file those tools produce and run it in ClassroomIO, either as an item inside a course or as a course of its own. ClassroomIO saves each learner’s progress, score, time and where they left off, and a SCORM package counts toward course progress, certificates and compliance like a lesson or an exercise.

SCORM packages are an Enterprise feature. In ClassroomIO Cloud they are included in every paid plan. On a self-hosted server they need an enterprise license key that includes SCORM.

### What you can do

- Upload SCORM 1.2 and SCORM 2004 packages.
- Add a package to any section of a course, next to lessons and exercises. A package with several modules stays one item, with a module menu inside it.
- Create a **SCORM course**: a course that is one package, with no sections or lessons to manage.
- Turn one package, or several at once, into SCORM courses from the Media Manager.
- Let learners leave mid-way and resume where they stopped.
- Decide what counts as complete: passing the package’s quiz, finishing it, or reaching a minimum score.
- See every learner’s status, score, time spent and attempts, and export them to CSV.
- Replace a package with a new version without disrupting learners who are part-way through.

### Adding a package to a course

1. Open the course and choose **Add content → SCORM package**.
2. Give it a title and drop your ZIP file on the upload area.
3. Wait while ClassroomIO checks and unpacks the package. Large packages can take a few minutes, and you can leave the page.
4. Review the package details. If the package contains several modules, they are listed, and learners pick them from a menu above the package. The item completes when every module does.
5. Choose the completion rule, then publish the course as usual.

You can move, lock and reorder a SCORM package like a lesson, and it follows the course’s sequential progression setting.

### Creating a SCORM course

Choose **New course → Upload a SCORM package**, pick Self-paced or Compliance, give it a title and upload the ZIP. The course navigation shows **Package** where other courses show Content. Learners click it to open the package. Certificates, compliance tracking, the landing page and People work as in any course.

To make several at once, open **Media Manager**, filter by SCORM package, choose **Select**, pick the packages and **Create courses**.

To add lessons or exercises later, open the course settings and choose **Convert to a standard course**. The package becomes the first item in the course. This can’t be undone.

### What learners see

The package opens in a large frame with a full-screen button. Packages with several modules show the modules above the frame, with a tick on each one finished; learners can open them in any order. Progress saves automatically. When the package reports that the learner finished or passed, the item is marked complete and the course moves on. Learners do not see a “Mark as complete” button on SCORM packages.

### Limits

- Packages up to 500 MB by default.
- SCORM 2004 sequencing rules (forced order between modules, pre-tests, rollup rules) are not enforced. ClassroomIO’s own course progression settings apply instead.
- SCORM packages are not available in Public courses, because those are taken without signing in. A course with SCORM packages can’t be switched to Public.
- SCORM packages have instructions in one language and no comments.
- Some packages stream their content from the vendor’s servers instead of carrying it in the ZIP (for example Rustici Dispatch packages and Elucidat’s default export). They work, but they report only what the vendor passes on, they need the vendor’s site to be reachable, and they stop working if your licence with the vendor ends.
- Content that exists only as a link to another website, without a SCORM ZIP, can’t be added as a package.
- xAPI, cmi5, AICC, LTI and H5P are not supported yet.

### Frequently asked questions

#### Why does my package say it “did not connect”?

The package never called the SCORM API. This usually means it was exported for the web rather than for an LMS. Re-export it with an LMS or SCORM publishing option.

#### What happens when a learner fails?

The package stays incomplete. The learner can open it again, and the module they failed starts from the beginning. There is no limit on tries.

#### Can learners retake a completed SCORM package?

By default a completed package reopens in review mode, and nothing changes. Turn on retakes in the package settings to add a **Start a new attempt** button to review mode. ClassroomIO keeps their best score, and the item stays complete.

#### Why did a learner complete the package before taking the quiz?

With the Automatic rule, a package that has no pass mark in its manifest counts as soon as it reports “completed”. A few packages report that at the end of the slides, before the quiz reports pass or fail. Set the rule to **Passed** for those packages.

#### What happens if our plan or license no longer includes SCORM?

Learners keep taking the packages you already have, and you can still see and export results. You can’t add new packages or change existing ones until SCORM is included again.

#### Is the score trustworthy enough for compliance?

The score comes from the package itself, as with every SCORM platform. For high-stakes certification, end the course with a ClassroomIO exercise as the graded step.

## Purpose

Let organizations bring the e-learning content they already own into ClassroomIO, run it safely, and have it count. Version 1 imports and plays SCORM 1.2 and 2004 packages as a new **activity** content type, saves learner state reliably, maps results onto course progress, certificates and compliance, and reports per learner. It also offers SCORM courses for customers whose courses are whole packages. The reference experience is SCORM Cloud’s player and reporting, minus its sequencing engine. The activity platform underneath is built so cmi5, LTI 1.3 and H5P can be added as further kinds without touching course plumbing again.

## Problem Statement

- Companies moving their academy to ClassroomIO arrive with SCORM libraries they cannot use today.
- Off-the-shelf compliance content (security awareness, privacy, workplace conduct) is sold as SCORM, and compliance training is one of ClassroomIO’s three core use cases.
- “Does it support SCORM?” is a procurement checkbox. Without it, some evaluations end before a demo.
- Rebuilding packaged courses as native lessons loses their interactivity and takes weeks.
- The other packaged and launched formats buyers ask for (cmi5, LTI tools, H5P) need the same course plumbing, so building it once matters.

## Proposed Decisions

These are recommendations from the research and the review rounds. Each needs a reviewer’s sign-off before phase 1.

1. **Content origin**: packages, the player page and the run-time endpoint are never served from the app origin.
   - Cloud: a dedicated registrable domain with one subdomain per organization, for example `{orgKey}.classroomio-content.com`. `orgKey` is a stable short id derived from the organization id, not the editable site name. ClassroomIO buys the domain once; customers buy nothing.
   - Self-hosted: one hostname under the operator’s existing domain, for example `content.yourdomain.com`, set with `SCORM_CONTENT_ORIGIN`. That is one DNS record, like the storage hostname the Docker, Coolify and Dokploy guides already ask for, and no second domain. § Architecture overview explains what a subdomain does and doesn’t protect.
2. **Run-time**: build on `scorm-again` (MIT), pinned to an exact version. ClassroomIO owns storage, launch, saving and reporting. A narrow provider interface keeps a SCORM Cloud implementation possible later.
3. **Plans and licensing**: SCORM is an Enterprise feature.
   - Cloud: included in every paid plan (Early Adopter and Enterprise). The Free plan shows the option with an upgrade prompt.
   - Self-hosted: needs `LICENSE_KEY` with the `scorm` feature, validated by the license server like SSO and token auth.
   - One server helper, `assertActivityKindAllowed(orgId, 'scorm')`, checks the plan in cloud and the license on self-hosted. Each provider names its license feature, so cmi5, LTI and H5P can be gated the same way.
   - Only authoring is gated: creating SCORM items and courses, uploading or replacing packages, changing package settings. Playback, review, results, export, reset and delete keep working. A lapsed plan or license, or the license server being unreachable for an hour (failures are cached that long), must never block learners or hide records.
   - The license server (`enterprise-api.classroomio.dev`, outside this repository) must start returning `scorm` for licenses that include it before the self-hosted release.
   - `apps/docs/content/docs/self-hosted/101.mdx` and `enterprise.mdx` add SCORM to the enterprise list. The 101 page says everything an LMS needs is free, so its wording changes too; the exact wording is the product owner’s call.
4. **Activity content type**: SCORM is a new course content type, separate from lessons and exercises.
   - It has its own tables (`course_activity`, `activity_completion` and per-kind tables), routes (`/courses/[id]/activities/[activityId]`), pages, editor, API and translations. No lesson or exercise table, route or component carries SCORM code.
   - It is generic. `course_activity.kind` is `scorm` in version 1. cmi5, LTI 1.3 and H5P are later kinds, each a provider that plugs into the same course plumbing (§ Activity platform).
   - Activities take part in everything structural that lessons and exercises do: sections, the shared order within a section, moving between sections, locks, sequential progression, course progress everywhere it is calculated, certificates, compliance, go-live checks, reset progress, clone, templates and template sync, drafts and the public API (placement only), the course landing page, course cards and student analytics. [`activity-integration-map.md`](./activity-integration-map.md) lists every place.
   - What activities do not get in version 1 is listed in the map’s § 10: comments, per-locale translations, version history, live-session fields, PDF export, the gradebook, `PUBLIC` courses, and creation through MCP or drafts.
5. **Default completion rule**: “automatic”, applied to each module.
   - A graded module counts when it reports passed. An ungraded module counts when it reports completed.
   - A module is graded when its manifest sets a passing score (SCORM 1.2 `adlcp:masteryscore`, SCORM 2004 `imsss:minNormalizedMeasure` with `satisfiedByMeasure="true"`), or once it has reported passed or failed.
   - Pass or fail always wins over completed, including in the same commit.
   - Settling “graded” from the manifest matters because Articulate puts a mastery score in the SCORM 1.2 manifest of its quiz packages, so those can’t complete on a bare “completed”.
   - Alternatives per item: completed, passed, or a minimum score.
6. **Attempts**: an attempt is one pass through the package, and it stays open until the completion rule is met.
   - Inside it, each module follows its SCORM version. SCORM 2004 resumes after `exit = suspend` and starts the module fresh after any other exit, as the spec defines.
   - SCORM 1.2 resumes an unfinished module whatever exit it sent. This is a deliberate exception: 1.2 leaves attempts to the LMS, many 1.2 packages never send `suspend`, losing progress is the most common SCORM complaint, and Moodle’s default (“force new attempt: no”) behaves the same way.
   - A learner who fails can always launch again; the failed module starts fresh. Version 1 has no limit on tries.
   - Once the rule is met, the attempt closes and relaunch opens review mode, which saves nothing.
   - Retakes are opt-in per item. With retakes on, review mode offers **Start a new attempt**, and the best score counts. A new compliance cycle starts a new attempt either way.
7. **Package size**: 500 MB default through `UPLOAD_MAX_SCORM_MB`. The worker checks the real object size; the browser’s figure is advisory only.
8. **Packages with several modules**: one activity per package.
   - A module menu above the player lists the launchable SCOs in manifest order. Learners can open them in any order.
   - The completion rule applies to every module (§ Status Mapping and Completion Rules).
   - Sequencing rules are ignored with a visible warning.
   - Pinning a single module to its own item is deferred.
9. **Public courses**: activities cannot be added to courses of type `PUBLIC`, and a course that has activities cannot be converted to `PUBLIC`. Anonymous play is a later project (it would mint the token from the public course tree as `mintPublicHlsCookie` does, save nothing on the server, and keep best-effort resume data in the content origin’s browser storage).
10. **Retention**: unpinned package versions are deleted 30 days after replacement. Diagnostic events are deleted after 90 days. The original ZIP of each version is kept for reprocessing.
11. **SCORM courses**: a course **format**, not a course type.
    - `course.format` is `standard` (every existing course) or `scorm`. It sits beside `course.type`, so a SCORM course is Self-paced or Compliance. Live class and Public don’t apply to a single package.
    - A SCORM course holds exactly one SCORM activity and no sections. Server guards refuse new sections, lessons, exercises and a second activity in it, whichever route or tool asks.
    - Admin navigation: **Package** replaces Content in the same position and opens the package editor. Submissions, Marks and Attendance are hidden. Everything else (News Feed, Certificates, Analytics, Compliance, Landing Page, People, AI Tutor, Settings) stays.
    - Learner navigation: **Package** replaces Content and its tree. It is a normal nav item: click to enter, nothing to expand. The module menu lives on the package page.
    - Created from **New course → Upload a SCORM package**, or from the Media Manager for one package or several at once.
    - **Convert to a standard course** in Settings sets the format to `standard`, keeps the activity as the first item, and brings Content back. It is one-way.
    - Course progress, certificates and compliance need no special case: the course has one item, and it is the activity.
12. **Packages that stream content from elsewhere**: supported as ordinary packages.
    - In a Rustici Dispatch package, Elucidat’s default export and similar, the ZIP holds a small launcher. The launcher runs on the content origin, finds the SCORM API as any package does, and frames or fetches the vendor’s content.
    - The content host’s CSP restricts only `frame-ancestors`, so those loads work.
    - Import rejects a SCO whose launch URL, after `xml:base`, points at another website, because content launched straight from another site can’t reach the API.
    - Content given only as a URL, without a package, is not supported; cmi5 and LTI are the standards built for that.
13. **Zero-regression contract**:
    - **Additive schema.** No lesson, exercise, section or submission column changes; `course.format` has a default.
    - **Zero-activity invariant.** For a course with no activities, every changed function returns exactly what it returns today. Characterization tests record today’s outputs before any change (PR 0c), and every later PR runs against them.
    - **Exhaustive types.** A no-behaviour-change refactor (PR 0d) makes every content-type branch exhaustive, so adding the new type fails the build wherever a decision is missing. That covers the silent fall-throughs the inventory found, such as “anything that isn’t a lesson is an exercise”.
    - **One predicate.** Activities are counted done by one predicate in all 13 progress calculations. Each calculation keeps its current lesson and exercise rule, even where those rules disagree today.
    - **Dark launch.** The activity platform ships before any way to create activities exists. SCORM authoring then rolls out behind the plan or license check and an organization flag.
    - Every touchpoint is a row in [`activity-integration-map.md`](./activity-integration-map.md) with an owning PR and a test.
14. **Package storage and delivery**: package files live in a private `scorm` bucket in the object storage the app already uses.
    - Cloud: Cloudflare R2. R2 is Cloudflare’s object storage. The CDN part is Cloudflare’s edge cache in front of it, which works on a private bucket only through a Worker.
    - The tenant-router Worker checks a per-version content token, reads the object from R2, and stores the response in Cloudflare’s cache keyed by storage path. Repeat requests are served from the edge, and the bucket is never public. A public bucket on a custom domain would skip the token check and expose paid content.
    - Self-hosted: the operator’s S3-compatible storage (bundled SeaweedFS by default, or R2 or S3), served by the API container. Because file URLs are stable per package version, an operator can put any CDN in front of the content hostname.

## Current-State Audit

| Capability | Current State | Notes |
| --- | --- | --- |
| Course structure | `course_section`, `lesson`, `exercise`, each with `order`, merged by `getCourseContentItems` (`packages/db/src/queries/course/content.ts`) as a `UNION ALL`. Lessons and exercises share one order space per section by convention | Add an activity branch and table; same order space |
| Content type enum | `ContentType { Section, Lesson, Exercise }` in `packages/utils/src/constants/content.ts`, used in about 60 files | Add `Activity` after the exhaustiveness refactor |
| Silent fall-throughs | `deleteCourseContent`, the agent’s `reorder_content`, `getItemPath`, `content-action-helpers.ts` treat any non-lesson as an exercise; `itemBlocksProgression` returns `false` and `annotateNavigableAccess` treats unknown types as complete; `applyCourseContentBulkUpdates` and `normalizeDeleteItems` drop unknown types | Fixed by PR 0d before the new type exists |
| Completion | `lesson_completion` (lesson × profile); exercise completion from submissions and `completion_policy`, by groupmember or profile depending on the query | New `activity_completion` (activity × profile) |
| Progress maths | 13 calculations with different rules (map § 3b), some ignoring exercises | Each gets activities through one predicate; their existing disagreements are left alone (map § 11) |
| Progression | `computeProgressionAccess` and `itemBlocksProgression` in `packages/utils/src/functions/course-progression.ts` | Activities block sequential progression until complete |
| Section delete | Lessons cascade; exercises have `no action` | Activities `restrict`, with a service check and a clear error |
| Certificates | `evaluateCourseCertification` runs after lesson completion, watch progress and submissions | Also after activity completion; activity-only courses are not “no content” |
| Compliance | `course_completion_record` moves only through `syncComplianceProgressFromSubmission`, called only from the submission service. `time_spent_minutes` is always 0 | PR 0b generalizes the sync; SCORM time can fill time spent |
| Course types and formats | `COURSE_TYPE` is `SELF_PACED`, `LIVE_CLASS`, `COMPLIANCE` or `PUBLIC`, one per course; 23 files branch on it | New `course.format` beside it |
| Course creation | `new-course-modal.svelte` (type, then title); `createCourse` in `packages/core/src/services/course/course.ts`; public API, clone, templates and draft publish also create courses | SCORM path in the modal; format carried by clone and templates |
| Drafts and public API structure | `buildCourseStructureSnapshot` throws on a course with no lessons; draft schema requires at least one lesson; replace mode deletes unreferenced content | Activities as references; activity-only courses valid; guards for SCORM courses |
| Assets | `assets` with a Zod-only `kind`, `asset_usages` with free-text slot types; only lesson targets are checked for liveness before delete | Kind `scorm`, target `activity`, slot `activity_package`, liveness for activities |
| Uploads | Single presigned PUT, no multipart, no zip type, advisory size check. Free-plan gating of uploads exists only in the dashboard | New zip presign route, worker-verified size, server-side plan or license check |
| `/proxy` | SvelteKit adapter-node caps bodies at 512 KiB on self-hosted and custom-domain hosts | Packages must never pass through the API body |
| Jobs | BullMQ queues in `packages/jobs`, workers in `apps/jobs`; `media_job` with stage, progress, retries, cancel, reaper, dead letters; `JobPoller` with ETag polling | New `activity-package` queue; reuse `media_job` and `JobPoller` |
| Serving file trees | `/hls/{assetId}/*` from R2 in the tenant-router Worker after an HMAC cookie check, or streamed by `apps/api/src/routes/hls/hls.ts`. No edge caching today | Same pattern on a separate origin, with a token in the path, Range, real content types and edge caching |
| Object storage | `packages/core/src/config/storage.ts`: buckets `videos`, `documents`, `media` on R2 or any S3-compatible store; `media` can have a public base URL | New private `scorm` bucket |
| Security headers | Hono `secureHeaders` on every API response: `X-Frame-Options: SAMEORIGIN`, COOP `same-origin`, `nosniff`. Dashboard CSP `frame-src` allow-list | Content-host responses need their own header policy |
| Rate limits | 100 requests per minute per user, or per IP when anonymous, across the whole API; refused requests count | Content and run-time paths need their own token-keyed limits |
| Domains | Cloud: `app.classroomio.com`, `*.myclassroomio.com`, `embed.classroomio.com` through the Worker; custom domains through Approximated (`apps/api/src/services/org/domain.ts`) to Render. Self-hosted: one domain, a dashboard hostname plus usually a storage hostname; the API is reached through the dashboard | Cloud: new content domain zone with a Worker route. Self-hosted: one more hostname under the same domain |
| Auth cookies | Better Auth with `cookiePrefix: 'classroomio'` and `crossSubDomainCookies: false` (`packages/db/src/auth.ts`), so cookies are host-only; no `__Host-` prefix | Matters for the self-hosted content subdomain (§ Architecture overview) |
| Plans | `PLAN.BASIC` is free; `EARLY_ADOPTER` and `ENTERPRISE` are paid. Server checks are per feature (`certificate-plan.ts` pattern) and short-circuit on self-hosted | SCORM check uses the license on self-hosted instead |
| Licensing | `requireLicense` (self-hosted only) gates SSO and token auth; features come from the license server and are cached for an hour. In cloud the dashboard derives features from the plan with `getLicenseFeaturesForPlan` | New `scorm` feature; Early Adopter gains it in cloud |
| Public conversion | `public-conversion-banner.svelte` and the type select switch a course to `PUBLIC` through `updateCourse` | Refuse while the course has activities |
| Reset progress | `resetStudentCourseProgress` in one transaction | Delete activity completions and attempts in the same transaction |
| Copy paths | `clone.ts`, `template-sync.ts`, `course-import.ts` copy lesson and exercise fields and child rows by name | Copy activities through providers; share packages in-org, transfer cross-org |
| Access control | Lesson, section and exercise write routes accept any course member, including students | Fix first (PR 0). Activity authoring routes use `courseTeamMemberMiddleware` |
| AI tutor and search | Read lesson title, note, English body and transcripts only | Activities expose title and instructions only |
| Test coverage | No tests for reorder, delete, certification, compliance sync, progression annotation, draft publish or most dashboard content utilities; no dashboard end-to-end specs; database tests skip without `DATABASE_URL` | PR 0c adds characterization tests and a Postgres service in CI |

## Product Goals

1. Org admins and tutors on a paid plan or licensed server can upload a SCORM 1.2 or 2004 package and add it to a course, or make it a SCORM course, in under five minutes.
2. Learners can take a SCORM package inside ClassroomIO, leave, and resume where they left off.
3. A SCORM package completes by its rule and drives course progress, certificates and compliance with no manual step.
4. Course teams can see status, pass or fail, score, time and attempts for every learner, and export them.
5. A malicious or broken package cannot read the learner’s session, the course page or another organization’s content.
6. Courses without activities behave exactly as they do today, proven by characterization tests (zero regression).
7. Adding cmi5, LTI 1.3 or H5P later means writing a provider and its tables, not changing course plumbing.

## Non-Goals (v1)

- The SCORM 2004 sequencing engine: rules, rollup rules across SCOs, shared global objectives. scorm-again 3.x says it implements sequencing, so the remaining cost is ours: switching modules when the engine asks, saving the activity tree and global objectives, and deciding who wins when the package and ClassroomIO’s progression disagree. Re-estimate when a deal depends on it.
- cmi5, xAPI, AICC, LTI and H5P kinds. The platform is designed for them (§ Extending to cmi5, LTI and H5P); the kinds themselves are separate projects.
- Exporting ClassroomIO courses as SCORM packages.
- Editing package contents inside ClassroomIO.
- Offline playback and the mobile app.
- Activities in `PUBLIC` courses.
- Comments, per-locale translations, version history, live-session fields and PDF export for activities.
- Activities in the marks gradebook, and an activity as the certificate’s required final item in standard courses.
- Creating or editing activities through MCP, drafts or the public API (they can be read, placed and reordered).
- Pinning one module of a package to its own item.
- A limit on how many times a learner who fails can try again.
- Content given only as a URL on another website, without a package.
- Text extraction from packages for the AI tutor and course search.
- Unifying the existing, inconsistent lesson and exercise progress rules (map § 11).

## Data Sources Checked

- `packages/db/src/schema.ts` — `course`, `course_section`, `lesson`, `exercise`, `lesson_completion`, `submission`, `assets`, `asset_usages`, `media_job`, `course_completion_record`, `groupmember`
- Every query module in `packages/db/src/queries/` that touches content or progress (map § 3)
- `packages/core/src/services/course/*`, `packages/core/src/services/lesson/lesson.ts`, `packages/core/src/services/assets/*`, `packages/core/src/services/agent/*`
- `apps/api/src/routes/course/*`, `routes/organization/*`, `routes/org-site/*`, `routes/v1/*`, `routes/agent/*`, `routes/hls/hls.ts`
- `apps/api/src/services/course/*`, `services/course-import/*`, `services/v1/*`, `services/agent/*`, `services/license.ts`, `middlewares/*`
- `packages/utils/src/constants/*`, `functions/course-progression.ts`, `functions/course-content.ts`, `validation/*`, `plans/*`, `license/*`
- `packages/jobs/src/*`, `apps/jobs/src/*`, `packages/mcp/src/tools/*`, `packages/ai-assistant/src/tools/*`
- `apps/dashboard/src/lib/features/course/**`, `features/lms/**`, `features/audience/**`, `features/media/**`, `features/ai-assistant/**`, `features/ui/course-landing-page/**`, `features/license/**`, `routes/(app)/courses/[id]/**`, `routes/(org-site)/course/**`
- `packages/ui/src/custom/org-landing-page/*`, `public-course/*`, `widget-layouts/*`; `apps/embeds`, `apps/course-app`
- `packages/db/src/auth.ts`, `apps/api/src/services/org/domain.ts`, `apps/tenant-router/src/index.ts`, `wrangler.toml`, `packages/core/src/config/storage.ts`
- `apps/docs/content/docs/self-hosted/*`, `apps/docs/openapi/public-api.json`, `docker-compose.yaml`, `classroomio.sh`, `docker/docs/SELF_HOST.md`
- Cloudflare R2 and cache documentation; cmi5 conformance requirements; LTI 1.3 and Advantage overviews; h5p-standalone and H5P xAPI forums (References)

---

## Functional Requirements

### 1. SCORM items in the course builder (admin, tutor)

- The add-content modal gains a fourth option, **SCORM package**, beside Section, Lesson and Exercise. It creates a `course_activity` of kind `scorm` in the chosen section and opens it in the package editor at `/courses/[id]/activities/[activityId]`.
  - Hidden in `PUBLIC` and `scorm`-format courses.
  - On the Free plan the option shows a “Paid plans” pill and opens the upgrade modal.
  - On an unlicensed self-hosted server it shows “Needs an enterprise license” and links to the licensing docs.
- The package editor has its own page, separate from the lesson editor. The header holds the title, lock, delete and save state; there is no language picker or version history. Four tabs:
  - **Package**: the panel below.
  - **Instructions**: optional rich text shown to learners above the player.
  - **Results**: § 4.
  - **Settings**: § 2.
- The package panel has these states:
  - **Empty**: a `FileDropZone` that accepts `.zip`.
  - **Uploading**: a progress bar driven by the presigned PUT, with cancel. The page cannot be left while uploading without a confirmation, as in `add-document-modal.svelte`.
  - **Processing**: the `media_job` stage (validating, extracting, uploading files, reading manifest) and percentage through `JobPoller`. The admin can leave the page.
  - **Ready**: title, SCORM version, file count, size, the pass mark when the manifest sets one, and the list of modules; warnings such as “sequencing rules ignored” or “file names differ in case”; buttons for **Preview**, **Replace package** and **Remove**.
  - **Failed**: a specific, translated reason (no `imsmanifest.xml`, an xAPI or cmi5 package, unsupported version, file too large, unsafe file paths, launch file missing, a module that launches from another website, nothing to track because every resource is an asset) and a **Try another file** action.
  - **Plan lapsed or no license**: authoring controls are disabled with a banner that explains learners can still take the package and results stay available.
- Packages with several modules show “This package has N modules” with the module list, and explain that learners pick modules from a menu above the package and that the completion rule applies to each module. A SCORM 2004 package with sequencing rules also shows “Sequencing rules are ignored”. Modules of type `asset` appear in the menu but don’t count toward the rule, because assets never talk to the API.
- In the content list, a SCORM item is its own row type with the package icon, a “SCORM” chip, its lock and its status. It moves, reorders and locks like a lesson.
- Deleting a SCORM item asks for confirmation and states that learners’ results for it are deleted; the package stays in the Media Manager.
- **Replace package** uploads a new version. Learners in the middle of an attempt keep the old version until they finish. A secondary action, **Move everyone to this version**, restarts in-progress attempts after a confirmation that states how many learners it affects.

### 2. Package settings (admin, tutor)

| Setting | Values | Default |
| --- | --- | --- |
| Completion rule | Automatic, Completed, Passed, Minimum score | Automatic |
| Minimum score | 0 to 100, shown only for Minimum score; compared with the average score of the modules that report one | 80 |
| Retakes | Off, On | Off |
| Launch mode | In the course, In a new window | In the course |

- Under the rule, a line says whether the package is graded: “This package has a pass mark of 80%, so students must pass it” or “This package has no pass mark, so students complete it by finishing it”.
- Choosing **Passed** for a package with an ungraded module shows a warning: a module that never reports passed keeps the item from completing.
- Settings save through the existing autosave and `UnsavedChanges` patterns.

### 3. Learner player (LMS)

- The activity page requests a launch and renders a sandboxed iframe on the content domain, wider than the `max-w-3xl` learner column, with a full-screen button.
- Packages with several modules show a **module menu** above the frame: one chip per launchable module with its title and a tick when it meets the rule, plus “N of M modules complete”. Learners can open any module. Switching ends the current module’s session, so its final save runs, then launches the chosen one. The page opens on the first module that hasn’t met the rule. On phones the chips scroll sideways.
- States:
  - **Not available yet**: the item has no ready package; a short notice, no frame.
  - **Loading**: skeleton frame until the player reports `ready`.
  - **Running**: the package. Progress saves on its own.
  - **Module complete**: after a module ends and others remain, a panel offers **Next module**.
  - **Failed**: the status pill says “Not passed yet”, and a line under the frame says the learner can open the package again for a fresh try. The next launch starts the failed module from the beginning.
  - **Did not connect**: shown when the package has not called Initialize 30 seconds after loading, with a short explanation and **Reload**.
  - **Completed**: the completion tick appears in the sidebar and header, and the course completion modal opens when the course is done, through the shared `openCourseCompletionIfDone` helper (map 7.6).
  - **Review**: a banner says results are already recorded and nothing in this session is saved. With retakes on, the banner has **Start a new attempt**.
  - **Expired**: shown when the 12-hour launch token expires, with **Reload**.
  - **Locked**: the existing `StudentContentLockedNotice` for teacher locks and sequential progression.
- No “Mark as complete” control appears for activities, in the header (`content-navigation-actions.svelte`) or in the mobile bottom bar (`course-mobile-bottom-nav.svelte`).
- On phones the player keeps the bottom padding so the fixed bottom bar and the Ask AI bar do not cover the package. New-window mode falls back to the course page on phones, because mobile browsers discard background windows.
- When a 2004 module sends `adl.nav.request = continue` and terminates, the page opens the next module, or offers the next course item after the last module.

### 4. Results and attempts (admin, tutor)

- A **Results** tab on the SCORM item, modelled on the compliance records table:
  - Summary: enrolled, started, completed, passed, average score.
  - Table: student, status, pass or fail, score, best score, time spent, attempts, last launched. Sortable and paginated, with `ExportMenu` CSV. Score is the attempt score: the average of the modules that report one. Attempts counts attempts, not module tries.
  - Empty state when nobody has launched yet.
- A **student sheet** opens from a row: every attempt, and inside it every module try with its status, score, time, location and exit, the answers the package reported, and (phase 5) the diagnostic events. It has **Reset for this student**.
- The course student page (`/courses/[id]/people/[personId]`) lists SCORM items with status and score next to exercises.
- Course progress reset (`reset-progress-dialog.svelte`) counts and clears activity completions and attempts.

### 5. Media manager

- A SCORM filter in `media.svelte`. Cards show title, version, size, module count and where the package is used, through `asset_usages` with target `activity`.
- Storage cards include SCORM packages: all versions’ ZIPs plus extracted files.
- Deleting a package used by an activity is refused with a list of those items and their courses.
- **Create course from package** on a package card opens a dialog with the course title (from the manifest), the course type (Self-paced or Compliance) and a preview of the SCORM course navigation. It creates a draft SCORM course.
- **Select** in the SCORM filter turns the cards into a selection. With packages selected, **Create N courses** opens the same dialog for all of them: one draft SCORM course per package, with one type for all. Processing or failed packages can’t be selected.

### 6. SCORM courses

- **New course** (`new-course-modal.svelte`) starts with a choice: **Build a course** (today’s flow, unchanged) or **Upload a SCORM package** (with the plan or license pill). The SCORM path asks for Self-paced or Compliance, a title and a description. Creating it makes the course and its one empty SCORM activity in one transaction and lands on the Package page, where the upload starts, exactly as for a SCORM item added to a course.
- **Admin navigation**: **Package** sits where Content sits, with the package icon, and opens `/courses/[id]/activities/[activityId]`. Submissions, Marks and Attendance are hidden. The Package page is the package editor with its four tabs.
- **Learner navigation**: News Feed (when the organization shows it), **Package**, Certificates. Package is a plain nav item: click to enter, no tree, no badges, nothing to expand. The footer’s Previous and Next buttons are hidden; the progress ring stays.
- `/courses/[id]/lessons`, `?next=true` and **Continue** buttons on learner home go straight to the package.
- The course landing page shows the package as the curriculum: its title, module count and module titles.
- Course cards and list rows show “SCORM · N modules” instead of lesson and exercise counts.
- Settings: course type limited to Self-paced and Compliance; grouping and progression settings hidden; **Convert to a standard course** with a confirmation that says it can’t be undone.
- Clone, save as template and create from template keep the format. A SCORM course’s only activity can’t be deleted; the editor offers **Replace package**, and the course can be deleted as usual.

### 7. Public org-site pages

- Activities never appear in `PUBLIC` courses (decision 9).
- The Public conversion banner and the course type setting refuse to switch a course with activities to `PUBLIC`, naming them. `updateCourse` enforces the same rule.
- On other course types, nothing changes: learners take courses in the authenticated `/courses/[id]` player on the tenant host or custom domain.

### 8. Access control, plans and licensing

- Package create, process, replace and delete: org admin or tutor (`orgTeamMember`). Activity create, update, settings, lock, move and delete: course team (`courseTeamMemberMiddleware`). Creating and changing SCORM items and courses also call `assertActivityKindAllowed(orgId, 'scorm')`; deleting doesn’t.
- Launch: course member, then `assertEnrolledStudentContentAccess` with type Activity, so teacher locks and sequential progression apply. Team members always get preview tokens, which save nothing. Launch is never plan- or license-gated.
- Results, export and reset: course team only; never gated.
- Content and run-time routes: tokens only, on the content host only.
- Course from package: org admin or tutor, plus the plan or license check; every package must belong to the organization and have a ready current version.

### 9. How activities behave everywhere else

[`activity-integration-map.md`](./activity-integration-map.md) is the authoritative list. In short:

| Area | Behaviour |
| --- | --- |
| Sections and order | Live in a section or ungrouped, share the section’s order with lessons and exercises, move and reorder like lessons; section delete refuses while a section holds activities |
| Locks and progression | `is_unlocked` like lessons; block sequential progression until complete |
| Course progress | Count as one item in every progress figure: course progress ring, learner home, course cards, People, Audience, analytics, compliance, dashboard stats, learning-path goals |
| Certificates | Count toward the completion threshold; an activity-only course can earn a certificate |
| Compliance | Activity completion syncs the compliance record; in a SCORM course the package supplies score, attempts and time |
| Go-live readiness | Count as learning items; a package without a ready version blocks going live |
| Reset progress | Clears activity completions and attempts with everything else, in one transaction |
| Clone and templates | Copied, with package sharing in-org and transfer across organizations; template sync detects and pulls activity changes |
| Drafts, public API, MCP | Listed in structures; can be placed and reordered; not created or edited |
| AI tutor and assistant | See title and instructions; mentions and context support activities |
| Landing page | Listed in the curriculum like lessons |

## Technical Design

### Architecture overview

```text
Learner browser
  Activity page (acme.myclassroomio.com or learn.acme.com)  /courses/:id/activities/:activityId
    ├─ module menu (packages with several modules)
    └─ iframe, sandboxed: Player page (k7f3q2.classroomio-content.com/activity/player/{launchToken})
         ├─ window.API / window.API_1484_11 (scorm-again)
         └─ iframe: package files (k7f3q2.classroomio-content.com/activity/content/{contentToken}/…)
              └─ optional: vendor frames or requests, for packages that stream content

Activity page ──/proxy, session──▶ API: POST /course/:courseId/activity/:activityId/launch (one module per launch)
Player ──launch token──▶ content host: /activity/scorm/runtime/{launchToken}/state, /commit
Package ──content token──▶ content host: /activity/content/{contentToken}/*

Cloud: content host → tenant-router Worker → edge cache → R2 for files; API upstream for player and run-time
Self-hosted: content.yourdomain.com → API container for everything
```

- The package and the API object share the content origin, which SCORM’s API discovery requires.
- The session cookie never reaches the content origin. Cookies are host-only today, and the cloud content domain is a separate registrable domain, so package code cannot plant cookies on ClassroomIO hosts either.
- The activity page and the player exchange UI events only, by `postMessage` with exact target origins on both sides. The module menu belongs to the activity page; switching modules asks the API for a new launch and swaps the iframe.
- Moodle, the Open edX SCORM XBlock and Frappe LMS all serve packages from the app origin. Moodle flags the capability `RISK_XSS`, and Frappe’s path guard names “same-origin stored XSS”. ClassroomIO is multi-tenant and one person can administer several organizations, so it follows Google’s `googleusercontent.com` model instead.
- On self-hosted, the content host is a subdomain of the operator’s domain. It is a different origin, so package code still can’t read the app’s pages, storage or responses, and host-only cookies are not sent to it. It is the same site, though, so package code could set a cookie for the parent domain that the app would receive.
  - With one organization, only the org’s own team can upload packages, so the risk is a malicious vendor package, not another tenant.
  - The self-hosted guide states the trade-off and supports a separate domain for operators who want full isolation.
  - Renaming the auth cookies with the `__Host-` prefix stops a sibling host from overwriting them. It logs everyone out once, so it ships as its own security ticket, not in this feature.

### Activity platform

The platform is the part every kind shares. SCORM is its first provider.

**Content type.** `ContentType.Activity = 'ACTIVITY'` joins Section, Lesson and Exercise. Every content item of that type carries `activityKind` (`scorm` in version 1). Course plumbing branches on `ContentType`; only providers branch on `activityKind`.

**Provider registry.** `packages/core/src/services/activity/providers/index.ts` exports `ACTIVITY_PROVIDERS: Record<TActivityKind, ActivityProvider>`. Because it is a `Record` over the kind union, adding a kind to `ACTIVITY_KINDS` fails the build until its provider exists.

```ts
export interface ActivityProvider {
  kind: TActivityKind;
  licenseFeature: LicenseFeatureId;
  /** Creates the kind's detail rows for a new activity inside the caller's transaction. */
  createDetails(activityId: string, input: unknown, tx: DbOrTxClient): Promise<void>;
  /** Returns the kind's editor data: package, versions, settings, warnings. */
  getEditorData(activityId: string): Promise<ActivityEditorData>;
  /** Validates and saves kind settings. Throws AppError on invalid input. */
  updateSettings(activityId: string, input: unknown, tx: DbOrTxClient): Promise<void>;
  /** Resolves what a launch opens: the player URL, mode and modules. Never writes completion. */
  launch(context: ActivityLaunchContext): Promise<ActivityLaunchResult>;
  /** Summary rows for the Results tab and People pages. */
  listLearnerSummaries(activityId: string, profileIds: string[]): Promise<ActivityLearnerSummary[]>;
  getLearnerDetail(activityId: string, profileId: string): Promise<ActivityLearnerDetail>;
  /** Deletes the kind's learner state for these activities and this profile, inside the caller's transaction. */
  resetLearner(activityIds: string[], profileId: string, tx: DbOrTxClient): Promise<number>;
  /** Copies the kind's detail rows (never learner state) to a new activity, in or across organizations. */
  copy(source: ActivityCopySource, target: ActivityCopyTarget, tx: DbOrTxClient): Promise<void>;
  /** Removes the kind's rows and asset usages before the activity row is deleted. */
  delete(activityId: string, tx: DbOrTxClient): Promise<void>;
  /** Go-live blockers, such as a package with no ready version. */
  goLiveBlockers(activityId: string): Promise<GoLiveBlocker[]>;
  /** Score, attempts and minutes for the compliance snapshot. */
  complianceSnapshot(activityId: string, profileId: string): Promise<ActivityComplianceSnapshot | null>;
}
```

**Shared completion.** Providers decide when their rule is met and then call one shared function, `completeActivityOnce(activityId, profileId, tx)`. It upserts `activity_completion` and returns whether the row changed from incomplete to complete. After the transaction commits, `runActivityCompletionSideEffects` calls `evaluateCourseCertification` and `syncComplianceProgressForMember`, the same path lessons use after PR 0b. Completion is sticky: a later failed retake never clears it.

**Shared predicate.** `isActivityCompletedSql(activityAlias, profileIdExpr)` in `packages/db/src/queries/course/progression.ts` is the only way SQL decides an activity is done. All 13 progress calculations use it (map § 3b).

**Shared launch, content origin and player.** The launch endpoint, content host, token signing, edge caching, rate limits and the player app are kind-agnostic. Each kind adds a run-time adapter to the player and its own run-time routes under `/activity/{kind}/…`.

**Shared package pipeline.** `content_package_version` and `content_package_unit` store any packaged format. The `activity-package` worker dispatches to a processor per format.

### Extending to cmi5, LTI and H5P

| Piece | SCORM (v1) | cmi5 | LTI 1.3 | H5P |
| --- | --- | --- | --- | --- |
| Course item, completion, progress, certificates, compliance, copy, reset | Shared platform | Shared | Shared | Shared |
| License feature | `scorm` | `cmi5` | `lti` | `h5p` |
| Package storage and processing | `content_package_*`, SCORM processor | Same tables; `cmi5.xml` processor; each AU is a unit | None; the tool hosts its content | Same tables; `h5p.json` processor; one unit |
| Content origin and tokens | Yes | Yes, for AUs inside the package; AUs can also be remote | No | Yes |
| Launch | Player page with the SCORM API | AU URL with `endpoint`, `fetch`, `actor`, `registration` and `activityId`; the LMS serves the token fetch and a learning record store | OIDC login initiation to the tool, then a signed `id_token` posted from the activity page | Player page with h5p-standalone |
| Run-time records | `scorm_attempt`, `scorm_sco_attempt` | `cmi5_registration` (one per enrolment or retake), statement store | `lti_tool` (per-organization registration: client id, deployment, keyset URL, login URL), `activity_lti` (resource link), `lti_score` (Assignment and Grade Services) | `h5p_attempt` |
| Completion rule | Rule over the CMI | `moveOn` per AU | Score and activity progress from Assignment and Grade Services | Root-level xAPI statement with `result.completion` (and `success`) |

Nothing in the shared column changes when a kind is added. Each new kind is its own PRD, with a provider, tables, a player adapter or launch flow, and a row in the add-content modal.

### Data Model

Learner state is keyed by profile, like `lesson_completion` and `lesson_video_progress`. Following the house rules, relational ids live in real columns and nothing derivable is stored: learner totals (best score, total time, attempt count) and module rollups are computed when read, and outcomes are derived from the stored CMI by one shared SQL expression.

#### Changed: `course.format`

```ts
format: varchar({ length: 16 }).default('standard').notNull(),
```

- Values from `COURSE_FORMAT_VALUES` (`packages/utils/src/constants/course-format.ts`). Existing rows get `standard`.
- `ZCourseCreate` gains an optional `format`; only the SCORM course flow and course-from-package send `scorm`. `ZCourseUpdate` accepts only `scorm → standard`.

#### Changed: Zod enums only

- `ContentType` gains `Activity`; `ACTIVITY_KINDS = ['scorm']`.
- Asset `kind` gains `'scorm'`; target type `'activity'`; slot type `'activity_package'` (`packages/utils/src/validation/assets/assets.ts`).
- For SCORM assets, `assets.storage_key` holds the package prefix `scorm/{assetId}`. `byte_size` is unused, because storage comes from the version rows.
- `LICENSE_FEATURE.SCORM = 'scorm'`; Early Adopter gains it in `getLicenseFeaturesForPlan`.

#### New Table: `course_activity`

```ts
export const courseActivity = pgTable(
  'course_activity',
  {
    id: uuid()
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    courseId: uuid('course_id').notNull(),
    sectionId: uuid('section_id'),
    kind: varchar({ length: 16 }).notNull(),
    title: varchar().notNull(),
    instructions: text(),
    slug: varchar(),
    order: bigint({ mode: 'number' }).notNull(),
    isUnlocked: boolean('is_unlocked').default(true).notNull(),
    sourceId: uuid('source_id'),
    sourceSyncedAt: timestamp('source_synced_at', { withTimezone: true, mode: 'string' }),
    createdByProfileId: uuid('created_by_profile_id'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull()
  },
  (table) => [
    foreignKey({
      columns: [table.courseId],
      foreignColumns: [course.id],
      name: 'course_activity_course_id_fkey'
    }),
    foreignKey({
      columns: [table.sectionId],
      foreignColumns: [courseSection.id],
      name: 'course_activity_section_id_fkey'
    }).onDelete('restrict'),
    foreignKey({
      columns: [table.sourceId],
      foreignColumns: [table.id],
      name: 'course_activity_source_id_fkey'
    }).onDelete('set null'),
    foreignKey({
      columns: [table.createdByProfileId],
      foreignColumns: [profile.id],
      name: 'course_activity_created_by_profile_id_fkey'
    }).onDelete('set null'),
    index('idx_course_activity_course_id').on(table.courseId),
    index('idx_course_activity_course_slug').on(table.courseId, table.slug),
    index('course_activity_source_id_idx')
      .on(table.sourceId)
      .where(sql`${table.sourceId} is not null`)
  ]
);
```

- The structural columns match `lesson` (`course_id`, `section_id`, `order`, `is_unlocked`, `slug`, `source_id`, `source_synced_at`), so the shared order space, locks, slugs and template sync work the same way.
- `instructions` is HTML in one language, sanitized like lesson notes. It stores what the author typed, nothing else.
- `section_id` is `restrict`; `deleteCourseSectionService` checks first and returns 409 `SECTION_HAS_ACTIVITIES` with the titles.

#### New Table: `activity_completion`

```ts
export const activityCompletion = pgTable(
  'activity_completion',
  {
    id: uuid()
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    activityId: uuid('activity_id').notNull(),
    profileId: uuid('profile_id').notNull(),
    isComplete: boolean('is_complete').default(false).notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true, mode: 'string' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull()
  },
  (table) => [
    foreignKey({
      columns: [table.activityId],
      foreignColumns: [courseActivity.id],
      name: 'activity_completion_activity_id_fkey'
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.profileId],
      foreignColumns: [profile.id],
      name: 'activity_completion_profile_id_fkey'
    }).onDelete('cascade'),
    unique('activity_completion_activity_profile_key').on(table.activityId, table.profileId)
  ]
);
```

- It records the moment the rule was met. It is not recomputed when settings change, like `lesson_completion`.

#### New Table: `content_package_version`

```ts
export const contentPackageVersion = pgTable(
  'content_package_version',
  {
    id: uuid()
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    assetId: uuid('asset_id').notNull(),
    versionNumber: integer('version_number').notNull(),
    isCurrent: boolean('is_current').default(false).notNull(),
    status: varchar({ length: 16 }).default('uploading').notNull(),
    format: varchar({ length: 16 }),
    manifestIdentifier: text('manifest_identifier'),
    title: text(),
    manifest: jsonb().$type<PackageManifestTree>(),
    warnings: jsonb().default([]).$type<PackageWarningCode[]>().notNull(),
    error: jsonb().$type<{ code: string; message: string } | null>(),
    uploadKey: text('upload_key').notNull(),
    contentPrefix: text('content_prefix').notNull(),
    zipBytes: bigint('zip_bytes', { mode: 'number' }),
    extractedBytes: bigint('extracted_bytes', { mode: 'number' }),
    fileCount: integer('file_count'),
    processingJobId: uuid('processing_job_id'),
    createdByProfileId: uuid('created_by_profile_id'),
    processedAt: timestamp('processed_at', { withTimezone: true, mode: 'string' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull()
  },
  (table) => [
    foreignKey({
      columns: [table.assetId],
      foreignColumns: [asset.id],
      name: 'content_package_version_asset_id_fkey'
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.processingJobId],
      foreignColumns: [mediaJob.id],
      name: 'content_package_version_processing_job_id_fkey'
    }).onDelete('set null'),
    foreignKey({
      columns: [table.createdByProfileId],
      foreignColumns: [profile.id],
      name: 'content_package_version_created_by_profile_id_fkey'
    }).onDelete('set null'),
    unique('content_package_version_asset_number_key').on(table.assetId, table.versionNumber),
    uniqueIndex('content_package_version_current_key')
      .on(table.assetId)
      .where(sql`${table.isCurrent}`)
  ]
);
```

- `status`: `uploading`, `processing`, `ready`, `failed`.
- `format`: `scorm12`, `scorm2004_2`, `scorm2004_3`, `scorm2004_4` in version 1; later `cmi5`, `h5p`.
- `manifest` holds the parsed manifest tree (identifiers, titles, hrefs as written in the file). It contains no ClassroomIO ids.
- `warnings` includes `has_sequencing` for SCORM 2004 packages with sequencing rules.
- Exactly one version per asset is current, enforced by the partial unique index. Making a new version current is one transaction that clears the old flag first.

#### New Table: `content_package_unit`

```ts
export const contentPackageUnit = pgTable(
  'content_package_unit',
  {
    id: uuid()
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    packageVersionId: uuid('package_version_id').notNull(),
    identifier: text().notNull(),
    parentIdentifier: text('parent_identifier'),
    title: text().notNull(),
    position: integer().notNull(),
    unitType: varchar('unit_type', { length: 8 }).notNull(),
    href: text().notNull(),
    parameters: text(),
    masteryScore: numeric('mastery_score'),
    launchData: text('launch_data'),
    formatDetails: jsonb('format_details').default({}).$type<PackageUnitFormatDetails>().notNull(),
    isVisible: boolean('is_visible').default(true).notNull()
  },
  (table) => [
    foreignKey({
      columns: [table.packageVersionId],
      foreignColumns: [contentPackageVersion.id],
      name: 'content_package_unit_package_version_id_fkey'
    }).onDelete('cascade'),
    unique('content_package_unit_version_identifier_key').on(table.packageVersionId, table.identifier)
  ]
);
```

- A unit is what a learner launches: a SCORM SCO or asset, a cmi5 AU, or the H5P main content.
- `unitType`: `sco` or `asset` for SCORM; later `au` or `main`.
- `masteryScore` holds SCORM 1.2 `adlcp:masteryscore` (and later cmi5 `masteryScore`). `launchData` holds `adlcp:dataFromLMS` (and later cmi5 launch parameters).
- `formatDetails` holds per-format values typed by format, with no ids: for SCORM 2004 `scaledPassingScore` (from the primary objective’s `minNormalizedMeasure`, only when `satisfiedByMeasure="true"`), `completionThreshold`, `maxTimeAllowed`, `timeLimitAction`.

#### New Table: `activity_scorm`

```ts
export const activityScorm = pgTable(
  'activity_scorm',
  {
    activityId: uuid('activity_id').primaryKey().notNull(),
    assetId: uuid('asset_id'),
    completionRule: varchar('completion_rule', { length: 16 }).default('auto').notNull(),
    minScorePercent: integer('min_score_percent'),
    allowRetakes: boolean('allow_retakes').default(false).notNull(),
    launchMode: varchar('launch_mode', { length: 16 }).default('embedded').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull()
  },
  (table) => [
    foreignKey({
      columns: [table.activityId],
      foreignColumns: [courseActivity.id],
      name: 'activity_scorm_activity_id_fkey'
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.assetId],
      foreignColumns: [asset.id],
      name: 'activity_scorm_asset_id_fkey'
    }).onDelete('restrict'),
    index('idx_activity_scorm_asset_id').on(table.assetId)
  ]
);
```

- `completionRule`: `auto`, `completed`, `passed`, `score`. `launchMode`: `embedded`, `window`.
- `onDelete('restrict')` on the asset makes “package in use” a database guarantee, not just a UI check.
- The row is created with the activity. `asset_id` stays null until the first package is processed and attached, which is the editor’s Empty state. Like an empty lesson, the item counts in progress from the start; learners see “This package isn’t available yet”, and go-live readiness blocks publishing while any activity has no ready package.

#### New Tables: `scorm_attempt` and `scorm_sco_attempt`

Two levels of attempt keep SCORM’s rules and ClassroomIO’s apart:

- `scorm_attempt` is an **attempt**: one pass through the package by one learner, pinned to one package version. Retakes, compliance cycles and “move everyone” create new ones.
- `scorm_sco_attempt` is a **module try** inside an attempt, holding that module’s CMI. SCORM’s exit rules create new ones (decision 6).

```ts
export const scormAttempt = pgTable(
  'scorm_attempt',
  {
    id: uuid()
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    activityId: uuid('activity_id').notNull(),
    profileId: uuid('profile_id').notNull(),
    packageVersionId: uuid('package_version_id').notNull(),
    attemptNumber: integer('attempt_number').notNull(),
    startedAt: timestamp('started_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    closedAt: timestamp('closed_at', { withTimezone: true, mode: 'string' }),
    closeReason: varchar('close_reason', { length: 16 })
  },
  (table) => [
    foreignKey({
      columns: [table.activityId],
      foreignColumns: [courseActivity.id],
      name: 'scorm_attempt_activity_id_fkey'
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.profileId],
      foreignColumns: [profile.id],
      name: 'scorm_attempt_profile_id_fkey'
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.packageVersionId],
      foreignColumns: [contentPackageVersion.id],
      name: 'scorm_attempt_package_version_id_fkey'
    }).onDelete('restrict'),
    unique('scorm_attempt_activity_profile_number_key').on(table.activityId, table.profileId, table.attemptNumber),
    uniqueIndex('scorm_attempt_open_key')
      .on(table.activityId, table.profileId)
      .where(sql`${table.closedAt} is null`),
    index('idx_scorm_attempt_activity_id').on(table.activityId)
  ]
);

export const scormScoAttempt = pgTable(
  'scorm_sco_attempt',
  {
    id: uuid()
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    attemptId: uuid('attempt_id').notNull(),
    unitId: uuid('unit_id').notNull(),
    status: varchar({ length: 16 }).default('active').notNull(),
    cmi: jsonb().default({}).$type<ScormCmiState>().notNull(),
    commitSeq: integer('commit_seq').default(0).notNull(),
    startedAt: timestamp('started_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    lastCommitAt: timestamp('last_commit_at', { withTimezone: true, mode: 'string' }),
    terminatedAt: timestamp('terminated_at', { withTimezone: true, mode: 'string' })
  },
  (table) => [
    foreignKey({
      columns: [table.attemptId],
      foreignColumns: [scormAttempt.id],
      name: 'scorm_sco_attempt_attempt_id_fkey'
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.unitId],
      foreignColumns: [contentPackageUnit.id],
      name: 'scorm_sco_attempt_unit_id_fkey'
    }).onDelete('restrict'),
    uniqueIndex('scorm_sco_attempt_open_key')
      .on(table.attemptId, table.unitId)
      .where(sql`${table.status} in ('active', 'suspended')`),
    index('idx_scorm_sco_attempt_attempt_id').on(table.attemptId, table.unitId, table.startedAt)
  ]
);
```

- At most one open attempt per learner and activity (`closed_at is null`), and at most one open try per module and attempt.
- `packageVersionId` pins the version for every module of the attempt, so a replaced package never feeds old suspend data to new content. The service checks that `unitId` belongs to that version inside the launch transaction.
- `closeReason`: `finished` when the rule was met, `replaced` when **Move everyone to this version** closed it.
- `cmi` is the LMS’s authoritative run-time state, after the LMS-side rules are applied. Suspend data is stored whole and never truncated, because Storyline routinely writes more than the 4,096 characters SCORM 1.2 promises.
- Review and preview sessions write neither table.
- Why two tables and not one: a single row per attempt with every module’s CMI in one JSON column would rewrite every module’s data on each 30-second save and lose module history; a single row per module with a shared attempt number would leave “one open attempt” and “one version per attempt” to code instead of the database. For a one-module package each attempt is one row plus one try.

#### New Table: `scorm_session_event` (added in PR 5, written from PR 14)

```ts
export const scormSessionEvent = pgTable(
  'scorm_session_event',
  {
    id: uuid()
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    scoAttemptId: uuid('sco_attempt_id').notNull(),
    kind: varchar({ length: 24 }).notNull(),
    detail: jsonb().default({}).$type<Record<string, unknown>>().notNull(),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull()
  },
  (table) => [
    foreignKey({
      columns: [table.scoAttemptId],
      foreignColumns: [scormScoAttempt.id],
      name: 'scorm_session_event_sco_attempt_id_fkey'
    }).onDelete('cascade'),
    index('idx_scorm_session_event_sco_attempt_created').on(table.scoAttemptId, table.createdAt)
  ]
);
```

- `kind`: `launch`, `initialize`, `commit`, `terminate`, `beacon`, `error`, `not_initialized`.

#### Relationship Diagram

```text
course (format) 1 ── n course_section
   │                     │ restrict
   └── 1 ── n course_activity (kind) ── 1 ── n activity_completion (profile)
                 │
                 └── 1 ── 1 activity_scorm ── restrict ──▶ assets (kind = 'scorm')
                 │                                            │
                 │                                            └── 1 ── n content_package_version ── 1 ── n content_package_unit
                 │                                                          ▲ restrict                         ▲ restrict
                 └── 1 ── n scorm_attempt (profile, package_version_id) ────┘                                  │
                               └── 1 ── n scorm_sco_attempt (unit_id) ──────────────────────────────────────────┘
                                             └── 1 ── n scorm_session_event

lesson, exercise, lesson_completion, submission: unchanged
```

### Status Mapping and Completion Rules

SCORM 1.2 has one status field; SCORM 2004 has two. Both normalize to a completion and a success value:

| SCORM 1.2 `lesson_status` | Completion | Success |
| --- | --- | --- |
| `passed` | completed | passed |
| `completed` | completed | unknown |
| `failed` | completed | failed |
| `incomplete` | incomplete | unknown |
| `browsed` | incomplete | unknown |
| `not attempted` | not attempted | unknown |

LMS-side rules, applied by `applyLmsRules` before the CMI is stored:

- **SCORM 1.2, status never set**: when the module calls `LMSFinish` without ever setting `cmi.core.lesson_status`, the LMS records `completed`.
- **SCORM 1.2, mastery score**: when the unit has `masteryScore`, the attempt has credit and the module set `cmi.core.score.raw`, the LMS sets `passed` or `failed` by comparing the raw score with the mastery score.
- **SCORM 2004**: `cmi.completion_status` and `cmi.success_status` are used as stored, after the LMS evaluates `completion_threshold` against `progress_measure` and `scaled_passing_score` against `score.scaled`. These are the rules ADL’s reference run-time applies on Terminate.
- Phase 0 checks which of these scorm-again already applies, so they run once.

Scores and graded modules:

- Scaled score: SCORM 2004 `score.scaled`. For SCORM 1.2, `(raw - min) / (max - min)` when both are set, otherwise `raw / 100`.
- A module has a pass mark when its unit has `masteryScore` or `formatDetails.scaledPassingScore`.

The rule applies to every launchable module of the attempt’s version, using each module’s latest try. A module with no try yet is “not attempted”. Units of type `asset` are left out.

```ts
/**
 * Returns whether an attempt meets the item's completion rule, given the latest outcome of each launchable module.
 */
export function isScormRuleMet(settings: ScormRuleSettings, modules: ScormModuleOutcome[]) {
  if (modules.length === 0) return false;

  if (settings.rule === 'score') {
    const attemptScore = averageScaledScore(modules);
    const everyModuleCompleted = modules.every((module) => module.completion === 'completed');

    return everyModuleCompleted && attemptScore !== null && attemptScore * 100 >= (settings.minScorePercent ?? 100);
  }

  return modules.every((module) => isModuleRuleMet(settings.rule, module));
}

function isModuleRuleMet(rule: Exclude<ScormCompletionRule, 'score'>, module: ScormModuleOutcome) {
  if (rule === 'completed') return module.completion === 'completed';

  if (rule === 'passed') return module.success === 'passed';

  const isGraded = module.hasPassMark || module.success !== 'unknown';
  if (isGraded) return module.success === 'passed';

  return module.completion === 'completed';
}
```

- `averageScaledScore` averages the modules that report a score and returns `null` when none do. It is also the score shown in Results.
- The same outcome logic exists once in TypeScript (`packages/activity-packages`, used at commit time) and once as SQL (`scormTryOutcomeSql` for a module try and `scormAttemptRollupSql` for an attempt, in `packages/db/src/queries/scorm/outcome.ts`, used by reports), with a shared fixture test that runs both on the same CMI samples.
- Known limit of the automatic rule: a module with no pass mark that reports `completed` before its quiz reports `failed` counts when it reports `completed`. Authors fix it by choosing the Passed rule; the customer FAQ says so.

### Attempts

```text
launch(activityId, profileId, unitIdentifier?, newAttempt?):
  attempt = the open attempt (closed_at is null)
  if no attempt:
    if no attempts yet: create attempt 1 on the current version
    else if the latest closed with reason "replaced": create attempt n + 1 on the current version
    else if a new compliance cycle opened after the latest attempt closed: create attempt n + 1
    else if newAttempt and activity_scorm.allow_retakes: create attempt n + 1
    else: review mode on the latest attempt (cmi.mode = review, credit = no-credit, nothing saved)
  unit = unitIdentifier, or the first module in manifest order that doesn't meet the rule
  try = the open try for (attempt, unit)
  if try: resume it (entry = resume when its status is suspended, otherwise "")
  else: create a try with empty CMI (entry = ab-initio in 1.2, ab_initio in 2004)

terminate(try, exit):
  exit = suspend                                       → try suspended
  SCORM 2004, any other exit                           → try closed; the next launch of this module starts fresh
  SCORM 1.2, module completed, passed or failed        → try closed
  SCORM 1.2, module unfinished, any other exit or none → try suspended (decision 6)

after every saved commit:
  if every module meets the rule: close the attempt (reason finished) and completeActivityOnce
```

- A failed module’s try is closed when it terminates, so the next launch starts it fresh while the attempt stays open. That is how a learner who fails tries again.
- Closing an attempt doesn’t stop the running module. Its later commits still save to its try; the closed attempt only changes what the next launch opens.
- **Move everyone to this version** closes every open attempt on older versions with reason `replaced`, in one transaction, and reports how many it closed.
- Launches serialize on the attempt row (`select … for update`), so two tabs can’t open two attempts or two tries of one module.

### Launch and Content Tokens

Two tokens, both HMAC-SHA256 over a JSON payload with a shared `ACTIVITY_SIGNING_SECRET`, the same technique as the existing HLS cookie. Implemented once with WebCrypto in `packages/activity-packages`, so it runs in Node 20 and in Workers. Both are carried in the URL path, so they need no cookies: Safari has blocked third-party cookies by default since 2020, Firefox partitions them, and Chrome leaves the choice to each user.

**Launch token**: one per launch, for the player page and the run-time routes.

| Claim | Purpose |
| --- | --- |
| `org` | Organization; selects the content subdomain |
| `act` | Activity |
| `att` | Module try (`scorm_sco_attempt`) the run-time endpoint may write; absent in preview and review |
| `sub` | Profile, for logging |
| `unit` | Package unit, which pins the module and the package version |
| `fmt` | Package format |
| `mode` | `normal`, `review`, `preview` |
| `anc` | Allowed parent origins for `frame-ancestors` |
| `exp` | 12 hours after launch |

**Content token**: one per organization, package version and week, for package files.

| Claim | Purpose |
| --- | --- |
| `org` | Organization; must match the content subdomain |
| `p` | Storage prefix of the version; the content server only serves keys under it |
| `anc` | Allowed parent origins for `frame-ancestors` |
| `wk` | ISO week the token was minted in; accepted for that week and the next |

- The content token is deterministic for its week, so every learner and every launch in that week uses the same file URLs. Browsers and the edge cache reuse files across launches instead of downloading a 48 MB package again each time.
- Package files are not learner-specific, so a shared URL leaks nothing a single launch didn’t; it stops working within two weeks.

### Content Serving, Caching and Headers

- `GET` and `HEAD /activity/content/{contentToken}/{path}` read `{p}/{path}` from the private `scorm` bucket, after normalizing the path and checking it stays under `p`. When the exact key is missing, the path index (`v{n}.index.json`) resolves a case-insensitive match, because packages built on Windows often reference files in the wrong case.
- `Range` requests return 206. Safari will not play MP4 without them.
- Every object carries the content type set at extraction, because `nosniff` blocks scripts and styles served with the wrong type.
- **Edge cache (cloud)**: the tenant-router Worker verifies the token, then looks up `caches.default` with a key built from the storage path and a hash of `anc` (the token itself is not in the key). On a miss it reads R2, returns the object and stores it with `cache.put`. Package versions are immutable, so responses carry `Cache-Control: public, max-age=604800, immutable`. Cloudflare’s cache limits apply: 512 MB per file on Free, Pro and Business plans.
- **Self-hosted**: the API serves the same paths with the same headers. URLs are stable for a week, so any CDN in front of the content hostname can cache them.
- Content-host responses replace the API’s global headers:

| Header | Value | Why |
| --- | --- | --- |
| `X-Frame-Options` | removed | The course page on another origin must frame the player |
| `Content-Security-Policy` | `frame-ancestors 'self' {anc}` | Every ancestor is checked; the package is framed by the player |
| `Cross-Origin-Opener-Policy` | `unsafe-none` | New-window mode needs `window.opener` |
| `Referrer-Policy` | `strict-origin` | Never leak a token in a Referer; embedded players still get an origin |
| `X-Content-Type-Options` | `nosniff` | Kept |

- The content CSP deliberately sets only `frame-ancestors`. Packages that stream content (decision 12), embed YouTube or load fonts from a CDN need outbound frames, scripts and requests, and the content origin is already isolated from the app, so allowing them costs nothing.
- Vendor content framed inside the content origin is a third-party context. If it relies on its own cookies, it fails in browsers that block third-party cookies. The diagnostics and the help article name this as the usual cause when a streamed package loads blank.
- The player page and run-time responses are never cached.

### Saving Progress

- The player fetches the saved CMI before the package starts and loads it with `loadFromJSON`, which scorm-again only allows before launch.
- scorm-again’s default mode commits with a synchronous request, so `Commit` returns `"true"` only once the server has saved. Its asynchronous mode is documented as not SCORM-compliant. Autocommit runs every 30 seconds.
- `includeCommitSequence` numbers every commit; the server ignores anything not newer than `commit_seq`.
- Browsers forbid synchronous requests while a page closes, so scorm-again sends the Terminate commit with `navigator.sendBeacon` as `text/plain`. Beacons and `keepalive` fetches share a 64 KiB budget, so commits send changed elements only (`sendFullCommit: false`) and the server merges.
- Chrome 154 (September 2026) no longer runs `unload` handlers on any page load, so packages that call `LMSFinish` from `onunload` lose their final save. The player listens for `pagehide` and flushes by beacon when the package has not terminated.
- The commit endpoint answers `{ "result": true, "errorCode": 0 }`, the format scorm-again expects.

```ts
/**
 * Saves one numbered commit for the module try in the token, then applies the item's rule across the attempt's modules.
 * Ignores commits not newer than the stored sequence. Throws AppError on an invalid payload or an unknown try.
 */
export async function commitScormAttempt(claims: ActivityLaunchClaims, commit: TScormCommit) {
  if (claims.mode !== 'normal' || !claims.att) return { saved: false, completedActivity: false };

  const normalizedCommit = normalizeCommitCmi(commit.cmi, claims.fmt);
  const result = await db.transaction(async (tx) => {
    const scoAttempt = await lockScormScoAttempt(claims.att, tx);
    if (!scoAttempt) throw new AppError('SCORM attempt not found', ErrorCodes.NOT_FOUND, 404);

    const { activityId, profileId } = scoAttempt.attempt;
    if (commit.seq <= scoAttempt.commitSeq) return { saved: false, completedActivity: false, activityId, profileId };

    const mergedCmi = applyLmsRules(mergeCmi(scoAttempt.cmi, normalizedCommit), scoAttempt.unit, claims.fmt);
    const nextStatus = commit.terminate ? statusAfterTerminate(mergedCmi, claims.fmt) : scoAttempt.status;
    await updateScormScoAttempt(scoAttempt.id, { cmi: mergedCmi, commitSeq: commit.seq, status: nextStatus }, tx);

    const ruleSettings = await getActivityScormSettings(activityId, tx);
    const moduleOutcomes = await listScormModuleOutcomes(scoAttempt.attemptId, tx);
    if (!isScormRuleMet(ruleSettings, moduleOutcomes)) return { saved: true, completedActivity: false, activityId, profileId };

    await closeScormAttempt(scoAttempt.attemptId, 'finished', tx);
    const completedActivity = await completeActivityOnce(activityId, profileId, tx);

    return { saved: true, completedActivity, activityId, profileId };
  });

  if (result.completedActivity) {
    await runActivityCompletionSideEffects(result.activityId, result.profileId);
  }

  return result;
}
```

- `lockScormScoAttempt` locks the attempt row first, then the try, so commits from two modules of one learner serialize.
- `listScormModuleOutcomes` returns the latest try’s outcome for every launchable module of the attempt’s version, with `hasPassMark` from the unit row.
- `closeScormAttempt` only touches an open attempt, so a later commit after the rule is met changes nothing.
- `completeActivityOnce` upserts `activity_completion` and returns true only when the row changed from incomplete to complete, so side effects run once.
- `runActivityCompletionSideEffects` calls `evaluateCourseCertification` and `syncComplianceProgressForMember` after the transaction commits, per the house rule on deferring side effects.

### Package Processing

The `activity-package` worker processes one version and dispatches by detected format. Version 1 has the SCORM processor:

1. Stream the ZIP from the bucket to a temp file (`downloadObjectToTempFile`).
2. Check the real size from `HeadObject` against `UPLOAD_MAX_SCORM_MB`.
3. Read entries with `yauzl` (MIT; it rejects absolute paths and `..` itself) and apply the `packages/activity-packages` checks:

| Check | Default |
| --- | --- |
| Entries | at most 10,000 |
| Total uncompressed size | at most 3 × the ZIP limit |
| Compression ratio per entry | at most 100 : 1 |
| Paths | no `..`, no absolute or drive paths; backslashes normalized; Unicode NFC |
| Entry types | files and folders only; symlinks and encrypted entries rejected |
| Manifest | `imsmanifest.xml` at the root, or inside a single top-level folder (rebased, with a warning). `tincan.xml` or `cmi5.xml` without `imsmanifest.xml` fails with a format-specific error |

4. Parse the manifest with `fast-xml-parser` (MIT) with entity processing off, after rejecting any manifest that contains a DOCTYPE. Detect the version from `schemaversion` (`1.2`, `CAM 1.3`, `2004 3rd Edition`, `2004 4th Edition`), then from the namespaces, falling back to 1.2 as Moodle does. Read attributes case-insensitively, because real packages write both `adlcp:scormtype` and `adlcp:scormType`.
5. Check that every SCO’s `href` exists, with a case-insensitive fallback recorded as a warning. Reject the package when a SCO’s launch URL, resolved against `xml:base`, is absolute (`http:`, `https:` or `//`), with the error “This package opens content from another website”. Reject it when no resource is a SCO (only assets), with “Nothing in this package reports progress”.
6. Upload each file to `{contentPrefix}/…` with its content type using a new streaming upload helper (today’s worker uploads read whole files into memory), and write `v{n}.index.json`.
7. Write the version and unit rows, then mark the version `ready`. When it is the first version, make it current.
8. Update `media_job` stage and progress throughout. On the final failure, store a specific error code.

Avoid `adm-zip`, which had several open advisories in 2026.

### API and Route Plan

Course-scoped activity routes live with lessons and exercises in the course domain. Everything kind-specific, package-related or on the content host lives under one new root, `/activity`, mounted once in `apps/api/src/app.ts` and composed from sub-routers in `apps/api/src/routes/activity/index.ts`. Every route returns one response shape.

| Method | Path | Host | Auth | Purpose |
| --- | --- | --- | --- | --- |
| GET | `/course/:courseId/activity/:activityId` | App | Course member with content access | Activity with kind data for the editor or the player |
| POST | `/course/:courseId/activity` | App | Course team, plan or license | Create an activity of a kind in a section; the package is attached later |
| PUT | `/course/:courseId/activity/:activityId` | App | Course team, plan or license | Title, instructions, lock (team-only, as in `exercise.ts`) |
| PUT | `/course/:courseId/activity/:activityId/package` | App | Course team, plan or license | Attach a processed package asset (first upload or a package from the Media Manager) |
| PUT | `/course/:courseId/activity/:activityId/settings` | App | Course team, plan or license | Kind settings |
| DELETE | `/course/:courseId/activity/:activityId` | App | Course team | Delete the activity and its learner state |
| POST | `/course/:courseId/activity/:activityId/launch` | App | Course member with content access | Launch one module; return `playerUrl`, `mode`, `expiresAt`, the module launched and every module with its status |
| GET | `/course/:courseId/activity/:activityId/results` | App | Course team | Summary and paginated learner results |
| GET | `/course/:courseId/activity/:activityId/results/:profileId` | App | Course team | Attempts, module tries, key CMI fields, interactions, events |
| POST | `/course/:courseId/activity/:activityId/results/:profileId/reset` | App | Course team | Delete that learner’s attempts and completion for this activity |
| POST | `/activity/packages` | App | Org admin or tutor, plan or license | Create the asset and version 1, return a presigned PUT |
| POST | `/activity/packages/:assetId/versions` | App | Same | Create the next version, return an upload URL |
| POST | `/activity/packages/:assetId/versions/:versionId/process` | App | Same | Check the upload, start the job, return the `media_job` id |
| POST | `/activity/packages/:assetId/versions/:versionId/current` | App | Same | Make a ready version current; optionally close open attempts on older versions (reason `replaced`) |
| GET | `/activity/packages/:assetId` | App | Org team | Package, versions, units, warnings, activities using it |
| DELETE | `/activity/packages/:assetId` | App | Org admin | Delete, or 409 while an activity uses it |
| POST | `/activity/courses` | App | Org admin or tutor, plan or license | Create one draft SCORM course per package (1 to 20), each with one activity; returns the created courses |
| GET | `/activity/player/:launchToken` | Content | Token | Player HTML |
| GET | `/activity/player-assets/*` | Content | None | Hashed player JS and CSS |
| GET | `/activity/content/:contentToken/*` | Content | Token | Package files with Range and caching |
| GET | `/activity/scorm/runtime/:launchToken/state` | Content | Token | Saved CMI and launch data |
| POST | `/activity/scorm/runtime/:launchToken/commit` | Content | Token | Save a numbered commit (JSON, or `text/plain` beacon) |

- `POST /course` (new course) accepts `format: 'scorm'`, checks the plan or license, and creates the course with one empty SCORM activity in the same transaction. `/activity/courses` does the same with a package already attached.
- The content routes (`/course/:courseId/content` reorder, update, delete) accept `ACTIVITY` items (map 4.5).

#### Validation Layer

- `packages/utils/src/validation/activity/`:
  - `activity.ts`: `ZActivityCreate` (`kind`, `sectionId`, `title`), `ZActivityUpdate` (`title`, `instructions`, `isUnlocked`), `ZActivityAttachPackage` (`assetId`), `ZActivityParam`, `ZActivityLaunch` (`unitIdentifier?`, `newAttempt?`).
  - `scorm.ts`: `ZScormSettings` (`completionRule`, `minScorePercent`, `allowRetakes`, `launchMode`), `ZScormCommit` (`seq`, `cmi`, `terminate`) with element and length limits.
  - `package.ts`: `ZPackageCreate` (`fileName`, `fileSize`, `title`), `ZPackageParam`, `ZPackageVersionParam`, `ZPackageMakeCurrent`.
  - `course.ts`: `ZActivityCoursesCreate` (`assetIds`, 1 to 20; `courseType`, `SELF_PACED` or `COMPLIANCE`; optional `titles` keyed by asset id).
  - `report.ts`: pagination and sort params.
- Shared schemas changed per map § 1.

#### Query Layer

`packages/db/src/queries/activity/` and `packages/db/src/queries/scorm/`, with an optional trailing `DbOrTxClient` on every function and `console.error('functionName error:', error)` in each catch:

- `activity/activity.ts`: map 3.9.
- `activity/package-version.ts`, `activity/package-unit.ts`: create, update status, list by asset, get current, set current, bulk insert units.
- `scorm/activity-scorm.ts`: upsert, get by activity, list activities by asset.
- `scorm/attempt.ts`: attempts: get open, lock for update, create, close with a reason, close every open attempt on older versions, delete by learner and activities.
- `scorm/sco-attempt.ts`: module tries: get open, lock (attempt first), create, update, list the latest try per module.
- `scorm/outcome.ts`: `scormTryOutcomeSql` and `scormAttemptRollupSql`.
- `scorm/report.ts`: summary and learner rows, computed with SQL aggregates over attempts and tries.
- Changes to existing query modules: map § 3.

#### Service Layer

- `packages/core/src/services/activity/activity.ts`: create, update, delete, settings, launch dispatch, `completeActivityOnce`, `runActivityCompletionSideEffects`, `assertActivityKindAllowed`.
- `packages/core/src/services/activity/providers/index.ts` and `providers/scorm/*`: the SCORM provider (launch policy, settings, results, reset, copy, delete, go-live blockers, compliance snapshot).
- `packages/core/src/services/activity/packages.ts`: package create, process, replace, make current, delete.
- `packages/core/src/services/activity/courses.ts`: SCORM courses from packages (one transaction per course; every package checked first; the whole request fails if any is not ready or not in the organization).
- `packages/core/src/services/jobs/activity-package-jobs.ts`: create the `media_job` row and enqueue.
- `apps/api/src/services/activity/runtime-scorm.ts`: state and commit.
- `apps/api/src/services/activity/plan.ts`: `assertActivityKindAllowed` implementation (cloud plan, self-hosted license).
- `apps/api/src/services/course/compliance.ts`: `syncComplianceProgressForMember` (PR 0b).
- Changes to existing services: map § 4.

#### Build Verification

```bash
pnpm --filter @cio/api^... build && pnpm --filter @cio/api build
pnpm --filter @cio/dashboard test
cd apps/dashboard && npx svelte-check --threshold error
pnpm format:check
```

The dashboard is verified with svelte-check against the pre-existing error baseline and Vitest, not the Vite build, which runs out of memory on development machines.

### Frontend Plan (Dashboard)

- Feature folder `apps/dashboard/src/lib/features/activity/`:
  - `api/activity.svelte.ts` and `api/package.svelte.ts`: `BaseApiWithErrors` classes, with Zod `safeParse` before `this.execute<…Request>()`.
  - `utils/types.ts`: request types such as `typeof classroomio.course[':courseId'].activity.$post`, success data via `Extract<InferResponseType<…>, { success: true }>['data']`, and the player message types.
  - `utils/scorm-utils.ts`: status labels, time formatting, rule descriptions.
  - `components/`: `activity-create-stepper.svelte`, `package-upload.svelte`, `package-details.svelte`, `package-settings.svelte`, `activity-player.svelte`, `module-menu.svelte`, `activity-results-panel.svelte`, `learner-attempts-sheet.svelte`, `courses-from-packages-dialog.svelte`, `scorm-course-create.svelte`.
  - `pages/activity.svelte`: picks the editor (team) or the player (student) for the activity’s kind.
- Route `apps/dashboard/src/routes/(app)/courses/[id]/activities/[activityId]/+page.server.ts` and `+page.svelte`.
- Course plumbing changes: map § 7. They are type-level and shared-utility changes first (PR 4), then SCORM screens (PR 7, 10, 11, 12).
- Org-scoped data loads in an `$effect` that waits for `$currentOrg.id`, per `CLAUDE.md`.
- New components live in the dashboard feature folder. Anything moved into `packages/ui` needs the `ui:` prefix and a Storybook story.
- Translations: all copy in `en.json` under `activity.*`, `course.navItem.lessons.*` (map 7.53), `media_manager.scorm`, `snackbar.activity`, then `pnpm translate` and a placeholder check for the ten other locales.
- Test ids: `activity-package-dropzone`, `activity-settings`, `activity-player-frame`, `activity-results-table`, `course-nav-package`, `new-course-scorm-option`.
- CSP: add the content domain to `frame-src` in `csp-domains.js`; on self-hosted, `csp.ts` adds `SCORM_CONTENT_ORIGIN`.
- Plan and license gating: `licenseApi.hasAccess('scorm')`, which works in both modes once Early Adopter maps to it; `UpgradeBanner` in cloud, a license notice on self-hosted.

### Player App

`apps/activity-player`: Vite, TypeScript, no framework, one adapter per package format. Version 1 has the SCORM adapter on `scorm-again`. Built into the API image and served on the content host.

```ts
import { Scorm12API } from 'scorm-again/scorm12';
import { Scorm2004API } from 'scorm-again/scorm2004';

const launchToken = readLaunchToken(location.pathname);
const state = await fetchLaunchState(launchToken);

const settings = {
  autocommit: true,
  autocommitSeconds: 30,
  lmsCommitUrl: `/activity/scorm/runtime/${launchToken}/commit`,
  sendFullCommit: false,
  includeCommitSequence: true,
  selfReportSessionTime: false,
  logLevel: state.debug ? 1 : 4
};

const api = state.format === 'scorm12' ? new Scorm12API(settings) : new Scorm2004API(settings);
api.loadFromJSON(state.cmi);

if (state.format === 'scorm12') {
  window.API = api;
} else {
  window.API_1484_11 = api;
}

connectParentBridge(api, state.parentOrigin);
flushOnPageHide(api, launchToken);
mountPackageFrame(`/activity/content/${state.contentToken}/${state.launchPath}`);
```

Setting names are from the `scorm-again` 3.4 README (October 2026). Pin the exact version in phase 0.

One player page runs one module. When a module terminates, the player posts `terminated` (with any `adl.nav.request`) to the activity page, which shows the module-complete panel or launches the next module through the launch route.

### Regression Strategy

Decision 13 in practice:

1. **Characterize first (PR 0c).** Database-backed and unit tests record today’s output of every function in map § 12 on seeded courses with no activities, plus a Playwright smoke test of the lesson and exercise flows. A Postgres service joins CI so database tests run instead of skipping. Nothing else merges before this.
2. **Make the change easy (PR 0d).** One refactor, no behaviour change, verified by step 1:
   - exhaustive switches with `assertNever`;
   - `Record<ContentType, …>` maps;
   - enum-derived Zod schemas;
   - the duplicated `buildCourseContent` collapsed into one;
   - every silent fall-through removed (map rows 1.2, 1.5–1.7, 3.2, 4.1–4.3, 4.15, 4.21, 6.5, 7.3, 7.15).
3. **Add the type dark (PR 1–4).** The schema, server plumbing, copy paths and dashboard plumbing land with no way to create an activity in production. Tests insert activity rows directly. Every row in the map’s § 1–8 for these PRs is checked off.
4. **Then add SCORM (PR 5 onward)** behind `assertActivityKindAllowed` and an organization rollout flag.
5. **Every PR** runs the characterization suite, the existing suites in map § 12, `svelte-check` against its baseline, the API build and `pnpm format:check`. A PR that changes any characterization snapshot is blocked unless the PRD says the change is intended.
6. **One migration per PR**, and only PR 1 and PR 5 add one. Both run the journal high-water-mark check from `CLAUDE.md`.
7. **Release order**: the tenant-router Worker (PR 9) deploys by hand before the cloud beta; the license server returns `scorm` before the self-hosted release.

## Implementation Order

Each phase ends in a working state. The per-PR task list, with files and tests, is in [`implementation-plan.md`](./implementation-plan.md); every PR’s touchpoints are in [`activity-integration-map.md`](./activity-integration-map.md).

### Phase 0: Spike and decisions (1 week)

Sign off the decisions, register the content domain, collect fixtures, and prove the run-time with a throwaway player on `http://content.localhost:3002`.

### Foundations (1.5 to 2 weeks, no behaviour change)

PR 0 restricts course content writes to the course team. PR 0b syncs compliance on lesson completion through a shared function. PR 0c adds characterization tests and Postgres in CI. PR 0d makes content-type handling exhaustive.

### Phase 1: Activity platform, dark (3 to 3.5 weeks)

PR 1 schema and shared contracts, PR 2 server plumbing, PR 3 copy, templates, drafts, MCP and agents, PR 4 dashboard plumbing.

### Phase 2: SCORM packages (2 weeks)

PR 5 package and SCORM schema with `packages/activity-packages`, PR 6 upload and processing, PR 7 add-content option and package editor with plan and license gating.

### Phase 3: Player and run-time (2.5 to 3 weeks)

PR 8 content origin and content server, PR 9 edge serving and caching in the tenant-router, PR 10 launch, player, saving and the module menu. This is the beta line.

### Phase 4: Results, SCORM courses and copying (2.5 weeks)

PR 11 results, attempts and progress reset, PR 12 the SCORM course format, PR 13 courses from packages and package copying.

### Phase 5: Hardening and launch (1 to 1.5 weeks)

PR 14 diagnostics, PR 15 docs (help, self-hosted, licensing, OpenAPI), the compatibility matrix and the beta rollout.

## Acceptance Criteria

**Regression**

1. The characterization suite from PR 0c passes unchanged on every PR, and the snapshots are identical before PR 1 and after PR 15 for courses with no activities.
2. All existing API, dashboard, utils, jobs and public API contract tests pass; database-backed tests run in CI rather than skipping.
3. The Playwright smoke test of lesson and exercise flows passes on every PR.
4. Adding a value to `ContentType` or `ACTIVITY_KINDS` without handling it fails `svelte-check` or the TypeScript build.

**Activity platform**

5. An activity can sit in any section or ungrouped, be moved, reordered with lessons and exercises, locked and unlocked, and it blocks sequential progression until complete.
6. Completing an activity updates the course progress ring, learner home, course cards, People, Audience, analytics, compliance, dashboard stats and learning-path goals, and can issue the certificate.
7. Deleting a section that holds an activity is refused with the activity’s name. Deleting an activity removes its learner state and leaves the package in the Media Manager.
8. Reset progress clears activity completions and attempts with everything else, and rolls back together on failure.
9. Clone, save as template, create from template and template sync copy activities without learner data; across organizations the package is transferred.
10. Course structure in the public API, MCP and drafts lists activities; drafts can place them; replace-mode publish never deletes them and refuses to delete a section that holds one.
11. Switching a course with activities to Public is refused in the dashboard and by the API.

**SCORM**

12. An org admin on a paid cloud plan, or on a self-hosted server whose license includes `scorm`, uploads a SCORM 1.2 and a SCORM 2004 package up to the size limit, and both reach `ready` with their modules listed.
13. On the Free plan, or self-hosted without the license, SCORM authoring is refused by the server and shown as locked in the dashboard, while existing SCORM items still launch, save and report.
14. Invalid packages fail with a specific, translated reason. The zip-slip, zip-bomb, symlink, DOCTYPE, external-launch and assets-only fixtures are rejected.
15. A student launches a SCORM item in Chrome, Edge, Firefox, Safari on macOS and iOS, and Chrome on Android, embedded and in new-window mode, on a tenant subdomain and on a custom domain.
16. Closing the tab mid-course and relaunching restores location and suspend data for the Storyline and Rise fixtures.
17. The item completes by its rule, and course progress, the certificate and the compliance record update with no manual step.
18. No “Mark as complete” control appears on activities, in the header or in the mobile bottom bar.
19. A package with several modules is one item with a module menu. It completes only when every module meets the rule, and modules can be opened in any order.
20. With the Automatic rule, a SCORM 1.2 quiz package whose manifest has a mastery score does not complete on `completed` alone; it completes on a raw score at or above the mastery score.
21. A learner who fails can launch again and the failed module starts fresh, without retakes being on.
22. A SCORM 1.2 module that exits without `suspend` while unfinished resumes on the next launch. A SCORM 2004 module that exits `normal` while unfinished starts fresh.
23. With retakes on, review mode offers **Start a new attempt**, which opens attempt 2, and Results shows the best score.
24. The Results tab shows status, pass or fail, score, best score, time, attempts and last launch per learner, and exports CSV.
25. Replacing a package does not change the version used by an in-progress attempt.
26. Package files are served only from the content domain. A fixture package cannot read `parent.document`, the session cookie or `/proxy`. Forged and expired tokens get 401, and a token cannot read another prefix or write another attempt.
27. In cloud, the second launch of a package in the same week serves its files from the edge cache (`cf-cache-status: HIT`).
28. A streamed-content fixture (a Dispatch-style launcher or Elucidat’s default export) plays and reports completion.

**SCORM courses**

29. **New course → Upload a SCORM package** creates a Self-paced or Compliance SCORM course, lands on its Package page ready for the upload, and its admin navigation shows Package instead of Content and hides Submissions, Marks and Attendance.
30. A student in a SCORM course sees News Feed (when on), Package and Certificates; Package opens the player in one click; Continue and `?next=true` land on it.
31. The server refuses new sections, lessons, exercises or a second activity in a SCORM course from every route, the public API, MCP and drafts.
32. Creating courses from three packages in the Media Manager makes three draft SCORM courses.
33. **Convert to a standard course** brings Content back with the package as the first item, and cannot be reversed.
34. A Compliance SCORM course records score, attempts and time from the package in the compliance record.

**Platform**

35. On self-hosted, the documented setup works with Docker Compose and one extra hostname under the same domain. Without `SCORM_CONTENT_ORIGIN`, the feature is off and the admin is told why.
36. All new UI copy uses translation keys, present in all 11 dashboard locales.

## Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| A new content type breaks lessons or exercises somewhere | Characterization tests first, the exhaustiveness refactor, the integration map with an owner and a test per row, dark launch |
| The 13 progress rules drift further apart | One activity predicate everywhere; the existing disagreements are logged as a separate task, not changed here |
| Real packages behave differently from the spec | Compatibility matrix in phases 0 and 5, `scorm-again`’s field testing, diagnostics from phase 5 |
| Progress lost when a tab closes | Synchronous commits, autocommit, beacon on Terminate and `pagehide`, numbered commits, an end-to-end test that closes the tab |
| Old packages save in `onunload`, which Chrome no longer runs | Player flushes on `pagehide`; the spike tests Chrome’s documented Permissions-Policy opt-out on content-host responses |
| License server unreachable or lapsed license blocks learners | Only authoring is gated; launch, saving, results and reset never check the plan or license |
| License server not updated before the self-hosted release | Release checklist item in PR 15; the dashboard shows “needs an enterprise license” rather than failing |
| Content domain misconfigured on self-hosted | Feature stays off until configured; a health check page on the content host |
| Self-hosted content subdomain is same-site with the app | Single organization, so only its own team uploads packages; the guide states the trade-off and supports a separate domain; the `__Host-` cookie ticket closes the gap |
| Edge cache serves a file to the wrong organization | Cache key includes the version’s storage prefix, which is unique per asset, and the `anc` hash; tokens are checked before every cache lookup |
| A package reports `completed` before its quiz fails, under the Automatic rule | Pass marks read from the manifest, pass or fail wins in the same commit, the customer FAQ points to the Passed rule |
| Streamed packages depend on the vendor | The limits section and help article say so; diagnostics show the launcher’s requests failing; results show only what the launcher reports |
| Scope creep into sequencing or other kinds | Written non-goals, warnings on packages with sequencing rules, the provider registry and separate PRDs per kind |
| `scorm-again` has one main maintainer | Pin exact versions, keep our own run-time tests, keep the provider seam |
| Auditors question self-reported scores | Results labelled as reported by the package; recommend a ClassroomIO exercise as the graded final step |
| Storage cost of large, often-replaced packages | Size limit, storage visibility, deletion of unpinned versions after 30 days |
| Migration skipped on existing databases | Run the `_journal.json` high-water-mark check from `CLAUDE.md` before merging PR 1 and PR 5; read the generated SQL, because the snapshot disagrees with migration 0017 on three foreign keys |

## References

- Rustici, SCORM Run-Time Reference Chart: <https://scorm.com/scorm-explained/technical-scorm/run-time/run-time-reference/>
- Rustici, API discovery algorithm: <https://scorm.com/scorm-explained/technical-scorm/run-time/api-discovery-algorithms/>
- Rustici, SCORM 2004 manifest structure: <https://scorm.com/scorm-explained/technical-scorm/content-packaging/manifest-structure/>
- Rustici, cross-domain SCORM: <https://scorm.com/scorm-cross-domain/>
- Rustici, golf example packages (CC BY 3.0): <https://scorm.com/scorm-explained/technical-scorm/golf-examples/>
- Rustici, SCORM usage in 2025: <https://rusticisoftware.com/blog/how-relevant-is-scorm-lets-check-the-scorm-cloud-data/>
- Rustici, authorizing learners without third-party cookies: <https://rusticisoftware.com/blog/authorizing-learner-access-without-using-third-party-cookies/>
- SCORM Cloud pricing: <https://rusticisoftware.com/products/scorm-cloud/pricing/>
- Rustici Dispatch overview: <https://docs.rusticisoftware.com/dispatch/24.x/Dispatch/Dispatch-Overview.html>
- Rustici, unpacking the dispatch proxy file: <https://rusticisoftware.com/blog/unpacking-the-proxy-file-answering-questions-about-dispatching-content/>
- pipwerks, `cmi.core.exit` and `cmi.exit`: <https://pipwerks.com/cmicoreexit-cmiexit/>
- Dualcode, how an LMS sets SCORM 1.2 status from the mastery score: <https://docs.dualcode.com/standard/overriding-the-status-of-scorm-activities>
- HireRoad, mastery scores in Articulate SCORM 1.2 manifests: <https://hireroad.com/wp-content/uploads/2022/12/HireRoad_SCORM_V2.pdf>
- ADL SCORM 2004 4th Edition sample run-time: <https://github.com/adlnet/SCORM-2004-4ed-SampleRTE>
- scorm-again: <https://github.com/jcputney/scorm-again> and <https://jcputney.github.io/scorm-again/>
- Moodle SCORM module: <https://github.com/moodle/moodle/tree/main/public/mod/scorm>
- Open edX SCORM XBlock: <https://github.com/overhangio/openedx-scorm-xblock>
- Google, content hosting for the modern web: <https://security.googleblog.com/2012/08/content-hosting-for-modern-web.html>
- Chrome, deprecating the unload event: <https://developer.chrome.com/docs/web-platform/deprecating-unload>
- Cloudflare, R2 public buckets and custom domains: <https://developers.cloudflare.com/r2/buckets/public-buckets/>
- Cloudflare, caching R2 content: <https://developers.cloudflare.com/cache/interaction-cloudflare-products/r2>
- cmi5 specification: <https://aicc.github.io/CMI-5_Spec_Current/> and conformance requirements: <https://github.com/AICC/CMI-5_Spec_Current/wiki/%28Indexed%29-cmi5-Conformance-Testing-Requirements-Draft>
- 1EdTech LTI Assignment and Grade Services: <https://standards.1edtech.org/lti/specifications/services/assignments_grades/assignment-grade-services-spec>
- 1EdTech LTI implementation guide: <https://standards.1edtech.org/lti/specifications/guides/implementation_guide/implementation-guide>
- h5p-standalone: <https://unpkg.com/h5p-standalone@3.8.2/README.md>; H5P xAPI completion: <https://h5p.org/node/16471>
