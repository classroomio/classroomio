import { daysUntil } from '@/feature/course/helpers/format-date';
import type { en } from '@/feature/course/translations/en';
import type { EnrolledCourse } from '@/feature/course/types/course';
import type { Translator } from '@/feature/i18n/helpers/translate';

const RETAKE_WINDOW_DAYS = 30;

type ComplianceFields = Pick<EnrolledCourse, 'complianceStatus' | 'complianceDueDate' | 'complianceValidUntil'>;

/** Days until a compliance course must be retaken, negative once overdue, or null when no retake is due within 30 days. */
export function retakeDueDays(course: ComplianceFields, now = new Date()): number | null {
  const { complianceStatus: status, complianceDueDate: dueDate, complianceValidUntil: validUntil } = course;

  if (status === 'non_compliant' || status === 'in_grace_period') return dueDate ? daysUntil(dueDate, now) : 0;
  if ((status === 'expiring_soon' || status === 'compliant') && validUntil) {
    const days = daysUntil(validUntil, now);

    return days <= RETAKE_WINDOW_DAYS ? days : null;
  }

  return null;
}

export function retakeLabel(days: number, t: Translator<typeof en>) {
  if (days < 0) return t('retakeOverdue');
  if (days === 0) return t('retakeDueToday');

  return t('retakeDueIn', { count: days });
}
