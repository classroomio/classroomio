import { useSyncExternalStore } from 'react';

import { PROGRESS_FLUSH_MS } from '@/feature/downloads/constants/downloads';
import type { CourseDownload, DownloadStatus, LessonDownload, WaitReason } from '@/feature/downloads/types/downloads';

type CourseRecord = Omit<CourseDownload, 'status' | 'bytes' | 'expectedBytes' | 'lessons'> & {
  lessons: LessonDownload[];
};

const EMPTY_IDS: string[] = [];

let courses = new Map<string, CourseDownload>();
let courseIds: string[] = EMPTY_IDS;
let allCourses: CourseDownload[] = [];
let totalBytes = 0;
const courseListeners = new Map<string, Set<() => void>>();
const listListeners = new Set<() => void>();
const pendingProgress = new Map<string, Map<string, number>>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function statusOf(lessons: LessonDownload[], waitReason: WaitReason | null): DownloadStatus {
  if (lessons.some((lesson) => lesson.status === 'downloading')) return 'downloading';
  if (lessons.some((lesson) => lesson.status === 'queued' || lesson.status === 'waiting')) {
    return waitReason ? 'waiting' : 'queued';
  }
  if (lessons.some((lesson) => lesson.status === 'paused')) return 'paused';
  if (lessons.some((lesson) => lesson.status === 'failed')) return 'failed';

  return 'complete';
}

function build(record: CourseRecord): CourseDownload {
  const lessons = [...record.lessons].sort((a, b) => a.position - b.position);

  return {
    ...record,
    lessons,
    status: statusOf(lessons, record.waitReason),
    bytes: lessons.reduce((total, lesson) => total + lesson.bytes, 0),
    expectedBytes: lessons.reduce((total, lesson) => total + Math.max(lesson.expectedBytes, lesson.bytes), 0)
  };
}

function notifyCourse(courseId: string) {
  courseListeners.get(courseId)?.forEach((listener) => listener());
}

function notifyList() {
  listListeners.forEach((listener) => listener());
}

function commit(changed: string[], membershipChanged: boolean) {
  allCourses = [...courses.values()].sort((a, b) => b.createdAt - a.createdAt);
  totalBytes = allCourses.reduce((total, course) => total + course.bytes, 0);
  if (membershipChanged) {
    courseIds = allCourses.map((course) => course.courseId);
  }
  changed.forEach(notifyCourse);
  notifyList();
}

export function resetDownloadStore(records: CourseRecord[]) {
  const previous = [...courses.keys()];
  courses = new Map(records.map((record) => [record.courseId, build(record)]));
  pendingProgress.clear();
  commit([...new Set([...previous, ...courses.keys()])], true);
}

export function putCourse(record: CourseRecord) {
  const existed = courses.has(record.courseId);
  courses.set(record.courseId, build(record));
  commit([record.courseId], !existed);
}

export function patchCourse(courseId: string, patch: Partial<Pick<CourseRecord, 'waitReason' | 'title'>>) {
  const course = courses.get(courseId);
  if (!course) return;

  courses.set(courseId, build({ ...course, ...patch }));
  commit([courseId], false);
}

export function patchLessons(courseId: string, lessonIds: string[] | 'all', patch: Partial<LessonDownload>) {
  const course = courses.get(courseId);
  if (!course) return;

  const ids = lessonIds === 'all' ? null : new Set(lessonIds);
  const lessons = course.lessons.map((lesson) => (!ids || ids.has(lesson.lessonId) ? { ...lesson, ...patch } : lesson));
  courses.set(courseId, build({ ...course, lessons }));
  pendingProgress.get(courseId)?.forEach((_bytes, lessonId) => {
    if (!ids || ids.has(lessonId)) pendingProgress.get(courseId)?.delete(lessonId);
  });
  commit([courseId], false);
}

export function removeLessonsFromStore(courseId: string, lessonIds: string[]) {
  const course = courses.get(courseId);
  if (!course) return;

  const ids = new Set(lessonIds);
  const lessons = course.lessons.filter((lesson) => !ids.has(lesson.lessonId));
  if (lessons.length === 0) {
    removeCourseFromStore(courseId);
    return;
  }

  courses.set(courseId, build({ ...course, lessons }));
  commit([courseId], false);
}

export function removeCourseFromStore(courseId: string) {
  if (!courses.delete(courseId)) return;

  pendingProgress.delete(courseId);
  commit([courseId], true);
}

function flushProgress() {
  flushTimer = null;
  const changed: string[] = [];
  pendingProgress.forEach((lessonBytes, courseId) => {
    const course = courses.get(courseId);
    if (!course || lessonBytes.size === 0) return;

    const lessons = course.lessons.map((lesson) => {
      const bytes = lessonBytes.get(lesson.lessonId);

      return bytes === undefined ? lesson : { ...lesson, bytes };
    });
    courses.set(courseId, build({ ...course, lessons }));
    changed.push(courseId);
  });
  pendingProgress.clear();
  if (changed.length > 0) commit(changed, false);
}

/** Records bytes received for a lesson; subscribers see at most one update per flush interval. */
export function reportLessonProgress(courseId: string, lessonId: string, bytes: number) {
  const lessonBytes = pendingProgress.get(courseId) ?? new Map<string, number>();
  lessonBytes.set(lessonId, bytes);
  pendingProgress.set(courseId, lessonBytes);
  flushTimer ??= setTimeout(flushProgress, PROGRESS_FLUSH_MS);
}

export function getCourseDownload(courseId: string) {
  return courses.get(courseId) ?? null;
}

export function getAllCourseDownloads() {
  return [...courses.values()];
}

function subscribeCourse(courseId: string, listener: () => void) {
  const set = courseListeners.get(courseId) ?? new Set<() => void>();
  set.add(listener);
  courseListeners.set(courseId, set);

  return () => {
    set.delete(listener);
    if (set.size === 0) courseListeners.delete(courseId);
  };
}

function subscribeList(listener: () => void) {
  listListeners.add(listener);

  return () => {
    listListeners.delete(listener);
  };
}

export function useCourseDownload(courseId: string) {
  return useSyncExternalStore(
    (listener) => subscribeCourse(courseId, listener),
    () => courses.get(courseId) ?? null
  );
}

export function useLessonDownloadStatus(courseId: string, lessonId: string): DownloadStatus | null {
  return useSyncExternalStore(
    (listener) => subscribeCourse(courseId, listener),
    () => courses.get(courseId)?.lessons.find((lesson) => lesson.lessonId === lessonId)?.status ?? null
  );
}

/** Course ids with downloads, newest first; changes only when a course is added or removed. */
export function useDownloadedCourseIds() {
  return useSyncExternalStore(subscribeList, () => courseIds);
}

/** Every course download, newest first; updates at most once per progress flush. */
export function useAllCourseDownloads() {
  return useSyncExternalStore(subscribeList, () => allCourses);
}

export function useDownloadedBytes() {
  return useSyncExternalStore(subscribeList, () => totalBytes);
}

/** True when every lesson queued for this course is on the device. */
export function useCourseAvailableOffline(courseId: string) {
  return useSyncExternalStore(
    (listener) => subscribeCourse(courseId, listener),
    () => courses.get(courseId)?.status === 'complete'
  );
}
