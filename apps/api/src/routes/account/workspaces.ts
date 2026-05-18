import {
  createWorkspaceForAccount,
  deleteWorkspaceFromAccount,
  getAccountUsage,
  getWorkspaceLimits,
  listAccountWorkspaces
} from '@api/services/account';

import { Hono } from '@api/utils/hono';
import { ZCreateWorkspace, ZWorkspaceIdParam } from '@cio/utils/validation/account';
import { authMiddleware } from '@api/middlewares/auth';
import { handleError } from '@api/utils/errors';
import { orgAdminMiddleware } from '@api/middlewares/org-admin';
import { zValidator } from '@hono/zod-validator';

export const accountWorkspacesRouter = new Hono()
  .get('/workspaces', authMiddleware, orgAdminMiddleware, async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const [workspaces, limits] = await Promise.all([listAccountWorkspaces(orgId), getWorkspaceLimits(orgId)]);

      return c.json({ success: true, data: { workspaces, limits } }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to fetch account workspaces');
    }
  })
  .post('/workspaces', authMiddleware, orgAdminMiddleware, zValidator('json', ZCreateWorkspace), async (c) => {
    try {
      const user = c.get('user')!;
      const orgId = c.req.header('cio-org-id')!;
      const data = c.req.valid('json');

      const workspace = await createWorkspaceForAccount(orgId, user.id, data);

      return c.json({ success: true, data: workspace }, 201);
    } catch (error) {
      return handleError(c, error, 'Failed to create workspace');
    }
  })
  .delete(
    '/workspaces/:workspaceId',
    authMiddleware,
    orgAdminMiddleware,
    zValidator('param', ZWorkspaceIdParam),
    async (c) => {
      try {
        const orgId = c.req.header('cio-org-id')!;
        const { workspaceId } = c.req.valid('param');

        await deleteWorkspaceFromAccount(orgId, workspaceId);

        return c.json({ success: true, data: { id: workspaceId } }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to delete workspace');
      }
    }
  )
  .get('/usage', authMiddleware, orgAdminMiddleware, async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const usage = await getAccountUsage(orgId);

      return c.json({ success: true, data: usage }, 200);
    } catch (error) {
      return handleError(c, error, 'Failed to fetch account usage');
    }
  });
