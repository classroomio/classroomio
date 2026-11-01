import { formatVimeoEmbedUrl, isValidVimeoUrl } from '@cio/utils/functions/vimeo';
import { formatYoutubeEmbedUrl, isValidYoutubeUrl } from '@cio/utils/functions/youtube';

import type { LessonVideo, LessonVideoSource } from '@/feature/lesson/types/lesson';

const HLS_LINK = /^\/?hls\/([^/]+)\//;

function metadataOf(video: LessonVideo) {
  return (video.metadata ?? {}) as { hls?: boolean; svid?: string; title?: string; thumbnailUrl?: string };
}

function hlsAssetIdOf(video: LessonVideo) {
  const metadata = metadataOf(video);
  const match = video.link.match(HLS_LINK);
  if (match?.[1]) return match[1];
  if (metadata.hls && video.assetId) return video.assetId;

  return null;
}

/**
 * Resolves how a stored lesson video plays on the device. Returns null when it has no playable source.
 * `fallbackTitle` names an untitled video from its 1-based position.
 */
export function lessonVideoSource(
  video: LessonVideo,
  index: number,
  fallbackTitle: (number: number) => string
): LessonVideoSource | null {
  const metadata = metadataOf(video);
  const title = metadata.title || video.fileName || fallbackTitle(index + 1);
  const poster = metadata.thumbnailUrl ?? null;

  if (video.type === 'youtube' || (video.type === 'generic' && isValidYoutubeUrl(video.link))) {
    return { kind: 'embed', provider: 'youtube', title, link: video.link, uri: formatYoutubeEmbedUrl(video.link) };
  }

  if (video.type === 'vimeo' || (video.type === 'generic' && isValidVimeoUrl(video.link))) {
    return { kind: 'embed', provider: 'vimeo', title, link: video.link, uri: formatVimeoEmbedUrl(video.link) };
  }

  if (video.type === 'google_drive') {
    return {
      kind: 'embed',
      provider: 'google_drive',
      title,
      link: video.link,
      uri: video.link.replace(/\/view(\?.*)?$/, '/preview')
    };
  }

  if (metadata.svid) {
    return {
      kind: 'embed',
      provider: 'muse',
      title,
      link: `https://muse.ai/v/${metadata.svid}`,
      uri: `https://muse.ai/embed/${metadata.svid}`
    };
  }

  const hlsAssetId = hlsAssetIdOf(video);
  if (hlsAssetId) return { kind: 'hls', assetId: hlsAssetId, title, poster };

  if (/^https?:\/\//i.test(video.link)) {
    return { kind: 'file', uri: video.link, assetId: video.assetId ?? null, title, poster };
  }

  return null;
}

export function lessonVideoSources(
  videos: LessonVideo[] | null | undefined,
  fallbackTitle: (number: number) => string
) {
  return (videos ?? []).flatMap((video, index) => {
    const source = lessonVideoSource(video, index, fallbackTitle);

    return source ? [{ source, video }] : [];
  });
}

/** The asset whose transcript belongs to a video source, when it has one. */
export function transcriptAssetIdOf(source: LessonVideoSource, video: LessonVideo) {
  if (source.kind === 'hls') return source.assetId;
  if (source.kind === 'file') return source.assetId;
  if (source.provider === 'youtube') return video.assetId ?? null;

  return null;
}
