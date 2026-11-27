import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/organization', () => ({
  getOrganizationById: vi.fn(),
  getOrganizationMemberIdByOrgAndProfile: vi.fn(),
  selectOrganizationMemberByOrgAndNormalizedEmail: vi.fn()
}));

vi.mock('@cio/db/queries/organization/invite', () => ({
  getActivePendingOrgInviteForEmail: vi.fn()
}));

vi.mock('@cio/db/queries/auth', () => ({
  getProfileById: vi.fn()
}));

vi.mock('@cio/db/drizzle', () => ({
  db: { transaction: vi.fn((callback: (tx: unknown) => unknown) => callback({})) }
}));

vi.mock('@api/services/organization/invite-binding', () => ({
  bindProfileInOrg: vi.fn(),
  buildFulfilledSummary: vi.fn(async () => ({ courses: [], cohorts: [] })),
  runBindingSideEffects: vi.fn()
}));

vi.mock('@cio/core/config/env', () => ({
  env: { PUBLIC_IS_SELFHOSTED: 'false' }
}));

vi.mock('@cio/core/services/organization/course-roles', () => ({
  scheduleCourseRoleReconcile: vi.fn()
}));

import { joinOrganization } from '@api/services/organization/join';
import { scheduleCourseRoleReconcile } from '@cio/core/services/organization/course-roles';
import {
  bindProfileInOrg,
  buildFulfilledSummary,
  runBindingSideEffects
} from '@api/services/organization/invite-binding';
import { env } from '@cio/core/config/env';
import { getProfileById } from '@cio/db/queries/auth';
import {
  getOrganizationById,
  getOrganizationMemberIdByOrgAndProfile,
  selectOrganizationMemberByOrgAndNormalizedEmail
} from '@cio/db/queries/organization';
import { getActivePendingOrgInviteForEmail } from '@cio/db/queries/organization/invite';
import { ROLE } from '@cio/utils/constants';

const USER_ID = 'user-1';
const ORG_ID = 'org-1';

const bindResult = {
  member: { id: 1, organizationId: ORG_ID, roleId: ROLE.STUDENT },
  createdMember: true,
  linkedPendingMember: false,
  claimed: { groups: 0, cohorts: 0, programs: 0, removedDuplicates: 0, courseIds: [], cohortIds: [] },
  claimEnrollment: { enrolledMembers: [], complianceRecords: [], cohortMembers: [] },
  fulfilled: { orgInvites: [], courseInvites: [], courseIds: [], cohortIds: [], skippedCourseInviteIds: [] },
  enrollment: { enrolledMembers: [], complianceRecords: [], cohortMembers: [] },
  seatCheck: null
};

describe('joinOrganization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    env.PUBLIC_IS_SELFHOSTED = 'false';
    vi.mocked(getOrganizationMemberIdByOrgAndProfile).mockResolvedValue(null);
    vi.mocked(getProfileById).mockResolvedValue({ id: USER_ID, email: 'Learner@Example.com' } as never);
    vi.mocked(getActivePendingOrgInviteForEmail).mockResolvedValue(null);
    vi.mocked(selectOrganizationMemberByOrgAndNormalizedEmail).mockResolvedValue(null as never);
    vi.mocked(getOrganizationById).mockResolvedValue({
      id: ORG_ID,
      disableSignup: false,
      settings: {}
    } as never);
    vi.mocked(bindProfileInOrg).mockResolvedValue({ ...bindResult } as never);
  });

  it('rejects Join Academy on self-hosted instances', async () => {
    env.PUBLIC_IS_SELFHOSTED = 'true';

    await expect(joinOrganization(USER_ID, ORG_ID)).rejects.toMatchObject({ statusCode: 403 });
    expect(bindProfileInOrg).not.toHaveBeenCalled();
  });

  it('does not change an existing membership', async () => {
    vi.mocked(getOrganizationMemberIdByOrgAndProfile).mockResolvedValue(1);

    const result = await joinOrganization(USER_ID, ORG_ID);

    expect(result).toEqual({ alreadyMember: true, linkedExistingMember: false });
    expect(bindProfileInOrg).not.toHaveBeenCalled();
  });

  it('returns a pending invite instead of creating a student membership', async () => {
    vi.mocked(getActivePendingOrgInviteForEmail).mockResolvedValue({ id: 'invite-1' } as never);

    const result = await joinOrganization(USER_ID, ORG_ID);

    expect(result.pendingInvite).toBe(true);
    expect(bindProfileInOrg).not.toHaveBeenCalled();
  });

  it('links an email-only roster row without changing its role', async () => {
    vi.mocked(bindProfileInOrg).mockResolvedValue({
      ...bindResult,
      createdMember: false,
      linkedPendingMember: true,
      member: { id: 2, organizationId: ORG_ID, roleId: ROLE.TUTOR }
    } as never);

    const result = await joinOrganization(USER_ID, ORG_ID);

    expect(bindProfileInOrg).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        orgId: ORG_ID,
        profileId: USER_ID,
        email: 'learner@example.com',
        trigger: 'join-academy',
        identityProven: false,
        roleForNewMember: ROLE.STUDENT
      })
    );
    expect(result).toMatchObject({ alreadyMember: true, linkedExistingMember: true });
  });

  it('passes a verified email through as proven identity', async () => {
    vi.mocked(getProfileById).mockResolvedValue({
      id: USER_ID,
      email: 'Learner@Example.com',
      isEmailVerified: true
    } as never);

    await joinOrganization(USER_ID, ORG_ID);

    expect(bindProfileInOrg).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ identityProven: true }));
  });

  it('propagates a seat-limit refusal from the binding', async () => {
    vi.mocked(bindProfileInOrg).mockRejectedValueOnce(
      Object.assign(new Error('This organization has reached its limit'), { statusCode: 403 })
    );

    await expect(joinOrganization(USER_ID, ORG_ID)).rejects.toMatchObject({ statusCode: 403 });
  });

  it('rejects joins when public signup is disabled', async () => {
    vi.mocked(getOrganizationById).mockResolvedValue({
      id: ORG_ID,
      disableSignup: true,
      settings: {}
    } as never);

    await expect(joinOrganization(USER_ID, ORG_ID)).rejects.toMatchObject({ statusCode: 403 });
    expect(bindProfileInOrg).not.toHaveBeenCalled();
  });

  it('rejects joins when the academy is invite-only', async () => {
    vi.mocked(getOrganizationById).mockResolvedValue({
      id: ORG_ID,
      disableSignup: false,
      settings: { signup: { inviteOnly: true } }
    } as never);

    await expect(joinOrganization(USER_ID, ORG_ID)).rejects.toMatchObject({ statusCode: 403 });
    expect(bindProfileInOrg).not.toHaveBeenCalled();
  });

  it('creates a student membership for an open academy', async () => {
    const result = await joinOrganization(USER_ID, ORG_ID);

    expect(runBindingSideEffects).toHaveBeenCalledWith(expect.objectContaining({ createdMember: true }), {
      orgId: ORG_ID,
      profileId: USER_ID,
      email: 'learner@example.com',
      trigger: 'join-academy'
    });
    expect(result).toMatchObject({ alreadyMember: false, linkedExistingMember: false });
    expect(buildFulfilledSummary).toHaveBeenCalledWith(ORG_ID, expect.objectContaining({ createdMember: true }));
  });

  it('reconciles course roles when joining, so a former team member cannot keep instructor rights', async () => {
    await joinOrganization(USER_ID, ORG_ID);

    expect(scheduleCourseRoleReconcile).toHaveBeenCalledWith(ORG_ID, USER_ID);
  });

  it('does not reconcile course roles when the user is already a member', async () => {
    vi.mocked(getOrganizationMemberIdByOrgAndProfile).mockResolvedValue('member-1' as never);

    await joinOrganization(USER_ID, ORG_ID);

    expect(scheduleCourseRoleReconcile).not.toHaveBeenCalled();
  });

  describe('roster members on a closed academy', () => {
    beforeEach(() => {
      vi.mocked(getOrganizationById).mockResolvedValue({
        id: ORG_ID,
        disableSignup: true,
        settings: { signup: { inviteOnly: true } }
      } as never);
      vi.mocked(selectOrganizationMemberByOrgAndNormalizedEmail).mockResolvedValue({
        id: 2,
        profileId: null,
        roleId: ROLE.STUDENT,
        email: 'learner@example.com'
      } as never);
    });

    it('links a pending roster row when the email is verified', async () => {
      vi.mocked(getProfileById).mockResolvedValue({
        id: USER_ID,
        email: 'Learner@Example.com',
        isEmailVerified: true
      } as never);
      vi.mocked(bindProfileInOrg).mockResolvedValue({
        ...bindResult,
        createdMember: false,
        linkedPendingMember: true
      } as never);

      const result = await joinOrganization(USER_ID, ORG_ID);

      expect(selectOrganizationMemberByOrgAndNormalizedEmail).toHaveBeenCalledWith(
        expect.anything(),
        ORG_ID,
        'learner@example.com'
      );
      expect(getOrganizationById).not.toHaveBeenCalled();
      expect(bindProfileInOrg).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ identityProven: true })
      );
      expect(result).toMatchObject({ alreadyMember: true, linkedExistingMember: true });
    });

    it('applies the signup policy when the email is not verified', async () => {
      await expect(joinOrganization(USER_ID, ORG_ID)).rejects.toMatchObject({ statusCode: 403 });
      expect(bindProfileInOrg).not.toHaveBeenCalled();
    });

    it('applies the signup policy when the roster row already belongs to a profile', async () => {
      vi.mocked(getProfileById).mockResolvedValue({
        id: USER_ID,
        email: 'Learner@Example.com',
        isEmailVerified: true
      } as never);
      vi.mocked(selectOrganizationMemberByOrgAndNormalizedEmail).mockResolvedValue({
        id: 2,
        profileId: 'someone-else',
        roleId: ROLE.STUDENT,
        email: 'learner@example.com'
      } as never);

      await expect(joinOrganization(USER_ID, ORG_ID)).rejects.toMatchObject({ statusCode: 403 });
      expect(bindProfileInOrg).not.toHaveBeenCalled();
    });

    it('applies the signup policy to a verified email that is not on the roster', async () => {
      vi.mocked(getProfileById).mockResolvedValue({
        id: USER_ID,
        email: 'Learner@Example.com',
        isEmailVerified: true
      } as never);
      vi.mocked(selectOrganizationMemberByOrgAndNormalizedEmail).mockResolvedValue(null as never);

      await expect(joinOrganization(USER_ID, ORG_ID)).rejects.toMatchObject({ statusCode: 403 });
      expect(bindProfileInOrg).not.toHaveBeenCalled();
    });
  });
});
