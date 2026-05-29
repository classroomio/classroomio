import * as z from 'zod';

/**
 * Payloads for the `media` and `media-transcribe` queues.
 *
 * Every payload carries the `mediaJobId` (DB run id) and `assetId` so workers
 * never need to re-derive context. `actorContext` is snapshotted at enqueue
 * time per the plan's authorization-on-resume rule.
 */

export const ZActorContext = z.object({
  userId: z.string().uuid().nullable(),
  organizationId: z.string().uuid(),
  locale: z.string().optional()
});
export type TActorContext = z.infer<typeof ZActorContext>;

export const ZProbeMetadataPayload = z.object({
  mediaJobId: z.string().uuid(),
  assetId: z.string().uuid(),
  storageKey: z.string().min(1),
  actorContext: ZActorContext
});
export type TProbeMetadataPayload = z.infer<typeof ZProbeMetadataPayload>;

export const ZGenerateThumbnailPayload = z.object({
  mediaJobId: z.string().uuid(),
  assetId: z.string().uuid(),
  storageKey: z.string().min(1),
  actorContext: ZActorContext,
  /** Seconds into the video to grab. Defaults to 1.0 in the worker. */
  atSeconds: z.number().nonnegative().optional(),
  /**
   * When true, the processor marks the parent `media_job` as `completed`
   * after a successful run. Set by `enqueueGenerateThumbnailOnly` because
   * thumbnail is the only step and nothing else will flip status.
   */
  markJobCompleteOnSuccess: z.boolean().optional()
});
export type TGenerateThumbnailPayload = z.infer<typeof ZGenerateThumbnailPayload>;

export const ZExtractAudioPayload = z.object({
  mediaJobId: z.string().uuid(),
  assetId: z.string().uuid(),
  storageKey: z.string().min(1),
  actorContext: ZActorContext
});
export type TExtractAudioPayload = z.infer<typeof ZExtractAudioPayload>;

export const ZTranscribeAudioPayload = z.object({
  mediaJobId: z.string().uuid(),
  assetId: z.string().uuid(),
  actorContext: ZActorContext,
  /** Provider override; defaults to `openai` in the worker. */
  provider: z.enum(['openai', 'assemblyai', 'deepgram']).optional()
});
export type TTranscribeAudioPayload = z.infer<typeof ZTranscribeAudioPayload>;

export const ZCompressVideoPayload = z.object({
  mediaJobId: z.string().uuid(),
  assetId: z.string().uuid(),
  storageKey: z.string().min(1),
  actorContext: ZActorContext,
  options: z
    .object({
      crf: z.number().int().min(0).max(51).optional(),
      scale: z.string().optional()
    })
    .optional()
});
export type TCompressVideoPayload = z.infer<typeof ZCompressVideoPayload>;
