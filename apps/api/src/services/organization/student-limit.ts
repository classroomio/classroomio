import { AppError, ErrorCodes } from '@api/utils/errors';
import { enqueueTransactionalEmail } from '@api/services/jobs';
import { getDashboardBaseUrl } from '@cio/core/config/dashboard-url';
import { getStudentLimit } from '@cio/utils/plans';
import { env } from '@cio/core/config/env';
import {
  countActiveStudents,
  getActiveOrganizationPlan,
  getOrganizationAdminEmails,
  getOrganizationById,
  updateOrganization
} from '@cio/db/queries/organization';

type StudentMilestone = 'half' | 'reached';

export type StudentMilestoneNotification = {
  orgId: string;
  milestone: StudentMilestone;
  studentCount: number;
  studentLimit: number;
};

/**
 * Emails org admins once when the org crosses a student-count milestone (50%
 * of the limit, or the limit itself). The "already notified" state is persisted
 * on `organization.settings` so each milestone fires at most once, ever — no
 * repeat emails on every subsequent blocked attempt.
 */
export async function notifyStudentMilestone(notification: StudentMilestoneNotification): Promise<void> {
  const { orgId, milestone, studentCount, studentLimit } = notification;
  const org = await getOrganizationById(orgId);
  if (!org) return;

  const notified = org.settings?.studentLimitNotified ?? {};
  if (notified[milestone]) return;

  const admins = await getOrganizationAdminEmails(orgId);
  if (admins.length) {
    const upgradeUrl = `${getDashboardBaseUrl()}/org/${org.siteName}?upgrade=true`;
    const template = milestone === 'reached' ? 'studentLimitReached' : 'studentLimitApproaching';

    await enqueueTransactionalEmail(template, {
      to: admins.map((admin) => admin.email),
      fields: { orgName: org.name, studentCount, studentLimit, upgradeUrl },
      idempotencyKey: `student-limit-${milestone}:${orgId}`
    });
  }

  // Reaching the limit implies the halfway mark was passed too, so a bulk jump
  // straight past 50% never fires the halfway email afterwards.
  const updatedNotified = milestone === 'reached' ? { half: true, reached: true } : { ...notified, half: true };

  await updateOrganization(orgId, { settings: { ...org.settings, studentLimitNotified: updatedNotified } });
}

/**
 * Throws `UPGRADE_REQUIRED` when adding `additionalStudents` new student-role
 * members would push the org past its plan's student limit. Self-hosted orgs
 * and plans with an unlimited allowance are exempt.
 *
 * When the addition is allowed and crosses a milestone (50% or the limit), it
 * fires a one-time admin email (fire-and-forget). Blocked attempts do NOT email.
 */
export async function assertStudentCapacityOrThrow(
  orgId: string,
  additionalStudents: number,
  options: { deferNotification?: boolean } = {}
): Promise<StudentMilestoneNotification | null> {
  if (additionalStudents <= 0) return null;
  if (env.PUBLIC_IS_SELFHOSTED === 'true') return null;

  const activePlan = await getActiveOrganizationPlan(orgId);
  const limit = getStudentLimit(activePlan?.planName);

  if (!Number.isFinite(limit)) return null;

  const currentCount = await countActiveStudents(orgId);
  const newCount = currentCount + additionalStudents;

  if (newCount > limit) {
    throw new AppError(
      `This organization has reached its ${limit}-student limit on the Free plan`,
      ErrorCodes.UPGRADE_REQUIRED,
      403
    );
  }

  const halfway = Math.ceil(limit / 2);
  const crossedReached = currentCount < limit && newCount >= limit;
  const crossedHalf = currentCount < halfway && newCount >= halfway;

  if (crossedReached || crossedHalf) {
    const milestone: StudentMilestone = crossedReached ? 'reached' : 'half';
    const notification = { orgId, milestone, studentCount: newCount, studentLimit: limit };

    if (!options.deferNotification) {
      notifyStudentMilestone(notification).catch((error) => {
        console.error('notifyStudentMilestone error:', error);
      });
    }

    return notification;
  }

  return null;
}
