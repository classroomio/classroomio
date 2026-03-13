import { Context, Next } from 'hono';
import type { TOrganizationApiKeyScope } from '@cio/utils/validation/organization';

import { ErrorCodes } from '@api/utils/errors';
import { isUserOrgAdmin } from '@cio/db/queries/organization';
import { organizationApiKeyHasScopes } from '@api/services/organization/automation-key';

export const orgAdminOrAutomationKeyMiddleware =
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

      const isAdmin = await isUserOrgAdmin(orgId, user.id);
      if (!isAdmin) {
        return c.json(
          {
            success: false,
            error: 'Only organization admins can perform this action',
            code: ErrorCodes.ORG_TEAM_NOT_AUTHORIZED
          },
          403
        );
      }

      c.set('orgId', orgId);
      c.set('actorId', user.id);

      await next();
    } catch (error) {
      console.error('Error in orgAdminOrAutomationKeyMiddleware:', error);
      return c.json(
        {
          success: false,
          error: 'Failed to verify organization admin status',
          code: 'ORG_ADMIN_CHECK_FAILED'
        },
        500
      );
    }
  };
