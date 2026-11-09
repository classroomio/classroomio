import { Hono } from '@api/utils/hono';
import { v1WebhookSamplesRouter } from './samples';
import { v1WebhookSubscriptionsRouter } from './subscriptions';

export const v1WebhooksRouter = new Hono()
  .route('/subscriptions', v1WebhookSubscriptionsRouter)
  .route('/samples', v1WebhookSamplesRouter);
