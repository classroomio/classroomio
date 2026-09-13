import { toPublicOrg } from './public-org';

import type { AccountOrg } from './types';

describe('toPublicOrg', () => {
  it('keeps only fields required by public organization pages', () => {
    const accountOrg = {
      id: 'org-1',
      name: 'Acme Academy',
      siteName: 'acme',
      avatarUrl: 'https://example.com/avatar.png',
      favicon: 'https://example.com/favicon.png',
      theme: 'blue',
      isRestricted: false,
      landingpage: { theme: 'bold' },
      customDomain: 'learn.acme.test',
      isCustomDomainVerified: true,
      disableSignup: false,
      disableSignupMessage: null,
      disableEmailPassword: false,
      disableGoogleAuth: false,
      settings: {
        signup: { inviteOnly: true },
        emailNotifications: { newStudent: true }
      },
      customization: {
        auth: { backgroundImage: 'https://example.com/auth.png' },
        dashboard: { bannerText: 'Private dashboard setting' }
      },
      plans: [
        {
          planName: 'ENTERPRISE',
          isActive: true,
          provider: 'polar',
          subscriptionId: 'subscription-secret',
          customerId: 'customer-secret'
        }
      ],
      aiTutorSettings: { escalation: { email: 'owner@example.com' } },
      createdAt: '2026-09-10T00:00:00.000Z',
      customCode: '<script>private()</script>',
      readOnlyUntil: null
    } as unknown as AccountOrg;

    expect(toPublicOrg(accountOrg)).toEqual({
      id: 'org-1',
      name: 'Acme Academy',
      siteName: 'acme',
      avatarUrl: 'https://example.com/avatar.png',
      favicon: 'https://example.com/favicon.png',
      theme: 'blue',
      isRestricted: false,
      landingpage: { theme: 'bold' },
      customDomain: 'learn.acme.test',
      isCustomDomainVerified: true,
      disableSignup: false,
      disableSignupMessage: null,
      disableEmailPassword: false,
      disableGoogleAuth: false,
      settings: { signup: { inviteOnly: true } },
      customization: { auth: { backgroundImage: 'https://example.com/auth.png' } },
      plans: [{ planName: 'ENTERPRISE', isActive: true }]
    });
  });
});
