import {
  ZPublicApiCohortParam,
  ZPublicApiInsightsDashboardParam,
  ZPublicApiInsightsQueryRequest,
  ZPublicApiInsightsSnapshotQuery,
  ZPublicApiInsightsStudentsQuery,
  ZPublicApiRemindOverdueCohortGoals
} from '@cio/utils/validation/public-api';

import type { ClassroomIoApiClient } from '../api-client';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ZodRawShapeCompat } from '@modelcontextprotocol/sdk/server/zod-compat.js';
import { COHORT_TEAM_RULE, READ_ONLY, WRITE, jsonContent } from './cohort-tool-text';

const INSIGHTS_SCOPE_RULE =
  'the API key creator must be an org admin for org scope, a cohort admin or tutor for cohort scope, or a course admin or tutor for course scope';
const CATALOG_HINT = 'Call get_insights_catalog first to choose a source, metrics and filters.';

export const ZQueryInsightsToolInput = ZPublicApiInsightsQueryRequest;

export const ZGetInsightsDashboardToolInput = ZPublicApiInsightsDashboardParam.extend(
  ZPublicApiInsightsSnapshotQuery.shape
);

export const ZListInsightsStudentsToolInput = ZPublicApiInsightsStudentsQuery;

export const ZRemindOverdueCohortGoalsToolInput = ZPublicApiCohortParam.extend(
  ZPublicApiRemindOverdueCohortGoals.shape
);

const queryInsightsShape = ZQueryInsightsToolInput.shape as unknown as ZodRawShapeCompat;
const getInsightsDashboardShape = ZGetInsightsDashboardToolInput.shape as unknown as ZodRawShapeCompat;
const listInsightsStudentsShape = ZListInsightsStudentsToolInput.shape as unknown as ZodRawShapeCompat;
const remindOverdueCohortGoalsShape = ZRemindOverdueCohortGoalsToolInput.shape as unknown as ZodRawShapeCompat;

export function registerInsightsTools(server: McpServer, apiClient: ClassroomIoApiClient) {
  server.tool(
    'get_insights_catalog',
    `List the insights sources, metrics, dimensions and filters you can query; the API key creator must be an org admin or tutor.`,
    {},
    READ_ONLY,
    async () => {
      const result = await apiClient.getInsightsCatalog();
      return jsonContent(result);
    }
  );

  server.tool(
    'query_insights',
    `Run one insights query for a cohort, course or organization scope; ${INSIGHTS_SCOPE_RULE}. ${CATALOG_HINT}`,
    queryInsightsShape,
    READ_ONLY,
    async (args) => {
      const payload = ZQueryInsightsToolInput.parse(args);
      const result = await apiClient.queryInsights(payload);
      return jsonContent(result);
    }
  );

  server.tool(
    'get_insights_dashboard',
    `Get the numbers behind a cohort, course or organization dashboard; ${INSIGHTS_SCOPE_RULE}. The students table is served by list_insights_students instead of inside the snapshot.`,
    getInsightsDashboardShape,
    READ_ONLY,
    async (args) => {
      const { scopeType, scopeId, ...query } = ZGetInsightsDashboardToolInput.parse(args);
      const result = await apiClient.getInsightsDashboard(scopeType, scopeId, query);
      return jsonContent(result);
    }
  );

  server.tool(
    'list_insights_students',
    `List students in a scope with progress, score, status and last login; ${INSIGHTS_SCOPE_RULE}.`,
    listInsightsStudentsShape,
    READ_ONLY,
    async (args) => {
      const query = ZListInsightsStudentsToolInput.parse(args);
      const result = await apiClient.listInsightsStudents(query);
      return jsonContent(result);
    }
  );

  server.tool(
    'remind_overdue_cohort_goals',
    `Email overdue goal reminders now to a cohort's overdue students, or one student; ${COHORT_TEAM_RULE}. A student is reminded at most once a day.`,
    remindOverdueCohortGoalsShape,
    { ...WRITE, idempotentHint: true },
    async (args) => {
      const { cohortId, ...payload } = ZRemindOverdueCohortGoalsToolInput.parse(args);
      const result = await apiClient.remindOverdueCohortGoals(cohortId, payload);
      return jsonContent(result);
    }
  );
}
