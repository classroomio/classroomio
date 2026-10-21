import {
  ZPublicApiForceQuery,
  ZPublicApiCourseParam,
  ZPublicApiCourseSectionParam,
  ZPublicApiCourseSectionsQuery,
  ZPublicApiCreateCourseSection,
  ZPublicApiUpdateCourseSection
} from '@cio/utils/validation/public-api';

import type { ClassroomIoApiClient } from '../api-client';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';
import type { ZodRawShapeCompat } from '@modelcontextprotocol/sdk/server/zod-compat.js';

const READ_ONLY: ToolAnnotations = { readOnlyHint: true, destructiveHint: false };
const CREATE: ToolAnnotations = { readOnlyHint: false, destructiveHint: false, idempotentHint: false };
const UPDATE: ToolAnnotations = { readOnlyHint: false, destructiveHint: false, idempotentHint: true };
const DESTRUCTIVE: ToolAnnotations = { readOnlyHint: false, destructiveHint: true, idempotentHint: false };

const COURSE_TEAM_RULE = 'the API key creator must be a course tutor/admin or an org admin';

export const ZListCourseSectionsToolInput = ZPublicApiCourseSectionsQuery.extend({
  courseId: ZPublicApiCourseParam.shape.courseId
});
export const ZCreateCourseSectionToolInput = ZPublicApiCreateCourseSection.safeExtend({
  courseId: ZPublicApiCourseParam.shape.courseId
});
export const ZUpdateCourseSectionToolInput = ZPublicApiUpdateCourseSection.safeExtend(
  ZPublicApiCourseSectionParam.shape
);
export const ZDeleteCourseSectionToolInput = ZPublicApiCourseSectionParam.extend(ZPublicApiForceQuery.shape);

const shape = (schema: { shape: unknown }) => schema.shape as unknown as ZodRawShapeCompat;

export function registerCourseSectionTools(server: McpServer, apiClient: ClassroomIoApiClient) {
  server.tool(
    'list_course_sections',
    `List a live course's sections in order; ${COURSE_TEAM_RULE}. Use get_course_structure for sections with their lessons and exercises.`,
    shape(ZListCourseSectionsToolInput),
    READ_ONLY,
    async (args) => {
      const { courseId, ...query } = ZListCourseSectionsToolInput.parse(args);
      return jsonContent(await apiClient.listCourseSections(courseId, query));
    }
  );

  server.tool(
    'create_course_section',
    `Create a section on a live course; ${COURSE_TEAM_RULE}.`,
    shape(ZCreateCourseSectionToolInput),
    CREATE,
    async (args) => {
      const { courseId, ...payload } = ZCreateCourseSectionToolInput.parse(args);
      return jsonContent(await apiClient.createCourseSection(courseId, payload));
    }
  );

  server.tool(
    'update_course_section',
    `Rename or move one section; ${COURSE_TEAM_RULE}. To reorder several sections or move content between them, use reorder_course_content.`,
    shape(ZUpdateCourseSectionToolInput),
    UPDATE,
    async (args) => {
      const { courseId, sectionId, ...payload } = ZUpdateCourseSectionToolInput.parse(args);
      return jsonContent(await apiClient.updateCourseSection(courseId, sectionId, payload));
    }
  );

  server.tool(
    'delete_course_section',
    `Permanently delete a section with every lesson and exercise in it; ${COURSE_TEAM_RULE}. To keep its content, move it out first with reorder_course_content; ask the user before setting force.`,
    shape(ZDeleteCourseSectionToolInput),
    DESTRUCTIVE,
    async (args) => {
      const { courseId, sectionId, force } = ZDeleteCourseSectionToolInput.parse(args);
      return jsonContent(await apiClient.deleteCourseSection(courseId, sectionId, force));
    }
  );
}

function jsonContent(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}
