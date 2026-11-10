import { z } from 'zod';

export const ZZapierTriggerParam = z.object({
  triggerId: z.string().uuid()
});
export type TZapierTriggerParam = z.infer<typeof ZZapierTriggerParam>;
