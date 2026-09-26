import * as z from 'zod';
import {
  ZPublicApiAnalyticsCountryResponse,
  ZPublicApiAnalyticsCourseTypeResponse,
  ZPublicApiAnalyticsFunnelQuery,
  ZPublicApiAnalyticsFunnelResponse,
  ZPublicApiAnalyticsOverviewResponse,
  ZPublicApiAnalyticsRangeQuery,
  ZPublicApiAnalyticsTopCourseResponse,
  ZPublicApiAnalyticsTrafficResponse,
  ZPublicApiComplianceLearnerResponse,
  ZPublicApiComplianceOverviewResponse,
  ZPublicApiLearnerAnalyticsParam,
  ZPublicApiLearnerAnalyticsResponse,
  ZPublicApiLoginActivityQuery,
  ZPublicApiLoginActivityResponse,
  ZPublicApiPaginationQuery
} from '@cio/utils/validation/public-api';
import {
  getPublicApiAnalyticsCountriesService,
  getPublicApiAnalyticsCourseTypesService,
  getPublicApiAnalyticsFunnelService,
  getPublicApiAnalyticsOverviewService,
  getPublicApiAnalyticsTopCoursesService,
  getPublicApiAnalyticsTrafficService,
  getPublicApiComplianceOverviewService,
  getPublicApiLearnerAnalyticsService,
  getPublicApiLoginActivityService,
  listPublicApiComplianceLearnersService
} from '@api/services/v1/analytics';

import { Hono } from '@api/utils/hono';
import { handlePublicApiError } from '@api/utils/errors';
import { describeRoute, validator } from 'hono-openapi';
import {
  CACHE_NOTE,
  ORG_ADMIN_RULE,
  ORG_TEAM_RULE,
  PAGINATION_NOTE,
  RANGE_NOTE,
  analyticsForbiddenResponses
} from './analytics-route-docs';
import { errorResponses, itemResponse, jsonResponse, paginatedResponse } from '@api/utils/openapi/responses';

const TAG = 'Public API Analytics';

export const v1AnalyticsRouter = new Hono()
  .get(
    '/overview',
    describeRoute({
      description: `Organization totals (courses, students, certificates issued), the top 5 courses by students with completion and certification rates, and the 5 most recent certificates. ${CACHE_NOTE} ${ORG_TEAM_RULE}`,
      tags: [TAG],
      responses: {
        200: jsonResponse('Overview returned successfully', itemResponse(ZPublicApiAnalyticsOverviewResponse)),
        401: errorResponses.unauthorized,
        403: analyticsForbiddenResponses.orgTeam
      }
    }),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const overview = await getPublicApiAnalyticsOverviewService(orgId, actorId);

        return c.json({ success: true, data: overview }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to load analytics overview');
      }
    }
  )
  .get(
    '/traffic',
    describeRoute({
      description: `Landing and course page views, unique visitors, enrollments and completions for the window, with a per-day series. Counts come from the daily rollup, so today may be incomplete. ${RANGE_NOTE} ${CACHE_NOTE} ${ORG_TEAM_RULE}`,
      tags: [TAG],
      responses: {
        200: jsonResponse('Traffic returned successfully', itemResponse(ZPublicApiAnalyticsTrafficResponse)),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: analyticsForbiddenResponses.orgTeam
      }
    }),
    validator('query', ZPublicApiAnalyticsRangeQuery),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const query = c.req.valid('query');
        const traffic = await getPublicApiAnalyticsTrafficService(orgId, actorId, query);

        return c.json({ success: true, data: traffic }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to load traffic analytics');
      }
    }
  )
  .get(
    '/countries',
    describeRoute({
      description: `Views and enrollments by visitor country for the window, top 20 countries by views. ${RANGE_NOTE} ${CACHE_NOTE} ${ORG_TEAM_RULE}`,
      tags: [TAG],
      responses: {
        200: jsonResponse('Countries returned successfully', itemResponse(z.array(ZPublicApiAnalyticsCountryResponse))),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: analyticsForbiddenResponses.orgTeam
      }
    }),
    validator('query', ZPublicApiAnalyticsRangeQuery),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const query = c.req.valid('query');
        const countries = await getPublicApiAnalyticsCountriesService(orgId, actorId, query);

        return c.json({ success: true, data: countries }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to load country analytics');
      }
    }
  )
  .get(
    '/funnel',
    describeRoute({
      description: `Conversion funnel for the window: landing view → course page view → enrollment → completion. Pass courseId for a single course; the landing_view step is then left out. ${RANGE_NOTE} ${CACHE_NOTE} ${ORG_TEAM_RULE}`,
      tags: [TAG],
      responses: {
        200: jsonResponse('Funnel returned successfully', itemResponse(ZPublicApiAnalyticsFunnelResponse)),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: analyticsForbiddenResponses.orgTeam,
        404: { description: 'Course not found' }
      }
    }),
    validator('query', ZPublicApiAnalyticsFunnelQuery),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const query = c.req.valid('query');
        const funnel = await getPublicApiAnalyticsFunnelService(orgId, actorId, query);

        return c.json({ success: true, data: funnel }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to load funnel analytics');
      }
    }
  )
  .get(
    '/course-types',
    describeRoute({
      description: `Views, enrollments and completions grouped by course type for the window. ${RANGE_NOTE} ${CACHE_NOTE} ${ORG_TEAM_RULE}`,
      tags: [TAG],
      responses: {
        200: jsonResponse(
          'Course types returned successfully',
          itemResponse(z.array(ZPublicApiAnalyticsCourseTypeResponse))
        ),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: analyticsForbiddenResponses.orgTeam
      }
    }),
    validator('query', ZPublicApiAnalyticsRangeQuery),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const query = c.req.valid('query');
        const courseTypes = await getPublicApiAnalyticsCourseTypesService(orgId, actorId, query);

        return c.json({ success: true, data: courseTypes }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to load course type analytics');
      }
    }
  )
  .get(
    '/top-courses',
    describeRoute({
      description: `The 10 most viewed course pages for the window. ${RANGE_NOTE} ${CACHE_NOTE} ${ORG_TEAM_RULE}`,
      tags: [TAG],
      responses: {
        200: jsonResponse(
          'Top courses returned successfully',
          itemResponse(z.array(ZPublicApiAnalyticsTopCourseResponse))
        ),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: analyticsForbiddenResponses.orgTeam
      }
    }),
    validator('query', ZPublicApiAnalyticsRangeQuery),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const query = c.req.valid('query');
        const topCourses = await getPublicApiAnalyticsTopCoursesService(orgId, actorId, query);

        return c.json({ success: true, data: topCourses }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to load top courses');
      }
    }
  )
  .get(
    '/login-activity',
    describeRoute({
      description: `Student logins grouped by day of week (Sun-Sat, always 7 entries) over the last days (1-365, default 90). Results may be cached for up to 24 hours. ${ORG_ADMIN_RULE}`,
      tags: [TAG],
      responses: {
        200: jsonResponse(
          'Login activity returned successfully',
          itemResponse(z.array(ZPublicApiLoginActivityResponse))
        ),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: analyticsForbiddenResponses.orgAdmin
      }
    }),
    validator('query', ZPublicApiLoginActivityQuery),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const query = c.req.valid('query');
        const activity = await getPublicApiLoginActivityService(orgId, actorId, query);

        return c.json({ success: true, data: activity }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to load login activity');
      }
    }
  )
  .get(
    '/compliance',
    describeRoute({
      description: `Compliance status counts across the organization's compliance courses, overall and per course, based on each learner's latest cycle. List the learners with GET /analytics/compliance/learners. ${ORG_ADMIN_RULE}`,
      tags: [TAG],
      responses: {
        200: jsonResponse(
          'Compliance overview returned successfully',
          itemResponse(ZPublicApiComplianceOverviewResponse)
        ),
        401: errorResponses.unauthorized,
        403: analyticsForbiddenResponses.orgAdmin
      }
    }),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const overview = await getPublicApiComplianceOverviewService(orgId, actorId);

        return c.json({ success: true, data: overview }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to load compliance overview');
      }
    }
  )
  .get(
    '/compliance/learners',
    describeRoute({
      description: `One row per student per compliance course with their latest cycle status, due date and validity, ordered by course title then learner name. ${PAGINATION_NOTE} ${ORG_ADMIN_RULE}`,
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

        return c.json({ success: true, data: result.items, pagination: result.pagination }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to list compliance learners');
      }
    }
  )
  .get(
    '/learners/:profileId',
    describeRoute({
      description: `A learner's progress and grades across every course they're enrolled in within this organization, with per-exercise results. ${ORG_TEAM_RULE}`,
      tags: [TAG],
      responses: {
        200: jsonResponse('Learner analytics returned successfully', itemResponse(ZPublicApiLearnerAnalyticsResponse)),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: analyticsForbiddenResponses.orgTeam,
        404: { description: 'Profile not found in this organization' }
      }
    }),
    validator('param', ZPublicApiLearnerAnalyticsParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const analytics = await getPublicApiLearnerAnalyticsService(orgId, actorId, params);

        return c.json({ success: true, data: analytics }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to load learner analytics');
      }
    }
  );
