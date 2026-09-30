import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorCodes } from '@api/utils/errors';

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
  invalidateOrgStats: vi.fn().mockResolvedValue(undefined),
  trackServerEvent: vi.fn(),
  orgHasCertificatesEnabled: vi.fn().mockResolvedValue(true)
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
  createOrganizationMember: vi.fn(),
  getUserOrgRolesMap: vi.fn().mockResolvedValue({})
}));

vi.mock('@cio/db/queries/auth', () => ({
  getProfileById: mocks.getProfileById,
  getProfilesByEmails: vi.fn().mockResolvedValue([])
}));

vi.mock('@cio/db/queries/learning-path', () => ({
  getLearningPathById: mocks.getLearningPathById,
  getLearningPathByPublicId: vi.fn(),
  getMemberByPathAndProfile: mocks.getMemberByPathAndProfile,
  enrollMember: mocks.enrollMember,
  listLearningPathCourses: mocks.listLearningPathCourses,
  initializeMemberCourseProgress: mocks.initializeMemberCourseProgress,
  grantCourseAccess: mocks.grantCourseAccess,
  getCourseIdsInPath: vi.fn().mockResolvedValue([]),
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

vi.mock('@cio/analytics', () => ({
  trackServerEvent: mocks.trackServerEvent,
  SERVER_EVENTS: {
    ENROLLMENT_COMPLETED: 'enrollment_completed',
    COURSE_COMPLETED: 'course_completed',
    CERTIFICATE_ISSUED: 'certificate_issued'
  }
}));

vi.mock('@api/utils/plan-features', () => ({
  orgHasCertificatesEnabled: mocks.orgHasCertificatesEnabled
}));

import { ROLE } from '@cio/utils/constants';
import { buildLearningPathUrl, sendLearningPathInviteEmail, sendLearningPathWelcomeEmail } from '../email';
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
      expect(mocks.ensureComplianceEnrollmentRecordsForProfiles).toHaveBeenCalledWith([], ['p-1']);
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
      expect(mocks.ensureComplianceEnrollmentRecordsForProfiles).not.toHaveBeenCalled();
    });

    it('rejects self-enrollment into a paid path', async () => {
      mocks.getLearningPathById.mockResolvedValue({ ...mockPath, cost: 5000 });

      // Paid paths enroll through team invitation only, mirroring paid
      // courses. There is no payment-reference channel: self-enrollment
      // into a paid path is always rejected.
      await expect(enrollInLearningPath(PATH_UUID, 'p-1')).rejects.toMatchObject({
        code: ErrorCodes.VALIDATION_ERROR,
        statusCode: 400
      });

      expect(mocks.enrollMember).not.toHaveBeenCalled();
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

    it('skips welcome emails when sendEmail is false', async () => {
      mocks.getLearningPathById.mockResolvedValue(mockPath);
      mocks.getOrganizationById.mockResolvedValue(mockOrg);
      mocks.getMemberByPathAndProfile.mockResolvedValue(null);
      mocks.enrollMember.mockResolvedValue({ id: 'm-1', roleId: ROLE.STUDENT });
      mocks.listLearningPathCourses.mockResolvedValue([]);

      const enrolled = await addPathMembersService(
        PATH_UUID,
        {
          members: [{ profileId: 'p-1', email: 'alice@example.com', roleId: ROLE.STUDENT }],
          sendEmail: false
        },
        'admin-user',
        { 'org-1': ROLE.ADMIN }
      );

      expect(enrolled).toHaveLength(1);
      expect(mocks.enqueueTransactionalEmail).not.toHaveBeenCalled();
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

  describe('buildLearningPathUrl', () => {
    const organization = { id: 'org-1', name: 'Acme', siteName: 'acme' };

    it('links directly to the path hub when a publicId is present', () => {
      expect(buildLearningPathUrl(organization, { publicId: 'AbC123Xy' })).toContain('/paths/AbC123Xy');
    });

    it('falls back to the org root without a publicId', () => {
      const url = buildLearningPathUrl(organization, {});

      expect(url).not.toContain('/paths/');
    });
  });

  describe('sendLearningPathInviteEmail', () => {
    it('enqueues the path-scoped invite with the accept link', async () => {
      await sendLearningPathInviteEmail({
        organization: { id: 'org-1', name: 'Acme Academy', siteName: 'acme' },
        learningPath: { id: PATH_UUID, name: 'Backend Path' },
        email: 'new@example.com',
        inviteLink: 'https://acme.test/invite/token-1',
        expiresAt: 'Jan 1',
        idempotencyKey: 'learning-path-manual-invite:inv-1'
      });

      expect(mocks.enqueueTransactionalEmail).toHaveBeenCalledWith(
        'studentLearningPathInvite',
        expect.objectContaining({
          to: 'new@example.com',
          fields: expect.objectContaining({
            learningPathName: 'Backend Path',
            inviteLink: 'https://acme.test/invite/token-1'
          }),
          idempotencyKey: 'learning-path-manual-invite:inv-1'
        })
      );
    });
  });

  describe('learning path enrollment analytics', () => {
    const mockPath = {
      id: PATH_UUID,
      organizationId: 'org-1',
      name: 'Frontend Path',
      isPublished: true,
      selfEnrollment: true,
      sequentialUnlock: false,
      autoEnroll: false,
      cost: 0
    };

    const mockOrg = { id: 'org-1', name: 'Acme Academy', siteName: 'acme' };

    it('tracks enrollment_completed on fresh self-enrollment', async () => {
      mocks.getLearningPathById.mockResolvedValue(mockPath);
      mocks.getOrganizationById.mockResolvedValue(mockOrg);
      mocks.getMemberByPathAndProfile.mockResolvedValue(null);
      mocks.enrollMember.mockResolvedValue({ id: 'm-1', roleId: ROLE.STUDENT });
      mocks.listLearningPathCourses.mockResolvedValue([]);
      mocks.getProfileById.mockResolvedValue({ id: 'p-1', email: 'learner@example.com' });

      await enrollInLearningPath(PATH_UUID, 'p-1');

      expect(mocks.trackServerEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'enrollment_completed',
          orgId: 'org-1',
          userId: 'p-1'
        })
      );
    });

    it('does not track enrollment analytics for repeat self-enrollment', async () => {
      mocks.getLearningPathById.mockResolvedValue(mockPath);
      mocks.getOrganizationById.mockResolvedValue(mockOrg);
      mocks.getMemberByPathAndProfile.mockResolvedValue({ id: 'm-1', roleId: ROLE.STUDENT });
      mocks.enrollMember.mockResolvedValue({ id: 'm-1', roleId: ROLE.STUDENT });
      mocks.listLearningPathCourses.mockResolvedValue([]);
      mocks.getProfileById.mockResolvedValue({ id: 'p-1', email: 'learner@example.com' });

      await enrollInLearningPath(PATH_UUID, 'p-1');

      expect(mocks.trackServerEvent).not.toHaveBeenCalled();
    });

    it('tracks enrollment_completed on fresh invite-link join', async () => {
      const pathHandler = INVITE_LINK_HANDLERS.LEARNING_PATH;
      const mockContext = {
        invite: { id: 'inv-1', roleId: ROLE.STUDENT, resourceType: 'LEARNING_PATH' },
        organization: { id: 'org-1', name: 'Acme Academy', siteName: 'acme' },
        learningPath: { id: PATH_UUID, name: 'Backend Path', publicId: 'AbC123Xy' }
      };

      await pathHandler.afterCommit(mockContext as never, 'profile-1', 'learner@example.com', {
        isFreshJoin: true
      });

      expect(mocks.trackServerEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'enrollment_completed',
          orgId: 'org-1',
          userId: 'profile-1'
        })
      );
      expect(mocks.enqueueTransactionalEmail).toHaveBeenCalledWith(
        'studentLearningPathWelcome',
        expect.objectContaining({
          fields: expect.objectContaining({ loginUrl: expect.stringContaining('/paths/AbC123Xy') })
        })
      );
    });
  });
});
