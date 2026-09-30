import {
  ZPublicApiCourseParam,
  ZPublicApiCourseSectionParam,
  ZPublicApiCourseSectionResponse,
  ZPublicApiCourseSectionsQuery,
  ZPublicApiCreateCourseSection,
  ZPublicApiCreateCourseSectionResponse,
  ZPublicApiUpdateCourseSection
} from '@cio/utils/validation/public-api';
import {
  createPublicApiCourseSectionService,
  deletePublicApiCourseSectionService,
  listPublicApiCourseSectionsService,
  updatePublicApiCourseSectionService
} from '@api/services/v1/courses/sections';

import { Hono } from '@api/utils/hono';
import { handlePublicApiError } from '@api/utils/errors';
import { describeRoute, validator } from 'hono-openapi';
import { errorResponses, itemResponse, jsonResponse, paginatedResponse } from '@api/utils/openapi/responses';
import { COURSE_TEAM_RULE, PAGINATION_NOTE, contentForbiddenResponses, mcpRateLimitResponse } from './docs';

const TAG = 'Public API Course Sections';
const SectionResponse = itemResponse(ZPublicApiCourseSectionResponse);

export const v1CourseSectionsRouter = new Hono()
  .get(
    '/',
    describeRoute({
      description: `List a course's sections in order. For sections with their lessons and exercises, use GET /courses/{courseId}/structure. ${PAGINATION_NOTE} ${COURSE_TEAM_RULE}`,
      tags: [TAG],
      responses: {
        200: jsonResponse('Sections returned successfully', paginatedResponse(ZPublicApiCourseSectionResponse)),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: contentForbiddenResponses.read,
        404: { description: 'Course not found' },
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiCourseParam),
    validator('query', ZPublicApiCourseSectionsQuery),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const result = await listPublicApiCourseSectionsService(
          orgId,
          actorId,
          c.req.valid('param'),
          c.req.valid('query')
        );

        return c.json({ success: true, data: result.items, pagination: result.pagination }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to list course sections');
      }
    }
  )
  .post(
    '/',
    describeRoute({
      description: `Create a section. Send order to place it, or moveUngrouped: true (without order) to add it at the end and move every lesson and exercise that has no section into it; that fails with 400 when there is no such content. ${COURSE_TEAM_RULE}`,
      tags: [TAG],
      responses: {
        201: jsonResponse('Section created successfully', itemResponse(ZPublicApiCreateCourseSectionResponse)),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: contentForbiddenResponses.write,
        404: { description: 'Course not found' },
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiCourseParam),
    validator('json', ZPublicApiCreateCourseSection),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const section = await createPublicApiCourseSectionService(
          orgId,
          actorId,
          c.req.valid('param'),
          c.req.valid('json')
        );

        return c.json({ success: true, data: section }, 201);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to create course section');
      }
    }
  )
  .put(
    '/:sectionId',
    describeRoute({
      description: `Rename or move a section. Omitted fields keep their values. To reorder several sections at once, use PUT /courses/{courseId}/content/reorder. ${COURSE_TEAM_RULE}`,
      tags: [TAG],
      responses: {
        200: jsonResponse('Section updated successfully', SectionResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: contentForbiddenResponses.write,
        404: { description: 'Course or section not found' },
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiCourseSectionParam),
    validator('json', ZPublicApiUpdateCourseSection),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const section = await updatePublicApiCourseSectionService(
          orgId,
          actorId,
          c.req.valid('param'),
          c.req.valid('json')
        );

        return c.json({ success: true, data: section }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to update course section');
      }
    }
  )
  .delete(
    '/:sectionId',
    describeRoute({
      description: `Permanently delete a section together with every lesson and exercise in it, as the dashboard does. Returns the deleted section. ${COURSE_TEAM_RULE}`,
      tags: [TAG],
      responses: {
        200: jsonResponse('Section deleted successfully', SectionResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: contentForbiddenResponses.write,
        404: { description: 'Course or section not found' },
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiCourseSectionParam),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const section = await deletePublicApiCourseSectionService(orgId, actorId, c.req.valid('param'));

        return c.json({ success: true, data: section }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to delete course section');
      }
    }
  );
