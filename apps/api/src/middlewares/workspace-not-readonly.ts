import { Context, Next } from 'hono';

import * as schema from '@db/schema';

import { ErrorCodes } from '@api/utils/errors';
import { db } from '@cio/db/drizzle';
import { eq } from 'drizzle-orm';

/**
 * Blocks mutating requests on workspaces flagged read-only by the
 * multi-workspace downgrade grace job. Read methods always pass through.
 */
export const workspaceNotReadOnlyMiddleware = async (c: Context, next: Next) => {
  const method = c.req.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    await next();
    return;
  }

  const orgId = c.req.header('cio-org-id');
  if (!orgId) {
    await next();
    return;
  }

  try {
    const [row] = await db
      .select({ readOnlyUntil: schema.organization.readOnlyUntil })
      .from(schema.organization)
      .where(eq(schema.organization.id, orgId))
      .limit(1);

    if (row?.readOnlyUntil && new Date(row.readOnlyUntil) > new Date()) {
      return c.json(
        {
          success: false,
          error: 'Workspace is read-only while account is over plan limits',
          code: ErrorCodes.WORKSPACE_READ_ONLY
        },
        403
      );
    }
  } catch (error) {
    console.error('workspaceNotReadOnlyMiddleware error:', error);
  }

  await next();
};
