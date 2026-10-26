import {
  ZPublicApiCourseParam,
  ZPublicApiCreateTag,
  ZPublicApiCreateTagGroup,
  ZPublicApiTagGroupParam,
  ZPublicApiTagParam,
  ZPublicApiTagsQuery,
  ZPublicApiUpdateCourse,
  ZPublicApiUpdateTag,
  ZPublicApiUpdateTagGroup
} from '@cio/utils/validation/public-api';

import type { ClassroomIoApiClient } from '../api-client';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';
import type { ZodRawShapeCompat } from '@modelcontextprotocol/sdk/server/zod-compat.js';

const READ_ONLY: ToolAnnotations = { readOnlyHint: true, destructiveHint: false };
const CREATE: ToolAnnotations = { readOnlyHint: false, destructiveHint: false, idempotentHint: false };
const WRITE: ToolAnnotations = { readOnlyHint: false, destructiveHint: false, idempotentHint: true };

const ADMIN_RULE = 'the API key creator must be an org admin';

export const ZListTagsToolInput = ZPublicApiTagsQuery;
export const ZCreateTagToolInput = ZPublicApiCreateTag;
export const ZUpdateTagToolInput = ZPublicApiUpdateTag.safeExtend({ tagId: ZPublicApiTagParam.shape.tagId });
export const ZCreateTagGroupToolInput = ZPublicApiCreateTagGroup;
export const ZUpdateTagGroupToolInput = ZPublicApiUpdateTagGroup.safeExtend({
  groupId: ZPublicApiTagGroupParam.shape.groupId
});
export const ZSetCourseTagsToolInput = ZPublicApiCourseParam.extend({
  tagIds: ZPublicApiUpdateCourse.shape.tagIds.unwrap()
});

const listTagsShape = ZListTagsToolInput.shape as unknown as ZodRawShapeCompat;
const createTagShape = ZCreateTagToolInput.shape as unknown as ZodRawShapeCompat;
const updateTagShape = ZUpdateTagToolInput.shape as unknown as ZodRawShapeCompat;
const createTagGroupShape = ZCreateTagGroupToolInput.shape as unknown as ZodRawShapeCompat;
const updateTagGroupShape = ZUpdateTagGroupToolInput.shape as unknown as ZodRawShapeCompat;
const setCourseTagsShape = ZSetCourseTagsToolInput.shape as unknown as ZodRawShapeCompat;

export function registerTagTools(server: McpServer, apiClient: ClassroomIoApiClient) {
  server.tool(
    'list_tags',
    "List the organization's tag groups with their tags; the API key creator must be an org member. A tag's slug is what list_org_courses filters on.",
    listTagsShape,
    READ_ONLY,
    async (args) => {
      const result = await apiClient.listTags(ZListTagsToolInput.parse(args));
      return jsonContent(result);
    }
  );

  server.tool(
    'create_tag',
    `Create a tag in a tag group; ${ADMIN_RULE}. To create tags and put them on courses in one step, use tag_courses.`,
    createTagShape,
    CREATE,
    async (args) => {
      const result = await apiClient.createTag(ZCreateTagToolInput.parse(args));
      return jsonContent(result);
    }
  );

  server.tool(
    'update_tag',
    `Update a tag's name, description, colour or group; ${ADMIN_RULE}.`,
    updateTagShape,
    WRITE,
    async (args) => {
      const { tagId, ...payload } = ZUpdateTagToolInput.parse(args);
      const result = await apiClient.updateTag(tagId, ZPublicApiUpdateTag.parse(payload));
      return jsonContent(result);
    }
  );

  server.tool('create_tag_group', `Create a tag group; ${ADMIN_RULE}.`, createTagGroupShape, CREATE, async (args) => {
    const result = await apiClient.createTagGroup(ZCreateTagGroupToolInput.parse(args));
    return jsonContent(result);
  });

  server.tool(
    'update_tag_group',
    `Update a tag group's name, description or order; ${ADMIN_RULE}.`,
    updateTagGroupShape,
    WRITE,
    async (args) => {
      const { groupId, ...payload } = ZUpdateTagGroupToolInput.parse(args);
      const result = await apiClient.updateTagGroup(groupId, ZPublicApiUpdateTagGroup.parse(payload));
      return jsonContent(result);
    }
  );

  server.tool(
    'set_course_tags',
    `Replace a course's tags with these tag ids from list_tags; ${ADMIN_RULE}. To add tags by name and keep the existing ones, use tag_courses.`,
    setCourseTagsShape,
    { ...WRITE, destructiveHint: true },
    async (args) => {
      const { courseId, tagIds } = ZSetCourseTagsToolInput.parse(args);
      const result = await apiClient.setCourseTags(courseId, tagIds);
      return jsonContent(result);
    }
  );
}

function jsonContent(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}
