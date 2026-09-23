import {
  ZPublicApiCohortGoalParam,
  ZPublicApiCohortParam,
  ZPublicApiCreateCohortGoal,
  ZPublicApiPaginationQuery,
  ZPublicApiUpdateCohortGoal
} from '@cio/utils/validation/public-api';

import type { ClassroomIoApiClient } from '../api-client';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ZodRawShapeCompat } from '@modelcontextprotocol/sdk/server/zod-compat.js';
import {
  COHORT_MEMBER_RULE,
  COHORT_TEAM_RULE,
  DESTRUCTIVE,
  PAGINATED,
  READ_ONLY,
  WRITE,
  jsonContent
} from './cohort-tool-text';

export const ZListCohortGoalsToolInput = ZPublicApiCohortParam.extend(ZPublicApiPaginationQuery.shape);

export const ZCreateCohortGoalToolInput = ZPublicApiCreateCohortGoal.safeExtend({
  cohortId: ZPublicApiCohortParam.shape.cohortId
});

export const ZGetCohortGoalToolInput = ZPublicApiCohortGoalParam;

export const ZUpdateCohortGoalToolInput = ZPublicApiUpdateCohortGoal.safeExtend({
  cohortId: ZPublicApiCohortGoalParam.shape.cohortId,
  goalId: ZPublicApiCohortGoalParam.shape.goalId
});

export const ZArchiveCohortGoalToolInput = ZPublicApiCohortGoalParam;

export const ZDeleteCohortGoalToolInput = ZPublicApiCohortGoalParam;

const listCohortGoalsShape = ZListCohortGoalsToolInput.shape as unknown as ZodRawShapeCompat;
const createCohortGoalShape = ZCreateCohortGoalToolInput.shape as unknown as ZodRawShapeCompat;
const getCohortGoalShape = ZGetCohortGoalToolInput.shape as unknown as ZodRawShapeCompat;
const updateCohortGoalShape = ZUpdateCohortGoalToolInput.shape as unknown as ZodRawShapeCompat;
const archiveCohortGoalShape = ZArchiveCohortGoalToolInput.shape as unknown as ZodRawShapeCompat;
const deleteCohortGoalShape = ZDeleteCohortGoalToolInput.shape as unknown as ZodRawShapeCompat;

const CREATE_COHORT_GOAL_DESCRIPTION = `Create a progress goal for a cohort. ${COHORT_TEAM_RULE}

Required fields depend on "type":
- complete_all: no extra fields beyond courseIds.
- n_of_m: requiredCount (must be <= courseIds.length).
- score: scoreThreshold.
- pass_rate: scoreThreshold and teamPassRateThreshold.
- readiness: no extra fields; deadlineKind must be "none".

Required fields depend on "deadlineKind":
- absolute: deadlineDate.
- relative_to_join: relativeDays.
- recurring: recurringMonths (and deadlineDate for the current cycle).
- none: no extra fields.

courseIds must be non-empty and every course must already be linked to the cohort (see add_cohort_course).`;

export function registerCohortGoalTools(server: McpServer, apiClient: ClassroomIoApiClient) {
  server.tool(
    'list_cohort_goals',
    `List the active goals in a cohort, with per-status learner counts. ${PAGINATED} ${COHORT_MEMBER_RULE}`,
    listCohortGoalsShape,
    READ_ONLY,
    async (args) => {
      const { cohortId, ...query } = ZListCohortGoalsToolInput.parse(args);
      const result = await apiClient.listCohortGoals(cohortId, query);
      return jsonContent(result);
    }
  );

  server.tool('create_cohort_goal', CREATE_COHORT_GOAL_DESCRIPTION, createCohortGoalShape, WRITE, async (args) => {
    const { cohortId, ...payload } = ZCreateCohortGoalToolInput.parse(args);
    const result = await apiClient.createCohortGoal(cohortId, payload);
    return jsonContent(result);
  });

  server.tool(
    'get_cohort_goal',
    `Get a cohort goal. ${COHORT_MEMBER_RULE}`,
    getCohortGoalShape,
    READ_ONLY,
    async (args) => {
      const { cohortId, goalId } = ZGetCohortGoalToolInput.parse(args);
      const result = await apiClient.getCohortGoal(cohortId, goalId);
      return jsonContent(result);
    }
  );

  server.tool(
    'update_cohort_goal',
    `Update a cohort goal. Send only the fields to change; omitted fields keep their values, and the resulting goal must still satisfy the create_cohort_goal rules. ${COHORT_TEAM_RULE}`,
    updateCohortGoalShape,
    WRITE,
    async (args) => {
      const { cohortId, goalId, ...payload } = ZUpdateCohortGoalToolInput.parse(args);
      const result = await apiClient.updateCohortGoal(cohortId, goalId, ZPublicApiUpdateCohortGoal.parse(payload));
      return jsonContent(result);
    }
  );

  server.tool(
    'archive_cohort_goal',
    `Archive a cohort goal. It stops being evaluated and drops out of list_cohort_goals, but its history is kept. ${COHORT_TEAM_RULE}`,
    archiveCohortGoalShape,
    WRITE,
    async (args) => {
      const { cohortId, goalId } = ZArchiveCohortGoalToolInput.parse(args);
      const result = await apiClient.archiveCohortGoal(cohortId, goalId);
      return jsonContent(result);
    }
  );

  server.tool(
    'delete_cohort_goal',
    `Permanently delete a cohort goal and its learner progress. This is a hard delete; use archive_cohort_goal to keep history. ${COHORT_TEAM_RULE}`,
    deleteCohortGoalShape,
    DESTRUCTIVE,
    async (args) => {
      const { cohortId, goalId } = ZDeleteCohortGoalToolInput.parse(args);
      const result = await apiClient.deleteCohortGoal(cohortId, goalId);
      return jsonContent(result);
    }
  );
}
