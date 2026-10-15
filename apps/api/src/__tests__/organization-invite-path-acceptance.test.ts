import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Accepting an org invite enrolls the accepter into every resource on the
 * invite. Courses and cohorts already had this covered implicitly; learning
 * paths joined them when bulk path invites moved to the org-invite flow, so
 * these tests pin the path leg: metadata parsing, org scoping, and the
 * shared enrollment core.
 */

vi.mock('@cio/db/drizzle', () => ({
  db: {
    transaction: vi.fn(async (callback: (tx: unknown) => Promise<unknown>) => callback({}))
  }
}));

vi.mock('@cio/db/queries/organization', () => ({
  checkEmailsExistInOrg: vi.fn(),
  claimPendingOrganizationInvite: vi.fn(),
  createOrganizationInvite: vi.fn(),
  createOrganizationInviteAudit: vi.fn().mockResolvedValue(undefined),
  createOrganizationInviteAudits: vi.fn().mockResolvedValue(undefined),
  createOrganizationMember: vi.fn(),
  createOrganizationMembers: vi.fn(),
  createLinkInvite: vi.fn(),
  getActivePendingOrgInviteForEmail: vi.fn(),
  getOrganizationById: vi.fn(),
  getOrganizationInviteByTokenHash: vi.fn(),
  getOrganizationMemberIdByOrgAndProfile: vi.fn().mockResolvedValue('org-member-1'),
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

vi.mock('@cio/db/queries/course', () => ({
  getCourseGroupIds: vi.fn().mockResolvedValue([]),
  getOrgCourseGroups: vi.fn().mockResolvedValue([]),
  getEnrollOnlyInLearningPathCourses: vi.fn().mockResolvedValue([])
}));
vi.mock('@cio/analytics', () => ({
  trackServerEvent: vi.fn(),
  SERVER_EVENTS: {
    ENROLLMENT_COMPLETED: 'enrollment_completed',
    COURSE_COMPLETED: 'course_completed',
    CERTIFICATE_ISSUED: 'certificate_issued'
  }
}));
vi.mock('@cio/db/queries/group', () => ({
  enrollUsersInCourseGroups: vi.fn().mockResolvedValue(0),
  getGroupMemberByGroupAndProfile: vi.fn()
}));
vi.mock('@cio/db/queries/cohort', () => ({
  addCohortMember: vi.fn(),
  getCohortMemberByProfileId: vi.fn().mockResolvedValue({ id: 'cm-1', roleId: 3 }),
  getCourseIdsByCohortIds: vi.fn().mockResolvedValue([]),
  getCohortCoursePairsByCohortIds: vi.fn().mockResolvedValue([]),
  getExistingCohortMembers: vi.fn().mockResolvedValue(new Set())
}));
vi.mock('@cio/db/queries/learning-path', () => ({
  bulkInsertDirectCourseGrants: vi.fn().mockResolvedValue(0),
  getOrgLearningPathsByIds: vi.fn().mockResolvedValue([]),
  grantCourseAccess: vi.fn()
}));
vi.mock('@cio/core/services/learning-path/enroll-profile-core', () => ({
  enrollProfileCore: vi.fn().mockResolvedValue({ id: 'path-member-1' })
}));
vi.mock('@api/services/learning-path/progress-sync-jobs', () => ({
  scheduleLearningPathProgressSync: vi.fn()
}));
vi.mock('@cio/core/utils/redis/org-stats-cache', () => ({ invalidateOrgStats: vi.fn() }));
vi.mock('@cio/core/config/dashboard-url', () => ({
  getAppBaseUrl: vi.fn(() => 'https://app.test'),
  getDashboardBaseUrl: vi.fn(() => 'https://lms.test')
}));
vi.mock('@api/services/course/path-gate', () => ({
  assertCourseAllowsDirectStudentAdd: vi.fn().mockResolvedValue(undefined),
  filterOutPathOnlyCourseIds: vi.fn(async (courseIds: string[]) => ({
    allowedCourseIds: courseIds,
    skippedPathOnlyCourseIds: []
  }))
}));

vi.mock('@api/services/organization/student-limit', () => ({
  assertStudentCapacityOrThrow: vi.fn().mockResolvedValue(null),
  notifyStudentMilestone: vi.fn()
}));
vi.mock('@api/utils/org', () => ({
  parseCourseIdsFromInviteMetadata: vi.fn(() => []),
  parseCohortIdsFromInviteMetadata: vi.fn(() => []),
  parsePathIdsFromInviteMetadata: vi.fn(() => [])
}));
vi.mock('@cio/db/queries/auth/profile', () => ({
  getProfileById: vi.fn(),
  markUserAndProfileEmailVerified: vi.fn().mockResolvedValue(undefined)
}));
vi.mock('@api/services/jobs', () => ({ enqueueTransactionalEmail: vi.fn() }));
vi.mock('@cio/email', () => ({
  buildEmailBranding: vi.fn(),
  buildEmailFromName: vi.fn(),
  sanitizeEmailSubject: vi.fn()
}));
vi.mock('@api/services/course/compliance', () => ({
  ensureComplianceEnrollmentRecordsForProfiles: vi.fn().mockResolvedValue(undefined)
}));
vi.mock('@api/services/course/enrollment-grants', () => ({
  recordDirectCourseGrant: vi.fn().mockResolvedValue(undefined),
  recordDirectCourseGrantsBulk: vi.fn().mockResolvedValue(0)
}));
vi.mock('@cio/core/services/organization/course-roles', () => ({
  scheduleCourseRoleReconcile: vi.fn()
}));

import { acceptOrganizationInvite, acceptOrganizationInviteById } from '@api/services/organization/invite';
import {
  claimPendingOrganizationInvite,
  createOrganizationInviteAudit,
  selectOrganizationInviteWithOrgByInviteId,
  selectOrganizationInviteWithOrgByTokenHash,
  selectOrganizationMemberByOrgAndNormalizedEmail,
  selectOrganizationMemberByOrgAndProfile
} from '@cio/db/queries/organization';
import {
  parseCourseIdsFromInviteMetadata,
  parseCohortIdsFromInviteMetadata,
  parsePathIdsFromInviteMetadata
} from '@api/utils/org';
import { getCourseGroupIds, getOrgCourseGroups, getEnrollOnlyInLearningPathCourses } from '@cio/db/queries/course';
import { enrollUsersInCourseGroups, getGroupMemberByGroupAndProfile } from '@cio/db/queries/group';
import { getCohortCoursePairsByCohortIds, getCourseIdsByCohortIds } from '@cio/db/queries/cohort';
import {
  bulkInsertDirectCourseGrants,
  getOrgLearningPathsByIds,
  grantCourseAccess
} from '@cio/db/queries/learning-path';
import { enrollProfileCore } from '@cio/core/services/learning-path/enroll-profile-core';
import { scheduleLearningPathProgressSync } from '@api/services/learning-path/progress-sync-jobs';
import { trackServerEvent } from '@cio/analytics';
import { ensureComplianceEnrollmentRecordsForProfiles } from '@api/services/course/compliance';
import { ROLE } from '@cio/utils/constants';

const ORG_ID = 'org-1';
const USER = { id: 'user-1', email: 'Student@Example.com' };
const PATH_ID = '11111111-1111-1111-1111-111111111111';

function activeInvite(metadata: unknown) {
  return {
    invite: {
      id: 'invite-1',
      organizationId: ORG_ID,
      roleId: ROLE.STUDENT,
      email: 'student@example.com',
      tokenHash: 'hash',
      isRevoked: false,
      expiresAt: new Date(Date.now() + 3600_000).toISOString(),
      acceptedAt: null,
      metadata
    },
    organization: { id: ORG_ID, siteName: 'acme', name: 'Acme' }
  };
}

describe('acceptOrganizationInvite — learning paths', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(selectOrganizationInviteWithOrgByTokenHash).mockResolvedValue(activeInvite({}) as never);
    vi.mocked(selectOrganizationMemberByOrgAndNormalizedEmail).mockResolvedValue(null as never);
    vi.mocked(selectOrganizationMemberByOrgAndProfile).mockResolvedValue(null as never);
    vi.mocked(claimPendingOrganizationInvite).mockResolvedValue({ id: 'invite-1' } as never);
    vi.mocked(parsePathIdsFromInviteMetadata).mockReturnValue([]);
    vi.mocked(getOrgLearningPathsByIds).mockResolvedValue([]);
  });

  it('enrolls the accepter into invited paths as STUDENT on acceptance', async () => {
    vi.mocked(selectOrganizationInviteWithOrgByTokenHash).mockResolvedValue(
      activeInvite({ pathIds: [PATH_ID] }) as never
    );
    vi.mocked(parsePathIdsFromInviteMetadata).mockReturnValue([PATH_ID]);
    vi.mocked(getOrgLearningPathsByIds).mockResolvedValue([
      { id: PATH_ID, name: 'Path One', sequentialUnlock: false }
    ] as never);

    const result = await acceptOrganizationInvite('token-1', USER as never);

    expect(vi.mocked(getOrgLearningPathsByIds)).toHaveBeenCalledWith(ORG_ID, [PATH_ID], expect.anything());
    expect(vi.mocked(enrollProfileCore)).toHaveBeenCalledWith(
      expect.objectContaining({ id: PATH_ID }),
      expect.objectContaining({ profileId: USER.id, email: 'student@example.com', roleId: ROLE.STUDENT }),
      expect.anything(),
      expect.anything()
    );
    expect(vi.mocked(trackServerEvent)).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'enrollment_completed',
        orgId: ORG_ID,
        userId: USER.id
      })
    );
    expect(vi.mocked(scheduleLearningPathProgressSync)).toHaveBeenCalledWith({
      pathId: PATH_ID,
      profileIds: [USER.id]
    });
    expect(result.redirectTo).toBe('/lms');
  });

  it('enrolls nothing when the invite carries no paths', async () => {
    await acceptOrganizationInvite('token-1', USER as never);

    expect(vi.mocked(getOrgLearningPathsByIds)).not.toHaveBeenCalled();
    expect(vi.mocked(enrollProfileCore)).not.toHaveBeenCalled();
  });

  it('skips paths that do not belong to the invite organization', async () => {
    vi.mocked(selectOrganizationInviteWithOrgByTokenHash).mockResolvedValue(
      activeInvite({ pathIds: [PATH_ID, 'other-org-path'] }) as never
    );
    vi.mocked(parsePathIdsFromInviteMetadata).mockReturnValue([PATH_ID, 'other-org-path']);
    vi.mocked(getOrgLearningPathsByIds).mockResolvedValue([
      { id: PATH_ID, name: 'Path One', sequentialUnlock: false }
    ] as never);

    await acceptOrganizationInvite('token-1', USER as never);

    expect(vi.mocked(enrollProfileCore)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(enrollProfileCore)).toHaveBeenCalledWith(
      expect.objectContaining({ id: PATH_ID }),
      expect.anything(),
      expect.anything(),
      expect.anything()
    );
  });
});

describe('acceptOrganizationInvite — path-only courses', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(selectOrganizationInviteWithOrgByTokenHash).mockResolvedValue(activeInvite({}) as never);
    vi.mocked(selectOrganizationMemberByOrgAndNormalizedEmail).mockResolvedValue(null as never);
    vi.mocked(selectOrganizationMemberByOrgAndProfile).mockResolvedValue(null as never);
    vi.mocked(claimPendingOrganizationInvite).mockResolvedValue({ id: 'invite-1' } as never);
    vi.mocked(parsePathIdsFromInviteMetadata).mockReturnValue([]);
    vi.mocked(parseCourseIdsFromInviteMetadata).mockReturnValue([]);
    vi.mocked(getEnrollOnlyInLearningPathCourses).mockResolvedValue([]);
    vi.mocked(getOrgLearningPathsByIds).mockResolvedValue([]);
  });

  it('skips path-only courses, enrolls the rest, and audits the skip', async () => {
    vi.mocked(selectOrganizationInviteWithOrgByTokenHash).mockResolvedValue(
      activeInvite({ courseIds: ['c-direct', 'c-path-only'] }) as never
    );
    vi.mocked(parseCourseIdsFromInviteMetadata).mockReturnValue(['c-direct', 'c-path-only']);
    vi.mocked(getEnrollOnlyInLearningPathCourses).mockResolvedValue([{ id: 'c-path-only', title: 'Path-only Course' }]);
    vi.mocked(getOrgCourseGroups).mockResolvedValue([{ courseId: 'c-direct', groupId: 'g-direct' }] as never);
    vi.mocked(enrollUsersInCourseGroups).mockResolvedValue(1);

    const result = await acceptOrganizationInvite('token-1', USER as never);

    expect(vi.mocked(getEnrollOnlyInLearningPathCourses)).toHaveBeenCalledWith(
      ['c-direct', 'c-path-only'],
      expect.anything()
    );
    expect(vi.mocked(enrollUsersInCourseGroups)).toHaveBeenCalledWith(
      ['g-direct'],
      [{ profileId: USER.id, email: 'student@example.com' }],
      ROLE.STUDENT,
      expect.anything()
    );
    expect(vi.mocked(bulkInsertDirectCourseGrants)).toHaveBeenCalledWith(
      expect.objectContaining({
        groupIds: ['g-direct'],
        profileIds: [USER.id],
        courseIds: ['c-direct'],
        source: 'ORG_AUDIENCE'
      }),
      expect.anything()
    );
    expect(vi.mocked(createOrganizationInviteAudit)).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'ACCEPTED',
        metadata: expect.objectContaining({ skippedPathOnlyCourseIds: ['c-path-only'] })
      })
    );
    // Compliance records follow the direct courses actually enrolled, in the acceptance tx.
    expect(vi.mocked(ensureComplianceEnrollmentRecordsForProfiles)).toHaveBeenCalledWith(
      ['c-direct'],
      [USER.id],
      expect.anything()
    );
    expect(result.redirectTo).toBe('/lms');
  });

  it('accepts cleanly when no course is path-only', async () => {
    vi.mocked(selectOrganizationInviteWithOrgByTokenHash).mockResolvedValue(
      activeInvite({ courseIds: ['c-direct'] }) as never
    );
    vi.mocked(parseCourseIdsFromInviteMetadata).mockReturnValue(['c-direct']);
    vi.mocked(getOrgCourseGroups).mockResolvedValue([{ courseId: 'c-direct', groupId: 'g-direct' }] as never);

    await acceptOrganizationInvite('token-1', USER as never);

    expect(vi.mocked(createOrganizationInviteAudit)).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({ skippedPathOnlyCourseIds: [] })
      })
    );
  });
});

describe('acceptOrganizationInvite — cohort provenance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(selectOrganizationInviteWithOrgByTokenHash).mockResolvedValue(activeInvite({}) as never);
    vi.mocked(selectOrganizationMemberByOrgAndNormalizedEmail).mockResolvedValue(null as never);
    vi.mocked(selectOrganizationMemberByOrgAndProfile).mockResolvedValue(null as never);
    vi.mocked(claimPendingOrganizationInvite).mockResolvedValue({ id: 'invite-1' } as never);
    vi.mocked(parsePathIdsFromInviteMetadata).mockReturnValue([]);
    vi.mocked(parseCourseIdsFromInviteMetadata).mockReturnValue([]);
    vi.mocked(parseCohortIdsFromInviteMetadata).mockReturnValue([]);
    vi.mocked(getEnrollOnlyInLearningPathCourses).mockResolvedValue([]);
    vi.mocked(getOrgLearningPathsByIds).mockResolvedValue([]);
  });

  it('records COHORT grants for cohort courses on acceptance', async () => {
    vi.mocked(selectOrganizationInviteWithOrgByTokenHash).mockResolvedValue(
      activeInvite({ cohortIds: ['cohort-1'] }) as never
    );
    vi.mocked(parseCohortIdsFromInviteMetadata).mockReturnValue(['cohort-1']);
    vi.mocked(getCourseIdsByCohortIds).mockResolvedValue(['c-1']);
    vi.mocked(getCohortCoursePairsByCohortIds).mockResolvedValue([{ cohortId: 'cohort-1', courseId: 'c-1' }]);
    vi.mocked(getOrgCourseGroups).mockResolvedValue([{ courseId: 'c-1', groupId: 'g-1' }] as never);
    vi.mocked(getGroupMemberByGroupAndProfile).mockResolvedValue({ id: 'gm-1', roleId: 3 });
    vi.mocked(enrollUsersInCourseGroups).mockResolvedValue(1);

    await acceptOrganizationInvite('token-1', USER as never);

    expect(vi.mocked(grantCourseAccess)).toHaveBeenCalledWith(
      expect.objectContaining({
        groupmemberId: 'gm-1',
        courseId: 'c-1',
        profileId: USER.id,
        source: 'COHORT',
        cohortId: 'cohort-1'
      }),
      expect.anything()
    );
    expect(vi.mocked(ensureComplianceEnrollmentRecordsForProfiles)).toHaveBeenCalledWith(
      ['c-1'],
      [USER.id],
      expect.anything()
    );
  });
});

describe('acceptOrganizationInvite — per-cohort grants', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(selectOrganizationMemberByOrgAndNormalizedEmail).mockResolvedValue(null as never);
    vi.mocked(selectOrganizationMemberByOrgAndProfile).mockResolvedValue(null as never);
    vi.mocked(claimPendingOrganizationInvite).mockResolvedValue({ id: 'invite-1' } as never);
    vi.mocked(parsePathIdsFromInviteMetadata).mockReturnValue([]);
    vi.mocked(parseCourseIdsFromInviteMetadata).mockReturnValue([]);
    vi.mocked(getEnrollOnlyInLearningPathCourses).mockResolvedValue([]);
    vi.mocked(getOrgLearningPathsByIds).mockResolvedValue([]);
  });

  it('tags each COHORT grant with the cohort that holds the course, recording the inviter', async () => {
    vi.mocked(selectOrganizationInviteWithOrgByTokenHash).mockResolvedValue({
      ...activeInvite({ cohortIds: ['cohort-a', 'cohort-b'] }),
      invite: { ...activeInvite({}).invite, createdByProfileId: 'admin-1' }
    } as never);
    vi.mocked(parseCohortIdsFromInviteMetadata).mockReturnValue(['cohort-a', 'cohort-b']);
    vi.mocked(getCourseIdsByCohortIds).mockResolvedValue(['c-a', 'c-b']);
    vi.mocked(getCohortCoursePairsByCohortIds).mockResolvedValue([
      { cohortId: 'cohort-a', courseId: 'c-a' },
      { cohortId: 'cohort-b', courseId: 'c-b' }
    ]);
    vi.mocked(getOrgCourseGroups).mockResolvedValue([
      { courseId: 'c-a', groupId: 'g-a' },
      { courseId: 'c-b', groupId: 'g-b' }
    ] as never);
    vi.mocked(getGroupMemberByGroupAndProfile).mockImplementation(async (groupId: string) => ({
      id: `gm-${groupId}`,
      roleId: 3
    }));
    vi.mocked(enrollUsersInCourseGroups).mockResolvedValue(2);

    await acceptOrganizationInvite('token-1', USER as never);

    expect(vi.mocked(grantCourseAccess)).toHaveBeenCalledTimes(2);
    expect(vi.mocked(grantCourseAccess)).toHaveBeenCalledWith(
      expect.objectContaining({
        courseId: 'c-a',
        cohortId: 'cohort-a',
        groupmemberId: 'gm-g-a',
        grantedByProfileId: 'admin-1'
      }),
      expect.anything()
    );
    expect(vi.mocked(grantCourseAccess)).toHaveBeenCalledWith(
      expect.objectContaining({
        courseId: 'c-b',
        cohortId: 'cohort-b',
        groupmemberId: 'gm-g-b',
        grantedByProfileId: 'admin-1'
      }),
      expect.anything()
    );
  });
});

describe('acceptOrganizationInvite — replayed acceptance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(selectOrganizationInviteWithOrgByTokenHash).mockResolvedValue(
      activeInvite({ pathIds: [PATH_ID] }) as never
    );
    vi.mocked(selectOrganizationMemberByOrgAndNormalizedEmail).mockResolvedValue(null as never);
    vi.mocked(selectOrganizationMemberByOrgAndProfile).mockResolvedValue(null as never);
    vi.mocked(parsePathIdsFromInviteMetadata).mockReturnValue([PATH_ID]);
    vi.mocked(getOrgLearningPathsByIds).mockResolvedValue([
      { id: PATH_ID, name: 'Path One', sequentialUnlock: false }
    ] as never);
  });

  it("accepting an already-accepted invite doesn't enroll anything new", async () => {
    vi.mocked(selectOrganizationInviteWithOrgByTokenHash).mockResolvedValue({
      invite: {
        id: 'invite-1',
        organizationId: ORG_ID,
        roleId: ROLE.STUDENT,
        email: 'student@example.com',
        tokenHash: 'hash',
        isRevoked: false,
        expiresAt: new Date(Date.now() + 3600_000).toISOString(),
        acceptedAt: new Date(Date.now() - 3600_000).toISOString(),
        metadata: { pathIds: [PATH_ID] }
      },
      organization: { id: ORG_ID, siteName: 'acme', name: 'Acme' }
    } as never);

    const result = await acceptOrganizationInvite('token-1', USER as never);

    expect(result.alreadyAccepted).toBe(true);
    expect(vi.mocked(enrollProfileCore)).not.toHaveBeenCalled();
    expect(vi.mocked(getOrgLearningPathsByIds)).not.toHaveBeenCalled();
    expect(vi.mocked(trackServerEvent)).not.toHaveBeenCalled();
  });
  it("accepting an already-accepted invite by id doesn't enroll anything new either", async () => {
    vi.mocked(selectOrganizationInviteWithOrgByInviteId).mockResolvedValue({
      invite: {
        id: 'invite-1',
        organizationId: ORG_ID,
        roleId: ROLE.STUDENT,
        email: 'student@example.com',
        tokenHash: 'hash',
        isRevoked: false,
        expiresAt: new Date(Date.now() + 3600_000).toISOString(),
        acceptedAt: new Date(Date.now() - 3600_000).toISOString(),
        metadata: { pathIds: [PATH_ID] }
      },
      organization: { id: ORG_ID, siteName: 'acme', name: 'Acme' }
    } as never);

    const result = await acceptOrganizationInviteById('invite-1', USER as never);

    expect(result.alreadyAccepted).toBe(true);
    expect(vi.mocked(enrollProfileCore)).not.toHaveBeenCalled();
    expect(vi.mocked(getOrgLearningPathsByIds)).not.toHaveBeenCalled();
  });
});
