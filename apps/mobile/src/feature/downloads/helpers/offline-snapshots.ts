import { writeQuerySnapshot } from '@/feature/common/helpers/query-snapshot';
import { courseDetailQueryKey } from '@/feature/course/api/course-detail';
import { lessonQueryKey } from '@/feature/lesson/api/lesson';
import { transcriptQueryKey } from '@/feature/lesson/api/media';

export type OfflineSnapshotWriter = {
  course: (userId: string, orgId: string, courseId: string, data: unknown) => void;
  lesson: (userId: string, orgId: string, courseId: string, lessonId: string, data: unknown) => void;
  transcript: (userId: string, orgId: string, assetId: string, data: unknown) => void;
};

/** Saves downloaded data under the same keys the course, lesson and transcript queries read, so they open offline. */
export const offlineSnapshotWriter: OfflineSnapshotWriter = {
  course: (userId, orgId, courseId, data) => writeQuerySnapshot(courseDetailQueryKey(userId, orgId, courseId), data),
  lesson: (userId, orgId, courseId, lessonId, data) =>
    writeQuerySnapshot(lessonQueryKey(userId, orgId, courseId, lessonId), data),
  transcript: (userId, orgId, assetId, data) => writeQuerySnapshot(transcriptQueryKey(userId, orgId, assetId), data)
};
