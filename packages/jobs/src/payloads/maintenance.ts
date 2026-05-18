import * as z from 'zod';

export const ZRetentionCompactPayload = z.object({
  /** Override default retention windows (in days). Optional. */
  windowDays: z
    .object({
      mediaJob: z.number().int().positive().optional(),
      jobStep: z.number().int().positive().optional(),
      deadLetterJob: z.number().int().positive().optional()
    })
    .optional()
});
export type TRetentionCompactPayload = z.infer<typeof ZRetentionCompactPayload>;

export const ZDeadLetterCleanupPayload = z.object({
  olderThanDays: z.number().int().positive().default(180)
});
export type TDeadLetterCleanupPayload = z.infer<typeof ZDeadLetterCleanupPayload>;
