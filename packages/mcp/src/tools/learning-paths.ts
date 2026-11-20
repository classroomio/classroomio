import { z } from 'zod';

import {
  ZAddLearningPathCourse,
  ZCreateLearningPath,
  ZLandingPage,
  ZLearningPathCourseParam,
  ZLearningPathIdentifier,
  ZReorderLearningPathCourses
} from '@cio/utils/validation/learning-path';

import type { ClassroomIoApiClient } from '../api-client';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';
import type { ZodRawShapeCompat } from '@modelcontextprotocol/sdk/server/zod-compat.js';

export const ZGetLearningPathToolInput = z.object({
  pathId: ZLearningPathIdentifier
});
export const ZCreateLearningPathToolInput = ZCreateLearningPath.pick({
  name: true,
  description: true
});
export const ZUpdateLearningPathLandingPageToolInput = z.object({
  landingPage: ZLandingPage,
  pathId: ZLearningPathIdentifier
});
export const ZReorderLearningPathCoursesToolInput = ZReorderLearningPathCourses.safeExtend({
  pathId: ZLearningPathIdentifier
});
export const ZAddLearningPathCoursesToolInput = ZAddLearningPathCourse.safeExtend({
  pathId: ZLearningPathIdentifier
});
export const ZRemoveLearningPathCourseToolInput = ZLearningPathCourseParam.extend({
  pathId: ZLearningPathIdentifier
});
export const ZListOrgLearningPathsToolInput = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional()
});

const READ_ONLY: ToolAnnotations = { readOnlyHint: true };
const WRITE: ToolAnnotations = { readOnlyHint: false, destructiveHint: false };
const WRITE_IDEMPOTENT: ToolAnnotations = { readOnlyHint: false, destructiveHint: false, idempotentHint: true };
const DESTRUCTIVE: ToolAnnotations = { readOnlyHint: false, destructiveHint: true };

const ACTS_AS_RULE = 'The API key creator must be an org admin or a tutor assigned to the path, otherwise 403.';
const ADMIN_ONLY_RULE = 'The API key creator must be an org admin, otherwise 403.';
const LIST_SCOPE_RULE = 'Org admins see every path; tutors see only the paths assigned to them.';

const listOrgLearningPathsShape = ZListOrgLearningPathsToolInput.shape as unknown as ZodRawShapeCompat;
const getLearningPathShape = ZGetLearningPathToolInput.shape as unknown as ZodRawShapeCompat;
const createLearningPathShape = ZCreateLearningPathToolInput.shape as unknown as ZodRawShapeCompat;
const updateLearningPathLandingPageShape =
  ZUpdateLearningPathLandingPageToolInput.shape as unknown as ZodRawShapeCompat;
const reorderLearningPathCoursesShape = ZReorderLearningPathCoursesToolInput.shape as unknown as ZodRawShapeCompat;
const addLearningPathCoursesShape = ZAddLearningPathCoursesToolInput.shape as unknown as ZodRawShapeCompat;
const removeLearningPathCourseShape = ZRemoveLearningPathCourseToolInput.shape as unknown as ZodRawShapeCompat;

/**
 * Registers the learning path tools: list/get (read-only), create and course
 * adds (write), reorder and landing-page updates (write, idempotent), and
 * course removal (destructive). Every description states who the API key
 * creator must be.
 */
export function registerLearningPathTools(server: McpServer, apiClient: ClassroomIoApiClient) {
  const registerJsonTool = (
    name: string,
    description: string,
    shape: ZodRawShapeCompat,
    annotations: ToolAnnotations,
    handler: (args: Record<string, unknown>) => Promise<unknown>
  ) => {
    server.tool(name, description, shape, annotations, async (args) => {
      const result = await handler(args);

      return jsonContent(result);
    });
  };

  registerJsonTool(
    'list_org_learning_paths',
    `List learning paths for the authenticated organization, paged. Use this when the user refers to a path by name and you need to discover the available path IDs first. ${LIST_SCOPE_RULE}`,
    listOrgLearningPathsShape,
    READ_ONLY,
    async (args) => {
      const { page, limit, search } = ZListOrgLearningPathsToolInput.parse(args);

      return apiClient.listOrgLearningPaths({ page, limit, search });
    }
  );

  registerJsonTool(
    'get_learning_path',
    `Inspect a learning path: its metadata, ordered course IDs, and curriculum. Use this to understand unlock prerequisites before modifying the path. ${ACTS_AS_RULE}`,
    getLearningPathShape,
    READ_ONLY,
    async (args) => {
      const { pathId } = ZGetLearningPathToolInput.parse(args);

      return apiClient.getLearningPath(pathId);
    }
  );

  registerJsonTool(
    'create_learning_path',
    `Scaffold a new unpublished learning path with a name and description for curriculum generation workflows. Add courses afterwards with add_learning_path_courses, then publish it from the dashboard. ${ADMIN_ONLY_RULE}`,
    createLearningPathShape,
    WRITE,
    async (args) => {
      const payload = ZCreateLearningPathToolInput.parse(args);

      return apiClient.createLearningPath(payload);
    }
  );

  registerJsonTool(
    'add_learning_path_courses',
    `Sequentially link courses to an existing learning path by course ID. STUDENT members of the path are granted the added courses. ${ACTS_AS_RULE}`,
    addLearningPathCoursesShape,
    WRITE,
    async (args) => {
      const { pathId, ...payload } = ZAddLearningPathCoursesToolInput.parse(args);

      return apiClient.addLearningPathCourses(pathId, payload);
    }
  );

  registerJsonTool(
    'update_learning_path_landing_page',
    `Update the public landing page of a learning path: headline copy, overview, requirements, goals, skills, instructors, reviews, FAQs, pricing, and rating display. ${ACTS_AS_RULE}`,
    updateLearningPathLandingPageShape,
    WRITE_IDEMPOTENT,
    async (args) => {
      const { pathId, ...payload } = ZUpdateLearningPathLandingPageToolInput.parse(args);

      return apiClient.updateLearningPathLandingPage(pathId, payload);
    }
  );

  registerJsonTool(
    'reorder_learning_path_courses',
    `Reorder the courses in a learning path by passing the full ordered list of course IDs. Use get_learning_path first to see the current order. ${ACTS_AS_RULE}`,
    reorderLearningPathCoursesShape,
    WRITE_IDEMPOTENT,
    async (args) => {
      const { pathId, ...payload } = ZReorderLearningPathCoursesToolInput.parse(args);

      return apiClient.reorderLearningPathCourses(pathId, payload);
    }
  );

  registerJsonTool(
    'remove_learning_path_course',
    `Remove a course from a learning path by course ID. Enrolled members keep their direct course access; only the path link is removed. ${ACTS_AS_RULE}`,
    removeLearningPathCourseShape,
    DESTRUCTIVE,
    async (args) => {
      const { pathId, courseId } = ZRemoveLearningPathCourseToolInput.parse(args);

      return apiClient.removeLearningPathCourse(pathId, courseId);
    }
  );
}

/** Wraps a handler result as an MCP text content block. */
export function jsonContent(data: unknown) {
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(data)
      }
    ]
  };
}
