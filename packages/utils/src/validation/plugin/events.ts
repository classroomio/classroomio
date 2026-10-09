import * as z from 'zod';

export const ZSubscribeEvent = z.object({
  eventType: z.string().trim().min(3).max(128),
  endpoint: z.string().trim().url()
});
export type TSubscribeEvent = z.infer<typeof ZSubscribeEvent>;

export const ZTriggerTestEvent = z.object({
  eventType: z.string().trim().min(3).max(128),
  payload: z.record(z.string(), z.unknown()).optional().default({})
});
export type TTriggerTestEvent = z.infer<typeof ZTriggerTestEvent>;
