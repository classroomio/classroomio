import {
  ZPublicApiTeamMemberParam,
  ZPublicApiTeamQuery,
  ZPublicApiUpdateTeamMember
} from '@cio/utils/validation/public-api';

import type { ClassroomIoApiClient } from '../api-client';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ZodRawShapeCompat } from '@modelcontextprotocol/sdk/server/zod-compat.js';
import type { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';

const ORG_ADMIN_RULE = 'The API key creator must be an org admin, otherwise 403.';

const READ_ONLY: ToolAnnotations = { readOnlyHint: true, destructiveHint: false };
const WRITE: ToolAnnotations = { readOnlyHint: false, destructiveHint: false };

export const ZListTeamMembersToolInput = ZPublicApiTeamQuery;

export const ZGetTeamMemberToolInput = ZPublicApiTeamMemberParam;

export const ZUpdateTeamMemberToolInput = ZPublicApiUpdateTeamMember.safeExtend({
  memberId: ZPublicApiTeamMemberParam.shape.memberId
});

const listTeamMembersShape = ZListTeamMembersToolInput.shape as unknown as ZodRawShapeCompat;
const getTeamMemberShape = ZGetTeamMemberToolInput.shape as unknown as ZodRawShapeCompat;
const updateTeamMemberShape = ZUpdateTeamMemberToolInput.shape as unknown as ZodRawShapeCompat;

export function registerTeamTools(server: McpServer, apiClient: ClassroomIoApiClient) {
  server.tool(
    'list_team_members',
    `List the organization's admins and tutors, including people whose invite is still pending. Paginated. Students are listed by list_audience_members. ${ORG_ADMIN_RULE}`,
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
    `Get a single admin or tutor by their organization member id (from list_team_members). ${ORG_ADMIN_RULE}`,
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
    `Change a team member's organization role, their name, or both. Send only the fields to change. roleId switches them between admin (1) and tutor (2): the key creator cannot change their own role, and the organization must keep at least one admin (both 400). name sets the full name on a joined member's profile (400 for a pending member); the profile is shared, so the name changes in every organization the person belongs to. ${ORG_ADMIN_RULE}`,
    updateTeamMemberShape,
    WRITE,
    async (args) => {
      const { memberId, ...payload } = ZUpdateTeamMemberToolInput.parse(args);
      const result = await apiClient.updateTeamMember(memberId, ZPublicApiUpdateTeamMember.parse(payload));
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
