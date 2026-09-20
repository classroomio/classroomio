import type { FfprobeData } from '../../utils/ffmpeg';

export const HLS_SEGMENT_SECONDS = 4;
export const MAX_KEYFRAME_GAP_SECONDS = 10;
export const MAX_TRANSCODE_HEIGHT = 720;
const MIN_TIMEOUT_MS = 10 * 60 * 1000;

export interface HlsSourceInfo {
  width: number;
  height: number;
  durationSeconds: number;
  videoCodec: string;
  audioCodec: string | null;
  pixFmt: string | null;
  rotated: boolean;
}

export type HlsMode = 'remux' | 'transcode';

export interface HlsPlan {
  mode: HlsMode;
  reason: string;
  rung: string;
  outputHeight: number;
}

export function readSourceInfo(probe: FfprobeData): HlsSourceInfo | null {
  const video = probe.streams.find((stream) => stream.codec_type === 'video');
  if (!video?.width || !video.height) return null;

  const audio = probe.streams.find((stream) => stream.codec_type === 'audio');
  const rotation = video.side_data_list?.find((item) => typeof item.rotation === 'number')?.rotation;
  const rotateTag = Number.parseInt(video.tags?.rotate ?? '0', 10) || 0;
  const durationSeconds = Number.parseFloat(probe.format.duration ?? video.duration ?? '0') || 0;

  return {
    width: video.width,
    height: video.height,
    durationSeconds,
    videoCodec: video.codec_name ?? 'unknown',
    audioCodec: audio ? (audio.codec_name ?? 'unknown') : null,
    pixFmt: video.pix_fmt ?? null,
    rotated: Boolean(rotation) || rotateTag !== 0
  };
}

export function maxKeyframeGap(keyframeTimes: number[], durationSeconds: number): number {
  if (keyframeTimes.length === 0) return Number.POSITIVE_INFINITY;

  let maxGap = keyframeTimes[0];
  for (let i = 1; i < keyframeTimes.length; i++) {
    maxGap = Math.max(maxGap, keyframeTimes[i] - keyframeTimes[i - 1]);
  }
  return Math.max(maxGap, durationSeconds - keyframeTimes[keyframeTimes.length - 1]);
}

function evenHeight(value: number): number {
  return value - (value % 2);
}

export function remuxBlocker(info: HlsSourceInfo): string | null {
  if (info.videoCodec !== 'h264') return `video codec ${info.videoCodec} is not h264`;
  if (info.pixFmt !== 'yuv420p') return `pixel format ${info.pixFmt ?? 'unknown'} is not yuv420p`;
  if (info.audioCodec !== null && info.audioCodec !== 'aac') return `audio codec ${info.audioCodec} is not aac`;
  if (info.rotated) return 'video has rotation metadata';
  return null;
}

export function decideHlsPlan(info: HlsSourceInfo, keyframeTimes: number[]): HlsPlan {
  const transcodeHeight = evenHeight(Math.min(info.height, MAX_TRANSCODE_HEIGHT));
  const transcode = (reason: string): HlsPlan => ({
    mode: 'transcode',
    reason,
    rung: `p${transcodeHeight}`,
    outputHeight: transcodeHeight
  });

  const blocker = remuxBlocker(info);
  if (blocker) return transcode(blocker);

  const gap = maxKeyframeGap(keyframeTimes, info.durationSeconds);
  if (gap > MAX_KEYFRAME_GAP_SECONDS)
    return transcode(`keyframe gap ${Number.isFinite(gap) ? gap.toFixed(1) : 'unknown'}s is too long`);

  const rung = info.height <= MAX_TRANSCODE_HEIGHT ? `p${info.height}` : 'source';
  return { mode: 'remux', reason: 'h264/aac with regular keyframes', rung, outputHeight: info.height };
}

export function transcodeTimeoutMs(durationSeconds: number): number {
  return Math.max(MIN_TIMEOUT_MS, Math.ceil(durationSeconds * 3 * 1000));
}

export interface BuildHlsArgsInput {
  inputPath: string;
  outDir: string;
  plan: HlsPlan;
  hasAudio: boolean;
}

export function buildHlsArgs({ inputPath, outDir: rawOutDir, plan, hasAudio }: BuildHlsArgsInput): string[] {
  const outDir = rawOutDir.replaceAll('\\', '/');
  const args = ['-y', '-i', inputPath, '-map', '0:v:0'];
  if (hasAudio) args.push('-map', '0:a:0');

  if (plan.mode === 'remux') {
    args.push('-c:v', 'copy');
    if (hasAudio) args.push('-c:a', 'copy');
  } else {
    args.push(
      '-vf',
      `scale=-2:${plan.outputHeight}`,
      '-c:v',
      'libx264',
      '-preset',
      'veryfast',
      '-crf',
      '23',
      '-maxrate',
      '2500k',
      '-bufsize',
      '5000k',
      '-pix_fmt',
      'yuv420p',
      '-profile:v',
      'high',
      '-sc_threshold',
      '0',
      '-force_key_frames',
      `expr:gte(t,n_forced*${HLS_SEGMENT_SECONDS})`
    );
    if (hasAudio) args.push('-c:a', 'aac', '-b:a', '128k', '-ac', '2');
  }

  const variantMap = hasAudio
    ? `v:0,agroup:audio,name:${plan.rung} a:0,agroup:audio,name:audio`
    : `v:0,name:${plan.rung}`;

  args.push(
    '-f',
    'hls',
    '-hls_time',
    String(HLS_SEGMENT_SECONDS),
    '-hls_playlist_type',
    'vod',
    '-hls_segment_type',
    'mpegts',
    '-hls_flags',
    'independent_segments',
    '-start_number',
    '1',
    '-hls_segment_filename',
    `${outDir}/%v/seg-%05d.ts`,
    '-master_pl_name',
    'master.m3u8',
    '-var_stream_map',
    variantMap,
    `${outDir}/%v/playlist.m3u8`
  );

  return args;
}

export function stripAudioOnlyVariants(master: string): string {
  const lines = master.split('\n');
  const kept: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('#EXT-X-STREAM-INF') && !line.includes('RESOLUTION=')) {
      i += 1;
      if (lines[i + 1]?.trim() === '') i += 1;
      continue;
    }
    kept.push(line);
  }

  return `${kept.join('\n').trimEnd()}\n`;
}

export function validateMasterPlaylist(text: string): string | null {
  if (!text.startsWith('#EXTM3U')) return 'master playlist does not start with #EXTM3U';

  const streamLines = text.split('\n').filter((line) => line.startsWith('#EXT-X-STREAM-INF'));
  if (streamLines.length === 0) return 'master playlist has no #EXT-X-STREAM-INF entry';
  if (streamLines.some((line) => !line.includes('RESOLUTION='))) return 'a stream entry has no RESOLUTION';
  if (streamLines.some((line) => !line.includes('BANDWIDTH='))) return 'a stream entry has no BANDWIDTH';

  return null;
}
