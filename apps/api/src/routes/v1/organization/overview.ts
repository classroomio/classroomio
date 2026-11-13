import {
  ZPublicApiOrganizationOverviewMeta,
  ZPublicApiOrganizationOverviewQuery,
  ZPublicApiOrganizationOverviewResponse
} from '@cio/utils/validation/public-api';
import { errorResponses, itemWithMetaResponse, jsonResponse } from '@api/utils/openapi/responses';
import { getPublicApiOrganizationOverviewService } from '@api/services/v1/organization/overview';

import { Hono } from '@api/utils/hono';
import { handlePublicApiError } from '@api/utils/errors';
import { describeRoute, validator } from 'hono-openapi';
import { ANALYTICS_CACHE_CONTROL, ORG_TEAM_RULE, analyticsForbiddenResponses } from '../analytics/docs';
import { ORGANIZATION_TAG } from './docs';

export const v1OrganizationOverviewRouter = new Hono().get(
  '/',
  describeRoute({
    description: `Get the organization overview (Dashboard page), with the sections chosen by include; ${ORG_TEAM_RULE}.`,
    tags: [ORGANIZATION_TAG],
    responses: {
      200: jsonResponse(
        'Overview returned; each section is cached for up to 10 minutes (login activity: 24 hours), and meta.generatedAt says when the oldest one was computed',
        itemWithMetaResponse(ZPublicApiOrganizationOverviewResponse, ZPublicApiOrganizationOverviewMeta)
      ),
      400: errorResponses.badRequest,
      401: errorResponses.unauthorized,
      403: analyticsForbiddenResponses.orgTeam
    }
  }),
  validator('query', ZPublicApiOrganizationOverviewQuery),
  async (c) => {
    try {
      const orgId = c.get('orgId')!;
      const actorId = c.get('actorId');
      const query = c.req.valid('query');
      const { data, meta } = await getPublicApiOrganizationOverviewService(orgId, actorId, query);

      c.header('Cache-Control', ANALYTICS_CACHE_CONTROL);
      return c.json({ success: true, data, meta }, 200);
    } catch (error) {
      return handlePublicApiError(c, error, 'Failed to load the organization overview');
    }
  }
);
