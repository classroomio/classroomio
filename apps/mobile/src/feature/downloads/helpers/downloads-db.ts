import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';

import { DOWNLOADS_DATABASE_NAME } from '@/feature/downloads/constants/downloads';
import type { DownloadStatus, StoredLesson } from '@/feature/downloads/types/downloads';

export type CourseRow = { course_id: string; org_id: string; title: string; created_at: number };

export type LessonRow = {
  course_id: string;
  lesson_id: string;
  title: string;
  position: number;
  status: DownloadStatus;
  bytes: number;
  expected_bytes: number;
  error: string | null;
};

export type FileRow = { lesson_id: string; media_key: string; kind: string; path: string; bytes: number };

let database: SQLiteDatabase | null = null;

function db() {
  if (database) return database;

  database = openDatabaseSync(DOWNLOADS_DATABASE_NAME);
  database.execSync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS course_download (
      user_id TEXT NOT NULL,
      course_id TEXT NOT NULL,
      org_id TEXT NOT NULL,
      title TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      PRIMARY KEY (user_id, course_id)
    );
    CREATE TABLE IF NOT EXISTS lesson_download (
      user_id TEXT NOT NULL,
      course_id TEXT NOT NULL,
      lesson_id TEXT NOT NULL,
      title TEXT NOT NULL,
      position INTEGER NOT NULL,
      status TEXT NOT NULL,
      bytes INTEGER NOT NULL DEFAULT 0,
      expected_bytes INTEGER NOT NULL DEFAULT 0,
      error TEXT,
      stored TEXT,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (user_id, lesson_id)
    );
    CREATE TABLE IF NOT EXISTS file_download (
      user_id TEXT NOT NULL,
      lesson_id TEXT NOT NULL,
      media_key TEXT NOT NULL,
      kind TEXT NOT NULL,
      path TEXT NOT NULL,
      bytes INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (user_id, lesson_id, media_key)
    );
    CREATE TABLE IF NOT EXISTS file_resume (
      user_id TEXT NOT NULL,
      lesson_id TEXT NOT NULL,
      media_key TEXT NOT NULL,
      state TEXT NOT NULL,
      PRIMARY KEY (user_id, lesson_id, media_key)
    );
  `);

  return database;
}

export async function loadDownloadRows(userId: string) {
  const connection = db();
  await connection.runAsync(
    `UPDATE lesson_download SET status = 'queued' WHERE user_id = ? AND status IN ('downloading', 'waiting')`,
    userId
  );
  const [courses, lessons] = await Promise.all([
    connection.getAllAsync<CourseRow>(
      `SELECT course_id, org_id, title, created_at FROM course_download WHERE user_id = ? ORDER BY created_at ASC`,
      userId
    ),
    connection.getAllAsync<LessonRow>(
      `SELECT course_id, lesson_id, title, position, status, bytes, expected_bytes, error
       FROM lesson_download WHERE user_id = ? ORDER BY position ASC`,
      userId
    )
  ]);

  return { courses, lessons };
}

export async function saveCourseRow(userId: string, row: CourseRow) {
  await db().runAsync(
    `INSERT INTO course_download (user_id, course_id, org_id, title, created_at) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT (user_id, course_id) DO UPDATE SET title = excluded.title, org_id = excluded.org_id`,
    userId,
    row.course_id,
    row.org_id,
    row.title,
    row.created_at
  );
}

export async function saveLessonRow(userId: string, row: LessonRow, stored: StoredLesson | null) {
  await db().runAsync(
    `INSERT INTO lesson_download (user_id, course_id, lesson_id, title, position, status, bytes, expected_bytes, error, stored, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (user_id, lesson_id) DO UPDATE SET
       title = excluded.title, position = excluded.position, status = excluded.status,
       expected_bytes = excluded.expected_bytes, error = NULL, stored = COALESCE(excluded.stored, lesson_download.stored),
       updated_at = excluded.updated_at`,
    userId,
    row.course_id,
    row.lesson_id,
    row.title,
    row.position,
    row.status,
    row.bytes,
    row.expected_bytes,
    row.error,
    stored ? JSON.stringify(stored) : null,
    Date.now()
  );
}

export async function updateLessonRow(
  userId: string,
  lessonId: string,
  patch: Partial<Pick<LessonRow, 'status' | 'bytes' | 'error'>> & { stored?: StoredLesson }
) {
  const sets: string[] = [];
  const values: (string | number | null)[] = [];
  if (patch.status !== undefined) {
    sets.push('status = ?');
    values.push(patch.status);
  }
  if (patch.bytes !== undefined) {
    sets.push('bytes = ?');
    values.push(patch.bytes);
  }
  if (patch.error !== undefined) {
    sets.push('error = ?');
    values.push(patch.error);
  }
  if (patch.stored !== undefined) {
    sets.push('stored = ?');
    values.push(JSON.stringify(patch.stored));
  }
  if (sets.length === 0) return;

  await db().runAsync(
    `UPDATE lesson_download SET ${sets.join(', ')}, updated_at = ? WHERE user_id = ? AND lesson_id = ?`,
    ...values,
    Date.now(),
    userId,
    lessonId
  );
}

export async function readStoredLesson(userId: string, lessonId: string): Promise<StoredLesson | null> {
  const row = await db().getFirstAsync<{ stored: string | null }>(
    `SELECT stored FROM lesson_download WHERE user_id = ? AND lesson_id = ?`,
    userId,
    lessonId
  );

  return row?.stored ? (JSON.parse(row.stored) as StoredLesson) : null;
}

export async function listFileRows(userId: string, lessonId: string) {
  return db().getAllAsync<FileRow>(
    `SELECT lesson_id, media_key, kind, path, bytes FROM file_download WHERE user_id = ? AND lesson_id = ?`,
    userId,
    lessonId
  );
}

export async function saveFileRow(userId: string, row: FileRow) {
  await db().runAsync(
    `INSERT OR REPLACE INTO file_download (user_id, lesson_id, media_key, kind, path, bytes) VALUES (?, ?, ?, ?, ?, ?)`,
    userId,
    row.lesson_id,
    row.media_key,
    row.kind,
    row.path,
    row.bytes
  );
  await db().runAsync(
    `DELETE FROM file_resume WHERE user_id = ? AND lesson_id = ? AND media_key = ?`,
    userId,
    row.lesson_id,
    row.media_key
  );
}

export async function readResumeState(userId: string, lessonId: string, mediaKey: string) {
  const row = await db().getFirstAsync<{ state: string }>(
    `SELECT state FROM file_resume WHERE user_id = ? AND lesson_id = ? AND media_key = ?`,
    userId,
    lessonId,
    mediaKey
  );

  return row?.state ?? null;
}

export async function saveResumeState(userId: string, lessonId: string, mediaKey: string, state: string | null) {
  if (state === null) {
    await db().runAsync(
      `DELETE FROM file_resume WHERE user_id = ? AND lesson_id = ? AND media_key = ?`,
      userId,
      lessonId,
      mediaKey
    );
    return;
  }

  await db().runAsync(
    `INSERT OR REPLACE INTO file_resume (user_id, lesson_id, media_key, state) VALUES (?, ?, ?, ?)`,
    userId,
    lessonId,
    mediaKey,
    state
  );
}

export async function deleteLessonRows(userId: string, lessonIds: string[]) {
  if (lessonIds.length === 0) return;

  const placeholders = lessonIds.map(() => '?').join(', ');
  const connection = db();
  await connection.withTransactionAsync(async () => {
    for (const table of ['lesson_download', 'file_download', 'file_resume']) {
      await connection.runAsync(
        `DELETE FROM ${table} WHERE user_id = ? AND lesson_id IN (${placeholders})`,
        userId,
        ...lessonIds
      );
    }
  });
}

export async function deleteCourseRow(userId: string, courseId: string) {
  await db().runAsync(`DELETE FROM course_download WHERE user_id = ? AND course_id = ?`, userId, courseId);
}

export async function deleteUserRows(userId: string) {
  const connection = db();
  await connection.withTransactionAsync(async () => {
    for (const table of ['course_download', 'lesson_download', 'file_download', 'file_resume']) {
      await connection.runAsync(`DELETE FROM ${table} WHERE user_id = ?`, userId);
    }
  });
}
