import type {
  TPublicApiCreateLesson,
  TPublicApiCourseParam,
  TPublicApiLessonParam,
  TPublicApiUpdateLesson
} from '@cio/utils/validation/public-api';

import { createLesson, updateLessonService } from '@cio/core/services/lesson/lesson';
import { getLessonById } from '@cio/db/queries/lesson';
import { getCourseOrganizationId } from '@cio/db/queries/tag';
import { assertAutomationActor } from '@api/services/v1/shared';
import { AppError, ErrorCodes } from '@api/utils/errors';
import { resolveLessonVideos } from './videos';

async function assertCourseBelongsToOrganization(orgId: string, courseId: string): Promise<void> {
  const courseOrganizationId = await getCourseOrganizationId(courseId);
  if (!courseOrganizationId || courseOrganizationId !== orgId) {
    throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
  }
}

/** A lesson id is caller-supplied, so it is checked against the course rather than trusted. */
async function assertLessonBelongsToCourse(courseId: string, lessonId: string): Promise<void> {
  const lesson = await getLessonById(lessonId);
  if (!lesson || lesson.courseId !== courseId) {
    throw new AppError('Lesson not found', ErrorCodes.LESSON_NOT_FOUND, 404);
  }
}

export async function createPublicApiLessonService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseParam,
  payload: TPublicApiCreateLesson
) {
  assertAutomationActor(actorId);
  await assertCourseBelongsToOrganization(orgId, params.courseId);

  const videos = payload.videos?.length ? await resolveLessonVideos(orgId, actorId, payload.videos) : undefined;

  return createLesson(params.courseId, {
    title: payload.title,
    courseId: params.courseId,
    order: payload.order,
    sectionId: payload.sectionId,
    isUnlocked: payload.isUnlocked,
    public: payload.public,
    ...(videos ? { videos } : {})
  });
}

export async function updatePublicApiLessonService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiLessonParam,
  payload: TPublicApiUpdateLesson
) {
  assertAutomationActor(actorId);
  await assertCourseBelongsToOrganization(orgId, params.courseId);
  await assertLessonBelongsToCourse(params.courseId, params.lessonId);

  const videos = payload.videos ? await resolveLessonVideos(orgId, actorId, payload.videos) : undefined;

  return updateLessonService(params.lessonId, {
    title: payload.title,
    order: payload.order,
    isUnlocked: payload.isUnlocked,
    public: payload.public,
    ...(videos ? { videos } : {})
  });
}
