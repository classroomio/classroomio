import {
  ZPublicApiAnalyticsQueryRequest,
  ZPublicApiAnalyticsSnapshotQuery,
  ZPublicApiAnalyticsStudentsQuery,
  ZPublicApiCohortParam,
  ZPublicApiCourseAnalyticsSnapshotQuery,
  ZPublicApiCourseAnalyticsStudentsQuery,
  ZPublicApiCourseParam
} from '@cio/utils/validation/public-api';
import { ORG_ANALYTICS_PAGE, ORG_ANALYTICS_TOOLS } from '@cio/utils/constants/analytics-pages';

import type { ClassroomIoApiClient } from '../api-client';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ZodRawShapeCompat } from '@modelcontextprotocol/sdk/server/zod-compat.js';
import { COHORT_TEAM_RULE, READ_ONLY, jsonContent } from './cohort-tool-text';

const PAGE = ORG_ANALYTICS_PAGE.label;
const ORG_TEAM_RULE = 'the API key creator must be an org admin or tutor';
const ORG_ADMIN_RULE = 'the API key creator must be an org admin';
const COURSE_TEAM_RULE = 'the API key creator must be a course tutor/admin or an org admin';
const ANALYTICS_SCOPE_RULE =
  'the API key creator must be an org admin for org scope, a cohort admin or tutor for cohort scope, or a course admin or tutor for course scope';
const CATALOG_HINT = `Call ${ORG_ANALYTICS_TOOLS.catalog} first to choose a source, metrics and filters.`;

export const ZQueryAnalyticsToolInput = ZPublicApiAnalyticsQueryRequest;
export const ZGetOrgAnalyticsToolInput = ZPublicApiAnalyticsSnapshotQuery;
export const ZListOrgAnalyticsStudentsToolInput = ZPublicApiAnalyticsStudentsQuery;
export const ZGetCourseAnalyticsToolInput = ZPublicApiCourseParam.extend(ZPublicApiCourseAnalyticsSnapshotQuery.shape);
export const ZListCourseAnalyticsStudentsToolInput = ZPublicApiCourseParam.extend(
  ZPublicApiCourseAnalyticsStudentsQuery.shape
);
export const ZGetCohortAnalyticsToolInput = ZPublicApiCohortParam.extend(ZPublicApiAnalyticsSnapshotQuery.shape);
export const ZListCohortAnalyticsStudentsToolInput = ZPublicApiCohortParam.extend(
  ZPublicApiAnalyticsStudentsQuery.shape
);

const shapeOf = (schema: { shape: unknown }) => schema.shape as unknown as ZodRawShapeCompat;

export function registerAnalyticsTools(server: McpServer, apiClient: ClassroomIoApiClient) {
  server.tool(
    ORG_ANALYTICS_TOOLS.snapshot,
    `Get the ${PAGE} dashboard numbers for the whole organization; ${ORG_ADMIN_RULE}. For one course use get_course_analytics, for one cohort use get_cohort_analytics. The students table is served by ${ORG_ANALYTICS_TOOLS.students} instead of inside the snapshot.`,
    shapeOf(ZGetOrgAnalyticsToolInput),
    READ_ONLY,
    async (args) => {
      const query = ZGetOrgAnalyticsToolInput.parse(args);
      const result = await apiClient.getOrgAnalytics(query);
      return jsonContent(result);
    }
  );

  server.tool(
    ORG_ANALYTICS_TOOLS.students,
    `List the organization's students with progress, score, status, overdue state and last login; ${ORG_ADMIN_RULE}. For one course use list_course_analytics_students, for one cohort list_cohort_analytics_students.`,
    shapeOf(ZListOrgAnalyticsStudentsToolInput),
    READ_ONLY,
    async (args) => {
      const query = ZListOrgAnalyticsStudentsToolInput.parse(args);
      const result = await apiClient.listOrgAnalyticsStudents(query);
      return jsonContent(result);
    }
  );

  server.tool(
    ORG_ANALYTICS_TOOLS.catalog,
    `List the ${PAGE} sources, metrics, dimensions and filters you can query for any scope; ${ORG_TEAM_RULE}.`,
    {},
    READ_ONLY,
    async () => {
      const result = await apiClient.getAnalyticsCatalog();
      return jsonContent(result);
    }
  );

  server.tool(
    ORG_ANALYTICS_TOOLS.query,
    `Run one ${PAGE} analytics query for a cohort, course or organization scope; ${ANALYTICS_SCOPE_RULE}. ${CATALOG_HINT}`,
    shapeOf(ZQueryAnalyticsToolInput),
    READ_ONLY,
    async (args) => {
      const payload = ZQueryAnalyticsToolInput.parse(args);
      const result = await apiClient.queryAnalytics(payload);
      return jsonContent(result);
    }
  );

  server.tool(
    'get_course_analytics',
    `Get the numbers behind a course's Analytics page; ${COURSE_TEAM_RULE}. For the whole organization use ${ORG_ANALYTICS_TOOLS.snapshot}. The students table is served by list_course_analytics_students instead of inside the snapshot.`,
    shapeOf(ZGetCourseAnalyticsToolInput),
    READ_ONLY,
    async (args) => {
      const { courseId, ...query } = ZGetCourseAnalyticsToolInput.parse(args);
      const result = await apiClient.getCourseAnalytics(courseId, query);
      return jsonContent(result);
    }
  );

  server.tool(
    'list_course_analytics_students',
    `List a course's students with progress, score, status, overdue state and last login; ${COURSE_TEAM_RULE}.`,
    shapeOf(ZListCourseAnalyticsStudentsToolInput),
    READ_ONLY,
    async (args) => {
      const { courseId, ...query } = ZListCourseAnalyticsStudentsToolInput.parse(args);
      const result = await apiClient.listCourseAnalyticsStudents(courseId, query);
      return jsonContent(result);
    }
  );

  server.tool(
    'get_cohort_analytics',
    `Get the numbers behind a cohort's Analytics page; ${COHORT_TEAM_RULE}. For the whole organization use ${ORG_ANALYTICS_TOOLS.snapshot}. The students table is served by list_cohort_analytics_students instead of inside the snapshot.`,
    shapeOf(ZGetCohortAnalyticsToolInput),
    READ_ONLY,
    async (args) => {
      const { cohortId, ...query } = ZGetCohortAnalyticsToolInput.parse(args);
      const result = await apiClient.getCohortAnalytics(cohortId, query);
      return jsonContent(result);
    }
  );

  server.tool(
    'list_cohort_analytics_students',
    `List a cohort's students with progress, score, status, overdue state and last login; ${COHORT_TEAM_RULE}.`,
    shapeOf(ZListCohortAnalyticsStudentsToolInput),
    READ_ONLY,
    async (args) => {
      const { cohortId, ...query } = ZListCohortAnalyticsStudentsToolInput.parse(args);
      const result = await apiClient.listCohortAnalyticsStudents(cohortId, query);
      return jsonContent(result);
    }
  );
}
