import { AppError, ErrorCodes } from '@api/utils/errors';

import { getCourseWithRelations } from '@cio/db/queries/course';

/**
 * Gets a course by ID or slug with all related data
 * @param courseId Course ID (optional if slug provided)
 * @param slug Course slug (optional if courseId provided)
 * @returns Course with all related data
 */
export async function getCourse(courseId?: string, slug?: string) {
  try {
    if (!courseId && !slug) {
      throw new AppError('Either courseId or slug must be provided', ErrorCodes.VALIDATION_ERROR, 400);
    }

    const course = await getCourseWithRelations(courseId, slug);

    if (!course) {
      throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
    }

    return course;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to fetch course',
      ErrorCodes.COURSE_FETCH_FAILED,
      500
    );
  }
}
