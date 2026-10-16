import * as z from 'zod';

export const ZPackageCreate = z.object({
  fileName: z
    .string()
    .min(1)
    .max(256)
    .refine((name) => name.toLowerCase().endsWith('.zip'), 'Package file must be a .zip file'),
  fileSize: z.coerce.number().int().min(1),
  title: z.string().min(1).max(256).optional()
});
export type TPackageCreate = z.infer<typeof ZPackageCreate>;

export const ZPackageParam = z.object({
  assetId: z.string().min(1)
});
export type TPackageParam = z.infer<typeof ZPackageParam>;

export const ZPackageVersionCreate = z.object({
  contentSha256: z
    .string()
    .regex(/^[a-f0-9]{64}$/i, 'contentSha256 must be a hex SHA-256 digest')
    .transform((digest) => digest.toLowerCase())
    .optional()
});
export type TPackageVersionCreate = z.infer<typeof ZPackageVersionCreate>;

export const ZPackageVersionParam = z.object({
  assetId: z.string().min(1),
  versionId: z.string().min(1)
});
export type TPackageVersionParam = z.infer<typeof ZPackageVersionParam>;

export const ZPackageMakeCurrent = z.object({
  closeOpenAttempts: z.boolean().optional().default(false)
});
export type TPackageMakeCurrent = z.infer<typeof ZPackageMakeCurrent>;
