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
 * Tells a team member their org role changed, naming the previous and new role and who changed it. Skips members who
 * have no email yet. Never throws: the role is already saved.
 */
export async function sendTeamRoleChangedEmail(notice: TeamRoleChangeNotice): Promise<void> {
  if (!notice.memberEmail) {
    return;
  }

  try {
    const org = await getOrganizationById(notice.orgId);
    if (!org) {
      return;
    }

    const member = notice.memberProfileId ? await getProfileById(notice.memberProfileId) : undefined;
    const actor = notice.actorProfileId ? await getProfileById(notice.actorProfileId) : undefined;
    const memberName = member?.fullname || member?.username || notice.memberEmail.split('@')[0];
    const actorName = actor?.fullname || actor?.username || undefined;

    await enqueueTransactionalEmail('teamRoleChanged', {
      to: notice.memberEmail,
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
