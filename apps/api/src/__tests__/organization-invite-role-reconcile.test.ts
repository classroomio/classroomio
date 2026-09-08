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
  checkEmailsExistInOrg: vi.fn(),
  claimPendingOrganizationInvite: vi.fn(),
  createOrganizationInvite: vi.fn(),
  createOrganizationInviteAudit: vi.fn(),
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
  ensureComplianceEnrollmentRecordsForProfiles: vi.fn()
}));

import { acceptLinkInvite } from '@api/services/organization/invite';
import { scheduleCourseRoleReconcile } from '@cio/core/services/organization/course-roles';
import {
  getOrgLinkInviteWithOrg,
  selectOrganizationMemberByOrgAndNormalizedEmail,
  selectOrganizationMemberByOrgAndProfile,
  updateOrganizationMemberById
} from '@cio/db/queries/organization';
import { ROLE } from '@cio/utils/constants';

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
});
