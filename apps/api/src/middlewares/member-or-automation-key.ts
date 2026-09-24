import { Context, Next } from 'hono';
import type { TOrganizationApiKeyScope } from '@cio/utils/validation/organization';

import { ErrorCodes } from '@api/utils/errors';
import { ROLE } from '@cio/utils/constants';
import { organizationApiKeyHasScopes } from '@api/services/organization/automation-key';

export const memberOrAutomationKeyMiddleware =
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

      c.set('orgId', automationKey.organizationId);
      c.set('actorId', automationKey.createdByProfileId);

      return next();
    }

    const user = c.get('user');
    if (!user) {
      return c.json({ success: false, error: 'Unauthorized', code: ErrorCodes.UNAUTHORIZED }, 401);
    }

    const requestedOrgId = c.req.header('cio-org-id');
    const orgRoles = (c.get('orgRoles') as Record<string, number> | undefined) ?? {};
    const requestedOrgRole = requestedOrgId ? orgRoles[requestedOrgId] : undefined;
    const isOrgTeamMember = requestedOrgRole === ROLE.ADMIN || requestedOrgRole === ROLE.TUTOR;

    c.set('orgId', isOrgTeamMember ? requestedOrgId : null);
    c.set('actorId', user.id);

    return next();
  };
