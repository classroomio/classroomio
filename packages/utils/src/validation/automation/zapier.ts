import { z } from 'zod';

export const ZZapierTriggerParam = z.object({
  triggerId: z.string().uuid()
});
export type TZapierTriggerParam = z.infer<typeof ZZapierTriggerParam>;

export const ZZapierTriggerBulkRedeliver = z.object({
  triggerIds: z
    .array(z.string().uuid())
    .min(1)
    .max(250)
    .describe('Trigger subscription ids to redeliver the last 24 hours of failed events for')
});
export type TZapierTriggerBulkRedeliver = z.infer<typeof ZZapierTriggerBulkRedeliver>;
