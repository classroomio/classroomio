import axios from 'axios';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile } from 'fs/promises';
import path from 'path';
import { env } from '@api/config/env';
import type { CaptionOptions, CaptionResult } from './types';

const execAsync = promisify(exec);

/**
 * Extract audio from video file using FFmpeg
 */
export async function extractAudio(videoPath: string, outputPath: string): Promise<void> {
  await execAsync(
    `ffmpeg -i "${videoPath}" -vn -acodec libmp3lame -ar 16000 -ac 1 "${outputPath}" -y`
  );
}

/**
 * Generate captions using Whisper API service
 */
export async function generateCaptionsWithAPI(
  audioFilePath: string,
  options: CaptionOptions = {}
): Promise<CaptionResult> {
  const whisperApiUrl = env.WHISPER_API_URL || 'http://whisper-api:9000';

  // Read audio file
  const audioBuffer = await readFile(audioFilePath);
  const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });

  const formData = new FormData();
  formData.append('audio_file', audioBlob, 'audio.mp3');
  formData.append('task', 'transcribe');
  if (options.language) {
    formData.append('language', options.language);
  }
  formData.append('output', 'json');

  const response = await axios.post(`${whisperApiUrl}/asr`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 300000, // 5 minutes
  });

  const result = response.data;

  if (!result.segments || !Array.isArray(result.segments)) {
    throw new Error('Invalid Whisper API response');
  }

  // Convert to SRT and VTT formats
  const srtContent = convertToSRT(result.segments);
  const vttContent = convertToVTT(result.segments);

  return {
    transcript: result.text || '',
    language: result.language || 'en',
    duration: result.duration || 0,
    srtContent,
    vttContent,
  };
}

/**
 * Convert Whisper segments to SRT format
 */
function convertToSRT(segments: Array<{ start: number; end: number; text: string }>): string {
  return segments
    .map((segment, index) => {
      const start = formatSRTTime(segment.start);
      const end = formatSRTTime(segment.end);
      return `${index + 1}\n${start} --> ${end}\n${segment.text.trim()}\n`;
    })
    .join('\n');
}

/**
 * Convert Whisper segments to VTT format
 */
function convertToVTT(segments: Array<{ start: number; end: number; text: string }>): string {
  const header = 'WEBVTT\n\n';
  const body = segments
    .map((segment) => {
      const start = formatVTTTime(segment.start);
      const end = formatVTTTime(segment.end);
      return `${start} --> ${end}\n${segment.text.trim()}\n`;
    })
    .join('\n\n');
  return header + body;
}

function formatSRTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds % 1) * 1000);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(millis).padStart(3, '0')}`;
}

function formatVTTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds % 1) * 1000);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
}
