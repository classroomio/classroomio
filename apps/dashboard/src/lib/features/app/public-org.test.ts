import { describe, expect, it } from 'vitest';

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
        language: { locale: 'tr', enforced: true },
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
      studentHomePath: null,
      studentHomeCourseId: null,
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
      settings: {
        signup: { inviteOnly: true },
        language: { locale: 'tr', enforced: true }
      },
      customization: { auth: { backgroundImage: 'https://example.com/auth.png' } },
      plans: [{ planName: 'ENTERPRISE', isActive: true }],
      hasStudentHome: false
    });
  });

  it('marks orgs with a stored destination as having a student home', () => {
    const accountOrg = {
      id: 'org-1',
      studentHomePath: '/lms/mylearning',
      studentHomeCourseId: null,
      settings: {},
      customization: {},
      plans: []
    } as unknown as AccountOrg;

    expect(toPublicOrg(accountOrg).hasStudentHome).toBe(true);

    const courseHome = {
      ...accountOrg,
      studentHomePath: null,
      studentHomeCourseId: 'course-1'
    } as unknown as AccountOrg;

    expect(toPublicOrg(courseHome).hasStudentHome).toBe(true);
  });
});
