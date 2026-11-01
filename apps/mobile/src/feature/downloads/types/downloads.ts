import type { InferResponseType } from '@cio/api/rpc-types';

import type { ApiClient } from '@/feature/common/api/api-client';

type ManifestResponse = Extract<
  InferResponseType<ApiClient['course'][':courseId']['offline-manifest']['$get'], 200>,
  { success: true }
>;

export type OfflineManifest = ManifestResponse['data'];

export type OfflineManifestLesson = OfflineManifest['lessons'][number];

export type OfflineMediaItem = OfflineManifestLesson['media'][number];

export type OnlineOnlyItem = OfflineManifestLesson['onlineOnly'][number];

export type OfflineTranscript = OfflineManifestLesson['transcripts'][number];

/** `waiting` is held back by the connection (offline, or not on Wi-Fi when Wi-Fi only is on). */
export type DownloadStatus = 'queued' | 'waiting' | 'downloading' | 'paused' | 'complete' | 'failed';

export type WaitReason = 'offline' | 'wifi';

/** What the lesson needs at playback time, saved with the download. */
export type StoredLesson = {
  lesson: NonNullable<OfflineManifestLesson['lesson']>;
  transcripts: OfflineTranscript[];
  onlineOnly: OnlineOnlyItem[];
  media: Pick<OfflineMediaItem, 'key' | 'kind' | 'title' | 'mimeType'>[];
};

export type LessonDownload = {
  courseId: string;
  lessonId: string;
  title: string;
  position: number;
  status: DownloadStatus;
  bytes: number;
  expectedBytes: number;
  error: string | null;
};

export type CourseDownload = {
  courseId: string;
  orgId: string;
  title: string;
  createdAt: number;
  status: DownloadStatus;
  waitReason: WaitReason | null;
  lessons: LessonDownload[];
  bytes: number;
  expectedBytes: number;
};

export type DownloadPlan = {
  courseId: string;
  title: string;
  lessons: OfflineManifestLesson[];
  sizeBytes: number;
  sizeComplete: boolean;
  lockedCount: number;
  onlineOnlyCount: number;
};

export type DownloadSettings = { wifiOnly: boolean; autoDownloadRequired: boolean };
