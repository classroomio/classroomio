import { calendarDaysUntil } from '@/feature/common/helpers/calendar-date';
import { requirementTargetDate } from '@/feature/compliance/helpers/compliance-copy';
import type { ComplianceOverview, ComplianceRequirement } from '@/feature/compliance/types/compliance';

/** The open requirement whose deadline or renewal date comes soonest, today included, with the days left. */
export function nextDeadlineOf(requirements: ComplianceRequirement[], now = new Date()) {
  let next: { requirement: ComplianceRequirement; target: string; days: number } | null = null;

  for (const requirement of requirements) {
    if (requirement.standing === 'waived' || requirement.standing === 'compliant') continue;

    const target = requirementTargetDate(requirement);
    if (!target) continue;

    const days = calendarDaysUntil(target, now);
    if (days < 0 || (next && days >= next.days)) continue;

    next = { requirement, target, days };
  }

  return next;
}

/** Requirements grouped the way the summary counts them: past the deadline, due soon, and everything else. */
export function standingTotalsOf(counts: ComplianceOverview['counts']) {
  const overdue = counts.overdue + counts.in_grace_period;
  const dueSoon = counts.due_soon;
  const onTrack = counts.open + counts.unscheduled + counts.compliant + counts.waived;

  return { overdue, dueSoon, onTrack };
}
