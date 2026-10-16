import {
  ZPublicApiAssignAudienceCourses,
  ZPublicApiAudienceMemberParam,
  ZPublicApiAudienceQuery,
  ZPublicApiCreateAudience,
  ZPublicApiUpdateAudience
} from '@cio/utils/validation/public-api';

import type { ClassroomIoApiClient } from '../api-client';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ZodRawShapeCompat } from '@modelcontextprotocol/sdk/server/zod-compat.js';
import type { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';

const ORG_ADMIN_RULE = 'The API key creator must be an org admin, otherwise 403.';

const READ_ONLY: ToolAnnotations = { readOnlyHint: true, destructiveHint: false };
const WRITE: ToolAnnotations = { readOnlyHint: false, destructiveHint: false };
const DESTRUCTIVE: ToolAnnotations = { readOnlyHint: false, destructiveHint: true };

export const ZListAudienceMembersToolInput = ZPublicApiAudienceQuery;

export const ZAddAudienceMemberToolInput = ZPublicApiCreateAudience;

export const ZAssignAudienceCoursesToolInput = ZPublicApiAssignAudienceCourses;

export const ZGetAudienceMemberToolInput = ZPublicApiAudienceMemberParam;

export const ZUpdateAudienceMemberToolInput = ZPublicApiUpdateAudience.safeExtend({
  memberId: ZPublicApiAudienceMemberParam.shape.memberId
});

export const ZRemoveAudienceMemberToolInput = ZPublicApiAudienceMemberParam;

const listAudienceMembersShape = ZListAudienceMembersToolInput.shape as unknown as ZodRawShapeCompat;
const addAudienceMemberShape = ZAddAudienceMemberToolInput.shape as unknown as ZodRawShapeCompat;
const assignAudienceCoursesShape = ZAssignAudienceCoursesToolInput.shape as unknown as ZodRawShapeCompat;
const getAudienceMemberShape = ZGetAudienceMemberToolInput.shape as unknown as ZodRawShapeCompat;
const updateAudienceMemberShape = ZUpdateAudienceMemberToolInput.shape as unknown as ZodRawShapeCompat;
const removeAudienceMemberShape = ZRemoveAudienceMemberToolInput.shape as unknown as ZodRawShapeCompat;

export function registerAudienceTools(server: McpServer, apiClient: ClassroomIoApiClient) {
  server.tool(
    'list_audience_members',
    `List the organization's audience (students), with invite state, enrollment counts and progress. Paginated, with search, sort and filters. Admins and tutors are listed by list_team_members. ${ORG_ADMIN_RULE}`,
    listAudienceMembersShape,
    READ_ONLY,
    async (args) => {
      const query = ZListAudienceMembersToolInput.parse(args);
      const result = await apiClient.listAudienceMembers(query);
      return jsonContent(result);
    }
  );

  server.tool(
    'add_audience_member',
    `Invite someone to the organization as a student by email, optionally enrolling them in courses. Sends an invite email unless sendEmail is false. ${ORG_ADMIN_RULE}`,
    addAudienceMemberShape,
    WRITE,
    async (args) => {
      const payload = ZAddAudienceMemberToolInput.parse(args);
      const result = await apiClient.addAudienceMember(payload);
      return jsonContent(result);
    }
  );

  server.tool(
    'assign_audience_courses',
    `Enroll existing students (by profileId) in one or more courses or cohorts. Requires courseIds or cohortIds. Students already enrolled are skipped and counted. ${ORG_ADMIN_RULE}`,
    assignAudienceCoursesShape,
    WRITE,
    async (args) => {
      const payload = ZAssignAudienceCoursesToolInput.parse(args);
      const result = await apiClient.assignAudienceCourses(payload);
      return jsonContent(result);
    }
  );

  server.tool(
    'get_audience_member',
    `Get a single student by their organization member id (from list_audience_members). ${ORG_ADMIN_RULE}`,
    getAudienceMemberShape,
    READ_ONLY,
    async (args) => {
      const { memberId } = ZGetAudienceMemberToolInput.parse(args);
      const result = await apiClient.getAudienceMember(memberId);
      return jsonContent(result);
    }
  );

  server.tool(
    'update_audience_member',
    `Update a student. Send only the fields to change. email corrects the address of a member who has not accepted their invite yet and re-sends the invite (400 for a joined member). name sets the full name on a joined member's profile (400 for a pending member); the profile is shared, so the name changes in every organization the person belongs to. To change an admin's or tutor's role, use update_team_member. ${ORG_ADMIN_RULE}`,
    updateAudienceMemberShape,
    WRITE,
    async (args) => {
      const { memberId, ...payload } = ZUpdateAudienceMemberToolInput.parse(args);
      const result = await apiClient.updateAudienceMember(memberId, ZPublicApiUpdateAudience.parse(payload));
      return jsonContent(result);
    }
  );

  server.tool(
    'remove_audience_member',
    `Remove a student from the organization. This is a hard delete of the organization membership and revokes their pending invites; the person keeps their account. ${ORG_ADMIN_RULE}`,
    removeAudienceMemberShape,
    DESTRUCTIVE,
    async (args) => {
      const { memberId } = ZRemoveAudienceMemberToolInput.parse(args);
      const result = await apiClient.removeAudienceMember(memberId);
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
