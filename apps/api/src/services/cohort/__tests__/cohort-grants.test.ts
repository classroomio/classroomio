import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ROLE } from '@cio/utils/constants';

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  getCohortById: vi.fn(),
  getCoursesByCohort: vi.fn(),
  getCohortMemberByProfileId: vi.fn(),
  addCohortMember: vi.fn(),
  getCourseGroupIds: vi.fn(),
  getGroupMemberIdByGroupAndProfile: vi.fn(),
  insertGroupMembersOnConflictDoNothing: vi.fn(),
  grantCourseAccess: vi.fn(),
  getProfileByEmail: vi.fn(),
  getOrgMembersByProfileIds: vi.fn(),
  getOrganizationMemberIdByOrgAndProfile: vi.fn(),
  insertOrganizationMembersOnConflictDoNothing: vi.fn(),
  assertStudentCapacityOrThrow: vi.fn(),
  notifyStudentMilestone: vi.fn(),
  removeCohortMember: vi.fn(),
  revokeCohortGrants: vi.fn()
}));

const transactionClient = { id: 'test-transaction-client' };

vi.mock('@cio/db/drizzle', () => ({
  db: { transaction: mocks.transaction }
}));

vi.mock('@cio/db/queries/cohort', () => ({
  addCohortMember: mocks.addCohortMember,
  getCohortById: mocks.getCohortById,
  getCohortMemberByProfileId: mocks.getCohortMemberByProfileId,
  getCoursesByCohort: mocks.getCoursesByCohort,
  getCohortMembers: vi.fn(),
  getCohortsByOrg: vi.fn(),
  removeCohortMember: mocks.removeCohortMember
}));

vi.mock('@cio/db/queries/course', () => ({
  getCourseGroupIds: mocks.getCourseGroupIds
}));

vi.mock('@cio/db/queries/group', () => ({
  getGroupMemberIdByGroupAndProfile: mocks.getGroupMemberIdByGroupAndProfile,
  insertGroupMembersOnConflictDoNothing: mocks.insertGroupMembersOnConflictDoNothing
}));

vi.mock('@cio/db/queries/learning-path', () => ({
  grantCourseAccess: mocks.grantCourseAccess,
  revokeCohortGrants: mocks.revokeCohortGrants
}));

vi.mock('@cio/db/queries/auth', () => ({
  getProfileByEmail: mocks.getProfileByEmail
}));

vi.mock('@cio/db/queries/organization', () => ({
  getOrgMembersByProfileIds: mocks.getOrgMembersByProfileIds,
  getOrganizationMemberIdByOrgAndProfile: mocks.getOrganizationMemberIdByOrgAndProfile,
  insertOrganizationMembersOnConflictDoNothing: mocks.insertOrganizationMembersOnConflictDoNothing
}));

vi.mock('@api/services/organization/student-limit', () => ({
  assertStudentCapacityOrThrow: mocks.assertStudentCapacityOrThrow,
  notifyStudentMilestone: mocks.notifyStudentMilestone
}));

import { addCohortMembers, ensureCohortCourseGrants, removeCohortMemberService } from '../cohort';

const COHORT = { id: 'cohort-1', organizationId: 'org-1', name: 'Cohort' };

describe('ensureCohortCourseGrants', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) =>
      callback(transactionClient)
    );
  });

  it('does nothing when the cohort has no courses', async () => {
    await ensureCohortCourseGrants('cohort-1', 'p-1', undefined, transactionClient as never, []);

    expect(mocks.getCourseGroupIds).not.toHaveBeenCalled();
    expect(mocks.grantCourseAccess).not.toHaveBeenCalled();
  });

  it('records a COHORT grant for each enrolled course group membership', async () => {
    mocks.getCourseGroupIds.mockResolvedValue([
      { courseId: 'c-1', groupId: 'g-1' },
      { courseId: 'c-2', groupId: null }
    ]);
    mocks.getGroupMemberIdByGroupAndProfile.mockResolvedValue('gm-1');

    await ensureCohortCourseGrants('cohort-1', 'p-1', 'actor-1', transactionClient as never, ['c-1', 'c-2']);

    expect(mocks.grantCourseAccess).toHaveBeenCalledTimes(1);
    expect(mocks.grantCourseAccess).toHaveBeenCalledWith(
      expect.objectContaining({
        groupmemberId: 'gm-1',
        courseId: 'c-1',
        profileId: 'p-1',
        source: 'COHORT',
        cohortId: 'cohort-1',
        grantedByProfileId: 'actor-1'
      }),
      transactionClient
    );
  });

  it('skips courses where the profile has no group membership', async () => {
    mocks.getCourseGroupIds.mockResolvedValue([{ courseId: 'c-1', groupId: 'g-1' }]);
    mocks.getGroupMemberIdByGroupAndProfile.mockResolvedValue(null);

    await ensureCohortCourseGrants('cohort-1', 'p-1', undefined, transactionClient as never, ['c-1']);

    expect(mocks.grantCourseAccess).not.toHaveBeenCalled();
  });
});

describe('addCohortMembers course grants', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) =>
      callback(transactionClient)
    );
    mocks.getCohortById.mockResolvedValue(COHORT);
    mocks.getCoursesByCohort.mockResolvedValue([{ course: { id: 'c-1' } }]);
    mocks.getCourseGroupIds.mockResolvedValue([{ courseId: 'c-1', groupId: 'g-1' }]);
    mocks.getGroupMemberIdByGroupAndProfile.mockResolvedValue('gm-1');
    mocks.getOrganizationMemberIdByOrgAndProfile.mockResolvedValue(7);
    mocks.addCohortMember.mockImplementation(async (data: { profileId: string }) => ({
      id: 'cm-1',
      profileId: data.profileId,
      roleId: ROLE.STUDENT
    }));
  });

  it('records COHORT grants when manually adding a student', async () => {
    await addCohortMembers('cohort-1', { members: [{ profileId: 'p-1', roleId: ROLE.STUDENT }] }, 'actor-1');

    expect(mocks.grantCourseAccess).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'COHORT', cohortId: 'cohort-1', profileId: 'p-1' }),
      transactionClient
    );
  });
});

describe('removeCohortMemberService grant revocation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('revokes the cohort grants of the removed profile', async () => {
    mocks.removeCohortMember.mockResolvedValue({ id: 'cm-1', cohortId: 'cohort-1', profileId: 'p-1' });

    const removed = await removeCohortMemberService('cohort-1', 'cm-1');

    expect(removed).toEqual({ id: 'cm-1', cohortId: 'cohort-1', profileId: 'p-1' });
    expect(mocks.revokeCohortGrants).toHaveBeenCalledWith('cohort-1', 'p-1');
  });

  it('skips revocation for profile-less rows', async () => {
    mocks.removeCohortMember.mockResolvedValue({ id: 'cm-2', cohortId: 'cohort-1', profileId: null });

    await removeCohortMemberService('cohort-1', 'cm-2');

    expect(mocks.revokeCohortGrants).not.toHaveBeenCalled();
  });
});
