import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/course/invite', () => ({
  createCourseInvite: vi.fn(),
  createCourseInviteAudit: vi.fn()
}));

vi.mock('@cio/db/queries/course', () => ({
  getCourseById: vi.fn(),
  getCourseWithOrgData: vi.fn()
}));

vi.mock('@api/services/jobs', () => ({
  enqueueTransactionalEmail: vi.fn()
}));

import { createCourseInvite, createCourseInviteAudit } from '@cio/db/queries/course/invite';
import { getCourseById, getCourseWithOrgData } from '@cio/db/queries/course';
import { enqueueTransactionalEmail } from '@api/services/jobs';
import { createStudentInvite } from '@api/services/course/invite';

const COURSE_ID = '11111111-1111-4111-8111-111111111111';
const ACTOR_ID = 'actor-1';

const baseInvite = {
  preset: 'MULTI_USE_30D' as const,
  sendEmail: false
};

let inviteCounter = 0;

describe('createStudentInvite (course invite onboarding)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    inviteCounter = 0;
    vi.mocked(getCourseById).mockResolvedValue([{ id: COURSE_ID, title: 'Course', slug: 'course' }] as never);
    vi.mocked(getCourseWithOrgData).mockResolvedValue({
      orgId: 'org-1',
      orgName: 'Org',
      orgSiteName: 'org',
      courseTitle: 'Course'
    } as never);
    vi.mocked(createCourseInvite).mockImplementation(async (values) => {
      inviteCounter += 1;
      return {
        ...values,
        id: `invite-${inviteCounter}`,
        createdAt: '2026-01-01T00:00:00.000Z'
      } as never;
    });
    vi.mocked(createCourseInviteAudit).mockResolvedValue(undefined as never);
    vi.mocked(enqueueTransactionalEmail).mockResolvedValue(undefined as never);
  });

  it('invites an email with no account yet, bound to that email, without looking anyone up', async () => {
    const result = await createStudentInvite(COURSE_ID, ACTOR_ID, {
      ...baseInvite,
      recipientEmails: ['New.Person@Example.com']
    });

    expect(result.mode).toBe('bulk');
    expect(result.invites).toHaveLength(1);
    expect(result.invites[0]).toMatchObject({ allowedEmails: ['new.person@example.com'], maxUses: 1 });
    expect(createCourseInvite).toHaveBeenCalledWith(expect.objectContaining({ createdByProfileId: ACTOR_ID }));
  });

  it('skips repeated recipients within one request instead of creating a second invite', async () => {
    const result = await createStudentInvite(COURSE_ID, ACTOR_ID, {
      ...baseInvite,
      recipientEmails: ['a@example.com', 'A@example.com'],
      recipientCsv: 'a@example.com, b@example.com'
    });

    expect(result.invites.map((invite) => invite.allowedEmails)).toEqual([['a@example.com'], ['b@example.com']]);
    expect(result.duplicatesSkipped).toEqual(['a@example.com', 'a@example.com']);
    expect(createCourseInvite).toHaveBeenCalledTimes(2);
  });

  it('does not send email when sendEmail is false', async () => {
    const result = await createStudentInvite(COURSE_ID, ACTOR_ID, {
      ...baseInvite,
      recipientEmails: ['a@example.com']
    });

    expect(enqueueTransactionalEmail).not.toHaveBeenCalled();
    expect(result.delivery).toMatchObject({ requested: 1, sent: 0, failures: [] });
  });

  it('sends one invite email per recipient when sendEmail is true', async () => {
    const result = await createStudentInvite(COURSE_ID, ACTOR_ID, {
      ...baseInvite,
      sendEmail: true,
      recipientEmails: ['a@example.com', 'b@example.com']
    });

    expect(enqueueTransactionalEmail).toHaveBeenCalledTimes(2);
    expect(enqueueTransactionalEmail).toHaveBeenCalledWith(
      'studentCourseInvite',
      expect.objectContaining({ to: 'a@example.com' })
    );
    expect(result.delivery).toMatchObject({ requested: 2, sent: 2, failed: 0 });
  });

  it('reports a failed send per recipient without failing the whole request', async () => {
    vi.mocked(enqueueTransactionalEmail).mockRejectedValueOnce(new Error('queue down'));

    const result = await createStudentInvite(COURSE_ID, ACTOR_ID, {
      ...baseInvite,
      sendEmail: true,
      recipientEmails: ['a@example.com', 'b@example.com']
    });

    expect(result.invites).toHaveLength(2);
    expect(result.delivery).toMatchObject({
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
    expect(createCourseInvite).not.toHaveBeenCalled();
  });
});
