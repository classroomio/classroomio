import { deleteLessonService, getLesson, listLessonsPaginated } from '@api/services/lesson';
import { notifyCourseSessionUpdateService } from '@api/services/course/notify-session';
import type { LessonById } from '@cio/db/queries/lesson';
import type { TLesson, TLessonLanguage } from '@cio/db/types';
import type {
  TPublicApiCourseLessonParam,
  TPublicApiCourseLessonsQuery,
  TPublicApiCourseParam
} from '@cio/utils/validation/public-api';
import { AppError, ErrorCodes } from '@api/utils/errors';
import { assertCourseTeamAccess, assertLessonInCourse, assertSectionInCourse, toPublicApiPagination } from '../shared';

export function toPublicLesson(lesson: TLesson) {
  return {
    id: lesson.id,
    courseId: lesson.courseId,
    sectionId: lesson.sectionId,
    title: lesson.title,
    slug: lesson.slug,
    order: lesson.order,
    isUnlocked: lesson.isUnlocked,
    public: lesson.public,
    lessonAt: lesson.lessonAt,
    callUrl: lesson.callUrl,
    teacherId: lesson.teacherId,
    completionPolicy: lesson.completionPolicy,
    videoWatchThreshold: lesson.videoWatchThreshold,
    commentsEnabled: lesson.commentsEnabled,
    createdAt: lesson.createdAt,
    updatedAt: lesson.updatedAt
  };
}

export function toPublicTranslation(language: TLessonLanguage) {
  return {
    id: language.id,
    lessonId: language.lessonId,
    locale: language.locale,
    content: language.content,
    updatedAt: language.updatedAt
  };
}

// Storage keys stay internal; callers get the signed link instead.
function toPublicLessonDetail(lesson: LessonById) {
  return {
    ...toPublicLesson(lesson),
    note: lesson.note,
    videoUrl: lesson.videoUrl,
    slideUrl: lesson.slideUrl,
    slides: lesson.slides ?? [],
    videos: (lesson.videos ?? []).map(({ key: _key, ...video }) => video),
    documents: (lesson.documents ?? []).map(({ key: _key, ...document }) => document),
    translations: lesson.lessonLanguages.map(toPublicTranslation)
  };
}

export async function listPublicApiCourseLessonsService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseParam,
  query: TPublicApiCourseLessonsQuery
) {
  await assertCourseTeamAccess(orgId, actorId, params.courseId);
  if (query.sectionId) {
    await assertSectionInCourse(params.courseId, query.sectionId);
  }

  const page = await listLessonsPaginated(params.courseId, query);
  return {
    items: page.items.map(toPublicLesson),
    pagination: toPublicApiPagination(query.page, query.limit, page.total)
  };
}

export async function getPublicApiCourseLessonService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseLessonParam
) {
  await assertCourseTeamAccess(orgId, actorId, params.courseId);
  await assertLessonInCourse(params.courseId, params.lessonId);

  return toPublicLessonDetail(await getLesson(params.lessonId));
}

export async function deletePublicApiCourseLessonService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseLessonParam
) {
  await assertCourseTeamAccess(orgId, actorId, params.courseId);
  await assertLessonInCourse(params.courseId, params.lessonId);

  return toPublicLesson(await deleteLessonService(params.lessonId));
}

export async function notifyPublicApiCourseLessonSessionService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseLessonParam
) {
  await assertCourseTeamAccess(orgId, actorId, params.courseId);
  const lesson = await assertLessonInCourse(params.courseId, params.lessonId);

  // The job silently skips lessons without a session, so refuse up front.
  if (!lesson.callUrl || !lesson.lessonAt) {
    throw new AppError('Lesson has no live session (callUrl and lessonAt are required)', ErrorCodes.CONFLICT, 409);
  }

  return notifyCourseSessionUpdateService(params.courseId, params.lessonId);
}
