import { AppError, ErrorCodes } from '@api/utils/errors';
import type {
  TAssetAttach,
  TAssetCreateUpload,
  TAssetDetach,
  TAssetExportQuery,
  TAssetListQuery,
  TAssetStorageQuery,
  TAssetUpdate,
  TYouTubeMetadataQuery
} from '@cio/utils/validation/assets';
import {
  countAssetUsagesByAsset,
  createAssetUsage,
  createOrGetAssetByStorageKey,
  deleteAsset,
  deleteAssetUsage,
  getAssetById,
  getAssetStorageSummaryByOrg,
  listAssetsByOrg,
  listAssetsForExport,
  listAssetUsagesByAsset,
  updateAsset
} from '@cio/db/queries/assets';

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
    return await createOrGetAssetByStorageKey({
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
  } catch (error) {
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to create asset',
      ErrorCodes.ASSET_CREATE_FAILED,
      500
    );
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
