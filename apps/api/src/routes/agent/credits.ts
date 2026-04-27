import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { orgAdminMiddleware } from '@api/middlewares/org-admin';
import { handleError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';
import { ZAgentCreditsBody } from '@cio/utils/validation/agent';
import { addCredits, getTokenBalance } from '@api/services/agent/usage';

/**
 * POST /agent/credits
 * Purchase additional token credits. Org admins only.
 * In v1, this directly adds credits (no payment integration).
 * Payment integration will be added when billing provider is wired up.
 */
export const agentCreditsRouter = new Hono().post(
  '/credits',
  authMiddleware,
  orgAdminMiddleware,
  zValidator('json', ZAgentCreditsBody),
  async (c) => {
    try {
      const orgId = c.req.header('cio-org-id')!;
      const { amount } = c.req.valid('json');

      // TODO: Integrate with payment provider before adding credits.
      // For now, this endpoint adds credits directly for testing purposes.
      await addCredits(orgId, amount);
      const balance = await getTokenBalance(orgId);

      return c.json({ success: true, data: balance });
    } catch (error) {
      return handleError(c, error, 'Failed to purchase credits');
    }
  }
);
