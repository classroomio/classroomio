import {
  ZPublicApiAddExerciseQuestion,
  ZPublicApiCourseExerciseParam,
  ZPublicApiForceQuery,
  ZPublicApiExerciseQuestionParam,
  ZPublicApiExerciseQuestionResponse,
  ZPublicApiUpdateExerciseQuestionFields
} from '@cio/utils/validation/public-api';
import {
  addCourseExerciseQuestionService,
  deleteCourseExerciseQuestionService,
  updateCourseExerciseQuestionService
} from '@api/services/v1/courses/exercise-questions';

import { Hono } from '@api/utils/hono';
import { handlePublicApiError } from '@api/utils/errors';
import { describeRoute, validator } from 'hono-openapi';
import { errorResponses, itemResponse, jsonResponse } from '@api/utils/openapi/responses';
import {
  COURSE_TEAM_RULE,
  LIVE_EDIT_NOTE,
  QUESTION_TYPES_NOTE,
  exerciseForbiddenResponses,
  mcpRateLimitResponse
} from './docs';

const TAG = 'Exercise Questions';
const QuestionResponse = itemResponse(ZPublicApiExerciseQuestionResponse);

export const v1CourseExerciseQuestionsRouter = new Hono()
  .post(
    '/',
    describeRoute({
      description: `Add one question, with its options, to an exercise. ${LIVE_EDIT_NOTE} ${QUESTION_TYPES_NOTE} ${COURSE_TEAM_RULE}`,
      tags: [TAG],
      responses: {
        201: jsonResponse('Question added successfully', QuestionResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: exerciseForbiddenResponses.writeWithPlan,
        404: { description: 'Course, exercise or exercise section not found' },
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiCourseExerciseParam),
    validator('json', ZPublicApiAddExerciseQuestion),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const question = await addCourseExerciseQuestionService(
          orgId,
          actorId,
          c.req.valid('param'),
          c.req.valid('json')
        );

        return c.json({ success: true, data: question }, 201);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to add exercise question');
      }
    }
  )
  .patch(
    '/:questionId',
    describeRoute({
      description: `Edit one question. Fields you leave out keep their values; options change only through addOptions, updateOptions and removeOptionIds. ${LIVE_EDIT_NOTE} ${QUESTION_TYPES_NOTE} ${COURSE_TEAM_RULE}`,
      tags: [TAG],
      responses: {
        200: jsonResponse('Question updated successfully', QuestionResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: exerciseForbiddenResponses.writeWithPlan,
        404: { description: 'Course, exercise, question, option or exercise section not found' },
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiExerciseQuestionParam),
    validator('json', ZPublicApiUpdateExerciseQuestionFields),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const question = await updateCourseExerciseQuestionService(
          orgId,
          actorId,
          c.req.valid('param'),
          c.req.valid('json')
        );

        return c.json({ success: true, data: question }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to update exercise question');
      }
    }
  )
  .delete(
    '/:questionId',
    describeRoute({
      description: `Permanently delete one question. A question students have answered is only deleted with force=true, which also deletes their answers to it. ${LIVE_EDIT_NOTE} ${COURSE_TEAM_RULE}`,
      tags: [TAG],
      responses: {
        200: jsonResponse('Question deleted successfully; returns the question as it was', QuestionResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: exerciseForbiddenResponses.write,
        404: { description: 'Course, exercise or question not found' },
        409: { description: 'Students have answered this question; pass force=true to delete it with their answers' },
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiExerciseQuestionParam),
    validator('query', ZPublicApiForceQuery),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const question = await deleteCourseExerciseQuestionService(
          orgId,
          actorId,
          c.req.valid('param'),
          c.req.valid('query')
        );

        return c.json({ success: true, data: question }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to delete exercise question');
      }
    }
  );
