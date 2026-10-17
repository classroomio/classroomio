import {
  ZPublicApiAddExerciseQuestion,
  ZPublicApiAddExerciseSection,
  ZPublicApiForceQuery,
  ZPublicApiExerciseQuestionParam,
  ZPublicApiExerciseSectionParam,
  ZPublicApiUpdateExerciseQuestionFields,
  ZPublicApiUpdateExerciseSectionFields,
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
const LIVE_EDIT_NOTE =
  'Changes apply immediately, also on published courses. Submissions already made are not regraded, and students submit against the current questions.';
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
).safeExtend(ZPublicApiForceQuery.shape);
export const ZDeleteCourseExerciseToolInput = ZPublicApiCourseExerciseParam;
export const ZAddExerciseQuestionToolInput = ZPublicApiAddExerciseQuestion.safeExtend(
  ZPublicApiCourseExerciseParam.shape
);
export const ZUpdateExerciseQuestionToolInput = ZPublicApiUpdateExerciseQuestionFields.safeExtend(
  ZPublicApiExerciseQuestionParam.shape
);
export const ZDeleteExerciseQuestionToolInput = ZPublicApiExerciseQuestionParam.extend(ZPublicApiForceQuery.shape);
export const ZAddExerciseSectionToolInput = ZPublicApiAddExerciseSection.safeExtend(
  ZPublicApiCourseExerciseParam.shape
);
export const ZUpdateExerciseSectionToolInput = ZPublicApiUpdateExerciseSectionFields.safeExtend(
  ZPublicApiExerciseSectionParam.shape
);
export const ZDeleteExerciseSectionToolInput = ZPublicApiExerciseSectionParam;
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
    `Create an exercise on a live course. Either send title and questions, or send templateId (from list_exercise_templates) to copy a built-in template; with templateId only sectionId, lessonId and order may be sent alongside it. sectionId and lessonId must belong to this course. ${LIVE_EDIT_NOTE} ${PLAN_NOTE} ${QUESTION_TYPES_GUIDE} ${COURSE_TEAM_RULE}`,
    shape(ZCreateCourseExerciseToolInput),
    CREATE,
    async (args) => {
      const { courseId, ...payload } = ZCreateCourseExerciseToolInput.parse(args);
      return jsonContent(await apiClient.createCourseExercise(courseId, payload));
    }
  );

  server.tool(
    'update_course_exercise',
    `Partially update an exercise on a live course. Omitted fields keep their values. questions is a diff: send a question with its id to edit it, with its id and delete: true to remove it, or without an id to add it; options work the same inside their question, and questions you leave out are unchanged. Read ids with get_course_exercise first. To change one question or one exercise section, use the add/update/delete_exercise_question and _exercise_section tools instead. sections works the same way: id to edit, id and delete: true to remove, no id to add, and sections you leave out are unchanged; a new section may carry a UUID you generate so new questions can point at it with exerciseSectionId, and a removed section must not still hold questions. Deleting a question students have answered fails with 409 unless force is true, which also deletes their answers; ask the user before forcing. ${LIVE_EDIT_NOTE} ${PLAN_NOTE} ${QUESTION_TYPES_GUIDE} ${COURSE_TEAM_RULE}`,
    shape(ZUpdateCourseExerciseToolInput),
    UPDATE,
    async (args) => {
      const { courseId, exerciseId, force, ...payload } = ZUpdateCourseExerciseToolInput.parse(args);
      return jsonContent(await apiClient.updateCourseExercise(courseId, exerciseId, payload, force));
    }
  );

  server.tool(
    'delete_course_exercise',
    `Permanently delete an exercise from a live course. This is a hard delete, not an archive: its questions and every student submission for it are deleted too, and it cannot be undone. ${LIVE_EDIT_NOTE} ${COURSE_TEAM_RULE}`,
    shape(ZDeleteCourseExerciseToolInput),
    DESTRUCTIVE,
    async (args) => {
      const { courseId, exerciseId } = ZDeleteCourseExerciseToolInput.parse(args);
      return jsonContent(await apiClient.deleteCourseExercise(courseId, exerciseId));
    }
  );

  server.tool(
    'add_exercise_question',
    `Add one question, with its options, to an exercise on a live course. If the exercise has sections, pass exerciseSectionId (from get_course_exercise). ${LIVE_EDIT_NOTE} ${PLAN_NOTE} ${QUESTION_TYPES_GUIDE} ${COURSE_TEAM_RULE}`,
    shape(ZAddExerciseQuestionToolInput),
    CREATE,
    async (args) => {
      const { courseId, exerciseId, ...payload } = ZAddExerciseQuestionToolInput.parse(args);
      return jsonContent(await apiClient.addExerciseQuestion(courseId, exerciseId, payload));
    }
  );

  server.tool(
    'update_exercise_question',
    `Edit one question. Fields you leave out keep their values. Options change only through addOptions (new), updateOptions (by id; omitted fields kept) and removeOptionIds; options you do not name are kept. Read ids with get_course_exercise first. ${LIVE_EDIT_NOTE} ${PLAN_NOTE} ${COURSE_TEAM_RULE}`,
    shape(ZUpdateExerciseQuestionToolInput),
    UPDATE,
    async (args) => {
      const { courseId, exerciseId, questionId, ...fields } = ZUpdateExerciseQuestionToolInput.parse(args);
      const payload = ZPublicApiUpdateExerciseQuestionFields.parse(fields);
      return jsonContent(await apiClient.updateExerciseQuestion(courseId, exerciseId, questionId, payload));
    }
  );

  server.tool(
    'delete_exercise_question',
    `Permanently delete one question (hard delete). If students have answered it, the call fails with 409 unless force is true, which also deletes their answers; ask the user before forcing. ${LIVE_EDIT_NOTE} ${COURSE_TEAM_RULE}`,
    shape(ZDeleteExerciseQuestionToolInput),
    DESTRUCTIVE,
    async (args) => {
      const { courseId, exerciseId, questionId, force } = ZDeleteExerciseQuestionToolInput.parse(args);
      return jsonContent(await apiClient.deleteExerciseQuestion(courseId, exerciseId, questionId, force));
    }
  );

  server.tool(
    'add_exercise_section',
    `Add one empty exercise section (a part that groups questions) to an exercise. Put questions in it with add_exercise_question or update_exercise_question (exerciseSectionId). ${LIVE_EDIT_NOTE} ${COURSE_TEAM_RULE}`,
    shape(ZAddExerciseSectionToolInput),
    CREATE,
    async (args) => {
      const { courseId, exerciseId, ...payload } = ZAddExerciseSectionToolInput.parse(args);
      return jsonContent(await apiClient.addExerciseSection(courseId, exerciseId, payload));
    }
  );

  server.tool(
    'update_exercise_section',
    `Edit one exercise section's title, description, order, colorTheme or afterBehavior. Fields you leave out keep their values; its questions are not touched. ${LIVE_EDIT_NOTE} ${COURSE_TEAM_RULE}`,
    shape(ZUpdateExerciseSectionToolInput),
    UPDATE,
    async (args) => {
      const { courseId, exerciseId, sectionId, ...fields } = ZUpdateExerciseSectionToolInput.parse(args);
      const payload = ZPublicApiUpdateExerciseSectionFields.parse(fields);
      return jsonContent(await apiClient.updateExerciseSection(courseId, exerciseId, sectionId, payload));
    }
  );

  server.tool(
    'delete_exercise_section',
    `Permanently delete one empty exercise section (hard delete). Fails with 409 while it holds questions or another section's afterBehavior goes to it: move or delete those first. ${LIVE_EDIT_NOTE} ${COURSE_TEAM_RULE}`,
    shape(ZDeleteExerciseSectionToolInput),
    DESTRUCTIVE,
    async (args) => {
      const { courseId, exerciseId, sectionId } = ZDeleteExerciseSectionToolInput.parse(args);
      return jsonContent(await apiClient.deleteExerciseSection(courseId, exerciseId, sectionId));
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
