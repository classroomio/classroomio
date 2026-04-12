import { Context, Next } from 'hono';
import type { TOrganizationApiKeyScope } from '@cio/utils/validation/organization';

import { ErrorCodes } from '@api/utils/errors';
import { organizationApiKeyHasScopes } from '@api/services/organization/automation-key';

export const automationKeyScopesMiddleware =
  (requiredScopes: readonly TOrganizationApiKeyScope[] = []) =>
  async (c: Context, next: Next) => {
    const automationKey = c.get('automationKey');

    if (!automationKey) {
      return c.json(
        {
          success: false,
          error: 'Unauthorized',
          code: ErrorCodes.UNAUTHORIZED
        },
        401
      );
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

    return next();
  };
