import type { InferResponseType } from '@cio/api/rpc-types';

import type { ApiClient } from '@/feature/common/api/api-client';

type LessonEndpoint = ApiClient['course'][':courseId']['lesson'][':lessonId'];

type Success<T> = Extract<T, { success: true }>;

export type Lesson = Success<InferResponseType<LessonEndpoint['$get'], 200>>['data'];

export type LessonVideo = NonNullable<Lesson['videos']>[number];

export type LessonDocument = NonNullable<Lesson['documents']>[number];

export type LessonSlide = NonNullable<Lesson['slides']>[number];

export type LessonWatchProgress = NonNullable<Lesson['watchProgress']>;

export type WatchProgressUpdate = Success<InferResponseType<LessonEndpoint['watch-progress']['$put'], 200>>['data'];

export type AssetTranscript = NonNullable<
  Success<InferResponseType<ApiClient['organization']['assets'][':assetId']['transcript']['$get'], 200>>['data']
>;

export type TranscriptSegment = AssetTranscript['segments'][number];

export type HlsPlaybackToken = Success<
  InferResponseType<ApiClient['hls'][':assetId']['playback-token']['$get'], 200>
>['data'];

/** How a lesson video plays: natively through expo-video or inside a web embed. */
export type LessonVideoSource =
  | { kind: 'hls'; assetId: string; title: string; poster: string | null }
  | { kind: 'file'; uri: string; assetId: string | null; title: string; poster: string | null }
  | { kind: 'embed'; uri: string; link: string; title: string; provider: EmbedProvider };

export type EmbedProvider = 'youtube' | 'vimeo' | 'google_drive' | 'muse';

export type SlidePlatform = LessonSlide['platform'];

export type SlideDeck = { id: string; src: string; platform: SlidePlatform | null };
