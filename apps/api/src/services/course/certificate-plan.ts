import { env } from '@cio/core/config/env';
import { getCourseById, getCourseOrganizationId } from '@cio/db/queries';
import { getActiveOrganizationPlan } from '@cio/db/queries/organization';
import type { TCourse } from '@cio/db/types';
import { PLAN } from '@cio/utils/plans';
import { AppError, ErrorCodes } from '@api/utils/errors';
import { toEffectiveCertificateSettings } from './certificate-settings';

/**
 * Free-plan orgs do not get certificates. Self-hosted deployments always have them.
 */
export async function orgHasCertificatesEnabled(orgId: string): Promise<boolean> {
  if (env.PUBLIC_IS_SELFHOSTED === 'true') return true;

  const activePlan = await getActiveOrganizationPlan(orgId);

  return Boolean(activePlan && activePlan.planName !== PLAN.BASIC);
}

/**
 * Server-side twin of the dashboard's free-plan certificate lock. Throws 403 UPGRADE_REQUIRED on the Basic plan.
 */
export async function assertCertificatesEnabled(orgId: string): Promise<void> {
  if (!(await orgHasCertificatesEnabled(orgId))) {
    throw new AppError('Certificates require a paid plan', ErrorCodes.UPGRADE_REQUIRED, 403);
  }
}

function toPlanGatedSettings(course: Pick<TCourse, 'certificate'>): string {
  const { isDownloadable, design, deadline, emailMessage } = toEffectiveCertificateSettings(course);

  return JSON.stringify({ isDownloadable, design, deadline, emailMessage });
}

/**
 * For course updates that carry `certificate`. Dashboard forms send the stored settings back on every save, so only
 * a change to the effective settings needs the plan. The legacy `theme` string is compared through the resolved
 * design template, so a default theme the dashboard fills in is not a change.
 */
export async function assertCertificateChangeAllowed(
  courseId: string,
  certificate: TCourse['certificate'] | undefined
): Promise<void> {
  if (certificate === undefined) return;

  const [course] = await getCourseById(courseId);
  if (!course) return;

  const current = toPlanGatedSettings(course);
  const next = toPlanGatedSettings({ ...course, certificate });
  if (current === next) return;

  const orgId = await getCourseOrganizationId(courseId);
  if (!orgId) {
    throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
  }

  await assertCertificatesEnabled(orgId);
}
