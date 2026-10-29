import { AppError } from '@api/utils/errors';
import {
  deletePluginStorageItem,
  getInstallationGrants,
  getPluginStorageItem,
  listPluginStorageByNamespace,
  setPluginStorageItemWithAtomicQuota,
  verifyResourceOrganization
} from '@cio/db/queries/plugin';
import type { TPluginStorageScopeType } from '@cio/db/types';
import { requireOrganizationInstallation } from './authorization';

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

  const item = await getPluginStorageItem(installationId, scopeType, scopeId, namespace, key, resolvedResourceType);
  if (!item) {
    return null;
  }

  return item.value;
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
  resourceId?: string
): Promise<{ success: true }> {
  await requireOrganizationInstallation(installationId, organizationId);

  const {
    scopeType,
    scopeId,
    resourceType: resolvedResourceType
  } = resolveStorageScope(scope, actorUserId, organizationId, resourceType, resourceId);
  await assertResourceBelongsToOrg(scopeType, resolvedResourceType, scopeId, organizationId);
  await assertStorageAccess(installationId, scopeType, 'write', userRole);

  const serialized = JSON.stringify(value);
  const itemBytes = Buffer.byteLength(serialized, 'utf8');
  if (itemBytes > MAX_STORAGE_ITEM_BYTES) {
    throw new AppError('Storage item exceeds maximum allowed size (256KB)', 'STORAGE_ITEM_TOO_LARGE', 400);
  }

  try {
    await setPluginStorageItemWithAtomicQuota(
      {
        installationId,
        scopeType,
        scopeId,
        resourceType: resolvedResourceType,
        namespace,
        key,
        value
      },
      MAX_INSTALLATION_STORAGE_BYTES,
      itemBytes
    );
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'STORAGE_QUOTA_EXCEEDED') {
      throw new AppError('Installation storage quota exceeded (5MB)', 'STORAGE_QUOTA_EXCEEDED', 400);
    }
    throw err;
  }

  return { success: true };
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
  resourceId?: string
): Promise<Array<{ key: string; value: unknown; updatedAt: string }>> {
  await requireOrganizationInstallation(installationId, organizationId);

  const {
    scopeType,
    scopeId,
    resourceType: resolvedResourceType
  } = resolveStorageScope(scope, actorUserId, organizationId, resourceType, resourceId);
  await assertResourceBelongsToOrg(scopeType, resolvedResourceType, scopeId, organizationId);
  await assertStorageAccess(installationId, scopeType, 'read', userRole);

  const records = await listPluginStorageByNamespace(
    installationId,
    scopeType,
    scopeId,
    namespace,
    resolvedResourceType
  );

  return records.map((record) => ({
    key: record.key,
    value: record.value,
    updatedAt: record.updatedAt
  }));
}
