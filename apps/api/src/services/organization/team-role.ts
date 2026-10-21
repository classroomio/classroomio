import { AppError, ErrorCodes } from '@api/utils/errors';
import { emitOrganizationMemberUpdatedWebhookEvent } from '@cio/core/services/webhook/emit';
import { scheduleCourseRoleReconcile } from '@cio/core/services/organization/course-roles';
import { db, type DbOrTxClient } from '@cio/db/drizzle';
import {
  countOrganizationAdmins,
  getOrganizationMemberRoleId,
  getOrganizationTeamMemberById,
  lockOrganizationForUpdate,
  updateActiveOrganizationInviteRoleByEmail,
  updateOrganizationMemberRole
} from '@cio/db/queries/organization';
import { ROLE } from '@cio/utils/constants';

type UpdatedTeamMemberRole = {
  id: number;
  email: string | null;
  verified: boolean;
  roleId: number;
  profileId: string | null;
};

/** Throws 400 unless the role is admin or tutor. */
export function assertAssignableTeamRole(roleId: number) {
  if (roleId !== ROLE.ADMIN && roleId !== ROLE.TUTOR) {
    throw new AppError('Invalid organization role', ErrorCodes.VALIDATION_ERROR, 400, 'roleId');
  }
}

export type AppliedTeamMemberRole = UpdatedTeamMemberRole & { roleChanged: boolean; previousRoleId: number };

/**
 * Changes another member's org role to admin or tutor inside `tx`; the caller schedules the course role reconcile
 * after commit. Throws if the actor is not an admin, the member is missing, the actor targets themselves, or the org
 * would be left with no admin.
 */
export async function applyTeamMemberRoleChange(
  orgId: string,
  memberId: number,
  roleId: number,
  actorProfileId: string,
  tx: DbOrTxClient
): Promise<AppliedTeamMemberRole> {
  assertAssignableTeamRole(roleId);

  await lockOrganizationForUpdate(orgId, tx);

  const actorRoleId = await getOrganizationMemberRoleId(orgId, actorProfileId, tx);
  if (actorRoleId !== ROLE.ADMIN) {
    throw new AppError('Only organization admins can perform this action', ErrorCodes.ORG_TEAM_NOT_AUTHORIZED, 403);
  }

  const member = await getOrganizationTeamMemberById(orgId, memberId, tx);
  if (!member) {
    throw new AppError('Team member not found', ErrorCodes.ORG_TEAM_ROLE_UPDATE_FAILED, 404);
  }

  if (member.profileId && member.profileId === actorProfileId) {
    throw new AppError('You cannot change your own role', ErrorCodes.ORG_TEAM_ROLE_SELF, 400);
  }

  if (member.roleId === roleId) {
    return {
      id: member.id,
      email: member.email,
      verified: member.verified ?? false,
      roleId: member.roleId,
      profileId: member.profileId,
      roleChanged: false,
      previousRoleId: member.roleId
    };
  }

  const saved = await updateOrganizationMemberRole(orgId, memberId, roleId, tx);
  if (!saved) {
    throw new AppError('Team member not found', ErrorCodes.ORG_TEAM_ROLE_UPDATE_FAILED, 404);
  }

  const adminCount = await countOrganizationAdmins(orgId, tx);
  if (adminCount < 1) {
    throw new AppError('The organization must keep at least one admin', ErrorCodes.ORG_TEAM_LAST_ADMIN, 400);
  }

  if (saved.email) {
    await updateActiveOrganizationInviteRoleByEmail(orgId, saved.email, roleId, tx);
  }

  return {
    id: saved.id,
    email: saved.email,
    verified: saved.verified ?? false,
    roleId: saved.roleId,
    profileId: saved.profileId,
    roleChanged: true,
    previousRoleId: member.roleId
  };
}

/** Schedules the course role reconcile for a member whose org role just changed. */
export async function reconcileAfterTeamRoleChange(
  orgId: string,
  applied: AppliedTeamMemberRole,
  actorProfileId: string | null = null
) {
  if (applied.roleChanged && applied.profileId) {
    await scheduleCourseRoleReconcile(orgId, applied.profileId);
  }

  if (applied.roleChanged) {
    await emitOrganizationMemberUpdatedWebhookEvent(
      orgId,
      { id: applied.id, profileId: applied.profileId, email: applied.email, roleId: applied.roleId },
      { roleId: { from: applied.previousRoleId, to: applied.roleId } },
      actorProfileId
    );
  }
}

/** Changes another member's org role to admin or tutor in its own transaction. Throws as `applyTeamMemberRoleChange`. */
export async function updateTeamMemberRole(
  orgId: string,
  memberId: number,
  roleId: number,
  actorProfileId: string
): Promise<UpdatedTeamMemberRole> {
  assertAssignableTeamRole(roleId);

  try {
    const updated = await db.transaction((tx) =>
      applyTeamMemberRoleChange(orgId, memberId, roleId, actorProfileId, tx)
    );

    await reconcileAfterTeamRoleChange(orgId, updated, actorProfileId);

    return {
      id: updated.id,
      email: updated.email,
      verified: updated.verified,
      roleId: updated.roleId,
      profileId: updated.profileId
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to update team member role',
      ErrorCodes.ORG_TEAM_ROLE_UPDATE_FAILED,
      500
    );
  }
}
