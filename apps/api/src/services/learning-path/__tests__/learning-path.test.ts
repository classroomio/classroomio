import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ROLE } from '@cio/utils/constants';
import { AppError, ErrorCodes } from '@api/utils/errors';

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  getLearningPathById: vi.fn(),
  getLearningPathByPublicId: vi.fn(),
  getLearningPathBySlug: vi.fn(),
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
  getCourseCompletionStatsForProfile: vi.fn(),
  listLearningPathCourses: vi.fn(),
  enrollMember: vi.fn(),
  initializeMemberCourseProgress: vi.fn(),
  grantCourseAccess: vi.fn(),
  countIssuedCertificates: vi.fn(),
  getCourseGroupIds: vi.fn(),
  getGroupMemberIdByGroupAndProfile: vi.fn(),
  insertGroupMembersOnConflictDoNothing: vi.fn()
}));

const transactionClient = { id: 'test-transaction-client' };

vi.mock('@cio/db/drizzle', () => ({
  db: {
    transaction: mocks.transaction
  }
}));

vi.mock('@cio/db/queries/learning-path', () => ({
  countIssuedCertificates: mocks.countIssuedCertificates,
  getLearningPathById: mocks.getLearningPathById,
  getLearningPathByPublicId: mocks.getLearningPathByPublicId,
  getLearningPathBySlug: mocks.getLearningPathBySlug,
  getMemberByPathAndProfile: mocks.getMemberByPathAndProfile,
  createLearningPath: mocks.createLearningPath,
  listLearningPaths: mocks.listLearningPaths,
  updateLearningPath: mocks.updateLearningPath,
  deleteLearningPath: mocks.deleteLearningPath,
  getCourseIdsInPath: mocks.getCourseIdsInPath,
  reorderLearningPathCourses: mocks.reorderLearningPathCourses,
  getPathsContainingCourseForMember: mocks.getPathsContainingCourseForMember,
  getActiveGrantsForCourseAndProfile: mocks.getActiveGrantsForCourseAndProfile,
  getCourseCompletionStatsForProfile: mocks.getCourseCompletionStatsForProfile,
  listLearningPathCourses: mocks.listLearningPathCourses,
  enrollMember: mocks.enrollMember,
  initializeMemberCourseProgress: mocks.initializeMemberCourseProgress,
  grantCourseAccess: mocks.grantCourseAccess
}));

vi.mock('@cio/db/queries/group', () => ({
  isCourseTeamMemberOrOrgAdmin: mocks.isCourseTeamMemberOrOrgAdmin,
  getGroupMemberIdByGroupAndProfile: mocks.getGroupMemberIdByGroupAndProfile,
  insertGroupMembersOnConflictDoNothing: mocks.insertGroupMembersOnConflictDoNothing
}));

vi.mock('@cio/db/queries/course/course', () => ({
  getCourseGroupIds: mocks.getCourseGroupIds
}));

import {
  resolveLearningPath,
  assertCanManageLearningPath,
  createLearningPathService,
  listOrgLearningPaths,
  getLearningPathDetail,
  updateLearningPathService,
  deleteLearningPathService,
  getPublicLearningPathBySlug
} from '../learning-path';
import { assertCourseNotLockedForStudent, unlockedCourses } from '../unlock';
import { reorderPathCoursesService } from '../course-management';
import { addPathMembersService, enrollProfileInLearningPath } from '../member-management';

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

      await expect(resolveLearningPath('nonexist')).rejects.toMatchObject({
        code: ErrorCodes.LEARNING_PATH_NOT_FOUND,
        statusCode: 404
      });
    });

    it.each(['path8chr', 'abcd1234', 'PATH8CHR'])(
      'resolves publicId %s via getLearningPathByPublicId',
      async (publicId) => {
        const mockPath = { id: 'uuid-1', publicId, name: 'Path 1' };
        mocks.getLearningPathByPublicId.mockResolvedValue(mockPath);

        const result = await resolveLearningPath(publicId);

        expect(mocks.getLearningPathByPublicId).toHaveBeenCalledWith(publicId, undefined);
        expect(result).toEqual(mockPath);
      }
    );
  });

  describe('transaction rollback', () => {
    it('surfaces INTERNAL_ERROR when transaction fails mid-way without partial persist', async () => {
      mocks.getLearningPathById.mockResolvedValue({
        id: '12345678-1234-1234-1234-123456789abc',
        organizationId: 'org-1',
        isPublished: true
      });
      mocks.transaction.mockRejectedValueOnce(new Error('db connection lost'));

      await expect(
        deleteLearningPathService('12345678-1234-1234-1234-123456789abc', { 'org-1': ROLE.ADMIN })
      ).rejects.toMatchObject({ code: ErrorCodes.INTERNAL_ERROR, statusCode: 500 });
    });
  });

  describe('getPublicLearningPathBySlug', () => {
    it('resolves published paths with courses and certificate counts', async () => {
      const mockPath = {
        id: 'path-1',
        organizationId: 'org-1',
        name: 'Published Path',
        description: 'Desc',
        slug: 'published-path',
        isPublished: true
      };
      mocks.getLearningPathBySlug.mockResolvedValue(mockPath);
      mocks.listLearningPathCourses.mockResolvedValue([]);
      mocks.countIssuedCertificates.mockResolvedValue(0);

      const result = await getPublicLearningPathBySlug('org-1', 'published-path');

      expect(mocks.getLearningPathBySlug).toHaveBeenCalledWith('org-1', 'published-path', transactionClient);
      expect(result).toMatchObject({ id: 'path-1', courses: [], certificatesIssued: 0 });
    });

    it('throws 404 for unpublished paths', async () => {
      mocks.getLearningPathBySlug.mockResolvedValue({
        id: 'path-1',
        organizationId: 'org-1',
        name: 'Draft Path',
        description: 'Desc',
        slug: 'draft-path',
        isPublished: false
      });

      await expect(getPublicLearningPathBySlug('org-1', 'draft-path')).rejects.toMatchObject({
        code: ErrorCodes.LEARNING_PATH_NOT_FOUND,
        statusCode: 404
      });
    });

    it('throws 404 when the slug does not exist', async () => {
      mocks.getLearningPathBySlug.mockResolvedValue(null);

      await expect(getPublicLearningPathBySlug('org-1', 'missing')).rejects.toMatchObject({
        code: ErrorCodes.LEARNING_PATH_NOT_FOUND,
        statusCode: 404
      });
    });
  });

  describe('deleteLearningPathService', () => {
    const mockUuid = '12345678-1234-1234-1234-123456789abc';

    it('soft-deletes via the query layer and returns the row', async () => {
      const mockPath = { id: mockUuid, organizationId: 'org-1', status: 'ACTIVE' };
      const deletedRow = { ...mockPath, status: 'DELETED' };
      mocks.getLearningPathById.mockResolvedValue(mockPath);
      mocks.deleteLearningPath.mockResolvedValue(deletedRow);

      const result = await deleteLearningPathService(mockUuid, { 'org-1': ROLE.ADMIN });

      expect(mocks.deleteLearningPath).toHaveBeenCalledWith(mockUuid, transactionClient);
      expect(result).toEqual(deletedRow);
    });

    it('rejects non-admins', async () => {
      mocks.getLearningPathById.mockResolvedValue({ id: mockUuid, organizationId: 'org-1' });

      await expect(deleteLearningPathService(mockUuid, { 'org-1': ROLE.TUTOR })).rejects.toMatchObject({
        code: ErrorCodes.UNAUTHORIZED,
        statusCode: 403
      });
      expect(mocks.deleteLearningPath).not.toHaveBeenCalled();
    });
  });

  describe('assertCanManageLearningPath', () => {
    const samplePath = {
      id: 'path-uuid-1',
      organizationId: 'org-1',
      createdByProfileId: 'author-1'
    } as import('@cio/db/types').TLearningPath;

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

    it('rejects unassigned tutor without membership lookup bypass', async () => {
      mocks.getMemberByPathAndProfile.mockResolvedValue(null);

      await expect(
        assertCanManageLearningPath(samplePath, 'random-tutor', { 'org-1': ROLE.TUTOR })
      ).rejects.toMatchObject({ code: ErrorCodes.UNAUTHORIZED, statusCode: 403 });
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
          { name: 'New Path', description: 'Desc' },
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
        { name: '   Trimmed Path   ', description: '   Trimmed Desc   ' },
        { 'org-1': ROLE.ADMIN }
      );

      expect(mocks.createLearningPath).toHaveBeenCalledWith(
        {
          organizationId: 'org-1',
          createdByProfileId: 'admin-1',
          name: 'Trimmed Path',
          description: 'Trimmed Desc',
          isPublished: false
        },
        transactionClient
      );
      expect(mocks.enrollMember).toHaveBeenCalledWith(
        {
          learningPathId: 'new-path-id',
          profileId: 'admin-1',
          email: null,
          roleId: ROLE.TUTOR,
          status: 'NOT_STARTED'
        },
        transactionClient
      );
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

  describe('addPathMembersService', () => {
    const validPath = {
      id: '11111111-1111-1111-1111-111111111111',
      organizationId: 'org-1',
      autoEnroll: true,
      sequentialUnlock: false
    };

    it('rejects tutor trying to assign ROLE.TUTOR to a member', async () => {
      mocks.getLearningPathById.mockResolvedValue(validPath);
      mocks.getMemberByPathAndProfile.mockResolvedValue({
        id: 'caller-member',
        roleId: ROLE.TUTOR,
        removedAt: null
      });

      await expect(
        addPathMembersService(
          validPath.id,
          { members: [{ profileId: '00000000-0000-0000-0000-000000000002', roleId: ROLE.TUTOR }] },
          'caller-tutor',
          { 'org-1': ROLE.TUTOR }
        )
      ).rejects.toThrowError(
        new AppError('Only organization admins can assign tutor roles', ErrorCodes.UNAUTHORIZED, 403)
      );
    });

    it('allows org admin to assign ROLE.TUTOR on the path but ensures course group membership receives ROLE.STUDENT', async () => {
      mocks.getLearningPathById.mockResolvedValue(validPath);
      mocks.listLearningPathCourses.mockResolvedValue([{ id: 'pc-1', courseId: 'c-1', order: 0 }]);
      mocks.getCourseGroupIds.mockResolvedValue([{ courseId: 'c-1', groupId: 'g-1' }]);
      mocks.enrollMember.mockResolvedValue({ id: 'm-2', roleId: ROLE.TUTOR });
      mocks.getGroupMemberIdByGroupAndProfile.mockResolvedValue('gm-2');

      const result = await addPathMembersService(
        validPath.id,
        { members: [{ profileId: '00000000-0000-0000-0000-000000000002', roleId: ROLE.TUTOR }] },
        'admin-1',
        { 'org-1': ROLE.ADMIN }
      );

      expect(mocks.enrollMember).toHaveBeenCalledWith(
        expect.objectContaining({ roleId: ROLE.TUTOR }),
        transactionClient
      );
      expect(mocks.insertGroupMembersOnConflictDoNothing).toHaveBeenCalledWith(
        [{ groupId: 'g-1', profileId: '00000000-0000-0000-0000-000000000002', roleId: ROLE.STUDENT }],
        transactionClient
      );
      expect(result).toHaveLength(1);
    });

    it('rejects email-only members: pending invites enroll on acceptance, not as path rows', async () => {
      mocks.getLearningPathById.mockResolvedValue(validPath);

      await expect(
        addPathMembersService(
          validPath.id,
          { members: [{ email: 'pending@test.dev', roleId: ROLE.STUDENT }] },
          'admin-1',
          { 'org-1': ROLE.ADMIN }
        )
      ).rejects.toThrowError(
        new AppError(
          'Learning path members must have a profile. Invite new learners by email so they join the path when they accept the invite.',
          ErrorCodes.VALIDATION_ERROR,
          400
        )
      );

      expect(mocks.enrollMember).not.toHaveBeenCalled();
    });
  });

  describe('enrollProfileInLearningPath', () => {
    const autoEnrollPath = {
      id: '11111111-1111-1111-1111-111111111111',
      autoEnroll: true,
      sequentialUnlock: true
    };

    it('enrolls the profile, initializes progress and auto-enrolls courses as STUDENT', async () => {
      mocks.listLearningPathCourses.mockResolvedValue([{ id: 'pc-1', courseId: 'c-1', order: 0 }]);
      mocks.enrollMember.mockResolvedValue({ id: 'm-9', roleId: ROLE.STUDENT });
      mocks.getCourseGroupIds.mockResolvedValue([{ courseId: 'c-1', groupId: 'g-1' }]);
      mocks.getGroupMemberIdByGroupAndProfile.mockResolvedValue('gm-9');

      const member = await enrollProfileInLearningPath(
        autoEnrollPath,
        { profileId: 'profile-9', email: 'nine@test.dev', roleId: ROLE.STUDENT, grantedByProfileId: 'admin-1' },
        transactionClient as never
      );

      expect(member).toEqual({ id: 'm-9', roleId: ROLE.STUDENT });
      expect(mocks.enrollMember).toHaveBeenCalledWith(
        expect.objectContaining({
          learningPathId: autoEnrollPath.id,
          profileId: 'profile-9',
          email: 'nine@test.dev',
          roleId: ROLE.STUDENT
        }),
        transactionClient
      );
      expect(mocks.initializeMemberCourseProgress).toHaveBeenCalledWith(
        'm-9',
        [{ id: 'pc-1', order: 0 }],
        true,
        transactionClient
      );
      expect(mocks.insertGroupMembersOnConflictDoNothing).toHaveBeenCalledWith(
        [{ groupId: 'g-1', profileId: 'profile-9', roleId: ROLE.STUDENT }],
        transactionClient
      );
      expect(mocks.grantCourseAccess).toHaveBeenCalledWith(
        expect.objectContaining({
          groupmemberId: 'gm-9',
          courseId: 'c-1',
          profileId: 'profile-9',
          source: 'LEARNING_PATH',
          learningPathId: autoEnrollPath.id
        }),
        transactionClient
      );
    });

    it('skips course enrollment when autoEnroll is disabled but still initializes progress', async () => {
      mocks.listLearningPathCourses.mockResolvedValue([{ id: 'pc-1', courseId: 'c-1', order: 0 }]);
      mocks.enrollMember.mockResolvedValue({ id: 'm-10', roleId: ROLE.STUDENT });

      await enrollProfileInLearningPath(
        { ...autoEnrollPath, autoEnroll: false },
        { profileId: 'profile-10', roleId: ROLE.STUDENT },
        transactionClient as never
      );

      expect(mocks.initializeMemberCourseProgress).toHaveBeenCalled();
      expect(mocks.getCourseGroupIds).not.toHaveBeenCalled();
      expect(mocks.insertGroupMembersOnConflictDoNothing).not.toHaveBeenCalled();
      expect(mocks.grantCourseAccess).not.toHaveBeenCalled();
    });
  });

  describe('getLearningPathDetail and updateLearningPathService', () => {
    const testPath = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      publicId: 'LP123456',
      organizationId: 'org-1',
      name: 'Test Path',
      isPublished: true
    };

    it('returns path detail with courses and certificatesIssued count', async () => {
      mocks.getLearningPathById.mockResolvedValue(testPath);
      mocks.listLearningPathCourses.mockResolvedValue([{ id: 'c-1', title: 'Course 1' }]);
      mocks.countIssuedCertificates.mockResolvedValue(5);

      const result = await getLearningPathDetail(testPath.id, 'user-1', { 'org-1': ROLE.ADMIN });

      expect(result.certificatesIssued).toBe(5);
      expect(result.courses).toHaveLength(1);
      expect(mocks.countIssuedCertificates).toHaveBeenCalledWith(testPath.id, transactionClient);
    });

    it('rejects landingPage update containing disallowed javascript: href', async () => {
      mocks.getLearningPathById.mockResolvedValue(testPath);

      await expect(
        updateLearningPathService(
          testPath.id,
          'user-1',
          {
            landingPage: {
              title: 'XSS attempt',
              reviews: [
                {
                  id: 1,
                  hide: false,
                  name: 'Attacker',
                  rating: 5,
                  description: 'Click here',
                  avatar_url: 'javascript:alert(1)',
                  created_at: 1000
                }
              ]
            }
          },
          { 'org-1': ROLE.ADMIN }
        )
      ).rejects.toMatchObject({ code: ErrorCodes.VALIDATION_ERROR, statusCode: 400 });
    });

    it('allows valid landingPage update and calls updateLearningPath', async () => {
      mocks.getLearningPathById.mockResolvedValue(testPath);
      mocks.updateLearningPath.mockResolvedValue({ ...testPath, name: 'Updated' });

      const updated = await updateLearningPathService(
        testPath.id,
        'user-1',
        {
          landingPage: {
            title: 'Valid title',
            goals: '<p>Learn React</p>'
          }
        },
        { 'org-1': ROLE.ADMIN }
      );

      expect(updated.name).toBe('Updated');
      expect(mocks.updateLearningPath).toHaveBeenCalled();
    });
  });
});
