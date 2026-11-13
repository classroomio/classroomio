import * as z from 'zod';
import { ZPublicApiWebhookSampleResponse, ZPublicApiWebhookSamplesQuery } from '@cio/utils/validation/public-api';
import { describeRoute, validator } from 'hono-openapi';

import { listWebhookSamplesService } from '@api/services/v1/webhooks/samples';
import { handlePublicApiError } from '@api/utils/errors';
import { Hono } from '@api/utils/hono';
import { errorResponses, itemResponse, jsonResponse } from '@api/utils/openapi/responses';
import { ORG_ADMIN_RULE } from '../team/docs';
import { mcpRateLimitResponse } from '../courses/docs';
import { WEBHOOK_SUBSCRIPTIONS_TAG } from './docs';

export const v1WebhookSamplesRouter = new Hono().get(
  '/',
  describeRoute({
    description: `List up to three recent events of one type, or a documented example when there are none yet, shaped exactly like deliveries; ${ORG_ADMIN_RULE}.`,
    tags: [WEBHOOK_SUBSCRIPTIONS_TAG],
    responses: {
      200: jsonResponse('Sample events, newest first', itemResponse(z.array(ZPublicApiWebhookSampleResponse))),
      400: errorResponses.badRequest,
      401: errorResponses.unauthorized,
      403: {
        description:
          'Missing the webhook:subscription:read scope, the key creator is not an org admin, or the plan does not allow webhooks'
      },
      429: mcpRateLimitResponse
    }
  }),
  validator('query', ZPublicApiWebhookSamplesQuery),
  async (c) => {
    try {
      const orgId = c.get('orgId')!;
      const actorId = c.get('actorId');
      const query = c.req.valid('query');
      const samples = await listWebhookSamplesService(orgId, actorId, query);

      return c.json({ success: true, data: samples }, 200);
    } catch (error) {
      return handlePublicApiError(c, error, 'Failed to list webhook samples');
    }
  }
);
