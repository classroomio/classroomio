import type {
  TPublicApiCourseParam,
  TPublicApiCreateLesson,
  TPublicApiCreateLessonTranslation,
  TPublicApiLessonHistoryQuery,
  TPublicApiLessonParam,
  TPublicApiLessonsQuery,
  TPublicApiLessonTranslationParam,
  TPublicApiReorderLessons,
  TPublicApiUpdateLesson,
  TPublicApiUpdateLessonTranslation
} from '@cio/utils/validation/public-api';
import type { LessonById } from '@cio/db/queries/lesson';
import type { TLocale } from '@cio/db/types';

import {
  createLesson,
  deleteLessonService,
  getLesson,
  getLessonHistoryService,
  listLessons,
  reorderLessons,
  updateLessonService
} from '@api/services/lesson';
import {
  getLessonLanguage,
  listLessonLanguages,
  updateLessonLanguageService,
  upsertLessonLanguageService
} from '@cio/core/services/lesson-language';
import {
  assertCourseBelongsToOrganization,
  assertLessonBelongsToCourse,
  assertLessonsBelongToCourse,
  assertSectionBelongsToCourse,
  assertSectionsBelongToCourse
} from '@api/services/v1/shared';
import { AppError, ErrorCodes } from '@api/utils/errors';

export async function listPublicApiLessonsService(
  orgId: string,
  params: TPublicApiCourseParam,
  query: TPublicApiLessonsQuery
) {
  await assertCourseBelongsToOrganization(orgId, params.courseId);

  return listLessons(params.courseId, query.sectionId);
}

export async function getPublicApiLessonService(orgId: string, params: TPublicApiLessonParam): Promise<LessonById> {
  await assertCourseBelongsToOrganization(orgId, params.courseId);
  await assertLessonBelongsToCourse(params.courseId, params.lessonId);

  return getLesson(params.lessonId);
}

export async function createPublicApiLessonService(
  orgId: string,
  params: TPublicApiCourseParam,
  payload: TPublicApiCreateLesson
) {
  await assertCourseBelongsToOrganization(orgId, params.courseId);

  if (payload.sectionId) {
    await assertSectionBelongsToCourse(params.courseId, payload.sectionId);
  }

  return createLesson(params.courseId, { ...payload, courseId: params.courseId });
}

export async function updatePublicApiLessonService(
  orgId: string,
  params: TPublicApiLessonParam,
  payload: TPublicApiUpdateLesson
) {
  await assertCourseBelongsToOrganization(orgId, params.courseId);
  await assertLessonBelongsToCourse(params.courseId, params.lessonId);

  if (payload.sectionId) {
    await assertSectionBelongsToCourse(params.courseId, payload.sectionId);
  }

  return updateLessonService(params.lessonId, payload);
}

export async function deletePublicApiLessonService(orgId: string, params: TPublicApiLessonParam) {
  await assertCourseBelongsToOrganization(orgId, params.courseId);
  await assertLessonBelongsToCourse(params.courseId, params.lessonId);

  return deleteLessonService(params.lessonId);
}

export async function reorderPublicApiLessonsService(
  orgId: string,
  params: TPublicApiCourseParam,
  payload: TPublicApiReorderLessons
) {
  await assertCourseBelongsToOrganization(orgId, params.courseId);
  await assertLessonsBelongToCourse(
    params.courseId,
    payload.lessons.map((lesson) => lesson.id)
  );

  const targetSectionIds = payload.lessons.flatMap((lesson) => (lesson.sectionId ? [lesson.sectionId] : []));
  await assertSectionsBelongToCourse(params.courseId, targetSectionIds);

  return reorderLessons(payload.lessons);
}

export async function listPublicApiLessonTranslationsService(orgId: string, params: TPublicApiLessonParam) {
  await assertCourseBelongsToOrganization(orgId, params.courseId);
  await assertLessonBelongsToCourse(params.courseId, params.lessonId);

  return listLessonLanguages(params.lessonId);
}

export async function getPublicApiLessonTranslationService(orgId: string, params: TPublicApiLessonTranslationParam) {
  await assertCourseBelongsToOrganization(orgId, params.courseId);
  await assertLessonBelongsToCourse(params.courseId, params.lessonId);

  const translation = await getLessonLanguage(params.lessonId, params.locale as TLocale);
  if (!translation) {
    throw new AppError('Lesson translation not found', ErrorCodes.NOT_FOUND, 404);
  }

  return translation;
}

export async function createPublicApiLessonTranslationService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiLessonParam,
  payload: TPublicApiCreateLessonTranslation
) {
  await assertCourseBelongsToOrganization(orgId, params.courseId);
  await assertLessonBelongsToCourse(params.courseId, params.lessonId);

  const { versionIntent, versionLabel, ...translation } = payload;

  return upsertLessonLanguageService(params.lessonId, translation, {
    authorId: actorId,
    versionIntent,
    versionLabel
  });
}

export async function updatePublicApiLessonTranslationService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiLessonTranslationParam,
  payload: TPublicApiUpdateLessonTranslation
) {
  await assertCourseBelongsToOrganization(orgId, params.courseId);
  await assertLessonBelongsToCourse(params.courseId, params.lessonId);

  const { versionIntent, versionLabel, ...translation } = payload;

  return updateLessonLanguageService(params.lessonId, params.locale as TLocale, translation, {
    authorId: actorId,
    versionIntent,
    versionLabel
  });
}

export async function getPublicApiLessonHistoryService(
  orgId: string,
  params: TPublicApiLessonParam,
  query: TPublicApiLessonHistoryQuery
): ReturnType<typeof getLessonHistoryService> {
  await assertCourseBelongsToOrganization(orgId, params.courseId);
  await assertLessonBelongsToCourse(params.courseId, params.lessonId);

  return getLessonHistoryService(params.lessonId, query.locale, query.limit, query.cursor);
}
