import { mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';

import { getJobStep, updateMediaJob, upsertJobStep } from '@cio/db/queries';
import { ZExtractAudioPayload, type TExtractAudioPayload } from '@cio/jobs/payloads/media';

import {
  downloadObjectToTempFile,
  mediaBucket,
  safeUnlink,
  uploadFileToBucket,
  videosBucket
} from '../../utils/storage';
import { errorMessage, throwIfCancelRequested } from '../../utils/cancel';
import { ffmpegRun } from '../../utils/ffmpeg';
import { log } from '../../utils/logger';

const STEP_KEY = 'extract-audio';
const DOMAIN = 'media';

interface ExtractAudioResult {
  bucket: string;
  key: string;
  fileSizeBytes: number;
}

function transcodeToMp3(inputPath: string, outputPath: string): Promise<void> {
  return ffmpegRun([
    '-y',
    '-i',
    inputPath,
    '-vn',
    '-acodec',
    'libmp3lame',
    '-b:a',
    '32k',
    '-ac',
    '1',
    '-ar',
    '16000',
    '-f',
    'mp3',
    outputPath
  ]);
}

/**
 * Download an HLS media playlist and its segment objects from the videos
 * bucket into a temp directory so ffmpeg can demux the audio track.
 */
async function downloadHlsPlaylistToTempFile(
  bucket: string,
  playlistKey: string
): Promise<{ inputPath: string; tempDir: string }> {
  const downloadedPlaylist = await downloadObjectToTempFile(bucket, playlistKey, 'playlist.m3u8');
  const rawPlaylist = await readFile(downloadedPlaylist, 'utf-8');
  await safeUnlink(downloadedPlaylist);

  const tempDir = path.join(tmpdir(), 'cio-jobs', 'hls-audio', `${Date.now()}_${process.pid}`);
  await mkdir(tempDir, { recursive: true });

  const playlistPrefix = path.posix.dirname(playlistKey);
  const localLines: string[] = [];

  for (const line of rawPlaylist.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      localLines.push(line);
      continue;
    }

    const segmentKey = trimmed.includes('/') ? trimmed : `${playlistPrefix}/${trimmed}`;
    const localSegmentPath = path.join(tempDir, path.basename(trimmed));
    const downloadedSegment = await downloadObjectToTempFile(bucket, segmentKey, path.basename(trimmed));
    await rename(downloadedSegment, localSegmentPath);
    localLines.push(path.basename(trimmed));
  }

  const inputPath = path.join(tempDir, 'playlist.m3u8');
  await writeFile(inputPath, localLines.join('\n'));

  return { inputPath, tempDir };
}

async function resolveAudioSourcePath(
  bucket: string,
  storageKey: string
): Promise<{ inputPath: string; tempDir?: string }> {
  if (storageKey.endsWith('.m3u8')) {
    return downloadHlsPlaylistToTempFile(bucket, storageKey);
  }

  return {
    inputPath: await downloadObjectToTempFile(bucket, storageKey, 'audio-source.bin')
  };
}

/**
 * Extract a 16 kHz mono MP3 (32 kbps) from the source video for Whisper (25 MB
 * API limit). The transcribe step reads the object from the media bucket.
 */
export async function processExtractAudio(rawData: unknown): Promise<ExtractAudioResult> {
  const payload: TExtractAudioPayload = ZExtractAudioPayload.parse(rawData);
  const { mediaJobId, assetId, storageKey } = payload;

  const existing = await getJobStep(DOMAIN, mediaJobId, STEP_KEY);
  if (existing?.status === 'completed' && existing.result) {
    log.info('extract-audio-skip', { mediaJobId, reason: 'ledger-completed' });
    return existing.result as unknown as ExtractAudioResult;
  }

  await throwIfCancelRequested(mediaJobId);
  await updateMediaJob(mediaJobId, { stage: 'extracting-audio', progressPercent: 70 });
  await upsertJobStep({
    domain: DOMAIN,
    runId: mediaJobId,
    stepKey: STEP_KEY,
    status: 'running',
    startedAt: new Date().toISOString(),
    attempt: (existing?.attempt ?? 0) + 1
  });

  let inputPath: string | undefined;
  let inputTempDir: string | undefined;
  let outputPath: string | undefined;
  try {
    const source = await resolveAudioSourcePath(videosBucket(), storageKey);
    inputPath = source.inputPath;
    inputTempDir = source.tempDir;

    const dir = path.join(tmpdir(), 'cio-jobs', 'audio');
    await mkdir(dir, { recursive: true });
    outputPath = path.join(dir, `${mediaJobId}.mp3`);

    await throwIfCancelRequested(mediaJobId);
    await transcodeToMp3(inputPath, outputPath);

    const audioKey = `audio/${assetId}/${mediaJobId}.mp3`;
    await uploadFileToBucket(mediaBucket(), audioKey, outputPath, 'audio/mpeg', 'private, max-age=0');

    const fileStat = await stat(outputPath);
    const result: ExtractAudioResult = { bucket: mediaBucket(), key: audioKey, fileSizeBytes: fileStat.size };

    await upsertJobStep({
      domain: DOMAIN,
      runId: mediaJobId,
      stepKey: STEP_KEY,
      status: 'completed',
      finishedAt: new Date().toISOString(),
      result: result as unknown as Record<string, unknown>
    });

    await updateMediaJob(mediaJobId, { stage: 'audio-ready', progressPercent: 80 });
    log.info('extract-audio-done', { mediaJobId, audioKey });
    return result;
  } catch (error) {
    log.error('extract-audio-failed', { mediaJobId, error: errorMessage(error) });
    await upsertJobStep({
      domain: DOMAIN,
      runId: mediaJobId,
      stepKey: STEP_KEY,
      status: 'failed',
      finishedAt: new Date().toISOString(),
      error: { code: 'EXTRACT_AUDIO_FAILED', message: errorMessage(error) }
    });
    throw error;
  } finally {
    if (inputTempDir) {
      await rm(inputTempDir, { recursive: true, force: true }).catch(() => undefined);
    } else {
      await safeUnlink(inputPath);
    }
    await safeUnlink(outputPath);
  }
}
