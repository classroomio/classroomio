import { getCourseSectionById, getCourseSectionsByCourseId } from '@cio/db/queries/course';
import { getLessonById, getLessonsByCourseId } from '@cio/db/queries/lesson';
import { getCourseOrganizationId } from '@cio/db/queries/tag';
import { AppError, ErrorCodes } from '@api/utils/errors';

export async function assertCourseBelongsToOrganization(orgId: string, courseId: string): Promise<void> {
  const courseOrganizationId = await getCourseOrganizationId(courseId);
  if (!courseOrganizationId || courseOrganizationId !== orgId) {
    throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
  }
}

export async function assertSectionBelongsToCourse(courseId: string, sectionId: string): Promise<void> {
  const section = await getCourseSectionById(sectionId);
  if (!section || section.courseId !== courseId) {
    throw new AppError('Course section not found', ErrorCodes.COURSE_SECTION_NOT_FOUND, 404);
  }
}

export async function assertSectionsBelongToCourse(courseId: string, sectionIds: string[]): Promise<void> {
  const courseSections = await getCourseSectionsByCourseId(courseId);
  const courseSectionIds = new Set(courseSections.map((section) => section.id));

  if (sectionIds.some((sectionId) => !courseSectionIds.has(sectionId))) {
    throw new AppError('Course section not found', ErrorCodes.COURSE_SECTION_NOT_FOUND, 404);
  }
}

export async function assertLessonBelongsToCourse(courseId: string, lessonId: string): Promise<void> {
  const lesson = await getLessonById(lessonId);
  if (!lesson || lesson.courseId !== courseId) {
    throw new AppError('Lesson not found', ErrorCodes.LESSON_NOT_FOUND, 404);
  }
}

export async function assertLessonsBelongToCourse(courseId: string, lessonIds: string[]): Promise<void> {
  const courseLessons = await getLessonsByCourseId(courseId);
  const courseLessonIds = new Set(courseLessons.map((lesson) => lesson.id));

  if (lessonIds.some((lessonId) => !courseLessonIds.has(lessonId))) {
    throw new AppError('Lesson not found', ErrorCodes.LESSON_NOT_FOUND, 404);
  }
}
