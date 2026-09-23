import {
  ZPublicApiAddCohortMembers,
  ZPublicApiAddCourseToCohort,
  ZPublicApiCohortCourseParam,
  ZPublicApiCohortMemberParam,
  ZPublicApiCohortParam,
  ZPublicApiCreateCohort,
  ZPublicApiPaginationQuery,
  ZPublicApiUpdateCohort,
  ZPublicApiUpdateCohortMember
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

export const ZListOrgCohortsToolInput = ZPublicApiPaginationQuery;

export const ZCreateCohortToolInput = ZPublicApiCreateCohort;

export const ZGetCohortToolInput = ZPublicApiCohortParam;

export const ZUpdateCohortToolInput = ZPublicApiUpdateCohort.safeExtend({
  cohortId: ZPublicApiCohortParam.shape.cohortId
});

export const ZDeleteCohortToolInput = ZPublicApiCohortParam;

export const ZListCohortMembersToolInput = ZPublicApiCohortParam.extend(ZPublicApiPaginationQuery.shape);

export const ZAddCohortMembersToolInput = ZPublicApiAddCohortMembers.safeExtend({
  cohortId: ZPublicApiCohortParam.shape.cohortId
});

export const ZUpdateCohortMemberToolInput = ZPublicApiUpdateCohortMember.extend({
  cohortId: ZPublicApiCohortMemberParam.shape.cohortId,
  memberId: ZPublicApiCohortMemberParam.shape.memberId
});

export const ZDeleteCohortMemberToolInput = ZPublicApiCohortMemberParam;

export const ZListCohortCoursesToolInput = ZPublicApiCohortParam.extend(ZPublicApiPaginationQuery.shape);

export const ZAddCohortCourseToolInput = ZPublicApiAddCourseToCohort.extend({
  cohortId: ZPublicApiCohortParam.shape.cohortId
});

export const ZRemoveCohortCourseToolInput = ZPublicApiCohortCourseParam;

const listOrgCohortsShape = ZListOrgCohortsToolInput.shape as unknown as ZodRawShapeCompat;
const createCohortShape = ZCreateCohortToolInput.shape as unknown as ZodRawShapeCompat;
const getCohortShape = ZGetCohortToolInput.shape as unknown as ZodRawShapeCompat;
const updateCohortShape = ZUpdateCohortToolInput.shape as unknown as ZodRawShapeCompat;
const deleteCohortShape = ZDeleteCohortToolInput.shape as unknown as ZodRawShapeCompat;
const listCohortMembersShape = ZListCohortMembersToolInput.shape as unknown as ZodRawShapeCompat;
const addCohortMembersShape = ZAddCohortMembersToolInput.shape as unknown as ZodRawShapeCompat;
const updateCohortMemberShape = ZUpdateCohortMemberToolInput.shape as unknown as ZodRawShapeCompat;
const deleteCohortMemberShape = ZDeleteCohortMemberToolInput.shape as unknown as ZodRawShapeCompat;
const listCohortCoursesShape = ZListCohortCoursesToolInput.shape as unknown as ZodRawShapeCompat;
const addCohortCourseShape = ZAddCohortCourseToolInput.shape as unknown as ZodRawShapeCompat;
const removeCohortCourseShape = ZRemoveCohortCourseToolInput.shape as unknown as ZodRawShapeCompat;

export function registerCohortTools(server: McpServer, apiClient: ClassroomIoApiClient) {
  server.tool(
    'list_org_cohorts',
    `List the cohorts the API key creator can see: all cohorts for an org admin, otherwise only cohorts they belong to. ${PAGINATED}`,
    listOrgCohortsShape,
    READ_ONLY,
    async (args) => {
      const query = ZListOrgCohortsToolInput.parse(args);
      const result = await apiClient.listCohorts(query);
      return jsonContent(result);
    }
  );

  server.tool(
    'create_cohort',
    'Create a cohort. The API key creator becomes its tutor.',
    createCohortShape,
    WRITE,
    async (args) => {
      const payload = ZCreateCohortToolInput.parse(args);
      const result = await apiClient.createCohort(payload);
      return jsonContent(result);
    }
  );

  server.tool('get_cohort', `Get a cohort by id. ${COHORT_MEMBER_RULE}`, getCohortShape, READ_ONLY, async (args) => {
    const { cohortId } = ZGetCohortToolInput.parse(args);
    const result = await apiClient.getCohort(cohortId);
    return jsonContent(result);
  });

  server.tool(
    'update_cohort',
    `Update a cohort. Send only the fields to change. ${COHORT_TEAM_RULE}`,
    updateCohortShape,
    WRITE,
    async (args) => {
      const { cohortId, ...payload } = ZUpdateCohortToolInput.parse(args);
      const result = await apiClient.updateCohort(cohortId, ZPublicApiUpdateCohort.parse(payload));
      return jsonContent(result);
    }
  );

  server.tool(
    'delete_cohort',
    `Permanently delete a cohort with its memberships, newsfeed, and goals. This is a hard delete and cannot be undone; to keep history, use update_cohort with status ARCHIVED. ${COHORT_TEAM_RULE}`,
    deleteCohortShape,
    DESTRUCTIVE,
    async (args) => {
      const { cohortId } = ZDeleteCohortToolInput.parse(args);
      const result = await apiClient.deleteCohort(cohortId);
      return jsonContent(result);
    }
  );

  server.tool(
    'list_cohort_members',
    `List the members of a cohort. ${PAGINATED} ${COHORT_MEMBER_RULE}`,
    listCohortMembersShape,
    READ_ONLY,
    async (args) => {
      const { cohortId, ...query } = ZListCohortMembersToolInput.parse(args);
      const result = await apiClient.listCohortMembers(cohortId, query);
      return jsonContent(result);
    }
  );

  server.tool(
    'add_cohort_members',
    `Add one or more members to a cohort, each with a role. A profileId must belong to someone already in the organization; an email can be anyone, and students added by email join the organization. Returns { added, errors } with one error message per member that failed. ${COHORT_TEAM_RULE}`,
    addCohortMembersShape,
    WRITE,
    async (args) => {
      const { cohortId, ...payload } = ZAddCohortMembersToolInput.parse(args);
      const result = await apiClient.addCohortMembers(cohortId, payload);
      return jsonContent(result);
    }
  );

  server.tool(
    'update_cohort_member',
    `Change a cohort member's role (tutor or student). ${COHORT_TEAM_RULE}`,
    updateCohortMemberShape,
    WRITE,
    async (args) => {
      const { cohortId, memberId, ...payload } = ZUpdateCohortMemberToolInput.parse(args);
      const result = await apiClient.updateCohortMember(cohortId, memberId, payload);
      return jsonContent(result);
    }
  );

  server.tool(
    'delete_cohort_member',
    `Remove a member from a cohort. Hard-deletes the cohort membership only; the person keeps their account, organization membership, and course enrolments. ${COHORT_TEAM_RULE}`,
    deleteCohortMemberShape,
    DESTRUCTIVE,
    async (args) => {
      const { cohortId, memberId } = ZDeleteCohortMemberToolInput.parse(args);
      const result = await apiClient.deleteCohortMember(cohortId, memberId);
      return jsonContent(result);
    }
  );

  server.tool(
    'list_cohort_courses',
    `List the courses linked to a cohort. If the API key creator is a student in the cohort, only published courses are returned. ${PAGINATED} ${COHORT_MEMBER_RULE}`,
    listCohortCoursesShape,
    READ_ONLY,
    async (args) => {
      const { cohortId, ...query } = ZListCohortCoursesToolInput.parse(args);
      const result = await apiClient.listCohortCourses(cohortId, query);
      return jsonContent(result);
    }
  );

  server.tool(
    'add_cohort_course',
    `Link a course from the organization to a cohort; existing cohort students are enrolled in it. Fails with 409 if already linked. ${COHORT_TEAM_RULE}`,
    addCohortCourseShape,
    WRITE,
    async (args) => {
      const { cohortId, ...payload } = ZAddCohortCourseToolInput.parse(args);
      const result = await apiClient.addCohortCourse(cohortId, payload);
      return jsonContent(result);
    }
  );

  server.tool(
    'remove_cohort_course',
    `Unlink a course from a cohort. The course itself is not deleted. ${COHORT_TEAM_RULE}`,
    removeCohortCourseShape,
    DESTRUCTIVE,
    async (args) => {
      const { cohortId, courseId } = ZRemoveCohortCourseToolInput.parse(args);
      const result = await apiClient.removeCohortCourse(cohortId, courseId);
      return jsonContent(result);
    }
  );
}
