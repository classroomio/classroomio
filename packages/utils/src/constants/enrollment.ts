/**
 * Postgres `COURSE_ENROLLMENT_SOURCE` enum values — why a learner has access to a course.
 *
 * Every route that creates a `groupmember` row records one of these, so course-scoped
 * screens can say who arrived from a cohort, who came through a learning path, and who
 * enrolled on their own, instead of showing one undifferentiated roster.
 */
export const COURSE_ENROLLMENT_SOURCE_VALUES = [
  /** Learner enrolled themselves from the public course page. */
  'SELF_ENROLL',
  /** Learner accepted a course invite link or email. */
  'INVITE',
  /** A teacher or org admin added them from the course People page. */
  'ADMIN_ADD',
  /** Granted by membership of an org audience segment. */
  'ORG_AUDIENCE',
  /** Granted by cohort membership; `cohortId` is set. */
  'COHORT',
  /** Granted by learning path enrolment; `learningPathId` is set. */
  'LEARNING_PATH',
  /**
   * Granted by legacy `program` membership. Needed because `courseMemberMiddleware` still
   * lazily backfills enrolments via `ensureProgramCourseAccess`; without this value that
   * path would create `groupmember` rows with no grant behind them.
   */
  'PROGRAM',
  /** Bulk import or migration backfill. */
  'IMPORT'
] as const;

export type TCourseEnrollmentSource = (typeof COURSE_ENROLLMENT_SOURCE_VALUES)[number];
