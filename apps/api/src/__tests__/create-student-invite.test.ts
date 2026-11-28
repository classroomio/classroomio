import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/course/invite', () => ({
  createCourseInvite: vi.fn(),
  createCourseInviteAudit: vi.fn(),
  getCourseInviteById: vi.fn(),
  revokeCourseInvite: vi.fn(),
  revokeLiveEmailBoundCourseInvitesForCourse: vi.fn().mockResolvedValue([])
}));

vi.mock('@cio/db/drizzle', async (importOriginal) => {
  const original = await importOriginal<typeof import('@cio/db/drizzle')>();

  return { ...original, db: { transaction: vi.fn() } };
});

vi.mock('@cio/db/queries/course', () => ({
  getCourseById: vi.fn(),
  getCourseWithOrgData: vi.fn(),
  getOrgIdByCourseId: vi.fn()
}));

vi.mock('@api/services/jobs', () => ({
  enqueueTransactionalEmail: vi.fn()
}));

vi.mock('@cio/core/services/webhook/emit', () => ({
  emitCourseWebhookEvent: vi.fn(),
  emitCourseMemberWebhookEvent: vi.fn(),
  emitCourseMemberAddedWebhookEvent: vi.fn(),
  buildMemberSource: vi.fn()
}));

vi.mock('@api/services/organization/audience', () => ({
  importAudienceMembers: vi.fn(),
  revokeAudienceInviteAccess: vi.fn()
}));

import { createCourseInvite, createCourseInviteAudit } from '@cio/db/queries/course/invite';
import { getCourseById, getCourseWithOrgData, getOrgIdByCourseId } from '@cio/db/queries/course';
import { enqueueTransactionalEmail } from '@api/services/jobs';
import { importAudienceMembers } from '@api/services/organization/audience';
import { createStudentInvite, inviteStudentsToCourseByEmail } from '@api/services/course/invite';

const COURSE_ID = '11111111-1111-4111-8111-111111111111';
const ORG_ID = 'org-1';
const ACTOR_ID = 'actor-1';

const baseInvite = {
  preset: 'MULTI_USE_30D' as const,
  sendEmail: false
};

type TImportRow = {
  email: string;
  status: string;
  enrollment?: 'enrolled' | 'already_enrolled';
  inviteId?: string;
  inviteLink?: string;
};

function importResult(rows: TImportRow[], delivery: { sent?: number; failed?: number } = {}) {
  return {
    imported: 0,
    enrolled: 0,
    emailsSent: delivery.sent ?? 0,
    emailsFailed: delivery.failed ?? 0,
    emailFailures: delivery.failed ? [{ email: rows[0].email, error: 'queue down' }] : [],
    rows,
    assigned: 0,
    alreadyEnrolledInCourses: 0,
    alreadyEnrolledInCohorts: 0,
    pendingInvitesRenewed: 0,
    truncated: 0
  } as never;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getOrgIdByCourseId).mockResolvedValue(ORG_ID);
  vi.mocked(getCourseById).mockResolvedValue([{ id: COURSE_ID, title: 'Course', slug: 'course' }] as never);
  vi.mocked(getCourseWithOrgData).mockResolvedValue({
    orgId: ORG_ID,
    orgName: 'Org',
    orgSiteName: 'org',
    courseTitle: 'Course'
  } as never);
  vi.mocked(createCourseInvite).mockImplementation(
    async (values) => ({ ...values, id: 'link-invite', createdAt: '2026-01-01T00:00:00.000Z' }) as never
  );
  vi.mocked(createCourseInviteAudit).mockResolvedValue(undefined as never);
});

describe('createStudentInvite with recipients (organization invites)', () => {
  it('invites every recipient through importAudienceMembers and creates no course invite rows', async () => {
    vi.mocked(importAudienceMembers).mockResolvedValue(
      importResult([
        { email: 'new.person@example.com', status: 'ready', inviteId: 'org-invite-1', inviteLink: 'https://x/1' }
      ])
    );

    const result = await createStudentInvite(COURSE_ID, ACTOR_ID, {
      ...baseInvite,
      recipientEmails: ['New.Person@Example.com']
    });

    expect(importAudienceMembers).toHaveBeenCalledWith(
      ORG_ID,
      {
        recipients: [{ email: 'new.person@example.com' }],
        courseIds: [COURSE_ID],
        allCourses: false,
        allCohorts: false,
        sendEmail: false
      },
      ACTOR_ID,
      'dashboard',
      { reissue: 'always', includeInviteLinks: true, inviteSource: 'COURSE_INVITE' }
    );
    expect(createCourseInvite).not.toHaveBeenCalled();
    expect(enqueueTransactionalEmail).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      mode: 'bulk',
      invites: [],
      inviteLink: null,
      recipients: [
        {
          email: 'new.person@example.com',
          status: 'invited',
          inviteId: 'org-invite-1',
          inviteKind: 'organization',
          inviteLink: 'https://x/1'
        }
      ]
    });
  });

  it('returns one status per recipient instead of failing the batch', async () => {
    vi.mocked(importAudienceMembers).mockResolvedValue(
      importResult([
        { email: 'a@example.com', status: 'ready', inviteId: 'i-a' },
        { email: 'b@example.com', status: 'invite_resent', inviteId: 'i-b' },
        { email: 'c@example.com', status: 'already_invited', inviteId: 'i-c' },
        { email: 'd@example.com', status: 'already_member', enrollment: 'enrolled' },
        { email: 'e@example.com', status: 'already_member', enrollment: 'already_enrolled' },
        { email: 'f@example.com', status: 'is_staff' },
        { email: 'g@example.com', status: 'archived' },
        { email: 'h@example.com', status: 'over_seat_limit' },
        { email: 'a@example.com', status: 'duplicate_in_file' },
        { email: 'z@example.com', status: 'something_new' }
      ])
    );

    const result = await createStudentInvite(COURSE_ID, ACTOR_ID, {
      ...baseInvite,
      recipientEmails: ['a@example.com', 'b@example.com']
    });

    expect(result.recipients.map((recipient) => [recipient.email, recipient.status, recipient.inviteKind])).toEqual([
      ['a@example.com', 'invited', 'organization'],
      ['b@example.com', 'invited', 'organization'],
      ['c@example.com', 'already_invited', 'organization'],
      ['d@example.com', 'enrolled', null],
      ['e@example.com', 'already_enrolled', null],
      ['f@example.com', 'is_staff', null],
      ['g@example.com', 'archived', null],
      ['h@example.com', 'over_seat_limit', null],
      ['a@example.com', 'duplicate', null],
      ['z@example.com', 'invalid_email', null]
    ]);
  });

  it('skips repeated recipients within one request before inviting', async () => {
    vi.mocked(importAudienceMembers).mockResolvedValue(importResult([]));

    const result = await createStudentInvite(COURSE_ID, ACTOR_ID, {
      ...baseInvite,
      recipientEmails: ['a@example.com', 'A@example.com'],
      recipientCsv: 'a@example.com, b@example.com'
    });

    const [, input] = vi.mocked(importAudienceMembers).mock.calls[0];
    expect((input as { recipients: unknown }).recipients).toEqual([
      { email: 'a@example.com' },
      { email: 'b@example.com' }
    ]);
    expect(result.duplicatesSkipped).toEqual(['a@example.com', 'a@example.com']);
  });

  it('reports delivery from the organization invite emails', async () => {
    vi.mocked(importAudienceMembers).mockResolvedValue(
      importResult(
        [
          { email: 'a@example.com', status: 'ready', inviteId: 'i-a' },
          { email: 'b@example.com', status: 'ready', inviteId: 'i-b' }
        ],
        { sent: 1, failed: 1 }
      )
    );

    const result = await createStudentInvite(COURSE_ID, ACTOR_ID, {
      ...baseInvite,
      sendEmail: true,
      recipientEmails: ['a@example.com', 'b@example.com']
    });

    expect(vi.mocked(importAudienceMembers).mock.calls[0][1]).toMatchObject({ sendEmail: true });
    expect(result.delivery).toEqual({
      requested: 2,
      sent: 1,
      failed: 1,
      failures: [{ email: 'a@example.com', error: 'queue down' }]
    });
  });

  it('rejects the request with 400 when a CSV recipient is not a valid email', async () => {
    await expect(
      createStudentInvite(COURSE_ID, ACTOR_ID, { ...baseInvite, recipientCsv: 'a@example.com, not-an-email' })
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(importAudienceMembers).not.toHaveBeenCalled();
  });
});

describe('createStudentInvite without recipients (share link)', () => {
  it('creates one shareable course invite link', async () => {
    const result = await createStudentInvite(COURSE_ID, ACTOR_ID, baseInvite);

    expect(importAudienceMembers).not.toHaveBeenCalled();
    expect(createCourseInvite).toHaveBeenCalledTimes(1);
    expect(result.mode).toBe('single');
    expect(result.invites).toHaveLength(1);
    expect(result.inviteLink).toContain('/course/course/enroll?invite_token=');
    expect(result.recipients).toEqual([]);
  });
});

describe('inviteStudentsToCourseByEmail', () => {
  it('404s when the course has no organization', async () => {
    vi.mocked(getOrgIdByCourseId).mockResolvedValue(null as never);

    await expect(
      inviteStudentsToCourseByEmail(COURSE_ID, ACTOR_ID, ['a@example.com'], {
        sendEmail: false,
        reissue: 'when-changed',
        inviteSource: 'API'
      })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('passes the source and reissue mode through', async () => {
    vi.mocked(importAudienceMembers).mockResolvedValue(importResult([]));

    await inviteStudentsToCourseByEmail(COURSE_ID, ACTOR_ID, ['a@example.com'], {
      sendEmail: true,
      reissue: 'when-changed',
      source: 'public_api',
      inviteSource: 'API_ENROLL'
    });

    expect(importAudienceMembers).toHaveBeenCalledWith(ORG_ID, expect.anything(), ACTOR_ID, 'public_api', {
      reissue: 'when-changed',
      includeInviteLinks: undefined,
      inviteSource: 'API_ENROLL'
    });
  });
});
