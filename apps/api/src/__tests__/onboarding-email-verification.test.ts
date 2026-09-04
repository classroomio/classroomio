import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/email', () => ({
  buildEmailBranding: vi.fn(),
  buildEmailFromName: vi.fn(),
  sendEmail: vi.fn()
}));

vi.mock('../../../../packages/db/src/queries/auth/profile', () => ({
  clearWelcomeEmailPending: vi.fn(),
  getProfileById: vi.fn(),
  markWelcomeEmailSent: vi.fn()
}));
vi.mock('../../../../packages/db/src/auth/resolve-verification-org', () => ({ resolveVerificationOrg: vi.fn() }));

import {
  sendChangeEmailConfirmation,
  sendWelcomeEmailAfterVerification,
  type WelcomeEmailDependencies
} from '../../../../packages/db/src/auth/email-verification';
import { clearWelcomeEmailPending } from '../../../../packages/db/src/queries/auth/profile';

const user = {
  id: 'user-1',
  email: 'teacher@example.com'
};

const enqueueEmailSendMock = vi.fn();
const getProfileByIdMock = vi.fn();
const dependencies: WelcomeEmailDependencies = {
  enqueueEmailSend: enqueueEmailSendMock,
  getProfileById: getProfileByIdMock,
  markWelcomeEmailSent: vi.fn()
};

describe('sendWelcomeEmailAfterVerification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    enqueueEmailSendMock.mockResolvedValue('email-job-1');
    getProfileByIdMock.mockResolvedValue({ fullname: 'Ada Lovelace' });
  });

  it('queues the welcome email for a pending onboarding account', async () => {
    getProfileByIdMock.mockResolvedValue({ fullname: 'Ada Lovelace', welcomeEmailPending: true });

    await sendWelcomeEmailAfterVerification(user, undefined, dependencies);

    expect(getProfileByIdMock).toHaveBeenCalledWith(user.id);
    expect(enqueueEmailSendMock).toHaveBeenCalledWith(
      {
        kind: 'template',
        template: 'welcome',
        to: user.email,
        fields: {
          name: 'Ada Lovelace'
        }
      },
      { idempotencyKey: `onboarding:welcome:${user.id}` }
    );
  });

  it('does not queue a welcome email when onboarding is not pending', async () => {
    await sendWelcomeEmailAfterVerification(user, undefined, dependencies);

    expect(getProfileByIdMock).toHaveBeenCalledWith(user.id);
    expect(enqueueEmailSendMock).not.toHaveBeenCalled();
  });

  it('does not fail successful verification when the queue is unavailable', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    getProfileByIdMock.mockResolvedValue({ fullname: 'Ada Lovelace', welcomeEmailPending: true });
    enqueueEmailSendMock.mockRejectedValue(new Error('Redis unavailable'));

    await expect(sendWelcomeEmailAfterVerification(user, undefined, dependencies)).resolves.toBeUndefined();
    expect(consoleError).toHaveBeenCalledWith('sendWelcomeEmailAfterVerification error:', expect.any(Error));

    consoleError.mockRestore();
  });

  it('clears onboarding state when an email change starts', async () => {
    await sendChangeEmailConfirmation({
      user: { id: user.id, email: user.email, name: 'Ada' },
      newEmail: 'new@example.com',
      url: 'https://app.example.com/verify'
    } as never);

    expect(clearWelcomeEmailPending).toHaveBeenCalledWith(user.id);
  });
});
