import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/drizzle', () => ({
  db: { transaction: vi.fn(async (run: (tx: object) => unknown) => run({})) }
}));

vi.mock('@cio/db/queries/course/invite', () => ({
  countInviteDistinctPreviewIps: vi.fn(),
  createCourseInviteAudit: vi.fn(),
  getActivePendingCourseInvitesForEmail: vi.fn(),
  listLiveEmailBoundCourseInvitesInOrg: vi.fn().mockResolvedValue([]),
  selectCourseInviteAcceptBundleByInviteId: vi.fn(),
  selectCourseInviteAcceptBundleByTokenHash: vi.fn(),
  optimisticIncrementCourseInviteUsedCount: vi.fn()
}));

vi.mock('@api/services/organization/invite-binding', () => ({
  bindProfileInOrg: vi.fn(),
  buildFulfilledSummary: vi.fn(async () => ({ courses: [], cohorts: [] })),
  runBindingSideEffects: vi.fn()
}));

vi.mock('@cio/core/services/organization/invite-enrollment', () => ({
  enrollOrganizationInviteUserCore: vi.fn()
}));

vi.mock('@api/services/organization/invite', () => ({
  getRoleLabel: vi.fn(() => 'Student'),
  recordOrganizationInviteAudits: vi.fn()
}));

vi.mock('@api/services/organization/audience', () => ({
  importAudienceMembers: vi.fn(),
  revokeAudienceInviteAccess: vi.fn()
}));

vi.mock('@api/services/organization/student-limit', () => ({
  assertStudentCapacityOrThrow: vi.fn(async () => null),
  buildStudentMilestoneNotification: vi.fn(() => null),
  notifyStudentMilestone: vi.fn()
}));

vi.mock('@cio/db/queries/group', () => ({
  addGroupMember: vi.fn(),
  getGroupMemberIdByGroupAndProfile: vi.fn()
}));

vi.mock('@cio/db/queries/organization', () => ({
  createOrganizationMember: vi.fn(),
  getOrganizationMemberIdByOrgAndProfile: vi.fn(),
  selectOrganizationInviteWithOrgByInviteId: vi.fn()
}));

vi.mock('@cio/db/queries/auth', () => ({
  getProfileById: vi.fn(),
  getProfileByEmail: vi.fn(),
  markUserAndProfileEmailVerified: vi.fn()
}));
vi.mock('@cio/db/queries/course/people', () => ({ getCourseTeachers: vi.fn(async () => []) }));
vi.mock('@cio/core/utils/redis/org-stats-cache', () => ({ invalidateOrgStats: vi.fn() }));
vi.mock('@api/services/course/compliance', () => ({
  emitComplianceEnrollmentEvents: vi.fn(),
  ensureComplianceEnrollmentRecordsForProfiles: vi.fn(async () => ({ createdRecords: [] }))
}));
vi.mock('@api/services/organization/student-limit', () => ({
  assertStudentCapacityOrThrow: vi.fn(async () => null),
  buildStudentMilestoneNotification: vi.fn(() => null),
  notifyStudentMilestone: vi.fn()
}));
vi.mock('@api/services/product-events', () => ({ captureLearnerInvited: vi.fn(), captureLearnersEnrolled: vi.fn() }));
vi.mock('@cio/tracking', () => ({ trackServerEvent: vi.fn(), SERVER_EVENTS: { ENROLLMENT_COMPLETED: 'x' } }));
vi.mock('@api/services/course/session-invite', () => ({ getWelcomeSessionIcs: vi.fn(async () => null) }));
vi.mock('@api/services/jobs', () => ({ enqueueTransactionalEmail: vi.fn() }));
vi.mock('@cio/core/services/webhook/emit', () => ({
  buildMemberSource: vi.fn(),
  emitCourseMemberAddedWebhookEvent: vi.fn(),
  emitCourseWebhookEvent: vi.fn(),
  emitOrganizationMemberWebhookEvent: vi.fn()
}));

import {
  countInviteDistinctPreviewIps,
  getActivePendingCourseInvitesForEmail,
  optimisticIncrementCourseInviteUsedCount,
  selectCourseInviteAcceptBundleByInviteId
} from '@cio/db/queries/course/invite';
import { getGroupMemberIdByGroupAndProfile } from '@cio/db/queries/group';
import { markUserAndProfileEmailVerified } from '@cio/db/queries/auth';
import { enrollOrganizationInviteUserCore } from '@cio/core/services/organization/invite-enrollment';
import {
  bindProfileInOrg,
  buildFulfilledSummary,
  runBindingSideEffects
} from '@api/services/organization/invite-binding';
import { listPendingCourseInvitesForAccount } from '@api/services/account/invites';
import { acceptStudentInviteById } from '@api/services/course/invite';

const INVITE_ID = '22222222-2222-4222-8222-222222222222';

const emptyEnrollment = { enrolledMembers: [], complianceRecords: [], cohortMembers: [] };
const bindResult = {
  member: { id: 9, roleId: 3 },
  createdMember: true,
  linkedPendingMember: false,
  claimed: { groups: 0, cohorts: 0, programs: 0, removedDuplicates: 0, courseIds: [], cohortIds: [] },
  claimEnrollment: emptyEnrollment,
  fulfilled: { orgInvites: [], courseInvites: [], courseIds: [], cohortIds: [], skippedCourseInviteIds: [] },
  enrollment: emptyEnrollment,
  seatCheck: null
};

function bundleWith(allowedEmails: string[] | null) {
  return {
    invite: {
      id: INVITE_ID,
      courseId: 'course-1',
      roleId: 3,
      allowedEmails,
      allowedDomains: null,
      isRevoked: false,
      expiresAt: '2999-01-01T00:00:00.000Z',
      usedCount: 0,
      maxUses: 1
    },
    course: {
      id: 'course-1',
      title: 'Course',
      status: 'ACTIVE',
      isPublished: true,
      metadata: null,
      groupId: 'group-1'
    },
    organization: { id: 'org-1', name: 'Org', siteName: 'org' }
  } as never;
}

describe('acceptStudentInviteById', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(countInviteDistinctPreviewIps).mockResolvedValue(0);
    vi.mocked(getGroupMemberIdByGroupAndProfile).mockResolvedValue(null);
    vi.mocked(bindProfileInOrg).mockResolvedValue(bindResult as never);
    vi.mocked(enrollOrganizationInviteUserCore).mockResolvedValue({
      enrolledMembers: [{ id: 'member-1' }],
      complianceRecords: [],
      cohortMembers: []
    } as never);
  });

  it('refuses an account whose email is not verified, before reading the invite', async () => {
    await expect(
      acceptStudentInviteById(INVITE_ID, { id: 'u1', email: 'a@x.com', emailVerified: false })
    ).rejects.toMatchObject({ statusCode: 403 });

    expect(selectCourseInviteAcceptBundleByInviteId).not.toHaveBeenCalled();
  });

  it('refuses an invite that is not bound to any email', async () => {
    vi.mocked(selectCourseInviteAcceptBundleByInviteId).mockResolvedValue(bundleWith(null));

    await expect(
      acceptStudentInviteById(INVITE_ID, { id: 'u1', email: 'a@x.com', emailVerified: true })
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('refuses an invite addressed to a different email', async () => {
    vi.mocked(selectCourseInviteAcceptBundleByInviteId).mockResolvedValue(bundleWith(['someone@x.com']));

    await expect(
      acceptStudentInviteById(INVITE_ID, { id: 'u1', email: 'a@x.com', emailVerified: true })
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('enrolls a verified recipient, consumes the invite once and returns the course url', async () => {
    vi.mocked(selectCourseInviteAcceptBundleByInviteId).mockResolvedValue(bundleWith(['A@x.com']));
    vi.mocked(optimisticIncrementCourseInviteUsedCount).mockResolvedValue({ id: INVITE_ID });

    const result = await acceptStudentInviteById(INVITE_ID, { id: 'u1', email: 'a@x.com', emailVerified: true });

    expect(selectCourseInviteAcceptBundleByInviteId).toHaveBeenCalledWith(expect.anything(), INVITE_ID);
    expect(bindProfileInOrg).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        orgId: 'org-1',
        profileId: 'u1',
        trigger: 'course-invite',
        identityProven: true,
        skipInviteIds: [INVITE_ID]
      })
    );
    expect(runBindingSideEffects).toHaveBeenCalledWith(
      bindResult,
      expect.objectContaining({ orgId: 'org-1', profileId: 'u1', trigger: 'course-invite' })
    );
    expect(markUserAndProfileEmailVerified).toHaveBeenCalledWith('u1', expect.anything());
    expect(enrollOrganizationInviteUserCore).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ courseIds: ['course-1'], profileId: 'u1', roleId: 3 })
    );
    expect(optimisticIncrementCourseInviteUsedCount).toHaveBeenCalledTimes(1);
    expect(optimisticIncrementCourseInviteUsedCount).toHaveBeenCalledWith(expect.anything(), INVITE_ID, 0);
    expect(buildFulfilledSummary).toHaveBeenCalledWith('org-1', bindResult, ['course-1']);
    expect(result).toMatchObject({
      success: true,
      alreadyJoined: false,
      redirectTo: '/courses/course-1/lessons?next=true',
      fulfilled: { courses: [], cohorts: [] }
    });
  });

  it('returns alreadyJoined without consuming the invite for an enrolled recipient', async () => {
    vi.mocked(selectCourseInviteAcceptBundleByInviteId).mockResolvedValue(bundleWith(['a@x.com']));
    vi.mocked(getGroupMemberIdByGroupAndProfile).mockResolvedValue('member-1');

    const result = await acceptStudentInviteById(INVITE_ID, { id: 'u1', email: 'a@x.com', emailVerified: true });

    expect(result).toMatchObject({ success: true, alreadyJoined: true, fulfilled: { courses: [], cohorts: [] } });
    expect(enrollOrganizationInviteUserCore).not.toHaveBeenCalled();
    expect(optimisticIncrementCourseInviteUsedCount).not.toHaveBeenCalled();
  });

  it('explains that a replaced invite was superseded, without consuming anything', async () => {
    const revoked = bundleWith(['a@x.com']) as unknown as {
      invite: { id: string; isRevoked: boolean; metadata: unknown };
    };
    revoked.invite.isRevoked = true;
    revoked.invite.metadata = { supersededBy: 'org-invite-1' };
    vi.mocked(selectCourseInviteAcceptBundleByInviteId).mockResolvedValue(revoked as never);

    await expect(
      acceptStudentInviteById(INVITE_ID, { id: 'u1', email: 'a@x.com', emailVerified: true })
    ).rejects.toMatchObject({ statusCode: 400, message: expect.stringContaining('replaced') });
    expect(bindProfileInOrg).not.toHaveBeenCalled();
    expect(optimisticIncrementCourseInviteUsedCount).not.toHaveBeenCalled();
  });

  it('does not mark the email verified when the invite names several recipients', async () => {
    vi.mocked(selectCourseInviteAcceptBundleByInviteId).mockResolvedValue(bundleWith(['a@x.com', 'b@x.com']));
    vi.mocked(optimisticIncrementCourseInviteUsedCount).mockResolvedValue({ id: INVITE_ID });

    await acceptStudentInviteById(INVITE_ID, { id: 'u1', email: 'a@x.com', emailVerified: true });

    expect(markUserAndProfileEmailVerified).not.toHaveBeenCalled();
  });
});

describe('listPendingCourseInvitesForAccount', () => {
  it('returns nothing without querying when the email is unverified', async () => {
    const invites = await listPendingCourseInvitesForAccount({ id: 'u1', email: 'a@x.com', emailVerified: false });

    expect(invites).toEqual([]);
    expect(getActivePendingCourseInvitesForEmail).not.toHaveBeenCalled();
  });
});
