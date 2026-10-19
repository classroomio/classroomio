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

import type { ClassroomIoApiClient } from '../api-client';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';
import type { ZodRawShapeCompat } from '@modelcontextprotocol/sdk/server/zod-compat.js';

const READ_ONLY: ToolAnnotations = { readOnlyHint: true, destructiveHint: false };
const CREATE: ToolAnnotations = { readOnlyHint: false, destructiveHint: false, idempotentHint: false };
const UPDATE: ToolAnnotations = { readOnlyHint: false, destructiveHint: false, idempotentHint: true };
const DESTRUCTIVE: ToolAnnotations = { readOnlyHint: false, destructiveHint: true, idempotentHint: false };

const COURSE_TEAM_RULE = 'the API key creator must be a course tutor/admin or an org admin';
const ORG_TEAM_RULE = 'the API key creator must be an org admin or tutor';
const LIVE_EDIT_NOTE = 'Changes apply immediately, also on published courses.';

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
    `List a live course's exercises in course order, without their questions; ${COURSE_TEAM_RULE}. Use get_course_exercise for the questions.`,
    shape(ZListCourseExercisesToolInput),
    READ_ONLY,
    async (args) => {
      const { courseId, ...query } = ZListCourseExercisesToolInput.parse(args);
      return jsonContent(await apiClient.listCourseExercises(courseId, query));
    }
  );

  server.tool(
    'get_course_exercise',
    `Get one exercise from a live course with its questions, options (including which are correct) and exercise sections; ${COURSE_TEAM_RULE}. Its question and option ids are what update_course_exercise needs.`,
    shape(ZGetCourseExerciseToolInput),
    READ_ONLY,
    async (args) => {
      const { courseId, exerciseId } = ZGetCourseExerciseToolInput.parse(args);
      return jsonContent(await apiClient.getCourseExercise(courseId, exerciseId));
    }
  );

  server.tool(
    'create_course_exercise',
    `Create an exercise on a live course from your own questions or from a templateId (from list_exercise_templates); ${COURSE_TEAM_RULE}. ${LIVE_EDIT_NOTE}`,
    shape(ZCreateCourseExerciseToolInput),
    CREATE,
    async (args) => {
      const { courseId, ...payload } = ZCreateCourseExerciseToolInput.parse(args);
      return jsonContent(await apiClient.createCourseExercise(courseId, payload));
    }
  );

  server.tool(
    'update_course_exercise',
    `Partially update an exercise on a live course, or change many of its questions and sections at once; ${COURSE_TEAM_RULE}. Read ids with get_course_exercise first, and ask the user before setting force.`,
    shape(ZUpdateCourseExerciseToolInput),
    UPDATE,
    async (args) => {
      const { courseId, exerciseId, force, ...payload } = ZUpdateCourseExerciseToolInput.parse(args);
      return jsonContent(await apiClient.updateCourseExercise(courseId, exerciseId, payload, force));
    }
  );

  server.tool(
    'delete_course_exercise',
    `Permanently delete an exercise from a live course with its questions and every student submission for it; ${COURSE_TEAM_RULE}.`,
    shape(ZDeleteCourseExerciseToolInput),
    DESTRUCTIVE,
    async (args) => {
      const { courseId, exerciseId } = ZDeleteCourseExerciseToolInput.parse(args);
      return jsonContent(await apiClient.deleteCourseExercise(courseId, exerciseId));
    }
  );

  server.tool(
    'add_exercise_question',
    `Add one question, with its options, to an exercise on a live course; ${COURSE_TEAM_RULE}. ${LIVE_EDIT_NOTE}`,
    shape(ZAddExerciseQuestionToolInput),
    CREATE,
    async (args) => {
      const { courseId, exerciseId, ...payload } = ZAddExerciseQuestionToolInput.parse(args);
      return jsonContent(await apiClient.addExerciseQuestion(courseId, exerciseId, payload));
    }
  );

  server.tool(
    'update_exercise_question',
    `Edit one question and its options; ${COURSE_TEAM_RULE}. Read ids with get_course_exercise first.`,
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
    `Permanently delete one question from an exercise; ${COURSE_TEAM_RULE}. Ask the user before setting force, which deletes students' work too.`,
    shape(ZDeleteExerciseQuestionToolInput),
    DESTRUCTIVE,
    async (args) => {
      const { courseId, exerciseId, questionId, force } = ZDeleteExerciseQuestionToolInput.parse(args);
      return jsonContent(await apiClient.deleteExerciseQuestion(courseId, exerciseId, questionId, force));
    }
  );

  server.tool(
    'add_exercise_section',
    `Add one empty exercise section, a part that groups questions, to an exercise; ${COURSE_TEAM_RULE}. Put questions in it with add_exercise_question or update_exercise_question (exerciseSectionId).`,
    shape(ZAddExerciseSectionToolInput),
    CREATE,
    async (args) => {
      const { courseId, exerciseId, ...payload } = ZAddExerciseSectionToolInput.parse(args);
      return jsonContent(await apiClient.addExerciseSection(courseId, exerciseId, payload));
    }
  );

  server.tool(
    'update_exercise_section',
    `Edit one exercise section's title, description, order, colorTheme or afterBehavior without touching its questions; ${COURSE_TEAM_RULE}.`,
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
    `Permanently delete one empty exercise section; ${COURSE_TEAM_RULE}. Fails with 409 while it holds questions or another section's afterBehavior goes to it.`,
    shape(ZDeleteExerciseSectionToolInput),
    DESTRUCTIVE,
    async (args) => {
      const { courseId, exerciseId, sectionId } = ZDeleteExerciseSectionToolInput.parse(args);
      return jsonContent(await apiClient.deleteExerciseSection(courseId, exerciseId, sectionId));
    }
  );

  server.tool(
    'notify_course_exercise',
    `Email every member of a course a link to take an exercise, as a background job you check with get_course_exercise_notify_status; ${COURSE_TEAM_RULE}. Every call sends the emails again, so don't retry a call that succeeded.`,
    shape(ZNotifyCourseExerciseToolInput),
    CREATE,
    async (args) => {
      const { courseId, exerciseId } = ZNotifyCourseExerciseToolInput.parse(args);
      return jsonContent(await apiClient.notifyCourseExercise(courseId, exerciseId));
    }
  );

  server.tool(
    'get_course_exercise_notify_status',
    `Check a notification job started by notify_course_exercise; ${COURSE_TEAM_RULE}. Wait nextPollMs before checking again, and pass how many times you have checked as pollCount.`,
    shape(ZGetCourseExerciseNotifyStatusToolInput),
    READ_ONLY,
    async (args) => {
      const { courseId, exerciseId, jobId, pollCount } = ZGetCourseExerciseNotifyStatusToolInput.parse(args);
      return jsonContent(await apiClient.getCourseExerciseNotifyStatus(courseId, exerciseId, jobId, pollCount));
    }
  );

  server.tool(
    'list_exercise_templates',
    `List the built-in exercise templates, which are the same for every organization; ${ORG_TEAM_RULE}. Pass a template's id as templateId to create_course_exercise.`,
    shape(ZListExerciseTemplatesToolInput),
    READ_ONLY,
    async (args) => {
      const query = ZListExerciseTemplatesToolInput.parse(args);
      return jsonContent(await apiClient.listExerciseTemplates(query));
    }
  );

  server.tool(
    'get_exercise_template',
    `Get a built-in exercise template with the questions it creates; ${ORG_TEAM_RULE}.`,
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
