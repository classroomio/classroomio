import { execFile, spawn } from 'node:child_process';
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
  pix_fmt?: string;
  profile?: string;
  r_frame_rate?: string;
  avg_frame_rate?: string;
  tags?: { rotate?: string };
  side_data_list?: Array<{ rotation?: number }>;
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
  try {
    const { stdout } = await execFileAsync(FFPROBE_BIN, args, { maxBuffer: MAX_OUTPUT_BYTES });
    return JSON.parse(stdout) as FfprobeData;
  } catch (error) {
    const err = error as Error & { code?: string };
    if (err.code === 'ENOENT') {
      throw new Error(
        `ffprobe binary not found at "${FFPROBE_BIN}". Ensure ffprobe is installed and available on PATH or set FFPROBE_PATH.`,
        { cause: err }
      );
    }
    throw error;
  }
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
    const err = error as Error & { stderr?: string | Buffer; code?: string };
    if (err.code === 'ENOENT') {
      throw new Error(
        `ffmpeg binary not found at "${FFMPEG_BIN}". Ensure ffmpeg is installed and available on PATH or set FFMPEG_PATH.`,
        { cause: err }
      );
    }

    const stderr = typeof err.stderr === 'string' ? err.stderr : (err.stderr?.toString('utf8') ?? '');
    const tail = stderr.split('\n').filter(Boolean).slice(-5).join(' | ');
    const detail = tail || err.message || String(error);
    throw new Error(`ffmpeg exited with error: ${detail}`, { cause: err });
  }
}

export async function ffprobeKeyframeTimes(localPath: string): Promise<number[]> {
  const args = [
    '-v',
    'error',
    '-select_streams',
    'v:0',
    '-skip_frame',
    'nokey',
    '-show_entries',
    'frame=pts_time',
    '-of',
    'csv=p=0',
    localPath
  ];
  const { stdout } = await execFileAsync(FFPROBE_BIN, args, { maxBuffer: MAX_OUTPUT_BYTES });

  return stdout
    .split('\n')
    .map((line) => Number.parseFloat(line.trim()))
    .filter((value) => Number.isFinite(value));
}

export interface FfmpegProgressOptions {
  timeoutMs: number;
  onProgress?: (outSeconds: number) => void;
}

export function ffmpegRunWithProgress(args: string[], options: FfmpegProgressOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      FFMPEG_BIN,
      ['-nostdin', '-hide_banner', '-loglevel', 'error', '-nostats', '-progress', 'pipe:1', ...args],
      {
        stdio: ['ignore', 'pipe', 'pipe']
      }
    );

    let stderrTail = '';
    let timedOut = false;
    let lastReport = 0;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, options.timeoutMs);

    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (chunk: string) => {
      const match = chunk
        .match(/out_time_us=(\d+)/g)
        ?.pop()
        ?.match(/(\d+)/);
      if (!match || !options.onProgress) return;

      const now = Date.now();
      if (now - lastReport < 2000) return;

      lastReport = now;
      options.onProgress(Number(match[1]) / 1_000_000);
    });

    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (chunk: string) => {
      stderrTail = (stderrTail + chunk).slice(-4000);
    });

    child.on('error', (error: Error & { code?: string }) => {
      clearTimeout(timer);
      if (error.code === 'ENOENT') {
        reject(
          new Error(
            `ffmpeg binary not found at "${FFMPEG_BIN}". Ensure ffmpeg is installed and available on PATH or set FFMPEG_PATH.`,
            { cause: error }
          )
        );
        return;
      }
      reject(error);
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
      reject(new Error(`ffmpeg exited with code ${code}: ${tail}`));
    });
  });
}

/**
 * Compute the mean luminance (`YAVG`) of an image or single video frame using
 * ffmpeg's `signalstats` filter. Returned on the original 0-255 scale; a fully
 * black frame is ~0, fully white ~255. Throws if ffmpeg fails or the value is
 * not present in the output.
 */
export async function ffmpegProbeLuma(filePath: string): Promise<number> {
  const args = [
    '-hide_banner',
    '-nostats',
    '-i',
    filePath,
    '-vf',
    'signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=-',
    '-f',
    'null',
    '-'
  ];
  let output = '';
  try {
    const result = await execFileAsync(FFMPEG_BIN, args, { maxBuffer: MAX_OUTPUT_BYTES });
    output = `${result.stdout}\n${result.stderr}`;
  } catch (error) {
    const err = error as Error & { stdout?: string | Buffer; stderr?: string | Buffer; code?: string };
    if (err.code === 'ENOENT') {
      throw new Error(
        `ffmpeg binary not found at "${FFMPEG_BIN}". Ensure ffmpeg is installed and available on PATH or set FFMPEG_PATH.`,
        { cause: err }
      );
    }

    output = `${err.stdout?.toString('utf8') ?? ''}\n${err.stderr?.toString('utf8') ?? ''}`;
    if (!output.trim()) {
      throw error as Error;
    }
  }

  const yavg = parseSignalstatsYavg(output);
  if (yavg === null) {
    throw new Error('ffmpegProbeLuma: signalstats YAVG not found in ffmpeg output');
  }

  return yavg;
}

export function parseSignalstatsYavg(output: string): number | null {
  const match = output.match(/lavfi\.signalstats\.YAVG=([0-9]+(?:\.[0-9]+)?)/);
  return match ? Number.parseFloat(match[1]) : null;
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

    if (process.env.HLS_SERVER_ENCODE_ENABLED === 'true') {
      const encoders = await execFileAsync(FFMPEG_BIN, ['-hide_banner', '-encoders'], {
        maxBuffer: MAX_OUTPUT_BYTES
      }).catch(() => null);
      if (encoders && !encoders.stdout.includes('libx264')) {
        log.warn('ffmpeg-libx264-missing', { hint: 'HLS_SERVER_ENCODE_ENABLED needs an ffmpeg build with libx264.' });
      }
    }
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
