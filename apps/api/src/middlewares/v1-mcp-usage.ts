import { Context, Next } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

import {
  assertMcpAutomationUsageAllowedForCategory,
  recordMcpAutomationUsageForAction
} from '@api/services/organization/automation-usage';
import { AppError, ErrorCodes } from '@api/utils/errors';
import type { TAutomationUsageCategory } from '@cio/utils/plans';

export const v1McpUsageMiddleware = async (c: Context, next: Next) => {
  const automationKey = c.get('automationKey');

  if (automationKey?.type !== 'mcp') {
    return next();
  }

  const category: TAutomationUsageCategory = c.req.method === 'GET' ? 'read' : 'write';

  try {
    await assertMcpAutomationUsageAllowedForCategory(automationKey, category);
  } catch (error) {
    if (error instanceof AppError) {
      return c.json(
        { success: false, error: error.message, code: error.code },
        error.statusCode as ContentfulStatusCode
      );
    }
    return c.json({ success: false, error: 'Failed to verify automation usage', code: ErrorCodes.INTERNAL_ERROR }, 500);
  }

  await next();

  if (c.res.status >= 200 && c.res.status < 300) {
    await recordMcpAutomationUsageForAction(automationKey, `${c.req.method} ${c.req.routePath}`, category).catch(
      (error) => {
        console.error('v1McpUsageMiddleware: failed to record automation usage', error);
      }
    );
  }
};
