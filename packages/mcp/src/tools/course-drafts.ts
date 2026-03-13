import {
  ZCourseImportDraftCreate,
  ZCourseImportDraftGetParam,
  ZCourseImportDraftPublish,
  ZCourseImportDraftUpdate
} from '@cio/utils/validation/course-import';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ZodRawShapeCompat } from '@modelcontextprotocol/sdk/server/zod-compat.js';

import type { ClassroomIoApiClient } from '../api-client.js';

export const ZUpdateCourseDraftToolInput = ZCourseImportDraftUpdate.extend({
  draftId: ZCourseImportDraftGetParam.shape.draftId
});

export const ZPublishCourseDraftToolInput = ZCourseImportDraftPublish.extend({
  draftId: ZCourseImportDraftGetParam.shape.draftId
});

const createCourseDraftShape = ZCourseImportDraftCreate.shape as unknown as ZodRawShapeCompat;
const getCourseDraftShape = ZCourseImportDraftGetParam.shape as unknown as ZodRawShapeCompat;
const updateCourseDraftShape = ZUpdateCourseDraftToolInput.shape as unknown as ZodRawShapeCompat;
const publishCourseDraftShape = ZPublishCourseDraftToolInput.shape as unknown as ZodRawShapeCompat;

export function registerCourseDraftTools(server: McpServer, apiClient: ClassroomIoApiClient) {
  server.tool('create_course_draft', createCourseDraftShape, async (args) => {
    const payload = ZCourseImportDraftCreate.parse(args);
    const result = await apiClient.createCourseDraft(payload);
    return jsonContent(result);
  });

  server.tool('get_course_draft', getCourseDraftShape, async (args) => {
    const { draftId } = ZCourseImportDraftGetParam.parse(args);
    const result = await apiClient.getCourseDraft(draftId);
    return jsonContent(result);
  });

  server.tool('update_course_draft', updateCourseDraftShape, async (args) => {
    const { draftId, ...payload } = ZUpdateCourseDraftToolInput.parse(args);
    const result = await apiClient.updateCourseDraft(draftId, payload);
    return jsonContent(result);
  });

  server.tool('publish_course_draft', publishCourseDraftShape, async (args) => {
    const { draftId, ...payload } = ZPublishCourseDraftToolInput.parse(args);
    const result = await apiClient.publishCourseDraft(draftId, payload);
    return jsonContent(result);
  });
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
