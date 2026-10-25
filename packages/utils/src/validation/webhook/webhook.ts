import * as z from 'zod';

import { WEBHOOK_DELIVERY_STATUSES, WEBHOOK_EVENT_MODES, WEBHOOK_EVENT_TYPES } from '../../constants/webhook';

const webhookEventTypes: readonly string[] = WEBHOOK_EVENT_TYPES;

export const ZWebhookEventType = z
  .string()
  .refine((value) => webhookEventTypes.includes(value), { message: 'Invalid webhook event type' });

const ZWebhookPayloadUrl = z
  .string()
  .trim()
  .url()
  .max(2_048)
  .refine((value) => ['http:', 'https:'].includes(new URL(value).protocol), {
    message: 'validations.webhook.payload_url.protocol'
  });

const ZWebhookFields = z.object({
  name: z.string().trim().min(1).max(120),
  payloadUrl: ZWebhookPayloadUrl,
  secret: z.string().min(8).max(256),
  verifySsl: z.boolean(),
  eventMode: z.enum(WEBHOOK_EVENT_MODES),
  eventTypes: z.array(ZWebhookEventType).max(WEBHOOK_EVENT_TYPES.length),
  isActive: z.boolean()
});

const requireEventsWhenSelected = (data: { eventMode?: string; eventTypes?: string[] }) =>
  data.eventMode !== 'selected' || (data.eventTypes?.length ?? 0) > 0;

export const ZCreateWebhook = ZWebhookFields.pick({ name: true, payloadUrl: true })
  .extend({
    secret: ZWebhookFields.shape.secret.optional(),
    verifySsl: ZWebhookFields.shape.verifySsl.default(true),
    eventMode: ZWebhookFields.shape.eventMode.default('selected'),
    eventTypes: ZWebhookFields.shape.eventTypes.default([]),
    isActive: ZWebhookFields.shape.isActive.default(true)
  })
  .refine(requireEventsWhenSelected, { message: 'validations.webhook.event_types.required', path: ['eventTypes'] });
export type TCreateWebhook = z.infer<typeof ZCreateWebhook>;

const requireEventsWhenProvided = (data: { eventMode?: string; eventTypes?: string[] }) =>
  data.eventMode !== 'selected' || data.eventTypes === undefined || data.eventTypes.length > 0;

export const ZUpdateWebhook = ZWebhookFields.partial().refine(requireEventsWhenProvided, {
  message: 'validations.webhook.event_types.required',
  path: ['eventTypes']
});
export type TUpdateWebhook = z.infer<typeof ZUpdateWebhook>;

export const ZWebhookParams = z.object({
  webhookId: z.string().uuid()
});
export type TWebhookParams = z.infer<typeof ZWebhookParams>;

export const ZWebhookDeliveryListQuery = z.object({
  status: z.enum(WEBHOOK_DELIVERY_STATUSES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});
export type TWebhookDeliveryListQuery = z.infer<typeof ZWebhookDeliveryListQuery>;

export const ZRedeliverWebhookDeliveryParams = ZWebhookParams.extend({
  deliveryId: z.string().min(1).max(64)
});
export type TRedeliverWebhookDeliveryParams = z.infer<typeof ZRedeliverWebhookDeliveryParams>;
