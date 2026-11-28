import { beforeEach, describe, expect, it, vi } from 'vitest';

const bindingHandler = vi.fn(async () => ({ sideEffects: [] }));
const ssoConfigRows = vi.fn();

vi.mock('@db/drizzle', () => {
  const selectChain = {
    from: () => selectChain,
    leftJoin: () => selectChain,
    where: () => selectChain,
    limit: () => ssoConfigRows()
  };

  return {
    db: {
      select: () => selectChain,
      transaction: (run: (tx: unknown) => unknown) => run({})
    }
  };
});

vi.mock('@db/auth/invite-binding-handler', () => ({
  getInviteBindingHandler: () => bindingHandler
}));

vi.mock('@db/queries/auth', () => ({ markUserAndProfileEmailVerified: vi.fn(async () => undefined) }));
vi.mock('@db/queries/group', () => ({ enrollUsersInCourseGroups: vi.fn() }));
vi.mock('@db/queries/course', () => ({ getOrgCourseGroups: vi.fn() }));

import { markUserAndProfileEmailVerified } from '@db/queries/auth';
import { getSsoProviderIdFromContext, ssoProvisioningHook } from '@db/auth/hooks/sso-provisioning';

const ORG_ID = 'org-1';
const PROVIDER_ID = 'acme-okta';
const USER = { id: 'user-1', email: 'Learner@Acme.com' } as never;

describe('getSsoProviderIdFromContext', () => {
  it('reads the provider from an OIDC or SAML callback', () => {
    expect(
      getSsoProviderIdFromContext({ path: '/sso/callback/:providerId', params: { providerId: PROVIDER_ID } })
    ).toBe(PROVIDER_ID);
    expect(
      getSsoProviderIdFromContext({ path: '/sso/saml2/sp/acs/:providerId', params: { providerId: PROVIDER_ID } })
    ).toBe(PROVIDER_ID);
  });

  it('returns null for any other sign-up path', () => {
    expect(getSsoProviderIdFromContext({ path: '/sign-up/email', params: { providerId: PROVIDER_ID } })).toBeNull();
    expect(getSsoProviderIdFromContext({ path: '/sso/callback/:providerId', params: {} })).toBeNull();
    expect(getSsoProviderIdFromContext(null)).toBeNull();
  });
});

describe('ssoProvisioningHook identity proof', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ssoConfigRows.mockResolvedValue([
      { config: { organizationId: ORG_ID, betterAuthProviderId: PROVIDER_ID }, policy: null }
    ]);
  });

  it.each([
    ['a sign-in through the organization SSO provider', true, { emailVerified: false, ssoProviderId: PROVIDER_ID }],
    ['a verified email', true, { emailVerified: true, ssoProviderId: null }],
    ['an unverified password sign-up on the SSO domain', false, { emailVerified: false, ssoProviderId: null }],
    ['a sign-in through another provider', false, { emailVerified: false, ssoProviderId: 'other-idp' }]
  ])('treats %s as proven: %s', async (_label, proven, proof) => {
    await ssoProvisioningHook(USER, proof);

    expect(bindingHandler).toHaveBeenCalledTimes(1);
    expect(bindingHandler).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ orgId: ORG_ID, email: 'learner@acme.com', identityProven: proven })
    );
    if (proven) {
      expect(markUserAndProfileEmailVerified).toHaveBeenCalledWith('user-1');
    } else {
      expect(markUserAndProfileEmailVerified).not.toHaveBeenCalled();
    }
  });

  it('does nothing when the email domain has no active SSO config', async () => {
    ssoConfigRows.mockResolvedValue([]);

    await ssoProvisioningHook(USER, { emailVerified: true, ssoProviderId: PROVIDER_ID });

    expect(bindingHandler).not.toHaveBeenCalled();
  });
});
