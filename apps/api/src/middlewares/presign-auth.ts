import type { Context } from 'hono';

import { getAssetOrganizationIdsByStorageKeys } from '@cio/db/queries/assets';
import { resolveFileKeyOwnerOrganizationIds } from '@cio/core/utils/upload';

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
 * Assets that claim a key decide its owner, because an API-created asset's key
 * is `<assetId>/source.<ext>` and only looks organization-prefixed. A key no
 * asset claims falls back to its organization prefix; one with neither has no
 * determinable owner and is allowed through, since exercise submission files
 * are stored by key without an asset row and would otherwise stop downloading.
 *
 * A key registered by more than one organization is only allowed when the
 * caller belongs to all of them — the object behind it is shared, so a partial
 * match is not enough.
 */
export async function findUnauthorizedDownloadKeys(c: Context, keys: string[]): Promise<string[]> {
  const allowedOrgIds = callerOrganizationIds(c);
  const assetOwners = await getAssetOrganizationIdsByStorageKeys(keys);

  return keys.filter((key) => {
    const ownerOrgIds = resolveFileKeyOwnerOrganizationIds(key, assetOwners.get(key));

    return ownerOrgIds.length > 0 && !ownerOrgIds.every((ownerOrgId) => allowedOrgIds.includes(ownerOrgId));
  });
}
