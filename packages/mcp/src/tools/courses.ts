import {
  ZPublicApiCloneCourse,
  ZPublicApiCourseParam,
  ZPublicApiSetFeaturedCourses
} from '@cio/utils/validation/public-api';

import type { ClassroomIoApiClient } from '../api-client';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';
import type { ZodRawShapeCompat } from '@modelcontextprotocol/sdk/server/zod-compat.js';

const CREATE: ToolAnnotations = { readOnlyHint: false, destructiveHint: false, idempotentHint: false };
const UPDATE: ToolAnnotations = { readOnlyHint: false, destructiveHint: false, idempotentHint: true };

const courseId = ZPublicApiCourseParam.shape.courseId;

export const ZCloneCourseToolInput = ZPublicApiCloneCourse.safeExtend({ courseId });

const shape = (schema: { shape: unknown }) => schema.shape as unknown as ZodRawShapeCompat;

export function registerCourseTools(server: McpServer, apiClient: ClassroomIoApiClient) {
  server.tool(
    'clone_course',
    'Copy a course with its sections, lessons and exercises, without its students; the API key creator must be an org admin or tutor. The copy keeps the source published state and the key creator becomes its tutor.',
    shape(ZCloneCourseToolInput),
    CREATE,
    async (args) => {
      const { courseId, ...payload } = ZCloneCourseToolInput.parse(args);
      return jsonContent(await apiClient.cloneCourse(courseId, payload));
    }
  );

  server.tool(
    'set_featured_courses',
    'Set the published courses shown first, in order (at most 4), on the organization landing page and public course list; the API key creator must be an org admin. The list replaces the current one; other published courses still show after them, and an empty list clears it.',
    shape(ZPublicApiSetFeaturedCourses),
    UPDATE,
    async (args) => {
      const payload = ZPublicApiSetFeaturedCourses.parse(args);
      return jsonContent(await apiClient.setFeaturedCourses(payload));
    }
  );
}

function jsonContent(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}
