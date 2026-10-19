import {
  ZPublicApiCourseExerciseDetailResponse,
  ZPublicApiCourseExerciseNotifyParam,
  ZPublicApiCourseExerciseNotifyResponse,
  ZPublicApiCourseExerciseNotifyStatusQuery,
  ZPublicApiCourseExerciseNotifyStatusResponse,
  ZPublicApiCourseExerciseParam,
  ZPublicApiCourseExerciseResponse,
  ZPublicApiCourseExercisesQuery,
  ZPublicApiCourseParam,
  ZPublicApiCreateCourseExercise,
  ZPublicApiForceQuery,
  ZPublicApiUpdateCourseExercise
} from '@cio/utils/validation/public-api';
import {
  createCourseExerciseService,
  deleteCourseExerciseService,
  getCourseExerciseNotifyStatusService,
  getCourseExerciseService,
  listCourseExercisesService,
  notifyCourseExerciseStudentsService,
  updateCourseExerciseService
} from '@api/services/v1/courses/exercises';

import { Hono } from '@api/utils/hono';
import { handlePublicApiError } from '@api/utils/errors';
import { describeRoute, validator } from 'hono-openapi';
import { errorResponses, itemResponse, jsonResponse, paginatedResponse } from '@api/utils/openapi/responses';
import { COURSE_TEAM_RULE, LIVE_EDIT_NOTE, exerciseForbiddenResponses, mcpRateLimitResponse } from './docs';

const TAG = 'Course Exercises';
const ExerciseDetailResponse = itemResponse(ZPublicApiCourseExerciseDetailResponse);

export const v1CourseExercisesRouter = new Hono()
  .get(
    '/',
    describeRoute({
      description: `List a course's exercises in course order, without their questions; ${COURSE_TEAM_RULE}.`,
      tags: [TAG],
      responses: {
        200: jsonResponse('Exercises returned successfully', paginatedResponse(ZPublicApiCourseExerciseResponse)),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: exerciseForbiddenResponses.read,
        404: { description: 'Course not found' },
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiCourseParam),
    validator('query', ZPublicApiCourseExercisesQuery),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const result = await listCourseExercisesService(orgId, actorId, c.req.valid('param'), c.req.valid('query'));

        return c.json({ success: true, data: result.items, pagination: result.pagination }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to list course exercises');
      }
    }
  )
  .post(
    '/',
    describeRoute({
      description: `Create an exercise in a course, with your own questions or from a built-in template; ${COURSE_TEAM_RULE}.`,
      tags: [TAG],
      responses: {
        201: jsonResponse(`Exercise created successfully. ${LIVE_EDIT_NOTE}`, ExerciseDetailResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: exerciseForbiddenResponses.writeWithPlan,
        404: { description: 'Course, section, lesson or template not found' },
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiCourseParam),
    validator('json', ZPublicApiCreateCourseExercise),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const exercise = await createCourseExerciseService(orgId, actorId, c.req.valid('param'), c.req.valid('json'));

        return c.json({ success: true, data: exercise }, 201);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to create course exercise');
      }
    }
  )
  .get(
    '/:exerciseId',
    describeRoute({
      description: `Get an exercise with its questions, options (including which are correct) and exercise sections; ${COURSE_TEAM_RULE}.`,
      tags: [TAG],
      responses: {
        200: jsonResponse('Exercise returned successfully', ExerciseDetailResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: exerciseForbiddenResponses.read,
        404: { description: 'Course or exercise not found' },
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiCourseExerciseParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const exercise = await getCourseExerciseService(orgId, actorId, c.req.valid('param'));

        return c.json({ success: true, data: exercise }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to fetch course exercise');
      }
    }
  )
  .put(
    '/:exerciseId',
    describeRoute({
      description: `Partially update an exercise, or change many of its questions and sections at once; ${COURSE_TEAM_RULE}.`,
      tags: [TAG],
      responses: {
        200: jsonResponse(`Exercise updated successfully. ${LIVE_EDIT_NOTE}`, ExerciseDetailResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: exerciseForbiddenResponses.writeWithPlan,
        404: { description: 'Course, exercise, section, lesson, question or option not found' },
        409: {
          description:
            'A deleted question has student answers and force is not set, or a removed section still holds questions or is a go_to_section target'
        },
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiCourseExerciseParam),
    validator('json', ZPublicApiUpdateCourseExercise),
    validator('query', ZPublicApiForceQuery),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const exercise = await updateCourseExerciseService(
          orgId,
          actorId,
          c.req.valid('param'),
          c.req.valid('json'),
          c.req.valid('query')
        );

        return c.json({ success: true, data: exercise }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to update course exercise');
      }
    }
  )
  .delete(
    '/:exerciseId',
    describeRoute({
      description: `Permanently delete an exercise with its questions and every student submission for it; ${COURSE_TEAM_RULE}.`,
      tags: [TAG],
      responses: {
        200: jsonResponse('Exercise deleted; this cannot be undone', itemResponse(ZPublicApiCourseExerciseResponse)),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: exerciseForbiddenResponses.write,
        404: { description: 'Course or exercise not found' },
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiCourseExerciseParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const exercise = await deleteCourseExerciseService(orgId, actorId, c.req.valid('param'));

        return c.json({ success: true, data: exercise }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to delete course exercise');
      }
    }
  )
  .post(
    '/:exerciseId/notify',
    describeRoute({
      description: `Email every course member a link to take this exercise, like "Notify students" in the dashboard; ${COURSE_TEAM_RULE}.`,
      tags: [TAG],
      responses: {
        202: jsonResponse(
          'Notification job queued; poll GET /courses/{courseId}/exercises/{exerciseId}/notify/{jobId} with the jobId. Each call sends the emails again.',
          itemResponse(ZPublicApiCourseExerciseNotifyResponse)
        ),
        400: { description: 'Invalid path, or a PUBLIC course/exercise has no slug to link to' },
        401: errorResponses.unauthorized,
        403: exerciseForbiddenResponses.write,
        404: { description: 'Course or exercise not found' },
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiCourseExerciseParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const result = await notifyCourseExerciseStudentsService(orgId, actorId, c.req.valid('param'));

        return c.json({ success: true, data: result }, 202);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to notify course members');
      }
    }
  )
  .get(
    '/:exerciseId/notify/:jobId',
    describeRoute({
      description: `Get the status of an exercise notification job; ${COURSE_TEAM_RULE}.`,
      tags: [TAG],
      responses: {
        200: jsonResponse(
          'Job status; poll until status is completed or failed, waiting nextPollMs between calls',
          itemResponse(ZPublicApiCourseExerciseNotifyStatusResponse)
        ),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: exerciseForbiddenResponses.read,
        404: {
          description:
            "Course, exercise or job not found, or the job is not this course's exercise notification. Finished jobs are removed after a while."
        },
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiCourseExerciseNotifyParam),
    validator('query', ZPublicApiCourseExerciseNotifyStatusQuery),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const status = await getCourseExerciseNotifyStatusService(
          orgId,
          actorId,
          c.req.valid('param'),
          c.req.valid('query')
        );

        return c.json({ success: true, data: status }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to fetch notification status');
      }
    }
  );
