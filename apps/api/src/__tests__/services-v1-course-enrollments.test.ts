import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/tag', () => ({
  getCourseOrganizationId: vi.fn()
}));

vi.mock('@cio/db/queries/group', () => ({
  isCourseTeamMemberOrOrgAdmin: vi.fn()
}));

vi.mock('@cio/db/queries/course/people', () => ({
  getCourseMemberIdByEmail: vi.fn()
}));

vi.mock('@cio/db/queries/organization', () => ({
  getOrganizationMembersByNormalizedEmails: vi.fn()
}));

vi.mock('@cio/db/queries/course/invite', () => ({
  findActiveCourseInviteIdForEmail: vi.fn(),
  revokeCourseInvite: vi.fn()
}));

vi.mock('@api/services/course/invite-rate-limit', () => ({
  reserveCourseInviteCreation: vi.fn()
}));

vi.mock('@api/services/course/invite', () => ({
  createEmailInviteAndSend: vi.fn(),
  resolveCourseInviteContext: vi.fn()
}));

vi.mock('@api/services/product-events', () => ({
  captureLearnerInvited: vi.fn()
}));

vi.mock('@api/services/v1/courses/members', () => ({
  addCourseMemberService: vi.fn()
}));

import { ROLE } from '@cio/utils/constants';
import { ErrorCodes } from '@cio/utils/constants/error-codes';
import { getCourseOrganizationId } from '@cio/db/queries/tag';
import { isCourseTeamMemberOrOrgAdmin } from '@cio/db/queries/group';
import { getCourseMemberIdByEmail } from '@cio/db/queries/course/people';
import { getOrganizationMembersByNormalizedEmails } from '@cio/db/queries/organization';
import { findActiveCourseInviteIdForEmail, revokeCourseInvite } from '@cio/db/queries/course/invite';
import { createEmailInviteAndSend, resolveCourseInviteContext } from '@api/services/course/invite';
import { reserveCourseInviteCreation } from '@api/services/course/invite-rate-limit';
import { AppError } from '@api/utils/errors';
import { captureLearnerInvited } from '@api/services/product-events';
import { addCourseMemberService } from '@api/services/v1/courses/members';
import type { TAutomationPrincipal } from '@api/utils/automation-principal';
import { enrollCourseStudentService } from '@api/services/v1/courses/enrollments';

const ORG_ID = '11111111-1111-4111-8111-111111111111';
const COURSE_ID = '22222222-2222-4222-8222-222222222222';
const ACTOR_ID = '33333333-3333-4333-8333-333333333333';
const MEMBER_ID = '44444444-4444-4444-8444-444444444444';
const INVITE_ID = '55555555-5555-4555-8555-555555555555';

const principal: TAutomationPrincipal = {
  automationKey: {
    id: 'key-1',
    organizationId: ORG_ID,
    createdByProfileId: ACTOR_ID,
    oauthConsentId: 'consent-1',
    type: 'zapier',
    label: 'Zapier',
    secretPrefix: 'cio_oa_',
    secretHash: 'hash',
    scopes: ['course:member:write'],
    lastUsedAt: null,
    expiresAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    revokedAt: null
  },
  oauthClientId: 'client-1'
};

const courseParam = { courseId: COURSE_ID };
const releaseInviteBudget = vi.fn();

describe('enrollCourseStudentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(findActiveCourseInviteIdForEmail).mockResolvedValue(null);
    vi.mocked(reserveCourseInviteCreation).mockResolvedValue(releaseInviteBudget);
    vi.mocked(getCourseOrganizationId).mockResolvedValue(ORG_ID);
    vi.mocked(isCourseTeamMemberOrOrgAdmin).mockResolvedValue(true);
    vi.mocked(getCourseMemberIdByEmail).mockResolvedValue(null);
    vi.mocked(getOrganizationMembersByNormalizedEmails).mockResolvedValue([]);
    vi.mocked(resolveCourseInviteContext).mockResolvedValue({
      organizationId: ORG_ID,
      orgName: 'Org',
      courseName: 'Course',
      courseSlug: 'course',
      org: { siteName: 'org', customDomain: null, isCustomDomainVerified: null },
      branding: {} as never
    });
    vi.mocked(createEmailInviteAndSend).mockResolvedValue({
      created: true,
      invite: { id: INVITE_ID } as never,
      inviteId: INVITE_ID,
      sent: true,
      error: null
    });
  });

  describe('permission and course validation guards', () => {
    it('throws 401 when actorId is null', async () => {
      await expect(
        enrollCourseStudentService(
          ORG_ID,
          null,
          courseParam,
          { email: 'student@example.com', sendEmail: true },
          principal
        )
      ).rejects.toMatchObject({
        statusCode: 401,
        code: ErrorCodes.UNAUTHORIZED
      });
    });

    it('throws 404 when the course does not belong to the organization', async () => {
      vi.mocked(getCourseOrganizationId).mockResolvedValue('different-org');

      await expect(
        enrollCourseStudentService(
          ORG_ID,
          ACTOR_ID,
          courseParam,
          { email: 'student@example.com', sendEmail: true },
          principal
        )
      ).rejects.toMatchObject({
        statusCode: 404,
        code: ErrorCodes.COURSE_NOT_FOUND
      });
    });

    it('throws 403 when the actor cannot manage course members', async () => {
      vi.mocked(isCourseTeamMemberOrOrgAdmin).mockResolvedValue(false);

      await expect(
        enrollCourseStudentService(
          ORG_ID,
          ACTOR_ID,
          courseParam,
          { email: 'student@example.com', sendEmail: true },
          principal
        )
      ).rejects.toMatchObject({
        statusCode: 403,
        code: ErrorCodes.FORBIDDEN
      });
    });
  });

  describe('enrollment outcomes', () => {
    it('outcome 1 (already_enrolled): returns existing member ID without inviting or re-adding', async () => {
      vi.mocked(getCourseMemberIdByEmail).mockResolvedValue(MEMBER_ID);

      const result = await enrollCourseStudentService(
        ORG_ID,
        ACTOR_ID,
        courseParam,
        { email: 'Student@Example.com ', sendEmail: true },
        principal
      );

      expect(result).toEqual({
        status: 'already_enrolled',
        memberId: MEMBER_ID,
        inviteId: null,
        email: 'student@example.com'
      });
      expect(addCourseMemberService).not.toHaveBeenCalled();
      expect(createEmailInviteAndSend).not.toHaveBeenCalled();
    });

    it('staff case: throws 409 STAFF_CANNOT_ENROLL when email belongs to an admin or tutor', async () => {
      vi.mocked(getOrganizationMembersByNormalizedEmails).mockResolvedValue([
        { normalizedEmail: 'tutor@example.com', profileId: 'profile-tutor', roleId: ROLE.TUTOR }
      ]);

      await expect(
        enrollCourseStudentService(
          ORG_ID,
          ACTOR_ID,
          courseParam,
          { email: 'tutor@example.com', sendEmail: true },
          principal
        )
      ).rejects.toMatchObject({
        statusCode: 409,
        code: ErrorCodes.STAFF_CANNOT_ENROLL
      });

      expect(addCourseMemberService).not.toHaveBeenCalled();
      expect(createEmailInviteAndSend).not.toHaveBeenCalled();
    });

    it('outcome 2 (enrolled): directly adds existing organization student', async () => {
      vi.mocked(getOrganizationMembersByNormalizedEmails).mockResolvedValue([
        { normalizedEmail: 'orgstudent@example.com', profileId: 'profile-student', roleId: ROLE.STUDENT }
      ]);
      vi.mocked(addCourseMemberService).mockResolvedValue({ id: MEMBER_ID } as never);

      const result = await enrollCourseStudentService(
        ORG_ID,
        ACTOR_ID,
        courseParam,
        { email: 'orgstudent@example.com', sendEmail: true },
        principal
      );

      expect(result).toEqual({
        status: 'enrolled',
        memberId: MEMBER_ID,
        inviteId: null,
        email: 'orgstudent@example.com'
      });
      expect(addCourseMemberService).toHaveBeenCalledWith(
        ORG_ID,
        ACTOR_ID,
        courseParam,
        { email: 'orgstudent@example.com', roleId: ROLE.STUDENT, sendEmail: true },
        'public_api',
        'key-1',
        'client-1'
      );
      expect(createEmailInviteAndSend).not.toHaveBeenCalled();
    });

    it('outcome 3 (already_invited): returns existing active course invite for email not yet in organization', async () => {
      vi.mocked(findActiveCourseInviteIdForEmail).mockResolvedValue(INVITE_ID);

      const result = await enrollCourseStudentService(
        ORG_ID,
        ACTOR_ID,
        courseParam,
        { email: 'newperson@example.com', sendEmail: true },
        principal
      );

      expect(result).toEqual({
        status: 'already_invited',
        memberId: null,
        inviteId: INVITE_ID,
        email: 'newperson@example.com'
      });
      expect(reserveCourseInviteCreation).not.toHaveBeenCalled();
      expect(createEmailInviteAndSend).not.toHaveBeenCalled();
      expect(captureLearnerInvited).not.toHaveBeenCalled();
      expect(addCourseMemberService).not.toHaveBeenCalled();
    });

    it('already_invited after a concurrent call created the invite: gives the invite budget back', async () => {
      vi.mocked(createEmailInviteAndSend).mockResolvedValue({
        created: false,
        invite: null,
        inviteId: INVITE_ID,
        sent: false,
        error: null
      });

      const result = await enrollCourseStudentService(
        ORG_ID,
        ACTOR_ID,
        courseParam,
        { email: 'newperson@example.com', sendEmail: true },
        principal
      );

      expect(result).toEqual({
        status: 'already_invited',
        memberId: null,
        inviteId: INVITE_ID,
        email: 'newperson@example.com'
      });
      expect(createEmailInviteAndSend).toHaveBeenCalledTimes(1);
      expect(releaseInviteBudget).toHaveBeenCalledTimes(1);
      expect(captureLearnerInvited).not.toHaveBeenCalled();
      expect(addCourseMemberService).not.toHaveBeenCalled();
    });

    it('outcome 4 (invited): creates single-use course invite when student has no active invite', async () => {
      const result = await enrollCourseStudentService(
        ORG_ID,
        ACTOR_ID,
        courseParam,
        { email: 'brandnew@example.com', sendEmail: false },
        principal
      );

      expect(result).toEqual({
        status: 'invited',
        memberId: null,
        inviteId: INVITE_ID,
        email: 'brandnew@example.com'
      });
      expect(createEmailInviteAndSend).toHaveBeenCalledWith(
        expect.objectContaining({
          courseId: COURSE_ID,
          createdByProfileId: ACTOR_ID,
          recipientEmail: 'brandnew@example.com',
          shouldSend: false,
          reuseActiveInvite: true
        })
      );
      expect(captureLearnerInvited).toHaveBeenCalledWith(
        expect.objectContaining({ inviteType: 'email', count: 1, courseId: COURSE_ID, source: 'public_api' })
      );
      expect(reserveCourseInviteCreation).toHaveBeenCalledWith(ACTOR_ID, COURSE_ID);
      expect(releaseInviteBudget).not.toHaveBeenCalled();
    });

    it('idempotency: successive calls return already_enrolled after enrolling', async () => {
      vi.mocked(getOrganizationMembersByNormalizedEmails).mockResolvedValue([
        { normalizedEmail: 'repeat@example.com', profileId: 'profile-repeat', roleId: ROLE.STUDENT }
      ]);
      vi.mocked(addCourseMemberService).mockResolvedValue({ id: MEMBER_ID } as never);

      const firstCall = await enrollCourseStudentService(
        ORG_ID,
        ACTOR_ID,
        courseParam,
        { email: 'repeat@example.com', sendEmail: true },
        principal
      );
      expect(firstCall.status).toBe('enrolled');

      vi.mocked(getCourseMemberIdByEmail).mockResolvedValue(MEMBER_ID);
      const secondCall = await enrollCourseStudentService(
        ORG_ID,
        ACTOR_ID,
        courseParam,
        { email: 'repeat@example.com', sendEmail: true },
        principal
      );
      expect(secondCall.status).toBe('already_enrolled');
      expect(secondCall.memberId).toBe(MEMBER_ID);
    });
  });

  describe('invite budget', () => {
    it('refuses a fresh email with 429 once the shared invite budget is spent, creating nothing', async () => {
      vi.mocked(reserveCourseInviteCreation).mockRejectedValue(
        new AppError(
          'Too many invite creation attempts. Please try again later.',
          ErrorCodes.COURSE_INVITE_RATE_LIMIT_EXCEEDED,
          429
        )
      );

      await expect(
        enrollCourseStudentService(
          ORG_ID,
          ACTOR_ID,
          courseParam,
          { email: 'brandnew@example.com', sendEmail: true },
          principal
        )
      ).rejects.toMatchObject({ statusCode: 429, code: ErrorCodes.COURSE_INVITE_RATE_LIMIT_EXCEEDED });

      expect(createEmailInviteAndSend).not.toHaveBeenCalled();
      expect(captureLearnerInvited).not.toHaveBeenCalled();
    });

    it('lets repeats through when the budget is spent, without counting them', async () => {
      vi.mocked(reserveCourseInviteCreation).mockRejectedValue(
        new AppError(
          'Too many invite creation attempts. Please try again later.',
          ErrorCodes.COURSE_INVITE_RATE_LIMIT_EXCEEDED,
          429
        )
      );
      vi.mocked(findActiveCourseInviteIdForEmail).mockResolvedValue(INVITE_ID);

      const invited = await enrollCourseStudentService(
        ORG_ID,
        ACTOR_ID,
        courseParam,
        { email: 'invited@example.com', sendEmail: true },
        principal
      );

      vi.mocked(getCourseMemberIdByEmail).mockResolvedValue(MEMBER_ID);
      const enrolled = await enrollCourseStudentService(
        ORG_ID,
        ACTOR_ID,
        courseParam,
        { email: 'enrolled@example.com', sendEmail: true },
        principal
      );

      expect(invited.status).toBe('already_invited');
      expect(enrolled.status).toBe('already_enrolled');
      expect(reserveCourseInviteCreation).not.toHaveBeenCalled();
    });

    it('does not count enrolling an existing organization student', async () => {
      vi.mocked(getOrganizationMembersByNormalizedEmails).mockResolvedValue([
        { normalizedEmail: 'orgstudent@example.com', profileId: 'profile-student', roleId: ROLE.STUDENT }
      ]);
      vi.mocked(addCourseMemberService).mockResolvedValue({ id: MEMBER_ID } as never);

      await enrollCourseStudentService(
        ORG_ID,
        ACTOR_ID,
        courseParam,
        { email: 'orgstudent@example.com', sendEmail: true },
        principal
      );

      expect(reserveCourseInviteCreation).not.toHaveBeenCalled();
    });

    it('resolves the invite context before reserving invite budget', async () => {
      vi.mocked(resolveCourseInviteContext).mockRejectedValueOnce(
        new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404)
      );

      await expect(
        enrollCourseStudentService(
          ORG_ID,
          ACTOR_ID,
          courseParam,
          { email: 'brandnew@example.com', sendEmail: true },
          principal
        )
      ).rejects.toMatchObject({ statusCode: 404 });

      expect(reserveCourseInviteCreation).not.toHaveBeenCalled();
      expect(releaseInviteBudget).not.toHaveBeenCalled();
      expect(createEmailInviteAndSend).not.toHaveBeenCalled();
    });

    it('gives the invite budget back when creating the invite throws', async () => {
      vi.mocked(createEmailInviteAndSend).mockRejectedValueOnce(new Error('db down'));

      await expect(
        enrollCourseStudentService(
          ORG_ID,
          ACTOR_ID,
          courseParam,
          { email: 'brandnew@example.com', sendEmail: true },
          principal
        )
      ).rejects.toThrow('db down');

      expect(releaseInviteBudget).toHaveBeenCalledTimes(1);
      expect(captureLearnerInvited).not.toHaveBeenCalled();
    });

    it('revokes the fresh invite and fails when the invitation email cannot be queued', async () => {
      vi.mocked(createEmailInviteAndSend).mockResolvedValueOnce({
        created: true,
        invite: { id: INVITE_ID } as never,
        inviteId: INVITE_ID,
        sent: false,
        error: 'smtp down'
      });

      await expect(
        enrollCourseStudentService(
          ORG_ID,
          ACTOR_ID,
          courseParam,
          { email: 'brandnew@example.com', sendEmail: true },
          principal
        )
      ).rejects.toMatchObject({ statusCode: 500, code: ErrorCodes.INTERNAL_ERROR });

      expect(revokeCourseInvite).toHaveBeenCalledWith(COURSE_ID, INVITE_ID, ACTOR_ID);
      expect(releaseInviteBudget).toHaveBeenCalledTimes(1);
      expect(captureLearnerInvited).not.toHaveBeenCalled();
    });
  });
});
