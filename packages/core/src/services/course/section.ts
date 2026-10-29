import type { TCourseSection } from '@cio/db/types';
import {
  createCourseSections,
  deleteCourseSection,
  getCourseSectionById,
  getCourseSectionsByCourseId,
  updateCourseSection,
  updateUngroupedLessonsSectionId
} from '@cio/db/queries/course';
import { AppError, ErrorCodes } from '@cio/utils/errors';
import type {
  TCourseSectionCreate,
  TCourseSectionPromoteUngrouped,
  TCourseSectionReorder,
  TCourseSectionUpdate
} from '@cio/utils/validation/course/section';
import { updateUngroupedExercisesSectionId } from '@cio/db/queries/exercise/exercise';
import { db } from '@cio/db/drizzle';
import { invalidateInsightsCourseStructure } from '../../utils/redis/insights-cache';
import { claimSectionOrder } from './root-order';

/**
 * Creates a new course section
 * @param courseId Course ID
 * @param data Section creation data
 * @returns Created section
 */
export async function createCourseSection(courseId: string, data: TCourseSectionCreate): Promise<TCourseSection> {
  try {
    const [section] = await db.transaction(async (tx) => {
      const order = await claimSectionOrder(courseId, data.order, null, tx);
      return createCourseSections([{ ...data, order, courseId }], tx);
    });
    if (!section) {
      throw new AppError('Failed to create course section', ErrorCodes.INTERNAL_ERROR, 500);
    }

    void invalidateInsightsCourseStructure(courseId);

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
 * Promotes synthetic "Ungrouped" content into a real persisted section.
 * Creates a section and reassigns all ungrouped lessons/exercises to it transactionally.
 */
export async function promoteUngroupedSection(
  courseId: string,
  data: TCourseSectionPromoteUngrouped
): Promise<{ section: TCourseSection; movedLessons: number; movedExercises: number }> {
  try {
    const existingSections = await getCourseSectionsByCourseId(courseId);
    const nextOrder = Math.max(...existingSections.map((section) => section.order ?? 0), 0) + 1;

    const result = await db.transaction(async (tx) => {
      const [section] = await createCourseSections(
        [
          {
            title: data.title,
            courseId,
            order: nextOrder
          }
        ],
        tx
      );

      if (!section) {
        throw new AppError('Failed to create course section', ErrorCodes.INTERNAL_ERROR, 500);
      }

      const [movedLessons, movedExercises] = await Promise.all([
        updateUngroupedLessonsSectionId(courseId, section.id, tx),
        updateUngroupedExercisesSectionId(courseId, section.id, tx)
      ]);

      if (movedLessons + movedExercises === 0) {
        throw new AppError('No ungrouped content found', ErrorCodes.VALIDATION_ERROR, 400);
      }

      return {
        section,
        movedLessons,
        movedExercises
      };
    });

    void invalidateInsightsCourseStructure(courseId);

    return result;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to promote ungrouped content',
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

    const courseId = section.courseId;
    const updated =
      data.order !== undefined && courseId
        ? await db.transaction(async (tx) => {
            const order = await claimSectionOrder(courseId, data.order, sectionId, tx);
            return updateCourseSection(sectionId, { ...data, order }, tx);
          })
        : await updateCourseSection(sectionId, data);
    if (!updated) {
      throw new AppError('Failed to update course section', ErrorCodes.INTERNAL_ERROR, 500);
    }

    if (courseId) {
      void invalidateInsightsCourseStructure(courseId);
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

    if (section.courseId) {
      void invalidateInsightsCourseStructure(section.courseId);
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
    await invalidateReorderedSectionCourses(sections.map(({ id }) => id));

    return updated.filter((section): section is TCourseSection => section !== null);
  } catch (error) {
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to reorder course sections',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * Section order changes every item rank in the course, so each reordered section's course drops its cached outline.
 */
async function invalidateReorderedSectionCourses(sectionIds: string[]): Promise<void> {
  if (sectionIds.length === 0) return;

  const sections = await Promise.all(sectionIds.map((sectionId) => getCourseSectionById(sectionId)));
  const courseIds = new Set(sections.flatMap((section) => (section?.courseId ? [section.courseId] : [])));

  for (const courseId of courseIds) {
    void invalidateInsightsCourseStructure(courseId);
  }
}
