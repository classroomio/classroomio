import type { Context, Next } from 'hono';
import type { TMcpToolName } from '@cio/utils/plans';
import type { AuthSession } from '@api/types/auth';

import { assertMcpAutomationUsageAllowed, recordMcpAutomationUsage } from '@api/services/organization/automation-usage';
import { handlePublicApiError } from '@api/utils/errors';

/**
 * For MCP keys: enforces the tool's automation rate limit before the handler and records usage after a 2xx.
 * Other keys pass through untouched.
 */
export const mcpToolUsageMiddleware = (toolName: TMcpToolName) => async (c: Context<AuthSession>, next: Next) => {
  const automationKey = c.get('automationKey');
  if (automationKey?.type !== 'mcp') {
    return next();
  }

  try {
    await assertMcpAutomationUsageAllowed(automationKey, toolName);
  } catch (error) {
    return handlePublicApiError(c, error, 'Automation usage check failed');
  }

  await next();

  if (c.res.status < 200 || c.res.status >= 300) {
    return;
  }

  try {
    await recordMcpAutomationUsage(automationKey, toolName, { courseId: c.req.param('courseId') });
  } catch (error) {
    console.error('mcpToolUsageMiddleware record error:', error);
  }
};
