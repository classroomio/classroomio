import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/drizzle', () => ({
  db: { transaction: vi.fn(async (run: (tx: unknown) => unknown) => run({})) }
}));

vi.mock('@cio/db/queries/organization', () => ({
  claimPendingOrganizationInvite: vi.fn(),
  createOrganizationInviteAudit: vi.fn(),
  createOrganizationInviteAudits: vi.fn(async () => []),
  getOrganizationById: vi.fn(),
  getOrganizationMemberIdByOrgAndProfile: vi.fn(),
  lockOrganizationForUpdate: vi.fn(),
  selectOrganizationInviteWithOrgByInviteId: vi.fn(),
  selectOrganizationInviteWithOrgByTokenHash: vi.fn(),
  updateOrganizationMemberById: vi.fn(),
  getOrgLinkInviteWithOrg: vi.fn()
}));

vi.mock('@cio/db/queries/course', () => ({
  getCourseById: vi.fn(),
  getCourseWithRelations: vi.fn()
}));

vi.mock('@cio/db/queries/course/people', () => ({
  getCourseTeachers: vi.fn(async () => [])
}));

vi.mock('@cio/db/queries/group', () => ({
  addGroupMember: vi.fn(),
  getGroupMemberIdByGroupAndProfile: vi.fn()
}));

vi.mock('@cio/db/queries/course/course', () => ({
  getCourseTitlesByIds: vi.fn(async () => new Map())
}));

vi.mock('@cio/db/queries/cohort', () => ({
  getCohortsByOrg: vi.fn(async () => [])
}));

vi.mock('@cio/db/queries/course/invite', () => ({
  createCourseInviteAudit: vi.fn(),
  countInviteDistinctPreviewIps: vi.fn(async () => 0),
  listLiveEmailBoundCourseInvitesInOrg: vi.fn(async () => []),
  selectCourseInviteAcceptBundleByInviteId: vi.fn(),
  selectCourseInviteAcceptBundleByTokenHash: vi.fn(),
  optimisticIncrementCourseInviteUsedCount: vi.fn()
}));

vi.mock('@cio/db/queries/auth/profile', () => ({
  getProfileById: vi.fn(async () => null),
  getProfileByEmail: vi.fn(async () => null),
  markUserAndProfileEmailVerified: vi.fn(),
  setProfileFullnameIfUnset: vi.fn()
}));

vi.mock('@cio/db/queries/auth', () => ({
  getProfileById: vi.fn(async () => null),
  getProfileByEmail: vi.fn(async () => null),
  markUserAndProfileEmailVerified: vi.fn()
}));

vi.mock('@api/services/organization/invite-binding', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@api/services/organization/invite-binding')>();
  return {
    ...actual,
    bindProfileInOrg: vi.fn(),
    buildFulfilledSummary: vi.fn(async () => ({ courses: [], cohorts: [] })),
    runBindingSideEffects: vi.fn()
  };
});

vi.mock('@api/services/organization/audience', () => ({
  importAudienceMembers: vi.fn(),
  revokeAudienceInviteAccess: vi.fn()
}));

vi.mock('@cio/core/services/organization/invite-enrollment', () => ({
  enrollOrganizationInviteUserCore: vi.fn()
}));

vi.mock('@api/services/organization/student-limit', () => ({
  buildStudentMilestoneNotification: vi.fn(() => null),
  notifyStudentMilestone: vi.fn()
}));

vi.mock('@api/services/course/compliance', () => ({
  emitComplianceEnrollmentEvents: vi.fn(),
  ensureComplianceEnrollmentRecordsForProfiles: vi.fn(async () => ({ createdRecords: [], createdCount: 0 }))
}));

vi.mock('@cio/core/services/webhook/emit', () => ({
  buildMemberSource: vi.fn(() => 'test'),
  emitCourseMemberAddedWebhookEvent: vi.fn(),
  emitCourseWebhookEvent: vi.fn(),
  emitOrganizationMemberWebhookEvent: vi.fn(),
  emitWebhookEvent: vi.fn()
}));

vi.mock('@cio/core/utils/redis/org-stats-cache', () => ({
  invalidateOrgStats: vi.fn()
}));

vi.mock('@api/services/jobs', () => ({
  enqueueTransactionalEmail: vi.fn()
}));

vi.mock('@api/services/product-events', () => ({
  captureLearnerInvited: vi.fn(),
  captureLearnersEnrolled: vi.fn()
}));

vi.mock('@cio/tracking', () => ({
  trackServerEvent: vi.fn(),
  SERVER_EVENTS: { ENROLLMENT_COMPLETED: 'enrollment_completed' }
}));

vi.mock('@api/services/organization/invite-audit', () => ({
  recordOrganizationInviteAudit: vi.fn(),
  recordOrganizationInviteAudits: vi.fn()
}));

vi.mock('@cio/core/services/organization/course-roles', () => ({
  scheduleCourseRoleReconcile: vi.fn()
}));

vi.mock('@cio/db/queries/invite-link', () => ({
  getInviteLinkByTokenHash: vi.fn(),
  getInviteLinkByTarget: vi.fn(),
  lockInviteLinkForAccept: vi.fn(),
  incrementInviteLinkJoinCount: vi.fn(),
  setInviteLinkRevoked: vi.fn()
}));

const enrollMembership = vi.fn(async () => ({ isFreshJoin: true, enrolledMembers: [] }));
const linkAfterCommit = vi.fn();
vi.mock('@api/services/invite-link/handlers', () => ({
  getInviteLinkHandler: vi.fn(() => ({
    preview: () => ({
      resourceType: 'COURSE',
      resourceName: 'Course',
      description: null,
      coverImage: null,
      isResourceOpen: true
    }),
    enrollMembership,
    afterCommit: linkAfterCommit,
    redirectTo: () => '/courses/course-1/lessons?next=true'
  }))
}));

import { ROLE } from '@cio/utils/constants';
import { STUDENT_HOME_ENTRY_PATH } from '@cio/utils/lms';
import { enrollOrganizationInviteUserCore } from '@cio/core/services/organization/invite-enrollment';
import {
  bindProfileInOrg,
  buildFulfilledSummary,
  runBindingSideEffects
} from '@api/services/organization/invite-binding';
import { markUserAndProfileEmailVerified } from '@cio/db/queries/auth/profile';
import {
  acceptLinkInvite,
  acceptOrganizationInvite,
  acceptOrganizationInviteById
} from '@api/services/organization/invite';
import { acceptInviteLink } from '@api/services/invite-link/invite-link';
import { acceptStudentInvite, enrollInCourse } from '@api/services/course/invite';
import {
  claimPendingOrganizationInvite,
  selectOrganizationInviteWithOrgByInviteId,
  selectOrganizationInviteWithOrgByTokenHash,
  updateOrganizationMemberById
} from '@cio/db/queries/organization';
import { getOrgLinkInviteWithOrg } from '@cio/db/queries/organization';
import { selectCourseInviteAcceptBundleByTokenHash } from '@cio/db/queries/course/invite';
import { getCourseWithRelations } from '@cio/db/queries/course';
import { addGroupMember, getGroupMemberIdByGroupAndProfile } from '@cio/db/queries/group';
import { getInviteLinkByTokenHash, lockInviteLinkForAccept } from '@cio/db/queries/invite-link';

const ORG_ID = 'org-1';
const USER = { id: 'user-1', email: 'Learner@Example.com' };

const emptyEnrollment = { enrolledMembers: [], complianceRecords: [], cohortMembers: [] };
const bindResult = {
  member: { id: 5, roleId: ROLE.STUDENT, organizationId: ORG_ID, email: 'learner@example.com', profileId: 'user-1' },
  createdMember: true,
  linkedPendingMember: false,
  claimed: { groups: 0, cohorts: 0, programs: 0, removedDuplicates: 0, courseIds: [], cohortIds: [] },
  claimEnrollment: emptyEnrollment,
  fulfilled: { orgInvites: [], courseInvites: [], courseIds: [], cohortIds: [], skippedCourseInviteIds: [] },
  enrollment: emptyEnrollment,
  seatCheck: null
};

function orgRow(overrides: Record<string, unknown> = {}) {
  return {
    invite: {
      id: 'invite-1',
      organizationId: ORG_ID,
      roleId: ROLE.STUDENT,
      email: 'learner@example.com',
      acceptedAt: null,
      isRevoked: false,
      expiresAt: '2099-01-01T00:00:00.000Z',
      metadata: {}
    },
    organization: { id: ORG_ID, name: 'Acme', siteName: 'acme' },
    ...overrides
  } as never;
}

describe('org invite acceptance through the shared binding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(bindProfileInOrg).mockResolvedValue({ ...bindResult } as never);
    vi.mocked(claimPendingOrganizationInvite).mockResolvedValue({ id: 'invite-1' } as never);
    vi.mocked(enrollOrganizationInviteUserCore).mockResolvedValue({
      enrolledMembers: [],
      complianceRecords: [],
      cohortMembers: []
    } as never);
  });

  it('binds an email-bound token with proven identity and reports fulfilment', async () => {
    vi.mocked(selectOrganizationInviteWithOrgByTokenHash).mockResolvedValue(orgRow());

    const result = await acceptOrganizationInvite('token-1', USER as never);

    expect(bindProfileInOrg).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        orgId: ORG_ID,
        profileId: USER.id,
        email: 'learner@example.com',
        trigger: 'org-invite',
        identityProven: true,
        roleForNewMember: ROLE.STUDENT,
        skipInviteIds: ['invite-1']
      })
    );
    expect(claimPendingOrganizationInvite).toHaveBeenCalledWith(expect.anything(), 'invite-1', USER.id);
    expect(updateOrganizationMemberById).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      organizationId: ORG_ID,
      roleId: ROLE.STUDENT,
      alreadyAccepted: false,
      redirectTo: STUDENT_HOME_ENTRY_PATH,
      fulfilled: { courses: [], cohorts: [] }
    });
  });

  it('passes the invite role to the binding so a promotion is applied before fulfilment', async () => {
    vi.mocked(selectOrganizationInviteWithOrgByTokenHash).mockResolvedValue(
      orgRow({
        invite: {
          id: 'invite-2',
          organizationId: ORG_ID,
          roleId: ROLE.TUTOR,
          email: 'learner@example.com',
          acceptedAt: null,
          isRevoked: false,
          expiresAt: '2099-01-01T00:00:00.000Z',
          metadata: {}
        }
      })
    );

    const result = await acceptOrganizationInvite('token-2', USER as never);

    expect(bindProfileInOrg).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ inviteRoleId: ROLE.TUTOR, skipInviteIds: ['invite-2'] })
    );
    expect(updateOrganizationMemberById).not.toHaveBeenCalled();
    expect(result.roleId).toBe(ROLE.TUTOR);
  });

  it('does not reapply the role when an already-accepted invite is opened again', async () => {
    vi.mocked(selectOrganizationInviteWithOrgByTokenHash).mockResolvedValue(
      orgRow({
        invite: {
          id: 'invite-3',
          organizationId: ORG_ID,
          roleId: ROLE.TUTOR,
          email: 'learner@example.com',
          acceptedAt: '2026-01-01T00:00:00.000Z',
          isRevoked: false,
          expiresAt: '2099-01-01T00:00:00.000Z',
          metadata: {}
        }
      })
    );

    const result = await acceptOrganizationInvite('token-3', USER as never);

    expect(bindProfileInOrg).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ inviteRoleId: undefined })
    );
    expect(claimPendingOrganizationInvite).not.toHaveBeenCalled();
    expect(result.alreadyAccepted).toBe(true);
  });

  it('follows a replaced invite to its successor', async () => {
    vi.mocked(selectOrganizationInviteWithOrgByTokenHash).mockResolvedValue(
      orgRow({
        invite: {
          id: 'old-invite',
          organizationId: ORG_ID,
          roleId: ROLE.STUDENT,
          email: 'learner@example.com',
          acceptedAt: null,
          isRevoked: true,
          expiresAt: '2099-01-01T00:00:00.000Z',
          metadata: { supersededBy: 'invite-1' }
        }
      })
    );
    vi.mocked(selectOrganizationInviteWithOrgByInviteId).mockResolvedValue(orgRow());

    const result = await acceptOrganizationInvite('old-token', USER as never);

    expect(selectOrganizationInviteWithOrgByInviteId).toHaveBeenCalledWith(expect.anything(), 'invite-1');
    expect(claimPendingOrganizationInvite).toHaveBeenCalledWith(expect.anything(), 'invite-1', USER.id);
    expect(result.alreadyAccepted).toBe(false);
  });

  it('refuses accept-by-id for an unverified email before reading the invite', async () => {
    await expect(
      acceptOrganizationInviteById('invite-1', { id: USER.id, email: USER.email } as never)
    ).rejects.toMatchObject({ statusCode: 403 });

    expect(selectOrganizationInviteWithOrgByInviteId).not.toHaveBeenCalled();
    expect(bindProfileInOrg).not.toHaveBeenCalled();
  });

  it('reports the accepted invite courses and cohorts as fulfilled, alongside the ones the binding fulfilled', async () => {
    vi.mocked(selectOrganizationInviteWithOrgByInviteId).mockResolvedValue(
      orgRow({
        invite: {
          id: 'invite-1',
          organizationId: ORG_ID,
          roleId: ROLE.STUDENT,
          email: 'learner@example.com',
          acceptedAt: null,
          isRevoked: false,
          expiresAt: '2099-01-01T00:00:00.000Z',
          metadata: { courseIds: ['course-1'], cohortIds: ['cohort-1'] }
        }
      })
    );
    vi.mocked(bindProfileInOrg).mockResolvedValue({
      ...bindResult,
      fulfilled: { ...bindResult.fulfilled, courseIds: ['course-1', 'course-2'], cohortIds: [] }
    } as never);

    await acceptOrganizationInviteById('invite-1', { id: USER.id, email: USER.email, emailVerified: true } as never);

    expect(buildFulfilledSummary).toHaveBeenCalledWith(
      ORG_ID,
      expect.objectContaining({
        fulfilled: expect.objectContaining({ courseIds: ['course-1', 'course-2'], cohortIds: ['cohort-1'] })
      })
    );
  });

  it('accepts by id for a verified email without marking it verified again', async () => {
    vi.mocked(selectOrganizationInviteWithOrgByInviteId).mockResolvedValue(orgRow());

    await acceptOrganizationInviteById('invite-1', { id: USER.id, email: USER.email, emailVerified: true } as never);

    expect(bindProfileInOrg).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ trigger: 'org-invite', identityProven: true })
    );
    expect(markUserAndProfileEmailVerified).not.toHaveBeenCalled();
    expect(runBindingSideEffects).toHaveBeenCalled();
  });

  it('marks the email verified when an email-bound token is accepted', async () => {
    vi.mocked(selectOrganizationInviteWithOrgByTokenHash).mockResolvedValue(orgRow());

    await acceptOrganizationInvite('token-1', USER as never);

    expect(markUserAndProfileEmailVerified).toHaveBeenCalledWith(USER.id, expect.anything());
  });
});

describe('org link acceptance never fulfils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(bindProfileInOrg).mockResolvedValue({
      ...bindResult,
      createdMember: false,
      member: { id: 7, roleId: ROLE.ADMIN, organizationId: ORG_ID }
    } as never);
    vi.mocked(getOrgLinkInviteWithOrg).mockResolvedValue({
      invite: { id: 'link-1', organizationId: ORG_ID, roleId: ROLE.TUTOR, isRevoked: false },
      organization: { id: ORG_ID, siteName: 'acme' }
    } as never);
  });

  it('binds with unproven identity and applies the link role', async () => {
    const result = await acceptLinkInvite('token-1', USER as never);

    expect(bindProfileInOrg).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        trigger: 'org-invite',
        identityProven: false,
        roleForNewMember: ROLE.TUTOR,
        inviteRoleId: ROLE.TUTOR
      })
    );
    expect(updateOrganizationMemberById).not.toHaveBeenCalled();
    expect(result).toMatchObject({ organizationId: ORG_ID, roleId: ROLE.TUTOR });
    expect(result).not.toHaveProperty('fulfilled');
  });
});

describe('course invite acceptance through the shared binding', () => {
  const bundle = {
    invite: {
      id: 'course-invite-1',
      courseId: 'course-1',
      roleId: ROLE.STUDENT,
      allowedEmails: ['learner@example.com'],
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
    organization: { id: ORG_ID, name: 'Acme', siteName: 'org' }
  } as never;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(bindProfileInOrg).mockResolvedValue({ ...bindResult } as never);
    vi.mocked(enrollOrganizationInviteUserCore).mockResolvedValue({
      enrolledMembers: [{ id: 'member-1' }],
      complianceRecords: [],
      cohortMembers: []
    } as never);
    vi.mocked(selectCourseInviteAcceptBundleByTokenHash).mockResolvedValue(bundle);
    vi.mocked(getGroupMemberIdByGroupAndProfile).mockResolvedValue(null);
  });

  it('binds an email-bound token with proven identity', async () => {
    const { optimisticIncrementCourseInviteUsedCount } = await import('@cio/db/queries/course/invite');
    vi.mocked(optimisticIncrementCourseInviteUsedCount).mockResolvedValue({ id: 'course-invite-1' } as never);

    const result = await acceptStudentInvite('token-1', USER as never);

    expect(bindProfileInOrg).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ orgId: ORG_ID, trigger: 'course-invite', identityProven: true })
    );
    expect(result).toMatchObject({ success: true, alreadyJoined: false, fulfilled: { courses: [], cohorts: [] } });
  });
});

describe('resource link acceptance through the shared binding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(bindProfileInOrg).mockResolvedValue({ ...bindResult } as never);
    vi.mocked(getInviteLinkByTokenHash).mockResolvedValue({
      invite: { id: 'link-1', organizationId: ORG_ID, roleId: ROLE.STUDENT, isRevoked: false, resourceType: 'COURSE' },
      organization: { id: ORG_ID, name: 'Acme', siteName: 'acme' }
    } as never);
    vi.mocked(lockInviteLinkForAccept).mockResolvedValue({ id: 'link-1', isRevoked: false } as never);
  });

  it('binds the join and reports fulfilment', async () => {
    const result = await acceptInviteLink('token-1', USER as never);

    expect(bindProfileInOrg).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ orgId: ORG_ID, trigger: 'invite-link' })
    );
    expect(enrollMembership).toHaveBeenCalled();
    expect(result).toMatchObject({ organizationId: ORG_ID, fulfilled: { courses: [], cohorts: [] } });
  });
});

describe('free self-enrollment through the shared binding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(bindProfileInOrg).mockResolvedValue({ ...bindResult } as never);
    vi.mocked(getCourseWithRelations).mockResolvedValue({
      groupId: 'group-1',
      cost: 0,
      status: 'ACTIVE',
      isPublished: true,
      title: 'Course',
      metadata: { allowSelfEnrollment: true },
      org: {
        id: ORG_ID,
        name: 'Acme',
        siteName: 'acme',
        customDomain: null,
        isCustomDomainVerified: null,
        avatarUrl: null,
        theme: null,
        settings: {}
      }
    } as never);
    vi.mocked(getGroupMemberIdByGroupAndProfile).mockResolvedValue(null);
    vi.mocked(addGroupMember).mockResolvedValue([{ id: 'member-1' }] as never);
    vi.mocked(buildFulfilledSummary).mockResolvedValue({
      courses: [{ id: 'course-9', title: 'Other' }],
      cohorts: []
    });
  });

  it('binds with verified identity and prefers the student home when courses were fulfilled', async () => {
    const result = await enrollInCourse('course-1', { id: USER.id, email: USER.email, emailVerified: true }, {}, {});

    expect(bindProfileInOrg).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ orgId: ORG_ID, trigger: 'self-enroll', identityProven: true })
    );
    expect(result).toMatchObject({
      success: true,
      alreadyJoined: false,
      redirectTo: STUDENT_HOME_ENTRY_PATH,
      fulfilled: { courses: [{ id: 'course-9', title: 'Other' }], cohorts: [] }
    });
  });

  it('binds with unproven identity for an unverified email', async () => {
    await enrollInCourse('course-1', { id: USER.id, email: USER.email, emailVerified: false }, {}, {});

    expect(bindProfileInOrg).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ identityProven: false })
    );
  });
});
