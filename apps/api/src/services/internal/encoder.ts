import type {
  TEncoderFail,
  TEncoderFinalize,
  TEncoderPresignOutputs,
  TEncoderProgress
} from '@cio/utils/validation/assets';

import { finalizeServerHls, getAssetById, setAssetHlsStatus } from '@cio/db/queries/assets';
import { generateUploadPresignedUrl } from '@cio/core/utils/s3';
import { getStorageConfig } from '@cio/core/config/storage';
import { AppError, ErrorCodes } from '@api/utils/errors';

/** The only object types an encoder may write. */
const OUTPUT_CONTENT_TYPES: Record<string, string> = {
  '.m3u8': 'application/vnd.apple.mpegurl',
  '.ts': 'video/mp2t',
  '.m4s': 'video/iso.segment',
  '.mp4': 'video/mp4'
};

function outputContentType(path: string): string {
  const dot = path.lastIndexOf('.');
  const extension = dot === -1 ? '' : path.slice(dot).toLowerCase();
  const contentType = OUTPUT_CONTENT_TYPES[extension];

  if (!contentType) {
    throw new AppError(`Encoder may not write "${extension || path}"`, ErrorCodes.VALIDATION_ERROR, 400);
  }

  return contentType;
}

async function assertEncodableAsset(assetId: string, orgId: string) {
  const asset = await getAssetById(assetId, orgId);
  if (!asset) {
    throw new AppError('Asset not found', ErrorCodes.NOT_FOUND, 404);
  }

  if (asset.hlsManifestKey) {
    throw new AppError('Asset already has an HLS manifest', ErrorCodes.VALIDATION_ERROR, 409);
  }

  return asset;
}

/**
 * Presign the encoder's output objects. Paths are forced under the asset's own
 * prefix and restricted to playlist and segment types, so a compromised encoder
 * can neither write elsewhere in the bucket nor plant another file type.
 */
export async function presignEncoderOutputsService(
  assetId: string,
  orgId: string,
  payload: TEncoderPresignOutputs
): Promise<Record<string, string>> {
  await assertEncodableAsset(assetId, orgId);

  const bucket = getStorageConfig().bucketVideos;
  const entries = await Promise.all(
    payload.paths.map(async (path) => {
      const url = await generateUploadPresignedUrl(`${assetId}/${path}`, bucket, outputContentType(path));

      return [path, url] as const;
    })
  );

  return Object.fromEntries(entries);
}

export async function recordEncoderProgressService(
  assetId: string,
  orgId: string,
  payload: TEncoderProgress
): Promise<void> {
  await assertEncodableAsset(assetId, orgId);
  await setAssetHlsStatus(assetId, orgId, 'converting');

  console.info('HLS encoder progress', { assetId, stage: payload.stage, percent: payload.percent });
}

export async function finalizeEncoderOutputService(
  assetId: string,
  orgId: string,
  payload: TEncoderFinalize
): Promise<void> {
  await assertEncodableAsset(assetId, orgId);
  await setAssetHlsStatus(assetId, orgId, 'converting');

  const finalized = await finalizeServerHls(assetId, orgId, {
    manifestKey: `${assetId}/${payload.manifestPath}`,
    audioKey: payload.audioPath ? `${assetId}/${payload.audioPath}` : null,
    metadata: {
      format: 'hls',
      hlsRenditions: payload.renditions,
      hls1080Status: payload.renditions.includes('p1080') ? 'ready' : 'none',
      sourceWidth: payload.sourceWidth,
      sourceHeight: payload.sourceHeight,
      durationSeconds: payload.durationSeconds,
      videoCodec: 'avc',
      audioCodec: payload.audioPath ? 'aac' : null,
      hlsEncodedBy: 'server'
    }
  });

  if (!finalized) {
    throw new AppError('Asset was no longer converting when finalizing', ErrorCodes.CONFLICT, 409);
  }
}

export async function failEncoderJobService(assetId: string, orgId: string, payload: TEncoderFail): Promise<void> {
  const asset = await getAssetById(assetId, orgId);
  if (!asset) {
    throw new AppError('Asset not found', ErrorCodes.NOT_FOUND, 404);
  }

  await setAssetHlsStatus(assetId, orgId, 'failed');
  console.error('HLS encoder reported failure', { assetId, reason: payload.reason });
}
