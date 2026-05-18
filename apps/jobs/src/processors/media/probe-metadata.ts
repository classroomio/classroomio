import { stat } from 'node:fs/promises';

import { getJobStep, updateAsset, updateMediaJob, upsertJobStep } from '@cio/db/queries';
import { ZProbeMetadataPayload, type TProbeMetadataPayload } from '@cio/jobs/payloads/media';

import { downloadObjectToTempFile, safeUnlink, videosBucket } from '../../utils/storage';
import { errorMessage, throwIfCancelRequested } from '../../utils/cancel';
import { ffprobeJson, type FfprobeData } from '../../utils/ffmpeg';
import { log } from '../../utils/logger';

const STEP_KEY = 'probe-metadata';
const DOMAIN = 'media';

interface ProbeResult {
  durationSeconds: number;
  width?: number;
  height?: number;
  videoCodec?: string;
  audioCodec?: string;
  hasAudio: boolean;
  fileSizeBytes: number;
}

function parseProbe(metadata: FfprobeData, fileSizeBytes: number): ProbeResult {
  const videoStream = metadata.streams.find((stream) => stream.codec_type === 'video');
  const audioStream = metadata.streams.find((stream) => stream.codec_type === 'audio');

  const duration = Number(metadata.format.duration ?? videoStream?.duration ?? 0);

  return {
    durationSeconds: Number.isFinite(duration) ? Math.max(0, Math.round(duration)) : 0,
    width: videoStream?.width,
    height: videoStream?.height,
    videoCodec: videoStream?.codec_name,
    audioCodec: audioStream?.codec_name,
    hasAudio: Boolean(audioStream),
    fileSizeBytes
  };
}

/**
 * Probe authoritative metadata (duration, codecs, dimensions) using ffprobe.
 * Replaces the browser-derived duration on the asset row.
 */
export async function processProbeMetadata(rawData: unknown): Promise<ProbeResult> {
  const payload: TProbeMetadataPayload = ZProbeMetadataPayload.parse(rawData);
  const { mediaJobId, assetId, storageKey, actorContext } = payload;

  const existing = await getJobStep(DOMAIN, mediaJobId, STEP_KEY);
  if (existing?.status === 'completed' && existing.result) {
    log.info('probe-metadata-skip', { mediaJobId, reason: 'ledger-completed' });
    return existing.result as unknown as ProbeResult;
  }

  await throwIfCancelRequested(mediaJobId);
  await updateMediaJob(mediaJobId, { status: 'running', stage: 'probing', progressPercent: 5 });
  await upsertJobStep({
    domain: DOMAIN,
    runId: mediaJobId,
    stepKey: STEP_KEY,
    status: 'running',
    startedAt: new Date().toISOString(),
    attempt: (existing?.attempt ?? 0) + 1
  });

  let localPath: string | undefined;
  try {
    localPath = await downloadObjectToTempFile(videosBucket(), storageKey, 'source.bin');
    const fileStat = await stat(localPath);

    await throwIfCancelRequested(mediaJobId);
    const probe = await ffprobeJson(localPath);
    const result = parseProbe(probe, fileStat.size);

    await updateAsset(assetId, actorContext.organizationId, {
      durationSeconds: result.durationSeconds,
      aspectRatio: result.width && result.height ? `${result.width}:${result.height}` : null,
      metadata: {
        probe: {
          durationSeconds: result.durationSeconds,
          width: result.width,
          height: result.height,
          videoCodec: result.videoCodec,
          audioCodec: result.audioCodec,
          hasAudio: result.hasAudio,
          fileSizeBytes: result.fileSizeBytes,
          probedAt: new Date().toISOString()
        }
      }
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
      stage: 'probed',
      progressPercent: 25
    });

    log.info('probe-metadata-done', { mediaJobId, durationSeconds: result.durationSeconds });
    return result;
  } catch (error) {
    log.error('probe-metadata-failed', { mediaJobId, error: errorMessage(error) });
    await upsertJobStep({
      domain: DOMAIN,
      runId: mediaJobId,
      stepKey: STEP_KEY,
      status: 'failed',
      finishedAt: new Date().toISOString(),
      error: { code: 'PROBE_FAILED', message: errorMessage(error) }
    });
    throw error;
  } finally {
    await safeUnlink(localPath);
  }
}
