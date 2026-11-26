import * as z from 'zod';

import { IMAGE_UPLOAD_PURPOSES } from '../../config/upload-limits';
import { ALLOWED_IMAGE_TYPES } from '../constants';

export const ZPublicApiCreateImageUpload = z.object({
  purpose: z
    .enum(IMAGE_UPLOAD_PURPOSES)
    .describe(
      'Where the image is used, which sets its size limit: content (lessons, exercises), cover (banners) or avatar (logos, photos).'
    ),
  fileName: z.string().min(1).max(255).describe('File name ending in .jpg, .jpeg, .png, .gif or .webp.'),
  mimeType: z.enum(ALLOWED_IMAGE_TYPES).describe('Content type the upload will be sent with.'),
  byteSize: z.number().int().positive().describe('Exact size of the file in bytes. Checked against the purpose limit.')
});
export type TPublicApiCreateImageUpload = z.infer<typeof ZPublicApiCreateImageUpload>;

export const ZPublicApiImageUploadResponse = z.object({
  url: z.string().describe('Permanent public URL of the image. Use it in any image field once the upload succeeds.'),
  uploadUrl: z
    .string()
    .describe('Send the bytes here with a single PUT, no authorization header, and Content-Type equal to mimeType.'),
  expiresAt: z.string().describe('ISO timestamp after which uploadUrl stops working.')
});
export type TPublicApiImageUploadResponse = z.infer<typeof ZPublicApiImageUploadResponse>;
