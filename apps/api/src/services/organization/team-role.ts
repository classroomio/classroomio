import { AppError, ErrorCodes } from '@api/utils/errors';
import { scheduleCourseRoleReconcile } from '@cio/core/services/organization/course-roles';
import { db } from '@cio/db/drizzle';
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

/**
 * Changes another member's org role to admin or tutor. Throws if the actor is
 * not an admin, the member is missing, the actor targets themselves, or the
 * org would be left with no admin.
 */
export async function updateTeamMemberRole(
  orgId: string,
  memberId: number,
  roleId: number,
  actorProfileId: string
): Promise<UpdatedTeamMemberRole> {
  if (roleId !== ROLE.ADMIN && roleId !== ROLE.TUTOR) {
    throw new AppError('Invalid organization role', ErrorCodes.VALIDATION_ERROR, 400, 'roleId');
  }

  try {
    const updated = await db.transaction(async (tx) => {
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
          roleChanged: false
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
        roleChanged: true
      };
    });

    if (updated.roleChanged && updated.profileId) {
      await scheduleCourseRoleReconcile(orgId, updated.profileId);
    }

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
