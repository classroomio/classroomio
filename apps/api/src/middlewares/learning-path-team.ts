import { Context, Next } from 'hono';

import { handleError } from '@api/utils/errors';
import { assertCanManageLearningPath, resolveLearningPath } from '@api/services/learning-path/learning-path';

/**
 * Ensures the caller can manage the learning path (org ADMIN or assigned TUTOR).
 * Requires authMiddleware first. Resolves `:pathId` and exposes the path as
 * `c.get('learningPath')` so handlers skip their own lookup.
 */
export const learningPathTeamMiddleware = async (c: Context, next: Next) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json(
        {
          success: false,
          error: 'Unauthorized',
          code: 'UNAUTHORIZED'
        },
        401
      );
    }

    const pathId = c.req.param('pathId');
    if (!pathId) {
      return c.json(
        {
          success: false,
          error: 'Learning path ID is required',
          code: 'PATH_ID_REQUIRED'
        },
        400
      );
    }

    const path = await resolveLearningPath(pathId);
    const orgRoles = c.get('orgRoles') as Record<string, number> | undefined;
    await assertCanManageLearningPath(path, user.id, orgRoles);

    c.set('learningPath', path);

    return next();
  } catch (error) {
    return handleError(c, error, 'Failed to verify learning path access');
  }
};
