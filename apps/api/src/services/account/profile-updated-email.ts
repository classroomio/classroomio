import { buildEmailBranding, buildEmailFromName } from '@cio/email';
import { getAppBaseUrl, getDashboardBaseUrl } from '@cio/core/config/dashboard-url';
import { getOrganizationById, getOrganizationByProfileId } from '@cio/db/queries/organization';
import { ROLE } from '@cio/utils/constants';
import { isEmailLocale } from '@cio/utils/email';
import { enqueueTransactionalEmail } from '@api/services/jobs';

import type { TAppliedProfileUpdate, TProfileChangeActor } from './profile';

/**
 * Tells the person which profile fields changed, when, and whether they or an org admin did it. Written in the
 * language they had before the change, so an unwanted language change can't hide the notice. Never throws:
 * the profile is already saved.
 */
export async function sendProfileUpdatedEmail(
  update: TAppliedProfileUpdate,
  actor: TProfileChangeActor
): Promise<void> {
  const { previous, changedFields } = update;
  if (changedFields.length === 0 || !previous.email) {
    return;
  }

  try {
    const memberships = await getOrganizationByProfileId(previous.id);
    const membership =
      memberships.find((org) => org.id === actor.orgId) ?? (actor.kind === 'self' ? memberships[0] : undefined);
    const org = membership ?? (actor.kind === 'org_admin' ? await getOrganizationById(actor.orgId) : null) ?? undefined;
    const isStudent = membership?.roleId === ROLE.STUDENT;
    const changedBy = actor.kind === 'org_admin' && actor.actorId !== previous.id ? 'admin' : 'self';

    await enqueueTransactionalEmail('profileUpdated', {
      to: previous.email,
      fields: {
        name: previous.fullname || previous.username || previous.email.split('@')[0],
        changedFields,
        changedBy,
        orgName: org?.name || 'ClassroomIO',
        changedAt: new Date().toISOString(),
        locale: isEmailLocale(previous.locale) ? previous.locale : 'en',
        loginUrl: isStudent && org ? getDashboardBaseUrl(org) : getAppBaseUrl(),
        branding: buildEmailBranding(org)
      },
      from: org?.name ? buildEmailFromName(`${org.name} (via ClassroomIO.com)`) : undefined
    });
  } catch (error) {
    console.error('sendProfileUpdatedEmail error:', error);
  }
}
