# Cohorts v2 — Enrollment Provenance PRD

## Status

Proposed. Schema for the shared mechanism lands with Learning Paths (`prd/learning-paths/README.md`); the cohort migration described here is not yet built.

## Naming — read this first

Three different things in this repo are called "cohort". Do not conflate them.

| Name | What it is | State |
| --- | --- | --- |
| **Cohort (v1)** — `cohort`, `cohort_course`, `cohort_member` | Org-level roster spanning **many courses**. Shipped today. | Built |
| **Course Cohorts** — `prd/course-cohorts/README.md` | A *different* concept: **batches of one course**, each with its own `group`, with start/end dates and per-cohort access windows. Requires `course_cohort` and a 1:many `course → group` change. | Not built |
| **Cohorts v2** — this document | Cohort v1, reworked so course access it grants is **traceable and revocable**. No change to what a cohort *is*. | Proposed |

This PRD covers only the third. It does not supersede or block `prd/course-cohorts`; the two are compatible, because a group-per-batch design still creates `groupmember` rows and would record grants the same way.

## Problem Statement

Cohort v1 grants course access by inserting `groupmember` rows and recording nothing about why. The row a cohort creates is byte-identical to the row a learner creates by buying the course. Four consequences, all present in `main` today:

1. **No course-scoped screen can be segmented by cohort.** `getPaginatedCourseMembers` accepts `page`, `limit`, `search`, `roleId` — there is no cohort parameter to pass, because there is nothing to filter on. The same is true of the gradebook (`getGradebook(courseId)`), submissions (`getSubmissionsByCourseIdWithDetails`), analytics (`getCourseAnalytics(courseId)`) and attendance (`getAttendanceByCourseId`).
2. **A teacher cannot answer "who here is from cohort Y, and who enrolled directly?"** Opening a course from the cohort Courses tab calls `goto('/courses/[id]')` with no cohort context; there is no "view this course as this cohort" concept anywhere.
3. **Removal leaks.** `removeCohortMemberService` deletes only the `cohort_member` row. The `groupmember` row survives with no trace of its origin, so the learner keeps course access forever and nothing records that a cohort ever put them there. `removeCourseFromCohortService` behaves the same way.
4. **The available workaround is a guess, not an answer.** Joining `cohort_member` on `profileId` (as `packages/db/src/scripts/backfill-cohort-course-enrollment.ts` does) returns two rows when a learner is in two cohorts that both contain the course, and cannot see a direct enrollment at all.

## Goals

1. Every cohort-granted course enrollment is attributable to the cohort that granted it.
2. Every course-scoped read can be segmented by cohort through one shared mechanism.
3. Removing a member from a cohort, or a course from a cohort, revokes exactly the access the cohort granted and nothing else.
4. History survives: "was this learner in cohort Y last term?" stays answerable.
5. No change to the meaning of a cohort, no change to any existing access check.

## Non-Goals

- Changing what a cohort is, or merging it with `prd/course-cohorts`.
- Per-cohort **content**: separate due dates, announcements, or sessions inside a shared course. Cohort v1 already partly addresses this with `cohort_newsfeed` and `cohort_goal`; it is a different problem from attribution.
- Replacing `groupmember` as the access row.

## Design

Use `course_enrollment_grant`, the shared provenance ledger added with Learning Paths. See `prd/learning-paths/README.md` § "Access & progression" for the table definition and the full rule set.

```
course_enrollment_grant
  groupmemberId · courseId · profileId
  source: SELF_ENROLL | INVITE | ADMIN_ADD | ORG_AUDIENCE | COHORT | LEARNING_PATH | PROGRAM | IMPORT
  cohortId (when source=COHORT) · learningPathId (when source=LEARNING_PATH)
  grantedByProfileId · grantedAt · revokedAt
  unique NULLS NOT DISTINCT (groupmemberId, source, cohortId, learningPathId)
```

Three invariants govern it:

- **`groupmember` stays the single access row.** Access checks are unchanged. The ledger sits beside the enrollment, never in front of it.
- **Access is the union of live grants.** A learner may hold several at once — bought the course, then a cohort granted it, then a path did.
- **An enrollment is deleted only when no grant with `revokedAt IS NULL` remains.** Revocation sets `revokedAt`; it never deletes a grant row.

### Write sites

Every place that currently inserts a cohort-driven `groupmember` row writes a matching `COHORT` grant in the **same transaction**:

| Site | Change |
| --- | --- |
| `enrollCohortStudentsInGroups` (`apps/api/src/services/cohort/cohort.ts`) | After `insertGroupMembersOnConflictDoNothing`, upsert one `COHORT` grant per (enrollment, cohort). |
| `addCohortMembers` | Same, for the courses already linked to the cohort. |
| `addCourseToCohortService` | Same, for every existing cohort student on the newly added course. |
| `enrollAudienceStudentProfilesInCohorts` (`services/organization/audience.ts`) | Writes both an `ORG_AUDIENCE` grant and a `COHORT` grant where applicable. |
| `enrollOrganizationInviteUser` (`services/organization/invite.ts`), cohort branch | Same. |

Grant writes are idempotent: re-running an enrollment conflicts on `course_enrollment_grant_source_unique` and reactivates the existing row (`SET revokedAt = NULL`) instead of duplicating.

### Revoke sites

| Site | Current behaviour | New behaviour |
| --- | --- | --- |
| `removeCohortMemberService` | Deletes `cohort_member` only; course access leaks | Also revoke that member's `COHORT` grants for the cohort's courses, then delete each `groupmember` row that has no live grant left |
| `removeCourseFromCohortService` | Deletes `cohort_course` only | Revoke every `COHORT` grant for (cohort, course), then the same cleanup |
| Cohort delete | Cascades `cohort_member` / `cohort_course` | Cascades grants via FK; run the same cleanup before the cascade so enrollments do not leak |

A learner who bought the course, or who is also in a learning path containing it, keeps access — that is the union rule doing its job.

### Read sites

Add an optional segment filter to the existing course endpoints rather than creating parallel per-cohort routes:

```
?cohortId=<uuid>   |   ?learningPathId=<uuid>   |   ?source=COHORT
```

Each resolves to a set of `groupmemberId`s via `idx_course_enrollment_grant_cohort_id_course_id`. Applies to the roster, gradebook, submissions-for-grading, analytics and attendance.

**Use a semi-join.** A learner can hold several grants on one enrollment, so joining grants to the roster directly multiplies rows. Filter with `EXISTS` / `IN`, and where a roster needs to *display* origin, aggregate the sources for that enrollment rather than fanning out.

### Migration

1. Add the table and enum (ships with Learning Paths).
2. Backfill `COHORT` grants from `cohort_member` × `cohort_course` × `groupmember`. The join is ambiguous by nature — a learner in two cohorts sharing a course gets a grant for each, which is correct under the union rule and is the best available reconstruction of history.
3. Backfill the remaining enrollments. Any `groupmember` row with no grant after step 2 gets an `IMPORT` grant, so the "enrollment implies at least one live grant" invariant holds from day one and the cleanup logic can never delete a pre-existing enrollment it does not understand.
4. Only then enable the revoke behaviour, which depends on that invariant.

### `ensureProgramCourseAccess`

`courseMemberMiddleware` lazily creates `groupmember` rows for legacy `program` members on request. That path must write a `PROGRAM` grant or the invariant breaks. Two options: give it grants, or retire it in favour of an eager backfill. Retiring it is preferable — it performs writes inside an authorization check on a GET, and can throw `UPGRADE_REQUIRED` (403) from a student-limit check on a read path.

## Acceptance Criteria

- [ ] Joining a cohort creates one `groupmember` row and one `COHORT` grant per course, in one transaction.
- [ ] Joining a cohort containing a course the learner already bought adds a `COHORT` grant and leaves the existing enrollment and its grants untouched.
- [ ] Re-running any cohort enrollment creates no duplicate grants.
- [ ] Removing a cohort member revokes their `COHORT` grants and removes course access only where no other live grant exists.
- [ ] A learner in two cohorts sharing a course, removed from one, keeps access.
- [ ] The course roster can be filtered by `cohortId` and returns each learner exactly once.
- [ ] The roster can display where each learner came from, including multiple origins.
- [ ] After removal, the revoked grant still records that the learner was in that cohort.
- [ ] No existing access check is modified.
