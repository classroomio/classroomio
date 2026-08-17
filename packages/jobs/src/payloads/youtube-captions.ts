import * as z from 'zod';

/**
 * Payload for the `youtube-captions` queue.
 *
 * Carries enough context for the worker to fetch captions via Supadata,
 * write to `youtube_caption`, and write-through to `media_transcript`.
 */
export const ZFetchYoutubeCaptionsPayload = z.object({
  mediaJobId: z.string().uuid(),
  assetId: z.string().uuid(),
  organizationId: z.string().uuid(),
  youtubeVideoId: z.string().min(1).max(11),
  canonicalUrl: z.string().url(),
  preferredLanguages: z.array(z.string()).optional()
});
export type TFetchYoutubeCaptionsPayload = z.infer<typeof ZFetchYoutubeCaptionsPayload>;
