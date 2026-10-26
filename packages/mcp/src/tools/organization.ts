import { ZPublicApiUpdateOrganization } from '@cio/utils/validation/public-api';

import type { ClassroomIoApiClient } from '../api-client';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ZodRawShapeCompat } from '@modelcontextprotocol/sdk/server/zod-compat.js';
import type { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';

const ORG_ADMIN_RULE = 'the API key creator must be an org admin';

const READ_ONLY: ToolAnnotations = { readOnlyHint: true, destructiveHint: false };
const UPDATE: ToolAnnotations = { readOnlyHint: false, destructiveHint: false, idempotentHint: true };

const updateOrganizationShape = ZPublicApiUpdateOrganization.shape as unknown as ZodRawShapeCompat;

export function registerOrganizationTools(server: McpServer, apiClient: ClassroomIoApiClient) {
  server.tool(
    'get_organization',
    `Get the organization's name, logo and theme; ${ORG_ADMIN_RULE}.`,
    {},
    READ_ONLY,
    async () => jsonContent(await apiClient.getOrganization())
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
