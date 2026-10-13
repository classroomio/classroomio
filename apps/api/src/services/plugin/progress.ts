import { AppError } from '@api/utils/errors';
import { authorizePluginRequest } from '@api/services/plugin/authorization';
import { assertEnrolledStudentContentAccess } from '@api/services/course/access';
import { evaluateCourseCertification } from '@api/services/course/completion';
import { getLessonCompletionService, upsertLessonCompletionService } from '@api/services/lesson';
import { getCourseProgress, getPluginCourseById, getPluginLessonAccessContext } from '@cio/db/queries';
import { ContentType } from '@cio/utils/constants';
import { calcCourseProgressPercent } from '@api/utils/course-completion';

export interface PluginLessonCompletion {
  isComplete: boolean;
}

export interface PluginCourseProgress {
  courseId: string;
  percentage: number;
  lessonsCompleted: number;
  totalLessons: number;
  isComplete: boolean;
  certificateEarnedAt: string | null;
}

async function authorizeLessonSurface(
  installationId: string,
  organizationId: string,
  profileId: string,
  lessonId: string,
  requiredScope: 'learner.progress:read' | 'learner.progress:write'
): Promise<string> {
  await authorizePluginRequest({
    installationId,
    organizationId,
    actorId: profileId,
    requiredScope
  });

  const lessonContext = await getPluginLessonAccessContext(lessonId, organizationId);
  if (!lessonContext) {
    throw new AppError('Lesson not found', 'LESSON_NOT_FOUND', 404);
  }

  await assertEnrolledStudentContentAccess({
    courseId: lessonContext.courseId,
    profileId,
    contentId: lessonId,
    type: ContentType.Lesson
  });

  return lessonContext.courseId;
}

export async function getLessonCompletionForPlugin(
  installationId: string,
  organizationId: string,
  profileId: string,
  lessonId: string
): Promise<PluginLessonCompletion> {
  await authorizeLessonSurface(installationId, organizationId, profileId, lessonId, 'learner.progress:read');

  const completion = await getLessonCompletionService(lessonId, profileId);

  return { isComplete: Boolean(completion?.isComplete) };
}

export async function setLessonCompletionForPlugin(
  installationId: string,
  organizationId: string,
  profileId: string,
  lessonId: string,
  isComplete: boolean
): Promise<PluginLessonCompletion> {
  const courseId = await authorizeLessonSurface(
    installationId,
    organizationId,
    profileId,
    lessonId,
    'learner.progress:write'
  );

  const completion = await upsertLessonCompletionService(lessonId, profileId, isComplete);

  if (isComplete) {
    void evaluateCourseCertification(courseId, profileId).catch((certificationError) => {
      console.error('Failed to evaluate course certification after plugin lesson completion:', certificationError);
    });
  }

  return { isComplete: Boolean(completion.isComplete) };
}

export async function resetLessonCompletionForPlugin(
  installationId: string,
  organizationId: string,
  profileId: string,
  lessonId: string
): Promise<PluginLessonCompletion> {
  return setLessonCompletionForPlugin(installationId, organizationId, profileId, lessonId, false);
}

export async function getCourseProgressForPlugin(
  installationId: string,
  organizationId: string,
  profileId: string,
  courseId: string
): Promise<PluginCourseProgress> {
  await authorizePluginRequest({
    installationId,
    organizationId,
    actorId: profileId,
    requiredScope: 'learner.progress:read'
  });

  const course = await getPluginCourseById(organizationId, courseId);
  if (!course) {
    throw new AppError('Course not found', 'COURSE_NOT_FOUND', 404);
  }

  const progress = await getCourseProgress(courseId, profileId);
  if (!progress.groupMemberId) {
    throw new AppError('Learner is not enrolled in course', 'FORBIDDEN', 403);
  }

  const percentage = calcCourseProgressPercent({
    lessonsCompleted: progress.lessonsCompleted,
    totalLessons: progress.lessonsCount,
    exercisesCompleted: progress.exercisesCompleted,
    exercisesCount: progress.exercisesCount
  });

  return {
    courseId,
    percentage,
    lessonsCompleted: progress.lessonsCompleted,
    totalLessons: progress.lessonsCount,
    isComplete: percentage >= 100 || Boolean(progress.certificateEarnedAt),
    certificateEarnedAt: progress.certificateEarnedAt
  };
}
