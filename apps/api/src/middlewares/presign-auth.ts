import type { Context } from 'hono';

import { getAssetOrganizationIdsByAssetIds, getAssetOrganizationIdsByStorageKeys } from '@cio/db/queries/assets';
import { readOrganizationIdFromFileKey, resolveFileKeyOwnerOrganizationIds } from '@cio/core/utils/upload';

/**
 * Presign routes are session-only. Students presign uploads and downloads during
 * normal course use — exercise submissions, video answers, raw video playback —
 * so these helpers authorize by organization membership, never by role.
 *
 * Automation keys are deliberately not accepted here. The automation surface is
 * `/public-api/v1`, which applies CORS, rate limiting, scope checks and usage
 * metering that these in-app routes do not.
 */
function callerOrganizationIds(c: Context): string[] {
  return Object.keys((c.get('orgRoles') as Record<string, number> | undefined) ?? {});
}

/**
 * Organization that new upload keys are prefixed with, so ownership can later be
 * read off the key. Undefined when the caller named no organization, or named one
 * they do not belong to — the key is then minted without a prefix.
 */
export function resolveUploadOrganizationId(c: Context): string | undefined {
  const requestedOrgId = c.req.header('cio-org-id');
  if (!requestedOrgId) return undefined;

  return callerOrganizationIds(c).includes(requestedOrgId) ? requestedOrgId : undefined;
}

/**
 * Every requested key must belong to an organization the caller is in.
 *
 * A key's `<uuid>/` prefix is either an organization id or, for assets the
 * public API created, the id of the asset itself; an existing asset with that
 * id decides the owner, otherwise the prefix is the organization. Callers can
 * register any key on their own assets, so asset claims on a key only decide
 * keys with no prefix. A key with neither has no determinable owner and is
 * allowed through, since exercise submission files are stored by key without
 * an asset row and would otherwise stop downloading.
 *
 * An unprefixed key registered by more than one organization is only allowed
 * when the caller belongs to all of them — the object behind it is shared, so
 * a partial match is not enough.
 */
export async function findUnauthorizedDownloadKeys(c: Context, keys: string[]): Promise<string[]> {
  const allowedOrgIds = callerOrganizationIds(c);
  const prefixes = keys.flatMap((key) => readOrganizationIdFromFileKey(key) ?? []);
  const unprefixedKeys = keys.filter((key) => !readOrganizationIdFromFileKey(key));
  const prefixAssetOwners = await getAssetOrganizationIdsByAssetIds(prefixes);
  const claimingOwners = await getAssetOrganizationIdsByStorageKeys(unprefixedKeys);

  return keys.filter((key) => {
    const prefix = readOrganizationIdFromFileKey(key);
    const ownerOrgIds = resolveFileKeyOwnerOrganizationIds(key, {
      prefixAssetOrganizationId: prefix ? prefixAssetOwners.get(prefix) : undefined,
      claimingOrganizationIds: claimingOwners.get(key)
    });

    return ownerOrgIds.length > 0 && !ownerOrgIds.every((ownerOrgId) => allowedOrgIds.includes(ownerOrgId));
  });
}
