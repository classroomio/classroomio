import type { Context, Next } from 'hono';
import type { TMcpToolName } from '@cio/utils/plans';
import type { AuthSession } from '@api/types/auth';

import { releaseMcpAutomationUsage, reserveMcpAutomationUsage } from '@api/services/organization/automation-usage';
import { handlePublicApiError } from '@api/utils/errors';

/**
 * For MCP keys: atomically checks the tool's rate limit and reserves one usage row before the handler runs, and
 * releases it when the handler does not return 2xx. If the reservation cannot be made the handler never runs.
 * Other keys pass through untouched.
 */
export const mcpToolUsageMiddleware = (toolName: TMcpToolName) => async (c: Context<AuthSession>, next: Next) => {
  const automationKey = c.get('automationKey');
  if (automationKey?.type !== 'mcp') {
    return next();
  }

  let usageId: string;
  try {
    usageId = await reserveMcpAutomationUsage(automationKey, toolName, { courseId: c.req.param('courseId') });
  } catch (error) {
    return handlePublicApiError(c, error, 'Automation usage check failed');
  }

  await next();

  if (c.res.status >= 200 && c.res.status < 300) {
    return;
  }

  try {
    await releaseMcpAutomationUsage(usageId);
  } catch (error) {
    console.error('mcpToolUsageMiddleware release error:', error);
  }
};
