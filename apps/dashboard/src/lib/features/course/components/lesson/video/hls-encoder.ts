/**
 * Browser-side HLS encoder driven by Mediabunny.
 *
 * Default upload generates a source-capped 360p/720p ABR ladder. A manual
 * follow-up flow can add a p1080 rendition later without re-encoding the
 * base ladder. All transcoding happens on the user's machine via WebCodecs —
 * we never spend a server CPU-second on encoding, and the source MP4 is
 * never uploaded. The data path is `File → WebCodecs → R2`.
 */

import {
  BlobSource,
  BufferTarget,
  CanvasSink,
  Conversion,
  HlsOutputFormat,
  Input,
  MpegTsOutputFormat,
  Output,
  PathedTarget,
  ALL_FORMATS,
  type ConversionVideoOptions,
  type InputVideoTrack
} from 'mediabunny';

import { classroomio } from '$lib/utils/services/api';

export type HlsEncodeStage = 'probing' | 'encoding' | 'uploading' | 'thumbnail' | 'finalizing' | 'done' | 'failed';

export interface HlsEncodeProgress {
  stage: HlsEncodeStage;
  /** 0–100 overall completion estimate. */
  percent: number;
  /** Total bytes uploaded so far (segments + playlists + audio + thumbs). */
  uploadedBytes: number;
  /** Current rung label for the encoding stage, e.g. "p720". */
  rung?: string;
  /** Files uploaded so far / total files uploaded. */
  uploadedCount: number;
  /** Optional error message when stage === 'failed'. */
  error?: string;
}

export type Hls1080Status = 'none' | 'generating' | 'ready' | 'failed';

export interface HlsEncodeResult {
  assetId: string;
  manifestKey: string;
  thumbnailUrl?: string;
  sourceWidth: number;
  sourceHeight: number;
  hlsRenditions: string[];
  hls1080Status: Hls1080Status;
}

export interface HlsRungConfig {
  name: string;
  width: number;
  height: number;
  videoBitrate: number;
}

export const ALL_HLS_RUNGS: HlsRungConfig[] = [
  { name: 'p360', width: 640, height: 360, videoBitrate: 800_000 },
  { name: 'p720', width: 1280, height: 720, videoBitrate: 2_500_000 },
  { name: 'p1080', width: 1920, height: 1080, videoBitrate: 5_000_000 }
];

export const P1080_RUNG = ALL_HLS_RUNGS.find((rung) => rung.name === 'p1080')!;

const DEFAULT_MAX_RUNG_HEIGHT = 720;
/** Above this size, encode a single ladder rung to avoid doubling encode time on large sources. */
const LARGE_FILE_SINGLE_RUNG_BYTES = 100 * 1024 * 1024;

/** Source-capped rungs up to `maxHeight` — never upscales beyond the source. */
export function selectRungsForSource(
  track: InputVideoTrack,
  maxHeight = DEFAULT_MAX_RUNG_HEIGHT,
  fileSizeBytes?: number
): HlsRungConfig[] {
  const sourceHeight = track.displayHeight ?? 0;
  const eligible = ALL_HLS_RUNGS.filter((rung) => rung.height <= Math.min(maxHeight, sourceHeight));

  if (!eligible.length) return [];

  // Large uploads spend most of the wait in WebCodecs. A single rung (typically
  // 720p) finishes roughly twice as fast as a 360p+720p ladder while still
  // delivering HD playback; smaller files keep the full ABR ladder.
  if (fileSizeBytes != null && fileSizeBytes >= LARGE_FILE_SINGLE_RUNG_BYTES && eligible.length > 1) {
    return [eligible[eligible.length - 1]!];
  }

  return eligible;
}

const AUDIO_BITRATE = 128_000;
const HLS_TARGET_SEGMENT_SECONDS = 4;
/** Cap parallel segment PUTs — unbounded concurrency can overwhelm R2 and fail mid-upload. */
const HLS_UPLOAD_CONCURRENCY = 16;
const HLS_PUT_MAX_ATTEMPTS = 4;
/** Server validation allows up to 2000 paths per presign request. */
const PRESIGN_BATCH_SIZE = 1500;
/** Must match `HLS_CONTENT_TYPES` in `@cio/core` presign signing. */
const HLS_UPLOAD_CONTENT_TYPES: Record<string, string> = {
  '.m3u8': 'application/vnd.apple.mpegurl',
  '.ts': 'video/mp2t',
  '.m4a': 'audio/mp4',
  '.mp4': 'video/mp4'
};
const THUMBNAIL_FRACTIONS = [0.3, 0.5, 0.7];
/** Hard ceiling for a generated thumbnail (matches the server job). */
const THUMBNAIL_MAX_BYTES = 500 * 1024;
/** JPEG quality steps tried (best first) until a frame fits under the size cap. */
const THUMBNAIL_QUALITY_LADDER = [0.9, 0.8, 0.7, 0.6, 0.5];

export interface EncodeAndUploadOptions {
  file: File;
  title?: string;
  rungs?: HlsRungConfig[];
  onProgress?: (progress: HlsEncodeProgress) => void;
  onAssetReserved?: (assetId: string) => void;
  signal?: AbortSignal;
}

export interface EncodeAndUpload1080Options {
  file: File;
  assetId: string;
  onProgress?: (progress: HlsEncodeProgress) => void;
  signal?: AbortSignal;
}

const CLEANUP_MAX_ATTEMPTS = 3;

/** Best-effort cleanup for a reserved `processing` HLS asset after failure or cancel. */
export async function cleanupAbortedHlsUpload(assetId: string, signal?: AbortSignal): Promise<void> {
  for (let attempt = 1; attempt <= CLEANUP_MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await classroomio.organization.assets[':assetId'].hls.$delete({
        param: { assetId },
        signal
      });

      if (response.ok) return;

      if (response.status === 404 || response.status === 409) return;
    } catch (error) {
      if (attempt === CLEANUP_MAX_ATTEMPTS) {
        console.warn('Failed to abort HLS asset after encode error', error);
        return;
      }
    }

    await sleep(Math.min(500 * 2 ** (attempt - 1), 4000));
  }
}

/** Best-effort cleanup for a failed manual p1080 rendition on an active asset. */
export async function cleanupAbortedHls1080Upload(assetId: string, signal?: AbortSignal): Promise<void> {
  for (let attempt = 1; attempt <= CLEANUP_MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await classroomio.organization.assets[':assetId'].hls['1080'].$delete({
        param: { assetId },
        signal
      });

      if (response.ok) return;

      if (response.status === 404 || response.status === 409) return;
    } catch (error) {
      if (attempt === CLEANUP_MAX_ATTEMPTS) {
        console.warn('Failed to abort partial 1080p HLS rendition', error);
        return;
      }
    }

    await sleep(Math.min(500 * 2 ** (attempt - 1), 4000));
  }
}

/**
 * End-to-end: encode the file to HLS, push to R2, finalize the asset.
 * Resolves with the new `assetId` and HLS manifest key.
 */
export async function encodeAndUploadHls(opts: EncodeAndUploadOptions): Promise<HlsEncodeResult> {
  const progress: HlsEncodeProgress = {
    stage: 'probing',
    percent: 0,
    uploadedBytes: 0,
    uploadedCount: 0
  };

  function emit(patch: Partial<HlsEncodeProgress>) {
    Object.assign(progress, patch);
    opts.onProgress?.({ ...progress });
  }

  let reservedAssetId: string | null = null;

  try {
    if (typeof VideoEncoder === 'undefined') {
      throw new HlsEncoderError('webcodecs_unsupported', 'Browser missing WebCodecs encoder support');
    }

    // --- Probe input ---------------------------------------------------
    const input = new Input({ source: new BlobSource(opts.file), formats: ALL_FORMATS });
    const duration = await input.computeDuration();
    const videoTrack = await input.getPrimaryVideoTrack();
    const audioTrack = await input.getPrimaryAudioTrack();
    if (!videoTrack) {
      throw new HlsEncoderError('encode_failed', 'No video track found in source');
    }
    const aspectRatio = computeAspectRatioLabel(videoTrack);
    const sourceWidth = videoTrack.displayWidth ?? 0;
    const sourceHeight = videoTrack.displayHeight ?? 0;
    const rungs = opts.rungs ?? selectRungsForSource(videoTrack, DEFAULT_MAX_RUNG_HEIGHT, opts.file.size);
    if (rungs.length === 0) {
      throw new HlsEncoderError('encode_failed', 'Source resolution is too low for HLS encoding');
    }

    // --- Reserve assetId ----------------------------------------------
    const init = await classroomio.organization.assets.hls.init.$post({
      json: {
        fileName: opts.file.name,
        byteSize: opts.file.size,
        mimeType: opts.file.type || 'application/octet-stream',
        title: opts.title
      }
    });
    const initBody = await init.json();
    if (!('success' in initBody) || !initBody.success) {
      throw new HlsEncoderError('encode_failed', 'Failed to init HLS asset');
    }
    const { assetId } = initBody.data;
    reservedAssetId = assetId;
    opts.onAssetReserved?.(assetId);

    // --- Pre-presign every file Mediabunny will write ------------------
    // Segments are deterministic from rung name + segment index, so we
    // can predict the full path list before encoding starts and ask the
    // server for all presigned URLs in one round-trip. The upload step
    // then becomes a synchronous map lookup — no more one-POST-per-segment.
    emit({ stage: 'encoding', percent: 1 });
    const expectedPaths = predictHlsPaths(rungs, duration, Boolean(audioTrack));
    const presignedUrls = await batchPresignPaths(assetId, expectedPaths);
    const expectedUploadBytes = estimateHlsUploadBytes(rungs, duration, Boolean(audioTrack));

    const uploader = new HlsUploader({
      assetId,
      presignedUrls,
      onUploaded: ({ totalBytes, count }) => {
        const uploadFraction = Math.min(1, totalBytes / expectedUploadBytes);
        const uploadPercent = 73 + Math.round(uploadFraction * 22);
        emit({
          uploadedBytes: totalBytes,
          uploadedCount: count,
          stage: uploadFraction > 0 ? 'uploading' : progress.stage,
          percent: Math.max(progress.percent, uploadPercent)
        });
      },
      signal: opts.signal
    });

    // Map a video playlist → rung folder name. Mediabunny counts the
    // audio playlist as its own entry, so `n` from `HlsOutputPlaylistInfo`
    // doesn't line up 1:1 with our rung array. We assign rung names in
    // the order video playlists arrive (which mirrors the order we passed
    // them into `Conversion.init`'s `video` array). Audio playlists land
    // under `audio/`. The Map keys by track identity so a duplicate
    // callback invocation for the same playlist resolves to the same path.
    const playlistNames = new Map<unknown, string>();
    let videoPlaylistsAssigned = 0;
    function resolvePlaylistFolder(tracks: { isVideoTrack: () => boolean }[]): string {
      const videoTrack = tracks.find((track) => track.isVideoTrack());
      if (!videoTrack) return 'audio';

      const existing = playlistNames.get(videoTrack);
      if (existing) return existing;

      const rung = rungs[videoPlaylistsAssigned];
      videoPlaylistsAssigned += 1;
      const name = rung?.name ?? `v${videoPlaylistsAssigned}`;
      playlistNames.set(videoTrack, name);
      return name;
    }

    const hlsOutput = new Output({
      format: new HlsOutputFormat({
        segmentFormat: new MpegTsOutputFormat(),
        targetDuration: HLS_TARGET_SEGMENT_SECONDS,
        getPlaylistPath: ({ tracks }) => `${resolvePlaylistFolder(tracks)}/playlist.m3u8`,
        // Segment paths are relative to the containing playlist's path.
        // Just the file name puts segments alongside their playlist
        // (e.g. `p720/seg-00001.ts`) rather than nested under a duplicate
        // rung folder.
        getSegmentPath: ({ n }) => `seg-${pad(n, 5)}.ts`
      }),
      target: new PathedTarget('master.m3u8', (request) => uploader.targetFor(request.path, request.mimeType))
    });

    const videoVariants: ConversionVideoOptions[] = rungs.map((rung) => ({
      width: rung.width,
      height: rung.height,
      fit: 'contain',
      bitrate: rung.videoBitrate,
      // Keyframe at least every targetDuration so HLS segment boundaries land on key frames.
      keyFrameInterval: HLS_TARGET_SEGMENT_SECONDS,
      // Prefer the platform's hardware H.264 encoder (VideoToolbox / Media
      // Foundation / VAAPI) — typically several times faster than the
      // browser's software encoder. Falls back to software automatically
      // when no hardware encoder can satisfy the config.
      hardwareAcceleration: 'prefer-hardware'
    }));

    const conversion = await Conversion.init({
      input,
      output: hlsOutput,
      video: videoVariants,
      audio: audioTrack ? { codec: 'aac', bitrate: AUDIO_BITRATE, numberOfChannels: 2 } : { discard: true },
      showWarnings: false
    });

    conversion.onProgress = (fraction) => {
      // Reserve ~70% of the bar for encode; segment uploads continue in parallel.
      const encodePercent = Math.min(72, 2 + Math.round(fraction * 70));
      emit({
        stage: progress.stage === 'uploading' ? 'uploading' : 'encoding',
        percent: Math.max(progress.percent, encodePercent)
      });
    };

    if (!conversion.isValid) {
      throw new HlsEncoderError(
        'encode_failed',
        `Conversion invalid (${conversion.discardedTracks.length} discarded tracks)`
      );
    }

    await conversion.execute();
    emit({ stage: 'uploading', percent: 73 });
    await uploader.flush();

    // Prefer the dedicated HLS audio playlist when present; otherwise fall
    // back to the highest uploaded video rendition (muxed audio is fine for Whisper).
    const audioKey = audioTrack ? resolveTranscriptionAudioKey(assetId, rungs, uploader) : undefined;

    // --- Thumbnails ----------------------------------------------------
    emit({ stage: 'thumbnail', percent: 86 });
    const thumbnailUrls = await extractAndUploadThumbnails({
      videoTrack,
      duration,
      file: opts.file
    });

    // --- Finalize -----------------------------------------------------
    emit({ stage: 'finalizing', percent: 96 });
    const finalize = await classroomio.organization.assets[':assetId'].hls.finalize.$post({
      param: { assetId },
      json: {
        manifestKey: `${assetId}/master.m3u8`,
        audioKey,
        durationSeconds: duration,
        aspectRatio,
        byteSize: progress.uploadedBytes,
        videoCodec: 'avc',
        audioCodec: audioTrack ? 'aac' : undefined,
        sourceWidth,
        sourceHeight,
        hlsRenditions: rungs.map((rung) => rung.name),
        hls1080Status: 'none',
        thumbnailUrl: thumbnailUrls[0],
        thumbnailCandidateUrls: thumbnailUrls,
        title: opts.title
      }
    });
    const finalizeBody = await finalize.json();
    if (!('success' in finalizeBody) || !finalizeBody.success) {
      throw new HlsEncoderError('finalize_failed', 'Server rejected finalize payload');
    }

    emit({ stage: 'done', percent: 100 });
    reservedAssetId = null;
    return {
      assetId,
      manifestKey: `${assetId}/master.m3u8`,
      thumbnailUrl: thumbnailUrls[0],
      sourceWidth,
      sourceHeight,
      hlsRenditions: rungs.map((rung) => rung.name),
      hls1080Status: 'none'
    };
  } catch (error) {
    const code = error instanceof HlsEncoderError ? error.code : 'encode_failed';
    const message = error instanceof Error ? error.message : 'Unknown encoder error';
    emit({ stage: 'failed', error: `${code}: ${message}` });

    // Best-effort cleanup: tell the server to drop the reserved row + any
    // partial R2 objects it managed to write. Swallow errors — the user
    // already sees the original failure, and a stuck `processing` row is
    // recoverable via an admin sweep anyway.
    if (reservedAssetId) {
      await cleanupAbortedHlsUpload(reservedAssetId, opts.signal);
    }

    throw error;
  }
}

/**
 * Generate and upload only the p1080 rendition for an existing HLS asset,
 * patch the master manifest, and finalize rendition metadata server-side.
 */
export async function encodeAndUploadHls1080(opts: EncodeAndUpload1080Options): Promise<{
  hlsRenditions: string[];
  hls1080Status: Hls1080Status;
}> {
  const progress: HlsEncodeProgress = {
    stage: 'probing',
    percent: 0,
    uploadedBytes: 0,
    uploadedCount: 0
  };

  function emit(patch: Partial<HlsEncodeProgress>) {
    Object.assign(progress, patch);
    opts.onProgress?.({ ...progress });
  }

  try {
    if (typeof VideoEncoder === 'undefined') {
      throw new HlsEncoderError('webcodecs_unsupported', 'Browser missing WebCodecs encoder support');
    }

    const input = new Input({ source: new BlobSource(opts.file), formats: ALL_FORMATS });
    const duration = await input.computeDuration();
    const videoTrack = await input.getPrimaryVideoTrack();
    if (!videoTrack) {
      throw new HlsEncoderError('encode_failed', 'No video track found in source');
    }

    const sourceHeight = videoTrack.displayHeight ?? 0;
    if (sourceHeight < 1080) {
      throw new HlsEncoderError('encode_failed', 'Source video does not support 1080p');
    }

    const rungs = [P1080_RUNG];
    emit({ stage: 'encoding', percent: 1, rung: 'p1080' });

    const expectedPaths = predictHlsPaths(rungs, duration, false);
    const presignedUrls = await batchPresign1080Paths(opts.assetId, expectedPaths);

    const capturedFiles = new Map<string, Uint8Array>();
    const uploader = new HlsUploader({
      assetId: opts.assetId,
      presignedUrls,
      presignEndpoint: '1080',
      skipPaths: new Set(['master.m3u8']),
      capturedFiles,
      onUploaded: ({ totalBytes, count }) => {
        emit({ uploadedBytes: totalBytes, uploadedCount: count });
      },
      signal: opts.signal
    });

    const hlsOutput = new Output({
      format: new HlsOutputFormat({
        segmentFormat: new MpegTsOutputFormat(),
        targetDuration: HLS_TARGET_SEGMENT_SECONDS,
        getPlaylistPath: () => 'p1080/playlist.m3u8',
        getSegmentPath: ({ n }) => `seg-${pad(n, 5)}.ts`
      }),
      target: new PathedTarget('master.m3u8', (request) => uploader.targetFor(request.path, request.mimeType))
    });

    const conversion = await Conversion.init({
      input,
      output: hlsOutput,
      video: [
        {
          width: P1080_RUNG.width,
          height: P1080_RUNG.height,
          fit: 'contain',
          bitrate: P1080_RUNG.videoBitrate,
          keyFrameInterval: HLS_TARGET_SEGMENT_SECONDS,
          hardwareAcceleration: 'prefer-hardware'
        }
      ],
      audio: { discard: true },
      showWarnings: false
    });

    conversion.onProgress = (fraction) => {
      emit({ percent: Math.min(72, 2 + Math.round(fraction * 70)), rung: 'p1080' });
    };

    if (!conversion.isValid) {
      throw new HlsEncoderError(
        'encode_failed',
        `Conversion invalid (${conversion.discardedTracks.length} discarded tracks)`
      );
    }

    await conversion.execute();
    await uploader.flush();

    emit({ stage: 'uploading', percent: 78 });
    const generatedMaster = capturedFiles.get('master.m3u8');
    if (!generatedMaster) {
      throw new HlsEncoderError('encode_failed', 'Encoder did not produce a master manifest');
    }

    const existingMaster = await fetchExistingMasterManifest(opts.assetId, opts.signal);
    const mergedMaster = mergeP1080IntoMaster(existingMaster, new TextDecoder().decode(generatedMaster));
    const mergedBytes = new TextEncoder().encode(mergedMaster);
    const uploadedBytesBeforeMaster = progress.uploadedBytes;
    await uploader.uploadSingle('master.m3u8', 'application/vnd.apple.mpegurl', mergedBytes, { force: true });

    emit({ stage: 'finalizing', percent: 96 });
    const finalize = await classroomio.organization.assets[':assetId'].hls['1080'].finalize.$post({
      param: { assetId: opts.assetId },
      json: {
        additionalByteSize: uploadedBytesBeforeMaster,
        sourceWidth: videoTrack.displayWidth ?? undefined,
        sourceHeight: videoTrack.displayHeight ?? undefined
      }
    });
    const finalizeBody = await finalize.json();
    if (!('success' in finalizeBody) || !finalizeBody.success) {
      throw new HlsEncoderError('finalize_failed', 'Server rejected 1080p finalize payload');
    }

    const metadata = finalizeBody.data.metadata as { hlsRenditions?: string[]; hls1080Status?: Hls1080Status } | null;
    emit({ stage: 'done', percent: 100 });

    return {
      hlsRenditions: metadata?.hlsRenditions ?? ['p360', 'p720', 'p1080'],
      hls1080Status: metadata?.hls1080Status ?? 'ready'
    };
  } catch (error) {
    const code = error instanceof HlsEncoderError ? error.code : 'encode_failed';
    const message = error instanceof Error ? error.message : 'Unknown encoder error';
    emit({ stage: 'failed', error: `${code}: ${message}` });

    await cleanupAbortedHls1080Upload(opts.assetId, opts.signal);
    throw error;
  }
}

class HlsEncoderError extends Error {
  constructor(
    public code: 'webcodecs_unsupported' | 'encode_failed' | 'upload_failed' | 'finalize_failed',
    message: string
  ) {
    super(message);
    this.name = 'HlsEncoderError';
  }
}

interface PresignedUrl {
  url: string;
  key: string;
}

/**
 * Predict every path Mediabunny will write so we can presign them all in
 * a single request before encoding starts. Segment counts come from
 * duration / target-duration with a small safety margin — over-presigning
 * is free (unused presigned URLs simply expire) while under-presigning
 * forces a fallback per-file presign at upload time.
 *
 * When the source has audio, Mediabunny's HLS output emits a separate
 * `audio/` playlist + its own segments alongside the video rungs (the
 * master playlist groups them via `#EXT-X-MEDIA`). We presign those too;
 * the jobs worker demuxes that playlist for Whisper transcription.
 */
function predictHlsPaths(rungs: HlsRungConfig[], duration: number, hasAudio: boolean): string[] {
  const paths: string[] = ['master.m3u8'];
  const segmentCount = Math.max(1, Math.ceil(duration / HLS_TARGET_SEGMENT_SECONDS)) + 5;

  for (const rung of rungs) {
    paths.push(`${rung.name}/playlist.m3u8`);
    for (let i = 1; i <= segmentCount; i++) {
      paths.push(`${rung.name}/seg-${pad(i, 5)}.ts`);
    }
  }
  if (hasAudio) {
    paths.push('audio/playlist.m3u8');
    for (let i = 1; i <= segmentCount; i++) {
      paths.push(`audio/seg-${pad(i, 5)}.ts`);
    }
  }

  return paths;
}

async function batchPresignPaths(assetId: string, paths: string[]): Promise<Map<string, PresignedUrl>> {
  return batchPresignPathChunks(assetId, paths, 'default');
}

async function batchPresign1080Paths(assetId: string, paths: string[]): Promise<Map<string, PresignedUrl>> {
  return batchPresignPathChunks(assetId, paths, '1080');
}

async function batchPresignPathChunks(
  assetId: string,
  paths: string[],
  endpoint: 'default' | '1080'
): Promise<Map<string, PresignedUrl>> {
  const map = new Map<string, PresignedUrl>();

  for (let offset = 0; offset < paths.length; offset += PRESIGN_BATCH_SIZE) {
    const chunk = paths.slice(offset, offset + PRESIGN_BATCH_SIZE);
    const response =
      endpoint === '1080'
        ? await classroomio.organization.assets[':assetId'].hls['1080'].presign.$post({
            param: { assetId },
            json: { paths: chunk }
          })
        : await classroomio.organization.assets[':assetId'].hls.presign.$post({
            param: { assetId },
            json: { paths: chunk }
          });
    const chunkMap = await parsePresignResponse(chunk, response);
    for (const [path, presigned] of chunkMap) {
      map.set(path, presigned);
    }
  }

  return map;
}

async function parsePresignResponse(paths: string[], response: Response): Promise<Map<string, PresignedUrl>> {
  const map = new Map<string, PresignedUrl>();
  const body = await response.json();
  if (!('success' in body) || !body.success) {
    throw new HlsEncoderError('upload_failed', 'Failed to presign HLS uploads');
  }

  for (const path of paths) {
    const url = body.data.urls[path];
    const key = body.data.keys[path];
    if (!url || !key) {
      throw new HlsEncoderError('upload_failed', `Presign missing url for ${path}`);
    }

    map.set(path, { url, key });
  }

  return map;
}

function uploadContentTypeForPath(path: string, fallbackMimeType: string): string {
  const dotIndex = path.lastIndexOf('.');
  if (dotIndex === -1) return fallbackMimeType;

  return HLS_UPLOAD_CONTENT_TYPES[path.slice(dotIndex).toLowerCase()] ?? fallbackMimeType;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class ConcurrencyGate {
  private active = 0;
  private queue: (() => void)[] = [];

  constructor(private readonly limit: number) {}

  async run<T>(task: () => Promise<T>): Promise<T> {
    await this.acquire();

    try {
      return await task();
    } finally {
      this.release();
    }
  }

  private acquire(): Promise<void> {
    if (this.active < this.limit) {
      this.active += 1;
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.queue.push(() => {
        this.active += 1;
        resolve();
      });
    });
  }

  private release(): void {
    this.active -= 1;
    const next = this.queue.shift();
    if (next) next();
  }
}

async function putPresignedObject(options: {
  path: string;
  presigned: PresignedUrl;
  body: Blob;
  contentType: string;
  signal?: AbortSignal;
  refreshPresign: () => Promise<PresignedUrl>;
}): Promise<PresignedUrl> {
  let presigned = options.presigned;

  for (let attempt = 1; attempt <= HLS_PUT_MAX_ATTEMPTS; attempt += 1) {
    const response = await fetch(presigned.url, {
      method: 'PUT',
      headers: { 'Content-Type': options.contentType },
      body: options.body,
      signal: options.signal
    });

    if (response.ok) return presigned;

    const retryable = response.status === 403 || response.status === 429 || response.status >= 500;
    if (!retryable || attempt === HLS_PUT_MAX_ATTEMPTS) {
      const detail = await response.text().catch(() => '');
      const suffix = detail ? `: ${detail.slice(0, 160)}` : '';
      throw new HlsEncoderError('upload_failed', `PUT ${options.path} → ${response.status}${suffix}`);
    }

    if (response.status === 403) {
      presigned = await options.refreshPresign();
    }

    await sleep(Math.min(1000 * 2 ** (attempt - 1), 8000));
  }

  throw new HlsEncoderError('upload_failed', `PUT ${options.path} failed`);
}

/**
 * Uploads files Mediabunny emits while encoding. All expected paths are
 * pre-presigned at start; PathedTarget.onFinalize is a synchronous map
 * lookup. The rare path that wasn't predicted (e.g. encoder produced one
 * extra segment) falls back to a single per-file presign.
 */
class HlsUploader {
  private totalBytes = 0;
  private uploadedCount = 0;
  private inflight: Promise<void>[] = [];
  private uploadFailures: unknown[] = [];
  private readonly uploadedPaths = new Set<string>();
  private readonly uploadGate = new ConcurrencyGate(HLS_UPLOAD_CONCURRENCY);

  constructor(
    private readonly options: {
      assetId: string;
      presignedUrls: Map<string, PresignedUrl>;
      onUploaded: (state: { totalBytes: number; count: number }) => void;
      signal?: AbortSignal;
      presignEndpoint?: 'default' | '1080';
      skipPaths?: Set<string>;
      capturedFiles?: Map<string, Uint8Array>;
    }
  ) {}

  hasUploaded(relativePath: string): boolean {
    return this.uploadedPaths.has(relativePath);
  }

  targetFor(path: string, mimeType: string): BufferTarget {
    return new BufferTarget({
      onFinalize: (buffer) => {
        void this.uploadSingle(path, mimeType, buffer);
      }
    });
  }

  async uploadSingle(
    path: string,
    mimeType: string,
    buffer: ArrayBuffer | Uint8Array,
    options?: { force?: boolean }
  ): Promise<string> {
    const upload = this.uploadGate.run(async () => {
      const u8 = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
      if (!options?.force && this.options.skipPaths?.has(path)) {
        this.options.capturedFiles?.set(path, u8);
        return `${this.options.assetId}/${path}`;
      }

      let presigned = this.options.presignedUrls.get(path);
      if (!presigned) {
        presigned = await this.fallbackPresign(path);
        this.options.presignedUrls.set(path, presigned);
      }

      const contentType = uploadContentTypeForPath(path, mimeType);
      const body = new Blob([u8], { type: contentType });
      presigned = await putPresignedObject({
        path,
        presigned,
        body,
        contentType,
        signal: this.options.signal,
        refreshPresign: async () => {
          const refreshed = await this.fallbackPresign(path);
          this.options.presignedUrls.set(path, refreshed);
          return refreshed;
        }
      });
      this.options.presignedUrls.set(path, presigned);

      this.uploadedPaths.add(path);
      this.totalBytes += u8.byteLength;
      this.uploadedCount += 1;
      this.options.onUploaded({ totalBytes: this.totalBytes, count: this.uploadedCount });
      return presigned.key;
    });

    const tracked = upload.then(
      () => undefined,
      (error) => {
        this.uploadFailures.push(error);
        throw error;
      }
    );
    this.inflight.push(tracked);
    tracked.finally(() => {
      const index = this.inflight.indexOf(tracked);
      if (index >= 0) this.inflight.splice(index, 1);
    });

    return upload;
  }

  private async fallbackPresign(path: string): Promise<PresignedUrl> {
    const response =
      this.options.presignEndpoint === '1080'
        ? await classroomio.organization.assets[':assetId'].hls['1080'].presign.$post({
            param: { assetId: this.options.assetId },
            json: { paths: [path] }
          })
        : await classroomio.organization.assets[':assetId'].hls.presign.$post({
            param: { assetId: this.options.assetId },
            json: { paths: [path] }
          });
    const body = await response.json();
    if (!('success' in body) || !body.success) {
      throw new HlsEncoderError('upload_failed', `Failed to presign ${path}`);
    }
    const url = body.data.urls[path];
    const key = body.data.keys[path];
    if (!url || !key) {
      throw new HlsEncoderError('upload_failed', `Presign returned no url for ${path}`);
    }
    return { url, key };
  }

  async flush(): Promise<void> {
    while (this.inflight.length) {
      const pending = this.inflight.slice();
      const results = await Promise.allSettled(pending);
      const failure = results.find((result) => result.status === 'rejected');
      if (failure?.status === 'rejected') {
        throw failure.reason;
      }
    }

    if (this.uploadFailures.length > 0) {
      throw this.uploadFailures[0];
    }
  }
}

async function extractAndUploadThumbnails(input: {
  videoTrack: InputVideoTrack;
  duration: number;
  file: File;
}): Promise<string[]> {
  if (!input.duration || input.duration <= 0) return [];

  const sink = new CanvasSink(input.videoTrack, { width: 1280, fit: 'contain', poolSize: 1 });
  const timestamps = THUMBNAIL_FRACTIONS.map((f) => input.duration * f);
  const candidates: { url: string; score: number }[] = [];

  let index = 0;
  for await (const wrapped of sink.canvasesAtTimestamps(timestamps)) {
    if (!wrapped) {
      index += 1;
      continue;
    }
    const canvas = wrapped.canvas as HTMLCanvasElement | OffscreenCanvas;
    const blob = await canvasToJpegBlobUnderCap(canvas, THUMBNAIL_MAX_BYTES);
    if (!blob) {
      index += 1;
      continue;
    }
    const score = await averageLuma(canvas);
    const fileName = input.file.name.replace(/\.[^.]+$/, '') + `-thumb-${index}.jpg`;
    const file = new File([blob], fileName, { type: 'image/jpeg' });
    try {
      const response = await classroomio.media.image.$post({ form: { file } });
      const body = await response.json();
      if ('success' in body && body.success && body.url) {
        candidates.push({ url: body.url, score });
      }
    } catch (error) {
      console.warn('Thumbnail upload failed', error);
    }
    index += 1;
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates.map((c) => c.url);
}

async function canvasToJpegBlob(canvas: HTMLCanvasElement | OffscreenCanvas, quality: number): Promise<Blob | null> {
  if (canvas instanceof OffscreenCanvas) {
    return canvas.convertToBlob({ type: 'image/jpeg', quality });
  }
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality));
}

/**
 * Encode the canvas as JPEG, stepping quality down until the blob fits under
 * `maxBytes`. Returns the first blob within the cap, or the smallest produced
 * if even the lowest quality overshoots.
 */
async function canvasToJpegBlobUnderCap(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  maxBytes: number
): Promise<Blob | null> {
  let smallest: Blob | null = null;
  for (const quality of THUMBNAIL_QUALITY_LADDER) {
    const blob = await canvasToJpegBlob(canvas, quality);
    if (!blob) continue;

    if (!smallest || blob.size < smallest.size) smallest = blob;
    if (blob.size <= maxBytes) return blob;
  }

  return smallest;
}

async function averageLuma(canvas: HTMLCanvasElement | OffscreenCanvas): Promise<number> {
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
  if (!ctx) return 0;

  const { width, height } = canvas;
  const sampleSize = Math.min(64, width, height);
  const data = ctx.getImageData(0, 0, sampleSize, sampleSize).data;
  let sum = 0;
  for (let i = 0; i < data.length; i += 4) {
    sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
  }
  return sum / (data.length / 4);
}

function computeAspectRatioLabel(track: InputVideoTrack): string {
  const w = track.displayWidth;
  const h = track.displayHeight;
  if (!w || !h) return '16:9';

  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const g = gcd(w, h);
  return `${w / g}:${h / g}`;
}

function pad(n: number, width: number): string {
  return n.toString().padStart(width, '0');
}

function resolveTranscriptionAudioKey(
  assetId: string,
  rungs: HlsRungConfig[],
  uploader: HlsUploader
): string | undefined {
  if (uploader.hasUploaded('audio/playlist.m3u8')) {
    return `${assetId}/audio/playlist.m3u8`;
  }

  for (let index = rungs.length - 1; index >= 0; index -= 1) {
    const rung = rungs[index];
    if (!rung) continue;

    const playlistPath = `${rung.name}/playlist.m3u8`;
    if (uploader.hasUploaded(playlistPath)) {
      return `${assetId}/${playlistPath}`;
    }
  }

  return undefined;
}

/** Rough byte budget for progress UI — actual HLS output varies with content complexity. */
function estimateHlsUploadBytes(rungs: HlsRungConfig[], durationSeconds: number, hasAudio: boolean): number {
  const segmentCount = Math.max(1, Math.ceil(durationSeconds / HLS_TARGET_SEGMENT_SECONDS)) + 5;
  const playlistOverhead = 32 * 1024 * (rungs.length + (hasAudio ? 2 : 1));
  const videoBytes =
    rungs.reduce((sum, rung) => sum + rung.videoBitrate * durationSeconds, 0) / 8 + segmentCount * rungs.length * 4096;
  const audioBytes = hasAudio ? (AUDIO_BITRATE * durationSeconds) / 8 + segmentCount * 4096 : 0;

  return Math.max(1, Math.round(playlistOverhead + videoBytes + audioBytes));
}

async function fetchExistingMasterManifest(assetId: string, signal?: AbortSignal): Promise<string> {
  await classroomio.organization.assets[':assetId'].hls.cookie.$post({ param: { assetId } });
  const response = await fetch(`/hls/${assetId}/master.m3u8`, { credentials: 'include', signal });
  if (!response.ok) {
    throw new HlsEncoderError('upload_failed', `Failed to fetch master manifest (${response.status})`);
  }

  return response.text();
}

function extractAudioGroupId(manifest: string): string | null {
  const match = manifest.match(/#EXT-X-MEDIA:TYPE=AUDIO[^\n]*GROUP-ID="([^"]+)"/);
  return match?.[1] ?? null;
}

function mergeP1080IntoMaster(existingManifest: string, generatedManifest: string): string {
  if (existingManifest.includes('p1080/playlist.m3u8')) {
    return existingManifest;
  }

  const generatedLines = generatedManifest.split('\n');
  let streamInf: string | null = null;
  for (let index = 0; index < generatedLines.length; index += 1) {
    const line = generatedLines[index]?.trim() ?? '';
    if (!line.startsWith('#EXT-X-STREAM-INF')) continue;

    const playlistLine = generatedLines[index + 1]?.trim() ?? '';
    if (playlistLine === 'p1080/playlist.m3u8') {
      streamInf = line;
      break;
    }
  }

  const audioGroupId = extractAudioGroupId(existingManifest);
  if (!streamInf) {
    streamInf = `#EXT-X-STREAM-INF:BANDWIDTH=${P1080_RUNG.videoBitrate},RESOLUTION=${P1080_RUNG.width}x${P1080_RUNG.height},CODECS="avc1.640028,mp4a.40.2"`;
  }

  if (audioGroupId && !streamInf.includes('AUDIO=')) {
    streamInf = `${streamInf},AUDIO="${audioGroupId}"`;
  }

  const lines = existingManifest.trimEnd().split('\n');
  lines.push(streamInf);
  lines.push('p1080/playlist.m3u8');

  return `${lines.join('\n')}\n`;
}
