import { Hono } from '@api/utils/hono';
import { authMiddleware } from '@api/middlewares/auth';
import { orgMemberMiddleware } from '@api/middlewares/org-member';
import { handleError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';
import { ZAgentStatusQuery } from '@cio/utils/validation/agent';
import { getTokenBalance } from '@api/services/agent/usage';
import { isCourseTeamMemberOrOrgAdmin } from '@cio/db/queries/group';
import { AgentRole, type AgentStatus } from '@cio/ai-assistant';
import { pickAnyConfiguredProvider } from '@cio/ai-assistant/providers';

/**
 * GET /agent/status
 * Returns whether AI assistant is enabled, the user's role, and usage info.
 * Used by the dashboard to show/hide the AI button and configure the UI.
 */
export const agentStatusRouter = new Hono().get(
  '/status',
  authMiddleware,
  orgMemberMiddleware,
  zValidator('query', ZAgentStatusQuery),
  async (c) => {
    try {
      const user = c.get('user')!;
      const orgId = c.req.header('cio-org-id')!;
      const { courseId } = c.req.valid('query');

      // Check if AI is configured (self-hosted check) — enabled when any provider key is set
      const providerConfig = pickAnyConfiguredProvider();
      if (!providerConfig) {
        const status: AgentStatus = {
          enabled: false,
          role: AgentRole.STUDENT,
          usage: { used: 0, allowance: 0, creditBalance: 0, remaining: 0 }
        };

        return c.json({ success: true, data: status });
      }

      // Detect role
      const isTeamMember = await isCourseTeamMemberOrOrgAdmin(courseId, user.id);
      const role = isTeamMember ? AgentRole.TEACHER : AgentRole.STUDENT;

      // Get usage
      const usage = await getTokenBalance(orgId);

      const status: AgentStatus = {
        enabled: true,
        role,
        usage
      };

      return c.json({ success: true, data: status });
    } catch (error) {
      return handleError(c, error, 'Failed to get agent status');
    }
  }
);
