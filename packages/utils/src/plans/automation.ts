import { PLAN } from './constants';

export const AUTOMATION_TYPE = {
  MCP: 'mcp',
  API: 'api',
  ZAPIER: 'zapier'
} as const;

export const AUTOMATION_USAGE_CATEGORY = {
  READ: 'read',
  WRITE: 'write',
  PUBLISH: 'publish'
} as const;

export const MCP_TOOL_CREDIT_COST = {
  list_org_courses: 0,
  get_course_structure: 0,
  get_course_draft: 0,
  list_course_exercises: 0,
  get_course_exercise: 0,
  create_course_draft: 1,
  create_course_draft_from_course: 1,
  reorder_course_content: 1,
  update_course_landing_page: 1,
  update_course_draft: 1,
  tag_course_draft: 1,
  tag_courses: 1,
  create_course_exercise: 1,
  create_course_exercise_from_template: 1,
  update_course_exercise: 1,
  publish_course_draft: 5,
  publish_course_draft_to_existing_course: 5,
  list_org_cohorts: 0,
  get_cohort: 0,
  list_cohort_members: 0,
  list_cohort_courses: 0,
  create_cohort: 1,
  update_cohort: 1,
  delete_cohort: 1,
  add_cohort_members: 1,
  update_cohort_member: 1,
  delete_cohort_member: 1,
  add_cohort_course: 1,
  remove_cohort_course: 1,
  list_cohort_newsfeed: 0,
  create_cohort_newsfeed_post: 1,
  update_cohort_newsfeed_post: 1,
  update_cohort_newsfeed_reaction: 1,
  delete_cohort_newsfeed_post: 1,
  list_cohort_newsfeed_comments: 0,
  create_cohort_newsfeed_comment: 1,
  delete_cohort_newsfeed_comment: 1,
  list_cohort_goals: 0,
  create_cohort_goal: 1,
  get_cohort_goal: 0,
  update_cohort_goal: 1,
  archive_cohort_goal: 1,
  delete_cohort_goal: 1,
  evaluate_cohort_goal: 1,
  evaluate_all_cohort_goals: 1,
  get_org_goals_overview: 0,
  list_my_enrolled_cohorts: 0,
  list_my_cohort_goals: 0,
  invite_students_to_cohort: 1,
  assign_students_to_cohort: 1,
  get_cohort_invite_link: 0,
  create_cohort_invite_link: 1,
  set_cohort_invite_link_revoked: 1
} as const;

export type TMcpToolName = keyof typeof MCP_TOOL_CREDIT_COST;
export type TAutomationUsageCategory = (typeof AUTOMATION_USAGE_CATEGORY)[keyof typeof AUTOMATION_USAGE_CATEGORY];

export type McpAutomationLimits = {
  maxActiveKeys: number;
  rateLimits: {
    perKey: {
      readPerMinute: number;
      writePerMinute: number;
      publishPerMinute: number;
    };
    perOrg: {
      readPerMinute: number;
      writePerMinute: number;
      publishPerMinute: number;
    };
  };
};

export const MCP_AUTOMATION_LIMITS_BY_PLAN: Record<string, McpAutomationLimits> = {
  [PLAN.BASIC]: {
    maxActiveKeys: 1,
    rateLimits: {
      perKey: {
        readPerMinute: 30,
        writePerMinute: 10,
        publishPerMinute: 1
      },
      perOrg: {
        readPerMinute: 60,
        writePerMinute: 20,
        publishPerMinute: 2
      }
    }
  },
  [PLAN.EARLY_ADOPTER]: {
    maxActiveKeys: 5,
    rateLimits: {
      perKey: {
        readPerMinute: 60,
        writePerMinute: 20,
        publishPerMinute: 3
      },
      perOrg: {
        readPerMinute: 120,
        writePerMinute: 40,
        publishPerMinute: 5
      }
    }
  },
  [PLAN.ENTERPRISE]: {
    maxActiveKeys: 25,
    rateLimits: {
      perKey: {
        readPerMinute: 180,
        writePerMinute: 60,
        publishPerMinute: 10
      },
      perOrg: {
        readPerMinute: 360,
        writePerMinute: 120,
        publishPerMinute: 20
      }
    }
  }
};

export function getMcpAutomationCategory(toolName: TMcpToolName): TAutomationUsageCategory {
  if (
    toolName === 'get_course_structure' ||
    toolName === 'get_course_draft' ||
    toolName === 'list_org_courses' ||
    toolName === 'list_course_exercises' ||
    toolName === 'get_course_exercise' ||
    toolName === 'list_org_cohorts' ||
    toolName === 'get_cohort' ||
    toolName === 'list_cohort_members' ||
    toolName === 'list_cohort_courses' ||
    toolName === 'list_cohort_newsfeed' ||
    toolName === 'list_cohort_newsfeed_comments' ||
    toolName === 'list_cohort_goals' ||
    toolName === 'get_cohort_goal' ||
    toolName === 'get_org_goals_overview' ||
    toolName === 'list_my_enrolled_cohorts' ||
    toolName === 'list_my_cohort_goals' ||
    toolName === 'get_cohort_invite_link'
  ) {
    return AUTOMATION_USAGE_CATEGORY.READ;
  }

  if (toolName === 'publish_course_draft' || toolName === 'publish_course_draft_to_existing_course') {
    return AUTOMATION_USAGE_CATEGORY.PUBLISH;
  }

  return AUTOMATION_USAGE_CATEGORY.WRITE;
}

export function getMcpAutomationLimits(planName: string | null | undefined): McpAutomationLimits {
  if (!planName) {
    return MCP_AUTOMATION_LIMITS_BY_PLAN[PLAN.BASIC];
  }

  return MCP_AUTOMATION_LIMITS_BY_PLAN[planName] ?? MCP_AUTOMATION_LIMITS_BY_PLAN[PLAN.BASIC];
}
