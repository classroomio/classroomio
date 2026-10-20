import {
  ZPublicApiCourseLessonDetailResponse,
  ZPublicApiCourseLessonNotifyResponse,
  ZPublicApiCourseLessonParam,
  ZPublicApiCourseLessonResponse,
  ZPublicApiCourseLessonsQuery,
  ZPublicApiCourseParam,
  ZPublicApiCreateLesson,
  ZPublicApiForceQuery,
  ZPublicApiLessonParam,
  ZPublicApiLessonResponse,
  ZPublicApiUpdateLesson
} from '@cio/utils/validation/public-api';
import {
  deletePublicApiCourseLessonService,
  getPublicApiCourseLessonService,
  listPublicApiCourseLessonsService,
  notifyPublicApiCourseLessonSessionService
} from '@api/services/v1/courses/lessons';
import { createPublicApiLessonService, updatePublicApiLessonService } from '@api/services/v1/lessons/lesson';

import { Hono } from '@api/utils/hono';
import { handlePublicApiError } from '@api/utils/errors';
import { describeRoute, validator } from 'hono-openapi';
import { errorResponses, itemResponse, jsonResponse, paginatedResponse } from '@api/utils/openapi/responses';
import { COURSE_TEAM_RULE, contentForbiddenResponses, mcpRateLimitResponse, studentWorkConflictResponse } from './docs';

const TAG = 'Course Lessons';
const LessonResponse = itemResponse(ZPublicApiLessonResponse);

const LESSON_WRITE_RULE = 'any key with the course:write or public_api:* scope may call it';

export const v1CourseLessonsRouter = new Hono()
  .get(
    '/',
    describeRoute({
      description: `List a course's lessons in order, without their content; ${COURSE_TEAM_RULE}.`,
      tags: [TAG],
      responses: {
        200: jsonResponse('Lessons returned successfully', paginatedResponse(ZPublicApiCourseLessonResponse)),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: contentForbiddenResponses.read,
        404: { description: 'Course or section not found' },
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiCourseParam),
    validator('query', ZPublicApiCourseLessonsQuery),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const result = await listPublicApiCourseLessonsService(
          orgId,
          actorId,
          c.req.valid('param'),
          c.req.valid('query')
        );

        return c.json({ success: true, data: result.items, pagination: result.pagination }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to list course lessons');
      }
    }
  )
  .get(
    '/:lessonId',
    describeRoute({
      description: `Get a lesson with its note, slides, videos, documents and every translation; ${COURSE_TEAM_RULE}.`,
      tags: [TAG],
      responses: {
        200: jsonResponse(
          'Lesson returned; uploaded videos and documents come back as short-lived signed links',
          itemResponse(ZPublicApiCourseLessonDetailResponse)
        ),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: contentForbiddenResponses.read,
        404: { description: 'Course or lesson not found' },
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiCourseLessonParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const lesson = await getPublicApiCourseLessonService(orgId, actorId, c.req.valid('param'));

        return c.json({ success: true, data: lesson }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to fetch course lesson');
      }
    }
  )
  .delete(
    '/:lessonId',
    describeRoute({
      description: `Permanently delete a lesson with its translations, history, comments and learners' completion; ${COURSE_TEAM_RULE}.`,
      tags: [TAG],
      responses: {
        200: jsonResponse(
          'Lesson deleted; to delete several lessons or exercises at once, use DELETE /courses/{courseId}/content',
          itemResponse(ZPublicApiCourseLessonResponse)
        ),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: contentForbiddenResponses.write,
        404: { description: 'Course or lesson not found' },
        409: studentWorkConflictResponse,
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiCourseLessonParam),
    validator('query', ZPublicApiForceQuery),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const lesson = await deletePublicApiCourseLessonService(
          orgId,
          actorId,
          c.req.valid('param'),
          c.req.valid('query')
        );

        return c.json({ success: true, data: lesson }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to delete course lesson');
      }
    }
  )
  .post(
    '/:lessonId/notify-session-update',
    describeRoute({
      description: `Email the course's students an updated calendar invite after a live lesson's time or call link changed; ${COURSE_TEAM_RULE}.`,
      tags: [TAG],
      responses: {
        202: jsonResponse(
          'Notification queued; the emails are sent in the background, skipping students without an email or who turned these emails off',
          itemResponse(ZPublicApiCourseLessonNotifyResponse)
        ),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: contentForbiddenResponses.write,
        404: { description: 'Course or lesson not found' },
        409: { description: 'The lesson has no live session (callUrl and lessonAt)' },
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiCourseLessonParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const result = await notifyPublicApiCourseLessonSessionService(orgId, actorId, c.req.valid('param'));

        return c.json({ success: true, data: result }, 202);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to notify session update');
      }
    }
  )
  .post(
    '/',
    describeRoute({
      description: `Create a lesson in a course; ${LESSON_WRITE_RULE}.`,
      tags: [TAG],
      responses: {
        201: jsonResponse('Lesson created', LessonResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        404: { description: 'Course not found, or a referenced asset does not exist' },
        409: { description: 'A referenced asset has no uploaded file yet' }
      }
    }),
    validator('param', ZPublicApiCourseParam),
    validator('json', ZPublicApiCreateLesson),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const lesson = await createPublicApiLessonService(orgId, actorId, c.req.valid('param'), c.req.valid('json'));

        return c.json({ success: true, data: lesson }, 201);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to create lesson');
      }
    }
  )
  .put(
    '/:lessonId',
    describeRoute({
      description: `Update a lesson; ${LESSON_WRITE_RULE}.`,
      tags: [TAG],
      responses: {
        200: jsonResponse('Lesson updated', LessonResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        404: { description: 'Course or lesson not found, or a referenced asset does not exist' },
        409: { description: 'A referenced asset has no uploaded file yet' }
      }
    }),
    validator('param', ZPublicApiLessonParam),
    validator('json', ZPublicApiUpdateLesson),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const lesson = await updatePublicApiLessonService(orgId, actorId, c.req.valid('param'), c.req.valid('json'));

        return c.json({ success: true, data: lesson }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to update lesson');
      }
    }
  );
