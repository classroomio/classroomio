import {
  ZPublicApiAddLearningPathCourses,
  ZPublicApiLearningPathCourseParam,
  ZPublicApiLearningPathParam,
  ZPublicApiReorderPathCourses
} from '@cio/utils/validation/public-api';
import {
  addCoursesToPublicApiLearningPathService,
  removeCourseFromPublicApiPathService,
  reorderPublicApiPathCoursesService
} from '@api/services/v1/learning-paths';

import { Hono } from '@api/utils/hono';
import { handlePublicApiError } from '@api/utils/errors';
import { PathCourseResponseSchema, PathCoursesResponseSchema, ReorderPathCoursesResponseSchema } from './docs';
import { describeRoute, validator } from 'hono-openapi';

export const v1LearningPathCoursesRouter = new Hono()
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
              schema: ReorderPathCoursesResponseSchema
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
              schema: PathCourseResponseSchema
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
              schema: PathCoursesResponseSchema
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
    validator('json', ZPublicApiAddLearningPathCourses),
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
