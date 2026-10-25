import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Reconciliation reads the org role outside the membership transaction, so it must be
 * scheduled only after that transaction commits. `db.transaction` is mocked to record when
 * its callback settles so these tests assert the ordering, not just that it happens.
 */

const callOrder: string[] = [];

vi.mock('@cio/db/drizzle', () => ({
  db: {
    transaction: vi.fn(async (callback: (tx: unknown) => Promise<unknown>) => {
      const result = await callback({});
      callOrder.push('transaction:committed');

      return result;
    })
  }
}));

vi.mock('@cio/core/services/organization/course-roles', () => ({
  scheduleCourseRoleReconcile: vi.fn(async () => {
    callOrder.push('reconcile:scheduled');
  })
}));

vi.mock('@cio/db/queries/organization', () => ({
  claimPendingOrganizationInvite: vi.fn(),
  createOrganizationInvite: vi.fn(),
  createOrganizationInviteAudit: vi.fn(),
  createOrganizationMember: vi.fn(),
  createOrganizationMembers: vi.fn(),
  createLinkInvite: vi.fn(),
  getActivePendingOrgInviteForEmail: vi.fn(),
  getOrganizationById: vi.fn(),
  getOrganizationMembersByNormalizedEmails: vi.fn(),
  getOrganizationInviteByTokenHash: vi.fn(),
  lockOrganizationForUpdate: vi.fn(),
  getOrgLinkInvite: vi.fn(),
  getOrgLinkInviteWithOrg: vi.fn(),
  revokeActiveOrganizationInvitesByEmails: vi.fn(),
  selectOrganizationInviteWithOrgByInviteId: vi.fn(),
  selectOrganizationInviteWithOrgByTokenHash: vi.fn(),
  selectOrganizationMemberByOrgAndNormalizedEmail: vi.fn(),
  selectOrganizationMemberByOrgAndProfile: vi.fn(),
  setLinkInviteRevoked: vi.fn(),
  updateOrganizationMemberById: vi.fn()
}));

vi.mock('@cio/db/queries/course', () => ({ getCourseGroupIds: vi.fn() }));
vi.mock('@cio/db/queries/group', () => ({ enrollUsersInCourseGroups: vi.fn() }));
vi.mock('@cio/core/utils/redis/org-stats-cache', () => ({ invalidateOrgStats: vi.fn() }));
vi.mock('@cio/db/queries/cohort', () => ({
  addCohortMember: vi.fn(),
  getCourseIdsByCohortIds: vi.fn(),
  getExistingCohortMembers: vi.fn()
}));
vi.mock('@cio/core/config/dashboard-url', () => ({ getAppBaseUrl: vi.fn(() => 'https://app.test') }));
vi.mock('@api/services/organization/student-limit', () => ({ assertStudentCapacityOrThrow: vi.fn() }));
vi.mock('@api/utils/org', () => ({
  parseCourseIdsFromInviteMetadata: vi.fn(() => []),
  parseCohortIdsFromInviteMetadata: vi.fn(() => [])
}));
// Mocked to sidestep Vite's nested-subpath resolution quirk on `@cio/*` exports.
vi.mock('@cio/db/queries/auth/profile', () => ({
  getProfileById: vi.fn(),
  markUserAndProfileEmailVerified: vi.fn()
}));
vi.mock('@api/services/jobs', () => ({ enqueueTransactionalEmail: vi.fn() }));
vi.mock('@cio/email', () => ({
  buildEmailBranding: vi.fn(),
  buildEmailFromName: vi.fn(),
  sanitizeEmailSubject: vi.fn()
}));
vi.mock('@api/services/course/compliance', () => ({
  ensureComplianceEnrollmentRecordsForProfiles: vi.fn().mockResolvedValue({ createdCount: 0, createdRecords: [] }),
  emitComplianceEnrollmentEvents: vi.fn().mockResolvedValue(undefined)
}));
vi.mock('@cio/core/services/webhook/emit', () => ({
  emitWebhookEvent: vi.fn().mockResolvedValue(undefined),
  emitOrganizationMemberWebhookEvent: vi.fn().mockResolvedValue(undefined),
  emitCohortMemberWebhookEvent: vi.fn().mockResolvedValue(undefined)
}));

import {
  acceptLinkInvite,
  acceptOrganizationInvite,
  fetchOrgLinkInvite,
  getOrCreateLinkInvite,
  inviteTeamMembers,
  toggleOrgLinkInvite
} from '@api/services/organization/invite';
import { scheduleCourseRoleReconcile } from '@cio/core/services/organization/course-roles';
import {
  claimPendingOrganizationInvite,
  createLinkInvite,
  createOrganizationInvite,
  createOrganizationMembers,
  getOrganizationById,
  getOrganizationMembersByNormalizedEmails,
  revokeActiveOrganizationInvitesByEmails,
  getOrgLinkInvite,
  getOrgLinkInviteWithOrg,
  lockOrganizationForUpdate,
  setLinkInviteRevoked,
  selectOrganizationInviteWithOrgByTokenHash,
  selectOrganizationMemberByOrgAndNormalizedEmail,
  selectOrganizationMemberByOrgAndProfile,
  updateOrganizationMemberById
} from '@cio/db/queries/organization';
import { ROLE } from '@cio/utils/constants';
import { enqueueTransactionalEmail } from '@api/services/jobs';

const ORG_ID = 'org-1';
const USER = { id: 'user-1', email: 'Admin@Example.com' };

describe('acceptLinkInvite course-role reconciliation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    callOrder.length = 0;

    vi.mocked(getOrgLinkInviteWithOrg).mockResolvedValue({
      invite: { id: 'invite-1', organizationId: ORG_ID, roleId: ROLE.TUTOR, isRevoked: false },
      organization: { id: ORG_ID, siteName: 'acme' }
    } as never);
    vi.mocked(selectOrganizationMemberByOrgAndNormalizedEmail).mockResolvedValue(null as never);
    // Existing member the invite is about to lower from admin to tutor.
    vi.mocked(selectOrganizationMemberByOrgAndProfile).mockResolvedValue({
      id: 10,
      roleId: ROLE.ADMIN
    } as never);
    vi.mocked(updateOrganizationMemberById).mockResolvedValue(undefined as never);
    vi.mocked(lockOrganizationForUpdate).mockResolvedValue(undefined as never);
    vi.mocked(claimPendingOrganizationInvite).mockResolvedValue({ id: 'invite-1' } as never);
  });

  it('schedules reconciliation after the membership transaction commits', async () => {
    await acceptLinkInvite('token-1', USER as never);

    expect(scheduleCourseRoleReconcile).toHaveBeenCalledWith(ORG_ID, USER.id);
    expect(callOrder).toEqual(['transaction:committed', 'reconcile:scheduled']);
  });

  it('does not schedule reconciliation from inside the transaction', async () => {
    await acceptLinkInvite('token-1', USER as never);

    const commitIndex = callOrder.indexOf('transaction:committed');
    const reconcileIndex = callOrder.indexOf('reconcile:scheduled');

    expect(commitIndex).toBeGreaterThanOrEqual(0);
    expect(reconcileIndex).toBeGreaterThan(commitIndex);
  });

  it('writes the invite role read after the organization lock', async () => {
    const staleInvite = {
      invite: {
        id: 'invite-1',
        organizationId: ORG_ID,
        roleId: ROLE.ADMIN,
        isRevoked: false,
        acceptedAt: null,
        expiresAt: '2099-01-01T00:00:00.000Z',
        email: 'admin@example.com',
        metadata: {}
      },
      organization: { id: ORG_ID, siteName: 'acme' }
    };
    const lockedInvite = {
      ...staleInvite,
      invite: { ...staleInvite.invite, roleId: ROLE.TUTOR }
    };

    vi.mocked(selectOrganizationInviteWithOrgByTokenHash)
      .mockResolvedValueOnce(staleInvite as never)
      .mockResolvedValueOnce(lockedInvite as never);

    await acceptOrganizationInvite('token-1', USER as never);

    expect(lockOrganizationForUpdate).toHaveBeenCalledWith(ORG_ID, expect.anything());
    expect(updateOrganizationMemberById).toHaveBeenCalledWith(
      expect.anything(),
      10,
      expect.objectContaining({ roleId: ROLE.TUTOR })
    );
  });
});

describe('accepting student promotions', () => {
  it.each([ROLE.TUTOR, ROLE.ADMIN])('updates the existing student to role %s only on acceptance', async (roleId) => {
    vi.clearAllMocks();
    vi.mocked(selectOrganizationInviteWithOrgByTokenHash).mockResolvedValue({
      invite: {
        id: 'promotion-invite',
        organizationId: ORG_ID,
        roleId,
        email: USER.email.toLowerCase(),
        acceptedAt: null,
        isRevoked: false,
        expiresAt: '2099-01-01T00:00:00.000Z',
        metadata: {}
      },
      organization: { id: ORG_ID, siteName: 'acme' }
    } as never);
    vi.mocked(selectOrganizationMemberByOrgAndNormalizedEmail).mockResolvedValue({
      id: 10,
      profileId: USER.id,
      roleId: ROLE.STUDENT
    } as never);
    vi.mocked(claimPendingOrganizationInvite).mockResolvedValue({ id: 'promotion-invite' } as never);

    const result = await acceptOrganizationInvite('promotion-token', USER);

    expect(result.roleId).toBe(roleId);
    expect(updateOrganizationMemberById).toHaveBeenCalledWith(
      expect.anything(),
      10,
      expect.objectContaining({
        roleId,
        profileId: USER.id,
        verified: true
      })
    );
    expect(scheduleCourseRoleReconcile).toHaveBeenCalledWith(ORG_ID, USER.id);
  });
});

describe('team link invite roles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getOrgLinkInvite).mockImplementation(async (_orgId, roleId) => {
      if (roleId !== ROLE.TUTOR) return null;

      return {
        id: 'teacher-invite',
        roleId: ROLE.TUTOR,
        isRevoked: false,
        metadata: { token: 'teacher-token' }
      } as never;
    });
    vi.mocked(createLinkInvite).mockImplementation(
      async (data) =>
        ({
          ...data,
          id: 'new-invite',
          isRevoked: false
        }) as never
    );
  });

  it('reuses the selected role link without changing other roles', async () => {
    const invite = await getOrCreateLinkInvite(ORG_ID, ROLE.TUTOR, USER.id);

    expect(invite.token).toBe('teacher-token');
    expect(invite.roleId).toBe(ROLE.TUTOR);
    expect(getOrgLinkInvite).toHaveBeenCalledWith(ORG_ID, ROLE.TUTOR, expect.anything());
    expect(createLinkInvite).not.toHaveBeenCalled();
    expect(setLinkInviteRevoked).not.toHaveBeenCalled();
  });

  it('creates an admin link while preserving the teacher link', async () => {
    const adminInvite = await getOrCreateLinkInvite(ORG_ID, ROLE.ADMIN, USER.id);
    const teacherInvite = await getOrCreateLinkInvite(ORG_ID, ROLE.TUTOR, USER.id);

    expect(adminInvite.roleId).toBe(ROLE.ADMIN);
    expect(adminInvite.token).not.toBe('teacher-token');
    expect(teacherInvite.token).toBe('teacher-token');
    expect(createLinkInvite).toHaveBeenCalledOnce();
    expect(createLinkInvite).toHaveBeenCalledWith(expect.objectContaining({ roleId: ROLE.ADMIN }), expect.anything());
    expect(setLinkInviteRevoked).not.toHaveBeenCalled();
    expect(vi.mocked(lockOrganizationForUpdate).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(getOrgLinkInvite).mock.invocationCallOrder[0]
    );
    expect(vi.mocked(getOrgLinkInvite).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(createLinkInvite).mock.invocationCallOrder[0]
    );
  });

  it('reuses both existing links when switching roles', async () => {
    const adminLink = {
      id: 'admin-invite',
      roleId: ROLE.ADMIN,
      isRevoked: false,
      metadata: { token: 'admin-token' }
    };
    vi.mocked(getOrgLinkInvite).mockImplementation(async (_orgId, roleId) => {
      if (roleId === ROLE.ADMIN) return adminLink as never;

      return {
        id: 'teacher-invite',
        roleId: ROLE.TUTOR,
        isRevoked: false,
        metadata: { token: 'teacher-token' }
      } as never;
    });

    const adminInvite = await getOrCreateLinkInvite(ORG_ID, ROLE.ADMIN, USER.id);
    const teacherInvite = await getOrCreateLinkInvite(ORG_ID, ROLE.TUTOR, USER.id);

    expect(adminInvite.token).toBe('admin-token');
    expect(teacherInvite.token).toBe('teacher-token');
    expect(createLinkInvite).not.toHaveBeenCalled();
    expect(setLinkInviteRevoked).not.toHaveBeenCalled();
  });

  it('looks up and revokes only the selected role link', async () => {
    vi.mocked(setLinkInviteRevoked).mockResolvedValue({
      id: 'admin-invite',
      roleId: ROLE.ADMIN,
      isRevoked: true,
      metadata: { token: 'admin-token' }
    } as never);

    await fetchOrgLinkInvite(ORG_ID, ROLE.TUTOR);
    const adminInvite = await toggleOrgLinkInvite(ORG_ID, ROLE.ADMIN, true, USER.id);

    expect(getOrgLinkInvite).toHaveBeenCalledWith(ORG_ID, ROLE.TUTOR);
    expect(setLinkInviteRevoked).toHaveBeenCalledWith(ORG_ID, ROLE.ADMIN, true, USER.id, expect.anything());
    expect(vi.mocked(lockOrganizationForUpdate).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(setLinkInviteRevoked).mock.invocationCallOrder[0]
    );
    expect(adminInvite.roleId).toBe(ROLE.ADMIN);
  });
});

describe('team invitations for existing members', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getOrganizationById).mockResolvedValue({ id: ORG_ID, name: 'Acme', siteName: 'acme' } as never);
    vi.mocked(getOrganizationMembersByNormalizedEmails).mockResolvedValue([
      { normalizedEmail: 'student@example.com', profileId: 'student-1', roleId: ROLE.STUDENT }
    ]);
    vi.mocked(revokeActiveOrganizationInvitesByEmails).mockResolvedValue([]);
    vi.mocked(createOrganizationInvite).mockResolvedValue({ id: 'new-role-invite' } as never);
    vi.mocked(createOrganizationMembers).mockResolvedValue([]);
    vi.mocked(enqueueTransactionalEmail).mockResolvedValue(undefined as never);
  });

  it('requires confirmation before sending anything to a student or a mixed list', async () => {
    const result = await inviteTeamMembers(ORG_ID, ['Student@Example.com', 'new@example.com'], ROLE.TUTOR, USER.id);

    expect(result.requiresConfirmation).toBe(true);
    expect(result.studentEmails).toEqual(['student@example.com']);
    expect(result.queuedCount).toBe(0);
    expect(createOrganizationMembers).not.toHaveBeenCalled();
    expect(createOrganizationInvite).not.toHaveBeenCalled();
    expect(revokeActiveOrganizationInvitesByEmails).not.toHaveBeenCalled();
    expect(enqueueTransactionalEmail).not.toHaveBeenCalled();
  });

  it.each([ROLE.TUTOR, ROLE.ADMIN])(
    'sends a confirmed role %s invitation without changing the student membership',
    async (roleId) => {
      const result = await inviteTeamMembers(ORG_ID, ['student@example.com'], roleId, USER.id, ['student@example.com']);

      expect(result.requiresConfirmation).toBe(false);
      expect(result.queuedCount).toBe(1);
      expect(result.failedEmails).toEqual([]);
      expect(createOrganizationInvite).toHaveBeenCalledWith(
        expect.objectContaining({ roleId, email: 'student@example.com' })
      );
      expect(enqueueTransactionalEmail).toHaveBeenCalledWith(
        'inviteTeacher',
        expect.objectContaining({ to: 'student@example.com' })
      );
      expect(createOrganizationMembers).not.toHaveBeenCalled();
      expect(updateOrganizationMemberById).not.toHaveBeenCalled();
    }
  );

  it('creates a membership only for new addresses in a confirmed mixed list', async () => {
    const result = await inviteTeamMembers(ORG_ID, ['student@example.com', 'new@example.com'], ROLE.ADMIN, USER.id, [
      'student@example.com'
    ]);

    expect(result.queuedCount).toBe(2);
    expect(createOrganizationMembers).toHaveBeenCalledWith([
      { organizationId: ORG_ID, email: 'new@example.com', roleId: ROLE.ADMIN, verified: false }
    ]);
    expect(updateOrganizationMemberById).not.toHaveBeenCalled();
  });

  it('requires confirmation again when another student is discovered', async () => {
    vi.mocked(getOrganizationMembersByNormalizedEmails).mockResolvedValue([
      { normalizedEmail: 'student@example.com', profileId: 'student-1', roleId: ROLE.STUDENT },
      { normalizedEmail: 'new@example.com', profileId: 'student-2', roleId: ROLE.STUDENT }
    ]);

    const result = await inviteTeamMembers(ORG_ID, ['student@example.com', 'new@example.com'], ROLE.TUTOR, USER.id, [
      'student@example.com'
    ]);

    expect(result.requiresConfirmation).toBe(true);
    expect(result.studentEmails).toEqual(['student@example.com', 'new@example.com']);
    expect(enqueueTransactionalEmail).not.toHaveBeenCalled();
  });

  it.each([ROLE.TUTOR, ROLE.ADMIN])(
    'reports an existing team role %s instead of pretending to send',
    async (roleId) => {
      vi.mocked(getOrganizationMembersByNormalizedEmails).mockResolvedValue([
        { normalizedEmail: 'staff@example.com', profileId: 'staff-1', roleId }
      ]);

      const result = await inviteTeamMembers(ORG_ID, ['staff@example.com', 'new@example.com'], ROLE.ADMIN, USER.id);

      expect(result.existingTeamMembers).toEqual([{ email: 'staff@example.com', roleId }]);
      expect(result.queuedCount).toBe(0);
      expect(createOrganizationMembers).not.toHaveBeenCalled();
      expect(enqueueTransactionalEmail).not.toHaveBeenCalled();
    }
  );

  it('reports email queue failure instead of an invitation sent', async () => {
    vi.mocked(enqueueTransactionalEmail).mockRejectedValueOnce(new Error('Queue unavailable'));

    const result = await inviteTeamMembers(ORG_ID, ['student@example.com'], ROLE.TUTOR, USER.id, [
      'student@example.com'
    ]);

    expect(result.queuedCount).toBe(0);
    expect(result.failedEmails).toEqual(['student@example.com']);
  });
});
