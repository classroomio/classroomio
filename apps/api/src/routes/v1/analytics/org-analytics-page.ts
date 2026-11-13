import {
  ZPublicApiAnalyticsCatalogResponse,
  ZPublicApiAnalyticsQueryDataResponse,
  ZPublicApiAnalyticsQueryMeta,
  ZPublicApiAnalyticsQueryRequest,
  ZPublicApiAnalyticsSnapshotQuery,
  ZPublicApiAnalyticsSnapshotResponse,
  ZPublicApiAnalyticsStudentRowResponse,
  ZPublicApiAnalyticsStudentsQuery
} from '@cio/utils/validation/public-api';
import {
  errorResponses,
  itemResponse,
  itemWithMetaAndPaginationResponse,
  jsonResponse,
  paginatedResponse
} from '@api/utils/openapi/responses';
import {
  getPublicApiAnalyticsCatalogService,
  getPublicApiAnalyticsSnapshotService,
  listPublicApiAnalyticsStudentsService,
  queryPublicApiAnalyticsService
} from '@api/services/v1/analytics';
import { toPublicApiPagination } from '@api/services/v1/shared';

import { Hono } from '@api/utils/hono';
import { handlePublicApiError } from '@api/utils/errors';
import { mcpRateLimitResponse } from '../courses/docs';
import { describeRoute, validator } from 'hono-openapi';
import { ORG_ANALYTICS_PAGE } from '@cio/utils/constants/analytics-pages';
import {
  ANALYTICS_CACHE_CONTROL,
  ANALYTICS_RATE_LIMIT_UNAVAILABLE_RESPONSE,
  ANALYTICS_SCOPE_NOT_FOUND_RESPONSE,
  ANALYTICS_SCOPE_RULE,
  ORG_ADMIN_RULE,
  ORG_ANALYTICS_TAG,
  analyticsForbiddenResponses
} from './docs';
import { analyticsQueryRateLimit, analyticsSnapshotRateLimit } from './rate-limits';

const PAGE = ORG_ANALYTICS_PAGE.label;

export const v1OrgAnalyticsPageRouter = new Hono()
  .get(
    '/',
    describeRoute({
      description: `Get the organization's ${PAGE} dashboard snapshot; ${ORG_ADMIN_RULE}. Per course or cohort: GET /courses|cohorts/{id}/analytics.`,
      tags: [ORG_ANALYTICS_TAG],
      responses: {
        200: jsonResponse(
          'Snapshot returned successfully; a widget that could not be computed has a null result and carries its errorCode',
          itemResponse(ZPublicApiAnalyticsSnapshotResponse)
        ),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: analyticsForbiddenResponses.orgAdmin,
        429: mcpRateLimitResponse,
        503: ANALYTICS_RATE_LIMIT_UNAVAILABLE_RESPONSE
      }
    }),
    analyticsSnapshotRateLimit,
    validator('query', ZPublicApiAnalyticsSnapshotQuery),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const query = c.req.valid('query');
        const snapshot = await getPublicApiAnalyticsSnapshotService(orgId, actorId, { type: 'org', id: orgId }, query);

        c.header('Cache-Control', ANALYTICS_CACHE_CONTROL);
        return c.json({ success: true, data: snapshot }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, `Failed to load the ${PAGE} dashboard snapshot`);
      }
    }
  )
  .get(
    '/students',
    describeRoute({
      description: `List the organization's students with progress, score, status and last login; ${ORG_ADMIN_RULE}.`,
      tags: [ORG_ANALYTICS_TAG],
      responses: {
        200: jsonResponse('Students returned successfully', paginatedResponse(ZPublicApiAnalyticsStudentRowResponse)),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: analyticsForbiddenResponses.orgAdmin,
        429: mcpRateLimitResponse
      }
    }),
    validator('query', ZPublicApiAnalyticsStudentsQuery),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const query = c.req.valid('query');
        const result = await listPublicApiAnalyticsStudentsService(orgId, actorId, { type: 'org', id: orgId }, query);

        c.header('Cache-Control', ANALYTICS_CACHE_CONTROL);
        return c.json({ success: true, data: result.items, pagination: result.pagination }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, `Failed to list ${PAGE} students`);
      }
    }
  )
  .get(
    '/catalog',
    describeRoute({
      description: `List the ${PAGE} sources, metrics, dimensions and filters you can query for any scope, with the widget presets; the key creator must be an org admin or tutor.`,
      tags: [ORG_ANALYTICS_TAG],
      responses: {
        200: jsonResponse('Catalog returned successfully', itemResponse(ZPublicApiAnalyticsCatalogResponse)),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: analyticsForbiddenResponses.orgTeam,
        429: mcpRateLimitResponse
      }
    }),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const catalog = await getPublicApiAnalyticsCatalogService(orgId, actorId);

        c.header('Cache-Control', ANALYTICS_CACHE_CONTROL);
        return c.json({ success: true, data: catalog }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, `Failed to load the ${PAGE} catalog`);
      }
    }
  )
  .post(
    '/query',
    describeRoute({
      description: `Run one ${PAGE} analytics query for a cohort, course or organization scope; ${ANALYTICS_SCOPE_RULE}. Call the catalog first.`,
      tags: [ORG_ANALYTICS_TAG],
      responses: {
        200: jsonResponse(
          'Query result returned with meta and pagination; meta.range reports the range actually used',
          itemWithMetaAndPaginationResponse(ZPublicApiAnalyticsQueryDataResponse, ZPublicApiAnalyticsQueryMeta)
        ),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: analyticsForbiddenResponses.scoped,
        404: ANALYTICS_SCOPE_NOT_FOUND_RESPONSE,
        429: mcpRateLimitResponse,
        503: ANALYTICS_RATE_LIMIT_UNAVAILABLE_RESPONSE
      }
    }),
    analyticsQueryRateLimit,
    validator('json', ZPublicApiAnalyticsQueryRequest),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const request = c.req.valid('json');
        const result = await queryPublicApiAnalyticsService(orgId, actorId, request);
        const meta = { generatedAt: result.generatedAt, cached: result.cached, range: result.range };
        const pagination = toPublicApiPagination(request.spec.page, request.spec.limit, result.total);

        c.header('Cache-Control', ANALYTICS_CACHE_CONTROL);
        return c.json({ success: true, data: { columns: result.columns, rows: result.rows }, meta, pagination }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, `Failed to run the ${PAGE} analytics query`);
      }
    }
  );
