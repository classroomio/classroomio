import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ROLE } from '@cio/utils/constants';
import { AppError, ErrorCodes } from '@api/utils/errors';

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  getLearningPathById: vi.fn(),
  getLearningPathByPublicId: vi.fn(),
  getMemberByPathAndProfile: vi.fn(),
  createLearningPath: vi.fn(),
  listLearningPaths: vi.fn(),
  updateLearningPath: vi.fn(),
  deleteLearningPath: vi.fn(),
  getCourseIdsInPath: vi.fn(),
  reorderLearningPathCourses: vi.fn(),
  isCourseTeamMemberOrOrgAdmin: vi.fn(),
  getPathsContainingCourseForMember: vi.fn(),
  getActiveGrantsForCourseAndProfile: vi.fn(),
  getCourseCompletionStatsForProfile: vi.fn()
}));

const transactionClient = { id: 'test-transaction-client' };

vi.mock('@cio/db/drizzle', () => ({
  db: {
    transaction: mocks.transaction
  }
}));

vi.mock('@cio/db/queries/learning-path', () => ({
  getLearningPathById: mocks.getLearningPathById,
  getLearningPathByPublicId: mocks.getLearningPathByPublicId,
  getMemberByPathAndProfile: mocks.getMemberByPathAndProfile,
  createLearningPath: mocks.createLearningPath,
  listLearningPaths: mocks.listLearningPaths,
  updateLearningPath: mocks.updateLearningPath,
  deleteLearningPath: mocks.deleteLearningPath,
  getCourseIdsInPath: mocks.getCourseIdsInPath,
  reorderLearningPathCourses: mocks.reorderLearningPathCourses,
  getPathsContainingCourseForMember: mocks.getPathsContainingCourseForMember,
  getActiveGrantsForCourseAndProfile: mocks.getActiveGrantsForCourseAndProfile,
  getCourseCompletionStatsForProfile: mocks.getCourseCompletionStatsForProfile
}));

vi.mock('@cio/db/queries/group', () => ({
  isCourseTeamMemberOrOrgAdmin: mocks.isCourseTeamMemberOrOrgAdmin
}));

import {
  resolveLearningPath,
  assertCanManageLearningPath,
  createLearningPathService,
  listOrgLearningPaths
} from '../learning-path';
import { assertCourseNotLockedForStudent, unlockedCourses } from '../unlock';
import { reorderPathCoursesService } from '../course-management';

describe('learning-path services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) =>
      callback(transactionClient)
    );
  });

  describe('resolveLearningPath', () => {
    it('resolves by UUID when given a 36-character UUID string', async () => {
      const mockUuid = '12345678-1234-1234-1234-123456789abc';
      const mockPath = { id: mockUuid, publicId: 'abc12345', name: 'Path 1' };
      mocks.getLearningPathById.mockResolvedValue(mockPath);

      const result = await resolveLearningPath(mockUuid);

      expect(mocks.getLearningPathById).toHaveBeenCalledWith(mockUuid, undefined);
      expect(mocks.getLearningPathByPublicId).not.toHaveBeenCalled();
      expect(result).toEqual(mockPath);
    });

    it('resolves by publicId when given an 8-character string', async () => {
      const mockPublicId = 'path8chr';
      const mockPath = { id: 'uuid-1', publicId: mockPublicId, name: 'Path 1' };
      mocks.getLearningPathByPublicId.mockResolvedValue(mockPath);

      const result = await resolveLearningPath(mockPublicId);

      expect(mocks.getLearningPathByPublicId).toHaveBeenCalledWith(mockPublicId, undefined);
      expect(mocks.getLearningPathById).not.toHaveBeenCalled();
      expect(result).toEqual(mockPath);
    });

    it('throws 404 AppError when path does not exist', async () => {
      mocks.getLearningPathByPublicId.mockResolvedValue(null);

      await expect(resolveLearningPath('nonexist')).rejects.toThrowError(
        new AppError('Learning path not found', ErrorCodes.LEARNING_PATH_NOT_FOUND, 404)
      );
    });
  });

  describe('assertCanManageLearningPath', () => {
    const samplePath = {
      id: 'path-uuid-1',
      organizationId: 'org-1',
      createdByProfileId: 'author-1'
    } as any;

    it('allows org admin directly without querying memberships', async () => {
      await expect(
        assertCanManageLearningPath(samplePath, 'user-admin', { 'org-1': ROLE.ADMIN })
      ).resolves.toBeUndefined();

      expect(mocks.getMemberByPathAndProfile).not.toHaveBeenCalled();
    });

    it('rejects tutor if they are path creator but not assigned as a TUTOR member', async () => {
      mocks.getMemberByPathAndProfile.mockResolvedValue(null);

      await expect(assertCanManageLearningPath(samplePath, 'author-1', { 'org-1': ROLE.TUTOR })).rejects.toThrowError(
        new AppError(
          'Only assigned tutors or organization admins can manage this learning path',
          ErrorCodes.UNAUTHORIZED,
          403
        )
      );

      expect(mocks.getMemberByPathAndProfile).toHaveBeenCalledWith('path-uuid-1', 'author-1', undefined);
    });

    it('allows tutor who is assigned as a TUTOR member of the path', async () => {
      mocks.getMemberByPathAndProfile.mockResolvedValue({
        id: 'member-1',
        roleId: ROLE.TUTOR,
        removedAt: null
      });

      await expect(
        assertCanManageLearningPath(samplePath, 'assigned-tutor', { 'org-1': ROLE.TUTOR })
      ).resolves.toBeUndefined();

      expect(mocks.getMemberByPathAndProfile).toHaveBeenCalledWith('path-uuid-1', 'assigned-tutor', undefined);
    });

    it('rejects tutor who is not assigned as tutor', async () => {
      mocks.getMemberByPathAndProfile.mockResolvedValue(null);

      await expect(
        assertCanManageLearningPath(samplePath, 'random-tutor', { 'org-1': ROLE.TUTOR })
      ).rejects.toThrowError(
        new AppError(
          'Only assigned tutors or organization admins can manage this learning path',
          ErrorCodes.UNAUTHORIZED,
          403
        )
      );
    });

    it('rejects non-team members', async () => {
      await expect(
        assertCanManageLearningPath(samplePath, 'student-user', { 'org-1': ROLE.STUDENT })
      ).rejects.toThrowError(
        new AppError('Only organization team members can manage learning paths', ErrorCodes.UNAUTHORIZED, 403)
      );
    });
  });

  describe('createLearningPathService', () => {
    it('requires organization admin role', async () => {
      await expect(
        createLearningPathService(
          'org-1',
          'tutor-1',
          { name: 'New Path', description: 'Desc', organizationId: 'org-1' },
          { 'org-1': ROLE.TUTOR }
        )
      ).rejects.toThrowError(
        new AppError('Only organization admins can create learning paths', ErrorCodes.UNAUTHORIZED, 403)
      );
    });

    it('trims name and description and sets isPublished to false', async () => {
      const createdPath = { id: 'new-path-id', name: 'Trimmed Path', isPublished: false };
      mocks.createLearningPath.mockResolvedValue(createdPath);

      const result = await createLearningPathService(
        'org-1',
        'admin-1',
        { name: '   Trimmed Path   ', description: '   Trimmed Desc   ', organizationId: 'org-1' },
        { 'org-1': ROLE.ADMIN }
      );

      expect(mocks.createLearningPath).toHaveBeenCalledWith({
        organizationId: 'org-1',
        createdByProfileId: 'admin-1',
        name: 'Trimmed Path',
        description: 'Trimmed Desc',
        isPublished: false
      });
      expect(result).toEqual(createdPath);
    });
  });

  describe('assertCourseNotLockedForStudent', () => {
    it('exempts course team members and org admins', async () => {
      mocks.isCourseTeamMemberOrOrgAdmin.mockResolvedValue(true);

      await expect(assertCourseNotLockedForStudent('course-1', 'profile-1')).resolves.toBeUndefined();
      expect(mocks.getPathsContainingCourseForMember).not.toHaveBeenCalled();
    });

    it('allows access if student is not enrolled in any path containing the course', async () => {
      mocks.isCourseTeamMemberOrOrgAdmin.mockResolvedValue(false);
      mocks.getPathsContainingCourseForMember.mockResolvedValue([]);

      await expect(assertCourseNotLockedForStudent('course-1', 'profile-1')).resolves.toBeUndefined();
    });

    it('allows access if student has a standalone (non-learning-path) enrollment grant', async () => {
      mocks.isCourseTeamMemberOrOrgAdmin.mockResolvedValue(false);
      mocks.getPathsContainingCourseForMember.mockResolvedValue([{ id: 'path-1', sequentialUnlock: true }]);
      mocks.getActiveGrantsForCourseAndProfile.mockResolvedValue([{ id: 'grant-1', source: 'MANUAL' }]);

      await expect(assertCourseNotLockedForStudent('course-1', 'profile-1')).resolves.toBeUndefined();
    });

    it('allows access if enrolled path has sequentialUnlock disabled', async () => {
      mocks.isCourseTeamMemberOrOrgAdmin.mockResolvedValue(false);
      mocks.getPathsContainingCourseForMember.mockResolvedValue([{ id: 'path-1', sequentialUnlock: false }]);
      mocks.getActiveGrantsForCourseAndProfile.mockResolvedValue([{ id: 'grant-1', source: 'LEARNING_PATH' }]);

      await expect(assertCourseNotLockedForStudent('course-1', 'profile-1')).resolves.toBeUndefined();
    });

    it('throws 403 COURSE_LOCKED when sequential path has locked the course', async () => {
      mocks.isCourseTeamMemberOrOrgAdmin.mockResolvedValue(false);
      mocks.getPathsContainingCourseForMember.mockResolvedValue([{ id: 'path-1', sequentialUnlock: true }]);
      mocks.getActiveGrantsForCourseAndProfile.mockResolvedValue([{ id: 'grant-1', source: 'LEARNING_PATH' }]);
      mocks.getCourseIdsInPath.mockResolvedValue(['course-0', 'course-1']);
      // course-0 is not complete for profile-1
      mocks.getCourseCompletionStatsForProfile.mockResolvedValue({ isComplete: false });

      await expect(assertCourseNotLockedForStudent('course-1', 'profile-1')).rejects.toThrowError(
        new AppError('Course is locked — complete the previous course first', ErrorCodes.COURSE_LOCKED, 403)
      );
    });

    it('allows access when previous course in sequential path is complete', async () => {
      mocks.isCourseTeamMemberOrOrgAdmin.mockResolvedValue(false);
      mocks.getPathsContainingCourseForMember.mockResolvedValue([{ id: 'path-1', sequentialUnlock: true }]);
      mocks.getActiveGrantsForCourseAndProfile.mockResolvedValue([{ id: 'grant-1', source: 'LEARNING_PATH' }]);
      mocks.getCourseIdsInPath.mockResolvedValue(['course-0', 'course-1']);
      // course-0 is complete for profile-1
      mocks.getCourseCompletionStatsForProfile.mockResolvedValue({ isComplete: true });

      await expect(assertCourseNotLockedForStudent('course-1', 'profile-1')).resolves.toBeUndefined();
    });
  });

  describe('reorderPathCoursesService', () => {
    const validPath = {
      id: '11111111-1111-1111-1111-111111111111',
      organizationId: 'org-1'
    };

    it('throws 400 INVALID_COURSE_IN_PATH if submitted courseIds do not match existing courses in path', async () => {
      mocks.getLearningPathById.mockResolvedValue(validPath);
      mocks.getCourseIdsInPath.mockResolvedValue(['c1', 'c2', 'c3']);

      await expect(
        reorderPathCoursesService(validPath.id, ['c1', 'c2'], 'admin-1', { 'org-1': ROLE.ADMIN })
      ).rejects.toThrowError(new AppError('Invalid course in path', ErrorCodes.INVALID_COURSE_IN_PATH, 400));
    });

    it('reorders courses and updates courseOrderSetAt in a transaction', async () => {
      mocks.getLearningPathById.mockResolvedValue(validPath);
      mocks.getCourseIdsInPath.mockResolvedValue(['c1', 'c2', 'c3']);

      const result = await reorderPathCoursesService(validPath.id, ['c3', 'c1', 'c2'], 'admin-1', {
        'org-1': ROLE.ADMIN
      });

      expect(mocks.transaction).toHaveBeenCalledOnce();
      expect(mocks.reorderLearningPathCourses).toHaveBeenCalledWith(
        validPath.id,
        ['c3', 'c1', 'c2'],
        transactionClient
      );
      expect(mocks.updateLearningPath).toHaveBeenCalledWith(
        validPath.id,
        expect.objectContaining({ courseOrderSetAt: expect.any(String) }),
        transactionClient
      );
      expect(result).toEqual({ reordered: true });
    });
  });
});
