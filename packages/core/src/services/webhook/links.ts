import type { TWebhookEventType } from '@cio/utils/constants/webhook';
import { ROLE } from '@cio/utils/constants';

import { getAppBaseUrl, getDashboardBaseUrl, type DashboardOrg } from '../../config/dashboard-url';

export type TWebhookLinks = { dashboard: string | null; student: string | null };

type TLinkOrg = DashboardOrg & { siteName?: string | null };

function readString(data: Record<string, unknown>, key: string): string | null {
  const value = data[key];

  return typeof value === 'string' ? value : null;
}

function buildCourseDashboardPath(eventType: TWebhookEventType, courseId: string, data: Record<string, unknown>) {
  if (eventType.startsWith('course.submission.')) {
    const submissionId = readString(data, 'submissionId');

    return submissionId
      ? `/courses/${courseId}/submissions?id=${encodeURIComponent(submissionId)}`
      : `/courses/${courseId}/submissions`;
  }

  if (eventType.startsWith('compliance.')) return `/courses/${courseId}/compliance`;

  if (
    eventType.startsWith('course.member.') ||
    eventType === 'course.completed' ||
    eventType === 'course.certificate.issued' ||
    eventType === 'course.payment_request.created'
  ) {
    return `/courses/${courseId}/people`;
  }

  return `/courses/${courseId}`;
}

function buildOrganizationDashboardPath(eventType: TWebhookEventType, data: Record<string, unknown>, siteName: string) {
  const orgPath = `/org/${siteName}`;

  if (eventType.startsWith('organization.invite.')) return `${orgPath}/settings/teams`;

  const roleId = typeof data.roleId === 'number' ? data.roleId : null;

  return roleId === ROLE.STUDENT ? `${orgPath}/audience` : `${orgPath}/settings/teams`;
}

/**
 * Builds the deep links an event carries: `dashboard` opens the staff view on the admin app, `student`
 * opens the learner view on the organization's public site. A link is `null` when the event has no such page.
 */
export function buildWebhookLinks(
  eventType: TWebhookEventType,
  data: Record<string, unknown>,
  org: TLinkOrg | null
): TWebhookLinks {
  const appBaseUrl = getAppBaseUrl();
  const learnerBaseUrl = getDashboardBaseUrl(org ?? undefined);
  const courseId = readString(data, 'courseId');
  const cohortId = readString(data, 'cohortId');

  if (courseId) {
    return {
      dashboard: `${appBaseUrl}${buildCourseDashboardPath(eventType, courseId, data)}`,
      student: `${learnerBaseUrl}/courses/${courseId}`
    };
  }

  if (cohortId) {
    return {
      dashboard: `${appBaseUrl}/cohorts/${cohortId}/courses`,
      student: `${learnerBaseUrl}/cohorts/${cohortId}/courses`
    };
  }

  if (org?.siteName) {
    return {
      dashboard: `${appBaseUrl}${buildOrganizationDashboardPath(eventType, data, org.siteName)}`,
      student: null
    };
  }

  return { dashboard: null, student: null };
}

/**
 * The page where a student downloads a certificate they earned.
 */
export function buildCertificateDownloadUrl(courseId: string, org: TLinkOrg | null): string {
  return `${getDashboardBaseUrl(org ?? undefined)}/courses/${courseId}/certificates`;
}
