import {
  ZAddCourseMembers,
  ZCourseInviteAuditParam,
  ZCourseInviteParam,
  ZCourseInviteRevokeParam,
  ZCourseMembersMemberParam,
  ZCourseMembersParam,
  ZCourseMembersQuery,
  ZCourseUserAnalyticsParam,
  ZCourseUserAnalyticsQuery,
  ZCreateCourseInvite,
  ZResetCourseMemberProgressParam,
  ZUpdateCourseMember
} from '@cio/utils/validation/course';
import { ZToggleInviteLink } from '@cio/utils/validation/invite-link';

import type { ClassroomIoApiClient } from '../api-client';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ZodRawShapeCompat } from '@modelcontextprotocol/sdk/server/zod-compat.js';
import * as z from 'zod';

export const ZListCourseMembersToolInput = ZCourseMembersQuery.extend({
  courseId: ZCourseMembersParam.shape.courseId
});

export const ZAddCourseMembersToolInput = z.object({
  courseId: ZCourseMembersParam.shape.courseId,
  members: ZAddCourseMembers
});

export const ZUpdateCourseMemberToolInput = ZUpdateCourseMember.extend({
  courseId: ZCourseMembersMemberParam.shape.courseId,
  memberId: ZCourseMembersMemberParam.shape.memberId
});

export const ZDeleteCourseMemberToolInput = ZCourseMembersMemberParam;

export const ZResetCourseMemberProgressToolInput = ZResetCourseMemberProgressParam;

export const ZGetCourseMemberAnalyticsToolInput = ZCourseUserAnalyticsQuery.extend({
  courseId: ZCourseUserAnalyticsParam.shape.courseId,
  userId: ZCourseUserAnalyticsParam.shape.userId
});

export const ZListCourseInvitesToolInput = ZCourseInviteParam;

export const ZCreateCourseInviteToolInput = ZCreateCourseInvite.safeExtend({
  courseId: ZCourseInviteParam.shape.courseId
});

export const ZGetCourseInviteLinkToolInput = ZCourseInviteParam;

export const ZCreateCourseInviteLinkToolInput = ZCourseInviteParam;

export const ZToggleCourseInviteLinkToolInput = ZToggleInviteLink.extend({
  courseId: ZCourseInviteParam.shape.courseId
});

export const ZRevokeCourseInviteToolInput = ZCourseInviteRevokeParam;

export const ZGetCourseInviteAuditToolInput = ZCourseInviteAuditParam;

const listCourseMembersShape = ZListCourseMembersToolInput.shape as unknown as ZodRawShapeCompat;
const addCourseMembersShape = ZAddCourseMembersToolInput.shape as unknown as ZodRawShapeCompat;
const updateCourseMemberShape = ZUpdateCourseMemberToolInput.shape as unknown as ZodRawShapeCompat;
const deleteCourseMemberShape = ZDeleteCourseMemberToolInput.shape as unknown as ZodRawShapeCompat;
const resetCourseMemberProgressShape = ZResetCourseMemberProgressToolInput.shape as unknown as ZodRawShapeCompat;
const getCourseMemberAnalyticsShape = ZGetCourseMemberAnalyticsToolInput.shape as unknown as ZodRawShapeCompat;
const listCourseInvitesShape = ZListCourseInvitesToolInput.shape as unknown as ZodRawShapeCompat;
const createCourseInviteShape = ZCreateCourseInviteToolInput.shape as unknown as ZodRawShapeCompat;
const getCourseInviteLinkShape = ZGetCourseInviteLinkToolInput.shape as unknown as ZodRawShapeCompat;
const createCourseInviteLinkShape = ZCreateCourseInviteLinkToolInput.shape as unknown as ZodRawShapeCompat;
const toggleCourseInviteLinkShape = ZToggleCourseInviteLinkToolInput.shape as unknown as ZodRawShapeCompat;
const revokeCourseInviteShape = ZRevokeCourseInviteToolInput.shape as unknown as ZodRawShapeCompat;
const getCourseInviteAuditShape = ZGetCourseInviteAuditToolInput.shape as unknown as ZodRawShapeCompat;

export function registerCourseMemberTools(server: McpServer, apiClient: ClassroomIoApiClient) {
  server.tool(
    'list_course_members',
    'List one page of members (admins, tutors, students) on a live course, optionally filtered by search term or role.',
    listCourseMembersShape,
    async (args) => {
      const { courseId, ...query } = ZListCourseMembersToolInput.parse(args);
      const result = await apiClient.listCourseMembers(courseId, query);
      return jsonContent(result);
    }
  );

  server.tool(
    'add_course_members',
    'Add one or more members to a course by profileId (existing org member) or email. Each member must be given a role.',
    addCourseMembersShape,
    async (args) => {
      const { courseId, members } = ZAddCourseMembersToolInput.parse(args);
      const result = await apiClient.addCourseMembers(courseId, members);
      return jsonContent(result);
    }
  );

  server.tool(
    'update_course_member',
    "Update an existing course member's role or email.",
    updateCourseMemberShape,
    async (args) => {
      const { courseId, memberId, ...payload } = ZUpdateCourseMemberToolInput.parse(args);
      const result = await apiClient.updateCourseMember(courseId, memberId, payload);
      return jsonContent(result);
    }
  );

  server.tool(
    'delete_course_member',
    'Remove a member from a course.',
    deleteCourseMemberShape,
    async (args) => {
      const { courseId, memberId } = ZDeleteCourseMemberToolInput.parse(args);
      const result = await apiClient.deleteCourseMember(courseId, memberId);
      return jsonContent(result);
    }
  );

  server.tool(
    'reset_course_member_progress',
    'Clear all learner progress for a student member while keeping them enrolled in the course.',
    resetCourseMemberProgressShape,
    async (args) => {
      const { courseId, memberId } = ZResetCourseMemberProgressToolInput.parse(args);
      const result = await apiClient.resetCourseMemberProgress(courseId, memberId);
      return jsonContent(result);
    }
  );

  server.tool(
    'get_course_member_analytics',
    "Get a specific user's analytics for a course (progress, stage, activity).",
    getCourseMemberAnalyticsShape,
    async (args) => {
      const { courseId, userId, ...query } = ZGetCourseMemberAnalyticsToolInput.parse(args);
      const result = await apiClient.getCourseMemberAnalytics(courseId, userId, query);
      return jsonContent(result);
    }
  );

  server.tool(
    'list_course_invites',
    'List secure invite tokens created for a course.',
    listCourseInvitesShape,
    async (args) => {
      const { courseId } = ZListCourseInvitesToolInput.parse(args);
      const result = await apiClient.listCourseInvites(courseId);
      return jsonContent(result);
    }
  );

  server.tool(
    'create_course_invite',
    'Create a secure student invite token for a course, scoped by preset expiry/uses and optionally restricted to specific emails or domains. Provide recipientEmails or recipientCsv to send the invite.',
    createCourseInviteShape,
    async (args) => {
      const { courseId, ...payload } = ZCreateCourseInviteToolInput.parse(args);
      const result = await apiClient.createCourseInvite(courseId, payload);
      return jsonContent(result);
    }
  );

  server.tool(
    'get_course_invite_link',
    "Get a course's shareable join link, or null if one hasn't been created yet.",
    getCourseInviteLinkShape,
    async (args) => {
      const { courseId } = ZGetCourseInviteLinkToolInput.parse(args);
      const result = await apiClient.getCourseInviteLink(courseId);
      return jsonContent(result);
    }
  );

  server.tool(
    'create_course_invite_link',
    "Get a course's shareable join link, creating it on first call.",
    createCourseInviteLinkShape,
    async (args) => {
      const { courseId } = ZCreateCourseInviteLinkToolInput.parse(args);
      const result = await apiClient.createCourseInviteLink(courseId);
      return jsonContent(result);
    }
  );

  server.tool(
    'toggle_course_invite_link',
    "Enable or disable a course's shareable join link.",
    toggleCourseInviteLinkShape,
    async (args) => {
      const { courseId, ...payload } = ZToggleCourseInviteLinkToolInput.parse(args);
      const result = await apiClient.toggleCourseInviteLink(courseId, payload);
      return jsonContent(result);
    }
  );

  server.tool(
    'revoke_course_invite',
    'Revoke a secure course invite token so it can no longer be used to join.',
    revokeCourseInviteShape,
    async (args) => {
      const { courseId, inviteId } = ZRevokeCourseInviteToolInput.parse(args);
      const result = await apiClient.revokeCourseInvite(courseId, inviteId);
      return jsonContent(result);
    }
  );

  server.tool(
    'get_course_invite_audit',
    'Get the audit trail (who used it, when) for a course invite token.',
    getCourseInviteAuditShape,
    async (args) => {
      const { courseId, inviteId } = ZGetCourseInviteAuditToolInput.parse(args);
      const result = await apiClient.getCourseInviteAudit(courseId, inviteId);
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
