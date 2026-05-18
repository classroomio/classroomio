import * as z from 'zod';

export const ZJobIdParam = z.object({
  jobId: z.string().uuid()
});
export type TJobIdParam = z.infer<typeof ZJobIdParam>;

export const ZAssetJobsParam = z.object({
  assetId: z.string().uuid()
});
export type TAssetJobsParam = z.infer<typeof ZAssetJobsParam>;

export const ZJobBatchQuery = z.object({
  /** Comma-separated list of job ids; capped at 50 to keep URLs reasonable. */
  ids: z
    .string()
    .min(1)
    .transform((value) =>
      value
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean)
    )
    .pipe(z.array(z.string().uuid()).min(1).max(50))
});
export type TJobBatchQuery = z.infer<typeof ZJobBatchQuery>;
