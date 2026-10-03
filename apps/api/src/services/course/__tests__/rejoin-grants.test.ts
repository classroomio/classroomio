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
  assertStudentCapacityOrThrow: mocks.assertStudentCapacityOrThrow
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
});

describe('acceptStudentInvite re-join restores grant', () => {
  const inviteBundle = {
    invite: { id: 'inv-1', courseId: 'c-1', roleId: ROLE.STUDENT, createdByProfileId: 'admin-1' },
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
});
