import { Context, Next } from 'hono';

import { ErrorCodes, handleError } from '@api/utils/errors';
import { getMemberByPathAndProfile } from '@cio/db/queries/learning-path';
import { ROLE } from '@cio/utils/constants';
import { resolveLearningPath } from '@api/services/learning-path/learning-path';

/**
 * Ensures the caller is enrolled in the learning path or is an org ADMIN.
 * Requires authMiddleware first. Resolves `:pathId` and exposes the path as
 * `c.get('learningPath')` and the caller's active membership (if any) as
 * `c.get('learningPathMember')`.
 */
export const learningPathMemberMiddleware = async (c: Context, next: Next) => {
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

    if (orgRoles?.[path.organizationId] === ROLE.ADMIN) {
      c.set('learningPath', path);
      c.set('learningPathMember', null);

      return next();
    }

    const member = await getMemberByPathAndProfile(path.id, user.id);

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
