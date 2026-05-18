import { stat } from 'node:fs/promises';

import { getJobStep, getMediaJobById, updateMediaJob, upsertJobStep, upsertMediaTranscript } from '@cio/db/queries';
import { ZTranscribeAudioPayload, type TTranscribeAudioPayload } from '@cio/jobs/payloads/media';

import { env } from '../../config/env';
import {
  AudioFileTooLargeError,
  WHISPER_MAX_FILE_BYTES,
  transcribeAudioFile,
  type TranscriptionSegment
} from '../../services/transcription/openai';
import { segmentsToWebVtt } from '../../services/transcription/vtt';
import { downloadObjectToTempFile, mediaBucket, safeUnlink, uploadBufferToBucket } from '../../utils/storage';
import { errorMessage, throwIfCancelRequested } from '../../utils/cancel';
import { log } from '../../utils/logger';

const STEP_KEY = 'transcribe-audio';
const DOMAIN = 'media';
const EXTRACT_STEP_KEY = 'extract-audio';

interface TranscribeResult {
  provider: 'openai' | 'assemblyai' | 'deepgram' | 'skipped';
  text: string;
  language?: string;
  durationSeconds?: number;
  costCents?: number;
}

function transcriptionCostCents(durationSeconds: number): number {
  return Math.ceil((durationSeconds / 60) * 0.6);
}

async function mergeJobWarnings(mediaJobId: string, extra: string[]): Promise<void> {
  const job = await getMediaJobById(mediaJobId);
  const prior = job?.warnings ?? [];

  await updateMediaJob(mediaJobId, { warnings: [...prior, ...extra] });
}

/**
 * OpenAI Whisper (`whisper-1`) with verbose segment timestamps; persists VTT +
 * `media_transcript` row. Skips cleanly when `OPENAI_API_KEY` is unset or when
 * extracted audio exceeds the 25 MB API limit.
 */
export async function processTranscribeAudio(rawData: unknown): Promise<TranscribeResult> {
  const payload: TTranscribeAudioPayload = ZTranscribeAudioPayload.parse(rawData);
  const { mediaJobId, assetId, actorContext } = payload;

  const existing = await getJobStep(DOMAIN, mediaJobId, STEP_KEY);
  if (existing?.status === 'completed' && existing.result) {
    log.info('transcribe-audio-skip', { mediaJobId, reason: 'ledger-completed' });
    return existing.result as unknown as TranscribeResult;
  }

  await throwIfCancelRequested(mediaJobId);
  await updateMediaJob(mediaJobId, { stage: 'transcribing', progressPercent: 90 });
  await upsertJobStep({
    domain: DOMAIN,
    runId: mediaJobId,
    stepKey: STEP_KEY,
    status: 'running',
    startedAt: new Date().toISOString(),
    attempt: (existing?.attempt ?? 0) + 1
  });

  try {
    if (!env.OPENAI_API_KEY) {
      const result: TranscribeResult = { provider: 'skipped', text: '' };
      await upsertJobStep({
        domain: DOMAIN,
        runId: mediaJobId,
        stepKey: STEP_KEY,
        status: 'completed',
        finishedAt: new Date().toISOString(),
        result: result as unknown as Record<string, unknown>
      });
      await mergeJobWarnings(mediaJobId, ['transcription-skipped-no-openai-key']);
      await updateMediaJob(mediaJobId, {
        status: 'completed',
        stage: 'done',
        progressPercent: 100
      });
      log.info('transcribe-audio-skipped', { mediaJobId, reason: 'no-openai-key' });
      return result;
    }

    const extractStep = await getJobStep(DOMAIN, mediaJobId, EXTRACT_STEP_KEY);
    const extractResult = extractStep?.result as { bucket?: string; key?: string; fileSizeBytes?: number } | null;

    if (!extractResult?.bucket || !extractResult?.key) {
      const message = 'extract-audio step missing or incomplete';
      log.error('transcribe-audio-failed', { mediaJobId, error: message });
      await upsertJobStep({
        domain: DOMAIN,
        runId: mediaJobId,
        stepKey: STEP_KEY,
        status: 'failed',
        finishedAt: new Date().toISOString(),
        error: { code: 'EXTRACT_AUDIO_MISSING', message }
      });
      throw new Error(message);
    }

    let localPath: string | undefined;
    try {
      localPath = await downloadObjectToTempFile(extractResult.bucket, extractResult.key, 'whisper-input.mp3');
      const localStat = await stat(localPath);

      if (localStat.size > WHISPER_MAX_FILE_BYTES) {
        await upsertJobStep({
          domain: DOMAIN,
          runId: mediaJobId,
          stepKey: STEP_KEY,
          status: 'failed',
          finishedAt: new Date().toISOString(),
          error: {
            code: 'AUDIO_TOO_LARGE',
            message: `Audio ${localStat.size} bytes exceeds ${WHISPER_MAX_FILE_BYTES}`
          }
        });
        await mergeJobWarnings(mediaJobId, ['transcription-skipped-audio-too-large']);
        await updateMediaJob(mediaJobId, {
          status: 'completed',
          stage: 'done',
          progressPercent: 100
        });
        log.warn('transcribe-audio-skipped-audio-too-large', { mediaJobId, fileSizeBytes: localStat.size });
        return { provider: 'skipped', text: '' };
      }

      await throwIfCancelRequested(mediaJobId);

      const whisper = await transcribeAudioFile({
        apiKey: env.OPENAI_API_KEY,
        localPath
      });

      const normalizedSegments: TranscriptionSegment[] = whisper.segments.map((segment) => ({
        start: segment.start,
        end: segment.end,
        text: segment.text
      }));

      const vttBody = segmentsToWebVtt(normalizedSegments);

      const vttKey = `transcripts/${assetId}/${mediaJobId}.vtt`;
      const bucket = mediaBucket();

      await uploadBufferToBucket(
        bucket,
        vttKey,
        Buffer.from(vttBody, 'utf8'),
        'text/vtt; charset=utf-8',
        'private, max-age=0'
      );

      const transcriptCost = transcriptionCostCents(whisper.durationSeconds);
      const jobRow = await getMediaJobById(mediaJobId);
      const priorCost = jobRow?.costCents ?? 0;

      await upsertMediaTranscript({
        organizationId: actorContext.organizationId,
        assetId,
        mediaJobId,
        language: whisper.language,
        provider: 'openai',
        model: 'whisper-1',
        text:
          whisper.fullText ||
          normalizedSegments
            .map((segment) => segment.text)
            .join(' ')
            .trim(),
        segments: normalizedSegments,
        vttStorageKey: vttKey,
        vttBucket: bucket,
        durationSeconds: Math.round(whisper.durationSeconds),
        costCents: transcriptCost
      });

      const result: TranscribeResult = {
        provider: 'openai',
        text: whisper.fullText,
        language: whisper.language,
        durationSeconds: whisper.durationSeconds,
        costCents: transcriptCost
      };

      await upsertJobStep({
        domain: DOMAIN,
        runId: mediaJobId,
        stepKey: STEP_KEY,
        status: 'completed',
        finishedAt: new Date().toISOString(),
        result: {
          language: whisper.language,
          segmentCount: normalizedSegments.length,
          vttKey,
          costCents: transcriptCost
        } as Record<string, unknown>,
        providerId: null
      });

      await updateMediaJob(mediaJobId, {
        status: 'completed',
        stage: 'done',
        progressPercent: 100,
        costCents: priorCost + transcriptCost
      });

      log.info('transcribe-audio-done', {
        mediaJobId,
        language: whisper.language,
        segmentCount: normalizedSegments.length
      });
      return result;
    } catch (error) {
      if (error instanceof AudioFileTooLargeError) {
        await upsertJobStep({
          domain: DOMAIN,
          runId: mediaJobId,
          stepKey: STEP_KEY,
          status: 'failed',
          finishedAt: new Date().toISOString(),
          error: { code: 'AUDIO_TOO_LARGE', message: error.message }
        });
        await mergeJobWarnings(mediaJobId, ['transcription-skipped-audio-too-large']);
        await updateMediaJob(mediaJobId, {
          status: 'completed',
          stage: 'done',
          progressPercent: 100
        });
        log.warn('transcribe-audio-skipped-audio-too-large', { mediaJobId, fileSizeBytes: error.fileSizeBytes });
        return { provider: 'skipped', text: '' };
      }

      throw error;
    } finally {
      await safeUnlink(localPath);
    }
  } catch (error) {
    log.error('transcribe-audio-failed', { mediaJobId, error: errorMessage(error) });
    await upsertJobStep({
      domain: DOMAIN,
      runId: mediaJobId,
      stepKey: STEP_KEY,
      status: 'failed',
      finishedAt: new Date().toISOString(),
      error: { code: 'TRANSCRIBE_FAILED', message: errorMessage(error) }
    });
    throw error;
  }
}
