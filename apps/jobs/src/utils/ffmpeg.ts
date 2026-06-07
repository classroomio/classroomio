import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import { log } from './logger';

const execFileAsync = promisify(execFile);

/**
 * Resolved at module load. Set `FFMPEG_PATH` / `FFPROBE_PATH` to point at
 * non-default binary locations (e.g. when ffmpeg lives outside PATH for the
 * worker process). When unset we fall through to `ffmpeg` / `ffprobe` on
 * PATH, which is what most installs provide.
 */
export const FFMPEG_BIN = process.env.FFMPEG_PATH ?? 'ffmpeg';
export const FFPROBE_BIN = process.env.FFPROBE_PATH ?? 'ffprobe';

/** Cap subprocess stdout/stderr so a runaway log can't blow up the worker. */
const MAX_OUTPUT_BYTES = 16 * 1024 * 1024;

export interface FfprobeStream {
  codec_type?: 'video' | 'audio' | 'subtitle' | 'data';
  codec_name?: string;
  width?: number;
  height?: number;
  duration?: string;
}

export interface FfprobeFormat {
  duration?: string;
  size?: string;
  bit_rate?: string;
}

export interface FfprobeData {
  streams: FfprobeStream[];
  format: FfprobeFormat;
}

/**
 * Run `ffprobe -print_format json -show_format -show_streams <file>` and
 * return the parsed JSON. Mirrors the shape we used to get from
 * `fluent-ffmpeg.ffprobe()` but without the deprecated wrapper.
 */
export async function ffprobeJson(localPath: string): Promise<FfprobeData> {
  const args = ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', localPath];
  const { stdout } = await execFileAsync(FFPROBE_BIN, args, { maxBuffer: MAX_OUTPUT_BYTES });
  return JSON.parse(stdout) as FfprobeData;
}

/**
 * Spawn ffmpeg with the supplied argv. Captures stderr and surfaces a useful
 * tail in the error message when ffmpeg exits non-zero, since ffmpeg writes
 * progress and diagnostics to stderr by default.
 */
export async function ffmpegRun(args: string[]): Promise<void> {
  try {
    await execFileAsync(FFMPEG_BIN, args, { maxBuffer: MAX_OUTPUT_BYTES });
  } catch (error) {
    const stderr = (error as { stderr?: string | Buffer })?.stderr?.toString('utf8') ?? '';
    const tail = stderr.split('\n').filter(Boolean).slice(-5).join(' | ');
    throw new Error(`ffmpeg exited with error${tail ? `: ${tail}` : ''}`, { cause: error as Error });
  }
}

/**
 * Compute the mean luminance (`YAVG`) of an image or single video frame using
 * ffmpeg's `signalstats` filter. Returned on the original 0-255 scale; a fully
 * black frame is ~0, fully white ~255. Throws if ffmpeg fails or the value is
 * not present in stderr.
 */
export async function ffmpegProbeLuma(filePath: string): Promise<number> {
  const args = ['-hide_banner', '-nostats', '-i', filePath, '-vf', 'signalstats', '-f', 'null', '-'];
  let stderr = '';
  try {
    const result = await execFileAsync(FFMPEG_BIN, args, { maxBuffer: MAX_OUTPUT_BYTES });
    const raw = result.stderr as string | Buffer | undefined;
    stderr = typeof raw === 'string' ? raw : (raw?.toString('utf8') ?? '');
  } catch (error) {
    const raw = (error as { stderr?: string | Buffer })?.stderr;
    stderr = typeof raw === 'string' ? raw : (raw?.toString('utf8') ?? '');
    if (!stderr) {
      throw error as Error;
    }
  }

  const match = stderr.match(/YAVG:([0-9]+(?:\.[0-9]+)?)/);
  if (!match) {
    throw new Error('ffmpegProbeLuma: signalstats YAVG not found in ffmpeg output');
  }

  return Number.parseFloat(match[1]);
}

/**
 * Probe for the binaries at worker startup. Logs a warning when missing so
 * media jobs surface a clearer failure than a raw ENOENT from the first
 * spawn. Non-media workers (emails, maintenance) keep booting either way.
 */
export async function warnIfFfmpegMissing(): Promise<void> {
  const checks = await Promise.all([isExecutable(FFMPEG_BIN), isExecutable(FFPROBE_BIN)]);

  const missing: string[] = [];
  if (!checks[0]) missing.push(FFMPEG_BIN);
  if (!checks[1]) missing.push(FFPROBE_BIN);

  if (missing.length === 0) {
    log.info('ffmpeg-binaries-resolved', { ffmpeg: FFMPEG_BIN, ffprobe: FFPROBE_BIN });
    return;
  }

  log.warn('ffmpeg-binaries-missing', {
    missing,
    hint: 'Install ffmpeg (macOS: brew install ffmpeg, Debian/Ubuntu: apt install ffmpeg) or set FFMPEG_PATH / FFPROBE_PATH. Media jobs will fail until this is resolved; other workers are unaffected.'
  });
}

async function isExecutable(bin: string): Promise<boolean> {
  try {
    await execFileAsync(bin, ['-version'], { maxBuffer: MAX_OUTPUT_BYTES });
    return true;
  } catch {
    return false;
  }
}
