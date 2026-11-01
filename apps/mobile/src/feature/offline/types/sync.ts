import type { InferRequestType, InferResponseType } from '@cio/api/rpc-types';

import type { ApiClient } from '@/feature/common/api/api-client';

type SyncEndpoint = ApiClient['course'][':courseId']['sync']['$post'];

export type SyncIntentPayload = InferRequestType<SyncEndpoint>['json']['intents'][number];

export type SyncIntentType = SyncIntentPayload['type'];

export type SyncResponse = Extract<InferResponseType<SyncEndpoint, 200>, { success: true }>['data'];

export type SyncResult = SyncResponse['results'][number];

/** `failed` with `retryable` waits for its next attempt; without it the server refused the change. */
export type SyncStatus = 'queued' | 'syncing' | 'synced' | 'failed';

export type SyncEntry = {
  seq: number;
  key: string;
  userId: string;
  orgId: string;
  courseId: string;
  lessonId: string;
  type: SyncIntentType;
  payload: SyncIntentPayload;
  lessonTitle: string | null;
  courseTitle: string | null;
  createdAt: number;
  status: SyncStatus;
  attempts: number;
  nextAttemptAt: number;
  error: string | null;
  retryable: boolean;
};

export type LessonCompleteInput = {
  userId: string;
  orgId: string;
  courseId: string;
  lessonId: string;
  lessonTitle: string | null;
  courseTitle: string | null;
};

export type PlaybackPositionInput = LessonCompleteInput & {
  assetId: string;
  positionSeconds: number;
  playedDeltaSeconds: number;
  durationSeconds: number;
};
