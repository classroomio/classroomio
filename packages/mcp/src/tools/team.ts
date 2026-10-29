import * as z from 'zod';
import {
  ZPublicApiCreateTeamInviteLink,
  ZPublicApiInviteTeamMembers,
  ZPublicApiTeamInviteLinkQuery,
  ZPublicApiTeamMemberParam,
  ZPublicApiTeamQuery,
  ZPublicApiUpdateTeamInviteLink,
  ZPublicApiUpdateTeamMember
} from '@cio/utils/validation/public-api';

import type { ClassroomIoApiClient } from '../api-client';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ZodRawShapeCompat } from '@modelcontextprotocol/sdk/server/zod-compat.js';
import type { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';

const ORG_ADMIN_RULE = 'the API key creator must be an org admin';

const READ_ONLY: ToolAnnotations = { readOnlyHint: true, destructiveHint: false };
const WRITE: ToolAnnotations = { readOnlyHint: false, destructiveHint: false };
const DESTRUCTIVE: ToolAnnotations = { readOnlyHint: false, destructiveHint: true };

export const ZListTeamMembersToolInput = ZPublicApiTeamQuery;

export const ZGetTeamMemberToolInput = ZPublicApiTeamMemberParam;

export const ZUpdateTeamMemberToolInput = ZPublicApiUpdateTeamMember.safeExtend({
  memberId: ZPublicApiTeamMemberParam.shape.memberId
});

export const ZInviteTeamMembersToolInput = ZPublicApiInviteTeamMembers;

export const ZRemoveTeamMemberToolInput = ZPublicApiTeamMemberParam;

export const ZGetTeamInviteLinkToolInput = ZPublicApiTeamInviteLinkQuery;

export const ZSetTeamInviteLinkToolInput = z.object({
  roleId: ZPublicApiUpdateTeamInviteLink.shape.roleId,
  enabled: z
    .boolean()
    .describe(
      "true returns the role's active link, creating a new one if it has none or its link is off; false turns the link off"
    )
});

const listTeamMembersShape = ZListTeamMembersToolInput.shape as unknown as ZodRawShapeCompat;
const getTeamMemberShape = ZGetTeamMemberToolInput.shape as unknown as ZodRawShapeCompat;
const updateTeamMemberShape = ZUpdateTeamMemberToolInput.shape as unknown as ZodRawShapeCompat;
const inviteTeamMembersShape = ZInviteTeamMembersToolInput.shape as unknown as ZodRawShapeCompat;
const removeTeamMemberShape = ZRemoveTeamMemberToolInput.shape as unknown as ZodRawShapeCompat;
const getTeamInviteLinkShape = ZGetTeamInviteLinkToolInput.shape as unknown as ZodRawShapeCompat;
const setTeamInviteLinkShape = ZSetTeamInviteLinkToolInput.shape as unknown as ZodRawShapeCompat;

export function registerTeamTools(server: McpServer, apiClient: ClassroomIoApiClient) {
  server.tool(
    'list_team_members',
    `List the organization's admins and tutors, including pending invites; ${ORG_ADMIN_RULE}. Students are listed by list_audience_members.`,
    listTeamMembersShape,
    READ_ONLY,
    async (args) => {
      const query = ZListTeamMembersToolInput.parse(args);
      const result = await apiClient.listTeamMembers(query);
      return jsonContent(result);
    }
  );

  server.tool(
    'get_team_member',
    `Get an admin or tutor by their organization member id (from list_team_members); ${ORG_ADMIN_RULE}.`,
    getTeamMemberShape,
    READ_ONLY,
    async (args) => {
      const { memberId } = ZGetTeamMemberToolInput.parse(args);
      const result = await apiClient.getTeamMember(memberId);
      return jsonContent(result);
    }
  );

  server.tool(
    'update_team_member',
    `Change a team member's organization role, name, or both; ${ORG_ADMIN_RULE}.`,
    updateTeamMemberShape,
    WRITE,
    async (args) => {
      const { memberId, ...payload } = ZUpdateTeamMemberToolInput.parse(args);
      const result = await apiClient.updateTeamMember(memberId, ZPublicApiUpdateTeamMember.parse(payload));
      return jsonContent(result);
    }
  );

  server.tool(
    'invite_team_members',
    `Email invites to join the team as admins or tutors; ${ORG_ADMIN_RULE}. If requiresConfirmation comes back true, nothing was sent: ask the user before calling again with the studentEmails in confirmedStudentEmails, which promotes those students.`,
    inviteTeamMembersShape,
    WRITE,
    async (args) => {
      const payload = ZInviteTeamMembersToolInput.parse(args);
      const result = await apiClient.inviteTeamMembers(payload);
      return jsonContent(result);
    }
  );

  server.tool(
    'remove_team_member',
    `Remove an admin or tutor from the organization and revoke their pending invites; ${ORG_ADMIN_RULE}. You cannot remove yourself or the last admin.`,
    removeTeamMemberShape,
    DESTRUCTIVE,
    async (args) => {
      const { memberId } = ZRemoveTeamMemberToolInput.parse(args);
      const result = await apiClient.removeTeamMember(memberId);
      return jsonContent(result);
    }
  );

  server.tool(
    'get_team_invite_link',
    `Get a role's reusable team invite link, or null if it has none or the link is off; ${ORG_ADMIN_RULE}.`,
    getTeamInviteLinkShape,
    READ_ONLY,
    async (args) => {
      const { roleId } = ZGetTeamInviteLinkToolInput.parse(args);
      const result = await apiClient.getTeamInviteLink(roleId);
      return jsonContent(result);
    }
  );

  server.tool(
    'set_team_invite_link',
    `Turn a role's reusable team invite link on or off; ${ORG_ADMIN_RULE}. Anyone with an active link can join with that role.`,
    setTeamInviteLinkShape,
    WRITE,
    async (args) => {
      const { roleId, enabled } = ZSetTeamInviteLinkToolInput.parse(args);
      const result = enabled
        ? await apiClient.createTeamInviteLink(ZPublicApiCreateTeamInviteLink.parse({ roleId }))
        : await apiClient.updateTeamInviteLink({ roleId, enabled: false });
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
