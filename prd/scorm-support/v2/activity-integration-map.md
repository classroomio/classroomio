# Course Activities: Integration Map and Regression Checklist

Companion to [`README.md`](./README.md) and [`implementation-plan.md`](./implementation-plan.md).

ClassroomIO assumes course content is sections, lessons and exercises in about 60 dashboard and server files, 13 progress calculations and 30 files that read or write `lesson_completion`. Adding **activities**, a third content type that holds SCORM now and cmi5, LTI and H5P later, touches all of them. This file lists every place, what it does today, what changes, which pull request owns it and which test proves nothing broke.

Built from four read-only inventories of the repository on 9 October 2026 (branch `feats/scorm-integration`). Paths are relative to the repository root. `C/` means `apps/dashboard/src/lib/features/course`, `D/` means `apps/dashboard/src`.

## How to use this file

- Every row is owned by one pull request in [`implementation-plan.md`](./implementation-plan.md). A PR is not done until its rows are checked and their tests pass.
- Rows marked **No change, by design** are decisions, not omissions. Changing one needs a PRD update first.
- Rows marked **Guard** add a check that refuses something, with a test for the refusal.
- New rows found during implementation are added here in the same PR.

## The four rules every row follows

1. **Zero-activity invariant.** For a course with no activities, every changed function returns exactly what it returns today: same rows, same counts, same order, same errors. PR 0c records those outputs before any change, and every later PR runs against them.
2. **Additive only.** No lesson, exercise, section or submission column changes. New tables and one new `course.format` column with a default.
3. **One predicate.** Every progress or completion calculation counts an activity as done through `isActivityCompletedSql` (an `exists` on `activity_completion.is_complete` for the profile). Each calculation keeps its current rule for lessons and exercises, even where those rules disagree with each other (§ 11).
4. **No silent fall-through.** PR 0d turns every `if lesson … else (assume exercise)` and every `'LESSON' | 'EXERCISE'` literal into an exhaustive `switch` with `assertNever`, a `Record<ContentType, …>` or a schema derived from the enum. After that, adding `ContentType.Activity` fails the build at every place that has not decided what to do.

## 1. Shared contracts

| # | Location | Today | Change | PR | Test |
| --- | --- | --- | --- | --- | --- |
| 1.1 | `packages/utils/src/constants/content.ts` `ContentType` | `SECTION`, `LESSON`, `EXERCISE` | Add `Activity = 'ACTIVITY'`. Add `ACTIVITY_KINDS = ['scorm'] as const` and `TActivityKind` in `packages/utils/src/constants/activity.ts` | 1 | Build fails if any exhaustive switch misses it |
| 1.2 | `packages/utils/src/functions/course-progression.ts` `itemBlocksProgression` | Lesson and exercise rules; any other type returns `false` | Activity blocks sequential progression until complete. Unknown types throw | 0d, 2 | `packages/utils/tests/course-progression.test.ts`: new cases with an activity first, middle and last |
| 1.3 | same file, `flattenNavigableItems`, `computeProgressionAccess` | Type-agnostic | No change. Tests add activity items | 2 | same |
| 1.4 | `packages/utils/src/functions/course-content.ts` `calculateNextContentOrder` | Type-agnostic shared order per section | No change. Tests add activities to the shared order space | 2 | `packages/utils/tests/course-content.test.ts` |
| 1.5 | `packages/core/src/services/course/utils.ts` and `apps/api/src/services/course/utils.ts` (duplicates) `buildCourseContent`, `CONTENT_TYPE_PRIORITY`, `mapCourseContentItems` | Two copies, `Record<ContentType, number>` | PR 0d deletes the API copy and imports the core one. PR 2 adds the activity priority (after exercise) and the activity fields `activityKind`, `activityStatus` | 0d, 2 | Characterization snapshot of `getCourse` content |
| 1.6 | `packages/utils/src/validation/course/course.ts` `ZCourseContentUpdateItem`, `ZCourseContentReorderItem`, `ZCourseContentReorder` (`${type}:${id}` key), `ZCourseContentDeleteItem` | `z.enum(['LESSON','EXERCISE'])` literals at lines 153 and 262 | PR 0d derives the enum from `ContentType`. PR 2 adds `ACTIVITY` | 0d, 2 | New schema tests: accepts all three, rejects `SECTION` where it is rejected today |
| 1.7 | `packages/core/src/services/agent/agent-tool-schemas.ts:365` `reorderContentParam` | String literals | Same as 1.6 | 0d, 3 | `apps/api/src/__tests__` agent reorder test (new) |
| 1.8 | `packages/utils/src/validation/assets/assets.ts` `AssetTargetType`, `slotType` | `lesson`, `exercise`, `question`; free-text slots | Add target `activity` and slot `activity_package` | 2 | Asset liveness test (4.40) |
| 1.9 | `packages/utils/src/validation/agent/agent.ts` `context` | `lessonId`, `exerciseId` | Add `activityId` | 3 | Agent context test |
| 1.10 | `packages/utils/src/validation/course/template-sync.ts` `TemplateUnitKind`, `Sync*` types | `section`, `lesson`, `exercise` | Add `activity` | 3 | `template-sync.test.ts` |
| 1.11 | `packages/utils/src/validation/course-import/course-import.ts` `ZCourseImportDraftPayload` (`lessons.min(1)`, `lessonLanguages.min(1)`, order contiguity per type) | Lessons required | Add `activities[]` that **reference existing activities only** (`existingActivityId`, `sectionExternalId`, `order`). Allow zero lessons when the course format is `scorm`. Contiguity check covers all three types in the shared order space | 3 | `lesson-video-schema.test.ts` plus new draft schema tests |
| 1.12 | `packages/utils/src/validation/public-api/course-member-responses.ts:46` `contentType`, counters; `analytics-responses.ts` totals | `lesson`, `exercise` | Add `activity`, `totalActivities`, `activitiesCompleted`. Additive fields only, so existing clients keep working | 3 | `packages/utils/tests/public-api-*-contract.test.ts` |
| 1.13 | `packages/utils/src/license/constants.ts`, `plan-features.ts` | Five license features; Early Adopter maps to custom domain and branding | Add `SCORM: 'scorm'`. Add it to the Early Adopter list (Enterprise already gets all) | 7 | `plan-features` unit test |
| 1.14 | `packages/utils/src/constants/course-type.ts` | Four types | No change. New `packages/utils/src/constants/course-format.ts` with `COURSE_FORMAT_VALUES = ['standard', 'scorm']` | 1 | — |
| 1.15 | `packages/utils/src/validation/organization/automation-key.ts` scopes, `packages/utils/src/plans/automation.ts` MCP costs | Exercise scopes | No change, by design: activities are read through the existing structure and analytics scopes; there are no activity write tools in version 1 | — | `routes-v1-mcp-default-scopes.test.ts` stays green |

## 2. Database schema (`packages/db/src/schema.ts`)

| # | Table or column | Change | PR |
| --- | --- | --- | --- |
| 2.1 | `course.format` | New `varchar(16) not null default 'standard'`, values from 1.14. Existing rows get `standard` | 1 |
| 2.2 | `course_activity` | New. Mirrors the structural columns of `lesson`: `course_id`, `section_id` (nullable), `order`, `is_unlocked`, `slug`, `source_id`, `source_synced_at`, plus `kind`, `title`, `instructions`. Full definition in `README.md` | 1 |
| 2.3 | `course_activity.section_id` on delete | `restrict`, like exercises (`exercise_section_id_fkey` is `no action`). The section delete service checks first and returns a 409 that names the activities (4.13) | 1 |
| 2.4 | `activity_completion` | New, keyed by profile like `lesson_completion`. Unique `(activity_id, profile_id)`. Cascades from the activity and the profile | 1 |
| 2.5 | `content_package_version`, `content_package_unit` | New, format-agnostic package tables shared by SCORM now and cmi5 and H5P later | 5 |
| 2.6 | `activity_scorm`, `scorm_attempt`, `scorm_sco_attempt`, `scorm_session_event` | New SCORM provider tables | 5 |
| 2.7 | `lesson`, `exercise`, `course_section`, `lesson_completion`, `submission`, `course_completion_record`, `groupmember` | **No change, by design** | — |
| 2.8 | Views `dash_org_stats`, `lesson_versions` | No change. `dash_org_stats` counts courses and students only | — |
| 2.9 | Migrations | PR 1 adds `0031_course_activities` (or the next free number after the high-water-mark check in `CLAUDE.md`). PR 5 adds the package and SCORM tables. No other PR adds a migration | 1, 5 |

## 3. Database queries (`packages/db/src/queries/`)

### 3a. Content listing and structure

| # | Function | Today | Change | PR | Test |
| --- | --- | --- | --- | --- | --- |
| 3.1 | `course/content.ts` `getCourseContentItems` | `UNION ALL` of section, lesson, exercise with per-type `isUnlocked`, `isComplete`, counts, `dueBy` | Add an activity branch: `type = 'ACTIVITY'`, `activityKind`, `isUnlocked`, `isComplete` through `isActivityCompletedSql`, `slug`, `order`, `sectionId`. Lesson and exercise branches unchanged | 2 | Characterization (zero activities) plus new mixed-course test |
| 3.2 | `course/content-batch.ts` `applyCourseContentBulkUpdates` | Splits items into lesson and exercise `CASE` updates; other types silently dropped | Add an activity `CASE` update. Unknown types throw | 0d, 2 | `content-timestamp.test.ts` plus new bulk-update test |
| 3.3 | `course/content-timestamp.ts` | Structural fields bump `updated_at` | No change; activity writes call it the same way | 2 | `content-timestamp.test.ts` |
| 3.4 | `course/course.ts` `updateLessonsSectionId`, `updateUngroupedLessonsSectionId` (and exercise twins in `exercise/exercise.ts`) | Grouping toggle helpers | New `updateActivitiesSectionId`, `updateUngroupedActivitiesSectionId` in `activity/activity.ts` | 2 | `update-course.test.ts` with an ungrouped activity |
| 3.5 | `course/course.ts` section CRUD, `deleteCourseSection` | Lessons cascade, exercises block | New `countActivitiesInSection` for the service guard (4.13) | 2 | Section delete test |
| 3.6 | `course/public-course.ts` `getPublicCourseTreeBySlug`, `getPublicCourseItem` | Lessons and exercises of `PUBLIC` courses | No change, by design: activities can never be in a `PUBLIC` course (4.20). A test inserts an activity row directly and checks the public tree ignores it | 2 | New public-tree test |
| 3.7 | `course/public-course.ts` `getTakenItemSlugs` | Lesson and exercise slugs | Add activity slugs; slugs are unique across all three per course | 2 | Slug test |
| 3.8 | `course/public-course.ts` `findNonAutoGradableQuestionsInCourse` | Guard for converting to `PUBLIC` | No change; the activity guard is separate (4.20) | — | — |
| 3.9 | New `activity/activity.ts` | — | CRUD, `getActivityById`, `getActivitiesByCourseId`, `getActivityNavInfoByIds`, `upsertActivityCompletion`, `markActivityCompleteOnce`, `getActivityCompletionsByProfile`, `countActivitiesInCourse`, `deleteActivity`. Optional trailing `DbOrTxClient` and `console.error('functionName error:', error)` in every catch | 1 | Unit and database tests |

### 3b. Progress and completion: all 13 calculations

Each row keeps its existing lesson and exercise rule and adds activities through `isActivityCompletedSql`. The characterization snapshot proves the zero-activity output is unchanged.

| # | Function | Counts today | Exercise rule today | Activity change | PR |
| --- | --- | --- | --- | --- | --- |
| 3.10 | `course/course.ts` `getCourseProgress` | lessons + exercises | Policy-aware, by groupmember | Add `activitiesCount`, `activitiesCompleted` | 2 |
| 3.11 | `course/course.ts` `getEnrolledCourses` (student home) | lessons + exercises; `progressRate` = completed lessons | Policy-aware, by profile | Add `activityCount`, `activitiesCompleted` | 2 |
| 3.12 | `course/course.ts` `getOrgCourses`, `getExploreCourses` | Counts only | — | Add `activityCount` | 2 |
| 3.13 | `course/people.ts` `progressSummaryLateral` (via `getPaginatedCourseMembers`) | lessons + exercises; certificate forces 100 | Policy-aware | Add activities to `total_items` and `completed`, joining groupmember to profile | 2 |
| 3.14 | `organization/audience.ts` `enrolmentSummaryLateral` and its callers | lessons + exercises | Any submission | Add activities | 2 |
| 3.15 | `analytics/analytics.ts` `getProfileCourseProgress` | lessons + exercises | Any submission | Add activities | 2 |
| 3.16 | `analytics/analytics.ts` `getLessonsWithCompletion` | Per-lesson list | Legacy `lesson_id` | **No change, by design**: per-lesson report. Activities have their own Results panel | — |
| 3.17 | `dash/dash.ts` `getCourseStats` | Lessons only | None | Add activities to numerator and denominator, so a SCORM course does not show 0% | 2 |
| 3.18 | `cohort/goal.ts` `getNonComplianceCourseCompletions` | “All lessons complete” | None | Add activities. **Must change**: a SCORM course has no lessons, so it would otherwise count as done or never done depending on the empty-set handling | 2 |
| 3.19 | `course/member-progress.ts` `getCourseTrackableContentCounts`, `getBatchLessonCompletionsForCourse`, `getBatchCompletedExerciseIdsForMembers` | lessons + exercises | Policy-aware | Add `activityIds`, `getBatchActivityCompletionsForCourse` | 2 |
| 3.20 | `course/progression.ts` policies and completed-id helpers | Lesson and exercise | Policy-aware | Add `isActivityCompletedSql`, `getActivityProgressionPolicies`, `getCompletedActivityIdsForProfile` | 2 |
| 3.21 | `course/content.ts` per-item `isComplete` | Covered by 3.1 | — | — | 2 |
| 3.22 | `exercise/exercise.ts` `getExerciseCompletion(s)ByProfile` | Per exercise | Any submission | No change | — |

### 3c. Lifecycle, copy and other queries

| # | Function | Change | PR | Test |
| --- | --- | --- | --- | --- |
| 3.23 | `course/reset-progress.ts` `getStudentCourseProgressImpactCounts`, `resetStudentCourseProgress` | Count and delete `activity_completion` for the course’s activities and call each provider’s reset (SCORM attempts) in the same transaction | 2, 11 | `reset-member-course-progress.test.ts` plus rollback test |
| 3.24 | `course/course-template.ts` `stampCopiedTemplateUnits` | Add `activityIds` | 3 | `course-template-integrity.test.ts` |
| 3.25 | `course/template-sync.ts` `shiftLessonOrders`, `shiftExerciseOrders`, `shiftCourseSectionOrders` | New `shiftActivityOrders`; template pull shifts all three in the shared order space | 3 | `template-sync.test.ts` |
| 3.26 | `course/template-assets.ts` `assetReferencedByGlobalTemplate` | Include package assets referenced by `activity_scorm.asset_id` | 13 | Template asset test |
| 3.27 | `organization/member-lifecycle.ts` `reconcileMemberLastActive` | Add `activity_completion.updated_at` and the latest SCORM commit time to the activity signal | 2, 11 | Lifecycle test |
| 3.28 | `agent/chat-resource.ts` `getLessonCourseBinding`, `getExerciseCourseBinding` | New `getActivityCourseBinding` | 3 | Agent binding test |
| 3.29 | `assets/assets.ts` usage functions | Usable as-is with target `activity` | 2 | 4.40 |
| 3.30 | `scripts/lib/org-deletion.ts` | Delete activities, package versions and SCORM attempts with the organization | 2 | Org deletion script test |
| 3.31 | `lesson/*`, `exercise/*`, `submission/*`, `mark/mark.ts`, `attendance/*`, `course/session.ts`, `course/live-session-reminder.ts`, `course/compliance.ts`, `course/certification-exercise.ts`, `exercise/lms.ts`, `report/targets.ts` | **No change, by design** (see § 10) | — | Existing tests stay green |

### 3d. Seeds

| # | Location | Change | PR |
| --- | --- | --- | --- |
| 3.32 | `packages/db/src/utils/seed/*` | No change to existing seeds, so characterization fixtures stay stable. New opt-in seed `scormActivities.ts` adds one SCORM item to HIPAA Awareness 2026 and one SCORM-format course to Coursera Test, behind `SEED_SCORM=true` | 13 |

## 4. API and core services

### 4a. Content structure

| # | Location | Today | Change | PR | Test |
| --- | --- | --- | --- | --- | --- |
| 4.1 | `packages/core/src/services/course/content.ts` `getCourseContentMap`, `assertCourseContentItems` | Lesson and exercise branches | Add activity | 0d, 2 | New `content.ts` service tests |
| 4.2 | same, `normalizeDeleteItems` | Keeps lessons and exercises, drops others | Keep activities; unknown types throw | 0d, 2 | same |
| 4.3 | same, `deleteCourseContent` | `else` branch treats any non-lesson as an exercise; clears lesson asset usages only | Exhaustive switch. Activity delete calls the provider’s `delete` (asset usage, attempts) in one transaction | 0d, 2 | same, plus rollback test |
| 4.4 | same, `reorderCourseContent`, `updateCourseContent`, `CourseContentReorderResult` | Lessons and exercises | Add activities and `updatedActivities` | 2 | same |
| 4.5 | `apps/api/src/routes/course/content.ts` `PUT /reorder`, `PUT /`, `DELETE /` | Accepts lesson and exercise | Accepts activity through 1.6; same middleware | 2 | Route test |
| 4.6 | `packages/core/src/services/course/section.ts` `promoteUngroupedSection` | Moves ungrouped lessons and exercises | Also activities | 2 | Section test |
| 4.7 | `packages/core/src/services/course/course.ts` `updateCourse` grouping toggle (lines ~490–520) | Checks lessons and exercises | Also activities | 2 | `update-course.test.ts` |
| 4.8 | same, `updateCourse` type change (lines 429–453) | Public conversion and compliance deadline | **Guard**: refuse `PUBLIC` while the course has activities, naming them. **Guard**: a `scorm`-format course accepts only `SELF_PACED` or `COMPLIANCE` | 2, 12 | `update-course.test.ts` |
| 4.9 | same, `getCourse` | Annotated content tree | Inherits 3.1 | 2 | Characterization |
| 4.10 | `packages/core/src/services/course/slug.ts` `resolveItemSlug` | Lesson and exercise slugs | Include activities (3.7) | 2 | Slug test |
| 4.11 | `packages/core/src/services/course/go-live-readiness.ts` `evaluateCourseGoLiveReadiness` | Counts lessons and exercises; lesson content and exercise question checks | Activities count as learning items. New blocker `ACTIVITY_NOT_READY` when a package has no ready current version | 2, 7 | `course-go-live-readiness.test.ts` |
| 4.12 | New `packages/core/src/services/activity/activity.ts` | — | Create, update, delete, lock, settings, launch dispatch, completion side effects, all through the provider registry | 1, 2 | Unit and database tests |
| 4.13 | `packages/core/src/services/course/section.ts` `deleteCourseSectionService` | Raw delete; exercises hit the foreign key | **Guard**: count activities first and return 409 `SECTION_HAS_ACTIVITIES` with their titles | 2 | Section test |
| 4.14 | New `assertCourseAcceptsContent(courseId, contentType)` | — | **Guard**: a `scorm`-format course refuses new sections, lessons, exercises and a second activity. Called from lesson, exercise, section and activity create, draft publish to an existing course, and the public API structure update | 12 | Guard tests for every caller |

### 4b. Access, progression and completion

| # | Location | Today | Change | PR | Test |
| --- | --- | --- | --- | --- | --- |
| 4.15 | `packages/core/src/services/course/progression.ts` `annotateCourseContentWithProgression`, `annotateNavigableAccess`, `assertStudentCanAccessContent` | Lesson and exercise; `isComplete` returns `true` for unknown types | Add activity policies and completions; exhaustive switch; widen the type | 0d, 2 | New progression service tests |
| 4.16 | `apps/api/src/services/course/access.ts` `assertEnrolledStudentContentAccess` | `Lesson | Exercise` | Widen to Activity | 2 | Access test |
| 4.17 | `apps/api/src/services/course/completion.ts` `evaluateCourseCertification`, `buildCertificationEvaluation`, `evaluateFinalExerciseRule` | Lessons and exercises; `CERT_NO_CONTENT` | Activities count toward the threshold; an activity-only course is not `CERT_NO_CONTENT`. Final-exercise rule unchanged | 2 | New certification tests |
| 4.18 | `apps/api/src/utils/course-completion.ts` `calcCourseProgressPercent` | Lesson and exercise arguments | Add activity arguments | 2 | Unit test |
| 4.19 | `apps/api/src/services/course/compliance.ts` `syncComplianceProgressFromSubmission`, `getComplianceCompletionSnapshot` | Exercise submissions only; score from `requiredExerciseId` | PR 0b extracts `syncComplianceProgressForMember(courseId, profileId, source)`, called from submissions, lesson completion and (PR 10) activity completion. In a `scorm`-format course the snapshot takes score and attempts from the package (best lesson-attempt score, attempt count) | 0b, 10 | Compliance tests (new) |
| 4.20 | `packages/core/src/services/course/public-course-guard.ts`, `apps/api/src/services/course/public-course.ts` | `kind: 'lesson' | 'exercise'` | **Guard**: activities are never created in `PUBLIC` courses (4.8). Public item lookups ignore activities | 2 | Public course test |
| 4.21 | `apps/api/src/services/course/member-progress.ts` `getCourseMemberProgressSummaries`, `toTrackableContentItems`, `stage.contentType` | `'lesson' | 'exercise'`; line 112 falls back to `'lesson'` | Add `'activity'`; exhaustive | 0d, 2 | `member-progress.test.ts` |
| 4.22 | `apps/api/src/services/course/people.ts` `resetMemberCourseProgress` | Lessons, video, submissions | Inherits 3.23 | 2, 11 | `reset-member-course-progress.test.ts` |
| 4.23 | `packages/core/src/services/course/course.ts` `getCourseProgress`, `getCourseAnalytics`, `buildCourseStudentAnalytics`, `getUserCourseAnalytics` | Lesson and exercise totals and rates | Add activity totals and rates | 2 | Analytics tests |
| 4.24 | `apps/api/src/services/organization.ts` `getUserAnalytics` | Lesson + exercise percentage | Add activities | 2 | Analytics test |
| 4.25 | `apps/api/src/services/cohort/goal.ts` | Inherits 3.18 | — | 2 | `services-cohort-goal.test.ts` |
| 4.26 | `apps/api/src/services/v1/analytics/course.ts`, `learner.ts` | Maps totals | Map activity fields (1.12) | 3 | `services-v1-analytics.test.ts` |
| 4.27 | `packages/core/src/services/lesson/lesson.ts` completion and watch progress | Lesson only | No change | — | Existing |
| 4.28 | `apps/api/src/services/submission/submission.ts` `triggerCertificationIfExerciseComplete` | Exercise only | No change; activity completion has its own side-effect path (4.12) | — | Existing |

### 4c. Copy, templates and import

| # | Location | Today | Change | PR | Test |
| --- | --- | --- | --- | --- | --- |
| 4.29 | `apps/api/src/services/course/clone.ts` `cloneCourseWithClient`, `syncLessonAssetUsages`, `remapContentAssets` | Copies sections, lessons, languages, exercises, questions; remaps `requiredExerciseId` | Copy activities and `course.format`. Provider `copy`: same organization shares the package asset and adds a usage; another organization transfers the asset and its storage prefix through `asset-transfer.ts`. Learner data is never copied | 3, 13 | `course-template-integrity.test.ts`, `asset-transfer.test.ts` |
| 4.30 | `apps/api/src/services/course/course-template.ts` `getCourseTemplatePreview`, `createCourseFromTemplate`, `saveCourseAsTemplate` | Lesson and exercise outline and counts | Add activities to the preview; the other two inherit clone | 3 | Template tests |
| 4.31 | `apps/api/src/services/course/template-sync.ts` `loadGraph`, `getCourseTemplateUpdates`, `pullCourseTemplateUpdates`; `detectTemplateContentChanges`, `preparePullSelection` | Three unit kinds | Add the `activity` kind: title, instructions, settings and package version changes are detectable and pullable | 3, 13 | `template-sync.test.ts` |
| 4.32 | `apps/api/src/services/course-import/course-import.ts` `buildCourseStructureSnapshot` | Throws when a course has no lessons | Include activities; an activity-only course is valid | 3 | New snapshot tests |
| 4.33 | same, `buildDraftExercisesSnapshot`, `resetCourseContentForDraftRetry`, `buildDraftSummary`, `getCourseImportStructureService` | Lessons and exercises | Include activities as references | 3 | same |
| 4.34 | same, `publishCourseImportDraftService`, `publishCourseImportDraftToExistingCourseService` (replace mode deletes unreferenced lessons, exercises, sections) | — | Drafts never create or delete activities; they may place referenced ones. Replace mode keeps unreferenced activities. **Guard**: publishing fails with `ACTIVITY_SECTION_REMOVED` when it would delete a section that still holds an activity. Refused for `scorm`-format courses (4.14) | 3, 12 | New publish tests, both modes |
| 4.35 | `apps/api/src/services/v1/courses/course.ts` `exportCourseService`, `updatePublicApiCourseStructureService` | Uses the import services | Inherits 4.32 to 4.34 | 3 | `services-v1-course-*.test.ts` |

### 4d. Assets, media and storage

| # | Location | Today | Change | PR | Test |
| --- | --- | --- | --- | --- | --- |
| 4.36 | `packages/core/src/services/assets/assets.ts` `resolveLiveAssetUsages` | Only `targetType === 'lesson'` is enriched and checked for liveness | Add the `activity` target: live while the activity exists, enriched with course and activity title | 2 | New liveness test |
| 4.37 | same, `deleteAssetService`, `getAssetUsageGraphService` | 409 `ASSET_IN_USE` from live usages | Inherits 4.36, and `activity_scorm.asset_id` is `restrict`, so the database refuses too | 2, 5 | Delete-in-use test |
| 4.38 | `clone.ts` `LESSON_MEDIA_SLOTS`, `core/services/lesson/lesson.ts` `deleteLessonService` usage cleanup | Lesson slots | No change; activity usage cleanup lives in the provider’s `delete` | — | — |
| 4.39 | `packages/core/src/services/assets/asset-transfer.ts` | Transfers HLS prefixes | Transfers a package asset with all its versions’ prefixes | 13 | `asset-transfer.test.ts` |
| 4.40 | `apps/api/src/routes/organization/assets.ts` usage, attach, detach, create-and-attach, delete | Lesson, exercise, question targets | Accept `activity`; attach of `activity_package` only through the activity service | 2 | Route test |
| 4.41 | `apps/jobs/src/workers/maintenance.ts` `assetStorageCleanup` | HLS and file prefixes | Include package prefixes and the original ZIPs | 6 | Maintenance test |

### 4e. Routes that need no change

| # | Location | Why |
| --- | --- | --- |
| 4.42 | `routes/course/lesson.ts`, `lesson-language.ts`, `exercise.ts`, `submission.ts`, `mark.ts`, `compliance.ts`, `attendance.ts`, `live-session-reminder.ts`, `presign.ts`, `ai-tutor.ts`, `section.ts` (except 4.6, 4.13) | Lesson-, exercise- or section-only. Activity routes are new files (README § API and Route Plan). The `isUnlocked` team-only check in `exercise.ts` is copied to the activity router |
| 4.43 | `routes/course/course.ts` `GET /slug/:slug`, `POST /:courseId/download/content` | Public lookup; lesson-only PDF export, by design |

## 5. Jobs

| # | Location | Change | PR |
| --- | --- | --- | --- |
| 5.1 | `packages/jobs/src/queues/names.ts`, `defaults.ts`, new `payloads/activity-package.ts`, `enqueue/activity-package.ts`; `apps/jobs/src/workers/activity-package.ts`, `processors/activity-package/process-scorm.ts` | New `activity-package` queue. The processor dispatches by package format, so cmi5 and H5P add a processor, not a queue | 6 |
| 5.2 | `processors/notifications/notify-course-exercise.ts`, `session-reminder-scan.ts`, `notify-session-update.ts`, `workers/agent-course-generation.ts` | **No change, by design** | — |
| 5.3 | `workers/maintenance.ts` `memberActivityReconcile`, `lessonVersionRetention`, new retention task | Inherits 3.27; adds deletion of diagnostic events after 90 days and unpinned package versions 30 days after replacement | 11, 14 |

## 6. MCP, agents and the public API

| # | Location | Change | PR | Test |
| --- | --- | --- | --- | --- |
| 6.1 | `packages/mcp/src/tools/course-drafts.ts` `get_course_structure` | Returns activities (inherits 4.32); description mentions them | 3 | MCP snapshot test |
| 6.2 | same, `reorder_course_content` | Description says “LESSON, EXERCISE or ACTIVITY” | 3 | — |
| 6.3 | same, `create_course_draft*`, `update_course_draft`, `publish_course_draft*` | Draft guidance: activities can be placed, not created | 3 | Draft tests |
| 6.4 | `packages/mcp/src/tools/analytics.ts` | Wording mentions activities | 3 | — |
| 6.5 | `packages/core/src/services/agent/chat-tools.ts` `get_course_structure`, `reorder_content` (line 969 `'LESSON'` with an `else` that assumes exercise) | Exhaustive switch; activity support in reorder. No create or update tools for activities, by design | 0d, 3 | New agent tool test |
| 6.6 | `packages/core/src/services/agent/chat-context.ts` | New `verifyActivityBelongsToCourse`; context carries title and instructions only | 3 | Agent context test |
| 6.7 | `apps/api/src/services/agent/student-tools.ts` `get_course_outline`, `search_course` | Activities appear in the outline and search by title and instructions; `read_activity` is not added | 3 | `student-tools.test.ts` |
| 6.8 | `packages/ai-assistant/src/tools/shared.ts` | Descriptions mention activities | 3 | — |
| 6.9 | `apps/api/src/routes/agent/agent.ts` `POST /agent/chat` | Accepts `context.activityId` (1.9) | 3 | Agent route test |
| 6.10 | `apps/api/src/routes/v1/courses/*`, `apps/docs/openapi/public-api.json` | Structure, export, analytics and members responses gain activity fields; OpenAPI updated | 3, 15 | Public API contract tests |

## 7. Dashboard (`apps/dashboard/src`)

### 7a. Shared utilities

| # | Location | Today | Change | PR | Test |
| --- | --- | --- | --- | --- | --- |
| 7.1 | `C/utils/content.ts` `CONTENT_DEFINITIONS`, `getContentRoute`, `NAVIGABLE_CONTENT_TYPES`, `getOrderedNavigableContent`, `getMentionableContent`, `getContentItemsProgress`, `getCourseProgress` | Lesson and exercise; unknown type routes to `''` | Activity definition (icon by kind), route `/courses/:id/activities/:activityId`, navigable, `activitiesTotal`, `activitiesComplete` | 4 | New `content.test.ts` (PR 0c) |
| 7.2 | `C/utils/content-navigation.ts` | Works on the navigable list | No change once 7.1 lands; tests add activities | 4 | New tests (PR 0c) |
| 7.3 | `C/utils/content-lock-utils.ts` `LockedContentItem`, `collectLockedContentItems`, `getStudentContentLockDescriptionKey` | Coerces any non-exercise to lesson | Exhaustive; activity i18n key | 0d, 4 | New tests (PR 0c) |
| 7.4 | `C/utils/lesson-completion-state.ts` | Toggle for lessons only | No change: activities never toggle | — | Existing |
| 7.5 | `C/utils/content-completion.ts` `updateLessonCompletionInCourseContent` | Patches lessons | New `updateContentCompletion(type, id, isComplete)` used by lessons, exercises and activities | 4 | New test |
| 7.6 | `C/utils/toggle-lesson-completion.ts`, `C/components/exercise/view-mode.svelte` (lines 209–222) | Two copies of “all complete → completion modal” | One helper `openCourseCompletionIfDone`, used by lessons, exercises and activities | 4 | New test |
| 7.7 | `C/utils/sidebar-routes.ts` `isCourseContentRoute` | `/lessons`, `/exercises` | Add `/activities` | 4 | Unit test |
| 7.8 | `C/utils/functions.ts` `getActiveCourseNavKey`, `calcCourseProgress`, `calcProgressRate` | Lesson and exercise | Activity segment maps to `nav_content` (or `nav_package` in a SCORM course); counts include activities | 4, 12 | Unit test |
| 7.9 | `C/utils/mobile-bottom-nav.ts` | Lesson or exercise page flag | Content page flag covers activities | 4 | Unit test |
| 7.10 | `C/utils/student-course-navigation.ts` `getStudentCourseContinuePath` | `/lessons?next=true` | No change for standard courses; SCORM course goes to its activity | 12 | Unit test |
| 7.11 | `D/lib/features/ai-assistant/utils/content-ask-ai-bar.ts` | `Lesson | Exercise` | Widen | 4 | — |
| 7.12 | `C/utils/types.ts`, `C/types.ts`, `C/components/content/types.ts`, `C/components/lesson/content-action-helpers.ts`, `content-lock-utils.ts`, `ui/course-landing-page/utils.ts` | Lesson and exercise shapes | Types infer the new fields from the API; hand-written unions widened | 4 | `svelte-check` |

### 7b. Admin content authoring

| # | Location | Today | Change | PR |
| --- | --- | --- | --- | --- |
| 7.13 | `C/pages/lessons.svelte` | Stats for sections, lessons, exercises; `?next=true` hard-codes routes | Activities stat; use `getContentRoute` | 4 |
| 7.14 | `C/components/lesson/content-section-list.svelte`, `content-list.svelte` | Render `{#if Lesson}{:else if Exercise}`; reorder persists only lesson and exercise; `getItemPath` treats non-lessons as exercises | Activity row (title, kind chip, status chip, lock), reorder and paths. Activities can move between sections like lessons | 4 |
| 7.15 | `C/components/lesson/content-action-helpers.ts` | Exercise API else lesson API | Exhaustive; `activityApi` branch | 0d, 4 |
| 7.16 | `C/components/lesson/section-header.svelte`, `C/components/content-count-badges.svelte` | Lesson and exercise counts | Activity count | 4 |
| 7.17 | `C/components/course-content-icon.svelte` | Indexes `CONTENT_DEFINITIONS`; unknown type crashes | Activity icon per kind | 4 |
| 7.18 | `C/components/lesson/content-page-menu.svelte` | Unlock all, grouping toggle | Widen types | 4 |
| 7.19 | `C/components/content/constants.ts` `CONTENT_OPTIONS`, `SUCCESS_SENTENCE_KEYS`, `REPEAT_LABEL_KEYS` | Typed `Record<ContentType, …>` | SCORM package option, keys, `ACTIVITY_STEPPER_DEFAULT_STATE`; option shows the plan or license state | 7 |
| 7.20 | `C/components/content/content-create-modal.svelte` | Stepper ternaries and render | New `activity-create-stepper.svelte`; hidden in `PUBLIC` and `scorm`-format courses | 7 |
| 7.21 | `C/api/content.svelte.ts`, `C/api/course.svelte.ts` `updateContentItem`, `removeContentItem` | `Lesson | Exercise` | Widen | 4 |
| 7.22 | New `C/api/activity.svelte.ts` | — | `ActivityApi extends BaseApiWithErrors` | 4 |

### 7c. Learner navigation, progress and completion

| # | Location | Change | PR |
| --- | --- | --- | --- |
| 7.23 | `C/components/sidebar/course-content-tree.svelte`, `C/components/mobile/course-mobile-outline-tree.svelte`, `course-mobile-outline-sheet.svelte` | Activity rows through 7.1 and 7.17 | 4 |
| 7.24 | `C/components/sidebar/course-sidebar-footer-nav.svelte`, `C/components/mobile/course-mobile-bottom-nav.svelte` | Widen the lock coercion; no mark-complete toggle on activities | 4 |
| 7.25 | `C/components/lesson/content-navigation-actions.svelte` | `activityId` prop; current type exhaustive | 4 |
| 7.26 | `C/components/student-content-locked-notice.svelte` | Widen | 4 |
| 7.27 | `C/components/course-progress-card.svelte` | Activities line (“2 of 3 packages”) | 4 |
| 7.28 | `C/components/sidebar/course-sidebar-logo.svelte`, `course-progress-popover.svelte`, `course-sidebar.svelte` | No change once 7.1 lands | — |
| 7.29 | `D/routes/(app)/courses/[id]/+layout.svelte`, `C/components/course-header.svelte` | `activityId` param for the AI bar, bottom nav and lock check | 4 |
| 7.30 | New `D/routes/(app)/courses/[id]/activities/[activityId]/+page.server.ts`, `+page.svelte`, `C/pages/activity.svelte` (dispatches to the kind’s editor or player) | — | 4, 7, 10 |

### 7d. Settings, people, analytics, compliance, certificates

| # | Location | Change | PR |
| --- | --- | --- | --- |
| 7.31 | `C/pages/settings.svelte` | Widen unlock-all; SCORM course hides grouping and progression; **Convert to a standard course** | 4, 12 |
| 7.32 | `C/pages/analytics.svelte`, `components/analytics/course-analytics-kpis.svelte`, `student-table.svelte`, `C/utils/course-analytics-export-utils.ts` | Activity totals and rates (from 4.23) | 4 |
| 7.33 | `C/components/people/student-course-rail.svelte`, `student-exercise-list.svelte` | Activities entry and list with status and score | 11 |
| 7.34 | `C/components/people/reset-progress-dialog.svelte` | Activity attempts bullet (from 3.23) | 11 |
| 7.35 | `C/pages/compliance.svelte`, `C/utils/compliance-utils.ts` `getCourseContentProgress` | Include activity counts | 4 |
| 7.36 | `C/pages/marks.svelte`, `submissions.svelte`, `attendance.svelte` | **No change, by design**. Hidden in SCORM courses (7.45) | — |
| 7.37 | Certificates (`C/utils/certificate-utils.ts`, `ceritficate/*`) | No change; server-driven | — |

### 7e. Course lists, learner home, audience, widgets, landing page

| # | Location | Change | PR |
| --- | --- | --- | --- |
| 7.38 | `C/components/card.svelte`, `course-list-row.svelte`, `list.svelte`, `C/pages/courses.svelte` | Activity count; SCORM course shows “SCORM · N modules” | 4, 12 |
| 7.39 | `D/lib/features/lms/pages/dashboard.svelte`, `D/routes/(app)/lms/+page.svelte` | Include activities in totals | 4 |
| 7.40 | `D/lib/features/lms/pages/explore.svelte`, `lms/components/course-preview-modal.svelte` | Activity count | 4 |
| 7.41 | `D/lib/features/audience/components/student-course-card.svelte`, `student-profile-rail.svelte` | Completion uses activity counts | 4 |
| 7.42 | `D/lib/features/widget/panels/select-courses-panel.svelte`, `D/lib/features/org/utils/landing-page.ts` (lines 696–727) | Activity count | 4 |
| 7.43 | `D/lib/features/ui/course-landing-page/utils.ts` `getLessonsFromItems`, `getCourseSections`, `buildCourseLandingPageProps` | Curriculum lists activities in their sections; SCORM course lists the package and its modules | 4, 12 |
| 7.44 | Public org-site routes and `C/utils/public-course-mappers.ts` | No change: activities never reach `PUBLIC` courses (4.20) | — |

### 7f. SCORM course format

| # | Location | Change | PR |
| --- | --- | --- | --- |
| 7.45 | `C/components/sidebar/course-sidebar-navigation.svelte`, `C/components/sidebar/constants.ts` `NAV_IDS`, `C/utils/functions.ts` `getNavItemRoute` | In a `scorm`-format course, the Content item becomes **Package** (same position, click to enter, no tree, no badges, no add button). Submissions, Marks and Attendance are hidden. Learners see News Feed (when on), Package and Certificates | 12 |
| 7.46 | `C/components/new-course-modal.svelte` | First choice “Build a course” or “Upload a SCORM package”; SCORM path offers Self-paced or Compliance, a title and the upload | 12 |
| 7.47 | `C/pages/lessons.svelte`, `D/routes/(app)/courses/[id]/+page.svelte` | `/lessons` and `?next=true` redirect to the package in a SCORM course | 12 |
| 7.48 | `C/components/sidebar/course-sidebar-footer-nav.svelte`, mobile bottom nav | Prev and next hidden in a SCORM course; progress ring stays | 12 |

### 7g. AI assistant, templates, misc

| # | Location | Change | PR |
| --- | --- | --- | --- |
| 7.49 | `D/lib/features/ai-assistant/ai-course-chat.svelte`, `utils/mentions.ts`, `mention-popover.svelte`, `chat-changes-card.svelte`, `utils/tool-line.svelte` | `activityId` context; `activity` mentions and routes | 4 |
| 7.50 | `C/components/template-settings-section.svelte`, `template-review-sheet.svelte`, `template-preview-dialog.svelte` | Activity kind in counts, review and preview | 4 |
| 7.51 | `D/lib/features/media/components/asset-usage-list.svelte` | Activity usage links | 4 |
| 7.52 | `D/lib/features/ai-tutor-settings/*`, `D/lib/features/search/*`, `D/lib/features/lms/pages/exercises.svelte`, `D/routes/(app)/cohorts/*` | **No change, by design** | — |
| 7.53 | Translations `D/lib/utils/translations/*.json` | `course.navItem.lessons.add_content_options.activity_scorm`, created and repeat keys, stats, lock description, `course.sidebar.content_count.activities`, `courses.course_card.activities_count`, `course_templates.sync.kind.activity`, nav `package`; `pnpm translate` and a placeholder check | 4, 7, 12 |
| 7.54 | Dead code noted by the inventory (`course-content-sidebar-navigation.svelte`, `sidebar-history.ts`, `sections-display.svelte`, `marks-utils.processMarksIntoExercises`) | Leave alone in this project; raise a cleanup task | — |

## 8. Shared UI packages and embeds

| # | Location | Change | PR |
| --- | --- | --- | --- |
| 8.1 | `packages/ui/src/custom/org-landing-page/course-curriculum.svelte` and per-theme curricula | Render activity rows and the SCORM course module list; Storybook stories updated | 4, 12 |
| 8.2 | `packages/ui/src/custom/public-course/*` | No change (4.20) | — |
| 8.3 | `packages/ui/src/custom/widget-layouts` `utils.ts` lines 62–63, `apps/embeds/course-widget` | Optional activity count in the meta line | 4 |
| 8.4 | Icon set (`moving-icons` or Lucide) | Package icon for activities | 4 |

## 9. Documentation

| # | Location | Change | PR |
| --- | --- | --- | --- |
| 9.1 | `apps/help/content/help/build-courses/add-a-scorm-package.mdx`, `create-a-scorm-course.mdx`, `analytics-and-reporting/review-scorm-results.mdx` | New articles with framed screenshots | 15 |
| 9.2 | `apps/docs/content/docs/self-hosted/101.mdx`, `enterprise.mdx` | SCORM joins the enterprise list (decision 3) | 15 |
| 9.3 | `apps/docs/content/docs/self-hosted/scorm.mdx`, `docker/docs/SELF_HOST.md`, Coolify, Dokploy and Railway references | Content hostname and `SCORM_CONTENT_ORIGIN` | 15 |
| 9.4 | `apps/docs/openapi/public-api.json` | Activity fields | 15 |

## 10. Lesson and exercise features activities do not get in version 1

These are deliberate. Each row stays green in the regression suite because nothing about lessons or exercises changes.

| Feature | Lessons | Exercises | Activities v1 |
| --- | --- | --- | --- |
| Comments | Yes | — | No |
| Translations per locale | Yes (`lesson_language`) | — | No; instructions in one language |
| Version history | Yes (`lesson_versions`) | — | No; package versions instead |
| Live session fields, reminders, attendance | Yes | — | No |
| PDF download | Yes | — | No |
| Video watch policy | Yes | — | No |
| Submissions, grading, marks gradebook | — | Yes | No; Results panel instead |
| Notify students | — | Yes | No |
| Certificate “required final exercise” | — | Yes | No; in a SCORM course the package is the scored item for compliance (4.19) |
| AI tutor reads the content | Yes | Yes | Title and instructions only |
| `PUBLIC` courses | Yes | Yes | No |
| Create or edit through MCP and drafts | Yes | Yes | Place and reorder only |

## 11. Pre-existing inconsistencies, not fixed here

The inventory found progress rules that disagree for exercises: some count an exercise as done on any submission (`enrolmentSummaryLateral`, `getProfileCourseProgress`, `getExerciseCompletion(s)ByProfile`), others apply the completion policy, and three ignore exercises entirely (`getLessonsWithCompletion`, `getCourseStats`, `getNonComplianceCourseCompletions`). Fixing them changes numbers customers see today, so this project leaves them as they are and only adds activities. A separate task should unify them on `isExerciseCompletedSql`.

## 12. Tests

### Existing tests that must stay green on every PR

- `apps/api/src/__tests__/`: `course-go-live-readiness`, `reset-member-course-progress`, `gradebook-privacy`, `content-timestamp`, `course-template-integrity`, `template-sync`, `asset-transfer`, `lesson-video-schema`, `lesson-version-sessions`, `lesson-transcript-status`, `agent-lesson-content`, `question-update`, every `services-v1-*` and `routes-v1-*` test.
- `apps/api/src/services/course/__tests__/member-progress.test.ts`, `update-course.test.ts`; `apps/api/src/services/agent/student-tools.test.ts`; middleware and automation-key scope tests.
- `packages/utils/tests/`: `course-progression`, `course-content`, `public-api-course-member-contract`, `public-api-analytics-contract`, `public-api-course-certificate`.
- Dashboard: `C/utils/content-navigation.test.ts`, `exercise-progression-utils.test.ts`, `compliance-utils.test.ts`, `ui/course-landing-page/utils.test.ts`.

### Characterization tests added first (PR 0c)

Run against seeded courses with no activities: a grouped course, an ungrouped course, a compliance course with a final exercise, a template-derived course, and a course with locks and sequential progression. Each records today’s output and fails on any difference.

- Database: every function in § 3b, `getCourseContentItems`, `getPublicCourseTreeBySlug`, `getStudentCourseProgressImpactCounts`, `stampCopiedTemplateUnits`, template shift functions.
- Services: `getCourse`, `evaluateCourseCertification`, `calcCourseProgressPercent`, `evaluateCourseGoLiveReadiness`, `reorderCourseContent`, `updateCourseContent`, `deleteCourseContent`, `promoteUngroupedSection`, `deleteCourseSectionService`, `annotateCourseContentWithProgression`, `assertEnrolledStudentContentAccess`, `syncComplianceProgressFromSubmission`, `cloneCourse`, `getCourseTemplatePreview`, `detectTemplateContentChanges`, `buildCourseStructureSnapshot`, both draft publish modes, `resolveLiveAssetUsages`, `deleteAssetService`, the agent `reorder_content`.
- Dashboard utilities: `getOrderedNavigableContent`, `getContentItemsProgress`, `getCourseProgress`, `getFirstIncompleteNavigableContent`, previous and next, `collectLockedContentItems`, `getContentRoute`, `getCourseSections`, `updateLessonCompletionInCourseContent`, `calcCourseProgress`.
- Playwright smoke (`e2e/regression/course-content.spec.ts`): create a section, lesson and exercise; reorder; lock and unlock; complete a lesson as a student; submit an exercise; check the progress ring, the next-item button and the certificate.
- CI: add a Postgres service to `.github/workflows/package-build-check.yml` so database-backed tests run instead of skipping.
