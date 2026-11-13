import {
  ZPublicApiComplianceAnalyticsMeta,
  ZPublicApiComplianceAnalyticsResponse,
  ZPublicApiComplianceStudentResponse,
  ZPublicApiPaginationQuery
} from '@cio/utils/validation/public-api';
import { errorResponses, itemWithMetaResponse, jsonResponse, paginatedResponse } from '@api/utils/openapi/responses';
import {
  getPublicApiComplianceAnalyticsService,
  listPublicApiComplianceStudentsService
} from '@api/services/v1/compliance';

import { Hono } from '@api/utils/hono';
import { handlePublicApiError } from '@api/utils/errors';
import { describeRoute, validator } from 'hono-openapi';
import {
  ANALYTICS_CACHE_CONTROL,
  COMPLIANCE_TAG,
  LIST_CACHE_NOTE,
  ORG_ADMIN_RULE,
  analyticsForbiddenResponses
} from './docs';

export const v1ComplianceRouter = new Hono()
  .get(
    '/',
    describeRoute({
      description: `Get compliance status counts, overall and per course; ${ORG_ADMIN_RULE}. List the students with GET /analytics/compliance/students.`,
      tags: [COMPLIANCE_TAG],
      responses: {
        200: jsonResponse(
          'Compliance analytics returned; cached for up to 10 minutes, and meta.generatedAt says when it was computed',
          itemWithMetaResponse(ZPublicApiComplianceAnalyticsResponse, ZPublicApiComplianceAnalyticsMeta)
        ),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: analyticsForbiddenResponses.orgAdmin
      }
    }),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const { data, meta } = await getPublicApiComplianceAnalyticsService(orgId, actorId);

        c.header('Cache-Control', ANALYTICS_CACHE_CONTROL);
        return c.json({ success: true, data, meta }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to load compliance analytics');
      }
    }
  )
  .get(
    '/students',
    describeRoute({
      description: `List each student's latest cycle status, due date and validity in every compliance course; ${ORG_ADMIN_RULE}.`,
      tags: [COMPLIANCE_TAG],
      responses: {
        200: jsonResponse(
          `Compliance students returned, ordered by course title then student name; ${LIST_CACHE_NOTE}`,
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
