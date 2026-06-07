# SCORM Support Implementation Plan

## Purpose

Translate the SCORM Support PRD into an engineering-first execution order that fits current ClassroomIO conventions.

## Delivery Order

1. Data model and package storage
2. Manifest parser and package ingestion
3. Lesson linkage model
4. Learner runtime shell
5. Runtime persistence APIs
6. Progress/certification integration
7. Reporting and diagnostics

## 1. Data Model

### Schema work

Add SCORM-focused tables and relations in `packages/db/src/schema.ts`:

1. `scorm_package`
2. `scorm_package_item`
3. `scorm_registration`
4. `scorm_attempt`
5. `scorm_runtime_event`

Add lesson linkage for SCORM-backed content.

### Query layer

Add pure query modules under:

- `packages/db/src/queries/scorm/package.ts`
- `packages/db/src/queries/scorm/registration.ts`
- `packages/db/src/queries/scorm/attempt.ts`
- `packages/db/src/queries/scorm/runtime-event.ts`

## 2. Validation and Contracts

Add validation modules under:

- `packages/utils/src/validation/scorm/package.ts`
- `packages/utils/src/validation/scorm/runtime.ts`
- `packages/utils/src/validation/scorm/report.ts`

Include:

1. package upload metadata
2. lesson attachment payloads
3. runtime commit payload
4. reporting query params

## 3. Package Ingestion Service

Add services under:

- `apps/api/src/services/scorm/package.ts`
- `apps/api/src/services/scorm/manifest.ts`
- `apps/api/src/services/scorm/storage.ts`

Responsibilities:

1. upload intake
2. safe unzip
3. manifest parse
4. package metadata persistence
5. warning generation

## 4. Runtime Service

Add services under:

- `apps/api/src/services/scorm/runtime.ts`
- `apps/api/src/services/scorm/registration.ts`

Responsibilities:

1. create/resume learner registration
2. commit runtime writes
3. finalize attempts
4. map SCORM state to ClassroomIO lesson completion

## 5. Routes

Add routes under:

- `apps/api/src/routes/scorm/package.ts`
- `apps/api/src/routes/scorm/runtime.ts`
- `apps/api/src/routes/scorm/report.ts`
- `apps/api/src/routes/scorm/index.ts`

Mount under a single root segment in `apps/api/src/app.ts`:

- `.route('/scorm', scormRouter)`

## 6. Dashboard

Add feature areas under:

- `apps/dashboard/src/lib/features/scorm/api/`
- `apps/dashboard/src/lib/features/scorm/components/`
- `apps/dashboard/src/lib/features/scorm/utils/`

UI work:

1. package upload modal
2. package detail view
3. lesson editor integration
4. reporting table and learner detail drawer

## 7. Learner Shell

Add a SCORM player surface in dashboard lesson rendering.

Potential locations:

- `apps/dashboard/src/lib/features/scorm/components/scorm-player.svelte`
- `apps/dashboard/src/lib/features/scorm/components/scorm-shell.svelte`

Responsibilities:

1. load launch target
2. expose `API` and `API_1484_11`
3. buffer/set runtime values
4. commit and terminate on lifecycle boundaries

## 8. Progress Integration

Update existing course completion and reporting logic to include SCORM-backed lessons.

Primary touchpoints:

- `apps/api/src/services/course/completion.ts`
- `packages/db/src/queries/course/content.ts`
- `packages/db/src/queries/course/course.ts`

## 9. Testing

### Unit

1. manifest parser
2. runtime data model mapping
3. completion mapping

### Integration

1. upload and parse endpoints
2. runtime commit endpoint
3. registration resume behavior

### Compatibility

Store representative fixture packages and run regression checks against:

1. SCORM 1.2 export
2. SCORM 2004 export
3. relaunch/resume flow

## Build and Verification

1. `pnpm --filter @cio/utils build`
2. `pnpm --filter @cio/db build`
3. `pnpm --filter @cio/api build`
4. `pnpm --filter @cio/dashboard build`

## Suggested First Sprint Slice

1. schema + queries
2. package upload + parser
3. lesson linkage
4. narrow runtime proof of concept for one SCORM 1.2 package
