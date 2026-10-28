import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/organization', () => ({
  getOrganizationMemberRoleId: vi.fn()
}));

vi.mock('@api/services/organization', () => ({
  getOrgTeam: vi.fn(),
  removeTeamMember: vi.fn()
}));

vi.mock('@api/services/organization/invite', () => ({
  fetchOrgLinkInvite: vi.fn(),
  getOrCreateLinkInvite: vi.fn(),
  inviteTeamMembers: vi.fn(),
  toggleOrgLinkInvite: vi.fn()
}));

vi.mock('@cio/core/config/dashboard-url', () => ({
  getAppBaseUrl: () => 'https://app.example.com'
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
import { getOrgTeam, removeTeamMember } from '@api/services/organization';
import {
  fetchOrgLinkInvite,
  getOrCreateLinkInvite,
  inviteTeamMembers,
  toggleOrgLinkInvite
} from '@api/services/organization/invite';
import { applyTeamMemberRoleChange, reconcileAfterTeamRoleChange } from '@api/services/organization/team-role';
import { updateProfile } from '@cio/db/queries/auth';
import {
  createTeamInviteLinkService,
  getTeamInviteLinkService,
  getTeamMemberService,
  inviteTeamMembersService,
  listTeamService,
  removeTeamMemberService,
  updateTeamInviteLinkService,
  updateTeamMemberService
} from '@api/services/v1/team';

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
        updateTeamMemberService(ORG_ID, actorId, { memberId: tutor.id }, { roleId: ROLE.ADMIN }),
      invite: (actorId: string | null) =>
        inviteTeamMembersService(ORG_ID, actorId, {
          emails: ['new@example.com'],
          roleId: ROLE.TUTOR,
          confirmedStudentEmails: []
        }),
      remove: (actorId: string | null) => removeTeamMemberService(ORG_ID, actorId, { memberId: tutor.id }),
      getLink: (actorId: string | null) => getTeamInviteLinkService(ORG_ID, actorId, { roleId: ROLE.TUTOR }),
      createLink: (actorId: string | null) => createTeamInviteLinkService(ORG_ID, actorId, { roleId: ROLE.TUTOR }),
      updateLink: (actorId: string | null) =>
        updateTeamInviteLinkService(ORG_ID, actorId, { roleId: ROLE.TUTOR, enabled: false })
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
      expect(inviteTeamMembers).not.toHaveBeenCalled();
      expect(removeTeamMember).not.toHaveBeenCalled();
      expect(fetchOrgLinkInvite).not.toHaveBeenCalled();
      expect(getOrCreateLinkInvite).not.toHaveBeenCalled();
      expect(toggleOrgLinkInvite).not.toHaveBeenCalled();
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

  describe('inviteTeamMembersService', () => {
    it('invites through the dashboard service as the actor, passing the confirmed students on', async () => {
      const result = {
        requiresConfirmation: false,
        studentEmails: [],
        existingTeamMembers: [],
        queuedCount: 1,
        failedEmails: []
      };
      vi.mocked(inviteTeamMembers).mockResolvedValue(result);

      await expect(
        inviteTeamMembersService(ORG_ID, ACTOR_ID, {
          emails: ['student@example.com'],
          roleId: ROLE.ADMIN,
          confirmedStudentEmails: ['student@example.com']
        })
      ).resolves.toEqual(result);

      expect(inviteTeamMembers).toHaveBeenCalledWith(ORG_ID, ['student@example.com'], ROLE.ADMIN, ACTOR_ID, [
        'student@example.com'
      ]);
    });
  });

  describe('removeTeamMemberService', () => {
    it('removes through the dashboard service as the actor and returns the removed member', async () => {
      vi.mocked(removeTeamMember).mockResolvedValue({ id: tutor.id, email: tutor.email, roleId: ROLE.TUTOR } as never);

      await expect(removeTeamMemberService(ORG_ID, ACTOR_ID, { memberId: tutor.id })).resolves.toEqual({
        id: tutor.id,
        email: tutor.email,
        roleId: ROLE.TUTOR
      });
      expect(removeTeamMember).toHaveBeenCalledWith(ORG_ID, tutor.id, ACTOR_ID);
    });

    it('passes on the dashboard rules (yourself, last admin)', async () => {
      vi.mocked(removeTeamMember).mockRejectedValue(
        new AppError('You cannot remove yourself from the team', ErrorCodes.ORG_TEAM_REMOVE_SELF, 400)
      );

      await expect(removeTeamMemberService(ORG_ID, ACTOR_ID, { memberId: admin.id })).rejects.toMatchObject({
        statusCode: 400,
        code: ErrorCodes.ORG_TEAM_REMOVE_SELF
      });
    });
  });

  describe('team invite link', () => {
    const link = { id: 'invite-1', token: 'tok/en', roleId: ROLE.TUTOR, isRevoked: false };
    const publicLink = {
      id: 'invite-1',
      roleId: ROLE.TUTOR,
      enabled: true,
      url: 'https://app.example.com/invite/link/tok%2Fen'
    };

    it('returns the link with a full URL and no raw token', async () => {
      vi.mocked(fetchOrgLinkInvite).mockResolvedValue(link);

      await expect(getTeamInviteLinkService(ORG_ID, ACTOR_ID, { roleId: ROLE.TUTOR })).resolves.toEqual(publicLink);
      expect(fetchOrgLinkInvite).toHaveBeenCalledWith(ORG_ID, ROLE.TUTOR);
    });

    it('returns null when the role has no active link', async () => {
      vi.mocked(fetchOrgLinkInvite).mockResolvedValue(null);

      await expect(getTeamInviteLinkService(ORG_ID, ACTOR_ID, { roleId: ROLE.ADMIN })).resolves.toBeNull();
    });

    it('gets or creates the link as the actor', async () => {
      vi.mocked(getOrCreateLinkInvite).mockResolvedValue(link);

      await expect(createTeamInviteLinkService(ORG_ID, ACTOR_ID, { roleId: ROLE.TUTOR })).resolves.toEqual(publicLink);
      expect(getOrCreateLinkInvite).toHaveBeenCalledWith(ORG_ID, ROLE.TUTOR, ACTOR_ID);
    });

    it('maps enabled to the dashboard revoke flag', async () => {
      vi.mocked(toggleOrgLinkInvite).mockResolvedValue({ ...link, isRevoked: true });

      await expect(
        updateTeamInviteLinkService(ORG_ID, ACTOR_ID, { roleId: ROLE.TUTOR, enabled: false })
      ).resolves.toMatchObject({ enabled: false });
      expect(toggleOrgLinkInvite).toHaveBeenCalledWith(ORG_ID, ROLE.TUTOR, true, ACTOR_ID);

      await updateTeamInviteLinkService(ORG_ID, ACTOR_ID, { roleId: ROLE.TUTOR, enabled: true });
      expect(toggleOrgLinkInvite).toHaveBeenLastCalledWith(ORG_ID, ROLE.TUTOR, false, ACTOR_ID);

      await updateTeamInviteLinkService(ORG_ID, ACTOR_ID, { roleId: ROLE.ADMIN, enabled: true });
      expect(toggleOrgLinkInvite).toHaveBeenLastCalledWith(ORG_ID, ROLE.ADMIN, false, ACTOR_ID);
    });
  });
});
