import {
  ZPublicApiCreateWebhookSubscription,
  ZPublicApiDeleteWebhookSubscriptionResponse,
  ZPublicApiWebhookSubscriptionParam,
  ZPublicApiWebhookSubscriptionResponse
} from '@cio/utils/validation/public-api';
import { describeRoute, validator } from 'hono-openapi';

import {
  createWebhookSubscriptionService,
  deleteWebhookSubscriptionService
} from '@api/services/v1/webhooks/subscriptions';
import { toAutomationPrincipal } from '@api/utils/automation-principal';
import { handlePublicApiError } from '@api/utils/errors';
import { Hono } from '@api/utils/hono';
import { errorResponses, itemResponse, jsonResponse } from '@api/utils/openapi/responses';
import { mcpRateLimitResponse } from '../courses/docs';
import { CONNECTED_APP_RULE, WEBHOOK_SUBSCRIPTIONS_TAG, webhookSubscriptionForbidden } from './docs';

export const v1WebhookSubscriptionsRouter = new Hono()
  .post(
    '/',
    describeRoute({
      description: `Subscribe a URL to one event so the connected app receives it as it happens; ${CONNECTED_APP_RULE}.`,
      tags: [WEBHOOK_SUBSCRIPTIONS_TAG],
      responses: {
        200: jsonResponse(
          'The app already subscribed this URL; the existing subscription is returned',
          itemResponse(ZPublicApiWebhookSubscriptionResponse)
        ),
        201: jsonResponse('Subscription created', itemResponse(ZPublicApiWebhookSubscriptionResponse)),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: webhookSubscriptionForbidden('webhook:subscription:write'),
        404: { description: 'courseId or cohortId is not in your organization' },
        409: { description: 'targetUrl is already subscribed to a different event' },
        429: mcpRateLimitResponse
      }
    }),
    validator('json', ZPublicApiCreateWebhookSubscription),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const payload = c.req.valid('json');
        const principal = toAutomationPrincipal(c.get('automationKey'), c.get('oauthClientId'));
        const { subscription, created } = await createWebhookSubscriptionService(orgId, actorId, principal, payload);

        return c.json({ success: true, data: subscription }, created ? 201 : 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to create webhook subscription');
      }
    }
  )
  .delete(
    '/:subscriptionId',
    describeRoute({
      description: `Delete one of the connected app's webhook subscriptions so its URL stops receiving events; ${CONNECTED_APP_RULE}.`,
      tags: [WEBHOOK_SUBSCRIPTIONS_TAG],
      responses: {
        200: jsonResponse('Subscription deleted', itemResponse(ZPublicApiDeleteWebhookSubscriptionResponse)),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: webhookSubscriptionForbidden('webhook:subscription:write'),
        404: { description: 'The connected app has no subscription with this id' },
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiWebhookSubscriptionParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const params = c.req.valid('param');
        const principal = toAutomationPrincipal(c.get('automationKey'), c.get('oauthClientId'));
        const deleted = await deleteWebhookSubscriptionService(orgId, principal, params);

        return c.json({ success: true, data: deleted }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to delete webhook subscription');
      }
    }
  );
