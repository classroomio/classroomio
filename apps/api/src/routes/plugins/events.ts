import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { orgAdminMiddleware } from '@api/middlewares/org-admin';
import { handleError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';
import { ZSubscribeEvent, ZTriggerTestEvent } from '@cio/utils/validation/plugin';
import {
  getInstallationDeliveries,
  getInstallationSubscriptions,
  getInstallationWebhookSecret,
  publishOutboxEvent,
  registerEventSubscription,
  replayDelivery
} from '@api/services/plugin';

export const pluginEventsRouter = new Hono()
  .get('/installations/:installationId/subscriptions', authMiddleware, orgAdminMiddleware, async (c) => {
    const installationId = c.req.param('installationId');

    try {
      const subscriptions = await getInstallationSubscriptions(installationId);

      return c.json({ success: true, data: subscriptions }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to list plugin event subscriptions');
    }
  })
  .post(
    '/installations/:installationId/subscriptions',
    authMiddleware,
    orgAdminMiddleware,
    zValidator('json', ZSubscribeEvent),
    async (c) => {
      const installationId = c.req.param('installationId');
      const input = c.req.valid('json');

      try {
        const subscription = await registerEventSubscription(installationId, input.eventType, input.endpoint);

        return c.json({ success: true, data: subscription }, 201);
      } catch (error) {
        return handleError(c, error, 'Failed to register plugin event subscription');
      }
    }
  )
  .get('/installations/:installationId/deliveries', authMiddleware, orgAdminMiddleware, async (c) => {
    const installationId = c.req.param('installationId');

    try {
      const deliveries = await getInstallationDeliveries(installationId);

      return c.json({ success: true, data: deliveries }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to list plugin deliveries');
    }
  })
  .get('/installations/:installationId/webhook-secret', authMiddleware, orgAdminMiddleware, async (c) => {
    const installationId = c.req.param('installationId');

    try {
      const secret = getInstallationWebhookSecret(installationId);

      return c.json({ success: true, data: { secret } }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to get plugin webhook secret');
    }
  })
  .post('/deliveries/:deliveryId/replay', authMiddleware, orgAdminMiddleware, async (c) => {
    const deliveryId = c.req.param('deliveryId');

    try {
      const delivery = await replayDelivery(deliveryId);

      return c.json({ success: true, data: delivery }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to replay plugin delivery');
    }
  })
  .post('/test', authMiddleware, orgAdminMiddleware, zValidator('json', ZTriggerTestEvent), async (c) => {
    const input = c.req.valid('json');
    const orgId = c.req.query('organizationId');

    try {
      const result = await publishOutboxEvent(input.eventType, input.payload, orgId);

      return c.json({ success: true, data: result }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to publish test event');
    }
  });
