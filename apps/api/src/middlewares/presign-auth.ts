import { Context, Next } from 'hono';
import type { TOrganizationApiKeyScope } from '@cio/utils/validation/organization';

import { ErrorCodes } from '@api/utils/errors';
import { organizationApiKeyHasScopes } from '@api/services/organization/automation-key';
import { getAssetOrganizationIdsByStorageKeys } from '@cio/db/queries/assets';
import { readOrganizationIdFromFileKey } from '@cio/core/utils/upload';

/**
 * Presign routes are reachable by two very different callers, and the split
 * matters: automation keys are scope-gated, while browser sessions are only
 * required to be signed in. Students presign uploads and downloads as part of
 * normal course use — exercise submissions, video answers, raw MP4 playback —
 * so gating sessions on an org role here would lock them out.
 */
export const presignAuthMiddleware =
  (requiredScopes: readonly TOrganizationApiKeyScope[] = []) =>
  async (c: Context, next: Next) => {
    const automationKey = c.get('automationKey');

    if (automationKey) {
      if (!organizationApiKeyHasScopes(automationKey.scopes ?? [], requiredScopes)) {
        return c.json(
          { success: false, error: 'Automation key is missing required scopes', code: ErrorCodes.FORBIDDEN },
          403
        );
      }

      c.set('presignOrgIds', [automationKey.organizationId]);
      c.set('presignUploadOrgId', automationKey.organizationId);

      return next();
    }

    const orgRoles = (c.get('orgRoles') as Record<string, number> | undefined) ?? {};
    const memberOrgIds = Object.keys(orgRoles);
    const requestedOrgId = c.req.header('cio-org-id');

    c.set('presignOrgIds', memberOrgIds);
    c.set('presignUploadOrgId', requestedOrgId && memberOrgIds.includes(requestedOrgId) ? requestedOrgId : undefined);

    return next();
  };

/**
 * Every requested key must belong to an organization the caller is in.
 *
 * Ownership comes from the key's organization prefix where present. Keys minted
 * before that prefix existed are resolved through the asset table instead; one
 * that no asset claims has no determinable owner and is allowed through, since
 * exercise submission files are stored by key without an asset row and would
 * otherwise stop downloading.
 *
 * A legacy key registered by more than one organization is only allowed when
 * the caller belongs to all of them — the object behind it is shared, so a
 * partial match is not enough.
 */
export async function findUnauthorizedDownloadKeys(c: Context, keys: string[]): Promise<string[]> {
  const allowedOrgIds = (c.get('presignOrgIds') as string[] | undefined) ?? [];

  const prefixedKeys: string[] = [];
  const legacyKeys: string[] = [];

  for (const key of keys) {
    (readOrganizationIdFromFileKey(key) ? prefixedKeys : legacyKeys).push(key);
  }

  const unauthorizedKeys = prefixedKeys.filter((key) => {
    const ownerOrgId = readOrganizationIdFromFileKey(key)!;

    return !allowedOrgIds.includes(ownerOrgId);
  });

  if (legacyKeys.length === 0) {
    return unauthorizedKeys;
  }

  const legacyOwners = await getAssetOrganizationIdsByStorageKeys(legacyKeys);
  for (const key of legacyKeys) {
    const ownerOrgIds = legacyOwners.get(key) ?? [];
    if (ownerOrgIds.length > 0 && !ownerOrgIds.every((ownerOrgId) => allowedOrgIds.includes(ownerOrgId))) {
      unauthorizedKeys.push(key);
    }
  }

  return unauthorizedKeys;
}
