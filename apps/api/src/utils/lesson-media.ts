import { enrichObjectsWithUrls, extractKeysFromObjects } from '@api/utils/presigned-urls';
import { generateDocumentDownloadPresignedUrls, generateVideoDownloadPresignedUrls } from '@api/utils/s3';

import { getAssetsByIds } from '@cio/db/queries/assets';
import type { LessonById } from '@cio/db/queries/lesson';
import type { TLesson } from '@cio/db/types';

// Extract types from schema
type LessonVideo = NonNullable<TLesson['videos']>[number];
type LessonDocument = NonNullable<TLesson['documents']>[number];

function mapProviderToVideoType(provider: string): LessonVideo['type'] {
  if (provider === 'youtube') return 'youtube';
  if (provider === 'generic' || provider === 'external_url') return 'generic';
  return 'upload';
}

function mapAssetMimeTypeToDocumentType(mimeType: string | null, fallbackType: LessonDocument['type']) {
  if (!mimeType) {
    return fallbackType;
  }

  if (mimeType === 'application/pdf') {
    return 'pdf';
  }

  if (mimeType === 'application/msword') {
    return 'doc';
  }

  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return 'docx';
  }

  return fallbackType;
}

function applyCanonicalVideoMetadata(
  videos: LessonVideo[],
  assets: Awaited<ReturnType<typeof getAssetsByIds>>
): LessonVideo[] {
  if (assets.length === 0) {
    return videos;
  }

  const assetsById = new Map(assets.map((asset) => [asset.id, asset]));

  return videos.map((video) => {
    if (!video.assetId) {
      return video;
    }

    const asset = assetsById.get(video.assetId);
    if (!asset) {
      return video;
    }

    const mergedMetadata = {
      ...(video.metadata ?? {}),
      title: asset.title ?? video.metadata?.title,
      description: asset.description ?? video.metadata?.description,
      thumbnailUrl: asset.thumbnailUrl ?? video.metadata?.thumbnailUrl,
      duration: asset.durationSeconds ?? video.metadata?.duration,
      aspectRatio: asset.aspectRatio ?? video.metadata?.aspectRatio
    };

    return {
      ...video,
      type: mapProviderToVideoType(asset.provider),
      key: asset.storageKey ?? video.key,
      link: asset.provider === 'upload' ? video.link : (asset.sourceUrl ?? video.link),
      fileName: asset.title ?? video.fileName,
      metadata: mergedMetadata
    };
  });
}

function applyCanonicalDocumentMetadata(
  documents: LessonDocument[],
  assets: Awaited<ReturnType<typeof getAssetsByIds>>
): LessonDocument[] {
  if (assets.length === 0) {
    return documents;
  }

  const assetsById = new Map(assets.map((asset) => [asset.id, asset]));

  return documents.map((document) => {
    if (!document.assetId) {
      return document;
    }

    const asset = assetsById.get(document.assetId);
    if (!asset) {
      return document;
    }

    return {
      ...document,
      type: mapAssetMimeTypeToDocumentType(asset.mimeType, document.type),
      key: asset.storageKey ?? document.key,
      link: asset.provider === 'upload' ? document.link : (asset.sourceUrl ?? document.link),
      name: asset.title ?? document.name,
      size: asset.byteSize ?? document.size
    };
  });
}

/**
 * Enriches lesson with presigned URLs for videos and documents
 * @param lesson Lesson to enrich
 * @returns Lesson with presigned URLs added
 */
export async function enrichLessonWithPresignedUrls(lesson: LessonById): Promise<LessonById> {
  // videos and documents are jsonb fields from the database, now properly typed
  // Normalize them to arrays safely (handles null/undefined cases)
  const videos = lesson.videos || [];
  const documents = lesson.documents || [];
  const videoAssetIds = videos.map((video) => video.assetId).filter((assetId): assetId is string => Boolean(assetId));
  const documentAssetIds = documents
    .map((document) => document.assetId)
    .filter((assetId): assetId is string => Boolean(assetId));
  const assetIds = Array.from(new Set([...videoAssetIds, ...documentAssetIds]));
  const canonicalAssets = assetIds.length ? await getAssetsByIds(assetIds) : [];
  const canonicalVideos = applyCanonicalVideoMetadata(videos, canonicalAssets);
  const canonicalDocuments = applyCanonicalDocumentMetadata(documents, canonicalAssets);

  const videoKeys = extractKeysFromObjects(canonicalVideos.filter((video) => video.type === 'upload'));
  const docKeys = extractKeysFromObjects(canonicalDocuments);

  // Early return if no keys to process
  if (videoKeys.length === 0 && docKeys.length === 0) {
    return lesson;
  }

  // Generate presigned URLs in parallel
  const [videoUrls, docUrls] = await Promise.all([
    generateVideoDownloadPresignedUrls(videoKeys),
    generateDocumentDownloadPresignedUrls(docKeys)
  ]);

  return {
    ...lesson,
    videos: enrichObjectsWithUrls<LessonVideo>(canonicalVideos, videoUrls),
    documents: enrichObjectsWithUrls<LessonDocument>(canonicalDocuments, docUrls)
  };
}
