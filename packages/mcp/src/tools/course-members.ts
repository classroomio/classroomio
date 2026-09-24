import {
  ZPublicApiAddCourseMember,
  ZPublicApiCourseInviteParam,
  ZPublicApiCourseInviteRevokeParam,
  ZPublicApiCourseInvitesQuery,
  ZPublicApiCourseMemberAnalyticsQuery,
  ZPublicApiCourseMemberParam,
  ZPublicApiCourseMembersQuery,
  ZPublicApiCourseParam,
  ZPublicApiCreateCourseInvite,
  ZPublicApiUpdateCourseMember
} from '@cio/utils/validation/public-api';

import type { ClassroomIoApiClient } from '../api-client';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ZodRawShapeCompat } from '@modelcontextprotocol/sdk/server/zod-compat.js';
import type { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';

const COURSE_TEAM_RULE = 'The API key creator must be a course tutor/admin or an org admin, otherwise 403.';

const READ_ONLY: ToolAnnotations = { readOnlyHint: true, destructiveHint: false };
const WRITE: ToolAnnotations = { readOnlyHint: false, destructiveHint: false };
const DESTRUCTIVE: ToolAnnotations = { readOnlyHint: false, destructiveHint: true };

export const ZListCourseMembersToolInput = ZPublicApiCourseMembersQuery.safeExtend({
  courseId: ZPublicApiCourseParam.shape.courseId
});

export const ZAddCourseMemberToolInput = ZPublicApiAddCourseMember.safeExtend({
  courseId: ZPublicApiCourseParam.shape.courseId
});

export const ZGetCourseMemberToolInput = ZPublicApiCourseMemberParam;

export const ZUpdateCourseMemberToolInput = ZPublicApiUpdateCourseMember.safeExtend({
  courseId: ZPublicApiCourseMemberParam.shape.courseId,
  memberId: ZPublicApiCourseMemberParam.shape.memberId
});

export const ZDeleteCourseMemberToolInput = ZPublicApiCourseMemberParam;

export const ZResetCourseMemberProgressToolInput = ZPublicApiCourseMemberParam;

export const ZGetCourseMemberAnalyticsToolInput = ZPublicApiCourseMemberAnalyticsQuery.safeExtend({
  courseId: ZPublicApiCourseMemberParam.shape.courseId,
  memberId: ZPublicApiCourseMemberParam.shape.memberId
});

export const ZListCourseInvitesToolInput = ZPublicApiCourseInvitesQuery.safeExtend({
  courseId: ZPublicApiCourseInviteParam.shape.courseId
});

export const ZCreateCourseInviteToolInput = ZPublicApiCreateCourseInvite.safeExtend({
  courseId: ZPublicApiCourseInviteParam.shape.courseId
});

export const ZRevokeCourseInviteToolInput = ZPublicApiCourseInviteRevokeParam;

const listCourseMembersShape = ZListCourseMembersToolInput.shape as unknown as ZodRawShapeCompat;
const addCourseMemberShape = ZAddCourseMemberToolInput.shape as unknown as ZodRawShapeCompat;
const getCourseMemberShape = ZGetCourseMemberToolInput.shape as unknown as ZodRawShapeCompat;
const updateCourseMemberShape = ZUpdateCourseMemberToolInput.shape as unknown as ZodRawShapeCompat;
const deleteCourseMemberShape = ZDeleteCourseMemberToolInput.shape as unknown as ZodRawShapeCompat;
const resetCourseMemberProgressShape = ZResetCourseMemberProgressToolInput.shape as unknown as ZodRawShapeCompat;
const getCourseMemberAnalyticsShape = ZGetCourseMemberAnalyticsToolInput.shape as unknown as ZodRawShapeCompat;
const listCourseInvitesShape = ZListCourseInvitesToolInput.shape as unknown as ZodRawShapeCompat;
const createCourseInviteShape = ZCreateCourseInviteToolInput.shape as unknown as ZodRawShapeCompat;
const revokeCourseInviteShape = ZRevokeCourseInviteToolInput.shape as unknown as ZodRawShapeCompat;

export function registerCourseMemberTools(server: McpServer, apiClient: ClassroomIoApiClient) {
  server.tool(
    'list_course_members',
    `List everyone with access to a course (students and tutors), with role and progress. Paginated. ${COURSE_TEAM_RULE}`,
    listCourseMembersShape,
    READ_ONLY,
    async (args) => {
      const { courseId, ...query } = ZListCourseMembersToolInput.parse(args);
      const result = await apiClient.listCourseMembers(courseId, query);
      return jsonContent(result);
    }
  );

  server.tool(
    'add_course_member',
    `Give someone access to a course, by profileId (must already be in the organization) or email. Fails with 409 if they are already a member. To onboard someone new with an invite email, use create_course_invite. ${COURSE_TEAM_RULE}`,
    addCourseMemberShape,
    WRITE,
    async (args) => {
      const { courseId, ...payload } = ZAddCourseMemberToolInput.parse(args);
      const result = await apiClient.addCourseMember(courseId, payload);
      return jsonContent(result);
    }
  );

  server.tool(
    'get_course_member',
    `Get a single course member's detail. ${COURSE_TEAM_RULE}`,
    getCourseMemberShape,
    READ_ONLY,
    async (args) => {
      const { courseId, memberId } = ZGetCourseMemberToolInput.parse(args);
      const result = await apiClient.getCourseMember(courseId, memberId);
      return jsonContent(result);
    }
  );

  server.tool(
    'update_course_member',
    `Change a course member's role or email. Send only the fields to change. ${COURSE_TEAM_RULE}`,
    updateCourseMemberShape,
    WRITE,
    async (args) => {
      const { courseId, memberId, ...payload } = ZUpdateCourseMemberToolInput.parse(args);
      const result = await apiClient.updateCourseMember(
        courseId,
        memberId,
        ZPublicApiUpdateCourseMember.parse(payload)
      );
      return jsonContent(result);
    }
  );

  server.tool(
    'delete_course_member',
    `Remove someone's access to a course. This is a hard delete of the course membership; the person keeps their account and organization membership. ${COURSE_TEAM_RULE}`,
    deleteCourseMemberShape,
    DESTRUCTIVE,
    async (args) => {
      const { courseId, memberId } = ZDeleteCourseMemberToolInput.parse(args);
      const result = await apiClient.deleteCourseMember(courseId, memberId);
      return jsonContent(result);
    }
  );

  server.tool(
    'reset_course_member_progress',
    `Clear a student's completion progress while keeping them enrolled. This cannot be undone. Only student members can have their progress reset. ${COURSE_TEAM_RULE}`,
    resetCourseMemberProgressShape,
    DESTRUCTIVE,
    async (args) => {
      const { courseId, memberId } = ZResetCourseMemberProgressToolInput.parse(args);
      const result = await apiClient.resetCourseMemberProgress(courseId, memberId);
      return jsonContent(result);
    }
  );

  server.tool(
    'get_course_member_analytics',
    `Fetch a student's progress and grade analytics for a course. Only student members have analytics. ${COURSE_TEAM_RULE}`,
    getCourseMemberAnalyticsShape,
    READ_ONLY,
    async (args) => {
      const { courseId, memberId, ...query } = ZGetCourseMemberAnalyticsToolInput.parse(args);
      const result = await apiClient.getCourseMemberAnalytics(courseId, memberId, query);
      return jsonContent(result);
    }
  );

  server.tool(
    'list_course_invites',
    `List invites for a course, of any status (active, revoked, expired, or used up). Paginated. ${COURSE_TEAM_RULE}`,
    listCourseInvitesShape,
    READ_ONLY,
    async (args) => {
      const { courseId, ...query } = ZListCourseInvitesToolInput.parse(args);
      const result = await apiClient.listCourseInvites(courseId, query);
      return jsonContent(result);
    }
  );

  server.tool(
    'create_course_invite',
    `Invite one or more people to a course by email or CSV. Unlike add_course_member, this can onboard someone who is not yet an organization member. Requires recipientEmails or recipientCsv. Limited to 60 requests per hour per key creator per course. ${COURSE_TEAM_RULE}`,
    createCourseInviteShape,
    WRITE,
    async (args) => {
      const { courseId, ...payload } = ZCreateCourseInviteToolInput.parse(args);
      const result = await apiClient.createCourseInvite(courseId, payload);
      return jsonContent(result);
    }
  );

  server.tool(
    'revoke_course_invite',
    `Revoke a pending course invite. The invite link stops working and this cannot be undone. ${COURSE_TEAM_RULE}`,
    revokeCourseInviteShape,
    DESTRUCTIVE,
    async (args) => {
      const { courseId, inviteId } = ZRevokeCourseInviteToolInput.parse(args);
      const result = await apiClient.revokeCourseInvite(courseId, inviteId);
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
