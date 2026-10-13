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

export const PLUGIN_STORAGE_SCOPE_TYPES = ['organization', 'user', 'global'] as const;
export type PluginStorageScopeType = (typeof PLUGIN_STORAGE_SCOPE_TYPES)[number];
export const ZPluginStorageScopeType = z.enum(PLUGIN_STORAGE_SCOPE_TYPES);

export const ZInstallPlugin = z.object({
  pluginId: z.string().trim().min(3).max(128),
  version: z.string().trim().min(1).max(64),
  ownerType: ZPluginOwnerType.default('organization'),
  organizationId: z.string().uuid().optional(),
  settings: z.record(z.string(), z.unknown()).optional().default({})
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

export const ZPluginStorageSet = z.object({
  namespace: z.string().trim().min(1).max(64).default('default'),
  key: z.string().trim().min(1).max(128),
  value: z.unknown(),
  scope: z.enum(['owner', 'user']).default('owner')
});
export type TPluginStorageSet = z.infer<typeof ZPluginStorageSet>;

export const ZPluginStorageDelete = z.object({
  namespace: z.string().trim().min(1).max(128).default('default'),
  key: z.string().trim().min(1).max(255)
});
export type TPluginStorageDelete = z.infer<typeof ZPluginStorageDelete>;

export const ZPluginLaunchCodeExchange = z
  .object({
    code: z.string().trim().min(1),
    clientSecret: z.string().trim().min(1),
    clientId: z.string().trim().min(1)
  })
  .strict();
export type TPluginLaunchCodeExchange = z.infer<typeof ZPluginLaunchCodeExchange>;

export const ZApplyCertificateTemplate = z.object({
  courseId: z.string().uuid(),
  externalTemplateId: z.string().trim().min(1).max(128),
  externalTemplateVersion: z.number().int().min(1),
  name: z.string().trim().min(1).max(128),
  design: z.record(z.string(), z.unknown())
});
export type TApplyCertificateTemplate = z.infer<typeof ZApplyCertificateTemplate>;
