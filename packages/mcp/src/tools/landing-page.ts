import { ZPublicApiSetFeaturedCourses } from '@cio/utils/validation/public-api';

import type { ClassroomIoApiClient } from '../api-client';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ZodRawShapeCompat } from '@modelcontextprotocol/sdk/server/zod-compat.js';
import type { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';

const ORG_ADMIN_RULE = 'the API key creator must be an org admin';

const UPDATE: ToolAnnotations = { readOnlyHint: false, destructiveHint: false, idempotentHint: true };

export function registerLandingPageTools(server: McpServer, apiClient: ClassroomIoApiClient) {
  server.tool(
    'set_featured_courses',
    `Set the published courses shown first, in order, on the organization landing page and public course list; ${ORG_ADMIN_RULE}. The list replaces the current one, so include every course to keep; an empty list clears it.`,
    ZPublicApiSetFeaturedCourses.shape as unknown as ZodRawShapeCompat,
    UPDATE,
    async (args) => {
      const payload = ZPublicApiSetFeaturedCourses.parse(args);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(await apiClient.setFeaturedCourses(payload)) }]
      };
    }
  );
}
