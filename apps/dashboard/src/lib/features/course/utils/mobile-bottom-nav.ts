import type { ContentProgress } from './content';

export function isCourseMobileBottomNavVisible(options: {
  isCourseLearnerView: boolean;
  isMobile: boolean;
  isLessonOrExercisePage: boolean;
  courseProgress: ContentProgress;
}): boolean {
  return (
    options.isCourseLearnerView &&
    options.isMobile &&
    options.isLessonOrExercisePage &&
    options.courseProgress.total > 0
  );
}
