import type { TCourseSection } from '@cio/db/types';
import {
  createCourseSections,
  deleteCourseSection,
  getCourseSectionById,
  getCourseSectionsByCourseId,
  updateCourseSection
} from '@cio/db/queries/course';
import { AppError, ErrorCodes } from '@api/utils/errors';
import type {
  TCourseSectionCreate,
  TCourseSectionReorder,
  TCourseSectionUpdate
} from '@cio/utils/validation/course/section';

/**
 * Creates a new course section
 * @param courseId Course ID
 * @param data Section creation data
 * @returns Created section
 */
export async function createCourseSection(courseId: string, data: TCourseSectionCreate): Promise<TCourseSection> {
  try {
    const sectionData = {
      ...data,
      courseId
    };

    const [section] = await createCourseSections([sectionData]);
    if (!section) {
      throw new AppError('Failed to create course section', ErrorCodes.INTERNAL_ERROR, 500);
    }

    return section;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to create course section',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * Gets a course section by ID
 * @param sectionId Section ID
 * @returns Section or throws error if not found
 */
export async function getCourseSection(sectionId: string): Promise<TCourseSection> {
  try {
    const section = await getCourseSectionById(sectionId);
    if (!section) {
      throw new AppError('Course section not found', ErrorCodes.COURSE_SECTION_NOT_FOUND, 404);
    }

    return section;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to fetch course section',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * Updates a course section
 * @param sectionId Section ID
 * @param data Partial section update data
 * @returns Updated section
 */
export async function updateCourseSectionService(
  sectionId: string,
  data: TCourseSectionUpdate
): Promise<TCourseSection> {
  try {
    const section = await getCourseSectionById(sectionId);
    if (!section) {
      throw new AppError('Course section not found', ErrorCodes.COURSE_SECTION_NOT_FOUND, 404);
    }

    const updated = await updateCourseSection(sectionId, data);
    if (!updated) {
      throw new AppError('Failed to update course section', ErrorCodes.INTERNAL_ERROR, 500);
    }

    return updated;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to update course section',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * Deletes a course section
 * @param sectionId Section ID
 * @returns Deleted section
 */
export async function deleteCourseSectionService(sectionId: string): Promise<TCourseSection> {
  try {
    const section = await getCourseSectionById(sectionId);
    if (!section) {
      throw new AppError('Course section not found', ErrorCodes.COURSE_SECTION_NOT_FOUND, 404);
    }

    const deleted = await deleteCourseSection(sectionId);
    if (!deleted) {
      throw new AppError('Failed to delete course section', ErrorCodes.INTERNAL_ERROR, 500);
    }

    return deleted;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to delete course section',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * Lists course sections for a course
 * @param courseId Course ID
 * @returns Array of sections
 */
export async function listCourseSections(courseId: string): Promise<TCourseSection[]> {
  try {
    return await getCourseSectionsByCourseId(courseId);
  } catch (error) {
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to list course sections',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * Reorders course sections
 * @param sections Array of section IDs and orders
 * @returns Updated sections
 */
export async function reorderCourseSections(sections: TCourseSectionReorder['sections']): Promise<TCourseSection[]> {
  try {
    const updatePromises = sections.map(({ id, order }) => updateCourseSection(id, { order }));

    const updated = await Promise.all(updatePromises);
    return updated.filter((section): section is TCourseSection => section !== null);
  } catch (error) {
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to reorder course sections',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}
