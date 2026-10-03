import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ROLE } from '@cio/utils/constants';
import { AppError, ErrorCodes } from '@api/utils/errors';

const mocks = vi.hoisted(() => ({
  env: { PUBLIC_IS_SELFHOSTED: undefined } as { PUBLIC_IS_SELFHOSTED?: string },
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
  hasLiveNonPathGrant: vi.fn(),
  getCourseCompletionStatsForProfile: vi.fn(),
  listLearningPathCourses: vi.fn(),
  enrollMember: vi.fn(),
  initializeMemberCourseProgress: vi.fn(),
  grantCourseAccess: vi.fn(),
  ensureLearningPathCourseGrants: vi.fn(),
  revokeLearningPathGrants: vi.fn(),
  updateMemberRole: vi.fn(),
  getMemberById: vi.fn(),
  revokeLearningPathGrantsForPath: vi.fn(),
  listPublicLearningPaths: vi.fn(),
  countIssuedCertificates: vi.fn(),
  getCourseGroupIds: vi.fn(),
  getGroupMemberIdByGroupAndProfile: vi.fn(),
  insertGroupMembersOnConflictDoNothing: vi.fn(),
  getMemberCourseProgress: vi.fn(),
  getLearningPathCertificate: vi.fn(),
  getOrganizationMemberIdByOrgAndProfile: vi.fn(),
  getUserOrgRolesMap: vi.fn(),
  createOrganizationMember: vi.fn(),
  getOrganizationById: vi.fn(),
  getProfilesByEmails: vi.fn(),
  getProfileById: vi.fn(),
  assertStudentCapacityOrThrow: vi.fn(),
  ensureComplianceEnrollmentRecordsForProfiles: vi.fn(),
  invalidateOrgStats: vi.fn(),
  createOrganizationMembers: vi.fn(),
  createOrganizationInvites: vi.fn(),
  createOrganizationInviteAudits: vi.fn(),
  getOrganizationMembersByNormalizedEmails: vi.fn(),
  revokeActiveOrganizationInvitesByEmails: vi.fn(),
  enqueueTransactionalEmail: vi.fn(),
  sendLearningPathWelcomeEmail: vi.fn(),
  supersedeStudentOrgInvites: vi.fn(),
  getStaffInvitedEmails: vi.fn(),
  orgHasCertificatesEnabled: vi.fn()
}));

const transactionClient = { id: 'test-transaction-client' };

vi.mock('@cio/db/drizzle', () => ({
  db: {
    transaction: mocks.transaction
  }
}));

vi.mock('@cio/core/config/env', () => ({
  env: mocks.env
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
  hasLiveNonPathGrant: mocks.hasLiveNonPathGrant,
  getCourseCompletionStatsForProfile: mocks.getCourseCompletionStatsForProfile,
  listLearningPathCourses: mocks.listLearningPathCourses,
  enrollMember: mocks.enrollMember,
  initializeMemberCourseProgress: mocks.initializeMemberCourseProgress,
  grantCourseAccess: mocks.grantCourseAccess,
  ensureLearningPathCourseGrants: mocks.ensureLearningPathCourseGrants,
  revokeLearningPathGrants: mocks.revokeLearningPathGrants,
  updateMemberRole: mocks.updateMemberRole,
  getMemberById: mocks.getMemberById,
  revokeLearningPathGrantsForPath: mocks.revokeLearningPathGrantsForPath,
  listPublicLearningPaths: mocks.listPublicLearningPaths,
  getMemberCourseProgress: mocks.getMemberCourseProgress,
  getLearningPathCertificate: mocks.getLearningPathCertificate
}));

vi.mock('@cio/db/queries/group', () => ({
  isCourseTeamMemberOrOrgAdmin: mocks.isCourseTeamMemberOrOrgAdmin,
  getGroupMemberIdByGroupAndProfile: mocks.getGroupMemberIdByGroupAndProfile,
  insertGroupMembersOnConflictDoNothing: mocks.insertGroupMembersOnConflictDoNothing
}));

vi.mock('@cio/db/queries/course/course', () => ({
  getCourseGroupIds: mocks.getCourseGroupIds
}));

vi.mock('@cio/db/queries/organization', () => ({
  getOrganizationMemberIdByOrgAndProfile: mocks.getOrganizationMemberIdByOrgAndProfile,
  getUserOrgRolesMap: mocks.getUserOrgRolesMap,
  createOrganizationMember: mocks.createOrganizationMember,
  getOrganizationById: mocks.getOrganizationById,
  createOrganizationMembers: mocks.createOrganizationMembers,
  createOrganizationInvites: mocks.createOrganizationInvites,
  createOrganizationInviteAudits: mocks.createOrganizationInviteAudits,
  getOrganizationMembersByNormalizedEmails: mocks.getOrganizationMembersByNormalizedEmails,
  revokeActiveOrganizationInvitesByEmails: mocks.revokeActiveOrganizationInvitesByEmails
}));

vi.mock('@cio/db/queries/auth', () => ({
  getProfilesByEmails: mocks.getProfilesByEmails,
  getProfileById: mocks.getProfileById
}));

vi.mock('@api/services/organization/student-limit', () => ({
  assertStudentCapacityOrThrow: mocks.assertStudentCapacityOrThrow
}));

vi.mock('@api/services/course/compliance', () => ({
  ensureComplianceEnrollmentRecordsForProfiles: mocks.ensureComplianceEnrollmentRecordsForProfiles
}));

vi.mock('@cio/core/utils/redis/org-stats-cache', () => ({
  invalidateOrgStats: mocks.invalidateOrgStats
}));

vi.mock('@api/services/jobs', () => ({
  enqueueTransactionalEmail: mocks.enqueueTransactionalEmail
}));

vi.mock('@api/utils/plan-features', () => ({
  orgHasCertificatesEnabled: mocks.orgHasCertificatesEnabled
}));

vi.mock('../progress-sync-jobs', () => ({
  scheduleLearningPathProgressSync: vi.fn()
}));

vi.mock('@cio/core/services/organization/supersede-invites', () => ({
  getStaffInvitedEmails: mocks.getStaffInvitedEmails,
  supersedeStudentOrgInvites: mocks.supersedeStudentOrgInvites
}));

import {
  resolveLearningPath,
  assertCanManageLearningPath,
  createLearningPathService,
  listOrgLearningPaths,
  listPublicLearningPathsService,
  getLearningPathDetail,
  updateLearningPathService,
  deleteLearningPathService,
  getPublicLearningPathBySlug
} from '../learning-path';
import { assertCourseNotLockedForStudent, unlockedCourses } from '../unlock';
import { reorderPathCoursesService } from '../course-management';
import { scheduleLearningPathProgressSync } from '../progress-sync-jobs';
import { addPathMembersService, enrollProfileInLearningPath, updatePathMemberRoleService } from '../member-management';

describe('learning-path services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) =>
      callback(transactionClient)
    );
    mocks.getOrganizationMemberIdByOrgAndProfile.mockResolvedValue(1);
    mocks.getUserOrgRolesMap.mockResolvedValue({});
    mocks.assertStudentCapacityOrThrow.mockResolvedValue(null);
    mocks.createOrganizationMember.mockResolvedValue({ id: 1 });
    mocks.invalidateOrgStats.mockResolvedValue(undefined);
    mocks.getProfilesByEmails.mockResolvedValue([]);
    mocks.getProfileById.mockResolvedValue(null);
    mocks.getOrganizationById.mockResolvedValue({ id: 'org-1', name: 'Org', siteName: 'org' });
    mocks.getOrganizationMembersByNormalizedEmails.mockResolvedValue([]);
    mocks.createOrganizationMembers.mockResolvedValue([]);
    mocks.createOrganizationInvites.mockResolvedValue([]);
    mocks.createOrganizationInviteAudits.mockResolvedValue([]);
    mocks.revokeActiveOrganizationInvitesByEmails.mockResolvedValue([]);
    mocks.orgHasCertificatesEnabled.mockResolvedValue(true);
    mocks.enqueueTransactionalEmail.mockResolvedValue(undefined);
    mocks.getStaffInvitedEmails.mockResolvedValue(new Set<string>());
    mocks.supersedeStudentOrgInvites.mockImplementation(
      async (_tx: unknown, input: { emails: string[]; add: { pathIds: string[] } }) => ({
        invites: input.emails.map((email: string) => ({
          email,
          inviteId: 'inv-1',
          token: 'token-1',
          expiresAt: '2026-03-01T00:00:00.000Z',
          courseIds: [],
          cohortIds: [],
          pathIds: input.add.pathIds,
          accessNamesLabel: undefined,
          merged: false
        })),
        skipped: []
      })
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

    it('strips the post-enrollment welcome message from public responses', async () => {
      mocks.getLearningPathBySlug.mockResolvedValue({
        id: 'path-1',
        organizationId: 'org-1',
        name: 'Published Path',
        description: 'Desc',
        slug: 'published-path',
        isPublished: true,
        welcomeEmailMessage: 'Welcome, enrolled learner!'
      });
      mocks.listLearningPathCourses.mockResolvedValue([]);
      mocks.countIssuedCertificates.mockResolvedValue(0);

      const result = await getPublicLearningPathBySlug('org-1', 'published-path');

      expect(result).not.toHaveProperty('welcomeEmailMessage');
      expect(result).toMatchObject({ id: 'path-1', name: 'Published Path' });
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

  describe('listPublicLearningPathsService', () => {
    const paginatedResult = {
      data: [{ id: 'path-1', publicId: 'AbC123Xy', name: 'Path 1', courseCount: 3 }],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 }
    };

    it('passes org, page, limit and search through to the public query', async () => {
      mocks.listPublicLearningPaths.mockResolvedValue(paginatedResult);

      const result = await listPublicLearningPathsService('org-1', {
        organizationId: 'org-1',
        page: 2,
        limit: 10,
        search: 'react'
      });

      expect(mocks.listPublicLearningPaths).toHaveBeenCalledWith(
        'org-1',
        { page: 2, limit: 10, search: 'react' },
        expect.anything()
      );
      expect(result).toEqual(paginatedResult);
    });
  });

  describe('deleteLearningPathService', () => {
    const mockUuid = '12345678-1234-1234-1234-123456789abc';

    it('soft-deletes via the query layer and returns the row', async () => {
      const mockPath = { id: mockUuid, organizationId: 'org-1', status: 'ACTIVE' };
      const deletedRow = { ...mockPath, status: 'DELETED' };
      mocks.getLearningPathById.mockResolvedValue(mockPath);
      mocks.deleteLearningPath.mockResolvedValue(deletedRow);
      mocks.revokeLearningPathGrantsForPath.mockResolvedValue(undefined);

      const result = await deleteLearningPathService(mockUuid, { 'org-1': ROLE.ADMIN });

      expect(mocks.deleteLearningPath).toHaveBeenCalledWith(mockUuid, transactionClient);
      expect(mocks.revokeLearningPathGrantsForPath).toHaveBeenCalledWith(mockUuid, transactionClient);
      expect(result).toEqual(deletedRow);
    });

    it('rejects non-admins', async () => {
      mocks.getLearningPathById.mockResolvedValue({ id: mockUuid, organizationId: 'org-1' });

      await expect(deleteLearningPathService(mockUuid, { 'org-1': ROLE.TUTOR })).rejects.toMatchObject({
        code: ErrorCodes.UNAUTHORIZED,
        statusCode: 403
      });
      expect(mocks.deleteLearningPath).not.toHaveBeenCalled();
      expect(mocks.revokeLearningPathGrantsForPath).not.toHaveBeenCalled();
    });

    it('surfaces grant-revocation failures instead of a half-deleted path', async () => {
      const mockPath = { id: mockUuid, organizationId: 'org-1', status: 'ACTIVE' };
      mocks.getLearningPathById.mockResolvedValue(mockPath);
      mocks.deleteLearningPath.mockResolvedValue({ ...mockPath, status: 'DELETED' });
      mocks.revokeLearningPathGrantsForPath.mockRejectedValue(new Error('grant store unavailable'));

      // Both writes share one transaction: with a real database the throw
      // rolls back the soft-delete too, so callers never observe a deleted
      // path whose grants are still live.
      await expect(deleteLearningPathService(mockUuid, { 'org-1': ROLE.ADMIN })).rejects.toMatchObject({
        code: ErrorCodes.INTERNAL_ERROR,
        statusCode: 500
      });

      expect(mocks.transaction).toHaveBeenCalledOnce();
      expect(mocks.deleteLearningPath).toHaveBeenCalledWith(mockUuid, transactionClient);
      expect(mocks.revokeLearningPathGrantsForPath).toHaveBeenCalledWith(mockUuid, transactionClient);
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

  describe('updatePathMemberRoleService', () => {
    const validPath = {
      id: '11111111-1111-1111-1111-111111111111',
      organizationId: 'org-1'
    };
    const studentMember = {
      id: 'member-1',
      learningPathId: validPath.id,
      profileId: 'profile-1',
      roleId: ROLE.STUDENT
    };

    it('changes a student to tutor as org admin and refreshes stats', async () => {
      mocks.getLearningPathById.mockResolvedValue(validPath);
      mocks.getMemberById.mockResolvedValue(studentMember);
      mocks.updateMemberRole.mockResolvedValue({ ...studentMember, roleId: ROLE.TUTOR });

      const result = await updatePathMemberRoleService(validPath.id, 'member-1', ROLE.TUTOR, 'admin-1', {
        'org-1': ROLE.ADMIN
      });

      expect(mocks.updateMemberRole).toHaveBeenCalledWith(
        'member-1',
        ROLE.TUTOR,
        transactionClient,
        validPath.id,
        ROLE.STUDENT
      );
      expect(result).toMatchObject({ id: 'member-1', roleId: ROLE.TUTOR });
      expect(mocks.invalidateOrgStats).toHaveBeenCalledWith('org-1');
    });

    it('rejects tutor assignment by non-admins', async () => {
      mocks.getLearningPathById.mockResolvedValue(validPath);
      mocks.getMemberById.mockResolvedValue(studentMember);
      // An assigned tutor gets past the manage check, so the tutor-role rule is what rejects.
      mocks.getMemberByPathAndProfile.mockResolvedValue({
        id: 'm-tutor-1',
        learningPathId: validPath.id,
        profileId: 'tutor-1',
        roleId: ROLE.TUTOR,
        removedAt: null
      });

      await expect(
        updatePathMemberRoleService(validPath.id, 'member-1', ROLE.TUTOR, 'tutor-1', { 'org-1': ROLE.TUTOR })
      ).rejects.toMatchObject({
        message: 'Only organization admins can assign tutor roles',
        code: ErrorCodes.UNAUTHORIZED,
        statusCode: 403
      });

      expect(mocks.updateMemberRole).not.toHaveBeenCalled();
    });

    it('throws 404 for members outside the path', async () => {
      mocks.getLearningPathById.mockResolvedValue(validPath);
      mocks.getMemberById.mockResolvedValue({ ...studentMember, learningPathId: 'other-path' });

      await expect(
        updatePathMemberRoleService(validPath.id, 'member-1', ROLE.TUTOR, 'admin-1', { 'org-1': ROLE.ADMIN })
      ).rejects.toMatchObject({ code: ErrorCodes.LEARNING_PATH_MEMBER_NOT_FOUND, statusCode: 404 });
    });

    it('a tutor demoting a tutor gets 403', async () => {
      const tutorMember = { ...studentMember, roleId: ROLE.TUTOR };
      mocks.getLearningPathById.mockResolvedValue(validPath);
      mocks.getMemberById.mockResolvedValue(tutorMember);
      mocks.getMemberByPathAndProfile.mockResolvedValue({
        id: 'm-tutor-1',
        learningPathId: validPath.id,
        profileId: 'tutor-1',
        roleId: ROLE.TUTOR,
        removedAt: null
      });

      await expect(
        updatePathMemberRoleService(validPath.id, 'member-1', ROLE.STUDENT, 'tutor-1', { 'org-1': ROLE.TUTOR })
      ).rejects.toMatchObject({
        message: 'Only organization admins can assign tutor roles',
        code: ErrorCodes.UNAUTHORIZED,
        statusCode: 403
      });

      expect(mocks.updateMemberRole).not.toHaveBeenCalled();
    });

    it('a tutor changing an ADMIN-role member gets 403', async () => {
      const adminMember = { ...studentMember, roleId: ROLE.ADMIN };
      mocks.getLearningPathById.mockResolvedValue(validPath);
      mocks.getMemberById.mockResolvedValue(adminMember);
      mocks.getMemberByPathAndProfile.mockResolvedValue({
        id: 'm-tutor-1',
        learningPathId: validPath.id,
        profileId: 'tutor-1',
        roleId: ROLE.TUTOR,
        removedAt: null
      });

      await expect(
        updatePathMemberRoleService(validPath.id, 'member-1', ROLE.STUDENT, 'tutor-1', { 'org-1': ROLE.TUTOR })
      ).rejects.toMatchObject({
        message: 'Only STUDENT or TUTOR roles can be changed',
        code: ErrorCodes.UNAUTHORIZED,
        statusCode: 403
      });

      expect(mocks.updateMemberRole).not.toHaveBeenCalled();
    });

    it('an org admin demoting a tutor succeeds', async () => {
      const tutorMember = { ...studentMember, roleId: ROLE.TUTOR };
      mocks.getLearningPathById.mockResolvedValue(validPath);
      mocks.getMemberById.mockResolvedValue(tutorMember);
      mocks.updateMemberRole.mockResolvedValue({ ...tutorMember, roleId: ROLE.STUDENT });
      mocks.listLearningPathCourses.mockResolvedValue([{ id: 'pc-1', courseId: 'c-1', order: 0 }]);

      const result = await updatePathMemberRoleService(validPath.id, 'member-1', ROLE.STUDENT, 'admin-1', {
        'org-1': ROLE.ADMIN
      });

      expect(result).toMatchObject({ id: 'member-1', roleId: ROLE.STUDENT });
      expect(mocks.updateMemberRole).toHaveBeenCalledWith(
        'member-1',
        ROLE.STUDENT,
        transactionClient,
        validPath.id,
        ROLE.TUTOR
      );
      expect(mocks.invalidateOrgStats).toHaveBeenCalledWith('org-1');
    });

    it('an org admin promoting a student succeeds', async () => {
      mocks.getLearningPathById.mockResolvedValue(validPath);
      mocks.getMemberById.mockResolvedValue(studentMember);
      mocks.updateMemberRole.mockResolvedValue({ ...studentMember, roleId: ROLE.TUTOR });

      const result = await updatePathMemberRoleService(validPath.id, 'member-1', ROLE.TUTOR, 'admin-1', {
        'org-1': ROLE.ADMIN
      });

      expect(result).toMatchObject({ id: 'member-1', roleId: ROLE.TUTOR });
      expect(mocks.invalidateOrgStats).toHaveBeenCalledWith('org-1');
    });

    it('a concurrent role change gets 409 and writes no grants', async () => {
      const tutorMember = { ...studentMember, roleId: ROLE.TUTOR };
      mocks.getLearningPathById.mockResolvedValue(validPath);
      mocks.getMemberById
        .mockResolvedValueOnce(tutorMember)
        .mockResolvedValueOnce({ ...tutorMember, roleId: ROLE.STUDENT, removedAt: null });
      mocks.updateMemberRole.mockResolvedValue(null);

      await expect(
        updatePathMemberRoleService(validPath.id, 'member-1', ROLE.STUDENT, 'admin-1', { 'org-1': ROLE.ADMIN })
      ).rejects.toMatchObject({ code: ErrorCodes.CONFLICT, statusCode: 409 });

      expect(mocks.ensureLearningPathCourseGrants).not.toHaveBeenCalled();
      expect(mocks.revokeLearningPathGrants).not.toHaveBeenCalled();
    });

    it('a tutor promoting a student gets 403', async () => {
      mocks.getLearningPathById.mockResolvedValue(validPath);
      mocks.getMemberById.mockResolvedValue(studentMember);
      mocks.getMemberByPathAndProfile.mockResolvedValue({
        id: 'm-tutor-1',
        learningPathId: validPath.id,
        profileId: 'tutor-1',
        roleId: ROLE.TUTOR,
        removedAt: null
      });

      await expect(
        updatePathMemberRoleService(validPath.id, 'member-1', ROLE.TUTOR, 'tutor-1', { 'org-1': ROLE.TUTOR })
      ).rejects.toMatchObject({
        message: 'Only organization admins can assign tutor roles',
        code: ErrorCodes.UNAUTHORIZED,
        statusCode: 403
      });

      expect(mocks.updateMemberRole).not.toHaveBeenCalled();
    });

    it('a removed member gets 404', async () => {
      mocks.getLearningPathById.mockResolvedValue(validPath);
      mocks.getMemberById.mockResolvedValue({ ...studentMember, removedAt: '2026-01-02T00:00:00.000Z' });

      await expect(
        updatePathMemberRoleService(validPath.id, 'member-1', ROLE.TUTOR, 'admin-1', { 'org-1': ROLE.ADMIN })
      ).rejects.toMatchObject({ code: ErrorCodes.LEARNING_PATH_MEMBER_NOT_FOUND, statusCode: 404 });

      expect(mocks.updateMemberRole).not.toHaveBeenCalled();
    });

    it('demoting a tutor to student writes course grants', async () => {
      const tutorMember = { ...studentMember, roleId: ROLE.TUTOR };
      mocks.getLearningPathById.mockResolvedValue(validPath);
      mocks.getMemberById.mockResolvedValue(tutorMember);
      mocks.updateMemberRole.mockResolvedValue({ ...tutorMember, roleId: ROLE.STUDENT });
      mocks.listLearningPathCourses.mockResolvedValue([{ id: 'pc-1', courseId: 'c-1', order: 0 }]);

      await updatePathMemberRoleService(validPath.id, 'member-1', ROLE.STUDENT, 'admin-1', {
        'org-1': ROLE.ADMIN
      });

      expect(mocks.ensureLearningPathCourseGrants).toHaveBeenCalledWith(
        validPath.id,
        'profile-1',
        'admin-1',
        transactionClient,
        ['c-1']
      );
    });
  });

  describe('assertCourseNotLockedForStudent transaction scope', () => {
    it('passes the caller transaction to the team check', async () => {
      mocks.isCourseTeamMemberOrOrgAdmin.mockResolvedValue(false);
      mocks.getPathsContainingCourseForMember.mockResolvedValue([]);

      await assertCourseNotLockedForStudent('course-1', 'profile-1', transactionClient as never);

      expect(mocks.isCourseTeamMemberOrOrgAdmin).toHaveBeenCalledWith('course-1', 'profile-1', transactionClient);
    });
  });

  describe('listOrgLearningPaths pagination', () => {
    const paginatedResult = {
      data: [{ id: 'path-1', name: 'Path 1' }],
      pagination: { page: 2, limit: 10, total: 25, totalPages: 3 }
    };

    it('passes page, limit and search through for org admins', async () => {
      mocks.listLearningPaths.mockResolvedValue(paginatedResult);

      const result = await listOrgLearningPaths(
        'org-1',
        'admin-1',
        { 'org-1': ROLE.ADMIN },
        { page: 2, limit: 10, search: 'react' }
      );

      expect(mocks.listLearningPaths).toHaveBeenCalledWith('org-1', { page: 2, limit: 10, search: 'react' });
      expect(result).toEqual(paginatedResult);
    });

    it('scopes tutor listings to assigned paths', async () => {
      mocks.listLearningPaths.mockResolvedValue({
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
      });

      await listOrgLearningPaths('org-1', 'tutor-1', { 'org-1': ROLE.TUTOR }, { page: 1, limit: 20 });

      expect(mocks.listLearningPaths).toHaveBeenCalledWith(
        'org-1',
        expect.objectContaining({ tutorProfileId: 'tutor-1', page: 1, limit: 20 })
      );
    });

    it('rejects non-team members', async () => {
      await expect(listOrgLearningPaths('org-1', 'student-1', { 'org-1': ROLE.STUDENT })).rejects.toMatchObject({
        code: ErrorCodes.UNAUTHORIZED,
        statusCode: 403
      });
      expect(mocks.listLearningPaths).not.toHaveBeenCalled();
    });

    it('passes status, enrollment, completion, sort and order through for org admins', async () => {
      mocks.listLearningPaths.mockResolvedValue(paginatedResult);

      await listOrgLearningPaths(
        'org-1',
        'admin-1',
        { 'org-1': ROLE.ADMIN },
        {
          page: 1,
          limit: 20,
          search: 'react',
          status: 'published',
          enrollment: '1-49',
          completion: 'low',
          sort: 'courses',
          order: 'asc'
        }
      );

      expect(mocks.listLearningPaths).toHaveBeenCalledWith(
        'org-1',
        expect.objectContaining({
          status: 'published',
          enrollment: '1-49',
          completion: 'low',
          sort: 'courses',
          order: 'asc'
        })
      );
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
      mocks.hasLiveNonPathGrant.mockResolvedValue(true);

      await expect(assertCourseNotLockedForStudent('course-1', 'profile-1')).resolves.toBeUndefined();
    });

    it('allows access if enrolled path has sequentialUnlock disabled', async () => {
      mocks.isCourseTeamMemberOrOrgAdmin.mockResolvedValue(false);
      mocks.getPathsContainingCourseForMember.mockResolvedValue([{ id: 'path-1', sequentialUnlock: false }]);
      mocks.hasLiveNonPathGrant.mockResolvedValue(false);

      await expect(assertCourseNotLockedForStudent('course-1', 'profile-1')).resolves.toBeUndefined();
    });

    it('throws 403 COURSE_LOCKED when sequential path has locked the course', async () => {
      mocks.isCourseTeamMemberOrOrgAdmin.mockResolvedValue(false);
      mocks.getPathsContainingCourseForMember.mockResolvedValue([{ id: 'path-1', sequentialUnlock: true }]);
      mocks.hasLiveNonPathGrant.mockResolvedValue(false);
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
      mocks.hasLiveNonPathGrant.mockResolvedValue(false);
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
      // With sequential unlock, the new order changes which courses are locked.
      expect(vi.mocked(scheduleLearningPathProgressSync)).toHaveBeenCalledWith({ pathId: validPath.id });
    });
  });

  describe('addPathMembersService', () => {
    const validPath = {
      id: '11111111-1111-1111-1111-111111111111',
      organizationId: 'org-1',
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

    it('allows org admin to assign ROLE.TUTOR on the path without granting course access', async () => {
      mocks.getLearningPathById.mockResolvedValue(validPath);
      mocks.listLearningPathCourses.mockResolvedValue([{ id: 'pc-1', courseId: 'c-1', order: 0 }]);
      mocks.enrollMember.mockResolvedValue({ id: 'm-2', roleId: ROLE.TUTOR });

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
      expect(mocks.ensureLearningPathCourseGrants).not.toHaveBeenCalled();
      expect(result).toMatchObject({ mode: 'completed', requested: 1 });
      expect(result.mode === 'completed' ? result.members : []).toHaveLength(1);
    });

    it('invites email-only members without a profile via org invite instead of throwing', async () => {
      mocks.getLearningPathById.mockResolvedValue(validPath);
      mocks.getProfilesByEmails.mockResolvedValue([]);
      mocks.getOrganizationById.mockResolvedValue({ id: 'org-1', name: 'Org', siteName: 'org' });
      mocks.getOrganizationMembersByNormalizedEmails.mockResolvedValue([]);
      mocks.createOrganizationInvites.mockResolvedValue([{ id: 'inv-1', email: 'pending@test.dev' }]);

      const result = await addPathMembersService(
        validPath.id,
        { members: [{ email: 'pending@test.dev', roleId: ROLE.STUDENT }] },
        'admin-1',
        { 'org-1': ROLE.ADMIN }
      );

      expect(mocks.enrollMember).not.toHaveBeenCalled();
      expect(mocks.supersedeStudentOrgInvites).toHaveBeenCalledWith(
        transactionClient,
        expect.objectContaining({
          orgId: 'org-1',
          emails: ['pending@test.dev'],
          actorProfileId: 'admin-1',
          source: 'LEARNING_PATH_MANUAL_ADD',
          add: { courseIds: [], cohortIds: [], pathIds: [validPath.id] }
        })
      );
      expect(mocks.enqueueTransactionalEmail).toHaveBeenCalledWith(
        'studentLearningPathInvite',
        expect.objectContaining({
          to: 'pending@test.dev',
          idempotencyKey: 'learning-path-manual-invite:inv-1'
        })
      );
      expect(result).toMatchObject({ mode: 'completed', requested: 1 });
      expect(result.mode === 'completed' ? result.members : []).toHaveLength(0);
    });

    it('writes no student member row for an email with a pending staff invite', async () => {
      mocks.getLearningPathById.mockResolvedValue(validPath);
      mocks.getProfilesByEmails.mockResolvedValue([]);
      mocks.getOrganizationMembersByNormalizedEmails.mockResolvedValue([]);
      // Both the up-front seat count and the invite transaction see the staff invite.
      mocks.getStaffInvitedEmails.mockResolvedValue(new Set(['staff@test.dev']));
      mocks.supersedeStudentOrgInvites.mockResolvedValueOnce({
        invites: [],
        skipped: [{ email: 'staff@test.dev', reason: 'STAFF_INVITE' }]
      });

      await addPathMembersService(
        validPath.id,
        { members: [{ email: 'staff@test.dev', roleId: ROLE.STUDENT }] },
        'admin-1',
        { 'org-1': ROLE.ADMIN }
      );

      expect(mocks.createOrganizationMembers).not.toHaveBeenCalled();
      expect(mocks.enqueueTransactionalEmail).not.toHaveBeenCalled();
    });

    it('resolves email-only members to an existing profile and enrolls directly', async () => {
      mocks.getLearningPathById.mockResolvedValue(validPath);
      mocks.getProfilesByEmails.mockResolvedValue([{ id: 'profile-found', email: 'found@test.dev' }]);
      mocks.getMemberByPathAndProfile.mockResolvedValue(null);
      mocks.listLearningPathCourses.mockResolvedValue([]);
      mocks.getCourseIdsInPath.mockResolvedValue([]);
      mocks.enrollMember.mockResolvedValue({ id: 'm-found', roleId: ROLE.STUDENT });

      const result = await addPathMembersService(
        validPath.id,
        { members: [{ email: 'found@test.dev', roleId: ROLE.STUDENT }] },
        'admin-1',
        { 'org-1': ROLE.ADMIN }
      );

      expect(mocks.enrollMember).toHaveBeenCalledWith(
        expect.objectContaining({ profileId: 'profile-found' }),
        transactionClient
      );
      expect(mocks.createOrganizationInvites).not.toHaveBeenCalled();
      expect(mocks.ensureComplianceEnrollmentRecordsForProfiles).toHaveBeenCalledWith([], ['profile-found']);
      expect(result).toMatchObject({ mode: 'completed', requested: 1 });
      expect(result.mode === 'completed' ? result.members : []).toHaveLength(1);
    });

    it('rejects email-only tutor adds without an account', async () => {
      mocks.getLearningPathById.mockResolvedValue(validPath);

      await expect(
        addPathMembersService(validPath.id, { members: [{ email: 'tutor@test.dev', roleId: ROLE.TUTOR }] }, 'admin-1', {
          'org-1': ROLE.ADMIN
        })
      ).rejects.toMatchObject({ code: ErrorCodes.VALIDATION_ERROR, statusCode: 400 });

      expect(mocks.enrollMember).not.toHaveBeenCalled();
      expect(mocks.createOrganizationInvites).not.toHaveBeenCalled();
    });
  });

  describe('enrollProfileInLearningPath', () => {
    const alwaysGrantPath = {
      id: '11111111-1111-1111-1111-111111111111',
      organizationId: 'org-1',
      sequentialUnlock: true
    };

    it('enrolls the profile, initializes progress and always grants courses as STUDENT', async () => {
      mocks.listLearningPathCourses.mockResolvedValue([{ id: 'pc-1', courseId: 'c-1', order: 0 }]);
      mocks.enrollMember.mockResolvedValue({ id: 'm-9', roleId: ROLE.STUDENT });

      const member = await enrollProfileInLearningPath(
        alwaysGrantPath,
        { profileId: 'profile-9', email: 'nine@test.dev', roleId: ROLE.STUDENT, grantedByProfileId: 'admin-1' },
        transactionClient as never
      );

      expect(member).toEqual({ id: 'm-9', roleId: ROLE.STUDENT });
      expect(mocks.enrollMember).toHaveBeenCalledWith(
        expect.objectContaining({
          learningPathId: alwaysGrantPath.id,
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
      expect(mocks.ensureLearningPathCourseGrants).toHaveBeenCalledWith(
        alwaysGrantPath.id,
        'profile-9',
        'admin-1',
        transactionClient,
        ['c-1']
      );
    });

    it('always grants path courses to students', async () => {
      mocks.listLearningPathCourses.mockResolvedValue([{ id: 'pc-1', courseId: 'c-1', order: 0 }]);
      mocks.enrollMember.mockResolvedValue({ id: 'm-10', roleId: ROLE.STUDENT });

      await enrollProfileInLearningPath(
        { ...alwaysGrantPath },
        { profileId: 'profile-10', roleId: ROLE.STUDENT },
        transactionClient as never
      );

      expect(mocks.initializeMemberCourseProgress).toHaveBeenCalled();
      expect(mocks.ensureLearningPathCourseGrants).toHaveBeenCalledWith(
        alwaysGrantPath.id,
        'profile-10',
        undefined,
        transactionClient,
        ['c-1']
      );
    });

    it('never grants path courses to tutors', async () => {
      mocks.listLearningPathCourses.mockResolvedValue([{ id: 'pc-1', courseId: 'c-1', order: 0 }]);
      mocks.enrollMember.mockResolvedValue({ id: 'm-14', roleId: ROLE.TUTOR });

      await enrollProfileInLearningPath(
        alwaysGrantPath,
        { profileId: 'profile-14', roleId: ROLE.TUTOR },
        transactionClient as never
      );

      expect(mocks.initializeMemberCourseProgress).toHaveBeenCalled();
      expect(mocks.ensureLearningPathCourseGrants).not.toHaveBeenCalled();
    });

    it('creates org membership with quota check for new STUDENT profiles', async () => {
      mocks.getOrganizationMemberIdByOrgAndProfile.mockResolvedValue(null);
      mocks.getUserOrgRolesMap.mockResolvedValue({});
      mocks.listLearningPathCourses.mockResolvedValue([]);
      mocks.enrollMember.mockResolvedValue({ id: 'm-11', roleId: ROLE.STUDENT });

      await enrollProfileInLearningPath(
        alwaysGrantPath,
        { profileId: 'profile-11', roleId: ROLE.STUDENT },
        transactionClient as never
      );

      expect(mocks.assertStudentCapacityOrThrow).toHaveBeenCalledWith('org-1', 1, transactionClient);
      expect(mocks.createOrganizationMember).toHaveBeenCalledWith(
        expect.objectContaining({ organizationId: 'org-1', profileId: 'profile-11', roleId: ROLE.STUDENT }),
        transactionClient
      );
    });

    it('self-hosted skips STUDENT org membership when the profile is already an org team member', async () => {
      mocks.env.PUBLIC_IS_SELFHOSTED = 'true';
      mocks.getOrganizationMemberIdByOrgAndProfile.mockResolvedValue(null);
      mocks.getUserOrgRolesMap.mockResolvedValue({ 'other-org': ROLE.ADMIN });
      mocks.listLearningPathCourses.mockResolvedValue([]);
      mocks.enrollMember.mockResolvedValue({ id: 'm-12', roleId: ROLE.STUDENT });

      try {
        await enrollProfileInLearningPath(
          alwaysGrantPath,
          { profileId: 'profile-12', roleId: ROLE.STUDENT },
          transactionClient as never
        );

        expect(mocks.getUserOrgRolesMap).toHaveBeenCalledWith('profile-12', transactionClient);
        expect(mocks.createOrganizationMember).not.toHaveBeenCalled();
        expect(mocks.assertStudentCapacityOrThrow).not.toHaveBeenCalled();
        expect(mocks.enrollMember).toHaveBeenCalled();
      } finally {
        mocks.env.PUBLIC_IS_SELFHOSTED = undefined;
      }
    });

    it('self-hosted creates the STUDENT org row for a normal student, after the student-limit check', async () => {
      mocks.env.PUBLIC_IS_SELFHOSTED = 'true';
      mocks.getOrganizationMemberIdByOrgAndProfile.mockResolvedValue(null);
      mocks.getUserOrgRolesMap.mockResolvedValue({});
      mocks.listLearningPathCourses.mockResolvedValue([]);
      mocks.enrollMember.mockResolvedValue({ id: 'm-14', roleId: ROLE.STUDENT });

      try {
        await enrollProfileInLearningPath(
          alwaysGrantPath,
          { profileId: 'profile-14', roleId: ROLE.STUDENT },
          transactionClient as never
        );

        expect(mocks.assertStudentCapacityOrThrow).toHaveBeenCalledWith('org-1', 1, transactionClient);
        expect(mocks.createOrganizationMember).toHaveBeenCalledWith(
          expect.objectContaining({ organizationId: 'org-1', profileId: 'profile-14', roleId: ROLE.STUDENT }),
          transactionClient
        );
        expect(mocks.assertStudentCapacityOrThrow.mock.invocationCallOrder[0]).toBeLessThan(
          mocks.createOrganizationMember.mock.invocationCallOrder[0]
        );
      } finally {
        mocks.env.PUBLIC_IS_SELFHOSTED = undefined;
      }
    });

    it('cloud creates the student org row even for org team members elsewhere', async () => {
      mocks.env.PUBLIC_IS_SELFHOSTED = undefined;
      mocks.getOrganizationMemberIdByOrgAndProfile.mockResolvedValue(null);
      mocks.getUserOrgRolesMap.mockResolvedValue({ 'other-org': ROLE.ADMIN });
      mocks.listLearningPathCourses.mockResolvedValue([]);
      mocks.enrollMember.mockResolvedValue({ id: 'm-12', roleId: ROLE.STUDENT });

      await enrollProfileInLearningPath(
        alwaysGrantPath,
        { profileId: 'profile-12', roleId: ROLE.STUDENT },
        transactionClient as never
      );

      expect(mocks.getUserOrgRolesMap).not.toHaveBeenCalled();
      expect(mocks.createOrganizationMember).toHaveBeenCalledWith(
        expect.objectContaining({ organizationId: 'org-1', profileId: 'profile-12', roleId: ROLE.STUDENT }),
        transactionClient
      );
    });

    it('skips org membership entirely for TUTOR enrollments', async () => {
      mocks.listLearningPathCourses.mockResolvedValue([]);
      mocks.enrollMember.mockResolvedValue({ id: 'm-13', roleId: ROLE.TUTOR });

      await enrollProfileInLearningPath(
        alwaysGrantPath,
        { profileId: 'profile-13', roleId: ROLE.TUTOR },
        transactionClient as never
      );

      expect(mocks.getOrganizationMemberIdByOrgAndProfile).not.toHaveBeenCalled();
      expect(mocks.createOrganizationMember).not.toHaveBeenCalled();
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

    it('returns certificatesIssued for an assigned path tutor', async () => {
      mocks.getLearningPathById.mockResolvedValue(testPath);
      mocks.listLearningPathCourses.mockResolvedValue([]);
      mocks.getMemberByPathAndProfile.mockResolvedValue({ id: 'tutor-m', roleId: ROLE.TUTOR, removedAt: null });
      mocks.countIssuedCertificates.mockResolvedValue(3);

      const result = await getLearningPathDetail(testPath.id, 'tutor-1', { 'org-1': ROLE.TUTOR });

      expect(result.certificatesIssued).toBe(3);
      expect(mocks.countIssuedCertificates).toHaveBeenCalled();
    });

    it('hides certificatesIssued from enrolled students', async () => {
      mocks.getLearningPathById.mockResolvedValue(testPath);
      mocks.listLearningPathCourses.mockResolvedValue([]);

      const result = await getLearningPathDetail(testPath.id, 'student-1', { 'org-1': ROLE.STUDENT });

      expect(result.certificatesIssued).toBe(0);
      expect(mocks.countIssuedCertificates).not.toHaveBeenCalled();
    });

    it('hides certificatesIssued from unassigned tutors', async () => {
      mocks.getLearningPathById.mockResolvedValue(testPath);
      mocks.listLearningPathCourses.mockResolvedValue([]);
      mocks.getMemberByPathAndProfile.mockResolvedValue(null);

      const result = await getLearningPathDetail(testPath.id, 'tutor-2', { 'org-1': ROLE.TUTOR });

      expect(result.certificatesIssued).toBe(0);
      expect(mocks.countIssuedCertificates).not.toHaveBeenCalled();
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
      expect(vi.mocked(scheduleLearningPathProgressSync)).not.toHaveBeenCalled();
    });

    it('resyncs member progress only when sequential unlock changes', async () => {
      const sequentialPath = { ...testPath, sequentialUnlock: true };
      mocks.getLearningPathById.mockResolvedValue(sequentialPath);
      mocks.updateLearningPath.mockResolvedValue({ ...sequentialPath, sequentialUnlock: false });

      await updateLearningPathService(testPath.id, 'user-1', { sequentialUnlock: true }, { 'org-1': ROLE.ADMIN });
      expect(vi.mocked(scheduleLearningPathProgressSync)).not.toHaveBeenCalled();

      await updateLearningPathService(testPath.id, 'user-1', { sequentialUnlock: false }, { 'org-1': ROLE.ADMIN });
      expect(vi.mocked(scheduleLearningPathProgressSync)).toHaveBeenCalledWith({ pathId: testPath.id });
    });

    it('allows certificate changes on plans with certificates enabled', async () => {
      mocks.getLearningPathById.mockResolvedValue(testPath);
      mocks.orgHasCertificatesEnabled.mockResolvedValue(true);
      mocks.updateLearningPath.mockResolvedValue({ ...testPath, certificate: { isDownloadable: true } });

      const updated = await updateLearningPathService(
        testPath.id,
        'user-1',
        { certificate: { isDownloadable: true } },
        { 'org-1': ROLE.ADMIN }
      );

      expect(mocks.orgHasCertificatesEnabled).toHaveBeenCalledWith('org-1');
      expect(updated.certificate).toMatchObject({ isDownloadable: true });
    });

    it('rejects certificate changes with UPGRADE_REQUIRED when the plan lacks certificates', async () => {
      mocks.getLearningPathById.mockResolvedValue(testPath);
      mocks.orgHasCertificatesEnabled.mockResolvedValue(false);

      await expect(
        updateLearningPathService(
          testPath.id,
          'user-1',
          { certificate: { isDownloadable: true } },
          { 'org-1': ROLE.ADMIN }
        )
      ).rejects.toMatchObject({ code: ErrorCodes.UPGRADE_REQUIRED, statusCode: 403 });
      expect(mocks.updateLearningPath).not.toHaveBeenCalled();
    });

    it('skips the plan check when the update does not touch the certificate', async () => {
      mocks.getLearningPathById.mockResolvedValue(testPath);
      mocks.updateLearningPath.mockResolvedValue({ ...testPath, name: 'Renamed' });

      await updateLearningPathService(testPath.id, 'user-1', { name: 'Renamed' }, { 'org-1': ROLE.ADMIN });

      expect(mocks.orgHasCertificatesEnabled).not.toHaveBeenCalled();
      expect(mocks.updateLearningPath).toHaveBeenCalled();
    });
  });
});
