import { DownloadTask, type File } from 'expo-file-system';
import { addNetworkStateListener, getNetworkStateAsync, NetworkStateType } from 'expo-network';

import type { ApiClient } from '@/feature/common/api/api-client';
import { ApiError } from '@/feature/common/api/request';
import { fetchCourseDetail, fetchOfflineManifest } from '@/feature/downloads/api/offline-manifest';
import { LINK_MIN_REMAINING_MS } from '@/feature/downloads/constants/downloads';
import {
  courseDirectory,
  deleteDirectory,
  deleteFile,
  downloadedFile,
  lessonDirectory,
  mediaRelativePath,
  userDownloadsDirectory
} from '@/feature/downloads/helpers/download-files';
import { getDownloadSettings } from '@/feature/downloads/helpers/download-settings';
import {
  getAllCourseDownloads,
  getCourseDownload,
  patchCourse,
  patchLessons,
  putCourse,
  removeCourseFromStore,
  removeLessonsFromStore,
  reportLessonProgress,
  resetDownloadStore
} from '@/feature/downloads/helpers/download-store';
import {
  deleteCourseRow,
  deleteLessonRows,
  deleteUserRows,
  listFileRows,
  loadDownloadRows,
  readResumeState,
  readStoredLesson,
  saveCourseRow,
  saveFileRow,
  saveLessonRow,
  saveResumeState,
  updateLessonRow
} from '@/feature/downloads/helpers/downloads-db';
import type { OfflineSnapshotWriter } from '@/feature/downloads/helpers/offline-snapshots';
import type {
  DownloadPlan,
  LessonDownload,
  OfflineManifestLesson,
  OfflineMediaItem,
  StoredLesson,
  WaitReason
} from '@/feature/downloads/types/downloads';

type ManagerContext = { api: ApiClient; serverUrl: string; userId: string; snapshots: OfflineSnapshotWriter };

type ActiveTransfer = {
  courseId: string;
  lessonId: string;
  task: DownloadTask;
  stop: 'pause' | 'cancel' | 'connection' | null;
};

type TransferResult =
  | { kind: 'done'; bytes: number }
  | { kind: 'stopped'; reason: NonNullable<ActiveTransfer['stop']> };

class LessonUnavailableError extends Error {}

/** Thrown before the signed-in user's download store has loaded. */
export class DownloadsNotReadyError extends Error {}

class ConnectionLostError extends Error {}

let context: ManagerContext | null = null;
let pumping = false;
let active: ActiveTransfer | null = null;
let networkSubscription: { remove: () => void } | null = null;
const mediaCache = new Map<string, OfflineMediaItem[]>();

function storedOf(entry: OfflineManifestLesson): StoredLesson | null {
  if (!entry.lesson) return null;

  return {
    lesson: entry.lesson,
    transcripts: entry.transcripts,
    onlineOnly: entry.onlineOnly,
    media: entry.media.map(({ key, kind, title, mimeType }) => ({ key, kind, title, mimeType }))
  };
}

function isExpiring(media: OfflineMediaItem[]) {
  return media.some((item) => Date.parse(item.expiresAt) - Date.now() < LINK_MIN_REMAINING_MS);
}

function httpStatusOf(error: unknown) {
  const match = error instanceof Error ? error.message.match(/HTTP (\d{3})|status (\d{3})/) : null;

  return match ? Number(match[1] ?? match[2]) : null;
}

function isConnectionError(error: unknown) {
  if (error instanceof ApiError) return false;
  if (httpStatusOf(error) !== null) return false;

  return (
    error instanceof TypeError ||
    (error instanceof Error && /network|offline|internet|timed out|connection/i.test(error.message))
  );
}

/** Why downloads cannot run right now, or null when they can. */
export async function downloadGate(): Promise<WaitReason | null> {
  const state = await getNetworkStateAsync().catch(() => null);
  if (!state || state.isConnected === false || state.isInternetReachable === false) return 'offline';

  const onWifi = state.type === NetworkStateType.WIFI || state.type === NetworkStateType.ETHERNET;
  if (getDownloadSettings().wifiOnly && !onWifi) return 'wifi';

  return null;
}

async function hydrate(userId: string) {
  const { courses, lessons } = await loadDownloadRows(userId);
  if (context?.userId !== userId) return;

  resetDownloadStore(
    courses.map((course) => ({
      courseId: course.course_id,
      orgId: course.org_id,
      title: course.title,
      createdAt: course.created_at,
      waitReason: null,
      lessons: lessons
        .filter((lesson) => lesson.course_id === course.course_id)
        .map(
          (lesson): LessonDownload => ({
            courseId: lesson.course_id,
            lessonId: lesson.lesson_id,
            title: lesson.title,
            position: lesson.position,
            status: lesson.status,
            bytes: lesson.bytes,
            expectedBytes: lesson.expected_bytes,
            error: lesson.error
          })
        )
    }))
  );
}

function watchNetwork() {
  networkSubscription?.remove();
  networkSubscription = addNetworkStateListener(() => {
    void downloadGate().then((reason) => {
      if (!reason) {
        void pumpDownloads();
        return;
      }

      if (active && !active.stop) stopActive('connection');
    });
  });
}

/** Points the manager at the signed-in user; null stops it. Hydrates that user's downloads and resumes the queue. */
export async function configureDownloads(next: ManagerContext | null) {
  const previousUser = context?.userId ?? null;
  context = next;

  if (!next) {
    networkSubscription?.remove();
    networkSubscription = null;
    stopActive('pause');
    resetDownloadStore([]);
    return;
  }

  if (previousUser === next.userId) return;

  stopActive('pause');
  mediaCache.clear();
  watchNetwork();
  await hydrate(next.userId);
  void pumpDownloads();
}

function requireContext() {
  if (!context) throw new DownloadsNotReadyError('Downloads are not ready yet');

  return context;
}

function stopActive(reason: NonNullable<ActiveTransfer['stop']>, courseId?: string, lessonIds?: string[]) {
  if (!active) return;
  if (courseId && active.courseId !== courseId) return;
  if (lessonIds && !lessonIds.includes(active.lessonId)) return;

  active.stop = reason;
  if (reason === 'cancel') {
    active.task.cancel();
    return;
  }

  const task = active.task;
  void task.pauseAsync().catch(() => task.cancel());
}

/** Fetches what downloading `courseId` (or one lesson of it) would take, skipping lessons already on the device. */
export async function planDownload(courseId: string, lessonId?: string): Promise<DownloadPlan> {
  const { api } = requireContext();
  const manifest = await fetchOfflineManifest(api, courseId, lessonId);
  const existing = getCourseDownload(courseId);
  const done = new Set(
    existing?.lessons.filter((lesson) => lesson.status === 'complete').map((lesson) => lesson.lessonId)
  );
  const lessons = manifest.lessons.filter((entry) => !entry.locked && entry.lesson && !done.has(entry.id));

  for (const entry of lessons) mediaCache.set(entry.id, entry.media);

  return {
    courseId,
    title: manifest.title,
    lessons,
    sizeBytes: lessons.reduce((total, entry) => total + entry.sizeBytes, 0),
    sizeComplete: lessons.every((entry) => entry.sizeComplete),
    lockedCount: manifest.lessons.filter((entry) => entry.locked).length,
    onlineOnlyCount: manifest.onlineOnly.length + lessons.reduce((total, entry) => total + entry.onlineOnly.length, 0)
  };
}

async function saveCourseSnapshot(orgId: string, courseId: string) {
  const { api, userId, snapshots } = requireContext();
  const course = await fetchCourseDetail(api, courseId).catch(() => null);
  if (course) snapshots.course(userId, orgId, courseId, course);
}

/** Queues the plan's lessons. Downloads start once the connection allows it. */
export async function startDownload(plan: DownloadPlan, orgId: string) {
  const { userId } = requireContext();
  const existing = getCourseDownload(plan.courseId);
  const createdAt = existing?.createdAt ?? Date.now();
  await saveCourseRow(userId, { course_id: plan.courseId, org_id: orgId, title: plan.title, created_at: createdAt });

  const queued: LessonDownload[] = [];
  for (const entry of plan.lessons) {
    const lesson: LessonDownload = {
      courseId: plan.courseId,
      lessonId: entry.id,
      title: entry.title,
      position: entry.position,
      status: 'queued',
      bytes: 0,
      expectedBytes: entry.sizeBytes,
      error: null
    };
    await saveLessonRow(
      userId,
      {
        course_id: lesson.courseId,
        lesson_id: lesson.lessonId,
        title: lesson.title,
        position: lesson.position,
        status: 'queued',
        bytes: 0,
        expected_bytes: lesson.expectedBytes,
        error: null
      },
      storedOf(entry)
    );
    queued.push(lesson);
  }

  const queuedIds = new Set(queued.map((lesson) => lesson.lessonId));
  const kept = existing?.lessons.filter((lesson) => !queuedIds.has(lesson.lessonId)) ?? [];
  putCourse({
    courseId: plan.courseId,
    orgId,
    title: plan.title,
    createdAt,
    waitReason: null,
    lessons: [...kept, ...queued]
  });

  void saveCourseSnapshot(orgId, plan.courseId);
  void pumpDownloads();
}

async function mediaFor(courseId: string, lessonId: string, refresh: boolean) {
  const cached = mediaCache.get(lessonId);
  if (!refresh && cached && !isExpiring(cached)) return cached;

  const { api, userId } = requireContext();
  const manifest = await fetchOfflineManifest(api, courseId, lessonId).catch((error: unknown) => {
    if (error instanceof ApiError && (error.status === 403 || error.status === 404))
      throw new LessonUnavailableError(error.message);
    throw error;
  });
  const entry = manifest.lessons[0];
  const stored = entry ? storedOf(entry) : null;
  if (!entry || entry.locked || !stored)
    throw new LessonUnavailableError('This lesson is locked. Finish the earlier items first.');

  mediaCache.set(lessonId, entry.media);
  await updateLessonRow(userId, lessonId, { stored });

  return entry.media;
}

async function runTransfer(task: DownloadTask, resuming: boolean): Promise<File | null> {
  return resuming ? task.resumeAsync() : task.downloadAsync();
}

async function transfer(
  courseId: string,
  lessonId: string,
  item: OfflineMediaItem,
  baseBytes: number
): Promise<TransferResult> {
  const { serverUrl, userId } = requireContext();
  const relativePath = mediaRelativePath(courseId, lessonId, item);
  const destination = downloadedFile(userId, relativePath);
  lessonDirectory(userId, courseId, lessonId).create({ intermediates: true, idempotent: true });

  const onProgress = ({ bytesWritten }: { bytesWritten: number }) =>
    reportLessonProgress(courseId, lessonId, baseBytes + bytesWritten);
  const saved = await readResumeState(userId, lessonId, item.key);
  let task: DownloadTask | null = null;
  if (saved) {
    try {
      task = DownloadTask.fromSavable(JSON.parse(saved), { onProgress });
    } catch {
      task = null;
    }
  }
  const resuming = task !== null;
  if (!resuming) deleteFile(destination);
  task ??= new DownloadTask(new URL(item.url, serverUrl).toString(), destination, { onProgress });

  const current: ActiveTransfer = { courseId, lessonId, task, stop: null };
  active = current;

  try {
    const file = await runTransfer(task, resuming).catch(async (error: unknown) => {
      if (!resuming || current.stop) throw error;

      await saveResumeState(userId, lessonId, item.key, null);
      deleteFile(destination);
      const fresh = new DownloadTask(new URL(item.url, serverUrl).toString(), destination, { onProgress });
      current.task = fresh;

      return fresh.downloadAsync();
    });

    if (!file) {
      const state = current.task.state === 'paused' ? JSON.stringify(current.task.savable()) : null;
      await saveResumeState(userId, lessonId, item.key, state);

      return { kind: 'stopped', reason: current.stop ?? 'connection' };
    }

    const bytes = file.size ?? 0;
    await saveFileRow(userId, { lesson_id: lessonId, media_key: item.key, kind: item.kind, path: relativePath, bytes });

    return { kind: 'done', bytes };
  } catch (error) {
    if (current.stop) {
      if (current.stop === 'cancel') deleteFile(destination);

      return { kind: 'stopped', reason: current.stop };
    }

    throw error;
  } finally {
    if (active === current) active = null;
  }
}

async function finishLesson(courseId: string, lessonId: string, bytes: number) {
  const { userId, snapshots } = requireContext();
  const orgId = getCourseDownload(courseId)?.orgId ?? null;
  const stored = await readStoredLesson(userId, lessonId);
  if (stored && orgId) {
    snapshots.lesson(userId, orgId, courseId, lessonId, stored.lesson);
    for (const entry of stored.transcripts) snapshots.transcript(userId, orgId, entry.assetId, entry.transcript);
  }

  await updateLessonRow(userId, lessonId, { status: 'complete', bytes, error: null });
  patchLessons(courseId, [lessonId], { status: 'complete', bytes, error: null });
}

function lessonStatus(courseId: string, lessonId: string) {
  return getCourseDownload(courseId)?.lessons.find((lesson) => lesson.lessonId === lessonId)?.status ?? null;
}

async function downloadLesson(courseId: string, lessonId: string) {
  const { userId } = requireContext();
  patchLessons(courseId, [lessonId], { status: 'downloading', error: null });
  await updateLessonRow(userId, lessonId, { status: 'downloading', error: null });

  try {
    let media = await mediaFor(courseId, lessonId, false);
    const files = new Map((await listFileRows(userId, lessonId)).map((row) => [row.media_key, row]));
    let completed = 0;

    for (let index = 0; index < media.length; index += 1) {
      if (lessonStatus(courseId, lessonId) !== 'downloading') return;

      const item = media[index]!;
      const existing = files.get(item.key);
      if (existing && downloadedFile(userId, existing.path).exists) {
        completed += existing.bytes;
        continue;
      }

      let result: TransferResult;
      try {
        result = await transfer(courseId, lessonId, item, completed);
      } catch (error) {
        const status = httpStatusOf(error);
        if (status === 403 || status === 410) {
          media = await mediaFor(courseId, lessonId, true);
          const refreshed = media.find((candidate) => candidate.key === item.key);
          result = refreshed ? await transfer(courseId, lessonId, refreshed, completed) : { kind: 'done', bytes: 0 };
        } else if (item.kind === 'image' && !isConnectionError(error)) {
          result = { kind: 'done', bytes: 0 };
        } else {
          throw error;
        }
      }

      if (result.kind === 'stopped') {
        if (result.reason !== 'connection') return;

        patchLessons(courseId, [lessonId], { status: 'queued', bytes: completed });
        await updateLessonRow(userId, lessonId, { status: 'queued' });
        throw new ConnectionLostError();
      }

      completed += result.bytes;
      reportLessonProgress(courseId, lessonId, completed);
    }

    if (lessonStatus(courseId, lessonId) !== 'downloading') return;

    await finishLesson(courseId, lessonId, completed);
  } catch (error) {
    if (error instanceof ConnectionLostError) throw error;

    if (isConnectionError(error)) {
      patchLessons(courseId, [lessonId], { status: 'queued' });
      await updateLessonRow(userId, lessonId, { status: 'queued' });
      throw new ConnectionLostError();
    }

    const message =
      error instanceof LessonUnavailableError ? error.message : 'This lesson did not download. Try again.';
    patchLessons(courseId, [lessonId], { status: 'failed', error: message });
    await updateLessonRow(userId, lessonId, { status: 'failed', error: message });
  }
}

function nextQueuedLesson() {
  const courses = getAllCourseDownloads().sort((a, b) => a.createdAt - b.createdAt);
  for (const course of courses) {
    const lesson = course.lessons.find((entry) => entry.status === 'queued');
    if (lesson) return lesson;
  }

  return null;
}

function markWaiting(reason: WaitReason | null) {
  for (const course of getAllCourseDownloads()) {
    const hasQueued = course.lessons.some((lesson) => lesson.status === 'queued');
    const waitReason = hasQueued ? reason : null;
    if (course.waitReason !== waitReason) patchCourse(course.courseId, { waitReason });
  }
}

/** Works through queued lessons one file at a time until the queue is empty or the connection stops it. */
export async function pumpDownloads() {
  if (pumping || !context) return;

  pumping = true;
  try {
    while (context) {
      const next = nextQueuedLesson();
      if (!next) break;

      const reason = await downloadGate();
      markWaiting(reason);
      if (reason) break;

      try {
        await downloadLesson(next.courseId, next.lessonId);
      } catch (error) {
        if (error instanceof ConnectionLostError) {
          markWaiting((await downloadGate()) ?? 'offline');
          break;
        }
      }
    }
  } finally {
    pumping = false;
  }
}

export async function pauseCourseDownload(courseId: string) {
  const { userId } = requireContext();
  const course = getCourseDownload(courseId);
  if (!course) return;

  const pausable = course.lessons.filter((lesson) => ['queued', 'downloading', 'waiting'].includes(lesson.status));
  patchLessons(
    courseId,
    pausable.map((lesson) => lesson.lessonId),
    { status: 'paused' }
  );
  for (const lesson of pausable) await updateLessonRow(userId, lesson.lessonId, { status: 'paused' });
  stopActive('pause', courseId);
}

export async function resumeCourseDownload(courseId: string) {
  const { userId } = requireContext();
  const course = getCourseDownload(courseId);
  if (!course) return;

  const resumable = course.lessons.filter((lesson) => lesson.status === 'paused' || lesson.status === 'failed');
  patchLessons(
    courseId,
    resumable.map((lesson) => lesson.lessonId),
    { status: 'queued', error: null }
  );
  for (const lesson of resumable) await updateLessonRow(userId, lesson.lessonId, { status: 'queued', error: null });
  void pumpDownloads();
}

export async function removeLessonDownloads(courseId: string, lessonIds: string[]) {
  const { userId } = requireContext();
  stopActive('cancel', courseId, lessonIds);
  for (const lessonId of lessonIds) {
    deleteDirectory(lessonDirectory(userId, courseId, lessonId));
    mediaCache.delete(lessonId);
  }
  await deleteLessonRows(userId, lessonIds);

  const remaining = getCourseDownload(courseId)?.lessons.filter((lesson) => !lessonIds.includes(lesson.lessonId)) ?? [];
  if (remaining.length === 0) await deleteCourseRow(userId, courseId);
  removeLessonsFromStore(courseId, lessonIds);
}

export async function removeCourseDownload(courseId: string) {
  const { userId } = requireContext();
  const course = getCourseDownload(courseId);
  stopActive('cancel', courseId);
  deleteDirectory(courseDirectory(userId, courseId));
  await deleteLessonRows(userId, course?.lessons.map((lesson) => lesson.lessonId) ?? []);
  await deleteCourseRow(userId, courseId);
  removeCourseFromStore(courseId);
}

export async function removeAllDownloads() {
  for (const course of getAllCourseDownloads()) await removeCourseDownload(course.courseId);
}

export async function clearUserDownloads(userId: string) {
  if (context?.userId === userId) stopActive('cancel');
  deleteDirectory(userDownloadsDirectory(userId));
  await deleteUserRows(userId);
  if (context?.userId === userId) resetDownloadStore([]);
}

export async function localLessonFiles(lessonId: string) {
  const { userId } = requireContext();
  const rows = await listFileRows(userId, lessonId);

  return new Map(
    rows.map((row) => [row.media_key, downloadedFile(userId, row.path)] as const).filter(([, file]) => file.exists)
  );
}

export async function storedLesson(lessonId: string) {
  const { userId } = requireContext();

  return readStoredLesson(userId, lessonId);
}
