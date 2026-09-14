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
import { automationKeyScopeOrSessionMiddleware } from '@api/middlewares/automation-key-scope-or-session';
import { generateFileKey } from '@cio/core/utils/upload';
import { AppError, ErrorCodes } from '@api/utils/errors';
import { MAX_DOCUMENT_SIZE, MAX_FILE_SIZE } from '@api/constants/upload';
import { getAssetsByStorageKeys } from '@cio/db/queries/assets';
import type { Context } from 'hono';

const requireCourseWrite = automationKeyScopeOrSessionMiddleware(['course:write']);

const AutomationKeyForbiddenResponse = {
  description:
    'Automation key is missing the required scope, or (download routes only) one or more requested keys do not belong to the key\'s organization'
};

/**
 * Session callers keep today's behavior unchanged (no per-key ownership check on this
 * legacy endpoint). Automation-key callers get a real check: every requested key must
 * resolve to an asset actually owned by the key's organization, otherwise the whole
 * request is rejected. Without this, any org's course:write key could sign a download
 * URL for any other org's object just by guessing/knowing its storage key.
 */
export async function assertAutomationKeyOwnsDownloadKeys(c: Context, keys: string[]): Promise<Response | void> {
  const automationKey = c.get('automationKey');
  if (!automationKey) {
    return;
  }

  const owned = await getAssetsByStorageKeys(automationKey.organizationId, keys);
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
        403: AutomationKeyForbiddenResponse
      },
      tags: ['Presign']
    }),
    validator('json', ZCoursePresignUrlUpload),
    async (c) => {
      const body = c.req.valid('json');

      const { fileName, fileType, fileSize } = body;

      assertPresignFileSizeWithinLimit(fileSize, MAX_FILE_SIZE);

      const fileKey = generateFileKey(fileName);

      const presignedUrl = await generateVideoUploadPresignedUrl(fileKey, fileType);

      return c.json({
        success: true,
        url: presignedUrl,
        fileKey,
        message: 'Pre-signed URL generated successfully'
      });
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
        403: AutomationKeyForbiddenResponse
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
        403: AutomationKeyForbiddenResponse
      },
      tags: ['Presign']
    }),
    validator('json', ZCourseDownloadPresignedUrl),
    async (c) => {
      const body = c.req.valid('json');

      const { keys } = body;

      const forbidden = await assertAutomationKeyOwnsDownloadKeys(c, keys);
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
        403: AutomationKeyForbiddenResponse
      },
      tags: ['Presign']
    }),
    validator('json', ZCourseDownloadPresignedUrl),
    async (c) => {
      const body = c.req.valid('json');

      const { keys } = body;

      const forbidden = await assertAutomationKeyOwnsDownloadKeys(c, keys);
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
