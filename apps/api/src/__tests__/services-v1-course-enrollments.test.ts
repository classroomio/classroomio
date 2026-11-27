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
  getLiveStudentOrgInviteForEmail: vi.fn(),
  getOrganizationMembersByNormalizedEmails: vi.fn(),
  hasOrganizationInviteEmailBeenSent: vi.fn()
}));

vi.mock('@api/services/course/invite-rate-limit', () => ({
  reserveCourseInviteCreation: vi.fn()
}));

vi.mock('@api/services/course/invite', () => ({
  inviteStudentsToCourseByEmail: vi.fn()
}));

vi.mock('@api/services/v1/courses/members', () => ({
  addCourseMemberService: vi.fn()
}));

import { ROLE } from '@cio/utils/constants';
import { ErrorCodes } from '@cio/utils/constants/error-codes';
import { getCourseOrganizationId } from '@cio/db/queries/tag';
import { isCourseTeamMemberOrOrgAdmin } from '@cio/db/queries/group';
import { getCourseMemberIdByEmail } from '@cio/db/queries/course/people';
import {
  getLiveStudentOrgInviteForEmail,
  getOrganizationMembersByNormalizedEmails,
  hasOrganizationInviteEmailBeenSent
} from '@cio/db/queries/organization';
import { inviteStudentsToCourseByEmail } from '@api/services/course/invite';
import { reserveCourseInviteCreation } from '@api/services/course/invite-rate-limit';
import { AppError } from '@api/utils/errors';
import { addCourseMemberService } from '@api/services/v1/courses/members';
import type { TAutomationPrincipal } from '@api/utils/automation-principal';
import { enrollCourseStudentService } from '@api/services/v1/courses/enrollments';

const ORG_ID = '11111111-1111-4111-8111-111111111111';
const COURSE_ID = '22222222-2222-4222-8222-222222222222';
const ACTOR_ID = '33333333-3333-4333-8333-333333333333';
const MEMBER_ID = '44444444-4444-4444-8444-444444444444';
const INVITE_ID = '55555555-5555-4555-8555-555555555555';
const INVITE_LINK = 'https://acme.classroomio.com/invite/s/token';

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

function orgMember(overrides: Record<string, unknown>) {
  return {
    normalizedEmail: 'student@example.com',
    profileId: null,
    roleId: ROLE.STUDENT,
    status: 'ACTIVE',
    hasLapsedInvite: false,
    ...overrides
  } as never;
}

function inviteResult(status: string, options: { emailsFailed?: number; inviteId?: string | null } = {}) {
  const inviteId = options.inviteId === undefined ? INVITE_ID : options.inviteId;

  return {
    recipients: [
      {
        email: 'student@example.com',
        status,
        inviteId,
        inviteKind: inviteId ? 'organization' : null,
        inviteLink: inviteId ? INVITE_LINK : null
      }
    ],
    emailsSent: 0,
    emailsFailed: options.emailsFailed ?? 0,
    emailFailures: []
  } as never;
}

function enroll(sendEmail = true, email = 'student@example.com') {
  return enrollCourseStudentService(ORG_ID, ACTOR_ID, courseParam, { email, sendEmail }, principal);
}

describe('enrollCourseStudentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(reserveCourseInviteCreation).mockResolvedValue(releaseInviteBudget);
    vi.mocked(getCourseOrganizationId).mockResolvedValue(ORG_ID);
    vi.mocked(isCourseTeamMemberOrOrgAdmin).mockResolvedValue(true);
    vi.mocked(getCourseMemberIdByEmail).mockResolvedValue(null);
    vi.mocked(getOrganizationMembersByNormalizedEmails).mockResolvedValue([]);
    vi.mocked(getLiveStudentOrgInviteForEmail).mockResolvedValue(null);
    vi.mocked(hasOrganizationInviteEmailBeenSent).mockResolvedValue(true);
    vi.mocked(inviteStudentsToCourseByEmail).mockResolvedValue(inviteResult('invited'));
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
    it('already_enrolled: returns the existing member without inviting or re-adding', async () => {
      vi.mocked(getCourseMemberIdByEmail).mockResolvedValue(MEMBER_ID);

      const result = await enroll(true, 'Student@Example.com ');

      expect(result).toEqual({
        status: 'already_enrolled',
        memberId: MEMBER_ID,
        inviteId: null,
        inviteKind: null,
        inviteLink: null,
        email: 'student@example.com'
      });
      expect(addCourseMemberService).not.toHaveBeenCalled();
      expect(inviteStudentsToCourseByEmail).not.toHaveBeenCalled();
      expect(reserveCourseInviteCreation).not.toHaveBeenCalled();
    });

    it('enrolled: adds a student who already joined the organization directly', async () => {
      vi.mocked(getOrganizationMembersByNormalizedEmails).mockResolvedValue([orgMember({ profileId: 'profile-1' })]);
      vi.mocked(addCourseMemberService).mockResolvedValue({ id: MEMBER_ID } as never);

      const result = await enroll();

      expect(result).toEqual({
        status: 'enrolled',
        memberId: MEMBER_ID,
        inviteId: null,
        inviteKind: null,
        inviteLink: null,
        email: 'student@example.com'
      });
      expect(addCourseMemberService).toHaveBeenCalledWith(
        ORG_ID,
        ACTOR_ID,
        courseParam,
        { email: 'student@example.com', roleId: ROLE.STUDENT, sendEmail: true },
        'public_api',
        'key-1',
        'client-1'
      );
      expect(inviteStudentsToCourseByEmail).not.toHaveBeenCalled();
      expect(reserveCourseInviteCreation).not.toHaveBeenCalled();
    });

    it('invited: puts the course on an organization invite for an email that has not joined', async () => {
      const result = await enroll();

      expect(inviteStudentsToCourseByEmail).toHaveBeenCalledWith(COURSE_ID, ACTOR_ID, ['student@example.com'], {
        sendEmail: true,
        reissue: 'when-changed',
        includeInviteLinks: true,
        source: 'public_api',
        inviteSource: 'V1_ENROLLMENT'
      });
      expect(result).toEqual({
        status: 'invited',
        memberId: null,
        inviteId: INVITE_ID,
        inviteKind: 'organization',
        inviteLink: INVITE_LINK,
        email: 'student@example.com'
      });
      expect(releaseInviteBudget).not.toHaveBeenCalled();
    });

    it('invited: merges the course into a pending member invite', async () => {
      vi.mocked(getOrganizationMembersByNormalizedEmails).mockResolvedValue([orgMember({ profileId: null })]);

      const result = await enroll();

      expect(addCourseMemberService).not.toHaveBeenCalled();
      expect(inviteStudentsToCourseByEmail).toHaveBeenCalledTimes(1);
      expect(result).toMatchObject({ status: 'invited', inviteKind: 'organization', inviteId: INVITE_ID });
    });

    it('already_invited: a repeat changes nothing and gives the invite budget back', async () => {
      vi.mocked(inviteStudentsToCourseByEmail).mockResolvedValue(inviteResult('already_invited'));

      const result = await enroll();

      expect(hasOrganizationInviteEmailBeenSent).toHaveBeenCalledWith(INVITE_ID);
      expect(inviteStudentsToCourseByEmail).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        status: 'already_invited',
        memberId: null,
        inviteId: INVITE_ID,
        inviteKind: 'organization',
        inviteLink: INVITE_LINK,
        email: 'student@example.com'
      });
      expect(releaseInviteBudget).toHaveBeenCalledTimes(1);
    });

    it('already_invited: reissues and emails the invite when its email was never sent', async () => {
      vi.mocked(hasOrganizationInviteEmailBeenSent).mockResolvedValue(false);
      vi.mocked(inviteStudentsToCourseByEmail)
        .mockResolvedValueOnce(inviteResult('already_invited'))
        .mockResolvedValueOnce(inviteResult('invited', { inviteId: 'reissued-invite' }));

      const result = await enroll();

      expect(inviteStudentsToCourseByEmail).toHaveBeenNthCalledWith(
        2,
        COURSE_ID,
        ACTOR_ID,
        ['student@example.com'],
        expect.objectContaining({ sendEmail: true, reissue: 'always' })
      );
      expect(result).toMatchObject({ status: 'invited', inviteId: 'reissued-invite' });
      expect(releaseInviteBudget).not.toHaveBeenCalled();
    });

    it('already_invited without sendEmail: does not check or resend the email', async () => {
      vi.mocked(inviteStudentsToCourseByEmail).mockResolvedValue(inviteResult('already_invited'));

      const result = await enroll(false);

      expect(hasOrganizationInviteEmailBeenSent).not.toHaveBeenCalled();
      expect(inviteStudentsToCourseByEmail).toHaveBeenCalledTimes(1);
      expect(result.status).toBe('already_invited');
    });

    it('idempotency: a second call after enrolling reports already_enrolled', async () => {
      vi.mocked(getOrganizationMembersByNormalizedEmails).mockResolvedValue([orgMember({ profileId: 'profile-1' })]);
      vi.mocked(addCourseMemberService).mockResolvedValue({ id: MEMBER_ID } as never);

      const first = await enroll();
      vi.mocked(getCourseMemberIdByEmail).mockResolvedValue(MEMBER_ID);
      const second = await enroll();

      expect(first.status).toBe('enrolled');
      expect(second).toMatchObject({ status: 'already_enrolled', memberId: MEMBER_ID });
      expect(addCourseMemberService).toHaveBeenCalledTimes(1);
    });

    it('staff: refuses an admin or tutor email with 409 STAFF_CANNOT_ENROLL', async () => {
      vi.mocked(getOrganizationMembersByNormalizedEmails).mockResolvedValue([
        orgMember({ profileId: 'profile-tutor', roleId: ROLE.TUTOR })
      ]);

      await expect(enroll()).rejects.toMatchObject({ statusCode: 409, code: ErrorCodes.STAFF_CANNOT_ENROLL });
      expect(addCourseMemberService).not.toHaveBeenCalled();
      expect(inviteStudentsToCourseByEmail).not.toHaveBeenCalled();
    });

    it('archived: refuses an archived student before the existing-member shortcut', async () => {
      vi.mocked(getOrganizationMembersByNormalizedEmails).mockResolvedValue([
        orgMember({ profileId: 'profile-1', status: 'ARCHIVED' })
      ]);
      vi.mocked(getCourseMemberIdByEmail).mockResolvedValue(MEMBER_ID);

      await expect(enroll()).rejects.toMatchObject({ statusCode: 409, code: ErrorCodes.ORG_MEMBER_ARCHIVED });
      expect(getCourseMemberIdByEmail).not.toHaveBeenCalled();
      expect(addCourseMemberService).not.toHaveBeenCalled();
    });

    it.each([
      ['is_staff', 409, ErrorCodes.STAFF_CANNOT_ENROLL],
      ['archived', 409, ErrorCodes.ORG_MEMBER_ARCHIVED],
      ['over_seat_limit', 403, ErrorCodes.UPGRADE_REQUIRED],
      ['invalid_email', 500, ErrorCodes.INTERNAL_ERROR]
    ])('maps an invite row of %s to an error and gives the budget back', async (status, statusCode, code) => {
      vi.mocked(inviteStudentsToCourseByEmail).mockResolvedValue(inviteResult(status, { inviteId: null }));

      await expect(enroll()).rejects.toMatchObject({ statusCode, code });
      expect(releaseInviteBudget).toHaveBeenCalledTimes(1);
    });

    it.each(['enrolled', 'already_enrolled'])(
      'reports %s when the student joined between the membership check and the invite',
      async (status) => {
        vi.mocked(inviteStudentsToCourseByEmail).mockResolvedValue(inviteResult(status, { inviteId: null }));
        vi.mocked(getCourseMemberIdByEmail).mockResolvedValueOnce(null).mockResolvedValueOnce(MEMBER_ID);

        await expect(enroll()).resolves.toMatchObject({
          status,
          memberId: MEMBER_ID,
          inviteId: null,
          inviteKind: null,
          inviteLink: null
        });
        expect(releaseInviteBudget).toHaveBeenCalledTimes(1);
      }
    );
  });

  describe('invite budget', () => {
    it('refuses a fresh email with 429 once the budget is spent, inviting nobody', async () => {
      vi.mocked(reserveCourseInviteCreation).mockRejectedValue(
        new AppError('Too many invites', ErrorCodes.COURSE_INVITE_RATE_LIMIT_EXCEEDED, 429)
      );

      await expect(enroll()).rejects.toMatchObject({ statusCode: 429 });
      expect(inviteStudentsToCourseByEmail).not.toHaveBeenCalled();
    });

    it('answers a repeat for a course already on the invite even once the budget is spent', async () => {
      vi.mocked(getLiveStudentOrgInviteForEmail).mockResolvedValue({
        id: INVITE_ID,
        metadata: { courseIds: [courseParam.courseId] }
      } as never);
      vi.mocked(reserveCourseInviteCreation).mockRejectedValue(
        new AppError('Too many invites', ErrorCodes.COURSE_INVITE_RATE_LIMIT_EXCEEDED, 429)
      );
      vi.mocked(inviteStudentsToCourseByEmail).mockResolvedValue(inviteResult('already_invited'));

      const result = await enroll();

      expect(result.status).toBe('already_invited');
      expect(reserveCourseInviteCreation).not.toHaveBeenCalled();
    });

    it('spends the budget when the live invite does not carry this course yet', async () => {
      vi.mocked(getLiveStudentOrgInviteForEmail).mockResolvedValue({
        id: INVITE_ID,
        metadata: { courseIds: ['another-course'] }
      } as never);

      await enroll();

      expect(reserveCourseInviteCreation).toHaveBeenCalledTimes(1);
    });

    it('does not spend the budget on an existing organization student', async () => {
      vi.mocked(getOrganizationMembersByNormalizedEmails).mockResolvedValue([orgMember({ profileId: 'profile-1' })]);
      vi.mocked(addCourseMemberService).mockResolvedValue({ id: MEMBER_ID } as never);

      await enroll();

      expect(reserveCourseInviteCreation).not.toHaveBeenCalled();
    });

    it('gives the budget back when inviting throws', async () => {
      vi.mocked(inviteStudentsToCourseByEmail).mockRejectedValue(new Error('db down'));

      await expect(enroll()).rejects.toThrow('db down');
      expect(releaseInviteBudget).toHaveBeenCalledTimes(1);
    });

    it('fails with 500 and gives the budget back when the invitation email cannot be queued', async () => {
      vi.mocked(inviteStudentsToCourseByEmail).mockResolvedValue(inviteResult('invited', { emailsFailed: 1 }));

      await expect(enroll()).rejects.toMatchObject({ statusCode: 500, field: 'email' });
      expect(releaseInviteBudget).toHaveBeenCalledTimes(1);
    });

    it('ignores email failures when sendEmail is false', async () => {
      vi.mocked(inviteStudentsToCourseByEmail).mockResolvedValue(inviteResult('invited', { emailsFailed: 1 }));

      await expect(enroll(false)).resolves.toMatchObject({ status: 'invited' });
      expect(releaseInviteBudget).not.toHaveBeenCalled();
    });

    it('fails with 500 when no recipient row comes back', async () => {
      vi.mocked(inviteStudentsToCourseByEmail).mockResolvedValue({
        recipients: [],
        emailsSent: 0,
        emailsFailed: 0,
        emailFailures: []
      });

      await expect(enroll()).rejects.toMatchObject({ statusCode: 500 });
      expect(releaseInviteBudget).toHaveBeenCalledTimes(1);
    });
  });
});
