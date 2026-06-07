import * as z from 'zod';

import { ALLOWED_IMAGE_TYPES } from '../constants';

/**
 * Schema for image upload presign URL request
 * Used for generating presigned URLs for image uploads (avatars, etc.)
 */
export const ZMediaImagePresignUrlUpload = z.object({
  fileName: z.string().min(1),
  fileType: z.enum(ALLOWED_IMAGE_TYPES)
});
export type TMediaImagePresignUrlUpload = z.infer<typeof ZMediaImagePresignUrlUpload>;

export const ZTranscriptSegment = z.object({
  start: z.number(),
  end: z.number(),
  text: z.string()
});

export const ZTranscriptResponse = z.object({
  language: z.string(),
  segments: z.array(ZTranscriptSegment),
  vttUrl: z.string().min(1),
  vttUrlExpiresAt: z.string(),
  durationSeconds: z.number().nullable()
});
export type TTranscriptResponse = z.infer<typeof ZTranscriptResponse>;

export const ZUpdateTranscript = z.object({
  segments: z.array(ZTranscriptSegment).min(1)
});
export type TUpdateTranscript = z.infer<typeof ZUpdateTranscript>;
