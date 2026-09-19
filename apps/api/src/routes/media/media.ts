import { AppError, ErrorCodes } from '@api/utils/errors';

import { Hono } from '@api/utils/hono';
import { authOrAutomationKeyMiddleware } from '@api/middlewares/auth-or-automation-key';
import { orgTeamMemberOrAutomationKeyMiddleware } from '@api/middlewares/org-team-member-or-automation-key';
import { assertMcpAutomationUsageAllowed, recordMcpAutomationUsage } from '@api/services/organization/automation-usage';
import { handleError } from '@api/utils/errors';
import { uploadImage } from '@api/services/media';
import { createOrGetAssetByStorageKey } from '@cio/db/queries/assets';

export const mediaRouter = new Hono().post(
  '/image',
  authOrAutomationKeyMiddleware,
  orgTeamMemberOrAutomationKeyMiddleware(['course:write']),
  async (c) => {
    try {
      const body = await c.req.parseBody();

      const file = body.file;

      if (!file || !(file instanceof File)) {
        throw new AppError(new Error('No file provided'), ErrorCodes.VALIDATION_ERROR, 400);
      }

      const orgId = c.get('orgId')!;
      const actorId = c.get('actorId')!;
      const automationKey = c.get('automationKey');

      if (automationKey?.type === 'mcp') {
        await assertMcpAutomationUsageAllowed(automationKey, 'upload_image');
      }

      const result = await uploadImage(file);

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
      });

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
