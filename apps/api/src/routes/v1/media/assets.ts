import { ZPublicApiAssetUploadResponse, ZPublicApiCreateAsset } from '@cio/utils/validation/public-api';

import { createPublicApiAssetUploadService } from '@api/services/v1/media/assets';

import { Hono } from '@api/utils/hono';
import { handlePublicApiError } from '@api/utils/errors';
import { describeRoute, validator } from 'hono-openapi';
import { MEDIA_WRITE_RULE, UPLOAD_FLOW_NOTE } from './docs';
import { errorResponses, itemResponse, jsonResponse } from '@api/utils/openapi/responses';

const AssetUploadResponse = itemResponse(ZPublicApiAssetUploadResponse);

export const v1AssetsRouter = new Hono().post(
  '/',
  describeRoute({
    description: `Reserve an asset and get a URL to upload its bytes to. ${UPLOAD_FLOW_NOTE} ${MEDIA_WRITE_RULE}`,
    tags: ['Public API Assets'],
    responses: {
      201: jsonResponse('Asset reserved and upload URL issued', AssetUploadResponse),
      400: errorResponses.badRequest,
      401: errorResponses.unauthorized,
      403: { description: 'Automation key is missing the media:write scope' },
      413: { description: 'Declared byteSize exceeds the upload limit' }
    }
  }),
  validator('json', ZPublicApiCreateAsset),
  async (c) => {
    try {
      const orgId = c.get('orgId')!;
      const actorId = c.get('actorId');
      const payload = c.req.valid('json');
      const result = await createPublicApiAssetUploadService(orgId, actorId, payload);

      return c.json({ success: true, data: result }, 201);
    } catch (error) {
      return handlePublicApiError(c, error, 'Failed to reserve an asset upload');
    }
  }
);
