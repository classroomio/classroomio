import type { BannerTone } from '@/feature/common/components/banner';
import { daysUntil, formatDay } from '@/feature/course/helpers/format-date';
import type { en } from '@/feature/course/translations/en';
import type { EnrolledCourse } from '@/feature/course/types/course';
import type { Translator } from '@/feature/i18n/helpers/translate';
import type { Locale } from '@/feature/i18n/types/i18n';

export type ComplianceDeadlineCopy = { tone: BannerTone; title: string; description: string; urgent: boolean };

type CourseTranslator = Translator<typeof en>;

function relativeDays(days: number, t: CourseTranslator) {
  if (days === 0) return t('relativeToday');
  if (days === 1) return t('relativeTomorrow');
  if (days === -1) return t('relativeYesterday');
  if (days > 1) return t('relativeInDays', { count: days });

  return t('relativeDaysAgo', { count: Math.abs(days) });
}

/** Banner copy for the learner's current compliance cycle, as recorded by the API. */
export function complianceDeadlineCopy(
  course: Pick<EnrolledCourse, 'complianceStatus' | 'complianceDueDate' | 'complianceValidUntil'>,
  t: CourseTranslator,
  locale: Locale
): ComplianceDeadlineCopy | null {
  const { complianceStatus: status, complianceDueDate: dueDate, complianceValidUntil: validUntil } = course;
  if (!status) return null;

  if (status === 'non_compliant' || status === 'in_grace_period') {
    const overdueDays = dueDate ? -daysUntil(dueDate) : 0;

    return {
      tone: 'danger',
      urgent: true,
      title: overdueDays > 0 ? t('complianceOverdueBy', { count: overdueDays }) : t('complianceOverdue'),
      description: status === 'in_grace_period' ? t('complianceGraceDescription') : t('complianceOverdueDescription')
    };
  }

  if (status === 'expiring_soon') {
    return {
      tone: 'warning',
      urgent: false,
      title: validUntil
        ? t('complianceExpiresOn', { date: formatDay(validUntil, locale) })
        : t('complianceExpiresSoon'),
      description: t('complianceExpiresDescription')
    };
  }

  if (status === 'compliant') {
    return {
      tone: 'success',
      urgent: false,
      title: validUntil
        ? t('complianceCompliantUntil', { date: formatDay(validUntil, locale) })
        : t('complianceCompliant'),
      description: t('complianceCompliantDescription')
    };
  }

  if (status === 'waived') {
    return {
      tone: 'neutral',
      urgent: false,
      title: t('complianceWaived'),
      description: t('complianceWaivedDescription')
    };
  }

  if (!dueDate) return null;

  const days = daysUntil(dueDate);

  return {
    tone: days <= 7 ? 'warning' : 'info',
    urgent: false,
    title: t('complianceDue', { date: formatDay(dueDate, locale), relative: relativeDays(days, t) }),
    description: t('complianceRequiredDescription')
  };
}
