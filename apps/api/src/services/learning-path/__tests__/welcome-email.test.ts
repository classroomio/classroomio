import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  enqueueTransactionalEmail: vi.fn(),
  getOrganizationById: vi.fn(),
  getProfileById: vi.fn(),
  getLearningPathById: vi.fn(),
  getMemberByPathAndProfile: vi.fn(),
  enrollMember: vi.fn(),
  listLearningPathCourses: vi.fn(),
  initializeMemberCourseProgress: vi.fn(),
  getCourseGroupIds: vi.fn(),
  getGroupMemberIdByGroupAndProfile: vi.fn(),
  insertGroupMembersOnConflictDoNothing: vi.fn(),
  grantCourseAccess: vi.fn(),
  ensureComplianceEnrollmentRecordsForProfiles: vi.fn(),
  invalidateOrgStats: vi.fn()
}));

const transactionClient = { id: 'test-transaction-client' };

vi.mock('@cio/db/drizzle', () => ({
  db: {
    transaction: mocks.transaction
  }
}));

vi.mock('@api/services/jobs', () => ({
  enqueueTransactionalEmail: mocks.enqueueTransactionalEmail
}));

vi.mock('@cio/db/queries/organization', () => ({
  getOrganizationById: mocks.getOrganizationById,
  getOrganizationMemberIdByOrgAndProfile: vi.fn().mockResolvedValue('org-member-1'),
  createOrganizationMember: vi.fn()
}));

vi.mock('@cio/db/queries/auth', () => ({
  getProfileById: mocks.getProfileById
}));

vi.mock('@cio/db/queries/learning-path', () => ({
  getLearningPathById: mocks.getLearningPathById,
  getLearningPathByPublicId: vi.fn(),
  getMemberByPathAndProfile: mocks.getMemberByPathAndProfile,
  enrollMember: mocks.enrollMember,
  listLearningPathCourses: mocks.listLearningPathCourses,
  initializeMemberCourseProgress: mocks.initializeMemberCourseProgress,
  grantCourseAccess: mocks.grantCourseAccess,
  getCourseIdsByLearningPathId: vi.fn().mockResolvedValue([]),
  lockLearningPathStatusForAccept: vi.fn().mockResolvedValue({ id: 'lp-1', status: 'ACTIVE' }),
  getLearningPathOrgId: vi.fn().mockResolvedValue('org-1')
}));

vi.mock('@cio/db/queries/group', () => ({
  getCourseGroupIds: mocks.getCourseGroupIds,
  getGroupMemberIdByGroupAndProfile: mocks.getGroupMemberIdByGroupAndProfile,
  insertGroupMembersOnConflictDoNothing: mocks.insertGroupMembersOnConflictDoNothing
}));

vi.mock('@cio/db/queries/course/course', () => ({
  getCourseGroupIds: mocks.getCourseGroupIds
}));

vi.mock('@api/services/course/compliance', () => ({
  ensureComplianceEnrollmentRecordsForProfiles: mocks.ensureComplianceEnrollmentRecordsForProfiles
}));

vi.mock('@cio/core/utils/redis/org-stats-cache', () => ({
  invalidateOrgStats: mocks.invalidateOrgStats
}));

vi.mock('@api/services/organization/student-limit', () => ({
  assertStudentCapacityOrThrow: vi.fn().mockResolvedValue(null)
}));

import { ROLE } from '@cio/utils/constants';
import { sendLearningPathWelcomeEmail } from '../email';
import { enrollInLearningPath } from '../enrollment';
import { addPathMembersService } from '../member-management';
import { INVITE_LINK_HANDLERS } from '@api/services/invite-link/handlers';

const PATH_UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('welcome-email services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.enqueueTransactionalEmail.mockResolvedValue(undefined);
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) =>
      callback(transactionClient)
    );
  });

  describe('sendLearningPathWelcomeEmail', () => {
    it('enqueues transactional email with correct fields and custom message', async () => {
      await sendLearningPathWelcomeEmail({
        organization: { id: 'org-1', name: 'Acme Academy', siteName: 'acme' },
        learningPath: {
          id: PATH_UUID,
          name: 'Web Dev Mastery',
          welcomeEmailMessage: '<p>Welcome to web dev!</p>'
        },
        profileId: 'profile-1',
        email: 'student@example.com'
      });

      expect(mocks.enqueueTransactionalEmail).toHaveBeenCalledWith(
        'studentLearningPathWelcome',
        expect.objectContaining({
          to: 'student@example.com',
          fields: expect.objectContaining({
            orgName: 'Acme Academy',
            learningPathName: 'Web Dev Mastery',
            customMessage: '<p>Welcome to web dev!</p>'
          }),
          idempotencyKey: `learning-path-welcome:${PATH_UUID}:profile-1`,
          preference: { organizationId: 'org-1', recipientProfileId: 'profile-1' }
        })
      );
    });

    it('swallows errors without throwing', async () => {
      mocks.enqueueTransactionalEmail.mockRejectedValue(new Error('Redis connection failed'));

      await expect(
        sendLearningPathWelcomeEmail({
          organization: { id: 'org-1', name: 'Acme' },
          learningPath: { id: PATH_UUID, name: 'Path 1' },
          profileId: 'profile-1',
          email: 'student@example.com'
        })
      ).resolves.toBe(false);
    });
  });

  describe('enrollInLearningPath self-enrollment email', () => {
    const mockPath = {
      id: PATH_UUID,
      organizationId: 'org-1',
      name: 'Frontend Path',
      isPublished: true,
      selfEnrollment: true,
      sequentialUnlock: false,
      autoEnroll: false,
      welcomeEmailMessage: 'Welcome to frontend!'
    };

    const mockOrg = {
      id: 'org-1',
      name: 'Acme Academy',
      siteName: 'acme'
    };

    it('sends welcome email to fresh student on self-enrollment', async () => {
      mocks.getLearningPathById.mockResolvedValue(mockPath);
      mocks.getOrganizationById.mockResolvedValue(mockOrg);
      mocks.getMemberByPathAndProfile.mockResolvedValue(null);
      mocks.enrollMember.mockResolvedValue({ id: 'm-1', roleId: ROLE.STUDENT });
      mocks.listLearningPathCourses.mockResolvedValue([]);
      mocks.getProfileById.mockResolvedValue({ id: 'p-1', email: 'learner@example.com' });

      await enrollInLearningPath(PATH_UUID, 'p-1');

      expect(mocks.enqueueTransactionalEmail).toHaveBeenCalledWith(
        'studentLearningPathWelcome',
        expect.objectContaining({
          to: 'learner@example.com',
          fields: expect.objectContaining({
            learningPathName: 'Frontend Path',
            customMessage: 'Welcome to frontend!'
          }),
          idempotencyKey: `self-enroll-learning-path-welcome:${PATH_UUID}:p-1`
        })
      );
    });

    it('does not send welcome email if student was already a member (no double send)', async () => {
      mocks.getLearningPathById.mockResolvedValue(mockPath);
      mocks.getOrganizationById.mockResolvedValue(mockOrg);
      mocks.getMemberByPathAndProfile.mockResolvedValue({ id: 'existing-m-1', roleId: ROLE.STUDENT });
      mocks.enrollMember.mockResolvedValue({ id: 'existing-m-1', roleId: ROLE.STUDENT });
      mocks.listLearningPathCourses.mockResolvedValue([]);
      mocks.getProfileById.mockResolvedValue({ id: 'p-1', email: 'learner@example.com' });

      await enrollInLearningPath(PATH_UUID, 'p-1');

      expect(mocks.enqueueTransactionalEmail).not.toHaveBeenCalled();
    });
  });

  describe('addPathMembersService manual addition email', () => {
    const mockPath = {
      id: PATH_UUID,
      organizationId: 'org-1',
      name: 'Backend Path',
      isPublished: true,
      sequentialUnlock: false,
      autoEnroll: false,
      welcomeEmailMessage: null
    };

    const mockOrg = {
      id: 'org-1',
      name: 'Acme Academy',
      siteName: 'acme'
    };

    it('sends welcome email to newly added students', async () => {
      mocks.getLearningPathById.mockResolvedValue(mockPath);
      mocks.getOrganizationById.mockResolvedValue(mockOrg);
      mocks.getMemberByPathAndProfile.mockResolvedValue(null);
      mocks.enrollMember.mockResolvedValue({ id: 'm-1', roleId: ROLE.STUDENT });
      mocks.listLearningPathCourses.mockResolvedValue([]);

      await addPathMembersService(
        PATH_UUID,
        {
          members: [{ profileId: 'p-1', email: 'alice@example.com', roleId: ROLE.STUDENT }]
        },
        'admin-user',
        { 'org-1': ROLE.ADMIN }
      );

      expect(mocks.enqueueTransactionalEmail).toHaveBeenCalledWith(
        'studentLearningPathWelcome',
        expect.objectContaining({
          to: 'alice@example.com',
          fields: expect.objectContaining({
            learningPathName: 'Backend Path'
          }),
          idempotencyKey: `learning-path-members-welcome:${PATH_UUID}:p-1`
        })
      );
    });

    it('does not send welcome email to tutors or already existing members', async () => {
      mocks.getLearningPathById.mockResolvedValue(mockPath);
      mocks.getOrganizationById.mockResolvedValue(mockOrg);
      mocks.getMemberByPathAndProfile
        .mockResolvedValueOnce({ id: 'existing-m', roleId: ROLE.STUDENT }) // p-1 is existing
        .mockResolvedValueOnce(null); // p-2 is new tutor
      mocks.enrollMember.mockResolvedValue({ id: 'm-2', roleId: ROLE.TUTOR });
      mocks.listLearningPathCourses.mockResolvedValue([]);

      await addPathMembersService(
        PATH_UUID,
        {
          members: [
            { profileId: 'p-1', email: 'existing@example.com', roleId: ROLE.STUDENT },
            { profileId: 'p-2', email: 'tutor@example.com', roleId: ROLE.TUTOR }
          ]
        },
        'admin-user',
        { 'org-1': ROLE.ADMIN }
      );

      expect(mocks.enqueueTransactionalEmail).not.toHaveBeenCalled();
    });
  });

  describe('INVITE_LINK_HANDLERS course welcome email', () => {
    it('sends studentCourseWelcome on fresh join of course invite link', async () => {
      const courseHandler = INVITE_LINK_HANDLERS.COURSE;
      const mockContext = {
        invite: { id: 'inv-1', roleId: ROLE.STUDENT, resourceType: 'COURSE' },
        organization: { id: 'org-1', name: 'Acme Academy', siteName: 'acme' },
        course: {
          id: 'c-1',
          title: 'Algorithms 101',
          welcomeEmailMessage: 'Welcome to algos!'
        }
      };

      await courseHandler.afterCommit(mockContext as never, 'profile-1', 'learner@example.com', {
        isFreshJoin: true
      });

      expect(mocks.enqueueTransactionalEmail).toHaveBeenCalledWith(
        'studentCourseWelcome',
        expect.objectContaining({
          to: 'learner@example.com',
          fields: expect.objectContaining({
            courseName: 'Algorithms 101',
            customMessage: 'Welcome to algos!'
          }),
          idempotencyKey: 'invite-link-course-welcome:c-1:profile-1'
        })
      );
    });

    it('does not send course welcome email when isFreshJoin is false', async () => {
      const courseHandler = INVITE_LINK_HANDLERS.COURSE;
      const mockContext = {
        invite: { id: 'inv-1', roleId: ROLE.STUDENT, resourceType: 'COURSE' },
        organization: { id: 'org-1', name: 'Acme Academy', siteName: 'acme' },
        course: {
          id: 'c-1',
          title: 'Algorithms 101',
          welcomeEmailMessage: 'Welcome to algos!'
        }
      };

      await courseHandler.afterCommit(mockContext as never, 'profile-1', 'learner@example.com', {
        isFreshJoin: false
      });

      expect(mocks.enqueueTransactionalEmail).not.toHaveBeenCalled();
    });
  });
});
