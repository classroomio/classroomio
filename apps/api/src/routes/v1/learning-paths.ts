import {
  ZPublicApiCreateLearningPath,
  ZPublicApiLearningPathCourseParam,
  ZPublicApiLearningPathParam,
  ZPublicApiLearningPathsQuery,
  ZPublicApiReorderPathCourses,
  ZPublicApiUpdateLearningPath
} from '@cio/utils/validation/public-api';
import { ZAddLearningPathCourse } from '@cio/utils/validation/learning-path';
import {
  addCoursesToPublicApiLearningPathService,
  createPublicApiLearningPathService,
  deletePublicApiLearningPathService,
  getLearningPathService,
  listLearningPathsService,
  listPublicApiLearningPathStudentsService,
  removeCourseFromPublicApiPathService,
  reorderPublicApiPathCoursesService,
  updatePublicApiLearningPathService
} from '@api/services/v1/learning-path';

import { Hono } from '@api/utils/hono';
import { handlePublicApiError } from '@api/utils/errors';
import { describeRoute, validator } from 'hono-openapi';

const PaginationSchema = {
  type: 'object' as const,
  properties: {
    page: { type: 'number' as const },
    limit: { type: 'number' as const },
    total: { type: 'number' as const },
    totalPages: { type: 'number' as const }
  },
  required: ['page', 'limit', 'total', 'totalPages']
};

const LearningPathsQuerySchema = {
  type: 'object' as const,
  properties: {
    page: { type: 'number' as const },
    limit: { type: 'number' as const },
    search: { type: 'string' as const }
  },
  required: ['page', 'limit']
};

const LearningPathsListResponse = {
  type: 'object' as const,
  properties: {
    success: { type: 'boolean' as const },
    data: { type: 'array' as const, items: { type: 'object' as const } },
    pagination: PaginationSchema,
    query: LearningPathsQuerySchema
  },
  required: ['success', 'data', 'pagination', 'query']
};

const LearningPathDetailResponse = {
  type: 'object' as const,
  properties: {
    success: { type: 'boolean' as const },
    data: { type: 'object' as const }
  },
  required: ['success', 'data']
};

const LearningPathStudentsResponse = {
  type: 'object' as const,
  properties: {
    success: { type: 'boolean' as const },
    data: { type: 'array' as const, items: { type: 'object' as const } }
  },
  required: ['success', 'data']
};

export const v1LearningPathsRouter = new Hono()
  .get(
    '/',
    describeRoute({
      description: 'List learning paths for the authenticated organization',
      tags: ['Public API Learning Paths'],
      responses: {
        200: {
          description: 'Learning paths returned successfully',
          content: {
            'application/json': {
              schema: LearningPathsListResponse
            }
          }
        },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' }
      }
    }),
    validator('query', ZPublicApiLearningPathsQuery),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const query = c.req.valid('query');
        const paths = await listLearningPathsService(orgId, query);

        return c.json(
          {
            success: true,
            data: paths.data,
            pagination: paths.pagination,
            query
          },
          200
        );
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to list learning paths');
      }
    }
  )
  .post(
    '/',
    describeRoute({
      description: 'Create a learning path for the authenticated organization',
      tags: ['Public API Learning Paths'],
      responses: {
        201: {
          description: 'Learning path created successfully',
          content: {
            'application/json': {
              schema: LearningPathDetailResponse
            }
          }
        },
        400: { description: 'Invalid request body' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' }
      }
    }),
    validator('json', ZPublicApiCreateLearningPath),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const payload = c.req.valid('json');
        const path = await createPublicApiLearningPathService(orgId, actorId, payload);

        return c.json(
          {
            success: true,
            data: path
          },
          201
        );
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to create learning path');
      }
    }
  )
  .get(
    '/:pathId',
    describeRoute({
      description: 'Get a single learning path by id, with ordered course ids',
      tags: ['Public API Learning Paths'],
      responses: {
        200: {
          description: 'Learning path returned successfully',
          content: {
            'application/json': {
              schema: LearningPathDetailResponse
            }
          }
        },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Learning path not found' }
      }
    }),
    validator('param', ZPublicApiLearningPathParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const params = c.req.valid('param');
        const path = await getLearningPathService(orgId, params);

        return c.json(
          {
            success: true,
            data: path
          },
          200
        );
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to fetch learning path');
      }
    }
  )
  .put(
    '/:pathId',
    describeRoute({
      description: 'Update a learning path by id',
      tags: ['Public API Learning Paths'],
      responses: {
        200: {
          description: 'Learning path updated successfully',
          content: {
            'application/json': {
              schema: LearningPathDetailResponse
            }
          }
        },
        400: { description: 'Invalid request body' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Learning path not found' }
      }
    }),
    validator('param', ZPublicApiLearningPathParam),
    validator('json', ZPublicApiUpdateLearningPath),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const payload = c.req.valid('json');
        const path = await updatePublicApiLearningPathService(orgId, actorId, params, payload);

        return c.json(
          {
            success: true,
            data: path
          },
          200
        );
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to update learning path');
      }
    }
  )
  .get(
    '/:pathId/students',
    describeRoute({
      description: 'List enrolled students for a learning path',
      tags: ['Public API Learning Paths'],
      responses: {
        200: {
          description: 'Path students returned successfully',
          content: {
            'application/json': {
              schema: LearningPathStudentsResponse
            }
          }
        },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Learning path not found' }
      }
    }),
    validator('param', ZPublicApiLearningPathParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const params = c.req.valid('param');
        const students = await listPublicApiLearningPathStudentsService(orgId, params);

        return c.json(
          {
            success: true,
            data: students
          },
          200
        );
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to list learning path students');
      }
    }
  )
  .put(
    '/:pathId/courses/order',
    describeRoute({
      description: 'Reorder courses in a learning path',
      tags: ['Public API Learning Paths'],
      responses: {
        200: {
          description: 'Path courses reordered successfully',
          content: {
            'application/json': {
              schema: LearningPathDetailResponse
            }
          }
        },
        400: { description: 'Invalid request body' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Learning path not found' }
      }
    }),
    validator('param', ZPublicApiLearningPathParam),
    validator('json', ZPublicApiReorderPathCourses),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const payload = c.req.valid('json');
        const result = await reorderPublicApiPathCoursesService(orgId, actorId, params, payload);

        return c.json(
          {
            success: true,
            data: result
          },
          200
        );
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to reorder learning path courses');
      }
    }
  )
  .delete(
    '/:pathId/courses/:courseId',
    describeRoute({
      description: 'Remove a course from a learning path',
      tags: ['Public API Learning Paths'],
      responses: {
        200: {
          description: 'Course removed successfully',
          content: {
            'application/json': {
              schema: LearningPathDetailResponse
            }
          }
        },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Learning path not found' }
      }
    }),
    validator('param', ZPublicApiLearningPathCourseParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const result = await removeCourseFromPublicApiPathService(orgId, actorId, params);

        return c.json(
          {
            success: true,
            data: result
          },
          200
        );
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to remove course from learning path');
      }
    }
  )
  .delete(
    '/:pathId',
    describeRoute({
      description: 'Delete a learning path by id',
      tags: ['Public API Learning Paths'],
      responses: {
        200: {
          description: 'Learning path deleted successfully',
          content: {
            'application/json': {
              schema: LearningPathDetailResponse
            }
          }
        },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Learning path not found' }
      }
    }),
    validator('param', ZPublicApiLearningPathParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const params = c.req.valid('param');
        const path = await deletePublicApiLearningPathService(orgId, params);

        return c.json(
          {
            success: true,
            data: path
          },
          200
        );
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to delete learning path');
      }
    }
  )
  .post(
    '/:pathId/courses',
    describeRoute({
      description: 'Add courses to a learning path by id',
      tags: ['Public API Learning Paths'],
      responses: {
        200: {
          description: 'Courses added successfully',
          content: {
            'application/json': {
              schema: LearningPathDetailResponse
            }
          }
        },
        400: { description: 'Invalid request body' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Learning path not found' }
      }
    }),
    validator('param', ZPublicApiLearningPathParam),
    validator('json', ZAddLearningPathCourse),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const payload = c.req.valid('json');
        const courses = await addCoursesToPublicApiLearningPathService(orgId, actorId, params, payload);

        return c.json(
          {
            success: true,
            data: courses
          },
          200
        );
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to add courses to learning path');
      }
    }
  );
