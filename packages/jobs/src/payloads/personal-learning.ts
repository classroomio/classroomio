import * as z from 'zod';

export const ZPersonalLearningSessionPayload = z.object({
  sessionId: z.string().uuid(),
  journeyId: z.string().uuid()
});

export type TPersonalLearningSessionPayload = z.infer<typeof ZPersonalLearningSessionPayload>;

export const ZPersonalLearningRecoveryScanPayload = z.object({
  staleAfterMinutes: z.number().int().positive().default(10),
  limit: z.number().int().positive().max(500).default(100)
});

export type TPersonalLearningRecoveryScanPayload = z.infer<typeof ZPersonalLearningRecoveryScanPayload>;
