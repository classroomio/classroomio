import * as z from 'zod';

import { WEBHOOK_API_VERSION, WEBHOOK_EVENT_TYPES } from '../../constants/webhook';

const ZWebhookSubscriptionEventType = z.enum(WEBHOOK_EVENT_TYPES);

export const ZPublicApiCreateWebhookSubscription = z.object({
  targetUrl: z
    .url({ protocol: /^https$/ })
    .max(2048)
    .describe('HTTPS URL that receives the events. Only hosts registered for the connected app are accepted'),
  eventType: ZWebhookSubscriptionEventType.describe('The one event delivered to targetUrl'),
  courseId: z
    .uuid()
    .optional()
    .describe('Deliver only events for this course. Events without a course are not delivered'),
  cohortId: z
    .uuid()
    .optional()
    .describe('Deliver only events for this cohort. Events without a cohort are not delivered')
});
export type TPublicApiCreateWebhookSubscription = z.infer<typeof ZPublicApiCreateWebhookSubscription>;

export const ZPublicApiWebhookSubscriptionParam = z.object({
  subscriptionId: z.uuid()
});
export type TPublicApiWebhookSubscriptionParam = z.infer<typeof ZPublicApiWebhookSubscriptionParam>;

export const ZPublicApiWebhookSubscriptionResponse = z.object({
  id: z.uuid(),
  eventType: ZWebhookSubscriptionEventType,
  targetUrl: z.string(),
  courseId: z.uuid().nullable(),
  cohortId: z.uuid().nullable(),
  secret: z
    .string()
    .describe('Signing secret for the Standard Webhooks webhook-signature header. Store it with the subscription'),
  createdAt: z.string()
});
export type TPublicApiWebhookSubscriptionResponse = z.infer<typeof ZPublicApiWebhookSubscriptionResponse>;

export const ZPublicApiDeleteWebhookSubscriptionResponse = z.object({ id: z.uuid() });
export type TPublicApiDeleteWebhookSubscriptionResponse = z.infer<typeof ZPublicApiDeleteWebhookSubscriptionResponse>;

export const ZPublicApiWebhookSamplesQuery = z.object({
  eventType: ZWebhookSubscriptionEventType,
  courseId: z.uuid().optional().describe('Only events for this course'),
  cohortId: z.uuid().optional().describe('Only events for this cohort'),
  limit: z.coerce.number().int().min(1).max(3).default(3).describe('Events to return, 1-3. Default: 3.')
});
export type TPublicApiWebhookSamplesQuery = z.infer<typeof ZPublicApiWebhookSamplesQuery>;

export const ZPublicApiWebhookSampleResponse = z.object({
  id: z.string().describe('Event id, stable across delivery retries'),
  type: ZWebhookSubscriptionEventType,
  createdAt: z.string(),
  apiVersion: z.literal(WEBHOOK_API_VERSION),
  organization: z.object({ id: z.uuid(), name: z.string().nullable(), siteName: z.string().nullable() }),
  data: z.record(z.string(), z.unknown()).describe('The event data documented in the webhooks event reference')
});
export type TPublicApiWebhookSampleResponse = z.infer<typeof ZPublicApiWebhookSampleResponse>;
