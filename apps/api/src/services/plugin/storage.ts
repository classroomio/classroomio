import { AppError } from '@api/utils/errors';
import { authorizePluginRequest } from '@api/services/plugin/authorization';
import {
  deletePluginStorageItem,
  getPluginStorageItem,
  getPluginStorageUsageBytes,
  getPluginVersionById,
  listPluginStorageByNamespace,
  setPluginStorageItem
} from '@cio/db/queries';
import type { TPluginStorageScopeType } from '@db/types';
import { ZPluginManifest } from '@cio/utils/validation/plugin';

export type RequestedStorageScope = 'owner' | 'organization' | 'user';

const MAX_STORAGE_ITEM_BYTES = 256 * 1024;
const MAX_INSTALLATION_STORAGE_BYTES = 5 * 1024 * 1024;

export interface PluginStorageRecord {
  namespace: string;
  key: string;
  value: unknown;
  scope: 'organization' | 'user';
  updatedAt?: string;
}

function normalizeStorageScope(scope: RequestedStorageScope): 'owner' | 'user' {
  return scope === 'user' ? 'user' : 'owner';
}

function resolveStorageScope(
  installation: {
    ownerType: string;
    organizationId: string | null;
    userId: string | null;
  },
  requestedScope: RequestedStorageScope,
  actorUserId: string
): { scopeType: TPluginStorageScopeType; scopeId: string } {
  const normalized = normalizeStorageScope(requestedScope);
  if (normalized === 'user') {
    return { scopeType: 'user', scopeId: actorUserId };
  }

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

async function authorizeStorageAccess(
  installationId: string,
  organizationId: string,
  actorUserId: string,
  requiredScope: 'plugin.storage:read' | 'plugin.storage:write'
) {
  const authorization = await authorizePluginRequest({
    installationId,
    organizationId,
    actorId: actorUserId,
    requiredScope
  });

  return authorization;
}

async function assertDeclaredStorageDocument(
  pluginVersionId: string,
  namespace: string,
  requestedScope: RequestedStorageScope
) {
  const pluginVersion = await getPluginVersionById(pluginVersionId);
  if (!pluginVersion) {
    throw new AppError('Plugin version not found', 'PLUGIN_VERSION_NOT_FOUND', 404);
  }

  const parsedManifest = ZPluginManifest.safeParse(pluginVersion.manifest);
  if (!parsedManifest.success) {
    throw new AppError('Plugin version has an invalid manifest', 'INVALID_PLUGIN_MANIFEST', 500);
  }

  const manifestScope = requestedScope === 'user' ? 'user' : 'organization';
  const declaredDocument = parsedManifest.data.storage?.documents.find(
    (document) => document.namespace === namespace && document.scope === manifestScope
  );
  if (!declaredDocument) {
    throw new AppError(
      `Storage namespace "${namespace}" is not declared for the ${manifestScope} scope`,
      'PLUGIN_STORAGE_SCHEMA_NOT_DECLARED',
      403
    );
  }
}

function validateStorageIdentifier(namespace: string, key?: string) {
  if (!namespace || namespace.length > 64) {
    throw new AppError('Storage namespace must be between 1 and 64 characters', 'INVALID_STORAGE_NAMESPACE', 400);
  }

  if (key !== undefined && (!key || key.length > 128)) {
    throw new AppError('Storage key must be between 1 and 128 characters', 'INVALID_STORAGE_KEY', 400);
  }
}

export async function getStorageValue(
  installationId: string,
  organizationId: string,
  actorUserId: string,
  namespace: string,
  key: string,
  requestedScope: RequestedStorageScope
): Promise<unknown | null> {
  validateStorageIdentifier(namespace, key);

  const authorization = await authorizeStorageAccess(
    installationId,
    organizationId,
    actorUserId,
    'plugin.storage:read'
  );
  const { installation } = authorization;
  await assertDeclaredStorageDocument(installation.pluginVersionId, namespace, requestedScope);
  const { scopeType, scopeId } = resolveStorageScope(installation, requestedScope, actorUserId);
  const row = await getPluginStorageItem(installationId, scopeType, scopeId, namespace, key);

  return row ? row.value : null;
}

export async function getStorageRecord(
  installationId: string,
  organizationId: string,
  actorUserId: string,
  namespace: string,
  key: string,
  requestedScope: RequestedStorageScope
): Promise<PluginStorageRecord | null> {
  validateStorageIdentifier(namespace, key);

  const authorization = await authorizeStorageAccess(
    installationId,
    organizationId,
    actorUserId,
    'plugin.storage:read'
  );
  const { installation } = authorization;
  await assertDeclaredStorageDocument(installation.pluginVersionId, namespace, requestedScope);
  const { scopeType, scopeId } = resolveStorageScope(installation, requestedScope, actorUserId);
  const row = await getPluginStorageItem(installationId, scopeType, scopeId, namespace, key);

  if (!row) return null;

  return {
    namespace: row.namespace,
    key: row.key,
    value: row.value,
    scope: scopeType === 'user' ? 'user' : 'organization',
    updatedAt: row.updatedAt
  };
}

export async function listStorageRecords(
  installationId: string,
  organizationId: string,
  actorUserId: string,
  namespace: string,
  requestedScope: RequestedStorageScope
): Promise<PluginStorageRecord[]> {
  validateStorageIdentifier(namespace);

  const authorization = await authorizeStorageAccess(
    installationId,
    organizationId,
    actorUserId,
    'plugin.storage:read'
  );
  const { installation } = authorization;
  await assertDeclaredStorageDocument(installation.pluginVersionId, namespace, requestedScope);
  const { scopeType, scopeId } = resolveStorageScope(installation, requestedScope, actorUserId);
  const rows = await listPluginStorageByNamespace(installationId, scopeType, scopeId, namespace);

  return rows.map((row) => ({
    namespace: row.namespace,
    key: row.key,
    value: row.value,
    scope: scopeType === 'user' ? 'user' : 'organization',
    updatedAt: row.updatedAt
  }));
}

export async function setStorageValue(
  installationId: string,
  organizationId: string,
  actorUserId: string,
  namespace: string,
  key: string,
  value: unknown,
  requestedScope: RequestedStorageScope
): Promise<PluginStorageRecord> {
  validateStorageIdentifier(namespace, key);

  const authorization = await authorizePluginRequest({
    installationId,
    organizationId,
    actorId: actorUserId,
    requiredScope: 'plugin.storage:write'
  });
  const installation = authorization.installation;
  await assertDeclaredStorageDocument(installation.pluginVersionId, namespace, requestedScope);

  const normalized = normalizeStorageScope(requestedScope);
  if (normalized === 'owner' && authorization.organizationRole !== 'admin') {
    throw new AppError('Only organization admins can update plugin settings', 'PLUGIN_STORAGE_ADMIN_REQUIRED', 403);
  }

  const payloadString = JSON.stringify(value);
  const payloadBytes = Buffer.byteLength(payloadString, 'utf8');
  if (payloadBytes > MAX_STORAGE_ITEM_BYTES) {
    throw new AppError('Storage item exceeds maximum limit of 256 KiB', 'PAYLOAD_TOO_LARGE', 413);
  }

  const { scopeType, scopeId } = resolveStorageScope(installation, requestedScope, actorUserId);
  const storageBytes = await getPluginStorageUsageBytes(installationId, {
    scopeType,
    scopeId,
    namespace,
    key
  });
  if (storageBytes + payloadBytes > MAX_INSTALLATION_STORAGE_BYTES) {
    throw new AppError('Plugin storage exceeds the 5 MiB installation quota', 'PLUGIN_STORAGE_QUOTA_EXCEEDED', 413);
  }

  await setPluginStorageItem({
    installationId,
    scopeType,
    scopeId,
    namespace,
    key,
    value
  });

  return {
    namespace,
    key,
    value,
    scope: scopeType === 'user' ? 'user' : 'organization'
  };
}

export async function deleteStorageValue(
  installationId: string,
  organizationId: string,
  actorUserId: string,
  namespace: string,
  key: string,
  requestedScope: RequestedStorageScope
): Promise<boolean> {
  validateStorageIdentifier(namespace, key);

  const authorization = await authorizePluginRequest({
    installationId,
    organizationId,
    actorId: actorUserId,
    requiredScope: 'plugin.storage:write'
  });
  const installation = authorization.installation;
  await assertDeclaredStorageDocument(installation.pluginVersionId, namespace, requestedScope);

  const normalized = normalizeStorageScope(requestedScope);
  if (normalized === 'owner' && authorization.organizationRole !== 'admin') {
    throw new AppError('Only organization admins can update plugin settings', 'PLUGIN_STORAGE_ADMIN_REQUIRED', 403);
  }

  const { scopeType, scopeId } = resolveStorageScope(installation, requestedScope, actorUserId);

  return deletePluginStorageItem(installationId, scopeType, scopeId, namespace, key);
}
