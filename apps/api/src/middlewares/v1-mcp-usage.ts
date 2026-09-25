import { Context, Next } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

import {
  assertMcpAutomationUsageAllowedForCategory,
  recordMcpAutomationUsageForAction
} from '@api/services/organization/automation-usage';
import { AppError, ErrorCodes } from '@api/utils/errors';
import {
  getMcpAutomationCategory,
  MCP_TOOL_CREDIT_COST,
  type TAutomationUsageCategory,
  type TMcpToolName
} from '@cio/utils/plans';

type TRouteMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

const MCP_V1_ROUTE_TOOL_MAP: Record<string, Partial<Record<TRouteMethod, TMcpToolName>>> = {
  '/public-api/v1/courses/:courseId/members': { GET: 'list_course_members', POST: 'add_course_member' },
  '/public-api/v1/courses/:courseId/members/:memberId': {
    GET: 'get_course_member',
    PUT: 'update_course_member',
    DELETE: 'delete_course_member'
  },
  '/public-api/v1/courses/:courseId/members/:memberId/reset-progress': { POST: 'reset_course_member_progress' },
  '/public-api/v1/courses/:courseId/members/:memberId/analytics': { GET: 'get_course_member_analytics' },
  '/public-api/v1/courses/:courseId/invites': { GET: 'list_course_invites', POST: 'create_course_invite' },
  '/public-api/v1/courses/:courseId/invites/:inviteId/revoke': { POST: 'revoke_course_invite' }
};

function resolveMcpToolName(method: string, routePath: string): TMcpToolName | undefined {
  return MCP_V1_ROUTE_TOOL_MAP[routePath]?.[method as TRouteMethod];
}

export const v1McpUsageMiddleware = async (c: Context, next: Next) => {
  const automationKey = c.get('automationKey');

  if (automationKey?.type !== 'mcp') {
    return next();
  }

  const precheckCategory: TAutomationUsageCategory = c.req.method === 'GET' ? 'read' : 'write';

  try {
    await assertMcpAutomationUsageAllowedForCategory(automationKey, precheckCategory);
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
    const toolName = resolveMcpToolName(c.req.method, c.req.routePath);
    const action = toolName ?? `${c.req.method} ${c.req.routePath}`;
    const category = toolName ? getMcpAutomationCategory(toolName) : precheckCategory;
    const creditsConsumed = toolName ? MCP_TOOL_CREDIT_COST[toolName] : 0;

    await recordMcpAutomationUsageForAction(automationKey, action, category, creditsConsumed).catch((error) => {
      console.error('v1McpUsageMiddleware: failed to record automation usage', error);
    });
  }
};
