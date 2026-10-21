import { getActivePendingOrgInvitesForEmail } from '@cio/db/queries/organization/invite';
import { getRoleLabel } from '@api/services/organization/invite';

/**
 * Every pending organization invite awaiting this account, across all organizations.
 * Scoped to the person, not to an org, so an invite to an org they are not currently
 * viewing still reaches the dashboard notification panel.
 */
export async function listPendingInvitesForAccount(email: string) {
  if (!email) {
    return [];
  }

  const rows = await getActivePendingOrgInvitesForEmail(email);

  return rows.map((row) => ({
    id: row.invite.id,
    email: row.invite.email,
    roleId: row.invite.roleId,
    roleLabel: getRoleLabel(row.invite.roleId),
    createdAt: row.invite.createdAt,
    expiresAt: row.invite.expiresAt,
    organization: row.organization
  }));
}
