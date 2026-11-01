import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getS3Client, getStorageConfig } from '@cio/core/config/storage';
import { getAssetById } from '@cio/db/queries/assets/assets';
import { AppError, ErrorCodes } from '@api/utils/errors';
import {
  BufferSource,
  Conversion,
  CustomPathedSource,
  HLS,
  Input,
  MPEG_TS,
  Mp4OutputFormat,
  Output,
  StreamTarget,
  type StreamTargetChunk
} from 'mediabunny';

export type HlsVariant = {
  uri: string;
  rendition: string;
  bandwidth: number;
  height: number | null;
  audioGroup: string | null;
  isVideo: boolean;
  streamInfLine: string;
};

export type OfflineVideoRendition = {
  rendition: string;
  height: number | null;
  estimatedBytes: number | null;
};

const ATTRIBUTE = /([A-Z0-9-]+)=("[^"]*"|[^,]*)/g;

function attributesOf(line: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  const list = line.slice(line.indexOf(':') + 1);
  for (const match of list.matchAll(ATTRIBUTE)) {
    attributes[match[1]!] = match[2]!.replace(/^"|"$/g, '');
  }

  return attributes;
}

function renditionOf(uri: string) {
  const [first] = uri.split('?')[0]!.split('/');

  return first && first !== uri ? first : uri.replace(/\.m3u8.*$/i, '');
}

/** Variant streams of an HLS master playlist with relative URIs. Absolute URIs are skipped: they are not in storage. */
export function parseHlsVariants(master: string): HlsVariant[] {
  const lines = master.split(/\r?\n/).map((line) => line.trim());
  const variants: HlsVariant[] = [];

  lines.forEach((line, index) => {
    if (!line.startsWith('#EXT-X-STREAM-INF')) return;

    const uri = lines.slice(index + 1).find((next) => next && !next.startsWith('#'));
    if (!uri || /^[a-z][a-z0-9+.-]*:/i.test(uri) || uri.startsWith('/') || uri.includes('..')) return;

    const attributes = attributesOf(line);
    const resolution = attributes.RESOLUTION?.match(/^(\d+)x(\d+)$/);
    const codecs = attributes.CODECS ?? '';
    const isVideo = Boolean(resolution) || /avc|hvc|hev|vp0|av01/i.test(codecs);

    variants.push({
      uri,
      rendition: renditionOf(uri),
      bandwidth: Number(attributes['AVERAGE-BANDWIDTH'] ?? attributes.BANDWIDTH ?? 0) || 0,
      height: resolution ? Number(resolution[2]) : null,
      audioGroup: attributes.AUDIO ?? null,
      isVideo,
      streamInfLine: line
    });
  });

  return variants;
}

/** The smallest video variant, which keeps downloads light; `rendition` picks a specific one when it exists. */
export function pickOfflineVariant(variants: HlsVariant[], rendition?: string | null): HlsVariant | null {
  const videos = variants.filter((variant) => variant.isVideo);
  if (rendition) return videos.find((variant) => variant.rendition === rendition) ?? null;

  return [...videos].sort((a, b) => a.bandwidth - b.bandwidth || (a.height ?? 0) - (b.height ?? 0))[0] ?? null;
}

/** A master playlist reduced to one variant and the audio group it references. */
export function singleVariantMaster(master: string, variant: HlsVariant): string {
  const lines = master.split(/\r?\n/).map((line) => line.trim());
  const kept = lines.filter((line) => {
    if (line === '#EXTM3U' || line.startsWith('#EXT-X-VERSION') || line.startsWith('#EXT-X-INDEPENDENT-SEGMENTS'))
      return true;
    if (!line.startsWith('#EXT-X-MEDIA')) return false;

    const attributes = attributesOf(line);

    return attributes.TYPE === 'AUDIO' && Boolean(variant.audioGroup) && attributes['GROUP-ID'] === variant.audioGroup;
  });

  return [...kept, variant.streamInfLine, variant.uri, ''].join('\n');
}

async function readObject(key: string): Promise<Uint8Array> {
  const config = getStorageConfig();
  const result = await getS3Client().send(new GetObjectCommand({ Bucket: config.bucketVideos, Key: key }));
  if (!result.Body) throw new AppError('Video file is missing', ErrorCodes.ASSET_NOT_FOUND, 404);

  return result.Body.transformToByteArray();
}

function manifestKeyOf(asset: { id: string; hlsManifestKey: string | null }) {
  if (!asset.hlsManifestKey) throw new AppError('Asset has no HLS manifest', ErrorCodes.VALIDATION_ERROR, 400);

  return asset.hlsManifestKey;
}

/**
 * The rendition an offline download of this HLS asset uses and its estimated size (bandwidth × duration).
 * Returns null when the master playlist cannot be read, so callers can still list the video with an unknown size.
 */
export async function describeOfflineVideo(
  asset: { id: string; hlsManifestKey: string | null },
  durationSeconds: number | null
): Promise<OfflineVideoRendition | null> {
  try {
    const master = new TextDecoder().decode(await readObject(manifestKeyOf(asset)));
    const variant = pickOfflineVariant(parseHlsVariants(master));
    if (!variant) return null;

    const estimatedBytes =
      durationSeconds && variant.bandwidth ? Math.round((variant.bandwidth * durationSeconds) / 8) : null;

    return { rendition: variant.rendition, height: variant.height, estimatedBytes };
  } catch (error) {
    console.warn(
      `[offline] could not read HLS master for asset ${asset.id}:`,
      error instanceof Error ? error.message : error
    );
    return null;
  }
}

function assertStoragePath(path: string) {
  if (/^[a-z][a-z0-9+.-]*:/i.test(path) || path.startsWith('/') || path.split('/').includes('..')) {
    throw new AppError('Invalid HLS path', ErrorCodes.VALIDATION_ERROR, 400);
  }
}

/**
 * Remuxes one HLS rendition (video plus its audio group) into a fragmented MP4 stream without re-encoding.
 * iOS cannot play an HLS package from local files, so offline downloads use this single-file form on every platform.
 */
export async function streamOfflineVideo(
  assetId: string,
  rendition?: string | null
): Promise<ReadableStream<Uint8Array>> {
  const asset = await getAssetById(assetId);
  if (!asset) throw new AppError('Asset not found', ErrorCodes.ASSET_NOT_FOUND, 404);

  const manifestKey = manifestKeyOf(asset);
  const prefix = manifestKey.slice(0, manifestKey.lastIndexOf('/') + 1);
  const rootPath = manifestKey.slice(prefix.length);
  const master = new TextDecoder().decode(await readObject(manifestKey));
  const variant = pickOfflineVariant(parseHlsVariants(master), rendition);
  if (!variant) throw new AppError('Rendition not found', ErrorCodes.ASSET_NOT_FOUND, 404);

  const rootBytes = new TextEncoder().encode(singleVariantMaster(master, variant));
  const source = new CustomPathedSource(rootPath, async ({ path, isRoot }) => {
    if (isRoot) return new BufferSource(rootBytes);

    assertStoragePath(path);

    return new BufferSource(await readObject(`${prefix}${path}`));
  });

  const input = new Input({ formats: [HLS, MPEG_TS], source });
  let written = 0;
  let pipeController: TransformStreamDefaultController<Uint8Array> | null = null;
  const pipe = new TransformStream<StreamTargetChunk, Uint8Array>({
    start(controller) {
      pipeController = controller;
    },
    transform(chunk, controller) {
      if (chunk.position !== written) {
        controller.error(new Error('Offline video output is not sequential'));
        return;
      }

      written += chunk.data.byteLength;
      controller.enqueue(chunk.data);
    }
  });
  const output = new Output({
    format: new Mp4OutputFormat({ fastStart: 'fragmented' }),
    target: new StreamTarget(pipe.writable)
  });
  const conversion = await Conversion.init({ input, output });
  if (!conversion.isValid) {
    input.dispose();
    throw new AppError('This video cannot be prepared for download', ErrorCodes.VALIDATION_ERROR, 422);
  }

  void conversion
    .execute()
    .catch((error) => {
      console.error(`[offline] remux failed for asset ${assetId}:`, error);
      try {
        pipeController?.error(error);
      } catch {}
    })
    .finally(() => input.dispose());

  return pipe.readable;
}
