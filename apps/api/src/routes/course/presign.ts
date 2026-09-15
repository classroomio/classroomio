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
import { createOrGetAssetByStorageKey, getAssetsByStorageKeys } from '@cio/db/queries/assets';
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

/**
 * Automation-key callers always carry their org on `c.get('automationKey')`. Session callers
 * don't go through any org-scoped middleware on these routes, so we fall back to the same
 * `cio-org-id` header the dashboard already sends on every request (see `organization/assets.ts`).
 */
export function resolveCallerOrganizationId(c: Context): string | null {
  const automationKey = c.get('automationKey');
  return automationKey?.organizationId ?? c.req.header('cio-org-id') ?? null;
}

/**
 * Registers the freshly-issued storage key as an asset so `assertAutomationKeyOwnsDownloadKeys`
 * has a row to match against later. Without this, no key issued by the upload routes ever
 * belongs to anyone as far as the download ownership check is concerned, and every download
 * request 403s regardless of caller.
 *
 * Bookkeeping only: the actual bytes land in storage the moment the client PUTs to the
 * presigned URL, independent of this write, so a failure here must not fail the upload
 * response — it just means this key's future download ownership check fails closed until
 * the row exists, same as before this function existed.
 */
export async function registerUploadedAsset(
  c: Context,
  params: { fileKey: string; fileType: string; fileSize: number | undefined; kind: 'video' | 'document' }
): Promise<void> {
  const organizationId = resolveCallerOrganizationId(c);
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
      createdByProfileId: c.get('user')?.id ?? null
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

      await registerUploadedAsset(c, { fileKey, fileType, fileSize, kind: 'video' });

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
