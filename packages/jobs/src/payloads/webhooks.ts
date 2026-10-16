import * as z from 'zod';

export const ZDeliverWebhookPayload = z.object({
  webhookId: z.string().uuid()
});
export type TDeliverWebhookPayload = z.infer<typeof ZDeliverWebhookPayload>;
