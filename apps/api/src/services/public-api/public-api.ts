import { AppError, ErrorCodes } from '@api/utils/errors';
import crypto from 'node:crypto';
import {
  createApiKey as createApiKeyQuery,
  getApiKeysByOrganizationId,
  getApiKeyByHash,
  revokeApiKey as revokeApiKeyQuery,
  updateLastUsed
} from '@cio/db/queries/public-api';
import type { TNewApiKey } from '@cio/db/types';

/**
 * Generates a secure random API key with the format: cio_live_<random_string>
 * The key is 48 characters total (cio_live_ prefix + 40 random chars)
 * @returns Raw API key string
 */
function generateApiKey(): string {
  // Generate 30 random bytes (will become 40 base64url chars)
  const randomBytes = crypto.randomBytes(30);
  const randomString = randomBytes.toString('base64url');
  return `cio_live_${randomString}`;
}

/**
 * Hashes an API key using SHA-256
 * @param apiKey - The raw API key to hash
 * @returns Hex-encoded hash
 */
function hashApiKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

/**
 * Generates a key prefix for display purposes
 * Shows first 12 characters of the key (e.g., "cio_live_abc")
 * @param apiKey - The raw API key
 * @returns Key prefix for display
 */
function generateKeyPrefix(apiKey: string): string {
  return apiKey.substring(0, 12);
}

/**
 * Creates a new API key for an organization
 * Returns the raw key (only shown once) and key metadata
 *
 * @param organizationId - The organization ID
 * @param createdBy - The user ID creating the key
 * @param name - Optional name for the key (defaults to 'Default')
 * @returns Object with raw key and key metadata
 */
export async function createApiKey(organizationId: string, createdBy: string, name: string = 'Default') {
  try {
    // Generate raw API key
    const rawKey = generateApiKey();
    const keyHash = hashApiKey(rawKey);
    const keyPrefix = generateKeyPrefix(rawKey);

    // Create key record in database
    const apiKeyData: TNewApiKey = {
      organizationId,
      keyHash,
      keyPrefix,
      name,
      createdByProfileId: createdBy,
      isRevoked: false
    };

    const createdKey = await createApiKeyQuery(apiKeyData);

    if (!createdKey) {
      throw new AppError('Failed to create API key', ErrorCodes.API_KEY_CREATE_FAILED, 500);
    }

    // Return raw key (only time it's shown) and metadata
    return {
      rawKey, // IMPORTANT: Only shown once on creation
      keyId: createdKey.id,
      keyPrefix: createdKey.keyPrefix,
      name: createdKey.name,
      createdAt: createdKey.createdAt
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to create API key',
      ErrorCodes.API_KEY_CREATE_FAILED,
      500
    );
  }
}

/**
 * Lists all API keys for an organization
 * Returns safe metadata only (no hashes or raw keys)
 *
 * @param organizationId - The organization ID
 * @returns Array of API key metadata
 */
export async function listApiKeys(organizationId: string) {
  try {
    const apiKeys = await getApiKeysByOrganizationId(organizationId);

    // Return safe fields only
    return apiKeys.map((key) => ({
      id: key.id,
      keyPrefix: key.keyPrefix,
      name: key.name,
      lastUsedAt: key.lastUsedAt,
      expiresAt: key.expiresAt,
      isRevoked: key.isRevoked,
      createdAt: key.createdAt
    }));
  } catch (error) {
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to list API keys',
      ErrorCodes.API_KEY_LIST_FAILED,
      500
    );
  }
}

/**
 * Validates an API key for authentication
 * Hashes the raw key, looks it up, checks revocation/expiration
 * Updates last used timestamp on successful validation
 *
 * @param rawApiKey - The raw API key from Authorization header
 * @returns Validated API key object with organization ID
 * @throws AppError if key is invalid, revoked, expired, or not found
 */
export async function validateApiKey(rawApiKey: string) {
  // Validate basic key format
  if (!rawApiKey.startsWith('cio_live_')) {
    throw new AppError('Invalid API key format', ErrorCodes.API_KEY_NOT_FOUND, 401);
  }

  // Hash the raw key for lookup
  const keyHash = hashApiKey(rawApiKey);

  // Look up the API key
  const apiKey = await getApiKeyByHash(keyHash);

  if (!apiKey) {
    throw new AppError('API key not found', ErrorCodes.API_KEY_NOT_FOUND, 401);
  }

  // Check if key is revoked
  if (apiKey.isRevoked) {
    throw new AppError('API key has been revoked', ErrorCodes.API_KEY_ALREADY_REVOKED, 401);
  }

  // Check if key has expired
  if (apiKey.expiresAt && new Date() > new Date(apiKey.expiresAt)) {
    throw new AppError('API key has expired', ErrorCodes.API_KEY_NOT_FOUND, 401);
  }

  // Update last used timestamp (async, don't block on failure)
  updateLastUsed(keyHash).catch((error) => {
    console.error('Failed to update API key last used timestamp:', error);
  });

  return apiKey;
}

/**
 * Revokes an API key by its ID
 * Validates that the key belongs to the organization before revoking
 *
 * @param keyId - The API key ID to revoke
 * @param organizationId - The organization ID (for authorization check)
 */
export async function revokeApiKey(keyId: string, organizationId: string) {
  try {
    // First, get all org keys to verify ownership
    const orgKeys = await getApiKeysByOrganizationId(organizationId);
    const keyToRevoke = orgKeys.find((key) => key.id === keyId);

    if (!keyToRevoke) {
      throw new AppError(
        'API key not found or does not belong to this organization',
        ErrorCodes.API_KEY_NOT_FOUND,
        404
      );
    }

    if (keyToRevoke.isRevoked) {
      throw new AppError('API key is already revoked', ErrorCodes.API_KEY_ALREADY_REVOKED, 400);
    }

    // Revoke the key using its hash
    await revokeApiKeyQuery(keyToRevoke.keyHash);

    return { success: true, message: 'API key revoked successfully' };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to revoke API key',
      ErrorCodes.API_KEY_REVOKE_FAILED,
      500
    );
  }
}
