import { AppError, ErrorCodes } from '@api/utils/errors';
import { db, type DbOrTxClient } from '@cio/db/drizzle';
import { getCourseById } from '@cio/db/queries/course';

/**
 * Rejects direct enrollment into path-gated courses. Learners must join
 * through the containing learning path so sequential unlocks stay intact.
 * @param course Course row (or subset) with the path-gate flag. Nullish rows pass.
 */
export function assertCourseNotPathGated(course: { requiresLearningPath?: boolean | null } | null | undefined): void {
  if (course?.requiresLearningPath) {
    throw new AppError('This course can only be accessed through a learning path', ErrorCodes.VALIDATION_ERROR, 400);
  }
}

/**
 * Rejects direct student adds to path-gated courses. Fetches the course row
 * first; callers that already hold the row should use assertCourseNotPathGated.
 * @param courseId Course ID
 * @param tx Optional transaction client for callers inside a transaction
 */
export async function assertCourseAllowsDirectStudentAdd(courseId: string, tx?: DbOrTxClient): Promise<void> {
  const [courseRow] = await getCourseById(courseId, tx ?? db);

  assertCourseNotPathGated(courseRow);
}
