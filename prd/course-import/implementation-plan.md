# Course Importer Implementation Plan (Creator Business v1)

## Purpose
Ship a long-running course importer that supports creator-focused sources:
1. Teachable API
2. Thinkific API
3. SCORM ZIP
4. CSV (platform-agnostic template)

## Scope Lock (v1)
1. Import is organization-scoped and admin-only.
2. Import runs as an async DB-backed job (`PENDING`, `RUNNING`, `COMPLETED`, `FAILED`, `CANCELED`).
3. Content imported:
- Course metadata (title, description, cover where available)
- Sections/modules
- Lessons/lectures/pages
- Exercises/quizzes/questions/options (when available)
- Media as external links or attached assets (no bulk media re-hosting in v1)
4. Not in v1:
- Enrollment/user migration (except CSV enrollment template if enabled)
- Billing/payment migration
- Full SCORM runtime tracking parity

## Delivery Order
1. Shared job infrastructure
2. Teachable provider
3. Thinkific provider
4. CSV provider
5. SCORM provider

## Shared Foundation (All Providers)

### A. Data Model + Queries
1. Add `course_import_job` table:
- `id`, `organizationId`, `createdByProfileId`
- `provider`, `status`, `attempt`, `maxAttempts`
- `leasedBy`, `leaseExpiresAt`, `heartbeatAt`
- `progressPercent`, `stage`, `checkpoint` (jsonb)
- `sourceCourseId`, `sourceCourseTitle`, `targetCourseId`
- `summary` (jsonb), `warnings` (jsonb), `error` (jsonb), timestamps
2. Add `course_import_log` table:
- `jobId`, `level`, `code`, `message`, `meta` (jsonb), timestamp
3. Add query module:
- `packages/db/src/queries/course-import/course-import.ts`
- Export from `packages/db/src/queries/index.ts`

### B. Validation + API Contracts
1. Add validation module:
- `packages/utils/src/validation/course-import/course-import.ts`
2. Endpoints:
- `GET /organization/course-import/providers`
- `POST /organization/course-import/preview`
- `POST /organization/course-import/jobs`
- `GET /organization/course-import/jobs`
- `GET /organization/course-import/jobs/:jobId`
- `POST /organization/course-import/jobs/:jobId/retry`
- `POST /organization/course-import/jobs/:jobId/cancel`

### C. Worker
1. Add worker entrypoint:
- `apps/api/src/worker.ts`
2. Claim jobs with DB lease + lock (`FOR UPDATE SKIP LOCKED`).
3. Stage-based execution with checkpoint resume.
4. Heartbeat updates and retry backoff.
5. Mark terminal state + structured error payload.

### D. Dashboard
1. Add feature:
- `apps/dashboard/src/lib/features/course-import/*`
2. Add importer modal on org courses page.
3. Poll `GET /jobs/:jobId` until terminal state.
4. On completion, refresh courses and navigate to imported course.

## Provider Plan: Teachable

### Phase T1: Connection + Auth
1. Support API key connection (org-scoped credentials).
2. Validation endpoint to verify credentials.
3. Save encrypted credentials in org integration config.

### Phase T2: Source Discovery
1. List source courses.
2. Fetch source course details:
- modules/lectures
- quizzes/questions if exposed
- media URLs and attachments

### Phase T3: Mapping
1. Map Teachable course -> internal normalized model:
- `course`, `sections`, `lessons`, `exercises`
2. Build fallback rules for missing fields.
3. Generate deterministic slug if needed.

### Phase T4: Import Execution
1. Create group + course shell.
2. Insert sections/lessons in chunked batches.
3. Insert exercises/questions/options in chunked batches.
4. Store warnings for unsupported Teachable entities.

### Teachable Acceptance Criteria
1. Admin can connect Teachable and preview course counts.
2. Import completes for a representative course with sections and lessons.
3. Unsupported entities are logged as warnings, not fatal errors.

## Provider Plan: Thinkific

### Phase K1: Connection + Auth
1. Support `X-Auth-API-Key` and `X-Auth-Subdomain`.
2. Validate credentials + tenant reachability.

### Phase K2: Source Discovery
1. List courses/products available for import.
2. Pull curriculum/chapters/lessons and quiz objects where available.

### Phase K3: Mapping
1. Map Thinkific objects to normalized model.
2. Resolve product/course model differences via explicit mapping rules.
3. Capture unsupported types in warning map.

### Phase K4: Import Execution
1. Reuse shared importer pipeline and chunked writes.
2. Track object-level import counts and warnings in `summary`.

### Thinkific Acceptance Criteria
1. Admin can preview and import at least one multi-chapter course.
2. Imported ordering matches source ordering.
3. Job can resume from checkpoint after forced worker restart.

## Provider Plan: CSV

### Phase C1: CSV Spec (Platform-Agnostic)
1. Define required template:
- `course.csv`
- `sections.csv`
- `lessons.csv`
- `exercises.csv`
- `questions.csv`
- `options.csv`
2. Use `external_id` for parent-child linking.
3. Publish template download from dashboard.

### Phase C2: Parser + Validator
1. Parse ZIP/CSV with strict header validation.
2. Validate row-level integrity:
- missing parents
- invalid enum values
- duplicate `external_id`
- unsupported question types
3. Produce per-row error report in job logs.

### Phase C3: Import Execution
1. Convert CSV rows to normalized model.
2. Import with chunking and checkpointing.
3. Partial failure policy:
- fail-fast on schema errors
- continue-with-warning on optional fields

### CSV Acceptance Criteria
1. User can download template, upload filled ZIP, and preview row counts.
2. Invalid rows return actionable row/column errors.
3. Valid files import deterministically with stable ordering.

## Provider Plan: SCORM ZIP

### Phase S1: Package Intake
1. Accept ZIP upload and verify `imsmanifest.xml`.
2. Detect SCORM version (1.2 or 2004).
3. Enforce size limits and safe extraction constraints.

### Phase S2: Manifest Parsing
1. Parse organizations/items/resources from manifest.
2. Build normalized structure from SCO hierarchy.
3. Capture launch entrypoints and asset references.

### Phase S3: Import Execution
1. Create course/sections/lessons from manifest hierarchy.
2. Attach SCO launch package as lesson asset/content reference.
3. Preserve sequence/order from manifest.

### Phase S4: Runtime Boundary (v1)
1. Provide launchable SCORM content references.
2. Do not implement full runtime event/grade sync in v1.
3. Mark this explicitly in UI copy and docs.

### SCORM Acceptance Criteria
1. Valid SCORM ZIP imports as a structured course.
2. Learner can open imported SCORM lesson launch URL.
3. Invalid manifests fail with clear parser errors.

## Dashboard UX Plan
1. Import modal flow:
- pick provider
- connect/credential step (if needed)
- source selection or file upload
- preview summary
- start import job
2. Job progress view:
- status badge
- stage label
- progress bar
- warnings/errors panel
- retry/cancel actions
3. Completion:
- success snackbar
- deep link to imported course

## Testing Plan
1. Unit:
- adapter mapping functions
- CSV validators
- SCORM manifest parser
2. Integration:
- create/retry/cancel job endpoints
- worker claim/lease/recovery logic
3. E2E:
- start import from dashboard
- observe progress
- verify imported course structure

## Risks and Mitigations
1. Source API shape drift:
- versioned adapter layer + contract tests
2. Large imports timing out:
- async worker, chunking, heartbeat lease
3. Duplicate imports:
- idempotency keys and active-job uniqueness guard
4. Bad input files:
- strict validation and detailed row-level errors

## Build/Verification Commands
1. `pnpm --filter @cio/utils build`
2. `pnpm --filter @cio/db build`
3. `pnpm --filter @cio/api build`
4. `pnpm --filter @cio/dashboard build`

## Suggested First Sprint Slice
1. Shared foundation (schema + queries + worker skeleton + endpoints)
2. Teachable provider end-to-end
3. Dashboard import modal + job polling
