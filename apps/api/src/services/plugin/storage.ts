import { AppError } from '@api/utils/errors';
import {
  deletePluginStorageItem,
  exportInstallationStorage,
  getInstallationById,
  getInstallationGrants,
  getPluginStorageItem,
  getPluginStorageUsageBytes,
  listPluginStorageByNamespace,
  purgeExpiredPluginStorage,
  purgeInstallationStorage,
  setPluginStorageItemWithAtomicQuota,
  verifyResourceOrganization
} from '@cio/db/queries/plugin';
import type { TPluginStorageScopeType } from '@cio/db/types';
import { requireOrganizationInstallation } from './authorization';
import { getPluginVersionById } from '@cio/db/queries/plugin';
import { ZPluginManifest, validatePluginJsonValue } from '@cio/utils/validation/plugin';

const MAX_STORAGE_ITEM_BYTES = 256 * 1024;
const MAX_INSTALLATION_STORAGE_BYTES = 5 * 1024 * 1024;

export interface StorageScopeResolution {
  scopeType: TPluginStorageScopeType;
  scopeId: string;
  resourceType: string;
}

export function resolveStorageScope(
  scope: 'organization' | 'user' | 'resource' | undefined,
  actorUserId: string,
  organizationId: string,
  resourceType?: string,
  resourceId?: string
): StorageScopeResolution {
  if (scope === 'user') {
    return { scopeType: 'user', scopeId: actorUserId, resourceType: '' };
  }

  if (scope === 'resource') {
    if (!resourceId || !resourceType) {
      throw new AppError('resourceId and resourceType are required when scope is "resource"', 'INVALID_PARAMS', 400);
    }
    return { scopeType: 'resource', scopeId: resourceId, resourceType };
  }

  return { scopeType: 'organization', scopeId: organizationId, resourceType: '' };
}

async function assertResourceBelongsToOrg(
  scopeType: TPluginStorageScopeType,
  resourceType: string,
  resourceId: string,
  organizationId: string
): Promise<void> {
  if (scopeType !== 'resource') return;

  const isAuthorized = await verifyResourceOrganization(resourceType, resourceId, organizationId);
  if (!isAuthorized) {
    throw new AppError('Resource does not belong to the organization', 'FORBIDDEN', 403);
  }
}

async function assertStorageAccess(
  installationId: string,
  scopeType: TPluginStorageScopeType,
  mode: 'read' | 'write',
  userRole?: number
): Promise<void> {
  const grants = await getInstallationGrants(installationId);
  const grantedScopes = new Set(grants.map((g) => g.scope));

  if (mode === 'read') {
    if (!grantedScopes.has('plugin.storage:read') && !grantedScopes.has('plugin.storage:write')) {
      throw new AppError('Plugin lacks storage read permission', 'PLUGIN_PERMISSION_DENIED', 403);
    }
  } else {
    if (!grantedScopes.has('plugin.storage:write')) {
      throw new AppError('Plugin lacks storage write permission', 'PLUGIN_PERMISSION_DENIED', 403);
    }
  }

  if ((scopeType === 'organization' || scopeType === 'resource') && mode === 'write') {
    if (userRole !== 1 && userRole !== 2) {
      throw new AppError(
        'Only organization admins and tutors can modify organization- or resource-scoped storage',
        'FORBIDDEN',
        403
      );
    }
  }
}

async function getStorageDocument(installationId: string, namespace: string, scopeType: TPluginStorageScopeType) {
  await purgeExpiredPluginStorage();
  const installation = await getInstallationById(installationId);
  const version = installation ? await getPluginVersionById(installation.pluginVersionId) : null;
  const manifest = version ? ZPluginManifest.parse(version.manifest) : null;
  const document = manifest?.storage?.documents.find(
    (candidate) => candidate.namespace === namespace && candidate.scope === scopeType
  );
  if (!document) {
    throw new AppError(
      'Storage namespace and scope are not declared by the plugin',
      'STORAGE_DOCUMENT_NOT_DECLARED',
      403
    );
  }

  return document;
}

export async function getStorageValue(
  installationId: string,
  organizationId: string,
  actorUserId: string,
  namespace: string,
  key: string,
  scope?: 'organization' | 'user' | 'resource',
  userRole?: number,
  resourceType?: string,
  resourceId?: string
): Promise<unknown | null> {
  await requireOrganizationInstallation(installationId, organizationId);

  const {
    scopeType,
    scopeId,
    resourceType: resolvedResourceType
  } = resolveStorageScope(scope, actorUserId, organizationId, resourceType, resourceId);
  await assertResourceBelongsToOrg(scopeType, resolvedResourceType, scopeId, organizationId);
  await assertStorageAccess(installationId, scopeType, 'read', userRole);
  await getStorageDocument(installationId, namespace, scopeType);

  const item = await getPluginStorageItem(installationId, scopeType, scopeId, namespace, key, resolvedResourceType);
  if (!item) {
    return null;
  }

  return item.value;
}

export async function getStorageRecord(
  installationId: string,
  organizationId: string,
  actorUserId: string,
  namespace: string,
  key: string,
  scope?: 'organization' | 'user' | 'resource',
  userRole?: number,
  resourceType?: string,
  resourceId?: string
) {
  await requireOrganizationInstallation(installationId, organizationId);
  const resolved = resolveStorageScope(scope, actorUserId, organizationId, resourceType, resourceId);
  await assertResourceBelongsToOrg(resolved.scopeType, resolved.resourceType, resolved.scopeId, organizationId);
  await assertStorageAccess(installationId, resolved.scopeType, 'read', userRole);
  await getStorageDocument(installationId, namespace, resolved.scopeType);

  return getPluginStorageItem(
    installationId,
    resolved.scopeType,
    resolved.scopeId,
    namespace,
    key,
    resolved.resourceType
  );
}

export async function setStorageValue(
  installationId: string,
  organizationId: string,
  actorUserId: string,
  namespace: string,
  key: string,
  value: unknown,
  scope?: 'organization' | 'user' | 'resource',
  userRole?: number,
  resourceType?: string,
  resourceId?: string,
  schemaVersion = 1,
  expectedVersion?: number
) {
  await requireOrganizationInstallation(installationId, organizationId);

  const {
    scopeType,
    scopeId,
    resourceType: resolvedResourceType
  } = resolveStorageScope(scope, actorUserId, organizationId, resourceType, resourceId);
  await assertResourceBelongsToOrg(scopeType, resolvedResourceType, scopeId, organizationId);
  await assertStorageAccess(installationId, scopeType, 'write', userRole);
  const document = await getStorageDocument(installationId, namespace, scopeType);
  if (document.schemaVersion !== schemaVersion) {
    throw new AppError('Storage schema version does not match the manifest', 'STORAGE_SCHEMA_VERSION_MISMATCH', 409);
  }
  const validationError = validatePluginJsonValue(value, document.schema);
  if (validationError) {
    throw new AppError(`Stored value is invalid: ${validationError}`, 'STORAGE_VALUE_INVALID', 400);
  }

  const serialized = JSON.stringify(value);
  const itemBytes = Buffer.byteLength(serialized, 'utf8');
  if (itemBytes > MAX_STORAGE_ITEM_BYTES) {
    throw new AppError('Storage item exceeds maximum allowed size (256KB)', 'STORAGE_ITEM_TOO_LARGE', 400);
  }

  try {
    const storedItem = await setPluginStorageItemWithAtomicQuota(
      {
        installationId,
        scopeType,
        scopeId,
        resourceType: resolvedResourceType,
        namespace,
        key,
        value,
        schemaVersion
      },
      MAX_INSTALLATION_STORAGE_BYTES,
      itemBytes,
      expectedVersion
    );

    return storedItem;
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'STORAGE_QUOTA_EXCEEDED') {
      throw new AppError('Installation storage quota exceeded (5MB)', 'STORAGE_QUOTA_EXCEEDED', 400);
    }
    if (err instanceof Error && err.message === 'STORAGE_VERSION_CONFLICT') {
      throw new AppError('Storage record was changed by another request', 'STORAGE_VERSION_CONFLICT', 409);
    }
    throw err;
  }
}

export async function deleteStorageValue(
  installationId: string,
  organizationId: string,
  actorUserId: string,
  namespace: string,
  key: string,
  scope?: 'organization' | 'user' | 'resource',
  userRole?: number,
  resourceType?: string,
  resourceId?: string
): Promise<{ success: true; deleted: boolean }> {
  await requireOrganizationInstallation(installationId, organizationId);
  await purgeExpiredPluginStorage();

  const {
    scopeType,
    scopeId,
    resourceType: resolvedResourceType
  } = resolveStorageScope(scope, actorUserId, organizationId, resourceType, resourceId);
  await assertResourceBelongsToOrg(scopeType, resolvedResourceType, scopeId, organizationId);
  await assertStorageAccess(installationId, scopeType, 'write', userRole);

  const deleted = await deletePluginStorageItem(
    installationId,
    scopeType,
    scopeId,
    namespace,
    key,
    resolvedResourceType
  );

  return { success: true, deleted };
}

export async function listStorageRecords(
  installationId: string,
  organizationId: string,
  actorUserId: string,
  namespace: string,
  scope?: 'organization' | 'user' | 'resource',
  userRole?: number,
  resourceType?: string,
  resourceId?: string,
  cursor?: string,
  limit?: number
) {
  await requireOrganizationInstallation(installationId, organizationId);

  const {
    scopeType,
    scopeId,
    resourceType: resolvedResourceType
  } = resolveStorageScope(scope, actorUserId, organizationId, resourceType, resourceId);
  await assertResourceBelongsToOrg(scopeType, resolvedResourceType, scopeId, organizationId);
  await assertStorageAccess(installationId, scopeType, 'read', userRole);
  await getStorageDocument(installationId, namespace, scopeType);

  const records = await listPluginStorageByNamespace(
    installationId,
    scopeType,
    scopeId,
    namespace,
    resolvedResourceType,
    { cursor, limit }
  );

  return {
    ...records,
    items: records.items.map((record) => ({
      key: record.key,
      value: record.value,
      version: record.version,
      schemaVersion: record.schemaVersion,
      updatedAt: record.updatedAt
    }))
  };
}

export async function getStorageUsage(installationId: string, organizationId: string) {
  await requireOrganizationInstallation(installationId, organizationId);
  await purgeExpiredPluginStorage();
  const bytes = await getPluginStorageUsageBytes(installationId);

  return { bytes, maxBytes: MAX_INSTALLATION_STORAGE_BYTES };
}

export async function exportStorageData(installationId: string, organizationId: string) {
  await requireOrganizationInstallation(installationId, organizationId);
  await purgeExpiredPluginStorage();

  return exportInstallationStorage(installationId);
}

export async function deleteStorageData(installationId: string, organizationId: string) {
  await requireOrganizationInstallation(installationId, organizationId);
  const deleted = await purgeInstallationStorage(installationId);

  return { deleted };
}
