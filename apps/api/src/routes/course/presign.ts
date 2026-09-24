import {
  ZCourseDocumentPresignUrlUpload,
  ZCourseDownloadPresignedUrl,
  ZCoursePresignUrlUpload
} from '@cio/utils/validation/course';
import { describeRoute, validator } from 'hono-openapi';
import {
  generateDocumentDownloadPresignedUrls,
  generateDocumentUploadPresignedUrl,
  generateVideoDownloadPresignedUrls,
  generateVideoUploadPresignedUrl
} from '@cio/core/utils/s3';

import { Hono } from '@api/utils/hono';
import { authOrAutomationKeyMiddleware } from '@api/middlewares/auth-or-automation-key';
import { memberOrAutomationKeyMiddleware } from '@api/middlewares/member-or-automation-key';
import { assertMcpAutomationUsageAllowed, recordMcpAutomationUsage } from '@api/services/organization/automation-usage';
import { generateFileKey } from '@cio/core/utils/upload';
import { AppError, ErrorCodes, handleError } from '@api/utils/errors';
import { MAX_DOCUMENT_SIZE, MAX_FILE_SIZE } from '@api/constants/upload';
import { createOrGetAssetByStorageKey, getAssetsByStorageKeys } from '@cio/db/queries/assets';
import type { Context } from 'hono';

const requireCourseWrite = memberOrAutomationKeyMiddleware(['course:write']);

const CourseWriteForbiddenResponse = {
  description:
    "Automation key is missing the course:write scope, or (download routes, automation keys only) one or more requested keys do not belong to the key's organization"
};

export async function assertCallerOwnsDownloadKeys(c: Context, keys: string[]): Promise<Response | void> {
  if (!c.get('automationKey')) {
    return;
  }

  const organizationId = c.get('orgId');
  if (!organizationId) {
    return c.json({ success: false, error: 'Automation key has no organization', code: ErrorCodes.FORBIDDEN }, 403);
  }

  const owned = await getAssetsByStorageKeys(organizationId, keys);
  const ownedKeys = new Set(owned.map((asset) => asset.storageKey));
  const unauthorizedKeys = keys.filter((key) => !ownedKeys.has(key));

  if (unauthorizedKeys.length > 0) {
    return c.json(
      {
        success: false,
        error: 'One or more requested keys do not belong to this organization',
        code: ErrorCodes.FORBIDDEN
      },
      403
    );
  }
}

/**
 * Advisory check on client-reported `fileSize`. Upload bytes go directly to object storage
 * via the presigned PUT URL, so omitting `fileSize` (or understating it) bypasses this guard.
 * Real enforcement requires storage-side policies (bucket max object size, etc.).
 */
function assertPresignFileSizeWithinLimit(fileSize: number | undefined, maxBytes: number): void {
  if (fileSize != null && fileSize > maxBytes) {
    throw new AppError(`File size exceeds maximum of ${maxBytes / 1024 / 1024}MB`, 'FILE_TOO_LARGE', 413);
  }
}

export async function registerUploadedAsset(
  c: Context,
  params: { fileKey: string; fileType: string; fileSize: number | undefined; kind: 'video' | 'document' }
): Promise<void> {
  const organizationId = c.get('orgId');
  if (!organizationId) {
    return;
  }

  try {
    await createOrGetAssetByStorageKey({
      organizationId,
      kind: params.kind,
      provider: 'upload',
      storageKey: params.fileKey,
      mimeType: params.fileType,
      byteSize: params.fileSize ?? null,
      createdByProfileId: c.get('actorId') ?? null
    });
  } catch (error) {
    console.error('Failed to register uploaded asset for ownership checks:', error);
  }
}

// Response schemas for OpenAPI documentation
const PresignUploadResponse = {
  type: 'object' as const,
  properties: {
    success: { type: 'boolean' as const },
    url: { type: 'string' as const },
    fileKey: { type: 'string' as const },
    message: { type: 'string' as const }
  },
  required: ['success', 'url', 'fileKey', 'message']
};

const PresignDownloadResponse = {
  type: 'object' as const,
  properties: {
    success: { type: 'boolean' as const },
    urls: {
      type: 'object' as const,
      additionalProperties: { type: 'string' as const }
    },
    message: { type: 'string' as const }
  },
  required: ['success', 'urls', 'message']
};

export const presignRouter = new Hono()
  .post(
    '/video/upload',
    authOrAutomationKeyMiddleware,
    requireCourseWrite,
    describeRoute({
      description: 'Generate a pre-signed URL for video upload',
      responses: {
        200: {
          description: 'Pre-signed URL generated successfully',
          content: {
            'application/json': {
              schema: PresignUploadResponse
            }
          }
        },
        400: {
          description: 'Invalid request body'
        },
        401: {
          description: 'Unauthorized'
        },
        403: CourseWriteForbiddenResponse
      },
      tags: ['Presign']
    }),
    validator('json', ZCoursePresignUrlUpload),
    async (c) => {
      try {
        const { fileName, fileType, fileSize } = c.req.valid('json');
        const automationKey = c.get('automationKey');

        assertPresignFileSizeWithinLimit(fileSize, MAX_FILE_SIZE);

        if (automationKey?.type === 'mcp') {
          await assertMcpAutomationUsageAllowed(automationKey, 'upload_video');
        }

        const fileKey = generateFileKey(fileName);
        const presignedUrl = await generateVideoUploadPresignedUrl(fileKey, fileType);

        await registerUploadedAsset(c, { fileKey, fileType, fileSize, kind: 'video' });

        if (automationKey?.type === 'mcp') {
          await recordMcpAutomationUsage(automationKey, 'upload_video', { fileKey });
        }

        return c.json({
          success: true,
          url: presignedUrl,
          fileKey,
          message: 'Pre-signed URL generated successfully'
        });
      } catch (error) {
        return handleError(c, error, 'Failed to generate video upload URL');
      }
    }
  )
  .post(
    '/document/upload',
    authOrAutomationKeyMiddleware,
    requireCourseWrite,
    describeRoute({
      description: 'Generate a pre-signed URL for document upload',
      responses: {
        200: {
          description: 'Document pre-signed URL generated successfully',
          content: {
            'application/json': {
              schema: PresignUploadResponse
            }
          }
        },
        400: {
          description: 'Invalid request body'
        },
        401: {
          description: 'Unauthorized'
        },
        403: CourseWriteForbiddenResponse
      },
      tags: ['Presign']
    }),
    validator('json', ZCourseDocumentPresignUrlUpload),
    async (c) => {
      const body = c.req.valid('json');

      const { fileName, fileType, fileSize } = body;

      assertPresignFileSizeWithinLimit(fileSize, MAX_DOCUMENT_SIZE);

      const fileKey = generateFileKey(fileName);

      const presignedUrl = await generateDocumentUploadPresignedUrl(fileKey, fileType);

      await registerUploadedAsset(c, { fileKey, fileType, fileSize, kind: 'document' });

      return c.json({
        success: true,
        url: presignedUrl,
        fileKey,
        message: 'Document pre-signed URL generated successfully'
      });
    }
  )
  .post(
    '/video/download',
    authOrAutomationKeyMiddleware,
    requireCourseWrite,
    describeRoute({
      description: 'Generate pre-signed URLs for video download',
      responses: {
        200: {
          description: 'Video URLs retrieved successfully',
          content: {
            'application/json': {
              schema: PresignDownloadResponse
            }
          }
        },
        400: {
          description: 'Invalid request body'
        },
        401: {
          description: 'Unauthorized'
        },
        403: CourseWriteForbiddenResponse
      },
      tags: ['Presign']
    }),
    validator('json', ZCourseDownloadPresignedUrl),
    async (c) => {
      const body = c.req.valid('json');

      const { keys } = body;

      const forbidden = await assertCallerOwnsDownloadKeys(c, keys);
      if (forbidden) {
        return forbidden;
      }

      const signedUrls = await generateVideoDownloadPresignedUrls(keys);

      return c.json({
        success: true,
        urls: signedUrls,
        message: 'Video URLs retrieved successfully'
      });
    }
  )
  .post(
    '/document/download',
    authOrAutomationKeyMiddleware,
    requireCourseWrite,
    describeRoute({
      description: 'Generate pre-signed URLs for document download',
      responses: {
        200: {
          description: 'Document URLs retrieved successfully',
          content: {
            'application/json': {
              schema: PresignDownloadResponse
            }
          }
        },
        400: {
          description: 'Invalid request body'
        },
        401: {
          description: 'Unauthorized'
        },
        403: CourseWriteForbiddenResponse
      },
      tags: ['Presign']
    }),
    validator('json', ZCourseDownloadPresignedUrl),
    async (c) => {
      const body = c.req.valid('json');

      const { keys } = body;

      const forbidden = await assertCallerOwnsDownloadKeys(c, keys);
      if (forbidden) {
        return forbidden;
      }

      const signedUrls = await generateDocumentDownloadPresignedUrls(keys);

      return c.json({
        success: true,
        urls: signedUrls,
        message: 'Document URLs retrieved successfully'
      });
    }
  );
