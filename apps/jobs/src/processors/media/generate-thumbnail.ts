import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';

import { getJobStep, updateAsset, updateMediaJob, upsertJobStep } from '@cio/db/queries';
import { ZGenerateThumbnailPayload, type TGenerateThumbnailPayload } from '@cio/jobs/payloads/media';

import {
  downloadObjectToTempFile,
  mediaBucket,
  safeUnlink,
  uploadBufferToBucket,
  videosBucket
} from '../../utils/storage';
import { errorMessage, throwIfCancelRequested } from '../../utils/cancel';
import { getStorageConfig } from '../../config/storage';
import { ffmpegRun } from '../../utils/ffmpeg';
import { log } from '../../utils/logger';

const STEP_KEY = 'generate-thumbnail';
const DOMAIN = 'media';

interface ThumbnailResult {
  bucket: string;
  key: string;
  publicUrl: string | null;
}

async function extractThumbnail(localPath: string, atSeconds: number, outputPath: string): Promise<void> {
  await ffmpegRun([
    '-y',
    '-ss',
    String(atSeconds),
    '-i',
    localPath,
    '-vframes',
    '1',
    '-vf',
    'scale=640:-1',
    outputPath
  ]);
}

/**
 * Render a single JPEG frame to use as the asset thumbnail. Replaces the
 * browser-side thumbnail as the source of truth on the asset row.
 */
export async function processGenerateThumbnail(rawData: unknown): Promise<ThumbnailResult> {
  const payload: TGenerateThumbnailPayload = ZGenerateThumbnailPayload.parse(rawData);
  const { mediaJobId, assetId, storageKey, actorContext, atSeconds = 1.0 } = payload;

  const existing = await getJobStep(DOMAIN, mediaJobId, STEP_KEY);
  if (existing?.status === 'completed' && existing.result) {
    log.info('generate-thumbnail-skip', { mediaJobId, reason: 'ledger-completed' });
    return existing.result as unknown as ThumbnailResult;
  }

  await throwIfCancelRequested(mediaJobId);
  await updateMediaJob(mediaJobId, { stage: 'thumbnailing', progressPercent: 35 });
  await upsertJobStep({
    domain: DOMAIN,
    runId: mediaJobId,
    stepKey: STEP_KEY,
    status: 'running',
    startedAt: new Date().toISOString(),
    attempt: (existing?.attempt ?? 0) + 1
  });

  let localPath: string | undefined;
  let outputPath: string | undefined;
  try {
    localPath = await downloadObjectToTempFile(videosBucket(), storageKey, 'thumb-source.bin');

    const dir = path.join(tmpdir(), 'cio-jobs', 'thumbs');
    await mkdir(dir, { recursive: true });
    outputPath = path.join(dir, `${mediaJobId}.jpg`);

    await throwIfCancelRequested(mediaJobId);
    await extractThumbnail(localPath, atSeconds, outputPath);

    const buffer = await readFile(outputPath);
    const thumbKey = `thumbnails/${assetId}/${Date.now()}.jpg`;

    await uploadBufferToBucket(mediaBucket(), thumbKey, buffer, 'image/jpeg', 'public, max-age=31536000');

    const baseUrl = getStorageConfig().mediaPublicBaseUrl;
    const publicUrl = baseUrl ? `${baseUrl.replace(/\/$/, '')}/${thumbKey}` : null;

    const result: ThumbnailResult = { bucket: mediaBucket(), key: thumbKey, publicUrl };

    await updateAsset(assetId, actorContext.organizationId, {
      thumbnailUrl: publicUrl ?? undefined
    });

    await upsertJobStep({
      domain: DOMAIN,
      runId: mediaJobId,
      stepKey: STEP_KEY,
      status: 'completed',
      finishedAt: new Date().toISOString(),
      result: result as unknown as Record<string, unknown>
    });

    await updateMediaJob(mediaJobId, { stage: 'thumbnailed', progressPercent: 60 });

    log.info('generate-thumbnail-done', { mediaJobId, thumbKey });
    return result;
  } catch (error) {
    log.error('generate-thumbnail-failed', { mediaJobId, error: errorMessage(error) });
    await upsertJobStep({
      domain: DOMAIN,
      runId: mediaJobId,
      stepKey: STEP_KEY,
      status: 'failed',
      finishedAt: new Date().toISOString(),
      error: { code: 'THUMBNAIL_FAILED', message: errorMessage(error) }
    });
    throw error;
  } finally {
    await safeUnlink(localPath);
    await safeUnlink(outputPath);
  }
}
