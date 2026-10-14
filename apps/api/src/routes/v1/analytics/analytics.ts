import {
  ANALYTICS_CACHE_CONTROL,
  CACHE_NOTE,
  LIST_CACHE_NOTE,
  ORG_ADMIN_RULE,
  ORG_TEAM_RULE,
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
      description: `Get organization analytics, with the sections chosen by include; ${ORG_TEAM_RULE}.`,
      tags: [TAG],
      responses: {
        200: jsonResponse(
          `Analytics returned; ${CACHE_NOTE}`,
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
      description: `List each student's latest cycle status, due date and validity in every compliance course; ${ORG_ADMIN_RULE}.`,
      tags: [TAG],
      responses: {
        200: jsonResponse(
          `Compliance learners returned, ordered by course title then learner name; ${LIST_CACHE_NOTE}`,
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
