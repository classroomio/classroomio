import { AppError, ErrorCodes } from '@api/utils/errors';
import { db, type DbOrTxClient } from '@cio/db/drizzle';
import { getCourseById, getEnrollOnlyInLearningPathCourses } from '@cio/db/queries/course';

/**
 * Rejects direct enrollment into path-only courses. Learners must join
 * through the containing learning path so sequential unlocks stay intact.
 * @param course Course row (or subset) with the path-only flag. Nullish rows pass.
 */
export function assertCourseNotPathOnly(
  course: { enrollOnlyInLearningPath?: boolean | null } | null | undefined
): void {
  if (course?.enrollOnlyInLearningPath) {
    throw new AppError('This course can only be accessed through a learning path', ErrorCodes.VALIDATION_ERROR, 400);
  }
}

/**
 * Rejects direct student adds to path-only courses. Fetches the course row
 * first; callers that already hold the row should use assertCourseNotPathOnly.
 * @param courseId Course ID
 * @param tx Optional transaction client for callers inside a transaction
 */
export async function assertCourseAllowsDirectStudentAdd(courseId: string, tx?: DbOrTxClient): Promise<void> {
  const [courseRow] = await getCourseById(courseId, tx ?? db);

  assertCourseNotPathOnly(courseRow);
}

/**
 * Splits courseIds into direct-takeable vs path-only.
 * Path-only courses (enrollOnlyInLearningPath) cannot be granted via cohorts,
 * audiences, or invites; they need a LEARNING_PATH grant.
 */
export async function filterOutPathOnlyCourseIds(
  courseIds: string[],
  dbClient: DbOrTxClient = db
): Promise<{ allowedCourseIds: string[]; skippedPathOnlyCourseIds: string[] }> {
  if (courseIds.length === 0) {
    return { allowedCourseIds: [], skippedPathOnlyCourseIds: [] };
  }

  const pathOnly = await getEnrollOnlyInLearningPathCourses(courseIds, dbClient);
  const pathOnlyIds = new Set(pathOnly.map((course) => course.id));
  const allowedCourseIds = courseIds.filter((id) => !pathOnlyIds.has(id));
  const skippedPathOnlyCourseIds = courseIds.filter((id) => pathOnlyIds.has(id));

  return { allowedCourseIds, skippedPathOnlyCourseIds };
}
