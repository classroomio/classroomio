import {
  ZPublicApiCreateTag,
  ZPublicApiTagParam,
  ZPublicApiTagsQuery,
  ZPublicApiUpdateTag
} from '@cio/utils/validation/public-api';
import {
  createPublicApiTagService,
  listPublicApiTagGroupsService,
  updatePublicApiTagService
} from '@api/services/v1/tags';

import { Hono } from '@api/utils/hono';
import { handlePublicApiError } from '@api/utils/errors';
import { describeRoute, validator } from 'hono-openapi';
import { errorResponses, jsonResponse } from '@api/utils/openapi/responses';
import { PAGINATION_NOTE } from '../courses/docs';
import { TAG_READ_RULE, TAG_WRITE_RULE, TagGroupsResponse, TagResponse, tagForbiddenResponses } from './docs';

const TAG = 'Tags';

export const v1TagRouter = new Hono()
  .get(
    '/',
    describeRoute({
      description: `List the organization's tag groups, each with its tags. With courseId, only the tags on that course are returned. ${PAGINATION_NOTE} ${TAG_READ_RULE}`,
      tags: [TAG],
      responses: {
        200: jsonResponse('Tag groups returned successfully', TagGroupsResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: tagForbiddenResponses.read,
        404: { description: 'courseId is not a course in this organization' }
      }
    }),
    validator('query', ZPublicApiTagsQuery),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const query = c.req.valid('query');
        const result = await listPublicApiTagGroupsService(orgId, actorId, query);

        return c.json({ success: true, data: result.items, pagination: result.pagination }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to list tags');
      }
    }
  )
  .post(
    '/',
    describeRoute({
      description: `Create a tag in a tag group. Its slug is what the course list's tags filter matches. ${TAG_WRITE_RULE}`,
      tags: [TAG],
      responses: {
        201: jsonResponse('Tag created', TagResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: tagForbiddenResponses.write,
        404: { description: 'Tag group not found' },
        409: { description: 'A tag with the same name (slug) already exists' }
      }
    }),
    validator('json', ZPublicApiCreateTag),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const payload = c.req.valid('json');
        const tag = await createPublicApiTagService(orgId, actorId, payload);

        return c.json({ success: true, data: tag }, 201);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to create tag');
      }
    }
  )
  .put(
    '/:tagId',
    describeRoute({
      description: `Update a tag's name, description, colour or group. Renaming changes its slug. ${TAG_WRITE_RULE}`,
      tags: [TAG],
      responses: {
        200: jsonResponse('Tag updated', TagResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: tagForbiddenResponses.write,
        404: { description: 'Tag or target tag group not found' }
      }
    }),
    validator('param', ZPublicApiTagParam),
    validator('json', ZPublicApiUpdateTag),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const payload = c.req.valid('json');
        const tag = await updatePublicApiTagService(orgId, actorId, params, payload);

        return c.json({ success: true, data: tag }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to update tag');
      }
    }
  );
