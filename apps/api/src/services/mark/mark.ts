import { AppError, ErrorCodes } from '@api/utils/errors';
import { getMarksByCourseId } from '@cio/db/queries/mark';

/**
 * Gets marks for a course
 * Marks are computed from submissions and exercises using a database function
 * @param courseId Course ID
 * @returns Array of mark records
 */
export async function getMarks(courseId: string) {
  try {
    return await getMarksByCourseId(courseId);
  } catch (error) {
    throw new AppError(error instanceof Error ? error.message : 'Failed to get marks', ErrorCodes.INTERNAL_ERROR, 500);
  }
}
