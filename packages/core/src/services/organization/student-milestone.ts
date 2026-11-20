import { getOrganizationAdminEmails, getOrganizationById, updateOrganization } from '@cio/db/queries/organization';

import { getDashboardBaseUrl } from '../../config/dashboard-url';
import { enqueueWorkerTemplateEmail } from '../learning-path/template-email';

export type StudentMilestone = 'half' | 'reached';

export type StudentMilestoneNotification = {
  orgId: string;
  milestone: StudentMilestone;
  studentCount: number;
  studentLimit: number;
};

/**
 * Returns the milestone (50% of the limit, or the limit itself) crossed when
 * the org's student count moves from `previousCount` to `nextCount`, or null
 * when none was crossed. Reaching the limit wins over the halfway mark.
 */
export function getCrossedStudentMilestone(
  orgId: string,
  previousCount: number,
  nextCount: number,
  studentLimit: number
): StudentMilestoneNotification | null {
  const halfway = Math.ceil(studentLimit / 2);
  const crossedReached = previousCount < studentLimit && nextCount >= studentLimit;
  const crossedHalf = previousCount < halfway && nextCount >= halfway;

  if (!crossedReached && !crossedHalf) {
    return null;
  }

  const milestone: StudentMilestone = crossedReached ? 'reached' : 'half';

  return { orgId, milestone, studentCount: nextCount, studentLimit };
}

/**
 * Emails org admins once when the org crosses a student-count milestone (50%
 * of the limit, or the limit itself). The "already notified" state is persisted
 * on `organization.settings` so each milestone fires at most once, ever — no
 * repeat emails on every subsequent blocked attempt.
 *
 * Runs in both the API and the worker runtime, so queued adds can notify only
 * after their students actually join.
 */
export async function notifyStudentMilestone(notification: StudentMilestoneNotification): Promise<void> {
  const { orgId, milestone, studentCount, studentLimit } = notification;
  const org = await getOrganizationById(orgId);
  if (!org) return;

  const notified = org.settings?.studentLimitNotified ?? {};
  if (notified[milestone]) return;

  const admins = await getOrganizationAdminEmails(orgId);
  const upgradeUrl = `${getDashboardBaseUrl()}/org/${org.siteName}?upgrade=true`;
  const template = milestone === 'reached' ? 'studentLimitReached' : 'studentLimitApproaching';
  const idempotencyKey = `student-limit-${milestone}:${orgId}`;

  for (const admin of admins) {
    const recipientKey = admins.length === 1 ? idempotencyKey : `${idempotencyKey}:${admin.email}`;

    await enqueueWorkerTemplateEmail(template, {
      to: admin.email,
      fields: { orgName: org.name, studentCount, studentLimit, upgradeUrl },
      idempotencyKey: recipientKey
    });
  }

  // Reaching the limit implies the halfway mark was passed too, so a bulk jump
  // straight past 50% never fires the halfway email afterwards.
  const updatedNotified = milestone === 'reached' ? { half: true, reached: true } : { ...notified, half: true };

  await updateOrganization(orgId, { settings: { ...org.settings, studentLimitNotified: updatedNotified } });
}
