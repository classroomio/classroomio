import * as z from 'zod';

import { ALLOWED_CONTENT_TYPES } from '../constants';

/**
 * Public request and response shapes for the asset upload resource. Defined
 * independently of the internal asset schemas: `assetId` is the only identifier
 * that crosses this boundary, so the storage layout stays free to change.
 */
export const ZPublicApiCreateAsset = z.object({
  kind: z.enum(['video']).describe('Only video uploads are supported today.'),
  fileName: z.string().min(1).max(255).describe('Original file name, used as the asset title.'),
  mimeType: z.enum(ALLOWED_CONTENT_TYPES).describe('Content type the upload will be sent with.'),
  byteSize: z
    .number()
    .int()
    .positive()
    .describe('Size of the file in bytes. Checked against the organization upload limit.')
});
export type TPublicApiCreateAsset = z.infer<typeof ZPublicApiCreateAsset>;

export const ZPublicApiAssetUploadResponse = z.object({
  assetId: z.string().uuid().describe('Reference this when attaching the asset to a lesson.'),
  uploadUrl: z.string().describe('Send the file bytes here with a single PUT and no authorization header.'),
  expiresAt: z.string().describe('ISO timestamp after which uploadUrl stops working.')
});
export type TPublicApiAssetUploadResponse = z.infer<typeof ZPublicApiAssetUploadResponse>;
