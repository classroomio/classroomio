import { AppError } from '@api/utils/errors';
import {
  deletePluginStorageItem,
  getInstallationById,
  getPluginStorageItem,
  setPluginStorageItem
} from '@cio/db/queries/plugin';
import type { TPluginStorageScopeType } from '@db/types';

function resolveStorageScope(installation: {
  ownerType: string;
  organizationId: string | null;
  userId: string | null;
}): { scopeType: TPluginStorageScopeType; scopeId: string } {
  if (installation.ownerType === 'organization' && installation.organizationId) {
    return {
      scopeType: 'organization',
      scopeId: installation.organizationId
    };
  }

  if (installation.ownerType === 'user' && installation.userId) {
    return {
      scopeType: 'user',
      scopeId: installation.userId
    };
  }

  throw new AppError('Installation has no valid storage scope owner', 'INVALID_STORAGE_SCOPE', 400);
}

export async function getStorageValue(installationId: string, namespace: string, key: string): Promise<unknown | null> {
  const installation = await getInstallationById(installationId);
  if (!installation) {
    throw new AppError('Installation not found', 'INSTALLATION_NOT_FOUND', 404);
  }

  if (installation.status !== 'active') {
    throw new AppError('Plugin installation is not active', 'INSTALLATION_NOT_ACTIVE', 403);
  }

  const { scopeType, scopeId } = resolveStorageScope(installation);
  const row = await getPluginStorageItem(installationId, scopeType, scopeId, namespace, key);

  return row ? row.value : null;
}

export async function setStorageValue(
  installationId: string,
  namespace: string,
  key: string,
  value: unknown
): Promise<void> {
  const installation = await getInstallationById(installationId);
  if (!installation) {
    throw new AppError('Installation not found', 'INSTALLATION_NOT_FOUND', 404);
  }

  if (installation.status !== 'active') {
    throw new AppError('Plugin installation is not active', 'INSTALLATION_NOT_ACTIVE', 403);
  }

  const { scopeType, scopeId } = resolveStorageScope(installation);

  await setPluginStorageItem({
    installationId,
    scopeType,
    scopeId,
    namespace,
    key,
    value
  });
}

export async function deleteStorageValue(installationId: string, namespace: string, key: string): Promise<boolean> {
  const installation = await getInstallationById(installationId);
  if (!installation) {
    throw new AppError('Installation not found', 'INSTALLATION_NOT_FOUND', 404);
  }

  if (installation.status !== 'active') {
    throw new AppError('Plugin installation is not active', 'INSTALLATION_NOT_ACTIVE', 403);
  }

  const { scopeType, scopeId } = resolveStorageScope(installation);

  return deletePluginStorageItem(installationId, scopeType, scopeId, namespace, key);
}
