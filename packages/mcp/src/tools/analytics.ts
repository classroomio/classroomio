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
import { PAGINATED, READ_ONLY, jsonContent } from './cohort-tool-text';

const ORG_TEAM_RULE = 'The API key creator must be an org admin or tutor, otherwise 403.';
const ORG_ADMIN_RULE = 'The API key creator must be an org admin, otherwise 403.';
const COURSE_TEAM_RULE = 'The API key creator must be a course tutor/admin or an org admin, otherwise 403.';
const FRESHNESS = 'Each section may be up to 10 minutes old (login activity: 24 hours); meta.generatedAt says when.';

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
    `Organization analytics. Pick sections with include (default ["overview"]): overview (totals, top courses by students, recent certificates), traffic (views, visitors, enrollments, completions, per-day series), countries, funnel (landing → course page → enrollment → completion), courseTypes, topCourses (most viewed), loginActivity (logins by day of week, org admin only), compliance (status counts, org admin only). days is 7, 30, 90 or 365 (default 30); limit (1-20, default 5) caps list sections. Sections the key creator can't see are left out and listed in meta.omitted. ${FRESHNESS} ${ORG_TEAM_RULE}`,
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
    `One row per student per compliance course with their latest status, due date and validity, ordered by course title then learner name. For the counts, use get_org_analytics with include ["compliance"]. ${PAGINATED} ${ORG_ADMIN_RULE}`,
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
    `A learner's progress and grades across every course they're enrolled in within this organization, with per-exercise results. profileId is the id list_compliance_learners and list_course_analytics_students return; 404 if it isn't in the organization. ${ORG_TEAM_RULE}`,
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
    `Course analytics. Pick sections with include (default ["summary"]): summary (tutors, students, lessons, exercises, and per-student averages for progress, exercise completion and grade) and funnel (course page → enrollment → completion over days: 7, 30, 90 or 365, default 30). Use list_course_analytics_students for the per-student rows. ${FRESHNESS} ${COURSE_TEAM_RULE}`,
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
    `Per-student progress, exercise submissions, average grade and last seen for a course, ordered by name. Paginated: page (default 1) and limit (default 20, max 50); the result includes pagination. ${COURSE_TEAM_RULE}`,
    courseAnalyticsStudentsShape,
    READ_ONLY,
    async (args) => {
      const { courseId, ...query } = ZListCourseAnalyticsStudentsToolInput.parse(args);
      const result = await apiClient.listCourseAnalyticsStudents(courseId, query);
      return jsonContent(result);
    }
  );
}
