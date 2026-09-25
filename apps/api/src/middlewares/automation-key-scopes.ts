import { Context, Next } from 'hono';
import type { TOrganizationApiKeyScope } from '@cio/utils/validation/organization';

import { ErrorCodes } from '@api/utils/errors';
import { organizationApiKeyHasAnyScope, organizationApiKeyHasScopes } from '@api/services/organization/automation-key';

type ScopeCheck = (keyScopes: string[]) => boolean;

const scopeGuard = (isAllowed: ScopeCheck) => async (c: Context, next: Next) => {
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

  if (!isAllowed(automationKey.scopes ?? [])) {
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

export const automationKeyScopesMiddleware = (requiredScopes: readonly TOrganizationApiKeyScope[] = []) =>
  scopeGuard((keyScopes) => organizationApiKeyHasScopes(keyScopes, requiredScopes));

/**
 * Passes when the key holds at least one of `acceptedScopes`; otherwise 403 (401 without a key).
 */
export const automationKeyAnyScopeMiddleware = (acceptedScopes: readonly TOrganizationApiKeyScope[]) =>
  scopeGuard((keyScopes) => organizationApiKeyHasAnyScope(keyScopes, acceptedScopes));
