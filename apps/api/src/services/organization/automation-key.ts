import type {
  TCreateOrganizationApiKey,
  TListOrganizationApiKeysQuery,
  TOrganizationApiKeyScope,
  TOrganizationApiKeyType
} from '@cio/utils/validation/organization';
import type { TOrganizationApiKey } from '@db/types';
import { createHash, randomBytes } from 'crypto';

import { AppError, ErrorCodes } from '@api/utils/errors';
import {
  createOrganizationApiKey,
  getActiveOrganizationApiKeyByHash,
  getOrganizationApiKeyById,
  listOrganizationApiKeys,
  updateOrganizationApiKey
} from '@cio/db/queries/organization';

const DEFAULT_SCOPES: Record<TOrganizationApiKeyType, TOrganizationApiKeyScope[]> = {
  mcp: [
    'course_import:draft:create',
    'course_import:draft:read',
    'course_import:draft:update',
    'course_import:draft:publish'
  ],
  api: ['public_api:*'],
  zapier: ['public_api:*']
};

function getDefaultLabel(type: TOrganizationApiKeyType) {
  switch (type) {
    case 'mcp':
      return 'MCP key';
    case 'api':
      return 'API key';
    case 'zapier':
      return 'Zapier key';
  }
}

function generateOrganizationApiKeySecret(type: TOrganizationApiKeyType) {
  return `cio_${type}_${randomBytes(24).toString('base64url')}`;
}

function hashSecret(secret: string) {
  return createHash('sha256').update(secret).digest('hex');
}

function getSecretPrefix(secret: string) {
  return secret.slice(0, 16);
}

function isExpired(expiresAt: string | null) {
  return Boolean(expiresAt && new Date(expiresAt).getTime() <= Date.now());
}

export type OrganizationApiKeySummary = Omit<TOrganizationApiKey, 'secretHash'>;

function sanitizeOrganizationApiKey(key: TOrganizationApiKey): OrganizationApiKeySummary {
  const { secretHash: _secretHash, ...rest } = key;
  return rest;
}

export function organizationApiKeyHasScopes(
  keyScopes: string[],
  requiredScopes: readonly TOrganizationApiKeyScope[]
): boolean {
  if (requiredScopes.length === 0) {
    return true;
  }

  const scopeSet = new Set(keyScopes);
  return requiredScopes.every((scope) => scopeSet.has(scope));
}

export async function listOrganizationApiKeysService(
  organizationId: string,
  query: TListOrganizationApiKeysQuery
): Promise<OrganizationApiKeySummary[]> {
  const keys = await listOrganizationApiKeys(organizationId, query.type);
  return keys.map(sanitizeOrganizationApiKey);
}

export async function createOrganizationApiKeyService(
  organizationId: string,
  createdByProfileId: string,
  payload: TCreateOrganizationApiKey
): Promise<{ key: OrganizationApiKeySummary; secret: string }> {
  const secret = generateOrganizationApiKeySecret(payload.type);
  const key = await createOrganizationApiKey({
    organizationId,
    createdByProfileId,
    type: payload.type,
    label: payload.label?.trim() || getDefaultLabel(payload.type),
    secretPrefix: getSecretPrefix(secret),
    secretHash: hashSecret(secret),
    scopes: payload.scopes ?? DEFAULT_SCOPES[payload.type],
    expiresAt: payload.expiresAt ?? null
  });

  return {
    key: sanitizeOrganizationApiKey(key),
    secret
  };
}

export async function revokeOrganizationApiKeyService(organizationId: string, keyId: string) {
  const existing = await getOrganizationApiKeyById(organizationId, keyId);
  if (!existing) {
    throw new AppError('Organization API key not found', ErrorCodes.ORGANIZATION_API_KEY_NOT_FOUND, 404);
  }

  const updated = await updateOrganizationApiKey(organizationId, keyId, {
    revokedAt: new Date().toISOString()
  });

  if (!updated) {
    throw new AppError('Failed to revoke organization API key', ErrorCodes.ORGANIZATION_API_KEY_REVOKE_FAILED, 500);
  }

  return sanitizeOrganizationApiKey(updated);
}

export async function rotateOrganizationApiKeyService(organizationId: string, keyId: string) {
  const existing = await getOrganizationApiKeyById(organizationId, keyId);
  if (!existing) {
    throw new AppError('Organization API key not found', ErrorCodes.ORGANIZATION_API_KEY_NOT_FOUND, 404);
  }

  const secret = generateOrganizationApiKeySecret(existing.type);
  const updated = await updateOrganizationApiKey(organizationId, keyId, {
    secretPrefix: getSecretPrefix(secret),
    secretHash: hashSecret(secret),
    revokedAt: null,
    lastUsedAt: null
  });

  if (!updated) {
    throw new AppError('Failed to rotate organization API key', ErrorCodes.ORGANIZATION_API_KEY_ROTATE_FAILED, 500);
  }

  return {
    key: sanitizeOrganizationApiKey(updated),
    secret
  };
}

export async function authenticateOrganizationApiKeyService(rawSecret: string): Promise<TOrganizationApiKey> {
  const key = await getActiveOrganizationApiKeyByHash(hashSecret(rawSecret));

  if (!key) {
    throw new AppError('Invalid organization API key', ErrorCodes.UNAUTHORIZED, 401);
  }

  if (isExpired(key.expiresAt ?? null)) {
    throw new AppError('Organization API key has expired', ErrorCodes.UNAUTHORIZED, 401);
  }

  return key;
}

export async function touchOrganizationApiKeyLastUsedService(key: TOrganizationApiKey): Promise<void> {
  await updateOrganizationApiKey(key.organizationId, key.id, {
    lastUsedAt: new Date().toISOString()
  });
}
