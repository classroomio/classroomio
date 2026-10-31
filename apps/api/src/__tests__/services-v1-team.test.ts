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

vi.mock('@api/services/account/profile', () => ({
  applyProfileUpdate: vi.fn()
}));

vi.mock('@api/services/account/profile-updated-email', () => ({
  sendProfileUpdatedEmail: vi.fn()
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
import { applyProfileUpdate } from '@api/services/account/profile';
import { sendProfileUpdatedEmail } from '@api/services/account/profile-updated-email';
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
  fullname: 'Ada Admin',
  username: 'ada',
  avatarUrl: 'https://cdn.example.com/ada.png',
  locale: 'en'
};
const tutor = {
  id: 11,
  email: 'tutor@example.com',
  verified: true,
  roleId: ROLE.TUTOR,
  profileId: 'profile-2',
  fullname: 'Tim Tutor',
  username: 'tim',
  avatarUrl: '',
  locale: 'fr'
};
const pending = {
  id: 12,
  email: 'pending@example.com',
  verified: false,
  roleId: ROLE.TUTOR,
  profileId: undefined,
  fullname: '',
  username: null,
  avatarUrl: '',
  locale: null
};
const APPLIED = { profile: { id: 'profile-2' }, previous: { id: 'profile-2' }, changedFields: ['fullname'] };

describe('services/v1/team', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getOrganizationMemberRoleId).mockResolvedValue(ROLE.ADMIN);
    vi.mocked(getOrgTeam).mockResolvedValue([admin, tutor, pending] as never);
    vi.mocked(applyProfileUpdate).mockResolvedValue(APPLIED as never);
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
          username: 'ada',
          email: 'admin@example.com',
          avatarUrl: 'https://cdn.example.com/ada.png',
          locale: 'en',
          roleId: ROLE.ADMIN,
          verified: true
        },
        {
          id: 11,
          profileId: 'profile-2',
          name: 'Tim Tutor',
          username: 'tim',
          email: 'tutor@example.com',
          avatarUrl: '',
          locale: 'fr',
          roleId: ROLE.TUTOR,
          verified: true
        }
      ]);
    });

    it('shows a pending member with a null profileId, username and locale', async () => {
      const result = await listTeamService(ORG_ID, ACTOR_ID, { page: 2, limit: 2 });

      expect(result.items).toEqual([
        {
          id: 12,
          profileId: null,
          name: '',
          username: null,
          email: 'pending@example.com',
          avatarUrl: '',
          locale: null,
          roleId: ROLE.TUTOR,
          verified: false
        }
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
      expect(applyProfileUpdate).not.toHaveBeenCalled();
    });

    it('renames a joined member and leaves the role alone', async () => {
      await updateTeamMemberService(ORG_ID, ACTOR_ID, { memberId: tutor.id }, { name: 'Timothy Tutor' });

      expect(applyProfileUpdate).toHaveBeenCalledWith('profile-2', { fullname: 'Timothy Tutor' }, TX);
      expect(applyTeamMemberRoleChange).not.toHaveBeenCalled();
    });

    it('applies the role before the name when both are sent', async () => {
      const order: string[] = [];
      vi.mocked(applyTeamMemberRoleChange).mockImplementation(async () => {
        order.push('role');
        return {} as never;
      });
      vi.mocked(applyProfileUpdate).mockImplementation(async () => {
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
      expect(applyProfileUpdate).not.toHaveBeenCalled();
    });

    it('refuses to rename a pending member and changes nothing, even when a role is sent too', async () => {
      await expect(
        updateTeamMemberService(ORG_ID, ACTOR_ID, { memberId: pending.id }, { roleId: ROLE.ADMIN, name: 'New Name' })
      ).rejects.toMatchObject({ statusCode: 400, field: 'name' });

      expect(applyTeamMemberRoleChange).not.toHaveBeenCalled();
      expect(applyProfileUpdate).not.toHaveBeenCalled();
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

      expect(applyProfileUpdate).not.toHaveBeenCalled();
    });

    it('writes the role and the name in one transaction and schedules no reconcile when the name write fails', async () => {
      vi.mocked(applyProfileUpdate).mockRejectedValue(new Error('db down'));

      await expect(
        updateTeamMemberService(ORG_ID, ACTOR_ID, { memberId: tutor.id }, { roleId: ROLE.ADMIN, name: 'Tim T' })
      ).rejects.toThrow('db down');

      expect(applyTeamMemberRoleChange).toHaveBeenCalledWith(ORG_ID, tutor.id, ROLE.ADMIN, ACTOR_ID, TX);
      expect(applyProfileUpdate).toHaveBeenCalledWith('profile-2', { fullname: 'Tim T' }, TX);
      expect(reconcileAfterTeamRoleChange).not.toHaveBeenCalled();
      expect(sendProfileUpdatedEmail).not.toHaveBeenCalled();
    });

    it('lets an admin correct their own name', async () => {
      await updateTeamMemberService(ORG_ID, ACTOR_ID, { memberId: admin.id }, { name: 'Ada Lovelace' });

      expect(applyProfileUpdate).toHaveBeenCalledWith(ACTOR_ID, { fullname: 'Ada Lovelace' }, TX);
    });

    it('sets username, avatar and language in the same transaction', async () => {
      await updateTeamMemberService(
        ORG_ID,
        ACTOR_ID,
        { memberId: tutor.id },
        { username: 'timothy', avatarUrl: 'https://cdn.example.com/tim.png', locale: 'de' }
      );

      expect(applyProfileUpdate).toHaveBeenCalledWith(
        'profile-2',
        { username: 'timothy', avatarUrl: 'https://cdn.example.com/tim.png', locale: 'de' },
        TX
      );
    });

    it('emails the person after the write, as an org admin change', async () => {
      await updateTeamMemberService(ORG_ID, ACTOR_ID, { memberId: tutor.id }, { name: 'Timothy Tutor' });

      expect(sendProfileUpdatedEmail).toHaveBeenCalledWith(APPLIED, {
        kind: 'org_admin',
        orgId: ORG_ID,
        actorId: ACTOR_ID
      });
    });

    it('sends no profile email when only the role changes', async () => {
      await updateTeamMemberService(ORG_ID, ACTOR_ID, { memberId: tutor.id }, { roleId: ROLE.ADMIN });

      expect(sendProfileUpdatedEmail).not.toHaveBeenCalled();
    });

    it('refuses a username change on a pending member and names the field', async () => {
      await expect(
        updateTeamMemberService(ORG_ID, ACTOR_ID, { memberId: pending.id }, { username: 'newuser' })
      ).rejects.toMatchObject({ statusCode: 400, field: 'username' });

      expect(applyProfileUpdate).not.toHaveBeenCalled();
    });

    it('passes on a taken username as 400 and rolls back a role sent with it', async () => {
      vi.mocked(applyProfileUpdate).mockRejectedValue(
        new AppError('Username already exists', ErrorCodes.VALIDATION_ERROR, 400, 'username')
      );

      await expect(
        updateTeamMemberService(ORG_ID, ACTOR_ID, { memberId: tutor.id }, { roleId: ROLE.ADMIN, username: 'ada' })
      ).rejects.toMatchObject({ statusCode: 400, field: 'username', message: 'Username already exists' });

      expect(reconcileAfterTeamRoleChange).not.toHaveBeenCalled();
      expect(sendProfileUpdatedEmail).not.toHaveBeenCalled();
    });
  });
});
