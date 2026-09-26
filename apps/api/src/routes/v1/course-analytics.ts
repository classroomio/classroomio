import {
  ZPublicApiCourseAnalyticsResponse,
  ZPublicApiCourseAnalyticsStudentResponse,
  ZPublicApiCourseParam,
  ZPublicApiPaginationQuery
} from '@cio/utils/validation/public-api';
import {
  getPublicApiCourseAnalyticsService,
  listPublicApiCourseAnalyticsStudentsService
} from '@api/services/v1/analytics';

import { Hono } from '@api/utils/hono';
import { handlePublicApiError } from '@api/utils/errors';
import { describeRoute, validator } from 'hono-openapi';
import { COURSE_TEAM_RULE, PAGINATION_NOTE, analyticsForbiddenResponses } from './analytics-route-docs';
import { errorResponses, itemResponse, jsonResponse, paginatedResponse } from '@api/utils/openapi/responses';

const TAG = 'Public API Analytics';

export const v1CourseAnalyticsRouter = new Hono()
  .get(
    '/',
    describeRoute({
      description: `Course totals (tutors, students, lessons, exercises) and per-student averages for progress, exercise completion and grade. List the students with GET /courses/{courseId}/analytics/students. ${COURSE_TEAM_RULE}`,
      tags: [TAG],
      responses: {
        200: jsonResponse('Course analytics returned successfully', itemResponse(ZPublicApiCourseAnalyticsResponse)),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: analyticsForbiddenResponses.courseTeam,
        404: { description: 'Course not found' }
      }
    }),
    validator('param', ZPublicApiCourseParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const analytics = await getPublicApiCourseAnalyticsService(orgId, actorId, params);

        return c.json({ success: true, data: analytics }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to load course analytics');
      }
    }
  )
  .get(
    '/students',
    describeRoute({
      description: `Per-student progress, exercise submissions, average grade and last seen for the course, ordered by name. ${PAGINATION_NOTE} ${COURSE_TEAM_RULE}`,
      tags: [TAG],
      responses: {
        200: jsonResponse(
          'Course students returned successfully',
          paginatedResponse(ZPublicApiCourseAnalyticsStudentResponse)
        ),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: analyticsForbiddenResponses.courseTeam,
        404: { description: 'Course not found' }
      }
    }),
    validator('param', ZPublicApiCourseParam),
    validator('query', ZPublicApiPaginationQuery),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const query = c.req.valid('query');
        const result = await listPublicApiCourseAnalyticsStudentsService(orgId, actorId, params, query);

        return c.json({ success: true, data: result.items, pagination: result.pagination }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to list course analytics students');
      }
    }
  );
