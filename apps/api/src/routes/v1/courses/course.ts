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
  ZPublicApiPublishCourseResponse,
  ZPublicApiRelatedCourseResponse,
  ZPublicApiRelatedCoursesQuery,
  ZPublicApiUpdateCourse,
  ZPublicApiUpdateCourseEnvelope,
  ZPublicApiUpdateCourseResponse,
  ZPublicApiUpdateCourseStructure,
  ZPublicApiUnpublishCourseResponse,
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
  listRelatedCoursesService,
  publishPublicApiCourseService,
  unpublishPublicApiCourseService,
  updatePublicApiCourseService,
  updatePublicApiCourseStructureService
} from '@api/services/v1/courses/course';

import { Hono } from '@api/utils/hono';
import { ErrorCodes, handlePublicApiError } from '@api/utils/errors';
import { getEventSource } from '@api/utils/event-source';
import { captureCoursePublished } from '@cio/core/services/course/course';
import { describeRoute, validator } from 'hono-openapi';
import { errorResponses, itemResponse, jsonResponse, paginatedResponse } from '@api/utils/openapi/responses';
import { organizationApiKeyHasScopes } from '@api/services/organization/automation-key';
import { ANY_KEY_RULE, COURSE_TEAM_RULE, ORG_TEAM_RULE, cloneForbiddenResponse, mcpRateLimitResponse } from './docs';

const CoursesListEnvelope = z.object({ query: ZPublicApiCoursesQuery });

const CourseStudentsDataResponse = paginatedResponse(ZPublicApiCourseMemberListItemResponse);
const CourseStudentsResponse = jsonResponse('Course students returned successfully', CourseStudentsDataResponse);

export const v1CourseRouter = new Hono()
  .get(
    '/',
    describeRoute({
      description: `List the organization's courses; any key with the public_api:* or course:read scope may call it, and ${ORG_TEAM_RULE}.`,
      tags: ['Courses'],
      responses: {
        200: jsonResponse(
          'Courses returned successfully',
          paginatedResponse(ZPublicApiCourseListItemResponse, CoursesListEnvelope)
        ),
        400: { description: 'Invalid query parameters' },
        401: { description: 'Unauthorized' },
        403: { description: 'The key has neither the public_api:* nor the course:read scope' }
      }
    }),
    validator('query', ZPublicApiCoursesQuery),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const query = c.req.valid('query');
        const courses = await listCoursesService(orgId, actorId, query);

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
      description:
        'Create an unpublished course and add the key creator as its tutor; needs public_api:* or course:write, and an org admin or tutor key creator. The banner field says if one was applied.',
      tags: ['Courses'],
      responses: {
        201: jsonResponse('Course created successfully', itemResponse(ZPublicApiCreateCourseResponse)),
        400: { description: 'Invalid request body' },
        401: { description: 'Unauthorized' },
        403: { description: 'Missing the course:write scope, or the key creator is not an org admin or tutor' }
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
  .post(
    '/:courseId/publish',
    describeRoute({
      description:
        'Publish a course after the go-live readiness check; needs public_api:* or course:write, and a course tutor/admin or org admin key creator. Not-ready courses stay unpublished and list blockers.',
      tags: ['Courses'],
      responses: {
        200: jsonResponse(
          'Publish result; check published and blockers',
          itemResponse(ZPublicApiPublishCourseResponse)
        ),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: {
          description: 'Missing the course:write scope, or the key creator is not a course tutor/admin or org admin'
        },
        404: { description: 'Course not found' }
      }
    }),
    validator('param', ZPublicApiCourseParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const result = await publishPublicApiCourseService(orgId, actorId, params);

        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to publish course');
      }
    }
  )
  .post(
    '/:courseId/unpublish',
    describeRoute({
      description:
        'Unpublish a course so students can no longer open it; needs public_api:* or course:write, and a course tutor/admin or org admin key creator.',
      tags: ['Courses'],
      responses: {
        200: jsonResponse('Course unpublished', itemResponse(ZPublicApiUnpublishCourseResponse)),
        401: errorResponses.unauthorized,
        403: {
          description: 'Missing the course:write scope, or the key creator is not a course tutor/admin or org admin'
        },
        404: { description: 'Course not found' }
      }
    }),
    validator('param', ZPublicApiCourseParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const result = await unpublishPublicApiCourseService(orgId, actorId, params);

        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to unpublish course');
      }
    }
  )
  .get(
    '/:courseId/related',
    describeRoute({
      description:
        'List published courses that share tags with a course, most shared tags first, then newest; any key with the public_api:* or course:read scope may call it.',
      tags: ['Courses'],
      responses: {
        200: jsonResponse(
          'Related courses returned successfully; empty when the course has no tags',
          itemResponse(z.array(ZPublicApiRelatedCourseResponse))
        ),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: { description: 'Missing the course:read scope' },
        404: { description: 'Course not found, or the profileId is not in your organization' }
      }
    }),
    validator('param', ZPublicApiCourseParam),
    validator('query', ZPublicApiRelatedCoursesQuery),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const params = c.req.valid('param');
        const query = c.req.valid('query');
        const courses = await listRelatedCoursesService(orgId, params, query);

        return c.json(
          {
            success: true,
            data: courses
          },
          200
        );
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to list related courses');
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
      description:
        "Get a snapshot of a course's structure; any key with the public_api:* or course:read scope may call it.",
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
      description: `Get a course; ${COURSE_TEAM_RULE}.`,
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
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const course = await getCourseService(orgId, actorId, params);

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
      description: `Update a course; ${ANY_KEY_RULE}, and a key with only course:tag:write may send just tagIds or addTagIds.`,
      tags: ['Courses'],
      responses: {
        200: jsonResponse(
          'Course updated successfully; tags lists the tags on the course after the update',
          itemResponse(ZPublicApiUpdateCourseResponse, ZPublicApiUpdateCourseEnvelope)
        ),
        400: {
          description:
            'Invalid request body, tagIds and addTagIds sent together, or a tag id that is not a tag in this organization'
        },
        401: errorResponses.unauthorized,
        403: {
          description:
            'Missing the public_api:* scope (a course:tag:write key may send only tagIds or addTagIds), or a non-admin sent tags'
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

        const fields = Object.keys(payload);
        const tagsOnly = fields.length > 0 && fields.every((field) => field === 'tagIds' || field === 'addTagIds');
        const keyScopes = c.get('automationKey')?.scopes ?? [];
        if (!tagsOnly && !organizationApiKeyHasScopes(keyScopes, ['public_api:*'])) {
          return c.json(
            { success: false, error: 'Automation key is missing required scopes', code: ErrorCodes.FORBIDDEN },
            403
          );
        }

        const { course, conversionOffenders, publishedNow } = await updatePublicApiCourseService(
          orgId,
          actorId,
          params,
          payload
        );

        if (publishedNow) {
          captureCoursePublished(course, actorId, getEventSource(c));
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
