import * as z from 'zod';

import {
  ZPublicApiAttachLessonBlock,
  ZPublicApiCourseLessonParam,
  ZPublicApiCreateLessonBlock,
  ZPublicApiDuplicateLessonBlock,
  ZPublicApiLessonBlockLocaleParam,
  ZPublicApiLessonBlockParam,
  ZPublicApiLessonBlockRemovedResponse,
  ZPublicApiLessonBlockResponse,
  ZPublicApiLessonPlacementParam,
  ZPublicApiMoveLessonPlacement,
  ZPublicApiSetLessonBlockLocale,
  ZPublicApiUpdateLessonBlock,
  ZPublicApiUpdateLessonPlacement
} from '@cio/utils/validation/public-api';
import {
  attachPublicApiLessonBlockService,
  createPublicApiLessonBlockService,
  duplicatePublicApiLessonBlockService,
  listPublicApiLessonBlocksService,
  movePublicApiLessonPlacementService,
  removePublicApiLessonPlacementService,
  setPublicApiLessonBlockLocaleService,
  updatePublicApiLessonBlockService,
  updatePublicApiLessonPlacementService
} from '@api/services/v1/lessons/blocks';

import { Hono } from '@api/utils/hono';
import { handlePublicApiError } from '@api/utils/errors';
import { describeRoute, validator } from 'hono-openapi';
import { errorResponses, itemResponse, jsonResponse } from '@api/utils/openapi/responses';
import { COURSE_TEAM_RULE, contentForbiddenResponses, mcpRateLimitResponse } from './docs';

const TAG = 'Lesson Blocks';
const BlockResponse = itemResponse(ZPublicApiLessonBlockResponse);
const notFound = { description: 'Course, lesson or block not found' };
const versionConflict = { description: 'The block was changed by someone else; read it again and retry' };

export const v1CourseLessonBlocksRouter = new Hono()
  .get(
    '/',
    describeRoute({
      description: `List a lesson's content blocks in display order. Uploaded videos and documents come back as short-lived signed links; ${COURSE_TEAM_RULE}.`,
      tags: [TAG],
      responses: {
        200: jsonResponse('Blocks returned', itemResponse(z.array(ZPublicApiLessonBlockResponse))),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: contentForbiddenResponses.read,
        404: notFound,
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiCourseLessonParam),
    async (c) => {
      try {
        const blocks = await listPublicApiLessonBlocksService(c.get('orgId')!, c.get('actorId'), c.req.valid('param'));

        return c.json({ success: true, data: blocks }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to list lesson blocks');
      }
    }
  )
  .post(
    '/',
    describeRoute({
      description: `Add a note, video or slides block to a lesson, at the end unless beforePlacementId or afterPlacementId is given; ${COURSE_TEAM_RULE}.`,
      tags: [TAG],
      responses: {
        201: jsonResponse('Block created', BlockResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: contentForbiddenResponses.write,
        404: notFound,
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiCourseLessonParam),
    validator('json', ZPublicApiCreateLessonBlock),
    async (c) => {
      try {
        const block = await createPublicApiLessonBlockService(
          c.get('orgId')!,
          c.get('actorId'),
          c.req.valid('param'),
          c.req.valid('json')
        );

        return c.json({ success: true, data: block }, 201);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to create lesson block');
      }
    }
  )
  .post(
    '/attach',
    describeRoute({
      description: `Reuse a block from another lesson in this one. The block is shared: editing it changes every lesson that uses it; ${COURSE_TEAM_RULE}.`,
      tags: [TAG],
      responses: {
        201: jsonResponse('Block attached', BlockResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: contentForbiddenResponses.write,
        404: notFound,
        409: { description: 'The block is already in this lesson' },
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiCourseLessonParam),
    validator('json', ZPublicApiAttachLessonBlock),
    async (c) => {
      try {
        const block = await attachPublicApiLessonBlockService(
          c.get('orgId')!,
          c.get('actorId'),
          c.req.valid('param'),
          c.req.valid('json')
        );

        return c.json({ success: true, data: block }, 201);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to attach lesson block');
      }
    }
  )
  .patch(
    '/placements/:placementId',
    describeRoute({
      description: `Change how one lesson uses a block (required, watch threshold) without affecting other lessons; ${COURSE_TEAM_RULE}.`,
      tags: [TAG],
      responses: {
        200: jsonResponse('Placement updated', BlockResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: contentForbiddenResponses.write,
        404: notFound,
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiLessonPlacementParam),
    validator('json', ZPublicApiUpdateLessonPlacement),
    async (c) => {
      try {
        const block = await updatePublicApiLessonPlacementService(
          c.get('orgId')!,
          c.get('actorId'),
          c.req.valid('param'),
          c.req.valid('json')
        );

        return c.json({ success: true, data: block }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to update lesson block placement');
      }
    }
  )
  .put(
    '/placements/:placementId/move',
    describeRoute({
      description: `Move a block before or after another block in the lesson; ${COURSE_TEAM_RULE}.`,
      tags: [TAG],
      responses: {
        200: jsonResponse('Block moved', BlockResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: contentForbiddenResponses.write,
        404: notFound,
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiLessonPlacementParam),
    validator('json', ZPublicApiMoveLessonPlacement),
    async (c) => {
      try {
        const block = await movePublicApiLessonPlacementService(
          c.get('orgId')!,
          c.get('actorId'),
          c.req.valid('param'),
          c.req.valid('json')
        );

        return c.json({ success: true, data: block }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to move lesson block');
      }
    }
  )
  .delete(
    '/placements/:placementId',
    describeRoute({
      description: `Remove a block from the lesson. The block itself is deleted only when no other lesson uses it; ${COURSE_TEAM_RULE}.`,
      tags: [TAG],
      responses: {
        200: jsonResponse('Block removed', itemResponse(ZPublicApiLessonBlockRemovedResponse)),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: contentForbiddenResponses.write,
        404: notFound,
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiLessonPlacementParam),
    async (c) => {
      try {
        const result = await removePublicApiLessonPlacementService(
          c.get('orgId')!,
          c.get('actorId'),
          c.req.valid('param')
        );

        return c.json({ success: true, data: result }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to remove lesson block');
      }
    }
  )
  .patch(
    '/:blockId',
    describeRoute({
      description: `Replace a block's video or slides. The change shows up in every lesson that uses the block; ${COURSE_TEAM_RULE}.`,
      tags: [TAG],
      responses: {
        200: jsonResponse('Block updated', BlockResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: contentForbiddenResponses.write,
        404: notFound,
        409: versionConflict,
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiLessonBlockParam),
    validator('json', ZPublicApiUpdateLessonBlock),
    async (c) => {
      try {
        const block = await updatePublicApiLessonBlockService(
          c.get('orgId')!,
          c.get('actorId'),
          c.req.valid('param'),
          c.req.valid('json')
        );

        return c.json({ success: true, data: block }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to update lesson block');
      }
    }
  )
  .put(
    '/:blockId/locale/:locale',
    describeRoute({
      description: `Create or replace a note block's content in one language; each save is recorded in its history; ${COURSE_TEAM_RULE}.`,
      tags: [TAG],
      responses: {
        200: jsonResponse('Content saved; the HTML is sanitized', BlockResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: contentForbiddenResponses.write,
        404: notFound,
        409: versionConflict,
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiLessonBlockLocaleParam),
    validator('json', ZPublicApiSetLessonBlockLocale),
    async (c) => {
      try {
        const block = await setPublicApiLessonBlockLocaleService(
          c.get('orgId')!,
          c.get('actorId'),
          c.req.valid('param'),
          c.req.valid('json')
        );

        return c.json({ success: true, data: block }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to save lesson block content');
      }
    }
  )
  .post(
    '/:blockId/duplicate',
    describeRoute({
      description: `Copy a block. With replacePlacementId the lesson switches to the copy, so edits no longer affect other lessons; ${COURSE_TEAM_RULE}.`,
      tags: [TAG],
      responses: {
        201: jsonResponse('Block copied', BlockResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: contentForbiddenResponses.write,
        404: notFound,
        429: mcpRateLimitResponse
      }
    }),
    validator('param', ZPublicApiLessonBlockParam),
    validator('json', ZPublicApiDuplicateLessonBlock),
    async (c) => {
      try {
        const block = await duplicatePublicApiLessonBlockService(
          c.get('orgId')!,
          c.get('actorId'),
          c.req.valid('param'),
          c.req.valid('json')
        );

        return c.json({ success: true, data: block }, 201);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to duplicate lesson block');
      }
    }
  );
