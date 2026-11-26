import { ZPublicApiCreateImageUpload } from '@cio/utils/validation/public-api';

import type { ClassroomIoApiClient } from '../api-client';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';
import type { ZodRawShapeCompat } from '@modelcontextprotocol/sdk/server/zod-compat.js';
import { jsonContent, withNotes } from './cohort-tool-text';

const CREATE: ToolAnnotations = { readOnlyHint: false, destructiveHint: false, idempotentHint: false };

export const ZCreateImageUploadToolInput = ZPublicApiCreateImageUpload.extend({
  purpose: withNotes(ZPublicApiCreateImageUpload.shape.purpose, [
    'Default limits: content 5 MB (lesson image blocks, exercise option images), cover 0.5 MB (course banner, dashboard banner, login background, favicon), avatar 2 MB (logo, profile and instructor photos, certificate images).'
  ]),
  byteSize: withNotes(ZPublicApiCreateImageUpload.shape.byteSize, [
    'Send exactly this many bytes to uploadUrl; a different size is refused by storage.'
  ])
});

export function registerImageUploadTools(server: McpServer, apiClient: ClassroomIoApiClient) {
  server.tool(
    'create_image_upload',
    'Get an upload URL for a jpg, png, gif or webp image and the permanent public url it will be served at, for image blocks, exercise options, banners, logos and any other image field. PUT the file to uploadUrl with Content-Type equal to mimeType and no authorization header, then use url.',
    ZCreateImageUploadToolInput.shape as unknown as ZodRawShapeCompat,
    CREATE,
    async (args) => {
      const payload = ZCreateImageUploadToolInput.parse(args);
      return jsonContent(await apiClient.createImageUpload(payload));
    }
  );
}
