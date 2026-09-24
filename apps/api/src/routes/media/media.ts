import { AppError, ErrorCodes } from '@api/utils/errors';

import { Hono } from '@api/utils/hono';
import { describeRoute } from 'hono-openapi';
import { authOrAutomationKeyMiddleware } from '@api/middlewares/auth-or-automation-key';
import { memberOrAutomationKeyMiddleware } from '@api/middlewares/member-or-automation-key';
import { assertMcpAutomationUsageAllowed, recordMcpAutomationUsage } from '@api/services/organization/automation-usage';
import { handleError } from '@api/utils/errors';
import { uploadImage } from '@api/services/media';
import { createOrGetAssetByStorageKey } from '@cio/db/queries/assets';

export const mediaRouter = new Hono().post(
  '/image',
  authOrAutomationKeyMiddleware,
  memberOrAutomationKeyMiddleware(['course:write']),
  describeRoute({
    description:
      'Upload an image (multipart field "file") and return its public URL. Any signed-in user can upload; an automation key needs the course:write scope. The image is registered as an asset of the organization when one is known.',
    tags: ['Media'],
    responses: {
      200: { description: 'Image uploaded successfully' },
      400: { description: 'No file provided' },
      401: { description: 'Not signed in, invalid API key, or the key has no actor' },
      403: { description: 'Automation key is missing the course:write scope' }
    }
  }),
  async (c) => {
    try {
      const body = await c.req.parseBody();

      const file = body.file;

      if (!file || !(file instanceof File)) {
        throw new AppError(new Error('No file provided'), ErrorCodes.VALIDATION_ERROR, 400);
      }

      const orgId = c.get('orgId');
      const actorId = c.get('actorId');
      const automationKey = c.get('automationKey');

      if (!actorId) {
        throw new AppError('Automation actor is required', ErrorCodes.UNAUTHORIZED, 401);
      }

      if (automationKey?.type === 'mcp') {
        await assertMcpAutomationUsageAllowed(automationKey, 'upload_image');
      }

      const result = await uploadImage(file);

      if (orgId) {
        await createOrGetAssetByStorageKey({
          organizationId: orgId,
          kind: 'image',
          provider: 'upload',
          storageProvider: 's3',
          storageKey: result.fileKey,
          sourceUrl: result.url,
          mimeType: file.type,
          byteSize: file.size,
          title: file.name,
          isExternal: false,
          status: 'active',
          metadata: {},
          createdByProfileId: actorId
        }).catch((error) => {
          console.error('Failed to register uploaded image as an asset:', error);
        });
      }

      if (automationKey?.type === 'mcp') {
        await recordMcpAutomationUsage(automationKey, 'upload_image', { fileKey: result.fileKey });
      }

      return c.json({
        success: true,
        url: result.url,
        fileKey: result.fileKey,
        message: 'Image uploaded successfully'
      });
    } catch (error) {
      return handleError(c, error, 'Failed to upload image');
    }
  }
);
