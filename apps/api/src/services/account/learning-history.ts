import { getEnrolledCourses, type TStudentCourse } from '@cio/db/queries/course/course';
import { toIsoTimestamp } from '@cio/utils/functions/learner-streak';

function isCourseFinished(course: TStudentCourse): boolean {
  if (course.completedAt) return true;
  if (course.lessonCount === 0 && course.exerciseCount === 0) return false;

  return course.progressRate >= course.lessonCount && course.exercisesCompleted >= course.exerciseCount;
}

/**
 * Courses the learner finished in the organization, most recent first. Compliance courses stay in the main course
 * list because they come due again.
 */
export async function listLearningHistory(orgId: string, profileId: string) {
  const courses = await getEnrolledCourses({ orgId, profileId });

  return courses
    .filter((course) => course.type !== 'COMPLIANCE' && isCourseFinished(course))
    .map((course) => ({
      id: course.id,
      title: course.title,
      bannerImage: course.bannerImage,
      type: course.type,
      lessonCount: course.lessonCount,
      level: course.level,
      durationMinutes: course.durationMinutes,
      instructorName: course.instructorName,
      completedAt: toIsoTimestamp(course.completedAt ?? course.certificateEarnedAt ?? null),
      certificateEarnedAt: toIsoTimestamp(course.certificateEarnedAt)
    }))
    .sort((a, b) => new Date(b.completedAt ?? 0).getTime() - new Date(a.completedAt ?? 0).getTime());
}
