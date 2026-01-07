import * as schema from '@cio/db/schema';

import { AppError, ErrorCodes } from '@api/utils/errors';

import type { TCourse } from '@cio/db/types';
import { createLessonSections } from '@cio/db/queries/lesson/lesson';
import { db } from '@cio/db/drizzle';
import { eq } from 'drizzle-orm';
import { getCourseWithRelations } from '@cio/db/queries/course';

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

    return await db.transaction(async (tx) => {
      // 1. Update course version to 'V2'
      const [updatedCourse] = await tx
        .update(schema.course)
        .set({ version: 'V2' })
        .where(eq(schema.course.id, courseId))
        .returning();

      if (!updatedCourse) {
        throw new AppError('Failed to update course version', ErrorCodes.COURSE_FETCH_FAILED, 500);
      }

      // 2. Create a new lesson_section titled 'First Section [edit me]'
      const sections = await createLessonSections([
        {
          title: 'First Section [edit me]',
          courseId: courseId
        }
      ]);

      if (!sections || sections.length === 0) {
        throw new AppError('Failed to create lesson section', ErrorCodes.LESSON_SECTION_NOT_FOUND, 500);
      }

      const newSection = sections[0];

      // 3. Update all lessons in the course to use the new section_id
      await tx.update(schema.lesson).set({ sectionId: newSection.id }).where(eq(schema.lesson.courseId, courseId));

      // Return updated course
      const finalCourse = await getCourseWithRelations(courseId);
      if (!finalCourse) {
        throw new AppError('Failed to fetch updated course', ErrorCodes.COURSE_FETCH_FAILED, 500);
      }

      return finalCourse;
    });
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
