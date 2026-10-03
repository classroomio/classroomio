import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ROLE } from '@cio/utils/constants';
import { AppError, ErrorCodes } from '@api/utils/errors';

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
  getCohortMemberById: vi.fn(),
  updateCohortMember: vi.fn(),
  getCohortCoursePairsByCohortIds: vi.fn(),
  revokeCohortGrants: vi.fn(),
  removeCourseFromCohort: vi.fn(),
  isCohortCourse: vi.fn(),
  addCourseToCohort: vi.fn(),
  getCohortMembers: vi.fn(),
  recordDirectCourseGrantsBulk: vi.fn(),
  assertCourseAllowsDirectStudentAdd: vi.fn(),
  // Default: nothing is path-only. Tests that need path-only courses override it.
  filterOutPathOnlyCourseIds: vi.fn(async (courseIds: string[]) => ({
    allowedCourseIds: courseIds,
    skippedPathOnlyCourseIds: [] as string[]
  }))
}));

const transactionClient = { id: 'test-transaction-client' };

vi.mock('@cio/db/drizzle', () => ({
  db: { transaction: mocks.transaction }
}));

vi.mock('@cio/db/queries/cohort', () => ({
  removeCourseFromCohort: mocks.removeCourseFromCohort,
  addCohortMember: mocks.addCohortMember,
  getCohortById: mocks.getCohortById,
  getCohortMemberByProfileId: mocks.getCohortMemberByProfileId,
  getCoursesByCohort: mocks.getCoursesByCohort,
  getCohortMembers: mocks.getCohortMembers,
  getCohortsByOrg: vi.fn(),
  isCohortCourse: mocks.isCohortCourse,
  addCourseToCohort: mocks.addCourseToCohort,
  removeCohortMember: mocks.removeCohortMember,
  getCohortMemberById: mocks.getCohortMemberById,
  updateCohortMember: mocks.updateCohortMember,
  getCohortCoursePairsByCohortIds: mocks.getCohortCoursePairsByCohortIds
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

vi.mock('@api/services/course/path-gate', () => ({
  assertCourseAllowsDirectStudentAdd: mocks.assertCourseAllowsDirectStudentAdd,
  filterOutPathOnlyCourseIds: mocks.filterOutPathOnlyCourseIds
}));

vi.mock('@api/services/course/enrollment-grants', () => ({
  recordDirectCourseGrantsBulk: mocks.recordDirectCourseGrantsBulk
}));

vi.mock('@api/services/organization/student-limit', () => ({
  assertStudentCapacityOrThrow: mocks.assertStudentCapacityOrThrow,
  notifyStudentMilestone: mocks.notifyStudentMilestone
}));

import {
  addCourseToCohortService,
  addCohortMembers,
  ensureCohortCourseGrants,
  removeCohortMemberService,
  removeCourseFromCohortService,
  updateCohortMemberService
} from '../cohort';

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
    mocks.getCohortMemberByProfileId.mockResolvedValue({
      id: 'cm-1',
      cohortId: 'cohort-1',
      profileId: 'p-1',
      roleId: 3
    });
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
    mocks.getCohortMemberByProfileId.mockResolvedValue({
      id: 'cm-1',
      cohortId: 'cohort-1',
      profileId: 'p-1',
      roleId: 3
    });
    mocks.getCourseGroupIds.mockResolvedValue([{ courseId: 'c-1', groupId: 'g-1' }]);
    mocks.getGroupMemberIdByGroupAndProfile.mockResolvedValue(null);

    await ensureCohortCourseGrants('cohort-1', 'p-1', undefined, transactionClient as never, ['c-1']);

    expect(mocks.grantCourseAccess).not.toHaveBeenCalled();
  });

  it('skips tutors and admins: staff access is role-based', async () => {
    mocks.getCohortMemberByProfileId.mockResolvedValue({
      id: 'cm-2',
      cohortId: 'cohort-1',
      profileId: 'p-2',
      roleId: 2
    });

    await ensureCohortCourseGrants('cohort-1', 'p-2', undefined, transactionClient as never, ['c-1']);

    expect(mocks.getCourseGroupIds).not.toHaveBeenCalled();
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
    mocks.getCohortMemberByProfileId.mockImplementation(
      async (cohortId: string, profileId: string, dbClient?: unknown) => {
        // Existing-member check runs without a tx; grant check runs inside the tx.
        if (!dbClient || (dbClient as { id?: string }).id !== 'test-transaction-client') {
          return null;
        }
        return { id: 'cm-1', cohortId: 'cohort-1', profileId: 'p-1', roleId: 3 };
      }
    );
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
  it('grants only the open courses and reports the path-only ones it skipped', async () => {
    mocks.getCoursesByCohort.mockResolvedValue([{ course: { id: 'c-open' } }, { course: { id: 'c-path-only' } }]);
    mocks.filterOutPathOnlyCourseIds.mockResolvedValueOnce({
      allowedCourseIds: ['c-open'],
      skippedPathOnlyCourseIds: ['c-path-only']
    });
    mocks.getCourseGroupIds.mockResolvedValue([{ courseId: 'c-open', groupId: 'g-open' }]);

    const result = await addCohortMembers(
      'cohort-1',
      { members: [{ profileId: 'p-1', roleId: ROLE.STUDENT }] },
      'actor-1'
    );

    expect(result.skippedPathOnlyCourseIds).toEqual(['c-path-only']);
    expect(mocks.getCourseGroupIds).toHaveBeenCalledWith(['c-open'], expect.anything());
    expect(mocks.grantCourseAccess).toHaveBeenCalledWith(
      expect.objectContaining({ courseId: 'c-open', source: 'COHORT' }),
      transactionClient
    );
    expect(mocks.grantCourseAccess).not.toHaveBeenCalledWith(
      expect.objectContaining({ courseId: 'c-path-only' }),
      expect.anything()
    );
  });
});

describe('removeCohortMemberService grant revocation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) =>
      callback(transactionClient)
    );
  });

  it('revokes the cohort grants of the removed profile', async () => {
    mocks.removeCohortMember.mockResolvedValue({ id: 'cm-1', cohortId: 'cohort-1', profileId: 'p-1' });

    const removed = await removeCohortMemberService('cohort-1', 'cm-1');

    expect(removed).toEqual({ id: 'cm-1', cohortId: 'cohort-1', profileId: 'p-1' });
    expect(mocks.removeCohortMember).toHaveBeenCalledWith('cohort-1', 'cm-1', transactionClient);
    expect(mocks.revokeCohortGrants).toHaveBeenCalledWith('cohort-1', 'p-1', transactionClient);
  });

  it('skips revocation for profile-less rows', async () => {
    mocks.removeCohortMember.mockResolvedValue({ id: 'cm-2', cohortId: 'cohort-1', profileId: null });

    await removeCohortMemberService('cohort-1', 'cm-2');

    expect(mocks.revokeCohortGrants).not.toHaveBeenCalled();
  });

  it('rolls back removal when revocation fails', async () => {
    mocks.removeCohortMember.mockResolvedValue({ id: 'cm-3', cohortId: 'cohort-1', profileId: 'p-3' });
    mocks.revokeCohortGrants.mockRejectedValue(new Error('revoke failed'));
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) =>
      callback(transactionClient)
    );

    await expect(removeCohortMemberService('cohort-1', 'cm-3')).rejects.toThrow();
    expect(mocks.removeCohortMember).toHaveBeenCalled();
  });

  it('returns 404 when removing a member of cohort B through cohort A', async () => {
    mocks.removeCohortMember.mockResolvedValue(null);

    await expect(removeCohortMemberService('cohort-A', 'member-of-B')).rejects.toMatchObject({
      code: 'COHORT_MEMBER_NOT_FOUND'
    });
    expect(mocks.revokeCohortGrants).not.toHaveBeenCalled();
  });
});

describe('updateCohortMemberService role changes', () => {
  const STUDENT_MEMBER = {
    id: 'cm-1',
    cohortId: 'cohort-1',
    profileId: 'p-1',
    email: 'p1@test.com',
    roleId: ROLE.STUDENT
  };
  const TUTOR_MEMBER = { ...STUDENT_MEMBER, roleId: ROLE.TUTOR };
  const MILESTONE = { orgId: 'org-1', milestone: 'half', studentCount: 10, studentLimit: 20 };

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) =>
      callback(transactionClient)
    );
    mocks.getCohortById.mockResolvedValue(COHORT);
    mocks.getCohortCoursePairsByCohortIds.mockResolvedValue([{ cohortId: 'cohort-1', courseId: 'c-1' }]);
    mocks.getCourseGroupIds.mockResolvedValue([{ courseId: 'c-1', groupId: 'g-1' }]);
    mocks.getOrgMembersByProfileIds.mockResolvedValue([]);
    mocks.assertStudentCapacityOrThrow.mockResolvedValue(null);
    mocks.insertGroupMembersOnConflictDoNothing.mockResolvedValue(undefined);
    mocks.revokeCohortGrants.mockResolvedValue(undefined);
    mocks.notifyStudentMilestone.mockResolvedValue(undefined);
  });

  it('returns 404 when changing a member of cohort B through cohort A', async () => {
    mocks.getCohortMemberById.mockResolvedValue(null);

    await expect(updateCohortMemberService('cohort-A', 'member-of-B', { roleId: ROLE.TUTOR })).rejects.toMatchObject({
      statusCode: 404,
      code: ErrorCodes.COHORT_MEMBER_NOT_FOUND
    });

    expect(mocks.getCohortMemberById).toHaveBeenCalledWith('cohort-A', 'member-of-B', transactionClient);
    expect(mocks.updateCohortMember).not.toHaveBeenCalled();
  });

  it('leaves the member and their grants alone when the role does not change', async () => {
    mocks.getCohortMemberById.mockResolvedValue(STUDENT_MEMBER);

    const updated = await updateCohortMemberService('cohort-1', 'cm-1', { roleId: ROLE.STUDENT });

    expect(updated).toEqual(STUDENT_MEMBER);
    expect(mocks.updateCohortMember).not.toHaveBeenCalled();
    expect(mocks.revokeCohortGrants).not.toHaveBeenCalled();
    expect(mocks.recordDirectCourseGrantsBulk).not.toHaveBeenCalled();
  });

  it('revokes the COHORT grants when a student becomes a tutor', async () => {
    mocks.getCohortMemberById.mockResolvedValue(STUDENT_MEMBER);
    mocks.updateCohortMember.mockResolvedValue(TUTOR_MEMBER);

    const updated = await updateCohortMemberService('cohort-1', 'cm-1', { roleId: ROLE.TUTOR });

    expect(updated).toEqual(TUTOR_MEMBER);
    expect(mocks.updateCohortMember).toHaveBeenCalledWith(
      'cohort-1',
      'cm-1',
      { roleId: ROLE.TUTOR },
      transactionClient,
      ROLE.STUDENT
    );
    expect(mocks.revokeCohortGrants).toHaveBeenCalledWith('cohort-1', 'p-1', transactionClient);
    expect(mocks.recordDirectCourseGrantsBulk).not.toHaveBeenCalled();
  });

  it('enrolls a tutor made a student in the cohort courses and sends the milestone after commit', async () => {
    mocks.getCohortMemberById.mockResolvedValue(TUTOR_MEMBER);
    mocks.updateCohortMember.mockResolvedValue(STUDENT_MEMBER);
    mocks.assertStudentCapacityOrThrow.mockResolvedValue(MILESTONE);

    await updateCohortMemberService('cohort-1', 'cm-1', { roleId: ROLE.STUDENT });

    expect(mocks.assertStudentCapacityOrThrow).toHaveBeenCalledWith('org-1', 1, transactionClient, {
      deferNotification: true
    });
    expect(mocks.insertOrganizationMembersOnConflictDoNothing).toHaveBeenCalledWith(
      [expect.objectContaining({ organizationId: 'org-1', profileId: 'p-1', roleId: ROLE.STUDENT })],
      transactionClient
    );
    expect(mocks.insertGroupMembersOnConflictDoNothing).toHaveBeenCalledWith(
      [expect.objectContaining({ groupId: 'g-1', profileId: 'p-1', roleId: ROLE.STUDENT })],
      transactionClient
    );
    expect(mocks.recordDirectCourseGrantsBulk).toHaveBeenCalledWith(
      { groupIds: ['g-1'], profileIds: ['p-1'], courseIds: ['c-1'], source: 'COHORT', cohortId: 'cohort-1' },
      transactionClient
    );
    expect(mocks.revokeCohortGrants).not.toHaveBeenCalled();
    expect(mocks.notifyStudentMilestone).toHaveBeenCalledWith(MILESTONE);
  });

  it('returns 409 and changes no grants when the role changed concurrently', async () => {
    mocks.getCohortMemberById.mockResolvedValue(STUDENT_MEMBER);
    mocks.updateCohortMember.mockResolvedValue(null);

    await expect(updateCohortMemberService('cohort-1', 'cm-1', { roleId: ROLE.TUTOR })).rejects.toMatchObject({
      statusCode: 409,
      code: ErrorCodes.CONFLICT
    });

    expect(mocks.revokeCohortGrants).not.toHaveBeenCalled();
  });

  it('never sends the milestone email when the enrollment rolls back', async () => {
    mocks.getCohortMemberById.mockResolvedValue(TUTOR_MEMBER);
    mocks.updateCohortMember.mockResolvedValue(STUDENT_MEMBER);
    mocks.assertStudentCapacityOrThrow.mockResolvedValue(MILESTONE);
    mocks.insertGroupMembersOnConflictDoNothing.mockRejectedValueOnce(new Error('insert failed'));

    await expect(updateCohortMemberService('cohort-1', 'cm-1', { roleId: ROLE.STUDENT })).rejects.toThrow();

    expect(mocks.notifyStudentMilestone).not.toHaveBeenCalled();
  });
});

describe('removeCourseFromCohortService keeps grants', () => {
  it('does not revoke grants when a course leaves a cohort', async () => {
    const { removeCourseFromCohort } = await import('@cio/db/queries/cohort');
    vi.mocked(removeCourseFromCohort as never as (...a: never[]) => Promise<unknown>);
    mocks.removeCourseFromCohort.mockResolvedValue({ cohortId: 'cohort-1', courseId: 'c-1' });
    mocks.revokeCohortGrants.mockClear();

    const removed = await removeCourseFromCohortService('cohort-1', 'c-1');

    expect(removed).toEqual({ cohortId: 'cohort-1', courseId: 'c-1' });
    expect(mocks.revokeCohortGrants).not.toHaveBeenCalled();
  });
});

describe('addCourseToCohortService', () => {
  const studentRow = { roleId: ROLE.STUDENT, profileId: 'p-1', email: 'p1@test.dev' };

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => cb(transactionClient));
    mocks.getCohortById.mockResolvedValue(COHORT);
    mocks.isCohortCourse.mockResolvedValue(false);
    mocks.addCourseToCohort.mockResolvedValue({ id: 'cc-1', cohortId: COHORT.id, courseId: 'c-1' });
    mocks.getCohortMembers.mockResolvedValue([studentRow]);
    mocks.getCourseGroupIds.mockResolvedValue([{ courseId: 'c-1', groupId: 'g-1' }]);
    mocks.getOrgMembersByProfileIds.mockResolvedValue([]);
    mocks.assertStudentCapacityOrThrow.mockResolvedValue(null);
    mocks.notifyStudentMilestone.mockResolvedValue(undefined);
  });

  it('rejects a path-only course with 400 before writing anything', async () => {
    mocks.assertCourseAllowsDirectStudentAdd.mockRejectedValueOnce(
      new AppError('This course can only be accessed through a learning path', ErrorCodes.VALIDATION_ERROR, 400)
    );

    await expect(addCourseToCohortService(COHORT.id, { courseId: 'c-1' })).rejects.toMatchObject({ statusCode: 400 });

    expect(mocks.addCourseToCohort).not.toHaveBeenCalled();
  });

  it('checks for a duplicate inside the transaction and returns 409', async () => {
    mocks.isCohortCourse.mockResolvedValue(true);

    await expect(addCourseToCohortService(COHORT.id, { courseId: 'c-1' })).rejects.toMatchObject({ statusCode: 409 });

    expect(mocks.isCohortCourse).toHaveBeenCalledWith(COHORT.id, 'c-1', transactionClient);
    expect(mocks.addCourseToCohort).not.toHaveBeenCalled();
  });

  it('maps a concurrent duplicate (unique violation) to 409', async () => {
    mocks.addCourseToCohort.mockRejectedValue(Object.assign(new Error('duplicate key'), { code: '23505' }));

    await expect(addCourseToCohortService(COHORT.id, { courseId: 'c-1' })).rejects.toMatchObject({ statusCode: 409 });
  });

  it('sends the student-limit milestone email only after the transaction commits', async () => {
    const milestone = { orgId: 'org-1', milestone: 'half', studentCount: 10, studentLimit: 20 };
    mocks.assertStudentCapacityOrThrow.mockResolvedValue(milestone);

    await addCourseToCohortService(COHORT.id, { courseId: 'c-1' });

    expect(mocks.notifyStudentMilestone).toHaveBeenCalledWith(milestone);
  });

  it('never sends the milestone email when the transaction rolls back', async () => {
    mocks.assertStudentCapacityOrThrow.mockResolvedValue({
      orgId: 'org-1',
      milestone: 'half',
      studentCount: 10,
      studentLimit: 20
    });
    mocks.recordDirectCourseGrantsBulk.mockRejectedValue(new Error('grant insert failed'));

    await expect(addCourseToCohortService(COHORT.id, { courseId: 'c-1' })).rejects.toThrow();

    expect(mocks.notifyStudentMilestone).not.toHaveBeenCalled();
  });
});
