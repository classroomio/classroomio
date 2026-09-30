import { Context, Next } from 'hono';
import type { TOrganizationApiKeyScope } from '@cio/utils/validation/organization';

import { ROLE } from '@cio/utils/constants';
import { ErrorCodes, handleError } from '@api/utils/errors';
import { organizationApiKeyHasScopes } from '@api/services/organization/automation-key';
import { resolveLearningPath } from '@api/services/learning-path/learning-path';
import { learningPathTeamMiddleware } from './learning-path-team';

/**
 * Team management for learning paths, callable by dashboard sessions (org
 * ADMIN or assigned TUTOR via learningPathTeamMiddleware) or by org-scoped
 * automation keys holding the required scopes.
 *
 * Key callers are confined to their own organization's paths and act with
 * admin-equivalent team rights, so route handlers stay unchanged: `actorId`
 * is always set (key creator profile or session user) and `orgRoles` carries
 * ADMIN for the resolved organization.
 *
 * Requires authOrAutomationKeyMiddleware first. Pass `{ team: false }` for
 * collection routes (list/create) that carry no `:pathId` and enforce their
 * own admin checks in the service layer.
 */
export const learningPathTeamOrAutomationKeyMiddleware = (
  requiredScopes: readonly TOrganizationApiKeyScope[] = [],
  options: { team?: boolean } = {}
) => {
  const { team = true } = options;

  return async (c: Context, next: Next) => {
    const automationKey = c.get('automationKey');

    if (!automationKey) {
      const user = c.get('user') as { id: string } | null;

      if (user) {
        c.set('actorId', user.id);
      }

      if (!team) {
        return next();
      }

      return learningPathTeamMiddleware(c, next);
    }

    try {
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

      const actorId = automationKey.createdByProfileId;
      c.set('orgId', automationKey.organizationId);
      c.set('actorId', actorId);

      if (!team) {
        c.set('orgRoles', { [automationKey.organizationId]: ROLE.ADMIN });

        await next();
        return;
      }

      const path = await resolveLearningPath(c.req.param('pathId'));

      if (path.organizationId !== automationKey.organizationId) {
        return c.json(
          {
            success: false,
            error: 'Learning path not found',
            code: ErrorCodes.LEARNING_PATH_NOT_FOUND
          },
          404
        );
      }

      c.set('orgRoles', { [path.organizationId]: ROLE.ADMIN });
      c.set('learningPath', path);

      await next();
    } catch (error) {
      return handleError(c, error, 'Failed to verify learning path access');
    }
  };
};
