import {
  ZPublicApiAddCohortMembers,
  ZPublicApiAddCourseToCohort,
  ZPublicApiAssignStudentsToCohort,
  ZPublicApiCohortCourseParam,
  ZPublicApiCohortMemberParam,
  ZPublicApiCohortMembersQuery,
  ZPublicApiCohortParam,
  ZPublicApiCohortsQuery,
  ZPublicApiCreateCohort,
  ZPublicApiInviteStudentsToCohort,
  ZPublicApiPaginationQuery,
  ZPublicApiSetCohortInviteLinkRevoked,
  ZPublicApiUpdateCohort,
  ZPublicApiUpdateCohortMember
} from '@cio/utils/validation/public-api';

import type { ClassroomIoApiClient } from '../api-client';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ZodRawShapeCompat } from '@modelcontextprotocol/sdk/server/zod-compat.js';
import { COHORT_MEMBER_RULE, COHORT_TEAM_RULE, DESTRUCTIVE, READ_ONLY, WRITE, jsonContent } from './cohort-tool-text';

export const ZListOrgCohortsToolInput = ZPublicApiCohortsQuery;

export const ZCreateCohortToolInput = ZPublicApiCreateCohort;

export const ZGetCohortToolInput = ZPublicApiCohortParam;

export const ZUpdateCohortToolInput = ZPublicApiUpdateCohort.safeExtend({
  cohortId: ZPublicApiCohortParam.shape.cohortId
});

export const ZDeleteCohortToolInput = ZPublicApiCohortParam;

export const ZListCohortMembersToolInput = ZPublicApiCohortParam.extend(ZPublicApiCohortMembersQuery.shape);

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

export const ZInviteStudentsToCohortToolInput = ZPublicApiInviteStudentsToCohort.extend({
  cohortId: ZPublicApiCohortParam.shape.cohortId
});

export const ZAssignStudentsToCohortToolInput = ZPublicApiAssignStudentsToCohort.extend({
  cohortId: ZPublicApiCohortParam.shape.cohortId
});

export const ZCohortInviteLinkToolInput = ZPublicApiCohortParam;

export const ZSetCohortInviteLinkRevokedToolInput = ZPublicApiSetCohortInviteLinkRevoked.extend({
  cohortId: ZPublicApiCohortParam.shape.cohortId
});

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
const inviteStudentsToCohortShape = ZInviteStudentsToCohortToolInput.shape as unknown as ZodRawShapeCompat;
const assignStudentsToCohortShape = ZAssignStudentsToCohortToolInput.shape as unknown as ZodRawShapeCompat;
const cohortInviteLinkShape = ZCohortInviteLinkToolInput.shape as unknown as ZodRawShapeCompat;
const setCohortInviteLinkRevokedShape = ZSetCohortInviteLinkRevokedToolInput.shape as unknown as ZodRawShapeCompat;

export function registerCohortTools(server: McpServer, apiClient: ClassroomIoApiClient) {
  server.tool(
    'list_org_cohorts',
    'List the cohorts the API key creator can see: every cohort for an org admin, otherwise only the ones they belong to.',
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
    'Create a cohort, with the API key creator added as its tutor.',
    createCohortShape,
    WRITE,
    async (args) => {
      const payload = ZCreateCohortToolInput.parse(args);
      const result = await apiClient.createCohort(payload);
      return jsonContent(result);
    }
  );

  server.tool('get_cohort', `Get a cohort; ${COHORT_MEMBER_RULE}.`, getCohortShape, READ_ONLY, async (args) => {
    const { cohortId } = ZGetCohortToolInput.parse(args);
    const result = await apiClient.getCohort(cohortId);
    return jsonContent(result);
  });

  server.tool(
    'update_cohort',
    `Update the fields you send on a cohort; ${COHORT_TEAM_RULE}.`,
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
    `Permanently delete a cohort with its memberships, newsfeed and goals; ${COHORT_TEAM_RULE}. To keep history, use update_cohort with status ARCHIVED instead.`,
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
    `List the members of a cohort; ${COHORT_MEMBER_RULE}.`,
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
    `Add people to a cohort directly, each with a role and without an invitation email (invite_students_to_cohort sends one); ${COHORT_TEAM_RULE}. Returns { added, errors }, and retrying is safe because existing members fail with code MEMBER_ALREADY_IN_COHORT.`,
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
    `Change a cohort member's role to tutor or student; ${COHORT_TEAM_RULE}.`,
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
    `Permanently remove a member from a cohort without touching their account or enrolments; ${COHORT_TEAM_RULE}.`,
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
    `List the courses linked to a cohort (published ones only when the API key creator is a student in it); ${COHORT_MEMBER_RULE}.`,
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
    `Link a course from the organization to a cohort and enrol the cohort's existing members in it; ${COHORT_TEAM_RULE}. Fails with 409 if already linked.`,
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
    `Unlink a course from a cohort without deleting the course; ${COHORT_TEAM_RULE}.`,
    removeCohortCourseShape,
    DESTRUCTIVE,
    async (args) => {
      const { cohortId, courseId } = ZRemoveCohortCourseToolInput.parse(args);
      const result = await apiClient.removeCohortCourse(cohortId, courseId);
      return jsonContent(result);
    }
  );

  server.tool(
    'list_my_enrolled_cohorts',
    'List the cohorts the API key creator is enrolled in within this organization, with their role in each.',
    listOrgCohortsShape,
    READ_ONLY,
    async (args) => {
      const result = await apiClient.listMyEnrolledCohorts(ZPublicApiPaginationQuery.parse(args));
      return jsonContent(result);
    }
  );

  server.tool(
    'invite_students_to_cohort',
    `Invite students to a cohort by email, like the dashboard invite modal; ${COHORT_TEAM_RULE}. Returns a status for each CSV row.`,
    inviteStudentsToCohortShape,
    WRITE,
    async (args) => {
      const { cohortId, ...payload } = ZInviteStudentsToCohortToolInput.parse(args);
      const result = await apiClient.inviteStudentsToCohort(cohortId, payload);
      return jsonContent(result);
    }
  );

  server.tool(
    'assign_students_to_cohort',
    `Add students already in the organization's audience to a cohort; ${COHORT_TEAM_RULE}.`,
    assignStudentsToCohortShape,
    WRITE,
    async (args) => {
      const { cohortId, ...payload } = ZAssignStudentsToCohortToolInput.parse(args);
      const result = await apiClient.assignStudentsToCohort(cohortId, payload);
      return jsonContent(result);
    }
  );

  server.tool(
    'get_cohort_invite_link',
    `Get the cohort's shareable student join link, or null if none has been created; ${COHORT_TEAM_RULE}.`,
    cohortInviteLinkShape,
    READ_ONLY,
    async (args) => {
      const { cohortId } = ZCohortInviteLinkToolInput.parse(args);
      const result = await apiClient.getCohortInviteLink(cohortId);
      return jsonContent(result);
    }
  );

  server.tool(
    'create_cohort_invite_link',
    `Get the cohort's shareable student join link, creating it on the first call; ${COHORT_TEAM_RULE}.`,
    cohortInviteLinkShape,
    { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
    async (args) => {
      const { cohortId } = ZCohortInviteLinkToolInput.parse(args);
      const result = await apiClient.createCohortInviteLink(cohortId);
      return jsonContent(result);
    }
  );

  server.tool(
    'set_cohort_invite_link_revoked',
    `Disable or re-enable the cohort's student join link; ${COHORT_TEAM_RULE}.`,
    setCohortInviteLinkRevokedShape,
    { readOnlyHint: false, destructiveHint: true, idempotentHint: true },
    async (args) => {
      const { cohortId, ...payload } = ZSetCohortInviteLinkRevokedToolInput.parse(args);
      const result = await apiClient.setCohortInviteLinkRevoked(cohortId, payload);
      return jsonContent(result);
    }
  );
}
