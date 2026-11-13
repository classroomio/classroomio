import {
  PUBLIC_API_ORGANIZATION_OVERVIEW_SECTION_NOTES,
  ZPublicApiOrganizationOverviewQuery,
  ZPublicApiUpdateOrganization,
  ZPublicApiUpdateOrganizationCustomization
} from '@cio/utils/validation/public-api';

import type { ClassroomIoApiClient } from '../api-client';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ZodRawShapeCompat } from '@modelcontextprotocol/sdk/server/zod-compat.js';
import { withNotes } from './cohort-tool-text';
import type { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';

const ORG_ADMIN_RULE = 'the API key creator must be an org admin';

const ORG_TEAM_RULE = 'the API key creator must be an org admin or tutor';

export const ZGetOrgOverviewToolInput = ZPublicApiOrganizationOverviewQuery.extend({
  include: withNotes(ZPublicApiOrganizationOverviewQuery.shape.include, PUBLIC_API_ORGANIZATION_OVERVIEW_SECTION_NOTES)
});
const getOrgOverviewShape = ZGetOrgOverviewToolInput.shape as unknown as ZodRawShapeCompat;

const READ_ONLY: ToolAnnotations = { readOnlyHint: true, destructiveHint: false };
const UPDATE: ToolAnnotations = { readOnlyHint: false, destructiveHint: true, idempotentHint: true };

const updateOrganizationShape = ZPublicApiUpdateOrganization.shape as unknown as ZodRawShapeCompat;
const updateCustomizationShape = ZPublicApiUpdateOrganizationCustomization.shape as unknown as ZodRawShapeCompat;

export function registerOrganizationTools(server: McpServer, apiClient: ClassroomIoApiClient) {
  server.tool(
    'get_organization',
    `Get the organization's name, logo and theme; ${ORG_ADMIN_RULE}.`,
    {},
    READ_ONLY,
    async () => jsonContent(await apiClient.getOrganization())
  );

  server.tool(
    'get_org_overview',
    `Get the organization overview (the Dashboard page), with the sections chosen by include; ${ORG_TEAM_RULE}. Sections the key creator may not see are left out and listed in meta.omitted; each section may be up to 10 minutes old (login activity: 24 hours), and meta.generatedAt says when.`,
    getOrgOverviewShape,
    READ_ONLY,
    async (args) => {
      const query = ZGetOrgOverviewToolInput.parse(args);
      return jsonContent(await apiClient.getOrgOverview(query));
    }
  );

  server.tool(
    'update_organization',
    `Update the organization's name, logo or theme; omitted fields keep their values; ${ORG_ADMIN_RULE}. Students and site visitors see the change.`,
    updateOrganizationShape,
    UPDATE,
    async (args) => {
      const payload = ZPublicApiUpdateOrganization.parse(args);
      return jsonContent(await apiClient.updateOrganization(payload));
    }
  );

  server.tool(
    'get_organization_customization',
    `Get the LMS customization students see: Community and Exercises in the dashboard, the dashboard banner, the course News Feed and marks, lesson comments, and the login background. Defaults are filled in; ${ORG_ADMIN_RULE}.`,
    {},
    READ_ONLY,
    async () => jsonContent(await apiClient.getOrganizationCustomization())
  );

  server.tool(
    'update_organization_customization',
    `Update the LMS customization; omitted fields keep their values; ${ORG_ADMIN_RULE}. Images are http(s) URLs, null removes them. Setting a login background needs a paid plan or a self-hosted install. Students see the change.`,
    updateCustomizationShape,
    UPDATE,
    async (args) => {
      const payload = ZPublicApiUpdateOrganizationCustomization.parse(args);
      return jsonContent(await apiClient.updateOrganizationCustomization(payload));
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
