import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';

import type { SourceInfo } from './plan.js';

const execFileAsync = promisify(execFile);
const MAX_OUTPUT_BYTES = 16 * 1024 * 1024;
/** ffprobe reads untrusted media, so it gets a hard ceiling of its own. */
const PROBE_TIMEOUT_MS = 120_000;

const FFMPEG = process.env.FFMPEG_PATH ?? 'ffmpeg';
const FFPROBE = process.env.FFPROBE_PATH ?? 'ffprobe';

interface ProbeStream {
  codec_type?: string;
  width?: number;
  height?: number;
  avg_frame_rate?: string;
  r_frame_rate?: string;
}

/** `"30000/1001"` is how ffprobe reports fractional rates. */
function parseFrameRate(value: string | undefined): number {
  if (!value) return 0;

  const [numerator, denominator] = value.split('/');
  const top = Number.parseFloat(numerator ?? '0');
  const bottom = Number.parseFloat(denominator ?? '1');

  if (!Number.isFinite(top) || !Number.isFinite(bottom) || bottom === 0) return 0;

  return top / bottom;
}

export async function probeSource(inputPath: string): Promise<SourceInfo> {
  const { stdout } = await execFileAsync(
    FFPROBE,
    ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', inputPath],
    { maxBuffer: MAX_OUTPUT_BYTES, timeout: PROBE_TIMEOUT_MS }
  );

  const probe = JSON.parse(stdout) as { streams?: ProbeStream[]; format?: { duration?: string } };
  const video = probe.streams?.find((stream) => stream.codec_type === 'video');

  if (!video?.width || !video.height) {
    throw new Error('Source has no readable video stream');
  }

  return {
    width: video.width,
    height: video.height,
    fps: parseFrameRate(video.avg_frame_rate) || parseFrameRate(video.r_frame_rate),
    durationSeconds: Number.parseFloat(probe.format?.duration ?? '0') || 0,
    hasAudio: Boolean(probe.streams?.some((stream) => stream.codec_type === 'audio'))
  };
}

export interface RunOptions {
  timeoutMs: number;
  onProgress?: (outSeconds: number) => void;
}

/**
 * Runs ffmpeg, reporting progress from `-progress pipe:1`. stderr is kept only
 * as a tail: ffmpeg is verbose, and a failure is explained by its last few lines.
 */
export function runFfmpeg(args: string[], options: RunOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(FFMPEG, ['-progress', 'pipe:1', '-nostats', ...args], {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stderrTail = '';
    let timedOut = false;
    let lastReportedAt = 0;
    let pending = '';

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, options.timeoutMs);

    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (chunk: string) => {
      // `-progress` emits whole `key=value` lines; buffer partial ones.
      pending += chunk;
      const lines = pending.split('\n');
      pending = lines.pop() ?? '';

      for (const line of lines) {
        const match = /^out_time_us=(\d+)$/.exec(line.trim());
        if (!match || !options.onProgress) continue;

        const now = Date.now();
        if (now - lastReportedAt < 10_000) continue;

        lastReportedAt = now;
        options.onProgress(Number(match[1]) / 1_000_000);
      }
    });

    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (chunk: string) => {
      stderrTail = (stderrTail + chunk).slice(-4000);
    });

    child.on('error', (error: NodeJS.ErrnoException) => {
      clearTimeout(timer);
      reject(
        error.code === 'ENOENT'
          ? new Error(`ffmpeg not found at "${FFMPEG}". Set FFMPEG_PATH or install it in the image.`)
          : error
      );
    });

    child.on('close', (code) => {
      clearTimeout(timer);

      if (timedOut) {
        reject(new Error(`ffmpeg timed out after ${Math.round(options.timeoutMs / 1000)}s`));
        return;
      }

      if (code === 0) {
        resolve();
        return;
      }

      const tail = stderrTail.split('\n').filter(Boolean).slice(-5).join(' | ');
      reject(new Error(`ffmpeg exited with ${code}: ${tail}`));
    });
  });
}

/** Three times realtime, floored at ten minutes: `slow` on a short clip is still dominated by startup. */
export function encodeTimeoutMs(durationSeconds: number): number {
  return Math.max(10 * 60 * 1000, Math.ceil(durationSeconds * 3 * 1000));
}
