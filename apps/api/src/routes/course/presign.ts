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
import { authMiddleware } from '@api/middlewares/auth';
import { generateFileKey } from '@cio/core/utils/upload';
import { AppError } from '@api/utils/errors';
import { MAX_DOCUMENT_SIZE, MAX_FILE_SIZE } from '@api/constants/upload';

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
    authMiddleware,
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
        }
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
    authMiddleware,
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
        }
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
    authMiddleware,
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
        }
      },
      tags: ['Presign']
    }),
    validator('json', ZCourseDownloadPresignedUrl),
    async (c) => {
      const body = c.req.valid('json');

      const { keys } = body;

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
    authMiddleware,
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
        }
      },
      tags: ['Presign']
    }),
    validator('json', ZCourseDownloadPresignedUrl),
    async (c) => {
      const body = c.req.valid('json');

      const { keys } = body;

      const signedUrls = await generateDocumentDownloadPresignedUrls(keys);

      return c.json({
        success: true,
        urls: signedUrls,
        message: 'Document URLs retrieved successfully'
      });
    }
  );
