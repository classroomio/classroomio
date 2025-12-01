import { ALLOWED_IMAGE_TYPES } from '../constants';
import { z } from 'zod';

/**
 * Schema for image upload presign URL request
 * Used for generating presigned URLs for image uploads (avatars, etc.)
 */
export const ZMediaImagePresignUrlUpload = z.object({
  fileName: z.string().min(1),
  fileType: z.enum(ALLOWED_IMAGE_TYPES)
});
export type TMediaImagePresignUrlUpload = z.infer<typeof ZMediaImagePresignUrlUpload>;
