import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ROLE } from '@cio/utils/constants';

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  resolveLearningPath: vi.fn(),
  assertCanManageLearningPath: vi.fn(),
  getCourseOrgInfo: vi.fn(),
  addCourseToPath: vi.fn(),
  backfillMemberCourseProgressForAddedCourse: vi.fn(),
  listActivePathMemberIds: vi.fn(),
  getGroupMemberIdByGroupAndProfile: vi.fn(),
  insertGroupMembersOnConflictDoNothing: vi.fn(),
  grantCourseAccess: vi.fn(),
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
  updateLearningPath: vi.fn()
}));

vi.mock('@cio/db/queries/group', () => ({
  getGroupMemberIdByGroupAndProfile: mocks.getGroupMemberIdByGroupAndProfile,
  insertGroupMembersOnConflictDoNothing: mocks.insertGroupMembersOnConflictDoNothing
}));

vi.mock('../progress-sync-jobs', () => ({
  scheduleLearningPathProgressSync: mocks.scheduleLearningPathProgressSync
}));

import { addCoursesToPathService } from '../course-management';

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
    mocks.getGroupMemberIdByGroupAndProfile.mockResolvedValue('gm-1');

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
  });

  it('computes the student list once for multiple courses', async () => {
    mocks.listActivePathMemberIds.mockResolvedValue([{ id: 'm-1', profileId: 'p-1', roleId: ROLE.STUDENT }]);
    mocks.getCourseOrgInfo.mockResolvedValue({ organizationId: 'org-1', groupId: 'g-1' });
    mocks.getGroupMemberIdByGroupAndProfile.mockResolvedValue('gm-1');

    await addCoursesToPathService('path-1', { courseIds: ['c-1', 'c-2'] }, 'admin-1', {
      'org-1': ROLE.ADMIN
    });

    expect(mocks.listActivePathMemberIds).toHaveBeenCalledTimes(1);
    expect(mocks.grantCourseAccess).toHaveBeenCalledTimes(2);
  });
});
