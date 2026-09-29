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
  ZPublicApiUpdateCourseExercise
} from '@cio/utils/validation/public-api';
import {
  createCourseExerciseService,
  deleteCourseExerciseService,
  getCourseExerciseNotifyStatusService,
  getCourseExerciseService,
  listCourseExercisesService,
  notifyCourseExerciseLearnersService,
  updateCourseExerciseService
} from '@api/services/v1/courses/exercises';

import { Hono } from '@api/utils/hono';
import { handlePublicApiError } from '@api/utils/errors';
import { describeRoute, validator } from 'hono-openapi';
import { errorResponses, itemResponse, jsonResponse, paginatedResponse } from '@api/utils/openapi/responses';
import { COURSE_TEAM_RULE, PAGINATION_NOTE, exerciseForbiddenResponses, mcpRateLimitResponse } from './docs';

const TAG = 'Public API Course Exercises';
const ExerciseDetailResponse = itemResponse(ZPublicApiCourseExerciseDetailResponse);

const QUESTION_TYPES_NOTE =
  'questionTypeId: 1 single choice, 2 multiple choice, 3 paragraph, 4 true/false, 5 short answer, 6 numeric, 7 fill in the blank, 8 file upload, 9 ordering, 10 link, 11 word bank, 12 star rating, 13 video recording, 14 thumbs up/down. File upload, ordering, link, star rating and video recording need a paid plan (403 UPGRADE_REQUIRED on Basic). PUBLIC courses only accept auto-graded types.';

export const v1CourseExercisesRouter = new Hono()
  .get(
    '/',
    describeRoute({
      description: `List a course's exercises in course order, without their questions. Filter by sectionId (course section) or the deprecated lessonId. ${PAGINATION_NOTE} ${COURSE_TEAM_RULE}`,
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
      description: `Create an exercise in a course, either with your own questions or from a built-in template (templateId from GET /exercise-templates). With templateId, the template supplies the title, description and questions, so only sectionId, lessonId and order are allowed alongside it. sectionId and lessonId must belong to this course. ${QUESTION_TYPES_NOTE} ${COURSE_TEAM_RULE}`,
      tags: [TAG],
      responses: {
        201: jsonResponse('Exercise created successfully', ExerciseDetailResponse),
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
      description: `Get an exercise with its questions, options (including which are correct) and exercise sections. ${COURSE_TEAM_RULE}`,
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
      description: [
        'Partially update an exercise. Omitted fields keep their values.',
        'questions is a diff, like the dashboard editor: send a question with its id to edit it, with id and delete: true to remove it, and without an id to add it.',
        'Options follow the same rules inside their question. Questions you leave out are unchanged.',
        'Question, option and section ids must belong to this exercise.',
        'sections replaces the exercise sections: sections you leave out are deleted. New sections may carry a UUID you generate, so new questions can reference them by exerciseSectionId.',
        'When sections is sent, every remaining question must be assigned to one of them.',
        QUESTION_TYPES_NOTE,
        COURSE_TEAM_RULE
      ].join(' '),
      tags: [TAG],
      responses: {
        200: jsonResponse('Exercise updated successfully', ExerciseDetailResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: exerciseForbiddenResponses.writeWithPlan,
        404: { description: 'Course, exercise, section, lesson, question or option not found' },
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiCourseExerciseParam),
    validator('json', ZPublicApiUpdateCourseExercise),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const exercise = await updateCourseExerciseService(orgId, actorId, c.req.valid('param'), c.req.valid('json'));

        return c.json({ success: true, data: exercise }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to update course exercise');
      }
    }
  )
  .delete(
    '/:exerciseId',
    describeRoute({
      description: `Permanently delete an exercise. This is a hard delete: its questions and every learner submission for it are deleted too, and it cannot be undone. ${COURSE_TEAM_RULE}`,
      tags: [TAG],
      responses: {
        200: jsonResponse('Exercise deleted successfully', itemResponse(ZPublicApiCourseExerciseResponse)),
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
      description: `Email every course member a link to take this exercise, the same as "Notify students" in the dashboard. Emails are sent by a background job: this returns 202 with a jobId to poll with GET /courses/{courseId}/exercises/{exerciseId}/notify/{jobId}. Each call sends the emails again. ${COURSE_TEAM_RULE}`,
      tags: [TAG],
      responses: {
        202: jsonResponse('Notification job queued', itemResponse(ZPublicApiCourseExerciseNotifyResponse)),
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
        const result = await notifyCourseExerciseLearnersService(orgId, actorId, c.req.valid('param'));

        return c.json({ success: true, data: result }, 202);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to notify course members');
      }
    }
  )
  .get(
    '/:exerciseId/notify/:jobId',
    describeRoute({
      description: `Get the status of a notification job started with POST /courses/{courseId}/exercises/{exerciseId}/notify. Poll until status is completed or failed, waiting nextPollMs between calls; pass how many times you have polled as pollCount. Finished jobs are removed after a while, which returns 404. ${COURSE_TEAM_RULE}`,
      tags: [TAG],
      responses: {
        200: jsonResponse(
          'Notification job status returned successfully',
          itemResponse(ZPublicApiCourseExerciseNotifyStatusResponse)
        ),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: exerciseForbiddenResponses.read,
        404: {
          description: "Course, exercise or job not found, or the job is not this course's exercise notification"
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
