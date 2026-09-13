import { Context, Next } from 'hono';
import type { TOrganizationApiKeyScope } from '@cio/utils/validation/organization';

import { ErrorCodes } from '@api/utils/errors';
import { organizationApiKeyHasScopes } from '@api/services/organization/automation-key';

/**
 * Scope-gates automation-key callers on a route that also accepts a plain session,
 * without requiring org context from session callers. Pair with `authOrAutomationKeyMiddleware`.
 *
 * Unlike `automationKeyScopesMiddleware`, this does not 401 when there's no automation key:
 * `authOrAutomationKeyMiddleware` sets `automationKey` to `null` for session callers, and this
 * middleware treats that as "already authenticated, nothing more to check" rather than an error,
 * so it doesn't change behavior for existing session-based callers.
 */
export const automationKeyScopeOrSessionMiddleware =
  (requiredScopes: readonly TOrganizationApiKeyScope[] = []) =>
  async (c: Context, next: Next) => {
    const automationKey = c.get('automationKey');

    if (automationKey && !organizationApiKeyHasScopes(automationKey.scopes ?? [], requiredScopes)) {
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
