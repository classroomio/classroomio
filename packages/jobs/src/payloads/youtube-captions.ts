import * as z from 'zod';

/**
 * Payload for the `youtube-captions` queue.
 *
 * Carries enough context for the worker to fetch captions via Supadata,
 * write to `youtube_caption`, and write-through to `media_transcript`.
 *
 * `triggeredByProfileId` and `courseId` are the billing attribution for the
 * provider call. `courseId` is nullable because the prefetch fires while the
 * asset is being created, before it has been attached to any lesson.

 */
export const ZFetchYoutubeCaptionsPayload = z.object({
  mediaJobId: z.string().uuid(),
  assetId: z.string().uuid(),
  organizationId: z.string().uuid(),
  triggeredByProfileId: z.string().uuid(),
  courseId: z.string().uuid().nullable().optional(),
  youtubeVideoId: z.string().min(1).max(11),
  canonicalUrl: z.string().url(),
  preferredLanguages: z.array(z.string()).optional()
});
export type TFetchYoutubeCaptionsPayload = z.infer<typeof ZFetchYoutubeCaptionsPayload>;
