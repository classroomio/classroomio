import {
  ZPublicApiCourseContentDeleteResponse,
  ZPublicApiCourseContentLockResponse,
  ZPublicApiCourseParam,
  ZPublicApiDeleteCourseContent,
  ZPublicApiForceQuery,
  ZPublicApiReorderCourseContent,
  ZPublicApiReorderCourseContentResponse,
  ZPublicApiUpdateCourseContentLock
} from '@cio/utils/validation/public-api';
import {
  deletePublicApiCourseContentService,
  reorderPublicApiCourseContentService,
  updatePublicApiCourseContentLockService
} from '@api/services/v1/courses/content';

import { Hono } from '@api/utils/hono';
import { handlePublicApiError } from '@api/utils/errors';
import { describeRoute, validator } from 'hono-openapi';
import { errorResponses, itemResponse, jsonResponse } from '@api/utils/openapi/responses';
import {
  COURSE_TEAM_RULE,
  STUDENT_WORK_NOTE,
  contentForbiddenResponses,
  mcpRateLimitResponse,
  studentWorkConflictResponse
} from './docs';

const TAG = 'Course Content';
const ATOMIC_NOTE =
  'All or nothing: if any id is not a lesson or exercise of this course, nothing changes and this fails with 404. Up to 500 items; an id may appear once per type.';

export const v1CourseContentRouter = new Hono()
  .put(
    '/reorder',
    describeRoute({
      description: `Reorder sections and move or reorder lessons and exercises in one transaction. sections sets section order; items set each item's order and, with sectionId, move it to another section (null for no section). Orders you send must be 1, 2, 3, … within each group. ${ATOMIC_NOTE} ${COURSE_TEAM_RULE}`,
      tags: [TAG],
      responses: {
        200: jsonResponse('Content reordered successfully', itemResponse(ZPublicApiReorderCourseContentResponse)),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: contentForbiddenResponses.write,
        404: { description: 'Course, section, lesson or exercise not found' },
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiCourseParam),
    validator('json', ZPublicApiReorderCourseContent),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const result = await reorderPublicApiCourseContentService(
          orgId,
          actorId,
          c.req.valid('param'),
          c.req.valid('json')
        );

        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to reorder course content');
      }
    }
  )
  .patch(
    '/',
    describeRoute({
      description: `Lock or unlock lessons and exercises for students (isUnlocked). Returns each item as stored after the change. ${ATOMIC_NOTE} ${COURSE_TEAM_RULE}`,
      tags: [TAG],
      responses: {
        200: jsonResponse('Content updated successfully', itemResponse(ZPublicApiCourseContentLockResponse)),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: contentForbiddenResponses.write,
        404: { description: 'Course, lesson or exercise not found' },
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiCourseParam),
    validator('json', ZPublicApiUpdateCourseContentLock),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const result = await updatePublicApiCourseContentLockService(
          orgId,
          actorId,
          c.req.valid('param'),
          c.req.valid('json')
        );

        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to update course content');
      }
    }
  )
  .delete(
    '/',
    describeRoute({
      description: `Permanently delete lessons and exercises, with their translations and comments. Returns what was deleted, with the number of submissions and lesson completions deleted with it. Retrying after success returns 404 because the items are gone. ${STUDENT_WORK_NOTE} ${ATOMIC_NOTE} ${COURSE_TEAM_RULE}`,
      tags: [TAG],
      responses: {
        200: jsonResponse('Content deleted successfully', itemResponse(ZPublicApiCourseContentDeleteResponse)),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: contentForbiddenResponses.write,
        404: { description: 'Course, lesson or exercise not found' },
        409: studentWorkConflictResponse,
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiCourseParam),
    validator('json', ZPublicApiDeleteCourseContent),
    validator('query', ZPublicApiForceQuery),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const result = await deletePublicApiCourseContentService(
          orgId,
          actorId,
          c.req.valid('param'),
          c.req.valid('json'),
          c.req.valid('query')
        );

        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to delete course content');
      }
    }
  );
