import { ContentType } from '@cio/utils/constants';
import { getCourseContentStructure, type CourseContentItemRow } from '@cio/db/queries/course/content';
import { getCourseContentVersion } from '@cio/db/queries/course/content-timestamp';
import { getCompletedExerciseIdsForProfile } from '@cio/db/queries/course/progression';

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
 * The cached structure with the profile's exercise completion merged in, for
 * `assertEnrolledStudentContentAccess`. Deliberately does **not** merge lesson completion:
 * `assertStudentCanAccessContent` → `annotateCourseContentWithProgression` recomputes lesson
 * completion itself from `getCompletedLessonIdsForProfile` and never reads a lesson row's
 * `isComplete`, so merging it here would just be a second, wasted fetch of the same data (every
 * lesson row keeps the structure's literal `false`, same as a course with no profile). An
 * exercise row's `isComplete` *is* read there, as a fallback OR'd alongside a separate
 * groupMemberId-based completion check — a submission recorded against a profile's older or
 * otherwise-unresolved group membership would otherwise be missed — so that merge stays.
 *
 * Don't reuse this for anything that needs real lesson completion data (e.g. something that
 * displays it); use `getCourseContentItems`/`getCachedCourseContentStructure` plus your own
 * completion lookup for that instead.
 */
export async function getCachedCourseContentItemsForStudentAccessCheck(
  courseId: string,
  profileId: string
): Promise<CourseContentItemRow[]> {
  const structure = await getCachedCourseContentStructure(courseId);
  const completedExerciseIds = await getCompletedExerciseIdsForProfile(courseId, profileId);

  return structure.map((item) => {
    if (item.type === ContentType.Exercise) {
      return { ...item, isComplete: completedExerciseIds.has(item.id) };
    }

    return item;
  });
}
