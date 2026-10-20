import { getLessonHistoryService } from '@api/services/lesson';
import {
  getLessonLanguage,
  listLessonLanguages,
  upsertLessonLanguageService
} from '@cio/core/services/lesson-language';
import type {
  TPublicApiCourseLessonHistoryQuery,
  TPublicApiCourseLessonParam,
  TPublicApiCourseLessonTranslationParam,
  TPublicApiCourseLessonTranslationsQuery,
  TPublicApiSetCourseLessonTranslation
} from '@cio/utils/validation/public-api';
import { assertAutomationActor, assertCourseTeamAccess, assertLessonInCourse } from '../shared';
import { toPublicTranslation } from './lessons';

export async function listPublicApiCourseLessonTranslationsService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseLessonParam,
  query: TPublicApiCourseLessonTranslationsQuery
) {
  await assertCourseTeamAccess(orgId, actorId, params.courseId);
  await assertLessonInCourse(params.courseId, params.lessonId);

  if (query.locale) {
    const language = await getLessonLanguage(params.lessonId, query.locale);
    return language ? [toPublicTranslation(language)] : [];
  }

  return (await listLessonLanguages(params.lessonId)).map(toPublicTranslation);
}

export async function setPublicApiCourseLessonTranslationService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseLessonTranslationParam,
  payload: TPublicApiSetCourseLessonTranslation
) {
  assertAutomationActor(actorId);
  await assertCourseTeamAccess(orgId, actorId, params.courseId);
  await assertLessonInCourse(params.courseId, params.lessonId);

  const language = await upsertLessonLanguageService(
    params.lessonId,
    { locale: params.locale, content: payload.content },
    { authorId: actorId, versionIntent: payload.versionIntent, versionLabel: payload.versionLabel }
  );

  return toPublicTranslation(language);
}

export async function listPublicApiCourseLessonHistoryService(
  orgId: string,
  actorId: string | null,
  params: TPublicApiCourseLessonParam,
  query: TPublicApiCourseLessonHistoryQuery
) {
  await assertCourseTeamAccess(orgId, actorId, params.courseId);
  await assertLessonInCourse(params.courseId, params.lessonId);

  const page = await getLessonHistoryService(params.lessonId, query.locale, query.limit, query.cursor);

  return {
    items: page.items.map((version) => ({
      id: version.id,
      locale: version.locale,
      kind: version.kind,
      label: version.label,
      oldContent: version.oldContent,
      newContent: version.newContent,
      timestamp: version.timestamp,
      sessionStartedAt: version.sessionStartedAt,
      editCount: version.editCount,
      isSealed: version.isSealed,
      authorId: version.authorId,
      authorName: version.authorName
    })),
    nextCursor: page.nextCursor ? `${page.nextCursor.timestamp}|${page.nextCursor.id}` : null
  };
}
