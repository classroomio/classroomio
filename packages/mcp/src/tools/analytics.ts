import {
  ZPublicApiAnalyticsFunnelQuery,
  ZPublicApiAnalyticsRangeQuery,
  ZPublicApiCourseParam,
  ZPublicApiLearnerAnalyticsParam,
  ZPublicApiLoginActivityQuery,
  ZPublicApiPaginationQuery
} from '@cio/utils/validation/public-api';

import type { ClassroomIoApiClient } from '../api-client';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ZodRawShapeCompat } from '@modelcontextprotocol/sdk/server/zod-compat.js';
import { PAGINATED, READ_ONLY, jsonContent } from './cohort-tool-text';

const ORG_TEAM_RULE = 'The API key creator must be an org admin or tutor, otherwise 403.';
const ORG_ADMIN_RULE = 'The API key creator must be an org admin, otherwise 403.';
const COURSE_TEAM_RULE = 'The API key creator must be a course tutor/admin or an org admin, otherwise 403.';
const RANGE = 'days (1-365, default 30) sets the window, counted back from today (UTC). May be up to 10 minutes stale.';

export const ZAnalyticsRangeToolInput = ZPublicApiAnalyticsRangeQuery;
export const ZAnalyticsFunnelToolInput = ZPublicApiAnalyticsFunnelQuery;
export const ZLoginActivityToolInput = ZPublicApiLoginActivityQuery;
export const ZListComplianceLearnersToolInput = ZPublicApiPaginationQuery;
export const ZLearnerAnalyticsToolInput = ZPublicApiLearnerAnalyticsParam;
export const ZCourseAnalyticsToolInput = ZPublicApiCourseParam;
export const ZListCourseAnalyticsStudentsToolInput = ZPublicApiCourseParam.extend(ZPublicApiPaginationQuery.shape);

const rangeShape = ZAnalyticsRangeToolInput.shape as unknown as ZodRawShapeCompat;
const funnelShape = ZAnalyticsFunnelToolInput.shape as unknown as ZodRawShapeCompat;
const loginActivityShape = ZLoginActivityToolInput.shape as unknown as ZodRawShapeCompat;
const complianceLearnersShape = ZListComplianceLearnersToolInput.shape as unknown as ZodRawShapeCompat;
const learnerAnalyticsShape = ZLearnerAnalyticsToolInput.shape as unknown as ZodRawShapeCompat;
const courseAnalyticsShape = ZCourseAnalyticsToolInput.shape as unknown as ZodRawShapeCompat;
const courseAnalyticsStudentsShape = ZListCourseAnalyticsStudentsToolInput.shape as unknown as ZodRawShapeCompat;

export function registerAnalyticsTools(server: McpServer, apiClient: ClassroomIoApiClient) {
  server.tool(
    'get_org_analytics_overview',
    `Organization totals (courses, students, certificates issued), the top 5 courses by students with completion and certification rates, and the 5 most recent certificates. ${ORG_TEAM_RULE}`,
    {},
    READ_ONLY,
    async () => {
      const result = await apiClient.getOrgAnalyticsOverview();
      return jsonContent(result);
    }
  );

  server.tool(
    'get_org_traffic_analytics',
    `Landing and course page views, unique visitors, enrollments and completions, with a per-day series. Counts come from a daily rollup, so today may be incomplete. ${RANGE} ${ORG_TEAM_RULE}`,
    rangeShape,
    READ_ONLY,
    async (args) => {
      const query = ZAnalyticsRangeToolInput.parse(args);
      const result = await apiClient.getOrgTrafficAnalytics(query);
      return jsonContent(result);
    }
  );

  server.tool(
    'get_org_country_analytics',
    `Views and enrollments by visitor country, top 20 countries by views. ${RANGE} ${ORG_TEAM_RULE}`,
    rangeShape,
    READ_ONLY,
    async (args) => {
      const query = ZAnalyticsRangeToolInput.parse(args);
      const result = await apiClient.getOrgCountryAnalytics(query);
      return jsonContent(result);
    }
  );

  server.tool(
    'get_org_funnel_analytics',
    `Conversion funnel: landing view → course page view → enrollment → completion, with the conversion ratio between steps. Pass courseId for one course (the landing step is then left out). ${RANGE} ${ORG_TEAM_RULE}`,
    funnelShape,
    READ_ONLY,
    async (args) => {
      const query = ZAnalyticsFunnelToolInput.parse(args);
      const result = await apiClient.getOrgFunnelAnalytics(query);
      return jsonContent(result);
    }
  );

  server.tool(
    'get_org_course_type_analytics',
    `Views, enrollments and completions grouped by course type. ${RANGE} ${ORG_TEAM_RULE}`,
    rangeShape,
    READ_ONLY,
    async (args) => {
      const query = ZAnalyticsRangeToolInput.parse(args);
      const result = await apiClient.getOrgCourseTypeAnalytics(query);
      return jsonContent(result);
    }
  );

  server.tool(
    'get_org_top_courses_analytics',
    `The 10 most viewed course pages. For the courses with the most students, use get_org_analytics_overview. ${RANGE} ${ORG_TEAM_RULE}`,
    rangeShape,
    READ_ONLY,
    async (args) => {
      const query = ZAnalyticsRangeToolInput.parse(args);
      const result = await apiClient.getOrgTopCoursesAnalytics(query);
      return jsonContent(result);
    }
  );

  server.tool(
    'get_org_login_activity',
    `Student logins grouped by day of week (Sun-Sat, always 7 entries) over the last days (1-365, default 90). May be up to 24 hours stale. ${ORG_ADMIN_RULE}`,
    loginActivityShape,
    READ_ONLY,
    async (args) => {
      const query = ZLoginActivityToolInput.parse(args);
      const result = await apiClient.getOrgLoginActivity(query);
      return jsonContent(result);
    }
  );

  server.tool(
    'get_org_compliance_overview',
    `Compliance status counts across the organization's compliance courses, overall and per course, from each learner's latest cycle. Use list_org_compliance_learners for the learners. ${ORG_ADMIN_RULE}`,
    {},
    READ_ONLY,
    async () => {
      const result = await apiClient.getOrgComplianceOverview();
      return jsonContent(result);
    }
  );

  server.tool(
    'list_org_compliance_learners',
    `One row per student per compliance course with their latest status, due date and validity, ordered by course title then learner name. ${PAGINATED} ${ORG_ADMIN_RULE}`,
    complianceLearnersShape,
    READ_ONLY,
    async (args) => {
      const query = ZListComplianceLearnersToolInput.parse(args);
      const result = await apiClient.listOrgComplianceLearners(query);
      return jsonContent(result);
    }
  );

  server.tool(
    'get_learner_analytics',
    `A learner's progress and grades across every course they're enrolled in within this organization, with per-exercise results. profileId must belong to the organization (404 otherwise). ${ORG_TEAM_RULE}`,
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
    `Course totals (tutors, students, lessons, exercises) and per-student averages for progress, exercise completion and grade. Use list_course_analytics_students for the per-student rows. ${COURSE_TEAM_RULE}`,
    courseAnalyticsShape,
    READ_ONLY,
    async (args) => {
      const { courseId } = ZCourseAnalyticsToolInput.parse(args);
      const result = await apiClient.getCourseAnalytics(courseId);
      return jsonContent(result);
    }
  );

  server.tool(
    'list_course_analytics_students',
    `Per-student progress, exercise submissions, average grade and last seen for a course, ordered by name. ${PAGINATED} ${COURSE_TEAM_RULE}`,
    courseAnalyticsStudentsShape,
    READ_ONLY,
    async (args) => {
      const { courseId, ...query } = ZListCourseAnalyticsStudentsToolInput.parse(args);
      const result = await apiClient.listCourseAnalyticsStudents(courseId, query);
      return jsonContent(result);
    }
  );
}
