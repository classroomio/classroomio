import type { Translator } from '@/feature/i18n/helpers/translate';
import type { en } from '@/feature/learning-path/translations/en';
import type { EnrolledPath, LearnerPathCourse } from '@/feature/learning-path/types/learning-path';

type PathTranslator = Translator<typeof en>;

export function pathProgressLabel(
  path: Pick<EnrolledPath, 'completedAt' | 'completedCourseCount' | 'courseCount'>,
  t: PathTranslator
) {
  if (path.completedAt) return t('pathCompleted');

  return t('coursesComplete', { completed: path.completedCourseCount, total: path.courseCount });
}

export function pathCourseStateLabel(course: LearnerPathCourse, t: PathTranslator) {
  if (course.state === 'locked') {
    return course.blockedBy ? t('finishToUnlock', { course: course.blockedBy.title }) : t('stateLocked');
  }
  if (course.state === 'completed') return t('stateCompleted');
  if (course.state === 'in_progress') return t('stateInProgress');

  return t('stateNotStarted');
}
