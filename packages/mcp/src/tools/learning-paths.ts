import {
  ZPublicApiCreateLearningPath,
  ZPublicApiLearningPathCourseParam,
  ZPublicApiLearningPathParam,
  ZPublicApiLearningPathsQuery,
  ZPublicApiReorderPathCourses,
  ZPublicApiUpdateLearningPath
} from '@cio/utils/validation/public-api';
import { ZAddLearningPathCourse } from '@cio/utils/validation/learning-path';

import type { ClassroomIoApiClient } from '../api-client';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ZodRawShapeCompat } from '@modelcontextprotocol/sdk/server/zod-compat.js';

export const ZGetLearningPathDetailToolInput = ZPublicApiLearningPathParam;
export const ZCreateLearningPathToolInput = ZPublicApiCreateLearningPath;
export const ZUpdateLearningPathToolInput = ZPublicApiUpdateLearningPath.extend({
  pathId: ZPublicApiLearningPathParam.shape.pathId
});
export const ZReorderPathCoursesToolInput = ZPublicApiReorderPathCourses.extend({
  pathId: ZPublicApiLearningPathParam.shape.pathId
});
export const ZAddCoursesToLearningPathToolInput = ZAddLearningPathCourse.extend({
  pathId: ZPublicApiLearningPathParam.shape.pathId
});

const listLearningPathsShape = ZPublicApiLearningPathsQuery.shape as unknown as ZodRawShapeCompat;
const getLearningPathDetailShape = ZPublicApiLearningPathParam.shape as unknown as ZodRawShapeCompat;
const createLearningPathShape = ZPublicApiCreateLearningPath.shape as unknown as ZodRawShapeCompat;
const updateLearningPathShape = ZUpdateLearningPathToolInput.shape as unknown as ZodRawShapeCompat;
const reorderPathCoursesShape = ZReorderPathCoursesToolInput.shape as unknown as ZodRawShapeCompat;
const addCoursesToLearningPathShape = ZAddCoursesToLearningPathToolInput.shape as unknown as ZodRawShapeCompat;
const listLearningPathStudentsShape = ZPublicApiLearningPathParam.shape as unknown as ZodRawShapeCompat;
const removeCourseFromLearningPathShape = ZPublicApiLearningPathCourseParam.shape as unknown as ZodRawShapeCompat;
const deleteLearningPathShape = ZPublicApiLearningPathParam.shape as unknown as ZodRawShapeCompat;

export function registerLearningPathTools(server: McpServer, apiClient: ClassroomIoApiClient) {
  server.tool(
    'list_learning_paths',
    'List active learning paths for the authenticated organization. Use this when the user refers to a path by name and you need to discover the available path IDs first.',
    listLearningPathsShape,
    async (args) => {
      const query = ZPublicApiLearningPathsQuery.parse(args);
      const result = await apiClient.listLearningPaths(query);
      return jsonContent(result);
    }
  );

  server.tool(
    'get_learning_path_detail',
    'Inspect a learning path: its metadata, ordered course IDs, and curriculum. Use this to understand unlock prerequisites before modifying the path.',
    getLearningPathDetailShape,
    async (args) => {
      const { pathId } = ZPublicApiLearningPathParam.parse(args);
      const result = await apiClient.getLearningPathDetail(pathId);
      return jsonContent(result);
    }
  );

  server.tool(
    'create_learning_path',
    'Scaffold a new unpublished learning path with a name and description for curriculum generation workflows. Add courses afterwards with add_courses_to_learning_path.',
    createLearningPathShape,
    async (args) => {
      const payload = ZPublicApiCreateLearningPath.parse(args);
      const result = await apiClient.createLearningPath(payload);
      return jsonContent(result);
    }
  );

  server.tool(
    'add_courses_to_learning_path',
    'Sequentially link courses to an existing learning path by course ID. Members of the path are auto-enrolled into added courses.',
    addCoursesToLearningPathShape,
    async (args) => {
      const { pathId, ...payload } = ZAddCoursesToLearningPathToolInput.parse(args);
      const result = await apiClient.addCoursesToLearningPath(pathId, payload);
      return jsonContent(result);
    }
  );

  server.tool(
    'update_learning_path',
    'Update a learning path name, description, cost, or enrollment toggles (sequential unlock, self-enrollment, auto-enroll). Only pass the fields that should change.',
    updateLearningPathShape,
    async (args) => {
      const { pathId, ...payload } = ZUpdateLearningPathToolInput.parse(args);
      const result = await apiClient.updateLearningPath(pathId, payload);
      return jsonContent(result);
    }
  );

  server.tool(
    'reorder_path_courses',
    'Reorder the courses in a learning path by passing the full ordered list of course IDs. Use get_learning_path_detail first to see the current order.',
    reorderPathCoursesShape,
    async (args) => {
      const { pathId, ...payload } = ZReorderPathCoursesToolInput.parse(args);
      const result = await apiClient.reorderLearningPathCourses(pathId, payload);
      return jsonContent(result);
    }
  );

  server.tool(
    'list_learning_path_students',
    'List the students enrolled in a learning path. Use this to audit path membership before messaging learners or adjusting the curriculum.',
    listLearningPathStudentsShape,
    async (args) => {
      const { pathId } = ZPublicApiLearningPathParam.parse(args);
      const result = await apiClient.listLearningPathStudents(pathId);
      return jsonContent(result);
    }
  );

  server.tool(
    'remove_course_from_learning_path',
    'Remove a course from a learning path by course ID. Enrolled members keep their direct course access; only the path link is removed.',
    removeCourseFromLearningPathShape,
    async (args) => {
      const { pathId, courseId } = ZPublicApiLearningPathCourseParam.parse(args);
      const result = await apiClient.removeCourseFromLearningPath(pathId, courseId);
      return jsonContent(result);
    }
  );

  server.tool(
    'delete_learning_path',
    'Delete a learning path by ID. This removes the path container but preserves the underlying courses and their enrollments.',
    deleteLearningPathShape,
    async (args) => {
      const { pathId } = ZPublicApiLearningPathParam.parse(args);
      const result = await apiClient.deleteLearningPath(pathId);
      return jsonContent(result);
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
