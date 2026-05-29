import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';

import { getAssetById, getJobStep, updateAsset, updateMediaJob, upsertJobStep } from '@cio/db/queries';
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
import { ffmpegProbeLuma, ffmpegRun } from '../../utils/ffmpeg';
import { log } from '../../utils/logger';

const STEP_KEY = 'generate-thumbnail';
const DOMAIN = 'media';
/** Frames whose mean luma (0-255) sits below this threshold are treated as blank/black. */
const BLACK_LUMA_THRESHOLD = 8;
/** Slot order used for ranking; middle is preferred, then start, then end. */
const SLOT_ORDER = ['middle', 'start', 'end'] as const;
type Slot = (typeof SLOT_ORDER)[number];
/** Fallback time offsets (seconds) tried when a slot's primary frame is black. */
const FALLBACK_OFFSETS = [0, -1.5, 1.5];
const DEFAULT_DURATION_SECONDS = 10;

interface CandidateUpload {
  slot: Slot;
  url: string;
  meanLuma: number;
  isBlack: boolean;
}

interface ThumbnailResult {
  bucket: string;
  candidates: Array<{ slot: Slot; url: string }>;
  publicUrl: string | null;
}

function clampToDuration(t: number, duration: number): number {
  const upper = Math.max(0, duration - 0.1);
  if (upper <= 0) return 0;
  return Math.min(Math.max(t, 0), upper);
}

function targetForSlot(slot: Slot, duration: number): number {
  if (slot === 'start') return duration * 0.3;
  if (slot === 'middle') return duration * 0.5;
  return duration * 0.7;
}

/**
 * Use accurate seek (`-ss` after `-i`). Fast input-seek snaps to the nearest
 * keyframe and is the most common source of black thumbnails for codecs whose
 * first keyframe sits past the requested offset.
 */
async function extractFrame(localPath: string, atSeconds: number, outputPath: string): Promise<void> {
  await ffmpegRun([
    '-y',
    '-i',
    localPath,
    '-ss',
    String(atSeconds),
    '-vframes',
    '1',
    '-vf',
    'scale=640:-1',
    outputPath
  ]);
}

async function captureSlot(
  localPath: string,
  slot: Slot,
  baseSeconds: number,
  duration: number,
  outputPath: string
): Promise<{ buffer: Buffer; meanLuma: number; atSeconds: number } | null> {
  for (const delta of FALLBACK_OFFSETS) {
    const t = clampToDuration(baseSeconds + delta, duration);
    try {
      await extractFrame(localPath, t, outputPath);
      const luma = await ffmpegProbeLuma(outputPath);
      if (luma >= BLACK_LUMA_THRESHOLD) {
        const buffer = await readFile(outputPath);
        return { buffer, meanLuma: luma, atSeconds: t };
      }
      log.warn('generate-thumbnail-black-frame', { slot, atSeconds: t, luma });
    } catch (error) {
      log.warn('generate-thumbnail-slot-attempt-failed', {
        slot,
        atSeconds: t,
        error: errorMessage(error)
      });
    }
  }

  // Every fallback was black or failed — keep the last frame so the user can
  // still see what we produced, but flag it so the picker can warn.
  try {
    const buffer = await readFile(outputPath);
    const luma = await ffmpegProbeLuma(outputPath).catch(() => 0);
    return { buffer, meanLuma: luma, atSeconds: baseSeconds };
  } catch {
    return null;
  }
}

/**
 * Render up to three JPEG candidate thumbnails (start / middle / end) and
 * persist them on the asset. The chosen `thumbnailUrl` is the first non-black
 * candidate in middle → start → end order. The browser-side preview is no
 * longer the source of truth.
 */
export async function processGenerateThumbnail(rawData: unknown): Promise<ThumbnailResult> {
  const payload: TGenerateThumbnailPayload = ZGenerateThumbnailPayload.parse(rawData);
  const { mediaJobId, assetId, storageKey, actorContext, markJobCompleteOnSuccess } = payload;

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

  const asset = await getAssetById(assetId, actorContext.organizationId);
  const duration =
    asset?.durationSeconds && asset.durationSeconds > 0 ? asset.durationSeconds : DEFAULT_DURATION_SECONDS;

  let localPath: string | undefined;
  const slotOutputs: string[] = [];
  try {
    localPath = await downloadObjectToTempFile(videosBucket(), storageKey, 'thumb-source.bin');

    const dir = path.join(tmpdir(), 'cio-jobs', 'thumbs');
    await mkdir(dir, { recursive: true });

    const uploads: CandidateUpload[] = [];
    for (const slot of SLOT_ORDER) {
      await throwIfCancelRequested(mediaJobId);
      const outputPath = path.join(dir, `${mediaJobId}-${slot}.jpg`);
      slotOutputs.push(outputPath);

      const baseSeconds = targetForSlot(slot, duration);
      const capture = await captureSlot(localPath, slot, baseSeconds, duration, outputPath);
      if (!capture) continue;

      const key = `thumbnails/${assetId}/${slot}-${Date.now()}.jpg`;
      await uploadBufferToBucket(mediaBucket(), key, capture.buffer, 'image/jpeg', 'public, max-age=31536000');

      const baseUrl = getStorageConfig().mediaPublicBaseUrl;
      const url = baseUrl ? `${baseUrl.replace(/\/$/, '')}/${key}` : key;
      uploads.push({
        slot,
        url,
        meanLuma: capture.meanLuma,
        isBlack: capture.meanLuma < BLACK_LUMA_THRESHOLD
      });
    }

    const candidateUrls = uploads.map((u) => u.url);
    const chosen = uploads.find((u) => !u.isBlack) ?? null;
    const publicUrl = chosen?.url ?? null;

    const result: ThumbnailResult = {
      bucket: mediaBucket(),
      candidates: uploads.map((u) => ({ slot: u.slot, url: u.url })),
      publicUrl
    };

    await updateAsset(assetId, actorContext.organizationId, {
      thumbnailUrl: publicUrl,
      thumbnailCandidates: candidateUrls
    });

    await upsertJobStep({
      domain: DOMAIN,
      runId: mediaJobId,
      stepKey: STEP_KEY,
      status: 'completed',
      finishedAt: new Date().toISOString(),
      result: result as unknown as Record<string, unknown>
    });

    await updateMediaJob(mediaJobId, {
      stage: 'thumbnailed',
      progressPercent: markJobCompleteOnSuccess ? 100 : 60,
      ...(markJobCompleteOnSuccess ? { status: 'completed' as const } : {})
    });

    log.info('generate-thumbnail-done', {
      mediaJobId,
      candidateCount: uploads.length,
      hasNonBlackChoice: Boolean(chosen)
    });
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
    for (const out of slotOutputs) {
      await safeUnlink(out);
    }
  }
}
