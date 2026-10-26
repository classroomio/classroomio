import * as z from 'zod';
import {
  ZPublicApiCloneCourse,
  ZPublicApiCourseDetailResponse,
  ZPublicApiCourseListItemResponse,
  ZPublicApiCourseMemberListItemResponse,
  ZPublicApiCourseParam,
  ZPublicApiCourseResponse,
  ZPublicApiCourseStructureResponse,
  ZPublicApiCoursesQuery,
  ZPublicApiCreateCourse,
  ZPublicApiCreateCourseResponse,
  ZPublicApiPaginationQuery,
  ZPublicApiUpdateCourse,
  ZPublicApiUpdateCourseEnvelope,
  ZPublicApiUpdateCourseStructure,
  ZPublicApiUpdateCourseStructureResponse
} from '@cio/utils/validation/public-api';
import {
  clonePublicApiCourseService,
  createPublicApiCourseService,
  deletePublicApiCourseService,
  exportCourseService,
  getCourseService,
  listCoursesService,
  listCourseStudentsService,
  updatePublicApiCourseService,
  updatePublicApiCourseStructureService
} from '@api/services/v1/courses/course';

import { Hono } from '@api/utils/hono';
import { handlePublicApiError } from '@api/utils/errors';
import { getEventSource } from '@api/utils/event-source';
import { captureCoursePublished } from '@cio/core/services/course/course';
import { describeRoute, validator } from 'hono-openapi';
import { errorResponses, itemResponse, jsonResponse, paginatedResponse } from '@api/utils/openapi/responses';
import { ANY_KEY_RULE, ORG_TEAM_RULE, cloneForbiddenResponse } from './docs';

const CoursesListEnvelope = z.object({ query: ZPublicApiCoursesQuery });

const CourseStudentsDataResponse = paginatedResponse(ZPublicApiCourseMemberListItemResponse);
const CourseStudentsResponse = jsonResponse('Course students returned successfully', CourseStudentsDataResponse);

export const v1CourseRouter = new Hono()
  .get(
    '/',
    describeRoute({
      description: `List the organization's courses; ${ANY_KEY_RULE}.`,
      tags: ['Courses'],
      responses: {
        200: jsonResponse(
          'Courses returned successfully',
          paginatedResponse(ZPublicApiCourseListItemResponse, CoursesListEnvelope)
        ),
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
            data: courses.items,
            pagination: courses.pagination,
            query: courses.query
          },
          200
        );
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to list courses');
      }
    }
  )
  .post(
    '/',
    describeRoute({
      description: `Create a course in the organization; ${ANY_KEY_RULE}.`,
      tags: ['Courses'],
      responses: {
        201: jsonResponse('Course created successfully', itemResponse(ZPublicApiCreateCourseResponse)),
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
        const course = await createPublicApiCourseService(orgId, actorId, payload, getEventSource(c));

        return c.json(
          {
            success: true,
            data: course
          },
          201
        );
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to create course');
      }
    }
  )
  .post(
    '/:courseId/clone',
    describeRoute({
      description: `Copy a course with its sections, lessons and exercises, without its students, and add the key creator as its tutor; ${ORG_TEAM_RULE}.`,
      tags: ['Courses'],
      responses: {
        201: jsonResponse(
          'Course copied successfully; the copy keeps the source published state and its exercise due dates are set to now',
          itemResponse(ZPublicApiCourseResponse)
        ),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: cloneForbiddenResponse,
        404: { description: 'Course not found' },
        409: { description: 'The slug is already in use (SLUG_IN_USE)' }
      }
    }),
    validator('param', ZPublicApiCourseParam),
    validator('json', ZPublicApiCloneCourse),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const payload = c.req.valid('json');
        const course = await clonePublicApiCourseService(orgId, actorId, params, payload);

        return c.json(
          {
            success: true,
            data: course
          },
          201
        );
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to clone course');
      }
    }
  )
  .get(
    '/:courseId/students',
    describeRoute({
      description: `List the students enrolled in a course; ${ANY_KEY_RULE}.`,
      tags: ['Course Members'],
      responses: {
        200: CourseStudentsResponse,
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Course not found' }
      }
    }),
    validator('param', ZPublicApiCourseParam),
    validator('query', ZPublicApiPaginationQuery),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const params = c.req.valid('param');
        const query = c.req.valid('query');
        const studentsPage = await listCourseStudentsService(orgId, params, query);

        return c.json(
          {
            success: true,
            data: studentsPage.items,
            pagination: {
              page: studentsPage.page,
              limit: studentsPage.limit,
              total: studentsPage.total,
              totalPages: studentsPage.totalPages
            }
          },
          200
        );
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to list course students');
      }
    }
  )
  .get(
    '/:courseId/export',
    describeRoute({
      description: `Export a snapshot of a course's structure; ${ANY_KEY_RULE}.`,
      tags: ['Course Structure'],
      responses: {
        200: jsonResponse('Course export returned successfully', itemResponse(ZPublicApiCourseStructureResponse)),
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
        return handlePublicApiError(c, error, 'Failed to export course');
      }
    }
  )
  .get(
    '/:courseId/structure',
    describeRoute({
      description: `Get a snapshot of a course's structure; ${ANY_KEY_RULE}.`,
      tags: ['Course Structure'],
      responses: {
        200: jsonResponse('Course structure returned successfully', itemResponse(ZPublicApiCourseStructureResponse)),
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
        return handlePublicApiError(c, error, 'Failed to fetch course structure');
      }
    }
  )
  .put(
    '/:courseId/structure',
    describeRoute({
      description: `Synchronize a course's structure using the draft payload shape; ${ANY_KEY_RULE}.`,
      tags: ['Course Structure'],
      responses: {
        200: jsonResponse(
          'Course structure updated successfully',
          itemResponse(ZPublicApiUpdateCourseStructureResponse)
        ),
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
        return handlePublicApiError(c, error, 'Failed to update course structure');
      }
    }
  )
  .get(
    '/:courseId',
    describeRoute({
      description: `Get a course; ${ANY_KEY_RULE}.`,
      tags: ['Courses'],
      responses: {
        200: jsonResponse('Course returned successfully', itemResponse(ZPublicApiCourseDetailResponse)),
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
        return handlePublicApiError(c, error, 'Failed to fetch course');
      }
    }
  )
  .put(
    '/:courseId',
    describeRoute({
      description: `Update a course; ${ANY_KEY_RULE}.`,
      tags: ['Courses'],
      responses: {
        200: jsonResponse(
          'Course updated successfully',
          itemResponse(ZPublicApiCourseResponse, ZPublicApiUpdateCourseEnvelope)
        ),
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
        const { course, conversionOffenders, publishedNow } = await updatePublicApiCourseService(
          orgId,
          params,
          payload,
          c.get('actorId')
        );

        if (publishedNow) {
          captureCoursePublished(course, c.get('actorId'), getEventSource(c));
        }

        return c.json(
          {
            success: true,
            data: course,
            ...(conversionOffenders && conversionOffenders.length > 0 ? { conversionBlocked: conversionOffenders } : {})
          },
          200
        );
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to update course');
      }
    }
  )
  .delete(
    '/:courseId',
    describeRoute({
      description: `Delete a course; ${ANY_KEY_RULE}.`,
      tags: ['Courses'],
      responses: {
        200: jsonResponse('Course deleted successfully', itemResponse(ZPublicApiCourseResponse)),
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
        return handlePublicApiError(c, error, 'Failed to delete course');
      }
    }
  );
