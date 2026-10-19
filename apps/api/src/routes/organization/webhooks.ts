import {
  ZCreateWebhook,
  ZRedeliverWebhookDeliveryParams,
  ZUpdateWebhook,
  ZWebhookDeliveryListQuery,
  ZWebhookParams
} from '@cio/utils/validation/webhook';
import {
  createWebhookService,
  deleteWebhookService,
  getWebhookDeliveryService,
  getWebhookService,
  listWebhookDeliveriesService,
  listWebhooksService,
  redeliverWebhookService,
  regenerateWebhookSecretService,
  sendTestWebhookService,
  updateWebhookService
} from '@api/services/webhook/webhook';

import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { createRateLimiter } from '@api/middlewares/rate-limiter';
import { handleError } from '@api/utils/errors';
import { orgAdminMiddleware } from '@api/middlewares/org-admin';
import { zValidator } from '@hono/zod-validator';

const webhookMutationRateLimit = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 30,
  message: 'Too many webhook changes. Please try again shortly.',
  keyGenerator: (c) => `webhook_mutation:${c.req.header('cio-org-id') ?? 'unknown'}`
});

const webhookTestRateLimit = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 10,
  message: 'Too many test events. Please try again shortly.',
  keyGenerator: (c) => `webhook_test:${c.req.header('cio-org-id') ?? 'unknown'}`
});

export const webhooksRouter = new Hono()
  .get('/', authMiddleware, orgAdminMiddleware, async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const data = await listWebhooksService(orgId);

      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to list webhooks');
    }
  })
  .post(
    '/',
    authMiddleware,
    orgAdminMiddleware,
    webhookMutationRateLimit,
    zValidator('json', ZCreateWebhook),
    async (c) => {
      try {
        const orgId = c.req.header('cio-org-id')!;
        const user = c.get('user')!;
        const payload = c.req.valid('json');
        const data = await createWebhookService(orgId, user.id, payload);

        return c.json({ success: true, data }, 201);
      } catch (error) {
        return handleError(c, error, 'Failed to create webhook');
      }
    }
  )
  .get('/:webhookId', authMiddleware, orgAdminMiddleware, zValidator('param', ZWebhookParams), async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const { webhookId } = c.req.valid('param');
      const data = await getWebhookService(orgId, webhookId);

      return c.json({ success: true, data }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to load webhook');
    }
  })
  .put(
    '/:webhookId',
    authMiddleware,
    orgAdminMiddleware,
    webhookMutationRateLimit,
    zValidator('param', ZWebhookParams),
    zValidator('json', ZUpdateWebhook),
    async (c) => {
      try {
        const orgId = c.req.header('cio-org-id')!;
        const user = c.get('user')!;
        const { webhookId } = c.req.valid('param');
        const payload = c.req.valid('json');
        const data = await updateWebhookService(orgId, webhookId, user.id, payload);

        return c.json({ success: true, data }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to update webhook');
      }
    }
  )
  .delete(
    '/:webhookId',
    authMiddleware,
    orgAdminMiddleware,
    webhookMutationRateLimit,
    zValidator('param', ZWebhookParams),
    async (c) => {
      try {
        const orgId = c.req.header('cio-org-id')!;
        const { webhookId } = c.req.valid('param');
        await deleteWebhookService(orgId, webhookId);

        return c.json({ success: true, data: { id: webhookId } }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to delete webhook');
      }
    }
  )
  .post(
    '/:webhookId/secret',
    authMiddleware,
    orgAdminMiddleware,
    webhookMutationRateLimit,
    zValidator('param', ZWebhookParams),
    async (c) => {
      try {
        const orgId = c.req.header('cio-org-id')!;
        const user = c.get('user')!;
        const { webhookId } = c.req.valid('param');
        const data = await regenerateWebhookSecretService(orgId, webhookId, user.id);

        return c.json({ success: true, data }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to regenerate webhook secret');
      }
    }
  )
  .post(
    '/:webhookId/test',
    authMiddleware,
    orgAdminMiddleware,
    webhookTestRateLimit,
    zValidator('param', ZWebhookParams),
    async (c) => {
      try {
        const orgId = c.req.header('cio-org-id')!;
        const { webhookId } = c.req.valid('param');
        const data = await sendTestWebhookService(orgId, webhookId);

        return c.json({ success: true, data }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to send test webhook');
      }
    }
  )
  .get(
    '/:webhookId/deliveries',
    authMiddleware,
    orgAdminMiddleware,
    zValidator('param', ZWebhookParams),
    zValidator('query', ZWebhookDeliveryListQuery),
    async (c) => {
      try {
        const orgId = c.req.header('cio-org-id')!;
        const { webhookId } = c.req.valid('param');
        const query = c.req.valid('query');
        const { items, pagination } = await listWebhookDeliveriesService(orgId, webhookId, query);

        return c.json({ success: true, data: items, pagination }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to list webhook deliveries');
      }
    }
  )
  .get(
    '/:webhookId/deliveries/:deliveryId',
    authMiddleware,
    orgAdminMiddleware,
    zValidator('param', ZRedeliverWebhookDeliveryParams),
    async (c) => {
      try {
        const orgId = c.req.header('cio-org-id')!;
        const { webhookId, deliveryId } = c.req.valid('param');
        const data = await getWebhookDeliveryService(orgId, webhookId, deliveryId);

        return c.json({ success: true, data }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to load webhook delivery');
      }
    }
  )
  .post(
    '/:webhookId/deliveries/:deliveryId/redeliver',
    authMiddleware,
    orgAdminMiddleware,
    webhookTestRateLimit,
    zValidator('param', ZRedeliverWebhookDeliveryParams),
    async (c) => {
      try {
        const orgId = c.req.header('cio-org-id')!;
        const { webhookId, deliveryId } = c.req.valid('param');
        const data = await redeliverWebhookService(orgId, webhookId, deliveryId);

        return c.json({ success: true, data }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to redeliver webhook');
      }
    }
  );
