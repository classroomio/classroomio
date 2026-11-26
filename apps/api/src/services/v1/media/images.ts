import type { TPublicApiCreateImageUpload, TPublicApiImageUploadResponse } from '@cio/utils/validation/public-api';

import { getImageUploadLimitBytes } from '@cio/utils/config/upload-limits';
import { validateImageUpload } from '@cio/utils/functions/fileValidation';
import { getStorageConfig } from '@cio/core/config/storage';
import { generateFileKey } from '@cio/core/utils/upload';
import { generateMediaUploadPresignedUrl } from '@cio/core/utils/s3';
import { getUploadLimits } from '@api/constants/upload';
import { getMediaPublicBaseUrl } from '@api/services/media';
import { assertAutomationActor } from '@api/services/v1/shared';
import { AppError, ErrorCodes } from '@api/utils/errors';

const BYTES_PER_MB = 1024 * 1024;

/**
 * Checks the image against the dashboard's rules for its purpose and returns a presigned PUT URL plus the
 * permanent public URL the image will be served at. Throws 400 for a bad file name or type and 413 when too large.
 */
export async function createPublicApiImageUploadService(
  orgId: string,
  actorId: string | null,
  payload: TPublicApiCreateImageUpload
): Promise<TPublicApiImageUploadResponse> {
  assertAutomationActor(actorId);

  const validation = validateImageUpload({ type: payload.mimeType, name: payload.fileName });
  if (!validation.isValid) {
    throw new AppError(validation.error ?? 'Invalid image', ErrorCodes.VALIDATION_ERROR, 400, 'fileName');
  }

  const maxByteSize = getImageUploadLimitBytes(payload.purpose, getUploadLimits());
  if (payload.byteSize > maxByteSize) {
    throw new AppError(
      `File size exceeds the ${maxByteSize / BYTES_PER_MB}MB limit for ${payload.purpose} images`,
      ErrorCodes.VALIDATION_ERROR,
      413,
      'byteSize'
    );
  }

  const mediaPublicBaseUrl = getMediaPublicBaseUrl();
  const fileKey = generateFileKey(payload.fileName, orgId);
  const uploadUrl = await generateMediaUploadPresignedUrl(fileKey, payload.mimeType, payload.byteSize);
  const expiresAt = new Date(Date.now() + getStorageConfig().presignUploadExpiresSeconds * 1000).toISOString();

  return { url: `${mediaPublicBaseUrl}/${fileKey}`, uploadUrl, expiresAt };
}
