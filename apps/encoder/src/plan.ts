export const HLS_SEGMENT_SECONDS = 4;
/** Above 30fps the bitrate needed for the same perceived quality roughly doubles, and lecture content does not benefit. */
export const MAX_OUTPUT_FPS = 30;

export interface Rung {
  name: string;
  /**
   * Sizes the *short* side, so `p720` means 720 across the narrow dimension in
   * either orientation. Selecting on the long side would give a portrait source
   * a rung whose label and bitrate ceiling describe a much larger frame than it
   * actually produces.
   */
  height: number;
  /** Ceiling, not a target — paired with CRF so quiet footage costs less. */
  maxrateKbps: number;
  crf: number;
}

/**
 * Matches the rungs the browser encoder defines in `hls-encoder.ts`, so a video
 * encoded here and one encoded in the dashboard are comparable.
 */
export const ALL_RUNGS: Rung[] = [
  { name: 'p360', height: 360, maxrateKbps: 800, crf: 23 },
  { name: 'p720', height: 720, maxrateKbps: 2500, crf: 22 },
  { name: 'p1080', height: 1080, maxrateKbps: 5000, crf: 21 }
];

export interface SourceInfo {
  width: number;
  height: number;
  fps: number;
  durationSeconds: number;
  hasAudio: boolean;
}

/**
 * Every rung the source can fill, never upscaling.
 *
 * Unlike the browser, this does not drop to a single rung for large files. That
 * shortcut exists because WebCodecs runs synchronously while the user waits;
 * here the work is asynchronous on a disposable machine, so a large upload is
 * exactly the case that most needs more than one rung.
 */
export function selectRungs(source: SourceInfo): Rung[] {
  const shortSide = shortSideOf(source);

  return ALL_RUNGS.filter((rung) => rung.height <= shortSide);
}

function shortSideOf(source: SourceInfo): number {
  if (source.width <= 0) return source.height;

  return Math.min(source.width, source.height);
}

function isPortrait(source: SourceInfo): boolean {
  return source.width > 0 && source.height > source.width;
}

/**
 * The frame a rung actually produces. ffmpeg is given `-2` for the long side so
 * it preserves the aspect ratio and rounds to an even number; this mirrors that
 * arithmetic for the master playlist's RESOLUTION.
 */
export function outputDimensions(rung: Rung, source: SourceInfo): { width: number; height: number } {
  if (isPortrait(source)) {
    return { width: rung.height, height: evenScaled(rung.height, source.height, source.width) };
  }

  return { width: evenScaled(rung.height, source.width, source.height), height: rung.height };
}

function evenScaled(target: number, numerator: number, denominator: number): number {
  if (denominator <= 0) return target;

  const scaled = Math.round((numerator * target) / denominator);

  return scaled % 2 === 0 ? scaled : scaled + 1;
}

/** The ffmpeg scale expression for a rung, sizing whichever side is shorter. */
export function scaleExpressionFor(rung: Rung, source: SourceInfo): string {
  return isPortrait(source) ? `${rung.height}:-2` : `-2:${rung.height}`;
}

export function outputFps(source: SourceInfo): number {
  return source.fps > 0 ? Math.min(source.fps, MAX_OUTPUT_FPS) : MAX_OUTPUT_FPS;
}

/** Keyframe interval must line up with segment length or segments cannot start on one. */
export function gopSize(source: SourceInfo): number {
  return Math.max(1, Math.round(outputFps(source) * HLS_SEGMENT_SECONDS));
}

/**
 * One invocation: the decoded video is split N ways and each branch scaled and
 * encoded, so the source is decoded once regardless of how many rungs there are.
 * Audio is encoded once and shared by every rung through `agroup`.
 */
export function buildFfmpegArgs(input: {
  inputPath: string;
  outputDir: string;
  rungs: Rung[];
  source: SourceInfo;
}): string[] {
  const { inputPath, outputDir, rungs, source } = input;
  const fps = outputFps(source);
  const gop = gopSize(source);

  const labels = rungs.map((_, index) => `v${index}`);
  const splitOutputs = labels.map((label) => `[${label}src]`).join('');
  const filters = [
    `[0:v]split=${rungs.length}${splitOutputs}`,
    ...rungs.map(
      (rung, index) =>
        `[${labels[index]}src]scale=${scaleExpressionFor(rung, source)}:flags=lanczos,fps=${fps}[${labels[index]}out]`
    )
  ].join(';');

  const args = ['-nostdin', '-hide_banner', '-y', '-i', inputPath, '-filter_complex', filters];

  rungs.forEach((rung, index) => {
    args.push(
      '-map',
      `[${labels[index]}out]`,
      `-c:v:${index}`,
      'libx264',
      `-preset:v:${index}`,
      // VOD is encoded once and served many times, so spend the CPU here rather
      // than the bandwidth on every view. `veryfast` is a live-streaming preset.
      'slow',
      `-crf:v:${index}`,
      String(rung.crf),
      `-maxrate:v:${index}`,
      `${rung.maxrateKbps}k`,
      `-bufsize:v:${index}`,
      `${rung.maxrateKbps * 2}k`
    );
  });

  if (source.hasAudio) {
    args.push('-map', '0:a:0', '-c:a', 'aac', '-b:a', '128k', '-ac', '2');
  }

  args.push(
    '-pix_fmt',
    'yuv420p',
    '-profile:v',
    'high',
    '-g',
    String(gop),
    '-keyint_min',
    String(gop),
    '-sc_threshold',
    '0',
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
    `${outputDir}/%v/seg-%05d.ts`,
    '-var_stream_map',
    buildVarStreamMap(rungs, source.hasAudio),
    `${outputDir}/%v/playlist.m3u8`
  );

  return args;
}

export function buildVarStreamMap(rungs: Rung[], hasAudio: boolean): string {
  const video = rungs.map((rung, index) =>
    hasAudio ? `v:${index},agroup:aud,name:${rung.name}` : `v:${index},name:${rung.name}`
  );

  return hasAudio ? [...video, 'a:0,agroup:aud,name:audio,default:yes'].join(' ') : video.join(' ');
}

/**
 * The master playlist is written here rather than by ffmpeg.
 *
 * ffmpeg's own master needs repairing — it emits an audio-only variant that has
 * to be stripped — and its BANDWIDTH figures are peak rather than average. Since
 * the rungs and their ceilings are already known, writing it directly produces
 * correct BANDWIDTH, RESOLUTION and CODECS, which players need for capability
 * selection.
 */
export function buildMasterPlaylist(input: { rungs: Rung[]; source: SourceInfo }): string {
  const { rungs, source } = input;
  const lines = ['#EXTM3U', '#EXT-X-VERSION:6'];

  if (source.hasAudio) {
    lines.push(
      '#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="aud",NAME="Audio",DEFAULT=YES,AUTOSELECT=YES,URI="audio/playlist.m3u8"'
    );
  }

  const audioBitrate = source.hasAudio ? 128 : 0;

  for (const rung of rungs) {
    const { width, height } = outputDimensions(rung, source);
    const bandwidth = (rung.maxrateKbps + audioBitrate) * 1000;
    const average = Math.round(bandwidth * 0.85);
    const codecs = source.hasAudio ? 'avc1.640028,mp4a.40.2' : 'avc1.640028';
    const audioAttribute = source.hasAudio ? ',AUDIO="aud"' : '';

    lines.push(
      `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},AVERAGE-BANDWIDTH=${average},RESOLUTION=${width}x${height},CODECS="${codecs}"${audioAttribute}`,
      `${rung.name}/playlist.m3u8`
    );
  }

  return `${lines.join('\n')}\n`;
}

/** Landscape width for a rung height. Kept for callers that only need the width. */
export function evenWidthFor(height: number, source: SourceInfo): number {
  return outputDimensions({ name: '', height, maxrateKbps: 0, crf: 0 }, source).width;
}
