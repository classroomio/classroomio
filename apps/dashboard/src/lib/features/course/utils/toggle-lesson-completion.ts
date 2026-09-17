import { ContentType } from '@cio/utils/constants/content';
import { courseApi, lessonApi } from '$features/course/api';
import {
  closeCourseCompletionModal,
  openCourseCompletionModal,
  updateCourseCompletionModal
} from '$features/course/store/course-completion-modal';
import { snackbar } from '$features/ui/snackbar/store';
import { getOrderedNavigableContent } from './content';
import { updateLessonCompletionInCourseContent } from './content-completion';

export async function toggleLessonCompletion(courseId: string, lessonId: string): Promise<boolean> {
  const navigableContentItems = getOrderedNavigableContent(courseApi.course);
  const lesson = navigableContentItems.find((item) => item.type === ContentType.Lesson && item.id === lessonId);
  const currentIsComplete = lesson?.isComplete ?? lessonApi.lesson?.isComplete ?? false;
  const isComplete = !currentIsComplete;

  await lessonApi.updateCompletion(courseId, lessonId, isComplete);

  if (!lessonApi.success) {
    snackbar.error('snackbar.lessons.error.try_later');
    return false;
  }

  snackbar.success(
    isComplete ? 'snackbar.lessons.success.complete_marked' : 'snackbar.lessons.success.complete_unmarked'
  );

  if (courseApi.course?.content) {
    courseApi.course = updateLessonCompletionInCourseContent(courseApi.course, lessonId, isComplete);
  }

  const updatedItems = getOrderedNavigableContent(courseApi.course);
  const allComplete = isComplete && updatedItems.length > 0 && updatedItems.every((item) => item.isComplete);

  if (!allComplete) {
    return true;
  }

  const requiredExerciseId = courseApi.course?.certificate?.requiredExerciseId ?? undefined;
  openCourseCompletionModal(courseId);

  const certificationEvaluation = await courseApi.getCertificationEvaluation(courseId);
  if (certificationEvaluation?.data) {
    const hasCompletedCourse = Boolean(
      certificationEvaluation.data.eligibleForCertificate || certificationEvaluation.data.certificateEarnedAt
    );
    updateCourseCompletionModal(
      courseId,
      hasCompletedCourse ? 'eligible' : 'not-eligible',
      certificationEvaluation.data,
      requiredExerciseId
    );
  } else {
    closeCourseCompletionModal();
  }

  return true;
}
