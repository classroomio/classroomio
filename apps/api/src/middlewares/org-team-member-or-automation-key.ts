import { Context, Next } from 'hono';
import type { TOrganizationApiKeyScope } from '@cio/utils/validation/organization';

import { ErrorCodes } from '@api/utils/errors';
import { ROLE } from '@cio/utils/constants';
import { organizationApiKeyHasScopes } from '@api/services/organization/automation-key';

export const orgTeamMemberOrAutomationKeyMiddleware =
  (requiredScopes: readonly TOrganizationApiKeyScope[] = []) =>
  async (c: Context, next: Next) => {
    try {
      const automationKey = c.get('automationKey');

      if (automationKey) {
        if (!organizationApiKeyHasScopes(automationKey.scopes ?? [], requiredScopes)) {
          return c.json(
            {
              success: false,
              error: 'Automation key is missing required scopes',
              code: ErrorCodes.FORBIDDEN
            },
            403
          );
        }

        c.set('orgId', automationKey.organizationId);
        c.set('actorId', automationKey.createdByProfileId);

        await next();
        return;
      }

      const user = c.get('user');
      if (!user) {
        return c.json(
          {
            success: false,
            error: 'Unauthorized',
            code: ErrorCodes.UNAUTHORIZED
          },
          401
        );
      }

      const orgId = c.req.header('cio-org-id');

      if (!orgId) {
        return c.json(
          {
            success: false,
            error: 'Organization ID is required',
            code: 'ORG_ID_REQUIRED'
          },
          400
        );
      }

      const orgRoles = (c.get('orgRoles') as Record<string, number> | undefined) ?? {};
      const roleId = orgRoles[orgId];

      if (roleId !== ROLE.ADMIN && roleId !== ROLE.TUTOR) {
        return c.json(
          {
            success: false,
            error: 'Only organization team members (admins or tutors) can perform this action',
            code: ErrorCodes.ORG_TEAM_NOT_AUTHORIZED
          },
          403
        );
      }

      c.set('orgId', orgId);
      c.set('actorId', user.id);

      await next();
    } catch (error) {
      console.error('Error in orgTeamMemberOrAutomationKeyMiddleware:', error);
      return c.json(
        {
          success: false,
          error: 'Failed to verify organization team member status',
          code: 'ORG_TEAM_MEMBER_CHECK_FAILED'
        },
        500
      );
    }
  };
