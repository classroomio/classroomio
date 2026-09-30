import {
  ZPublicApiCourseParam,
  ZPublicApiDeleteCourseContent,
  ZPublicApiReorderCourseContent,
  ZPublicApiUpdateCourseContentLock
} from '@cio/utils/validation/public-api';

import type { ClassroomIoApiClient } from '../api-client';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';
import type { ZodRawShapeCompat } from '@modelcontextprotocol/sdk/server/zod-compat.js';

const UPDATE: ToolAnnotations = { readOnlyHint: false, destructiveHint: false, idempotentHint: true };
const DESTRUCTIVE: ToolAnnotations = { readOnlyHint: false, destructiveHint: true, idempotentHint: false };

const COURSE_TEAM_RULE =
  'The API key creator must be a course tutor/admin or an org admin, otherwise the call fails with 403.';
const ATOMIC_NOTE =
  'All or nothing: if any id is not a lesson or exercise of this course, nothing changes (404). Up to 500 items. type is LESSON or EXERCISE.';

const courseId = ZPublicApiCourseParam.shape.courseId;

export const ZReorderCourseContentToolInput = ZPublicApiReorderCourseContent.safeExtend({ courseId });
export const ZSetCourseContentUnlockedToolInput = ZPublicApiUpdateCourseContentLock.safeExtend({ courseId });
export const ZDeleteCourseContentToolInput = ZPublicApiDeleteCourseContent.safeExtend({ courseId });

const shape = (schema: { shape: unknown }) => schema.shape as unknown as ZodRawShapeCompat;

export function registerCourseContentTools(server: McpServer, apiClient: ClassroomIoApiClient) {
  server.tool(
    'reorder_course_content',
    `Reorder sections and move or reorder lessons and exercises of a live course in one transaction, without a draft. sections sets section order; items set each item's order and, with sectionId, move it to another section (null for no section). Orders must be 1, 2, 3, … within each group. ${ATOMIC_NOTE} ${COURSE_TEAM_RULE}`,
    shape(ZReorderCourseContentToolInput),
    UPDATE,
    async (args) => {
      const { courseId, ...payload } = ZReorderCourseContentToolInput.parse(args);
      return jsonContent(await apiClient.reorderCourseContent(courseId, payload));
    }
  );

  server.tool(
    'set_course_content_unlocked',
    `Lock (isUnlocked false) or unlock (isUnlocked true) lessons and exercises for students. ${ATOMIC_NOTE} ${COURSE_TEAM_RULE}`,
    shape(ZSetCourseContentUnlockedToolInput),
    UPDATE,
    async (args) => {
      const { courseId, ...payload } = ZSetCourseContentUnlockedToolInput.parse(args);
      return jsonContent(await apiClient.setCourseContentUnlocked(courseId, payload));
    }
  );

  server.tool(
    'delete_course_content',
    `Permanently delete lessons and exercises with their translations, comments, submissions and learner progress (hard delete, cannot be undone). To delete a whole section, use delete_course_section. ${ATOMIC_NOTE} ${COURSE_TEAM_RULE}`,
    shape(ZDeleteCourseContentToolInput),
    DESTRUCTIVE,
    async (args) => {
      const { courseId, ...payload } = ZDeleteCourseContentToolInput.parse(args);
      return jsonContent(await apiClient.deleteCourseContent(courseId, payload));
    }
  );
}

function jsonContent(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}
