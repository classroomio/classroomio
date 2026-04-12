import { Context, Next } from 'hono';

import { ErrorCodes } from '@api/utils/errors';
import { isOrgAdminByProgramId, isProgramMember } from '@cio/db/queries/program';

/**
 * Middleware to check if the authenticated user is a member of the program
 * or an org admin for the program's organization.
 */
export const programMemberMiddleware = async (c: Context, next: Next) => {
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

    const programId = c.req.param('programId');
    if (!programId) {
      return c.json(
        {
          success: false,
          error: 'Program ID is required',
          code: 'PROGRAM_ID_REQUIRED'
        },
        400
      );
    }

    const [member, isOrgAdmin] = await Promise.all([
      isProgramMember(programId, user.id),
      isOrgAdminByProgramId(programId, user.id)
    ]);

    if (member || isOrgAdmin) {
      return next();
    }

    return c.json(
      {
        success: false,
        error: 'You must be a member of this program to perform this action',
        code: ErrorCodes.PROGRAM_FORBIDDEN
      },
      403
    );
  } catch (error) {
    console.error('Error in programMemberMiddleware:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to verify program membership',
        code: ErrorCodes.PROGRAM_MEMBER_CHECK_FAILED
      },
      500
    );
  }
};
