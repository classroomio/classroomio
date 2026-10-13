import {
  ZPublicApiLearnerAnalyticsParam,
  ZPublicApiCourseAnalyticsQuery,
  ZPublicApiCourseAnalyticsStudentsQuery,
  ZPublicApiCourseParam,
  ZPublicApiOrgAnalyticsQuery,
  ZPublicApiPaginationQuery
} from '@cio/utils/validation/public-api';

import type { ClassroomIoApiClient } from '../api-client';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ZodRawShapeCompat } from '@modelcontextprotocol/sdk/server/zod-compat.js';
import { READ_ONLY, jsonContent } from './cohort-tool-text';

const ORG_TEAM_RULE = 'the API key creator must be an org admin or tutor';
const ORG_ADMIN_RULE = 'the API key creator must be an org admin';
const COURSE_TEAM_RULE = 'the API key creator must be a course tutor/admin or an org admin';
const FRESHNESS = 'each section may be up to 10 minutes old (login activity: 24 hours), and meta.generatedAt says when';

export const ZOrgAnalyticsToolInput = ZPublicApiOrgAnalyticsQuery;
export const ZListComplianceLearnersToolInput = ZPublicApiPaginationQuery;
export const ZLearnerAnalyticsToolInput = ZPublicApiLearnerAnalyticsParam;
export const ZCourseAnalyticsToolInput = ZPublicApiCourseParam.extend(ZPublicApiCourseAnalyticsQuery.shape);
export const ZListCourseAnalyticsStudentsToolInput = ZPublicApiCourseParam.extend(
  ZPublicApiCourseAnalyticsStudentsQuery.shape
);

const orgAnalyticsShape = ZOrgAnalyticsToolInput.shape as unknown as ZodRawShapeCompat;
const complianceLearnersShape = ZListComplianceLearnersToolInput.shape as unknown as ZodRawShapeCompat;
const learnerAnalyticsShape = ZLearnerAnalyticsToolInput.shape as unknown as ZodRawShapeCompat;
const courseAnalyticsShape = ZCourseAnalyticsToolInput.shape as unknown as ZodRawShapeCompat;
const courseAnalyticsStudentsShape = ZListCourseAnalyticsStudentsToolInput.shape as unknown as ZodRawShapeCompat;

export function registerAnalyticsTools(server: McpServer, apiClient: ClassroomIoApiClient) {
  server.tool(
    'get_org_analytics',
    `Get organization analytics, with the sections chosen by include; ${ORG_TEAM_RULE}. Sections the key creator may not see are left out and listed in meta.omitted; ${FRESHNESS}.`,
    orgAnalyticsShape,
    READ_ONLY,
    async (args) => {
      const query = ZOrgAnalyticsToolInput.parse(args);
      const result = await apiClient.getOrgAnalytics(query);
      return jsonContent(result);
    }
  );

  server.tool(
    'list_compliance_learners',
    `List each student's latest status, due date and validity in every compliance course; ${ORG_ADMIN_RULE}. For the counts, use get_org_analytics with include ["compliance"].`,
    complianceLearnersShape,
    READ_ONLY,
    async (args) => {
      const query = ZListComplianceLearnersToolInput.parse(args);
      const result = await apiClient.listComplianceLearners(query);
      return jsonContent(result);
    }
  );

  server.tool(
    'get_learner_analytics',
    `Get a learner's progress and grades across their courses in the organization, with per-exercise results; ${ORG_TEAM_RULE}. Get profileId from list_compliance_learners or list_course_analytics_students.`,
    learnerAnalyticsShape,
    READ_ONLY,
    async (args) => {
      const { profileId } = ZLearnerAnalyticsToolInput.parse(args);
      const result = await apiClient.getLearnerAnalytics(profileId);
      return jsonContent(result);
    }
  );

  server.tool(
    'get_course_analytics',
    `Get a course's analytics, with the sections chosen by include; ${COURSE_TEAM_RULE}. Use list_course_analytics_students for the per-student rows; ${FRESHNESS}.`,
    courseAnalyticsShape,
    READ_ONLY,
    async (args) => {
      const { courseId, ...query } = ZCourseAnalyticsToolInput.parse(args);
      const result = await apiClient.getCourseAnalytics(courseId, query);
      return jsonContent(result);
    }
  );

  server.tool(
    'list_course_analytics_students',
    `List each student's progress, exercise submissions, average grade and last seen for a course, ordered by name; ${COURSE_TEAM_RULE}.`,
    courseAnalyticsStudentsShape,
    READ_ONLY,
    async (args) => {
      const { courseId, ...query } = ZListCourseAnalyticsStudentsToolInput.parse(args);
      const result = await apiClient.listCourseAnalyticsStudents(courseId, query);
      return jsonContent(result);
    }
  );
}
