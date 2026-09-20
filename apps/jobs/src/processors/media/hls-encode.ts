import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';

import {
  claimAssetForHlsEncode,
  finalizeServerHls,
  getJobStep,
  setAssetHlsStatus,
  updateMediaJob,
  upsertJobStep
} from '@cio/db/queries';
import { ZHlsEncodePayload, type THlsEncodePayload } from '@cio/jobs/payloads/media';

import { downloadObjectToTempFile, safeUnlink, uploadHlsDirectory, videosBucket } from '../../utils/storage';
import { errorMessage, throwIfCancelRequested } from '../../utils/cancel';
import { env } from '../../config/env';
import { ffmpegRunWithProgress, ffprobeJson, ffprobeKeyframeTimes } from '../../utils/ffmpeg';
import { log } from '../../utils/logger';
import {
  buildHlsArgs,
  decideHlsPlan,
  readSourceInfo,
  remuxBlocker,
  stripAudioOnlyVariants,
  transcodeTimeoutMs,
  validateMasterPlaylist
} from './hls-encode-plan';

const STEP_KEY = 'hls-encode';
const DOMAIN = 'media';

const DEFAULT_MAX_SOURCE_MB = 800;
const DEFAULT_MAX_DURATION_MIN = 120;

export interface HlsEncodeResult {
  status: 'ready' | 'skipped';
  reason?: string;
  mode?: 'remux' | 'transcode';
  rung?: string;
  fileCount?: number;
}

function positiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export async function processHlsEncode(rawData: unknown): Promise<HlsEncodeResult> {
  const payload: THlsEncodePayload = ZHlsEncodePayload.parse(rawData);
  const { mediaJobId, assetId, storageKey, actorContext } = payload;
  const orgId = actorContext.organizationId;

  const existing = await getJobStep(DOMAIN, mediaJobId, STEP_KEY);
  if (existing?.status === 'completed' && existing.result) {
    log.info('hls-encode-skip', { mediaJobId, reason: 'ledger-completed' });
    return existing.result as unknown as HlsEncodeResult;
  }

  await throwIfCancelRequested(mediaJobId);
  await updateMediaJob(mediaJobId, { status: 'running', stage: 'hls-claiming', progressPercent: 2 });

  const asset = await claimAssetForHlsEncode(assetId, orgId);
  if (!asset) {
    log.info('hls-encode-skip', { mediaJobId, assetId, reason: 'not-claimable' });
    await updateMediaJob(mediaJobId, { status: 'completed', stage: 'hls-skipped', progressPercent: 100 });
    return { status: 'skipped', reason: 'asset is already converted or being converted' };
  }

  await upsertJobStep({
    domain: DOMAIN,
    runId: mediaJobId,
    stepKey: STEP_KEY,
    status: 'running',
    startedAt: new Date().toISOString(),
    attempt: (existing?.attempt ?? 0) + 1
  });

  const maxSourceBytes = positiveInt(env.HLS_ENCODE_MAX_SOURCE_MB, DEFAULT_MAX_SOURCE_MB) * 1024 * 1024;
  const maxDurationSeconds = positiveInt(env.HLS_ENCODE_MAX_DURATION_MIN, DEFAULT_MAX_DURATION_MIN) * 60;

  const skip = async (reason: string): Promise<HlsEncodeResult> => {
    log.info('hls-encode-skipped', { mediaJobId, assetId, reason });
    const result: HlsEncodeResult = { status: 'skipped', reason };
    await setAssetHlsStatus(assetId, orgId, 'skipped');
    await upsertJobStep({
      domain: DOMAIN,
      runId: mediaJobId,
      stepKey: STEP_KEY,
      status: 'completed',
      finishedAt: new Date().toISOString(),
      result: result as unknown as Record<string, unknown>
    });
    await updateMediaJob(mediaJobId, { status: 'completed', stage: 'hls-skipped', progressPercent: 100 });
    return result;
  };

  let sourcePath: string | undefined;
  const workDir = path.join(tmpdir(), 'cio-jobs', 'hls', `${assetId}_${Date.now()}`);

  try {
    if (asset.byteSize && asset.byteSize > maxSourceBytes) {
      return await skip(
        `source is ${Math.round(asset.byteSize / 1024 / 1024)} MB, limit is ${maxSourceBytes / 1024 / 1024} MB`
      );
    }

    await updateMediaJob(mediaJobId, { stage: 'hls-downloading', progressPercent: 5 });
    sourcePath = await downloadObjectToTempFile(videosBucket(), storageKey, 'hls-source.bin');

    const sourceStat = await stat(sourcePath);
    if (sourceStat.size > maxSourceBytes) {
      return await skip(
        `source is ${Math.round(sourceStat.size / 1024 / 1024)} MB, limit is ${maxSourceBytes / 1024 / 1024} MB`
      );
    }

    await throwIfCancelRequested(mediaJobId);
    await updateMediaJob(mediaJobId, { stage: 'hls-probing', progressPercent: 10 });

    const info = readSourceInfo(await ffprobeJson(sourcePath));
    if (!info) throw new Error('Source has no readable video stream');
    if (info.durationSeconds > maxDurationSeconds) {
      return await skip(
        `duration ${Math.round(info.durationSeconds / 60)} min is over the ${maxDurationSeconds / 60} min limit`
      );
    }

    const keyframeTimes = remuxBlocker(info) === null ? await ffprobeKeyframeTimes(sourcePath) : [];
    const plan = decideHlsPlan(info, keyframeTimes);
    const hasAudio = info.audioCodec !== null;
    log.info('hls-encode-plan', { mediaJobId, assetId, ...plan, durationSeconds: info.durationSeconds });

    const outDir = path.join(workDir, 'out');
    await mkdir(path.join(outDir, plan.rung), { recursive: true });
    if (hasAudio) await mkdir(path.join(outDir, 'audio'), { recursive: true });

    await throwIfCancelRequested(mediaJobId);
    await updateMediaJob(mediaJobId, { stage: 'hls-encoding', progressPercent: 15 });

    await ffmpegRunWithProgress(buildHlsArgs({ inputPath: sourcePath, outDir, plan, hasAudio }), {
      timeoutMs: transcodeTimeoutMs(info.durationSeconds),
      onProgress: (outSeconds) => {
        const ratio = info.durationSeconds > 0 ? Math.min(1, outSeconds / info.durationSeconds) : 0;
        void updateMediaJob(mediaJobId, { stage: 'hls-encoding', progressPercent: Math.round(15 + ratio * 65) });
        void setAssetHlsStatus(assetId, orgId, 'converting');
      }
    });

    const masterPath = path.join(outDir, 'master.m3u8');
    const master = stripAudioOnlyVariants(await readFile(masterPath, 'utf8'));
    const masterProblem = validateMasterPlaylist(master);
    if (masterProblem) throw new Error(`Invalid master playlist: ${masterProblem}`);
    await writeFile(masterPath, master);
    await stat(path.join(outDir, plan.rung, 'playlist.m3u8'));
    if (hasAudio) await stat(path.join(outDir, 'audio', 'playlist.m3u8'));

    await throwIfCancelRequested(mediaJobId);
    await updateMediaJob(mediaJobId, { stage: 'hls-uploading', progressPercent: 82 });
    const files = await uploadHlsDirectory(videosBucket(), outDir, assetId);

    const finalized = await finalizeServerHls(assetId, orgId, {
      manifestKey: `${assetId}/master.m3u8`,
      audioKey: hasAudio ? `${assetId}/audio/playlist.m3u8` : null,
      metadata: {
        format: 'hls',
        hlsRenditions: [plan.rung],
        hls1080Status: 'none',
        sourceWidth: info.width,
        sourceHeight: info.height,
        videoCodec: 'avc',
        audioCodec: hasAudio ? 'aac' : null,
        hlsEncodedBy: 'server',
        hlsMode: plan.mode
      }
    });
    if (!finalized) throw new Error('Asset was no longer in the converting state when finalizing');

    const result: HlsEncodeResult = { status: 'ready', mode: plan.mode, rung: plan.rung, fileCount: files.length };
    await upsertJobStep({
      domain: DOMAIN,
      runId: mediaJobId,
      stepKey: STEP_KEY,
      status: 'completed',
      finishedAt: new Date().toISOString(),
      result: result as unknown as Record<string, unknown>
    });
    await updateMediaJob(mediaJobId, { status: 'completed', stage: 'hls-ready', progressPercent: 100 });

    log.info('hls-encode-done', { mediaJobId, assetId, mode: plan.mode, rung: plan.rung, fileCount: files.length });
    return result;
  } catch (error) {
    log.error('hls-encode-failed', { mediaJobId, assetId, error: errorMessage(error) });
    await setAssetHlsStatus(assetId, orgId, 'failed').catch(() => undefined);
    await upsertJobStep({
      domain: DOMAIN,
      runId: mediaJobId,
      stepKey: STEP_KEY,
      status: 'failed',
      finishedAt: new Date().toISOString(),
      error: { code: 'HLS_ENCODE_FAILED', message: errorMessage(error) }
    });
    throw error;
  } finally {
    await safeUnlink(sourcePath);
    await rm(workDir, { recursive: true, force: true }).catch(() => undefined);
  }
}
