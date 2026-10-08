import {
  ZPublicApiCourseExerciseNotifyParam,
  ZPublicApiCourseExerciseNotifyStatusQuery,
  ZPublicApiCourseExerciseParam,
  ZPublicApiCourseExercisesQuery,
  ZPublicApiCourseParam,
  ZPublicApiCreateCourseExercise,
  ZPublicApiExerciseTemplateParam,
  ZPublicApiExerciseTemplatesQuery,
  ZPublicApiUpdateCourseExercise
} from '@cio/utils/validation/public-api';
import { formatEnabledQuestionTypesGuide } from '@cio/question-types';

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
const ORG_TEAM_RULE = 'The API key creator must be an organization admin or tutor, otherwise the call fails with 403.';
const PAGINATION_NOTE = 'Paginated: page (default 1) and limit (default 20, max 100); the result includes pagination.';
const QUESTION_TYPES_GUIDE = formatEnabledQuestionTypesGuide();
const PLAN_NOTE =
  'File upload, ordering, link, star rating and video recording questions need a paid plan (403 UPGRADE_REQUIRED on the Basic plan). PUBLIC courses only accept auto-graded question types.';

export const ZListCourseExercisesToolInput = ZPublicApiCourseExercisesQuery.extend({
  courseId: ZPublicApiCourseParam.shape.courseId
});
export const ZGetCourseExerciseToolInput = ZPublicApiCourseExerciseParam;
export const ZCreateCourseExerciseToolInput = ZPublicApiCreateCourseExercise.safeExtend({
  courseId: ZPublicApiCourseParam.shape.courseId
});
export const ZUpdateCourseExerciseToolInput = ZPublicApiUpdateCourseExercise.safeExtend(
  ZPublicApiCourseExerciseParam.shape
);
export const ZDeleteCourseExerciseToolInput = ZPublicApiCourseExerciseParam;
export const ZNotifyCourseExerciseToolInput = ZPublicApiCourseExerciseParam;
export const ZGetCourseExerciseNotifyStatusToolInput = ZPublicApiCourseExerciseNotifyParam.extend(
  ZPublicApiCourseExerciseNotifyStatusQuery.shape
);
export const ZListExerciseTemplatesToolInput = ZPublicApiExerciseTemplatesQuery;
export const ZGetExerciseTemplateToolInput = ZPublicApiExerciseTemplateParam;

const shape = (schema: { shape: unknown }) => schema.shape as unknown as ZodRawShapeCompat;

export function registerCourseExerciseTools(server: McpServer, apiClient: ClassroomIoApiClient) {
  server.tool(
    'list_course_exercises',
    `List a live course's exercises in course order, without their questions (use get_course_exercise for those). Optionally filter by sectionId (course section) or the deprecated lessonId. ${PAGINATION_NOTE} ${COURSE_TEAM_RULE}`,
    shape(ZListCourseExercisesToolInput),
    READ_ONLY,
    async (args) => {
      const { courseId, ...query } = ZListCourseExercisesToolInput.parse(args);
      return jsonContent(await apiClient.listCourseExercises(courseId, query));
    }
  );

  server.tool(
    'get_course_exercise',
    `Get one exercise from a live course with its questions, options (including which are correct) and exercise sections. Question and option ids from here are what update_course_exercise needs. ${COURSE_TEAM_RULE}`,
    shape(ZGetCourseExerciseToolInput),
    READ_ONLY,
    async (args) => {
      const { courseId, exerciseId } = ZGetCourseExerciseToolInput.parse(args);
      return jsonContent(await apiClient.getCourseExercise(courseId, exerciseId));
    }
  );

  server.tool(
    'create_course_exercise',
    `Create an exercise on a live course. Either send title and questions, or send templateId (from list_exercise_templates) to copy a built-in template; with templateId only sectionId, lessonId and order may be sent alongside it. sectionId and lessonId must belong to this course. ${PLAN_NOTE} ${QUESTION_TYPES_GUIDE} ${COURSE_TEAM_RULE}`,
    shape(ZCreateCourseExerciseToolInput),
    CREATE,
    async (args) => {
      const { courseId, ...payload } = ZCreateCourseExerciseToolInput.parse(args);
      return jsonContent(await apiClient.createCourseExercise(courseId, payload));
    }
  );

  server.tool(
    'update_course_exercise',
    `Partially update an exercise on a live course. Omitted fields keep their values. questions is a diff: send a question with its id to edit it, with its id and delete: true to remove it, or without an id to add it; options work the same inside their question, and questions you leave out are unchanged. Read ids with get_course_exercise first. sections replaces all exercise sections (ones you leave out are deleted); a new section may carry a UUID you generate so new questions can point at it with exerciseSectionId, and when sections is sent every remaining question must be in one. ${PLAN_NOTE} ${QUESTION_TYPES_GUIDE} ${COURSE_TEAM_RULE}`,
    shape(ZUpdateCourseExerciseToolInput),
    UPDATE,
    async (args) => {
      const { courseId, exerciseId, ...payload } = ZUpdateCourseExerciseToolInput.parse(args);
      return jsonContent(await apiClient.updateCourseExercise(courseId, exerciseId, payload));
    }
  );

  server.tool(
    'delete_course_exercise',
    `Permanently delete an exercise from a live course. This is a hard delete, not an archive: its questions and every learner submission for it are deleted too, and it cannot be undone. ${COURSE_TEAM_RULE}`,
    shape(ZDeleteCourseExerciseToolInput),
    DESTRUCTIVE,
    async (args) => {
      const { courseId, exerciseId } = ZDeleteCourseExerciseToolInput.parse(args);
      return jsonContent(await apiClient.deleteCourseExercise(courseId, exerciseId));
    }
  );

  server.tool(
    'notify_course_exercise',
    `Email every member of a course a link to take an exercise. Runs as a background job and returns a jobId; check it with get_course_exercise_notify_status. Every call sends the emails again, so don't retry a call that succeeded. ${COURSE_TEAM_RULE}`,
    shape(ZNotifyCourseExerciseToolInput),
    CREATE,
    async (args) => {
      const { courseId, exerciseId } = ZNotifyCourseExerciseToolInput.parse(args);
      return jsonContent(await apiClient.notifyCourseExercise(courseId, exerciseId));
    }
  );

  server.tool(
    'get_course_exercise_notify_status',
    `Check a notification job started by notify_course_exercise. status is queued, running, completed or failed; wait nextPollMs before checking again and pass how many times you have checked as pollCount. ${COURSE_TEAM_RULE}`,
    shape(ZGetCourseExerciseNotifyStatusToolInput),
    READ_ONLY,
    async (args) => {
      const { courseId, exerciseId, jobId, pollCount } = ZGetCourseExerciseNotifyStatusToolInput.parse(args);
      return jsonContent(await apiClient.getCourseExerciseNotifyStatus(courseId, exerciseId, jobId, pollCount));
    }
  );

  server.tool(
    'list_exercise_templates',
    `List the built-in exercise templates (the same for every organization), optionally filtered by tag. Pass a template's id as templateId to create_course_exercise. ${PAGINATION_NOTE} ${ORG_TEAM_RULE}`,
    shape(ZListExerciseTemplatesToolInput),
    READ_ONLY,
    async (args) => {
      const query = ZListExerciseTemplatesToolInput.parse(args);
      return jsonContent(await apiClient.listExerciseTemplates(query));
    }
  );

  server.tool(
    'get_exercise_template',
    `Get a built-in exercise template with the questions it creates. ${ORG_TEAM_RULE}`,
    shape(ZGetExerciseTemplateToolInput),
    READ_ONLY,
    async (args) => {
      const { templateId } = ZGetExerciseTemplateToolInput.parse(args);
      return jsonContent(await apiClient.getExerciseTemplate(templateId));
    }
  );
}

function jsonContent(data: unknown) {
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(data)
      }
    ]
  };
}
