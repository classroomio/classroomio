import { Context, Next } from 'hono';

import { handleError } from '@api/utils/errors';
import { assertCanManageLearningPath } from '@api/services/learning-path/learning-path';
import { requireLearningPathContext } from './learning-path-context';

/**
 * Ensures the caller can manage the learning path (org ADMIN or assigned TUTOR).
 * Requires authMiddleware first. Resolves `:pathId` and exposes the path as
 * `c.get('learningPath')` so handlers skip their own lookup.
 */
export const learningPathTeamMiddleware = async (c: Context, next: Next) => {
  try {
    const resolved = await requireLearningPathContext(c);

    if ('response' in resolved) {
      return resolved.response;
    }

    const { context } = resolved;
    const { path, orgRoles, userId } = context;

    await assertCanManageLearningPath(path, userId, orgRoles);

    c.set('learningPath', path);

    return next();
  } catch (error) {
    return handleError(c, error, 'Failed to verify learning path access');
  }
};
