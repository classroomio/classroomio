import * as z from 'zod';

const AssetKind = z.enum(['video', 'document', 'image', 'audio', 'other']);
const AssetProvider = z.enum(['upload', 'youtube', 'generic', 'external_url', 'google_drive']);
export type TAssetProvider = z.infer<typeof AssetProvider>;
const AssetStatus = z.enum(['active', 'archived']);
const AssetTargetType = z.enum(['lesson', 'exercise', 'question']);

export const ZAssetListQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  kind: AssetKind.optional(),
  status: AssetStatus.optional(),
  search: z.string().trim().optional(),
  includeExternal: z.coerce.boolean().optional().default(true)
});
export type TAssetListQuery = z.infer<typeof ZAssetListQuery>;

export const ZAssetCreateUpload = z
  .object({
    kind: AssetKind.default('video'),
    provider: AssetProvider.default('upload'),
    storageProvider: z.string().default('s3'),
    storageKey: z.string().min(1).optional(),
    sourceUrl: z.string().url().optional(),
    mimeType: z.string().optional(),
    byteSize: z.coerce.number().int().min(0).optional(),
    checksum: z.string().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    thumbnailUrl: z.string().url().optional(),
    durationSeconds: z.coerce.number().int().min(0).optional(),
    aspectRatio: z.string().optional(),
    isExternal: z.boolean().optional().default(false),
    metadata: z.record(z.string(), z.unknown()).optional()
  })
  .superRefine((value, ctx) => {
    if (value.provider === 'upload' && !value.storageKey) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'storageKey is required for upload assets',
        path: ['storageKey']
      });
    }

    if (!value.isExternal && value.provider === 'upload' && value.byteSize == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'byteSize is required for uploaded internal assets',
        path: ['byteSize']
      });
    }
  });
export type TAssetCreateUpload = z.infer<typeof ZAssetCreateUpload>;

export const ZAssetGetParam = z.object({
  assetId: z.string().min(1)
});
export type TAssetGetParam = z.infer<typeof ZAssetGetParam>;

export const ZAssetUpdate = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  thumbnailUrl: z.string().url().optional(),
  durationSeconds: z.coerce.number().int().min(0).optional(),
  aspectRatio: z.string().optional(),
  status: AssetStatus.optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});
export type TAssetUpdate = z.infer<typeof ZAssetUpdate>;

export const ZAssetAttach = z.object({
  targetType: AssetTargetType,
  targetId: z.string().min(1),
  slotType: z.string().min(1),
  slotKey: z.string().optional(),
  position: z.coerce.number().int().min(0).optional()
});
export type TAssetAttach = z.infer<typeof ZAssetAttach>;

export const ZAssetDetach = z
  .object({
    usageId: z.string().uuid().optional(),
    targetType: AssetTargetType.optional(),
    targetId: z.string().optional(),
    slotType: z.string().optional(),
    slotKey: z.string().optional(),
    position: z.coerce.number().int().min(0).optional()
  })
  .superRefine((value, ctx) => {
    if (!value.usageId) {
      if (!value.targetType || !value.targetId || !value.slotType) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'usageId or targetType/targetId/slotType is required'
        });
      }
    }
  });
export type TAssetDetach = z.infer<typeof ZAssetDetach>;

export const ZAssetUsageParams = z.object({
  assetId: z.string().min(1)
});
export type TAssetUsageParams = z.infer<typeof ZAssetUsageParams>;

export const ZAssetExportQuery = z.object({
  includeArchived: z.coerce.boolean().optional().default(false),
  includeExternal: z.coerce.boolean().optional().default(true)
});
export type TAssetExportQuery = z.infer<typeof ZAssetExportQuery>;

export const ZAssetStorageQuery = z.object({
  includeArchived: z.coerce.boolean().optional().default(false),
  includeExternal: z.coerce.boolean().optional().default(true)
});
export type TAssetStorageQuery = z.infer<typeof ZAssetStorageQuery>;

export const ZYouTubeMetadataQuery = z.object({
  url: z.string().url()
});
export type TYouTubeMetadataQuery = z.infer<typeof ZYouTubeMetadataQuery>;

export const ZAssetThumbnailSelect = z.object({
  thumbnailUrl: z.string().url()
});
export type TAssetThumbnailSelect = z.infer<typeof ZAssetThumbnailSelect>;

// --- HLS upload lifecycle ---

export const ZInitHlsAsset = z.object({
  fileName: z.string().min(1),
  byteSize: z.coerce.number().int().min(0),
  mimeType: z.string().min(1),
  title: z.string().optional()
});
export type TInitHlsAsset = z.infer<typeof ZInitHlsAsset>;

/**
 * Batch-presign request. Caller passes a list of relative paths under
 * `videos/{assetId}/` that the browser encoder is about to write.
 * The server returns presigned PUT URLs keyed by the same relative path.
 */
export const ZBatchPresignHls = z.object({
  paths: z.array(z.string().min(1).max(256)).min(1).max(2000),
  contentTypeByExtension: z.record(z.string().regex(/^\.[a-z0-9]+$/), z.string().min(1)).optional()
});
export type TBatchPresignHls = z.infer<typeof ZBatchPresignHls>;

export const ZHls1080Status = z.enum(['none', 'generating', 'ready', 'failed']);
export type THls1080Status = z.infer<typeof ZHls1080Status>;

export const ZFinalizeHlsAsset = z.object({
  manifestKey: z.string().min(1),
  audioKey: z.string().min(1).optional(),
  durationSeconds: z.coerce.number().min(0),
  aspectRatio: z.string().optional(),
  byteSize: z.coerce.number().int().min(0),
  videoCodec: z.string().optional(),
  audioCodec: z.string().optional(),
  sourceWidth: z.coerce.number().int().min(1).optional(),
  sourceHeight: z.coerce.number().int().min(1).optional(),
  hlsRenditions: z.array(z.string().min(1)).optional(),
  hls1080Status: ZHls1080Status.optional(),
  /**
   * Fully-qualified thumbnail URLs returned by the dashboard after uploading
   * candidates through the existing `/media/image` endpoint. We persist them
   * as-is — no key→URL prefixing — because that endpoint already returns
   * a public URL.
   */
  thumbnailUrl: z.string().url().optional(),
  thumbnailCandidateUrls: z.array(z.string().url()).optional(),
  title: z.string().optional()
});
export type TFinalizeHlsAsset = z.infer<typeof ZFinalizeHlsAsset>;

/** Presign paths for a manual p1080 rendition on an active HLS asset. */
export const ZBatchPresignHls1080 = ZBatchPresignHls;
export type TBatchPresignHls1080 = z.infer<typeof ZBatchPresignHls1080>;

export const ZFinalizeHls1080 = z.object({
  additionalByteSize: z.coerce.number().int().min(0).default(0),
  sourceWidth: z.coerce.number().int().min(1).optional(),
  sourceHeight: z.coerce.number().int().min(1).optional()
});
export type TFinalizeHls1080 = z.infer<typeof ZFinalizeHls1080>;

export const ZHlsCookieParam = z.object({
  assetId: z.string().min(1)
});
export type THlsCookieParam = z.infer<typeof ZHlsCookieParam>;
