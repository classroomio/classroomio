import { ZPublicApiCreateImageUpload, ZPublicApiImageUploadResponse } from '@cio/utils/validation/public-api';

import { createPublicApiImageUploadService } from '@api/services/v1/media/images';

import { Hono } from '@api/utils/hono';
import { handlePublicApiError } from '@api/utils/errors';
import { describeRoute, validator } from 'hono-openapi';
import { MEDIA_WRITE_RULE } from './docs';
import { errorResponses, itemResponse, jsonResponse } from '@api/utils/openapi/responses';

const ImageUploadResponse = itemResponse(ZPublicApiImageUploadResponse);

export const v1ImagesRouter = new Hono().post(
  '/',
  describeRoute({
    description: `Get a URL to upload an image to and the public URL it will be served at; ${MEDIA_WRITE_RULE}.`,
    tags: ['Public API Assets'],
    responses: {
      201: jsonResponse(
        'Upload reserved: PUT the bytes to uploadUrl, then use url in any image field',
        ImageUploadResponse
      ),
      400: errorResponses.badRequest,
      401: errorResponses.unauthorized,
      403: { description: 'Automation key is missing the media:write scope' },
      413: { description: 'Declared byteSize exceeds the limit for the image purpose' }
    }
  }),
  validator('json', ZPublicApiCreateImageUpload),
  async (c) => {
    try {
      const orgId = c.get('orgId')!;
      const actorId = c.get('actorId');
      const payload = c.req.valid('json');
      const result = await createPublicApiImageUploadService(orgId, actorId, payload);

      return c.json({ success: true, data: result }, 201);
    } catch (error) {
      return handlePublicApiError(c, error, 'Failed to reserve an image upload');
    }
  }
);
