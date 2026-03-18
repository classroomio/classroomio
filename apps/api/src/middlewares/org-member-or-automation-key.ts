import { Context, Next } from 'hono';
import type { TOrganizationApiKeyScope } from '@cio/utils/validation/organization';

import { ErrorCodes } from '@api/utils/errors';
import { organizationApiKeyHasScopes } from '@api/services/organization/automation-key';
import { orgMemberMiddleware } from './org-member';

export const orgMemberOrAutomationKeyMiddleware =
  (requiredScopes: readonly TOrganizationApiKeyScope[] = []) =>
  async (c: Context, next: Next) => {
    try {
      const automationKey = c.get('automationKey');

      if (!automationKey) {
        return orgMemberMiddleware(c, next);
      }

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
      c.set('userRole', null);
      c.set('actorId', automationKey.createdByProfileId);

      return next();
    } catch (error) {
      console.error('Error in orgMemberOrAutomationKeyMiddleware:', error);
      return c.json(
        {
          success: false,
          error: 'Failed to verify organization membership',
          code: 'ORG_MEMBER_CHECK_FAILED'
        },
        500
      );
    }
  };
