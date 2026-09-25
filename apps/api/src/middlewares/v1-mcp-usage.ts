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
  '/public-api/v1/cohorts': { GET: 'list_org_cohorts', POST: 'create_cohort' },
  '/public-api/v1/cohorts/enrolled': { GET: 'list_my_enrolled_cohorts' },
  '/public-api/v1/cohorts/my/goals': { GET: 'list_my_cohort_goals' },
  '/public-api/v1/cohorts/goals/overview': { GET: 'get_org_goals_overview' },
  '/public-api/v1/cohorts/:cohortId/invite': { POST: 'invite_students_to_cohort' },
  '/public-api/v1/cohorts/:cohortId/invite/assign': { POST: 'assign_students_to_cohort' },
  '/public-api/v1/cohorts/:cohortId/invite-link': {
    GET: 'get_cohort_invite_link',
    POST: 'create_cohort_invite_link',
    PATCH: 'set_cohort_invite_link_revoked'
  },
  '/public-api/v1/cohorts/:cohortId/goals/evaluate-all': { POST: 'evaluate_all_cohort_goals' },
  '/public-api/v1/cohorts/:cohortId/goals/:goalId/evaluate': { POST: 'evaluate_cohort_goal' },
  '/public-api/v1/cohorts/:cohortId': { GET: 'get_cohort', PUT: 'update_cohort', DELETE: 'delete_cohort' },
  '/public-api/v1/cohorts/:cohortId/members': { GET: 'list_cohort_members', POST: 'add_cohort_members' },
  '/public-api/v1/cohorts/:cohortId/members/:memberId': { PUT: 'update_cohort_member', DELETE: 'delete_cohort_member' },
  '/public-api/v1/cohorts/:cohortId/courses': { GET: 'list_cohort_courses', POST: 'add_cohort_course' },
  '/public-api/v1/cohorts/:cohortId/courses/:courseId': { DELETE: 'remove_cohort_course' },
  '/public-api/v1/cohorts/:cohortId/newsfeed': { GET: 'list_cohort_newsfeed', POST: 'create_cohort_newsfeed_post' },
  '/public-api/v1/cohorts/:cohortId/newsfeed/:feedId': {
    PUT: 'update_cohort_newsfeed_post',
    DELETE: 'delete_cohort_newsfeed_post'
  },
  '/public-api/v1/cohorts/:cohortId/newsfeed/:feedId/react': { PUT: 'update_cohort_newsfeed_reaction' },
  '/public-api/v1/cohorts/:cohortId/newsfeed/:feedId/comments': { GET: 'list_cohort_newsfeed_comments' },
  '/public-api/v1/cohorts/:cohortId/newsfeed/:feedId/comment': { POST: 'create_cohort_newsfeed_comment' },
  '/public-api/v1/cohorts/:cohortId/newsfeed/:feedId/comment/:commentId': { DELETE: 'delete_cohort_newsfeed_comment' },
  '/public-api/v1/cohorts/:cohortId/goals': { GET: 'list_cohort_goals', POST: 'create_cohort_goal' },
  '/public-api/v1/cohorts/:cohortId/goals/:goalId': {
    GET: 'get_cohort_goal',
    PUT: 'update_cohort_goal',
    DELETE: 'delete_cohort_goal'
  },
  '/public-api/v1/cohorts/:cohortId/goals/:goalId/archive': { POST: 'archive_cohort_goal' }
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
