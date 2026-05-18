import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';

import OpenAI from 'openai';

/** OpenAI audio transcription file size limit (bytes). */
export const WHISPER_MAX_FILE_BYTES = 25 * 1024 * 1024;

export class AudioFileTooLargeError extends Error {
  readonly code = 'AUDIO_TOO_LARGE';

  constructor(readonly fileSizeBytes: number) {
    super(`Audio file ${fileSizeBytes} bytes exceeds Whisper limit of ${WHISPER_MAX_FILE_BYTES}`);
    this.name = 'AudioFileTooLargeError';
  }
}

export interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
}

export interface TranscribeAudioFileResult {
  language: string;
  durationSeconds: number;
  segments: TranscriptionSegment[];
  fullText: string;
}

/**
 * Calls Whisper with verbose_json + segment timestamps. Omit `language` for
 * auto-detection; the API returns the detected ISO 639-1 code.
 */
export async function transcribeAudioFile(params: {
  apiKey: string;
  localPath: string;
  language?: string;
}): Promise<TranscribeAudioFileResult> {
  const fileStat = await stat(params.localPath);
  if (fileStat.size > WHISPER_MAX_FILE_BYTES) {
    throw new AudioFileTooLargeError(fileStat.size);
  }

  const client = new OpenAI({ apiKey: params.apiKey });

  const response = await client.audio.transcriptions.create({
    file: createReadStream(params.localPath),
    model: 'whisper-1',
    response_format: 'verbose_json',
    timestamp_granularities: ['segment'],
    ...(params.language ? { language: params.language } : {})
  });

  const language = response.language ?? 'und';
  const durationSeconds = response.duration ?? 0;
  const fullText = response.text?.trim() ?? '';

  const rawSegments = response.segments ?? [];
  const segments: TranscriptionSegment[] = rawSegments.map((seg) => ({
    start: seg.start,
    end: seg.end,
    text: seg.text.trim()
  }));

  return { language, durationSeconds, segments, fullText };
}
