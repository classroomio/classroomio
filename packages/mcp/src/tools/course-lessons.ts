import {
  ZPublicApiCourseLessonCommentParam,
  ZPublicApiCourseLessonCommentsQuery,
  ZPublicApiCourseLessonHistoryQuery,
  ZPublicApiCourseLessonParam,
  ZPublicApiCourseLessonTranslationParam,
  ZPublicApiCourseLessonTranslationsQuery,
  ZPublicApiCourseLessonsQuery,
  ZPublicApiCourseParam,
  ZPublicApiCreateCourseLessonComment,
  ZPublicApiSetCourseLessonTranslation,
  ZPublicApiUpdateCourseLessonComment
} from '@cio/utils/validation/public-api';

import type { ClassroomIoApiClient } from '../api-client';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';
import type { ZodRawShapeCompat } from '@modelcontextprotocol/sdk/server/zod-compat.js';

const READ_ONLY: ToolAnnotations = { readOnlyHint: true, destructiveHint: false };
const CREATE: ToolAnnotations = { readOnlyHint: false, destructiveHint: false, idempotentHint: false };
const UPDATE: ToolAnnotations = { readOnlyHint: false, destructiveHint: false, idempotentHint: true };
const DESTRUCTIVE: ToolAnnotations = { readOnlyHint: false, destructiveHint: true, idempotentHint: false };

const COURSE_TEAM_RULE =
  'The API key creator must be a course tutor/admin or an org admin, otherwise the call fails with 403.';
const PAGINATION_NOTE = 'Paginated: page (default 1) and limit (default 20, max 100); the result includes pagination.';
const CURSOR_NOTE = 'Pass nextCursor back as cursor for the next page; limit defaults to 10, max 50.';
const COMMENTS_OFF = 'Fails with 403 COMMENTS_DISABLED when comments are off for the organization, course or lesson.';

export const ZListCourseLessonsToolInput = ZPublicApiCourseLessonsQuery.extend({
  courseId: ZPublicApiCourseParam.shape.courseId
});
export const ZCourseLessonToolInput = ZPublicApiCourseLessonParam;
export const ZListCourseLessonTranslationsToolInput = ZPublicApiCourseLessonParam.extend(
  ZPublicApiCourseLessonTranslationsQuery.shape
);
export const ZSetCourseLessonTranslationToolInput = ZPublicApiSetCourseLessonTranslation.extend(
  ZPublicApiCourseLessonTranslationParam.shape
);
export const ZListCourseLessonHistoryToolInput = ZPublicApiCourseLessonParam.extend(
  ZPublicApiCourseLessonHistoryQuery.shape
);
export const ZListCourseLessonCommentsToolInput = ZPublicApiCourseLessonParam.extend(
  ZPublicApiCourseLessonCommentsQuery.shape
);
export const ZCreateCourseLessonCommentToolInput = ZPublicApiCreateCourseLessonComment.extend(
  ZPublicApiCourseLessonParam.shape
);
export const ZUpdateCourseLessonCommentToolInput = ZPublicApiUpdateCourseLessonComment.extend(
  ZPublicApiCourseLessonCommentParam.shape
);
export const ZDeleteCourseLessonCommentToolInput = ZPublicApiCourseLessonCommentParam;

const shape = (schema: { shape: unknown }) => schema.shape as unknown as ZodRawShapeCompat;

export function registerCourseLessonTools(server: McpServer, apiClient: ClassroomIoApiClient) {
  server.tool(
    'list_course_lessons',
    `List a live course's lessons in order, without their content. Optionally filter by sectionId. ${PAGINATION_NOTE} ${COURSE_TEAM_RULE}`,
    shape(ZListCourseLessonsToolInput),
    READ_ONLY,
    async (args) => {
      const { courseId, ...query } = ZListCourseLessonsToolInput.parse(args);
      return jsonContent(await apiClient.listCourseLessons(courseId, query));
    }
  );

  server.tool(
    'get_course_lesson',
    `Get one lesson with its note, slides, videos, documents and the content of every language. Uploaded files come back as short-lived signed links. ${COURSE_TEAM_RULE}`,
    shape(ZCourseLessonToolInput),
    READ_ONLY,
    async (args) => {
      const { courseId, lessonId } = ZCourseLessonToolInput.parse(args);
      return jsonContent(await apiClient.getCourseLesson(courseId, lessonId));
    }
  );

  server.tool(
    'delete_course_lesson',
    `Permanently delete a lesson with its translations, history, comments and learners' completion (hard delete, cannot be undone). Use delete_course_content to delete several lessons or exercises at once. ${COURSE_TEAM_RULE}`,
    shape(ZCourseLessonToolInput),
    DESTRUCTIVE,
    async (args) => {
      const { courseId, lessonId } = ZCourseLessonToolInput.parse(args);
      return jsonContent(await apiClient.deleteCourseLesson(courseId, lessonId));
    }
  );

  server.tool(
    'notify_course_lesson_session_update',
    `Email every student an updated calendar invite for a live lesson after its time or call link changed. Runs in the background and returns a job id. Fails with 409 if the lesson has no callUrl and lessonAt. ${COURSE_TEAM_RULE}`,
    shape(ZCourseLessonToolInput),
    CREATE,
    async (args) => {
      const { courseId, lessonId } = ZCourseLessonToolInput.parse(args);
      return jsonContent(await apiClient.notifyCourseLessonSessionUpdate(courseId, lessonId));
    }
  );

  server.tool(
    'list_course_lesson_translations',
    `Get a lesson's HTML content in each language, or in one language with locale (empty list if that language has none). ${COURSE_TEAM_RULE}`,
    shape(ZListCourseLessonTranslationsToolInput),
    READ_ONLY,
    async (args) => {
      const { courseId, lessonId, locale } = ZListCourseLessonTranslationsToolInput.parse(args);
      return jsonContent(await apiClient.listCourseLessonTranslations(courseId, lessonId, locale));
    }
  );

  server.tool(
    'set_course_lesson_translation',
    `Create or replace a lesson's HTML content in one language. The HTML is sanitized and the save is recorded in the lesson history as the API key creator. versionIntent "manual" with versionLabel saves a named version. ${COURSE_TEAM_RULE}`,
    shape(ZSetCourseLessonTranslationToolInput),
    UPDATE,
    async (args) => {
      const { courseId, lessonId, locale, ...payload } = ZSetCourseLessonTranslationToolInput.parse(args);
      return jsonContent(await apiClient.setCourseLessonTranslation(courseId, lessonId, locale, payload));
    }
  );

  server.tool(
    'list_course_lesson_history',
    `List saved versions of a lesson's content in one language, newest first, with the content before and after each save. ${CURSOR_NOTE} ${COURSE_TEAM_RULE}`,
    shape(ZListCourseLessonHistoryToolInput),
    READ_ONLY,
    async (args) => {
      const { courseId, lessonId, ...query } = ZListCourseLessonHistoryToolInput.parse(args);
      return jsonContent(await apiClient.listCourseLessonHistory(courseId, lessonId, query));
    }
  );

  server.tool(
    'list_course_lesson_comments',
    `List a lesson's comments, newest first, with each author's name. ${CURSOR_NOTE} ${COMMENTS_OFF} ${COURSE_TEAM_RULE}`,
    shape(ZListCourseLessonCommentsToolInput),
    READ_ONLY,
    async (args) => {
      const { courseId, lessonId, ...query } = ZListCourseLessonCommentsToolInput.parse(args);
      return jsonContent(await apiClient.listCourseLessonComments(courseId, lessonId, query));
    }
  );

  server.tool(
    'create_course_lesson_comment',
    `Post a comment on a lesson as the API key creator. An org admin who is not in the course is added to it as an admin first. ${COMMENTS_OFF} ${COURSE_TEAM_RULE}`,
    shape(ZCreateCourseLessonCommentToolInput),
    CREATE,
    async (args) => {
      const { courseId, lessonId, ...payload } = ZCreateCourseLessonCommentToolInput.parse(args);
      return jsonContent(await apiClient.createCourseLessonComment(courseId, lessonId, payload));
    }
  );

  server.tool(
    'update_course_lesson_comment',
    `Edit a lesson comment. Only its author (the API key creator) can edit it, otherwise 403. ${COMMENTS_OFF} ${COURSE_TEAM_RULE}`,
    shape(ZUpdateCourseLessonCommentToolInput),
    UPDATE,
    async (args) => {
      const { courseId, lessonId, commentId, ...payload } = ZUpdateCourseLessonCommentToolInput.parse(args);
      return jsonContent(await apiClient.updateCourseLessonComment(courseId, lessonId, commentId, payload));
    }
  );

  server.tool(
    'delete_course_lesson_comment',
    `Permanently delete a lesson comment (hard delete). Its author, a course tutor/admin or an org admin can delete it. ${COMMENTS_OFF} ${COURSE_TEAM_RULE}`,
    shape(ZDeleteCourseLessonCommentToolInput),
    DESTRUCTIVE,
    async (args) => {
      const { courseId, lessonId, commentId } = ZDeleteCourseLessonCommentToolInput.parse(args);
      return jsonContent(await apiClient.deleteCourseLessonComment(courseId, lessonId, commentId));
    }
  );
}

function jsonContent(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}
