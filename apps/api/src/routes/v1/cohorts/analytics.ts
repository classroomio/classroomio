import {
  ZPublicApiAnalyticsSnapshotResponse,
  ZPublicApiAnalyticsStudentRowResponse,
  ZPublicApiAnalyticsSnapshotQuery,
  ZPublicApiAnalyticsStudentsQuery,
  ZPublicApiCohortParam
} from '@cio/utils/validation/public-api';
import { errorResponses, itemResponse, jsonResponse, paginatedResponse } from '@api/utils/openapi/responses';
import {
  getPublicApiAnalyticsSnapshotService,
  listPublicApiAnalyticsStudentsService
} from '@api/services/v1/analytics';
import {
  ANALYTICS_CACHE_CONTROL,
  ANALYTICS_RATE_LIMIT_UNAVAILABLE_RESPONSE,
  ANALYTICS_SCOPE_NOT_FOUND_RESPONSE,
  COHORT_TEAM_RULE,
  ORG_ANALYTICS_TAG,
  analyticsForbiddenResponses
} from '../analytics/docs';
import { analyticsSnapshotRateLimit } from '../analytics/rate-limits';

import { Hono } from '@api/utils/hono';
import { handlePublicApiError } from '@api/utils/errors';
import { mcpRateLimitResponse } from '../courses/docs';
import { describeRoute, validator } from 'hono-openapi';

export const v1CohortAnalyticsRouter = new Hono()
  .get(
    '/',
    describeRoute({
      description: `Get a cohort's analytics dashboard snapshot; ${COHORT_TEAM_RULE}. Widgets carry first pages; students have their own endpoint.`,
      tags: [ORG_ANALYTICS_TAG],
      responses: {
        200: jsonResponse(
          'Snapshot returned successfully; a widget that could not be computed carries only its errorCode',
          itemResponse(ZPublicApiAnalyticsSnapshotResponse)
        ),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: analyticsForbiddenResponses.cohortTeam,
        404: ANALYTICS_SCOPE_NOT_FOUND_RESPONSE,
        429: mcpRateLimitResponse,
        503: ANALYTICS_RATE_LIMIT_UNAVAILABLE_RESPONSE
      }
    }),
    analyticsSnapshotRateLimit,
    validator('param', ZPublicApiCohortParam),
    validator('query', ZPublicApiAnalyticsSnapshotQuery),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const query = c.req.valid('query');
        const scope = { type: 'cohort' as const, id: params.cohortId };
        const snapshot = await getPublicApiAnalyticsSnapshotService(orgId, actorId, scope, query);

        c.header('Cache-Control', ANALYTICS_CACHE_CONTROL);
        return c.json({ success: true, data: snapshot }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to load cohort analytics');
      }
    }
  )
  .get(
    '/students',
    describeRoute({
      description: `List a cohort's students with progress, score, status, overdue state and last login; ${COHORT_TEAM_RULE}.`,
      tags: [ORG_ANALYTICS_TAG],
      responses: {
        200: jsonResponse('Students returned successfully', paginatedResponse(ZPublicApiAnalyticsStudentRowResponse)),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: analyticsForbiddenResponses.cohortTeam,
        404: ANALYTICS_SCOPE_NOT_FOUND_RESPONSE,
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiCohortParam),
    validator('query', ZPublicApiAnalyticsStudentsQuery),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const query = c.req.valid('query');
        const scope = { type: 'cohort' as const, id: params.cohortId };
        const result = await listPublicApiAnalyticsStudentsService(orgId, actorId, scope, query);

        c.header('Cache-Control', ANALYTICS_CACHE_CONTROL);
        return c.json({ success: true, data: result.items, pagination: result.pagination }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to list cohort analytics students');
      }
    }
  );
