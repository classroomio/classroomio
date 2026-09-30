import type { Context } from 'hono';

import { ErrorCodes } from '@api/utils/errors';
import type { TLearningPath } from '@cio/db/types';
import { resolveLearningPath } from '@api/services/learning-path/learning-path';

export interface LearningPathRequestContext {
  userId: string;
  pathId: string;
  path: TLearningPath;
  orgRoles: Record<string, number> | undefined;
}

/**
 * Shared preamble for learning-path middlewares.
 * Requires authMiddleware first. Validates the caller and `:pathId`,
 * resolves the path once, and returns the context for the specific
 * authorization check. Returns a JSON response when the request
 * should short-circuit, otherwise null.
 */
export async function requireLearningPathContext(
  c: Context
): Promise<{ context: LearningPathRequestContext } | { response: Response }> {
  const user = c.get('user') as { id: string } | undefined;

  if (!user) {
    return {
      response: c.json(
        {
          success: false,
          error: 'Unauthorized',
          code: ErrorCodes.UNAUTHORIZED
        },
        401
      )
    };
  }

  const pathId = c.req.param('pathId');

  if (!pathId) {
    return {
      response: c.json(
        {
          success: false,
          error: 'Learning path ID is required',
          code: ErrorCodes.VALIDATION_ERROR
        },
        400
      )
    };
  }

  const path = await resolveLearningPath(pathId);
  const orgRoles = c.get('orgRoles') as Record<string, number> | undefined;

  return { context: { userId: user.id, pathId, path, orgRoles } };
}
