import { Context, Next } from 'hono';
import type { TOrganizationApiKeyScope } from '@cio/utils/validation/organization';

import { ErrorCodes } from '@api/utils/errors';
import { organizationApiKeyHasScopes } from '@api/services/organization/automation-key';

const COHORT_PATH = /^(?:\/public-api\/v1)?\/cohorts(?:\/|$)/;
const ANALYTICS_PATH = /^(?:\/public-api\/v1)?(?:\/analytics|\/courses\/[^/]+\/analytics)(?:\/|$)/;

export function getPublicApiRouteScope(method: string, path: string): TOrganizationApiKeyScope | null {
  const isRead = method === 'GET' || method === 'HEAD';

  if (COHORT_PATH.test(path)) {
    return isRead ? 'cohort:read' : 'cohort:write';
  }

  if (ANALYTICS_PATH.test(path) && isRead) {
    return 'analytics:read';
  }

  return null;
}

// public_api:* opens every route; a route-level scope opens only the routes mapped above.
export const publicApiScopesMiddleware = async (c: Context, next: Next) => {
  const automationKey = c.get('automationKey');

  if (!automationKey) {
    return c.json({ success: false, error: 'Unauthorized', code: ErrorCodes.UNAUTHORIZED }, 401);
  }

  const keyScopes = automationKey.scopes ?? [];
  const routeScope = getPublicApiRouteScope(c.req.method, c.req.path);
  const allowed =
    organizationApiKeyHasScopes(keyScopes, ['public_api:*']) ||
    (routeScope !== null && organizationApiKeyHasScopes(keyScopes, [routeScope]));

  if (!allowed) {
    return c.json(
      { success: false, error: 'Automation key is missing required scopes', code: ErrorCodes.FORBIDDEN },
      403
    );
  }

  return next();
};
