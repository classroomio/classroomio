import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ROLE } from '@cio/utils/constants';

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  resolveLearningPath: vi.fn(),
  assertCanManageLearningPath: vi.fn(),
  getCourseOrgInfo: vi.fn(),
  getAddableOrgCourses: vi.fn(),
  addCourseToPath: vi.fn(),
  backfillMemberCourseProgressForAddedCourse: vi.fn(),
  listActivePathMemberIds: vi.fn(),
  getGroupMemberByGroupAndProfile: vi.fn(),
  insertGroupMembersOnConflictDoNothing: vi.fn(),
  grantCourseAccess: vi.fn(),
  updateLearningPath: vi.fn(),
  scheduleLearningPathProgressSync: vi.fn()
}));

const transactionClient = { id: 'test-transaction-client' };

vi.mock('@cio/db/drizzle', () => ({
  db: { transaction: mocks.transaction }
}));

vi.mock('../learning-path', () => ({
  resolveLearningPath: mocks.resolveLearningPath,
  assertCanManageLearningPath: mocks.assertCanManageLearningPath
}));

vi.mock('@cio/db/queries/course/course', () => ({
  getAddableOrgCourses: mocks.getAddableOrgCourses,
  getCourseOrgInfo: mocks.getCourseOrgInfo
}));

vi.mock('@cio/db/queries/learning-path', () => ({
  addCourseToPath: mocks.addCourseToPath,
  backfillMemberCourseProgressForAddedCourse: mocks.backfillMemberCourseProgressForAddedCourse,
  listActivePathMemberIds: mocks.listActivePathMemberIds,
  grantCourseAccess: mocks.grantCourseAccess,
  getCourseIdsInPath: vi.fn(),
  removeCourseFromPath: vi.fn(),
  reorderLearningPathCourses: vi.fn(),
  updateLearningPath: mocks.updateLearningPath
}));

vi.mock('@cio/db/queries/group', () => ({
  getGroupMemberByGroupAndProfile: mocks.getGroupMemberByGroupAndProfile,
  insertGroupMembersOnConflictDoNothing: mocks.insertGroupMembersOnConflictDoNothing
}));

vi.mock('../progress-sync-jobs', () => ({
  scheduleLearningPathProgressSync: mocks.scheduleLearningPathProgressSync
}));

import { addCoursesToPathService, listAddablePathCoursesService } from '../course-management';

describe('addCoursesToPathService always grants', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => cb(transactionClient));
    mocks.resolveLearningPath.mockResolvedValue({ id: 'path-1', organizationId: 'org-1', sequentialUnlock: false });
    mocks.assertCanManageLearningPath.mockResolvedValue(undefined);
    mocks.addCourseToPath.mockImplementation(async (_pathId: string, courseId: string) => ({ id: `pc-${courseId}` }));
    mocks.scheduleLearningPathProgressSync.mockReturnValue(undefined);
  });

  it('grants the new course to existing STUDENT members and skips tutors', async () => {
    mocks.listActivePathMemberIds.mockResolvedValue([
      { id: 'm-1', profileId: 'p-student', roleId: ROLE.STUDENT },
      { id: 'm-2', profileId: 'p-tutor', roleId: ROLE.TUTOR },
      { id: 'm-3', profileId: null, roleId: ROLE.STUDENT }
    ]);
    mocks.getCourseOrgInfo.mockResolvedValue({ organizationId: 'org-1', groupId: 'g-1' });
    mocks.getGroupMemberByGroupAndProfile.mockResolvedValue({ id: 'gm-1', roleId: ROLE.STUDENT });

    const added = await addCoursesToPathService('path-1', { courseIds: ['c-1'] }, 'admin-1', {
      'org-1': ROLE.ADMIN
    });

    expect(added).toHaveLength(1);
    expect(mocks.insertGroupMembersOnConflictDoNothing).toHaveBeenCalledWith(
      [{ groupId: 'g-1', roleId: ROLE.STUDENT, profileId: 'p-student' }],
      transactionClient
    );
    expect(mocks.grantCourseAccess).toHaveBeenCalledTimes(1);
    expect(mocks.grantCourseAccess).toHaveBeenCalledWith(
      expect.objectContaining({
        courseId: 'c-1',
        profileId: 'p-student',
        source: 'LEARNING_PATH',
        learningPathId: 'path-1',
        grantedByProfileId: 'admin-1'
      }),
      transactionClient
    );
    expect(mocks.updateLearningPath).toHaveBeenCalledWith(
      'path-1',
      expect.objectContaining({ courseOrderSetAt: expect.any(String) }),
      transactionClient
    );
  });

  it('writes no grant for a path student who already teaches the course', async () => {
    mocks.listActivePathMemberIds.mockResolvedValue([{ id: 'm-1', profileId: 'p-1', roleId: ROLE.STUDENT }]);
    mocks.getCourseOrgInfo.mockResolvedValue({ organizationId: 'org-1', groupId: 'g-1' });
    // The STUDENT insert was skipped: the profile already holds a TUTOR row in the course group.
    mocks.getGroupMemberByGroupAndProfile.mockResolvedValue({ id: 'gm-tutor', roleId: ROLE.TUTOR });

    await addCoursesToPathService('path-1', { courseIds: ['c-1'] }, 'admin-1', { 'org-1': ROLE.ADMIN });

    expect(mocks.grantCourseAccess).not.toHaveBeenCalled();
  });

  it('rejects a course from another organization before linking it', async () => {
    mocks.listActivePathMemberIds.mockResolvedValue([]);
    mocks.getCourseOrgInfo.mockResolvedValue({ organizationId: 'org-2', groupId: 'g-9' });

    await expect(
      addCoursesToPathService('path-1', { courseIds: ['c-foreign'] }, 'admin-1', { 'org-1': ROLE.ADMIN })
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(mocks.addCourseToPath).not.toHaveBeenCalled();
  });

  it('computes the student list once for multiple courses', async () => {
    mocks.listActivePathMemberIds.mockResolvedValue([{ id: 'm-1', profileId: 'p-1', roleId: ROLE.STUDENT }]);
    mocks.getCourseOrgInfo.mockResolvedValue({ organizationId: 'org-1', groupId: 'g-1' });
    mocks.getGroupMemberByGroupAndProfile.mockResolvedValue({ id: 'gm-1', roleId: ROLE.STUDENT });

    await addCoursesToPathService('path-1', { courseIds: ['c-1', 'c-2'] }, 'admin-1', {
      'org-1': ROLE.ADMIN
    });

    expect(mocks.listActivePathMemberIds).toHaveBeenCalledTimes(1);
    expect(mocks.grantCourseAccess).toHaveBeenCalledTimes(2);
  });
});

describe('listAddablePathCoursesService', () => {
  const PATH = { id: 'path-1', organizationId: 'org-1' };

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.resolveLearningPath.mockResolvedValue(PATH);
    mocks.assertCanManageLearningPath.mockResolvedValue(undefined);
    mocks.getAddableOrgCourses.mockResolvedValue({ items: [], total: 0 });
  });

  it('pages every org course not already in the path for an org admin, keeping path-only courses', async () => {
    const result = await listAddablePathCoursesService(
      'abc12345',
      'admin-1',
      { 'org-1': ROLE.ADMIN },
      {
        page: 1,
        limit: 20,
        search: 'sql'
      }
    );

    expect(mocks.getAddableOrgCourses).toHaveBeenCalledWith({
      orgId: 'org-1',
      memberProfileId: undefined,
      excludeLearningPathId: 'path-1',
      search: 'sql',
      page: 1,
      limit: 20
    });
    expect(result.pagination).toEqual({ page: 1, limit: 20, total: 0, totalPages: 0 });
  });

  it('limits a path tutor to the courses they belong to', async () => {
    await listAddablePathCoursesService('path-1', 'tutor-1', { 'org-1': ROLE.TUTOR }, { page: 1, limit: 20 });

    expect(mocks.getAddableOrgCourses).toHaveBeenCalledWith(expect.objectContaining({ memberProfileId: 'tutor-1' }));
  });

  it('rejects actors who cannot manage the path before querying', async () => {
    mocks.assertCanManageLearningPath.mockRejectedValue(new Error('forbidden'));

    await expect(
      listAddablePathCoursesService('path-1', 'student-1', { 'org-1': ROLE.STUDENT }, { page: 1, limit: 20 })
    ).rejects.toThrow('forbidden');
    expect(mocks.getAddableOrgCourses).not.toHaveBeenCalled();
  });
});
