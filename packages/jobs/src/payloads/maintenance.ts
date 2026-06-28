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

const ZBucketKey = z.object({ bucket: z.string().min(1), key: z.string().min(1) });
const ZBucketPrefix = z.object({ bucket: z.string().min(1), prefix: z.string().min(1) });

/**
 * Purge every object backing a deleted asset from object storage. The asset
 * DB row (and its cascaded usages/jobs/transcript rows) is already gone by the
 * time this runs, so the producer captures the concrete keys/prefixes up front
 * and passes them here. Deletion is idempotent — missing objects are fine.
 */
export const ZAssetStorageCleanupPayload = z.object({
  assetId: z.string().min(1),
  organizationId: z.string().min(1),
  /** Whole object trees to sweep (e.g. HLS `{assetId}/`, `thumbnails/{assetId}/`). */
  prefixes: z.array(ZBucketPrefix).default([]),
  /** Individual objects (e.g. raw upload, transcript VTT). */
  keys: z.array(ZBucketKey).default([])
});
export type TAssetStorageCleanupPayload = z.infer<typeof ZAssetStorageCleanupPayload>;
