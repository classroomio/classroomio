import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/drizzle', () => ({
  db: {
    transaction: vi.fn()
  }
}));

vi.mock('@cio/db/queries/organization', () => ({
  countOrganizationAdmins: vi.fn(),
  getOrganizationMemberRoleId: vi.fn(),
  getOrganizationTeamMemberById: vi.fn(),
  lockOrganizationForUpdate: vi.fn(),
  updateActiveOrganizationInviteRoleByEmail: vi.fn(),
  updateOrganizationMemberRole: vi.fn()
}));

vi.mock('@cio/core/services/organization/course-roles', () => ({
  scheduleCourseRoleReconcile: vi.fn()
}));

import { updateTeamMemberRole } from './team-role';
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
import { ErrorCodes } from '@cio/utils/constants/error-codes';

const ORG_ID = 'org-1';
const ACTOR_ID = 'actor-1';
const MEMBER_ID = 7;
const tx = { id: 'tx' };

function teamMember(overrides: Record<string, unknown> = {}) {
  return {
    id: MEMBER_ID,
    email: 'tutor@example.com',
    verified: true,
    roleId: ROLE.TUTOR,
    profileId: 'profile-2',
    ...overrides
  };
}

describe('updateTeamMemberRole', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.transaction).mockImplementation(async (callback) => callback(tx as never));
    vi.mocked(lockOrganizationForUpdate).mockResolvedValue(undefined);
    vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(ROLE.ADMIN);
    vi.mocked(getOrganizationTeamMemberById).mockResolvedValue(teamMember());
    vi.mocked(updateOrganizationMemberRole).mockImplementation(async (_orgId, _memberId, roleId) =>
      teamMember({ roleId })
    );
    vi.mocked(countOrganizationAdmins).mockResolvedValue(1);
    vi.mocked(updateActiveOrganizationInviteRoleByEmail).mockResolvedValue(undefined);
    vi.mocked(scheduleCourseRoleReconcile).mockResolvedValue(undefined);
  });

  it('rejects a role outside admin and tutor before opening a transaction', async () => {
    await expect(updateTeamMemberRole(ORG_ID, MEMBER_ID, ROLE.STUDENT, ACTOR_ID)).rejects.toMatchObject({
      code: ErrorCodes.VALIDATION_ERROR,
      statusCode: 400
    });

    expect(db.transaction).not.toHaveBeenCalled();
  });

  it('rejects an actor who is no longer an admin', async () => {
    vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(ROLE.TUTOR);

    await expect(updateTeamMemberRole(ORG_ID, MEMBER_ID, ROLE.ADMIN, ACTOR_ID)).rejects.toMatchObject({
      code: ErrorCodes.ORG_TEAM_NOT_AUTHORIZED,
      statusCode: 403
    });

    expect(updateOrganizationMemberRole).not.toHaveBeenCalled();
  });

  it('rejects a missing team member', async () => {
    vi.mocked(getOrganizationTeamMemberById).mockResolvedValue(null);

    await expect(updateTeamMemberRole(ORG_ID, MEMBER_ID, ROLE.ADMIN, ACTOR_ID)).rejects.toMatchObject({
      code: ErrorCodes.ORG_TEAM_ROLE_UPDATE_FAILED,
      statusCode: 404
    });
  });

  it('rejects changing your own role', async () => {
    vi.mocked(getOrganizationTeamMemberById).mockResolvedValue(teamMember({ profileId: ACTOR_ID, roleId: ROLE.ADMIN }));

    await expect(updateTeamMemberRole(ORG_ID, MEMBER_ID, ROLE.TUTOR, ACTOR_ID)).rejects.toMatchObject({
      code: ErrorCodes.ORG_TEAM_ROLE_SELF,
      statusCode: 400
    });

    expect(updateOrganizationMemberRole).not.toHaveBeenCalled();
  });

  it('leaves the row alone when the role is unchanged', async () => {
    const result = await updateTeamMemberRole(ORG_ID, MEMBER_ID, ROLE.TUTOR, ACTOR_ID);

    expect(result).toMatchObject({ id: MEMBER_ID, roleId: ROLE.TUTOR, profileId: 'profile-2' });
    expect(updateOrganizationMemberRole).not.toHaveBeenCalled();
    expect(scheduleCourseRoleReconcile).not.toHaveBeenCalled();
  });

  it('updates the membership, pending invite, and course roles', async () => {
    const result = await updateTeamMemberRole(ORG_ID, MEMBER_ID, ROLE.ADMIN, ACTOR_ID);

    expect(lockOrganizationForUpdate).toHaveBeenCalledWith(ORG_ID, tx);
    expect(updateOrganizationMemberRole).toHaveBeenCalledWith(ORG_ID, MEMBER_ID, ROLE.ADMIN, tx);
    expect(updateActiveOrganizationInviteRoleByEmail).toHaveBeenCalledWith(ORG_ID, 'tutor@example.com', ROLE.ADMIN, tx);
    expect(scheduleCourseRoleReconcile).toHaveBeenCalledWith(ORG_ID, 'profile-2');
    expect(result.roleId).toBe(ROLE.ADMIN);
  });

  it('skips invite and course-role sync when the member has not joined', async () => {
    vi.mocked(getOrganizationTeamMemberById).mockResolvedValue(teamMember({ email: null, profileId: null }));
    vi.mocked(updateOrganizationMemberRole).mockResolvedValue(
      teamMember({ email: null, profileId: null, roleId: ROLE.ADMIN })
    );

    await updateTeamMemberRole(ORG_ID, MEMBER_ID, ROLE.ADMIN, ACTOR_ID);

    expect(updateActiveOrganizationInviteRoleByEmail).not.toHaveBeenCalled();
    expect(scheduleCourseRoleReconcile).not.toHaveBeenCalled();
  });

  it('refuses a change that would leave the organization with no admin', async () => {
    vi.mocked(getOrganizationTeamMemberById).mockResolvedValue(
      teamMember({ roleId: ROLE.ADMIN, profileId: 'profile-2' })
    );
    vi.mocked(countOrganizationAdmins).mockResolvedValue(0);

    await expect(updateTeamMemberRole(ORG_ID, MEMBER_ID, ROLE.TUTOR, ACTOR_ID)).rejects.toMatchObject({
      code: ErrorCodes.ORG_TEAM_LAST_ADMIN,
      statusCode: 400
    });

    expect(scheduleCourseRoleReconcile).not.toHaveBeenCalled();
  });
});
