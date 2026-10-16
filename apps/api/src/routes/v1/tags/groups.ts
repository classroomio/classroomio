import {
  ZPublicApiCreateTagGroup,
  ZPublicApiTagGroupParam,
  ZPublicApiUpdateTagGroup
} from '@cio/utils/validation/public-api';
import { createPublicApiTagGroupService, updatePublicApiTagGroupService } from '@api/services/v1/tags';

import { Hono } from '@api/utils/hono';
import { handlePublicApiError } from '@api/utils/errors';
import { describeRoute, validator } from 'hono-openapi';
import { errorResponses, jsonResponse } from '@api/utils/openapi/responses';
import { TAG_WRITE_RULE, TagGroupResponse, tagForbiddenResponses } from './docs';

const TAG = 'Tags';

export const v1TagGroupsRouter = new Hono()
  .post(
    '/',
    describeRoute({
      description: `Create a tag group. ${TAG_WRITE_RULE}`,
      tags: [TAG],
      responses: {
        201: jsonResponse('Tag group created', TagGroupResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: tagForbiddenResponses.write,
        409: { description: 'A tag group with the same name (slug) already exists' }
      }
    }),
    validator('json', ZPublicApiCreateTagGroup),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const payload = c.req.valid('json');
        const group = await createPublicApiTagGroupService(orgId, actorId, payload);

        return c.json({ success: true, data: group }, 201);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to create tag group');
      }
    }
  )
  .put(
    '/:groupId',
    describeRoute({
      description: `Update a tag group's name, description or order. Renaming changes its slug. ${TAG_WRITE_RULE}`,
      tags: [TAG],
      responses: {
        200: jsonResponse('Tag group updated', TagGroupResponse),
        400: errorResponses.badRequest,
        401: errorResponses.unauthorized,
        403: tagForbiddenResponses.write,
        404: { description: 'Tag group not found' }
      }
    }),
    validator('param', ZPublicApiTagGroupParam),
    validator('json', ZPublicApiUpdateTagGroup),
    async (c) => {
      try {
        const orgId = c.get('orgId')!;
        const actorId = c.get('actorId');
        const params = c.req.valid('param');
        const payload = c.req.valid('json');
        const group = await updatePublicApiTagGroupService(orgId, actorId, params, payload);

        return c.json({ success: true, data: group }, 200);
      } catch (error) {
        return handlePublicApiError(c, error, 'Failed to update tag group');
      }
    }
  );
