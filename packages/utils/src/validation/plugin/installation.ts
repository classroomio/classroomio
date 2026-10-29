import * as z from 'zod';

export const PLUGIN_PUBLISHER_CLASSES = ['first-party', 'verified-third-party', 'community'] as const;
export type PluginPublisherClass = (typeof PLUGIN_PUBLISHER_CLASSES)[number];
export const ZPluginPublisherClass = z.enum(PLUGIN_PUBLISHER_CLASSES);

export const PLUGIN_ORG_APPROVAL_STATUSES = ['approved', 'pending', 'rejected'] as const;
export type PluginOrgApprovalStatus = (typeof PLUGIN_ORG_APPROVAL_STATUSES)[number];
export const ZPluginOrgApprovalStatus = z.enum(PLUGIN_ORG_APPROVAL_STATUSES);

export const PLUGIN_OWNER_TYPES = ['organization', 'user'] as const;
export type PluginOwnerType = (typeof PLUGIN_OWNER_TYPES)[number];
export const ZPluginOwnerType = z.enum(PLUGIN_OWNER_TYPES);

export const PLUGIN_INSTALLATION_STATUSES = ['active', 'disabled', 'revoked', 'uninstalled'] as const;
export type PluginInstallationStatus = (typeof PLUGIN_INSTALLATION_STATUSES)[number];
export const ZPluginInstallationStatus = z.enum(PLUGIN_INSTALLATION_STATUSES);

export const PLUGIN_STORAGE_SCOPE_TYPES = ['organization', 'user', 'global', 'resource'] as const;
export type PluginStorageScopeType = (typeof PLUGIN_STORAGE_SCOPE_TYPES)[number];
export const ZPluginStorageScopeType = z.enum(PLUGIN_STORAGE_SCOPE_TYPES);

export const ZInstallPlugin = z.object({
  pluginId: z.string().trim().min(3).max(128).optional(),
  version: z.string().trim().min(1).max(64),
  ownerType: ZPluginOwnerType.default('organization'),
  organizationId: z.string().uuid().optional(),
  settings: z.record(z.string(), z.unknown()).optional().default({}),
  allowDowngrade: z.boolean().optional().default(false)
});
export type TInstallPlugin = z.infer<typeof ZInstallPlugin>;

export const ZUpdateInstallationStatus = z.object({
  status: z.enum(['active', 'disabled', 'uninstalled'])
});
export type TUpdateInstallationStatus = z.infer<typeof ZUpdateInstallationStatus>;

export const ZUpdateOrgApprovalStatus = z.object({
  approval: ZPluginOrgApprovalStatus
});
export type TUpdateOrgApprovalStatus = z.infer<typeof ZUpdateOrgApprovalStatus>;

export const ZUpdateInstallationSettings = z.object({
  settings: z.record(z.string(), z.unknown())
});
export type TUpdateInstallationSettings = z.infer<typeof ZUpdateInstallationSettings>;

export const ZCreatePluginCredential = z.object({
  label: z.string().trim().max(120).optional(),
  expiresInDays: z.number().int().min(1).max(365).optional()
});
export type TCreatePluginCredential = z.infer<typeof ZCreatePluginCredential>;

export const ZPluginLaunchCodeExchange = z
  .object({
    code: z.string().trim().min(1),
    clientSecret: z.string().trim().min(1),
    clientId: z.string().trim().min(1)
  })
  .strict();
export type TPluginLaunchCodeExchange = z.infer<typeof ZPluginLaunchCodeExchange>;

export const ZPluginInstallationParam = z.object({
  installationId: z.string().uuid()
});
export type TPluginInstallationParam = z.infer<typeof ZPluginInstallationParam>;

export const ZPluginStorageKeyParam = z.object({
  installationId: z.string().uuid(),
  namespace: z.string().trim().min(1).max(128),
  key: z.string().trim().min(1).max(255)
});
export type TPluginStorageKeyParam = z.infer<typeof ZPluginStorageKeyParam>;

export const ZPluginStorageNamespaceParam = z.object({
  installationId: z.string().uuid(),
  namespace: z.string().trim().min(1).max(128)
});
export type TPluginStorageNamespaceParam = z.infer<typeof ZPluginStorageNamespaceParam>;

export const ZPluginStorageQuery = z
  .object({
    scope: z.enum(['organization', 'user', 'resource']).optional().default('organization'),
    resourceType: z.string().trim().min(1).max(64).optional(),
    resourceId: z.string().uuid().optional()
  })
  .superRefine((data, ctx) => {
    if (data.scope === 'resource') {
      if (!data.resourceId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'resourceId is required when scope is "resource"',
          path: ['resourceId']
        });
      }
      if (!data.resourceType) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'resourceType is required when scope is "resource"',
          path: ['resourceType']
        });
      }
    }
  });
export type TPluginStorageQuery = z.infer<typeof ZPluginStorageQuery>;

export const ZPluginStoragePut = z
  .object({
    value: z.unknown(),
    scope: z.enum(['organization', 'user', 'resource']).optional().default('organization'),
    resourceType: z.string().trim().min(1).max(64).optional(),
    resourceId: z.string().uuid().optional()
  })
  .superRefine((data, ctx) => {
    if (data.scope === 'resource') {
      if (!data.resourceId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'resourceId is required when scope is "resource"',
          path: ['resourceId']
        });
      }
      if (!data.resourceType) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'resourceType is required when scope is "resource"',
          path: ['resourceType']
        });
      }
    }
  });
export type TPluginStoragePut = z.infer<typeof ZPluginStoragePut>;
