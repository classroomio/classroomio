import type { Formatters } from '@/feature/i18n/helpers/use-formatters';
import type { Translator } from '@/feature/i18n/helpers/translate';
import type { en } from '@/feature/teach/translations/en';
import type { TeachingCourse } from '@/feature/teach/types/teach';

export function courseSnapshotLine(
  course: Pick<TeachingCourse, 'enrolled' | 'completionRate' | 'overdue'>,
  t: Translator<typeof en>,
  format: Formatters
) {
  const parts = [t('snapshotEnrolled', { count: course.enrolled })];
  if (course.enrolled > 0) parts.push(t('snapshotCompleted', { percent: format.percent(course.completionRate) }));
  if (course.overdue) parts.push(t('snapshotOverdue', { count: course.overdue }));

  return parts.join(' · ');
}
