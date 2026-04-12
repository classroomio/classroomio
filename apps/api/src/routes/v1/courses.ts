import {
  ZPublicApiCourseParam,
  ZPublicApiCoursesQuery,
  ZPublicApiCreateCourse,
  ZPublicApiUpdateCourse,
  ZPublicApiUpdateCourseStructure
} from '@cio/utils/validation/public-api';
import {
  createPublicApiCourseService,
  deletePublicApiCourseService,
  exportCourseService,
  getCourseService,
  listCoursesService,
  listCourseStudentsService,
  updatePublicApiCourseService,
  updatePublicApiCourseStructureService
} from '@api/services/v1/course';

import { Hono } from '@api/utils/hono';
import { automationKeyMiddleware } from '@api/middlewares/automation-key';
import { automationKeyScopesMiddleware } from '@api/middlewares/automation-key-scopes';
import { handleError } from '@api/utils/errors';
import { describeRoute, validator } from 'hono-openapi';

const CoursesListResponse = {
  type: 'object' as const,
  properties: {
    success: { type: 'boolean' as const },
    data: { type: 'array' as const, items: { type: 'object' as const } }
  },
  required: ['success', 'data']
};

const CourseDetailResponse = {
  type: 'object' as const,
  properties: {
    success: { type: 'boolean' as const },
    data: { type: 'object' as const }
  },
  required: ['success', 'data']
};

export const v1CoursesRouter = new Hono()
  .get(
    '/',
    automationKeyMiddleware,
    automationKeyScopesMiddleware(['public_api:*']),
    describeRoute({
      description: 'List courses for the authenticated organization',
      tags: ['Public API Courses'],
      responses: {
        200: {
          description: 'Courses returned successfully',
          content: {
            'application/json': {
              schema: CoursesListResponse
            }
          }
        },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' }
      }
    }),
    validator('query', ZPublicApiCoursesQuery),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const query = c.req.valid('query');
        const courses = await listCoursesService(orgId, query);

        return c.json(
          {
            success: true,
            data: courses
          },
          200
        );
      } catch (error) {
        return handleError(c, error, 'Failed to list courses');
      }
    }
  )
  .post(
    '/',
    automationKeyMiddleware,
    automationKeyScopesMiddleware(['public_api:*']),
    describeRoute({
      description: 'Create a course for the authenticated organization',
      tags: ['Public API Courses'],
      responses: {
        201: {
          description: 'Course created successfully',
          content: {
            'application/json': {
              schema: CourseDetailResponse
            }
          }
        },
        400: { description: 'Invalid request body' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' }
      }
    }),
    validator('json', ZPublicApiCreateCourse),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const payload = c.req.valid('json');
        const course = await createPublicApiCourseService(orgId, actorId, payload);

        return c.json(
          {
            success: true,
            data: course
          },
          201
        );
      } catch (error) {
        return handleError(c, error, 'Failed to create course');
      }
    }
  )
  .get(
    '/:courseId/students',
    automationKeyMiddleware,
    automationKeyScopesMiddleware(['public_api:*']),
    describeRoute({
      description: 'List enrolled students for a course',
      tags: ['Public API Courses'],
      responses: {
        200: {
          description: 'Course students returned successfully',
          content: {
            'application/json': {
              schema: CoursesListResponse
            }
          }
        },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Course not found' }
      }
    }),
    validator('param', ZPublicApiCourseParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const params = c.req.valid('param');
        const students = await listCourseStudentsService(orgId, params);

        return c.json(
          {
            success: true,
            data: students
          },
          200
        );
      } catch (error) {
        return handleError(c, error, 'Failed to list course students');
      }
    }
  )
  .get(
    '/:courseId/export',
    automationKeyMiddleware,
    automationKeyScopesMiddleware(['public_api:*']),
    describeRoute({
      description: 'Export a course structure snapshot',
      tags: ['Public API Courses'],
      responses: {
        200: {
          description: 'Course export returned successfully',
          content: {
            'application/json': {
              schema: CourseDetailResponse
            }
          }
        },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Course not found' }
      }
    }),
    validator('param', ZPublicApiCourseParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const params = c.req.valid('param');
        const courseExport = await exportCourseService(orgId, params);

        return c.json(
          {
            success: true,
            data: courseExport
          },
          200
        );
      } catch (error) {
        return handleError(c, error, 'Failed to export course');
      }
    }
  )
  .get(
    '/:courseId/structure',
    automationKeyMiddleware,
    automationKeyScopesMiddleware(['public_api:*']),
    describeRoute({
      description: 'Get a course structure snapshot',
      tags: ['Public API Courses'],
      responses: {
        200: {
          description: 'Course structure returned successfully',
          content: {
            'application/json': {
              schema: CourseDetailResponse
            }
          }
        },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Course not found' }
      }
    }),
    validator('param', ZPublicApiCourseParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const params = c.req.valid('param');
        const courseStructure = await exportCourseService(orgId, params);

        return c.json(
          {
            success: true,
            data: courseStructure
          },
          200
        );
      } catch (error) {
        return handleError(c, error, 'Failed to fetch course structure');
      }
    }
  )
  .put(
    '/:courseId/structure',
    automationKeyMiddleware,
    automationKeyScopesMiddleware(['public_api:*']),
    describeRoute({
      description: 'Synchronize a course structure using the draft payload shape',
      tags: ['Public API Courses'],
      responses: {
        200: {
          description: 'Course structure updated successfully',
          content: {
            'application/json': {
              schema: CourseDetailResponse
            }
          }
        },
        400: { description: 'Invalid request body' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Course not found' }
      }
    }),
    validator('param', ZPublicApiCourseParam),
    validator('json', ZPublicApiUpdateCourseStructure),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const payload = c.req.valid('json');
        const result = await updatePublicApiCourseStructureService(orgId, actorId, params, payload);

        return c.json(
          {
            success: true,
            data: result
          },
          200
        );
      } catch (error) {
        return handleError(c, error, 'Failed to update course structure');
      }
    }
  )
  .get(
    '/:courseId',
    automationKeyMiddleware,
    automationKeyScopesMiddleware(['public_api:*']),
    describeRoute({
      description: 'Get a single course by id',
      tags: ['Public API Courses'],
      responses: {
        200: {
          description: 'Course returned successfully',
          content: {
            'application/json': {
              schema: CourseDetailResponse
            }
          }
        },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Course not found' }
      }
    }),
    validator('param', ZPublicApiCourseParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const params = c.req.valid('param');
        const course = await getCourseService(orgId, params);

        return c.json(
          {
            success: true,
            data: course
          },
          200
        );
      } catch (error) {
        return handleError(c, error, 'Failed to fetch course');
      }
    }
  )
  .put(
    '/:courseId',
    automationKeyMiddleware,
    automationKeyScopesMiddleware(['public_api:*']),
    describeRoute({
      description: 'Update a course by id',
      tags: ['Public API Courses'],
      responses: {
        200: {
          description: 'Course updated successfully',
          content: {
            'application/json': {
              schema: CourseDetailResponse
            }
          }
        },
        400: { description: 'Invalid request body' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Course not found' }
      }
    }),
    validator('param', ZPublicApiCourseParam),
    validator('json', ZPublicApiUpdateCourse),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const params = c.req.valid('param');
        const payload = c.req.valid('json');
        const course = await updatePublicApiCourseService(orgId, params, payload);

        return c.json(
          {
            success: true,
            data: course
          },
          200
        );
      } catch (error) {
        return handleError(c, error, 'Failed to update course');
      }
    }
  )
  .delete(
    '/:courseId',
    automationKeyMiddleware,
    automationKeyScopesMiddleware(['public_api:*']),
    describeRoute({
      description: 'Delete a course by id',
      tags: ['Public API Courses'],
      responses: {
        200: {
          description: 'Course deleted successfully',
          content: {
            'application/json': {
              schema: CourseDetailResponse
            }
          }
        },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Course not found' }
      }
    }),
    validator('param', ZPublicApiCourseParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const params = c.req.valid('param');
        const course = await deletePublicApiCourseService(orgId, params);

        return c.json(
          {
            success: true,
            data: course
          },
          200
        );
      } catch (error) {
        return handleError(c, error, 'Failed to delete course');
      }
    }
  );
