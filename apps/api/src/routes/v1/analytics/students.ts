import {
  ANALYTICS_CACHE_CONTROL,
  LIST_CACHE_NOTE,
  ORG_TEAM_RULE,
  TAG,
  analyticsForbiddenResponses,
  analyticsRouteDocs,
  type TAnalyticsRouterOptions
} from './docs';
import { ZPublicApiStudentAnalyticsParam, ZPublicApiStudentAnalyticsResponse } from '@cio/utils/validation/public-api';
import { errorResponses, itemResponse, jsonResponse } from '@api/utils/openapi/responses';

import { Hono } from '@api/utils/hono';
import { getPublicApiStudentAnalyticsService } from '@api/services/v1/analytics/student';
import { handlePublicApiError } from '@api/utils/errors';
import { describeRoute, validator } from 'hono-openapi';

export function createStudentAnalyticsRouter({ isDeprecatedAlias = false }: TAnalyticsRouterOptions = {}) {
  return new Hono().get(
    '/:profileId',
    describeRoute({
      ...analyticsRouteDocs(
        `A student's progress and grades across every course they're enrolled in within this organization, with per-exercise results. profileId is the id the compliance and course student lists return. ${LIST_CACHE_NOTE} ${ORG_TEAM_RULE}`,
        isDeprecatedAlias ? 'GET /analytics/students/{profileId}' : undefined
      ),
      tags: [TAG],
      responses: {
        200: jsonResponse('Student analytics returned successfully', itemResponse(ZPublicApiStudentAnalyticsResponse)),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: analyticsForbiddenResponses.orgTeam,
        404: { description: 'Profile not found in this organization' }
      }
    }),
    validator('param', ZPublicApiStudentAnalyticsParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const analytics = await getPublicApiStudentAnalyticsService(orgId, actorId, params);

        c.header('Cache-Control', ANALYTICS_CACHE_CONTROL);
        return c.json({ success: true, data: analytics }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to load student analytics');
      }
    }
  );
}
