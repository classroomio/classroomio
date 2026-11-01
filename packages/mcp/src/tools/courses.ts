import {
  ZPublicApiCloneCourse,
  ZPublicApiCourseParam,
  ZPublicApiRelatedCoursesQuery
} from '@cio/utils/validation/public-api';

import type { ClassroomIoApiClient } from '../api-client';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';
import type { ZodRawShapeCompat } from '@modelcontextprotocol/sdk/server/zod-compat.js';

const READ_ONLY: ToolAnnotations = { readOnlyHint: true, destructiveHint: false };
const CREATE: ToolAnnotations = { readOnlyHint: false, destructiveHint: false, idempotentHint: false };

const courseId = ZPublicApiCourseParam.shape.courseId;

export const ZCloneCourseToolInput = ZPublicApiCloneCourse.safeExtend({ courseId });
export const ZListRelatedCoursesToolInput = ZPublicApiRelatedCoursesQuery.safeExtend({ courseId });

const shape = (schema: { shape: unknown }) => schema.shape as unknown as ZodRawShapeCompat;

export function registerCourseTools(server: McpServer, apiClient: ClassroomIoApiClient) {
  server.tool(
    'list_related_courses',
    'List published courses that share tags with a course, most shared tags first, then newest. Pass profileId to leave out courses that person already has.',
    shape(ZListRelatedCoursesToolInput),
    READ_ONLY,
    async (args) => {
      const { courseId, ...query } = ZListRelatedCoursesToolInput.parse(args);
      return jsonContent(await apiClient.listRelatedCourses(courseId, query));
    }
  );

  server.tool(
    'clone_course',
    'Copy a course with its sections, lessons and exercises, without its students, and add the API key creator as its tutor; the API key creator must be an org admin or tutor.',
    shape(ZCloneCourseToolInput),
    CREATE,
    async (args) => {
      const { courseId, ...payload } = ZCloneCourseToolInput.parse(args);
      return jsonContent(await apiClient.cloneCourse(courseId, payload));
    }
  );
}

function jsonContent(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}
