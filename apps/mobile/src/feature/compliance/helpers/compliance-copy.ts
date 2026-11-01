import { calendarDaysUntil } from '@/feature/common/helpers/calendar-date';
import { complianceCatalog } from '@/feature/compliance/translations/catalog';
import type { en } from '@/feature/compliance/translations/en';
import type {
  ComplianceOverview,
  ComplianceRequirement,
  ComplianceStanding
} from '@/feature/compliance/types/compliance';
import type { Translator } from '@/feature/i18n/helpers/translate';
import { useFormatters } from '@/feature/i18n/helpers/use-formatters';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

type ComplianceMessageKey = keyof typeof en;

/** Translator and date formatter for compliance copy, in the app language. */
export type ComplianceCopy = { t: Translator<typeof en>; date: (iso: string) => string };

export function useComplianceCopy(): ComplianceCopy {
  const t = useTranslations(complianceCatalog);
  const formatters = useFormatters();

  return { t, date: (iso: string) => formatters.date(new Date(iso)) };
}

function isRenewal(requirement: ComplianceRequirement) {
  return requirement.status === 'compliant';
}

/** The date a requirement's countdown runs to: the renewal date once completed, otherwise the deadline. */
export function requirementTargetDate(requirement: ComplianceRequirement) {
  return isRenewal(requirement) ? requirement.validUntil : requirement.dueDate;
}

export function requirementStatusText(requirement: ComplianceRequirement, { t }: ComplianceCopy, now = new Date()) {
  const { standing, dueDate, gracePeriodEndsAt, validUntil } = requirement;

  switch (standing) {
    case 'overdue': {
      const days = dueDate ? calendarDaysUntil(dueDate, now) : 0;

      return days < 0 ? t('statusOverdueByDays', { count: Math.abs(days) }) : t('standingOverdue');
    }
    case 'in_grace_period': {
      if (!gracePeriodEndsAt) return t('standingInGracePeriod');

      const days = calendarDaysUntil(gracePeriodEndsAt, now);

      return days <= 0 ? t('statusGraceEndsToday') : t('statusGraceDaysLeft', { count: days });
    }
    case 'due_soon': {
      const target = isRenewal(requirement) ? validUntil : dueDate;
      if (!target) return t('standingDueSoon');

      const days = calendarDaysUntil(target, now);
      if (isRenewal(requirement)) {
        return days <= 0 ? t('statusExpiresToday') : t('statusExpiresInDays', { count: days });
      }

      return days <= 0 ? t('statusDueToday') : t('statusDueInDays', { count: days });
    }
    case 'open':
      return requirement.status === 'in_progress' ? t('statusInProgress') : t('statusNotStarted');
    case 'unscheduled':
      return t('standingUnscheduled');
    case 'compliant':
      return t('standingCompliant');
    case 'waived':
      return t('standingWaived');
  }
}

/** Dated facts about a requirement, most relevant first. */
export function requirementDetails(requirement: ComplianceRequirement, { t, date }: ComplianceCopy) {
  const { standing, dueDate, gracePeriodEndsAt, validUntil, lastCompletedAt, waiver, retakeIntervalMonths } =
    requirement;
  const details: string[] = [];
  const incomplete = standing !== 'compliant' && standing !== 'waived' && !isRenewal(requirement);

  if (incomplete && dueDate) details.push(t('detailDeadline', { date: date(dueDate) }));
  if (standing === 'in_grace_period' && gracePeriodEndsAt) {
    details.push(t('detailGracePeriodEnds', { date: date(gracePeriodEndsAt) }));
  }
  if (standing === 'overdue' && gracePeriodEndsAt) {
    details.push(t('detailGracePeriodEnded', { date: date(gracePeriodEndsAt) }));
  }
  if (isRenewal(requirement) && validUntil) details.push(t('detailValidUntil', { date: date(validUntil) }));
  if (standing === 'waived') {
    if (waiver?.reason) details.push(waiver.reason);
    if (waiver?.expiresAt) details.push(t('detailWaiverEnds', { date: date(waiver.expiresAt) }));
  }
  if (lastCompletedAt) details.push(t('detailLastCompleted', { date: date(lastCompletedAt) }));
  if (isRenewal(requirement) && retakeIntervalMonths > 0) {
    details.push(t('detailRenewsEvery', { count: retakeIntervalMonths }));
  }

  return details;
}

const COUNT_LABELS: Array<[ComplianceStanding[], ComplianceMessageKey]> = [
  [['overdue'], 'countOverdue'],
  [['in_grace_period'], 'countInGracePeriod'],
  [['due_soon'], 'countDueSoon'],
  [['open', 'unscheduled'], 'countToDo'],
  [['compliant'], 'countCompliant'],
  [['waived'], 'countWaived']
];

export function complianceCountsText(counts: ComplianceOverview['counts'], { t }: ComplianceCopy) {
  return COUNT_LABELS.map(
    ([standings, key]) => [standings.reduce((sum, standing) => sum + counts[standing], 0), key] as const
  )
    .filter(([count]) => count > 0)
    .map(([count, key]) => t(key, { count }))
    .join(' · ');
}

export function complianceSummaryText(overview: ComplianceOverview, { t }: ComplianceCopy) {
  const { counts, requirements } = overview;
  const total = t('summaryOutOf', { count: requirements.length });

  switch (overview.status) {
    case 'overdue':
      return t('summaryOverdue', { count: counts.overdue, total });
    case 'in_grace_period':
      return t('summaryInGracePeriod', { count: counts.in_grace_period, total });
    case 'due_soon':
      return t('summaryDueSoon', { count: counts.due_soon, total });
    case 'compliant': {
      const toDo = counts.open + counts.unscheduled;
      if (toDo > 0) return t('summaryCompliantWithToDo', { count: toDo });

      return requirements.length === 1
        ? t('summaryCompliantOne')
        : t('summaryCompliantAll', { count: requirements.length });
    }
    case 'none':
      return t('summaryNone');
  }
}

/** Copy for the Home alert, or null when nothing is overdue, in its grace period or due soon. */
export function complianceAlertCopy(overview: ComplianceOverview, { t }: ComplianceCopy, now = new Date()) {
  const { status, counts } = overview;
  const first = overview.requirements[0];
  if (!first || (status !== 'overdue' && status !== 'in_grace_period' && status !== 'due_soon')) return null;

  const course = first.courseTitle;
  const target = requirementTargetDate(first);
  const days = target ? calendarDaysUntil(target, now) : null;
  const wasDue = days !== null && days < 0 ? t('alertWasDue', { course, count: Math.abs(days) }) : null;

  if (status === 'overdue') {
    return { title: t('alertOverdueTitle', { count: counts.overdue }), description: wasDue ?? course };
  }

  if (status === 'in_grace_period') {
    const graceDays = first.gracePeriodEndsAt ? calendarDaysUntil(first.gracePeriodEndsAt, now) : null;
    const grace = graceDays !== null && graceDays > 0 ? t('alertGraceLeft', { count: graceDays }) : null;

    return {
      title: t('alertInGracePeriodTitle', { count: counts.in_grace_period }),
      description: wasDue ? [wasDue, grace].filter(Boolean).join(' ') : course
    };
  }

  const title = t('alertDueSoonTitle', { count: counts.due_soon });
  if (isRenewal(first)) {
    if (days === null) return { title, description: t('alertExpiresSoon', { course }) };

    return {
      title,
      description: days <= 0 ? t('alertExpiresToday', { course }) : t('alertExpiresInDays', { course, count: days })
    };
  }

  if (days === null) return { title, description: t('alertDueSoon', { course }) };

  return {
    title,
    description: days <= 0 ? t('alertDueToday', { course }) : t('alertDueInDays', { course, count: days })
  };
}
