# SCORM Support PRD

## Purpose

Enable ClassroomIO to import, launch, track, and report on SCORM learning content in a way that is commercially credible for enterprise buyers without forcing the product to become a fully standards-maximal LMS on day one.

This PRD defines a phased SCORM support strategy that starts with the most common customer need:

1. Upload a SCORM ZIP package
2. Launch it inside ClassroomIO
3. Persist learner progress, score, completion, and resume state
4. Reflect that state in ClassroomIO progress, completion, certificates, and reporting

It also defines what is explicitly out of scope for the first release so the team does not accidentally sign up for full SCORM 2004 sequencing compliance in v1.

## Problem Statement

Today ClassroomIO supports native lessons, exercises, videos, documents, and public course delivery, but it does not support packaged e-learning content from external authoring tools like Articulate Storyline, Rise, Adobe Captivate, iSpring, or Lectora.

This creates four product gaps:

1. Enterprise buyers often already own SCORM course libraries and expect LMS import compatibility.
2. Migration into ClassroomIO is harder because packaged compliance or onboarding content cannot be brought over intact.
3. Course import work currently stops at manifest parsing and launch references rather than learner tracking parity.
4. ClassroomIO cannot yet participate in procurement conversations where "Does it support SCORM?" is a gate question.

## Why Now

ClassroomIO already has adjacent foundations that make SCORM support realistic:

1. Existing course/lesson/exercise models and public delivery surfaces
2. Existing file upload and asset storage patterns
3. Existing learner completion, certification, and analytics pipelines
4. Existing course import planning that already names `SCORM ZIP` as a provider

The missing piece is a dedicated SCORM content/runtime subsystem that bridges package import, browser launch, runtime API calls, persistence, and reporting.

## Current-State Audit

The current repository was reviewed on 2026-05-24. Relevant findings:

### Native lesson model exists, but no SCORM content type exists

- Lessons currently store native content such as `note`, `videoUrl`, `slideUrl`, `videos`, and `documents` in `packages/db/src/schema.ts`.
- Lesson validation mirrors that native-content model in `packages/utils/src/validation/lesson/lesson.ts`.
- There is no first-class schema for a packaged lesson type, SCO launch asset, runtime state, attempt state, or manifest hierarchy.

Primary files reviewed:

- `packages/db/src/schema.ts`
- `packages/utils/src/validation/lesson/lesson.ts`

### Learner progress is boolean-first, not runtime-model-first

- Lesson completion is currently persisted as a simple `lesson_completion` row with `isComplete`.
- Exercise completion is inferred from submissions.
- Course completion and certification logic expects boolean completion plus exercise data and aggregates them into course progress.

Primary files reviewed:

- `packages/db/src/schema.ts`
- `packages/db/src/queries/lesson/lesson.ts`
- `packages/db/src/queries/course/content.ts`
- `apps/api/src/routes/course/lesson.ts`
- `apps/api/src/services/course/completion.ts`

### Student lesson delivery expects rendered lesson content, not a runtime container

- Public and authenticated lesson surfaces map lessons into rendered body/video-oriented view models.
- There is no SCORM player shell, launch frame, API bridge, or learner debug surface.

Primary files reviewed:

- `apps/dashboard/src/lib/features/course/utils/public-course-mappers.ts`
- `apps/dashboard/src/routes/(org-site)/course/[slug]/lesson/[itemSlug]/+page.svelte`

### Existing import planning references SCORM, but only as a package intake concern

- The existing course import implementation plan includes `SCORM ZIP`.
- That plan explicitly avoids "full runtime event/grade sync parity" in v1.
- This PRD expands the missing runtime, tracking, and reporting layers that the import plan intentionally left out.

Primary file reviewed:

- `prd/course-import/implementation-plan.md`

## External Research Summary

Research was verified against primary or de facto primary technical references on 2026-05-24.

### Source List

1. ADL SCORM 2004 4th Edition Testing Requirements  
   `https://www.adlnet.gov/assets/uploads/SCORM_2004_4ED_v1_1_TR_20090814.pdf`
2. SCORM.com SCORM 1.2 developer overview  
   `https://scorm.com/scorm-explained/technical-scorm/scorm-12-overview-for-developers/`
3. SCORM.com run-time environment overview  
   `https://scorm.com/scorm-explained/technical-scorm/run-time/`
4. SCORM.com run-time reference chart  
   `https://scorm.com/scorm-explained/technical-scorm/run-time/run-time-reference/`
5. SCORM.com API discovery algorithms  
   `https://scorm.com/scorm-explained/technical-scorm/run-time/api-discovery-algorithms/`
6. SCORM.com comparison of SCORM 1.2 and SCORM 2004  
   `https://scorm.com/scorm-explained/business-of-scorm/comparing-scorm-1-2-and-scorm-2004/`

### Research Findings

#### 1. SCORM is two different problems: packaging and run-time

The standards distinguish between:

1. Package import and manifest interpretation
2. Browser run-time communication between launched content and the LMS

Implication for ClassroomIO:

- Parsing `imsmanifest.xml` is necessary but insufficient.
- "We can upload the ZIP" is not market-equivalent to "we support SCORM."

#### 2. The LMS must expose a JavaScript API object to launched content

The content does not push events to a webhook or polling endpoint by default. It expects to locate a browser-side API object.

- SCORM 1.2 expects `window.API`
- SCORM 2004 expects `window.API_1484_11`

Implication for ClassroomIO:

- A backend-only implementation is impossible.
- The launch shell must host and expose the runtime API within the learner browser session.

#### 3. Basic runtime support is tractable; full sequencing is the expensive part

SCORM 1.2 centers on launch + data model persistence and is materially simpler.
SCORM 2004 adds a richer runtime model and sequencing/navigation expectations.

Implication for ClassroomIO:

- A commercially useful v1 should target single-SCO and simple multi-SCO packages without full sequencing support.
- Full SCORM 2004 sequencing should be explicitly deferred unless required by a concrete customer contract.

#### 4. Resume data and score persistence are core expectations

Typical SCORM packages rely on runtime elements for:

- completion status
- lesson status
- success status
- score
- session time
- total time
- suspend/resume state
- learner identifiers
- bookmark/lesson location

Implication for ClassroomIO:

- Mapping everything to `lesson_completion.isComplete` would be insufficient.
- A dedicated persistence model is required.

#### 5. API discovery and iframe/window topology matter

SCORM content often searches parent and opener windows to find the API object.

Implication for ClassroomIO:

- The launch shell and iframe strategy must be tested against real authoring-tool exports.
- The browser integration is a compatibility surface, not just a UI wrapper.

#### 6. Error diagnostics and support tooling are part of the real product

The runtime references define explicit error codes and failure states.

Implication for ClassroomIO:

- Storing only the final completion state will make support painful.
- We need runtime logs or at least event/error traces for debugging broken packages.

## Product Goals

1. Allow org admins to upload a valid SCORM package and attach it to a course in a predictable way.
2. Launch SCORM content inside ClassroomIO with a compatible browser-side runtime API.
3. Persist learner progress, completion, score, and resume state in first-class tables.
4. Map SCORM completion into existing ClassroomIO progress and certification rules.
5. Provide enough reporting and debugging for support, implementation, and customer success teams.
6. Keep v1 narrow enough to ship without committing to full SCORM 2004 sequencing compliance.

## Non-Goals (v1)

The following are explicitly out of scope for the first release:

- Full SCORM 2004 sequencing and navigation conformance
- AICC support
- xAPI or cmi5 support
- Editing SCORM package internals inside ClassroomIO
- Per-slide authoring or SCO authoring tools
- Deep transformation of SCORM interactions into native ClassroomIO exercises
- Multi-tenant public launch of SCORM content without authenticated learner context
- Mobile app offline SCORM runtime

## User Roles

### Org Admin / Course Admin

- Uploads a SCORM package
- Reviews package metadata and warnings
- Chooses import/attachment settings
- Publishes the lesson
- Reviews learner progress and support/debug data

### Learner

- Opens a SCORM lesson from a ClassroomIO course
- Consumes the content in a launch shell
- Has progress, score, completion, and resume state persisted automatically

### Support / Success / Implementation Team

- Diagnoses why a package is failing
- Verifies whether the package initialized, committed, terminated, and wrote expected runtime values

## User Stories

1. As an enterprise admin, I want to upload a SCORM ZIP exported from Storyline and have it run inside ClassroomIO without re-authoring it.
2. As a learner, I want to leave a SCORM lesson midway and resume where I stopped.
3. As an admin, I want SCORM completion and score to count toward course completion and certificates.
4. As support, I want to inspect runtime attempts and errors when a customer says a package "is not tracking."

## Product Scope

### Release Scope Summary

#### Phase 1: SCORM Foundations

- package upload
- safe extraction
- manifest parsing
- package metadata persistence
- launchable lesson attachment

#### Phase 2: Learner Runtime MVP

- SCORM 1.2 runtime API
- SCORM 2004 runtime API
- single-SCO and simple multi-SCO launch support
- persistence for status, score, suspend data, location, session time

#### Phase 3: ClassroomIO Integration

- map SCORM results into lesson completion
- reflect in course progress and certification rules
- reporting and admin debugging views

#### Phase 4: Advanced Compatibility

- more robust multi-SCO handling
- optional partial support for sequencing-related behaviors
- package compatibility hardening based on real customer exports

## Functional Requirements

### 1. Package Intake

Admins can upload a `.zip` package through dashboard UI.

System requirements:

1. Validate file extension and MIME heuristics
2. Enforce upload size limits
3. Extract package contents safely
4. Reject path traversal or unsafe extraction entries
5. Verify presence of `imsmanifest.xml`
6. Detect SCORM version when possible
7. Persist package metadata, warnings, and source file references

Failure behavior:

- Invalid ZIP: hard fail with actionable message
- Missing manifest: hard fail
- Manifest parse error: hard fail with line/element details if available
- Non-fatal unsupported metadata: import warning

### 2. Manifest Parsing

The importer must parse enough of the manifest to build a usable launch model.

Minimum parsed fields:

1. organizations
2. items
3. resources
4. launch entrypoint / `href`
5. SCORM type hints
6. title hierarchy
7. asset file inventory

ClassroomIO v1 behavior:

- Preserve hierarchy and order where feasible
- Support one launchable lesson per SCO or per imported package node
- Persist manifest-derived warnings rather than silently discarding them

### 3. Lesson Attachment Model

ClassroomIO needs a first-class way to represent SCORM-backed learning content.

V1 recommendation:

1. Add a new lesson content mode for `scorm`
2. Store a reference to an imported package record
3. Store the launch target within that package
4. Allow one lesson to point to one launch configuration

This should not be modeled as a generic document or video attachment. It needs dedicated semantics because it launches executable browser content with runtime tracking.

### 4. Launch Experience

Learners open a SCORM lesson from the course player and see a ClassroomIO SCORM shell.

The shell must:

1. Render package content in an iframe or compatible launch frame
2. Expose the correct runtime API object
3. Pass learner and attempt context to the runtime layer
4. Save progress on commit and termination
5. Handle relaunch and resume
6. Surface friendly learner messaging if initialization fails

V1 UX expectations:

- Full-bleed content area
- Loading state while runtime initializes
- Resume state if prior attempt exists
- Basic failure state if package cannot load or initialize

### 5. Runtime API Support

#### SCORM 1.2

Support the standard runtime API surface expected by common packages:

- `LMSInitialize`
- `LMSFinish`
- `LMSGetValue`
- `LMSSetValue`
- `LMSCommit`
- `LMSGetLastError`
- `LMSGetErrorString`
- `LMSGetDiagnostic`

#### SCORM 2004

Support the standard runtime API surface:

- `Initialize`
- `Terminate`
- `GetValue`
- `SetValue`
- `Commit`
- `GetLastError`
- `GetErrorString`
- `GetDiagnostic`

#### Minimum data model persistence

Persist enough runtime state to satisfy common authored packages:

- learner identifier
- learner name
- lesson/completion/success status
- score raw/min/max/scaled where provided
- lesson location
- suspend data
- session time
- total time where derivable
- exit mode
- launch timestamp
- last commit timestamp

### 6. Attempt Model

SCORM tracking should not be written directly onto `lesson_completion` only.

V1 needs a dedicated attempt/session layer:

1. learner launches SCORM lesson
2. system creates or resumes a SCORM attempt
3. runtime writes values into current attempt state
4. commit snapshots durable runtime values
5. termination closes the active session

Recommended behavior:

- One active attempt per learner per SCORM lesson
- Reuse active attempt for resume when package indicates suspend/resume flow
- Preserve historical attempts for reporting and debugging

### 7. Mapping Into ClassroomIO Progress

SCORM outcomes must map into existing product concepts.

V1 mapping rules:

1. If the package reports completion or passed status, mark the lesson complete.
2. If the package reports failed but complete, the lesson may still count as complete while retaining fail state in SCORM reporting.
3. If a course or admin setting requires a score threshold, use the SCORM score when available.
4. Course completion logic should be able to include SCORM-backed lessons in progress calculations.

This mapping must be configurable enough to avoid hard-coding assumptions that fail for compliance use cases.

### 8. Admin Reporting

Admins need a package-level and learner-level reporting surface.

V1 reporting requirements:

- package summary
- enrolled learner count
- started count
- completed count
- passed count
- average score where available
- last launch timestamp

Per-learner detail:

- learner identity
- attempt status
- completion state
- success state
- score
- total time
- last location
- last updated

### 9. Support Diagnostics

Support tooling is required for operational credibility.

V1 diagnostics should include:

1. launch attempts
2. initialize success/failure
3. commit success/failure
4. terminate success/failure
5. last error code
6. recent runtime writes
7. recent runtime warnings

Diagnostics can be admin-only and may be hidden behind a support section in the learner detail view.

## Non-Functional Requirements

### Security

1. Extract ZIP contents safely and reject path traversal entries.
2. Serve SCORM package assets from controlled storage paths.
3. Prevent package access outside authenticated and authorized lesson launch flows.
4. Sanitize launch boundaries to reduce cross-course leakage.
5. Review iframe sandbox and CSP strategy carefully because some packages may require relaxed scripting behavior.

### Reliability

1. Commits must persist even if the learner closes the browser immediately after a save attempt.
2. Runtime writes should tolerate repeated commit calls.
3. Relaunch should not corrupt prior attempt state.

### Compatibility

1. Test against common exports from Storyline, Rise, and Captivate.
2. Support both SCORM 1.2 and SCORM 2004 in v1 runtime scope.
3. Explicitly document any unsupported package patterns.

### Performance

1. Package upload and extraction should be async for larger files.
2. Learner runtime calls should not require a full page reload for every write.
3. Commit persistence must be fast enough to avoid package timeouts or bad learner UX.

## Proposed Data Model

Exact names can change, but the product needs dedicated tables equivalent to the following.

### `scorm_package`

- `id`
- `organizationId`
- `createdByProfileId`
- `sourceAssetId`
- `title`
- `version` (`1.2`, `2004`, `unknown`)
- `manifestIdentifier`
- `entrypoint`
- `status` (`uploaded`, `parsed`, `failed`, `ready`, `archived`)
- `manifestJson`
- `warningsJson`
- `fileCount`
- `createdAt`
- `updatedAt`

### `scorm_package_item`

- `id`
- `packageId`
- `parentItemId`
- `title`
- `identifier`
- `resourceIdentifier`
- `launchHref`
- `order`
- `isLaunchable`
- `metadataJson`

### `scorm_registration`

- `id`
- `packageId`
- `courseId`
- `lessonId`
- `profileId`
- `groupMemberId`
- `status`
- `completionStatus`
- `successStatus`
- `scoreRaw`
- `scoreScaled`
- `totalTimeSeconds`
- `lastLocation`
- `suspendData`
- `lastErrorCode`
- `lastLaunchedAt`
- `lastCommittedAt`
- `completedAt`
- `passedAt`
- `failedAt`
- `createdAt`
- `updatedAt`

### `scorm_attempt`

- `id`
- `registrationId`
- `attemptNumber`
- `status` (`active`, `terminated`, `abandoned`, `error`)
- `initializedAt`
- `terminatedAt`
- `lastCommittedAt`
- `sessionTimeSeconds`
- `runtimeSnapshotJson`
- `createdAt`
- `updatedAt`

### `scorm_runtime_event`

- `id`
- `attemptId`
- `eventType`
- `element`
- `valuePreview`
- `errorCode`
- `metaJson`
- `createdAt`

### Lesson linkage

The existing lesson model should gain a first-class SCORM linkage rather than overloading document/video fields.

Options:

1. Add `contentType` and `scormPackageItemId` to `lesson`
2. Add a dedicated lesson content relation table

V1 recommendation:

- prefer a dedicated relation or typed lesson-content shape over a pile of nullable lesson columns

## API Requirements

### Admin APIs

1. `POST /organization/scorm/packages/upload`
2. `GET /organization/scorm/packages`
3. `GET /organization/scorm/packages/:packageId`
4. `POST /organization/scorm/packages/:packageId/attach`
5. `DELETE /organization/scorm/packages/:packageId`

### Learner runtime APIs

1. `POST /course/:courseId/lesson/:lessonId/scorm/launch`
2. `POST /course/:courseId/lesson/:lessonId/scorm/commit`
3. `POST /course/:courseId/lesson/:lessonId/scorm/terminate`
4. `GET /course/:courseId/lesson/:lessonId/scorm/state`

### Reporting APIs

1. `GET /course/:courseId/scorm/lessons/:lessonId/report`
2. `GET /course/:courseId/scorm/lessons/:lessonId/report/:profileId`

Per repo conventions:

- validation schemas belong in `packages/utils/src/validation/scorm/`
- query functions belong in `packages/db/src/queries/scorm/`
- services orchestrate the business logic in `apps/api/src/services/scorm/`
- route registration should mount under a single root domain in `app.ts`

## Dashboard UX Requirements

### 1. Package Library

An org-scoped or course-scoped package library where admins can:

- upload a package
- inspect parsed metadata
- view warnings
- attach the package to a lesson

### 2. Lesson Editor Integration

When editing a lesson, admins can choose a content mode:

- native lesson
- SCORM package

For SCORM lessons, the editor should allow:

- selecting a package
- selecting a launchable item if multiple are available
- defining completion/score mapping behavior if needed

### 3. Learner Lesson Surface

Learner sees:

- lesson title and standard course chrome
- SCORM content shell
- loading and error states

Optional v1.5 enhancement:

- lightweight "Resume from where you left off" copy if suspend data exists

### 4. Reporting UI

For admins:

- lesson-level overview metrics
- learner table
- learner detail drawer with attempt history and diagnostics

## Phased Delivery Plan

## Phase 0: Discovery and Standards Proof

Deliverables:

1. package parser spike with representative Storyline/Rise/Captivate exports
2. browser runtime proof of concept for 1.2 and 2004
3. compatibility matrix documenting what package shapes initialize correctly

Exit criteria:

- at least one representative SCORM 1.2 package and one SCORM 2004 package initialize and write runtime values in a prototype shell

## Phase 1: Package Import

Deliverables:

1. schema for packages and package items
2. upload flow
3. extraction and manifest parser
4. package detail UI

Exit criteria:

- admin can upload a valid package and see parsed launchable items

## Phase 2: Runtime MVP

Deliverables:

1. learner launch shell
2. 1.2 and 2004 runtime API objects
3. state persistence
4. active attempt lifecycle

Exit criteria:

- learner can launch, resume, complete, and commit a supported package

## Phase 3: Product Integration

Deliverables:

1. lesson editor integration
2. course progress mapping
3. certification/compliance mapping
4. admin reporting

Exit criteria:

- SCORM lesson completion affects ClassroomIO progress and reporting correctly

## Phase 4: Hardening

Deliverables:

1. support diagnostics
2. real-package compatibility fixes
3. operational monitoring

Exit criteria:

- support can troubleshoot failed packages without engineering database spelunking

## Acceptance Criteria

### V1 Ship Criteria

1. Org admin can upload a valid SCORM 1.2 or 2004 ZIP package.
2. System parses the manifest and exposes at least one launchable item.
3. Admin can attach a parsed package item to a lesson.
4. Learner can launch the lesson inside ClassroomIO.
5. Package can initialize and commit runtime values through the ClassroomIO shell.
6. Resume state persists across relaunch for supported packages.
7. Completion and score can be viewed in admin reporting.
8. Lesson completion maps into ClassroomIO progress.

### Explicit V1 Boundaries

The following may remain unsupported at launch without blocking ship:

1. full SCORM 2004 sequencing conformance
2. obscure package-side API discovery edge cases not seen in supported exports
3. deep interaction-level analytics beyond score/status/time

## Risks and Mitigations

### Risk 1: "SCORM support" is interpreted as full standards compliance

Mitigation:

- Market the feature as phased support
- Document supported versions and boundaries
- Do not claim full sequencing compliance without formal testing and proof

### Risk 2: Browser compatibility issues with real authored packages

Mitigation:

- Maintain a compatibility suite with real exported packages
- Start with common authoring tools customers already use

### Risk 3: Mapping SCORM status into ClassroomIO completion is ambiguous

Mitigation:

- Define clear default mapping rules
- Add package or lesson-level mapping configuration only if concrete cases require it

### Risk 4: Runtime support becomes a support burden

Mitigation:

- Build diagnostics into v1, not as an afterthought
- Log initialize/commit/terminate and last runtime error

### Risk 5: Security and sandboxing conflicts break some packages

Mitigation:

- Test iframe sandbox/CSP combinations early
- Introduce a narrow compatibility mode only if necessary and gated

## Effort Estimate

These are planning estimates, not commitments.

### Lean MVP

- 2 to 4 weeks
- Assumes single-SCO or simple launch structures, narrow reporting, and limited compatibility targets

### Practical Enterprise v1

- 4 to 8 weeks
- Includes package import, runtime persistence, reporting, diagnostics, and compatibility hardening

### Full sequencing-oriented expansion

- multi-month follow-on project

## Open Questions

1. Should SCORM be attachable only to lessons, or should it also be a top-level course content item type?
2. Do we need per-lesson completion mapping settings in v1, or is one default mapping rule enough?
3. Should SCORM packages live in the media manager asset model or in a separate package library abstraction?
4. Do we need to support course import from SCORM and direct lesson attachment as separate flows, or can one implementation back both?
5. What minimum package size limit is commercially acceptable?
6. Which authoring tools should define the official compatibility target for launch?

## Recommended Product Decision

Ship the first commercial version as:

1. SCORM 1.2 and SCORM 2004 package import
2. launch + runtime API support
3. completion, score, suspend/resume, and reporting
4. no claim of full SCORM 2004 sequencing conformance

This is the smallest version that is likely to satisfy real enterprise buyer expectations while staying inside a practical engineering scope.

## Relationship to Existing PRDs

This PRD complements and expands:

- `prd/course-import/implementation-plan.md`

Recommended interpretation:

- the course import plan covers importer workflow and provider orchestration
- this PRD defines the actual SCORM subsystem needed for runtime and learner tracking parity
