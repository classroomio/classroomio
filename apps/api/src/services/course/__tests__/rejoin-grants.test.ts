import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ROLE } from '@cio/utils/constants';

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  getCourseWithRelations: vi.fn(),
  getOrganizationMemberIdByOrgAndProfile: vi.fn(),
  getGroupMemberByGroupAndProfile: vi.fn(),
  getGroupMemberIdByGroupAndProfile: vi.fn(),
  addGroupMember: vi.fn(),
  createOrganizationMember: vi.fn(),
  recordDirectCourseGrant: vi.fn(),
  assertStudentCapacityOrThrow: vi.fn(),
  notifyStudentMilestone: vi.fn(),
  ensureComplianceEnrollmentRecordsForProfiles: vi.fn(),
  invalidateOrgStats: vi.fn(),
  sendStudentJoinEmails: vi.fn(),
  trackServerEvent: vi.fn(),
  selectCourseInviteAcceptBundleByTokenHash: vi.fn(),
  countInviteDistinctPreviewIps: vi.fn(),
  createCourseInviteAudit: vi.fn(),
  markUserAndProfileEmailVerified: vi.fn()
}));

vi.mock('@cio/db/queries/course/invite', () => ({
  selectCourseInviteAcceptBundleByTokenHash: mocks.selectCourseInviteAcceptBundleByTokenHash,
  countInviteDistinctPreviewIps: mocks.countInviteDistinctPreviewIps,
  createCourseInviteAudit: mocks.createCourseInviteAudit
}));

vi.mock('@cio/db/queries/auth', () => ({
  getProfileById: vi.fn(),
  getProfileByEmail: vi.fn(),
  markUserAndProfileEmailVerified: mocks.markUserAndProfileEmailVerified
}));

const transactionClient = { id: 'tx' };

vi.mock('@cio/db/drizzle', () => ({
  db: { transaction: mocks.transaction }
}));

vi.mock('@cio/db/queries/course', () => ({
  getCourseWithRelations: mocks.getCourseWithRelations,
  getCourseById: vi.fn(),
  getCourseWithOrgData: vi.fn()
}));

vi.mock('@cio/db/queries/organization', () => ({
  getOrganizationMemberIdByOrgAndProfile: mocks.getOrganizationMemberIdByOrgAndProfile,
  createOrganizationMember: mocks.createOrganizationMember
}));

vi.mock('@cio/db/queries/group', () => ({
  getGroupMemberByGroupAndProfile: mocks.getGroupMemberByGroupAndProfile,
  getGroupMemberIdByGroupAndProfile: mocks.getGroupMemberIdByGroupAndProfile,
  addGroupMember: mocks.addGroupMember
}));

vi.mock('../enrollment-grants', () => ({
  recordDirectCourseGrant: mocks.recordDirectCourseGrant,
  recordDirectCourseGrantsBulk: vi.fn()
}));

vi.mock('@api/services/organization/student-limit', () => ({
  assertStudentCapacityOrThrow: mocks.assertStudentCapacityOrThrow,
  notifyStudentMilestone: mocks.notifyStudentMilestone
}));

vi.mock('../compliance', () => ({
  ensureComplianceEnrollmentRecordsForProfiles: mocks.ensureComplianceEnrollmentRecordsForProfiles
}));

vi.mock('@cio/core/utils/redis/org-stats-cache', () => ({
  invalidateOrgStats: mocks.invalidateOrgStats
}));

vi.mock('@cio/analytics', () => ({
  trackServerEvent: mocks.trackServerEvent,
  SERVER_EVENTS: { ENROLLMENT_COMPLETED: 'enrollment_completed' }
}));

vi.mock('@cio/email', () => ({
  buildEmailBranding: vi.fn()
}));

vi.mock('@api/services/jobs', () => ({
  enqueueTransactionalEmail: vi.fn()
}));

import { acceptStudentInvite, enrollInCourse } from '../invite';

const COURSE = {
  groupId: 'g-1',
  cost: 0,
  status: 'ACTIVE',
  isPublished: true,
  title: 'Course',
  metadata: {},
  org: {
    id: 'org-1',
    name: 'Org',
    siteName: 'org',
    settings: {},
    customDomain: null,
    isCustomDomainVerified: false,
    avatarUrl: null,
    theme: null
  }
};

describe('enrollInCourse re-join restores grant', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => cb(transactionClient));
    mocks.getCourseWithRelations.mockResolvedValue(COURSE);
    mocks.getOrganizationMemberIdByOrgAndProfile.mockResolvedValue('org-m-1');
    mocks.ensureComplianceEnrollmentRecordsForProfiles.mockResolvedValue({ createdCount: 0 });
    mocks.invalidateOrgStats.mockResolvedValue(undefined);
  });

  it('existing STUDENT with revoked grant gets a new SELF_ENROLL grant and alreadyJoined', async () => {
    mocks.getGroupMemberByGroupAndProfile.mockResolvedValue({ id: 'gm-1', roleId: ROLE.STUDENT });

    const result = await enrollInCourse('c-1', { id: 'p-1', email: 'a@test.dev' }, {});

    expect(result).toMatchObject({ success: true, alreadyJoined: true });
    expect(mocks.recordDirectCourseGrant).toHaveBeenCalledWith(
      { groupmemberId: 'gm-1', courseId: 'c-1', profileId: 'p-1' },
      { source: 'SELF_ENROLL' },
      transactionClient
    );
    expect(mocks.addGroupMember).not.toHaveBeenCalled();
  });

  it('existing TUTOR gets no grant', async () => {
    mocks.getGroupMemberByGroupAndProfile.mockResolvedValue({ id: 'gm-2', roleId: ROLE.TUTOR });

    const result = await enrollInCourse('c-1', { id: 'p-2', email: 't@test.dev' }, {});

    expect(result).toMatchObject({ alreadyJoined: true });
    expect(mocks.recordDirectCourseGrant).not.toHaveBeenCalled();
  });

  it('defers the student milestone email until the enrollment commits', async () => {
    const milestone = { orgId: 'org-1', milestone: 'half' };
    mocks.getOrganizationMemberIdByOrgAndProfile.mockResolvedValue(null);
    mocks.getGroupMemberByGroupAndProfile.mockResolvedValue(null);
    mocks.assertStudentCapacityOrThrow.mockResolvedValue(milestone);
    mocks.addGroupMember.mockResolvedValue([{ id: 'gm-new' }]);
    mocks.notifyStudentMilestone.mockResolvedValue(undefined);

    await enrollInCourse('c-1', { id: 'p-3', email: 'n@test.dev' }, {});

    expect(mocks.assertStudentCapacityOrThrow).toHaveBeenCalledWith('org-1', 1, transactionClient, {
      deferNotification: true
    });
    expect(mocks.notifyStudentMilestone).toHaveBeenCalledWith(milestone);
  });

  it('sends no milestone email when the enrollment rolls back', async () => {
    mocks.getOrganizationMemberIdByOrgAndProfile.mockResolvedValue(null);
    mocks.getGroupMemberByGroupAndProfile.mockResolvedValue(null);
    mocks.assertStudentCapacityOrThrow.mockResolvedValue({ orgId: 'org-1', milestone: 'reached' });
    mocks.addGroupMember.mockRejectedValue(new Error('insert failed'));

    await expect(enrollInCourse('c-1', { id: 'p-4', email: 'r@test.dev' }, {})).rejects.toThrow('insert failed');

    expect(mocks.notifyStudentMilestone).not.toHaveBeenCalled();
  });
});

describe('acceptStudentInvite re-join restores grant', () => {
  const inviteBundle = {
    invite: {
      id: 'inv-1',
      courseId: 'c-1',
      roleId: ROLE.STUDENT,
      createdByProfileId: 'admin-1',
      isRevoked: false,
      expiresAt: '2999-01-01T00:00:00.000Z',
      usedCount: 0,
      maxUses: 10,
      allowedEmails: [],
      allowedDomains: []
    },
    course: {
      id: 'c-1',
      groupId: 'g-1',
      title: 'Course',
      status: 'ACTIVE',
      isPublished: true,
      enrollOnlyInLearningPath: false
    },
    organization: { id: 'org-1', name: 'Org', siteName: 'org', customDomain: null, isCustomDomainVerified: false }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => cb(transactionClient));
    mocks.selectCourseInviteAcceptBundleByTokenHash.mockResolvedValue(inviteBundle);
    mocks.countInviteDistinctPreviewIps.mockResolvedValue(0);
    mocks.createCourseInviteAudit.mockResolvedValue(undefined);
    mocks.markUserAndProfileEmailVerified.mockResolvedValue(undefined);
  });

  it('existing STUDENT whose grant was revoked gets an INVITE grant from the inviter, without consuming the invite', async () => {
    mocks.getGroupMemberByGroupAndProfile.mockResolvedValue({ id: 'gm-1', roleId: ROLE.STUDENT });

    const result = await acceptStudentInvite('token', { id: 'p-1', email: 'a@test.dev' } as never);

    expect(result).toMatchObject({ alreadyJoined: true });
    expect(mocks.recordDirectCourseGrant).toHaveBeenCalledWith(
      { groupmemberId: 'gm-1', courseId: 'c-1', profileId: 'p-1' },
      { source: 'INVITE', grantedByProfileId: 'admin-1' },
      transactionClient
    );
    expect(mocks.addGroupMember).not.toHaveBeenCalled();
  });

  it('existing TUTOR gets no grant', async () => {
    mocks.getGroupMemberByGroupAndProfile.mockResolvedValue({ id: 'gm-2', roleId: ROLE.TUTOR });

    const result = await acceptStudentInvite('token', { id: 'p-2', email: 't@test.dev' } as never);

    expect(result).toMatchObject({ alreadyJoined: true });
    expect(mocks.recordDirectCourseGrant).not.toHaveBeenCalled();
  });

  it.each([
    ['revoked', { isRevoked: true }, 'This invite has been revoked'],
    ['expired', { expiresAt: '2000-01-01T00:00:00.000Z' }, 'This invite link has expired'],
    ['restricted to another email', { allowedEmails: ['someone@else.dev'] }, 'restricted to a different email']
  ])('a %s token cannot restore an existing STUDENT grant', async (_label, inviteOverrides, message) => {
    mocks.selectCourseInviteAcceptBundleByTokenHash.mockResolvedValue({
      ...inviteBundle,
      invite: { ...inviteBundle.invite, ...inviteOverrides }
    });
    mocks.getGroupMemberByGroupAndProfile.mockResolvedValue({ id: 'gm-1', roleId: ROLE.STUDENT });

    await expect(acceptStudentInvite('token', { id: 'p-1', email: 'a@test.dev' } as never)).rejects.toThrow(message);

    expect(mocks.recordDirectCourseGrant).not.toHaveBeenCalled();
  });

  it('a used-up token answers alreadyJoined to an existing STUDENT without re-granting', async () => {
    mocks.selectCourseInviteAcceptBundleByTokenHash.mockResolvedValue({
      ...inviteBundle,
      invite: { ...inviteBundle.invite, usedCount: 10 }
    });
    mocks.getGroupMemberByGroupAndProfile.mockResolvedValue({ id: 'gm-1', roleId: ROLE.STUDENT });

    const result = await acceptStudentInvite('token', { id: 'p-1', email: 'a@test.dev' } as never);

    expect(result).toMatchObject({ alreadyJoined: true });
    expect(mocks.recordDirectCourseGrant).not.toHaveBeenCalled();
  });

  it('a used-up token still rejects someone who is not yet a member', async () => {
    mocks.selectCourseInviteAcceptBundleByTokenHash.mockResolvedValue({
      ...inviteBundle,
      invite: { ...inviteBundle.invite, usedCount: 10 }
    });
    mocks.getGroupMemberByGroupAndProfile.mockResolvedValue(null);

    await expect(acceptStudentInvite('token', { id: 'p-5', email: 'x@test.dev' } as never)).rejects.toThrow(
      'This invite has reached its usage limit'
    );
  });
});
