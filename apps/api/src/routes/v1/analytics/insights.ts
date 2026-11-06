import {
  ZPublicApiInsightsDashboardParam,
  ZPublicApiInsightsQueryRequest,
  ZPublicApiInsightsSnapshotQuery,
  ZPublicApiInsightsStudentsQuery
} from '@cio/utils/validation/public-api';
import {
  ZPublicApiInsightsCatalogResponse,
  ZPublicApiInsightsQueryDataResponse,
  ZPublicApiInsightsQueryMeta,
  ZPublicApiInsightsSnapshotResponse,
  ZPublicApiInsightsStudentRowResponse
} from '@cio/utils/validation/public-api';
import {
  errorResponses,
  itemResponse,
  itemWithMetaAndPaginationResponse,
  jsonResponse,
  paginatedResponse
} from '@api/utils/openapi/responses';
import {
  getPublicApiInsightsCatalogService,
  getPublicApiInsightsSnapshotService,
  listPublicApiInsightsStudentsService,
  queryPublicApiInsightsService
} from '@api/services/v1/analytics/insights';
import { toPublicApiPagination } from '@api/services/v1/shared';
import { createRateLimiter } from '@api/middlewares/rate-limiter';

import { Hono } from '@api/utils/hono';
import { handlePublicApiError } from '@api/utils/errors';
import { mcpRateLimitResponse } from '../courses/docs';
import { describeRoute, validator } from 'hono-openapi';
import {
  ANALYTICS_CACHE_CONTROL,
  INSIGHTS_SCOPE_NOT_FOUND_RESPONSE,
  INSIGHTS_RATE_LIMIT_UNAVAILABLE_RESPONSE,
  INSIGHTS_SCOPE_RULE,
  INSIGHTS_TAG,
  insightsForbiddenResponses
} from './docs';

const QUERY_READ_NOTE =
  'This stays a read: it has no side effects, is cached per scope and spec, is mapped to analytics:read, and is metered as a read.';

const insightsQueryRateLimit = createRateLimiter({
  windowMs: 60_000,
  maxRequests: 60,
  message: 'Too many insights queries. Please try again shortly.',
  failClosed: true,
  keyGenerator: (c) => `insights_query:${c.get('automationKey')?.id ?? 'missing-key'}`
});

const insightsSnapshotRateLimit = createRateLimiter({
  windowMs: 60_000,
  maxRequests: 20,
  message: 'Too many insights snapshots. Please try again shortly.',
  failClosed: true,
  keyGenerator: (c) => `insights_snapshot:${c.get('automationKey')?.id ?? 'missing-key'}`
});

export const v1AnalyticsInsightsRouter = new Hono()
  .get(
    '/catalog',
    describeRoute({
      description: `List the insights sources, metrics, dimensions and filters you can query, with the widget presets; the key creator must be an org admin or tutor.`,
      tags: [INSIGHTS_TAG],
      responses: {
        200: jsonResponse('Catalog returned successfully', itemResponse(ZPublicApiInsightsCatalogResponse)),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: insightsForbiddenResponses.catalog,
        429: mcpRateLimitResponse
      }
    }),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const catalog = await getPublicApiInsightsCatalogService(orgId, actorId);

        c.header('Cache-Control', ANALYTICS_CACHE_CONTROL);
        return c.json({ success: true, data: catalog }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to load insights catalog');
      }
    }
  )
  .post(
    '/query',
    describeRoute({
      description: `Run one insights query for a cohort, course or organization scope; ${INSIGHTS_SCOPE_RULE}. Call the catalog first to choose a source, metrics and filters. ${QUERY_READ_NOTE}`,
      tags: [INSIGHTS_TAG],
      responses: {
        200: jsonResponse(
          'Query result returned; meta.range reports the range actually used (the Free plan sees at most the last 7 days), and pagination carries the page, limit, total and totalPages',
          itemWithMetaAndPaginationResponse(ZPublicApiInsightsQueryDataResponse, ZPublicApiInsightsQueryMeta)
        ),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: insightsForbiddenResponses.insights,
        404: INSIGHTS_SCOPE_NOT_FOUND_RESPONSE,
        429: mcpRateLimitResponse,
        503: INSIGHTS_RATE_LIMIT_UNAVAILABLE_RESPONSE
      }
    }),
    insightsQueryRateLimit,
    validator('json', ZPublicApiInsightsQueryRequest),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const request = c.req.valid('json');
        const result = await queryPublicApiInsightsService(orgId, actorId, request);
        const meta = { generatedAt: result.generatedAt, cached: result.cached, range: result.range };
        const pagination = toPublicApiPagination(request.spec.page, request.spec.limit, result.total);

        c.header('Cache-Control', ANALYTICS_CACHE_CONTROL);
        return c.json({ success: true, data: { columns: result.columns, rows: result.rows }, meta, pagination }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to run the insights query');
      }
    }
  )
  .get(
    '/dashboards/:scopeType/:scopeId',
    describeRoute({
      description: `Get one insights dashboard snapshot, with the first page of every visible widget and the default or requested course, exercise, breakdown and range; ${INSIGHTS_SCOPE_RULE}. The students table is served by its own endpoint instead of inside the snapshot.`,
      tags: [INSIGHTS_TAG],
      responses: {
        200: jsonResponse(
          'Snapshot returned successfully; a widget that could not be computed carries only its errorCode',
          itemResponse(ZPublicApiInsightsSnapshotResponse)
        ),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: insightsForbiddenResponses.insights,
        404: INSIGHTS_SCOPE_NOT_FOUND_RESPONSE,
        429: mcpRateLimitResponse,
        503: INSIGHTS_RATE_LIMIT_UNAVAILABLE_RESPONSE
      }
    }),
    insightsSnapshotRateLimit,
    validator('param', ZPublicApiInsightsDashboardParam),
    validator('query', ZPublicApiInsightsSnapshotQuery),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const query = c.req.valid('query');
        const snapshot = await getPublicApiInsightsSnapshotService(orgId, actorId, params, query);

        c.header('Cache-Control', ANALYTICS_CACHE_CONTROL);
        return c.json({ success: true, data: snapshot }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to load the insights dashboard snapshot');
      }
    }
  )
  .get(
    '/students',
    describeRoute({
      description: `List the students of a scope with progress, score, activity, certificates, status and overdue state, from the same table the dashboards show; ${INSIGHTS_SCOPE_RULE}.`,
      tags: [INSIGHTS_TAG],
      responses: {
        200: jsonResponse('Students returned successfully', paginatedResponse(ZPublicApiInsightsStudentRowResponse)),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: insightsForbiddenResponses.insights,
        404: INSIGHTS_SCOPE_NOT_FOUND_RESPONSE,
        429: mcpRateLimitResponse
      }
    }),
    validator('query', ZPublicApiInsightsStudentsQuery),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const query = c.req.valid('query');
        const result = await listPublicApiInsightsStudentsService(orgId, actorId, query);

        c.header('Cache-Control', ANALYTICS_CACHE_CONTROL);
        return c.json({ success: true, data: result.items, pagination: result.pagination }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to list insights students');
      }
    }
  );
