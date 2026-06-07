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

/**
 * Sweep `media_job` rows that are still `queued` / `running` but haven't been
 * touched in `staleAfterMinutes`. Marks them `failed` so the active-job guard
 * stops blocking new runs after a worker crash, server restart, or lost
 * BullMQ job.
 */
/**
 * Daily aggregation of raw analytics page events into the daily rollup tables.
 * Defaults to rolling up yesterday's data.
 */
export const ZAnalyticsDailyRollupPayload = z.object({
  daysAgo: z.number().int().positive().default(1)
});
export type TAnalyticsDailyRollupPayload = z.infer<typeof ZAnalyticsDailyRollupPayload>;

export const ZMediaJobReapPayload = z.object({
  staleAfterMinutes: z.number().int().positive().default(30)
});
export type TMediaJobReapPayload = z.infer<typeof ZMediaJobReapPayload>;
