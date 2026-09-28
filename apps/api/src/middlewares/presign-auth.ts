import type { Context } from 'hono';

import { getAssetOrganizationIdsByStorageKeys, getCopiedAssetSourceOrganizationIds } from '@cio/db/queries/assets';
import { readOrganizationIdFromFileKey } from '@cio/core/utils/upload';

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
 * Ownership comes from the key's organization prefix where present. Keys minted
 * before that prefix existed are resolved through the asset table instead; one
 * that no asset claims has no determinable owner and is allowed through, since
 * exercise submission files are stored by key without an asset row and would
 * otherwise stop downloading.
 *
 * A legacy key registered by more than one organization is only allowed when the
 * caller belongs to all of them — the object behind it is shared, so a partial
 * match is not enough.
 *
 * A server-made copy of an asset (a course cloned from another org's template)
 * lends the caller's org the access of the org it was copied from, for that key
 * only. Clients cannot set a copy's source org, so this never widens access past
 * what the original org already had.
 */
export async function findUnauthorizedDownloadKeys(c: Context, keys: string[]): Promise<string[]> {
  const callerOrgIds = callerOrganizationIds(c);
  const legacyKeys = keys.filter((key) => !readOrganizationIdFromFileKey(key));
  const legacyOwners =
    legacyKeys.length > 0 ? await getAssetOrganizationIdsByStorageKeys(legacyKeys) : new Map<string, string[]>();

  const isAllowed = (key: string, allowedOrgIds: string[]) => {
    const prefixOrgId = readOrganizationIdFromFileKey(key);
    if (prefixOrgId) return allowedOrgIds.includes(prefixOrgId);

    const ownerOrgIds = legacyOwners.get(key) ?? [];
    return ownerOrgIds.every((ownerOrgId) => allowedOrgIds.includes(ownerOrgId));
  };

  const deniedKeys = keys.filter((key) => !isAllowed(key, callerOrgIds));
  if (deniedKeys.length === 0) return [];

  const copySources = await getCopiedAssetSourceOrganizationIds(deniedKeys, callerOrgIds);

  return deniedKeys.filter((key) => {
    const copySourceOrgIds = copySources.get(key) ?? [];
    return !isAllowed(key, [...callerOrgIds, ...copySourceOrgIds]);
  });
}
