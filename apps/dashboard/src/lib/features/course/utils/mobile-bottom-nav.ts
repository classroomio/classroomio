import type { ContentProgress } from './content';

export function isCourseMobileBottomNavVisible(options: {
  isCourseLearnerView: boolean;
  isMobile: boolean;
  isContentPage: boolean;
  courseProgress: ContentProgress;
}): boolean {
  return options.isCourseLearnerView && options.isMobile && options.isContentPage && options.courseProgress.total > 0;
}
