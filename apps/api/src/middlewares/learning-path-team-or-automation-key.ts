import { Context, Next } from 'hono';
import type { TOrganizationApiKeyScope } from '@cio/utils/validation/organization';

import { ErrorCodes, handleError } from '@api/utils/errors';
import { getOrganizationMemberRoleId } from '@cio/db/queries/organization';
import { organizationApiKeyHasScopes } from '@api/services/organization/automation-key';
import { assertCanManageLearningPath, resolveLearningPath } from '@api/services/learning-path/learning-path';
import { learningPathTeamMiddleware } from './learning-path-team';

/**
 * Team management for learning paths, callable by dashboard sessions (org
 * ADMIN or assigned TUTOR via learningPathTeamMiddleware) or by org-scoped
 * automation keys holding the required scopes.
 *
 * Key callers are confined to their own organization's paths and act with
 * their creator's real org role, so route handlers stay unchanged: `actorId`
 * is always set (key creator profile or session user) and `orgRoles` carries
 * that role for the resolved organization. A demoted creator loses admin
 * rights immediately.
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
        const creatorRoleId = await getOrganizationMemberRoleId(automationKey.organizationId, actorId);

        if (creatorRoleId === null) {
          return c.json(
            {
              success: false,
              error: 'Not a member of this organization',
              code: ErrorCodes.UNAUTHORIZED
            },
            403
          );
        }

        c.set('orgRoles', { [automationKey.organizationId]: creatorRoleId });

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

      const creatorRoleId = await getOrganizationMemberRoleId(path.organizationId, actorId);

      if (creatorRoleId === null) {
        return c.json(
          {
            success: false,
            error: 'Not a member of this organization',
            code: ErrorCodes.UNAUTHORIZED
          },
          403
        );
      }

      await assertCanManageLearningPath(path, actorId, { [path.organizationId]: creatorRoleId });

      c.set('orgRoles', { [path.organizationId]: creatorRoleId });
      c.set('learningPath', path);

      await next();
    } catch (error) {
      return handleError(c, error, 'Failed to verify learning path access');
    }
  };
};
