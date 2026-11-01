import { ContentType } from '@cio/utils/constants/content';
import { flattenNavigableItems } from '@cio/utils/functions/course-progression';
import { lessonHtmlImageUrls, offlineImageKey, offlineMediaKey } from '@cio/utils/functions/offline-media';
import { isValidVimeoUrl } from '@cio/utils/functions/vimeo';
import { isValidYoutubeUrl } from '@cio/utils/functions/youtube';
import type { TTranscriptResponse } from '@cio/utils/validation/media';
import {
  getTranscriptForOrganizationAssetService,
  HLS_PLAYBACK_TOKEN_TTL_SECONDS,
  mintHlsToken
} from '@cio/core/services/assets/assets';
import { getCourse } from '@cio/core/services/course/course';
import { getAssetsByIds } from '@cio/db/queries/assets/assets';
import { describeOfflineVideo } from '@api/services/assets/offline-video';
import { getLesson, getLessonWatchProgressService } from '@cio/core/services/lesson/lesson';
import { releaseLessonRecordingsForViewer } from '@api/services/lesson/recording';
import { AppError, ErrorCodes } from '@api/utils/errors';
import { recordOfflineIssue } from '@api/utils/redis/offline-issue';

/** Presigned links are cached for up to 50 minutes of their 60, so at least this much validity is left when issued. */
const PRESIGNED_LINK_MIN_VALIDITY_SECONDS = 10 * 60;
const HLS_LINK = /^\/?hls\/([^/]+)\//;
const PROGRESSIVE_MEDIA = /\.(mp4|m4v|mov|webm|mp3|m4a|aac|wav)(\?|#|$)/i;

export type OfflineMediaKind = 'video' | 'audio' | 'document' | 'image';

export type OfflineMediaItem = {
  /** Matches `offlineMediaKey` / `offlineImageKey` for the source in the lesson payload. */
  key: string;
  kind: OfflineMediaKind;
  assetId: string | null;
  title: string;
  /** Absolute URL, or a path on this API for HLS videos. */
  url: string;
  mimeType: string | null;
  sizeBytes: number | null;
  sizeEstimated: boolean;
  expiresAt: string;
};

export type OnlineOnlyKind = 'embed' | 'slides' | 'live_session' | 'exercise';

export type OnlineOnlyItem = { kind: OnlineOnlyKind; title: string; provider: string | null };

export type OfflineTranscript = { assetId: string; transcript: TTranscriptResponse };

type StoredLesson = Awaited<ReturnType<typeof getLesson>>;
type StoredVideo = NonNullable<StoredLesson['videos']>[number];
type Asset = Awaited<ReturnType<typeof getAssetsByIds>>[number];

function videoMetadata(video: StoredVideo) {
  return (video.metadata ?? {}) as { hls?: boolean; svid?: string; title?: string; duration?: number };
}

function embedProviderOf(video: StoredVideo): string | null {
  if (video.type === 'youtube' || (video.type === 'generic' && isValidYoutubeUrl(video.link))) return 'youtube';
  if (video.type === 'vimeo' || (video.type === 'generic' && isValidVimeoUrl(video.link))) return 'vimeo';
  if (video.type === 'google_drive') return 'google_drive';
  if (videoMetadata(video).svid) return 'muse';
  if (video.type === 'generic' && !PROGRESSIVE_MEDIA.test(video.link)) return 'link';

  return null;
}

function hlsAssetIdOf(video: StoredVideo) {
  const match = video.link.match(HLS_LINK);
  if (match?.[1]) return match[1];

  return videoMetadata(video).hls && video.assetId ? video.assetId : null;
}

function videoTitle(video: StoredVideo, index: number) {
  return videoMetadata(video).title || video.fileName || `Video ${index + 1}`;
}

function lessonHtmlBodies(lesson: StoredLesson) {
  return [lesson.note, ...(lesson.lessonLanguages ?? []).map((entry) => entry.content)].filter((html): html is string =>
    Boolean(html)
  );
}

type ManifestContext = {
  orgId: string | null;
  assetsById: Map<string, Asset>;
  presignedExpiresAt: string;
  tokens: Map<string, Promise<string | null>>;
};

async function hlsTokenFor(context: ManifestContext, assetId: string) {
  let pending = context.tokens.get(assetId);
  if (!pending) {
    pending = mintHlsToken(assetId, HLS_PLAYBACK_TOKEN_TTL_SECONDS)
      .then(({ token }) => token)
      .catch(() => null);
    context.tokens.set(assetId, pending);
  }

  return pending;
}

async function videoItem(
  context: ManifestContext,
  video: StoredVideo,
  index: number
): Promise<OfflineMediaItem | null> {
  const asset = video.assetId ? context.assetsById.get(video.assetId) : undefined;
  const kind: OfflineMediaKind = asset?.kind === 'audio' ? 'audio' : 'video';
  const title = videoTitle(video, index);
  const hlsAssetId = hlsAssetIdOf(video);

  if (hlsAssetId) {
    const hlsAsset = context.assetsById.get(hlsAssetId);
    if (!hlsAsset?.hlsManifestKey || hlsAsset.organizationId !== context.orgId) return null;

    const token = await hlsTokenFor(context, hlsAssetId);
    if (!token) return null;

    const durationSeconds = hlsAsset.durationSeconds ?? videoMetadata(video).duration ?? null;
    const rendition = await describeOfflineVideo(hlsAsset, durationSeconds);
    const query = new URLSearchParams({ t: token });
    if (rendition) query.set('rendition', rendition.rendition);

    return {
      key: offlineMediaKey({ assetId: hlsAssetId, link: video.link }),
      kind,
      assetId: hlsAssetId,
      title,
      url: `/hls/${hlsAssetId}/offline.mp4?${query.toString()}`,
      mimeType: 'video/mp4',
      sizeBytes: rendition?.estimatedBytes ?? null,
      sizeEstimated: true,
      expiresAt: new Date(Date.now() + HLS_PLAYBACK_TOKEN_TTL_SECONDS * 1000).toISOString()
    };
  }

  if (!/^https?:\/\//i.test(video.link)) return null;

  return {
    key: offlineMediaKey(video),
    kind,
    assetId: video.assetId ?? null,
    title,
    url: video.link,
    mimeType: asset?.mimeType ?? null,
    sizeBytes: asset?.byteSize ?? null,
    sizeEstimated: false,
    expiresAt: context.presignedExpiresAt
  };
}

async function transcriptsFor(context: ManifestContext, assetIds: string[]): Promise<OfflineTranscript[]> {
  const orgId = context.orgId;
  if (!orgId) return [];

  const entries = await Promise.all(
    assetIds.map(async (assetId) => {
      const transcript = await getTranscriptForOrganizationAssetService(orgId, assetId).catch(() => null);

      return transcript ? { assetId, transcript } : null;
    })
  );

  return entries.filter((entry): entry is OfflineTranscript => entry !== null);
}

async function describeLesson(context: ManifestContext, lesson: StoredLesson) {
  const media: OfflineMediaItem[] = [];
  const onlineOnly: OnlineOnlyItem[] = [];
  const transcriptAssetIds = new Set<string>();

  for (const [index, video] of (lesson.videos ?? []).entries()) {
    const provider = embedProviderOf(video);
    if (video.assetId && (provider === 'youtube' || !provider)) transcriptAssetIds.add(video.assetId);

    if (provider) {
      onlineOnly.push({ kind: 'embed', title: videoTitle(video, index), provider });
      continue;
    }

    const item = await videoItem(context, video, index);
    if (item) media.push(item);
    else onlineOnly.push({ kind: 'embed', title: videoTitle(video, index), provider: null });
  }

  for (const document of lesson.documents ?? []) {
    if (!/^https?:\/\//i.test(document.link)) continue;

    media.push({
      key: offlineMediaKey(document),
      kind: 'document',
      assetId: document.assetId ?? null,
      title: document.name,
      url: document.link,
      mimeType: document.assetId ? (context.assetsById.get(document.assetId)?.mimeType ?? null) : null,
      sizeBytes: document.size ?? null,
      sizeEstimated: false,
      expiresAt: context.presignedExpiresAt
    });
  }

  const imageUrls = new Set(lessonHtmlBodies(lesson).flatMap((html) => lessonHtmlImageUrls(html)));
  for (const url of imageUrls) {
    media.push({
      key: offlineImageKey(url),
      kind: 'image',
      assetId: null,
      title: url.split('/').pop()?.split('?')[0] || 'Image',
      url,
      mimeType: null,
      sizeBytes: null,
      sizeEstimated: false,
      expiresAt: context.presignedExpiresAt
    });
  }

  const slideCount = (lesson.slides ?? []).length + (lesson.slideUrl?.trim() ? 1 : 0);
  if (slideCount > 0) onlineOnly.push({ kind: 'slides', title: 'Slides', provider: null });
  if (lesson.callUrl) onlineOnly.push({ kind: 'live_session', title: 'Live session', provider: null });

  const transcripts = await transcriptsFor(context, [...transcriptAssetIds]);
  const sizeBytes = media.reduce((total, item) => total + (item.sizeBytes ?? 0), 0);
  const sizeComplete = media.every((item) => item.sizeBytes !== null);

  return { media, onlineOnly, transcripts, sizeBytes, sizeComplete };
}

function assetIdsOf(lessons: StoredLesson[]) {
  const ids = new Set<string>();
  for (const lesson of lessons) {
    for (const video of lesson.videos ?? []) {
      if (video.assetId) ids.add(video.assetId);
      const hlsAssetId = hlsAssetIdOf(video);
      if (hlsAssetId) ids.add(hlsAssetId);
    }
    for (const document of lesson.documents ?? []) {
      if (document.assetId) ids.add(document.assetId);
    }
  }

  return [...ids];
}

/**
 * Everything the app needs to download a course, or one lesson of it, for offline use. Content locking follows the
 * course endpoint: a locked lesson is listed with no payload, exactly as the lesson endpoint would refuse it. Lesson
 * payloads match `GET /course/:courseId/lesson/:lessonId`; media links are short-lived and must be fetched promptly.
 */
export async function getCourseOfflineManifest(courseId: string, profileId: string, lessonId?: string) {
  const course = await getCourse(courseId, undefined, profileId);
  const items = flattenNavigableItems(course.content);
  const lessonItems = items.filter((item) => item.type === ContentType.Lesson && (!lessonId || item.id === lessonId));
  if (lessonId && lessonItems.length === 0) {
    throw new AppError('Lesson not found', ErrorCodes.LESSON_NOT_FOUND, 404);
  }

  const openItems = lessonItems.filter((item) => item.accessible !== false);
  void recordOfflineIssue(
    profileId,
    openItems.map((item) => item.id)
  );
  const storedLessons = await Promise.all(openItems.map((item) => getLesson(item.id)));
  const [releasedLessons, watchProgress, assets] = await Promise.all([
    releaseLessonRecordingsForViewer(courseId, profileId, storedLessons),
    Promise.all(openItems.map((item) => getLessonWatchProgressService(item.id, profileId))),
    getAssetsByIds(assetIdsOf(storedLessons))
  ]);

  const context: ManifestContext = {
    orgId: 'org' in course && course.org ? course.org.id : null,
    assetsById: new Map(assets.map((asset) => [asset.id, asset])),
    presignedExpiresAt: new Date(Date.now() + PRESIGNED_LINK_MIN_VALIDITY_SECONDS * 1000).toISOString(),
    tokens: new Map()
  };

  const openLessons = await Promise.all(
    releasedLessons.map(async (lesson, index) => {
      const details = await describeLesson(context, lesson);

      return { lesson: { ...lesson, watchProgress: watchProgress[index] ?? null }, ...details };
    })
  );
  const openById = new Map(openLessons.map((entry) => [entry.lesson.id, entry]));

  const lessons = lessonItems.map((item) => {
    const open = openById.get(item.id);

    return {
      id: item.id,
      title: item.title,
      position: items.indexOf(item),
      sectionId: item.sectionId,
      locked: !open,
      lockReason: item.lockReason ?? null,
      lesson: open?.lesson ?? null,
      media: open?.media ?? [],
      transcripts: open?.transcripts ?? [],
      onlineOnly: open?.onlineOnly ?? [],
      sizeBytes: open?.sizeBytes ?? 0,
      sizeComplete: open?.sizeComplete ?? true
    };
  });

  const exercises = lessonId
    ? []
    : items
        .filter((item) => item.type === ContentType.Exercise)
        .map((item): OnlineOnlyItem => ({ kind: 'exercise', title: item.title, provider: null }));

  return {
    courseId: course.id,
    title: course.title,
    generatedAt: new Date().toISOString(),
    lessons,
    onlineOnly: exercises
  };
}
