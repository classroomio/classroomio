import * as z from 'zod';

const AssetKind = z.enum(['video', 'document', 'image', 'audio', 'other']);
const AssetProvider = z.enum(['upload', 'youtube', 'generic', 'external_url']);
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
