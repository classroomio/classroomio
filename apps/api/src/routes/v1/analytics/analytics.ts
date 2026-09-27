import {
  ANALYTICS_CACHE_CONTROL,
  CACHE_NOTE,
  LIST_CACHE_NOTE,
  ORG_ADMIN_RULE,
  ORG_TEAM_RULE,
  PAGINATION_NOTE,
  TAG,
  analyticsForbiddenResponses
} from './docs';
import {
  ZPublicApiComplianceLearnerResponse,
  ZPublicApiOrgAnalyticsMeta,
  ZPublicApiOrgAnalyticsQuery,
  ZPublicApiOrgAnalyticsResponse,
  ZPublicApiPaginationQuery
} from '@cio/utils/validation/public-api';
import { errorResponses, itemWithMetaResponse, jsonResponse, paginatedResponse } from '@api/utils/openapi/responses';
import {
  getPublicApiOrgAnalyticsService,
  listPublicApiComplianceLearnersService
} from '@api/services/v1/analytics/org';

import { Hono } from '@api/utils/hono';
import { handlePublicApiError } from '@api/utils/errors';
import { describeRoute, validator } from 'hono-openapi';

export const v1OrgAnalyticsRouter = new Hono()
  .get(
    '/',
    describeRoute({
      description: `Organization analytics. Pick sections with include (default: overview):
- overview: totals (courses, students, certificates), top courses by students, and recent certificates.
- traffic: landing and course page views, unique visitors, enrollments and completions, with a per-day series.
- countries: views and enrollments by visitor country.
- funnel: landing view → course page view → enrollment → completion. For one course, use GET /courses/{courseId}/analytics?include=funnel.
- courseTypes: views, enrollments and completions by course type.
- topCourses: the most viewed course pages.
- loginActivity: student logins by day of week (org admin only).
- compliance: compliance status counts, overall and per course (org admin only). List the learners with GET /analytics/compliance/learners.

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
  )
  .get(
    '/compliance/learners',
    describeRoute({
      description: `One row per student per compliance course with their latest cycle status, due date and validity, ordered by course title then learner name. ${PAGINATION_NOTE} ${LIST_CACHE_NOTE} ${ORG_ADMIN_RULE}`,
      tags: [TAG],
      responses: {
        200: jsonResponse(
          'Compliance learners returned successfully',
          paginatedResponse(ZPublicApiComplianceLearnerResponse)
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
        const result = await listPublicApiComplianceLearnersService(orgId, actorId, query);

        c.header('Cache-Control', ANALYTICS_CACHE_CONTROL);
        return c.json({ success: true, data: result.items, pagination: result.pagination }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to list compliance learners');
      }
    }
  );
