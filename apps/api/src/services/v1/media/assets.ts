import type { TPublicApiAssetUploadResponse, TPublicApiCreateAsset } from '@cio/utils/validation/public-api';

import { createHlsAssetPlaceholder } from '@cio/db/queries/assets';
import { getStorageConfig } from '@cio/core/config/storage';
import { generateVideoUploadPresignedUrl } from '@cio/core/utils/s3';
import { MAX_FILE_SIZE } from '@api/constants/upload';
import { assertAutomationActor } from '@api/services/v1/shared';
import { AppError, ErrorCodes } from '@api/utils/errors';

const EXTENSION_BY_MIME_TYPE: Record<TPublicApiCreateAsset['mimeType'], string> = {
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/x-msvideo': 'avi',
  'video/x-matroska': 'mkv'
};

/**
 * Reserves an asset and returns a presigned URL to send its bytes to.
 *
 * The object key is derived from the asset id rather than issued separately, so
 * `assetId` is the only identifier the caller ever holds and ownership is a row
 * lookup instead of a parse. The row is created in `processing` and is promoted
 * when the upload is attached, which is also what lets the media pipeline and
 * the HLS encoder find it — a bare storage key could never be tracked that way.
 */
export async function createPublicApiAssetUploadService(
  orgId: string,
  actorId: string | null,
  payload: TPublicApiCreateAsset
): Promise<TPublicApiAssetUploadResponse> {
  assertAutomationActor(actorId);

  if (payload.byteSize > MAX_FILE_SIZE) {
    throw new AppError(
      `File size exceeds the maximum of ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB`,
      ErrorCodes.VALIDATION_ERROR,
      413
    );
  }

  const asset = await createHlsAssetPlaceholder({
    organizationId: orgId,
    createdByProfileId: actorId,
    title: payload.fileName,
    byteSize: payload.byteSize,
    mimeType: payload.mimeType
  });

  const storageKey = `${asset.id}/source.${EXTENSION_BY_MIME_TYPE[payload.mimeType]}`;
  const uploadUrl = await generateVideoUploadPresignedUrl(storageKey, payload.mimeType);
  const expiresAt = new Date(Date.now() + getStorageConfig().presignUploadExpiresSeconds * 1000).toISOString();

  return { assetId: asset.id, uploadUrl, expiresAt };
}
