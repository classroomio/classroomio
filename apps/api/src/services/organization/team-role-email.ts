import { buildEmailBranding, buildEmailFromName } from '@cio/email';
import { getAppBaseUrl } from '@cio/core/config/dashboard-url';
import { getOrganizationById } from '@cio/db/queries/organization';
import { getProfileById } from '@cio/db/queries/auth/profile';
import { ROLE_LABELS } from '@cio/utils/constants';
import { enqueueTransactionalEmail } from '@api/services/jobs';

type TeamRoleChangeNotice = {
  orgId: string;
  memberEmail: string | null;
  memberProfileId: string | null;
  previousRoleId: number;
  roleId: number;
  actorProfileId: string | null;
};

function roleName(roleId: number): string {
  return ROLE_LABELS[roleId] ?? 'member';
}

/**
 * Tells a team member their org role changed, naming the previous and new role and who changed it. Uses the membership email, else the
 * profile email, and skips members with neither. Never throws: the role is already saved.
 */
export async function sendTeamRoleChangedEmail(notice: TeamRoleChangeNotice): Promise<void> {
  try {
    const org = await getOrganizationById(notice.orgId);
    const member = notice.memberProfileId ? await getProfileById(notice.memberProfileId) : undefined;
    const recipientEmail = notice.memberEmail ?? member?.email;
    if (!org || !recipientEmail) {
      return;
    }

    const actor = notice.actorProfileId ? await getProfileById(notice.actorProfileId) : undefined;
    const memberName = member?.fullname || member?.username || recipientEmail.split('@')[0];
    const actorName = actor?.fullname || actor?.username || undefined;

    await enqueueTransactionalEmail('teamRoleChanged', {
      to: recipientEmail,
      fields: {
        name: memberName,
        orgName: org.name,
        previousRoleName: roleName(notice.previousRoleId),
        newRoleName: roleName(notice.roleId),
        changedByName: actorName,
        changedAt: new Date().toISOString(),
        dashboardUrl: getAppBaseUrl(),
        branding: buildEmailBranding(org)
      },
      from: buildEmailFromName(`${org.name} (via ClassroomIO.com)`)
    });
  } catch (error) {
    console.error('sendTeamRoleChangedEmail error:', error);
  }
}
