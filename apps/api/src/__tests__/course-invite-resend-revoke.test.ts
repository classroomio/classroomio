import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/course', () => ({
  getCourseById: vi.fn(),
  getCourseWithOrgData: vi.fn(),
  getOrgIdByCourseId: vi.fn()
}));

vi.mock('@cio/db/queries/organization', () => ({
  getOrganizationMemberIdByOrgAndProfile: vi.fn(),
  listLiveStudentOrgInvitesForEmail: vi.fn(),
  selectOrganizationInviteWithOrgByInviteId: vi.fn()
}));

vi.mock('@cio/db/queries/course/invite', () => ({
  createCourseInvite: vi.fn(),
  createCourseInviteAudit: vi.fn(),
  getCourseInviteById: vi.fn(),
  revokeCourseInvite: vi.fn(),
  revokeLiveEmailBoundCourseInvitesForCourse: vi.fn()
}));

vi.mock('@cio/core/services/webhook/emit', () => ({
  emitCourseWebhookEvent: vi.fn(),
  emitCourseMemberAddedWebhookEvent: vi.fn(),
  buildMemberSource: vi.fn()
}));

vi.mock('@api/services/jobs', () => ({
  enqueueTransactionalEmail: vi.fn()
}));

vi.mock('@api/services/organization/audience', () => ({
  importAudienceMembers: vi.fn(),
  revokeAudienceInviteAccess: vi.fn()
}));

vi.mock('@cio/db/drizzle', async (importOriginal) => {
  const original = await importOriginal<typeof import('@cio/db/drizzle')>();

  return {
    ...original,
    db: { transaction: vi.fn() }
  };
});

import { getOrgIdByCourseId } from '@cio/db/queries/course';
import {
  listLiveStudentOrgInvitesForEmail,
  selectOrganizationInviteWithOrgByInviteId
} from '@cio/db/queries/organization';
import {
  createCourseInviteAudit,
  getCourseInviteById,
  revokeCourseInvite,
  revokeLiveEmailBoundCourseInvitesForCourse
} from '@cio/db/queries/course/invite';
import { db } from '@cio/db/drizzle';
import { importAudienceMembers, revokeAudienceInviteAccess } from '@api/services/organization/audience';
import { resendCourseInvitation, revokeStudentInvite } from '@api/services/course/invite';

const ORG_ID = 'org-1';
const COURSE_ID = 'course-1';
const ACTOR_ID = 'actor-1';
const EMAIL = 'pending@example.com';

function importRows(rows: Record<string, unknown>[]) {
  return {
    rows,
    emailsSent: 0,
    emailsFailed: 0,
    emailFailures: []
  } as never;
}

function orgInviteRow(overrides: Record<string, unknown> = {}, orgId = ORG_ID) {
  return {
    organization: { id: orgId },
    invite: {
      id: 'org-invite-1',
      email: EMAIL,
      roleId: 3,
      acceptedAt: null,
      isRevoked: false,
      metadata: { courseIds: [COURSE_ID, 'course-2'] },
      ...overrides
    }
  } as never;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getOrgIdByCourseId).mockResolvedValue(ORG_ID);
  vi.mocked(revokeLiveEmailBoundCourseInvitesForCourse).mockResolvedValue([]);
  vi.mocked(createCourseInviteAudit).mockResolvedValue(undefined as never);
});

describe('resendCourseInvitation', () => {
  it('reissues the organization invite and retires older course invites for the email', async () => {
    vi.mocked(importAudienceMembers).mockResolvedValue(
      importRows([{ email: EMAIL, status: 'invite_resent', inviteId: 'org-invite-2' }])
    );
    vi.mocked(revokeLiveEmailBoundCourseInvitesForCourse).mockResolvedValue([{ id: 'legacy-invite' }] as never);

    const result = await resendCourseInvitation(COURSE_ID, ACTOR_ID, ' Pending@Example.com ', true);

    expect(importAudienceMembers).toHaveBeenCalledWith(
      ORG_ID,
      expect.objectContaining({ recipients: [{ email: EMAIL }], courseIds: [COURSE_ID], sendEmail: true }),
      ACTOR_ID,
      'dashboard',
      { reissue: 'always', includeInviteLinks: undefined, inviteSource: 'COURSE_RESEND' }
    );
    expect(revokeLiveEmailBoundCourseInvitesForCourse).toHaveBeenCalledWith(COURSE_ID, EMAIL, ACTOR_ID, 'org-invite-2');
    expect(createCourseInviteAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        inviteId: 'legacy-invite',
        eventType: 'REVOKED',
        metadata: { reason: 'superseded', supersededBy: 'org-invite-2' }
      })
    );
    expect(result).toEqual({
      email: EMAIL,
      status: 'invited',
      inviteId: 'org-invite-2',
      inviteKind: 'organization',
      inviteLink: null
    });
  });

  it('enrolls a joined student who is not yet in the course and retires nothing', async () => {
    vi.mocked(importAudienceMembers).mockResolvedValue(
      importRows([{ email: EMAIL, status: 'already_member', enrollment: 'enrolled' }])
    );

    const result = await resendCourseInvitation(COURSE_ID, ACTOR_ID, EMAIL, true);

    expect(result.status).toBe('enrolled');
    expect(revokeLiveEmailBoundCourseInvitesForCourse).not.toHaveBeenCalled();
  });

  it.each([
    ['already_member', { enrollment: 'already_enrolled' }, 409, 'COURSE_MEMBER_EXISTS'],
    ['is_staff', {}, 409, 'STAFF_CANNOT_ENROLL'],
    ['archived', {}, 409, 'ORG_MEMBER_ARCHIVED'],
    ['over_seat_limit', {}, 403, 'UPGRADE_REQUIRED'],
    ['invalid_email', {}, 400, 'VALIDATION_ERROR']
  ])('refuses a %s recipient', async (status, extra, statusCode, code) => {
    vi.mocked(importAudienceMembers).mockResolvedValue(importRows([{ email: EMAIL, status, ...extra }]));

    await expect(resendCourseInvitation(COURSE_ID, ACTOR_ID, EMAIL, true)).rejects.toMatchObject({
      statusCode,
      code
    });
    expect(revokeLiveEmailBoundCourseInvitesForCourse).not.toHaveBeenCalled();
  });

  it('refuses an empty email without inviting', async () => {
    await expect(resendCourseInvitation(COURSE_ID, ACTOR_ID, '   ', true)).rejects.toMatchObject({ statusCode: 400 });
    expect(importAudienceMembers).not.toHaveBeenCalled();
  });

  it('404s for an unknown course', async () => {
    vi.mocked(getOrgIdByCourseId).mockResolvedValue(null as never);

    await expect(resendCourseInvitation('missing-course', ACTOR_ID, 'a@x.com', true)).rejects.toMatchObject({
      statusCode: 404
    });
  });
});

describe('revokeStudentInvite with an organization invite id', () => {
  beforeEach(() => {
    vi.mocked(getCourseInviteById).mockResolvedValue(null as never);
    vi.mocked(revokeAudienceInviteAccess).mockResolvedValue({
      revoked: true,
      inviteRevoked: false,
      inviteId: 'org-invite-2'
    });
  });

  it('removes the course from the live organization invite', async () => {
    vi.mocked(selectOrganizationInviteWithOrgByInviteId).mockResolvedValue(orgInviteRow());
    vi.mocked(listLiveStudentOrgInvitesForEmail).mockResolvedValue([
      { id: 'org-invite-1', metadata: { courseIds: [COURSE_ID, 'course-2'] } }
    ] as never);

    const result = await revokeStudentInvite(COURSE_ID, 'org-invite-1', ACTOR_ID);

    expect(selectOrganizationInviteWithOrgByInviteId).toHaveBeenCalledWith(db, 'org-invite-1');
    expect(listLiveStudentOrgInvitesForEmail).toHaveBeenCalledWith(ORG_ID, EMAIL);
    expect(revokeAudienceInviteAccess).toHaveBeenCalledWith(ORG_ID, { email: EMAIL, courseId: COURSE_ID }, ACTOR_ID);
    expect(revokeCourseInvite).not.toHaveBeenCalled();
    expect(result).toEqual({ id: 'org-invite-1', status: 'REVOKED', isRevoked: true });
  });

  it('follows a replaced invite id to the live successor that still carries the course', async () => {
    vi.mocked(selectOrganizationInviteWithOrgByInviteId).mockResolvedValue(
      orgInviteRow({ isRevoked: true, metadata: { courseIds: [COURSE_ID], supersededBy: 'org-invite-2' } })
    );
    vi.mocked(listLiveStudentOrgInvitesForEmail).mockResolvedValue([
      { id: 'org-invite-2', metadata: { courseIds: [COURSE_ID, 'course-3'] } }
    ] as never);

    const result = await revokeStudentInvite(COURSE_ID, 'org-invite-1', ACTOR_ID);

    expect(revokeAudienceInviteAccess).toHaveBeenCalledWith(ORG_ID, { email: EMAIL, courseId: COURSE_ID }, ACTOR_ID);
    expect(result).toEqual({ id: 'org-invite-1', status: 'REVOKED', isRevoked: true });
  });

  it('reports revoked without touching anything when no live invite carries the course', async () => {
    vi.mocked(selectOrganizationInviteWithOrgByInviteId).mockResolvedValue(orgInviteRow({ isRevoked: true }));
    vi.mocked(listLiveStudentOrgInvitesForEmail).mockResolvedValue([
      { id: 'org-invite-3', metadata: { courseIds: ['course-2'] } }
    ] as never);

    const result = await revokeStudentInvite(COURSE_ID, 'org-invite-1', ACTOR_ID);

    expect(revokeAudienceInviteAccess).not.toHaveBeenCalled();
    expect(result).toEqual({ id: 'org-invite-1', status: 'REVOKED', isRevoked: true });
  });

  it('refuses an accepted invite with 409', async () => {
    vi.mocked(selectOrganizationInviteWithOrgByInviteId).mockResolvedValue(
      orgInviteRow({ acceptedAt: '2026-01-02T00:00:00.000Z' })
    );

    await expect(revokeStudentInvite(COURSE_ID, 'org-invite-1', ACTOR_ID)).rejects.toMatchObject({
      statusCode: 409,
      code: 'CONFLICT'
    });
    expect(listLiveStudentOrgInvitesForEmail).not.toHaveBeenCalled();
    expect(revokeAudienceInviteAccess).not.toHaveBeenCalled();
  });

  it.each([
    ['another organization', orgInviteRow({}, 'org-2')],
    ['a staff invite', orgInviteRow({ roleId: 2 })],
    ['an invite without this course', orgInviteRow({ metadata: { courseIds: ['course-2'] } })],
    ['an unknown id', null]
  ])('404s for %s', async (_label, row) => {
    vi.mocked(selectOrganizationInviteWithOrgByInviteId).mockResolvedValue(row as never);

    await expect(revokeStudentInvite(COURSE_ID, 'org-invite-1', ACTOR_ID)).rejects.toMatchObject({ statusCode: 404 });
    expect(revokeAudienceInviteAccess).not.toHaveBeenCalled();
  });

  it('still revokes a legacy course invite by its own id', async () => {
    vi.mocked(getCourseInviteById).mockResolvedValue({ id: 'course-invite-1', isRevoked: false } as never);
    vi.mocked(revokeCourseInvite).mockResolvedValue({
      id: 'course-invite-1',
      isRevoked: true,
      usedCount: 0,
      maxUses: 1,
      expiresAt: '2099-01-01T00:00:00.000Z'
    } as never);

    const result = await revokeStudentInvite(COURSE_ID, 'course-invite-1', ACTOR_ID);

    expect(selectOrganizationInviteWithOrgByInviteId).not.toHaveBeenCalled();
    expect(result).toMatchObject({ id: 'course-invite-1', isRevoked: true });
  });
});
