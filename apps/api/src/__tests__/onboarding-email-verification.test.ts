import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/email', () => ({
  buildEmailBranding: vi.fn(),
  buildEmailFromName: vi.fn(),
  sendEmail: vi.fn()
}));

vi.mock('../../../../packages/db/src/queries/auth/profile', () => ({ getProfileById: vi.fn() }));
vi.mock('../../../../packages/db/src/auth/resolve-verification-org', () => ({ resolveVerificationOrg: vi.fn() }));

import {
  sendWelcomeEmailAfterVerification,
  type WelcomeEmailDependencies
} from '../../../../packages/db/src/auth/email-verification';

const user = {
  id: 'user-1',
  email: 'teacher@example.com'
};

const enqueueEmailSendMock = vi.fn();
const getProfileByIdMock = vi.fn();
const dependencies: WelcomeEmailDependencies = {
  enqueueEmailSend: enqueueEmailSendMock,
  getProfileById: getProfileByIdMock
};

function createVerificationRequest(callbackUrl: string): Request {
  const verificationUrl = new URL('https://api.example.com/api/auth/verify-email');
  verificationUrl.searchParams.set('callbackURL', callbackUrl);

  return new Request(verificationUrl);
}

describe('sendWelcomeEmailAfterVerification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    enqueueEmailSendMock.mockResolvedValue('email-job-1');
    getProfileByIdMock.mockResolvedValue({ fullname: 'Ada Lovelace' });
  });

  it('queues the welcome email after an onboarding verification callback', async () => {
    const request = createVerificationRequest('https://app.example.com/org/acme?welcomePopup=true');

    await sendWelcomeEmailAfterVerification(user, request, dependencies);

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

  it('does not queue a welcome email for other verification flows', async () => {
    const request = createVerificationRequest('https://app.example.com/settings/profile');

    await sendWelcomeEmailAfterVerification(user, request, dependencies);

    expect(getProfileByIdMock).not.toHaveBeenCalled();
    expect(enqueueEmailSendMock).not.toHaveBeenCalled();
  });

  it('does not fail successful verification when the queue is unavailable', async () => {
    const request = createVerificationRequest('https://app.example.com/org/acme?welcomePopup=true');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    enqueueEmailSendMock.mockRejectedValue(new Error('Redis unavailable'));

    await expect(sendWelcomeEmailAfterVerification(user, request, dependencies)).resolves.toBeUndefined();
    expect(consoleError).toHaveBeenCalledWith('sendWelcomeEmailAfterVerification error:', expect.any(Error));

    consoleError.mockRestore();
  });
});
