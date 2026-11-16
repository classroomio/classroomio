import {
  ZPublicApiCourseMarketingMeta,
  ZPublicApiCourseMarketingQuery,
  ZPublicApiCourseParam,
  ZPublicApiMarketingFunnelResponse,
  ZPublicApiMarketingMeta,
  ZPublicApiMarketingQuery,
  ZPublicApiMarketingResponse
} from '@cio/utils/validation/public-api';
import { errorResponses, itemWithMetaResponse, jsonResponse } from '@api/utils/openapi/responses';
import { getPublicApiCourseMarketingService, getPublicApiMarketingAnalyticsService } from '@api/services/v1/marketing';

import { Hono } from '@api/utils/hono';
import { handlePublicApiError } from '@api/utils/errors';
import { describeRoute, validator } from 'hono-openapi';
import {
  ANALYTICS_CACHE_CONTROL,
  COURSE_TEAM_RULE,
  MARKETING_TAG,
  ORG_TEAM_RULE,
  analyticsForbiddenResponses
} from './docs';

export const v1MarketingRouter = new Hono()
  .get(
    '/',
    describeRoute({
      description: `Get marketing analytics, with the sections chosen by include; ${ORG_TEAM_RULE}.`,
      tags: [MARKETING_TAG],
      responses: {
        200: jsonResponse(
          'Marketing analytics returned; each section is cached for up to 10 minutes, and meta.generatedAt says when the oldest one was computed',
          itemWithMetaResponse(ZPublicApiMarketingResponse, ZPublicApiMarketingMeta)
        ),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: analyticsForbiddenResponses.orgTeam
      }
    }),
    validator('query', ZPublicApiMarketingQuery),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const query = c.req.valid('query');
        const { data, meta } = await getPublicApiMarketingAnalyticsService(orgId, actorId, query);

        c.header('Cache-Control', ANALYTICS_CACHE_CONTROL);
        return c.json({ success: true, data, meta }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to load marketing analytics');
      }
    }
  )
  .get(
    '/courses/:courseId',
    describeRoute({
      description: `Get one course's funnel: course page view → enrollment → completion over days; ${COURSE_TEAM_RULE}.`,
      tags: [MARKETING_TAG],
      responses: {
        200: jsonResponse(
          'Course funnel returned; cached for up to 10 minutes, and meta.generatedAt says when it was computed',
          itemWithMetaResponse(ZPublicApiMarketingFunnelResponse, ZPublicApiCourseMarketingMeta)
        ),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: analyticsForbiddenResponses.courseTeam,
        404: { description: 'Course not found' }
      }
    }),
    validator('param', ZPublicApiCourseParam),
    validator('query', ZPublicApiCourseMarketingQuery),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const query = c.req.valid('query');
        const { data, meta } = await getPublicApiCourseMarketingService(orgId, actorId, params, query);

        c.header('Cache-Control', ANALYTICS_CACHE_CONTROL);
        return c.json({ success: true, data, meta }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to load course marketing analytics');
      }
    }
  );
