import { Context, Next } from 'hono';

import { ErrorCodes, handleError } from '@api/utils/errors';
import { getMemberByPathAndProfile } from '@cio/db/queries/learning-path';
import { ROLE } from '@cio/utils/constants';
import { requireLearningPathContext } from './learning-path-context';

/**
 * Ensures the caller is enrolled in the learning path or is an org ADMIN.
 * Requires authMiddleware first. Resolves `:pathId` and exposes the path as
 * `c.get('learningPath')` and the caller's active membership (if any) as
 * `c.get('learningPathMember')`.
 */
export const learningPathMemberMiddleware = async (c: Context, next: Next) => {
  try {
    const resolved = await requireLearningPathContext(c);

    if ('response' in resolved) {
      return resolved.response;
    }

    const { context } = resolved;
    const { path, orgRoles, userId } = context;

    if (orgRoles?.[path.organizationId] === ROLE.ADMIN) {
      c.set('learningPath', path);
      c.set('learningPathMember', null);

      return next();
    }

    const member = await getMemberByPathAndProfile(path.id, userId);

    if (!member) {
      return c.json(
        {
          success: false,
          error: 'You must be a member of this learning path to perform this action',
          code: ErrorCodes.UNAUTHORIZED
        },
        403
      );
    }

    c.set('learningPath', path);
    c.set('learningPathMember', member);

    return next();
  } catch (error) {
    return handleError(c, error, 'Failed to verify learning path membership');
  }
};
