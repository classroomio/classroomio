import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';
import { useSyncExternalStore } from 'react';

import { SYNC_DATABASE_NAME, SYNCED_RETENTION_MS } from '@/feature/offline/constants/sync';
import type {
  LessonCompleteInput,
  PlaybackPositionInput,
  SyncEntry,
  SyncIntentPayload,
  SyncStatus
} from '@/feature/offline/types/sync';

type IntentRow = {
  seq: number;
  key: string;
  user_id: string;
  org_id: string;
  course_id: string;
  lesson_id: string;
  type: SyncEntry['type'];
  payload: string;
  lesson_title: string | null;
  course_title: string | null;
  created_at: number;
  status: SyncStatus | null;
  attempts: number | null;
  next_attempt_at: number | null;
  error: string | null;
  retryable: number | null;
};

export type SyncStateUpdate = Pick<SyncEntry, 'key' | 'status' | 'attempts' | 'nextAttemptAt' | 'error' | 'retryable'>;

let database: SQLiteDatabase | null = null;
let currentUserId: string | null = null;
let entries: SyncEntry[] = [];
let keyCounter = 0;
const listeners = new Set<() => void>();

function db() {
  if (database) return database;

  database = openDatabaseSync(SYNC_DATABASE_NAME);
  database.execSync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS sync_intent (
      seq INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      user_id TEXT NOT NULL,
      org_id TEXT NOT NULL,
      course_id TEXT NOT NULL,
      lesson_id TEXT NOT NULL,
      type TEXT NOT NULL,
      payload TEXT NOT NULL,
      lesson_title TEXT,
      course_title TEXT,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS sync_intent_user ON sync_intent (user_id, seq);
    CREATE TABLE IF NOT EXISTS sync_state (
      key TEXT PRIMARY KEY NOT NULL,
      status TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      next_attempt_at INTEGER NOT NULL DEFAULT 0,
      error TEXT,
      retryable INTEGER NOT NULL DEFAULT 1,
      updated_at INTEGER NOT NULL
    );
  `);

  return database;
}

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function entryOf(row: IntentRow): SyncEntry {
  return {
    seq: row.seq,
    key: row.key,
    userId: row.user_id,
    orgId: row.org_id,
    courseId: row.course_id,
    lessonId: row.lesson_id,
    type: row.type,
    payload: JSON.parse(row.payload) as SyncIntentPayload,
    lessonTitle: row.lesson_title,
    courseTitle: row.course_title,
    createdAt: row.created_at,
    status: row.status ?? 'queued',
    attempts: row.attempts ?? 0,
    nextAttemptAt: row.next_attempt_at ?? 0,
    error: row.error,
    retryable: (row.retryable ?? 1) === 1
  };
}

function newKey(userId: string) {
  keyCounter += 1;

  return `${userId.slice(0, 8)}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}-${keyCounter}`;
}

/** Loads the signed-in user's queue into memory; syncing entries left by a closed app go back to queued. */
export async function loadSyncQueue(userId: string | null) {
  currentUserId = userId;
  if (!userId) {
    entries = [];
    emit();
    return;
  }

  const connection = db();
  const cutoff = Date.now() - SYNCED_RETENTION_MS;
  await connection.runAsync(
    `DELETE FROM sync_state WHERE status = 'synced' AND updated_at < ? AND key IN (SELECT key FROM sync_intent WHERE user_id = ?)`,
    cutoff,
    userId
  );
  await connection.runAsync(
    `DELETE FROM sync_intent WHERE user_id = ? AND key NOT IN (SELECT key FROM sync_state)`,
    userId
  );
  await connection.runAsync(`UPDATE sync_state SET status = 'queued' WHERE status = 'syncing'`);
  const rows = await connection.getAllAsync<IntentRow>(
    `SELECT i.*, s.status, s.attempts, s.next_attempt_at, s.error, s.retryable
     FROM sync_intent i LEFT JOIN sync_state s ON s.key = i.key
     WHERE i.user_id = ? AND (s.status IS NOT NULL)
     ORDER BY i.seq ASC`,
    userId
  );
  if (currentUserId !== userId) return;

  entries = rows.map(entryOf);
  emit();
}

async function append(input: LessonCompleteInput, payload: SyncIntentPayload) {
  const now = Date.now();
  const connection = db();
  const result = await connection.runAsync(
    `INSERT INTO sync_intent (key, user_id, org_id, course_id, lesson_id, type, payload, lesson_title, course_title, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    payload.key,
    input.userId,
    input.orgId,
    input.courseId,
    input.lessonId,
    payload.type,
    JSON.stringify(payload),
    input.lessonTitle,
    input.courseTitle,
    now
  );
  await connection.runAsync(
    `INSERT INTO sync_state (key, status, attempts, next_attempt_at, retryable, updated_at) VALUES (?, 'queued', 0, 0, 1, ?)`,
    payload.key,
    now
  );

  if (currentUserId !== input.userId) return;

  entries = [
    ...entries,
    {
      seq: result.lastInsertRowId,
      key: payload.key,
      userId: input.userId,
      orgId: input.orgId,
      courseId: input.courseId,
      lessonId: input.lessonId,
      type: payload.type,
      payload,
      lessonTitle: input.lessonTitle,
      courseTitle: input.courseTitle,
      createdAt: now,
      status: 'queued',
      attempts: 0,
      nextAttemptAt: 0,
      error: null,
      retryable: true
    }
  ];
  emit();
}

export function queueLessonCompletion(input: LessonCompleteInput) {
  const payload: SyncIntentPayload = {
    key: newKey(input.userId),
    type: 'lesson.complete',
    lessonId: input.lessonId,
    recordedAt: new Date().toISOString()
  };

  return append(input, payload);
}

export function queuePlaybackPosition(input: PlaybackPositionInput) {
  const payload: SyncIntentPayload = {
    key: newKey(input.userId),
    type: 'playback.position',
    lessonId: input.lessonId,
    assetId: input.assetId,
    positionSeconds: Math.max(0, Math.floor(input.positionSeconds)),
    playedDeltaSeconds: Math.min(120, Math.max(0, Math.round(input.playedDeltaSeconds))),
    durationSeconds: Math.max(1, Math.round(input.durationSeconds)),
    recordedAt: new Date().toISOString()
  };

  return append(input, payload);
}

export async function updateSyncStates(updates: SyncStateUpdate[]) {
  if (updates.length === 0) return;

  const now = Date.now();
  const connection = db();
  await connection.withTransactionAsync(async () => {
    for (const update of updates) {
      await connection.runAsync(
        `UPDATE sync_state SET status = ?, attempts = ?, next_attempt_at = ?, error = ?, retryable = ?, updated_at = ? WHERE key = ?`,
        update.status,
        update.attempts,
        update.nextAttemptAt,
        update.error,
        update.retryable ? 1 : 0,
        now,
        update.key
      );
    }
  });

  const byKey = new Map(updates.map((update) => [update.key, update]));
  entries = entries.map((entry) => {
    const update = byKey.get(entry.key);

    return update ? { ...entry, ...update } : entry;
  });
  emit();
}

export async function clearSyncQueue(userId: string) {
  const connection = db();
  await connection.runAsync(
    `DELETE FROM sync_state WHERE key IN (SELECT key FROM sync_intent WHERE user_id = ?)`,
    userId
  );
  await connection.runAsync(`DELETE FROM sync_intent WHERE user_id = ?`, userId);

  if (currentUserId === userId) {
    entries = [];
    emit();
  }
}

export function getSyncEntries() {
  return entries;
}

export function subscribeSyncEntries(listener: () => void) {
  return subscribe(listener);
}

export function useSyncEntries() {
  return useSyncExternalStore(subscribe, getSyncEntries);
}

function isUnsynced(entry: SyncEntry) {
  return entry.status !== 'synced' && !(entry.status === 'failed' && !entry.retryable);
}

/** True while a completion for this lesson is saved on the device and not yet accepted by the server. */
export function useCompletionPending(lessonId: string) {
  return useSyncExternalStore(subscribe, () =>
    entries.some((entry) => entry.lessonId === lessonId && entry.type === 'lesson.complete' && isUnsynced(entry))
  );
}

export function useUnsyncedCount() {
  return useSyncExternalStore(subscribe, () => entries.filter(isUnsynced).length);
}
