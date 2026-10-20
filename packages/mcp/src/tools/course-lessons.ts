import {
  ZPublicApiForceQuery,
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

const COURSE_TEAM_RULE = 'the API key creator must be a course tutor/admin or an org admin';
const CURSOR_NOTE = 'Pass nextCursor back as cursor for the next page.';

export const ZListCourseLessonsToolInput = ZPublicApiCourseLessonsQuery.extend({
  courseId: ZPublicApiCourseParam.shape.courseId
});
export const ZCourseLessonToolInput = ZPublicApiCourseLessonParam;
export const ZDeleteCourseLessonToolInput = ZPublicApiCourseLessonParam.extend(ZPublicApiForceQuery.shape);
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
    `List a live course's lessons in order, without their content; ${COURSE_TEAM_RULE}.`,
    shape(ZListCourseLessonsToolInput),
    READ_ONLY,
    async (args) => {
      const { courseId, ...query } = ZListCourseLessonsToolInput.parse(args);
      return jsonContent(await apiClient.listCourseLessons(courseId, query));
    }
  );

  server.tool(
    'get_course_lesson',
    `Get one lesson with its note, slides, videos, documents and the content of every language; ${COURSE_TEAM_RULE}.`,
    shape(ZCourseLessonToolInput),
    READ_ONLY,
    async (args) => {
      const { courseId, lessonId } = ZCourseLessonToolInput.parse(args);
      return jsonContent(await apiClient.getCourseLesson(courseId, lessonId));
    }
  );

  server.tool(
    'delete_course_lesson',
    `Permanently delete a lesson with its translations, history, comments and learners' completion; ${COURSE_TEAM_RULE}. Ask the user before setting force, which deletes students' work too.`,
    shape(ZDeleteCourseLessonToolInput),
    DESTRUCTIVE,
    async (args) => {
      const { courseId, lessonId, force } = ZDeleteCourseLessonToolInput.parse(args);
      return jsonContent(await apiClient.deleteCourseLesson(courseId, lessonId, force));
    }
  );

  server.tool(
    'notify_course_lesson_session_update',
    `Email every student an updated calendar invite after a live lesson's time or call link changed; ${COURSE_TEAM_RULE}. Fails with 409 if the lesson has no callUrl and lessonAt.`,
    shape(ZCourseLessonToolInput),
    CREATE,
    async (args) => {
      const { courseId, lessonId } = ZCourseLessonToolInput.parse(args);
      return jsonContent(await apiClient.notifyCourseLessonSessionUpdate(courseId, lessonId));
    }
  );

  server.tool(
    'list_course_lesson_translations',
    `Get a lesson's HTML content in each language, or in one language with locale; ${COURSE_TEAM_RULE}.`,
    shape(ZListCourseLessonTranslationsToolInput),
    READ_ONLY,
    async (args) => {
      const { courseId, lessonId, locale } = ZListCourseLessonTranslationsToolInput.parse(args);
      return jsonContent(await apiClient.listCourseLessonTranslations(courseId, lessonId, locale));
    }
  );

  server.tool(
    'set_course_lesson_translation',
    `Create or replace a lesson's HTML content in one language, recorded in the lesson history as the API key creator; ${COURSE_TEAM_RULE}.`,
    shape(ZSetCourseLessonTranslationToolInput),
    UPDATE,
    async (args) => {
      const { courseId, lessonId, locale, ...payload } = ZSetCourseLessonTranslationToolInput.parse(args);
      return jsonContent(await apiClient.setCourseLessonTranslation(courseId, lessonId, locale, payload));
    }
  );

  server.tool(
    'list_course_lesson_history',
    `List saved versions of a lesson's content in one language, newest first; ${COURSE_TEAM_RULE}. ${CURSOR_NOTE}`,
    shape(ZListCourseLessonHistoryToolInput),
    READ_ONLY,
    async (args) => {
      const { courseId, lessonId, ...query } = ZListCourseLessonHistoryToolInput.parse(args);
      return jsonContent(await apiClient.listCourseLessonHistory(courseId, lessonId, query));
    }
  );

  server.tool(
    'list_course_lesson_comments',
    `List a lesson's comments, newest first, with each author's name; ${COURSE_TEAM_RULE}. ${CURSOR_NOTE}`,
    shape(ZListCourseLessonCommentsToolInput),
    READ_ONLY,
    async (args) => {
      const { courseId, lessonId, ...query } = ZListCourseLessonCommentsToolInput.parse(args);
      return jsonContent(await apiClient.listCourseLessonComments(courseId, lessonId, query));
    }
  );

  server.tool(
    'create_course_lesson_comment',
    `Post a comment on a lesson as the API key creator; ${COURSE_TEAM_RULE}.`,
    shape(ZCreateCourseLessonCommentToolInput),
    CREATE,
    async (args) => {
      const { courseId, lessonId, ...payload } = ZCreateCourseLessonCommentToolInput.parse(args);
      return jsonContent(await apiClient.createCourseLessonComment(courseId, lessonId, payload));
    }
  );

  server.tool(
    'update_course_lesson_comment',
    `Edit a lesson comment the API key creator wrote; ${COURSE_TEAM_RULE}.`,
    shape(ZUpdateCourseLessonCommentToolInput),
    UPDATE,
    async (args) => {
      const { courseId, lessonId, commentId, ...payload } = ZUpdateCourseLessonCommentToolInput.parse(args);
      return jsonContent(await apiClient.updateCourseLessonComment(courseId, lessonId, commentId, payload));
    }
  );

  server.tool(
    'delete_course_lesson_comment',
    `Permanently delete a lesson comment; ${COURSE_TEAM_RULE}.`,
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
