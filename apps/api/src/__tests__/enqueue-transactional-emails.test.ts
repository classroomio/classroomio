import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  enqueueEmailSends: vi.fn(),
  isRedisConfigured: vi.fn(() => true),
  prime: vi.fn(),
  shouldSend: vi.fn(),
  getStudentEmailDeliveryLocale: vi.fn()
}));

vi.mock('@cio/jobs', () => ({
  enqueueEmailSend: vi.fn(),
  enqueueEmailSends: mocks.enqueueEmailSends,
  isRedisConfigured: mocks.isRedisConfigured
}));

vi.mock('@cio/db/queries/notifications', () => ({
  EmailPreferenceLookupCache: class {
    prime = mocks.prime;
    shouldSend = mocks.shouldSend;
  }
}));

vi.mock('@cio/core/services/email/localization', () => ({
  getStudentEmailDeliveryLocale: mocks.getStudentEmailDeliveryLocale
}));

vi.mock('@cio/core/utils/redis/redis', () => ({ logRedisUnavailableOnce: vi.fn() }));

import { enqueueTransactionalEmail, enqueueTransactionalEmails } from '@api/services/jobs/email-jobs';

const fields = { orgName: 'Acme', cohortName: 'Cohort A', loginUrl: 'https://acme.test' };

function welcome(profileId: string, overrides: Record<string, unknown> = {}) {
  return {
    to: `${profileId}@test.dev`,
    fields,
    idempotencyKey: `audience-cohort-welcome:cohort-1:${profileId}`,
    preference: { organizationId: 'org-1', recipientProfileId: profileId },
    ...overrides
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.isRedisConfigured.mockReturnValue(true);
  mocks.prime.mockResolvedValue(undefined);
  mocks.shouldSend.mockResolvedValue(true);
  mocks.getStudentEmailDeliveryLocale.mockResolvedValue('fr');
  mocks.enqueueEmailSends.mockImplementation(async (jobs: { idempotencyKey?: string }[]) =>
    jobs.map((job) => `job-${job.idempotencyKey}`)
  );
});

describe('enqueueTransactionalEmails', () => {
  it('queues every email in one bulk call, keeping each idempotency key', async () => {
    const outcomes = await enqueueTransactionalEmails('studentCohortWelcome', [welcome('p-1'), welcome('p-2')]);

    expect(mocks.enqueueEmailSends).toHaveBeenCalledTimes(1);
    expect(mocks.enqueueEmailSends.mock.calls[0][0]).toEqual([
      expect.objectContaining({
        idempotencyKey: 'audience-cohort-welcome:cohort-1:p-1',
        payload: expect.objectContaining({ to: 'p-1@test.dev', locale: 'fr', organizationId: 'org-1' })
      }),
      expect.objectContaining({ idempotencyKey: 'audience-cohort-welcome:cohort-1:p-2' })
    ]);
    expect(outcomes).toEqual([
      { ok: true, jobIds: ['job-audience-cohort-welcome:cohort-1:p-1'] },
      { ok: true, jobIds: ['job-audience-cohort-welcome:cohort-1:p-2'] }
    ]);
  });

  it('looks up the locale and preferences once per org, not once per email', async () => {
    await enqueueTransactionalEmails('studentCohortWelcome', [welcome('p-1'), welcome('p-2'), welcome('p-3')]);

    expect(mocks.getStudentEmailDeliveryLocale).toHaveBeenCalledTimes(1);
    expect(mocks.prime).toHaveBeenCalledTimes(1);
    expect(mocks.prime).toHaveBeenCalledWith({
      organizationId: 'org-1',
      profileIds: ['p-1', 'p-2', 'p-3'],
      emails: []
    });
  });

  it('counts an email the recipient opted out of as handled, without queueing it', async () => {
    mocks.shouldSend.mockImplementation(async ({ recipientProfileId }) => recipientProfileId !== 'p-2');

    const outcomes = await enqueueTransactionalEmails('studentCohortWelcome', [welcome('p-1'), welcome('p-2')]);

    expect(mocks.enqueueEmailSends.mock.calls[0][0]).toHaveLength(1);
    expect(outcomes[1]).toEqual({ ok: true, jobIds: [] });
  });

  it('fails only the email with invalid fields', async () => {
    const outcomes = await enqueueTransactionalEmails('studentCohortWelcome', [
      welcome('p-1', { fields: { orgName: 'Acme' } }),
      welcome('p-2')
    ]);

    expect(outcomes[0].ok).toBe(false);
    expect(outcomes[1].ok).toBe(true);
  });

  it('fails the emails whose org preferences could not be loaded', async () => {
    mocks.prime.mockRejectedValue(new Error('database unavailable'));

    const outcomes = await enqueueTransactionalEmails('studentCohortWelcome', [
      welcome('p-1'),
      welcome('p-2', { preference: undefined })
    ]);

    expect(outcomes[0]).toEqual({ ok: false, error: new Error('database unavailable') });
    expect(outcomes[1].ok).toBe(true);
  });

  it('fails the emails in a bulk add that Redis rejected', async () => {
    mocks.enqueueEmailSends.mockRejectedValue(new Error('queue down'));

    const outcomes = await enqueueTransactionalEmails('studentCohortWelcome', [welcome('p-1')]);

    expect(outcomes).toEqual([{ ok: false, error: new Error('queue down') }]);
  });

  it('keys each recipient separately when one email has several', async () => {
    await enqueueTransactionalEmails('studentCohortWelcome', [
      welcome('p-1', { to: ['a@test.dev', 'b@test.dev'], preference: undefined, idempotencyKey: 'base' })
    ]);

    expect(
      mocks.enqueueEmailSends.mock.calls[0][0].map((job: { idempotencyKey: string }) => job.idempotencyKey)
    ).toEqual(['base:a@test.dev', 'base:b@test.dev']);
  });

  it('queues nothing and reports success when Redis is not configured', async () => {
    mocks.isRedisConfigured.mockReturnValue(false);

    const outcomes = await enqueueTransactionalEmails('studentCohortWelcome', [welcome('p-1')]);

    expect(mocks.enqueueEmailSends).not.toHaveBeenCalled();
    expect(outcomes).toEqual([{ ok: true, jobIds: [] }]);
  });
});

describe('enqueueTransactionalEmail', () => {
  it('throws the error of its single email', async () => {
    mocks.enqueueEmailSends.mockRejectedValue(new Error('queue down'));

    await expect(enqueueTransactionalEmail('studentCohortWelcome', welcome('p-1'))).rejects.toThrow('queue down');
  });
});
