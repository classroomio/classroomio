import {
  ZPublicApiCohortGoalParam,
  ZPublicApiCohortParam,
  ZPublicApiCreateCohortGoal,
  ZPublicApiUpdateCohortGoal
} from '@cio/utils/validation/public-api';

import type { ClassroomIoApiClient } from '../api-client';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ZodRawShapeCompat } from '@modelcontextprotocol/sdk/server/zod-compat.js';

export const ZListCohortGoalsToolInput = ZPublicApiCohortParam;

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

const CREATE_COHORT_GOAL_DESCRIPTION = `Create a progress goal for a cohort.

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

courseIds must be non-empty.`;

export function registerCohortGoalTools(server: McpServer, apiClient: ClassroomIoApiClient) {
  server.tool(
    'list_cohort_goals',
    'List the goals in a cohort, with per-status learner counts.',
    listCohortGoalsShape,
    async (args) => {
      const { cohortId } = ZListCohortGoalsToolInput.parse(args);
      const result = await apiClient.listCohortGoals(cohortId);
      return jsonContent(result);
    }
  );

  server.tool('create_cohort_goal', CREATE_COHORT_GOAL_DESCRIPTION, createCohortGoalShape, async (args) => {
    const { cohortId, ...payload } = ZCreateCohortGoalToolInput.parse(args);
    const result = await apiClient.createCohortGoal(cohortId, payload);
    return jsonContent(result);
  });

  server.tool('get_cohort_goal', 'Get a cohort goal.', getCohortGoalShape, async (args) => {
    const { cohortId, goalId } = ZGetCohortGoalToolInput.parse(args);
    const result = await apiClient.getCohortGoal(cohortId, goalId);
    return jsonContent(result);
  });

  server.tool('update_cohort_goal', 'Update a cohort goal.', updateCohortGoalShape, async (args) => {
    const { cohortId, goalId, ...payload } = ZUpdateCohortGoalToolInput.parse(args);
    const result = await apiClient.updateCohortGoal(cohortId, goalId, payload);
    return jsonContent(result);
  });

  server.tool(
    'archive_cohort_goal',
    'Archive a cohort goal (soft delete, keeps history).',
    archiveCohortGoalShape,
    async (args) => {
      const { cohortId, goalId } = ZArchiveCohortGoalToolInput.parse(args);
      const result = await apiClient.archiveCohortGoal(cohortId, goalId);
      return jsonContent(result);
    }
  );

  server.tool(
    'delete_cohort_goal',
    'Delete a cohort goal. This is a hard delete; use archive_cohort_goal to keep history.',
    deleteCohortGoalShape,
    async (args) => {
      const { cohortId, goalId } = ZDeleteCohortGoalToolInput.parse(args);
      const result = await apiClient.deleteCohortGoal(cohortId, goalId);
      return jsonContent(result);
    }
  );
}

function jsonContent(data: unknown) {
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(data)
      }
    ]
  };
}
