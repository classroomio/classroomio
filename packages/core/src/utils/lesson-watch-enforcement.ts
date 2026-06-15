type LessonVideo = {
  type: string;
  assetId?: string | null;
  watchEnforced?: boolean | null;
  link?: string;
  metadata?: Record<string, unknown> | null;
};

function isHlsUploadVideo(video: LessonVideo): boolean {
  if (video.type !== 'upload') return false;

  const metadata = video.metadata;
  if (metadata && typeof metadata === 'object' && metadata.hls === true) return true;

  return typeof video.link === 'string' && video.link.includes('/hls/') && video.link.endsWith('.m3u8');
}

export function isEnforceableLessonVideo(video: LessonVideo): boolean {
  return video.type === 'upload' && Boolean(video.assetId);
}

export function isEnforceableLessonVideoIncludingHls(video: LessonVideo): boolean {
  return isEnforceableLessonVideo(video) || isHlsUploadVideo(video);
}

export function resolveWatchEnforcedAssetIds(
  videos: LessonVideo[] | null | undefined,
  completionPolicy: string | null | undefined
): string[] {
  const lessonVideos = videos ?? [];
  const flaggedAssetIds = lessonVideos
    .filter((video) => video.watchEnforced && video.assetId && isEnforceableLessonVideoIncludingHls(video))
    .map((video) => video.assetId as string);

  if (flaggedAssetIds.length > 0) {
    return Array.from(new Set(flaggedAssetIds));
  }

  if (completionPolicy !== 'video_watch') {
    return [];
  }

  return Array.from(
    new Set(
      lessonVideos
        .filter((video) => video.assetId && isEnforceableLessonVideoIncludingHls(video))
        .map((video) => video.assetId as string)
    )
  );
}
