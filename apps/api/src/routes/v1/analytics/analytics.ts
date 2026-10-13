import {
  ANALYTICS_CACHE_CONTROL,
  CACHE_NOTE,
  LIST_CACHE_NOTE,
  ORG_ADMIN_RULE,
  ORG_TEAM_RULE,
  PAGINATION_NOTE,
  TAG,
  analyticsForbiddenResponses,
  analyticsRouteDocs,
  type TAnalyticsRouterOptions
} from './docs';
import {
  ZPublicApiComplianceStudentResponse,
  ZPublicApiOrgAnalyticsMeta,
  ZPublicApiOrgAnalyticsQuery,
  ZPublicApiOrgAnalyticsResponse,
  ZPublicApiPaginationQuery
} from '@cio/utils/validation/public-api';
import { errorResponses, itemWithMetaResponse, jsonResponse, paginatedResponse } from '@api/utils/openapi/responses';
import {
  getPublicApiOrgAnalyticsService,
  listPublicApiComplianceStudentsService
} from '@api/services/v1/analytics/org';

import { Hono } from '@api/utils/hono';
import { handlePublicApiError } from '@api/utils/errors';
import { describeRoute, validator } from 'hono-openapi';

export const v1OrgAnalyticsRouter = new Hono().get(
  '/',
  describeRoute({
    description: `Organization analytics. Pick sections with include (default: overview):
- overview: totals (courses, students, certificates), top courses by students, and recent certificates.
- traffic: landing and course page views, unique visitors, enrollments and completions, with a per-day series.
- countries: views and enrollments by visitor country.
- funnel: landing view → course page view → enrollment → completion. For one course, use GET /analytics/courses/{courseId}?include=funnel.
- courseTypes: views, enrollments and completions by course type.
- topCourses: the most viewed course pages.
- loginActivity: student logins by day of week (org admin only).
- compliance: compliance status counts, overall and per course (org admin only). List the students with GET /analytics/compliance/students.

days (7, 30, 90 or 365; default 30) applies to every time-windowed section. limit (1-20, default 5) caps list sections. Sections the key creator may not see are left out and listed in meta.omitted. ${CACHE_NOTE} ${ORG_TEAM_RULE}`,
    tags: [TAG],
    responses: {
      200: jsonResponse(
        'Analytics returned successfully',
        itemWithMetaResponse(ZPublicApiOrgAnalyticsResponse, ZPublicApiOrgAnalyticsMeta)
      ),
      400: errorResponses.badRequest,
      401: errorResponses.unauthorized,
      403: analyticsForbiddenResponses.orgTeam
    }
  }),
  validator('query', ZPublicApiOrgAnalyticsQuery),
  async (c) => {
    try {
      const orgId = c.get('orgId')!;
      const actorId = c.get('actorId');
      const query = c.req.valid('query');
      const { data, meta } = await getPublicApiOrgAnalyticsService(orgId, actorId, query);

      c.header('Cache-Control', ANALYTICS_CACHE_CONTROL);
      return c.json({ success: true, data, meta }, 200);
    } catch (error) {
      return handlePublicApiError(c, error, 'Failed to load analytics');
    }
  }
);

export function createComplianceStudentsRouter({ isDeprecatedAlias = false }: TAnalyticsRouterOptions = {}) {
  return new Hono().get(
    '/',
    describeRoute({
      ...analyticsRouteDocs(
        `One row per student per compliance course with their latest cycle status, due date and validity, ordered by course title then student name. ${PAGINATION_NOTE} ${LIST_CACHE_NOTE} ${ORG_ADMIN_RULE}`,
        isDeprecatedAlias ? 'GET /analytics/compliance/students' : undefined
      ),
      tags: [TAG],
      responses: {
        200: jsonResponse(
          'Compliance students returned successfully',
          paginatedResponse(ZPublicApiComplianceStudentResponse)
        ),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: analyticsForbiddenResponses.orgAdmin
      }
    }),
    validator('query', ZPublicApiPaginationQuery),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const query = c.req.valid('query');
        const result = await listPublicApiComplianceStudentsService(orgId, actorId, query);

        c.header('Cache-Control', ANALYTICS_CACHE_CONTROL);
        return c.json({ success: true, data: result.items, pagination: result.pagination }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to list compliance students');
      }
    }
  );
}
