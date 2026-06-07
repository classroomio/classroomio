import { AppError, ErrorCodes } from '@cio/utils/errors';
import type {
  TAssetAttach,
  TAssetCreateUpload,
  TAssetDetach,
  TAssetExportQuery,
  TAssetListQuery,
  TAssetStorageQuery,
  TAssetUpdate,
  TBatchPresignHls,
  TBatchPresignHls1080,
  TFinalizeHls1080,
  TFinalizeHlsAsset,
  TInitHlsAsset,
  THls1080Status,
  TYouTubeMetadataQuery
} from '@cio/utils/validation/assets';
import type { TTranscriptResponse, TUpdateTranscript } from '@cio/utils/validation/media';
import {
  countAssetUsagesByAsset,
  createAssetUsage,
  createHlsAssetPlaceholder,
  createOrGetAssetByStorageKey,
  deleteAsset,
  deleteAssetUsage,
  finalizeHlsAsset as finalizeHlsAssetQuery,
  finalizeHls1080Rendition,
  getAssetById,
  getAssetStorageSummaryByOrg,
  listAssetsByOrg,
  listAssetsForExport,
  listAssetUsagesByAsset,
  updateAsset
} from '@cio/db/queries/assets';
import { getMediaTranscriptByAsset, updateMediaTranscriptContent } from '@cio/db/queries';

import {
  generateTranscriptVttPresignedUrl,
  generateUploadPresignedUrl,
  TRANSCRIPT_VTT_PRESIGN_SECONDS
} from '../../utils/s3';
import { getS3Client, getStorageConfig } from '../../config/storage';

const YOUTUBE_VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

type YouTubeOEmbedResponse = {
  title?: unknown;
  thumbnail_url?: unknown;
};

type YouTubeWatchPageMetadata = {
  title: string | null;
  durationSeconds: number | null;
  thumbnailUrl: string | null;
};

function assertAssetExists<T>(asset: T | null): T {
  if (!asset) {
    throw new AppError('Asset not found', ErrorCodes.ASSET_NOT_FOUND, 404);
  }

  return asset;
}

function normalizeUrl(url: string): URL | null {
  const trimmed = url.trim();
  if (!trimmed) {
    return null;
  }

  try {
    return new URL(trimmed);
  } catch {
    try {
      return new URL(`https://${trimmed}`);
    } catch {
      return null;
    }
  }
}

function extractYouTubeVideoId(url: string): string | null {
  const parsedUrl = normalizeUrl(url);
  if (!parsedUrl) {
    return null;
  }

  const host = parsedUrl.hostname.toLowerCase();
  let videoId: string | null = null;

  if (host === 'youtu.be' || host === 'www.youtu.be') {
    const [pathSegment] = parsedUrl.pathname.split('/').filter(Boolean);
    videoId = pathSegment ?? null;
  } else if (
    host === 'youtube.com' ||
    host === 'www.youtube.com' ||
    host === 'm.youtube.com' ||
    host === 'music.youtube.com' ||
    host === 'youtube-nocookie.com' ||
    host === 'www.youtube-nocookie.com'
  ) {
    if (parsedUrl.pathname === '/watch') {
      videoId = parsedUrl.searchParams.get('v');
    } else {
      const [firstSegment, secondSegment] = parsedUrl.pathname.split('/').filter(Boolean);
      if (firstSegment === 'embed' || firstSegment === 'shorts' || firstSegment === 'live') {
        videoId = secondSegment ?? null;
      }
    }
  }

  if (!videoId || !YOUTUBE_VIDEO_ID_REGEX.test(videoId)) {
    return null;
  }

  return videoId;
}

function decodeHtmlEntities(value: string): string {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&#x27;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>');
}

function extractMetaContent(html: string, pattern: RegExp): string | null {
  const match = html.match(pattern);
  const value = match?.[1];
  if (!value) {
    return null;
  }

  const decoded = decodeHtmlEntities(value.trim());
  return decoded.length ? decoded : null;
}

function extractDurationSeconds(html: string): number | null {
  const lengthSecondsMatch = html.match(/"lengthSeconds":"(\d+)"/);
  if (lengthSecondsMatch?.[1]) {
    const parsed = Number.parseInt(lengthSecondsMatch[1], 10);
    return Number.isFinite(parsed) ? parsed : null;
  }

  const approxDurationMsMatch = html.match(/"approxDurationMs":"(\d+)"/);
  if (approxDurationMsMatch?.[1]) {
    const parsed = Number.parseInt(approxDurationMsMatch[1], 10);
    if (Number.isFinite(parsed) && parsed >= 0) {
      return Math.round(parsed / 1000);
    }
  }

  return null;
}

async function fetchYouTubeOEmbed(videoUrl: string): Promise<{ title: string | null; thumbnailUrl: string | null }> {
  try {
    const response = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(videoUrl)}`);
    if (!response.ok) {
      return {
        title: null,
        thumbnailUrl: null
      };
    }

    const data = (await response.json()) as YouTubeOEmbedResponse;
    const title = typeof data.title === 'string' && data.title.trim().length ? data.title.trim() : null;
    const thumbnailUrl =
      typeof data.thumbnail_url === 'string' && data.thumbnail_url.trim().length ? data.thumbnail_url.trim() : null;

    return {
      title,
      thumbnailUrl
    };
  } catch {
    return {
      title: null,
      thumbnailUrl: null
    };
  }
}

async function fetchYouTubeWatchPageMetadata(videoId: string): Promise<YouTubeWatchPageMetadata> {
  try {
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
    if (!response.ok) {
      return {
        title: null,
        durationSeconds: null,
        thumbnailUrl: null
      };
    }

    const html = await response.text();
    const title =
      extractMetaContent(html, /<meta\s+property="og:title"\s+content="([^"]+)"/i) ??
      extractMetaContent(html, /<meta\s+name="title"\s+content="([^"]+)"/i);
    const thumbnailUrl = extractMetaContent(html, /<meta\s+property="og:image"\s+content="([^"]+)"/i);
    const durationSeconds = extractDurationSeconds(html);

    return {
      title,
      durationSeconds,
      thumbnailUrl
    };
  } catch {
    return {
      title: null,
      durationSeconds: null,
      thumbnailUrl: null
    };
  }
}

export async function listOrganizationAssetsService(orgId: string, query: TAssetListQuery) {
  try {
    return await listAssetsByOrg(orgId, query);
  } catch (error) {
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to list assets',
      ErrorCodes.ASSET_LIST_FAILED,
      500
    );
  }
}

export async function createAssetFromUploadService(orgId: string, profileId: string, data: TAssetCreateUpload) {
  try {
    const asset = await createOrGetAssetByStorageKey({
      organizationId: orgId,
      kind: data.kind,
      provider: data.provider,
      storageProvider: data.storageProvider,
      storageKey: data.storageKey ?? null,
      sourceUrl: data.sourceUrl ?? null,
      mimeType: data.mimeType ?? null,
      byteSize: data.byteSize ?? null,
      checksum: data.checksum ?? null,
      title: data.title ?? null,
      description: data.description ?? null,
      thumbnailUrl: data.thumbnailUrl ?? null,
      durationSeconds: data.durationSeconds ?? null,
      aspectRatio: data.aspectRatio ?? null,
      isExternal: data.isExternal,
      status: 'active',
      metadata: data.metadata ?? {},
      createdByProfileId: profileId
    });

    // Fire-and-forget: enqueue lesson-video post-processing for new uploads.
    // Errors are logged but never block the asset create response.
    if (asset.kind === 'video' && asset.provider === 'upload' && asset.storageKey) {
      void enqueueMediaPostProcessingForAsset({
        organizationId: orgId,
        assetId: asset.id,
        storageKey: asset.storageKey,
        triggeredByProfileId: profileId
      });
    }

    return asset;
  } catch (error) {
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to create asset',
      ErrorCodes.ASSET_CREATE_FAILED,
      500
    );
  }
}

async function enqueueMediaPostProcessingForAsset(input: {
  organizationId: string;
  assetId: string;
  storageKey: string;
  triggeredByProfileId: string;
}): Promise<void> {
  try {
    const { startMediaJob } = await import('../jobs/media-jobs');
    await startMediaJob({
      organizationId: input.organizationId,
      assetId: input.assetId,
      storageKey: input.storageKey,
      triggeredByProfileId: input.triggeredByProfileId,
      withTranscription: Boolean(process.env.OPENAI_API_KEY)
    });
  } catch (error) {
    console.error('enqueueMediaPostProcessingForAsset failed:', error);
  }
}

export async function getAssetService(orgId: string, assetId: string) {
  try {
    const asset = await getAssetById(assetId, orgId);
    return assertAssetExists(asset);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to fetch asset',
      ErrorCodes.ASSET_FETCH_FAILED,
      500
    );
  }
}

export async function updateAssetService(orgId: string, assetId: string, data: TAssetUpdate) {
  try {
    const updated = await updateAsset(assetId, orgId, data);
    return assertAssetExists(updated);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to update asset',
      ErrorCodes.ASSET_UPDATE_FAILED,
      500
    );
  }
}

/**
 * Set the chosen thumbnail URL for an asset. Accepts URLs that are either
 * (a) one of the asset's auto-generated candidates, or (b) a freshly uploaded
 * URL on the org's media bucket. Anything else is rejected so callers can't
 * point the asset at an arbitrary remote image.
 */
export async function selectAssetThumbnailService(orgId: string, assetId: string, thumbnailUrl: string) {
  try {
    const asset = await getAssetById(assetId, orgId);
    assertAssetExists(asset);

    const candidates = (asset?.thumbnailCandidates ?? []) as string[];
    const mediaBase = getStorageConfig().mediaPublicBaseUrl?.replace(/\/$/, '') ?? null;
    const isCandidate = candidates.includes(thumbnailUrl);
    const isOnMediaBucket = Boolean(mediaBase && thumbnailUrl.startsWith(`${mediaBase}/`));

    if (!isCandidate && !isOnMediaBucket) {
      throw new AppError(
        'Thumbnail URL must be a generated candidate or a media-bucket upload',
        ErrorCodes.VALIDATION_ERROR,
        400
      );
    }

    const updated = await updateAsset(assetId, orgId, { thumbnailUrl });
    return assertAssetExists(updated);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to update asset thumbnail',
      ErrorCodes.ASSET_UPDATE_FAILED,
      500
    );
  }
}

export async function deleteAssetService(orgId: string, assetId: string) {
  try {
    await getAssetService(orgId, assetId);

    const usageCount = await countAssetUsagesByAsset(assetId, orgId);
    if (usageCount > 0) {
      throw new AppError('Asset is still in use', ErrorCodes.ASSET_IN_USE, 409);
    }

    const deleted = await deleteAsset(assetId, orgId);
    return assertAssetExists(deleted);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to delete asset',
      ErrorCodes.ASSET_DELETE_FAILED,
      500
    );
  }
}

export async function getAssetUsageGraphService(orgId: string, assetId: string) {
  try {
    await getAssetService(orgId, assetId);
    const [usages, usageCount] = await Promise.all([
      listAssetUsagesByAsset(assetId, orgId),
      countAssetUsagesByAsset(assetId, orgId)
    ]);

    return {
      usageCount,
      usages
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to fetch asset usage',
      ErrorCodes.ASSET_USAGE_FETCH_FAILED,
      500
    );
  }
}

export async function attachAssetService(orgId: string, assetId: string, profileId: string, input: TAssetAttach) {
  try {
    await getAssetService(orgId, assetId);
    return await createAssetUsage({
      organizationId: orgId,
      assetId,
      targetType: input.targetType,
      targetId: input.targetId,
      slotType: input.slotType,
      slotKey: input.slotKey ?? null,
      position: input.position ?? null,
      createdByProfileId: profileId
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to attach asset',
      ErrorCodes.ASSET_ATTACH_FAILED,
      500
    );
  }
}

export async function detachAssetService(orgId: string, assetId: string, input: TAssetDetach) {
  try {
    await getAssetService(orgId, assetId);
    const detached = await deleteAssetUsage(orgId, assetId, input);
    if (!detached) {
      throw new AppError('Asset usage not found', ErrorCodes.ASSET_USAGE_NOT_FOUND, 404);
    }

    return detached;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to detach asset',
      ErrorCodes.ASSET_DETACH_FAILED,
      500
    );
  }
}

export async function exportOrganizationAssetsService(orgId: string, query: TAssetExportQuery) {
  try {
    return await listAssetsForExport(orgId, query);
  } catch (error) {
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to export assets',
      ErrorCodes.ASSET_EXPORT_FAILED,
      500
    );
  }
}

export async function getOrganizationAssetStorageService(orgId: string, query: TAssetStorageQuery) {
  try {
    return await getAssetStorageSummaryByOrg(orgId, query);
  } catch (error) {
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to fetch asset storage summary',
      ErrorCodes.ASSET_STORAGE_FETCH_FAILED,
      500
    );
  }
}

export async function getTranscriptForOrganizationAssetService(
  orgId: string,
  assetId: string
): Promise<TTranscriptResponse | null> {
  try {
    const asset = assertAssetExists(await getAssetById(assetId));

    if (asset.organizationId !== orgId) {
      throw new AppError('Asset not found', ErrorCodes.ASSET_NOT_FOUND, 404);
    }

    const row = await getMediaTranscriptByAsset(assetId, orgId);
    if (!row) {
      return null;
    }

    // Relative path served by `apps/api/src/routes/transcripts`. The
    // dashboard resolves it into a full URL via the same Hono RPC base it
    // uses for HLS, so `<track>` always loads same-origin behind the
    // tenant-router Worker in prod or via CORS-allowed cross-origin in
    // local dev. `vttUrlExpiresAt` is no longer meaningful — leaving it
    // here so existing callers don't break, but it's a far-future stamp.
    return toTranscriptResponse(assetId, row.language, row.segments, row.durationSeconds, row.updatedAt);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to fetch transcript',
      ErrorCodes.ASSET_FETCH_FAILED,
      500
    );
  }
}

/**
 * Build the transcript response. The VTT is rendered on the fly from these
 * segments by `apps/api/src/routes/transcripts`, so the relative path carries
 * a `?v=<updatedAt>` cache-buster to force the `<track>` to reload after an
 * edit. `vttUrlExpiresAt` is no longer meaningful — kept so existing callers
 * don't break.
 */
function toTranscriptResponse(
  assetId: string,
  language: string,
  segments: TTranscriptResponse['segments'],
  durationSeconds: number | null,
  updatedAt: string
): TTranscriptResponse {
  const version = Number.isNaN(Date.parse(updatedAt)) ? '' : `?v=${Date.parse(updatedAt)}`;

  return {
    language,
    segments,
    vttUrl: `/transcripts/${assetId}/track.vtt${version}`,
    vttUrlExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    durationSeconds: durationSeconds ?? null
  };
}

export async function updateTranscriptForOrganizationAssetService(
  orgId: string,
  assetId: string,
  segments: TUpdateTranscript['segments']
): Promise<TTranscriptResponse> {
  try {
    const asset = assertAssetExists(await getAssetById(assetId));

    if (asset.organizationId !== orgId) {
      throw new AppError('Asset not found', ErrorCodes.ASSET_NOT_FOUND, 404);
    }

    const text = segments
      .map((segment) => segment.text.trim())
      .filter(Boolean)
      .join(' ');

    const row = await updateMediaTranscriptContent(assetId, orgId, { segments, text });
    if (!row) {
      throw new AppError('Transcript not found', ErrorCodes.ASSET_NOT_FOUND, 404);
    }

    return toTranscriptResponse(assetId, row.language, row.segments, row.durationSeconds, row.updatedAt);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to update transcript',
      ErrorCodes.ASSET_FETCH_FAILED,
      500
    );
  }
}

// --- HLS playback auth ---

export const HLS_COOKIE_NAME = 'cio_hls';
const HLS_COOKIE_TTL_SECONDS = 15 * 60;

function base64UrlEncode(input: ArrayBuffer | Uint8Array): string {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);

  return Buffer.from(binary, 'binary').toString('base64').replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

async function hmacSha256(secret: string, message: string): Promise<string> {
  const { createHmac } = await import('crypto');
  const sig = createHmac('sha256', secret).update(message).digest();

  return base64UrlEncode(sig);
}

/**
 * Low-level HMAC mint. Returns `<payload>.<signature>` where payload is
 * base64url(`{aid, exp}`). No entitlement check — callers must verify
 * access before calling this.
 */
export async function mintHlsToken(assetId: string): Promise<{
  token: string;
  expiresAt: string;
  cookieName: string;
  maxAgeSeconds: number;
}> {
  const secret = process.env.HLS_SIGNING_SECRET;
  if (!secret) {
    throw new AppError('HLS signing not configured', ErrorCodes.INTERNAL_ERROR, 503);
  }

  const now = Math.floor(Date.now() / 1000);
  const exp = now + HLS_COOKIE_TTL_SECONDS;
  const payload = base64UrlEncode(Buffer.from(JSON.stringify({ aid: assetId, exp })));
  const signature = await hmacSha256(secret, payload);

  return {
    token: `${payload}.${signature}`,
    expiresAt: new Date(exp * 1000).toISOString(),
    cookieName: HLS_COOKIE_NAME,
    maxAgeSeconds: HLS_COOKIE_TTL_SECONDS
  };
}

export interface VerifiedHlsToken {
  assetId: string;
  expSeconds: number;
}

/**
 * Verify a `cio_hls` token. Used by the API's HLS streaming route as an
 * alternative to session auth (in local dev or wherever the request bypasses
 * the tenant-router). Returns the decoded payload on success, null otherwise.
 */
export async function verifyHlsToken(token: string): Promise<VerifiedHlsToken | null> {
  const secret = process.env.HLS_SIGNING_SECRET;
  if (!secret) return null;

  const dot = token.indexOf('.');
  if (dot === -1) return null;

  const payload = token.slice(0, dot);
  const signature = token.slice(dot + 1);

  const expected = await hmacSha256(secret, payload);
  if (expected !== signature) return null;

  try {
    const decoded = JSON.parse(Buffer.from(payload.replaceAll('-', '+').replaceAll('_', '/'), 'base64').toString());
    if (typeof decoded.aid !== 'string' || typeof decoded.exp !== 'number') return null;
    if (decoded.exp <= Math.floor(Date.now() / 1000)) return null;

    return { assetId: decoded.aid, expSeconds: decoded.exp };
  } catch {
    return null;
  }
}

/**
 * Mint a short-lived HMAC-signed cookie scoped to a single assetId. The
 * tenant-router Worker (production) and the API's `/hls/*` streaming route
 * (local dev / fallback) both verify the cookie before serving segments.
 * Format: `<base64url(JSON({aid,exp}))>.<base64url(HMAC-SHA256(payload, secret))>`
 */
export async function issueHlsCookieService(orgId: string, assetId: string) {
  try {
    const asset = assertAssetExists(await getAssetById(assetId, orgId));
    if (!asset.hlsManifestKey) {
      throw new AppError('Asset has no HLS manifest', ErrorCodes.VALIDATION_ERROR, 400);
    }

    return await mintHlsToken(assetId);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to issue HLS cookie',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
  }
}

/**
 * Public variant: mints the same HMAC cookie without org-membership.
 * Caller must have already verified that the asset is reachable via the
 * given public course/lesson path — typically by walking the public
 * course tree and matching the lesson's video asset id.
 */
export async function issuePublicHlsCookie(assetId: string) {
  const asset = await getAssetById(assetId);
  if (!asset?.hlsManifestKey) {
    throw new AppError('Asset has no HLS manifest', ErrorCodes.VALIDATION_ERROR, 400);
  }

  return await mintHlsToken(assetId);
}

// --- HLS upload lifecycle ---

async function deleteHlsAssetObjects(bucket: string, prefix: string): Promise<void> {
  const { DeleteObjectsCommand, ListObjectsV2Command } = await import('@aws-sdk/client-s3');
  const client = getS3Client();

  let continuationToken: string | undefined;
  do {
    const list = await client.send(
      new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, ContinuationToken: continuationToken })
    );
    const keys = (list.Contents ?? []).map((entry) => entry.Key).filter((k): k is string => Boolean(k));
    if (keys.length) {
      await client.send(
        new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: { Objects: keys.map((Key) => ({ Key })), Quiet: true }
        })
      );
    }
    continuationToken = list.IsTruncated ? list.NextContinuationToken : undefined;
  } while (continuationToken);
}

/**
 * Abort a `processing` HLS asset: clean up any partial R2 objects under
 * `videos/{assetId}/` and delete the asset row. Idempotent — caller can
 * fire this from the encoder's catch path without worrying about racing
 * with successful finalize (we refuse to abort `active` assets).
 */
export async function abortHlsAssetService(orgId: string, assetId: string) {
  try {
    const asset = assertAssetExists(await getAssetById(assetId, orgId));
    if (asset.status !== 'processing') {
      throw new AppError('Asset is not in processing state', ErrorCodes.VALIDATION_ERROR, 409);
    }

    const config = getStorageConfig();
    try {
      await deleteHlsAssetObjects(config.bucketVideos, `${assetId}/`);
    } catch (error) {
      // Object cleanup is best-effort — log and continue so the orphaned
      // DB row still gets removed. Stale R2 objects can be swept later.
      console.error('abortHlsAssetService: failed to delete R2 objects', error);
    }

    const deleted = await deleteAsset(assetId, orgId);
    return assertAssetExists(deleted);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to abort HLS asset',
      ErrorCodes.ASSET_DELETE_FAILED,
      500
    );
  }
}

const HLS_CONTENT_TYPES: Record<string, string> = {
  '.m3u8': 'application/vnd.apple.mpegurl',
  '.ts': 'video/mp2t',
  '.m4s': 'video/iso.segment',
  '.mp4': 'video/mp4',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png'
};

function contentTypeFor(path: string, overrides?: Record<string, string>): string {
  const dotIndex = path.lastIndexOf('.');
  if (dotIndex === -1) return 'application/octet-stream';

  const ext = path.slice(dotIndex).toLowerCase();
  return overrides?.[ext] ?? HLS_CONTENT_TYPES[ext] ?? 'application/octet-stream';
}

export async function initHlsAssetService(orgId: string, profileId: string, data: TInitHlsAsset) {
  try {
    const asset = await createHlsAssetPlaceholder({
      organizationId: orgId,
      createdByProfileId: profileId,
      title: data.title ?? data.fileName,
      byteSize: data.byteSize,
      mimeType: data.mimeType
    });

    return {
      assetId: asset.id,
      keyPrefix: `${asset.id}/hls`
    };
  } catch (error) {
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to init HLS asset',
      ErrorCodes.ASSET_CREATE_FAILED,
      500
    );
  }
}

/**
 * Returns presigned PUT URLs for a list of relative paths under
 * `videos/{assetId}/hls/`. Caller owns the layout — we only enforce that
 * paths stay scoped to the asset's own prefix.
 */
export async function batchPresignHlsService(
  orgId: string,
  assetId: string,
  data: TBatchPresignHls,
  options?: { allowActive?: boolean }
) {
  try {
    const asset = assertAssetExists(await getAssetById(assetId, orgId));
    if (asset.status !== 'processing' && !(options?.allowActive && asset.status === 'active')) {
      throw new AppError('Asset is not in processing state', ErrorCodes.VALIDATION_ERROR, 409);
    }

    const config = getStorageConfig();
    const prefix = `${assetId}/`;

    for (const relativePath of data.paths) {
      if (relativePath.includes('..') || relativePath.startsWith('/')) {
        throw new AppError(`Invalid path: ${relativePath}`, ErrorCodes.VALIDATION_ERROR, 400);
      }
    }

    // Sign all paths in parallel — sequential getSignedUrl calls for a
    // 5-minute video produce ~225 segments × ~5ms each = >1s of needless
    // serialised RTT before the encoder can start uploading anything.
    const results = await Promise.all(
      data.paths.map(async (relativePath) => {
        const fileKey = `${prefix}${relativePath}`;
        const contentType = contentTypeFor(relativePath, data.contentTypeByExtension);
        const url = await generateUploadPresignedUrl(fileKey, config.bucketVideos, contentType);
        return { relativePath, fileKey, url };
      })
    );

    const urls: Record<string, string> = {};
    const keysByPath: Record<string, string> = {};
    for (const { relativePath, fileKey, url } of results) {
      urls[relativePath] = url;
      keysByPath[relativePath] = fileKey;
    }

    return { urls, keys: keysByPath };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to presign HLS uploads',
      ErrorCodes.ASSET_UPDATE_FAILED,
      500
    );
  }
}

export async function finalizeHlsAssetService(
  orgId: string,
  assetId: string,
  profileId: string,
  data: TFinalizeHlsAsset
) {
  try {
    const asset = assertAssetExists(await getAssetById(assetId, orgId));
    if (asset.status !== 'processing') {
      throw new AppError('Asset is not in processing state', ErrorCodes.VALIDATION_ERROR, 409);
    }

    const config = getStorageConfig();
    const prefix = `${assetId}/`;
    if (!data.manifestKey.startsWith(prefix)) {
      throw new AppError('Manifest key must live under the asset prefix', ErrorCodes.VALIDATION_ERROR, 400);
    }

    if (data.audioKey && !data.audioKey.startsWith(prefix)) {
      throw new AppError('Audio key must live under the asset prefix', ErrorCodes.VALIDATION_ERROR, 400);
    }

    // Thumbnails come pre-uploaded via /media/image, which returns absolute
    // URLs. We persist them as-is rather than treating them as storage keys.
    const thumbnailUrl = data.thumbnailUrl ?? asset.thumbnailUrl ?? null;
    const thumbnailCandidates = data.thumbnailCandidateUrls?.length
      ? data.thumbnailCandidateUrls
      : (asset.thumbnailCandidates ?? []);

    const hls1080Status: THls1080Status = data.hls1080Status ?? 'none';
    const metadata = {
      ...(typeof asset.metadata === 'object' && asset.metadata !== null && !Array.isArray(asset.metadata)
        ? asset.metadata
        : {}),
      videoCodec: data.videoCodec ?? null,
      audioCodec: data.audioCodec ?? null,
      format: 'hls',
      ...(data.sourceWidth != null ? { sourceWidth: data.sourceWidth } : {}),
      ...(data.sourceHeight != null ? { sourceHeight: data.sourceHeight } : {}),
      ...(data.hlsRenditions?.length ? { hlsRenditions: data.hlsRenditions } : {}),
      hls1080Status
    };

    const updated = await finalizeHlsAssetQuery(assetId, orgId, {
      manifestKey: data.manifestKey,
      audioKey: data.audioKey ?? null,
      durationSeconds: data.durationSeconds != null ? Math.round(data.durationSeconds) : null,
      aspectRatio: data.aspectRatio ?? null,
      byteSize: data.byteSize,
      thumbnailUrl,
      thumbnailCandidates,
      metadata
    });

    const finalized = assertAssetExists(updated);

    if (data.audioKey && process.env.OPENAI_API_KEY) {
      void enqueueAudioTranscriptionForAsset({
        organizationId: orgId,
        assetId,
        audioKey: data.audioKey,
        triggeredByProfileId: profileId
      });
    }

    return finalized;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to finalize HLS asset',
      ErrorCodes.ASSET_UPDATE_FAILED,
      500
    );
  }
}

type HlsAssetMetadata = {
  sourceWidth?: number;
  sourceHeight?: number;
  hlsRenditions?: string[];
  hls1080Status?: THls1080Status;
  format?: string;
};

function readHlsAssetMetadata(asset: { metadata: unknown }): HlsAssetMetadata {
  if (typeof asset.metadata !== 'object' || asset.metadata === null || Array.isArray(asset.metadata)) {
    return {};
  }

  return asset.metadata as HlsAssetMetadata;
}

function isAllowedHls1080Path(relativePath: string): boolean {
  if (relativePath === 'master.m3u8') return true;
  if (!relativePath.startsWith('p1080/')) return false;
  if (relativePath.includes('..') || relativePath.startsWith('/')) return false;

  return true;
}

function assertHls1080Eligible(
  asset: Awaited<ReturnType<typeof getAssetById>>,
  options?: { probeSourceHeight?: number }
) {
  const resolved = assertAssetExists(asset);
  if (!resolved.hlsManifestKey) {
    throw new AppError('Asset has no HLS manifest', ErrorCodes.VALIDATION_ERROR, 400);
  }

  if (resolved.status !== 'active') {
    throw new AppError('Asset must be active', ErrorCodes.VALIDATION_ERROR, 409);
  }

  const metadata = readHlsAssetMetadata(resolved);
  const renditions = metadata.hlsRenditions ?? [];
  if (renditions.includes('p1080')) {
    throw new AppError('1080p rendition already exists', ErrorCodes.VALIDATION_ERROR, 409);
  }

  const storedSourceHeight = metadata.sourceHeight;
  const effectiveSourceHeight = options?.probeSourceHeight ?? storedSourceHeight;
  if (effectiveSourceHeight == null) {
    return { asset: resolved, metadata, sourceHeightKnown: false as const };
  }

  if (effectiveSourceHeight < 1080) {
    throw new AppError('Source video does not support 1080p', ErrorCodes.VALIDATION_ERROR, 400);
  }

  return { asset: resolved, metadata, sourceHeightKnown: true as const };
}

/**
 * Presign PUT URLs for a manual p1080 rendition on an active HLS asset.
 * Only paths under `p1080/` and the root `master.m3u8` are accepted.
 */
export async function batchPresignHls1080Service(orgId: string, assetId: string, data: TBatchPresignHls1080) {
  try {
    const asset = await getAssetById(assetId, orgId);
    assertHls1080Eligible(asset);

    for (const relativePath of data.paths) {
      if (!isAllowedHls1080Path(relativePath)) {
        throw new AppError(`Invalid 1080p path: ${relativePath}`, ErrorCodes.VALIDATION_ERROR, 400);
      }
    }

    return await batchPresignHlsService(orgId, assetId, data, { allowActive: true });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to presign 1080p HLS uploads',
      ErrorCodes.ASSET_UPDATE_FAILED,
      500
    );
  }
}

async function readHlsManifestBody(bucket: string, key: string): Promise<string> {
  const { GetObjectCommand } = await import('@aws-sdk/client-s3');
  const client = getS3Client();
  const response = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const body = await response.Body?.transformToString('utf-8');
  if (!body) {
    throw new AppError('HLS manifest is empty', ErrorCodes.VALIDATION_ERROR, 400);
  }

  return body;
}

/**
 * Finalize a browser-generated p1080 rendition: verify the master manifest
 * references `p1080/playlist.m3u8`, then persist rendition metadata.
 */
export async function finalizeHls1080Service(orgId: string, assetId: string, data: TFinalizeHls1080) {
  try {
    const asset = await getAssetById(assetId, orgId);
    const eligibility = assertHls1080Eligible(asset, { probeSourceHeight: data.sourceHeight });
    const { asset: resolved, metadata } = eligibility;

    if (!eligibility.sourceHeightKnown) {
      if (data.sourceHeight == null) {
        throw new AppError(
          'Source resolution is unknown for this asset — select the original video file to verify 1080p support',
          ErrorCodes.VALIDATION_ERROR,
          400
        );
      }

      if (data.sourceHeight < 1080) {
        throw new AppError('Source video does not support 1080p', ErrorCodes.VALIDATION_ERROR, 400);
      }
    }

    const config = getStorageConfig();
    const manifestKey = resolved.hlsManifestKey!;
    const manifestBody = await readHlsManifestBody(config.bucketVideos, manifestKey);
    if (!manifestBody.includes('p1080/playlist.m3u8')) {
      throw new AppError('Master manifest does not include 1080p rendition', ErrorCodes.VALIDATION_ERROR, 400);
    }

    const renditions = [...(metadata.hlsRenditions ?? [])];
    if (!renditions.includes('p1080')) {
      renditions.push('p1080');
    }

    const mergedMetadata = {
      ...(typeof resolved.metadata === 'object' && resolved.metadata !== null && !Array.isArray(resolved.metadata)
        ? resolved.metadata
        : {}),
      ...(metadata.sourceWidth == null && data.sourceWidth != null ? { sourceWidth: data.sourceWidth } : {}),
      ...(metadata.sourceHeight == null && data.sourceHeight != null ? { sourceHeight: data.sourceHeight } : {}),
      hlsRenditions: renditions,
      hls1080Status: 'ready' as const
    };

    const updated = await finalizeHls1080Rendition(assetId, orgId, {
      byteSize: (resolved.byteSize ?? 0) + data.additionalByteSize,
      metadata: mergedMetadata
    });

    return assertAssetExists(updated);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to finalize 1080p HLS rendition',
      ErrorCodes.ASSET_UPDATE_FAILED,
      500
    );
  }
}

/**
 * HLS assets ship audio as a separate `audio.m4a` already extracted by
 * Mediabunny in the browser. The existing transcription pipeline accepts
 * any media key in the videos bucket — its extract-audio leg is a no-op
 * on input that's already audio.
 */
async function enqueueAudioTranscriptionForAsset(input: {
  organizationId: string;
  assetId: string;
  audioKey: string;
  triggeredByProfileId: string;
}): Promise<void> {
  try {
    const { startTranscriptionOnlyMediaJob } = await import('../jobs/media-jobs');
    await startTranscriptionOnlyMediaJob({
      organizationId: input.organizationId,
      assetId: input.assetId,
      triggeredByProfileId: input.triggeredByProfileId
    });
  } catch (error) {
    console.error('enqueueAudioTranscriptionForAsset failed:', error);
  }
}

export async function getYouTubeMetadataService(_orgId: string, query: TYouTubeMetadataQuery) {
  const videoId = extractYouTubeVideoId(query.url);
  if (!videoId) {
    throw new AppError('Invalid YouTube URL', ErrorCodes.VALIDATION_ERROR, 400, 'url');
  }

  const sourceUrl = `https://www.youtube.com/watch?v=${videoId}`;

  try {
    const [oembed, watchPageMetadata] = await Promise.all([
      fetchYouTubeOEmbed(sourceUrl),
      fetchYouTubeWatchPageMetadata(videoId)
    ]);

    return {
      videoId,
      sourceUrl,
      title: oembed.title ?? watchPageMetadata.title ?? 'YouTube video',
      durationSeconds: watchPageMetadata.durationSeconds,
      thumbnailUrl:
        oembed.thumbnailUrl ?? watchPageMetadata.thumbnailUrl ?? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
    };
  } catch (error) {
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to fetch YouTube metadata',
      ErrorCodes.ASSET_FETCH_FAILED,
      500
    );
  }
}
