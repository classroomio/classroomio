import * as z from 'zod';
import {
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
  ZPublicApiUpdateCourseResponse,
  ZPublicApiUpdateCourseStructure,
  ZPublicApiUpdateCourseStructureResponse
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
} from '@api/services/v1/courses/course';

import { Hono } from '@api/utils/hono';
import { ErrorCodes, handlePublicApiError } from '@api/utils/errors';
import { describeRoute, validator } from 'hono-openapi';
import { errorResponses, itemResponse, jsonResponse, paginatedResponse } from '@api/utils/openapi/responses';
import { organizationApiKeyHasScopes } from '@api/services/organization/automation-key';
import { ANY_KEY_RULE, mcpRateLimitResponse } from './docs';

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
        const course = await createPublicApiCourseService(orgId, actorId, payload);

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
      description: `Update a course; ${ANY_KEY_RULE}, and a key with only course:tag:write may send tagIds alone.`,
      tags: ['Courses'],
      responses: {
        200: jsonResponse(
          'Course updated successfully; tags lists the tags on the course after the update',
          itemResponse(ZPublicApiUpdateCourseResponse, ZPublicApiUpdateCourseEnvelope)
        ),
        400: { description: 'Invalid request body, or a tagIds entry that is not a tag in this organization' },
        401: errorResponses.unauthorized,
        403: {
          description:
            'The key lacks public_api:*, or it only holds course:tag:write and the body has fields other than tagIds, or tagIds was sent and the key creator is not an org admin'
        },
        404: { description: 'Course not found' },
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiCourseParam),
    validator('json', ZPublicApiUpdateCourse),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const payload = c.req.valid('json');

        const tagsOnly = payload.tagIds !== undefined && Object.keys(payload).every((field) => field === 'tagIds');
        const keyScopes = c.get('automationKey')?.scopes ?? [];
        if (!tagsOnly && !organizationApiKeyHasScopes(keyScopes, ['public_api:*'])) {
          return c.json(
            { success: false, error: 'Automation key is missing required scopes', code: ErrorCodes.FORBIDDEN },
            403
          );
        }

        const { course, conversionOffenders } = await updatePublicApiCourseService(orgId, actorId, params, payload);

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
