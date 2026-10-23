import { ContentType } from '@cio/utils/constants';
import { getCourseContentStructure, type CourseContentItemRow } from '@cio/db/queries/course/content';
import { getCourseContentVersion } from '@cio/db/queries/course/content-timestamp';
import { getCompletedExerciseIdsForProfile, getCompletedLessonIdsForProfile } from '@cio/db/queries/course/progression';

import { cachedRead } from './cached-read';
import { courseContentStructureKey, COURSE_CONTENT_STRUCTURE_TTL_SECONDS } from './key-generators';

/**
 * `getCourseContentStructure`, cached in Redis under a key that includes the course's content
 * version so an author edit invalidates it immediately instead of waiting on the TTL. This is
 * the structure half of `getCourseContentItems`: the same for every student, and the part that
 * dominated database time before this cache (see the course-content-query PRD/task).
 */
export async function getCachedCourseContentStructure(courseId: string): Promise<CourseContentItemRow[]> {
  const version = await getCourseContentVersion(courseId);
  const { data } = await cachedRead(
    courseContentStructureKey(courseId, version),
    COURSE_CONTENT_STRUCTURE_TTL_SECONDS,
    () => getCourseContentStructure(courseId)
  );

  return data;
}

/**
 * `getCourseContentItems` with the structure half served from `getCachedCourseContentStructure`.
 * Per-student completion is never cached: it's two small indexed queries, cheap enough to run on
 * every call and specific to the caller's profile.
 */
export async function getCachedCourseContentItems(
  courseId: string,
  profileId?: string
): Promise<CourseContentItemRow[]> {
  const structure = await getCachedCourseContentStructure(courseId);

  if (!profileId) {
    return structure;
  }

  const [completedLessonIds, completedExerciseIds] = await Promise.all([
    getCompletedLessonIdsForProfile(courseId, profileId),
    getCompletedExerciseIdsForProfile(courseId, profileId)
  ]);

  return structure.map((item) => {
    if (item.type === ContentType.Lesson) {
      return { ...item, isComplete: completedLessonIds.has(item.id) };
    }

    if (item.type === ContentType.Exercise) {
      return { ...item, isComplete: completedExerciseIds.has(item.id) };
    }

    return item;
  });
}
