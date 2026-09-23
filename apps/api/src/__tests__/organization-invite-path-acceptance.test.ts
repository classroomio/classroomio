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

vi.mock('@cio/db/queries/course', () => ({ getCourseGroupIds: vi.fn().mockResolvedValue([]) }));
vi.mock('@cio/db/queries/group', () => ({ enrollUsersInCourseGroups: vi.fn().mockResolvedValue(0) }));
vi.mock('@cio/db/queries/cohort', () => ({
  addCohortMember: vi.fn(),
  getCourseIdsByCohortIds: vi.fn().mockResolvedValue([]),
  getExistingCohortMembers: vi.fn().mockResolvedValue(new Set())
}));
vi.mock('@cio/db/queries/learning-path', () => ({
  getOrgLearningPathsByIds: vi.fn().mockResolvedValue([])
}));
vi.mock('@api/services/learning-path/member-management', () => ({
  enrollProfileInLearningPath: vi.fn().mockResolvedValue({ id: 'path-member-1' })
}));
vi.mock('@cio/core/utils/redis/org-stats-cache', () => ({ invalidateOrgStats: vi.fn() }));
vi.mock('@cio/core/config/dashboard-url', () => ({
  getAppBaseUrl: vi.fn(() => 'https://app.test'),
  getDashboardBaseUrl: vi.fn(() => 'https://lms.test')
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
vi.mock('@cio/core/services/organization/course-roles', () => ({
  scheduleCourseRoleReconcile: vi.fn()
}));

import { acceptOrganizationInvite } from '@api/services/organization/invite';
import {
  claimPendingOrganizationInvite,
  selectOrganizationInviteWithOrgByTokenHash,
  selectOrganizationMemberByOrgAndNormalizedEmail,
  selectOrganizationMemberByOrgAndProfile
} from '@cio/db/queries/organization';
import { parsePathIdsFromInviteMetadata } from '@api/utils/org';
import { getOrgLearningPathsByIds } from '@cio/db/queries/learning-path';
import { enrollProfileInLearningPath } from '@api/services/learning-path/member-management';
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
      { id: PATH_ID, name: 'Path One', autoEnroll: true, sequentialUnlock: false }
    ] as never);

    const result = await acceptOrganizationInvite('token-1', USER as never);

    expect(vi.mocked(getOrgLearningPathsByIds)).toHaveBeenCalledWith(ORG_ID, [PATH_ID], expect.anything());
    expect(vi.mocked(enrollProfileInLearningPath)).toHaveBeenCalledWith(
      expect.objectContaining({ id: PATH_ID }),
      expect.objectContaining({ profileId: USER.id, email: 'student@example.com', roleId: ROLE.STUDENT }),
      expect.anything()
    );
    expect(result.redirectTo).toBe('/lms');
  });

  it('enrolls nothing when the invite carries no paths', async () => {
    await acceptOrganizationInvite('token-1', USER as never);

    expect(vi.mocked(getOrgLearningPathsByIds)).not.toHaveBeenCalled();
    expect(vi.mocked(enrollProfileInLearningPath)).not.toHaveBeenCalled();
  });

  it('skips paths that do not belong to the invite organization', async () => {
    vi.mocked(selectOrganizationInviteWithOrgByTokenHash).mockResolvedValue(
      activeInvite({ pathIds: [PATH_ID, 'other-org-path'] }) as never
    );
    vi.mocked(parsePathIdsFromInviteMetadata).mockReturnValue([PATH_ID, 'other-org-path']);
    vi.mocked(getOrgLearningPathsByIds).mockResolvedValue([
      { id: PATH_ID, name: 'Path One', autoEnroll: false, sequentialUnlock: false }
    ] as never);

    await acceptOrganizationInvite('token-1', USER as never);

    expect(vi.mocked(enrollProfileInLearningPath)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(enrollProfileInLearningPath)).toHaveBeenCalledWith(
      expect.objectContaining({ id: PATH_ID }),
      expect.anything(),
      expect.anything()
    );
  });
});
