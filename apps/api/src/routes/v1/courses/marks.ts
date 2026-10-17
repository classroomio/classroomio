import {
  ZPublicApiCourseMarksQuery,
  ZPublicApiCourseMarksRowResponse,
  ZPublicApiCourseParam
} from '@cio/utils/validation/public-api';
import { getCourseMarksService } from '@api/services/v1/courses/marks';

import { Hono } from '@api/utils/hono';
import { handlePublicApiError } from '@api/utils/errors';
import { describeRoute, validator } from 'hono-openapi';
import { errorResponses, jsonResponse, paginatedResponse } from '@api/utils/openapi/responses';
import { COURSE_MEMBER_RULE, PAGINATION_NOTE, mcpRateLimitResponse, submissionForbiddenResponses } from './docs';

export const v1CourseMarksRouter = new Hono().get(
  '/',
  describeRoute({
    description: `The course gradebook: one row per student, with their points on every exercise in course order (null when not graded yet). A student actor only gets their own row, as in the dashboard. ${PAGINATION_NOTE} ${COURSE_MEMBER_RULE}`,
    tags: ['Course Marks'],
    responses: {
      200: jsonResponse('Marks returned successfully', paginatedResponse(ZPublicApiCourseMarksRowResponse)),
      400: errorResponses.badRequest,
      401: errorResponses.unauthorized,
      403: submissionForbiddenResponses.marks,
      404: { description: 'Course not found' },
      429: mcpRateLimitResponse
    }
  }),
  validator('param', ZPublicApiCourseParam),
  validator('query', ZPublicApiCourseMarksQuery),
  async (c) => {
    try {
      const orgId = c.get('orgId')!;
      const actorId = c.get('actorId');
      const result = await getCourseMarksService(orgId, actorId, c.req.valid('param'), c.req.valid('query'));

      return c.json({ success: true, data: result.items, pagination: result.pagination }, 200);
    } catch (error) {
      return handlePublicApiError(c, error, 'Failed to fetch course marks');
    }
  }
);
