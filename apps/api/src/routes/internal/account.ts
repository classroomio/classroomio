import { Hono } from '@api/utils/hono';
import { apiKeyMiddleware } from '@api/middlewares/api-key';
import { handleError } from '@api/utils/errors';
import { runWorkspaceGraceCheck } from '@api/services/account';

export const internalAccountRouter = new Hono().post('/workspace-grace', apiKeyMiddleware, async (c) => {
  try {
    const data = await runWorkspaceGraceCheck();
    return c.json({ success: true, data }, 200);
  } catch (error) {
    return handleError(c, error, 'Failed to run workspace grace check');
  }
});
