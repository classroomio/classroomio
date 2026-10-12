import {
  ANALYTICS_CACHE_CONTROL,
  CACHE_NOTE,
  COURSE_TEAM_RULE,
  LIST_CACHE_NOTE,
  TAG,
  analyticsForbiddenResponses,
  analyticsRouteDocs,
  type TAnalyticsRouterOptions
} from './docs';
import {
  ZPublicApiCourseAnalyticsMeta,
  ZPublicApiCourseAnalyticsQuery,
  ZPublicApiCourseAnalyticsResponse,
  ZPublicApiCourseAnalyticsStudentResponse,
  ZPublicApiCourseAnalyticsStudentsQuery,
  ZPublicApiCourseMemberAnalyticsQuery,
  ZPublicApiCourseMemberAnalyticsResponse,
  ZPublicApiCourseParam,
  ZPublicApiCourseStudentAnalyticsParam
} from '@cio/utils/validation/public-api';
import {
  errorResponses,
  itemResponse,
  itemWithMetaResponse,
  jsonResponse,
  paginatedResponse
} from '@api/utils/openapi/responses';
import {
  getPublicApiCourseAnalyticsService,
  getPublicApiCourseStudentAnalyticsService,
  listPublicApiCourseAnalyticsStudentsService
} from '@api/services/v1/analytics/course';

import { Hono } from '@api/utils/hono';
import { handlePublicApiError } from '@api/utils/errors';
import { describeRoute, validator } from 'hono-openapi';

const COURSE_ANALYTICS_ROUTE = 'GET /analytics/courses/{courseId}';
const COURSE_STUDENTS_ROUTE = 'GET /analytics/courses/{courseId}/students';
const COURSE_STUDENT_ROUTE = 'GET /analytics/courses/{courseId}/students/{profileId}';

function createCourseAnalyticsRouter({ isDeprecatedAlias = false }: TAnalyticsRouterOptions = {}) {
  return new Hono()
    .get(
      '/',
      describeRoute({
        ...analyticsRouteDocs(
          `Course analytics. Pick sections with include (default: summary):
- summary: totals (tutors, students, lessons, exercises) and per-student averages for progress, exercise completion and grade.
- funnel: course page view → enrollment → completion for this course over days (7, 30, 90 or 365; default 30).

List the students with ${COURSE_STUDENTS_ROUTE}. ${CACHE_NOTE} ${COURSE_TEAM_RULE}`,
          isDeprecatedAlias ? COURSE_ANALYTICS_ROUTE : undefined
        ),
        tags: [TAG],
        responses: {
          200: jsonResponse(
            'Course analytics returned successfully',
            itemWithMetaResponse(ZPublicApiCourseAnalyticsResponse, ZPublicApiCourseAnalyticsMeta)
          ),
          400: errorResponses.badRequest,
          401: errorResponses.unauthorized,
          403: analyticsForbiddenResponses.courseTeam,
          404: { description: 'Course not found' }
        }
      }),
      validator('param', ZPublicApiCourseParam),
      validator('query', ZPublicApiCourseAnalyticsQuery),
      async (c) => {
        try {
          const orgId = c.get('orgId')!;
          const actorId = c.get('actorId');
          const params = c.req.valid('param');
          const query = c.req.valid('query');
          const { data, meta } = await getPublicApiCourseAnalyticsService(orgId, actorId, params, query);

          c.header('Cache-Control', ANALYTICS_CACHE_CONTROL);
          return c.json({ success: true, data, meta }, 200);
        } catch (error) {
          return handlePublicApiError(c, error, 'Failed to load course analytics');
        }
      }
    )
    .get(
      '/students',
      describeRoute({
        ...analyticsRouteDocs(
          `Per-student progress, exercise submissions, average grade and last seen for the course, ordered by name. For one student's per-exercise results, use ${COURSE_STUDENT_ROUTE}. Paginated with page (default 1) and limit (default 20, max 50). ${LIST_CACHE_NOTE} ${COURSE_TEAM_RULE}`,
          isDeprecatedAlias ? COURSE_STUDENTS_ROUTE : undefined
        ),
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
      validator('query', ZPublicApiCourseAnalyticsStudentsQuery),
      async (c) => {
        try {
          const orgId = c.get('orgId')!;
          const actorId = c.get('actorId');
          const params = c.req.valid('param');
          const query = c.req.valid('query');
          const result = await listPublicApiCourseAnalyticsStudentsService(orgId, actorId, params, query);

          c.header('Cache-Control', ANALYTICS_CACHE_CONTROL);
          return c.json({ success: true, data: result.items, pagination: result.pagination }, 200);
        } catch (error) {
          return handlePublicApiError(c, error, 'Failed to list course analytics students');
        }
      }
    );
}

export const v1CourseAnalyticsRouter = createCourseAnalyticsRouter().get(
  '/students/:profileId',
  describeRoute({
    description: `One student's progress and grades in the course, with per-exercise results. profileId is the id the course students list returns. Only students have analytics. ${LIST_CACHE_NOTE} ${COURSE_TEAM_RULE}`,
    tags: [TAG],
    responses: {
      200: jsonResponse(
        'Course student analytics returned successfully',
        itemResponse(ZPublicApiCourseMemberAnalyticsResponse)
      ),
      400: { description: 'Invalid path or query, or the profile is not a student in the course' },
      401: errorResponses.unauthorized,
      403: analyticsForbiddenResponses.courseTeam,
      404: { description: 'Course not found, or the profile is not in the course' }
    }
  }),
  validator('param', ZPublicApiCourseStudentAnalyticsParam),
  validator('query', ZPublicApiCourseMemberAnalyticsQuery),
  async (c) => {
    try {
      const orgId = c.get('orgId')!;
      const actorId = c.get('actorId');
      const params = c.req.valid('param');
      const query = c.req.valid('query');
      const analytics = await getPublicApiCourseStudentAnalyticsService(orgId, actorId, params, query);

      c.header('Cache-Control', ANALYTICS_CACHE_CONTROL);
      return c.json({ success: true, data: analytics }, 200);
    } catch (error) {
      return handlePublicApiError(c, error, 'Failed to load course student analytics');
    }
  }
);

export const v1DeprecatedCourseAnalyticsRouter = createCourseAnalyticsRouter({ isDeprecatedAlias: true });
