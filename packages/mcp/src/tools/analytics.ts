import {
  ZPublicApiStudentAnalyticsParam,
  ZPublicApiCourseAnalyticsQuery,
  ZPublicApiCourseAnalyticsStudentsQuery,
  ZPublicApiCourseMemberAnalyticsQuery,
  ZPublicApiCourseParam,
  ZPublicApiCourseStudentAnalyticsParam,
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
export const ZListComplianceStudentsToolInput = ZPublicApiPaginationQuery;
export const ZStudentAnalyticsToolInput = ZPublicApiStudentAnalyticsParam;
export const ZCourseAnalyticsToolInput = ZPublicApiCourseParam.extend(ZPublicApiCourseAnalyticsQuery.shape);
export const ZListCourseAnalyticsStudentsToolInput = ZPublicApiCourseParam.extend(
  ZPublicApiCourseAnalyticsStudentsQuery.shape
);

export const ZCourseStudentAnalyticsToolInput = ZPublicApiCourseMemberAnalyticsQuery.safeExtend(
  ZPublicApiCourseStudentAnalyticsParam.shape
);

const orgAnalyticsShape = ZOrgAnalyticsToolInput.shape as unknown as ZodRawShapeCompat;
const complianceStudentsShape = ZListComplianceStudentsToolInput.shape as unknown as ZodRawShapeCompat;
const studentAnalyticsShape = ZStudentAnalyticsToolInput.shape as unknown as ZodRawShapeCompat;
const courseAnalyticsShape = ZCourseAnalyticsToolInput.shape as unknown as ZodRawShapeCompat;
const courseAnalyticsStudentsShape = ZListCourseAnalyticsStudentsToolInput.shape as unknown as ZodRawShapeCompat;
const courseStudentAnalyticsShape = ZCourseStudentAnalyticsToolInput.shape as unknown as ZodRawShapeCompat;

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
    'list_compliance_students',
    `One row per student per compliance course with their latest status, due date and validity, ordered by course title then student name. For the counts, use get_org_analytics with include ["compliance"]. ${PAGINATED} ${ORG_ADMIN_RULE}`,
    complianceStudentsShape,
    READ_ONLY,
    async (args) => {
      const query = ZListComplianceStudentsToolInput.parse(args);
      const result = await apiClient.listComplianceStudents(query);
      return jsonContent(result);
    }
  );

  server.tool(
    'get_student_analytics',
    `A student's progress and grades across every course they're enrolled in within this organization, with per-exercise results. profileId is the id list_compliance_students and list_course_analytics_students return; 404 if it isn't in the organization. ${ORG_TEAM_RULE}`,
    studentAnalyticsShape,
    READ_ONLY,
    async (args) => {
      const { profileId } = ZStudentAnalyticsToolInput.parse(args);
      const result = await apiClient.getStudentAnalytics(profileId);
      return jsonContent(result);
    }
  );

  server.tool(
    'get_course_analytics',
    `Course analytics. Pick sections with include (default ["summary"]): summary (tutors, students, lessons, exercises, and per-student averages for progress, exercise completion and grade) and funnel (course page → enrollment → completion over days: 7, 30, 90 or 365, default 30). Use list_course_analytics_students for the per-student rows and get_course_student_analytics for one student. ${FRESHNESS} ${COURSE_TEAM_RULE}`,
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

  server.tool(
    'get_course_student_analytics',
    `One student's progress and grades in a course, with per-exercise results. profileId is the id list_course_analytics_students returns; 404 if that person is not in the course, 400 if they are not a student. Results may be up to 10 minutes old. ${COURSE_TEAM_RULE}`,
    courseStudentAnalyticsShape,
    READ_ONLY,
    async (args) => {
      const { courseId, profileId, ...query } = ZCourseStudentAnalyticsToolInput.parse(args);
      const result = await apiClient.getCourseStudentAnalytics(courseId, profileId, query);
      return jsonContent(result);
    }
  );
}
