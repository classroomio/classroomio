import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/organization', () => ({
  getOrganizationMemberRoleId: vi.fn()
}));

vi.mock('@api/services/organization', () => ({
  getOrgTeam: vi.fn()
}));

vi.mock('@api/services/organization/team-role', () => ({
  applyTeamMemberRoleChange: vi.fn(),
  reconcileAfterTeamRoleChange: vi.fn()
}));

vi.mock('@cio/db/queries/auth', () => ({
  updateProfile: vi.fn()
}));

const TX = { tx: true };
vi.mock('@cio/db/drizzle', () => ({
  db: { transaction: vi.fn((run: (tx: unknown) => unknown) => run(TX)) }
}));

import { AppError, ErrorCodes } from '@api/utils/errors';
import { ROLE } from '@cio/utils/constants';
import { getOrganizationMemberRoleId } from '@cio/db/queries/organization';
import { getOrgTeam } from '@api/services/organization';
import { applyTeamMemberRoleChange, reconcileAfterTeamRoleChange } from '@api/services/organization/team-role';
import { updateProfile } from '@cio/db/queries/auth';
import { getTeamMemberService, listTeamService, updateTeamMemberService } from '@api/services/v1/team';

const ORG_ID = 'org-1';
const ACTOR_ID = 'actor-1';
const firstPage = { page: 1, limit: 20 };

const admin = {
  id: 10,
  email: 'admin@example.com',
  verified: true,
  roleId: ROLE.ADMIN,
  profileId: ACTOR_ID,
  fullname: 'Ada Admin'
};
const tutor = {
  id: 11,
  email: 'tutor@example.com',
  verified: true,
  roleId: ROLE.TUTOR,
  profileId: 'profile-2',
  fullname: 'Tim Tutor'
};
const pending = {
  id: 12,
  email: 'pending@example.com',
  verified: false,
  roleId: ROLE.TUTOR,
  profileId: undefined,
  fullname: ''
};

describe('services/v1/team', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(ROLE.ADMIN);
    vi.mocked(getOrgTeam).mockResolvedValue([admin, tutor, pending] as never);
    vi.mocked(updateProfile).mockResolvedValue({ id: 'profile' } as never);
    vi.mocked(applyTeamMemberRoleChange).mockResolvedValue({ roleChanged: true } as never);
  });

  describe('who may call it', () => {
    const calls = {
      list: (actorId: string | null) => listTeamService(ORG_ID, actorId, firstPage),
      get: (actorId: string | null) => getTeamMemberService(ORG_ID, actorId, { memberId: tutor.id }),
      update: (actorId: string | null) =>
        updateTeamMemberService(ORG_ID, actorId, { memberId: tutor.id }, { roleId: ROLE.ADMIN })
    };

    it.each(Object.entries(calls))('%s rejects a key with no actor with 401', async (_name, call) => {
      await expect(call(null)).rejects.toMatchObject({ statusCode: 401 });
      expect(getOrgTeam).not.toHaveBeenCalled();
    });

    it.each(Object.entries(calls))('%s rejects a tutor with 403, as the dashboard does', async (_name, call) => {
      vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(ROLE.TUTOR);

      await expect(call(ACTOR_ID)).rejects.toMatchObject({ statusCode: 403 });
      expect(getOrgTeam).not.toHaveBeenCalled();
      expect(applyTeamMemberRoleChange).not.toHaveBeenCalled();
    });

    it.each(Object.entries(calls))('%s rejects an actor from another organization with 403', async (_name, call) => {
      vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(null as never);

      await expect(call(ACTOR_ID)).rejects.toMatchObject({ statusCode: 403 });
      expect(getOrganizationMemberRoleId).toHaveBeenCalledWith(ORG_ID, ACTOR_ID);
    });
  });

  describe('listTeamService', () => {
    it('returns the public shape with pagination', async () => {
      const result = await listTeamService(ORG_ID, ACTOR_ID, { page: 1, limit: 2 });

      expect(result.pagination).toEqual({ page: 1, limit: 2, total: 3, totalPages: 2 });
      expect(result.items).toEqual([
        {
          id: 10,
          profileId: ACTOR_ID,
          name: 'Ada Admin',
          email: 'admin@example.com',
          roleId: ROLE.ADMIN,
          verified: true
        },
        {
          id: 11,
          profileId: 'profile-2',
          name: 'Tim Tutor',
          email: 'tutor@example.com',
          roleId: ROLE.TUTOR,
          verified: true
        }
      ]);
    });

    it('shows a pending member with a null profileId', async () => {
      const result = await listTeamService(ORG_ID, ACTOR_ID, { page: 2, limit: 2 });

      expect(result.items).toEqual([
        { id: 12, profileId: null, name: '', email: 'pending@example.com', roleId: ROLE.TUTOR, verified: false }
      ]);
    });
  });

  describe('getTeamMemberService', () => {
    it('returns one member', async () => {
      const member = await getTeamMemberService(ORG_ID, ACTOR_ID, { memberId: tutor.id });

      expect(member).toMatchObject({ id: tutor.id, name: 'Tim Tutor' });
      expect(getOrgTeam).toHaveBeenCalledWith(ORG_ID);
    });

    it('returns 404 for a member id that is not on this organization team', async () => {
      await expect(getTeamMemberService(ORG_ID, ACTOR_ID, { memberId: 999 })).rejects.toMatchObject({
        statusCode: 404,
        code: ErrorCodes.NOT_FOUND
      });
    });
  });

  describe('updateTeamMemberService', () => {
    it('changes the role through the dashboard service, as the actor', async () => {
      await updateTeamMemberService(ORG_ID, ACTOR_ID, { memberId: tutor.id }, { roleId: ROLE.ADMIN });

      expect(applyTeamMemberRoleChange).toHaveBeenCalledWith(ORG_ID, tutor.id, ROLE.ADMIN, ACTOR_ID, TX);
      expect(reconcileAfterTeamRoleChange).toHaveBeenCalledWith(ORG_ID, { roleChanged: true }, ACTOR_ID);
      expect(updateProfile).not.toHaveBeenCalled();
    });

    it('renames a joined member and leaves the role alone', async () => {
      await updateTeamMemberService(ORG_ID, ACTOR_ID, { memberId: tutor.id }, { name: 'Timothy Tutor' });

      expect(updateProfile).toHaveBeenCalledWith('profile-2', { fullname: 'Timothy Tutor' }, TX);
      expect(applyTeamMemberRoleChange).not.toHaveBeenCalled();
    });

    it('applies the role before the name when both are sent', async () => {
      const order: string[] = [];
      vi.mocked(applyTeamMemberRoleChange).mockImplementation(async () => {
        order.push('role');
        return {} as never;
      });
      vi.mocked(updateProfile).mockImplementation(async () => {
        order.push('name');
        return {} as never;
      });

      await updateTeamMemberService(ORG_ID, ACTOR_ID, { memberId: tutor.id }, { roleId: ROLE.ADMIN, name: 'Tim T' });

      expect(order).toEqual(['role', 'name']);
    });

    it('returns the member as it is after the update', async () => {
      vi.mocked(getOrgTeam)
        .mockResolvedValueOnce([admin, tutor, pending] as never)
        .mockResolvedValueOnce([admin, { ...tutor, roleId: ROLE.ADMIN }, pending] as never);

      const member = await updateTeamMemberService(ORG_ID, ACTOR_ID, { memberId: tutor.id }, { roleId: ROLE.ADMIN });

      expect(member.roleId).toBe(ROLE.ADMIN);
    });

    it('returns 404 for a student or another organization member id, before any write', async () => {
      await expect(
        updateTeamMemberService(ORG_ID, ACTOR_ID, { memberId: 999 }, { roleId: ROLE.ADMIN, name: 'Some Name' })
      ).rejects.toMatchObject({ statusCode: 404 });

      expect(applyTeamMemberRoleChange).not.toHaveBeenCalled();
      expect(updateProfile).not.toHaveBeenCalled();
    });

    it('refuses to rename a pending member and changes nothing, even when a role is sent too', async () => {
      await expect(
        updateTeamMemberService(ORG_ID, ACTOR_ID, { memberId: pending.id }, { roleId: ROLE.ADMIN, name: 'New Name' })
      ).rejects.toMatchObject({ statusCode: 400, field: 'name' });

      expect(applyTeamMemberRoleChange).not.toHaveBeenCalled();
      expect(updateProfile).not.toHaveBeenCalled();
    });

    it('lets a pending member have their role changed', async () => {
      await updateTeamMemberService(ORG_ID, ACTOR_ID, { memberId: pending.id }, { roleId: ROLE.ADMIN });

      expect(applyTeamMemberRoleChange).toHaveBeenCalledWith(ORG_ID, pending.id, ROLE.ADMIN, ACTOR_ID, TX);
    });

    it('passes on the dashboard rules (own role, last admin) and does not rename after a refused role change', async () => {
      vi.mocked(applyTeamMemberRoleChange).mockRejectedValue(
        new AppError('You cannot change your own role', ErrorCodes.ORG_TEAM_ROLE_SELF, 400)
      );

      await expect(
        updateTeamMemberService(ORG_ID, ACTOR_ID, { memberId: admin.id }, { roleId: ROLE.TUTOR, name: 'Ada A' })
      ).rejects.toMatchObject({ statusCode: 400, code: ErrorCodes.ORG_TEAM_ROLE_SELF });

      expect(updateProfile).not.toHaveBeenCalled();
    });

    it('writes the role and the name in one transaction and schedules no reconcile when the name write fails', async () => {
      vi.mocked(updateProfile).mockRejectedValue(new Error('db down'));

      await expect(
        updateTeamMemberService(ORG_ID, ACTOR_ID, { memberId: tutor.id }, { roleId: ROLE.ADMIN, name: 'Tim T' })
      ).rejects.toThrow('db down');

      expect(applyTeamMemberRoleChange).toHaveBeenCalledWith(ORG_ID, tutor.id, ROLE.ADMIN, ACTOR_ID, TX);
      expect(updateProfile).toHaveBeenCalledWith('profile-2', { fullname: 'Tim T' }, TX);
      expect(reconcileAfterTeamRoleChange).not.toHaveBeenCalled();
    });

    it('lets an admin correct their own name', async () => {
      await updateTeamMemberService(ORG_ID, ACTOR_ID, { memberId: admin.id }, { name: 'Ada Lovelace' });

      expect(updateProfile).toHaveBeenCalledWith(ACTOR_ID, { fullname: 'Ada Lovelace' }, TX);
    });
  });
});
