import { z } from 'zod';
import {
  ZAddLearningPathCourse,
  ZCreateLearningPath,
  ZLandingPage,
  ZLearningPathCourseParam,
  ZLearningPathIdParam,
  ZReorderLearningPathCourses
} from '@cio/utils/validation/learning-path';

import type { ClassroomIoApiClient } from '../api-client';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ZodRawShapeCompat } from '@modelcontextprotocol/sdk/server/zod-compat.js';

export const ZGetLearningPathDetailToolInput = ZLearningPathIdParam;
export const ZCreateLearningPathToolInput = ZCreateLearningPath.pick({
  name: true,
  description: true
});
export const ZUpdateLearningPathLandingPageToolInput = z.object({
  landingPage: ZLandingPage,
  pathId: ZLearningPathIdParam.shape.pathId
});
export const ZReorderPathCoursesToolInput = ZReorderLearningPathCourses.safeExtend({
  pathId: ZLearningPathIdParam.shape.pathId
});
export const ZAddCoursesToLearningPathToolInput = ZAddLearningPathCourse.safeExtend({
  pathId: ZLearningPathIdParam.shape.pathId
});

const listLearningPathsShape = {} as unknown as ZodRawShapeCompat;
const getLearningPathDetailShape = ZGetLearningPathDetailToolInput.shape as unknown as ZodRawShapeCompat;
const createLearningPathShape = ZCreateLearningPathToolInput.shape as unknown as ZodRawShapeCompat;
const updateLearningPathLandingPageShape =
  ZUpdateLearningPathLandingPageToolInput.shape as unknown as ZodRawShapeCompat;
const reorderPathCoursesShape = ZReorderPathCoursesToolInput.shape as unknown as ZodRawShapeCompat;
const addCoursesToLearningPathShape = ZAddCoursesToLearningPathToolInput.shape as unknown as ZodRawShapeCompat;
const removeCourseFromLearningPathShape = ZLearningPathCourseParam.shape as unknown as ZodRawShapeCompat;

export function registerLearningPathTools(server: McpServer, apiClient: ClassroomIoApiClient) {
  const registerJsonTool = (
    name: string,
    description: string,
    shape: ZodRawShapeCompat,
    handler: (args: Record<string, unknown>) => Promise<unknown>
  ) => {
    server.tool(name, description, shape, async (args) => {
      const result = await handler(args);

      return jsonContent(result);
    });
  };

  registerJsonTool(
    'list_learning_paths',
    'List learning paths for the authenticated organization. Use this when the user refers to a path by name and you need to discover the available path IDs first.',
    listLearningPathsShape,
    async () => {
      return apiClient.listLearningPaths();
    }
  );

  registerJsonTool(
    'get_learning_path_detail',
    'Inspect a learning path: its metadata, ordered course IDs, and curriculum. Use this to understand unlock prerequisites before modifying the path.',
    getLearningPathDetailShape,
    async (args) => {
      const { pathId } = ZGetLearningPathDetailToolInput.parse(args);

      return apiClient.getLearningPathDetail(pathId);
    }
  );

  registerJsonTool(
    'create_learning_path',
    'Scaffold a new unpublished learning path with a name and description for curriculum generation workflows. Add courses afterwards with add_courses_to_learning_path, then publish with publish_learning_path.',
    createLearningPathShape,
    async (args) => {
      const payload = ZCreateLearningPathToolInput.parse(args);

      return apiClient.createLearningPath(payload);
    }
  );

  registerJsonTool(
    'add_courses_to_learning_path',
    'Sequentially link courses to an existing learning path by course ID. Members of the path are auto-enrolled into added courses.',
    addCoursesToLearningPathShape,
    async (args) => {
      const { pathId, ...payload } = ZAddCoursesToLearningPathToolInput.parse(args);

      return apiClient.addCoursesToLearningPath(pathId, payload);
    }
  );

  registerJsonTool(
    'update_learning_path_landing_page',
    'Update the public landing page of a learning path: headline copy, overview, requirements, goals, skills, instructors, reviews, FAQs, pricing, and rating display.',
    updateLearningPathLandingPageShape,
    async (args) => {
      const { pathId, ...payload } = ZUpdateLearningPathLandingPageToolInput.parse(args);

      return apiClient.updateLearningPathLandingPage(pathId, payload);
    }
  );

  registerJsonTool(
    'reorder_path_courses',
    'Reorder the courses in a learning path by passing the full ordered list of course IDs. Use get_learning_path_detail first to see the current order.',
    reorderPathCoursesShape,
    async (args) => {
      const { pathId, ...payload } = ZReorderPathCoursesToolInput.parse(args);

      return apiClient.reorderLearningPathCourses(pathId, payload);
    }
  );

  registerJsonTool(
    'remove_course_from_learning_path',
    'Remove a course from a learning path by course ID. Enrolled members keep their direct course access; only the path link is removed.',
    removeCourseFromLearningPathShape,
    async (args) => {
      const { pathId, courseId } = ZLearningPathCourseParam.parse(args);

      return apiClient.removeCourseFromLearningPath(pathId, courseId);
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
