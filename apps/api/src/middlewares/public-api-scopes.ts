import { Context, Next } from 'hono';
import type { TOrganizationApiKeyScope } from '@cio/utils/validation/organization';

import { ErrorCodes } from '@api/utils/errors';
import { organizationApiKeyHasScopes } from '@api/services/organization/automation-key';

const COHORT_PATH = /^(?:\/public-api\/v1)?\/cohorts(?:\/|$)/;
const COURSE_STUDENT_PATH = /^(?:\/public-api\/v1)?\/courses\/[^/]+\/members\/[^/]+\/(?:lessons|exercises)(?:\/|$)/;
const COURSE_MEMBER_PATH = /^(?:\/public-api\/v1)?\/courses\/[^/]+\/(?:members|invites)(?:\/|$)/;
const COURSE_CERTIFICATE_PATH = /^(?:\/public-api\/v1)?\/courses\/[^/]+\/certificates?(?:\/|$)/;
const COURSE_CONTENT_PATH = /^(?:\/public-api\/v1)?\/courses\/[^/]+\/(?:sections|lessons|content)(?:\/|$)/;
const COURSE_CLONE_PATH = /^(?:\/public-api\/v1)?\/courses\/[^/]+\/clone\/?$/;
const COURSE_EXERCISE_PATH = /^(?:\/public-api\/v1)?\/(?:courses\/[^/]+\/exercises|exercise-templates)(?:\/|$)/;
const COURSE_SUBMISSION_PATH = /^(?:\/public-api\/v1)?\/courses\/[^/]+\/(?:submissions|marks)(?:\/|$)/;
const COURSE_TEMPLATE_PATH = /^(?:\/public-api\/v1)?(?:\/course-templates|\/courses\/[^/]+\/template)(?:\/|$)/;
const AUDIENCE_PATH = /^(?:\/public-api\/v1)?\/audience(?:\/|$)/;
const TEAM_PATH = /^(?:\/public-api\/v1)?\/team(?:\/|$)/;
const ORGANIZATION_PATH = /^(?:\/public-api\/v1)?\/organization(?:\/|$)/;
const ANALYTICS_PATH = /^(?:\/public-api\/v1)?(?:\/analytics|\/courses\/[^/]+\/analytics)(?:\/|$)/;
const MEDIA_PATH = /^(?:\/public-api\/v1)?\/assets(?:\/|$)/;

export function getPublicApiRouteScope(method: string, path: string): TOrganizationApiKeyScope | null {
  const isRead = method === 'GET' || method === 'HEAD';

  if (COHORT_PATH.test(path)) {
    return isRead ? 'cohort:read' : 'cohort:write';
  }

  if (AUDIENCE_PATH.test(path)) {
    return isRead ? 'audience:read' : 'audience:write';
  }

  if (TEAM_PATH.test(path)) {
    return isRead ? 'team:read' : 'team:write';
  }

  if (ORGANIZATION_PATH.test(path)) {
    return isRead ? 'organization:read' : 'organization:write';
  }

  if (ANALYTICS_PATH.test(path) && isRead) {
    return 'analytics:read';
  }

  if (COURSE_STUDENT_PATH.test(path)) {
    return 'course:student:write';
  }

  if (COURSE_MEMBER_PATH.test(path)) {
    return method === 'GET' || method === 'HEAD' ? 'course:member:read' : 'course:member:write';
  }

  if (COURSE_CERTIFICATE_PATH.test(path)) {
    return method === 'GET' || method === 'HEAD' ? 'course:certificate:read' : 'course:certificate:write';
  }

  if (COURSE_CONTENT_PATH.test(path) || COURSE_TEMPLATE_PATH.test(path)) {
    return method === 'GET' || method === 'HEAD' ? 'course:read' : 'course:write';
  }

  if (COURSE_CLONE_PATH.test(path)) {
    return isRead ? null : 'course:write';
  }

  // Only writes are mapped: there is no read route on this family yet, so a GET
  // falls through to null and is refused rather than opened by a write scope.
  if (MEDIA_PATH.test(path)) {
    return method === 'GET' || method === 'HEAD' ? null : 'media:write';
  }

  if (COURSE_EXERCISE_PATH.test(path)) {
    return method === 'GET' || method === 'HEAD' ? 'course:exercise:read' : 'course:exercise:write';
  }

  if (COURSE_SUBMISSION_PATH.test(path)) {
    return method === 'GET' || method === 'HEAD' ? 'course:submission:read' : 'course:submission:write';
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
