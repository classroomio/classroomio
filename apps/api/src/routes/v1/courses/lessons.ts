import {
  ZPublicApiCourseLessonDetailResponse,
  ZPublicApiCourseLessonNotifyResponse,
  ZPublicApiCourseLessonParam,
  ZPublicApiCourseLessonResponse,
  ZPublicApiCourseLessonsQuery,
  ZPublicApiCourseParam
} from '@cio/utils/validation/public-api';
import {
  deletePublicApiCourseLessonService,
  getPublicApiCourseLessonService,
  listPublicApiCourseLessonsService,
  notifyPublicApiCourseLessonSessionService
} from '@api/services/v1/courses/lessons';

import { Hono } from '@api/utils/hono';
import { handlePublicApiError } from '@api/utils/errors';
import { describeRoute, validator } from 'hono-openapi';
import { errorResponses, itemResponse, jsonResponse, paginatedResponse } from '@api/utils/openapi/responses';
import { COURSE_TEAM_RULE, PAGINATION_NOTE, contentForbiddenResponses, mcpRateLimitResponse } from './docs';

const TAG = 'Public API Course Lessons';

export const v1CourseLessonsRouter = new Hono()
  .get(
    '/',
    describeRoute({
      description: `List a course's lessons in order, without their content. Filter by sectionId. ${PAGINATION_NOTE} ${COURSE_TEAM_RULE}`,
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
      description: `Get a lesson with its note, slides, videos, documents and every translation. Uploaded videos and documents come back as short-lived signed links. ${COURSE_TEAM_RULE}`,
      tags: [TAG],
      responses: {
        200: jsonResponse('Lesson returned successfully', itemResponse(ZPublicApiCourseLessonDetailResponse)),
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
      description: `Permanently delete a lesson with its translations, history, comments and learners' completion. To delete several lessons or exercises at once, use POST /courses/{courseId}/content/delete. ${COURSE_TEAM_RULE}`,
      tags: [TAG],
      responses: {
        200: jsonResponse('Lesson deleted successfully', itemResponse(ZPublicApiCourseLessonResponse)),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: contentForbiddenResponses.write,
        404: { description: 'Course or lesson not found' },
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiCourseLessonParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const lesson = await deletePublicApiCourseLessonService(orgId, actorId, c.req.valid('param'));

        return c.json({ success: true, data: lesson }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to delete course lesson');
      }
    }
  )
  .post(
    '/:lessonId/notify-session-update',
    describeRoute({
      description: `Email every student in the course an updated calendar invite for this live lesson, after its time or call link changed. Runs in the background and returns the job id. The lesson needs a callUrl and lessonAt, or this fails with 409. ${COURSE_TEAM_RULE}`,
      tags: [TAG],
      responses: {
        202: jsonResponse('Notification queued', itemResponse(ZPublicApiCourseLessonNotifyResponse)),
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
  );
