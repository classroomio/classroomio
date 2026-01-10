import { AppError, ErrorCodes } from '@api/utils/errors';

import type { TCourse } from '@cio/db/types';
import { convertCourseToV2 as dbConvertCourseToV2, getCourseWithRelations } from '@cio/db/queries/course';

/**
 * Converts a course from V1 to V2 format
 * - Updates course version to 'V2'
 * - Creates a new lesson_section titled 'First Section [edit me]'
 * - Updates all lessons in the course to use the new section_id
 * @param courseId - The course ID
 * @returns Updated course
 */
export async function convertCourseToV2(courseId: string): Promise<TCourse> {
  try {
    // Verify course exists
    const course = await getCourseWithRelations(courseId);
    if (!course) {
      throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
    }

    // Check if already V2
    if (course.version === 'V2') {
      return course;
    }

    await dbConvertCourseToV2(courseId);

    // Return updated course
    const finalCourse = await getCourseWithRelations(courseId);
    if (!finalCourse) {
      throw new AppError('Failed to fetch updated course', ErrorCodes.COURSE_FETCH_FAILED, 500);
    }

    return finalCourse;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to convert course to V2',
      ErrorCodes.COURSE_FETCH_FAILED,
      500
    );
  }
}
