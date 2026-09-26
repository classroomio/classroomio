import { Context, Next } from 'hono';
import type { TOrganizationApiKeyScope } from '@cio/utils/validation/organization';

import { ErrorCodes } from '@api/utils/errors';
import { organizationApiKeyHasScopes } from '@api/services/organization/automation-key';
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
 * Every requested key must belong to an organization the caller is in. Keys
 * minted before organization-prefixed keys existed carry no owner, so they are
 * allowed through rather than breaking playback of existing course media.
 */
export function findUnauthorizedDownloadKeys(c: Context, keys: string[]): string[] {
  const allowedOrgIds = (c.get('presignOrgIds') as string[] | undefined) ?? [];

  return keys.filter((key) => {
    const ownerOrgId = readOrganizationIdFromFileKey(key);
    if (!ownerOrgId) return false;

    return !allowedOrgIds.includes(ownerOrgId);
  });
}
