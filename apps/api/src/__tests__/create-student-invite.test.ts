import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/course/invite', () => ({
  createCourseInvite: vi.fn(),
  createCourseInviteAudit: vi.fn(),
  createEnrollmentInviteIfAbsent: vi.fn()
}));

vi.mock('@cio/db/queries/course', () => ({
  getCourseById: vi.fn(),
  getCourseWithOrgData: vi.fn()
}));

vi.mock('@api/services/jobs', () => ({
  enqueueTransactionalEmail: vi.fn()
}));

vi.mock('@cio/core/services/webhook/emit', () => ({
  emitCourseWebhookEvent: vi.fn(),
  emitCourseMemberWebhookEvent: vi.fn()
}));

import {
  createCourseInvite,
  createCourseInviteAudit,
  createEnrollmentInviteIfAbsent
} from '@cio/db/queries/course/invite';
import { getCourseById, getCourseWithOrgData } from '@cio/db/queries/course';
import { enqueueTransactionalEmail } from '@api/services/jobs';
import { createEmailInviteAndSend, createStudentInvite } from '@api/services/course/invite';

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

describe('createEmailInviteAndSend with reuseActiveInvite', () => {
  const inviteInput = {
    courseId: COURSE_ID,
    createdByProfileId: ACTOR_ID,
    recipientEmail: 'New.Person@Example.com',
    policy: { expiresAt: '2026-12-01T00:00:00.000Z', maxUses: 1 },
    orgName: 'Org',
    organizationId: 'org-1',
    courseName: 'Course',
    courseSlug: 'course',
    org: { siteName: 'org', customDomain: null, isCustomDomainVerified: null },
    branding: {} as never,
    shouldSend: true,
    reuseActiveInvite: true
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createCourseInviteAudit).mockResolvedValue(undefined as never);
    vi.mocked(enqueueTransactionalEmail).mockResolvedValue(undefined as never);
  });

  it('returns the invite already naming the email without creating or emailing another', async () => {
    vi.mocked(createEnrollmentInviteIfAbsent).mockResolvedValue({
      created: false,
      invite: null,
      existingInviteId: 'invite-existing'
    });

    const result = await createEmailInviteAndSend(inviteInput);

    expect(result).toEqual({ created: false, invite: null, inviteId: 'invite-existing', sent: false, error: null });
    expect(createCourseInvite).not.toHaveBeenCalled();
    expect(enqueueTransactionalEmail).not.toHaveBeenCalled();
    expect(createCourseInviteAudit).not.toHaveBeenCalled();
  });

  it('creates one invite and sends one email when no usable invite exists', async () => {
    vi.mocked(createEnrollmentInviteIfAbsent).mockResolvedValue({
      created: true,
      invite: {
        id: 'invite-new',
        courseId: COURSE_ID,
        roleId: 3,
        expiresAt: inviteInput.policy.expiresAt,
        maxUses: 1,
        usedCount: 0,
        allowedEmails: ['new.person@example.com'],
        allowedDomains: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        isRevoked: false
      } as never,
      existingInviteId: null
    });

    const result = await createEmailInviteAndSend(inviteInput);

    expect(createEnrollmentInviteIfAbsent).toHaveBeenCalledWith(
      COURSE_ID,
      'new.person@example.com',
      expect.objectContaining({
        allowedEmails: ['new.person@example.com'],
        maxUses: 1,
        expiresAt: inviteInput.policy.expiresAt,
        metadata: { source: 'DIRECT_EMAIL_INVITE' }
      })
    );
    expect(result).toMatchObject({ created: true, inviteId: 'invite-new', sent: true, error: null });
    expect(enqueueTransactionalEmail).toHaveBeenCalledTimes(1);
    expect(createCourseInviteAudit).toHaveBeenCalledWith(
      expect.objectContaining({ inviteId: 'invite-new', eventType: 'CREATED' })
    );
  });
});
