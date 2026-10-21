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
import { COURSE_TEAM_RULE, contentForbiddenResponses, mcpRateLimitResponse, studentWorkConflictResponse } from './docs';

const TAG = 'Course Content';
const ALL_OR_NOTHING = 'All or nothing: if any id is not a lesson or exercise of this course, nothing changes.';
const REORDER_ALL_OR_NOTHING =
  'All or nothing: if any id is not a section, lesson or exercise of this course, nothing changes.';

export const v1CourseContentRouter = new Hono()
  .put(
    '/reorder',
    describeRoute({
      description: `Reorder sections and move or reorder lessons and exercises in one transaction; ${COURSE_TEAM_RULE}.`,
      tags: [TAG],
      responses: {
        200: jsonResponse('Content reordered successfully', itemResponse(ZPublicApiReorderCourseContentResponse)),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: contentForbiddenResponses.write,
        404: { description: `Course, section, lesson or exercise not found. ${REORDER_ALL_OR_NOTHING}` },
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
      description: `Lock or unlock lessons and exercises for students; ${COURSE_TEAM_RULE}.`,
      tags: [TAG],
      responses: {
        200: jsonResponse('Content updated successfully', itemResponse(ZPublicApiCourseContentLockResponse)),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: contentForbiddenResponses.write,
        404: { description: `Course, lesson or exercise not found. ${ALL_OR_NOTHING}` },
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
      description: `Permanently delete lessons and exercises with their translations and comments; ${COURSE_TEAM_RULE}.`,
      tags: [TAG],
      responses: {
        200: jsonResponse(
          'Content deleted; returns what was deleted, with the number of submissions and lesson completions deleted with it',
          itemResponse(ZPublicApiCourseContentDeleteResponse)
        ),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: contentForbiddenResponses.write,
        404: {
          description: `Course, lesson or exercise not found; retrying after a delete succeeded returns this. ${ALL_OR_NOTHING}`
        },
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
